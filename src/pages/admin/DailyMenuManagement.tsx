import AdminLayout from "./AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StreamlinedDailyOffers from "@/components/admin/StreamlinedDailyOffers";
import MenuScheduling from "@/components/admin/MenuScheduling";
import CapacityManagement from "@/components/admin/CapacityManagement";
import TemplateManagement from "@/components/admin/TemplateManagement";
import { useIsMobile } from "@/hooks/use-mobile";

const DailyMenuManagement = () => {
  const isMobile = useIsMobile();

  return (
    <AdminLayout>
      {/* Page Header Section */}
      <section className="pt-3 sm:pt-6 pb-4">
        <div>
          <h1 className="text-[22px] sm:text-3xl font-bold tracking-tight text-foreground">Napi ajánlatok</h1>
          <p className="mt-1 text-[13px] sm:text-base text-muted-foreground">
            Kezelje a napi ajánlatokat és menüket egy helyen
          </p>
        </div>
      </section>
      
      {/* Content Tabs */}
      <div className="pb-6">
        <Tabs defaultValue="daily" className="w-full">
          <div className="overflow-x-auto no-scrollbar mb-6">
            <TabsList className="inline-flex h-auto min-w-full sm:w-auto bg-muted p-1">
              <TabsTrigger 
                value="daily" 
                className="min-h-[36px] px-3 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                {isMobile ? "Ajánlatok" : "Napi ajánlatok"}
              </TabsTrigger>
              <TabsTrigger 
                value="scheduling" 
                className="min-h-[36px] px-3 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Ütemezés
              </TabsTrigger>
              <TabsTrigger 
                value="templates" 
                className="min-h-[36px] px-3 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Sablonok
              </TabsTrigger>
              <TabsTrigger 
                value="capacity" 
                className="min-h-[36px] px-3 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Kapacitás
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="daily" className="mt-0">
            <StreamlinedDailyOffers />
          </TabsContent>
          
          <TabsContent value="scheduling" className="mt-0">
            <MenuScheduling />
          </TabsContent>
          
          <TabsContent value="templates" className="mt-0">
            <TemplateManagement />
          </TabsContent>
          
          <TabsContent value="capacity" className="mt-0">
            <CapacityManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default DailyMenuManagement;