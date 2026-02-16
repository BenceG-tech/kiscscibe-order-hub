import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "cookie-consent";
const LEVEL_KEY = "cookie-consent-level";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (level: "necessary" | "all") => {
    setAnimateOut(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "accepted");
      localStorage.setItem(LEVEL_KEY, level);
      setVisible(false);
      window.dispatchEvent(new Event("cookie-consent-accepted"));
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-[72px] md:bottom-0 left-0 right-0 z-[60] p-3 md:p-4 transition-all duration-300 ${
        animateOut ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-3 md:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
        <Cookie className="h-5 w-5 sm:h-7 sm:w-7 text-primary shrink-0" />
        <div className="flex-1 text-xs sm:text-sm text-muted-foreground">
          <p>
            Weboldalunk sütiket és helyi tárolást (localStorage) használ a megfelelő működés biztosításához.
            Jelenleg csak a szükséges (elengedhetetlen) sütiket használjuk.{" "}
            <Link to="/cookie-szabalyzat" className="text-primary hover:underline font-medium">
              További információk →
            </Link>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
          <Button onClick={() => handleConsent("necessary")} variant="outline" size="sm" className="w-full sm:w-auto whitespace-nowrap">
            Csak szükséges
          </Button>
          <Button onClick={() => handleConsent("all")} size="sm" className="w-full sm:w-auto whitespace-nowrap">
            Összes elfogadása
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
