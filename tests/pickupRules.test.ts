import { describe, expect, it } from "bun:test";
import {
  checkScheduledPickup,
  isBreakfastOnlyCart,
} from "../supabase/functions/submit-order/pickupRules";

// 2026-10-26 = Monday, 2026-10-27 = Tuesday, 2026-10-24 = Saturday
const MON = "2026-10-26";
const TUE = "2026-10-27";
const SAT = "2026-10-24";
const morning = { date: MON, time: "08:00" };
const after11 = { date: MON, time: "11:00" };

describe("reggeli átvétel 07:00–16:00", () => {
  it("reggel 07, 08, 10 órás átvétel engedett (okt19 Omlett eset)", () => {
    for (const t of ["07:00:00", "08:00:00", "10:00:00"]) {
      expect(checkScheduledPickup(TUE, t, true, morning).ok).toBe(true);
    }
  });
  it("délutáni 14, 15, 16 órás átvétel engedett", () => {
    for (const t of ["14:00:00", "15:00:00", "16:00:00"]) {
      expect(checkScheduledPickup(TUE, t, true, morning).ok).toBe(true);
    }
  });
  it("16:30 és 06:30 tiltott", () => {
    expect(checkScheduledPickup(TUE, "16:30:00", true, morning).ok).toBe(false);
    expect(checkScheduledPickup(TUE, "06:30:00", true, morning).ok).toBe(false);
  });
});

describe("ebéd 10:30–16:00 változatlan", () => {
  it("10:00 tiltott, 10:30 és 16:00 engedett, 16:30 tiltott", () => {
    expect(checkScheduledPickup(TUE, "10:00:00", false, morning).ok).toBe(false);
    expect(checkScheduledPickup(TUE, "10:30:00", false, morning).ok).toBe(true);
    expect(checkScheduledPickup(TUE, "16:00:00", false, morning).ok).toBe(true);
    expect(checkScheduledPickup(TUE, "16:30:00", false, morning).ok).toBe(false);
  });
});

describe("aznapi határidő 11:00", () => {
  it("10:59-kor mára még lehet, 11:00-tól mára tiltott (reggeli és ebéd is)", () => {
    expect(checkScheduledPickup(MON, "14:00:00", true, { date: MON, time: "10:59" }).ok).toBe(true);
    const b = checkScheduledPickup(MON, "14:00:00", true, after11);
    const l = checkScheduledPickup(MON, "14:00:00", false, after11);
    expect(b.ok === false && b.code).toBe("cutoff");
    expect(l.ok === false && l.code).toBe("cutoff");
  });
  it("11 után a következő munkanapra előrendelhető", () => {
    expect(checkScheduledPickup(TUE, "08:00:00", true, after11).ok).toBe(true);
    expect(checkScheduledPickup(TUE, "12:00:00", false, after11).ok).toBe(true);
  });
  it("hétvége zárva", () => {
    const r = checkScheduledPickup(SAT, "12:00:00", false, morning);
    expect(r.ok === false && r.code).toBe("weekend");
  });
});

describe("kosár típusa csak megbízható szerveroldali flag alapján", () => {
  it("vegyes kosár (reggeli + napi tétel) nem reggeli → ebéd ablak", () => {
    const cart = [{ is_breakfast: true }, { is_breakfast: false }];
    expect(isBreakfastOnlyCart(cart)).toBe(false);
    expect(checkScheduledPickup(TUE, "08:00:00", isBreakfastOnlyCart(cart), morning).ok).toBe(false);
  });
  it("hamis kliensflag nem számít: a validált tétel flagje dönt", () => {
    // Client sent is_breakfast: true, but server re-derived from DB category = false.
    const client = { is_breakfast: true };
    const validated = [{ ...client, is_breakfast: false }];
    expect(isBreakfastOnlyCart(validated)).toBe(false);
  });
  it("üres kosár nem reggeli", () => {
    expect(isBreakfastOnlyCart([])).toBe(false);
  });
});

describe("létező capacity slot sem kerülheti meg", () => {
  it("az ellenőrzés független a slot létezésétől (tiszta függvény, mindig fut)", () => {
    // index.ts runs checkScheduledPickup before the capacity_slots lookup.
    const src = require("fs").readFileSync("supabase/functions/submit-order/index.ts", "utf8") as string;
    const checkIdx = src.indexOf("checkScheduledPickup(date, time");
    const slotIdx = src.indexOf("Atomically update capacity slot");
    expect(checkIdx).toBeGreaterThan(0);
    expect(checkIdx).toBeLessThan(slotIdx);
    expect(src.includes("it?.is_breakfast === true")).toBe(false);
  });
});
