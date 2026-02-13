import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
import { cn } from "@/lib/utils";

const emailSchema = z.string().trim().email("Érvénytelen email cím").max(255, "Az email cím túl hosszú");

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { ref, isVisible } = useScrollFadeIn();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast({
        title: "Hiba",
        description: result.error.errors[0]?.message || "Érvénytelen email cím!",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("subscribers")
        .insert({ email: result.data });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Már feliratkoztál!",
            description: "Ezzel az email címmel már feliratkoztál a hírlevélre.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Sikeres feliratkozás!",
          description: "Köszönjük! Hamarosan elküldjük a heti menüt.",
        });
        setEmail("");

        supabase.functions
          .invoke("send-welcome-newsletter", {
            body: { email: result.data },
          })
          .catch((err) => console.error("Welcome email error:", err));
      }
    } catch (error) {
      console.error("Newsletter signup error:", error);
      toast({
        title: "Hiba történt",
        description: "Próbáld újra később!",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-8 md:py-16" ref={ref}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className={cn(
          "rounded-2xl shadow-lg border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 glow-border",
          "transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <CardHeader className="text-center pb-2 md:pb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full mb-3 md:mb-4 mx-auto animate-float">
              <Mail className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <CardTitle className="text-xl md:text-3xl font-bold text-foreground">
              Heti menü e-mailben
            </CardTitle>
            <p className="text-muted-foreground text-sm md:text-lg">
              Iratkozz fel, és minden hétfőn elküldjük a menüt.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 focus-glow rounded-md transition-all duration-300">
                  <Input
                    type="email"
                    placeholder="Email címed"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-h-[44px] text-base border-border/50"
                    disabled={isLoading}
                    maxLength={255}
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-h-[44px] px-8 relative overflow-hidden group"
                  disabled={isLoading}
                >
                  <span className="relative z-10">{isLoading ? "Feliratkozás..." : "Feliratkozom"}</span>
                  <div className="absolute inset-0 shimmer-btn opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default NewsletterSection;
