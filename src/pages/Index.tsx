import SEO from "@/components/SEO";
import ModernNavigation from "@/components/ModernNavigation";
import AlwaysAvailableTeaser from "@/components/sections/AlwaysAvailableTeaser";
import BreakfastSection from "@/components/sections/BreakfastSection";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import HeroSection from "@/components/sections/HeroSection";
import DailyMenuSection from "@/components/sections/DailyMenuSection";
import USPSection from "@/components/sections/USPSection";
import ReviewsSection from "@/components/sections/ReviewsSection";
import GallerySection from "@/components/sections/GallerySection";
import PromoSection from "@/components/sections/PromoSection";
import AllergenSection from "@/components/sections/AllergenSection";
import MapSection from "@/components/sections/MapSection";
import FAQSection from "@/components/sections/FAQSection";
import NewsletterSection from "@/components/sections/NewsletterSection";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Kiscsibe Étterem — Napi menü és online rendelés Zuglóban"
        description="Friss házi reggeli és napi menü Zuglóban. Levesek, főételek, gyors átvétel. Hétfő-péntek 7-16. Rendelj online a Kiscsibe Étteremtől!"
        path="/"
      />
      <ModernNavigation />
      <main id="main-content" className="homepage-editorial pt-[5.25rem] md:pt-24">
        <HeroSection />
        <div className="border-y border-primary/25 bg-editorial py-4 text-editorial-foreground" aria-label="Kiscsibe értékei">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 overflow-hidden px-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] sm:gap-8 sm:text-xs">
             <span>Frissen készül</span><span className="text-primary">•</span><span>Házias adagok</span><span className="hidden text-primary sm:inline">•</span><span className="hidden sm:inline">Zuglóban, hétköznap</span>
          </div>
        </div>
        <div className="editorial-band editorial-band-compact editorial-tone-a">
          <BreakfastSection variant="homepage" />
        </div>
        <div className="editorial-band editorial-tone-b">
          <DailyMenuSection />
        </div>
        <div className="editorial-band editorial-band-compact editorial-tone-a"><AlwaysAvailableTeaser /></div>
        <div className="editorial-band editorial-tone-b"><USPSection /></div>
        <div className="editorial-band editorial-tone-a">
          <ReviewsSection />
        </div>
        <div className="editorial-band editorial-tone-b"><GallerySection /></div>
        <div className="editorial-band editorial-tone-a">
          <PromoSection />
        </div>
        <div className="editorial-band editorial-tone-b"><AllergenSection /></div>
        <div className="editorial-band editorial-tone-a">
          <MapSection />
        </div>
        <div className="editorial-band editorial-tone-b"><FAQSection /></div>
        <div className="editorial-band editorial-tone-a">
          <NewsletterSection />
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
      <AnnouncementPopup />
      
      {/* Mobil sticky CTA-hoz helykitöltés */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
};

export default Index;
