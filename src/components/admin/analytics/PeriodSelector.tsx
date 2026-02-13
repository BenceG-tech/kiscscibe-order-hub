import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PeriodPreset, DateRange } from "@/hooks/useAnalyticsData";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

interface PeriodSelectorProps {
  preset: PeriodPreset;
  customRange: DateRange;
  onPresetChange: (preset: PeriodPreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
}

const presets: { key: PeriodPreset; label: string }[] = [
  { key: "today", label: "Ma" },
  { key: "week", label: "Hét" },
  { key: "month", label: "Hónap" },
  { key: "quarter", label: "Negyedév" },
];

const PeriodSelector = ({ preset, customRange, onPresetChange, onCustomRangeChange }: PeriodSelectorProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <Button
          key={p.key}
          variant={preset === p.key ? "default" : "outline"}
          size="sm"
          onClick={() => onPresetChange(p.key)}
        >
          {p.label}
        </Button>
      ))}
      <div className="flex items-center gap-1.5 ml-2">
        <Input
          type="date"
          className="h-8 w-[140px] text-xs"
          value={format(customRange.from, "yyyy-MM-dd")}
          onChange={(e) => {
            const d = new Date(e.target.value);
            if (!isNaN(d.getTime())) {
              onCustomRangeChange({ ...customRange, from: d });
              onPresetChange("custom");
            }
          }}
        />
        <span className="text-muted-foreground text-xs">–</span>
        <Input
          type="date"
          className="h-8 w-[140px] text-xs"
          value={format(customRange.to, "yyyy-MM-dd")}
          onChange={(e) => {
            const d = new Date(e.target.value);
            if (!isNaN(d.getTime())) {
              onCustomRangeChange({ ...customRange, to: d });
              onPresetChange("custom");
            }
          }}
        />
      </div>
    </div>
  );
};

export default PeriodSelector;
