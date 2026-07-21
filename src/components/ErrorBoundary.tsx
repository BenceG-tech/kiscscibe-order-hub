import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  isStaleChunk: boolean;
}

const STALE_PATTERNS = [
  "Importing a module script failed",
  "Failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "ChunkLoadError",
];

const isStaleChunkError = (error: unknown): boolean => {
  const msg = (error as Error | undefined)?.message;
  if (typeof msg !== "string") return false;
  return STALE_PATTERNS.some((p) => msg.includes(p));
};

const reloadWithCacheBust = () => {
  const url = new URL(window.location.href);
  url.searchParams.set("_r", Date.now().toString());
  window.location.replace(url.toString());
};

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isStaleChunk: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, isStaleChunk: isStaleChunkError(error) };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    // Stale chunk: auto-recover once (main.tsx handler covers most cases, but
    // a Suspense-thrown import failure lands here too).
    if (isStaleChunkError(error)) {
      try {
        if (sessionStorage.getItem("__stale_chunk_reload__") !== "1") {
          sessionStorage.setItem("__stale_chunk_reload__", "1");
          reloadWithCacheBust();
        }
      } catch {
        reloadWithCacheBust();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const { isStaleChunk } = this.state;
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="p-8 space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="text-xl font-bold text-foreground">
                {isStaleChunk ? "Új verzió érkezett" : "Valami hiba történt"}
              </h1>
              <p className="text-muted-foreground">
                {isStaleChunk
                  ? "Frissítjük az oldalt, hogy a legújabb verziót töltsd be…"
                  : "Kérjük, frissítsd az oldalt, vagy próbáld újra később."}
              </p>
              <Button onClick={reloadWithCacheBust}>
                Újratöltés
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
