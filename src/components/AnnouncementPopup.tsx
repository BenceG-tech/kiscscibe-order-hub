import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Info, AlertTriangle, Gift, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnnouncementData {
  enabled: boolean;
  title: string;
  message: string;
  type: "info" | "warning" | "promo";
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string | null;
  updatedAt: string;
}

const TYPE_STYLES = {
  info: {
    icon: Info,
    border: "border-blue-300 dark:border-blue-700",
    iconColor: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-300 dark:border-amber-700",
    iconColor: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  promo: {
    icon: Gift,
    border: "border-primary/50",
    iconColor: "text-primary",
    bg: "bg-primary/5",
  },
};

const AnnouncementPopup = () => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const { data: announcement } = useQuery({
    queryKey: ["announcement-popup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value_json")
        .eq("key", "announcement")
        .maybeSingle();
      if (error) throw error;
      return (data?.value_json as unknown as AnnouncementData) ?? null;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!announcement?.enabled || !announcement.title) return;
    const dismissKey = `announcement-dismissed-${announcement.updatedAt}`;
    if (localStorage.getItem(dismissKey)) return;

    const tryOpen = () => {
      if (localStorage.getItem("cookie-consent")) {
        setOpen(true);
        return true;
      }
      return false;
    };

    // If cookie consent already accepted, open after small delay
    if (tryOpen()) return;

    // Otherwise wait for cookie consent
    const onConsent = () => {
      setTimeout(() => setOpen(true), 600);
    };
    window.addEventListener("cookie-consent-accepted", onConsent);
    return () => window.removeEventListener("cookie-consent-accepted", onConsent);
  }, [announcement]);

  const handleDismiss = () => {
    setOpen(false);
    if (announcement?.updatedAt) {
      localStorage.setItem(`announcement-dismissed-${announcement.updatedAt}`, "1");
    }
  };

  const handleCta = () => {
    handleDismiss();
    if (announcement?.ctaLink) {
      if (announcement.ctaLink.startsWith("http")) {
        window.open(announcement.ctaLink, "_blank");
      } else {
        navigate(announcement.ctaLink);
      }
    }
  };

  if (!announcement?.enabled || !announcement.title) return null;

  const style = TYPE_STYLES[announcement.type] || TYPE_STYLES.info;
  const TypeIcon = style.icon;

  const content = (
    <div className="space-y-3">
      <div className={cn("rounded-lg p-4 border-2 space-y-3", style.border, style.bg)}>
        <div className="flex items-start gap-3">
          <TypeIcon className={cn("h-6 w-6 shrink-0 mt-0.5", style.iconColor)} />
          <div className="space-y-1.5 min-w-0">
            <p className="font-semibold text-foreground">{announcement.title}</p>
            {announcement.message && (
              <p className="text-sm text-muted-foreground whitespace-pre-line">{announcement.message}</p>
            )}
          </div>
        </div>
        {announcement.imageUrl && (
          <img
            src={announcement.imageUrl}
            alt={announcement.title}
            className="w-full rounded-md object-cover max-h-48"
          />
        )}
      </div>
      <div className="flex gap-2 justify-end">
        {announcement.ctaText && announcement.ctaLink && (
          <Button onClick={handleCta} size="sm">
            {announcement.ctaText}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleDismiss}>
          Értem
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <TypeIcon className={cn("h-5 w-5", style.iconColor)} />
              Értesítés
            </DrawerTitle>
            <DrawerDescription className="sr-only">Éttermi értesítés</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2">{content}</div>
          <DrawerFooter />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className={cn("h-5 w-5", style.iconColor)} />
            Értesítés
          </DialogTitle>
          <DialogDescription className="sr-only">Éttermi értesítés</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementPopup;
