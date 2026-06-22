"""
Generate mazha Tap Tapper Marketplace screenshot mockup.
Matches the actual UI: two-panel layout, tapper card, role switcher.
"""
from PIL import Image, ImageDraw, ImageFont
import os, math

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs")
os.makedirs(DOCS, exist_ok=True)

# ── Canvas — landscape tablet/desktop crop ────────────────────────────────
W, H = 1880, 1320

# ── Palette (from the actual UI screenshot) ───────────────────────────────
BG_WARM    = (252, 246, 228)   # warm cream page background
BG_DARK    = (22,  28,  24)    # dark tapper card area
GREEN_DARK = (22,  72,  48)    # deep header green
GREEN_MID  = (38,  100, 60)
GREEN_PILL = (30,  85,  55)
GREEN_L    = (210, 240, 218)
AMBER      = (240, 180, 30)
AMBER_L    = (255, 243, 180)
AMBER_DARK = (180, 130, 20)
WHITE      = (255, 255, 255)
OFF_WHITE  = (248, 245, 236)
CARD_BG    = (255, 255, 255)
SIDEBAR_BG = (250, 247, 238)
DARK       = (18,  14,  8)
MID        = (80,  65,  45)
MUTED      = (140, 120, 90)
BORDER     = (220, 210, 185)
TEAL_GRAD1 = (30,  100, 80)
TEAL_GRAD2 = (60,  140, 90)
AVAILABLE  = (30,  160, 100)

def bfont(size):
    for p in ["/System/Library/Fonts/Helvetica.ttc",
              "/System/Library/Fonts/Arial.ttf"]:
        try: return ImageFont.truetype(p, size)
        except: pass
    return ImageFont.load_default()

img  = Image.new("RGB", (W, H), BG_WARM)
draw = ImageDraw.Draw(img)

# ── Subtle warm gradient background ──────────────────────────────────────
for y in range(H):
    t = y / H
    r = int(252 - t*8)
    g = int(246 - t*6)
    b = int(228 - t*4)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# ── Helper functions ──────────────────────────────────────────────────────
def rbox(x1, y1, x2, y2, fill, outline=None, lw=2, r=12):
    draw.rounded_rectangle([(x1,y1),(x2,y2)], radius=r,
        fill=fill, outline=outline, width=lw if outline else 0)

def shadow_rbox(x1, y1, x2, y2, fill, outline=None, lw=2, r=12, shadow=8):
    draw.rounded_rectangle([(x1+shadow,y1+shadow),(x2+shadow,y2+shadow)],
        radius=r, fill=(0,0,0,30) if isinstance(fill, tuple) and len(fill)==4 else (180,170,150))
    rbox(x1, y1, x2, y2, fill, outline, lw, r)

def tc(x, y, text, size, fill=DARK, anchor="mm"):
    f = bfont(size)
    bb = draw.textbbox((0,0), text, font=f)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    if anchor == "mm":
        draw.text((x - tw//2, y - th//2), text, font=f, fill=fill)
    elif anchor == "lt":
        draw.text((x, y), text, font=f, fill=fill)
    elif anchor == "rt":
        draw.text((x - tw, y), text, font=f, fill=fill)
    elif anchor == "lm":
        draw.text((x, y - th//2), text, font=f, fill=fill)

def pill(x, y, text, bg, fg=WHITE, size=22, r=20):
    f = bfont(size)
    bb = draw.textbbox((0,0), text, font=f)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    pad_x, pad_y = 20, 8
    draw.rounded_rectangle([(x,y),(x+tw+pad_x*2, y+th+pad_y*2)], radius=r, fill=bg)
    draw.text((x+pad_x, y+pad_y), text, font=f, fill=fg)
    return tw + pad_x*2, th + pad_y*2

def tag(x, y, text, bg=(220,240,228), fg=GREEN_DARK, size=20):
    f = bfont(size)
    bb = draw.textbbox((0,0), text, font=f)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    px, py = 16, 6
    draw.rounded_rectangle([(x,y),(x+tw+px*2, y+th+py*2)], radius=30, fill=bg)
    draw.text((x+px, y+py), text, font=f, fill=fg)
    return tw + px*2 + 8

# ══════════════════════════════════════════════════════════════════════════
# SECTION 1 — Top hero area
# ══════════════════════════════════════════════════════════════════════════
HERO_H = 240
rbox(0, 0, W, HERO_H, OFF_WHITE, BORDER, lw=1, r=0)
draw.line([(0, HERO_H-1),(W, HERO_H-1)], fill=BORDER, width=2)

# TAPPER MARKETPLACE pill
pill_w, _ = pill(80, 44, "✦  TAPPER MARKETPLACE", GREEN_PILL, WHITE, 22, 24)

# Headline
tc(80, 110, "mazha Tap connects rubber", 52, DARK, "lt")
tc(80, 172, "growers and skilled tappers.", 52, DARK, "lt")
tc(80, 218, "Swipe through trusted Kerala tapper profiles, match instantly,", 26, MUTED, "lt")
tc(80, 250, "and move the conversation to call or WhatsApp.", 26, MUTED, "lt")

# ── Role selector card (top right) ───────────────────────────────────────
RS_X, RS_Y, RS_W, RS_H = W-480, 36, 440, 220
shadow_rbox(RS_X, RS_Y, RS_X+RS_W, RS_Y+RS_H, CARD_BG, BORDER, lw=1, r=16)

# "I'm a Grower" — active/selected row
rbox(RS_X+16, RS_Y+16, RS_X+RS_W-16, RS_Y+74, AMBER, None, r=12)
tc(RS_X+36, RS_Y+38, "I'm a Grower", 26, DARK, "lt")
tc(RS_X+36, RS_Y+62, "Find skilled tappers", 22, (80,60,20), "lt")
# person icon placeholder
draw.ellipse([(RS_X+RS_W-60, RS_Y+26),(RS_X+RS_W-30, RS_Y+56)], outline=DARK, width=2)

# "I'm a Tapper" row
draw.line([(RS_X+16, RS_Y+82),(RS_X+RS_W-16, RS_Y+82)], fill=BORDER, width=1)
tc(RS_X+36, RS_Y+96, "I'm a Tapper", 26, DARK, "lt")
tc(RS_X+36, RS_Y+118, "Create your work card", 22, MUTED, "lt")

# "Rain Decision" row
draw.line([(RS_X+16, RS_Y+138),(RS_X+RS_W-16, RS_Y+138)], fill=BORDER, width=1)
tc(RS_X+36, RS_Y+152, "Rain Decision", 26, DARK, "lt")
tc(RS_X+36, RS_Y+174, "Phase 1 tool", 22, MUTED, "lt")

# ══════════════════════════════════════════════════════════════════════════
# SECTION 2 — Main split layout
# ══════════════════════════════════════════════════════════════════════════
MAIN_Y = HERO_H + 10
SB_W   = 380    # sidebar width
MAIN_X = SB_W + 20

# ── LEFT SIDEBAR ─────────────────────────────────────────────────────────
SB_H = H - MAIN_Y - 20
rbox(20, MAIN_Y, SB_W, MAIN_Y + SB_H, CARD_BG, BORDER, lw=1, r=16)

cy = MAIN_Y + 30

# GROWER MODE badge
pill(40, cy, "GROWER MODE", (220,240,225), GREEN_DARK, 20, 16)
cy += 48

tc(40, cy, "Swipe tappers near", 36, DARK, "lt")
cy += 44
tc(40, cy, "your holding", 36, DARK, "lt")
cy += 52
tc(40, cy, "Right swipe reveals contact details. Left", 22, MUTED, "lt")
cy += 28
tc(40, cy, "swipe keeps browsing.", 22, MUTED, "lt")
cy += 52

# Divider
draw.line([(40, cy),(SB_W-20, cy)], fill=BORDER, width=1)
cy += 28

# District filter
tc(40, cy, "District", 23, MID, "lt")
cy += 32
rbox(40, cy, SB_W-20, cy+52, OFF_WHITE, BORDER, lw=1, r=8)
tc(56, cy+14, "All Kerala", 22, DARK, "lt")
tc(SB_W-44, cy+26, "▾", 20, MUTED, "mm")
cy += 68

# Availability filter
tc(40, cy, "Availability", 23, MID, "lt")
cy += 32
rbox(40, cy, SB_W-20, cy+52, OFF_WHITE, BORDER, lw=1, r=8)
tc(56, cy+14, "Any available tapper", 22, DARK, "lt")
tc(SB_W-44, cy+26, "▾", 20, MUTED, "mm")
cy += 68

# Experience slider
tc(40, cy, "Minimum experience: 0 years", 23, MID, "lt")
cy += 32
# Track
draw.rounded_rectangle([(40, cy+10),(SB_W-20, cy+22)], radius=6, fill=(220,215,205))
# Filled portion (left side, 0 yrs selected = all the way left)
draw.ellipse([(36, cy+4),(60, cy+28)], fill=GREEN_DARK)
cy += 52

draw.line([(40, cy),(SB_W-20, cy)], fill=BORDER, width=1)
cy += 24

# Tapper count
tc(40, cy, "14 tappers found near Kottayam", 22, GREEN_DARK, "lt")

# ── RIGHT — DARK TAPPER CARD AREA ────────────────────────────────────────
DARK_X  = MAIN_X + 20
DARK_Y  = MAIN_Y
DARK_W  = W - DARK_X - 20
DARK_H  = H - DARK_Y - 20

draw.rounded_rectangle([(DARK_X, DARK_Y),(DARK_X+DARK_W, DARK_Y+DARK_H)],
    radius=20, fill=BG_DARK)

# Card centred in dark area
CARD_W, CARD_H = 480, 660
CARD_X = DARK_X + (DARK_W - CARD_W) // 2
CARD_Y = DARK_Y + (DARK_H - CARD_H) // 2 - 40

# Card shadow
draw.rounded_rectangle([(CARD_X+12, CARD_Y+12),(CARD_X+CARD_W+12, CARD_Y+CARD_H+12)],
    radius=24, fill=(0,0,0))

# Card base
draw.rounded_rectangle([(CARD_X, CARD_Y),(CARD_X+CARD_W, CARD_Y+CARD_H)],
    radius=24, fill=CARD_BG)

# ── Card gradient header (green) ──────────────────────────────────────────
HDR_H = 200
# Draw gradient header by layering lines
for i in range(HDR_H):
    t = i / HDR_H
    r = int(TEAL_GRAD1[0] + t*(TEAL_GRAD2[0]-TEAL_GRAD1[0]))
    g = int(TEAL_GRAD1[1] + t*(TEAL_GRAD2[1]-TEAL_GRAD1[1]))
    b = int(TEAL_GRAD1[2] + t*(TEAL_GRAD2[2]-TEAL_GRAD1[2]))
    draw.line([(CARD_X, CARD_Y+i),(CARD_X+CARD_W, CARD_Y+i)], fill=(r,g,b))
# Clip header corners (redraw card outline over gradient)
# Top-left and top-right corner masks
draw.rounded_rectangle([(CARD_X, CARD_Y),(CARD_X+CARD_W, CARD_Y+HDR_H+24)],
    radius=24, fill=None, outline=CARD_BG, width=0)

# "Available now" badge on header
rbox(CARD_X+24, CARD_Y+24, CARD_X+192, CARD_Y+58, AVAILABLE, None, r=20)
tc(CARD_X+108, CARD_Y+41, "Available now", 22, WHITE, "mm")

# Profile letter circle
CIR_CX = CARD_X + CARD_W//2
CIR_CY = CARD_Y + HDR_H - 20
CIR_R  = 56
draw.ellipse([(CIR_CX-CIR_R, CIR_CY-CIR_R),(CIR_CX+CIR_R, CIR_CY+CIR_R)],
    fill=(255,255,255,40), outline=None)
draw.ellipse([(CIR_CX-CIR_R+4, CIR_CY-CIR_R+4),(CIR_CX+CIR_R-4, CIR_CY+CIR_R-4)],
    fill=(60,130,90))
tc(CIR_CX, CIR_CY, "J", 52, WHITE, "mm")

# "TAPPER PROFILE" label
tc(CARD_X+CARD_W//2, CARD_Y+HDR_H+32, "TAPPER PROFILE", 20, (150,170,155), "mm")

# ── Card body ─────────────────────────────────────────────────────────────
BY = CARD_Y + HDR_H + 60

# Name + experience badge
f_name = bfont(38)
bb = draw.textbbox((0,0), "Jose Mathew", font=f_name)
nw = bb[2]-bb[0]
name_x = CARD_X + (CARD_W - nw - 100)//2
draw.text((name_x, BY), "Jose Mathew", font=f_name, fill=DARK)
rbox(name_x+nw+14, BY+2, name_x+nw+100, BY+44, AMBER, None, r=10)
tc(name_x+nw+56, BY+23, "22 yrs", 22, DARK, "mm")

BY += 54

# District
tc(CARD_X+CARD_W//2, BY, "Kottayam district", 24, GREEN_DARK, "mm")
BY += 40

# Bio
tc(CARD_X+CARD_W//2, BY, "Reliable early-morning tapper with", 23, MID, "mm")
tc(CARD_X+CARD_W//2, BY+28, "rain-guard experience.", 23, MID, "mm")
BY += 70

# Stats row
draw.line([(CARD_X+30, BY),(CARD_X+CARD_W-30, BY)], fill=BORDER, width=1)
BY += 20

stat_cols = [
    ("TREES/DAY", "460"),
    ("LANGUAGES", "Malayalam,\nEnglish"),
]
sw = (CARD_W - 60) // 2
for i, (lbl, val) in enumerate(stat_cols):
    sx = CARD_X + 30 + i*sw
    if i > 0:
        draw.line([(sx, BY),(sx, BY+90)], fill=BORDER, width=1)
    tc(sx + sw//2, BY+14, lbl, 19, MUTED, "mm")
    if "\n" in val:
        lines = val.split("\n")
        tc(sx + sw//2, BY+44, lines[0], 26, DARK, "mm")
        tc(sx + sw//2, BY+68, lines[1], 26, DARK, "mm")
    else:
        tc(sx + sw//2, BY+50, val, 28, DARK, "mm")

BY += 106

# Tags
TAG_X = CARD_X + 28
tw1 = tag(TAG_X,                   BY, "Conventional")
tw2 = tag(TAG_X + tw1,             BY, "Rain-guard",  (210,240,230), GREEN_DARK)
tw3 = tag(TAG_X + tw1 + tw2,       BY, "5/2 d2",      (240,236,218), (140,100,30))
BY += 52

# "SWIPE RIGHT TO REVEAL CONTACT" bar
rbox(CARD_X+28, BY, CARD_X+CARD_W-28, BY+50, (238,248,242), (120,200,150), lw=1, r=10)
tc(CARD_X+CARD_W//2, BY+25, "SWIPE RIGHT TO REVEAL CONTACT", 20, (50,130,80), "mm")

BY += 66

# ── Swipe action buttons ──────────────────────────────────────────────────
BTN_Y = DARK_Y + DARK_H - 100
BTN_CX = DARK_X + DARK_W//2

# Left (X) button
draw.ellipse([(BTN_CX-180-40, BTN_Y-40),(BTN_CX-180+40, BTN_Y+40)],
    fill=(50,45,42))
tc(BTN_CX-180, BTN_Y, "✕", 32, (200,180,160), "mm")

# Centre WhatsApp button (larger, green)
draw.ellipse([(BTN_CX-52, BTN_Y-52),(BTN_CX+52, BTN_Y+52)], fill=GREEN_DARK)
tc(BTN_CX, BTN_Y, "📞", 36, WHITE, "mm")

# Right (→) button
draw.ellipse([(BTN_CX+180-40, BTN_Y-40),(BTN_CX+180+40, BTN_Y+40)],
    fill=(50,45,42))
tc(BTN_CX+180, BTN_Y, "→", 32, (200,180,160), "mm")

# ── Subtle card stack peek (cards behind) ────────────────────────────────
# Second card edge
draw.rounded_rectangle(
    [(CARD_X-20, CARD_Y+30),(CARD_X-20+CARD_W, CARD_Y+30+CARD_H)],
    radius=24, fill=(40,50,44), outline=None)
# Third card edge
draw.rounded_rectangle(
    [(CARD_X-38, CARD_Y+56),(CARD_X-38+CARD_W, CARD_Y+56+CARD_H)],
    radius=24, fill=(32,40,36), outline=None)

# Redraw main card on top of peek cards
draw.rounded_rectangle([(CARD_X, CARD_Y),(CARD_X+CARD_W, CARD_Y+CARD_H)],
    radius=24, fill=CARD_BG)

# Redraw header gradient
for i in range(HDR_H):
    t = i / HDR_H
    r = int(TEAL_GRAD1[0] + t*(TEAL_GRAD2[0]-TEAL_GRAD1[0]))
    g = int(TEAL_GRAD1[1] + t*(TEAL_GRAD2[1]-TEAL_GRAD1[1]))
    b = int(TEAL_GRAD1[2] + t*(TEAL_GRAD2[2]-TEAL_GRAD1[2]))
    draw.line([(CARD_X, CARD_Y+i),(CARD_X+CARD_W, CARD_Y+i)], fill=(r,g,b))

# Clip gradient to card's rounded top corners using a mask
mask = Image.new("L", (W, H), 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.rounded_rectangle([(CARD_X, CARD_Y),(CARD_X+CARD_W, CARD_Y+HDR_H)],
    radius=24, fill=255)
# Apply by repainting corners in card background colour
corner_mask = Image.new("RGB", (W, H), CARD_BG)
img.paste(corner_mask, mask=Image.eval(mask, lambda x: 255-x))

# Re-render everything on card body over the corner fix
draw2 = ImageDraw.Draw(img)

def tc2(x, y, text, size, fill=DARK, anchor="mm"):
    f = bfont(size)
    bb = draw2.textbbox((0,0), text, font=f)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    if anchor == "mm": draw2.text((x-tw//2, y-th//2), text, font=f, fill=fill)
    elif anchor == "lt": draw2.text((x, y), text, font=f, fill=fill)
    elif anchor == "rt": draw2.text((x-tw, y), text, font=f, fill=fill)
    elif anchor == "lm": draw2.text((x, y-th//2), text, font=f, fill=fill)

# Redraw all card text and elements (since gradient repaint may have covered some)
draw2.rounded_rectangle([(CARD_X, CARD_Y),(CARD_X+CARD_W, CARD_Y+CARD_H)],
    radius=24, outline=BORDER, width=1, fill=None)

rbox2 = lambda x1,y1,x2,y2,fill,outline=None,lw=2,r=12: draw2.rounded_rectangle(
    [(x1,y1),(x2,y2)], radius=r, fill=fill,
    outline=outline, width=lw if outline else 0)

rbox2(CARD_X+24, CARD_Y+24, CARD_X+192, CARD_Y+58, AVAILABLE, r=20)
tc2(CARD_X+108, CARD_Y+41, "Available now", 22, WHITE, "mm")

CIR_CX = CARD_X + CARD_W//2
CIR_CY = CARD_Y + HDR_H - 20
draw2.ellipse([(CIR_CX-CIR_R+4, CIR_CY-CIR_R+4),(CIR_CX+CIR_R-4, CIR_CY+CIR_R-4)],
    fill=(60,130,90))
tc2(CIR_CX, CIR_CY, "J", 52, WHITE, "mm")

tc2(CARD_X+CARD_W//2, CARD_Y+HDR_H+32, "TAPPER PROFILE", 20, (150,170,155), "mm")

BY = CARD_Y + HDR_H + 60
f_name2 = bfont(38)
bb = draw2.textbbox((0,0), "Jose Mathew", font=f_name2)
nw = bb[2]-bb[0]
name_x2 = CARD_X + (CARD_W - nw - 100)//2
draw2.text((name_x2, BY), "Jose Mathew", font=f_name2, fill=DARK)
rbox2(name_x2+nw+14, BY+2, name_x2+nw+100, BY+44, AMBER, r=10)
tc2(name_x2+nw+56, BY+23, "22 yrs", 22, DARK, "mm")
BY += 54
tc2(CARD_X+CARD_W//2, BY, "Kottayam district", 24, GREEN_DARK, "mm")
BY += 40
tc2(CARD_X+CARD_W//2, BY, "Reliable early-morning tapper with", 23, MID, "mm")
tc2(CARD_X+CARD_W//2, BY+28, "rain-guard experience.", 23, MID, "mm")
BY += 70
draw2.line([(CARD_X+30, BY),(CARD_X+CARD_W-30, BY)], fill=BORDER, width=1)
BY += 20
for i, (lbl, val) in enumerate(stat_cols):
    sx2 = CARD_X + 30 + i*sw
    if i > 0:
        draw2.line([(sx2, BY),(sx2, BY+90)], fill=BORDER, width=1)
    tc2(sx2 + sw//2, BY+14, lbl, 19, MUTED, "mm")
    if "\n" in val:
        lines = val.split("\n")
        tc2(sx2 + sw//2, BY+44, lines[0], 26, DARK, "mm")
        tc2(sx2 + sw//2, BY+68, lines[1], 26, DARK, "mm")
    else:
        tc2(sx2 + sw//2, BY+50, val, 28, DARK, "mm")
BY += 106

def tag2(x, y, text, bg=(220,240,228), fg=GREEN_DARK, size=20):
    f = bfont(size)
    bb = draw2.textbbox((0,0), text, font=f)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    px, py = 16, 6
    draw2.rounded_rectangle([(x,y),(x+tw+px*2, y+th+py*2)], radius=30, fill=bg)
    draw2.text((x+px, y+py), text, font=f, fill=fg)
    return tw + px*2 + 8

TAG_X2 = CARD_X + 28
tw1 = tag2(TAG_X2,         BY, "Conventional")
tw2 = tag2(TAG_X2+tw1,     BY, "Rain-guard",  (210,240,230), GREEN_DARK)
tw3 = tag2(TAG_X2+tw1+tw2, BY, "5/2 d2",      (240,236,218), (140,100,30))
BY += 52
rbox2(CARD_X+28, BY, CARD_X+CARD_W-28, BY+50, (238,248,242), (120,200,150), lw=1, r=10)
tc2(CARD_X+CARD_W//2, BY+25, "SWIPE RIGHT TO REVEAL CONTACT", 20, (50,130,80), "mm")

# Redraw swipe buttons
BTN_Y2 = DARK_Y + DARK_H - 100
BTN_CX2 = DARK_X + DARK_W//2
draw2.ellipse([(BTN_CX2-180-40, BTN_Y2-40),(BTN_CX2-180+40, BTN_Y2+40)], fill=(50,45,42))
tc2(BTN_CX2-180, BTN_Y2, "✕", 32, (200,180,160), "mm")
draw2.ellipse([(BTN_CX2-52, BTN_Y2-52),(BTN_CX2+52, BTN_Y2+52)], fill=GREEN_DARK)
tc2(BTN_CX2, BTN_Y2, "📞", 36, WHITE, "mm")
draw2.ellipse([(BTN_CX2+180-40, BTN_Y2-40),(BTN_CX2+180+40, BTN_Y2+40)], fill=(50,45,42))
tc2(BTN_CX2+180, BTN_Y2, "→", 32, (200,180,160), "mm")

out = os.path.join(DOCS, "screen_marketplace.png")
img.save(out, "PNG", optimize=True)
print(f"Saved → {out}  ({W}×{H})")
