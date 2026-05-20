#!/usr/bin/env python3
"""Extract the polygonal AMOS logo from assets/icon.png onto a transparent
background, writing assets/amos-logo-transparent.png.

The source icon has a dark purple-blue gradient background and a polygonal
magenta-to-orange A logo. Background and foreground are cleanly separable
by the R-B channel difference (cool bg = negative, warm logo = positive).

Used to regenerate the inlined watermark badge in
supabase/functions/_shared/watermark.ts — see header of that file for the
full re-bake procedure.
"""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "icon.png"
DST = ROOT / "assets" / "amos-logo-transparent.png"

# Soft threshold on R-B: below LOW = transparent, above HIGH = opaque,
# linear interpolation in between for anti-aliased edges.
THRESH_LOW = 10
THRESH_HIGH = 60


def main() -> None:
    img = Image.open(SRC).convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, _a = px[x, y]
            diff = r - b
            if diff <= THRESH_LOW:
                px[x, y] = (r, g, b, 0)
            elif diff >= THRESH_HIGH:
                px[x, y] = (r, g, b, 255)
            else:
                new_a = int(255 * (diff - THRESH_LOW) / (THRESH_HIGH - THRESH_LOW))
                px[x, y] = (r, g, b, new_a)
    img.save(DST, optimize=True)
    print(f"wrote {DST.relative_to(ROOT)} ({DST.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
