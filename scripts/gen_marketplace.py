"""
Generate mazha Tap — Tapper Marketplace screenshot mockup.
Clean full-layout: hero + role selector | sidebar | dark card area.
No masking tricks — everything drawn in order on one canvas.
"""
from PIL import Image, ImageDraw, ImageFont
import os

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs")
os.makedirs(DOCS, exist_ok=True)

# ── Canvas ─────────────────────────────────────────────────────────────────
W, H = 1880, 1060

# ── Palette ────────────────────────────────────────────────────────────────
CREAM      = (252, 246, 228)
CARD_WHITE = (255, 255, 255)
DARK_AREA  = ( 22,  28,  24)
GREEN_DARK = ( 22,  72,  48)
GREEN_MID  = ( 38, 100,  60)
GREEN_PILL = ( 30,  85,  55)
GREEN_L    = (210, 240, 218)
GREEN_TAG  = (190, 235, 208)
AMBER      = (240, 180,  30)
AMBER_L    = (255, 243, 180)
AVAILABLE  = ( 30, 160, 100)
TEAL1      = ( 28,  90,  68)
TEAL2      = ( 52, 130,  88)
WHITE      = (255, 255, 255)
DARK       = ( 18,  14,   8)
MID        = ( 80,  65,  45)
MUTED      = (140, 120,  90)
BORDER     = (215, 205, 182)
SIDEBAR_BG = (248, 244, 234)
PHONE_DARK = ( 42,  38,  34)

# ── Fonts ──────────────────────────────────────────────────────────────────
def F(size):
    for p in ["/System/Library/Fonts/Helvetica.ttc",
              "/System/Library/Fonts/Arial.ttf"]:
        try: return ImageFont.truetype(p, size)
        except: pass
    return ImageFont.load_default()

# ── Drawing helpers ────────────────────────────────────────────────────────
img  = Image.new("RGB", (W, H), CREAM)
draw = ImageDraw.Draw(img)

def rect(x1, y1, x2, y2, fill, outline=None, lw=1, r=0):
    if r:
        draw.rounded_rectangle([(x1,y1),(x2,y2)], radius=r,
            fill=fill, outline=outline, width=lw if outline else 0)
    else:
        draw.rectangle([(x1,y1),(x2,y2)], fill=fill,
            outline=outline, width=lw if outline else 0)

def t(x, y, text, size, fill=DARK, anchor="lt"):
    f = F(size)
    bb = draw.textbbox((0,0), text, font=f)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    if   anchor == "mm": draw.text((x-tw//2, y-th//2), text, font=f, fill=fill)
    elif anchor == "lt": draw.text((x, y),              text, font=f, fill=fill)
    elif anchor == "rt": draw.text((x-tw, y),            text, font=f, fill=fill)
    elif anchor == "ct": draw.text((x-tw//2, y),         text, font=f, fill=fill)

def pill(x, y, text, bg, fg=WHITE, size=22, r=18):
    f = F(size)
    bb = draw.textbbox((0,0), text, font=f)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    px, py = 18, 7
    draw.rounded_rectangle([(x,y),(x+tw+px*2, y+th+py*2)], radius=r, fill=bg)
    draw.text((x+px, y+py), text, font=f, fill=fg)
    return tw + px*2

def tag(x, y, text, bg=GREEN_TAG, fg=GREEN_DARK, size=20):
    f = F(size)
    bb = draw.textbbox((0,0), text, font=f)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    px, py = 14, 6
    draw.rounded_rectangle([(x,y),(x+tw+px*2, y+th+py*2)], radius=20, fill=bg)
    draw.text((x+px, y+py), text, font=f, fill=fg)
    return tw + px*2 + 8

def hline(x1, x2, y, c=BORDER, lw=1):
    draw.line([(x1,y),(x2,y)], fill=c, width=lw)

def vline(x, y1, y2, c=BORDER, lw=1):
    draw.line([(x,y1),(x,y2)], fill=c, width=lw)

# ── Warm gradient background ───────────────────────────────────────────────
for y in range(H):
    t_val = y / H
    draw.line([(0,y),(W,y)], fill=(
        int(252 - t_val*12),
        int(246 - t_val*10),
        int(228 - t_val*8)))

# ══════════════════════════════════════════════════════════════════════════
# HERO BAND (top, full width)
# ══════════════════════════════════════════════════════════════════════════
HERO_H = 210
rect(0, 0, W, HERO_H, (250,244,224))
hline(0, W, HERO_H, BORDER, 2)

# Left: badge + headline + tagline
pill(68, 34, "✦  TAPPER MARKETPLACE", GREEN_PILL, WHITE, 22, 22)

t(68, 80,  "mazha Tap connects rubber growers", 46, DARK)
t(68, 134, "and skilled tappers.", 46, DARK)
t(68, 186, "Swipe through trusted Kerala tapper profiles, match instantly, and move the conversation to call or WhatsApp.", 22, MUTED)

# Right: role selector card
RX, RY, RW, RH = W-480, 20, 450, 182
# drop shadow
rect(RX+5, RY+5, RX+RW+5, RY+RH+5, (210,200,178), r=14)
rect(RX, RY, RX+RW, RY+RH, CARD_WHITE, BORDER, lw=1, r=14)

# Row 1 — active (amber bg)
rect(RX+10, RY+10, RX+RW-10, RY+64, AMBER, r=10)
t(RX+28, RY+22, "I'm a Grower",      26, DARK)
t(RX+28, RY+46, "Find skilled tappers", 20, (90,65,15))
# person icon
draw.ellipse([(RX+RW-58, RY+22),(RX+RW-34, RY+46)], outline=DARK, width=2)
draw.arc(    [(RX+RW-66, RY+36),(RX+RW-26, RY+58)], 200, 340, fill=DARK, width=2)

# divider
hline(RX+16, RX+RW-16, RY+72, BORDER)
# Row 2
t(RX+28, RY+82, "I'm a Tapper",       26, DARK)
t(RX+28, RY+104,"Create your work card", 20, MUTED)

# divider
hline(RX+16, RX+RW-16, RY+122, BORDER)
# Row 3
t(RX+28, RY+132,"Rain Decision",      26, DARK)
t(RX+28, RY+154,"Phase 1 tool",       20, MUTED)

# ══════════════════════════════════════════════════════════════════════════
# MAIN CONTENT AREA
# ══════════════════════════════════════════════════════════════════════════
CONTENT_Y = HERO_H + 10
SB_X, SB_W = 20, 340
DARK_X      = SB_X + SB_W + 16
DARK_W      = W - DARK_X - 20
CONTENT_H   = H - CONTENT_Y - 20

# ── LEFT SIDEBAR ──────────────────────────────────────────────────────────
rect(SB_X, CONTENT_Y, SB_X+SB_W, CONTENT_Y+CONTENT_H, CARD_WHITE, BORDER, lw=1, r=16)

cy = CONTENT_Y + 28

pill(SB_X+20, cy, "GROWER MODE", (210,238,220), GREEN_DARK, 20, 14)
cy += 46

t(SB_X+20, cy, "Swipe tappers near", 32, DARK)
cy += 40
t(SB_X+20, cy, "your holding", 32, DARK)
cy += 46
t(SB_X+20, cy, "Right swipe reveals contact details.", 20, MUTED)
cy += 26
t(SB_X+20, cy, "Left swipe keeps browsing.", 20, MUTED)
cy += 42

hline(SB_X+20, SB_X+SB_W-20, cy, BORDER)
cy += 24

# District
t(SB_X+20, cy, "District", 22, MID)
cy += 28
rect(SB_X+20, cy, SB_X+SB_W-20, cy+44, (246,242,232), BORDER, lw=1, r=8)
t(SB_X+36, cy+12, "All Kerala", 21, DARK)
t(SB_X+SB_W-38, cy+22, "▾", 18, MUTED, "mm")
cy += 56

# Availability
t(SB_X+20, cy, "Availability", 22, MID)
cy += 28
rect(SB_X+20, cy, SB_X+SB_W-20, cy+44, (246,242,232), BORDER, lw=1, r=8)
t(SB_X+36, cy+12, "Any available tapper", 21, DARK)
t(SB_X+SB_W-38, cy+22, "▾", 18, MUTED, "mm")
cy += 56

# Experience slider
t(SB_X+20, cy, "Minimum experience: 0 years", 22, MID)
cy += 30
# track
rect(SB_X+20, cy+8, SB_X+SB_W-20, cy+20, (218,210,194), r=6)
# thumb
draw.ellipse([(SB_X+16, cy+2),(SB_X+38, cy+26)], fill=GREEN_DARK)
cy += 46

hline(SB_X+20, SB_X+SB_W-20, cy, BORDER)
cy += 18

t(SB_X+20, cy, "14 tappers near Kottayam", 21, GREEN_DARK)

# ── DARK CARD AREA ─────────────────────────────────────────────────────────
rect(DARK_X, CONTENT_Y, DARK_X+DARK_W, CONTENT_Y+CONTENT_H,
     DARK_AREA, r=16)

# ── Card stack (cards peeking behind) ────────────────────────────────────
CARD_W, CARD_H = 440, 600
CARD_CX = DARK_X + DARK_W // 2
CARD_CY = CONTENT_Y + CONTENT_H // 2 - 20
CX1 = CARD_CX - CARD_W // 2
CY1 = CARD_CY - CARD_H // 2

# Third card (furthest back)
rect(CX1-32, CY1+38, CX1-32+CARD_W, CY1+38+CARD_H, (30,40,34), r=20)
# Second card
rect(CX1-16, CY1+20, CX1-16+CARD_W, CY1+20+CARD_H, (44,56,48), r=20)

# ── Main tapper card ──────────────────────────────────────────────────────
CX = CX1; CY = CY1

# Card shadow
rect(CX+8, CY+8, CX+CARD_W+8, CY+CARD_H+8, (12,18,14), r=22)

# Card white body
rect(CX, CY, CX+CARD_W, CY+CARD_H, CARD_WHITE, r=22)

# Gradient header — draw as a separate image then paste, clipped to card top
HDR_H = 180
hdr = Image.new("RGB", (CARD_W, HDR_H), TEAL1)
hdr_draw = ImageDraw.Draw(hdr)
for i in range(HDR_H):
    frac = i / HDR_H
    r_ = int(TEAL1[0] + frac*(TEAL2[0]-TEAL1[0]))
    g_ = int(TEAL1[1] + frac*(TEAL2[1]-TEAL1[1]))
    b_ = int(TEAL1[2] + frac*(TEAL2[2]-TEAL1[2]))
    hdr_draw.line([(0,i),(CARD_W,i)], fill=(r_,g_,b_))

# Mask to clip top-round corners of header
hdr_mask = Image.new("L", (CARD_W, HDR_H), 0)
hdr_mask_draw = ImageDraw.Draw(hdr_mask)
hdr_mask_draw.rounded_rectangle([(0,0),(CARD_W-1, HDR_H+22)], radius=22, fill=255)
img.paste(hdr, (CX, CY), hdr_mask)

# "Available now" badge on header
rect(CX+22, CY+20, CX+22+154, CY+20+36, AVAILABLE, r=18)
t(CX+22+14, CY+20+8, "Available now", 20, WHITE)

# Avatar circle
AX, AY, AR = CX + CARD_W//2, CY + HDR_H - 14, 48
draw.ellipse([(AX-AR-3, AY-AR-3),(AX+AR+3, AY+AR+3)], fill=CARD_WHITE)
draw.ellipse([(AX-AR, AY-AR),(AX+AR, AY+AR)], fill=(52, 122, 82))
t(AX, AY, "J", 46, WHITE, "mm")

# Tapper profile label
t(CX+CARD_W//2, CY+HDR_H+26, "TAPPER PROFILE", 18, (150,170,155), "ct")

# Name + experience badge
BY = CY + HDR_H + 56
f38 = F(36)
bb = draw.textbbox((0,0), "Jose Mathew", font=f38)
nw = bb[2]-bb[0]
name_x = CX + (CARD_W - nw - 90) // 2
draw.text((name_x, BY), "Jose Mathew", font=f38, fill=DARK)
rect(name_x+nw+10, BY+2, name_x+nw+90, BY+40, AMBER, r=10)
t(name_x+nw+50, BY+21, "22 yrs", 20, DARK, "mm")
BY += 50

t(CX+CARD_W//2, BY, "Kottayam district", 22, GREEN_DARK, "ct")
BY += 34

t(CX+CARD_W//2, BY,    "Reliable early-morning tapper with", 21, MID, "ct")
t(CX+CARD_W//2, BY+26, "rain-guard experience.", 21, MID, "ct")
BY += 62

# Stats divider
hline(CX+24, CX+CARD_W-24, BY, BORDER)
BY += 16

# Stats columns
COL_W = (CARD_W - 48) // 2
for i, (lbl, val) in enumerate([("TREES/DAY", "460"), ("LANGUAGES", "Malayalam, English")]):
    sx = CX + 24 + i * COL_W
    if i > 0:
        vline(sx, BY, BY+80, BORDER)
    t(sx + COL_W//2, BY+10, lbl, 18, MUTED, "ct")
    if i == 1:
        # wrap
        t(sx + COL_W//2, BY+36, "Malayalam,", 22, DARK, "ct")
        t(sx + COL_W//2, BY+60, "English",    22, DARK, "ct")
    else:
        t(sx + COL_W//2, BY+44, val, 26, DARK, "ct")

BY += 90

# Tags
TX = CX + 24
tw1 = tag(TX,       BY, "Conventional")
tw2 = tag(TX+tw1,   BY, "Rain-guard",  (200,238,218), GREEN_DARK)
tw3 = tag(TX+tw1+tw2, BY, "5/2 d2",   (245,235,200), (130,95,25))
BY += 48

# Swipe reveal bar
rect(CX+20, BY, CX+CARD_W-20, BY+44, (232,248,238), (100,190,140), lw=1, r=10)
t(CX+CARD_W//2, BY+22, "SWIPE RIGHT TO REVEAL CONTACT", 19, (40,120,70), "mm")

# ── Swipe action buttons ──────────────────────────────────────────────────
BTN_Y  = CONTENT_Y + CONTENT_H - 68
BTN_CX = DARK_X + DARK_W // 2

# X button
draw.ellipse([(BTN_CX-174-36, BTN_Y-36),(BTN_CX-174+36, BTN_Y+36)], fill=PHONE_DARK)
t(BTN_CX-174, BTN_Y, "✕", 28, (200,175,150), "mm")

# WhatsApp/call button (larger green)
draw.ellipse([(BTN_CX-50, BTN_Y-50),(BTN_CX+50, BTN_Y+50)], fill=GREEN_DARK)
t(BTN_CX, BTN_Y, "📞", 34, WHITE, "mm")

# Arrow button
draw.ellipse([(BTN_CX+174-36, BTN_Y-36),(BTN_CX+174+36, BTN_Y+36)], fill=PHONE_DARK)
t(BTN_CX+174, BTN_Y, "→", 28, (200,175,150), "mm")

# ── Save ──────────────────────────────────────────────────────────────────
out = os.path.join(DOCS, "screen_marketplace.png")
img.save(out, "PNG", optimize=True)
print(f"Saved → {out}  ({W}×{H})")
