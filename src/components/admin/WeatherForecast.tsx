import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Cloud, Sun, CloudRain, Snowflake, CloudLightning, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import InfoTip from "./InfoTip";

function getWeatherIcon(code: number) {
  if (code <= 1) return <Sun className="h-8 w-8 text-yellow-500" />;
  if (code <= 3) return <Cloud className="h-8 w-8 text-muted-foreground" />;
  if (code >= 95) return <CloudLightning className="h-8 w-8 text-purple-500" />;
  if (code >= 71 && code <= 77) return <Snowflake className="h-8 w-8 text-blue-300" />;
  if (code >= 51) return <CloudRain className="h-8 w-8 text-blue-500" />;
  return <Cloud className="h-8 w-8 text-muted-foreground" />;
}

const WeatherForecast = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["weather-forecast"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("weather-forecast");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 min
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Időjárás betöltése...</span>
        </CardContent>
      </Card>
    );
  }

  if (!data?.weather) return null;

  const { weather, forecast, date } = data;
  const adjustText = forecast.rainAdjustmentPercent !== 0
    ? `(${forecast.rainAdjustmentPercent > 0 ? '+' : ''}${forecast.rainAdjustmentPercent}% az időjárás miatt)`
    : '';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              Holnapi előrejelzés
              <InfoTip text="Tapasztalati becslés a korábbi rendelési adatok és időjárás alapján." />
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
          </div>
          {getWeatherIcon(weather.weatherCode)}
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">{weather.description}</span>
            <span className="text-muted-foreground">
              {weather.tempMin}°–{weather.tempMax}°C
            </span>
            {weather.precipitationProbability > 0 && (
              <span className="text-blue-500">
                🌧 {weather.precipitationProbability}%
              </span>
            )}
          </div>

          <div className="bg-muted/50 rounded-md p-3 space-y-1">
            <p className="text-sm">
              Várható: <strong>~{forecast.estimatedOrders} rendelés</strong> (~{forecast.estimatedRevenue.toLocaleString("hu-HU")} Ft)
            </p>
            <p className="text-xs text-muted-foreground">
              Átlag ({forecast.historicalWeeks} hét): {forecast.avgOrders} rendelés {adjustText}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherForecast;
