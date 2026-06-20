"""
mazha Tap — Decision Engine Configuration
All thresholds are config values, not hardcoded magic numbers.
"""

# Tapping window defaults (hour of day, 24h)
DEFAULT_TAP_START_HOUR = 5   # 5 AM
DEFAULT_TAP_END_HOUR = 9     # 9 AM

# Rain probability thresholds (%)
RAIN_PROB_BLOCK = 60          # Hard block: don't tap if any hour in window exceeds this
RAIN_PROB_CAUTION = 35        # Caution: issue warning but allow tap
RAIN_PROB_CLEAR = 20          # Below this = rain risk is negligible

# Rain amount thresholds (mm)
RAIN_AMOUNT_BLOCK = 2.0       # Hard block if expected rain > this in window
RAIN_AMOUNT_CAUTION = 0.5     # Caution threshold

# Humidity thresholds (%)
HUMIDITY_CAUTION = 85         # Above this = secondary caution flag
HUMIDITY_HIGH = 95            # Above this = strong caution even without rain

# Tree age modifiers — multiplied onto rain probability thresholds
# (young trees are more sensitive, so effective thresholds tighten)
TREE_AGE_MODIFIERS = {
    "young": 0.80,    # tighten thresholds by 20%
    "mature": 1.00,   # baseline
    "old": 1.10,      # slightly more tolerant
}

# Rain-guard modifier — if rain-guard installed, relax block threshold
RAIN_GUARD_MODIFIER = 1.25    # 25% relaxation on thresholds

# Large plantation lead-time penalty (minutes)
# Growers with more trees need to start earlier to finish before rain
LARGE_PLANTATION_LEAD_MINUTES = 45   # added to tapping window start if >500 trees
MEDIUM_PLANTATION_THRESHOLD = 500    # trees
