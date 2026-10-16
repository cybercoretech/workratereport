"""Make theme-following copies of brand SVGs for inlining in the site.

Fixed brand colours become CSS variables (style="fill:var(--gold)"), so the
inline logo, emblem, badges and ropes recolour with the Cybercore theme picker.
Usage: python3 -I themeable.py <svg-dir> <out-dir>
"""
import os
import re
import sys

SRC, OUT = sys.argv[1], sys.argv[2]
FILES = ["logo-horizontal.svg", "emblem.svg", "divider-ropes.svg", "badge-modern-era.svg",
         "badge-classic-vault.svg", "badge-territory-dna.svg", "badge-me-vs-meltzer.svg"]
VARS = {"#D4A537": "--gold", "#F2D27A": "--gold-hi", "#8C6A1C": "--gold-lo", "#111014": "--ink",
        "#F3EEE3": "--canvas", "#E9E4DA": "--canvas", "#C8102E": "--red", "#1F4E9C": "--blue",
        "#5A5560": "--muted", "#B9B2A6": "--muted", "#3A3640": "--muted"}

os.makedirs(OUT, exist_ok=True)
for name in FILES:
    s = open(os.path.join(SRC, name)).read()
    s = s.replace('id="gold"', 'id="wr-gold"').replace("url(#gold)", "url(#wr-gold)")
    for attr in ("fill", "stroke", "stop-color"):
        s = re.sub(rf'{attr}="(#[0-9A-Fa-f]{{6}})"',
                   lambda m: f'style="{attr}:var({VARS[m.group(1).upper()]})"', s)
    # Inline copies size from CSS, so drop fixed width/height and <title> (the
    # component supplies an accessible name).
    s = re.sub(r' width="\d+" height="\d+"', "", s, count=1)
    s = re.sub(r"<title>.*?</title>", "", s)
    open(os.path.join(OUT, name), "w").write(s)
print("ok", len(FILES))
