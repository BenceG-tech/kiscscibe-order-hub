

# Auth Bejelentkezesi Problema - Javitas

## Azonositott Problemak

A teszteles soran a kovetkezo problemakat talaltan:

### 1. Auth oldal vegtelen loading spinner
Az Auth.tsx 56. soran:
```text
if (user || authLoading || rolesLoading) {
    return <LoadingSpinner />
}
```
Ha a felhasznalo mar be van jelentkezve (pl. elozo session nem toroldott rendesen), a felhasznalo egy **vegtelen loading spinnert** lat es soha nem jut tovabb. Nincs timeout, nincs "Kijelentkezes" gomb, nincs semmilyen visszajelzes.

### 2. Csendes hiba a szerepkor betoltesnel
Az AuthContext `fetchProfile` fuggvenye a kovetkezo kodot tartalmazza:
```text
if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error);
    return;  // Visszater - isAdmin es isStaff HAMIS marad!
}
```
Ha a profil lekerdezes hibat ad (halozati hiba, RLS problema), a `return` vegrehajtodik, az `isAdmin` es `isStaff` hamisak maradnak, es a felhasznalo **csendben a fooldara kerul atiranyitasra** a személyzeti oldal helyett. A felhasznalo ilyenkor nem erti miert nem jut be a staff admin feluletre.

### 3. Ketszeres fetchProfile hivas (race condition)
A `getSession()` es az `onAuthStateChange` is meghivja a `fetchProfile`-t. Ez ket parhuzamos halozati hivast eredmenyez ami felesleges terheles es ido.

### 4. RPC hiba kezeletlen
Az `is_admin()` es `is_staff()` RPC hivasok hibait nem ellenorizzuk:
```text
const { data: isAdminResult } = await supabase.rpc('is_admin');
// Ha error van, data null, isAdminResult === true hamis
```
Tehat ha barmelyik RPC hivas sikertelen, a felhasznalo csendben elveszti a jogosultsagait.

---

## Javitasi terv

### 1. Auth oldal: Loading timeout es force logout

Ha 5 masodpercnel tovabb tart a betoltes, megjelenik egy "Ujraprobalkozas" es "Kijelentkezes" gomb. Ez megakadalyozza, hogy a felhasznalo orokre a spinnernel ragadjon.

### 2. fetchProfile: Robusztusabb hibakezeles

- Ha a profil lekerdezes sikertelen, NE terjen vissza csondben - folytassa a szerepkor ellenorzest (is_admin/is_staff RPC-k)
- Az RPC hivasoknal is ellenorizzuk az error-t es logoljuk
- Konzol logolalas minden lepesnel: `[Auth] Fetching profile...`, `[Auth] Role check: admin=true, staff=false`

### 3. Dupla fetchProfile megelozese

Egy egyszeru flag-el (`isFetchingRef`) megakadalyozzuk, hogy a fetchProfile ketszer fusson parhuzamosan.

### 4. Auth redirect javitas

Ha a felhasznalo be van jelentkezve de a szerepkorok nem toltodtek be rendesen, egyertelmu hibauzenet jelenik meg toast formajaban (nem csendes redirect a fooldara).

---

## Technikai Reszletek

### Modositando fajlok

| Fajl | Valtoztatas |
|------|-------------|
| `src/pages/Auth.tsx` | Loading timeout hozzaadasa (5mp), force logout gomb, jobb feedback |
| `src/contexts/AuthContext.tsx` | fetchProfile hibakezeles javitas, dupla hivas megelozes, RPC hiba logolalas, konzol debug |

### Auth.tsx valtozasok

Az uj loading allapot kezeles:
```text
JELENLEGI:
  if (user || authLoading || rolesLoading) {
    return <LoadingSpinner />
  }

JAVITOTT:
  Uj state: loadingTooLong (starts false)
  useEffect: 5mp utan loadingTooLong = true
  
  if (user || authLoading || rolesLoading) {
    if (loadingTooLong) {
      return:
        - Uzenet: "Betoltes folyamatban..."
        - "Ujra probalkozas" gomb (fetchProfile ujrahivas)
        - "Kijelentkezes" gomb (signOut + navigate('/auth'))
    }
    return <LoadingSpinner />
  }
```

### AuthContext.tsx valtozasok

A fetchProfile fuggveny javitasa:
```text
JELENLEGI fetchProfile:
  1. setRolesLoading(true)
  2. Fetch profile -> ha error, RETURN (szerepkorok nem toltodnek be)
  3. bootstrap_first_admin
  4. is_admin RPC (error nincs kezelve)
  5. is_staff RPC (error nincs kezelve)
  6. finally: setRolesLoading(false)

JAVITOTT fetchProfile:
  1. isFetchingRef check - ha mar fut, return
  2. setRolesLoading(true)
  3. isFetchingRef = true
  4. Fetch profile -> ha error, LOGOLAS de NEM return, folytatjuk
  5. bootstrap_first_admin (try/catch korul)
  6. is_admin RPC -> error ellenorzes es logolalas
  7. is_staff RPC -> error ellenorzes es logolalas
  8. console.log('[Auth] Roles determined: admin=X, staff=Y')
  9. finally: setRolesLoading(false), isFetchingRef = false
```

A dupla hivas megelozese:
```text
JELENLEGI:
  getSession -> fetchProfile(userId)
  onAuthStateChange -> setTimeout(() => fetchProfile(userId), 0)
  -> Ket parhuzamos fetchProfile hivas

JAVITOTT:
  useRef isFetchingRef = false
  fetchProfile elejen: if (isFetchingRef.current) return
  fetchProfile inditasakor: isFetchingRef.current = true
  fetchProfile vegeztevel: isFetchingRef.current = false
```

