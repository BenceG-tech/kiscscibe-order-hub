# Email-diagnózis — #L69199

## Ítélet: (a) a küldés meg sem kísérlődött

A `customer.email` `null` volt a submit body-ban → a kód a `!customer.email` ágon némán kihagyta a Resend-hívást. Se Resend request, se hiba — teljesen láthatatlan a mostani sémában.

## Bizonyítékok

### 1. Edge function log (a rendelés időablakában, 18:59:57–18:59:59 UTC)

Idézett sorok a `submit-order` log-ból (context: `edge-function-logs-all`):

```
[req_1783969197234_9t0alggz5] Starting order submission...
[req_1783969197234_9t0alggz5] Processing order for: Gátai Bence TESZT with 3 items
Server-calculated total: 6300
Generated order code: L69199
Business hours validation passed
Created order: 5965e9d6-cf16-4f98-bfdd-a9af6d1b67d3
Order completed successfully: L69199
[req_1783969197234_9t0alggz5] Order completed successfully: L69199
[req_1783969197234_9t0alggz5] No customer email provided — skipping confirmation email.
```

A `[req_...] Preparing confirmation email for ...` sor **nincs**, `Email sending failed` **nincs**, `Confirmation email sent to:` **nincs**. Egyértelmű: a `if (!customer.email)` ág futott (`submit-order/index.ts:1131-1132`), Resend hívás nem indult.

### 2. Kód-idézet — from/to/bcc (submit-order/index.ts:1252-1258)

```ts
const emailPromise = resend.emails.send({
  from: 'Kiscsibe Étterem <rendeles@kiscsibeetterem.hu>',
  to: [customer.email],
  bcc: ['info@kiscsibeetterem.hu', 'gataibence@gmail.com'],
  subject: ...,
  html: emailHtml,
  text: emailText,
})
```

Megerősítve: `from = rendeles@kiscsibeetterem.hu`, `to = customer.email`, `bcc = [info@kiscsibeetterem.hu, gataibence@gmail.com]`. A dokumentációban szereplő régi `rendeles@kiscsibe-etterem.hu` (kötőjeles) már **nincs** a submit-order-ben — kötőjel nélküli domain az élő.

### 3. RESEND_API_KEY secret

A projekt secret-listájában (`<secrets>` blokk) szerepel: **`RESEND_API_KEY` név megvan**, értéket nem ellenőriztem. Tehát ez **nem** a hiba oka — a kód eleve el sem jutott a Resend-inicializálás utáni `emails.send`-ig ebben a request-ben.

### 4. abandoned_carts diagnostic — miért nincs email_send_status

Az `abandoned_carts` séma jelenlegi oszlopai:

```
id, session_id, customer_name, customer_phone, customer_email,
cart_snapshot, total_huf, step, converted_order_id, user_agent,
created_at, last_activity_at
```

**Nincs `email_send_status` / `email_to` / `email_error` oszlop**, holott a `submit-order` (`index.ts:1266-1298`) épp ezekre a nevekre próbál `update`-elni a `.then`/`.catch` ágakban. Vagyis a jelenlegi kódban ez a diagnosztikai update **PostgREST 400-zal némán elbukik** minden email-küldésnél — nem csak most. Kényszerítve is átmegyünk az M5-höz.

Ráadásul az adminon látszik, a live network log is mutatja: két `abandoned_carts` upsert **401 RLS-hibával** halt el (`new row violates row-level security policy for table "abandoned_carts"`) — tehát a session-höz eleve nincs is `abandoned_carts` sor amit update-elni lehetne. Ez külön hiba (anon RLS insert-policy hiány), de az email-diagnózist nem befolyásolja: a döntő tény az edge log `No customer email provided` sora.

### 5. Miért volt `customer.email` null

A checkout-ról érkezett submit body-ban valóban `customer_email: null` (a live network log ugyanezt mutatja az `abandoned_carts` upsert-ekben is: `"customer_email":null`). Telefonon TESZT rendelést leadva a felhasználó nem töltötte ki az email mezőt → nincs mit küldeni. A tulaj oldali (`bcc`) másolat sem megy ki, mert a `resend.emails.send` egyáltalán meg sem hívódik, ha nincs `to`.

## Következtetés és javasolt fixek (végrehajtás külön körben)

**Eset: (a).** Nem kell Resend domain-verifikáció miatt aggódni ehhez a rendeléshez — a hívás létre sem jött. Két külön hiba viszont felszínre jött:

1. **Kritikus üzleti hiba:** az admin/tulaj bcc-másolat a `customer.email` létéhez van kötve. Ha vendég nem ad emailt (mint most, telefonos TESZT), a tulaj **soha nem kap értesítést**. Fixa (M4 részeként, `submit-order`):
   - szétbontani két külön `resend.emails.send` hívásra: (i) customer email — csak ha `customer.email` létezik, (ii) admin notification — mindig, `to: ['info@kiscsibeetterem.hu', 'gataibence@gmail.com']`, függetlenül attól, van-e vevő email.
2. **abandoned_carts séma-elmaradás:** a kód `email_send_status` / `email_to` / `email_error` mezőket írna, de az oszlopok nincsenek. Ez az M5 mag: külön `email_send_log` tábla (order_id, recipient, kind: `customer|admin`, status, provider_message_id, error, created_at), a `submit-order` catch/then ág oda ír, admin `/admin/orders` „Email" oszlop olvassa. A jelenlegi `abandoned_carts.update({email_send_status:…})` sorokat el kell távolítani vagy áthúzni az új táblára.
3. **anon RLS insert-policy `abandoned_carts`-en** hiányzik (401 az élő network log-ban). Külön mini-migráció: `CREATE POLICY "anon insert abandoned_carts" ON public.abandoned_carts FOR INSERT TO anon WITH CHECK (true)` + `GRANT INSERT, UPDATE (last_activity_at, step, customer_*, cart_snapshot, total_huf) ON public.abandoned_carts TO anon` — anélkül a K1 impact-tracking is vak.

## Következő lépés (jóváhagyás után)

- (A) M5+M4 build: `email_send_log` tábla + `submit-order` átalakítás (két külön send, admin mindig kap), admin oszlop.
- (B) `abandoned_carts` anon RLS-fix ugyanabban a migrációban.
- (C) A #L69199 törlése a te jelzésedre — most még marad, ahogy kérted.

Nincs kód-változtatás ebben a körben, csak diagnózis.
