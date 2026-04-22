import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FolderOpen, Info, Loader2, Tags } from "lucide-react";
import {
  DocumentRow,
  getSignedUrl,
  useUpdateDocument,
  useTags,
  useFolders,
} from "@/hooks/useDocuments";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const DocumentDetailDialog = ({
  doc,
  open,
  onOpenChange,
}: {
  doc: DocumentRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const update = useUpdateDocument();
  const { data: tags = [] } = useTags();
  const { data: folders = [] } = useFolders();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState<string>("none");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (doc) {
      setName(doc.name);
      setDescription(doc.description || "");
      setFolderId(doc.folder_id ?? "none");
      setSelectedTags(doc.tags);
      getSignedUrl(doc.file_path).then(setPreviewUrl);
    }
  }, [doc]);

  if (!doc) return null;
  const isImage = doc.mime_type?.startsWith("image/");

  const save = async () => {
    await update.mutateAsync({
      id: doc.id,
      name,
      description,
      folder_id: folderId === "none" ? null : folderId,
      tags: selectedTags,
    });
    toast({ title: "Dokumentum frissítve" });
    onOpenChange(false);
  };

  const toggleTag = (n: string) =>
    setSelectedTags((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[calc(100dvh-2rem)] flex flex-col top-4 translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
        <DialogHeader>
          <DialogTitle className="truncate">{doc.name}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto space-y-4 flex-1">
          {isImage && previewUrl && (
            <img
              src={previewUrl}
              alt={doc.name}
              className="w-full max-h-64 object-contain rounded-md bg-muted"
            />
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => previewUrl && window.open(previewUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-1" /> Megnyitás
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (previewUrl) {
                  const a = document.createElement("a");
                  a.href = previewUrl;
                  a.download = doc.original_filename;
                  a.click();
                }
              }}
            >
              <Download className="h-4 w-4 mr-1" /> Letöltés
            </Button>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Megjelenített név</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="rounded-lg border bg-card p-3 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><FolderOpen className="h-3.5 w-3.5" /> Mappa</label>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger>
                <SelectValue />
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

          <div className="rounded-lg border bg-card p-3 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Tags className="h-3.5 w-3.5" /> Címkék</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {tags.map((t) => {
                const active = selectedTags.includes(t.name);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTag(t.name)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      active ? "ring-2 ring-offset-1 ring-offset-background" : "opacity-60"
                    }`}
                    style={{
                      backgroundColor: `${t.color}20`,
                      borderColor: t.color,
                      color: t.color,
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
              {tags.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  Nincs címke. Hozz létre az oldalsávban.
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Megjegyzés</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Pl. Ez a januári rezsi, fizetve 04.18-án"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-2 text-xs text-muted-foreground pt-2 border-t">
            <div className="rounded-md bg-muted/50 p-2">
              <p className="font-semibold text-foreground flex items-center gap-1"><Info className="h-3 w-3" /> Fájl</p>
              <p className="truncate" title={doc.original_filename}>{doc.original_filename}</p>
              <p>{doc.mime_type || "Ismeretlen típus"}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-2">
              <p className="font-semibold text-foreground">Feltöltés</p>
              <p>{new Date(doc.created_at).toLocaleString("hu-HU")}</p>
              {doc.uploaded_by_name && <p className="truncate">{doc.uploaded_by_name}</p>}
            </div>
            <div className="rounded-md bg-muted/50 p-2">
              <p className="font-semibold text-foreground">Verzió</p>
              <p>v{doc.version}</p>
              <p>{doc.is_latest_version ? "Legfrissebb" : "Korábbi verzió"}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Mégse
          </Button>
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Mentés
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
