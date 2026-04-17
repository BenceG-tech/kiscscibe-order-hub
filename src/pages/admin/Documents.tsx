import { useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, FolderInput } from "lucide-react";
import { DocumentUploader } from "@/components/admin/documents/DocumentUploader";
import { FolderSidebar } from "@/components/admin/documents/FolderSidebar";
import { DocumentCard } from "@/components/admin/documents/DocumentCard";
import { DocumentDetailDialog } from "@/components/admin/documents/DocumentDetailDialog";
import { VersionHistory } from "@/components/admin/documents/VersionHistory";
import {
  useDocuments,
  useFolders,
  DocumentRow,
  useDeleteDocument,
  useUpdateDocument,
} from "@/hooks/useDocuments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Documents = () => {
  const [selectedFolder, setSelectedFolder] = useState<string | null | "all" | "starred">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailDoc, setDetailDoc] = useState<DocumentRow | null>(null);
  const [versionsDoc, setVersionsDoc] = useState<DocumentRow | null>(null);
  const { data: folders = [] } = useFolders();
  const del = useDeleteDocument();
  const update = useUpdateDocument();

  const filter = useMemo(() => {
    const f: any = { search, tag: selectedTag };
    if (selectedFolder === "starred") f.starred = true;
    else if (selectedFolder === "all") {
      /* no folder filter */
    } else f.folderId = selectedFolder;
    return f;
  }, [selectedFolder, selectedTag, search]);

  const { data: documents = [], isLoading } = useDocuments(filter);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const uploadFolderId = selectedFolder === "all" || selectedFolder === "starred" ? null : selectedFolder;

  const bulkMove = async (folderId: string | null) => {
    await Promise.all(
      Array.from(selected).map((id) => update.mutateAsync({ id, folder_id: folderId })),
    );
    setSelected(new Set());
  };

  const bulkDelete = async () => {
    if (!confirm(`Törlöd a kijelölt ${selected.size} fájlt?`)) return;
    const docs = documents.filter((d) => selected.has(d.id));
    for (const d of docs) await del.mutateAsync(d);
    setSelected(new Set());
  };

  return (
    <AdminLayout>
      <div className="py-4 md:py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Dokumentumok</h1>
          <p className="text-sm text-muted-foreground">
            Közös dokumentumtár — képek, számlák, szerződések egy helyen.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <FolderSidebar
            selectedFolder={selectedFolder}
            onSelect={(s) => {
              setSelectedFolder(s);
              setSelected(new Set());
            }}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
          />

          <div className="flex-1 space-y-4 min-w-0">
            <DocumentUploader folderId={uploadFolderId} />

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Keresés név, leírás vagy címke alapján..."
                  className="pl-8"
                />
              </div>
            </div>

            {selected.size > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/30">
                <span className="text-sm font-medium">{selected.size} kiválasztva</span>
                <Select onValueChange={(v) => bulkMove(v === "none" ? null : v)}>
                  <SelectTrigger className="w-44 h-8">
                    <FolderInput className="h-3.5 w-3.5 mr-1" />
                    <SelectValue placeholder="Áthelyezés..." />
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
                <Button size="sm" variant="destructive" onClick={bulkDelete}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Törlés
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  Mégse
                </Button>
              </div>
            )}

            {isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Betöltés...</p>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nincs megjeleníthető fájl.</p>
                <p className="text-xs mt-1">Tölts fel valamit a fenti dobozból!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    selected={selected.has(doc.id)}
                    onSelectToggle={() => toggleSelect(doc.id)}
                    onOpenDetail={() => setDetailDoc(doc)}
                    onShowVersions={() => setVersionsDoc(doc)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DocumentDetailDialog
        doc={detailDoc}
        open={!!detailDoc}
        onOpenChange={(v) => !v && setDetailDoc(null)}
      />
      <VersionHistory
        doc={versionsDoc}
        open={!!versionsDoc}
        onOpenChange={(v) => !v && setVersionsDoc(null)}
      />
    </AdminLayout>
  );
};

export default Documents;
