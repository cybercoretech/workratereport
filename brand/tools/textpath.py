"""Convert a string to SVG path data using a TTF, so brand SVGs need no font installed."""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

_cache = {}


def _font(path):
    if path not in _cache:
        _cache[path] = TTFont(path)
    return _cache[path]


def text_path(font_path, text, size, x=0.0, y=0.0, tracking=0.0, anchor="start"):
    """Return (path_d, width). y is the baseline. tracking is in em units."""
    f = _font(font_path)
    upm = f["head"].unitsPerEm
    cmap = f.getBestCmap()
    gs = f.getGlyphSet()
    hmtx = f["hmtx"]
    scale = size / upm
    advances = []
    for ch in text:
        g = cmap.get(ord(ch), ".notdef")
        advances.append((g, hmtx[g][0] * scale))
    width = sum(a for _, a in advances) + tracking * size * (len(text) - 1)
    if anchor == "middle":
        x -= width / 2
    elif anchor == "end":
        x -= width
    pen = SVGPathPen(gs)
    cx = x
    for g, adv in advances:
        tp = TransformPen(pen, (scale, 0, 0, -scale, cx, y))
        gs[g].draw(tp)
        cx += adv + tracking * size
    return pen.getCommands(), width


if __name__ == "__main__":
    d, w = text_path(sys.argv[1], sys.argv[2], float(sys.argv[3]))
    print(w)
