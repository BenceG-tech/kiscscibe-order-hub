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

  const ReviewCard = ({ review, index }: { review: typeof reviews[0]; index: number }) => (
    <Card 
      className={`rounded-3xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-soft relative overflow-hidden ${
        index === 0 ? 'md:col-span-2 lg:col-span-1' : ''
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Quotation mark decoration */}
      <div className="absolute top-4 right-4 text-6xl text-primary/10 font-serif leading-none pointer-events-none">
        "
      </div>
      
      <CardContent className="p-5 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar placeholder */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-warmth/20 flex items-center justify-center text-primary font-bold text-sm">
              {review.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground text-sm md:text-base">{review.name}</h4>
                {review.verified && (
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400">
                    ✓
                  </Badge>
                )}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">{review.date}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5">
            {renderStars(review.rating)}
          </div>
        </div>

        {/* Review Text */}
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed relative z-10">
          "{review.text}"
        </p>
      </CardContent>
    </Card>
  );

  return (
    <section className="py-8 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-12">
          <span className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
            Vélemények
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mt-2 mb-3 md:mb-4 font-sofia">
            Mit mondanak vendégeink?
          </h2>
          <div className="w-12 h-1 bg-primary mx-auto mb-4 md:mb-6 rounded-full" />
          
          {/* Overall Rating */}
          <div className="flex items-center justify-center gap-2 mb-1 md:mb-2">
            <div className="flex items-center gap-1">
              {renderStars(Math.round(averageRating))}
            </div>
            <span className="text-xl md:text-2xl font-bold text-foreground">{averageRating}</span>
          </div>
          
          <p className="text-sm md:text-base text-muted-foreground">
            {totalReviews} értékelés alapján
          </p>
        </div>

        {/* Mobile: horizontal snap-scroll carousel */}
        <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 gap-4 pb-2">
          {reviews.slice(0, 3).map((review, index) => (
            <div key={index} className="min-w-[85vw] snap-center flex-shrink-0">
              <ReviewCard review={review} index={index} />
            </div>
          ))}
        </div>

        {/* Desktop: 3-column grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 3).map((review, index) => (
            <ReviewCard key={index} review={review} index={index} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-8 md:mt-12">
          <p className="text-muted-foreground mb-4 text-sm md:text-base">
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
