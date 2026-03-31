import { CloudMoon, CloudRain, CloudSnow, CloudLightning, CloudFog, Cloud, CloudDrizzle, Sun, CloudSun } from "lucide-react";
import { OWM_ICON_URL } from "@/shared/config";
import { MoonIcon } from "./MoonIcon";

interface Props {
  icon: string;
  size?: "sm" | "md" | "lg" | "xl";
  description?: string;
}

const pxMap = { sm: 40, md: 64, lg: 100, xl: 120 };
const lucideSizeMap = { sm: 28, md: 40, lg: 64, xl: 80 };

// Night icon mapping: OWM icon code → Lucide component
const nightIcons: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  "02n": CloudMoon,
  "03n": Cloud,
  "04n": Cloud,
  "09n": CloudDrizzle,
  "10n": CloudRain,
  "11n": CloudLightning,
  "13n": CloudSnow,
  "50n": CloudFog,
};

const dayIcons: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  "01d": Sun,
  "02d": CloudSun,
  "03d": Cloud,
  "04d": Cloud,
  "09d": CloudDrizzle,
  "10d": CloudRain,
  "11d": CloudLightning,
  "13d": CloudSnow,
  "50d": CloudFog,
};

export function WeatherIcon({ icon, size = "md", description }: Props) {
  const px = pxMap[size];
  const lucideSize = lucideSizeMap[size];
  const isLarge = size === "xl" || size === "lg";
  const shadow = isLarge ? "drop-shadow-lg" : "drop-shadow-sm";

  // Clear night: moon phase icon (all sizes)
  if (icon === "01n") {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: px, height: px }}
      >
        <MoonIcon size={lucideSize} className={shadow} />
      </div>
    );
  }

  // SVG icons for all sizes
  const IconComponent = icon.endsWith("n") ? nightIcons[icon] : dayIcons[icon];

  if (IconComponent) {
    const isNight = icon.endsWith("n");
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: px, height: px }}
      >
        <IconComponent
          size={lucideSize}
          className={
            isNight
              ? `text-slate-300 ${shadow}`
              : `text-amber-300 ${shadow}`
          }
        />
      </div>
    );
  }

  // Fallback to OWM PNG for unknown icons
  return (
    <img
      src={`${OWM_ICON_URL}/${icon}@2x.png`}
      alt={description ?? "날씨 아이콘"}
      width={px}
      height={px}
      className={shadow}
    />
  );
}
