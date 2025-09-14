import UnifiedDailySection from "@/components/UnifiedDailySection";

const DailyMenuSection = () => {
  return (
    <section id="napi-ajanlat" className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Napi ajánlataink
          </h2>
          <p className="text-muted-foreground text-lg">
            Válassz napot és tekintsd meg a napi menüt
          </p>
        </div>
        <UnifiedDailySection />
      </div>
    </section>
  );
};

export default DailyMenuSection;