import { cn } from "@/lib/utils";

export const LoadingSpinner = ({ className }: { className?: string }) => (
  <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", className)} />
);

export const LoadingDots = ({ className }: { className?: string }) => (
  <div className={cn("flex space-x-1", className)}>
    {[0, 1, 2].map((index) => (
      <div
        key={index}
        className="w-2 h-2 bg-primary rounded-full animate-bounce"
        style={{ animationDelay: `${index * 0.1}s` }}
      />
    ))}
  </div>
);

export const PulseLoader = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-muted rounded", className)} />
);