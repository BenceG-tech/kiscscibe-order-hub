import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_huf: number;
}

interface DailyMenuItem {
  id: string;
  menu_items?: MenuItem;
}

interface DailyMenu {
  id: string;
  date: string;
  price_huf: number;
  note?: string;
  max_portions: number;
  remaining_portions: number;
  daily_menu_items?: DailyMenuItem[];
}

interface AdminDailyMenuCalendarProps {
  onCreateMenu: (date: string) => void;
  onEditMenu: (menu: DailyMenu) => void;
}

const AdminDailyMenuCalendar = ({ onCreateMenu, onEditMenu }: AdminDailyMenuCalendarProps) => {
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchDailyMenus();
  }, []);

  const fetchDailyMenus = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_menus')
        .select(`
          *,
          daily_menu_items (
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
        setDailyMenus(data);
      }
    } catch (error) {
      console.error('Error fetching daily menus:', error);
      toast.error('Hiba történt a napi menük betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const getMenusForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return dailyMenus.filter(menu => menu.date === dateString);
  };

  const hasMenuOnDate = (date: Date) => {
    return getMenusForDate(date).length > 0;
  };

  const handleCreateMenu = () => {
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    onCreateMenu(dateString);
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a napi menüt?')) {
      return;
    }

    try {
      // Delete daily menu items first
      const { error: itemsError } = await supabase
        .from('daily_menu_items')
        .delete()
        .eq('daily_menu_id', menuId);

      if (itemsError) throw itemsError;

      // Delete the daily menu
      const { error: menuError } = await supabase
        .from('daily_menus')
        .delete()
        .eq('id', menuId);

      if (menuError) throw menuError;

      toast.success('Napi menü törölve');
      fetchDailyMenus();
    } catch (error) {
      console.error('Error deleting menu:', error);
      toast.error('Hiba történt a törlés során');
    }
  };

  const selectedDateMenus = getMenusForDate(selectedDate);

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
            Napi menük naptára
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
              hasMenu: (date) => hasMenuOnDate(date)
            }}
            modifiersStyles={{
              hasMenu: {
                backgroundColor: 'hsl(var(--secondary))',
                color: 'hsl(var(--secondary-foreground))',
                fontWeight: 'bold'
              }
            }}
          />
          <div className="mt-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 bg-secondary rounded"></span>
              Napi menü beállítva
            </span>
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
              onClick={handleCreateMenu}
              className="bg-secondary hover:bg-secondary/90"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Új menü
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedDateMenus.length > 0 ? (
            <div className="space-y-4">
              {selectedDateMenus.map((menu) => (
                <div key={menu.id} className="p-4 border rounded-lg border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge className="bg-secondary text-secondary-foreground mb-2">
                        {menu.price_huf} Ft
                      </Badge>
                      <div className="flex gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Max: {menu.max_portions} adag
                        </Badge>
                        <Badge variant={menu.remaining_portions > 0 ? "default" : "destructive"} className="text-xs">
                          Maradt: {menu.remaining_portions}
                        </Badge>
                      </div>
                      {menu.note && (
                        <p className="text-sm text-muted-foreground">{menu.note}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditMenu(menu)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMenu(menu.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {menu.daily_menu_items?.map((item) => (
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
                Nincs napi menü beállítva erre a napra
              </p>
              <Button
                onClick={handleCreateMenu}
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Napi menü létrehozása
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDailyMenuCalendar;