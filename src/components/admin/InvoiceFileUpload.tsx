import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle2, FileText, Loader2, RefreshCw, Upload, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { extractInvoicePdfContent } from "@/lib/pdfInvoiceExtract";

export interface ExtractedInvoiceData {
  partner_name?: string;
  partner_tax_id?: string;
  invoice_number?: string;
  issue_date?: string;
  due_date?: string;
  gross_amount?: number;
  vat_rate?: number;
  category?: string;
  confidence?: "magas" | "közepes" | "alacsony";
  source?: "image" | "pdf_text" | "pdf_image";
  filled_fields?: string[];
  needs_review?: string[];
  line_items?: { description: string; quantity?: number; unit?: string; unit_price?: number; line_total?: number }[];
}

interface Props {
  fileUrls: string[];
  onChange: (urls: string[]) => void;
  onExtracted?: (data: ExtractedInvoiceData) => void;
}

type ProcessingStatus = "uploaded" | "extracting" | "done" | "partial" | "failed";

interface UploadedFileMeta {
  url: string;
  name: string;
  type: string;
  status: ProcessingStatus;
  source?: ExtractedInvoiceData["source"];
  message?: string;
}

const isImageFile = (file: File) => file.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(file.name);
const isPdfFile = (file: File) => file.type === "application/pdf" || /\.pdf$/i.test(file.name);
const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|heic|heif)(\?|$)/i.test(url);

const sourceLabel = (source?: ExtractedInvoiceData["source"]) => {
  if (source === "pdf_text") return "PDF szöveg";
  if (source === "pdf_image") return "PDF képként";
  return "Kép";
};

const statusLabel: Record<ProcessingStatus, string> = {
  uploaded: "feltöltve",
  extracting: "adatkinyerés folyamatban",
  done: "AI feldolgozva",
  partial: "részleges felismerés",
  failed: "kézi kitöltés kell",
};

const InvoiceFileUpload = ({ fileUrls, onChange, onExtracted }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [filesMeta, setFilesMeta] = useState<UploadedFileMeta[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const displayedFiles = useMemo(() => fileUrls.map((url, idx) => {
    const meta = filesMeta.find((f) => f.url === url);
    return meta || { url, name: `Fájl ${idx + 1}`, type: isImageUrl(url) ? "image" : "file", status: "uploaded" as ProcessingStatus };
  }), [fileUrls, filesMeta]);

  const updateMeta = (url: string, patch: Partial<UploadedFileMeta>) => {
    setFilesMeta((prev) => prev.map((item) => (item.url === url ? { ...item, ...patch } : item)));
  };

  const extractFromFile = async (file: File, url: string) => {
    if (!onExtracted) return;
    if (!isImageFile(file) && !isPdfFile(file)) {
      updateMeta(url, { status: "failed", message: "Nem támogatott fájltípus" });
      return;
    }

    updateMeta(url, { status: "extracting", message: "Adatkinyerés folyamatban..." });
    setExtracting(true);

    try {
      let body: Record<string, unknown> = {
        file_name: file.name,
        file_type: file.type || file.name.split(".").pop(),
      };
      let source: ExtractedInvoiceData["source"] = "image";

      if (isPdfFile(file)) {
        const pdfContent = await extractInvoicePdfContent(file);
        source = pdfContent.source === "pdf_image" ? "pdf_image" : "pdf_text";
        body = pdfContent.firstPageImage
          ? { ...body, image_url: pdfContent.firstPageImage, document_text: pdfContent.text, source }
          : { ...body, document_text: pdfContent.text, source };
      } else {
        body = { ...body, image_url: url, source };
      }

      const { data, error } = await supabase.functions.invoke("extract-invoice-data", { body });
      if (error) throw error;

      if (data?.success && data?.data) {
        const extracted = { ...data.data, source } as ExtractedInvoiceData;
        onExtracted(extracted);
        const needsReview = extracted.needs_review?.length || 0;
        updateMeta(url, {
          status: needsReview > 0 || extracted.confidence === "alacsony" ? "partial" : "done",
          source,
          message: needsReview > 0 ? `${needsReview} mező kézi ellenőrzést igényel` : "AI felismerés kész",
        });
        toast.success(needsReview > 0 ? "Részleges felismerés — a bizonytalan mezők üresen maradtak." : "AI felismerés kész — kérlek ellenőrizd mentés előtt.");
      } else {
        updateMeta(url, { status: "failed", message: data?.error || "Nem sikerült adatot kinyerni" });
        toast.error(data?.error || "Nem sikerült adatot kinyerni ebből a fájlból.");
      }
    } catch (err: any) {
      updateMeta(url, { status: "failed", message: err?.message || "Sikertelen felismerés" });
      toast.error(err?.message || "Nem sikerült számla adatokat felismerni. Töltsd ki kézzel vagy próbáld újra.");
      console.error("Extract error:", err);
    } finally {
      setExtracting(false);
    }
  };

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    const uploaded: { file: File; url: string }[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("invoices").upload(path, file, { upsert: false, contentType: file.type || undefined });

      if (error) {
        toast.error(`Hiba: ${file.name} — ${error.message}`);
        continue;
      }

      const { data: signedData } = await supabase.storage.from("invoices").createSignedUrl(path, 60 * 60 * 24 * 365);
      const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(path);
      const url = signedData?.signedUrl || urlData.publicUrl;
      newUrls.push(url);
      uploaded.push({ file, url });
      setFilesMeta((prev) => [...prev, { url, name: file.name, type: file.type || ext.toUpperCase(), status: "uploaded" }]);
    }

    onChange([...fileUrls, ...newUrls]);
    setUploading(false);
    if (newUrls.length > 0) toast.success(`${newUrls.length} fájl feltöltve — indul az adatkinyerés.`);

    for (const item of uploaded) {
      await extractFromFile(item.file, item.url);
    }
  };

  const remove = (idx: number) => {
    const removed = fileUrls[idx];
    onChange(fileUrls.filter((_, i) => i !== idx));
    setFilesMeta((prev) => prev.filter((item) => item.url !== removed));
  };

  const retryExtract = async (url: string) => {
    updateMeta(url, { status: "failed", message: "Újrapróbáláshoz töltsd fel ismét ezt a fájlt." });
    toast.info("Biztonsági okból újrapróbáláshoz válaszd ki újra az eredeti fájlt.");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Button type="button" variant="outline" size="sm" disabled={uploading || extracting} onClick={() => cameraRef.current?.click()} className="flex-1 sm:flex-none">
          <Camera className="h-4 w-4 mr-1" />
          Fotó készítése
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={uploading || extracting} onClick={() => fileRef.current?.click()} className="flex-1 sm:flex-none">
          <Upload className="h-4 w-4 mr-1" />
          Fájl kiválasztása
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Tölthetsz fel fotót, képfájlt vagy digitális PDF számlát is. Feltöltés után az AI automatikusan próbál adatot kinyerni; a bizonytalan mezőket üresen hagyja. Fotónál jó fényben, felülről fotózz.
      </p>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => upload(e.target.files)} />
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,image/*,application/pdf" multiple className="hidden" onChange={(e) => upload(e.target.files)} />

      {(uploading || extracting) && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {uploading ? "Fájl feltöltése..." : "Számla adatainak felismerése... Ez eltarthat pár másodpercig."}
        </div>
      )}

      {displayedFiles.length > 0 && (
        <div className="space-y-1.5">
          {displayedFiles.map((file, idx) => (
            <div key={file.url} className="flex items-center gap-2 text-sm bg-muted/50 rounded px-2 py-2">
              {isImageUrl(file.url) ? <img src={file.url} alt={file.name} className="h-9 w-9 rounded object-cover shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 hover:underline" onClick={(e) => e.stopPropagation()}>
                <span className="block truncate text-xs font-medium">{file.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{sourceLabel(file.source)} · {statusLabel[file.status]}{file.message ? ` · ${file.message}` : ""}</span>
              </a>
              {file.status === "extracting" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {file.status === "done" && <CheckCircle2 className="h-4 w-4 text-primary" />}
              {file.status === "partial" && <AlertTriangle className="h-4 w-4 text-muted-foreground" />}
              {file.status === "failed" && onExtracted && (
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => retryExtract(file.url)}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => remove(idx)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceFileUpload;