
# Facebook poszt szoveg generator javitasa

## Problema

Az edge function kozvetlenul meghivva mukodik (teszteltem, 200-as valaszt ad helyes poszt szoveggel). A problema valoszinuleg a kliens oldali hibakezeles:

1. Amikor a `supabase.functions.invoke()` nem-2xx valaszt kap (pl. 404 - nincs napi ajanlat), `error`-kent adja vissza, nem `data.error`-kent. Igy a felhasznalo csak egy generikus "Hiba a poszt generalasa" uzenetet lat a konkret hibauzenet helyett.
2. A `supabase.functions.invoke` a valasz `body`-t nem mindig JSON-kent parse-olja ha hiba van - a reszletes hibauzenet elveszhet.

## Megoldas

**Fajl:** `src/components/admin/FacebookPostGenerator.tsx`

- A `generatePost` fuggvenyben javitjuk a hibakezelest:
  - A `supabase.functions.invoke` altal visszaadott `error` objektumbol probaljuk kinyerni a reszletes hibauzenet (JSON body parse)
  - A `FunctionsHttpError` tipusu hibaknal a `error.context` vagy `error.message` tartalmazza a szerver valaszat
  - A 404-es es 429-es hibakat kulon kezeljuk ertelmesebb hibauzenetekkel
  - Hozzaadunk egy `console.log`-ot a `data` es `error` valtozokra a jobb debugolashoz

### Konkret valtozasok

```typescript
const generatePost = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase.functions.invoke("generate-facebook-post", {
      body: { date: selectedDate },
    });

    if (error) {
      // Try to extract the actual error message from the response
      let errorMessage = "Hiba a poszt generalásakor";
      try {
        const errorBody = await error.context?.json?.();
        if (errorBody?.error) {
          errorMessage = errorBody.error;
        }
      } catch {}
      toast.error(errorMessage);
      console.error("Facebook post gen error:", error);
      return;
    }

    if (data?.error) {
      toast.error(data.error);
      return;
    }

    setPostText(data.post_text || "");
    setHashtags(data.hashtags || []);
    toast.success("Poszt szöveg generálva!");
  } catch (err: any) {
    console.error("Facebook post gen error:", err);
    toast.error(err?.message || "Hiba a poszt generálásakor");
  } finally {
    setLoading(false);
  }
};
```

Ez biztositja, hogy:
- A 404-es "Nincs napi ajanlat" uzenet megjelenjen a felhasznalonak
- A 429-es rate limit uzenet is lathato legyen
- A 402-es "AI szolgaltatas korlat" is ertelmesen jelenjen meg
- A generikus hiba uzenet csak akkor jelenik meg ha tenyleg ismeretlen a hiba
