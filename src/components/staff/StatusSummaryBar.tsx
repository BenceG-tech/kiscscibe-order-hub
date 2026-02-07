import { cn } from "@/lib/utils";

interface StatusSummaryBarProps {
  newCount: number;
  preparingCount: number;
  readyCount: number;
}

const StatusSummaryBar = ({ newCount, preparingCount, readyCount }: StatusSummaryBarProps) => {
  const items = [
    {
      label: "Új",
      count: newCount,
      bg: "bg-red-500 text-white",
      pulse: newCount > 0,
    },
    {
      label: "Készül",
      count: preparingCount,
      bg: "bg-orange-500 text-white",
      pulse: false,
    },
    {
      label: "Kész",
      count: readyCount,
      bg: "bg-green-600 text-white",
      pulse: false,
    },
  ];

  return (
    <div className="flex items-center gap-2 py-2 px-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all",
            item.bg,
            item.pulse && item.count > 0 && "animate-pulse"
          )}
        >
          <span>{item.count}</span>
          <span className="hidden sm:inline">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default StatusSummaryBar;
