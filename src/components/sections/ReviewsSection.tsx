import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink } from "lucide-react";

const ReviewsSection = () => {
  const reviews = [
    {
      text: "Fantasztikus ételek, házi készítésű ízek! A rántott karaj a kedvencem, mindig ide jövök ebédelni. Gyors kiszolgálás és kedves személyzet.",
      author: "Nagy Péter"
    },
    {
      text: "Nagyon finom házias ételek, nagy adagok és kedvező árak. A napi menü mindig változatos és friss. Csak ajánlani tudom mindenkinek!",
      author: "Kovács Anna"
    },
    {
      text: "A legjobb reggeliző a környéken! Már évek óta ide járok, mindig elégedett vagyok. A levesek különösen finomak, mint otthon.",
      author: "Szabó László"
    }
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-foreground font-semibold">5.0</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            100% ajánlás Facebookon
          </h2>
          <p className="text-muted-foreground">(19 értékelés)</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {reviews.map((review, index) => (
            <Card key={index} className="rounded-2xl shadow-md border-primary/10">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="text-muted-foreground text-sm leading-relaxed mb-4 italic">
                  "{review.text}"
                </blockquote>
                <cite className="text-foreground font-semibold text-sm">
                  — {review.author}
                </cite>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            asChild
          >
            <a 
              href="https://facebook.com/kiscsibereggelizo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              További vélemények Facebookon
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;