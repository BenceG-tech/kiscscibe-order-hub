import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <Card className="shadow-soft border-primary/20">
          <CardContent className="p-12 text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-warmth rounded-full mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold">
                🐣
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-warmth bg-clip-text text-transparent">
                Ez az oldal hamarosan elkészül
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Dolgozunk ezen az oldalon. Addig is látogasd meg a főoldalunkat!
              </p>
            </div>
            
            <Button 
              asChild
              className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm"
            >
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Vissza a főoldalra
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
