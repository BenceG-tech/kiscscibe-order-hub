import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrintButton = () => {
  return (
    <Button
      variant="outline"
      size="sm"
      className="print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4 mr-1" />
      Nyomtatás
    </Button>
  );
};

export default PrintButton;
