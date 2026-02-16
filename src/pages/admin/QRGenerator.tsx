import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QrCode, Download } from "lucide-react";
import QRCodeCard from "@/components/admin/QRCodeCard";
import InfoTip from "@/components/admin/InfoTip";

const SITE_URL = "https://kiscscibe-order-hub.lovable.app";

const QRGenerator = () => {
  const [tableCount, setTableCount] = useState(10);

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  return (
    <AdminLayout>
      <div className="py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            QR kódos rendelés
            <InfoTip text="Nyomtasd ki a QR kódokat és helyezd az asztalokra. A vendégek beolvasva egyből az étlapra jutnak." />
          </h1>
          <div className="flex items-center gap-2">
            <Label htmlFor="tableCount" className="text-sm whitespace-nowrap">Asztalok száma:</Label>
            <Input
              id="tableCount"
              type="number"
              min={1}
              max={50}
              value={tableCount}
              onChange={(e) => setTableCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              className="w-20 h-9"
            />
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Hogyan működik?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>1. Válaszd ki az asztalok számát</p>
            <p>2. Töltsd le az A6-os kártyákat (mindegyik tartalmazza a QR kódot + asztalszámot)</p>
            <p>3. Nyomtasd ki és helyezd az asztalokra</p>
            <p>4. A vendég beolvassa → megnyílik az étlap → rendel a telefonról</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((num) => (
            <QRCodeCard
              key={num}
              tableNumber={num}
              url={`${SITE_URL}/etlap?table=${num}`}
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default QRGenerator;
