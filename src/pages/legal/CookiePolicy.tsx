import ModernNavigation from "@/components/ModernNavigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-desktop.png";

const CookiePolicy = () => {
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
                Süti (Cookie) Szabályzat
              </h1>
              <p
                className="text-lg md:text-xl text-gray-200 animate-fade-in-up opacity-0"
                style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
              >
                Tájékoztató a sütik használatáról
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
                    1. Mi az a süti (cookie)?
                  </h2>
                  <p>
                    A süti (cookie) egy kis szöveges fájl, amelyet a weboldal az Ön böngészőjében helyez el.
                    A sütik segítségével a weboldal megjegyzi az Ön beállításait és biztosítja a megfelelő működést.
                  </p>
                  <p className="mt-2">
                    Weboldalunk a hagyományos süti fájlok mellett helyi tárolást (localStorage) is használ
                    hasonló célokra.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    2. Milyen sütiket használunk?
                  </h2>

                  <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                    2.1. Szükséges (elengedhetetlen) sütik
                  </h3>
                  <p className="mb-3">
                    Ezek a sütik a weboldal alapvető működéséhez szükségesek, és nem kapcsolhatók ki.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 text-foreground font-semibold">Név</th>
                          <th className="text-left p-3 text-foreground font-semibold">Típus</th>
                          <th className="text-left p-3 text-foreground font-semibold">Cél</th>
                          <th className="text-left p-3 text-foreground font-semibold">Élettartam</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="p-3 font-mono text-xs">sb-*-auth-token</td>
                          <td className="p-3">localStorage</td>
                          <td className="p-3">Supabase felhasználói azonosítás (bejelentkezés)</td>
                          <td className="p-3">Session / böngésző bezárásig</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-3 font-mono text-xs">cookie-consent</td>
                          <td className="p-3">localStorage</td>
                          <td className="p-3">Süti hozzájárulás állapotának megjegyzése</td>
                          <td className="p-3">Állandó (amíg nem törlik)</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-3 font-mono text-xs">theme</td>
                          <td className="p-3">localStorage</td>
                          <td className="p-3">Sötét/világos téma beállítás</td>
                          <td className="p-3">Állandó (amíg nem törlik)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-xs">cart-items</td>
                          <td className="p-3">Memória (state)</td>
                          <td className="p-3">Kosár tartalmának ideiglenes tárolása</td>
                          <td className="p-3">Oldal bezárásáig</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                    2.2. Opcionális / analitikai sütik
                  </h3>
                  <p>
                    Jelenleg weboldalunk <strong className="text-foreground">nem használ</strong> analitikai
                    vagy marketing célú sütiket (pl. Google Analytics, Facebook Pixel). Amennyiben ez a jövőben
                    változna, jelen szabályzatot frissítjük, és újbóli hozzájárulást kérünk.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    3. Hogyan kezelheti a sütiket?
                  </h2>
                  <p>
                    A böngészője beállításaiban bármikor törölheti a tárolt sütiket és helyi adatokat.
                    A legtöbb böngészőben a beállítások között találja meg ezeket:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mt-3">
                    <li><strong className="text-foreground">Chrome:</strong> Beállítások → Adatvédelem és biztonság → Cookie-k és egyéb webhelyadatok</li>
                    <li><strong className="text-foreground">Firefox:</strong> Beállítások → Adatvédelem és biztonság → Cookie-k és webhelyadatok</li>
                    <li><strong className="text-foreground">Safari:</strong> Beállítások → Adatvédelem → Webhelyadatok kezelése</li>
                    <li><strong className="text-foreground">Edge:</strong> Beállítások → Cookie-k és webhelyengedélyek</li>
                  </ul>
                  <p className="mt-3">
                    <strong className="text-foreground">Figyelem:</strong> A szükséges sütik törlése esetén
                    egyes funkciók (pl. bejelentkezés) nem fognak megfelelően működni.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                    4. További információ
                  </h2>
                  <p>
                    Az adatkezelés részleteiről az{" "}
                    <Link to="/adatvedelem" className="text-primary hover:underline">
                      Adatvédelmi Tájékoztatónkban
                    </Link>{" "}
                    tájékozódhat. Kérdés esetén írjon a{" "}
                    <a href="mailto:kiscsibeetterem@gmail.com" className="text-primary hover:underline">
                      kiscsibeetterem@gmail.com
                    </a>{" "}
                    címre.
                  </p>
                </section>

                <div className="border-t border-border pt-6 mt-8">
                  <p className="text-sm text-muted-foreground">
                    Utolsó frissítés: 2026. február 6.
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

export default CookiePolicy;
