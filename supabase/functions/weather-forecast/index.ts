import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Kiscsibe location (Budapest area)
const LAT = 47.497;
const LON = 19.040;

// WMO weather code descriptions
const WMO_CODES: Record<number, string> = {
  0: "Derült", 1: "Túlnyomóan derült", 2: "Részben felhős", 3: "Borult",
  45: "Ködös", 48: "Zúzmarás köd",
  51: "Enyhe szitálás", 53: "Mérsékelt szitálás", 55: "Sűrű szitálás",
  61: "Enyhe eső", 63: "Mérsékelt eső", 65: "Erős eső",
  71: "Enyhe havazás", 73: "Mérsékelt havazás", 75: "Erős havazás",
  80: "Enyhe zápor", 81: "Mérsékelt zápor", 82: "Erős zápor",
  95: "Zivatar", 96: "Zivatar jégesővel", 99: "Erős zivatar jégesővel",
};

function isRainyCode(code: number): boolean {
  return code >= 51;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch weather from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=Europe/Budapest&forecast_days=2`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const tomorrow = weatherData.daily;
    const tomorrowIdx = 1; // index 1 = tomorrow
    const tempMax = tomorrow.temperature_2m_max[tomorrowIdx];
    const tempMin = tomorrow.temperature_2m_min[tomorrowIdx];
    const precipProb = tomorrow.precipitation_probability_max[tomorrowIdx];
    const weatherCode = tomorrow.weathercode[tomorrowIdx];
    const weatherDesc = WMO_CODES[weatherCode] || "Ismeretlen";
    const isRainy = isRainyCode(weatherCode);

    // Get tomorrow's day of week (1=Mon, 7=Sun)
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const dayOfWeek = tomorrowDate.getDay(); // 0=Sun, 6=Sat

    // Fetch historical orders for same weekday over past 8 weeks
    const historicalDates: string[] = [];
    for (let w = 1; w <= 8; w++) {
      const d = new Date(tomorrowDate);
      d.setDate(d.getDate() - w * 7);
      historicalDates.push(d.toISOString().split('T')[0]);
    }

    const historicalOrders: { date: string; count: number; revenue: number }[] = [];
    for (const dateStr of historicalDates) {
      const { data: dayOrders } = await supabase
        .from('orders')
        .select('id, total_huf, status')
        .gte('created_at', `${dateStr}T00:00:00`)
        .lte('created_at', `${dateStr}T23:59:59`)
        .neq('status', 'cancelled');

      const ords = dayOrders || [];
      historicalOrders.push({
        date: dateStr,
        count: ords.length,
        revenue: ords.reduce((s, o) => s + (o.total_huf || 0), 0),
      });
    }

    const validHistory = historicalOrders.filter(h => h.count > 0);
    const avgOrders = validHistory.length > 0
      ? Math.round(validHistory.reduce((s, h) => s + h.count, 0) / validHistory.length)
      : 0;
    const avgRevenue = validHistory.length > 0
      ? Math.round(validHistory.reduce((s, h) => s + h.revenue, 0) / validHistory.length)
      : 0;

    // Simple rain adjustment: rainy days typically see ~20% fewer orders
    const rainAdjustment = isRainy ? -0.2 : 0;
    const estimatedOrders = Math.round(avgOrders * (1 + rainAdjustment));
    const estimatedRevenue = Math.round(avgRevenue * (1 + rainAdjustment));

    const result = {
      weather: {
        tempMax,
        tempMin,
        precipitationProbability: precipProb,
        weatherCode,
        description: weatherDesc,
        isRainy,
      },
      forecast: {
        estimatedOrders,
        estimatedRevenue,
        avgOrders,
        avgRevenue,
        rainAdjustmentPercent: Math.round(rainAdjustment * 100),
        historicalWeeks: validHistory.length,
      },
      date: tomorrowDate.toISOString().split('T')[0],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('weather-forecast error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
