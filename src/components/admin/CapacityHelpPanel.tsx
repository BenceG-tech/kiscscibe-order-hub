import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, HelpCircle, Clock, CalendarOff, AlertTriangle, CheckCircle2 } from "lucide-react";

const CapacityHelpPanel = () => {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <Button
          variant="ghost"
          onClick={() => setOpen((v) => !v)}
          className="w-full justify-between h-auto py-2 px-2 hover:bg-primary/10"
        >
          <span className="flex items-center gap-2 text-base font-semibold text-foreground">
            <HelpCircle className="h-5 w-5 text-primary" />
            Hogyan működik a kapacitáskezelés?
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {open && (
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground px-2 pb-2">
            <div>
              <p className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Mire való?
              </p>
              <p>
                A kapacitáskezelő szabályozza, hogy egy adott napon és időpontban hány rendelést tudtok elvállalni.
                Ez megakadályozza a túlfoglalást és segít egyenletesen elosztani a konyhai munkát.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1">Időslotok</p>
              <p>
                Minden nap fél órás (vagy óránkénti) idősávokra van osztva (pl. 11:00, 11:30, 12:00…).
                Mindegyik slothoz beállítható egy <strong>maximum rendelésszám</strong>. Amikor a vásárló átvételi időt választ,
                csak azokat látja, ahol még van szabad hely.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1">Sablonok</p>
              <p>
                Mentsd el egy "tipikus nap" beállításait sablonként, így egy kattintással alkalmazhatod ugyanezt 
                az egész hétre — nem kell minden napra külön bevinni.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <CalendarOff className="h-4 w-4 text-destructive" /> Zárolások
              </p>
              <p>
                Ha egy konkrét napon zárva tartotok (pl. ünnepnap, leltár, magán esemény), zárold a napot — 
                a vásárlók nem fognak tudni rendelni rá.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" /> Mit lát a vásárló?
              </p>
              <p>
                Ha egy időslot betelt, ott "Betelt" felirat jelenik meg, és nem választható.
                Ha az egész nap zárolva van, a nap nem jelenik meg az átvételi naptárban.
              </p>
            </div>

            <div className="bg-background/60 rounded-lg p-3 border border-border">
              <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Lépésről lépésre — első beállítás
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Válassz ki egy napot a naptárban (pl. holnap)</li>
                <li>Kattints az <strong>"Alapértelmezett"</strong> gombra → létrejönnek a tipikus időslotok</li>
                <li>Igazítsd ki az egyes slotok kapacitását, ha kell (pl. ebédidőben több, kora délután kevesebb)</li>
                <li>Kattints a <strong>"Mentés sablonként"</strong> gombra → adj nevet (pl. "Hétköznap")</li>
                <li>A Sablonok fülön alkalmazd <strong>"Egész hétre"</strong> — kész a heti kapacitás</li>
              </ol>
            </div>

            <p className="text-xs italic">
              💡 Tipp: ha most még nem szükséges kapacitás-korlátozás, hagyd magasra állítva (pl. 50/slot), 
              és csak akkor szigorítsd, ha tényleg túlcsordultatok.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CapacityHelpPanel;
