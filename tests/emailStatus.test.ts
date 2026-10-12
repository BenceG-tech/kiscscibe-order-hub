import { describe, expect, it } from "bun:test";
import { aggregateEmailLogs } from "../src/lib/emailLogAggregate";
import { interpretStatusEmailResponse } from "../src/lib/statusEmail";

const INFO = "info@kiscsibeetterem.hu";
const OWNER = "gataibence@gmail.com";
const row = (recipient: string, status: string, at: string, type = "admin_notification") =>
  ({ order_id: "o1", email_type: type, recipient, status, created_at: `2026-10-12T10:00:${at}Z` });

describe("aggregateEmailLogs", () => {
  it("one sent recipient only is partial, not full success", () => {
    expect(aggregateEmailLogs([row(INFO, "sent", "01")]).get("o1")!.admin).toBe("partial");
  });
  it("both accepted is sent", () => {
    expect(aggregateEmailLogs([row(OWNER, "sent", "02"), row(INFO, "sent", "01")]).get("o1")!.admin).toBe("sent");
  });
  it("later retry supersedes older failure regardless of input order", () => {
    const logs = [row(INFO, "sent", "05"), row(OWNER, "sent", "06"), row(INFO, "failed", "01"), row(OWNER, "failed", "02")];
    expect(aggregateEmailLogs(logs).get("o1")!.admin).toBe("sent");
    expect(aggregateEmailLogs([...logs].reverse()).get("o1")!.admin).toBe("sent");
  });
  it("all failed is failed; missing all is pending", () => {
    expect(aggregateEmailLogs([row(INFO, "failed", "01"), row(OWNER, "failed", "02")]).get("o1")!.admin).toBe("failed");
    expect(aggregateEmailLogs([row("", "skipped", "01", "customer_confirmation")]).get("o1")!.admin).toBe("pending");
  });
  it("one failed + other missing is failed; failed+retry missing other is partial", () => {
    expect(aggregateEmailLogs([row(INFO, "failed", "01")]).get("o1")!.admin).toBe("failed");
    expect(aggregateEmailLogs([row(INFO, "sent", "09"), row(INFO, "failed", "01")]).get("o1")!.admin).toBe("partial");
  });
  it("customer uses latest state independent of order", () => {
    const c = [row("a@b.hu", "sent", "09", "customer_confirmation"), row("a@b.hu", "failed", "01", "customer_confirmation")];
    expect(aggregateEmailLogs(c).get("o1")!.customer).toBe("sent");
    expect(aggregateEmailLogs([...c].reverse()).get("o1")!.customer).toBe("sent");
  });
});

describe("interpretStatusEmailResponse", () => {
  it("accepts strict success shapes", () => {
    expect(interpretStatusEmailResponse({ success: true, id: "m1" })).toBeNull();
    expect(interpretStatusEmailResponse({ success: true, already_sent: true })).toBeNull();
    expect(interpretStatusEmailResponse({ success: true, skipped: true })).toBeNull();
  });
  it("rejects malformed or failed responses", () => {
    expect(interpretStatusEmailResponse(null)).not.toBeNull();
    expect(interpretStatusEmailResponse("ok")).not.toBeNull();
    expect(interpretStatusEmailResponse({ success: true })).not.toBeNull();
    expect(interpretStatusEmailResponse({ success: true, id: "" })).not.toBeNull();
    expect(interpretStatusEmailResponse({ success: "true", id: "m1" })).not.toBeNull();
    expect(interpretStatusEmailResponse({ success: false, error: "403" })).toBe("403");
  });
});
