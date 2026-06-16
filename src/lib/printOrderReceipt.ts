interface OrderItemOption {
  id: string;
  label_snapshot: string;
  option_type: string | null;
  price_delta_huf: number;
}

interface OrderItem {
  id: string;
  name_snapshot: string;
  qty: number;
  unit_price_huf: number;
  line_total_huf: number;
  options?: OrderItemOption[];
}

interface PrintableOrder {
  code: string;
  name: string;
  phone: string;
  email?: string | null;
  total_huf: number;
  payment_method: string;
  pickup_time?: string | null;
  created_at: string;
  notes?: string | null;
  items?: OrderItem[];
  coupon_code?: string | null;
  discount_huf?: number | null;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );

const fmtTime = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("hu-HU", {
      timeZone: "Europe/Budapest",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export function printOrderReceipt(order: PrintableOrder) {
  const itemsHtml = (order.items || [])
    .map((item) => {
      const opts = (item.options || [])
        .filter((o) => o.option_type !== "daily_meta")
        .map(
          (o) =>
            `<div class="opt">↳ ${escapeHtml(o.label_snapshot)}${
              o.price_delta_huf ? ` (${o.price_delta_huf > 0 ? "+" : ""}${o.price_delta_huf} Ft)` : ""
            }</div>`
        )
        .join("");
      return `
        <div class="item">
          <div class="row">
            <span class="name"><strong>${item.qty}×</strong> ${escapeHtml(item.name_snapshot)}</span>
            <span class="price">${item.line_total_huf.toLocaleString("hu-HU")} Ft</span>
          </div>
          ${opts}
        </div>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="utf-8" />
<title>Rendelés #${escapeHtml(order.code)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    width: 72mm;
    margin: 0 auto;
    padding: 4mm 0;
    color: #000;
    font-size: 12px;
    line-height: 1.35;
  }
  .center { text-align: center; }
  .big { font-size: 18px; font-weight: bold; }
  .xl { font-size: 22px; font-weight: bold; letter-spacing: 2px; }
  .hr { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 6px; }
  .item { margin-bottom: 6px; }
  .item .name { flex: 1; }
  .opt { padding-left: 12px; font-size: 11px; color: #333; }
  .total { font-size: 16px; font-weight: bold; }
  .notes {
    border: 1px solid #000;
    padding: 4px;
    margin-top: 6px;
    font-size: 12px;
    font-weight: bold;
  }
  .coupon { color: #006400; font-weight: bold; }
  @media screen {
    body { box-shadow: 0 0 10px rgba(0,0,0,.2); margin: 20px auto; padding: 10mm; }
  }
</style>
</head>
<body>
  <div class="center big">KISCSIBE ÉTTEREM</div>
  <div class="center">Konyhai bizonylat</div>
  <div class="hr"></div>
  <div class="center xl">#${escapeHtml(order.code)}</div>
  <div class="hr"></div>
  <div class="row"><span>Vendég:</span><strong>${escapeHtml(order.name)}</strong></div>
  <div class="row"><span>Telefon:</span><span>${escapeHtml(order.phone)}</span></div>
  ${order.email ? `<div class="row"><span>Email:</span><span>${escapeHtml(order.email)}</span></div>` : ""}
  <div class="row"><span>Átvétel:</span><strong>${fmtTime(order.pickup_time)}</strong></div>
  <div class="row"><span>Leadva:</span><span>${fmtTime(order.created_at)}</span></div>
  <div class="row"><span>Fizetés:</span><strong>${order.payment_method === "cash" ? "Készpénz" : "Kártya"}</strong></div>
  <div class="hr"></div>
  ${itemsHtml || '<div class="center">Nincsenek tételek</div>'}
  <div class="hr"></div>
  ${
    order.coupon_code && order.discount_huf
      ? `<div class="row coupon"><span>Kupon ${escapeHtml(order.coupon_code)}:</span><span>-${order.discount_huf.toLocaleString("hu-HU")} Ft</span></div>`
      : ""
  }
  <div class="row total"><span>ÖSSZESEN:</span><span>${order.total_huf.toLocaleString("hu-HU")} Ft</span></div>
  ${order.notes ? `<div class="notes">Megjegyzés: ${escapeHtml(order.notes)}</div>` : ""}
  <div class="hr"></div>
  <div class="center" style="font-size:10px;">${new Date().toLocaleString("hu-HU", { timeZone: "Europe/Budapest" })}</div>
<script>
  window.addEventListener('load', function() {
    setTimeout(function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    }, 200);
  });
</script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=420,height=720");
  if (!w) {
    alert("Engedélyezd a felugró ablakokat a nyomtatáshoz.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
