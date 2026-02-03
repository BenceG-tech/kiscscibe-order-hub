import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

const ReviewsSection = () => {
  const reviews = [
    {
      name: "Kovács János",
      rating: 5,
      date: "2 hete",
      text: "Fantasztikus reggelik és kedves kiszolgálás! A rántotta tejszínes volt és a kávé tökéletes. Minden nap ide járok munkába menet.",
      verified: true
    },
    {
      name: "Nagy Éva",
      rating: 5,
      date: "1 hónapja", 
      text: "A napi menü mindig friss és finom. Az árak teljesen korrektek, a kiszolgálás pedig gyors. Családbarát hely, gyerekekkel is szívesen látnak.",
      verified: true
    },
    {
      name: "Szabó Péter",
      rating: 4,
      date: "3 hete",
      text: "Jó ár-érték arány, bőséges adagok. A guláslevest különösen ajánlom! Az étterem kellemes, tiszta környezet.",
      verified: false
    },
    {
      name: "Molnár Andrea",
      rating: 5,
      date: "1 hete",
      text: "Hihetetlenül finom húsgombóc leves! Mindig van valami jó napi ajánlat. A személyzet nagyon kedves és figyelmes.",
      verified: true
    },
    {
      name: "Tóth Márk",
      rating: 4,
      date: "2 hónapja",
      text: "Kiváló helyi étterem a környéken. A schnitzel nagyszerű volt, és a köretek is finomak. Tiszta, rendezett hely.",
      verified: false
    },
    {
      name: "Kiss Zsuzsanna",
      rating: 5,
      date: "3 napja",
      text: "Minden alkalommal elégedett vagyok! Friss alapanyagok, otthonos ízek. A csirkemell grillezve különösen finom volt.",
      verified: true
    }
  ];

  const averageRating = 4.7;
  const totalReviews = 127;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-gray-200 text-gray-200"
        }`}
      />
    ));
  };

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Mit mondanak vendégeink?
          </h2>
          
          {/* Overall Rating */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {renderStars(Math.round(averageRating))}
            </div>
            <span className="text-2xl font-bold text-foreground">{averageRating}</span>
          </div>
          
          <p className="text-muted-foreground">
            {totalReviews} értékelés alapján
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 3).map((review, index) => (
            <Card 
              key={index} 
              className="hover:shadow-cozy transition-shadow duration-300 shadow-soft"
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{review.name}</h4>
                      {review.verified && (
                        <Badge variant="secondary" className="text-xs">
                          ✓ Ellenőrzött
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.date}</p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  "{review.text}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Próbálja ki Ön is éttermünket!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => document.getElementById('napi-ajanlat')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm text-primary-foreground font-semibold px-6 py-3"
            >
              Napi menü megtekintése
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold px-6 py-3"
            >
              <a 
                href="https://maps.google.com/?q=1141+Budapest,+Vezér+u.+110" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Útvonalterv
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;