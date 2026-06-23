import { NextResponse } from "next/server";

import {
  evaluateDecision,
  type DecisionRequest,
  type HourlyPoint,
  type LatexSaleMethod,
  type PlantationProfile,
  type TappingSystem,
  type TreeAge,
} from "@/lib/engine/decision-engine";

const TREE_AGES: TreeAge[] = ["young", "mature", "old"];
const TAPPING_SYSTEMS: TappingSystem[] = [
  "daily",
  "alternate_day",
  "rain_guard",
  "other",
];
const LATEX_SALE_METHODS: LatexSaleMethod[] = ["liquid_latex", "rubber_sheets"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readNullableNumber(
  record: Record<string, unknown>,
  key: string
): number | null | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function readNullableEnum<T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowed: T[]
): T | null | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : undefined;
}

function parsePlantation(value: unknown): PlantationProfile | null {
  if (!isRecord(value)) return null;

  const latitude = readNumber(value, "latitude");
  const longitude = readNumber(value, "longitude");
  const treeAge = readNullableEnum(value, "tree_age", TREE_AGES) ?? "mature";

  if (latitude === null || longitude === null) return null;

  return {
    latitude,
    longitude,
    size_hectares: readNullableNumber(value, "size_hectares"),
    num_trees: readNullableNumber(value, "num_trees"),
    tree_age: treeAge,
    tapping_system: readNullableEnum(value, "tapping_system", TAPPING_SYSTEMS),
    tap_start_hour: readNullableNumber(value, "tap_start_hour"),
    latex_sale_method: readNullableEnum(
      value,
      "latex_sale_method",
      LATEX_SALE_METHODS
    ),
  };
}

function parseHourlyPoint(value: unknown): HourlyPoint | null {
  if (!isRecord(value)) return null;

  const time = readString(value, "time");
  const precipitationProbability = readNumber(
    value,
    "precipitation_probability"
  );
  const precipitation = readNumber(value, "precipitation");
  const relativeHumidity = readNumber(value, "relative_humidity_2m");
  const temperature = readNumber(value, "temperature_2m");
  const rain = readNumber(value, "rain");
  const weathercode = readNumber(value, "weathercode");

  if (
    time === null ||
    precipitationProbability === null ||
    precipitation === null ||
    relativeHumidity === null ||
    temperature === null ||
    rain === null ||
    weathercode === null
  ) {
    return null;
  }

  return {
    time,
    precipitation_probability: precipitationProbability,
    precipitation,
    relative_humidity_2m: relativeHumidity,
    temperature_2m: temperature,
    rain,
    weathercode,
  };
}

function parseDecisionRequest(value: unknown): DecisionRequest | null {
  if (!isRecord(value) || !Array.isArray(value.hourly_forecast)) return null;

  const plantation = parsePlantation(value.plantation);
  if (!plantation) return null;

  const hourlyForecast: HourlyPoint[] = [];
  for (const point of value.hourly_forecast) {
    const hourlyPoint = parseHourlyPoint(point);
    if (hourlyPoint === null) return null;
    hourlyForecast.push(hourlyPoint);
  }

  return {
    plantation,
    hourly_forecast: hourlyForecast,
  };
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const decisionRequest = parseDecisionRequest(payload);
  if (!decisionRequest) {
    return NextResponse.json(
      { detail: "Invalid decision request payload" },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(evaluateDecision(decisionRequest));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { detail: `Decision engine error: ${message}` },
      { status: 500 }
    );
  }
}
