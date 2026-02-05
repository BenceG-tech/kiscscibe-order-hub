import UnifiedDailySection from "@/components/UnifiedDailySection";

const DailyMenuSection = () => {
  return (
    <section id="napi-ajanlat" className="py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-sofia font-bold text-foreground">
            Mai ajánlatunk
          </h2>
        </div>
        <UnifiedDailySection />
      </div>
    </section>
  );
};

export default DailyMenuSection;
