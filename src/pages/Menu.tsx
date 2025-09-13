import Navigation from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import hungarianSoup from "@/assets/hungarian-soup.jpg";

const Menu = () => {
  const dailySpecial = {
    date: "2024. január 15., hétfő",
    soup: "Gulyásleves",
    main: "Rántott szelet burgonyapürével",
    price: "2.490 Ft"
  };

  const menuItems = [
    {
      category: "Levesek",
      items: [
        { name: "Gulyásleves", price: "890 Ft", description: "Hagyományos magyar gulyásleves, friss kenyérrel" },
        { name: "Húsleves cérnametélttel", price: "790 Ft", description: "Házi húsleves friss cérnametélttel" },
        { name: "Zöldségleves", price: "690 Ft", description: "Friss zöldségekből készült leves", badge: "Vegetáriánus" },
      ]
    },
    {
      category: "Főételek",
      items: [
        { name: "Rántott szelet", price: "1.890 Ft", description: "Burgonyapürével és savanyúsággal" },
        { name: "Magyaros tokány", price: "2.190 Ft", description: "Házi tésztával vagy rizzsel" },
        { name: "Grillezett csirkemell", price: "2.090 Ft", description: "Friss salátával és körettel" },
        { name: "Vegetáriánus lasagne", price: "1.790 Ft", description: "Zöldségekkel és sajttal", badge: "Vegetáriánus" },
      ]
    },
    {
      category: "Reggelik",
      items: [
        { name: "Kiscscibe reggeli", price: "1.590 Ft", description: "Tojás, szalonna, kolbász, kenyér, zöldség" },
        { name: "Francia pirítós", price: "990 Ft", description: "Mézzel vagy lekvárral" },
        { name: "Omlett", price: "890 Ft", description: "3 tojásból, választható feltétekkel" },
        { name: "Müzlis tál", price: "790 Ft", description: "Friss gyümölcsökkel", badge: "Egészséges" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-warmth bg-clip-text text-transparent">
              Étellapunk
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Friss, házi készítésű ételek minden napra. Minden fogást szeretettel készítünk el.
            </p>
          </div>

          {/* Daily Special */}
          <Card className="mb-12 border-primary/20 shadow-cozy">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-warmth/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">Mai ajánlatunk</CardTitle>
                  <CardDescription className="text-lg">{dailySpecial.date}</CardDescription>
                </div>
                <Badge className="bg-primary text-primary-foreground text-lg px-4 py-2">
                  {dailySpecial.price}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <h3 className="text-xl font-semibold mb-2">🍲 {dailySpecial.soup}</h3>
                  <h3 className="text-xl font-semibold mb-4">🍽️ {dailySpecial.main}</h3>
                  <p className="text-muted-foreground">
                    Frissen főzött levesünk és főételünk egy menüben, kedvező áron.
                  </p>
                </div>
                <div className="flex justify-center">
                  <img 
                    src={hungarianSoup} 
                    alt="Mai leves" 
                    className="rounded-lg shadow-soft max-w-full h-48 object-cover"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Categories */}
          <div className="grid gap-8">
            {menuItems.map((category) => (
              <Card key={category.category} className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.items.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-lg">{item.name}</h4>
                              {item.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground text-sm">{item.description}</p>
                          </div>
                          <span className="font-bold text-primary text-lg ml-4">{item.price}</span>
                        </div>
                        {index < category.items.length - 1 && <Separator className="my-4" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <Card className="mt-12 bg-gradient-to-r from-primary/5 to-warmth/5 border-primary/20">
            <CardContent className="text-center py-8">
              <h3 className="text-2xl font-bold mb-4">Szeretnél rendelni?</h3>
              <p className="text-muted-foreground mb-6">
                Hívj minket vagy írj üzenetet, és összeállítjuk neked a tökéletes menüt!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="tel:+36123456789"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:shadow-warm transition-all duration-200"
                >
                  📞 Hívás: +36 1 234 5678
                </a>
                <a
                  href="https://m.me/kiscscibereggelizo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-accent text-accent-foreground font-medium rounded-md hover:shadow-soft transition-all duration-200"
                >
                  💬 Facebook üzenet
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Menu;