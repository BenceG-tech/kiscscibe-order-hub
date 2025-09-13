import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const FavoritesSection = () => {
  const favorites = [
    {
      name: "Rántott karaj",
      description: "Ropogós bundában, körettel",
      price: "2 350 Ft",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
      popular: true
    },
    {
      name: "Rántott sajt",
      description: "Házi készítésű, káposztasalátával",
      price: "1 950 Ft", 
      image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop",
      popular: false
    },
    {
      name: "Borsos tokány",
      description: "Hagyományos fűszerezéssel",
      price: "2 250 Ft",
      image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
      popular: true
    },
    {
      name: "Tepsis burgonya",
      description: "Ropogós, fűszeres köret",
      price: "700 Ft",
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop",
      popular: false
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-secondary/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
          Kedvencek
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {favorites.map((item, index) => (
            <Card key={index} className="rounded-2xl shadow-md overflow-hidden border-0 bg-card relative">
              {item.popular && (
                <Badge className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground font-semibold">
                  Legnépszerűbb
                </Badge>
              )}
              <div className="relative">
                <AspectRatio ratio={4/3}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-t-2xl"
                    loading="lazy"
                  />
                </AspectRatio>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-foreground">{item.name}</h3>
                  <span className="text-lg font-bold text-primary">{item.price}</span>
                </div>
                <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-h-[44px]"
                >
                  Kosárba
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FavoritesSection;