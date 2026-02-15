import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTipProps {
  text: string;
  side?: "top" | "bottom" | "left" | "right";
}

const InfoTip = ({ text, side = "top" }: InfoTipProps) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-primary transition-colors focus:outline-none"
          aria-label="Információ"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="max-w-[250px] text-xs leading-relaxed bg-popover text-popover-foreground border shadow-lg"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default InfoTip;
