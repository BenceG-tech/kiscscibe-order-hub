import { useEffect, useState } from "react";
import {
  FileText,
  FileImage,
  File as FileIcon,
  Star,
  MoreVertical,
  Download,
  Trash2,
  History,
  ExternalLink,
  FolderOpen,
  Tags,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DocumentRow,
  getSignedUrl,
  useUpdateDocument,
  useDeleteDocument,
  useTags,
  useFolders,
} from "@/hooks/useDocuments";

interface Props {
  doc: DocumentRow;
  selected: boolean;
  onSelectToggle: () => void;
  onOpenDetail: () => void;
  onShowVersions: () => void;
}

const formatSize = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

const fileTypeLabel = (mime: string | null) => {
  if (!mime) return "Fájl";
  if (mime.startsWith("image/")) return "Kép";
  if (mime === "application/pdf") return "PDF";
  if (mime.includes("word") || mime.includes("document")) return "Word";
  if (mime.includes("excel") || mime.includes("spreadsheet")) return "Excel";
  return mime.split("/").pop()?.toUpperCase() || "Fájl";
};

export const DocumentCard = ({
  doc,
  selected,
  onSelectToggle,
  onOpenDetail,
  onShowVersions,
}: Props) => {
  const isImage = doc.mime_type?.startsWith("image/");
  const isPdf = doc.mime_type === "application/pdf";
  const [thumb, setThumb] = useState<string | null>(null);
  const update = useUpdateDocument();
  const del = useDeleteDocument();
  const { data: allTags = [] } = useTags();
  const { data: folders = [] } = useFolders();
  const folder = folders.find((f) => f.id === doc.folder_id);

  useEffect(() => {
    if (isImage) getSignedUrl(doc.file_path).then(setThumb);
  }, [doc.file_path, isImage]);

  const updateTags = (tagName: string, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...doc.tags, tagName]))
      : doc.tags.filter((t) => t !== tagName);
    update.mutate({ id: doc.id, tags: next });
  };

  const handleDownload = async () => {
    const url = await getSignedUrl(doc.file_path);
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.original_filename;
      a.click();
    }
  };

  const handleOpen = async () => {
    const url = await getSignedUrl(doc.file_path);
    if (url) window.open(url, "_blank");
  };

  return (
    <div
      className={`group relative rounded-lg border bg-card overflow-hidden transition-all hover:shadow-md ${
        selected ? "ring-2 ring-primary" : ""
      } ${doc.is_starred ? "border-primary/50 shadow-sm" : ""}`}
    >
      <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Checkbox checked={selected} onCheckedChange={onSelectToggle} />
      </div>
      <button
        onClick={(e) => {
          update.mutate({ id: doc.id, is_starred: !doc.is_starred });
          e.stopPropagation();
        }}
        className="absolute top-2 right-2 z-10 rounded-full bg-background/80 p-1 shadow-sm"
        title={doc.is_starred ? "Csillag levétele" : "Csillagozás"}
      >
        <Star
          className={`h-4 w-4 ${doc.is_starred ? "fill-primary text-primary" : "text-muted-foreground"}`}
        />
      </button>

      <div
        onClick={onOpenDetail}
        className="aspect-square bg-muted flex items-center justify-center cursor-pointer overflow-hidden"
      >
        {thumb ? (
          <img src={thumb} alt={doc.name} className="w-full h-full object-cover" />
        ) : isPdf ? (
          <FileText className="h-16 w-16 text-destructive/70" />
        ) : isImage ? (
          <FileImage className="h-16 w-16 text-muted-foreground" />
        ) : (
          <FileIcon className="h-16 w-16 text-muted-foreground" />
        )}
      </div>

      <div className="p-2.5 space-y-1.5">
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm font-medium truncate flex-1" title={doc.name}>
            {doc.name}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6 -mt-0.5 -mr-1">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleOpen}>
                <ExternalLink className="h-4 w-4 mr-2" /> Megnyitás
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" /> Letöltés
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenDetail}>
                <Pencil className="h-4 w-4 mr-2" /> Részletek szerkesztése
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderOpen className="h-4 w-4 mr-2" /> Mappa
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-52">
                  <DropdownMenuItem onClick={() => update.mutate({ id: doc.id, folder_id: null })}>
                    Nincs mappa
                  </DropdownMenuItem>
                  {folders.map((f) => (
                    <DropdownMenuCheckboxItem
                      key={f.id}
                      checked={doc.folder_id === f.id}
                      onCheckedChange={() => update.mutate({ id: doc.id, folder_id: f.id })}
                    >
                      <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: f.color }} />
                      {f.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Tags className="h-4 w-4 mr-2" /> Címkék
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56 max-h-72 overflow-y-auto">
                  <DropdownMenuLabel>Hozzáadás / levétel</DropdownMenuLabel>
                  {allTags.length === 0 && (
                    <DropdownMenuItem disabled>Nincs létrehozott címke</DropdownMenuItem>
                  )}
                  {allTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag.id}
                      checked={doc.tags.includes(tag.name)}
                      onCheckedChange={(checked) => updateTags(tag.name, Boolean(checked))}
                    >
                      <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={() => update.mutate({ id: doc.id, is_starred: !doc.is_starred })}>
                <Star className="h-4 w-4 mr-2" />
                {doc.is_starred ? "Csillag levétele" : "Csillagozás"}
              </DropdownMenuItem>
              {doc.version > 1 && (
                <DropdownMenuItem onClick={onShowVersions}>
                  <History className="h-4 w-4 mr-2" /> Verziók ({doc.version})
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (confirm(`Törlöd: "${doc.name}"? Az összes verzió törlődik.`)) del.mutate(doc);
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Törlés
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {folder && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <FolderOpen className="h-3 w-3" style={{ color: folder.color }} />
            <span className="truncate">{folder.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {fileTypeLabel(doc.mime_type)} · {formatSize(doc.file_size)}
          </span>
          {doc.version > 1 && (
            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">
              v{doc.version}
            </span>
          )}
        </div>
        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {doc.tags.slice(0, 3).map((tagName) => {
              const tag = allTags.find((t) => t.name === tagName);
              const c = tag?.color || "#6B7280";
              return (
                <span
                  key={tagName}
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ backgroundColor: `${c}20`, color: c }}
                >
                  {tagName}
                </span>
              );
            })}
            {doc.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{doc.tags.length - 3}</span>
            )}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground truncate">
          {doc.uploaded_by_name || "Ismeretlen"} · {new Date(doc.created_at).toLocaleDateString("hu-HU", { month: "short", day: "numeric" })}
        </p>
      </div>
    </div>
  );
};
