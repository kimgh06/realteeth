import { Star } from "lucide-react";

interface Props {
  constellationName: string | null;
}

export function CenterIndicator({ constellationName }: Props) {
  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-black/40 px-6 py-4 backdrop-blur-md">
      <Star className="h-4 w-4 shrink-0 text-sky-300" />
      <span className="text-sm font-medium text-white">
        {constellationName
          ? `지금 ${constellationName}을(를) 보고 있어요`
          : "하늘을 둘러보세요"}
      </span>
    </div>
  );
}
