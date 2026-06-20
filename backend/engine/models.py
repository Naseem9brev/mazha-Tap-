"""Pydantic models for the decision engine."""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum


class TreeAge(str, Enum):
    young = "young"
    mature = "mature"
    old = "old"


class TappingSystem(str, Enum):
    daily = "daily"
    alternate_day = "alternate_day"
    rain_guard = "rain_guard"
    other = "other"


class PlantationProfile(BaseModel):
    """Client-side onboarding data passed with each request."""
    latitude: float
    longitude: float
    size_hectares: Optional[float] = Field(None, description="Plantation size in hectares")
    num_trees: Optional[int] = Field(None, description="Approximate number of trees")
    tree_age: TreeAge = Field(TreeAge.mature, description="Predominant tree age category")
    tapping_system: Optional[TappingSystem] = Field(None, description="Tapping method used")
    tap_start_hour: Optional[int] = Field(None, ge=0, le=23, description="Preferred tapping start hour (24h)")


class HourlyPoint(BaseModel):
    """Single hourly forecast point passed to the engine."""
    time: str
    precipitation_probability: int
    precipitation: float
    relative_humidity_2m: int
    temperature_2m: float
    rain: float
    weathercode: int


class DecisionRequest(BaseModel):
    """Full payload from frontend → decision endpoint."""
    plantation: PlantationProfile
    hourly_forecast: list[HourlyPoint]


class RecommendationLevel(str, Enum):
    tap = "tap"
    dont_tap = "dont_tap"
    delay = "delay"


class WindowSuggestion(BaseModel):
    start_hour: int
    end_hour: int
    confidence: str
    note: str


class DecisionResponse(BaseModel):
    recommendation: RecommendationLevel
    confidence: int = Field(..., ge=0, le=100, description="Confidence score 0–100")
    headline: str = Field(..., description="Short one-line verdict")
    reasoning: list[str] = Field(..., description="Bullet-point reasoning lines")
    next_window: Optional[WindowSuggestion] = Field(None, description="Suggested next safe window if today is no-go")
    weather_summary: dict = Field(default_factory=dict, description="Key weather stats for the tapping window")
