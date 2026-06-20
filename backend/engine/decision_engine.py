"""
mazha Tap — Decision Engine
Rule-based tap/no-tap logic. No ML, no database.

Logic flow:
1. Determine the effective tapping window for this grower.
2. Extract hourly weather data for that window.
3. Apply tree-age and rain-guard modifiers to thresholds.
4. Evaluate rain probability, rain amount, and humidity.
5. Return a structured recommendation with reasoning text.
"""
from datetime import datetime, date
from typing import Optional

from engine.config import (
    DEFAULT_TAP_START_HOUR,
    DEFAULT_TAP_END_HOUR,
    RAIN_PROB_BLOCK,
    RAIN_PROB_CAUTION,
    RAIN_PROB_CLEAR,
    RAIN_AMOUNT_BLOCK,
    RAIN_AMOUNT_CAUTION,
    HUMIDITY_CAUTION,
    HUMIDITY_HIGH,
    TREE_AGE_MODIFIERS,
    RAIN_GUARD_MODIFIER,
    LARGE_PLANTATION_LEAD_MINUTES,
    MEDIUM_PLANTATION_THRESHOLD,
)
from engine.models import (
    DecisionRequest,
    DecisionResponse,
    HourlyPoint,
    PlantationProfile,
    RecommendationLevel,
    TappingSystem,
    TreeAge,
    WindowSuggestion,
)


def _apply_modifiers(base_threshold: float, profile: PlantationProfile) -> float:
    """Apply plantation-specific multipliers to a base threshold."""
    modifier = TREE_AGE_MODIFIERS.get(profile.tree_age.value, 1.0)
    if profile.tapping_system == TappingSystem.rain_guard:
        modifier *= RAIN_GUARD_MODIFIER
    return base_threshold * modifier


def _get_tapping_window(profile: PlantationProfile) -> tuple[int, int]:
    """
    Return (start_hour, end_hour) for the effective tapping window.
    Large plantations get an earlier start time recommendation.
    """
    start = profile.tap_start_hour if profile.tap_start_hour is not None else DEFAULT_TAP_START_HOUR
    end = DEFAULT_TAP_END_HOUR

    # Large plantation lead-time: shift window earlier
    if profile.num_trees and profile.num_trees > MEDIUM_PLANTATION_THRESHOLD:
        lead_hours = LARGE_PLANTATION_LEAD_MINUTES // 60
        start = max(0, start - lead_hours)

    return start, end


def _filter_window(hourly: list[HourlyPoint], start_hour: int, end_hour: int, target_date: Optional[date] = None) -> list[HourlyPoint]:
    """Filter hourly data to only the points within the tapping window on target_date."""
    result = []
    for pt in hourly:
        try:
            dt = datetime.fromisoformat(pt.time)
        except ValueError:
            continue
        if target_date and dt.date() != target_date:
            continue
        if start_hour <= dt.hour < end_hour:
            result.append(pt)
    return result


def _find_next_safe_window(
    hourly: list[HourlyPoint],
    effective_block_prob: float,
    effective_block_rain: float,
) -> Optional[WindowSuggestion]:
    """
    Scan the next 48h for the first 3-consecutive-hour window
    where rain probability stays below the caution threshold.
    """
    for i in range(len(hourly) - 2):
        window = hourly[i:i+3]
        max_prob = max(p.precipitation_probability for p in window)
        total_rain = sum(p.rain for p in window)
        if max_prob < RAIN_PROB_CAUTION and total_rain < RAIN_AMOUNT_CAUTION:
            try:
                start_dt = datetime.fromisoformat(window[0].time)
                end_dt = datetime.fromisoformat(window[-1].time)
                confidence = "moderate" if max_prob < RAIN_PROB_CLEAR else "low"
                return WindowSuggestion(
                    start_hour=start_dt.hour,
                    end_hour=end_dt.hour + 1,
                    confidence=confidence,
                    note=f"Rain probability stays below {int(max_prob)}% — {start_dt.strftime('%A %d %b, %-I %p')} to {(end_dt.hour+1):02d}:00",
                )
            except Exception:
                pass
    return None


def evaluate(request: DecisionRequest) -> DecisionResponse:
    """Main entry point: evaluate a tap/no-tap decision."""
    profile = request.plantation
    hourly = request.hourly_forecast

    start_hour, end_hour = _get_tapping_window(profile)

    # Use today's date from the first forecast point
    target_date = None
    if hourly:
        try:
            target_date = datetime.fromisoformat(hourly[0].time).date()
        except ValueError:
            pass

    window_points = _filter_window(hourly, start_hour, end_hour, target_date)

    # Apply modifiers to thresholds
    effective_block_prob = _apply_modifiers(RAIN_PROB_BLOCK, profile)
    effective_caution_prob = _apply_modifiers(RAIN_PROB_CAUTION, profile)
    effective_block_rain = _apply_modifiers(RAIN_AMOUNT_BLOCK, profile)
    effective_caution_rain = _apply_modifiers(RAIN_AMOUNT_CAUTION, profile)

    reasoning: list[str] = []
    flags: list[str] = []  # internal flag list: "block", "caution", "humidity_high"

    # --- Weather stats for the window ---
    if window_points:
        max_rain_prob = max(p.precipitation_probability for p in window_points)
        total_rain = sum(p.rain for p in window_points)
        avg_humidity = sum(p.relative_humidity_2m for p in window_points) / len(window_points)
        max_humidity = max(p.relative_humidity_2m for p in window_points)
        peak_hour = None
        for p in window_points:
            if p.precipitation_probability == max_rain_prob:
                try:
                    peak_hour = datetime.fromisoformat(p.time).hour
                except ValueError:
                    pass
                break
    else:
        # No data for window — no forecast available; default to caution
        max_rain_prob = 0
        total_rain = 0.0
        avg_humidity = 0
        max_humidity = 0
        peak_hour = None
        reasoning.append("No forecast data available for your tapping window — proceeding with caution.")
        flags.append("caution")

    # --- Evaluate rain probability ---
    if max_rain_prob >= effective_block_prob:
        flags.append("block")
        hour_str = f" (peaking around {peak_hour:02d}:00)" if peak_hour is not None else ""
        reasoning.append(f"Rain probability reaches {max_rain_prob}% during your tapping window{hour_str} — above the safe threshold of {int(effective_block_prob)}%.")
    elif max_rain_prob >= effective_caution_prob:
        flags.append("caution")
        hour_str = f" (peaking around {peak_hour:02d}:00)" if peak_hour is not None else ""
        reasoning.append(f"Rain probability is {max_rain_prob}% during your window{hour_str} — moderate risk. Consider monitoring closely.")
    else:
        reasoning.append(f"Rain probability stays at {max_rain_prob}% during your tapping window — within safe range.")

    # --- Evaluate rain amount ---
    if total_rain >= effective_block_rain:
        if "block" not in flags:
            flags.append("block")
        reasoning.append(f"Expected rainfall of {total_rain:.1f} mm during the window exceeds safe limits ({effective_block_rain:.1f} mm).")
    elif total_rain >= effective_caution_rain:
        if "block" not in flags and "caution" not in flags:
            flags.append("caution")
        reasoning.append(f"Light rain expected ({total_rain:.1f} mm) — bark moisture may affect latex flow.")

    # --- Evaluate humidity ---
    if max_humidity >= HUMIDITY_HIGH:
        reasoning.append(f"Very high humidity ({max_humidity}%) — latex may be diluted even without direct rain.")
        if "block" not in flags:
            flags.append("caution")
    elif avg_humidity >= HUMIDITY_CAUTION:
        reasoning.append(f"High ambient humidity ({avg_humidity:.0f}% avg) — secondary risk factor noted.")

    # --- Tree age context ---
    if profile.tree_age == TreeAge.young:
        reasoning.append("Young trees are more sensitive to bark moisture — thresholds tightened accordingly.")
    elif profile.tree_age == TreeAge.old:
        reasoning.append("Older trees have slightly more bark tolerance — thresholds relaxed slightly.")

    # --- Rain-guard note ---
    if profile.tapping_system == TappingSystem.rain_guard:
        reasoning.append("Rain-guard system installed — risk thresholds relaxed by 25%.")

    # --- Large plantation note ---
    if profile.num_trees and profile.num_trees > MEDIUM_PLANTATION_THRESHOLD:
        reasoning.append(f"Large plantation ({profile.num_trees} trees) — recommended earlier start to complete tapping before rain arrives.")

    # --- Determine final recommendation & confidence ---
    if "block" in flags:
        recommendation = RecommendationLevel.dont_tap
        # Find whether any later window looks better
        next_window = _find_next_safe_window(hourly, effective_block_prob, effective_block_rain)
        if next_window:
            recommendation = RecommendationLevel.delay
            headline = f"Delay tapping — safer window available {next_window.note}"
            confidence = max(30, 80 - max_rain_prob)
        else:
            headline = "Don't tap today — rain risk is too high during your tapping window."
            confidence = max(40, 90 - max_rain_prob)
            next_window = None
    elif "caution" in flags:
        recommendation = RecommendationLevel.delay
        next_window = _find_next_safe_window(hourly, effective_block_prob, effective_block_rain)
        if next_window:
            headline = f"Tap with caution — or wait for a safer window: {next_window.note}"
        else:
            headline = "Tap with caution — some rain risk during your tapping window."
        confidence = max(40, 70 - max_rain_prob)
    else:
        recommendation = RecommendationLevel.tap
        next_window = None
        headline = "Good to tap — low rain risk during your tapping window."
        confidence = min(95, 95 - max_rain_prob)

    # Weather summary dict
    weather_summary = {
        "tapping_window": f"{start_hour:02d}:00 – {end_hour:02d}:00",
        "max_rain_probability_pct": max_rain_prob,
        "expected_rain_mm": round(total_rain, 2),
        "avg_humidity_pct": round(avg_humidity, 1),
        "max_humidity_pct": max_humidity,
    }

    return DecisionResponse(
        recommendation=recommendation,
        confidence=confidence,
        headline=headline,
        reasoning=reasoning,
        next_window=next_window,
        weather_summary=weather_summary,
    )
