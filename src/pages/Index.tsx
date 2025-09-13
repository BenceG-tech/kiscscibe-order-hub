import Navigation from "@/components/Navigation";
import TopOrderBar from "@/components/TopOrderBar";
import HeroSection from "@/components/sections/HeroSection";
import DailyMenuSection from "@/components/sections/DailyMenuSection";
import FavoritesSection from "@/components/sections/FavoritesSection";
import WeeklyMenuSection from "@/components/sections/WeeklyMenuSection";
import USPSection from "@/components/sections/USPSection";
import ReviewsSection from "@/components/sections/ReviewsSection";
import GallerySection from "@/components/sections/GallerySection";
import PromoSection from "@/components/sections/PromoSection";
import AllergenSection from "@/components/sections/AllergenSection";
import MapSection from "@/components/sections/MapSection";
import FAQSection from "@/components/sections/FAQSection";
import NewsletterSection from "@/components/sections/NewsletterSection";
import StickyMobileCTA from "@/components/StickyMobileCTA";


const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <TopOrderBar />
      <main>
        <HeroSection />
        <DailyMenuSection />
        <FavoritesSection />
        <WeeklyMenuSection />
        <USPSection />
        <ReviewsSection />
        <GallerySection />
        <PromoSection />
        <AllergenSection />
        <MapSection />
        <FAQSection />
        <NewsletterSection />
      </main>
      <StickyMobileCTA />
      
      {/* Mobil sticky CTA-hoz helykitöltés */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
};

export default Index;
