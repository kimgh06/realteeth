import { useTempUnit } from "@/shared/lib/TempUnitContext";

interface Props {
  temp: number;
  className?: string;
}

export function TemperatureDisplay({ temp, className = "" }: Props) {
  const { convert, unit } = useTempUnit();
  return <span className={className}>{convert(temp)}°{unit}</span>;
}
