import AdminLayout from "./AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WeeklyMenuGrid from "@/components/admin/WeeklyMenuGrid";
import CapacityManagement from "@/components/admin/CapacityManagement";
import MasterMenuImport from "@/components/admin/MasterMenuImport";
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
                value="capacity" 
                className="min-h-[36px] px-3 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Kapacitás
              </TabsTrigger>
              <TabsTrigger 
                value="import" 
                className="min-h-[36px] px-3 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                {isMobile ? "Import" : "Excel Import"}
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
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default DailyMenuManagement;