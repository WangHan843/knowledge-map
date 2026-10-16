"""Reproduce exact scanned textbook crops; requires PyMuPDF and Pillow (dev only)."""
from pathlib import Path
import io
import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'frontend/src/assets/textbook'
OUT.mkdir(parents=True, exist_ok=True)
# PDF page number (one based), normalized page rectangle. No diagram redrawing.
CROPS = {
    'fig-3-2': (9, (.035, .294, .478, .416)),
    'fig-3-3': (9, (.625, .317, .995, .450)),
    'friis': (9, (.668, .525, .795, .552)),
    'fig-3-4': (10, (.037, .307, .401, .575)),
    'fig-3-6': (11, (.031, .458, .400, .533)),
}
with pymupdf.open(ROOT / 'source-materials/定位与识别技术教材扫描.pdf') as doc:
    for name, (number, bounds) in CROPS.items():
        page = doc[number - 1]
        w, h = page.rect.width, page.rect.height
        clip = pymupdf.Rect(bounds[0]*w, bounds[1]*h, bounds[2]*w, bounds[3]*h)
        pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), clip=clip, alpha=False)
        im = Image.open(io.BytesIO(pix.tobytes('png')))
        im.save(OUT / f'{name}.webp', lossless=True)
        print(name, im.size)
