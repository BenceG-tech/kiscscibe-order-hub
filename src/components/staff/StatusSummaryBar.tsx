import { cn } from "@/lib/utils";

interface StatusSummaryBarProps {
  newCount: number;
  preparingCount: number;
  readyCount: number;
}

const STATUS_ITEMS = [
  {
    label: "Új",
    status: "new",
    scrollTarget: "column-new",
    bg: "bg-red-500 text-white",
  },
  {
    label: "Készül",
    status: "preparing",
    scrollTarget: "column-preparing",
    bg: "bg-orange-500 text-white",
  },
  {
    label: "Kész",
    status: "ready",
    scrollTarget: "column-ready",
    bg: "bg-green-600 text-white",
  },
];

const StatusSummaryBar = ({ newCount, preparingCount, readyCount }: StatusSummaryBarProps) => {
  const counts: Record<string, number> = {
    new: newCount,
    preparing: preparingCount,
    ready: readyCount,
  };

  const handleClick = (scrollTarget: string) => {
    const el = document.getElementById(scrollTarget);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex items-center gap-2 py-2 px-3">
      {STATUS_ITEMS.map((item) => {
        const count = counts[item.status];
        return (
          <button
            key={item.status}
            type="button"
            onClick={() => handleClick(item.scrollTarget)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all",
              "cursor-pointer hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              item.bg,
              item.status === "new" && count > 0 && "animate-pulse"
            )}
          >
            <span>{count}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default StatusSummaryBar;
