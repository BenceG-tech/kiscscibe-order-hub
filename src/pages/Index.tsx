import ModernNavigation from "@/components/ModernNavigation";
import AlwaysAvailableSection from "@/components/sections/AlwaysAvailableSection";
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
      <ModernNavigation />
      <main className="pt-20">
        <HeroSection />
        <div className="bg-primary/5">
          <DailyMenuSection />
        </div>
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <AlwaysAvailableSection featuredOnly maxItems={6} title="Mindig elérhető kedvenceink" />
          </div>
        </section>
        <USPSection />
        <div className="bg-primary/5">
          <ReviewsSection />
        </div>
        <GallerySection />
        <div className="bg-primary/5">
          <PromoSection />
        </div>
        <AllergenSection />
        <div className="bg-primary/5">
          <MapSection />
        </div>
        <FAQSection />
        <div className="bg-primary/5">
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
