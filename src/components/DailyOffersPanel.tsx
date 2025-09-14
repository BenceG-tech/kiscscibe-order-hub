import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MenuBadge from "@/components/MenuBadge";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

interface MenuItem {
  id: string;
  item_id: string;
  is_menu_part: boolean;
  menu_role?: string;
  item_name: string;
  item_description?: string;
  item_price_huf: number;
  item_allergens?: string[];
  item_image_url?: string;
}

interface DailyOffersData {
  offer_id: string;
  offer_date: string;
  offer_price_huf?: number;
  offer_note?: string;
  offer_max_portions?: number;
  offer_remaining_portions?: number;
  items: MenuItem[];
}

interface DailyOffersPanelProps {
  date: Date;
  data: DailyOffersData | null;
  loading: boolean;
}

const DailyOffersPanel = ({ date, data, loading }: DailyOffersPanelProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Betöltés...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {format(date, "MMMM d. (EEEE)", { locale: hu })} - Mai ajánlatok
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Még nincs felvéve ajánlat erre a napra.</p>
        </CardContent>
      </Card>
    );
  }

  const canOrder = data.offer_remaining_portions && data.offer_remaining_portions > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {format(date, "MMMM d. (EEEE)", { locale: hu })} - Mai ajánlatok
        </CardTitle>
        <div className="flex gap-2 mt-2">
          {data.offer_max_portions && (
            <Badge variant="outline" className="text-xs">
              Max: {data.offer_max_portions} adag
            </Badge>
          )}
          {data.offer_remaining_portions !== undefined && (
            <Badge 
              variant={data.offer_remaining_portions > 5 ? "outline" : "destructive"}
              className="text-xs"
            >
              {data.offer_remaining_portions > 0 ? `Maradt: ${data.offer_remaining_portions}` : "Elfogyott"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.offer_note && (
          <p className="text-sm text-muted-foreground mb-4">{data.offer_note}</p>
        )}
        
        <div className="space-y-4">
          <h4 className="font-medium">Válaszd ki, mit szeretnél:</h4>
          <div className="space-y-3">
            {data.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium">{item.item_name}</h5>
                    {item.is_menu_part && <MenuBadge />}
                  </div>
                  {item.item_description && (
                    <p className="text-sm text-muted-foreground mb-2">{item.item_description}</p>
                  )}
                  {item.item_allergens && item.item_allergens.length > 0 && (
                    <div className="flex gap-1 mb-2">
                      {item.item_allergens.map((allergen) => (
                        <Badge key={allergen} variant="outline" className="text-xs">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{item.item_price_huf} Ft</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyOffersPanel;