
# M4 + M5 — admin-értesítő szétválasztása és email megfigyelhetőség

Egy commit, egy scope. A #L69199 törlése ugyanebben a körben.

## 1. Migráció (Supabase)

### 1a. `email_send_log` tábla

```sql
CREATE TABLE public.email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  email_type text NOT NULL CHECK (email_type IN ('admin_notification','customer_confirmation')),
  recipient text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent','failed','skipped')),
  resend_message_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.email_send_log TO authenticated;
GRANT ALL ON public.email_send_log TO service_role;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_staff_read_email_log"
  ON public.email_send_log FOR SELECT
  TO authenticated
  USING (public.is_admin_or_staff(auth.uid()));

CREATE INDEX idx_email_send_log_order ON public.email_send_log(order_id, created_at DESC);
```

Írni csak service_role → az edge function írja. Az `authenticated` role csak `SELECT`-et kap, és az RLS policy az `is_admin_or_staff` RPC-vel szűr.

### 1b. #L69199 törlése (ugyanebben a migrációban)

```sql
DELETE FROM public.order_item_options WHERE order_item_id IN
  (SELECT id FROM public.order_items WHERE order_id =
    (SELECT id FROM public.orders WHERE code = 'L69199'));
DELETE FROM public.order_items WHERE order_id =
  (SELECT id FROM public.orders WHERE code = 'L69199');
DELETE FROM public.invoices WHERE order_id =
  (SELECT id FROM public.orders WHERE code = 'L69199');
DELETE FROM public.orders WHERE code = 'L69199';
```

## 2. `submit-order` edge function átalakítás

Jelenlegi kód (`supabase/functions/submit-order/index.ts:1131–1300` körüli blokk):

- egy `resend.emails.send` hívás, `to: [customer.email]`, `bcc: [info@…, gataibence@…]`
- `if (!customer.email)` → egész email-blokk kihagyva

Új szerkezet, `EdgeRuntime.waitUntil(...)` mögé csomagolva egyben, hogy ne lassítsa a submit-ot:

```ts
// Helper: log every attempt
async function logEmail(orderId, type, recipient, status, messageId, err) {
  await supabaseAdmin.from('email_send_log').insert({
    order_id: orderId, email_type: type, recipient, status,
    resend_message_id: messageId ?? null, error: err ?? null,
  });
}

// (A) Admin notification — MINDIG, két külön send (nem bcc)
const adminHtml = renderAdminNotificationHtml(order, items, customer);
const adminText = renderAdminNotificationText(order, items, customer);
const adminSubject = `Új rendelés #${order.code} — ${customer.name}`;

for (const recipient of ['info@kiscsibeetterem.hu', 'gataibence@gmail.com']) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Kiscsibe Étterem <rendeles@kiscsibeetterem.hu>',
      to: [recipient],
      subject: adminSubject, html: adminHtml, text: adminText,
    });
    if (error) throw error;
    await logEmail(order.id, 'admin_notification', recipient, 'sent', data?.id, null);
  } catch (e) {
    console.error(`[email] admin notification to ${recipient} failed:`, e);
    await logEmail(order.id, 'admin_notification', recipient, 'failed', null, String(e?.message ?? e));
  }
}

// (B) Customer confirmation — csak ha van email
if (!customer.email) {
  await logEmail(order.id, 'customer_confirmation', '', 'skipped', null, 'no customer email');
} else {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Kiscsibe Étterem <rendeles@kiscsibeetterem.hu>',
      to: [customer.email],
      subject: `Rendelésed visszaigazolása — #${order.code}`,
      html: customerHtml, text: customerText,
    });
    if (error) throw error;
    await logEmail(order.id, 'customer_confirmation', customer.email, 'sent', data?.id, null);
  } catch (e) {
    console.error('[email] customer confirmation failed:', e);
    await logEmail(order.id, 'customer_confirmation', customer.email, 'failed', null, String(e?.message ?? e));
  }
}
```

Kulcsdöntések:

- **Két külön send** az admin címekre (nem bcc) — Gmail-spam kockázat csökkentése.
- **Független try/catch** — egyik hibája sem blokkolja a másikat, sem a rendelés-mentést.
- **Skipped is logolódik** — a láthatatlan `if (!customer.email)` ág soha többé nem néma.
- **Rendelés mentése ugyanaz** — az egész email-blokk marad `EdgeRuntime.waitUntil(...)` mögött, ahogy most is. Sebesség nem romlik.
- Az admin email HTML/text renderelése új helper (`renderAdminNotificationHtml/Text`) — a vevői email létező template-jétől független, tartalma: kód, név, telefon, átvételi idő (Europe/Budapest formázva), tételek + modifier-ek, összeg, fizetési mód, megjegyzés.
- Az `abandoned_carts.update({email_send_status:…})` diag-blokkot **eltávolítjuk** — az `email_send_log` váltja fel (a séma nem is tartalmazza ezeket az oszlopokat).

## 3. Admin UI — email státusz oszlop

`src/pages/admin/OrdersManagement.tsx` (és/vagy az általa használt sorlista-komponens).

- Új lekérés: az orders queryhez `email_send_log(email_type, status)` join vagy külön batch fetch a látható order-idekre.
- Aggregáció orderenként:
  - `admin`: `sent` (bármelyik két címzett `sent`) | `partial` (egyik sent, másik failed) | `failed` (mindkettő failed) | `pending` (nincs sor)
  - `customer`: `sent` | `failed` | `skipped` | `pending`
- Kis ikon a meglévő sorban, a státusz badge mellé (nem új oszlop, csak inline icon a layout megbontása nélkül):
  - zöld pipa = admin sent
  - piros háromszög = admin failed/partial
  - szürke boríték = customer skipped
  - kis "@" ikon zölden = customer sent
- Tooltip: pontos state + timestamp.

## 4. Verifikáció (te végzed, én a logokat és a táblát ellenőrzöm)

1. Éles próbarendelés **email nélkül** → `info@` + `gataibence@` kap emailt (két külön kézbesítés). `email_send_log`:
   - 2 sor `admin_notification / sent`
   - 1 sor `customer_confirmation / skipped`
2. Éles próbarendelés **emaillel** → mindhárom megérkezik. `email_send_log`:
   - 2 sor `admin_notification / sent`
   - 1 sor `customer_confirmation / sent`
3. Edge function idő nem nő (`EdgeRuntime.waitUntil` marad).
4. Playwright anon E2E (/ + /etlap + checkout submit nélkül) zöld, 0 Supabase 4xx/5xx.

## Scope-korlát

Ebben a commit-ban **csak** a fentiek. Nincs `abandoned_carts` anon RLS-fix, nincs egyéb refactor — azok külön körben, ahogy megbeszéltük.
