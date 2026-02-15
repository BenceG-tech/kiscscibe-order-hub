import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Save,
  ExternalLink,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Upload,
} from "lucide-react";
import {
  useAllLegalContent,
  LEGAL_PAGE_CONFIG,
  type LegalPageKey,
  type LegalPageContent,
  type LegalSection,
} from "@/hooks/useLegalContent";
import InfoTip from "@/components/admin/InfoTip";

// Default content for initial population
// Default content in plain-text markdown format (no HTML!)
const DEFAULT_CONTENT: Record<LegalPageKey, LegalPageContent> = {
  legal_impresszum: {
    heroTitle: "Impresszum",
    heroSubtitle: "Jogi információk",
    lastUpdated: "2026. február 6.",
    sections: [
      {
        id: "uzemelteto",
        title: "Üzemeltető adatai",
        content: `**Cégnév:** Kiscsibe Reggeliző & Étterem Kft.
**Székhely:** 1145 Budapest, Vezér utca 12.
**Cégjegyzékszám:** [Töltse ki a cégjegyzékszámot]
**Adószám:** [Töltse ki az adószámot]
**Nyilvántartó bíróság:** [Töltse ki – pl. Fővárosi Törvényszék Cégbírósága]`,
      },
      {
        id: "kapcsolat",
        title: "Kapcsolattartási adatok",
        content: `**Telefon:** +36 1 234 5678
**E-mail:** [kiscsibeetterem@gmail.com](mailto:kiscsibeetterem@gmail.com)
**Weboldal:** [kiscsibe.hu](/)`,
      },
      {
        id: "tarhely",
        title: "Tárhelyszolgáltató",
        content: `**Név:** [Töltse ki a tárhelyszolgáltató nevét]
**Cím:** [Töltse ki a tárhelyszolgáltató címét]
**E-mail:** [Töltse ki a tárhelyszolgáltató e-mail címét]`,
      },
      {
        id: "adatvedelem",
        title: "Adatvédelmi tisztviselő",
        content: `[Amennyiben az adatkezelő köteles adatvédelmi tisztviselőt kijelölni, itt kell megadni a nevét és elérhetőségeit. Ha nem alkalmazandó, ez a szekció törölhető.]`,
      },
      {
        id: "szerzoi",
        title: "Szerzői jogok",
        content: `A weboldalon megjelenő tartalmak (szövegek, képek, logók, arculati elemek) szerzői jogi védelem alatt állnak. Azok felhasználása kizárólag az üzemeltető előzetes írásbeli hozzájárulásával lehetséges.`,
      },
    ],
  },
  legal_privacy: {
    heroTitle: "Adatvédelmi Tájékoztató",
    heroSubtitle: "Az Ön személyes adatainak védelme fontos számunkra",
    lastUpdated: "2026. február 6.",
    sections: [
      {
        id: "adatkezelo",
        title: "1. Az adatkezelő",
        content: `Kiscsibe Reggeliző & Étterem Kft. (székhely: 1145 Budapest, Vezér utca 12., cégjegyzékszám: [Töltse ki], adószám: [Töltse ki])

**E-mail:** [kiscsibeetterem@gmail.com](mailto:kiscsibeetterem@gmail.com)
**Telefon:** +36 1 234 5678`,
      },
      {
        id: "adatok",
        title: "2. Milyen adatokat gyűjtünk?",
        content: `- **Név** – Rendelés azonosítása (Jogalap: Szerződés teljesítése, GDPR 6(1)(b))
- **Telefonszám** – Rendelési értesítések (Jogalap: Szerződés teljesítése, GDPR 6(1)(b))
- **E-mail cím** – Visszaigazolás, hírlevél (Jogalap: Szerződés / Hozzájárulás)
- **Rendelési adatok** – Rendelés feldolgozása (Jogalap: Szerződés teljesítése, GDPR 6(1)(b))
- **Hírlevél feliratkozás** – Promóciók küldése (Jogalap: Hozzájárulás, GDPR 6(1)(a))`,
      },
      {
        id: "idotartam",
        title: "3. Az adatkezelés időtartama",
        content: `- **Rendelési adatok:** a számviteli törvény szerinti 8 év
- **Hírlevél feliratkozási adatok:** a hozzájárulás visszavonásáig
- **Regisztrációs adatok:** a fiók törléséig
- **Sütikkel gyűjtött adatok:** lásd a [Süti Szabályzatot](/cookie-szabalyzat)`,
      },
      {
        id: "jogok",
        title: "4. Az Ön jogai (érintetti jogok)",
        content: `A GDPR alapján Ön jogosult:

- **Hozzáférés joga:** tájékoztatást kérhet
- **Helyesbítés joga:** kérheti pontatlan adatai kijavítását
- **Törlés joga:** kérheti adatai törlését
- **Adatkezelés korlátozása**
- **Adathordozhatóság**
- **Tiltakozás joga**
- **Hozzájárulás visszavonása**

Jogai gyakorlásához írjon a [kiscsibeetterem@gmail.com](mailto:kiscsibeetterem@gmail.com) címre.`,
      },
      {
        id: "tovabbitas",
        title: "5. Adattovábbítás",
        content: `Személyes adatait harmadik félnek nem adjuk át, kivéve:

- Jogszabályi kötelezettség teljesítése
- E-mail küldéshez használt szolgáltató: [Töltse ki]
- Tárhelyszolgáltató: [Töltse ki]`,
      },
      {
        id: "sutik",
        title: "6. Sütik (cookie-k)",
        content: `Weboldalunk sütiket és helyi tárolást (localStorage) használ. Részletekért tekintse meg a [Süti Szabályzatunkat](/cookie-szabalyzat).`,
      },
      {
        id: "jogorvoslat",
        title: "7. Jogorvoslat",
        content: `Ha úgy érzi, hogy az adatkezelés sérti a jogait, panasszal fordulhat:

- **Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)**
  Cím: 1055 Budapest, Falk Miksa utca 9-11.
  Telefon: +36 (1) 391-1400
  E-mail: ugyfelszolgalat@naih.hu
  Web: [naih.hu](https://naih.hu)
- Bírósághoz fordulhat az Infotv. és a GDPR alapján.`,
      },
    ],
  },
  legal_terms: {
    heroTitle: "Általános Szerződési Feltételek",
    heroSubtitle: "Online rendelés feltételei",
    lastUpdated: "2026. február 6.",
    sections: [
      {
        id: "altalanos",
        title: "1. Általános rendelkezések",
        content: `Jelen Általános Szerződési Feltételek (ÁSZF) a Kiscsibe Reggeliző & Étterem Kft. (székhely: 1145 Budapest, Vezér utca 12.) által üzemeltetett weboldalon ([kiscsibe.hu](/)) történő online rendelésekre vonatkoznak.

A weboldal használatával és a rendelés leadásával a Vásárló elfogadja jelen ÁSZF-et.`,
      },
      {
        id: "rendeles",
        title: "2. Rendelés menete",
        content: `- A Vásárló a weboldalon elérhető napi ajánlatból vagy étlapból válogathat.
- A kosárba helyezett tételek után a Vásárló megadja nevét, telefonszámát és az átvétel kívánt időpontját.
- A rendelés leadásával a Vásárló ajánlatot tesz, amelyet a Szolgáltató visszaigazolással fogad el.
- A visszaigazolás e-mailben és/vagy a weboldalon jelzett rendelési kóddal történik.`,
      },
      {
        id: "arak",
        title: "3. Árak és fizetés",
        content: `- Az árak magyar forintban (HUF) értendők, bruttó árak (ÁFA-t tartalmazzák).
- A Szolgáltató fenntartja a jogot az árak előzetes értesítés nélküli módosítására; a már visszaigazolt rendelések ára nem változik.
- Fizetési módok: készpénz átvételkor, bankkártyás fizetés átvételkor.`,
      },
      {
        id: "atvetel",
        title: "4. Átvétel",
        content: `- A rendelések kizárólag személyes átvétellel teljesülnek az étterem címén (1145 Budapest, Vezér utca 12.).
- Az átvételi időpont a rendeléskor kiválasztott idősáv.
- Amennyiben a Vásárló az átvételi időponttól számított 30 percen belül nem jelentkezik, a Szolgáltató jogosult a rendelést törölni.`,
      },
      {
        id: "lemondas",
        title: "5. Lemondás, módosítás",
        content: `- A rendelés leadása után annak módosítására vagy lemondására telefonon (+36 1 234 5678) vagy e-mailben van lehetőség, legkésőbb az átvételi időpont előtt 1 órával.
- Az elkészült, de át nem vett rendelésekért a Szolgáltató díjat számíthat fel.`,
      },
      {
        id: "reklamacio",
        title: "6. Reklamáció, panaszkezelés",
        content: `- Minőségi kifogás esetén a Vásárló haladéktalanul, de legkésőbb az átvételt követő 24 órán belül jelezze panaszát.
- A Szolgáltató a panaszt kivizsgálja és 15 munkanapon belül választ ad.
- Amennyiben a Vásárló nem elégedett, a [Töltse ki – illetékes békéltető testület] felé fordulhat.`,
      },
      {
        id: "felelosseg",
        title: "7. Felelősségkorlátozás",
        content: `- A Szolgáltató mindent megtesz az allergén információk pontos feltüntetéséért, azonban a Vásárló felelőssége az allergének ellenőrzése rendelés előtt.
- A weboldal esetleges technikai hibájából eredő károkért a Szolgáltató felelősségét kizárja, kivéve szándékos magatartás esetén.`,
      },
      {
        id: "adatvedelem",
        title: "8. Adatvédelem",
        content: `A személyes adatok kezelésére vonatkozó részletes tájékoztatást az [Adatvédelmi Tájékoztatónkban](/adatvedelem) találja.`,
      },
      {
        id: "egyeb",
        title: "9. Egyéb rendelkezések",
        content: `- A Szolgáltató fenntartja a jogot jelen ÁSZF egyoldalú módosítására. A módosítás a weboldalon történő közzététellel lép hatályba.
- A jelen ÁSZF-ben nem szabályozott kérdésekben a magyar jog, különösen a Polgári Törvénykönyv (Ptk.) és a fogyasztóvédelmi jogszabályok rendelkezései az irányadók.`,
      },
    ],
  },
  legal_cookies: {
    heroTitle: "Süti (Cookie) Szabályzat",
    heroSubtitle: "Tájékoztató a sütik használatáról",
    lastUpdated: "2026. február 6.",
    sections: [
      {
        id: "mi-az",
        title: "1. Mi az a süti (cookie)?",
        content: `A süti (cookie) egy kis szöveges fájl, amelyet a weboldal az Ön böngészőjében helyez el. A sütik segítségével a weboldal megjegyzi az Ön beállításait és biztosítja a megfelelő működést.

Weboldalunk a hagyományos süti fájlok mellett helyi tárolást (localStorage) is használ hasonló célokra.`,
      },
      {
        id: "tipusok",
        title: "2. Milyen sütiket használunk?",
        content: `**2.1. Szükséges (elengedhetetlen) sütik**

Ezek a sütik a weboldal alapvető működéséhez szükségesek, és nem kapcsolhatók ki.

- **sb-*-auth-token** (localStorage) – Supabase felhasználói azonosítás – Session
- **cookie-consent** (localStorage) – Süti hozzájárulás állapota – Állandó
- **theme** (localStorage) – Sötét/világos téma beállítás – Állandó
- **cart-items** (Memória) – Kosár tartalom – Oldal bezárásáig

**2.2. Opcionális / analitikai sütik**

Jelenleg weboldalunk **nem használ** analitikai vagy marketing célú sütiket.`,
      },
      {
        id: "kezeles",
        title: "3. Hogyan kezelheti a sütiket?",
        content: `A böngészője beállításaiban bármikor törölheti a tárolt sütiket és helyi adatokat:

- **Chrome:** Beállítások → Adatvédelem és biztonság → Cookie-k
- **Firefox:** Beállítások → Adatvédelem és biztonság → Cookie-k
- **Safari:** Beállítások → Adatvédelem → Webhelyadatok kezelése
- **Edge:** Beállítások → Cookie-k és webhelyengedélyek

**Figyelem:** A szükséges sütik törlése esetén egyes funkciók nem fognak megfelelően működni.`,
      },
      {
        id: "info",
        title: "4. További információ",
        content: `Az adatkezelés részleteiről az [Adatvédelmi Tájékoztatónkban](/adatvedelem) tájékozódhat. Kérdés esetén írjon a [kiscsibeetterem@gmail.com](mailto:kiscsibeetterem@gmail.com) címre.`,
      },
    ],
  },
};

const LegalPageEditor = () => {
  const { data: allContent, isLoading } = useAllLegalContent();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<LegalPageKey>("legal_impresszum");
  const [editData, setEditData] = useState<Record<LegalPageKey, LegalPageContent>>({} as any);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize edit data from DB or empty
  useEffect(() => {
    if (!isLoading && allContent !== undefined) {
      const keys: LegalPageKey[] = ["legal_impresszum", "legal_privacy", "legal_terms", "legal_cookies"];
      const initial: Record<string, LegalPageContent> = {};
      keys.forEach((key) => {
        if (allContent?.[key]) {
          initial[key] = allContent[key];
        } else {
          initial[key] = { heroTitle: "", heroSubtitle: "", lastUpdated: "", sections: [] };
        }
      });
      setEditData(initial as Record<LegalPageKey, LegalPageContent>);
    }
  }, [isLoading, allContent]);

  const currentPage = editData[activeTab];

  if (isLoading || !currentPage) {
    return (
      <div className="py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const updateField = (field: keyof LegalPageContent, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [field]: value },
    }));
    setHasChanges(true);
  };

  const updateSection = (index: number, field: keyof LegalSection, value: string) => {
    setEditData((prev) => {
      const sections = [...prev[activeTab].sections];
      sections[index] = { ...sections[index], [field]: value };
      return { ...prev, [activeTab]: { ...prev[activeTab], sections } };
    });
    setHasChanges(true);
  };

  const addSection = () => {
    const newSection: LegalSection = {
      id: `section-${Date.now()}`,
      title: "Új szekció",
      content: "",
    };
    setEditData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        sections: [...prev[activeTab].sections, newSection],
      },
    }));
    setHasChanges(true);
  };

  const removeSection = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        sections: prev[activeTab].sections.filter((_, i) => i !== index),
      },
    }));
    setHasChanges(true);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    setEditData((prev) => {
      const sections = [...prev[activeTab].sections];
      [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
      return { ...prev, [activeTab]: { ...prev[activeTab], sections } };
    });
    setHasChanges(true);
  };

  const loadDefaults = () => {
    setEditData((prev) => ({
      ...prev,
      [activeTab]: DEFAULT_CONTENT[activeTab],
    }));
    setHasChanges(true);
    toast.success("Alapértelmezett tartalom betöltve");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({ key: activeTab, value_json: currentPage as any }, { onConflict: "key" });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["legal-content"] });
      queryClient.invalidateQueries({ queryKey: ["legal-content-all"] });
      setHasChanges(false);
      toast.success("Sikeresen mentve!");
    } catch (err: any) {
      toast.error("Hiba történt a mentés során", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const pageConfig = LEGAL_PAGE_CONFIG[activeTab];
  const isEmpty = currentPage.sections.length === 0 && !currentPage.heroTitle;

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          Jogi oldalak kezelése
          <InfoTip text="Szerkeszd az adatvédelmi tájékoztató, ÁSZF és impresszum szövegeket." />
        </h1>
        <p className="text-muted-foreground mt-1">Szerkessze a weboldal jogi tartalmait</p>
      </div>

      {/* Page Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LegalPageKey)}>
        <TabsList className="w-full sm:w-auto">
          {(Object.keys(LEGAL_PAGE_CONFIG) as LegalPageKey[]).map((key) => (
            <TabsTrigger key={key} value={key} className="text-xs sm:text-sm">
              {LEGAL_PAGE_CONFIG[key].label}
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(LEGAL_PAGE_CONFIG) as LegalPageKey[]).map((key) => (
          <TabsContent key={key} value={key}>
            {/* Show "load defaults" if page is empty */}
            {isEmpty && (
              <Card className="border-dashed border-2">
                <CardContent className="py-8 text-center space-y-4">
                  <p className="text-muted-foreground">
                    Ez az oldal még üres. Töltse be az alapértelmezett tartalmat a szerkesztés megkezdéséhez.
                  </p>
                  <Button onClick={loadDefaults} variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Alapértelmezett tartalom betöltése
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isEmpty && (
              <div className="space-y-6">
                {/* Hero fields */}
                <Card>
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="heroTitle">Hero cím</Label>
                        <Input
                          id="heroTitle"
                          value={currentPage.heroTitle}
                          onChange={(e) => updateField("heroTitle", e.target.value)}
                          placeholder="Pl. Impresszum"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="heroSubtitle">Hero alcím</Label>
                        <Input
                          id="heroSubtitle"
                          value={currentPage.heroSubtitle}
                          onChange={(e) => updateField("heroSubtitle", e.target.value)}
                          placeholder="Pl. Jogi információk"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastUpdated">Utolsó frissítés</Label>
                      <Input
                        id="lastUpdated"
                        value={currentPage.lastUpdated}
                        onChange={(e) => updateField("lastUpdated", e.target.value)}
                        placeholder="Pl. 2026. február 6."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Sections */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Szekciók</h2>
                  {currentPage.sections.map((section, index) => (
                    <Card key={section.id}>
                      <CardContent className="p-4 sm:p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex-1 space-y-2">
                            <Label>Szekció cím</Label>
                            <Input
                              value={section.title}
                              onChange={(e) => updateSection(index, "title", e.target.value)}
                              placeholder="Szekció címe"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Tartalom</Label>
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3 space-y-1">
                            <p className="font-medium text-foreground">Formázási tippek:</p>
                            <p><code className="bg-muted px-1 rounded">**félkövér szöveg**</code> → <strong>félkövér szöveg</strong></p>
                            <p><code className="bg-muted px-1 rounded">- listaelem</code> → felsorolás pont</p>
                            <p><code className="bg-muted px-1 rounded">[szöveg](https://link.hu)</code> → kattintható link</p>
                            <p>Üres sor → új bekezdés</p>
                          </div>
                          <Textarea
                            value={section.content}
                            onChange={(e) => updateSection(index, "content", e.target.value)}
                            placeholder="Írja be a szekció tartalmát..."
                            className="min-h-[150px] sm:min-h-[200px] text-sm resize-y"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveSection(index, "up")}
                            disabled={index === 0}
                            className="gap-1"
                          >
                            <ArrowUp className="h-3 w-3" />
                            <span className="hidden sm:inline">Fel</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveSection(index, "down")}
                            disabled={index === currentPage.sections.length - 1}
                            className="gap-1"
                          >
                            <ArrowDown className="h-3 w-3" />
                            <span className="hidden sm:inline">Le</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSection(index)}
                            className="gap-1 ml-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden sm:inline">Törlés</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button variant="outline" onClick={addSection} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Új szekció hozzáadása
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-4 border-t">
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Mentés
                    </Button>
                    <Button variant="outline" onClick={loadDefaults} className="gap-2">
                      <Upload className="h-4 w-4" />
                      <span className="hidden sm:inline">Alapértelmezettek betöltése</span>
                      <span className="sm:hidden">Alap</span>
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    asChild
                    className="gap-2"
                  >
                    <a href={pageConfig.path} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Megtekintés
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default LegalPageEditor;
