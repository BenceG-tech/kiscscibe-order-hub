/** Pure helpers for the customer order lookup (code + phone). */

export const normalizeLookupPhone = (raw: string): string => {
  let p = raw.replace(/\s+/g, "").replace(/-/g, "");
  if (p.startsWith("06")) p = "+36" + p.slice(2);
  if (!p.startsWith("+")) p = "+36" + p;
  return p;
};

export const normalizeOrderCode = (raw: string): string =>
  raw.trim().replace(/^#/, "").toUpperCase();

/**
 * Validates the lookup inputs. Returns a Hungarian error message, or null when valid.
 * Both the order code AND the phone number are required — phone alone must never
 * be able to enumerate a customer's orders.
 */
export const validateLookupInput = (code: string, phone: string): string | null => {
  const c = normalizeOrderCode(code);
  if (!c) return "Add meg a rendelési kódot.";
  if (c.length < 4) return "A rendelési kód legalább 4 karakter.";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "Add meg a telefonszámot.";
  if (digits.length < 8) return "A telefonszám túl rövid.";
  return null;
};
