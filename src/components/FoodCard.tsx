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
        "food-frame group flex h-full border-border/70 bg-card/95",
        isCompact ? "min-h-[104px] flex-row sm:min-h-[148px]" : "flex-col",
        disabled && "opacity-55",
        className,
      )}
    >
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-muted",
        isCompact
          ? "w-[104px] self-stretch border-r border-border/50 sm:w-[116px]"
          : "aspect-[16/10] w-full border-b border-border/50",
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
              isCompact ? "h-12 w-12" : "h-20 w-20",
            )}
          >
            <img
              src={kiscsibeLogo}
              alt=""
              className={cn(
                "object-contain opacity-65",
                isCompact ? "h-7 w-7" : "h-12 w-12",
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
        isCompact ? "min-w-0 p-2.5 sm:p-3" : "p-4 sm:p-5",
      )}
    >
      <div className="flex items-start gap-2">
        <h3
          className={cn(
            "min-w-0 flex-1 font-sofia font-bold leading-[1.22] text-card-foreground",
            isCompact
              ? "line-clamp-2 text-[17px] md:text-[18px]"
              : "line-clamp-3 text-[20px] md:text-[23px]",
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
              ? "mt-1 line-clamp-1 text-[12px] md:text-[13px]"
              : "mt-2 line-clamp-2 text-[14px] md:text-[15px]",
          )}
        >
          {description}
        </p>
      )}

      <div
        className={cn(
          "mt-auto flex gap-3 border-t border-border/45 pt-4 sm:flex-row sm:items-center sm:justify-between",
          isCompact ? "items-center justify-between gap-2 pt-2" : "flex-col",
        )}
      >
        <span
          className={cn(
            "font-bold text-foreground/90",
            isCompact
              ? "text-[15px] md:text-[16px]"
              : "text-[18px] md:text-[19px]",
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
              ? "h-11 min-w-[7.25rem] px-3 text-sm"
              : "h-12 min-w-[9.5rem] px-5 text-base",
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
