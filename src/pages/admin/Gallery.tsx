import AdminLayout from "./AdminLayout";
import GalleryManagement from "@/components/admin/GalleryManagement";
import InfoTip from "@/components/admin/InfoTip";

const Gallery = () => {
  return (
    <AdminLayout>
      {/* Page Header Section */}
      <section className="pt-3 sm:pt-6 pb-4">
        <div>
          <h1 className="text-[22px] sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Galéria
            <InfoTip text="Töltsd fel és kezeld a főoldali galériában megjelenő képeket." />
          </h1>
          <p className="mt-1 text-[13px] sm:text-base text-muted-foreground">
            Kezelje a főoldali galéria képeit
          </p>
        </div>
      </section>
      
      {/* Gallery Management */}
      <div className="pb-6">
        <GalleryManagement />
      </div>
    </AdminLayout>
  );
};

export default Gallery;
