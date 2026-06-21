from PIL import Image, ImageDraw, ImageFont
import math, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs", "logo.png")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

W, H = 800, 240
BG = (250, 246, 235)
GREEN = (38, 90, 56)
AMBER = (214, 133, 30)
RAIN  = (80, 140, 200)
DARK  = (30, 22, 10)
MID   = (100, 80, 50)

img  = Image.new("RGBA", (W, H), BG + (255,))
draw = ImageDraw.Draw(img)

# Raindrop
cx, cy, R = 110, H // 2, 62
pts = []
for deg in range(361):
    r = math.radians(deg)
    sq = 1 - 0.55 * max(0, math.cos(r))
    pts.append((cx + R*0.75*math.sin(r)*sq,
                 cy + R*(0.5 - 0.9*math.cos(r))*(1 + 0.18*math.cos(2*r))))
draw.polygon([(x+4,y+4) for x,y in pts], fill=(0,0,0,40))
draw.polygon(pts, fill=RAIN)
inner = []
for deg in range(361):
    r = math.radians(deg)
    sq = 1 - 0.55 * max(0, math.cos(r))
    inner.append((cx-8 + R*0.30*math.sin(r)*sq,
                   cy-10 + R*0.28*(0.5 - 0.9*math.cos(r))*(1 + 0.18*math.cos(2*r))))
draw.polygon(inner, fill=(160,200,240,180))
# Leaf veins
for pts2 in [((cx,cy-28),(cx,cy+28)),((cx,cy),(cx+18,cy-12)),
             ((cx,cy),(cx-18,cy-12)),((cx,cy+14),(cx+14,cy+2)),((cx,cy+14),(cx-14,cy+2))]:
    draw.line(pts2, fill=GREEN, width=3)
draw.arc([cx-R-6,cy-R-6,cx+R+6,cy+R+6], 20, 160, fill=AMBER, width=5)

# Fonts
def bfont(size):
    for p in ["/System/Library/Fonts/Helvetica.ttc","/System/Library/Fonts/Arial.ttf"]:
        try: return ImageFont.truetype(p, size)
        except: pass
    return ImageFont.load_default()

fb, fm, fs = bfont(72), bfont(36), bfont(22)
tx = 200
draw.text((tx, 36), "mazha", font=fb, fill=GREEN)
bb = draw.textbbox((tx,36), "mazha", font=fb)
draw.text((bb[2]+10, 36), "Tap", font=fb, fill=AMBER)
bb2 = draw.textbbox((bb[2]+10,36), "Tap", font=fb)
draw.text((bb2[2]+8, 46), "\u2014", font=fm, fill=DARK)
draw.text((tx, 140), "Rain-tapping decisions for Kerala rubber growers", font=fs, fill=MID)
draw.rectangle([(0, H-8),(W, H)], fill=AMBER)

img.convert("RGB").save(OUT, "PNG")
print("Saved ->", OUT)
