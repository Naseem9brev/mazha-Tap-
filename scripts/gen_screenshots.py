"""
Generate realistic phone-frame mockup screenshots for mazha Tap.
Three screens: Onboarding, Tap result with yield, Don't Tap result.
"""
from PIL import Image, ImageDraw, ImageFont
import os, math

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs")
os.makedirs(DOCS, exist_ok=True)

# ── Palette ────────────────────────────────────────────────────────────────
BG       = (250, 246, 235)
CARD     = (255, 255, 255)
GREEN    = (38,  90,  56)
GREEN_L  = (220, 242, 226)
AMBER    = (214, 133, 30)
AMBER_L  = (255, 243, 210)
RED      = (196, 50,  50)
RED_L    = (255, 230, 230)
ORANGE   = (210, 110, 30)
ORANGE_L = (255, 240, 220)
BLUE     = (60,  130, 210)
BLUE_L   = (220, 236, 255)
RAIN     = (80,  140, 200)
BORDER   = (220, 210, 190)
MID      = (90,  75,  55)
DARK     = (28,  20,  10)
MUTED    = (140, 120, 90)
WHITE    = (255, 255, 255)
PHONE_BG = (30,  25,  20)
PRIMARY  = GREEN

# ── Font helpers ───────────────────────────────────────────────────────────
def bfont(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for p in candidates:
        try: return ImageFont.truetype(p, size)
        except: pass
    return ImageFont.load_default()

# ── Phone frame ────────────────────────────────────────────────────────────
PW, PH = 390, 844          # iPhone-ish logical size
SCALE   = 2                 # retina
W, H    = PW * SCALE, PH * SCALE
FRAME_R = 50                # phone corner radius
BEZEL   = 16                # frame thickness (logical)
NOTCH_W, NOTCH_H = 130, 30

def make_phone():
    img = Image.new("RGBA", (W, H), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    # outer frame
    draw.rounded_rectangle([(0,0),(W-1,H-1)], radius=FRAME_R*SCALE,
        fill=PHONE_BG, outline=(60,55,50), width=4)
    # screen area
    sx = BEZEL*SCALE; sy = BEZEL*SCALE
    sw = W - 2*BEZEL*SCALE; sh = H - 2*BEZEL*SCALE
    draw.rounded_rectangle([(sx,sy),(sx+sw-1,sy+sh-1)], radius=(FRAME_R-BEZEL)*SCALE,
        fill=BG)
    # notch
    nx = (W - NOTCH_W*SCALE)//2; ny = sy
    draw.rounded_rectangle([(nx, ny),(nx+NOTCH_W*SCALE, ny+NOTCH_H*SCALE)],
        radius=10*SCALE, fill=PHONE_BG)
    # home indicator
    hi_y = H - 20*SCALE
    draw.rounded_rectangle([(W//2-50*SCALE, hi_y),(W//2+50*SCALE, hi_y+8*SCALE)],
        radius=4*SCALE, fill=(80,70,60))
    # side buttons
    draw.rounded_rectangle([(0, 180*SCALE),(8*SCALE, 240*SCALE)], radius=4*SCALE, fill=(50,45,40))
    draw.rounded_rectangle([(W-8*SCALE, 200*SCALE),(W, 280*SCALE)], radius=4*SCALE, fill=(50,45,40))
    return img, draw, sx, sy, sw, sh

# Screen drawing coordinates (logical, will be *SCALE)
S = SCALE
CX = PW // 2

# ── Helper drawing functions ────────────────────────────────────────────────
def rbox(draw, x1, y1, x2, y2, fill, outline=None, lw=1, r=12):
    draw.rounded_rectangle([(x1*S,y1*S),(x2*S,y2*S)], radius=r*S,
        fill=fill, outline=outline, width=lw*S if outline else 0)

def txt(draw, x, y, text, size, fill=DARK, anchor="lt"):
    f = bfont(size*S)
    if anchor == "mm":
        bb = draw.textbbox((0,0), text, font=f)
        tw, th = bb[2]-bb[0], bb[3]-bb[1]
        draw.text(((x - tw//2//S)*S, (y - th//2//S)*S), text, font=f, fill=fill)
    elif anchor == "rt":
        bb = draw.textbbox((0,0), text, font=f)
        tw = bb[2]-bb[0]
        draw.text(((x - tw//S)*S, y*S), text, font=f, fill=fill)
    else:
        draw.text((x*S, y*S), text, font=f, fill=fill)

def hline(draw, x1, x2, y, color=BORDER, lw=1):
    draw.line([(x1*S, y*S),(x2*S, y*S)], fill=color, width=lw*S)

def pill(draw, x, y, label, bg, fg=WHITE, size=11):
    f = bfont(size*S)
    bb = draw.textbbox((0,0), label, font=f)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    pad = 8
    x1,y1 = x*S, y*S
    x2,y2 = x1+tw+pad*2*S, y1+th+pad*S
    draw.rounded_rectangle([(x1,y1),(x2,y2)], radius=6*S, fill=bg)
    draw.text((x1+pad*S, y1+pad*S//2), label, font=f, fill=fg)
    return (x2-x1)//S

def progress(draw, x, y, w, h, pct, bg=GREEN):
    track_color = (230,225,215)
    draw.rounded_rectangle([(x*S,y*S),((x+w)*S,(y+h)*S)], radius=h*S//2, fill=track_color)
    fw = max(h, int(w * pct / 100))
    draw.rounded_rectangle([(x*S,y*S),((x+fw)*S,(y+h)*S)], radius=h*S//2, fill=bg)

def stat_cell(draw, x, y, w, h, icon_char, label, value, accent):
    rbox(draw, x, y, x+w, y+h, (245,242,235), BORDER, lw=1, r=10)
    txt(draw, x+w//2, y+8, icon_char, 14, accent, anchor="mm")
    txt(draw, x+w//2, y+26, value, 15, DARK, anchor="mm")
    txt(draw, x+w//2, y+44, label, 9, MUTED, anchor="mm")

# ── STATUS BAR ─────────────────────────────────────────────────────────────
def draw_statusbar(draw, ox, oy):
    txt(draw, ox+20, oy+50, "9:41", 12, DARK)
    txt(draw, ox+PW-20, oy+50, "●●●", 10, DARK, anchor="rt")

# ── TOP BAR ────────────────────────────────────────────────────────────────
def draw_topbar(draw, ox, oy, title="mazha Tap—", subtitle=None):
    # bar background
    draw.rectangle([(ox*S, (oy+70)*S),((ox+PW)*S, (oy+100)*S)], fill=CARD)
    draw.line([((ox)*S, (oy+100)*S),((ox+PW)*S, (oy+100)*S)], fill=BORDER, width=S)
    txt(draw, ox+20, oy+74, title, 15, PRIMARY)
    if subtitle:
        txt(draw, ox+PW-20, oy+76, subtitle, 10, MUTED, anchor="rt")

# ══════════════════════════════════════════════════════════════════════════════
# SCREEN 1 — Onboarding Form
# ══════════════════════════════════════════════════════════════════════════════
def make_onboarding():
    img, draw, sx, sy, sw, sh = make_phone()
    ox = sx//S; oy = sy//S
    draw_statusbar(draw, ox, oy)

    # Header
    txt(draw, CX, oy+80, "mazha Tap—", 26, PRIMARY, anchor="mm")
    txt(draw, CX, oy+116, "Tell us about your plantation", 12, MUTED, anchor="mm")

    cy = oy + 148

    # Card
    rbox(draw, ox+16, cy, ox+PW-16, cy+520, CARD, BORDER, lw=1, r=14)

    # Card title
    txt(draw, ox+30, cy+16, "  Your Plantation", 13, DARK)
    txt(draw, ox+30, cy+34, "Saved locally — never sent to a server.", 10, MUTED)
    hline(draw, ox+16, ox+PW-16, cy+52)

    # Location
    txt(draw, ox+30, cy+60, "Location", 11, DARK)
    rbox(draw, ox+30, cy+76, ox+PW-30, cy+100, (248,246,240), BORDER, lw=1, r=8)
    txt(draw, ox+42, cy+83, "Kottayam, Kerala...", 11, (180,160,130))
    # search button
    rbox(draw, ox+PW-66, cy+78, ox+PW-32, cy+98, (240,236,228), BORDER, lw=1, r=6)
    txt(draw, ox+PW-54, cy+82, "  🔍", 11, MUTED)
    # selected coords
    txt(draw, ox+30, cy+104, "📍 9.5916, 76.5222", 10, GREEN)

    # Size / trees
    txt(draw, ox+30, cy+122, "Size (ha)", 11, DARK)
    txt(draw, ox+PW//2+10, cy+122, "No. of trees", 11, DARK)
    rbox(draw, ox+30, cy+136, ox+PW//2-6, cy+158, (248,246,240), BORDER, lw=1, r=8)
    txt(draw, ox+40, cy+143, "2.5", 11, DARK)
    rbox(draw, ox+PW//2+10, cy+136, ox+PW-30, cy+158, (248,246,240), BORDER, lw=1, r=8)
    txt(draw, ox+PW//2+20, cy+143, "400", 11, DARK)

    # Tree age
    txt(draw, ox+30, cy+172, "  Tree Age", 11, DARK)
    ages = [("Young", False), ("Mature", True), ("Old", False)]
    bw = (PW - 76) // 3
    for i, (lbl, sel) in enumerate(ages):
        bx = ox+30 + i*(bw+8)
        bg = GREEN_L if sel else (248,246,240)
        outc = GREEN if sel else BORDER
        rbox(draw, bx, cy+188, bx+bw, cy+228, bg, outc, lw=1+sel, r=8)
        tc = GREEN if sel else DARK
        txt(draw, bx+bw//2, cy+196, lbl, 12, tc, anchor="mm")
        desc = ["<15 yrs", "15–30 yrs", "30+ yrs"][i]
        txt(draw, bx+bw//2, cy+212, desc, 9, MUTED, anchor="mm")

    # Tapping system
    txt(draw, ox+30, cy+244, "  Tapping System", 11, DARK)
    sys_opts = [("Daily", False), ("Alt-day", True), ("Rain-guard", False)]
    sw2 = (PW - 76) // 3
    for i, (lbl, sel) in enumerate(sys_opts):
        bx = ox+30 + i*(sw2+8)
        bg = GREEN_L if sel else (248,246,240)
        outc = GREEN if sel else BORDER
        rbox(draw, bx, cy+258, bx+sw2, cy+282, bg, outc, lw=1+sel, r=8)
        tc = GREEN if sel else DARK
        txt(draw, bx+sw2//2, cy+264, lbl, 11, tc, anchor="mm")

    # Start time
    txt(draw, ox+30, cy+298, "  Start Time", 11, DARK)
    times = ["3:00 AM", "4:00 AM", "5:00 AM", "6:00 AM"]
    tw2 = (PW - 76) // 4
    for i, t in enumerate(times):
        bx = ox+30 + i*(tw2+4)
        sel = i==2
        bg = GREEN_L if sel else (248,246,240)
        outc = GREEN if sel else BORDER
        rbox(draw, bx, cy+312, bx+tw2, cy+332, bg, outc, lw=1+sel, r=6)
        tc = GREEN if sel else DARK
        txt(draw, bx+tw2//2, cy+316, t, 9, tc, anchor="mm")

    # Latex sale method
    txt(draw, ox+30, cy+348, "  How do you sell latex?", 11, DARK)
    methods = [("Liquid Latex", "Drums · DRC-tested", True), ("Rubber Sheets", "Coagulate & dry", False)]
    mw = (PW - 76) // 2
    for i, (lbl, desc, sel) in enumerate(methods):
        bx = ox+30 + i*(mw+8)
        bg = GREEN_L if sel else (248,246,240)
        outc = GREEN if sel else BORDER
        rbox(draw, bx, cy+362, bx+mw, cy+400, bg, outc, lw=1+sel, r=8)
        tc = GREEN if sel else DARK
        txt(draw, bx+mw//2, cy+373, lbl, 11, tc, anchor="mm")
        txt(draw, bx+mw//2, cy+388, desc, 9, MUTED, anchor="mm")

    # Submit button
    rbox(draw, ox+30, cy+418, ox+PW-30, cy+450, GREEN, None, r=10)
    txt(draw, CX, cy+427, "Get my recommendation →", 13, WHITE, anchor="mm")

    out = os.path.join(DOCS, "screen_onboarding.png")
    img.convert("RGB").save(out, "PNG", optimize=True)
    print(f"Saved → {out}")

# ══════════════════════════════════════════════════════════════════════════════
# SCREEN 2 — Tap result with yield estimate
# ══════════════════════════════════════════════════════════════════════════════
def make_result_tap():
    img, draw, sx, sy, sw, sh = make_phone()
    ox = sx//S; oy = sy//S
    draw_statusbar(draw, ox, oy)
    draw_topbar(draw, ox, oy, "mazha Tap—", "Monday, 22 June")

    cy = oy + 108

    # Main verdict card — TAP (green)
    rbox(draw, ox+16, cy, ox+PW-16, cy+130, CARD, (120,200,140), lw=2, r=14)
    # Big icon
    draw.ellipse([(( ox+30)*S,(cy+16)*S),((ox+70)*S,(cy+56)*S)], fill=GREEN_L)
    txt(draw, ox+50, cy+28, "✓", 22, GREEN, anchor="mm")
    # Badge + location
    pill(draw, ox+84, cy+18, "Tap", GREEN, WHITE, 11)
    txt(draw, ox+138, cy+20, "Kottayam", 10, MUTED)
    # Headline
    txt(draw, ox+84, cy+38, "Good conditions — tap today.", 12, DARK)
    txt(draw, ox+84, cy+56, "Rain stays at 12% through your window.", 10, MUTED)
    # Confidence
    txt(draw, ox+30, cy+90, "Confidence", 10, MUTED)
    txt(draw, ox+PW-30, cy+90, "88%", 10, DARK, anchor="rt")
    progress(draw, ox+30, cy+104, PW-60, 6, 88, GREEN)

    cy += 138

    # Weather summary card
    rbox(draw, ox+16, cy, ox+PW-16, cy+108, CARD, BORDER, r=12)
    txt(draw, ox+30, cy+12, "TAPPING WINDOW: 05:00 – 09:00", 9, MUTED)
    hline(draw, ox+30, ox+PW-30, cy+26)
    cw = (PW - 60) // 2
    stats = [
        ("💧", "Rain probability", "12%"),
        ("🌧", "Expected rain",    "0.0 mm"),
        ("💨", "Avg humidity",     "78%"),
        ("〰", "Peak humidity",    "82%"),
    ]
    for i, (ic, lbl, val) in enumerate(stats):
        col = i % 2; row = i // 2
        bx = ox+30 + col*(cw+4); by = cy+32 + row*36
        txt(draw, bx+4,  by+4, ic, 11, RAIN)
        txt(draw, bx+24, by+5, lbl, 9, MUTED)
        txt(draw, bx+24, by+18, val, 12, DARK)

    cy += 116

    # Reasoning card
    rbox(draw, ox+16, cy, ox+PW-16, cy+98, CARD, BORDER, r=12)
    txt(draw, ox+30, cy+12, "WHY?", 9, MUTED)
    hline(draw, ox+30, ox+PW-30, cy+26)
    reasons = [
        "Rain stays at 12% — within safe range.",
        "High humidity (78%) — secondary risk noted.",
        "Mature trees — baseline thresholds apply.",
    ]
    for i, r in enumerate(reasons):
        txt(draw, ox+30, cy+32+i*22, "—  " + r, 10, DARK)

    cy += 106

    # Yield estimate card
    rbox(draw, ox+16, cy, ox+PW-16, cy+120, CARD, BORDER, r=12)
    txt(draw, ox+30, cy+12, "YIELD & LABOUR ESTIMATE", 9, MUTED)
    hline(draw, ox+30, ox+PW-30, cy+26)
    cw3 = (PW - 68) // 3
    cells = [
        ("🧪", "Expected latex", "~20L"),
        ("👷", "Tappers needed", "1"),
        ("📦", "Tapper blocks",  "1"),
    ]
    for i, (ic, lbl, val) in enumerate(cells):
        bx = ox+30 + i*(cw3+4)
        rbox(draw, bx, cy+34, bx+cw3, cy+108, (245,242,235), BORDER, r=8)
        txt(draw, bx+cw3//2, cy+44, ic, 16, GREEN, anchor="mm")
        txt(draw, bx+cw3//2, cy+68, val, 16, DARK, anchor="mm")
        txt(draw, bx+cw3//2, cy+90, lbl, 8, MUTED, anchor="mm")

    cy += 128

    # Liquid latex note
    rbox(draw, ox+16, cy, ox+PW-16, cy+52, (230,244,235), (100,180,120), lw=1, r=10)
    txt(draw, ox+28, cy+10, "💧  Liquid latex DRC tip", 11, GREEN)
    txt(draw, ox+28, cy+28, "Accept only if DRC ≥ 60%. Light bark grease keeps", 9, MUTED)
    txt(draw, ox+28, cy+40, "moisture out post-tap.", 9, MUTED)

    cy += 60

    # Action buttons
    rbox(draw, ox+16, cy, ox+PW//2-6, cy+42, (248,246,240), BORDER, r=10)
    txt(draw, ox+16+(PW//2-22)//2, cy+13, "↻  Refresh", 12, DARK, anchor="mm")
    rbox(draw, ox+PW//2+6, cy, ox+PW-16, cy+42, (248,246,240), BORDER, r=10)
    txt(draw, ox+PW//2+6+(PW//2-22)//2, cy+13, "↺  Change", 12, DARK, anchor="mm")

    out = os.path.join(DOCS, "screen_tap.png")
    img.convert("RGB").save(out, "PNG", optimize=True)
    print(f"Saved → {out}")

# ══════════════════════════════════════════════════════════════════════════════
# SCREEN 3 — Don't Tap result with next window + off-season note
# ══════════════════════════════════════════════════════════════════════════════
def make_result_donttap():
    img, draw, sx, sy, sw, sh = make_phone()
    ox = sx//S; oy = sy//S
    draw_statusbar(draw, ox, oy)
    draw_topbar(draw, ox, oy, "mazha Tap—", "Monday, 22 June")

    cy = oy + 108

    # Main verdict card — DON'T TAP (red)
    rbox(draw, ox+16, cy, ox+PW-16, cy+130, CARD, (220,120,120), lw=2, r=14)
    draw.ellipse([((ox+30)*S,(cy+16)*S),((ox+70)*S,(cy+56)*S)], fill=RED_L)
    txt(draw, ox+50, cy+28, "✕", 22, RED, anchor="mm")
    pill(draw, ox+84, cy+18, "Don't Tap", RED, WHITE, 11)
    txt(draw, ox+184, cy+20, "Thrissur", 10, MUTED)
    txt(draw, ox+84, cy+38, "Rain risk too high — skip today.", 12, DARK)
    txt(draw, ox+84, cy+56, "72% rain probability in your window.", 10, MUTED)
    txt(draw, ox+30, cy+90, "Confidence", 10, MUTED)
    txt(draw, ox+PW-30, cy+90, "91%", 10, DARK, anchor="rt")
    progress(draw, ox+30, cy+104, PW-60, 6, 91, RED)

    cy += 138

    # Weather summary card
    rbox(draw, ox+16, cy, ox+PW-16, cy+108, CARD, BORDER, r=12)
    txt(draw, ox+30, cy+12, "TAPPING WINDOW: 05:00 – 09:00", 9, MUTED)
    hline(draw, ox+30, ox+PW-30, cy+26)
    cw = (PW - 60) // 2
    stats = [
        ("💧", "Rain probability", "72%"),
        ("🌧", "Expected rain",    "4.2 mm"),
        ("💨", "Avg humidity",     "94%"),
        ("〰", "Peak humidity",    "97%"),
    ]
    for i, (ic, lbl, val) in enumerate(stats):
        col = i % 2; row = i // 2
        bx = ox+30 + col*(cw+4); by = cy+32 + row*36
        txt(draw, bx+4,  by+4, ic, 11, RAIN)
        txt(draw, bx+24, by+5, lbl, 9, MUTED)
        txt(draw, bx+24, by+18, val, 12, RED if i<2 else DARK)

    cy += 116

    # Reasoning card
    rbox(draw, ox+16, cy, ox+PW-16, cy+110, CARD, BORDER, r=12)
    txt(draw, ox+30, cy+12, "WHY?", 9, MUTED)
    hline(draw, ox+30, ox+PW-30, cy+26)
    reasons = [
        "Rain reaches 72% — above 60% threshold.",
        "4.2 mm rain expected — exceeds 2 mm limit.",
        "Very high humidity (97%) — latex dilution risk.",
        "Rain-guard installed — threshold relaxed +25%.",
    ]
    for i, r in enumerate(reasons):
        txt(draw, ox+30, cy+32+i*20, "—  " + r, 10, DARK)

    cy += 118

    # Next safe window card (amber)
    rbox(draw, ox+16, cy, ox+PW-16, cy+72, AMBER_L, (200,150,60), lw=1, r=12)
    txt(draw, ox+30, cy+12, "NEXT SAFE WINDOW", 9, MUTED)
    hline(draw, ox+30, ox+PW-30, cy+26)
    txt(draw, ox+30, cy+34, "Tuesday 23 Jun, 3 AM – 06:00", 12, DARK)
    txt(draw, ox+30, cy+52, "Rain probability stays below 18%", 10, MUTED)
    pill(draw, ox+PW-100, cy+48, "moderate", AMBER, WHITE, 9)

    cy += 80

    # Off-season banner (orange)
    rbox(draw, ox+16, cy, ox+PW-16, cy+64, (255,240,220), (210,150,80), lw=1, r=12)
    txt(draw, ox+30, cy+12, "📅  OFF-SEASON NOTICE", 10, ORANGE)
    txt(draw, ox+30, cy+30, "June–August: trees enter stress休眠 rest.", 9, MUTED)
    txt(draw, ox+30, cy+44, "Consider reduced frequency to protect bark.", 9, MUTED)

    cy += 72

    # Yield card (muted, still shows)
    rbox(draw, ox+16, cy, ox+PW-16, cy+88, CARD, BORDER, r=12)
    txt(draw, ox+30, cy+12, "YIELD & LABOUR ESTIMATE", 9, MUTED)
    hline(draw, ox+30, ox+PW-30, cy+26)
    cw3 = (PW - 68) // 3
    cells = [("🧪", "Expected latex", "~100L"), ("👷", "Tappers needed", "4"), ("📦", "Tapper blocks", "4")]
    for i, (ic, lbl, val) in enumerate(cells):
        bx = ox+30 + i*(cw3+4)
        rbox(draw, bx, cy+32, bx+cw3, cy+82, (245,242,235), BORDER, r=8)
        txt(draw, bx+cw3//2, cy+42, ic, 14, MUTED, anchor="mm")
        txt(draw, bx+cw3//2, cy+58, val, 14, MUTED, anchor="mm")
        txt(draw, bx+cw3//2, cy+72, lbl, 8, MUTED, anchor="mm")

    out = os.path.join(DOCS, "screen_donttap.png")
    img.convert("RGB").save(out, "PNG", optimize=True)
    print(f"Saved → {out}")

# ══════════════════════════════════════════════════════════════════════════════
# SCREEN 4 — Yield & Labour card (scrolled into full view)
# ══════════════════════════════════════════════════════════════════════════════
def make_yield_card():
    img, draw, sx, sy, sw, sh = make_phone()
    ox = sx//S; oy = sy//S
    draw_statusbar(draw, ox, oy)
    draw_topbar(draw, ox, oy, "mazha Tap—", "Monday, 22 June")

    cy = oy + 108

    # Tap badge strip — compact, just to give context
    rbox(draw, ox+16, cy, ox+PW-16, cy+52, CARD, (120,200,140), lw=2, r=14)
    draw.ellipse([((ox+30)*S,(cy+10)*S),((ox+52)*S,(cy+32)*S)], fill=GREEN_L)
    txt(draw, ox+41, cy+14, "✓", 14, GREEN, anchor="mm")
    pill(draw, ox+60, cy+10, "Tap", GREEN, WHITE, 10)
    txt(draw, ox+110, cy+12, "Kottayam  ·  88% confidence", 10, MUTED)
    progress(draw, ox+60, cy+34, PW-76, 5, 88, GREEN)

    cy += 60

    # Weather mini summary strip
    rbox(draw, ox+16, cy, ox+PW-16, cy+44, CARD, BORDER, r=10)
    wstats = [("💧 12%", "rain prob"), ("🌧 0mm", "expected"), ("💨 78%", "humidity")]
    cw = (PW - 60) // 3
    for i, (val, lbl) in enumerate(wstats):
        bx = ox+30 + i*cw
        txt(draw, bx + cw//2, cy+8,  val, 11, DARK, anchor="mm")
        txt(draw, bx + cw//2, cy+26, lbl, 9,  MUTED, anchor="mm")
        if i < 2:
            draw.line([((ox+30+(i+1)*cw)*S, (cy+8)*S), ((ox+30+(i+1)*cw)*S, (cy+36)*S)], fill=BORDER, width=S)

    cy += 52

    # ── YIELD & LABOUR card — the main focus ──────────────────────────────
    rbox(draw, ox+16, cy, ox+PW-16, cy+310, CARD, BORDER, r=14)

    # Section header
    txt(draw, ox+30, cy+14, "YIELD & LABOUR ESTIMATE", 9, MUTED)
    hline(draw, ox+30, ox+PW-30, cy+30)

    # Three stat cells
    cw3 = (PW - 76) // 3
    cells = [
        ("🧪", "~20 L",  "Expected latex today"),
        ("👷", "1",      "Tapper needed"),
        ("📦", "1",      "Block (300 trees)"),
    ]
    for i, (icon, val, lbl) in enumerate(cells):
        bx = ox + 30 + i * (cw3 + 4)
        # Cell background with accent tint
        rbox(draw, bx, cy+38, bx+cw3, cy+118, (238, 250, 242), (180, 220, 190), lw=1, r=10)
        # Icon circle
        draw.ellipse([((bx+cw3//2-14)*S, (cy+46)*S), ((bx+cw3//2+14)*S, (cy+74)*S)], fill=GREEN_L)
        txt(draw, bx+cw3//2, cy+60, icon, 16, GREEN, anchor="mm")
        # Value (big)
        txt(draw, bx+cw3//2, cy+84, val, 17, GREEN, anchor="mm")
        # Label
        txt(draw, bx+cw3//2, cy+100, lbl, 9, MUTED, anchor="mm")

    cy_note = cy + 126

    # Note text block (from yield_estimate.note)
    note_lines = [
        "Your 400 trees form 1 tapper block.",
        "One tapper can manage your full",
        "plantation per day.",
        "Expected yield on a good tapping",
        "day: ~20 litres of latex (50 L/block).",
    ]
    for i, line in enumerate(note_lines):
        txt(draw, ox+30, cy_note + i*18, line, 10, MUTED)

    cy_tip = cy_note + len(note_lines)*18 + 12

    # Liquid latex tip card (from latex_sale_method)
    rbox(draw, ox+26, cy_tip, ox+PW-26, cy_tip+80, (228, 246, 234), (90, 170, 110), lw=1, r=10)
    # Tip label
    draw.ellipse([((ox+36)*S,(cy_tip+10)*S),((ox+52)*S,(cy_tip+26)*S)], fill=(180,230,190))
    txt(draw, ox+44, cy_tip+18, "💧", 10, GREEN, anchor="mm")
    txt(draw, ox+58, cy_tip+10, "Liquid Latex tip", 11, GREEN)
    tip_lines = [
        "Accept collection only if DRC ≥ 60%.",
        "Apply light bark grease post-tap to",
        "keep moisture out and protect yield.",
    ]
    for i, line in enumerate(tip_lines):
        txt(draw, ox+36, cy_tip+30+i*16, line, 9, MUTED)

    cy_season = cy_tip + 88

    # Off-season awareness strip
    rbox(draw, ox+16, cy_season, ox+PW-16, cy_season+52, (255,243,220), (210,160,80), lw=1, r=10)
    txt(draw, ox+34, cy_season+10, "📅  Seasonal note", 11, ORANGE)
    txt(draw, ox+34, cy_season+28, "Jun–Aug: reduced tapping frequency", 9, MUTED)
    txt(draw, ox+34, cy_season+40, "recommended to protect bark health.", 9, MUTED)

    cy_actions = cy_season + 60

    # Action buttons
    rbox(draw, ox+16, cy_actions, ox+PW//2-6, cy_actions+42, (248,246,240), BORDER, r=10)
    txt(draw, (ox+16 + ox+PW//2-6)//2, cy_actions+13, "↻  Refresh", 12, DARK, anchor="mm")
    rbox(draw, ox+PW//2+6, cy_actions, ox+PW-16, cy_actions+42, (248,246,240), BORDER, r=10)
    txt(draw, (ox+PW//2+6 + ox+PW-16)//2, cy_actions+13, "↺  Change", 12, DARK, anchor="mm")

    out = os.path.join(DOCS, "screen_yield.png")
    img.convert("RGB").save(out, "PNG", optimize=True)
    print(f"Saved → {out}")


if __name__ == "__main__":
    make_onboarding()
    make_result_tap()
    make_result_donttap()
    make_yield_card()
    print("All screens done.")
