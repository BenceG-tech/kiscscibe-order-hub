interface ExportOrderItem {
  name_snapshot: string;
  qty: number;
}

interface ExportOrder {
  code: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  total_huf: number;
  payment_method: string;
  status: string;
  items?: ExportOrderItem[];
}

const STATUS_MAP: Record<string, string> = {
  new: 'Új',
  preparing: 'Készítés alatt',
  ready: 'Kész',
  completed: 'Átvéve',
  cancelled: 'Lemondva',
};

const escapeCSV = (value: string): string => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const exportOrdersToCSV = (orders: ExportOrder[]) => {
  const header = 'Rendelésszám,Dátum,Név,Telefon,Email,Tételek,Összeg (Ft),Fizetés,Státusz';

  const rows = orders.map((order) => {
    const date = new Date(order.created_at).toLocaleString('hu-HU');
    const items = (order.items || [])
      .map((i) => `${i.name_snapshot} x${i.qty}`)
      .join('; ');
    const payment = order.payment_method === 'cash' ? 'Készpénz' : 'Kártya';
    const status = STATUS_MAP[order.status] || order.status;

    return [
      escapeCSV(order.code),
      escapeCSV(date),
      escapeCSV(order.name),
      escapeCSV(order.phone),
      escapeCSV(order.email || ''),
      escapeCSV(items),
      String(order.total_huf),
      payment,
      status,
    ].join(',');
  });

  const csv = '\uFEFF' + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const today = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `kiscsibe-rendelesek-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
