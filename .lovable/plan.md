# submit-order from-cím fix + E1–E9 + send-contact-email fix

## 1. submit-order/index.ts — from-csere + reply_to (egyetlen commit)

**Sor 1230–1236 (admin loop):**
```ts
const { data, error } = await resend.emails.send({
  from: 'Kiscsibe Étterem <rendeles@kiscsibe-etterem.hu>',
  to: [recipient],
  reply_to: 'info@kiscsibeetterem.hu',
  subject: `Új rendelés #${orderCode} — ${customer.name}`,
  html: adminHtml,
  text: adminText,
});
```

**Sor 1332–1338 (vevői visszaigazolás):**
```ts
const { data, error } = await resend.emails.send({
  from: 'Kiscsibe Étterem <rendeles@kiscsibe-etterem.hu>',
  to: [customer.email],
  reply_to: 'info@kiscsibeetterem.hu',
  subject: `Kiscsibe – rendelés visszaigazolás #${orderCode}`,
  html: customerHtml,
  text: customerText,
});
```

Deploy: `submit-order`. Semmi más nem változik ebben a commitban.

## 2. E1–E9 tesztfutás (a fix deploy után azonnal)

Playwright anon `http://localhost:8080` alól, minden teszt `/tmp/browser/e{n}/` alatt, screenshot + `supabase--read_query` a DB-hez.

| ID | Teszt | Fő ellenőrzés |
|----|-------|---------------|
| E1 | Rendelés email nélkül, `AUDIT TESZT E1` | 2× admin_notification sent, 1× customer_confirmation **skipped** |
| E2 | Rendelés `gataibence@gmail.com`, `AUDIT TESZT E2` | 3× sent, Resend message ID mind a 3-ra |
| E3 | Dupla-klikk „Megrendelem" 300ms belül | 1 rendelés, 2 admin sor (nem 4) |
| E4 | Céldátum **2026-07-14 (kedd)** Europe/Budapest: 06:59 / 07:00 / 15:59 / 16:00 / múlt (2026-07-13) / szombat (2026-07-18) | Frontend hibaüzenet-minőség; trigger visszautasít |
| E5 | ASAP (mai) 21:00+ | Vevő mit lát; szabály konzisztens |
| E6 | Napi menüs tétel | `daily_offer_items` portion csökken |
| E7 | `TESZT-E7-KUPON` insert (10%, aktív) → használat → törlés | Kedvezmény alkalmazva, `coupon_usages` sor |
| E8 | Név: `<script>alert(1)</script>🐔`, hosszú megjegyzés | Admin DOM escape-elt, email HTML `&lt;script&gt;` |
| E9 | Telefon: `+36 20 123 4567`, `06201234567`, `20/123-4567` | Normalizált formátum admin nézetben |

## 3. Takarítás (megegyezés)

Törlés ELŐTT: `UPDATE email_send_log SET order_id = NULL WHERE order_id IN (<AUDIT TESZT ids>)` — hogy ne cascade-elődjön. Aztán DELETE minden `name ILIKE '%AUDIT TESZT%'` rendelés + `order_items` + `order_item_options`, majd `TESZT-E7-KUPON` DELETE. `email_send_log` sorok maradnak. Verifikáció count query.

## 4. Záró jelentés

1. Teszt-mátrix E1–E9 (✅/❌/⚠️ + 1 sor bizonyíték)
2. **Kiküldött emailek táblázat**: Resend message ID + Europe/Budapest timestamp + címzett + subject (valódi `info@kiscsibeetterem.hu` és `gataibence@gmail.com` értesítések — telefonos ellenőrzéshez)
3. Proaktívan javított hibák (ha lesz)
4. TULAJDONOSI DÖNTÉS KELL lista
5. Takarítás igazolás

## 5. send-contact-email fix (KÜLÖN COMMIT, E1–E9 UTÁN)

Az E1–E9 sikeres lezárása után, külön commitban:

**supabase/functions/send-contact-email/index.ts sor 64–68 (admin értesítés):**
```ts
await resend.emails.send({
  from: 'Kiscsibe Étterem <rendeles@kiscsibe-etterem.hu>',
  to: ['info@kiscsibeetterem.hu'],
  reply_to: email,  // a beküldő címe → az étterem közvetlenül válaszolhat
  subject: `Új üzenet a weboldalról - ${safeName}`,
  ...
});
```

**Sor 100–104 (auto-reply a beküldőnek):**
```ts
await resend.emails.send({
  from: 'Kiscsibe Reggeliző & Étterem <rendeles@kiscsibe-etterem.hu>',
  to: [email],
  reply_to: 'info@kiscsibeetterem.hu',
  subject: 'Kiscsibe - Megkaptuk üzenetét',
  ...
});
```

Deploy: `send-contact-email`. Teszt: küldök egy kontakt-üzenetet Playwrighttal a `/kapcsolat` oldalon keresztül `AUDIT TESZT KONTAKT` névvel és `gataibence@gmail.com` email címmel, majd Resend message ID-t olvasok a function logból. A test kontakt-üzenetet nem tudjuk törölni (nincs adatbázis-tábla hozzá — csak email), tehát csak jelzem a bizonyítékot.

## 6. Használat-ellenőrzés (nem-blokkoló info a jelentésben)

Grep + adatbázis-lekérdezés a válaszban:
- `send-welcome-newsletter`: hívott-e valahol a frontend? Van-e `subscribers` bejegyzés? (Ha nincs, tényleg backlog.)
- `send-weekly-menu`: hívott-e cron vagy admin gomb? Volt-e futása az edge function logban az elmúlt 30 napban?

Ha bármelyik használatban van, kiemelt BACKLOG-2b/2c pontként jelzem — de a mostani commitban NEM módosítom, mert a scope kizárólag a submit-order + send-contact-email.

## Korlátok

- Egy hiba → diagnózis → minimális fix → verifikáció. Max 3 kör ugyanarra a bugra, utána megállok és kérdek.
- Nincs DB-trigger módosítás, nincs éles secret-átírás.
- 2 külön commit: (A) submit-order + E1–E9, (B) send-contact-email + kontakt-teszt.
