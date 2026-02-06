import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "A név megadása kötelező.").max(100, "A név maximum 100 karakter lehet."),
  email: z.string().trim().email("Érvénytelen email cím.").max(255, "Az email maximum 255 karakter lehet."),
  phone: z.string().trim().max(30, "A telefonszám maximum 30 karakter lehet.").optional().or(z.literal("")),
  message: z.string().trim().min(1, "Az üzenet megadása kötelező.").max(2000, "Az üzenet maximum 2000 karakter lehet."),
});

const ContactForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast({
        title: "Hiányzó vagy hibás adat",
        description: firstError?.message || "Kérjük ellenőrizze az adatokat.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: result.data,
      });

      if (error) {
        throw new Error(error.message || "Hálózati hiba történt.");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Üzenet elküldve!",
        description: "Köszönjük megkeresését! Hamarosan válaszolunk.",
      });

      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Contact form error:", error);
      toast({
        title: "Hiba történt",
        description: error instanceof Error ? error.message : "Próbálja újra később!",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-0 bg-card shadow-lg rounded-3xl">
      <CardHeader>
        <CardTitle>Írjon nekünk!</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Név *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Az Ön neve"
                className="rounded-xl"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+36 30 123 4567"
                className="rounded-xl"
                maxLength={30}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email cím *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
              placeholder="pelda@email.com"
              className="rounded-xl"
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Üzenet *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              required
              placeholder="Írja ide kérdését vagy üzenetét..."
              rows={5}
              className="rounded-xl"
              maxLength={2000}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm rounded-xl"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Küldés..." : "Üzenet küldése"}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            * Kötelező mezők. Általában 24 órán belül válaszolunk.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContactForm;
