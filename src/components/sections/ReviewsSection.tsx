import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

const ReviewsSection = () => {
  const { ref, isVisible } = useScrollFadeIn();
  const isMobile = useIsMobile();

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
      rating: 5,
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
      rating: 5,
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

  const averageRating = 5.0;
  const totalReviews = 127;

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: 'start',
    slidesToScroll: 1 
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-4 w-4 transition-all duration-300",
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-gray-200 text-gray-200"
        )}
      />
    ));
  };

  const ReviewCard = ({ review, index }: { review: typeof reviews[0]; index: number }) => (
    <Card 
      className={cn(
        "rounded-3xl shadow-soft relative overflow-hidden tilt-card glow-border",
        "transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      {/* Quotation mark decoration */}
      <div className="absolute top-3 right-3 md:top-4 md:right-4 text-4xl md:text-6xl text-primary/10 font-serif leading-none pointer-events-none">
        "
      </div>
      
      <CardContent className="p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 md:mb-4 gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary/20 to-warmth/20 flex items-center justify-center text-primary font-bold text-xs md:text-sm flex-shrink-0">
              {review.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 md:gap-2">
                <h4 className="font-semibold text-foreground text-xs md:text-base truncate">{review.name}</h4>
                {review.verified && (
                  <Badge variant="secondary" className="text-[10px] md:text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 md:px-2.5 flex-shrink-0">
                    ✓
                  </Badge>
                )}
              </div>
              <p className="text-[10px] md:text-sm text-muted-foreground">{review.date}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {renderStars(review.rating)}
          </div>
        </div>

        {/* Review Text */}
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed relative z-10 line-clamp-3 md:line-clamp-none">
          "{review.text}"
        </p>
      </CardContent>
    </Card>
  );

  return (
    <section className="py-8 md:py-20" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-4 md:mb-12">
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

        {/* Mobile: Embla Carousel */}
        {isMobile ? (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-3">
              {reviews.slice(0, 4).map((review, index) => (
                <div key={index} className="flex-[0_0_85%] min-w-0">
                  <ReviewCard review={review} index={index} />
                </div>
              ))}
            </div>
            {/* Dot indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {reviews.slice(0, 4).map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    selectedIndex === index 
                      ? "bg-primary w-6" 
                      : "bg-muted-foreground/30"
                  )}
                  onClick={() => emblaApi?.scrollTo(index)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Desktop: 3-column grid */
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.slice(0, 3).map((review, index) => (
              <ReviewCard key={index} review={review} index={index} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-8 md:mt-12">
          <p className="text-muted-foreground mb-4 text-sm md:text-base">
            Próbálja ki Ön is éttermünket!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => document.getElementById('napi-ajanlat')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm text-primary-foreground font-semibold px-6 py-3 relative overflow-hidden group"
            >
              <span className="relative z-10">Napi menü megtekintése</span>
              <div className="absolute inset-0 shimmer-btn opacity-0 group-hover:opacity-100 transition-opacity" />
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
