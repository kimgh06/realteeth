export interface CurrentWeather {
  temp: number;
  tempMin: number;
  tempMax: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  windDeg?: number;
  locationName: string;
  sunrise?: number;
  sunset?: number;
  pressure?: number;
  visibility?: number;
  clouds?: number;
}

export interface HourlyForecast {
  dt: number;
  temp: number;
  icon: string;
  description: string;
  pop?: number;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  tempMin: number;
  tempMax: number;
  icon: string;
  description: string;
  pop: number;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

export interface OWMCurrentResponse {
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
    pressure: number;
  };
  weather: { id: number; description: string; icon: string }[];
  wind: { speed: number; deg: number };
  clouds: { all: number };
  visibility: number;
  sys: { sunrise: number; sunset: number };
  name: string;
}

export interface OWMForecastResponse {
  list: {
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
    };
    weather: { id: number; description: string; icon: string }[];
    pop: number;
  }[];
}
