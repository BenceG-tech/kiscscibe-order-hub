import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Map as MapIcon,
  UtensilsCrossed,
  Activity,
  Wallet,
  Megaphone,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Sun,
  CalendarDays,
  Sparkles as SparklesIcon,
  Home,
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
  HELP_PAGE_GROUPS,
  ROUTINES,
  type HelpTopic,
  type HelpTabGroup,
  type Routine,
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

type View =
  | { level: "grid" }
  | { level: "tab"; tab: HelpTabGroup }
  | { level: "page"; tab: HelpTabGroup; pageGroup: string }
  | { level: "changelog" };

const TAB_ICON_MAP: Record<HelpTabGroup, typeof SettingsIcon> = {
  menu: UtensilsCrossed,
  operations: Activity,
  finance: Wallet,
  marketing: Megaphone,
  content: SettingsIcon,
};

const TAB_DESC_MAP: Record<HelpTabGroup, string> = {
  menu: "Étlap, allergének, napi ajánlat",
  operations: "Rendelések, KDS, kapacitás",
  finance: "Számlák, partnerek, statisztika",
  marketing: "Képek, FB poszt, hírlevél, kuponok",
  content: "Rólunk, GYIK, jogi, beállítások",
};

export const AdminHelpPanel = ({ open, onOpenChange }: AdminHelpPanelProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [view, setView] = useState<View>({ level: "grid" });
  const [unseenCount, setUnseenCount] = useState(0);
  const [routineDialog, setRoutineDialog] = useState<Routine | null>(null);
  const [overviewDialog, setOverviewDialog] = useState(false);

  // All topics flattened with their category meta
  const allTopics = useMemo(
    () =>
      HELP_CATEGORIES.flatMap((cat) =>
        cat.topics.map((t) => ({ ...t, _cat: cat })),
      ),
    [],
  );

  // Determine contextual page from current route
  const contextualPage = useMemo<string | null>(() => {
    const matching = HELP_PAGE_GROUPS.filter(
      (pg) => pg.route && location.pathname.startsWith(pg.route),
    );
    if (matching.length === 0) return null;
    // Prefer the most specific (longest) route match
    return matching.sort((a, b) => (b.route?.length ?? 0) - (a.route?.length ?? 0))[0].id;
  }, [location.pathname]);

  const contextualTab = useMemo<HelpTabGroup | null>(() => {
    if (!contextualPage) return null;
    return HELP_PAGE_GROUPS.find((pg) => pg.id === contextualPage)?.tabGroup ?? null;
  }, [contextualPage]);

  useEffect(() => {
    if (open) {
      if (!localStorage.getItem(NEW_USER_KEY)) setShowWelcome(true);
      setUnseenCount(getUnseenCount(7));
      setView({ level: "grid" });
    }
  }, [open]);

  const dismissWelcome = () => {
    localStorage.setItem(NEW_USER_KEY, "1");
    setShowWelcome(false);
  };

  const goToChangelog = () => {
    markChangelogViewed();
    setUnseenCount(0);
    setView({ level: "changelog" });
  };

  const nq = norm(query.trim());
  const matches = (t: HelpTopic) => {
    if (!nq) return true;
    const hay = norm(
      `${t.title} ${t.whatItDoes} ${t.howToUse.join(" ")} ${t.whyItHelps} ${t.commonMistake ?? ""}`,
    );
    return hay.includes(nq);
  };

  const searchResults = useMemo(() => {
    if (!nq) return null;
    return HELP_CATEGORIES.map((cat) => ({
      ...cat,
      topics: cat.topics.filter(matches),
    })).filter((c) => c.topics.length > 0);
  }, [nq]);

  const recentEntries = CHANGELOG.filter((e) => isWithinDays(e.date, 7));
  const olderEntries = CHANGELOG.filter(
    (e) => !isWithinDays(e.date, 7) && isWithinDays(e.date, 30),
  );

  // Topics for a given page group
  const topicsForPage = (pageGroupId: string) =>
    allTopics.filter((t) => t.pageGroup === pageGroupId);

  // Pages for a tab
  const pagesForTab = (tab: HelpTabGroup) =>
    HELP_PAGE_GROUPS.filter((pg) => pg.tabGroup === tab);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col bg-background/95 backdrop-blur-md border-l-2 border-primary/20"
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

          {/* Breadcrumb */}
          {!nq && view.level !== "grid" && (
            <Breadcrumb view={view} setView={setView} />
          )}
        </SheetHeader>

        {showWelcome && !nq && view.level === "grid" && (
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
              Kezdd a <strong>Napi rutin</strong> kártyával — 5 perc alatt áttekinted.
            </p>
          </div>
        )}

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
          <ScrollArea className="flex-1">
            <div className="px-5 pt-3 pb-8">
              {view.level === "grid" && (
                <GridView
                  unseenCount={unseenCount}
                  contextualTab={contextualTab}
                  onTabClick={(tab) => setView({ level: "tab", tab })}
                  onChangelogClick={goToChangelog}
                  onRoutineClick={(r) => setRoutineDialog(r)}
                  onOverviewClick={() => setOverviewDialog(true)}
                />
              )}

              {view.level === "tab" && (
                <TabPagesView
                  tab={view.tab}
                  contextualPage={contextualPage}
                  onPageClick={(pageGroup) =>
                    setView({ level: "page", tab: view.tab, pageGroup })
                  }
                />
              )}

              {view.level === "page" && (
                <PageTopicsView
                  pageGroupId={view.pageGroup}
                  topics={topicsForPage(view.pageGroup)}
                  onNavigate={navigate}
                />
              )}

              {view.level === "changelog" && (
                <ChangelogView
                  recent={recentEntries}
                  older={olderEntries}
                  onJump={(tab) => {
                    if (tab) setView({ level: "tab", tab: tab as HelpTabGroup });
                  }}
                />
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>

      {/* Routine dialog */}
      <Dialog open={!!routineDialog} onOpenChange={(o) => !o && setRoutineDialog(null)}>
        <DialogContent>
          {routineDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {routineDialog.id === "morning" ? (
                    <Sun className="h-5 w-5 text-primary" />
                  ) : (
                    <CalendarDays className="h-5 w-5 text-primary" />
                  )}
                  {routineDialog.title}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {routineDialog.duration}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {routineDialog.when}
              </p>
              <ul className="space-y-2.5 mt-2">
                {routineDialog.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <div className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-primary/40 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <span className="leading-relaxed">{step.text}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Full overview dialog (page map) */}
      <Dialog open={overviewDialog} onOpenChange={setOverviewDialog}>
        <DialogContent className="max-w-2xl max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-primary" />
              Teljes oldal-térkép
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4">
              {HELP_TABS.map((tab) => {
                const TabIcon = TAB_ICON_MAP[tab.id];
                return (
                  <div key={tab.id}>
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-foreground">
                      <TabIcon className="h-4 w-4 text-primary" />
                      {tab.label}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-6">
                      {pagesForTab(tab.id).map((pg) => (
                        <button
                          key={pg.id}
                          onClick={() => {
                            setOverviewDialog(false);
                            setView({ level: "page", tab: tab.id, pageGroup: pg.id });
                          }}
                          className="text-left bg-card hover:bg-accent border rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                        >
                          <span className="mr-1.5">{pg.icon}</span>
                          <span className="font-semibold">{pg.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};

// ============= Subcomponents =============

const Breadcrumb = ({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) => {
  const tab = view.level === "tab" || view.level === "page" ? view.tab : null;
  const tabMeta = tab ? HELP_TABS.find((t) => t.id === tab) : null;
  const pageMeta =
    view.level === "page"
      ? HELP_PAGE_GROUPS.find((pg) => pg.id === view.pageGroup)
      : null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 flex-wrap">
      <button
        onClick={() => setView({ level: "grid" })}
        className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
      >
        <Home className="h-3.5 w-3.5" />
        Kézikönyv
      </button>
      {view.level === "changelog" && (
        <>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold">Mi változott?</span>
        </>
      )}
      {tabMeta && (
        <>
          <ChevronRight className="h-3 w-3" />
          <button
            onClick={() => setView({ level: "tab", tab: tabMeta.id })}
            className={`hover:text-primary transition-colors font-medium ${
              view.level === "tab" ? "text-foreground" : ""
            }`}
            disabled={view.level === "tab"}
          >
            {tabMeta.icon} {tabMeta.label}
          </button>
        </>
      )}
      {pageMeta && (
        <>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold">
            {pageMeta.icon} {pageMeta.title}
          </span>
        </>
      )}
    </div>
  );
};

const GridView = ({
  unseenCount,
  contextualTab,
  onTabClick,
  onChangelogClick,
  onRoutineClick,
  onOverviewClick,
}: {
  unseenCount: number;
  contextualTab: HelpTabGroup | null;
  onTabClick: (tab: HelpTabGroup) => void;
  onChangelogClick: () => void;
  onRoutineClick: (r: Routine) => void;
  onOverviewClick: () => void;
}) => {
  const morning = ROUTINES.find((r) => r.id === "morning");
  const weekly = ROUTINES.find((r) => r.id === "weekly");

  return (
    <div className="space-y-4">
      {/* Routines — featured top block */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Rutinok — kezdd itt
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {morning && (
            <button
              onClick={() => onRoutineClick(morning)}
              className="bg-gradient-to-br from-amber-500/15 to-amber-500/5 hover:from-amber-500/25 hover:to-amber-500/10 border-2 border-amber-500/40 rounded-xl p-3 text-left transition-all"
            >
              <Sun className="h-6 w-6 text-amber-600 dark:text-amber-400 mb-1.5" />
              <div className="text-sm font-bold leading-tight">📅 Napi rutin</div>
              <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                {morning.duration} • {morning.steps.length} lépés
              </div>
            </button>
          )}
          {weekly && (
            <button
              onClick={() => onRoutineClick(weekly)}
              className="bg-gradient-to-br from-blue-500/15 to-blue-500/5 hover:from-blue-500/25 hover:to-blue-500/10 border-2 border-blue-500/40 rounded-xl p-3 text-left transition-all"
            >
              <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-1.5" />
              <div className="text-sm font-bold leading-tight">📆 Heti rutin</div>
              <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                {weekly.duration} • {weekly.steps.length} lépés
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Mi változott? + Áttekintés */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onChangelogClick}
          className="relative bg-card hover:bg-accent border-2 border-border hover:border-primary/40 rounded-xl p-3 text-left transition-all"
        >
          {unseenCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow">
              {unseenCount}
            </span>
          )}
          <SparklesIcon className="h-6 w-6 text-primary mb-1.5" />
          <div className="text-sm font-bold leading-tight">🆕 Mi változott?</div>
          <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
            Friss frissítések, új funkciók
          </div>
        </button>
        <button
          onClick={onOverviewClick}
          className="bg-card hover:bg-accent border-2 border-border hover:border-primary/40 rounded-xl p-3 text-left transition-all"
        >
          <MapIcon className="h-6 w-6 text-primary mb-1.5" />
          <div className="text-sm font-bold leading-tight">🗺️ Teljes áttekintés</div>
          <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
            Minden oldal egyben
          </div>
        </button>
      </div>

      {/* Main categories */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Témakörök
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {HELP_TABS.map((tab) => {
            const TabIcon = TAB_ICON_MAP[tab.id];
            const isHere = contextualTab === tab.id;
            const pageCount = HELP_PAGE_GROUPS.filter((pg) => pg.tabGroup === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => onTabClick(tab.id)}
                className={`relative bg-card hover:bg-accent border-2 rounded-xl p-3 text-left transition-all ${
                  isHere
                    ? "border-primary/60 shadow-sm"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {isHere && (
                  <span
                    className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse"
                    title="Itt vagy most"
                  />
                )}
                <TabIcon
                  className={`h-6 w-6 mb-1.5 ${isHere ? "text-primary" : "text-foreground"}`}
                />
                <div className="text-sm font-bold leading-tight">{tab.label}</div>
                <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                  {TAB_DESC_MAP[tab.id]}
                </div>
                <div className="text-[10px] text-muted-foreground/70 mt-1">
                  {pageCount} oldal
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TabPagesView = ({
  tab,
  contextualPage,
  onPageClick,
}: {
  tab: HelpTabGroup;
  contextualPage: string | null;
  onPageClick: (pageGroup: string) => void;
}) => {
  const pages = HELP_PAGE_GROUPS.filter((pg) => pg.tabGroup === tab);
  const tabMeta = HELP_TABS.find((t) => t.id === tab);
  const TabIcon = TAB_ICON_MAP[tab];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <TabIcon className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold">{tabMeta?.label}</h2>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">
        Válaszd ki, melyik oldalról szeretnél többet tudni:
      </p>
      <div className="grid grid-cols-1 gap-2">
        {pages.map((pg) => {
          const isHere = contextualPage === pg.id;
          return (
            <button
              key={pg.id}
              onClick={() => onPageClick(pg.id)}
              className={`relative w-full text-left bg-card hover:bg-accent border-2 rounded-lg p-3 transition-all flex items-center gap-3 ${
                isHere
                  ? "border-primary/60 shadow-sm"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span className="text-2xl shrink-0">{pg.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{pg.title}</span>
                  {isHere && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] h-4 px-1.5">
                      ● itt vagy
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                  {pg.description}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

const PageTopicsView = ({
  pageGroupId,
  topics,
  onNavigate,
}: {
  pageGroupId: string;
  topics: HelpTopic[];
  onNavigate: (route: string) => void;
}) => {
  const pg = HELP_PAGE_GROUPS.find((p) => p.id === pageGroupId);
  if (!pg) return null;

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl shrink-0">{pg.icon}</span>
          <div className="flex-1">
            <h2 className="text-lg font-bold leading-tight">{pg.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{pg.description}</p>
            {pg.route && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2.5 h-7 text-xs"
                onClick={() => onNavigate(pg.route!)}
              >
                Ugrás az oldalra <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {topics.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Ehhez az oldalhoz még nincs súgó tartalom.
        </p>
      ) : (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Funkciók ({topics.length})
          </h3>
          <Accordion type="multiple" className="space-y-2" defaultValue={[topics[0]?.id]}>
            {topics.map((t) => (
              <TopicAccordion key={t.id} topic={t} />
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
};

const ChangelogView = ({
  recent,
  older,
  onJump,
}: {
  recent: ChangelogEntry[];
  older: ChangelogEntry[];
  onJump: (tab?: string) => void;
}) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-1">
      <Bell className="h-5 w-5 text-primary" />
      <h3 className="text-base font-bold">Mi változott a rendszerben?</h3>
    </div>
    <p className="text-sm text-muted-foreground">
      Az utolsó frissítések — kattints egy bejegyzésre a részletes súgóhoz.
    </p>

    {recent.length > 0 && (
      <div>
        <h4 className="text-sm font-bold text-foreground mb-2 mt-3">
          🌟 Friss változások (utolsó 7 nap)
        </h4>
        <div className="space-y-2">
          {recent.map((e, i) => (
            <ChangelogCard key={i} entry={e} isNew onJump={onJump} />
          ))}
        </div>
      </div>
    )}

    {older.length > 0 && (
      <div>
        <h4 className="text-sm font-bold text-muted-foreground mb-2 mt-4">
          Korábbi frissítések
        </h4>
        <div className="space-y-2">
          {older.map((e, i) => (
            <ChangelogCard key={i} entry={e} onJump={onJump} />
          ))}
        </div>
      </div>
    )}
  </div>
);

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
