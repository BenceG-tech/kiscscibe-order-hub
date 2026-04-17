import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { useTags, useCreateTag, useDeleteTag } from "@/hooks/useDocuments";

const COLORS = ["#EF4444", "#F97316", "#F6C22D", "#10B981", "#3B82F6", "#A855F7", "#6B7280"];

export const TagManager = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Címkék kezelése</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Új címke neve (pl. Sürgős, Fizetendő)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={async () => {
                if (!name.trim()) return;
                await createTag.mutateAsync({ name: name.trim(), color });
                setName("");
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Hozzáadás
            </Button>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {tags.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2 rounded-md border bg-card"
              >
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${t.color}20`, color: t.color }}
                >
                  {t.name}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => deleteTag.mutate(t.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
