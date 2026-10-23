export type EmailStatusSummary = {
  admin: "sent" | "partial" | "failed" | "pending";
  customer: "sent" | "failed" | "skipped" | "pending";
  lastAt?: string;
};

export type EmailLogRow = {
  order_id: string | null;
  email_type: string;
  status: string;
  created_at: string;
  recipient?: string | null;
};

export const ADMIN_EXPECTED_RECIPIENTS = ["info@kiscsibeetterem.hu"];

/**
 * Order-independent aggregation. Per (order, admin recipient) a later accepted send
 * supersedes an older failure; latest timestamp wins. Admin is "sent" only when every
 * expected recipient's latest state is sent.
 */
export function aggregateEmailLogs(rows: EmailLogRow[]): Map<string, EmailStatusSummary> {
  type Latest = { status: string; at: string };
  const admin = new Map<string, Map<string, Latest>>();
  const customer = new Map<string, Latest>();
  const lastAt = new Map<string, string>();
  const newer = (prev: Latest | undefined, row: EmailLogRow) => !prev || row.created_at >= prev.at;

  for (const row of rows) {
    if (!row.order_id) continue;
    const id = row.order_id;
    if (!lastAt.has(id) || row.created_at > lastAt.get(id)!) lastAt.set(id, row.created_at);
    if (row.email_type === "admin_notification") {
      const rcpt = String(row.recipient ?? "").trim().toLowerCase();
      if (!rcpt) continue;
      const m = admin.get(id) ?? new Map<string, Latest>();
      if (newer(m.get(rcpt), row)) m.set(rcpt, { status: row.status, at: row.created_at });
      admin.set(id, m);
    } else if (row.email_type === "customer_confirmation") {
      if (newer(customer.get(id), row)) customer.set(id, { status: row.status, at: row.created_at });
    }
  }

  const out = new Map<string, EmailStatusSummary>();
  for (const [id, at] of lastAt) {
    const m = admin.get(id);
    const states = ADMIN_EXPECTED_RECIPIENTS.map((r) => m?.get(r)?.status);
    const sentCount = states.filter((s) => s === "sent").length;
    const anyFailed = states.some((s) => s === "failed");
    const adminState: EmailStatusSummary["admin"] =
      sentCount === ADMIN_EXPECTED_RECIPIENTS.length ? "sent"
      : sentCount > 0 ? "partial"
      : anyFailed ? "failed"
      : "pending";
    const c = customer.get(id)?.status;
    const customerState: EmailStatusSummary["customer"] =
      c === "sent" || c === "failed" || c === "skipped" ? c : "pending";
    out.set(id, { admin: adminState, customer: customerState, lastAt: at });
  }
  return out;
}
