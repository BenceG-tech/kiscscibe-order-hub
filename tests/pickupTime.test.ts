import { describe, expect, test } from 'bun:test';
import { resolvePickupTime, formatPickupTime } from '../supabase/functions/_shared/pickupTime';

describe('pickup time used by storage and email', () => {
  test('UI date + slot payload after DST ends has the chosen date and noon in email', () => {
    // The actual Checkout sends date + slot, without a pickup_time ISO field.
    const payload = { pickup_date: '2026-10-28', pickup_time_slot: '12:00:00' };
    const canonical = resolvePickupTime(undefined, payload.pickup_date, payload.pickup_time_slot);
    expect(canonical).toBe('2026-10-28T11:00:00.000Z');
    const confirmation = formatPickupTime(canonical);
    expect(confirmation).toContain('2026. 10. 28.');
    expect(confirmation).toContain('12:00:00');
    expect(confirmation).not.toContain('Amilyen hamar lehet');
    // Later status mail receives the persisted ISO value and must show the same time.
    expect(formatPickupTime('2026-10-28T11:00:00+00:00')).toBe(confirmation);
  });

  test('UI payload before DST ends uses summer offset and still displays local noon', () => {
    const canonical = resolvePickupTime(null, '2026-10-23', '12:00');
    expect(canonical).toBe('2026-10-23T10:00:00.000Z');
    expect(formatPickupTime(canonical)).toContain('12:00:00');
  });

  test('legacy explicit pickup_time is preserved rather than converted a second time', () => {
    const legacy = '2026-10-28T11:00:00Z';
    const canonical = resolvePickupTime(legacy, '2026-10-28', '12:00:00');
    expect(canonical).toBe(legacy);
    expect(formatPickupTime(canonical)).toContain('12:00:00');
  });

  test('an ASAP request without any pickup values keeps the original label', () => {
    const canonical = resolvePickupTime(null, '', '');
    expect(canonical).toBeNull();
    expect(formatPickupTime(canonical)).toBe('Amilyen hamar lehet');
  });

  test('partial date or slot does not invent a scheduled time', () => {
    expect(resolvePickupTime(null, '2026-10-28', '')).toBeNull();
    expect(resolvePickupTime(undefined, '', '12:00:00')).toBeNull();
  });
});
