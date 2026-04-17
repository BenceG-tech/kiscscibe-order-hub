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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Sparkles, BookOpen, MapPin, Clock, ArrowRight, X } from "lucide-react";
import {
  HELP_CATEGORIES,
  QUICK_MAP,
  ROUTINES,
  type HelpTopic,
} from "@/data/adminHelpContent";

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

  useEffect(() => {
    if (open && !localStorage.getItem(NEW_USER_KEY)) {
      setShowWelcome(true);
    }
  }, [open]);

  const dismissWelcome = () => {
    localStorage.setItem(NEW_USER_KEY, "1");
    setShowWelcome(false);
  };

  const nq = norm(query.trim());

  const matches = (t: HelpTopic) => {
    if (!nq) return true;
    const hay = norm(
      `${t.title} ${t.whatItDoes} ${t.howToUse.join(" ")} ${t.whyItHelps} ${t.commonMistake ?? ""}`,
    );
    return hay.includes(nq);
  };

  const contextualCategory = useMemo(() => {
    for (const cat of HELP_CATEGORIES) {
      const hasContextual = cat.topics.some((t) =>
        t.routes?.some((r) => location.pathname.startsWith(r)),
      );
      if (hasContextual) return cat;
    }
    return null;
  }, [location.pathname]);

  const goTo = (route: string) => {
    navigate(route);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col bg-background/95 backdrop-blur-md border-l-2 border-primary/20"
        // translucent overlay so admin UI stays visible; click-outside closes naturally
        overlayClassName="bg-black/20"
      >
        <SheetHeader className="p-5 border-b bg-card/80">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-6 w-6 text-primary" />
            Admin kézikönyv
          </SheetTitle>
          <SheetDescription className="text-sm">
            Kattints az oldal sötétített részére a bezáráshoz. Olvasás közben tudod használni a felületet.
          </SheetDescription>
          <div className="relative mt-3">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Keresés (pl. kupon, allergén, kapacitás)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-7">
            {/* Welcome banner */}
            {showWelcome && !nq && (
              <div className="relative bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/30 rounded-lg p-4">
                <button
                  onClick={dismissWelcome}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                  aria-label="Bezár"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-base font-bold mb-1">👋 Új admin vagy?</p>
                <p className="text-sm text-muted-foreground">
                  Kezdd a <strong>„Mit hol találsz?"</strong> szekcióval lent — 2 perc alatt átlátod az egész rendszert.
                </p>
              </div>
            )}

            {/* Contextual section */}
            {contextualCategory && !nq && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold">Most ezen az oldalon vagy</h3>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="text-lg">{contextualCategory.icon}</span>
                    {contextualCategory.title}
                  </p>
                  <Accordion type="multiple" className="space-y-2">
                    {contextualCategory.topics
                      .filter((t) => t.routes?.some((r) => location.pathname.startsWith(r)))
                      .map((t) => (
                        <TopicAccordion key={`ctx-${t.id}`} topic={t} highlighted />
                      ))}
                  </Accordion>
                </div>
              </section>
            )}

            {/* Quick map */}
            {!nq && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🎯</span>
                  <h3 className="text-base font-bold">Mit hol találsz?</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Az admin felület minden oldala egy mondatban.
                </p>
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
            )}

            {/* Routines */}
            {!nq && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold">Napi és heti rutin</h3>
                </div>
                <div className="space-y-3">
                  {ROUTINES.map((routine) => (
                    <div
                      key={routine.id}
                      className="bg-card border rounded-lg p-4"
                    >
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
            )}

            {/* Categories */}
            <section>
              {!nq && (
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold">Részletes kézikönyv</h3>
                </div>
              )}
              <div className="space-y-5">
                {HELP_CATEGORIES.map((cat) => {
                  const filtered = cat.topics.filter(matches);
                  if (filtered.length === 0) return null;
                  return (
                    <div key={cat.id}>
                      <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        {cat.title}
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {filtered.length}
                        </Badge>
                      </h4>
                      <Accordion type="multiple" className="space-y-2">
                        {filtered.map((t) => (
                          <TopicAccordion key={`${cat.id}-${t.id}`} topic={t} />
                        ))}
                      </Accordion>
                    </div>
                  );
                })}
              </div>
            </section>

            {nq && (
              <div className="text-sm text-muted-foreground italic">
                Találatok a(z) „{query}" keresésre.
              </div>
            )}

            <div className="pt-4 border-t text-sm text-muted-foreground">
              💬 Nem találtad? Írj a fejlesztőnek és bekerül a kézikönyvbe.
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
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
