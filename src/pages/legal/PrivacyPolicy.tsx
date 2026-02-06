import ModernNavigation from "@/components/ModernNavigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLegalContent } from "@/hooks/useLegalContent";
import heroImage from "@/assets/hero-desktop.png";

const PrivacyPolicy = () => {
  const { data: content, isLoading } = useLegalContent("legal_privacy");

  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative h-[35vh] md:h-[40vh] overflow-hidden">
          <img src={heroImage} alt="Kiscsibe Reggeliző" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-6">
              <h1 className="text-3xl md:text-5xl font-sofia font-bold mb-2 animate-fade-in-up">
                {content?.heroTitle || "Adatvédelmi Tájékoztató"}
              </h1>
              <p
                className="text-lg md:text-xl text-gray-200 animate-fade-in-up opacity-0"
                style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
              >
                {content?.heroSubtitle || "Az Ön személyes adatainak védelme fontos számunkra"}
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="pt-12 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6 md:p-10 space-y-8 text-muted-foreground leading-relaxed">
                {isLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : content?.sections ? (
                  <>
                    {content.sections.map((section) => (
                      <section key={section.id}>
                        <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">
                          {section.title}
                        </h2>
                        <div
                          className="prose prose-sm max-w-none text-muted-foreground [&_a]:text-primary [&_a:hover]:underline [&_strong]:text-foreground [&_table]:w-full [&_th]:text-left [&_th]:p-3 [&_th]:text-foreground [&_th]:font-semibold [&_td]:p-3 [&_tr]:border-b [&_tr]:border-border/50 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-2 [&_li>strong]:text-foreground"
                          dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                      </section>
                    ))}
                    {content.lastUpdated && (
                      <div className="border-t border-border pt-6 mt-8">
                        <p className="text-sm text-muted-foreground">
                          Utolsó frissítés: {content.lastUpdated}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Fallback: hardcoded content */
                  <>
                    <section>
                      <h2 className="text-2xl font-sofia font-bold text-foreground mb-4">1. Az adatkezelő</h2>
                      <p>Kiscsibe Reggeliző & Étterem Kft. (székhely: 1145 Budapest, Vezér utca 12.)</p>
                    </section>
                    <div className="border-t border-border pt-6 mt-8">
                      <p className="text-sm text-muted-foreground">Utolsó frissítés: 2026. február 6.</p>
                    </div>
                  </>
                )}
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
