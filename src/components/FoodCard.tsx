import type { ReactNode } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import kiscsibeLogo from "@/assets/kiscsibe_logo_round.png";

interface FoodCardProps {
  name: string;
  description?: string | null;
  priceHuf: number;
  imageUrl?: string | null;
  onAdd: () => void;
  badge?: ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
  actionLabel?: string;
  className?: string;
}

const FoodCard = ({
  name,
  description,
  priceHuf,
  imageUrl,
  onAdd,
  badge,
  meta,
  disabled = false,
  actionLabel = "Kosárba",
  className,
}: FoodCardProps) => (
  <article
    className={cn(
      "food-frame group flex h-full flex-col border-border/70 bg-card/95",
      disabled && "opacity-55",
      className,
    )}
  >
    <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border/50 bg-muted">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/55 via-card to-background">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-background/35 shadow-soft backdrop-blur-sm">
            <img src={kiscsibeLogo} alt="" className="h-12 w-12 object-contain opacity-65" />
          </div>
        </div>
      )}
      {badge && <div className="absolute left-3 top-3">{badge}</div>}
    </div>

    <div className="flex flex-1 flex-col p-4 sm:p-5">
      <div className="flex items-start gap-2">
        <h3 className="line-clamp-3 min-w-0 flex-1 font-sofia text-[20px] font-bold leading-[1.22] text-card-foreground md:text-[23px]">
          {name}
        </h3>
        {meta}
      </div>

      {description && (
        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">
          {description}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-3 border-t border-border/45 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[18px] font-bold text-foreground/90 md:text-[19px]">
          {priceHuf.toLocaleString("hu-HU")} Ft
        </span>
        <Button
          onClick={onAdd}
          disabled={disabled}
          className="h-12 w-full min-w-[9.5rem] rounded-xl px-5 text-base font-bold shadow-warm sm:w-auto"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {disabled ? "Elfogyott" : actionLabel}
        </Button>
      </div>
    </div>
  </article>
);

export default FoodCard;