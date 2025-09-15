import AdminLayout from "./AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UnifiedDailyManagement from "@/components/admin/UnifiedDailyManagement";
import MenuScheduling from "@/components/admin/MenuScheduling";
import CapacityManagement from "@/components/admin/CapacityManagement";
import { useIsMobile } from "@/hooks/use-mobile";

const DailyMenuManagement = () => {
  const isMobile = useIsMobile();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Napi ajánlatok és menük</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Kezelje a napi ajánlatokat, ütemezést és kapacitást
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className={`grid w-full grid-cols-3 ${isMobile ? 'h-auto' : 'h-10'}`}>
            <TabsTrigger 
              value="daily" 
              className={`${isMobile ? 'text-xs py-3 px-2' : 'text-sm'} data-[state=active]:bg-primary data-[state=active]:text-primary-foreground`}
            >
              Napi menü
            </TabsTrigger>
            <TabsTrigger 
              value="scheduling" 
              className={`${isMobile ? 'text-xs py-3 px-2' : 'text-sm'} data-[state=active]:bg-primary data-[state=active]:text-primary-foreground`}
            >
              Ütemezés
            </TabsTrigger>
            <TabsTrigger 
              value="capacity" 
              className={`${isMobile ? 'text-xs py-3 px-2' : 'text-sm'} data-[state=active]:bg-primary data-[state=active]:text-primary-foreground`}
            >
              Kapacitás
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="mt-6">
            <UnifiedDailyManagement />
          </TabsContent>
          
          <TabsContent value="scheduling" className="mt-6">
            <MenuScheduling />
          </TabsContent>
          
          <TabsContent value="capacity" className="mt-6">
            <CapacityManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default DailyMenuManagement;