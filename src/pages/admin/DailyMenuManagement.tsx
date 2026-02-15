import AdminLayout from "./AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WeeklyMenuGrid from "@/components/admin/WeeklyMenuGrid";
import CapacityManagement from "@/components/admin/CapacityManagement";
import MasterMenuImport from "@/components/admin/MasterMenuImport";
import WeeklyNewsletterPanel from "@/components/admin/WeeklyNewsletterPanel";
import DailyOfferImageGenerator from "@/components/admin/DailyOfferImageGenerator";
import { useIsMobile } from "@/hooks/use-mobile";
import InfoTip from "@/components/admin/InfoTip";

const DailyMenuManagement = () => {
  const isMobile = useIsMobile();

  return (
    <AdminLayout>
      {/* Page Header Section */}
      <section className="pt-3 sm:pt-6 pb-4">
        <div>
          <h1 className="text-[22px] sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Napi ajánlatok
            <InfoTip text="Állítsd be a heti napi menüsort, kapacitást, és küldd ki a hírlevelet." />
          </h1>
          <p className="mt-1 text-[13px] sm:text-base text-muted-foreground">
            Kezelje a napi ajánlatokat és menüket egy helyen
          </p>
        </div>
      </section>
      
      {/* Content Tabs */}
      <div className="pb-6">
        <Tabs defaultValue="daily" className="w-full">
          <div className="mb-6">
            <TabsList className="!h-10 md:!h-10 !rounded-lg !p-1 !shadow-none !border-0 inline-flex items-center justify-start bg-muted w-auto gap-0">
              <TabsTrigger 
                value="daily" 
                className="!h-8 !px-3 !text-xs sm:!text-sm !whitespace-nowrap !rounded-md data-[state=active]:!bg-background data-[state=active]:!text-foreground data-[state=active]:!shadow-sm data-[state=active]:!scale-100"
              >
                {isMobile ? "Ajánlatok" : "Napi ajánlatok"}
              </TabsTrigger>
              <TabsTrigger 
                value="capacity" 
                className="!h-8 !px-3 !text-xs sm:!text-sm !whitespace-nowrap !rounded-md data-[state=active]:!bg-background data-[state=active]:!text-foreground data-[state=active]:!shadow-sm data-[state=active]:!scale-100"
              >
                Kapacitás
              </TabsTrigger>
              <TabsTrigger 
                value="import" 
                className="!h-8 !px-3 !text-xs sm:!text-sm !whitespace-nowrap !rounded-md data-[state=active]:!bg-background data-[state=active]:!text-foreground data-[state=active]:!shadow-sm data-[state=active]:!scale-100"
              >
                {isMobile ? "Import" : "Excel Import"}
              </TabsTrigger>
              <TabsTrigger 
                value="newsletter" 
                className="!h-8 !px-3 !text-xs sm:!text-sm !whitespace-nowrap !rounded-md data-[state=active]:!bg-background data-[state=active]:!text-foreground data-[state=active]:!shadow-sm data-[state=active]:!scale-100"
              >
                Hírlevél
              </TabsTrigger>
              <TabsTrigger 
                value="facebook" 
                className="!h-8 !px-3 !text-xs sm:!text-sm !whitespace-nowrap !rounded-md data-[state=active]:!bg-background data-[state=active]:!text-foreground data-[state=active]:!shadow-sm data-[state=active]:!scale-100"
              >
                {isMobile ? "Kép" : "Kép generátor"}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="daily" className="mt-0">
            <WeeklyMenuGrid />
          </TabsContent>
          
          <TabsContent value="capacity" className="mt-0">
            <CapacityManagement />
          </TabsContent>
          
          <TabsContent value="import" className="mt-0">
            <MasterMenuImport />
          </TabsContent>

          <TabsContent value="newsletter" className="mt-0">
            <WeeklyNewsletterPanel />
          </TabsContent>

          <TabsContent value="facebook" className="mt-0">
            <DailyOfferImageGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default DailyMenuManagement;