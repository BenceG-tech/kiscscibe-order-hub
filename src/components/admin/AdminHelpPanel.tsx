import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Sparkles as SparklesIcon,
  Map as MapIcon,
  UtensilsCrossed,
  Activity,
  Wallet,
  Megaphone,
  Settings as SettingsIcon,
  ChevronLeft,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  BookOpen,
  MapPin,
  Clock,
  ArrowRight,
  X,
  Sparkles,
  Wrench,
  Bell,
} from "lucide-react";
import {
  HELP_CATEGORIES,
  HELP_TABS,
  QUICK_MAP,
  ROUTINES,
  type HelpTopic,
  type HelpTabGroup,
} from "@/data/adminHelpContent";
import {
  CHANGELOG,
  isWithinDays,
  getUnseenCount,
  markChangelogViewed,
  type ChangelogEntry,
} from "@/data/adminChangelog";

interface AdminHelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const NEW_USER_KEY = "kiscsibe_help_seen_v1";

export const AdminHelpPanel = ({ open, onOpenChange }: AdminHelpPanelProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTab, setActiveTab] = useState<HelpTabGroup | "changelog">("overview");
  const [unseenCount, setUnseenCount] = useState(0);

  // Determine contextual tab from current route
  const contextualTab = useMemo<HelpTabGroup | null>(() => {
    for (const cat of HELP_CATEGORIES) {
      if (cat.topics.some((t) => t.routes?.some((r) => location.pathname.startsWith(r)))) {
        return cat.tabGroup;
      }
    }
    return null;
  }, [location.pathname]);

  useEffect(() => {
    if (open) {
      if (!localStorage.getItem(NEW_USER_KEY)) setShowWelcome(true);
      setUnseenCount(getUnseenCount(7));
      // Default tab: changelog if unseen, else contextual, else overview
      const unseen = getUnseenCount(7);
      if (unseen > 0) {
        setActiveTab("changelog");
      } else if (contextualTab) {
        setActiveTab(contextualTab);
      } else {
        setActiveTab("overview");
      }
    }
  }, [open, contextualTab]);

  const dismissWelcome = () => {
    localStorage.setItem(NEW_USER_KEY, "1");
    setShowWelcome(false);
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val as HelpTabGroup | "changelog");
    if (val === "changelog") {
      markChangelogViewed();
      setUnseenCount(0);
    }
  };

  const nq = norm(query.trim());

  const matches = (t: HelpTopic) => {
    if (!nq) return true;
    const hay = norm(
      `${t.title} ${t.whatItDoes} ${t.howToUse.join(" ")} ${t.whyItHelps} ${t.commonMistake ?? ""}`,
    );
    return hay.includes(nq);
  };

  const goTo = (route: string) => {
    navigate(route);
  };

  // Search across all tabs
  const searchResults = useMemo(() => {
    if (!nq) return null;
    return HELP_CATEGORIES.map((cat) => ({
      ...cat,
      topics: cat.topics.filter(matches),
    })).filter((c) => c.topics.length > 0);
  }, [nq]);

  const categoriesForTab = (tab: HelpTabGroup) =>
    HELP_CATEGORIES.filter((c) => c.tabGroup === tab);

  const recentEntries = CHANGELOG.filter((e) => isWithinDays(e.date, 7));
  const olderEntries = CHANGELOG.filter(
    (e) => !isWithinDays(e.date, 7) && isWithinDays(e.date, 30),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col bg-background/95 backdrop-blur-md border-l-2 border-primary/20"
        overlayClassName="bg-black/20"
      >
        <SheetHeader className="p-5 pb-3 border-b bg-card/80 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-6 w-6 text-primary" />
            Admin kézikönyv
          </SheetTitle>
          <SheetDescription className="text-sm">
            Kattints az oldal sötétített részére a bezáráshoz.
          </SheetDescription>
          <div className="relative mt-2">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Keresés (pl. kupon, allergén, kapacitás)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
        </SheetHeader>

        {/* Welcome banner — compact, above tabs */}
        {showWelcome && !nq && (
          <div className="mx-5 mt-3 relative bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/30 rounded-lg p-3 shrink-0">
            <button
              onClick={dismissWelcome}
              className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Bezár"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="text-sm font-bold mb-0.5">👋 Új admin vagy?</p>
            <p className="text-xs text-muted-foreground">
              Indíts a{" "}
              <button
                onClick={() => {
                  setActiveTab("overview");
                  dismissWelcome();
                }}
                className="text-primary font-semibold underline"
              >
                🎯 Áttekintés
              </button>{" "}
              tab-bal — 2 perc alatt átlátod.
            </p>
          </div>
        )}

        {/* Contextual hint */}
        {contextualTab && !nq && activeTab !== contextualTab && activeTab !== "changelog" && (
          <button
            onClick={() => setActiveTab(contextualTab)}
            className="mx-5 mt-3 flex items-center gap-2 bg-primary/10 hover:bg-primary/15 border border-primary/30 rounded-lg p-2.5 text-left shrink-0 transition-colors"
          >
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs flex-1">
              Most ezen az oldalon vagy — ugorj a kapcsolódó témákra
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </button>
        )}

        {/* Search mode: bypass tabs, show all matches */}
        {nq ? (
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-5">
              <div className="text-sm text-muted-foreground italic">
                Találatok a(z) „{query}" keresésre.
              </div>
              {searchResults?.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Nincs találat. Próbálj más kifejezést.
                </div>
              )}
              {searchResults?.map((cat) => (
                <div key={cat.id}>
                  <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    {cat.title}
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {cat.topics.length}
                    </Badge>
                  </h4>
                  <Accordion type="multiple" className="space-y-2">
                    {cat.topics.map((t) => (
                      <TopicAccordion key={`${cat.id}-${t.id}`} topic={t} />
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="px-5 pt-3 pb-8">
                {activeTab === "grid" ? (
                  /* Card grid navigator */
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-2.5">
                    {/* Mi változott? card */}
                    <button
                      onClick={() => handleTabChange("changelog")}
                      className="relative bg-card hover:bg-accent border-2 border-border hover:border-primary/40 rounded-xl p-3 text-left transition-all group"
                    >
                      {unseenCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow">
                          {unseenCount}
                        </span>
                      )}
                      <SparklesIcon className="h-6 w-6 text-primary mb-1.5" />
                      <div className="text-sm font-bold leading-tight">Mi változott?</div>
                      <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                        Friss frissítések, új funkciók
                      </div>
                    </button>

                    {HELP_TABS.map((tab) => {
                      const TabIcon = TAB_ICON_MAP[tab.id] ?? SettingsIcon;
                      const isHere = contextualTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`relative bg-card hover:bg-accent border-2 rounded-xl p-3 text-left transition-all group ${
                            isHere ? "border-primary/60 shadow-sm" : "border-border hover:border-primary/40"
                          }`}
                        >
                          {isHere && (
                            <span
                              className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse"
                              title="Itt vagy most"
                            />
                          )}
                          <TabIcon className={`h-6 w-6 mb-1.5 ${isHere ? "text-primary" : "text-foreground"}`} />
                          <div className="text-sm font-bold leading-tight">{tab.label}</div>
                          <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                            {TAB_DESC_MAP[tab.id]}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Back to grid */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("grid")}
                      className="gap-1.5 -ml-2 h-8 text-xs"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Vissza a menübe
                    </Button>

                    {/* Changelog */}
                    {activeTab === "changelog" && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Bell className="h-5 w-5 text-primary" />
                          <h3 className="text-base font-bold">Mi változott a rendszerben?</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Az utolsó frissítések — kattints egy bejegyzésre a részletes súgóhoz.
                        </p>

                        {recentEntries.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-foreground mb-2 mt-3">
                              🌟 Friss változások (utolsó 7 nap)
                            </h4>
                            <div className="space-y-2">
                              {recentEntries.map((e, i) => (
                                <ChangelogCard
                                  key={i}
                                  entry={e}
                                  isNew
                                  onJump={(tab) => {
                                    if (tab) setActiveTab(tab as HelpTabGroup);
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {olderEntries.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-muted-foreground mb-2 mt-4">
                              Korábbi frissítések
                            </h4>
                            <div className="space-y-2">
                              {olderEntries.map((e, i) => (
                                <ChangelogCard
                                  key={i}
                                  entry={e}
                                  onJump={(tab) => {
                                    if (tab) setActiveTab(tab as HelpTabGroup);
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Overview */}
                    {activeTab === "overview" && (
                      <div className="space-y-6">
                        <section>
                          <div className="flex items-center gap-2 mb-3">
                            <MapIcon className="h-5 w-5 text-primary" />
                            <h3 className="text-base font-bold">Mit hol találsz?</h3>
                          </div>
                          <div className="space-y-2">
                            {QUICK_MAP.map((entry) => (
                              <button
                                key={entry.route}
                                onClick={() => goTo(entry.route)}
                                className="w-full text-left bg-card hover:bg-accent border rounded-lg p-3 transition-colors group"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl shrink-0">{entry.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <span className="text-sm font-semibold">{entry.title}</span>
                                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {entry.description}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </section>

                        <section>
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-5 w-5 text-primary" />
                            <h3 className="text-base font-bold">Napi és heti rutin</h3>
                          </div>
                          <div className="space-y-3">
                            {ROUTINES.map((routine) => (
                              <div key={routine.id} className="bg-card border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-base font-bold">{routine.title}</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {routine.duration}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3 italic">
                                  🕐 {routine.when}
                                </p>
                                <ul className="space-y-2">
                                  {routine.steps.map((step, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                      <div className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-primary/40" />
                                      <span className="leading-relaxed">{step.text}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </section>

                        {categoriesForTab("overview").map((cat) => (
                          <CategoryBlock key={cat.id} cat={cat} />
                        ))}
                      </div>
                    )}

                    {/* Other tabs */}
                    {activeTab !== "changelog" &&
                      activeTab !== "overview" &&
                      activeTab !== "grid" && (
                        <div className="space-y-5">
                          {categoriesForTab(activeTab as HelpTabGroup).length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                              Ehhez a témához még nincs súgó tartalom.
                            </p>
                          ) : (
                            categoriesForTab(activeTab as HelpTabGroup).map((cat) => (
                              <CategoryBlock
                                key={cat.id}
                                cat={cat}
                                highlightRoute={location.pathname}
                              />
                            ))
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

const CategoryBlock = ({
  cat,
  highlightRoute,
}: {
  cat: (typeof HELP_CATEGORIES)[number];
  highlightRoute?: string;
}) => {
  const contextIds = highlightRoute
    ? cat.topics
        .filter((t) => t.routes?.some((r) => highlightRoute.startsWith(r)))
        .map((t) => t.id)
    : [];

  return (
    <div>
      <h4 className="font-bold text-base mb-2 flex items-center gap-2">
        <span className="text-lg">{cat.icon}</span>
        {cat.title}
      </h4>
      <Accordion type="multiple" defaultValue={contextIds} className="space-y-2">
        {cat.topics.map((t) => (
          <TopicAccordion
            key={`${cat.id}-${t.id}`}
            topic={t}
            highlighted={contextIds.includes(t.id)}
          />
        ))}
      </Accordion>
    </div>
  );
};

const TopicAccordion = ({
  topic,
  highlighted,
}: {
  topic: HelpTopic;
  highlighted?: boolean;
}) => (
  <AccordionItem
    value={topic.id}
    className={`border rounded-lg px-4 ${highlighted ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
  >
    <AccordionTrigger className="text-base font-semibold hover:no-underline py-3 text-left">
      {topic.title}
    </AccordionTrigger>
    <AccordionContent className="text-sm space-y-4 pb-4 pt-2 text-muted-foreground leading-relaxed">
      <div>
        <p className="font-semibold text-foreground mb-1.5">Mire való?</p>
        <p>{topic.whatItDoes}</p>
      </div>
      <div>
        <p className="font-semibold text-foreground mb-1.5">Hogyan használd?</p>
        <ol className="list-decimal list-inside space-y-1.5">
          {topic.howToUse.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
      <div>
        <p className="font-semibold text-foreground mb-1.5">Miért hasznos?</p>
        <p>{topic.whyItHelps}</p>
      </div>
      {topic.commonMistake && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
          <p className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1.5">
            ⚠️ Tipikus hiba
          </p>
          <p>{topic.commonMistake}</p>
        </div>
      )}
    </AccordionContent>
  </AccordionItem>
);

const ChangelogCard = ({
  entry,
  isNew,
  onJump,
}: {
  entry: ChangelogEntry;
  isNew?: boolean;
  onJump?: (tab?: string) => void;
}) => {
  const typeConfig = {
    new: { icon: Sparkles, label: "ÚJ", className: "bg-primary text-primary-foreground" },
    improved: { icon: Bell, label: "FEJLESZTÉS", className: "bg-secondary text-secondary-foreground" },
    fixed: { icon: Wrench, label: "JAVÍTÁS", className: "bg-accent text-accent-foreground" },
  }[entry.type];
  const Icon = typeConfig.icon;

  return (
    <div className="bg-card border rounded-lg p-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-2 mb-1.5">
        <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h5 className="text-sm font-bold leading-tight">{entry.title}</h5>
            {isNew && (
              <Badge className={`${typeConfig.className} text-[10px] px-1.5 py-0 h-4`}>
                {typeConfig.label}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {new Date(entry.date).toLocaleDateString("hu-HU", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed pl-6">
        {entry.description}
      </p>
      {entry.tabGroup && onJump && (
        <button
          onClick={() => onJump(entry.tabGroup)}
          className="ml-6 mt-2 text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
        >
          Tovább a súgóhoz <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
