import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading";
import { format, getDay } from "date-fns";
import { hu } from "date-fns/locale";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_huf: number;
}

interface DailyOfferItem {
  id: string;
  menu_items?: MenuItem;
}

interface DailyOffer {
  id: string;
  date: string;
  price_huf: number;
  note?: string;
  daily_offer_items?: DailyOfferItem[];
}

interface AdminDailyOfferCalendarProps {
  onCreateOffer: (date: string) => void;
  onEditOffer: (offer: DailyOffer) => void;
}

const AdminDailyOfferCalendar = ({ onCreateOffer, onEditOffer }: AdminDailyOfferCalendarProps) => {
  const [dailyOffers, setDailyOffers] = useState<DailyOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchDailyOffers();
  }, []);

  const fetchDailyOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_offers')
        .select(`
          *,
          daily_offer_items (
            id,
            menu_items (
              id,
              name,
              description,
              price_huf
            )
          )
        `)
        .order('date', { ascending: true });

      if (!error && data) {
        setDailyOffers(data);
      }
    } catch (error) {
      console.error('Error fetching daily offers:', error);
      toast.error('Hiba történt a napi ajánlatok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const getOffersForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return dailyOffers.filter(offer => offer.date === dateString);
  };

  const hasOfferOnDate = (date: Date) => {
    return getOffersForDate(date).length > 0;
  };

  const isWeekend = (date: Date) => {
    const day = getDay(date);
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  const handleCreateOffer = () => {
    if (isWeekend(selectedDate)) {
      toast.error('Hétvégén a vendéglő zárva tart');
      return;
    }
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    onCreateOffer(dateString);
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a napi ajánlatot?')) {
      return;
    }

    try {
      // Delete daily offer items first
      const { error: itemsError } = await supabase
        .from('daily_offer_items')
        .delete()
        .eq('daily_offer_id', offerId);

      if (itemsError) throw itemsError;

      // Delete the daily offer
      const { error: offerError } = await supabase
        .from('daily_offers')
        .delete()
        .eq('id', offerId);

      if (offerError) throw offerError;

      toast.success('Napi ajánlat törölve');
      fetchDailyOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Hiba történt a törlés során');
    }
  };

  const selectedDateOffers = getOffersForDate(selectedDate);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card className="rounded-2xl shadow-md border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Napi ajánlatok naptára
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={hu}
            className="rounded-md border-0 p-0"
            modifiers={{
              hasOffer: (date) => hasOfferOnDate(date),
              weekend: (date) => isWeekend(date)
            }}
            modifiersStyles={{
              hasOffer: {
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                fontWeight: 'bold'
              },
              weekend: {
                backgroundColor: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
                textDecoration: 'line-through',
                opacity: 0.6
              }
            }}
          />
          <div className="mt-4 text-sm text-muted-foreground space-y-2">
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 bg-primary rounded"></span>
              Napi ajánlat beállítva
            </span>
            <div className="inline-flex items-center gap-2">
              <span className="w-4 h-4 bg-muted rounded"></span>
              Hétvége - zárva
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card className="rounded-2xl shadow-md border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-foreground">
              {format(selectedDate, 'yyyy. MMMM dd. (EEEE)', { locale: hu })}
            </CardTitle>
            <Button
              onClick={handleCreateOffer}
              className="bg-primary hover:bg-primary/90"
              size="sm"
              disabled={isWeekend(selectedDate)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isWeekend(selectedDate) ? 'Zárva' : 'Új ajánlat'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isWeekend(selectedDate) ? (
            <div className="text-center py-8">
              <div className="p-6 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground text-lg font-medium mb-2">
                  Hétvégén zárva
                </p>
                <p className="text-muted-foreground/70 text-sm">
                  A vendéglő szombaton és vasárnap zárva tart
                </p>
              </div>
            </div>
          ) : selectedDateOffers.length > 0 ? (
            <div className="space-y-4">
              {selectedDateOffers.map((offer) => (
                <div key={offer.id} className="p-4 border rounded-lg border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge className="bg-primary text-primary-foreground mb-2">
                        {offer.price_huf} Ft
                      </Badge>
                      {offer.note && (
                        <p className="text-sm text-muted-foreground">{offer.note}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditOffer(offer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {offer.daily_offer_items?.map((item) => (
                      <li key={item.id} className="text-sm">
                        • {item.menu_items?.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nincs napi ajánlat beállítva erre a napra
              </p>
              <Button
                onClick={handleCreateOffer}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Napi ajánlat létrehozása
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDailyOfferCalendar;