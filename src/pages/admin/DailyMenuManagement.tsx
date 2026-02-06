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
          <div className="mb-6">
            <TabsList className="inline-flex h-10 items-center justify-start bg-muted p-1 rounded-lg w-auto">
              <TabsTrigger 
                value="daily" 
                className="h-8 px-3 text-xs sm:text-sm whitespace-nowrap rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                {isMobile ? "Ajánlatok" : "Napi ajánlatok"}
              </TabsTrigger>
              <TabsTrigger 
                value="capacity" 
                className="h-8 px-3 text-xs sm:text-sm whitespace-nowrap rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Kapacitás
              </TabsTrigger>
              <TabsTrigger 
                value="import" 
                className="h-8 px-3 text-xs sm:text-sm whitespace-nowrap rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
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