
# KDS Gombok Javitasa - Adatbazis Trigger Fix

## A problema gyokere

A teszteles soran kiderult, hogy a gombok (Elfogadom, Atveve, Lemondas) technikailag kattinthatoak, de a **muvelet mindig sikertelen** egy adatbazis-szintu hiba miatt:

**Hibauzenet:** `"Cannot place orders for past dates or times"` (HTTP 400)

**Ok:** A `validate_order_date` trigger a `orders` tablan **minden UPDATE-re is lefut**, nemcsak INSERT-re. Amikor a staff frissiti a statuszt (pl. "new" -> "preparing"), a trigger ujra ellenorzi a `pickup_time`-ot. Mivel a regi rendelesek pickup ideje mar a multban van, a trigger blokkol MINDEN statuszvaltoztatast.

Ez az egyetlen ok, amiert a gombok "nem mukodnek" - a frontend kod rendben van (try/finally blokk, helyes RLS policyk), de a szerver visszautasitja a kerest.

## Javitas

### Adatbazis migracio

A `validate_order_date()` fuggvenyt ugy modositjuk, hogy az idoellenorzest **csak INSERT eseten** vegezze el, UPDATE-nel ne:

```text
JELENLEGI (hibas):
  IF NEW.pickup_time IS NOT NULL AND NEW.pickup_time < NOW() THEN
      RAISE EXCEPTION 'Cannot place orders for past dates or times';
  END IF;

JAVITOTT:
  IF TG_OP = 'INSERT' THEN
      IF NEW.pickup_time IS NOT NULL AND NEW.pickup_time < NOW() THEN
          RAISE EXCEPTION 'Cannot place orders for past dates or times';
      END IF;
      IF NEW.pickup_time IS NOT NULL AND NOT validate_pickup_time(NEW.pickup_time) THEN
          RAISE EXCEPTION 'Pickup time is outside business hours';
      END IF;
  END IF;
```

Ez biztositja, hogy:
- **Uj rendeleseknel** (INSERT): Tovabbra is ellenorzi, hogy a pickup ido nem mult-e el es az uzleti orakba esik-e.
- **Statusz frissiteseknel** (UPDATE): Nem blokkol, a staff szabadon valtoztathatja a statuszt.

### Erintett fajlok

| Fajl | Valtoztatas |
|------|-------------|
| Uj migracio SQL | A `validate_order_date()` fuggveny modositasa: `TG_OP = 'INSERT'` feltetel hozzaadasa az idoellenorzesekhez |

### Egyeb javitasok nem szuksegesek

A teszteles soran ellenoriztem:
- **RLS policyk**: Rendben vannak - a staff UPDATE jogot kapott az `orders` tablara (`is_admin_or_staff` policy).
- **Frontend kod**: A `handleStatusChange` fuggvenyben mar van `try/finally` blokk, ami biztositja, hogy a gomb soha nem ragad `disabled` allapotban.
- **StatusSummaryBar**: Mar kattinthato `button` elemeket hasznal smooth scroll-al.
- **Lemondas dialog**: Mar van `AlertDialog` megerosites.
- **Kijelentkezes**: Mar van megerosito dialog es a gomb 44px meretu.

**A trigger fix utan minden gomb azonnal mukodni fog**, mert a 400-as hiba megszunik.
