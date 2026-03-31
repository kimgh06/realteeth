interface Props {
  className?: string;
  variant?: "dark" | "light";
}

export function Spinner({ className = "", variant = "dark" }: Props) {
  const colors =
    variant === "light"
      ? "border-white/30 border-t-white"
      : "border-sky-200 border-t-sky-600";

  return (
    <div
      className={`inline-block h-6 w-6 animate-spin rounded-full border-2 ${colors} ${className}`}
      role="status"
    >
      <span className="sr-only">로딩 중...</span>
    </div>
  );
}
