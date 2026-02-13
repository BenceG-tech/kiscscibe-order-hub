import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, getDay } from "date-fns";
import { hu } from "date-fns/locale";
import { Download, Image as ImageIcon, Upload, Trash2, Loader2, Calendar, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface MenuItem {
  id: string;
  item_id: string;
  is_menu_part: boolean;
  menu_role?: string;
  item_name: string;
  item_description?: string;
  item_price_huf: number;
}

interface DayData {
  offer_id: string;
  offer_date: string;
  offer_note?: string;
  menu_price_huf?: number;
  items: MenuItem[];
  facebook_image_url?: string | null;
}

const HU_DAYS_LOWER = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];

function formatPrice(price: number): string {
  if (price >= 1000) {
    const thousands = Math.floor(price / 1000);
    const remainder = price % 1000;
    if (remainder === 0) return `${thousands}.000,-`;
    return `${thousands}.${String(remainder).padStart(3, "0")},-`;
  }
  return `${price},-`;
}

function getWeekDates(offset: number = 0): string[] {
  const now = new Date();
  const monday = addDays(startOfWeek(now, { weekStartsOn: 1 }), offset * 7);
  const dates: string[] = [];
  for (let i = 0; i < 5; i++) {
    dates.push(format(addDays(monday, i), "yyyy-MM-dd"));
  }
  return dates;
}

const DailyOfferImageGenerator = () => {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const weekDates = getWeekDates(weekOffset);

  const weekStart = new Date(weekDates[0] + "T00:00:00");
  const weekEnd = new Date(weekDates[4] + "T00:00:00");
  const weekLabel = `${format(weekStart, "MMM d.", { locale: hu })} – ${format(weekEnd, "MMM d.", { locale: hu })}`;

  const handlePrevWeek = () => {
    setWeekOffset(w => w - 1);
    const prev = getWeekDates(weekOffset - 1);
    setSelectedDate(prev[0]);
  };

  const handleNextWeek = () => {
    setWeekOffset(w => w + 1);
    const next = getWeekDates(weekOffset + 1);
    setSelectedDate(next[0]);
  };

  const handleCurrentWeek = () => {
    setWeekOffset(0);
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
  };

  const fetchDayData = useCallback(async (dateStr: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_daily_data", { target_date: dateStr });
      if (error) throw error;

      // Also fetch facebook_image_url
      const { data: offerRow } = await supabase
        .from("daily_offers")
        .select("facebook_image_url")
        .eq("date", dateStr)
        .maybeSingle();

      if (data && data.length > 0) {
        const result = data[0];
        const items: MenuItem[] = Array.isArray(result.items)
          ? result.items.map((item: any) => ({
              id: item.id,
              item_id: item.item_id,
              is_menu_part: item.is_menu_part,
              menu_role: item.menu_role,
              item_name: item.item_name,
              item_description: item.item_description,
              item_price_huf: item.item_price_huf,
            }))
          : [];

        const dayInfo: DayData = {
          offer_id: result.offer_id,
          offer_date: result.offer_date,
          offer_note: result.offer_note || undefined,
          menu_price_huf: result.menu_price_huf || undefined,
          items,
          facebook_image_url: offerRow?.facebook_image_url || null,
        };
        setDayData(dayInfo);
        setUploadedImageUrl(offerRow?.facebook_image_url || null);
      } else {
        setDayData(null);
        setUploadedImageUrl(null);
      }
    } catch (err) {
      console.error("Error fetching day data:", err);
      setDayData(null);
      setUploadedImageUrl(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDayData(selectedDate);
  }, [selectedDate, fetchDayData]);

  // Draw canvas when data changes
  useEffect(() => {
    if (!dayData || !canvasRef.current) return;
    drawCanvas(dayData, selectedDate);
  }, [dayData, selectedDate]);

  const drawCanvas = (data: DayData, dateStr: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1a1a2e");
    bg.addColorStop(1, "#16213e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const GOLD = "#d4a843";
    const WHITE = "#ffffff";
    const GRAY = "#9ca3af";
    const PAD = 80;
    let y = 80;

    // Date info
    const dateObj = new Date(dateStr + "T00:00:00");
    const dayName = HU_DAYS_LOWER[dateObj.getDay()];
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    // Header: "Napi ajánlat"
    ctx.fillStyle = GOLD;
    ctx.font = "italic 52px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Napi ajánlat", W / 2, y + 52);
    y += 80;

    // Date line
    ctx.font = "bold 38px Arial, sans-serif";
    ctx.fillStyle = GOLD;
    ctx.fillText(`${month}.${day}. ${dayName} 11:30-tól`, W / 2, y + 38);
    y += 70;

    // Gold line
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
    y += 40;

    // Separate menu items and a la carte items
    const menuItems = data.items.filter((i) => i.is_menu_part);
    const alacarteItems = data.items.filter((i) => !i.is_menu_part);

    // A la carte items first
    ctx.textAlign = "left";
    for (const item of alacarteItems) {
      const name = item.item_name.charAt(0).toUpperCase() + item.item_name.slice(1);
      ctx.fillStyle = WHITE;
      ctx.font = "32px Arial, sans-serif";
      ctx.fillText(name, PAD, y + 32);

      if (item.item_price_huf > 0) {
        ctx.textAlign = "right";
        ctx.fillText(formatPrice(item.item_price_huf), W - PAD, y + 32);
        ctx.textAlign = "left";
      }
      y += 52;
    }

    // Note section (if exists)
    if (data.offer_note) {
      y += 10;
      ctx.fillStyle = GRAY;
      ctx.font = "italic 24px Arial, sans-serif";
      const lines = wrapText(ctx, data.offer_note, W - PAD * 2);
      for (const line of lines) {
        ctx.fillText(line, PAD, y + 24);
        y += 34;
      }
    }

    // Menu section
    if (menuItems.length > 0 && data.menu_price_huf) {
      y += 30;

      // Gold separator
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PAD, y);
      ctx.lineTo(W - PAD, y);
      ctx.stroke();
      y += 40;

      // "Menü" title
      ctx.fillStyle = GOLD;
      ctx.font = "italic 44px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("Menü", W / 2, y + 44);
      y += 70;

      // Menu items
      ctx.textAlign = "left";
      const soup = menuItems.find((i) => i.menu_role === "leves");
      const main = menuItems.find((i) => i.menu_role === "főétel");

      if (soup) {
        const name = soup.item_name.charAt(0).toUpperCase() + soup.item_name.slice(1);
        ctx.fillStyle = WHITE;
        ctx.font = "32px Arial, sans-serif";
        ctx.fillText(`🥣 ${name}`, PAD, y + 32);
        y += 52;
      }

      if (main) {
        const name = main.item_name.charAt(0).toUpperCase() + main.item_name.slice(1);
        ctx.fillStyle = WHITE;
        ctx.font = "32px Arial, sans-serif";
        ctx.fillText(`🍖 ${name}`, PAD, y + 32);
        y += 52;
      }

      y += 20;

      // Menu price
      ctx.fillStyle = GOLD;
      ctx.font = "bold 40px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Helyben: ${formatPrice(data.menu_price_huf)}  Ft`, W / 2, y + 40);
      y += 60;

      // Takeaway note
      ctx.fillStyle = GRAY;
      ctx.font = "italic 24px Arial, sans-serif";
      ctx.fillText("(+ 200,- Ft a 2 doboz elvitelre)", W / 2, y + 24);
      y += 50;
    }

    // Footer note
    y = Math.max(y + 20, H - 120);
    ctx.fillStyle = GRAY;
    ctx.font = "italic 22px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("A koretek minden nap választhatók az ételekhez.", W / 2, y + 22);
    y += 36;
    ctx.fillText("Jó étvágyat kívánunk! 🐥", W / 2, y + 22);
  };

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `napi_ajanlat_${selectedDate}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Kép letöltve!");
  };

  // Upload image
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dayData) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `facebook/${selectedDate}.${ext}`;

      // Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from("menu-images")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("menu-images").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // Update daily_offers row
      const { error: updateErr } = await supabase
        .from("daily_offers")
        .update({ facebook_image_url: publicUrl } as any)
        .eq("id", dayData.offer_id);
      if (updateErr) throw updateErr;

      setUploadedImageUrl(publicUrl);
      toast.success("Kép feltöltve!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Hiba a feltöltés során.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async () => {
    if (!dayData) return;
    setUploading(true);
    try {
      const { error: updateErr } = await supabase
        .from("daily_offers")
        .update({ facebook_image_url: null } as any)
        .eq("id", dayData.offer_id);
      if (updateErr) throw updateErr;

      // Try to delete from storage
      const path = `facebook/${selectedDate}`;
      await supabase.storage.from("menu-images").remove([`${path}.jpg`, `${path}.jpeg`, `${path}.png`]);

      setUploadedImageUrl(null);
      toast.success("Kép törölve.");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Hiba a törlés során.");
    } finally {
      setUploading(false);
    }
  };

  const dateObj = new Date(selectedDate + "T00:00:00");
  const dayOfWeek = getDay(dateObj);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return (
    <div className="space-y-6">
      {/* Day Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Nap kiválasztása
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Week navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold capitalize">{weekLabel}</span>
            <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
            {weekOffset !== 0 && (
              <Button variant="outline" size="sm" onClick={handleCurrentWeek} className="text-xs gap-1">
                <RotateCcw className="h-3 w-3" />
                Mai hét
              </Button>
            )}
          </div>
          {/* Day buttons */}
          <div className="flex flex-wrap gap-2">
            {weekDates.map((d) => {
              const dObj = new Date(d + "T00:00:00");
              const label = format(dObj, "EEE, MMM d.", { locale: hu });
              const isSelected = d === selectedDate;
              return (
                <Button
                  key={d}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDate(d)}
                  className="text-xs sm:text-sm"
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Betöltés...</span>
          </CardContent>
        </Card>
      ) : !dayData || dayData.items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {isWeekend
              ? "Hétvégi napon nincs napi ajánlat."
              : "Erre a napra még nincs napi ajánlat beállítva."}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Canvas Preview + Download */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Generált kép
                </CardTitle>
                <Button onClick={handleDownload} size="sm" className="gap-1.5">
                  <Download className="h-4 w-4" />
                  Letöltés
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="w-full max-w-[400px] rounded-lg shadow-lg border border-border"
                  style={{ aspectRatio: "1080/1350" }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Upload Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Kép feltöltése a weboldalra
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tölts fel egy képet (pl. a Facebookra posztolt napi ajánlat képét), ami megjelenik a weboldalon is.
              </p>

              <div className="flex items-center gap-3">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="max-w-xs"
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>

              {uploadedImageUrl && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Feltöltött kép
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteImage}
                      disabled={uploading}
                      className="text-destructive hover:text-destructive h-7 px-2"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Törlés
                    </Button>
                  </div>
                  <img
                    src={uploadedImageUrl}
                    alt="Feltöltött napi ajánlat"
                    className="max-w-[300px] rounded-lg shadow border border-border"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DailyOfferImageGenerator;
