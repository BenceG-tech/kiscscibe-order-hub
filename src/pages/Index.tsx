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
      <main id="main-content" className="homepage-editorial pt-20">
        <HeroSection />
        <div className="gingham-strip marquee-gingham h-3 border-y border-border/40" aria-hidden="true" />
        <div className="editorial-band editorial-band-compact">
          <BreakfastSection variant="homepage" />
        </div>
        <div className="editorial-band bg-secondary/30">
          <DailyMenuSection />
        </div>
        <div className="editorial-band editorial-band-compact"><AlwaysAvailableTeaser /></div>
        <div className="editorial-band bg-editorial text-editorial-foreground"><USPSection /></div>
        <div className="editorial-band bg-secondary/30">
          <ReviewsSection />
        </div>
        <div className="editorial-band"><GallerySection /></div>
        <div className="editorial-band bg-secondary/30">
          <PromoSection />
        </div>
        <div className="editorial-band"><AllergenSection /></div>
        <div className="editorial-band bg-secondary/30">
          <MapSection />
        </div>
        <div className="editorial-band"><FAQSection /></div>
        <div className="editorial-band bg-editorial text-editorial-foreground">
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
