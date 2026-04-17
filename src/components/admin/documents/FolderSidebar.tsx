import { useState } from "react";
import { FolderOpen, Folder, Star, Inbox, Plus, Trash2, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useFolders,
  useCreateFolder,
  useDeleteFolder,
  useTags,
} from "@/hooks/useDocuments";
import { TagManager } from "./TagManager";

interface Props {
  selectedFolder: string | null | "all" | "starred";
  onSelect: (id: string | null | "all" | "starred") => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

const COLORS = ["#F6C22D", "#EF4444", "#10B981", "#3B82F6", "#A855F7", "#F97316"];

export const FolderSidebar = ({ selectedFolder, onSelect, selectedTag, onSelectTag }: Props) => {
  const { data: folders = [] } = useFolders();
  const { data: tags = [] } = useTags();
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const itemCls = (active: boolean) =>
    `w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors ${
      active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
    }`;

  return (
    <aside className="w-full md:w-60 shrink-0 space-y-4">
      <div className="space-y-1">
        <button onClick={() => onSelect("all")} className={itemCls(selectedFolder === "all")}>
          <Inbox className="h-4 w-4" /> Minden fájl
        </button>
        <button
          onClick={() => onSelect("starred")}
          className={itemCls(selectedFolder === "starred")}
        >
          <Star className="h-4 w-4" /> Csillagos
        </button>
        <button onClick={() => onSelect(null)} className={itemCls(selectedFolder === null)}>
          <Folder className="h-4 w-4" /> Nincs mappa
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Mappák</span>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="space-y-0.5">
          {folders.map((f) => (
            <div key={f.id} className="group flex items-center gap-1">
              <button onClick={() => onSelect(f.id)} className={itemCls(selectedFolder === f.id)}>
                <FolderOpen className="h-4 w-4" style={{ color: f.color }} />
                <span className="truncate flex-1">{f.name}</span>
              </button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={() => {
                  if (confirm(`Törlöd a "${f.name}" mappát? A benne lévő fájlok megmaradnak.`))
                    deleteFolder.mutate(f.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Címkék</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setTagDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 px-2">
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTag(selectedTag === t.name ? null : t.name)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                selectedTag === t.name ? "ring-2 ring-offset-1 ring-offset-background" : ""
              }`}
              style={{
                backgroundColor: `${t.color}20`,
                borderColor: t.color,
                color: t.color,
              }}
            >
              {t.name}
            </button>
          ))}
          {tags.length === 0 && <span className="text-xs text-muted-foreground px-1">Nincs címke</span>}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Új mappa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Mappa neve"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                if (!name.trim()) return;
                await createFolder.mutateAsync({ name: name.trim(), color });
                setName("");
                setDialogOpen(false);
              }}
            >
              Létrehozás
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TagManager open={tagDialogOpen} onOpenChange={setTagDialogOpen} />
    </aside>
  );
};
