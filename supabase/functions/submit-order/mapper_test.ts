// Deno tests for mapDbErrorToHungarian.
// Verifies (a) existing Hungarian trigger messages pass through unchanged,
// (b) the K-1 root-cause NOT NULL clause is mapped to a friendly Hungarian
//     "refresh the page" message,
// (c) English Postgres trigger messages become the correct Hungarian text,
// (d) the dynamic contact suffix respects opts.phone / opts.email.
//
// Run with: deno test --allow-net --allow-env supabase/functions/submit-order/mapper_test.ts

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mapDbErrorToHungarian } from "./mapper.ts";

// ---- (a) Hungarian passthrough — must not be rewritten -----------------

Deno.test("passthrough: breakfast window Hungarian message", () => {
  const raw = "A kiválasztott időpont nyitvatartási időn kívül esik (07:00 – 10:00 (reggeli))";
  assertEquals(mapDbErrorToHungarian({ message: raw }), raw);
});

Deno.test("passthrough: lunch window Hungarian message", () => {
  const raw = "A kiválasztott időpont nyitvatartási időn kívül esik (10:30 – 16:00 (ebéd))";
  assertEquals(mapDbErrorToHungarian({ message: raw }), raw);
});

Deno.test("passthrough: ASAP-closed Hungarian message", () => {
  const raw = "Éppen zárva vagyunk — mielőbbi átvételes rendelés csak 10:30 és 16:00 között lehetséges.";
  assertEquals(mapDbErrorToHungarian({ message: raw }), raw);
});

Deno.test("passthrough: weekend closed Hungarian message", () => {
  const raw = "Hétvégén zárva tartunk";
  assertEquals(mapDbErrorToHungarian({ message: raw }), raw);
});

Deno.test("passthrough: capacity-full Hungarian message with numbers", () => {
  const raw = "Az időpont közben betelt (foglalt: 12, max: 12)";
  assertEquals(mapDbErrorToHungarian({ message: raw }), raw);
});

Deno.test("passthrough: portion-out Hungarian message with item name", () => {
  const raw = "Nincs elég adag: Tükörtojás (maradt: 3)";
  assertEquals(mapDbErrorToHungarian({ message: raw }), raw);
});

// ---- (b) K-1 root cause — NOT NULL constraint on order_items -----------

Deno.test("K-1: name_snapshot NULL → Hungarian refresh message", () => {
  const raw = 'null value in column "name_snapshot" of relation "order_items" violates not-null constraint';
  const out = mapDbErrorToHungarian({ message: raw });
  assertStringIncludes(out, "kosár egyik tétele hiányos");
  assertStringIncludes(out, "Ctrl+F5");
});

Deno.test("K-1: unit_price_huf NULL → Hungarian refresh message", () => {
  const raw = 'null value in column "unit_price_huf" of relation "order_items" violates not-null constraint';
  const out = mapDbErrorToHungarian({ message: raw });
  assertStringIncludes(out, "kosár egyik tétele hiányos");
});

Deno.test("K-1: line_total_huf NULL → Hungarian refresh message", () => {
  const raw = 'null value in column "line_total_huf" of relation "order_items" violates not-null constraint';
  const out = mapDbErrorToHungarian({ message: raw });
  assertStringIncludes(out, "kosár egyik tétele hiányos");
});

// ---- (c) English trigger messages → Hungarian --------------------------

Deno.test("English: past dates or times → Hungarian past-time message", () => {
  const out = mapDbErrorToHungarian({ message: "Cannot place orders for past dates or times" });
  assertStringIncludes(out, "A választott átvételi idő már elmúlt");
});

Deno.test("English: outside business hours → Hungarian business hours message", () => {
  const out = mapDbErrorToHungarian({ message: "Pickup time is outside business hours" });
  assertStringIncludes(out, "nyitvatartási időn kívül");
  assertStringIncludes(out, "07:00–16:00");
});

// ---- (d) Dynamic contact suffix ---------------------------------------

Deno.test("Fallback: no phone → email suffix", () => {
  const out = mapDbErrorToHungarian({ message: "some unknown english error XYZ" });
  assertStringIncludes(out, "Nem sikerült a rendelést menteni");
  assertStringIncludes(out, "írj nekünk: info@kiscsibeetterem.hu");
});

Deno.test("Fallback: phone configured → phone suffix wins over email", () => {
  const out = mapDbErrorToHungarian(
    { message: "some unknown english error XYZ" },
    { phone: "+36 1 234 5678", email: "info@kiscsibeetterem.hu" }
  );
  assertStringIncludes(out, "hívj minket: +36 1 234 5678");
});

Deno.test("Fallback: soft-rewrite for legacy 'Rendelés mentési hiba' throw", () => {
  const out = mapDbErrorToHungarian({ message: "Rendelés mentési hiba" });
  assertStringIncludes(out, "Nem sikerült a rendelést menteni");
  assertStringIncludes(out, "info@kiscsibeetterem.hu");
});

Deno.test("Fallback: soft-rewrite for legacy 'Rendelési tétel mentési hiba' throw", () => {
  const out = mapDbErrorToHungarian({ message: "Rendelési tétel mentési hiba" });
  assertStringIncludes(out, "Nem sikerült a rendelést menteni");
});
