import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ModernNavigation from "@/components/ModernNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

const Rate = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order");
  const token = searchParams.get("token");
  const initialRating = parseInt(searchParams.get("rating") || "0", 10);

  const [rating, setRating] = useState(initialRating > 0 && initialRating <= 5 ? initialRating : 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleReviewUrl, setGoogleReviewUrl] = useState("https://g.page/review/kiscsibe");

  useEffect(() => {
    supabase
      .from("settings")
      .select("value_json")
      .eq("key", "google_review_url")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_json) setGoogleReviewUrl(String(data.value_json));
      });
  }, []);

  // Token validation is performed server-side by the submit-rating edge
  // function. The client only checks that the URL has both params present.
  if (!orderId || !token) {
    return (
      <div className="min-h-screen bg-background">
        <ModernNavigation />
        <div className="pt-20 pb-12 max-w-lg mx-auto px-4 text-center">
          <Card>
            <CardContent className="p-8">
              <p className="text-xl">❌ Érvénytelen értékelési link</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Kérjük válassz értékelést (1-5 csillag)");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("submit-rating", {
        body: {
          order_id: orderId,
          token,
          rating,
          comment: comment.trim() || null,
        },
      });
      if (invokeError || (data && (data as any).error)) {
        const errCode = (data as any)?.error;
        if (errCode === "already_rated") {
          setError("Ezt a rendelést már értékelted.");
        } else {
          throw invokeError || new Error(errCode || "submit failed");
        }
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Rating submit error:", err);
      setError("Hiba történt, kérjük próbáld újra.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <ModernNavigation />
        <div className="pt-20 pb-12 max-w-lg mx-auto px-4">
          <Card className="border-primary/20">
            <CardContent className="p-8 text-center space-y-4">
              <div className="text-5xl">💛</div>
              <h1 className="text-2xl font-bold">Köszönjük az értékelést!</h1>
              <p className="text-muted-foreground">
                Visszajelzésed segít, hogy még jobban szolgáljuk ki vendégeinket.
              </p>
              <div className="flex gap-2 text-yellow-500 justify-center">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`h-8 w-8 ${s <= rating ? "fill-current" : ""}`} />
                ))}
              </div>
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4"
              >
                <Button variant="outline" size="lg">
                  ⭐ Értékelj minket Google-ön is!
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      <div className="pt-20 pb-12 max-w-lg mx-auto px-4">
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Hogy ízlett? 🍽️</h1>
              <p className="text-muted-foreground">Értékeld a rendelésedet!</p>
            </div>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      s <= (hover || rating)
                        ? "text-yellow-500 fill-current"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>

            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Opcionális megjegyzés..."
              rows={3}
            />

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button onClick={handleSubmit} disabled={loading || rating === 0} className="w-full" size="lg">
              {loading ? "Küldés..." : "Értékelés küldése"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Rate;
