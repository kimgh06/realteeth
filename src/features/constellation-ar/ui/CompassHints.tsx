interface Props {
  alpha: number;
}

const CARDINALS = ["북", "동", "남", "서"] as const;

export function CompassHints({ alpha }: Props) {
  // alpha = compass heading: 0=North, 90=East, 180=South, 270=West
  // Calculate which cardinal is at each edge of the screen
  const topDir = Math.round(alpha / 90) % 4;

  return (
    <>
      {/* Top */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2">
        <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs font-medium text-white/50 backdrop-blur-sm">
          {CARDINALS[topDir]}
        </span>
      </div>
      {/* Bottom (opposite of top) */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2">
        <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs font-medium text-white/50 backdrop-blur-sm">
          {CARDINALS[(topDir + 2) % 4]}
        </span>
      </div>
      {/* Left */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs font-medium text-white/50 backdrop-blur-sm">
          {CARDINALS[(topDir + 3) % 4]}
        </span>
      </div>
      {/* Right */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs font-medium text-white/50 backdrop-blur-sm">
          {CARDINALS[(topDir + 1) % 4]}
        </span>
      </div>
    </>
  );
}
