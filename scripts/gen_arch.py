"""
Generate mazha Tap architecture diagram PNG.
Three swim-lane columns: Browser | Backend | External
"""
from PIL import Image, ImageDraw, ImageFont
import os, math

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs", "architecture.png")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

W, H = 1400, 920
BG = (248, 244, 234)

GREEN      = (38,  90,  56)
GREEN_L    = (220, 240, 225)
AMBER      = (214, 133, 30)
AMBER_L    = (255, 243, 210)
BLUE       = (60,  120, 200)
BLUE_L     = (220, 235, 255)
TEAL       = (30,  140, 140)
TEAL_L     = (210, 245, 245)
PURPLE     = (120, 60,  180)
RAIN_BLUE  = (80,  140, 200)
DARK       = (28,  20,  10)
MID        = (90,  75,  55)
LIGHT_LINE = (200, 190, 170)
WHITE      = (255, 255, 255)

img = Image.new("RGBA", (W, H), BG + (255,))
draw = ImageDraw.Draw(img, "RGBA")

FONT_PATHS = [
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
]
def best_font(size):
    for p in FONT_PATHS:
        try: return ImageFont.truetype(p, size)
        except: pass
    return ImageFont.load_default()

fTitle  = best_font(20)
fLabel  = best_font(17)
fSub    = best_font(14)
fTiny   = best_font(12)
fHeader = best_font(22)
fBig    = best_font(28)

R_BOX = 12

def rbox(x1, y1, x2, y2, fill, outline, lw=2):
    draw.rounded_rectangle([(x1, y1), (x2, y2)], radius=R_BOX, fill=fill, outline=outline, width=lw)

def text_center(x, y, txt, font, fill=DARK):
    bb = draw.textbbox((0, 0), txt, font=font)
    tw = bb[2] - bb[0]
    draw.text((x - tw // 2, y), txt, font=font, fill=fill)

def text_left(x, y, txt, font, fill=DARK):
    draw.text((x, y), txt, font=font, fill=fill)

def arrow(x1, y1, x2, y2, color=MID, lw=2, dashed=False):
    if dashed:
        total = math.hypot(x2 - x1, y2 - y1)
        steps = max(1, int(total // 10))
        for i in range(steps):
            t0 = i / steps
            t1 = (i + 0.5) / steps
            if i % 2 == 0:
                ax = x1 + (x2 - x1) * t0; ay = y1 + (y2 - y1) * t0
                bx = x1 + (x2 - x1) * t1; by = y1 + (y2 - y1) * t1
                draw.line([(ax, ay), (bx, by)], fill=color, width=lw)
    else:
        draw.line([(x1, y1), (x2, y2)], fill=color, width=lw)
    ang = math.atan2(y2 - y1, x2 - x1)
    size = 10
    p1 = (x2 - size * math.cos(ang - 0.4), y2 - size * math.sin(ang - 0.4))
    p2 = (x2 - size * math.cos(ang + 0.4), y2 - size * math.sin(ang + 0.4))
    draw.polygon([(x2, y2), p1, p2], fill=color)

def badge(x, y, txt, bg, fg=WHITE):
    bb = draw.textbbox((0, 0), txt, font=fTiny)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    pad = 6
    draw.rounded_rectangle([(x, y), (x + tw + pad*2, y + th + pad)], radius=6, fill=bg)
    draw.text((x + pad, y + pad//2), txt, font=fTiny, fill=fg)
    return tw + pad*2

# ── Background dot grid ────────────────────────────────────────────────────
for gx in range(30, W, 40):
    for gy in range(30, H, 40):
        draw.ellipse([(gx-1, gy-1), (gx+1, gy+1)], fill=(210, 200, 180))

# ── Swim lanes ─────────────────────────────────────────────────────────────
LANE_Y1, LANE_Y2 = 90, H - 40
L1, L2 = 40,  460
L3, L4 = 480, 900
L5, L6 = 920, W-20

draw.rounded_rectangle([(L1, LANE_Y1), (L2, LANE_Y2)], radius=16,
    fill=(240, 248, 242, 180), outline=GREEN, width=2)
draw.rounded_rectangle([(L3, LANE_Y1), (L4, LANE_Y2)], radius=16,
    fill=(240, 243, 252, 180), outline=BLUE, width=2)
draw.rounded_rectangle([(L5, LANE_Y1), (L6, LANE_Y2)], radius=16,
    fill=(252, 248, 235, 180), outline=AMBER, width=2)

text_center((L1+L2)//2, LANE_Y1 + 12, "Browser / Frontend", fHeader, GREEN)
text_center((L3+L4)//2, LANE_Y1 + 12, "Backend  \u00b7  FastAPI", fHeader, BLUE)
text_center((L5+L6)//2, LANE_Y1 + 12, "External Services", fHeader, AMBER)

text_center((L1+L2)//2, LANE_Y1 + 38, "Next.js 15  \u00b7  React 18  \u00b7  TypeScript", fTiny, MID)
text_center((L3+L4)//2, LANE_Y1 + 38, "Python 3.14  \u00b7  Pydantic v2  \u00b7  Uvicorn", fTiny, MID)
text_center((L5+L6)//2, LANE_Y1 + 38, "Free  \u00b7  No API key required", fTiny, MID)

# ── Node registry ──────────────────────────────────────────────────────────
nodes = {}

def node(key, x1, y1, x2, y2, title, subs, bg, outline, title_color=DARK):
    draw.rounded_rectangle([(x1+4, y1+4), (x2+4, y2+4)], radius=R_BOX,
        fill=(0, 0, 0, 20), outline=None)
    rbox(x1, y1, x2, y2, bg, outline, lw=2)
    cx = (x1 + x2) // 2
    cy = (y1 + y2) // 2
    total_h = len(subs) * 18 + 24
    start_y = cy - total_h // 2
    text_center(cx, start_y, title, fLabel, title_color)
    for i, s in enumerate(subs):
        text_center(cx, start_y + 24 + i * 18, s, fTiny, MID)
    nodes[key] = (cx, cy, x1, y1, x2, y2)

def right_of(k): return nodes[k][4], nodes[k][1]
def left_of(k):  return nodes[k][2], nodes[k][1]
def top_of(k):   return nodes[k][0], nodes[k][3]
def bot_of(k):   return nodes[k][0], nodes[k][5]

# ── Browser nodes ──────────────────────────────────────────────────────────
MW = L2 - L1 - 30; MX = L1 + 15

node("onboard",  MX, 150, MX+MW, 255,
     "Onboarding Form",
     ["Location search (Nominatim)", "Tree age \u00b7 tapping system", "Start time \u00b7 plantation size", "Latex sale method  \u2728 Phase 2"],
     GREEN_L, GREEN)

node("storage",  MX, 275, MX+MW, 335,
     "localStorage",
     ["Profile saved on-device only"],
     (235, 248, 235), GREEN, GREEN)

node("loading",  MX, 355, MX+MW, 415,
     "Loading State",
     ['"Checking the skies\u2026"'],
     (245, 245, 245), LIGHT_LINE, MID)

node("result",   MX, 435, MX+MW, 580,
     "Recommendation Card",
     ["Verdict badge + confidence bar", "Weather summary grid", "Bullet-point reasoning", "Next safe window callout",
      "Yield & labour panel  \u2728 Phase 2", "Off-season banner  \u2728 Phase 2"],
     AMBER_L, AMBER, AMBER)

node("error",    MX, 596, MX+MW, 656,
     "Error State",
     ["Retry / Start-over actions"],
     (255, 235, 235), (200, 80, 80), (180, 50, 50))

# ── Backend nodes ──────────────────────────────────────────────────────────
BW = L4 - L3 - 30; BX = L3 + 15

node("api",       BX, 150, BX+BW, 220,
     "FastAPI App  \u00b7  :8001",
     ["CORS enabled  \u00b7  GET /health"],
     BLUE_L, BLUE, BLUE)

node("weather_r", BX, 240, BX+BW, 310,
     "GET /weather/forecast",
     ["lat \u00b7 lon \u00b7 days (1\u20137)", "Async httpx proxy"],
     (230, 238, 255), BLUE)

node("decision_r",BX, 330, BX+BW, 400,
     "POST /decision/recommend",
     ["PlantationProfile + hourly[]", "Returns DecisionResponse"],
     (230, 238, 255), BLUE)

node("engine",    BX, 420, BX+BW, 560,
     "Decision Engine",
     ["Rain probability gating (60%)", "Rain amount check (2 mm)", "Humidity flag (95%)", "Tree-age modifiers \u00d70.8\u20131.1", "Rain-guard modifier \u00d71.25", "Next safe window finder (48h)"],
     GREEN_L, GREEN, GREEN)

node("yield",     BX, 575, BX+BW, 650,
     "Yield & Labour Engine  \u2728 Phase 2",
     ["Latex litres estimate (50 L/block)", "Tappers needed \u00b7 tapper blocks", "Off-season detection (Jun\u2013Aug)", "Liquid latex vs rubber sheets tip"],
     (235, 248, 238), GREEN, GREEN)

node("models",    BX, 665, BX+BW, 720,
     "Pydantic v2 Models",
     ["DecisionRequest \u00b7 YieldEstimate \u00b7 DecisionResponse"],
     (240, 240, 250), PURPLE, PURPLE)

# ── External nodes ─────────────────────────────────────────────────────────
EW = L6 - L5 - 30; EX = L5 + 15

node("openmeteo", EX, 175, EX+EW, 305,
     "Open-Meteo",
     ["api.open-meteo.com", "Hourly precipitation %", "Rain mm \u00b7 humidity \u00b7 temp", "Timezone-aware \u00b7 7-day"],
     BLUE_L, RAIN_BLUE, RAIN_BLUE)

node("nominatim", EX, 325, EX+EW, 430,
     "Nominatim / OSM",
     ["Location search", "Reverse geocoding"],
     TEAL_L, TEAL, TEAL)

node("device",    EX, 450, EX+EW, 530,
     "Device Storage",
     ["localStorage only", "Data never leaves device"],
     (248, 240, 220), AMBER, AMBER)

# ── Arrows ─────────────────────────────────────────────────────────────────
# Vertical flow in browser lane
arrow(*bot_of("onboard"),  *top_of("storage"),  GREEN,      lw=2)
arrow(*bot_of("storage"),  *top_of("loading"),  LIGHT_LINE, lw=1, dashed=True)
arrow(*bot_of("loading"),  *top_of("result"),   LIGHT_LINE, lw=1, dashed=True)
arrow(*bot_of("result"),   *top_of("error"),    LIGHT_LINE, lw=1, dashed=True)

# Browser → Backend: fetch weather
rx, ry = right_of("loading")
lx, ly = left_of("weather_r")
arrow(rx, ry, lx, ly, BLUE, lw=2)
text_left(rx + 8, ry - 18, "GET /weather/forecast", fTiny, BLUE)

# Browser → Backend: fetch decision
rx2, ry2 = right_of("result")
lx2, ly2 = left_of("decision_r")
arrow(rx2, ry2, lx2, ly2, BLUE, lw=2)
text_left(rx2 + 8, ry2 - 18, "POST /decision/recommend", fTiny, BLUE)

# Backend → Browser: response
arrow(lx2 - 2, ly2 + 45, rx2 - 2, ry2 + 45, GREEN, lw=2)
text_left(rx2 + 8, ry2 + 48, "\u2190 DecisionResponse", fTiny, GREEN)

# weather_r → Open-Meteo
rx3, ry3 = right_of("weather_r")
lx3, ly3 = left_of("openmeteo")
arrow(rx3, ry3, lx3, ly3 + 20, RAIN_BLUE, lw=2)
text_left(rx3 + 8, ry3 - 16, "httpx \u2192", fTiny, RAIN_BLUE)
arrow(lx3, ly3 + 60, rx3, ry3 + 40, RAIN_BLUE, lw=2, dashed=True)
text_left(rx3 + 8, ry3 + 44, "\u2190 hourly JSON", fTiny, MID)

# onboard → Nominatim
rx4, ry4 = right_of("onboard")
lx4, ly4 = left_of("nominatim")
arrow(rx4, ry4 + 30, lx4, ly4 + 10, TEAL, lw=2, dashed=True)
text_left(rx4 + 8, ry4 + 18, "search \u2192", fTiny, TEAL)

# storage → device
rx5, ry5 = right_of("storage")
lx5, ly5 = left_of("device")
arrow(rx5, ry5, lx5, ly5, AMBER, lw=2, dashed=True)

# decision_r → engine → yield → models
arrow(*bot_of("decision_r"), *top_of("engine"),  GREEN,  lw=2)
arrow(*bot_of("engine"),     *top_of("yield"),   GREEN,  lw=2)
arrow(*bot_of("yield"),      *top_of("models"),  PURPLE, lw=2)

# ── Title bar ──────────────────────────────────────────────────────────────
draw.rectangle([(0, 0), (W, 82)], fill=GREEN)
text_center(W // 2, 8,  "mazha Tap \u2014  System Architecture", fBig, WHITE)
text_center(W // 2, 48, "Browser  \u2192  FastAPI backend  \u2192  Open-Meteo  \u00b7  Rule-based decision engine  \u00b7  No ML  \u00b7  No DB", fTiny, (200, 230, 210))

badge(W - 112, 6, "v0.1.0", AMBER)
badge(W - 235, 6, "open source", TEAL)

# ── Footer ─────────────────────────────────────────────────────────────────
draw.rectangle([(0, H - 38), (W, H)], fill=GREEN)
text_center(W // 2, H - 28, "github.com/Naseem9brev/mazha-Tap-   \u00b7   FastAPI + Next.js 15 + Open-Meteo   \u00b7   MIT License", fTiny, (200, 230, 210))

img = img.convert("RGB")
img.save(OUT, "PNG", optimize=True)
print(f"Saved \u2192 {OUT}  ({W}\u00d7{H})")
