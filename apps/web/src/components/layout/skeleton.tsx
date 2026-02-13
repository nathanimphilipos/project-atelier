import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 px-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-48 flex-1" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border bg-card shadow-card overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b last:border-0">
          <SkeletonRow />
        </div>
      ))}
    </div>
  );
}
