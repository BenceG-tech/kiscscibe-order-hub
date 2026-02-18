import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Building2, Phone, Mail, Users } from "lucide-react";
import { usePartners, useUpdatePartner, PARTNER_CATEGORIES, PAYMENT_TERMS, type Partner } from "@/hooks/usePartners";
import PartnerFormDialog from "@/components/admin/PartnerFormDialog";
import PartnerDetailDialog from "@/components/admin/PartnerDetailDialog";

const Partners = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("active");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const isActiveFilter = statusFilter === "all" ? null : statusFilter === "active";

  const { data: partners = [], isLoading } = usePartners({
    search: search || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    is_active: isActiveFilter,
  });

  const update = useUpdatePartner();

  const handleToggleActive = (e: React.MouseEvent, partner: Partner) => {
    e.stopPropagation();
    update.mutate({ id: partner.id, is_active: !partner.is_active });
  };

  return (
    <AdminLayout>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Partnerek kezelése
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Szállítók, szolgáltatók és üzleti partnerek nyilvántartása
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Új partner
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Keresés név vagy adószám alapján..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Kategória" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Minden kategória</SelectItem>
              {Object.entries(PARTNER_CATEGORIES).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktív</SelectItem>
              <SelectItem value="archived">Archivált</SelectItem>
              <SelectItem value="all">Összes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{partners.length} partner</span>
          {partners.filter((p) => p.is_active).length !== partners.length && (
            <span>• {partners.filter((p) => p.is_active).length} aktív</span>
          )}
        </div>

        {/* Partner list */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Betöltés...</div>
        ) : partners.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              {search || categoryFilter !== "all"
                ? "Nincs a szűrőknek megfelelő partner."
                : "Még nincs rögzített partner."}
            </p>
            {!search && categoryFilter === "all" && (
              <Button variant="outline" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Első partner hozzáadása
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {partners.map((partner) => (
              <div
                key={partner.id}
                onClick={() => setSelectedPartner(partner)}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors ${
                  !partner.is_active ? "opacity-60" : ""
                }`}
              >
                {/* Left: icon + name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                    partner.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{partner.name}</span>
                      {!partner.is_active && (
                        <Badge variant="secondary" className="text-[10px]">Archivált</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {PARTNER_CATEGORIES[partner.category] || partner.category}
                      </Badge>
                    </div>
                    {partner.tax_number && (
                      <p className="text-xs text-muted-foreground">{partner.tax_number}</p>
                    )}
                  </div>
                </div>

                {/* Middle: payment terms + contact */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-md whitespace-nowrap">
                    {PAYMENT_TERMS[partner.payment_terms] || partner.payment_terms}
                  </span>
                  {partner.contact_name && (
                    <span className="text-xs truncate max-w-[140px]">{partner.contact_name}</span>
                  )}
                  <div className="flex items-center gap-3">
                    {partner.contact_phone && (
                      <a
                        href={`tel:${partner.contact_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        <span className="text-xs">{partner.contact_phone}</span>
                      </a>
                    )}
                    {partner.contact_email && (
                      <a
                        href={`mailto:${partner.contact_email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        <Mail className="h-3 w-3" />
                        <span className="text-xs hidden lg:inline">{partner.contact_email}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Right: active toggle */}
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={partner.is_active}
                    onCheckedChange={() => {}}
                    onClick={(e) => handleToggleActive(e, partner)}
                    className="scale-90"
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {partner.is_active ? "Aktív" : "Inaktív"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PartnerFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
      />

      {selectedPartner && (
        <PartnerDetailDialog
          open={!!selectedPartner}
          onOpenChange={(v) => { if (!v) setSelectedPartner(null); }}
          partner={selectedPartner}
        />
      )}
    </AdminLayout>
  );
};

export default Partners;
