import { useYearlyInvoiceData } from "@/hooks/useYearlyInvoiceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

const MONTH_LABELS = ["Jan", "Feb", "Már", "Ápr", "Máj", "Jún", "Júl", "Aug", "Sze", "Okt", "Nov", "Dec"];

const fmt = (n: number) => `${(n / 1000).toFixed(0)}k`;
const fmtFull = (n: number) => `${n.toLocaleString("hu-HU")} Ft`;

const YearlyComparisonTab = () => {
  const { data, isLoading } = useYearlyInvoiceData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const chartData = MONTH_LABELS.map((label, i) => ({
    month: label,
    [`Bevétel ${data.currentYear}`]: data.current[i].income,
    [`Bevétel ${data.prevYear}`]: data.previous[i].income,
    [`Kiadás ${data.currentYear}`]: data.current[i].expense,
    [`Kiadás ${data.prevYear}`]: data.previous[i].expense,
  }));

  const tableData = MONTH_LABELS.map((label, i) => {
    const cur = data.current[i];
    const prev = data.previous[i];
    const incomeChange = prev.income > 0 ? Math.round(((cur.income - prev.income) / prev.income) * 100) : null;
    const expenseChange = prev.expense > 0 ? Math.round(((cur.expense - prev.expense) / prev.expense) * 100) : null;
    return { label, cur, prev, incomeChange, expenseChange };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bevétel összehasonlítás — {data.prevYear} vs {data.currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => fmtFull(v)} />
              <Legend />
              <Line type="monotone" dataKey={`Bevétel ${data.currentYear}`} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey={`Bevétel ${data.prevYear}`} stroke="hsl(var(--primary))" strokeWidth={1} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey={`Kiadás ${data.currentYear}`} stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey={`Kiadás ${data.prevYear}`} stroke="hsl(var(--destructive))" strokeWidth={1} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Havi bontás</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Hónap</th>
                <th className="text-right py-2 px-2">Bevétel {data.currentYear}</th>
                <th className="text-right py-2 px-2">Bevétel {data.prevYear}</th>
                <th className="text-right py-2 px-2">Változás</th>
                <th className="text-right py-2 px-2">Eredmény {data.currentYear}</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.label} className="border-b last:border-0">
                  <td className="py-1.5 px-2 font-medium">{row.label}</td>
                  <td className="text-right py-1.5 px-2">{fmtFull(row.cur.income)}</td>
                  <td className="text-right py-1.5 px-2 text-muted-foreground">{fmtFull(row.prev.income)}</td>
                  <td className={`text-right py-1.5 px-2 font-medium ${row.incomeChange !== null && row.incomeChange >= 0 ? "text-green-600" : "text-destructive"}`}>
                    {row.incomeChange !== null ? `${row.incomeChange > 0 ? "+" : ""}${row.incomeChange}%` : "–"}
                  </td>
                  <td className={`text-right py-1.5 px-2 font-semibold ${row.cur.result >= 0 ? "text-green-600" : "text-destructive"}`}>
                    {fmtFull(row.cur.result)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default YearlyComparisonTab;
