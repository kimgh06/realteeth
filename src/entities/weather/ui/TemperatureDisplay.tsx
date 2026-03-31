interface Props {
  temp: number;
  className?: string;
  unit?: string;
}

export function TemperatureDisplay({ temp, className = "", unit = "°" }: Props) {
  return (
    <span className={className}>
      {temp}
      {unit}
    </span>
  );
}
