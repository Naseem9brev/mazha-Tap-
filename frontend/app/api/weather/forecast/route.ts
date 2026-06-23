import { NextResponse } from "next/server";

import type { HourlyPoint } from "@/lib/engine/decision-engine";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

interface OpenMeteoHourly {
  time?: string[];
  precipitation_probability?: number[];
  precipitation?: number[];
  relative_humidity_2m?: number[];
  temperature_2m?: number[];
  rain?: number[];
  weathercode?: number[];
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone?: string;
  hourly?: OpenMeteoHourly;
}

function parseCoordinate(value: string | null): number | null {
  if (value === null) return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function parseDays(value: string | null): number {
  if (value === null) return 2;
  const days = Number(value);
  if (!Number.isInteger(days) || days < 1 || days > 7) {
    throw new Error("days must be an integer from 1 to 7");
  }
  return days;
}

function readSeriesValue(series: number[] | undefined, index: number): number {
  return series?.[index] ?? 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = parseCoordinate(searchParams.get("lat"));
  const longitude = parseCoordinate(searchParams.get("lon"));

  if (latitude === null || longitude === null) {
    return NextResponse.json(
      { detail: "lat and lon query parameters are required" },
      { status: 400 }
    );
  }

  let days: number;
  try {
    days = parseDays(searchParams.get("days"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid days";
    return NextResponse.json({ detail: message }, { status: 400 });
  }

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    hourly:
      "precipitation_probability,precipitation,relative_humidity_2m,temperature_2m,rain,weathercode",
    forecast_days: days.toString(),
    timezone: "auto",
  });

  const response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`, {
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { detail: "Failed to fetch weather data from Open-Meteo" },
      { status: 502 }
    );
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const hourly = data.hourly ?? {};
  const times = hourly.time ?? [];
  const hourlyPoints: HourlyPoint[] = times.map((time, index) => ({
    time,
    precipitation_probability: readSeriesValue(
      hourly.precipitation_probability,
      index
    ),
    precipitation: readSeriesValue(hourly.precipitation, index),
    relative_humidity_2m: readSeriesValue(hourly.relative_humidity_2m, index),
    temperature_2m: readSeriesValue(hourly.temperature_2m, index),
    rain: readSeriesValue(hourly.rain, index),
    weathercode: readSeriesValue(hourly.weathercode, index),
  }));

  return NextResponse.json({
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone ?? "auto",
    hourly: hourlyPoints,
  });
}
