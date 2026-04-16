import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Save, HelpCircle } from "lucide-react";
import { useFaqItems, FaqItem } from "@/hooks/useFaqItems";
import { LoadingSpinner } from "@/components/ui/loading";

const FaqEditor = () => {
  const { faqs, isLoading, saveFaqs, isSaving } = useFaqItems();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    setItems(faqs);
  }, [faqs]);

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), question: "", answer: "" }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: "question" | "answer", value: string) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newItems = [...items];
    const [moved] = newItems.splice(dragIdx, 1);
    newItems.splice(idx, 0, moved);
    setItems(newItems);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const handleSave = () => {
    const valid = items.filter((i) => i.question.trim() && i.answer.trim());
    saveFaqs(valid);
  };

  if (isLoading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gyakori kérdések (GYIK)</h1>
            <p className="text-sm text-muted-foreground">Szerkeszd a publikus GYIK szekciót</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Mentés..." : "Mentés"}
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <Card
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`transition-opacity ${dragIdx === idx ? "opacity-50" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="flex items-center cursor-grab text-muted-foreground hover:text-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Kérdés"
                    value={item.question}
                    onChange={(e) => updateItem(item.id, "question", e.target.value)}
                  />
                  <Textarea
                    placeholder="Válasz"
                    value={item.answer}
                    onChange={(e) => updateItem(item.id, "answer", e.target.value)}
                    rows={2}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addItem} className="w-full gap-2">
        <Plus className="h-4 w-4" />
        Új kérdés hozzáadása
      </Button>
    </div>
  );
};

export default FaqEditor;
