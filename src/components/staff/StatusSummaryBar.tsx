import { cn } from "@/lib/utils";

type TabStatus = "new" | "preparing" | "ready";

interface StatusSummaryBarProps {
  newCount: number;
  preparingCount: number;
  readyCount: number;
  activeTab?: TabStatus;
  onTabChange?: (tab: TabStatus) => void;
}

const STATUS_ITEMS: { label: string; status: TabStatus; bg: string }[] = [
  { label: "Új", status: "new", bg: "bg-red-500 text-white" },
  { label: "Készül", status: "preparing", bg: "bg-orange-500 text-white" },
  { label: "Kész", status: "ready", bg: "bg-green-600 text-white" },
];

const StatusSummaryBar = ({
  newCount,
  preparingCount,
  readyCount,
  activeTab,
  onTabChange,
}: StatusSummaryBarProps) => {
  const counts: Record<string, number> = {
    new: newCount,
    preparing: preparingCount,
    ready: readyCount,
  };

  const handleClick = (status: TabStatus) => {
    if (onTabChange) {
      onTabChange(status);
    } else {
      // Fallback: scroll to column
      const el = document.getElementById(`column-${status}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex items-center gap-2 py-2 px-3">
      {STATUS_ITEMS.map((item) => {
        const count = counts[item.status];
        const isActive = activeTab === item.status;
        return (
          <button
            key={item.status}
            type="button"
            onClick={() => handleClick(item.status)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all",
              "cursor-pointer hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              item.bg,
              isActive && "ring-2 ring-offset-2 ring-foreground/50 scale-105",
              item.status === "new" && count > 0 && "animate-pulse"
            )}
          >
            <span>{count}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default StatusSummaryBar;
