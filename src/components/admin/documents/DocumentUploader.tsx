import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload, Camera, Loader2, FolderOpen, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFolders, useTags, useUploadDocument } from "@/hooks/useDocuments";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  folderId: string | null;
  defaultTags?: string[];
}

export const DocumentUploader = ({ folderId, defaultTags = [] }: Props) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folderId ?? "none");
  const [selectedTags, setSelectedTags] = useState<string[]>(defaultTags);
  const [uploading, setUploading] = useState<{ name: string; progress: number }[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument();
  const { data: folders = [] } = useFolders();
  const { data: tags = [] } = useTags();

  const defaultTagKey = useMemo(() => defaultTags.join("|"), [defaultTags]);

  useEffect(() => {
    setSelectedFolderId(folderId ?? "none");
  }, [folderId]);

  useEffect(() => {
    setSelectedTags(defaultTags);
  }, [defaultTagKey]);

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName],
    );
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      const targetFolderId = selectedFolderId === "none" ? null : selectedFolderId;
      setUploading(arr.map((f) => ({ name: f.name, progress: 0 })));

      let success = 0;
      let newVersionCount = 0;
      for (const file of arr) {
        try {
          const result = await upload.mutateAsync({ file, folderId: targetFolderId, tags: selectedTags });
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
            : selectedTags.length || targetFolderId
              ? "A kiválasztott mappával és címkékkel mentve."
              : undefined,
        });
      }
    },
    [selectedFolderId, selectedTags, upload],
  );

  return (
    <div className="rounded-xl border bg-card/50 p-4 md:p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" /> Mappa feltöltéskor
          </label>
          <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
            <SelectTrigger>
              <SelectValue placeholder="Mappa választása" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nincs mappa</SelectItem>
              {folders.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-[1.4] space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Tags className="h-3.5 w-3.5" /> Címkék feltöltéskor
          </label>
          <div className="min-h-10 rounded-md border bg-background px-2 py-1.5 flex flex-wrap gap-1.5">
            {tags.length === 0 ? (
              <span className="text-xs text-muted-foreground px-1 py-1">Nincs címke létrehozva</span>
            ) : (
              tags.map((t) => {
                const active = selectedTags.includes(t.name);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.name)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                      active ? "ring-2 ring-offset-1 ring-offset-background" : "opacity-70"
                    }`}
                    style={{ backgroundColor: `${t.color}20`, borderColor: t.color, color: t.color }}
                  >
                    {active ? "✓ " : "+ "}{t.name}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

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
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/10" : "border-border bg-background/60"
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
    </div>
  );
};
