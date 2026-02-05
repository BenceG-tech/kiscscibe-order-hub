import AdminLayout from "./AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import WeeklyPlannerV2 from "@/components/admin/WeeklyPlannerV2";
import CapacityManagement from "@/components/admin/CapacityManagement";
import TemplateManagement from "@/components/admin/TemplateManagement";
import MasterMenuImport from "@/components/admin/MasterMenuImport";
import { useIsMobile } from "@/hooks/use-mobile";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Settings, CalendarDays, BookTemplate } from "lucide-react";

const DailyMenuManagement = () => {
  const isMobile = useIsMobile();

  return (
    <AdminLayout>
      {/* Page Header Section */}
      <section className="pt-3 sm:pt-6 pb-4">
        <div>
          <h1 className="text-[22px] sm:text-3xl font-bold tracking-tight text-foreground">Napi ajánlatok</h1>
          <p className="mt-1 text-[13px] sm:text-base text-muted-foreground">
             Heti menütervező – egyszerűen és gyorsan
          </p>
        </div>
      </section>
      
      {/* Content Tabs */}
      <div className="pb-6">
         <Tabs defaultValue="planner" className="w-full">
          <div className="overflow-x-auto no-scrollbar mb-6">
            <TabsList className="inline-flex h-auto min-w-full sm:w-auto bg-muted p-1">
              <TabsTrigger 
                 value="planner" 
                className="min-h-[36px] px-3 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                 <CalendarDays className="h-4 w-4 mr-1.5" />
                 {isMobile ? "Terv" : "Heti terv"}
              </TabsTrigger>
              <TabsTrigger 
                value="templates" 
                className="min-h-[36px] px-3 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                 <BookTemplate className="h-4 w-4 mr-1.5" />
                Sablonok
              </TabsTrigger>
              <TabsTrigger 
                 value="settings" 
                className="min-h-[36px] px-3 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                 <Settings className="h-4 w-4 mr-1.5" />
                 Beállítások
              </TabsTrigger>
            </TabsList>
          </div>
          
           <TabsContent value="planner" className="mt-0">
             <WeeklyPlannerV2 />
          </TabsContent>
          
          <TabsContent value="templates" className="mt-0">
            <TemplateManagement />
          </TabsContent>
          
           <TabsContent value="settings" className="mt-0">
             <div className="grid gap-6 md:grid-cols-2">
               {/* Capacity Card */}
               <Card>
                 <CardHeader>
                   <CardTitle className="text-lg">Kapacitás kezelés</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <CapacityManagement />
                 </CardContent>
               </Card>
               
               {/* Import Card */}
               <Card>
                 <CardHeader>
                   <CardTitle className="text-lg">Excel Import</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <MasterMenuImport />
                 </CardContent>
               </Card>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default DailyMenuManagement;