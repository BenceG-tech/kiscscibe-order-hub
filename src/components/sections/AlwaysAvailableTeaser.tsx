import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Package } from "lucide-react";
import kiscsibeLogo from "@/assets/kiscsibe_logo_round.png";

interface PreviewItem {
  id: string;
  name: string;
  image_url: string | null;
}

const AlwaysAvailableTeaser = () => {
  const { data } = useQuery({
    queryKey: ["always-available-teaser"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, image_url, is_featured")
        .eq("is_active", true)
        .eq("is_always_available", true)
        .order("is_featured", { ascending: false })
        .order("display_order")
        .limit(50);
      if (error) throw error;
      return (data || []) as (PreviewItem & { is_featured: boolean })[];
    },
  });

  if (!data || data.length === 0) return null;

  const withImages = data.filter((i) => i.image_url).slice(0, 4);
  const previews: PreviewItem[] = withImages.length > 0 ? withImages : data.slice(0, 4);
  const remaining = Math.max(0, data.length - previews.length);

  return (
    <section className="py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/etlap#mindig-elerheto"
          className="group relative block overflow-hidden rounded-2xl border border-primary-foreground/25 bg-primary-foreground/[0.04] text-primary-foreground shadow-soft backdrop-blur-sm transition-[transform,background-color,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-primary-foreground/40 hover:bg-primary-foreground/10 hover:shadow-lg"
          aria-label="Mindig elérhető tételek megtekintése"
        >
          <div className="relative flex items-center gap-4 p-4 sm:p-5">
            {/* Icon */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-soft">
              <Package className="h-6 w-6" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
               <h3 className="font-sofia font-bold text-lg sm:text-xl leading-tight text-primary-foreground">
                Mindig elérhető kedvenceink
              </h3>
               <p className="text-xs sm:text-sm text-primary-foreground/75 mt-0.5 line-clamp-2">
                Italok, reggeli, savanyúságok és további fix tételek — bármikor rendelhetők
              </p>
            </div>

            {/* Food collage preview */}
            <div className="hidden sm:flex items-center -space-x-4 shrink-0 pr-2">
              {previews.map((item) => (
                <div
                  key={item.id}
                    className="h-16 w-16 overflow-hidden rounded-xl border-2 border-primary bg-muted shadow-md transition-transform duration-300 even:translate-y-1 group-hover:translate-y-0"
                  title={item.name}
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <img
                      src={kiscsibeLogo}
                      alt=""
                      className="w-full h-full object-contain p-1 opacity-70"
                    />
                  )}
                </div>
              ))}
              {remaining > 0 && (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-card bg-primary text-xs font-bold text-primary-foreground shadow-md">
                  +{remaining}
                </div>
              )}
            </div>

            {/* Arrow */}
            <ArrowRight className="shrink-0 h-5 w-5 text-primary-foreground group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Mobile preview row */}
          <div className="flex sm:hidden items-center justify-center gap-2 pb-4 -mt-1">
            <div className="flex items-center -space-x-2">
              {previews.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="h-8 w-8 rounded-full border-2 border-card bg-muted overflow-hidden shadow"
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <img src={kiscsibeLogo} alt="" className="w-full h-full object-contain p-0.5 opacity-70" />
                  )}
                </div>
              ))}
              {remaining > 0 && (
                <div className="h-8 w-8 rounded-full border-2 border-card bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow">
                  +{remaining}
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default AlwaysAvailableTeaser;
