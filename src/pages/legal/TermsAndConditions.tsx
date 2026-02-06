import ModernNavigation from "@/components/ModernNavigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-desktop.png";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative h-[35vh] md:h-[40vh] overflow-hidden">
          <img
            src={heroImage}
            alt="Kiscsibe Reggeliző"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-6">
              <h1 className="text-3xl md:text-5xl font-sofia font-bold mb-2 animate-fade-in-up">
                Általános Szerződési Feltételek
              </h1>
              <p
                className="text-lg md:text-xl text-gray-200 animate-fade-in-up opacity-0"
                style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
              >
                Online rendelés feltételei
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="pt-12 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6 md:p-10 space-y-8 text-muted-foreground leading-relaxed">

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    1. Általános rendelkezések
                  </h2>
                  <p>
                    Jelen Általános Szerződési Feltételek (ÁSZF) a Kiscsibe Reggeliző & Étterem Kft.
                    (székhely: 1145 Budapest, Vezér utca 12., a továbbiakban: „Szolgáltató") által üzemeltetett
                    weboldalon (<a href="/" className="text-primary hover:underline">kiscsibe.hu</a>)
                    történő online rendelésekre vonatkoznak.
                  </p>
                  <p className="mt-2">
                    A weboldal használatával és a rendelés leadásával a Vásárló elfogadja jelen ÁSZF-et.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    2. Rendelés menete
                  </h2>
                  <ul className="list-disc list-inside space-y-2">
                    <li>A Vásárló a weboldalon elérhető napi ajánlatból vagy étlapból válogathat.</li>
                    <li>A kosárba helyezett tételek után a Vásárló megadja nevét, telefonszámát és az átvétel kívánt időpontját.</li>
                    <li>A rendelés leadásával a Vásárló ajánlatot tesz, amelyet a Szolgáltató visszaigazolással fogad el.</li>
                    <li>A visszaigazolás e-mailben és/vagy a weboldalon jelzett rendelési kóddal történik.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    3. Árak és fizetés
                  </h2>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Az árak magyar forintban (HUF) értendők, bruttó árak (ÁFA-t tartalmazzák).</li>
                    <li>A Szolgáltató fenntartja a jogot az árak előzetes értesítés nélküli módosítására; a már visszaigazolt rendelések ára nem változik.</li>
                    <li>Fizetési módok: készpénz átvételkor, bankkártyás fizetés átvételkor.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    4. Átvétel
                  </h2>
                  <ul className="list-disc list-inside space-y-2">
                    <li>A rendelések kizárólag személyes átvétellel teljesülnek az étterem címén (1145 Budapest, Vezér utca 12.).</li>
                    <li>Az átvételi időpont a rendeléskor kiválasztott idősáv.</li>
                    <li>Amennyiben a Vásárló az átvételi időponttól számított 30 percen belül nem jelentkezik, a Szolgáltató jogosult a rendelést törölni.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    5. Lemondás, módosítás
                  </h2>
                  <ul className="list-disc list-inside space-y-2">
                    <li>A rendelés leadása után annak módosítására vagy lemondására telefonon (+36 1 234 5678) vagy e-mailben van lehetőség, legkésőbb az átvételi időpont előtt 1 órával.</li>
                    <li>Az elkészült, de át nem vett rendelésekért a Szolgáltató díjat számíthat fel.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    6. Reklamáció, panaszkezelés
                  </h2>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Minőségi kifogás esetén a Vásárló haladéktalanul, de legkésőbb az átvételt követő 24 órán belül jelezze panaszát a Szolgáltató felé.</li>
                    <li>A Szolgáltató a panaszt kivizsgálja és 15 munkanapon belül választ ad.</li>
                    <li>
                      Amennyiben a Vásárló a panasz kezelésével nem elégedett, a{" "}
                      <span className="text-primary">[PLACEHOLDER – illetékes békéltető testület neve és elérhetősége]</span>{" "}
                      felé fordulhat.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    7. Felelősségkorlátozás
                  </h2>
                  <ul className="list-disc list-inside space-y-2">
                    <li>A Szolgáltató mindent megtesz az allergén információk pontos feltüntetéséért, azonban a Vásárló felelőssége az allergének ellenőrzése rendelés előtt.</li>
                    <li>A weboldal esetleges technikai hibájából eredő károkért a Szolgáltató felelősségét kizárja, kivéve, ha azt szándékos magatartás okozta.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    8. Adatvédelem
                  </h2>
                  <p>
                    A személyes adatok kezelésére vonatkozó részletes tájékoztatást az{" "}
                    <Link to="/adatvedelem" className="text-primary hover:underline">
                      Adatvédelmi Tájékoztatónkban
                    </Link>{" "}
                    találja.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    9. Egyéb rendelkezések
                  </h2>
                  <ul className="list-disc list-inside space-y-2">
                    <li>A Szolgáltató fenntartja a jogot jelen ÁSZF egyoldalú módosítására. A módosítás a weboldalon történő közzététellel lép hatályba.</li>
                    <li>A jelen ÁSZF-ben nem szabályozott kérdésekben a magyar jog, különösen a Polgári Törvénykönyv (Ptk.) és a fogyasztóvédelmi jogszabályok rendelkezései az irányadók.</li>
                  </ul>
                </section>

                <div className="border-t border-border pt-6 mt-8">
                  <p className="text-sm text-muted-foreground">
                    Utolsó frissítés: 2026. február 6.
                  </p>
                  <p className="text-sm text-primary mt-2">
                    ⚠️ A [PLACEHOLDER] jelöléssel ellátott adatokat a tényleges üzleti adatokkal kell pótolni.
                    A végleges jogi szöveget jogász által javasolt átnézni.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
