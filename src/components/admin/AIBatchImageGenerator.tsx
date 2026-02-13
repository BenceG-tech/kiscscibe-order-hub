import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, ImageIcon, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  image_url: string | null;
}

interface AIBatchImageGeneratorProps {
  items: MenuItem[];
  onComplete: () => void;
}

const AIBatchImageGenerator = ({ items, onComplete }: AIBatchImageGeneratorProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [succeeded, setSucceeded] = useState(0);
  const [failed, setFailed] = useState(0);
  const [currentItem, setCurrentItem] = useState<string | null>(null);
  const pauseRef = useRef(false);
  const abortRef = useRef(false);

  const itemsWithoutImage = items.filter(item => !item.image_url);
  const totalWithImage = items.length - itemsWithoutImage.length;

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const generateBatch = useCallback(async () => {
    setIsRunning(true);
    setIsPaused(false);
    setProcessed(0);
    setSucceeded(0);
    setFailed(0);
    pauseRef.current = false;
    abortRef.current = false;

    const batchSize = 3;

    for (let i = 0; i < itemsWithoutImage.length; i += batchSize) {
      if (abortRef.current) break;

      while (pauseRef.current) {
        await sleep(500);
        if (abortRef.current) break;
      }

      const batch = itemsWithoutImage.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async (item) => {
          setCurrentItem(item.name);
          const { data, error } = await supabase.functions.invoke("generate-food-image", {
            body: { item_id: item.id, item_name: item.name },
          });
          if (error || data?.error) throw new Error(data?.error || error?.message);
          return data;
        })
      );

      let batchSuccess = 0;
      let batchFail = 0;
      results.forEach(r => {
        if (r.status === "fulfilled") batchSuccess++;
        else batchFail++;
      });

      setProcessed(prev => prev + batch.length);
      setSucceeded(prev => prev + batchSuccess);
      setFailed(prev => prev + batchFail);

      // Rate limiting pause between batches
      if (i + batchSize < itemsWithoutImage.length) {
        await sleep(3000);
      }
    }

    setCurrentItem(null);
    setIsRunning(false);
    toast.success("Képgenerálás befejezve!");
    onComplete();
  }, [itemsWithoutImage, onComplete]);

  const togglePause = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(!isPaused);
  };

  const stopGeneration = () => {
    abortRef.current = true;
    pauseRef.current = false;
    setIsRunning(false);
    setIsPaused(false);
  };

  const progress = itemsWithoutImage.length > 0 
    ? Math.round((processed / itemsWithoutImage.length) * 100) 
    : 100;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Képgenerálás
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            <ImageIcon className="h-3 w-3 mr-1" />
            {totalWithImage} / {items.length} képpel rendelkezik
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {itemsWithoutImage.length} kép nélkül
          </Badge>
        </div>

        {/* Progress during generation */}
        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {processed} / {itemsWithoutImage.length} feldolgozva
              </span>
              <span className="text-green-600">✓ {succeeded}</span>
              {failed > 0 && <span className="text-destructive">✗ {failed}</span>}
            </div>
            {currentItem && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generálás: {currentItem}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              onClick={generateBatch}
              disabled={itemsWithoutImage.length === 0}
              className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {itemsWithoutImage.length === 0
                ? "Minden ételnek van képe"
                : `Generálj ${itemsWithoutImage.length} képet`}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={togglePause}>
                {isPaused ? (
                  <><Play className="mr-2 h-4 w-4" /> Folytatás</>
                ) : (
                  <><Pause className="mr-2 h-4 w-4" /> Szünet</>
                )}
              </Button>
              <Button variant="destructive" onClick={stopGeneration}>
                Leállítás
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIBatchImageGenerator;
