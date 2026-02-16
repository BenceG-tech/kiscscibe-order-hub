import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, getDay } from "date-fns";
import { getSmartWeekStart, getSmartInitialDate } from "@/lib/dateUtils";
import { hu } from "date-fns/locale";
import { Download, Image as ImageIcon, Upload, Trash2, Loader2, Calendar, ChevronLeft, ChevronRight, RotateCcw, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import FacebookPostGenerator from "@/components/admin/FacebookPostGenerator";

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
    if (remainder === 0) return `${thousands}.000.-`;
    return `${thousands}.${String(remainder).padStart(3, "0")}.-`;
  }
  return `${price}.-`;
}

function getWeekDates(offset: number = 0): string[] {
  const smartStart = getSmartWeekStart();
  const monday = addDays(smartStart, offset * 7);
  const dates: string[] = [];
  for (let i = 0; i < 5; i++) {
    dates.push(format(addDays(monday, i), "yyyy-MM-dd"));
  }
  return dates;
}

function getInitialSelectedDate(): string {
  const smartDate = getSmartInitialDate();
  return format(smartDate, "yyyy-MM-dd");
}

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

interface FormatConfig {
  key: string;
  label: string;
  badge: string;
  width: number;
  height: number;
  filename: string;
}

const FORMATS: FormatConfig[] = [
  { key: "facebook", label: "Facebook post", badge: "Facebook", width: 1200, height: 675, filename: "facebook" },
  { key: "instaPost", label: "Instagram post", badge: "Insta Post", width: 1080, height: 1080, filename: "insta_post" },
  { key: "instaStory", label: "Instagram story", badge: "Insta Story", width: 1080, height: 1920, filename: "insta_story" },
];

function measureContentHeight(data: DayData, noteText?: string): number {
  const menuItems = data.items.filter((i) => i.is_menu_part);
  const alacarteItems = data.items.filter((i) => !i.is_menu_part);

  let h = 0;
  h += 60; // header
  h += 22; // separator gap
  h += alacarteItems.length * 34; // a la carte items
  if (noteText) {
    h += 8;
    const estimatedLines = Math.ceil((noteText.length * 12) / (1200 - 100));
    h += Math.max(1, estimatedLines) * 24;
  }
  if (menuItems.length > 0) {
    h += 15 + 22 + 42; // separator + gap + "Menü" title
    const soup = menuItems.find((i) => i.menu_role === "leves");
    const main = menuItems.find((i) => i.menu_role === "főétel");
    if (soup) h += 34;
    if (main) h += 34;
    h += 10 + 50; // gap + price line
  }
  h += 20 + 20 + 20 + 24; // footer lines
  return h;
}

function drawToCanvas(
  canvas: HTMLCanvasElement,
  data: DayData,
  dateStr: string,
  W: number,
  H: number,
  logoImg?: HTMLImageElement,
  menuPrice: number = 2200
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = W;
  canvas.height = H;

  // Two-pass scaling: fit content into canvas
  const MARGIN = 40; // px margin top+bottom at final scale
  const baseContentH = measureContentHeight(data, data.offer_note);
  const hScale = W / 1200;
  const vScale = (H - MARGIN * 2) / baseContentH;
  const scale = Math.min(hScale, vScale);

  const YELLOW = "#efbe13";
  const WHITE = "#ffffff";
  const PAD = Math.round(50 * scale);
  const FOOD_FONT = "Arial, Helvetica, sans-serif";

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, W, 0);
  bgGrad.addColorStop(0, "#252b38");
  bgGrad.addColorStop(1, "#1c232f");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  const menuItems = data.items.filter((i) => i.is_menu_part);
  const alacarteItems = data.items.filter((i) => !i.is_menu_part);

  // Content is scaled; center vertically
  const scaledContentH = baseContentH * scale;
  const yOffset = Math.max(MARGIN, Math.round((H - scaledContentH) / 2));

  const dateObj = new Date(dateStr + "T00:00:00");
  const dayName = HU_DAYS_LOWER[dateObj.getDay()];
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  let y = yOffset;

  // Header
  ctx.fillStyle = YELLOW;
  ctx.font = `${Math.round(40 * scale)}px Sofia, Georgia, serif`;
  ctx.textAlign = "center";
  ctx.fillText(`Napi ajánlat  ${month}.${day}. ${dayName}  11:30-tól`, W / 2, y + Math.round(40 * scale));
  y += Math.round(60 * scale);

  // Yellow separator
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  y += Math.round(22 * scale);

  // A la carte items
  for (const item of alacarteItems) {
    const name = item.item_name.charAt(0).toUpperCase() + item.item_name.slice(1);
    ctx.fillStyle = WHITE;
    ctx.font = `${Math.round(28 * scale)}px ${FOOD_FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(name, PAD, y + Math.round(28 * scale));

    if (item.item_price_huf > 0) {
      ctx.fillStyle = WHITE;
      ctx.textAlign = "right";
      ctx.font = `${Math.round(28 * scale)}px ${FOOD_FONT}`;
      ctx.fillText(formatPrice(item.item_price_huf) + " Ft", W - PAD, y + Math.round(28 * scale));
    }
    y += Math.round(34 * scale);
  }

  // Note
  if (data.offer_note) {
    y += Math.round(8 * scale);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = `${Math.round(20 * scale)}px ${FOOD_FONT}`;
    ctx.textAlign = "left";
    const lines = wrapText(ctx, data.offer_note, W - PAD * 2);
    for (const line of lines) {
      ctx.fillText(line, PAD, y + Math.round(20 * scale));
      y += Math.round(24 * scale);
    }
  }

  // Menu section
  if (menuItems.length > 0) {
    y += Math.round(15 * scale);

    ctx.strokeStyle = YELLOW;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
    y += Math.round(22 * scale);

    ctx.fillStyle = YELLOW;
    ctx.font = `${Math.round(36 * scale)}px Sofia, Georgia, serif`;
    ctx.textAlign = "left";
    ctx.fillText("Menü", PAD, y + Math.round(36 * scale));
    y += Math.round(42 * scale);

    const soup = menuItems.find((i) => i.menu_role === "leves");
    const main = menuItems.find((i) => i.menu_role === "főétel");

    if (soup) {
      const name = soup.item_name.charAt(0).toUpperCase() + soup.item_name.slice(1);
      ctx.fillStyle = WHITE;
      ctx.font = `${Math.round(26 * scale)}px ${FOOD_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText(`🥣  ${name}`, PAD + Math.round(10 * scale), y + Math.round(26 * scale));
      y += Math.round(34 * scale);
    }

    if (main) {
      const name = main.item_name.charAt(0).toUpperCase() + main.item_name.slice(1);
      ctx.fillStyle = WHITE;
      ctx.font = `${Math.round(26 * scale)}px ${FOOD_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText(`🍖  ${name}`, PAD + Math.round(10 * scale), y + Math.round(26 * scale));
      y += Math.round(34 * scale);
    }

    y += Math.round(10 * scale);

    // menuPrice is now a parameter
    ctx.fillStyle = YELLOW;
    ctx.font = `${Math.round(34 * scale)}px Sofia, Georgia, serif`;
    ctx.textAlign = "left";
    ctx.fillText(`Helyben: ${formatPrice(menuPrice)} Ft`, PAD, y + Math.round(34 * scale));

    ctx.fillStyle = YELLOW;
    ctx.font = `${Math.round(20 * scale)}px Sofia, Georgia, serif`;
    ctx.textAlign = "right";
    ctx.fillText("(+ 200.- Ft elvitelre a 2 doboz)", W - PAD, y + Math.round(30 * scale));
    y += Math.round(50 * scale);
  }

  // Footer
  y += Math.round(20 * scale);
  ctx.fillStyle = "rgba(239, 190, 19, 0.7)";
  ctx.font = `italic ${Math.round(14 * scale)}px Sofia, Georgia, serif`;
  ctx.textAlign = "center";
  ctx.fillText(
    "A feltüntetett árak köretet nem tartalmazzák! Elviteles doboz: 150.- Ft/étel.",
    W / 2,
    y
  );
  y += Math.round(20 * scale);
  ctx.fillText(
    "Levesből, főzelékekből és a köretekből fél adag is kérhető, fél adagnál 70%-os árat számlázunk.",
    W / 2,
    y
  );
  y += Math.round(24 * scale);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `${Math.round(16 * scale)}px Sofia, Georgia, serif`;
  ctx.textAlign = "center";
  ctx.fillText("Jó étvágyat kívánunk! 🐥", W / 2, y);

  // Logo watermark (bottom-right, relative to content end)
  if (logoImg) {
    const logoSize = Math.round(70 * scale);
    const logoY = Math.min(y + Math.round(20 * scale), H - logoSize - Math.round(20 * scale));
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.drawImage(logoImg, W - PAD - logoSize, logoY, logoSize, logoSize);
    ctx.restore();
  }
}

const DailyOfferImageGenerator = () => {
  const fbCanvasRef = useRef<HTMLCanvasElement>(null);
  const instaPostCanvasRef = useRef<HTMLCanvasElement>(null);
  const instaStoryCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(getInitialSelectedDate);
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");
  const [dataUrls, setDataUrls] = useState<Record<string, string>>({});
  const [menuPrice, setMenuPrice] = useState<number>(2200);
  const weekDates = getWeekDates(weekOffset);

  const weekStart = new Date(weekDates[0] + "T00:00:00");
  const weekEnd = new Date(weekDates[4] + "T00:00:00");
  const weekLabel = `${format(weekStart, "MMM d.", { locale: hu })} – ${format(weekEnd, "MMM d.", { locale: hu })}`;

  const canvasRefs: Record<string, React.RefObject<HTMLCanvasElement>> = {
    facebook: fbCanvasRef,
    instaPost: instaPostCanvasRef,
    instaStory: instaStoryCanvasRef,
  };

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

  // Load Sofia font for canvas
  useEffect(() => {
    const loadFont = async () => {
      try {
        const font = new FontFace('Sofia', 'url(/fonts/Sofia-Regular.ttf)');
        await font.load();
        document.fonts.add(font);
      } catch (err) {
        console.warn('Could not load Sofia font for canvas, falling back', err);
      }
    };
    loadFont();
  }, []);

  // Update menuPrice when dayData changes
  useEffect(() => {
    if (dayData?.menu_price_huf) {
      setMenuPrice(dayData.menu_price_huf);
    } else {
      setMenuPrice(2200);
    }
  }, [dayData]);

  // Draw all 3 canvases when data or menuPrice changes
  useEffect(() => {
    if (!dayData) return;
    document.fonts.ready.then(() => {
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      logo.onload = () => drawAllCanvases(dayData, selectedDate, logo);
      logo.onerror = () => drawAllCanvases(dayData, selectedDate);
      logo.src = "/assets/kiscsibe_logo_round.png";
    });
  }, [dayData, selectedDate, menuPrice]);

  const drawAllCanvases = (data: DayData, dateStr: string, logoImg?: HTMLImageElement) => {
    const newDataUrls: Record<string, string> = {};
    for (const fmt of FORMATS) {
      const canvas = canvasRefs[fmt.key]?.current;
      if (canvas) {
        drawToCanvas(canvas, data, dateStr, fmt.width, fmt.height, logoImg, menuPrice);
        newDataUrls[fmt.key] = canvas.toDataURL("image/png");
      }
    }
    setDataUrls(newDataUrls);
  };

  const handleDownload = (formatKey: string) => {
    const fmt = FORMATS.find(f => f.key === formatKey);
    if (!fmt) return;
    const dataUrl = dataUrls[formatKey];
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `napi_ajanlat_${fmt.filename}_${selectedDate}.png`;
    link.href = dataUrl;
    link.click();
    toast.success("Kép letöltve!");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dayData) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `facebook/${selectedDate}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("menu-images")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("menu-images").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

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

  const openPreview = (formatKey: string) => {
    const url = dataUrls[formatKey];
    if (url) {
      setPreviewDataUrl(url);
      setShowPreview(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden canvases */}
      <canvas ref={fbCanvasRef} className="hidden" />
      <canvas ref={instaPostCanvasRef} className="hidden" />
      <canvas ref={instaStoryCanvasRef} className="hidden" />

      {/* Day Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Nap kiválasztása
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <div className="flex items-center gap-2 pt-1">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Menü ár (Ft):</label>
            <Input
              type="number"
              value={menuPrice}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v > 0) setMenuPrice(v);
              }}
              className="h-8 w-28 text-sm"
              min={0}
            />
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
          {/* 3 Format Preview Cards */}
          {FORMATS.map((fmt) => (
            <Card key={fmt.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    {fmt.label}
                    <Badge variant="secondary" className="text-xs">
                      {fmt.width} × {fmt.height}
                    </Badge>
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openPreview(fmt.key)} className="gap-1.5">
                      <ZoomIn className="h-4 w-4" />
                      Nagyítás
                    </Button>
                    <Button onClick={() => handleDownload(fmt.key)} size="sm" className="gap-1.5">
                      <Download className="h-4 w-4" />
                      Letöltés
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  {dataUrls[fmt.key] ? (
                    <img
                      src={dataUrls[fmt.key]}
                      alt={fmt.label}
                      onClick={() => openPreview(fmt.key)}
                      className={`rounded-lg shadow-lg border border-border cursor-pointer hover:opacity-90 transition-opacity ${
                        fmt.key === "instaStory" ? "max-w-[250px]" : "max-w-[500px]"
                      } w-full`}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground py-8">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generálás...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Lightbox Dialog */}
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-[95vw] sm:max-w-4xl p-2">
              <DialogTitle className="sr-only">Kép előnézet</DialogTitle>
              {previewDataUrl && (
                <img
                  src={previewDataUrl}
                  alt="Napi ajánlat kép"
                  className="w-full rounded-lg max-h-[85vh] object-contain"
                />
              )}
            </DialogContent>
          </Dialog>

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

          {/* Facebook Post Text Generator */}
          <FacebookPostGenerator selectedDate={selectedDate} />
        </>
      )}
    </div>
  );
};

export default DailyOfferImageGenerator;
