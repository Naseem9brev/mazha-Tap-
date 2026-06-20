import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


class HourlyWeatherPoint(BaseModel):
    time: str
    precipitation_probability: int
    precipitation: float
    relative_humidity_2m: int
    temperature_2m: float
    rain: float
    weathercode: int


class WeatherResponse(BaseModel):
    latitude: float
    longitude: float
    timezone: str
    hourly: list[HourlyWeatherPoint]


@router.get("/forecast", response_model=WeatherResponse)
async def get_forecast(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    days: int = Query(default=2, ge=1, le=7, description="Forecast days"),
):
    """Fetch hourly weather forecast from Open-Meteo for the given coordinates."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": [
            "precipitation_probability",
            "precipitation",
            "relative_humidity_2m",
            "temperature_2m",
            "rain",
            "weathercode",
        ],
        "forecast_days": days,
        "timezone": "auto",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(OPEN_METEO_URL, params=params)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Failed to fetch weather data from Open-Meteo")
        data = resp.json()

    hourly_raw = data.get("hourly", {})
    times = hourly_raw.get("time", [])
    hourly_points = []
    for i, t in enumerate(times):
        hourly_points.append(
            HourlyWeatherPoint(
                time=t,
                precipitation_probability=hourly_raw["precipitation_probability"][i],
                precipitation=hourly_raw["precipitation"][i],
                relative_humidity_2m=hourly_raw["relative_humidity_2m"][i],
                temperature_2m=hourly_raw["temperature_2m"][i],
                rain=hourly_raw["rain"][i],
                weathercode=hourly_raw["weathercode"][i],
            )
        )

    return WeatherResponse(
        latitude=data["latitude"],
        longitude=data["longitude"],
        timezone=data.get("timezone", "auto"),
        hourly=hourly_points,
    )
