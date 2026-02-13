import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const StickyMobileCTA = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg md:hidden pb-safe">
      <div className="flex p-3">
        <Button 
          asChild
          className="flex-1 bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm text-primary-foreground font-semibold min-h-[44px]"
        >
            <Link to="/etlap">
              Rendelj most
            </Link>
        </Button>
      </div>
    </div>
  );
};

export default StickyMobileCTA;
