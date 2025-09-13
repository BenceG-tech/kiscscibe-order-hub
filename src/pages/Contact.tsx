import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card className="shadow-soft border-primary/20">
            <CardContent className="p-12">
              <div className="mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-warmth rounded-full mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold">
                  📞
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-warmth bg-clip-text text-transparent">
                  Ez az oldal hamarosan elkészül
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Dolgozunk a kapcsolat oldalon. Addig is látogasd meg a főoldalunkat!
                </p>
              </div>
              
              <Button 
                asChild
                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm"
              >
                <a href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Vissza a főoldalra
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;