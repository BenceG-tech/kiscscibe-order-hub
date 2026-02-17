import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface FacebookPostGeneratorProps {
  selectedDate: string;
}

const FacebookPostGenerator = ({ selectedDate }: FacebookPostGeneratorProps) => {
  const [postText, setPostText] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePost = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-facebook-post", {
        body: { date: selectedDate },
      });

      if (error) {
        let errorMessage = "Hiba a poszt generálásakor";
        try {
          const errorBody = await error.context?.json?.();
          if (errorBody?.error) {
            errorMessage = errorBody.error;
          }
        } catch {}
        toast.error(errorMessage);
        console.error("Facebook post gen error:", error);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setPostText(data.post_text || "");
      setHashtags(data.hashtags || []);
      toast.success("Poszt szöveg generálva!");
    } catch (err: any) {
      console.error("Facebook post gen error:", err);
      toast.error(err?.message || "Hiba a poszt generálásakor");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const fullText = postText + (hashtags.length > 0 ? "\n\n" + hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ") : "");
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Vágólapra másolva!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Facebook poszt szöveg
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generálj AI-alapú Facebook poszt szöveget a kiválasztott nap napi ajánlatából.
        </p>

        <Button onClick={generatePost} disabled={loading} variant="outline" className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generálás..." : "Poszt szöveg generálása"}
        </Button>

        {postText && (
          <div className="space-y-3">
            <Textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              rows={4}
              className="resize-none"
            />

            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {hashtags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </Badge>
                ))}
              </div>
            )}

            <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Másolva!" : "Másolás vágólapra"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FacebookPostGenerator;
