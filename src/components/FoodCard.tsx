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
  variant?: "standard" | "compact";
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
  variant = "standard",
}: FoodCardProps) => {
  const isCompact = variant === "compact";

  return (
    <article
      className={cn(
        "food-frame group flex h-full border-border/55 bg-card/90",
        isCompact
          ? "min-h-[112px] flex-row sm:min-h-[140px]"
          : "min-h-[136px] flex-row sm:flex-col",
        disabled && "opacity-55",
        className,
      )}
    >
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-muted",
        isCompact
          ? "w-[96px] self-stretch border-r border-border/40 sm:w-[112px]"
          : "w-[108px] self-stretch border-r border-border/40 sm:aspect-[16/10] sm:w-full sm:self-auto sm:border-b sm:border-r-0 sm:border-border/40",
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/55 via-card to-background">
          <div
            className={cn(
              "flex items-center justify-center rounded-full border border-primary/20 bg-background/35 shadow-soft backdrop-blur-sm",
                isCompact ? "h-11 w-11" : "h-12 w-12 sm:h-20 sm:w-20",
            )}
          >
            <img
              src={kiscsibeLogo}
              alt=""
              className={cn(
                "object-contain opacity-65",
                isCompact ? "h-6 w-6" : "h-7 w-7 sm:h-12 sm:w-12",
              )}
            />
          </div>
        </div>
      )}
      {badge && <div className={cn("absolute", isCompact ? "left-2 top-2" : "left-3 top-3")}>{badge}</div>}
    </div>

    <div
      className={cn(
        "flex flex-1 flex-col",
        isCompact ? "min-w-0 p-2.5 sm:p-3" : "min-w-0 p-3 sm:p-5",
      )}
    >
      <div className="flex items-start gap-2">
        <h3
          className={cn(
            "min-w-0 flex-1 font-sofia font-bold leading-[1.22] text-card-foreground",
            isCompact
              ? "line-clamp-2 text-[16px] sm:text-[18px]"
              : "line-clamp-2 text-[18px] sm:line-clamp-3 sm:text-[23px]",
          )}
        >
          {name}
        </h3>
        {meta}
      </div>

      {description && (
        <p
          className={cn(
            "leading-relaxed text-muted-foreground",
            isCompact
              ? "mt-1 line-clamp-1 text-[12px] sm:text-[13px]"
              : "mt-1 line-clamp-1 text-[12px] sm:mt-2 sm:line-clamp-2 sm:text-[15px]",
          )}
        >
          {description}
        </p>
      )}

      <div
        className={cn(
          "mt-auto flex items-center justify-between gap-2 border-t border-border/35 pt-2 sm:gap-3",
          !isCompact && "sm:pt-4",
        )}
      >
        <span
          className={cn(
            "font-bold text-foreground/90",
            isCompact
              ? "text-[14px] sm:text-[16px]"
              : "text-[15px] sm:text-[19px]",
          )}
        >
          {priceHuf.toLocaleString("hu-HU")} Ft
        </span>
        <Button
          onClick={onAdd}
          disabled={disabled}
          className={cn(
            "rounded-xl font-bold shadow-warm",
            isCompact
              ? "h-11 min-w-[6.75rem] px-2.5 text-[13px] sm:min-w-[7.25rem] sm:px-3 sm:text-sm"
              : "h-11 min-w-[6.75rem] px-2.5 text-[13px] sm:h-12 sm:min-w-[9.5rem] sm:px-5 sm:text-base",
          )}
        >
          <ShoppingCart
            className={cn("mr-2", isCompact ? "h-4 w-4" : "h-5 w-5")}
          />
          {disabled ? "Elfogyott" : actionLabel}
        </Button>
      </div>
    </div>
    </article>
  );
};

export default FoodCard;
