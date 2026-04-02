type TimeOfDay = "d" | "n";

interface GradientSet {
  d: string;
  n: string;
}

const gradients: Record<string, GradientSet> = {
  "01": {
    d: "linear-gradient(180deg, #4FC3F7 0%, #0288D1 60%, #01579B 100%)",
    n: "linear-gradient(180deg, #0d1b2a 0%, #1a237e 50%, #4a148c 100%)",
  },
  "02": {
    d: "linear-gradient(180deg, #4FC3F7 0%, #0288D1 50%, #01579B 100%)",
    n: "linear-gradient(180deg, #1a237e 0%, #263238 60%, #37474F 100%)",
  },
  "03": {
    d: "linear-gradient(180deg, #78909C 0%, #607D8B 50%, #546E7A 100%)",
    n: "linear-gradient(180deg, #263238 0%, #37474F 60%, #455A64 100%)",
  },
  "04": {
    d: "linear-gradient(180deg, #90A4AE 0%, #78909C 50%, #546E7A 100%)",
    n: "linear-gradient(180deg, #1a1a2e 0%, #263238 60%, #37474F 100%)",
  },
  "09": {
    d: "linear-gradient(180deg, #546E7A 0%, #455A64 50%, #37474F 100%)",
    n: "linear-gradient(180deg, #0d1b2a 0%, #1a1a2e 60%, #263238 100%)",
  },
  "10": {
    d: "linear-gradient(180deg, #607D8B 0%, #546E7A 50%, #37474F 100%)",
    n: "linear-gradient(180deg, #0d1b2a 0%, #1a1a2e 60%, #263238 100%)",
  },
  "11": {
    d: "linear-gradient(180deg, #455A64 0%, #37474F 50%, #263238 100%)",
    n: "linear-gradient(180deg, #0d1b2a 0%, #1a1a2e 60%, #000000 100%)",
  },
  "13": {
    d: "linear-gradient(180deg, #90CAF9 0%, #64B5F6 50%, #42A5F5 100%)",
    n: "linear-gradient(180deg, #1a237e 0%, #283593 60%, #3949AB 100%)",
  },
  "50": {
    d: "linear-gradient(180deg, #90A4AE 0%, #78909C 50%, #607D8B 100%)",
    n: "linear-gradient(180deg, #37474F 0%, #455A64 60%, #546E7A 100%)",
  },
};

const cardGradients: Record<string, GradientSet> = {
  "01": {
    d: "linear-gradient(135deg, #4FC3F7, #0288D1)",
    n: "linear-gradient(135deg, #1a237e, #4a148c)",
  },
  "02": {
    d: "linear-gradient(135deg, #81D4FA, #4FC3F7)",
    n: "linear-gradient(135deg, #1a237e, #37474F)",
  },
  "03": {
    d: "linear-gradient(135deg, #B0BEC5, #78909C)",
    n: "linear-gradient(135deg, #263238, #455A64)",
  },
  "04": {
    d: "linear-gradient(135deg, #90A4AE, #546E7A)",
    n: "linear-gradient(135deg, #1a1a2e, #37474F)",
  },
  "09": {
    d: "linear-gradient(135deg, #546E7A, #37474F)",
    n: "linear-gradient(135deg, #0d1b2a, #263238)",
  },
  "10": {
    d: "linear-gradient(135deg, #607D8B, #37474F)",
    n: "linear-gradient(135deg, #0d1b2a, #263238)",
  },
  "11": {
    d: "linear-gradient(135deg, #455A64, #263238)",
    n: "linear-gradient(135deg, #0d1b2a, #000000)",
  },
  "13": {
    d: "linear-gradient(135deg, #E3F2FD, #90CAF9)",
    n: "linear-gradient(135deg, #1a237e, #3949AB)",
  },
  "50": {
    d: "linear-gradient(135deg, #CFD8DC, #90A4AE)",
    n: "linear-gradient(135deg, #37474F, #546E7A)",
  },
};

function parseIcon(icon: string): { prefix: string; time: TimeOfDay } {
  const prefix = icon.slice(0, 2);
  const time = (icon.slice(2) === "n" ? "n" : "d") as TimeOfDay;
  return { prefix, time };
}

export function getWeatherGradient(icon: string | undefined): string {
  if (!icon) return gradients["01"]!.d;
  const { prefix, time } = parseIcon(icon);
  return gradients[prefix]?.[time] ?? gradients["01"]!.d;
}

export function getWeatherCardGradient(icon: string | undefined): string {
  if (!icon) return cardGradients["01"]!.d;
  const { prefix, time } = parseIcon(icon);
  return cardGradients[prefix]?.[time] ?? cardGradients["01"]!.d;
}

export function isNightIcon(icon: string | undefined): boolean {
  return icon?.endsWith("n") ?? false;
}
