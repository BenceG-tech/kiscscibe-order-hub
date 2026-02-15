import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  fileUrls: string[];
  onChange: (urls: string[]) => void;
}

const InvoiceFileUpload = ({ fileUrls, onChange }: Props) => {
  const [uploading, setUploading] = useState(false);
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

      const { data: urlData } = supabase.storage
        .from("invoices")
        .getPublicUrl(path);

      // For private buckets we use signed URLs
      const { data: signedData } = await supabase.storage
        .from("invoices")
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

      newUrls.push(signedData?.signedUrl || urlData.publicUrl);
    }

    onChange([...fileUrls, ...newUrls]);
    setUploading(false);
    if (newUrls.length > 0) toast.success(`${newUrls.length} fájl feltöltve`);
  };

  const remove = (idx: number) => {
    onChange(fileUrls.filter((_, i) => i !== idx));
  };

  const getFileIcon = (url: string) => {
    if (url.match(/\.(pdf)$/i) || url.includes(".pdf")) return <FileText className="h-4 w-4" />;
    return <ImageIcon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
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
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="flex-1 sm:flex-none"
        >
          <Upload className="h-4 w-4 mr-1" />
          Fájl kiválasztása
        </Button>
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

      {fileUrls.length > 0 && (
        <div className="space-y-1">
          {fileUrls.map((url, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm bg-muted/50 rounded px-2 py-1">
              {getFileIcon(url)}
              <span className="truncate flex-1 text-xs">
                Fájl {idx + 1}
              </span>
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
