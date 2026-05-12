import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AIGenerateImageButtonProps {
  itemName: string;
  itemId?: string; // when provided, edge function also updates menu_items.image_url
  onGenerated: (imageUrl: string) => void;
  disabled?: boolean;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "secondary";
  label?: string;
  fullWidth?: boolean;
  hasExistingImage?: boolean;
}

const AIGenerateImageButton = ({
  itemName,
  itemId,
  onGenerated,
  disabled,
  size = "sm",
  variant = "outline",
  label,
  fullWidth,
  hasExistingImage = false,
}: AIGenerateImageButtonProps) => {
  const [loading, setLoading] = useState(false);
  const effectiveLabel = label ?? (hasExistingImage ? "Új AI kép" : "AI kép generálása");
  const effectiveVariant = hasExistingImage && variant === "outline" ? "secondary" : variant;

  const handleClick = async () => {
    if (!itemName?.trim()) {
      toast.error("Előbb add meg az étel nevét");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-food-image", {
        body: { item_id: itemId, item_name: itemName.trim() },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.image_url) throw new Error("Nem sikerült képet generálni");
      onGenerated(data.image_url);
      toast.success("AI kép elkészült");
    } catch (e: any) {
      console.error("AI image gen error:", e);
      toast.error(e?.message || "Hiba a képgenerálásnál");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={effectiveVariant}
      size={size}
      onClick={handleClick}
      disabled={disabled || loading}
      className={fullWidth ? "w-full" : undefined}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : hasExistingImage ? (
        <RefreshCw className="h-4 w-4 mr-2" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      {loading ? "Generálás..." : effectiveLabel}
    </Button>
  );
};

export default AIGenerateImageButton;
