import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { AdminHelpPanel } from "./AdminHelpPanel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const HelpFloatingButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpen(true)}
              className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-110 transition-transform p-0"
              aria-label="Admin kézikönyv"
            >
              <HelpCircle className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Súgó és kézikönyv</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AdminHelpPanel open={open} onOpenChange={setOpen} />
    </>
  );
};
