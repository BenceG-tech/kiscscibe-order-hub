// Pure helpers extracted from index.ts so they can be unit-tested without
// pulling in the whole edge function (npm:resend, Supabase client, etc.).
//
// Map raw Postgres/trigger/RPC error messages to customer-facing Hungarian text.
// Keeps validate_pickup_time / validate_order_date / update_daily_portions /
// update_capacity_slot / atomic_coupon_increment failures from leaking as
// English DB text or a generic "Rendelés mentési hiba".
//
// opts.phone / opts.email come from public.settings.restaurant_contact.
// If a phone is configured the fallback tells the customer to call; otherwise
// it falls back to email. Future-proof: enabling phone contact is a single
// settings-row update, zero code changes.
export function mapDbErrorToHungarian(
  err: unknown,
  opts?: { phone?: string | null; email?: string | null }
): string {
  const email = opts?.email || 'info@kiscsibeetterem.hu';
  const contactSuffix = opts?.phone
    ? `hívj minket: ${opts.phone}`
    : `írj nekünk: ${email}`;
  const softFallback = `Nem sikerült a rendelést menteni — kérjük próbáld újra pár másodperc múlva, vagy ${contactSuffix}.`;

  const raw = String(
    (err as any)?.message ??
    (err as any)?.error_description ??
    (err as any)?.details ??
    err ?? ''
  );
  if (!raw) return softFallback;

  const lower = raw.toLowerCase();

  // K-1 root-cause coverage: cart payload arrived without name_snapshot /
  // unit_price_huf / line_total_huf → order_items NOT NULL constraint bites.
  // Empirically seen from a stale FE cache (AUDIT TESZT E2, 2026-07-14 00:12 Europe/Budapest).
  if (
    lower.includes('null value in column "name_snapshot"') ||
    lower.includes('null value in column "unit_price_huf"') ||
    lower.includes('null value in column "line_total_huf"')
  ) {
    return 'A kosár egyik tétele hiányos adatokkal érkezett — kérjük frissítsd az oldalt (Ctrl+F5) és próbáld újra.';
  }

  // Already a Hungarian message from our code — pass through unchanged.
  // Heuristic: contains accented chars or typical Hungarian order words.
  if (/[őűáéíóöúü]/.test(raw) || /rendel|kupon|adag|időpont|napi|köret|étel|hétvég|nyitvatart|múltbeli|foglalt|betelt|elfogyott|feliratkoz|nyitva|zárva|Kiscsibe/i.test(raw)) {
    // Except the raw internal throws we want to soften with a contact suffix.
    if (raw === 'Rendelés mentési hiba' || raw === 'Rendelési tétel mentési hiba') {
      return softFallback;
    }
    return raw;
  }

  // Postgres trigger messages (English).
  if (lower.includes('past dates or times')) {
    return 'A választott átvételi idő már elmúlt — kérjük, válassz későbbi időpontot.';
  }
  if (lower.includes('outside business hours')) {
    return 'A választott időpont nyitvatartási időn kívül esik (H–P 07:00–16:00).';
  }
  if (lower.includes('daily items for past dates')) {
    return 'A választott nap már lezárult, arra a napra nem adható le rendelés.';
  }
  if (lower.includes('insufficient portions')) {
    return 'Sajnos időközben elfogyott az adag ebből az ételből.';
  }
  if (lower.includes('remaining portions cannot be negative')) {
    return 'Sajnos időközben elfogyott az adag ebből az ételből.';
  }
  if (lower.includes('daily offer not found') || lower.includes('daily menu not found') || lower.includes('daily offer menu not found')) {
    return 'A napi ajánlat nem található — kérjük frissítsd az oldalt.';
  }
  if (lower.includes('duplicate key') || lower.includes('unique constraint')) {
    return 'Ez a rendelés már be lett rögzítve — kérjük ellenőrizd az email értesítőt.';
  }
  if (lower.includes('permission denied') || lower.includes('rls')) {
    return `Jogosultsági hiba történt — kérjük próbáld újra, vagy ${contactSuffix}.`;
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'A rendelési szerver túl lassan válaszolt — kérjük próbáld újra.';
  }

  // Unknown DB error — generic soft fallback with dynamic contact suffix.
  return softFallback;
}

// Fetch restaurant contact info from public.settings.restaurant_contact.
// Falls back to { phone: null, email: 'info@kiscsibeetterem.hu' } when the row
// is missing or the fetch fails so callers always get a usable email suffix.
export async function getRestaurantContact(
  supabase: any
): Promise<{ phone: string | null; email: string }> {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value_json')
      .eq('key', 'restaurant_contact')
      .maybeSingle();
    const v = (data?.value_json ?? {}) as { phone?: string | null; email?: string | null };
    return {
      phone: typeof v.phone === 'string' && v.phone.trim() ? v.phone.trim() : null,
      email: typeof v.email === 'string' && v.email.trim() ? v.email.trim() : 'info@kiscsibeetterem.hu',
    };
  } catch {
    return { phone: null, email: 'info@kiscsibeetterem.hu' };
  }
}
