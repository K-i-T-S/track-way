import { cn } from "@/lib/utils";

interface DotGridBackgroundProps {
  variant: "world" | "streets";
  className?: string;
}

export function DotGridBackground({
  variant,
  className,
}: DotGridBackgroundProps) {
  return (
    <div
      data-testid="dot-grid-background"
      data-variant={variant}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#ffffff14_1px,transparent_1px)] bg-[length:16px_16px]",
        className,
      )}
    />
  );
}
