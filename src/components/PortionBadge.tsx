interface PortionBadgeProps {
  size?: number | string | null;
  unit?: string | null;
  className?: string;
}

/**
 * Small inline label showing the portion size of a menu item.
 * Renders nothing when no size is provided.
 */
export function PortionBadge({ size, unit, className }: PortionBadgeProps) {
  if (size === null || size === undefined || size === "") return null;
  const num = typeof size === "number" ? size : Number(size);
  if (!Number.isFinite(num) || num <= 0) return null;

  // Strip trailing .0 (e.g. 25.0 -> 25)
  const formatted = Number.isInteger(num) ? num.toString() : num.toString().replace(/\.?0+$/, "");
  const u = unit && unit.trim() !== "" ? unit : "dkg";

  return (
    <span
      className={
        "inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground " +
        (className ?? "")
      }
    >
      {formatted} {u}
    </span>
  );
}

export default PortionBadge;
