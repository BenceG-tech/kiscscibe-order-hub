import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import type { InvoiceFilters as Filters } from "@/hooks/useInvoices";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const CATEGORIES = [
  { value: "all", label: "Mind" },
  { value: "ingredient", label: "Alapanyagok" },
  { value: "utility", label: "Rezsi" },
  { value: "rent", label: "Bérleti díj" },
  { value: "equipment", label: "Felszerelés" },
  { value: "salary", label: "Bér" },
  { value: "tax", label: "Adó" },
  { value: "food_sale", label: "Étel értékesítés" },
  { value: "other", label: "Egyéb" },
];

const InvoiceFilters = ({ filters, onChange }: Props) => {
  const set = (key: keyof Filters, val: string) =>
    onChange({ ...filters, [key]: val });

  const setMonth = (monthsAgo: number) => {
    const target = subMonths(new Date(), monthsAgo);
    onChange({
      ...filters,
      dateFrom: format(startOfMonth(target), "yyyy-MM-dd"),
      dateTo: format(endOfMonth(target), "yyyy-MM-dd"),
    });
  };

  const clearDates = () => {
    onChange({ ...filters, dateFrom: "", dateTo: "" });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Select value={filters.type || "all"} onValueChange={(v) => set("type", v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Típus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mind</SelectItem>
            <SelectItem value="incoming">Bejövő</SelectItem>
            <SelectItem value="outgoing">Kimenő</SelectItem>
            <SelectItem value="order_receipt">Rendelés</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status || "all"} onValueChange={(v) => set("status", v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Státusz" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mind</SelectItem>
            <SelectItem value="draft">Piszkozat</SelectItem>
            <SelectItem value="pending">Függőben</SelectItem>
            <SelectItem value="paid">Fizetve</SelectItem>
            <SelectItem value="overdue">Lejárt</SelectItem>
            <SelectItem value="cancelled">Sztornó</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.category || "all"} onValueChange={(v) => set("category", v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Kategória" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="w-[180px]"
          placeholder="🔍 Partner keresés..."
          value={filters.search || ""}
          onChange={(e) => set("search", e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setMonth(0)} className="text-xs h-7">
          Ez a hónap
        </Button>
        <Button variant="outline" size="sm" onClick={() => setMonth(1)} className="text-xs h-7">
          Előző hónap
        </Button>
        <Input
          type="date"
          className="w-[140px] h-7 text-xs"
          value={filters.dateFrom || ""}
          onChange={(e) => set("dateFrom", e.target.value)}
          placeholder="Dátumtól"
        />
        <Input
          type="date"
          className="w-[140px] h-7 text-xs"
          value={filters.dateTo || ""}
          onChange={(e) => set("dateTo", e.target.value)}
          placeholder="Dátumig"
        />
        {(filters.dateFrom || filters.dateTo) && (
          <Button variant="ghost" size="sm" onClick={clearDates} className="text-xs h-7 text-muted-foreground">
            ✕ Törlés
          </Button>
        )}
      </div>
    </div>
  );
};

export default InvoiceFilters;
