import { describe, expect, it } from "bun:test";
import {
  computePackagingFee,
  categoryNeedsBox,
  packagingKindForMenuRole,
  DEFAULT_PACKAGING_FEES,
} from "../src/lib/packagingFee";

describe("packagingKindForMenuRole", () => {
  it("főétel → fizetős doboz", () => {
    expect(packagingKindForMenuRole("főétel")).toBe("main");
    expect(packagingKindForMenuRole("Főétel")).toBe("main");
  });

  it("leves és egyéb → ingyenes", () => {
    expect(packagingKindForMenuRole("leves")).toBe("none");
    expect(packagingKindForMenuRole("desszert")).toBe("none");
    expect(packagingKindForMenuRole(null)).toBe("none");
    expect(packagingKindForMenuRole(undefined)).toBe("none");
  });
});

describe("categoryNeedsBox", () => {
  it("főétel/tészta/főzelék kategória → dobozos", () => {
    expect(categoryNeedsBox("Főételek")).toBe(true);
    expect(categoryNeedsBox("Tészta ételek")).toBe(true);
    expect(categoryNeedsBox("Főzelékek")).toBe(true);
  });

  it("saláta/savanyúság/ital/desszert/leves/köret → ingyenes", () => {
    expect(categoryNeedsBox("Saláták")).toBe(false);
    expect(categoryNeedsBox("Savanyúságok")).toBe(false);
    expect(categoryNeedsBox("Italok")).toBe(false);
    expect(categoryNeedsBox("Desszertek")).toBe(false);
    expect(categoryNeedsBox("Levesek")).toBe(false);
    expect(categoryNeedsBox("Köretek")).toBe(false);
    expect(categoryNeedsBox("Reggelik")).toBe(false);
  });

  it("ismeretlen/hiányzó kategória → defenzíven ingyenes", () => {
    expect(categoryNeedsBox("Valami új")).toBe(false);
    expect(categoryNeedsBox(null)).toBe(false);
    expect(categoryNeedsBox(undefined)).toBe(false);
  });
});

describe("computePackagingFee", () => {
  it("főétel: 150 Ft / adag", () => {
    expect(
      computePackagingFee([{ quantity: 2, packaging: "main" }], DEFAULT_PACKAGING_FEES)
    ).toBe(300);
  });

  it("elviteles menü: 200 Ft / menü", () => {
    expect(
      computePackagingFee([{ quantity: 3, daily_type: "complete_menu" }], DEFAULT_PACKAGING_FEES)
    ).toBe(600);
  });

  it("saláta/savanyúság (packaging: none) → 0 Ft", () => {
    expect(
      computePackagingFee([{ quantity: 5, packaging: "none" }], DEFAULT_PACKAGING_FEES)
    ).toBe(0);
  });

  it("vegyes kosár: menü + főétel + saláta", () => {
    const items = [
      { quantity: 1, daily_type: "complete_menu" as const },
      { quantity: 2, packaging: "main" as const },
      { quantity: 1, packaging: "none" as const },
    ];
    expect(computePackagingFee(items, DEFAULT_PACKAGING_FEES)).toBe(200 + 300 + 0);
  });

  it("üres kosár és hiányzó mezők → 0 Ft", () => {
    expect(computePackagingFee([], DEFAULT_PACKAGING_FEES)).toBe(0);
    expect(computePackagingFee([{ quantity: 4 }], DEFAULT_PACKAGING_FEES)).toBe(0);
  });

  it("egyéni díjakkal is számol", () => {
    expect(
      computePackagingFee(
        [{ quantity: 1, packaging: "main" }, { quantity: 1, daily_type: "complete_menu" }],
        { main_huf: 170, menu_huf: 220 }
      )
    ).toBe(390);
  });
});
