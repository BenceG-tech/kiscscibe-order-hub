import ModernNavigation from "@/components/ModernNavigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-desktop.png";

const PrivacyPolicy = () => {
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
                Adatvédelmi Tájékoztató
              </h1>
              <p
                className="text-lg md:text-xl text-gray-200 animate-fade-in-up opacity-0"
                style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
              >
                Az Ön személyes adatainak védelme fontos számunkra
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
                    1. Az adatkezelő
                  </h2>
                  <p>
                    Kiscsibe Reggeliző & Étterem Kft. (székhely: 1145 Budapest, Vezér utca 12.,
                    cégjegyzékszám: <span className="text-primary">[PLACEHOLDER]</span>,
                    adószám: <span className="text-primary">[PLACEHOLDER]</span>)
                  </p>
                  <p className="mt-2">
                    E-mail: <a href="mailto:kiscsibeetterem@gmail.com" className="text-primary hover:underline">kiscsibeetterem@gmail.com</a><br />
                    Telefon: +36 1 234 5678
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    2. Milyen adatokat gyűjtünk?
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 text-foreground font-semibold">Adat típusa</th>
                          <th className="text-left p-3 text-foreground font-semibold">Cél</th>
                          <th className="text-left p-3 text-foreground font-semibold">Jogalap</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="p-3">Név</td>
                          <td className="p-3">Rendelés azonosítása, átvételkor</td>
                          <td className="p-3">Szerződés teljesítése (GDPR 6(1)(b))</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-3">Telefonszám</td>
                          <td className="p-3">Rendelési értesítések, kapcsolattartás</td>
                          <td className="p-3">Szerződés teljesítése (GDPR 6(1)(b))</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-3">E-mail cím</td>
                          <td className="p-3">Rendelés visszaigazolása, hírlevél (opcionális)</td>
                          <td className="p-3">Szerződés teljesítése / Hozzájárulás (GDPR 6(1)(a))</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-3">Rendelési adatok</td>
                          <td className="p-3">Rendelés feldolgozása, teljesítése</td>
                          <td className="p-3">Szerződés teljesítése (GDPR 6(1)(b))</td>
                        </tr>
                        <tr>
                          <td className="p-3">Hírlevél feliratkozás (e-mail)</td>
                          <td className="p-3">Promóciók, ajánlatok küldése</td>
                          <td className="p-3">Hozzájárulás (GDPR 6(1)(a))</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    3. Az adatkezelés időtartama
                  </h2>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong className="text-foreground">Rendelési adatok:</strong> a számviteli törvény szerinti 8 év (a teljesítéstől számítva)</li>
                    <li><strong className="text-foreground">Hírlevél feliratkozási adatok:</strong> a hozzájárulás visszavonásáig</li>
                    <li><strong className="text-foreground">Regisztrációs adatok:</strong> a fiók törléséig</li>
                    <li><strong className="text-foreground">Sütikkel gyűjtött adatok:</strong> lásd a <Link to="/cookie-szabalyzat" className="text-primary hover:underline">Süti Szabályzatot</Link></li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    4. Az Ön jogai (érintetti jogok)
                  </h2>
                  <p className="mb-3">A GDPR alapján Ön jogosult:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong className="text-foreground">Hozzáférés joga:</strong> tájékoztatást kérhet arról, milyen adatait kezeljük</li>
                    <li><strong className="text-foreground">Helyesbítés joga:</strong> kérheti pontatlan adatai kijavítását</li>
                    <li><strong className="text-foreground">Törlés joga ("elfeledtetés"):</strong> kérheti adatai törlését, amennyiben a jogalap megszűnt</li>
                    <li><strong className="text-foreground">Adatkezelés korlátozása:</strong> kérheti az adatkezelés korlátozását</li>
                    <li><strong className="text-foreground">Adathordozhatóság:</strong> kérheti adatai géppel olvasható formátumban történő kiadását</li>
                    <li><strong className="text-foreground">Tiltakozás joga:</strong> tiltakozhat az adatkezelés ellen</li>
                    <li><strong className="text-foreground">Hozzájárulás visszavonása:</strong> bármikor visszavonhatja, a korábbi adatkezelés jogszerűségét nem érinti</li>
                  </ul>
                  <p className="mt-4">
                    Jogai gyakorlásához írjon a{" "}
                    <a href="mailto:kiscsibeetterem@gmail.com" className="text-primary hover:underline">
                      kiscsibeetterem@gmail.com
                    </a>{" "}
                    címre.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    5. Adattovábbítás
                  </h2>
                  <p>
                    Személyes adatait harmadik félnek nem adjuk át, kivéve:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mt-2">
                    <li>Jogszabályi kötelezettség teljesítése (pl. hatósági megkeresés)</li>
                    <li>E-mail küldéshez használt szolgáltató: <span className="text-primary">[PLACEHOLDER – e-mail szolgáltató neve]</span></li>
                    <li>Tárhelyszolgáltató: <span className="text-primary">[PLACEHOLDER – tárhelyszolgáltató neve]</span></li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    6. Sütik (cookie-k)
                  </h2>
                  <p>
                    Weboldalunk sütiket és helyi tárolást (localStorage) használ a működéshez.
                    Részletekért tekintse meg a{" "}
                    <Link to="/cookie-szabalyzat" className="text-primary hover:underline">
                      Süti Szabályzatunkat
                    </Link>.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    7. Jogorvoslat
                  </h2>
                  <p>
                    Ha úgy érzi, hogy az adatkezelés sérti a jogait, panasszal fordulhat:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mt-2">
                    <li>
                      <strong className="text-foreground">Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)</strong><br />
                      Cím: 1055 Budapest, Falk Miksa utca 9-11.<br />
                      Telefon: +36 (1) 391-1400<br />
                      E-mail: ugyfelszolgalat@naih.hu<br />
                      Web: <a href="https://naih.hu" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">naih.hu</a>
                    </li>
                    <li>Bírósághoz fordulhat az Infotv. és a GDPR alapján.</li>
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

export default PrivacyPolicy;
