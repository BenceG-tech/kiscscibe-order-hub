import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { HEALTH_CHECK_EXPLANATIONS } from "@/data/healthCheckExplanations";
import { useNavigate } from "react-router-dom";

type CheckStatus = "ok" | "warn" | "fail";
interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
  detail?: string;
}

interface Props {
  check: Check | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusBadge = (s: CheckStatus) => {
  if (s === "ok") return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90"><CheckCircle2 className="h-3 w-3 mr-1" />Rendben</Badge>;
  if (s === "warn") return <Badge className="bg-amber-500 text-white hover:bg-amber-500/90"><AlertTriangle className="h-3 w-3 mr-1" />Figyelmeztetés</Badge>;
  return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Hiba</Badge>;
};

export const HealthCheckDetailDialog = ({ check, open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  if (!check) return null;
  const exp = HEALTH_CHECK_EXPLANATIONS[check.id];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle>{check.label}</DialogTitle>
            {statusBadge(check.status)}
          </div>
          <DialogDescription className="text-left pt-2">
            {check.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {check.detail && (
            <div>
              <p className="font-medium mb-1">Technikai részlet</p>
              <p className="font-mono text-xs bg-muted p-2 rounded break-all">{check.detail}</p>
            </div>
          )}

          {exp?.what && (
            <div>
              <p className="font-medium mb-1">Mit ellenőriz?</p>
              <p className="text-muted-foreground">{exp.what}</p>
            </div>
          )}

          {exp?.causes && exp.causes.length > 0 && (
            <div>
              <p className="font-medium mb-1">Lehetséges okok</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {exp.causes.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {exp?.manualSteps && exp.manualSteps.length > 0 && (
            <div>
              <p className="font-medium mb-1">Manuális megoldás</p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                {exp.manualSteps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          )}

          {exp?.link && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                navigate(exp.link!.href);
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {exp.link.label}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
