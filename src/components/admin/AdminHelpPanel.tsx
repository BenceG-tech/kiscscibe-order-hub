import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Sparkles, BookOpen } from "lucide-react";
import { HELP_CATEGORIES, type HelpTopic } from "@/data/adminHelpContent";

interface AdminHelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const AdminHelpPanel = ({ open, onOpenChange }: AdminHelpPanelProps) => {
  const location = useLocation();
  const [query, setQuery] = useState("");

  const nq = norm(query.trim());

  const matches = (t: HelpTopic) => {
    if (!nq) return true;
    const hay = norm(
      `${t.title} ${t.whatItDoes} ${t.howToUse.join(" ")} ${t.whyItHelps} ${t.commonMistake ?? ""}`,
    );
    return hay.includes(nq);
  };

  const contextualTopics = useMemo(() => {
    const result: HelpTopic[] = [];
    for (const cat of HELP_CATEGORIES) {
      for (const t of cat.topics) {
        if (t.routes?.some((r) => location.pathname.startsWith(r)) && matches(t)) {
          result.push(t);
        }
      }
    }
    return result;
  }, [location.pathname, nq]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
        // allow interaction with the underlying admin page while panel is open
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="p-4 border-b bg-card">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Admin kézikönyv
          </SheetTitle>
          <SheetDescription>
            Mit hogyan használj — minden funkció leírva. A panel nyitva maradhat, közben tudod használni a felületet.
          </SheetDescription>
          <div className="relative mt-2">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Keresés (pl. kupon, allergén, kapacitás)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {contextualTopics.length > 0 && !nq && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Erre az oldalra vonatkozik</h3>
                </div>
                <Accordion type="multiple" className="space-y-1">
                  {contextualTopics.map((t) => (
                    <TopicAccordion key={`ctx-${t.id}`} topic={t} highlighted />
                  ))}
                </Accordion>
              </section>
            )}

            {HELP_CATEGORIES.map((cat) => {
              const filtered = cat.topics.filter(matches);
              if (filtered.length === 0) return null;
              return (
                <section key={cat.id}>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="text-base">{cat.icon}</span>
                    {cat.title}
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {filtered.length}
                    </Badge>
                  </h3>
                  <Accordion type="multiple" className="space-y-1">
                    {filtered.map((t) => (
                      <TopicAccordion key={`${cat.id}-${t.id}`} topic={t} />
                    ))}
                  </Accordion>
                </section>
              );
            })}

            <div className="pt-4 border-t text-xs text-muted-foreground">
              💬 Nem találtad? Írj a fejlesztőnek és bekerül a kézikönyvbe.
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

const TopicAccordion = ({ topic, highlighted }: { topic: HelpTopic; highlighted?: boolean }) => (
  <AccordionItem
    value={topic.id}
    className={`border rounded-md px-3 ${highlighted ? "border-primary/40 bg-primary/5" : "border-border"}`}
  >
    <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
      {topic.title}
    </AccordionTrigger>
    <AccordionContent className="text-xs space-y-3 pb-3 text-muted-foreground">
      <div>
        <p className="font-semibold text-foreground mb-1">Mire való?</p>
        <p>{topic.whatItDoes}</p>
      </div>
      <div>
        <p className="font-semibold text-foreground mb-1">Hogyan használd?</p>
        <ol className="list-decimal list-inside space-y-1">
          {topic.howToUse.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
      <div>
        <p className="font-semibold text-foreground mb-1">Miért hasznos?</p>
        <p>{topic.whyItHelps}</p>
      </div>
      {topic.commonMistake && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
          <p className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">⚠️ Tipikus hiba</p>
          <p>{topic.commonMistake}</p>
        </div>
      )}
    </AccordionContent>
  </AccordionItem>
);
