import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, History } from "lucide-react";
import { useDocumentVersions, getSignedUrl, DocumentRow } from "@/hooks/useDocuments";

export const VersionHistory = ({
  doc,
  open,
  onOpenChange,
}: {
  doc: DocumentRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const rootId = doc?.parent_document_id ?? doc?.id ?? null;
  const { data: versions = [] } = useDocumentVersions(rootId);

  const download = async (v: DocumentRow) => {
    const url = await getSignedUrl(v.file_path);
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = v.original_filename;
      a.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" /> Verziók: {doc?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {versions.map((v) => (
            <div
              key={v.id}
              className={`flex items-center justify-between p-3 rounded-md border ${
                v.is_latest_version ? "border-primary bg-primary/5" : "bg-card"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">v{v.version}</span>
                  {v.is_latest_version && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                      Aktuális
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(v.created_at).toLocaleString("hu-HU")}
                </p>
                {v.uploaded_by_name && (
                  <p className="text-[10px] text-muted-foreground">{v.uploaded_by_name}</p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => download(v)}>
                <Download className="h-3.5 w-3.5 mr-1" /> Letölt
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
