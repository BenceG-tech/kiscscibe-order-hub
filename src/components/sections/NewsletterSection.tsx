import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().trim().email("Érvénytelen email cím").max(255, "Az email cím túl hosszú");

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        // Postgres unique constraint violation
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
    <section className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="rounded-2xl shadow-lg border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
              Heti menü e-mailben
            </CardTitle>
            <p className="text-muted-foreground text-lg">
              Iratkozz fel, és minden hétfőn elküldjük a menüt.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Email címed"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 min-h-[44px] text-base"
                  disabled={isLoading}
                  maxLength={255}
                />
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-h-[44px] px-8"
                  disabled={isLoading}
                >
                  {isLoading ? "Feliratkozás..." : "Feliratkozom"}
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
