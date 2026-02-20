import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Building2, Phone, Mail, Edit2, Trash2, Archive } from "lucide-react";
import { usePartners, useDeletePartner, useUpdatePartner, type Partner } from "@/hooks/usePartners";
import PartnerFormDialog from "@/components/admin/PartnerFormDialog";
import InfoTip from "@/components/admin/InfoTip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CATEGORY_LABELS: Record<string, string> = {
  food_supplier: "Alapanyag beszállító",
  beverage: "Ital",
  cleaning: "Takarítás",
  equipment: "Felszerelés",
  utility: "Közüzem",
  service: "Szolgáltatás",
  other: "Egyéb",
};

const PAYMENT_LABELS: Record<string, string> = {
  immediate: "Azonnali",
  net_8: "8 napos",
  net_15: "15 napos",
  net_30: "30 napos",
};

const Partners = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);

  const { data: partners = [], isLoading } = usePartners();
  const deleteMut = useDeletePartner();
  const updateMut = useUpdatePartner();

  const filtered = partners.filter((p) => {
    if (!showInactive && !p.is_active) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(s) ||
        (p.tax_number || "").toLowerCase().includes(s) ||
        (p.short_name || "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  const openNew = () => {
    setEditPartner(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Partner) => {
    setEditPartner(p);
    setDialogOpen(true);
  };

  const handleToggleActive = (partner: Partner) => {
    updateMut.mutate({ id: partner.id, is_active: !partner.is_active });
  };

  return (
    <AdminLayout>
      <div className="py-4 sm:py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            Partnerek
            <InfoTip text="Beszállítók és partnerek nyilvántartása. Számlák készítésekor innen választhatsz partnert." />
          </h1>
          <Button onClick={openNew} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Új partner
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Keresés név, adószám..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Kategória" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Minden kategória</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Switch checked={showInactive} onCheckedChange={setShowInactive} />
            Inaktívak is
          </label>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Betöltés...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {partners.length === 0 ? "Még nincsenek partnerek. Kattints az \"Új partner\" gombra!" : "Nincs találat a szűrésre."}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((partner) => (
              <Card key={partner.id} className={`transition-all ${!partner.is_active ? "opacity-50" : ""}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{partner.name}</span>
                      </div>
                      {partner.short_name && (
                        <span className="text-xs text-muted-foreground ml-6">({partner.short_name})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(partner)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleToggleActive(partner)}>
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Biztosan törlöd?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {partner.name} partner véglegesen törlődik. Ha vannak hozzá tartozó számlák, inkább archiváld.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Mégse</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMut.mutate(partner.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Törlés
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {partner.tax_number && (
                    <p className="text-xs text-muted-foreground ml-6">Adószám: {partner.tax_number}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 ml-6">
                    <Badge variant="outline" className="text-[10px]">
                      {CATEGORY_LABELS[partner.category] || partner.category}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {PAYMENT_LABELS[partner.payment_terms] || partner.payment_terms}
                    </Badge>
                    {!partner.is_active && (
                      <Badge variant="destructive" className="text-[10px]">Inaktív</Badge>
                    )}
                  </div>

                  {(partner.contact_phone || partner.contact_email) && (
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground ml-6">
                      {partner.contact_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {partner.contact_phone}
                        </span>
                      )}
                      {partner.contact_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {partner.contact_email}
                        </span>
                      )}
                    </div>
                  )}

                  {partner.address && (
                    <p className="text-xs text-muted-foreground ml-6 truncate">{partner.address}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PartnerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        partner={editPartner}
      />
    </AdminLayout>
  );
};

export default Partners;
