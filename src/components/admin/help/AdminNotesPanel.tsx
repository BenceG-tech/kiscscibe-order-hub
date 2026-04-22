import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HELP_PAGE_GROUPS } from "@/data/adminHelpContent";
import { NOTE_PRIORITY_LABELS, NOTE_STATUS_LABELS, useAdminNotes, useCreateAdminNote, useUpdateAdminNote, type AdminNotePriority, type AdminNoteStatus } from "@/hooks/useAdminNotes";
import { MessageSquarePlus, StickyNote } from "lucide-react";

export const AdminNotesPanel = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<AdminNotePriority>("normal");
  const { data: notes = [] } = useAdminNotes();
  const createNote = useCreateAdminNote();
  const updateNote = useUpdateAdminNote();

  const context = useMemo(() => {
    const matching = HELP_PAGE_GROUPS.filter((pg) => pg.route && location.pathname.startsWith(pg.route));
    return matching.sort((a, b) => (b.route?.length ?? 0) - (a.route?.length ?? 0))[0];
  }, [location.pathname]);

  const openNotes = notes.filter((note) => note.status !== "done" && note.status !== "rejected").slice(0, 5);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return;
    await createNote.mutateAsync({
      title: title.trim(),
      body: body.trim(),
      page_route: location.pathname,
      context_label: context?.title || "Admin felület",
      priority,
    });
    setTitle("");
    setBody("");
    setPriority("normal");
    setOpen(false);
  };

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex items-start gap-2">
        <StickyNote className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">Jegyzetek / észrevételek</div>
          <p className="text-xs text-muted-foreground leading-snug">
            Írd le, ha valami nem egyértelmű, hibás, vagy hiányzik.
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1.5" onClick={() => setOpen(true)}>
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Új
        </Button>
      </div>

      {openNotes.length > 0 && (
        <div className="space-y-2">
          {openNotes.map((note) => (
            <div key={note.id} className="rounded-lg border bg-card p-2 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold flex-1 truncate">{note.title}</span>
                <Badge variant={note.priority === "high" ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0">
                  {NOTE_PRIORITY_LABELS[note.priority]}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="truncate">{note.context_label || note.page_route}</span>
                <Select value={note.status} onValueChange={(status) => updateNote.mutate({ id: note.id, status: status as AdminNoteStatus })}>
                  <SelectTrigger className="h-7 w-32 text-xs ml-auto"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOTE_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Új kézikönyv jegyzet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Kontextus: <span className="font-semibold text-foreground">{context?.title || "Admin felület"}</span>
            </div>
            <Input placeholder="Rövid cím" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="Mit kellene javítani, hozzáadni vagy egyértelműbbé tenni?" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-32" />
            <Select value={priority} onValueChange={(value) => setPriority(value as AdminNotePriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(NOTE_PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full" onClick={handleSubmit} disabled={!title.trim() || !body.trim() || createNote.isPending}>
              Jegyzet mentése
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
