import AdminLayout from "./AdminLayout";
import UnifiedDailyManagement from "@/components/admin/UnifiedDailyManagement";

const DailyMenuManagement = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Napi ajánlatok és menük</h1>
            <p className="text-muted-foreground mt-1">
              Kezelje a napi ajánlatokat és menüket egy helyen
            </p>
          </div>
        </div>
        
        <UnifiedDailyManagement />
      </div>
    </AdminLayout>
  );
};

export default DailyMenuManagement;