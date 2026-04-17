import { useCallback, useRef, useState } from "react";
import { Upload, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadDocument } from "@/hooks/useDocuments";
import { toast } from "@/hooks/use-toast";

interface Props {
  folderId: string | null;
  defaultTags?: string[];
}

export const DocumentUploader = ({ folderId, defaultTags = [] }: Props) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState<{ name: string; progress: number }[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument();

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      setUploading(arr.map((f) => ({ name: f.name, progress: 0 })));

      let success = 0;
      let newVersionCount = 0;
      for (const file of arr) {
        try {
          const result = await upload.mutateAsync({ file, folderId, tags: defaultTags });
          if (result?.version && result.version > 1) newVersionCount++;
          success++;
          setUploading((prev) =>
            prev.map((u) => (u.name === file.name ? { ...u, progress: 100 } : u)),
          );
        } catch (e) {
          // hiba toast a hookból jön
        }
      }
      setTimeout(() => setUploading([]), 1500);
      if (success > 0) {
        toast({
          title: `${success} fájl feltöltve`,
          description: newVersionCount
            ? `${newVersionCount} fájl új verzióként mentve (azonos név).`
            : undefined,
        });
      }
    },
    [folderId, defaultTags, upload],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
      }}
      className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
        dragOver ? "border-primary bg-primary/10" : "border-border bg-card/50"
      }`}
    >
      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm text-muted-foreground mb-3">
        Húzd ide a fájlokat, vagy kattints a feltöltéshez
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={() => fileInput.current?.click()} size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Fájl választás
        </Button>
        <Button
          onClick={() => cameraInput.current?.click()}
          size="sm"
          variant="outline"
          className="md:hidden"
        >
          <Camera className="h-4 w-4 mr-2" />
          Fotózás
        </Button>
      </div>
      <input
        ref={fileInput}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      {uploading.length > 0 && (
        <div className="mt-4 space-y-1.5 text-left">
          {uploading.map((u) => (
            <div key={u.name} className="flex items-center gap-2 text-xs">
              {u.progress < 100 ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className="text-primary">✓</span>
              )}
              <span className="truncate flex-1">{u.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
