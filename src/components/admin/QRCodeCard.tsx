import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface QRCodeCardProps {
  tableNumber: number;
  url: string;
}

const QRCodeCard = ({ tableNumber, url }: QRCodeCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 200,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }
  }, [url]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    // Create A6-style card with logo and text
    const exportCanvas = document.createElement("canvas");
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    const W = 600;
    const H = 850;
    exportCanvas.width = W;
    exportCanvas.height = H;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.fillStyle = "#efbe13";
    ctx.fillRect(0, 0, W, 80);
    ctx.fillStyle = "#1c232f";
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🐥 Kiscsibe", W / 2, 52);

    // Table number
    ctx.fillStyle = "#333";
    ctx.font = "bold 48px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Asztal ${tableNumber}`, W / 2, 160);

    // QR code
    const qrSize = 350;
    const qrX = (W - qrSize) / 2;
    ctx.drawImage(canvasRef.current, qrX, 200, qrSize, qrSize);

    // Instructions
    ctx.fillStyle = "#555";
    ctx.font = "24px Arial, sans-serif";
    ctx.fillText("Rendelj a telefonodról!", W / 2, 610);
    
    ctx.font = "18px Arial, sans-serif";
    ctx.fillStyle = "#888";
    ctx.fillText("Olvasd be a QR-kódot", W / 2, 650);
    ctx.fillText("a kamerád alkalmazással", W / 2, 680);

    // Footer
    ctx.fillStyle = "#efbe13";
    ctx.fillRect(0, H - 60, W, 60);
    ctx.fillStyle = "#1c232f";
    ctx.font = "16px Arial, sans-serif";
    ctx.fillText("kiscsibe-etterem.hu", W / 2, H - 25);

    // Download
    const link = document.createElement("a");
    link.download = `kiscsibe_asztal_${tableNumber}_qr.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col items-center gap-3">
        <div className="text-lg font-bold text-foreground">Asztal {tableNumber}</div>
        <canvas ref={canvasRef} className="rounded" />
        <p className="text-xs text-muted-foreground text-center break-all max-w-[200px]">{url}</p>
        <Button onClick={handleDownload} size="sm" variant="outline" className="gap-2 w-full">
          <Download className="h-4 w-4" />
          Letöltés (A6 kártya)
        </Button>
      </CardContent>
    </Card>
  );
};

export default QRCodeCard;
