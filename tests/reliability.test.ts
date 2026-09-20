import { describe, expect, test } from "bun:test";
import { isClosedDay, nextBusinessDates, toDateStr } from "../src/lib/pickupDates";
import { normalizeLookupPhone, normalizeOrderCode, validateLookupInput } from "../src/lib/orderLookup";

describe("weekday/weekend pickup slot rules", () => {
  test("Saturday and Sunday are closed days", () => {
    expect(isClosedDay("2026-09-19")).toBe(true); // Saturday
    expect(isClosedDay("2026-09-20")).toBe(true); // Sunday
  });

  test("Monday–Friday are open days", () => {
    for (const d of ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25"]) {
      expect(isClosedDay(d)).toBe(false);
    }
  });

  test("nextBusinessDates never returns a weekend, starting from a Friday", () => {
    const dates = nextBusinessDates(new Date(2026, 8, 18)); // Friday 2026-09-18
    expect(dates).toEqual(["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25"]);
    expect(dates.some(isClosedDay)).toBe(false);
  });

  test("nextBusinessDates never returns a weekend, starting from a Friday of a month edge", () => {
    const dates = nextBusinessDates(new Date(2026, 9, 30)); // Friday 2026-10-30
    expect(dates.some(isClosedDay)).toBe(false);
    expect(dates.length).toBe(5);
  });

  test("every start day of a year produces only weekdays", () => {
    const cursor = new Date(2026, 0, 1);
    for (let i = 0; i < 365; i++) {
      const dates = nextBusinessDates(new Date(cursor));
      expect(dates.length).toBe(5);
      expect(dates.some(isClosedDay)).toBe(false);
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  test("toDateStr round-trips", () => {
    expect(toDateStr(new Date(2026, 8, 20))).toBe("2026-09-20");
  });
});

describe("secure order lookup validation", () => {
  test("phone alone is rejected", () => {
    expect(validateLookupInput("", "301234567")).toBe("Add meg a rendelési kódot.");
  });

  test("code alone is rejected", () => {
    expect(validateLookupInput("L69199", "")).toBe("Add meg a telefonszámot.");
  });

  test("short code is rejected", () => {
    expect(validateLookupInput("L6", "301234567")).toBe("A rendelési kód legalább 4 karakter.");
  });

  test("short phone is rejected", () => {
    expect(validateLookupInput("L69199", "3012")).toBe("A telefonszám túl rövid.");
  });

  test("code + phone together is accepted", () => {
    expect(validateLookupInput(" #l69199 ", "30 123 4567")).toBeNull();
  });

  test("normalizers", () => {
    expect(normalizeOrderCode(" #l69199 ")).toBe("L69199");
    expect(normalizeLookupPhone("06 30 123-4567")).toBe("+36301234567");
    expect(normalizeLookupPhone("301234567")).toBe("+36301234567");
    expect(normalizeLookupPhone("+36301234567")).toBe("+36301234567");
  });
});

// ── Email failure logging (pure logic of the shared helper) ──
import { logEmailSend, maskEmail, ratingLinksHtml, SITE_URL } from "../supabase/functions/_shared/rating-token";

describe("email send logging", () => {
  test("canonical site URL is used in rating links", () => {
    expect(SITE_URL).toBe("https://kiscsibeetterem.hu");
    const html = ratingLinksHtml("order-1", "tok");
    expect(html).toContain("https://kiscsibeetterem.hu/rate?order=order-1&token=tok&rating=1");
    expect(html).toContain("rating=5");
    expect(html).not.toContain("kiscscibe-order-hub");
  });

  test("email addresses are masked for console output", () => {
    expect(maskEmail("gataibence@gmail.com")).toBe("g***@gmail.com");
    expect(maskEmail(null)).toBe("(none)");
  });

  test("a failed send is written to email_send_log as failed", async () => {
    const rows: any[] = [];
    const fake = { from: () => ({ insert: async (v: any) => { rows.push(v); return { error: null }; } }) };
    await logEmailSend(fake as any, {
      order_id: "o1",
      email_type: "status_completed",
      recipient: "a@b.hu",
      status: "failed",
      error: "Resend 403",
    });
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe("failed");
    expect(rows[0].email_type).toBe("status_completed");
    expect(rows[0].error).toBe("Resend 403");
    expect(rows[0].resend_message_id).toBeNull();
  });

  test("a successful send is written with the resend message id", async () => {
    const rows: any[] = [];
    const fake = { from: () => ({ insert: async (v: any) => { rows.push(v); return { error: null }; } }) };
    await logEmailSend(fake as any, {
      order_id: "o1",
      email_type: "rating_request",
      recipient: "a@b.hu",
      status: "sent",
      resend_message_id: "re_123",
    });
    expect(rows[0]).toMatchObject({ status: "sent", resend_message_id: "re_123", error: null });
  });

  test("logging never throws when the insert fails", async () => {
    const fake = { from: () => ({ insert: async () => ({ error: { message: "boom" } }) }) };
    await logEmailSend(fake as any, {
      order_id: null, email_type: "status_ready", recipient: "x", status: "sent",
    });
  });
});

// ── Weekly grid duplicate prevention (mirrors the mutation's guards) ──
type OfferItem = { item_id: string | null };

const addItem = async (
  existingItems: OfferItem[] | undefined,
  itemId: string,
  insert: (id: string) => Promise<{ error: { code?: string } | null }>,
): Promise<{ duplicate: boolean }> => {
  if (existingItems?.some((oi) => oi.item_id === itemId)) return { duplicate: true };
  const { error } = await insert(itemId);
  if (error) {
    if (error.code === "23505") return { duplicate: true };
    throw error;
  }
  return { duplicate: false };
};

describe("weekly menu duplicate prevention", () => {
  test("UI guard blocks a second add of the same item", async () => {
    let inserts = 0;
    const res = await addItem([{ item_id: "a" }], "a", async () => { inserts++; return { error: null }; });
    expect(res.duplicate).toBe(true);
    expect(inserts).toBe(0);
  });

  test("DB unique-violation is surfaced as duplicate, not an error", async () => {
    const res = await addItem([], "a", async () => ({ error: { code: "23505" } }));
    expect(res.duplicate).toBe(true);
  });

  test("a genuinely new item is inserted", async () => {
    const res = await addItem([{ item_id: "b" }], "a", async () => ({ error: null }));
    expect(res.duplicate).toBe(false);
  });

  test("other DB errors still surface", async () => {
    await expect(addItem([], "a", async () => ({ error: { code: "42501" } }))).rejects.toBeTruthy();
  });
});
