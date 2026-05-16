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
          className="group relative block overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg hover:shadow-xl hover:border-primary/60 hover:-translate-y-0.5 transition-all duration-300"
          aria-label="Mindig elérhető tételek megtekintése"
        >
          {/* Subtle gold accent glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-4 p-4 sm:p-5">
            {/* Icon */}
            <div className="shrink-0 h-12 w-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center ring-1 ring-primary/30">
              <Package className="h-6 w-6" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="font-sofia font-bold text-base sm:text-lg leading-tight text-foreground">
                Mindig elérhető kedvenceink
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                Italok, reggeli, savanyúságok és további fix tételek — bármikor rendelhetők
              </p>
            </div>

            {/* Avatar stack preview */}
            <div className="hidden sm:flex items-center -space-x-3 shrink-0">
              {previews.map((item) => (
                <div
                  key={item.id}
                  className="h-11 w-11 rounded-full border-2 border-card bg-muted overflow-hidden shadow-md"
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
                <div className="h-11 w-11 rounded-full border-2 border-card bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-md">
                  +{remaining}
                </div>
              )}
            </div>

            {/* Arrow */}
            <ArrowRight className="shrink-0 h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
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
