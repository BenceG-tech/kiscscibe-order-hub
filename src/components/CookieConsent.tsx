import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "cookie-consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setAnimateOut(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "accepted");
      setVisible(false);
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-300 ${
        animateOut ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Cookie className="h-8 w-8 text-primary shrink-0 hidden sm:block" />
        <div className="flex-1 text-sm text-muted-foreground">
          <p>
            Weboldalunk sütiket és helyi tárolást (localStorage) használ a megfelelő működés biztosításához.
            Jelenleg csak a szükséges (elengedhetetlen) sütiket használjuk.{" "}
            <Link to="/cookie-szabalyzat" className="text-primary hover:underline font-medium">
              További információk →
            </Link>
          </p>
        </div>
        <Button onClick={handleAccept} size="sm" className="shrink-0 whitespace-nowrap">
          Elfogadom
        </Button>
      </div>
    </div>
  );
};

export default CookieConsent;
