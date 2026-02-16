import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, FileText, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExtractedInvoiceData {
  partner_name?: string;
  partner_tax_id?: string;
  invoice_number?: string;
  issue_date?: string;
  due_date?: string;
  gross_amount?: number;
  vat_rate?: number;
  category?: string;
  line_items?: { description: string; quantity?: number; unit_price?: number; line_total?: number }[];
}

interface Props {
  fileUrls: string[];
  onChange: (urls: string[]) => void;
  onExtracted?: (data: ExtractedInvoiceData) => void;
}

const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|heic|heif)/i.test(url);

const InvoiceFileUpload = ({ fileUrls, onChange, onExtracted }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("invoices")
        .upload(path, file, { upsert: false });

      if (error) {
        toast.error(`Hiba: ${file.name} — ${error.message}`);
        continue;
      }

      const { data: signedData } = await supabase.storage
        .from("invoices")
        .createSignedUrl(path, 60 * 60 * 24 * 365);

      const { data: urlData } = supabase.storage
        .from("invoices")
        .getPublicUrl(path);

      newUrls.push(signedData?.signedUrl || urlData.publicUrl);
    }

    onChange([...fileUrls, ...newUrls]);
    setUploading(false);
    if (newUrls.length > 0) toast.success(`${newUrls.length} fájl feltöltve`);
  };

  const remove = (idx: number) => {
    onChange(fileUrls.filter((_, i) => i !== idx));
  };

  const handleExtract = async () => {
    const imageUrl = fileUrls.find((u) => isImageUrl(u));
    if (!imageUrl) {
      toast.error("Nincs kép a csatolt fájlok között.");
      return;
    }

    setExtracting(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const { data, error } = await supabase.functions.invoke("extract-invoice-data", {
        body: { image_url: imageUrl },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        onExtracted?.(data.data);
      } else {
        toast.error(data?.error || "Nem sikerült számla adatokat felismerni");
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        toast.error("Időtúllépés — próbáld újra.");
      } else {
        toast.error("Nem sikerült számla adatokat felismerni");
      }
      console.error("Extract error:", err);
    } finally {
      clearTimeout(timeout);
      setExtracting(false);
    }
  };

  const hasImage = fileUrls.some((u) => isImageUrl(u));

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || extracting}
          onClick={() => cameraRef.current?.click()}
          className="flex-1 sm:flex-none"
        >
          <Camera className="h-4 w-4 mr-1" />
          Fotó készítése
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || extracting}
          onClick={() => fileRef.current?.click()}
          className="flex-1 sm:flex-none"
        >
          <Upload className="h-4 w-4 mr-1" />
          Fájl kiválasztása
        </Button>
        {hasImage && onExtracted && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={extracting || uploading}
            onClick={handleExtract}
            className="flex-1 sm:flex-none"
          >
            <Wand2 className="h-4 w-4 mr-1" />
            {extracting ? "Feldolgozás..." : "AI kitöltés"}
          </Button>
        )}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
        multiple
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />

      {uploading && (
        <p className="text-sm text-muted-foreground animate-pulse">Feltöltés...</p>
      )}

      {extracting && (
        <p className="text-sm text-muted-foreground animate-pulse">Számla feldolgozása...</p>
      )}

      {fileUrls.length > 0 && (
        <div className="space-y-1">
          {fileUrls.map((url, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm bg-muted/50 rounded px-2 py-1">
              {isImageUrl(url) ? (
                <img src={url} alt={`Fájl ${idx + 1}`} className="h-8 w-8 rounded object-cover shrink-0" />
              ) : (
                <FileText className="h-4 w-4 shrink-0" />
              )}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate flex-1 text-xs hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Fájl {idx + 1}
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => remove(idx)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceFileUpload;
