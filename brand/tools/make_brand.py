"""Generate The Workrate Report brand SVGs. Text is outlined to paths (Anton, OFL)."""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from textpath import text_path

FONT = sys.argv[1]
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)

# Palette
GOLD = "#D4A537"
GOLD_HI = "#F2D27A"
GOLD_LO = "#8C6A1C"
INK = "#111014"
RED = "#C8102E"
CANVAS = "#F3EEE3"
BLUE = "#1F4E9C"


def star_points(cx, cy, r_out, r_in=None, n=5, rot=-90):
    r_in = r_in if r_in is not None else r_out * 0.40
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = math.radians(rot + i * 180 / n)
        pts.append(f"{cx + r * math.cos(a):.2f},{cy + r * math.sin(a):.2f}")
    return " ".join(pts)


def star(cx, cy, r, fill, extra=""):
    return f'<polygon points="{star_points(cx, cy, r)}" fill="{fill}" {extra}/>'


def txt(text, size, x, y, fill, tracking=0.0, anchor="start"):
    d, w = text_path(FONT, text, size, x, y, tracking, anchor)
    return f'<path d="{d}" fill="{fill}"/>', w


def save(name, w, h, body, title):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
           f'width="{w}" height="{h}" role="img" aria-label="{title}">'
           f'<title>{title}</title>{body}</svg>\n')
    with open(os.path.join(OUT, name), "w") as fh:
        fh.write(svg)


GRAD = (f'<defs><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="{GOLD_HI}"/><stop offset="0.55" stop-color="{GOLD}"/>'
        f'<stop offset="1" stop-color="{GOLD_LO}"/></linearGradient></defs>')


def plate(cx, cy, s):
    """Championship-belt centre plate: a wide, clipped-corner shield. s = half width."""
    w, h = s, s * 0.78
    c = s * 0.28
    pts = [(-w + c, -h), (w - c, -h), (w, -h + c), (w, h - c * 1.6), (0, h + c * 0.9),
           (-w, h - c * 1.6), (-w, -h + c)]
    p = " ".join(f"{cx + x:.2f},{cy + y:.2f}" for x, y in pts)
    inner = " ".join(f"{cx + x * 0.86:.2f},{cy + y * 0.86:.2f}" for x, y in pts)
    return (f'<polygon points="{p}" fill="url(#gold)" stroke="{GOLD_LO}" stroke-width="{s*0.03:.2f}"/>'
            f'<polygon points="{inner}" fill="{INK}"/>'), h


def emblem(cx, cy, s, with_stars=True):
    body, h = plate(cx, cy, s)
    mono, _ = txt("WR", s * 0.74, cx, cy + s * 0.42, "url(#gold)", 0.02, "middle")
    body += mono
    if with_stars:
        for i in range(5):
            body += star(cx + (i - 2) * s * 0.22, cy - s * 0.50 + abs(i - 2) * s * 0.04,
                         s * 0.085, GOLD_HI)
    return body


# 1. Emblem (square)
save("emblem.svg", 512, 512, GRAD + emblem(256, 236, 220), "The Workrate Report emblem")

# 2. Favicon: simple plate + single star
fav = GRAD + plate(32, 29, 30)[0] + star(32, 30, 15, GOLD_HI)
save("favicon.svg", 64, 64, fav, "The Workrate Report")

# 3. Horizontal logo, light & dark variants
def horizontal(fg, sub):
    b = GRAD + emblem(110, 104, 92)
    t1, w1 = txt("THE", 34, 232, 64, RED, 0.25)
    t2, w2 = txt("WORKRATE REPORT", 86, 228, 150, fg, 0.03)
    b += t1 + t2
    x = 232 + w1 + 18
    for i in range(5):
        b += star(x + i * 30 + 12, 52, 12, GOLD)
    t3, _ = txt("THEN & NOW  ·  MATCH RATINGS SINCE 1980", 22, 232, 192, sub, 0.12)
    b += t3
    return b, int(228 + w2 + 30)

body, W = horizontal(INK, "#5A5560")
save("logo-horizontal.svg", W, 220, body, "The Workrate Report")
body, W = horizontal(CANVAS, "#B9B2A6")
save("logo-horizontal-dark.svg", W, 220, f'<rect width="{W}" height="220" fill="{INK}"/>' + body,
     "The Workrate Report")

# 4. Rating stars: full, ¾, ½, ¼, empty (24x24, gold on track)
for name, frac in [("full", 1), ("three-quarter", .75), ("half", .5), ("quarter", .25), ("empty", 0)]:
    pts = star_points(12, 12.6, 11.5, 4.8)
    b = (f'<defs><clipPath id="c"><rect width="{4 + 16 * frac:.2f}" height="24"/></clipPath></defs>'
         f'<polygon points="{pts}" fill="#3A3640" opacity="0.35"/>'
         f'<polygon points="{pts}" fill="{GOLD}" clip-path="url(#c)"/>')
    if frac in (0, 1):
        b = b.replace(' clip-path="url(#c)"', "") if frac == 1 else b.split("<polygon")[0] + \
            f'<polygon points="{pts}" fill="none" stroke="{GOLD}" stroke-width="1.4"/>'
    save(f"star-{name}.svg", 24, 24, b, f"{name} star")

# DUD + negative stamps
def stamp(name, label, color, w=120, with_star=False):
    gap = 30 if with_star else 0
    t, tw = txt(label, 30, 0, 0, color, 0.08)
    x0 = (w - tw - gap) / 2
    t, _ = txt(label, 30, x0, 41, color, 0.08)
    if with_star:
        t += star(x0 + tw + 18, 28, 13, color)
    b = (f'<rect x="9" y="6" width="{w-18}" height="42" rx="6" fill="none" stroke="{color}" '
         f'stroke-width="4" transform="rotate(-4 {w/2} 27)"/>'
         f'<g transform="rotate(-4 {w/2} 27)">{t}</g>')
    save(name, w, 54, b, label + (" star" if with_star else ""))

stamp("rating-dud.svg", "DUD", RED)
stamp("rating-negative.svg", "MINUS", RED, 160, with_star=True)

# 5. Section badges
def badge(name, label, bg, fg, icon):
    t, w = txt(label, 26, 0, 0, fg, 0.10)
    W = int(w + 86)
    t, _ = txt(label, 26, 62, 39, fg, 0.10)
    b = (f'<rect width="{W}" height="56" rx="28" fill="{bg}"/>'
         f'<circle cx="30" cy="28" r="20" fill="{fg}" opacity="0.15"/>{icon}{t}')
    save(name, W, 56, b, label.title())

badge("badge-modern-era.svg", "MODERN ERA", RED, CANVAS, star(30, 29, 13, CANVAS))
badge("badge-classic-vault.svg", "CLASSIC VAULT", INK, GOLD,
      f'<rect x="19" y="18" width="22" height="18" rx="2" fill="none" stroke="{GOLD}" stroke-width="3"/>'
      f'<circle cx="26" cy="27" r="3" fill="{GOLD}"/><circle cx="34" cy="27" r="3" fill="{GOLD}"/>')
badge("badge-territory-dna.svg", "TERRITORY DNA", BLUE, CANVAS,
      f'<path d="M22 14 C38 22 22 34 38 42 M38 14 C22 22 38 34 22 42" stroke="{CANVAS}" '
      f'stroke-width="3" fill="none"/>')
badge("badge-me-vs-meltzer.svg", "ME VS. MELTZER", GOLD, INK,
      f'<path d="M18 28 h24 M24 20 l-6 8 6 8 M36 20 l6 8 -6 8" stroke="{INK}" stroke-width="3" '
      f'fill="none" stroke-linecap="round"/>')

# 6. Ring-rope divider (red / white / blue ropes, turnbuckle pads)
W = 1200
rope = ""
for i, c in enumerate([RED, "#E9E4DA", BLUE]):
    y = 10 + i * 14
    rope += f'<rect x="28" y="{y}" width="{W-56}" height="6" rx="3" fill="{c}"/>'
    rope += f'<rect x="4" y="{y-3}" width="26" height="12" rx="3" fill="{INK}"/>'
    rope += f'<rect x="{W-30}" y="{y-3}" width="26" height="12" rx="3" fill="{INK}"/>'
save("divider-ropes.svg", W, 52, rope, "Ring ropes divider")

# 7. Social / Open Graph card 1200x630
og = GRAD + f'<rect width="1200" height="630" fill="{INK}"/>'
og += f'<rect x="0" y="0" width="1200" height="630" fill="url(#spot)"/>'
og = og.replace("</defs>", f'<radialGradient id="spot" cx="0.5" cy="0" r="0.9">'
                f'<stop offset="0" stop-color="#3B2F14" stop-opacity="0.9"/>'
                f'<stop offset="1" stop-color="{INK}" stop-opacity="0"/></radialGradient></defs>')
og += emblem(600, 210, 150)
t, _ = txt("THE WORKRATE REPORT", 92, 600, 470, CANVAS, 0.03, "middle")
og += t
t, _ = txt("MODERN CLASSICS  ·  NWA / WCW VAULT  ·  RATED BY A FAN SINCE 1980", 26, 600, 530,
           GOLD, 0.10, "middle")
og += t
for i, c in enumerate([RED, "#E9E4DA", BLUE]):
    og += f'<rect x="0" y="{580 + i*14}" width="1200" height="7" fill="{c}"/>'
save("og-card.svg", 1200, 630, og, "The Workrate Report")

print("ok", sorted(os.listdir(OUT)))
