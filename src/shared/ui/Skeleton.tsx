export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/10 ${className}`}
    />
  );
}

export function WeatherSkeleton() {
  return (
    <div className="space-y-4">
      {/* Hero skeleton */}
      <div className="flex flex-col items-center gap-3 pt-20 pb-4 sm:pt-24">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-4 h-24 w-24 rounded-full" />
        <Skeleton className="h-20 w-40" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Hourly skeleton */}
      <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
        <Skeleton className="mb-3 h-3 w-20" />
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Detail skeleton */}
      <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
        <Skeleton className="mb-3 h-3 w-16" />
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
