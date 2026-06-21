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


class LatexSaleMethod(str, Enum):
    liquid_latex = "liquid_latex"   # Sold as liquid latex; DRC-tested at collection centre
    rubber_sheets = "rubber_sheets" # Processed into coagulated/smoked sheets on-farm


class PlantationProfile(BaseModel):
    """Client-side onboarding data passed with each request."""
    latitude: float
    longitude: float
    size_hectares: Optional[float] = Field(None, description="Plantation size in hectares")
    num_trees: Optional[int] = Field(None, description="Approximate number of trees")
    tree_age: TreeAge = Field(TreeAge.mature, description="Predominant tree age category")
    tapping_system: Optional[TappingSystem] = Field(None, description="Tapping method used")
    tap_start_hour: Optional[int] = Field(None, ge=0, le=23, description="Preferred tapping start hour (24h)")
    latex_sale_method: Optional[LatexSaleMethod] = Field(None, description="How the grower sells their latex")


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


class YieldEstimate(BaseModel):
    """Estimated yield and labour context for the grower's plantation."""
    num_blocks: Optional[int] = Field(None, description="How many 300-tree tapper blocks the plantation has")
    estimated_litres: Optional[float] = Field(None, description="Expected latex yield today (litres), if tapping proceeds")
    tappers_needed: Optional[int] = Field(None, description="Number of tappers required for one tapping day")
    size_acres: Optional[float] = Field(None, description="Plantation size in acres (derived from tree count)")
    note: Optional[str] = Field(None, description="Plain-language summary of yield/labour context")
    off_season: bool = Field(False, description="True if today falls outside the Jun–Feb tapping season")
    off_season_note: Optional[str] = Field(None, description="Message shown during off-season months")


class DecisionResponse(BaseModel):
    recommendation: RecommendationLevel
    confidence: int = Field(..., ge=0, le=100, description="Confidence score 0–100")
    headline: str = Field(..., description="Short one-line verdict")
    reasoning: list[str] = Field(..., description="Bullet-point reasoning lines")
    next_window: Optional[WindowSuggestion] = Field(None, description="Suggested next safe window if today is no-go")
    weather_summary: dict = Field(default_factory=dict, description="Key weather stats for the tapping window")
    yield_estimate: Optional[YieldEstimate] = Field(None, description="Estimated yield and labour context")
