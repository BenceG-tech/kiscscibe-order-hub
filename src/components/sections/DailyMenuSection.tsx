import UnifiedDailySection from "@/components/UnifiedDailySection";

const DailyMenuSection = () => {
  return (
    <section id="napi-ajanlat" className="py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:flex md:items-end md:justify-between">
          <div>
            <span className="section-kicker">A heti tábla</span>
          <h2 className="section-title">
            Mai ajánlatunk
          </h2>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground md:mt-0 md:text-right md:text-base">
            Válassz napot a heti menü megtekintéséhez
          </p>
        </div>
        <UnifiedDailySection />
      </div>
    </section>
  );
};

export default DailyMenuSection;
