import { NextRequest, NextResponse } from "next/server";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const hourlyFields = [
  "precipitation_probability",
  "precipitation",
  "relative_humidity_2m",
  "temperature_2m",
  "rain",
  "weathercode",
];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const days = Number(params.get("days") ?? "2");

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ detail: "lat and lon are required numeric query parameters" }, { status: 400 });
  }
  if (!Number.isInteger(days) || days < 1 || days > 7) {
    return NextResponse.json({ detail: "days must be an integer from 1 to 7" }, { status: 400 });
  }

  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("hourly", hourlyFields.join(","));
  url.searchParams.set("forecast_days", String(days));
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) {
    return NextResponse.json({ detail: "Failed to fetch weather data from Open-Meteo" }, { status: 502 });
  }

  const data = await response.json();
  const hourly = data.hourly ?? {};
  const times: string[] = hourly.time ?? [];

  return NextResponse.json({
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone ?? "auto",
    hourly: times.map((time, index) => ({
      time,
      precipitation_probability: hourly.precipitation_probability?.[index] ?? 0,
      precipitation: hourly.precipitation?.[index] ?? 0,
      relative_humidity_2m: hourly.relative_humidity_2m?.[index] ?? 0,
      temperature_2m: hourly.temperature_2m?.[index] ?? 0,
      rain: hourly.rain?.[index] ?? 0,
      weathercode: hourly.weathercode?.[index] ?? 0,
    })),
  });
}
