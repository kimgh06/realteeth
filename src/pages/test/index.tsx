import { mockWeatherData } from "@/entities/weather/api/mockData";
import { WeatherDisplay } from "@/widgets/weather-display/ui/WeatherDisplay";

export function TestPage() {
  const data = mockWeatherData("테스트 (Mock)");

  return (
    <div className="min-h-screen bg-[#0d1b2a]">
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-4 text-center text-lg font-bold text-white/80">
          Mock 데이터 테스트
        </h1>
        <WeatherDisplay data={data} isLoading={false} error={null} />
      </div>
    </div>
  );
}
