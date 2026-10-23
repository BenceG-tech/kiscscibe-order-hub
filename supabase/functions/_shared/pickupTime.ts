// Interpret a YYYY-MM-DD HH:mm wall-clock time as Europe/Budapest and return its UTC ISO string.
export function budapestWallTimeToUtcIso(date: string, time: string): string {
  const naive = new Date(`${date}T${time}:00Z`);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Budapest',
    timeZoneName: 'longOffset',
  });
  const parts = dtf.formatToParts(naive);
  const offsetPart = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+01:00';
  const m = offsetPart.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  const sign = m && m[1] === '-' ? -1 : 1;
  const hh = m ? parseInt(m[2], 10) : 0;
  const mm = m && m[3] ? parseInt(m[3], 10) : 0;
  const offsetMin = sign * (hh * 60 + mm);
  return new Date(naive.getTime() - offsetMin * 60_000).toISOString();
}

/** Keep the existing explicit ISO value, or resolve a validated Budapest date + slot. */
export function resolvePickupTime(
  pickupTime: string | null | undefined,
  date: string,
  time: string,
): string | null {
  return pickupTime || (date && time ? budapestWallTimeToUtcIso(date, time.slice(0, 5)) : null);
}

/** Use the same Budapest display in confirmations and later status messages. */
export function formatPickupTime(pickupTime: string | null | undefined): string {
  return pickupTime
    ? new Date(pickupTime).toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' })
    : 'Amilyen hamar lehet';
}
