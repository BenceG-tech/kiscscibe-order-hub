import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, Check, Plus, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivePartners, PARTNER_CATEGORIES, type Partner } from "@/hooks/usePartners";
import PartnerFormDialog from "./PartnerFormDialog";

interface Props {
  value?: string | null; // partner id
  onSelect: (partner: Partner | null) => void;
  disabled?: boolean;
}

const PartnerSelector = ({ value, onSelect, disabled }: Props) => {
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const { data: partners = [] } = useActivePartners();

  const selectedPartner = partners.find((p) => p.id === value) || null;

  const handleSelect = (partner: Partner) => {
    if (partner.id === value) {
      onSelect(null);
    } else {
      onSelect(partner);
    }
    setOpen(false);
  };

  const handleCreated = (partner: Partner) => {
    onSelect(partner);
    setShowCreate(false);
  };

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Partner kiválasztása</span>
          <span className="text-xs text-muted-foreground">(opcionális)</span>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
              disabled={disabled}
            >
              {selectedPartner ? (
                <span className="flex items-center gap-2 truncate">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{selectedPartner.name}</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto shrink-0">
                    {PARTNER_CATEGORIES[selectedPartner.category] || selectedPartner.category}
                  </Badge>
                </span>
              ) : (
                <span className="text-muted-foreground">Keresés a partnerek között...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Partner neve..." />
              <CommandList>
                <CommandEmpty>Nincs találat.</CommandEmpty>
                {selectedPartner && (
                  <>
                    <CommandGroup>
                      <CommandItem onSelect={() => { onSelect(null); setOpen(false); }} className="text-muted-foreground text-xs">
                        Kiválasztás törlése
                      </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}
                <CommandGroup heading="Aktív partnerek">
                  {partners.map((partner) => (
                    <CommandItem
                      key={partner.id}
                      value={`${partner.name} ${partner.tax_number || ""}`}
                      onSelect={() => handleSelect(partner)}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", value === partner.id ? "opacity-100" : "opacity-0")}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{partner.name}</div>
                        {partner.tax_number && (
                          <div className="text-xs text-muted-foreground">{partner.tax_number}</div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] ml-2 shrink-0">
                        {PARTNER_CATEGORIES[partner.category] || partner.category}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => { setOpen(false); setShowCreate(true); }} className="text-primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Új partner létrehozása
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <PartnerFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={handleCreated}
      />
    </>
  );
};

export default PartnerSelector;
