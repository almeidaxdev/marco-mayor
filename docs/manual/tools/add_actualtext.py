"""Adds replacement text (/ActualText, ISO 32000-1 §14.9.4) to the display type of the manual PDF.

Why: Chrome/Edge (Skia) draw the large, heavy and tightly tracked titles of the manual with word gaps of
about 0.13–0.19 em. Geometric text extractors — PDFium (Ctrl+F and copy/paste in Chrome and Edge) and
Poppler's `pdftotext -raw` — only recognise a word break above roughly 0.17–0.2 em, so they glued the
words together ("Nestemanual") even though the space characters exist in the file. Widening the gaps
would change the approved layout, so instead each title's text objects are wrapped in a marked-content
/Span carrying the exact string. Drawing operators are left untouched: the pages render identically.

Usage (after printing the HTML to PDF):
    python docs/manual/tools/add_actualtext.py input.pdf output.pdf
Requires PyMuPDF (`pip install pymupdf`).
"""
import re
import sys

import pymupdf

# Font sizes (pt) used only by display type in manual.css: cover brand 12, cover title 46,
# cover "Site Marco Mayor" 20, chapter titles 25, section titles 13.5, rule statement 14.
DISPLAY_SIZES = {12.0, 13.5, 14.0, 20.0, 25.0, 46.0}

NUM = rb"-?\d*\.?\d+(?:[eE][-+]?\d+)?"
TOKEN = re.compile(rb"\((?:\\.|[^\\)])*\)|<[0-9A-Fa-f\s]*>|/[^\s/<>\[\]()]+|" + NUM + rb"|[A-Za-z'\"*]+|\[|\]")


def mat_mul(a, b):
    """Product of two affine matrices (a, b, c, d, e, f): apply `a`, then `b`."""
    return (
        a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3],
        a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3],
        a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5],
    )


def text_objects(content: bytes):
    """Yields (start, end, x, y, balanced) for each BT..ET; (x, y) is its origin in PDF user space."""
    ctm, stack, operands = (1, 0, 0, 1, 0, 0), [], []
    mc_depth, bt_start, bt_depth, tm = 0, None, 0, None
    for m in TOKEN.finditer(content):
        tok = m.group()
        if re.fullmatch(NUM, tok) or tok[:1] in b"(</[]":
            operands.append(tok)
            continue
        if tok == b"q":
            stack.append(ctm)
        elif tok == b"Q":
            ctm = stack.pop() if stack else ctm
        elif tok == b"cm" and len(operands) >= 6:
            ctm = mat_mul(tuple(float(x) for x in operands[-6:]), ctm)
        elif tok in (b"BDC", b"BMC"):
            mc_depth += 1
        elif tok == b"EMC":
            mc_depth -= 1
        elif tok == b"BT":
            bt_start, bt_depth, tm = m.start(), mc_depth, None
        elif tok == b"Tm" and bt_start is not None and tm is None and len(operands) >= 6:
            tm = tuple(float(x) for x in operands[-6:])
        elif tok == b"ET" and bt_start is not None:
            if tm is not None:
                full = mat_mul(tm, ctm)
                yield bt_start, m.end(), full[4], full[5], bt_depth == mc_depth
            bt_start = None
        operands = []


def utf16_hex(text: str) -> bytes:
    return b"<FEFF" + text.encode("utf-16-be").hex().upper().encode() + b">"


def display_lines(page):
    """Display-type lines with more than one word, as (bbox, parts): one text part per style run."""
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            spans = [s for s in line["spans"] if s["text"].strip()]
            if not spans or round(spans[0]["size"], 1) not in DISPLAY_SIZES:
                continue
            if len(spans) == 1:
                parts = [re.sub(r"\s+", " ", spans[0]["text"]).strip()]
            else:
                # e.g. section number "4.1" and title drawn as two objects: extractors already put a
                # space between separate objects, so the parts carry none.
                parts = [re.sub(r"\s+", " ", s["text"]).strip() for s in spans]
            if " " in " ".join(parts):
                yield line["bbox"], parts


def main(src: str, dst: str):
    doc = pymupdf.open(src)
    total = 0
    for page in doc:
        lines = list(display_lines(page))
        if not lines:
            continue
        xrefs = page.get_contents()
        if len(xrefs) != 1:
            raise SystemExit(f"page {page.number + 1}: expected a single content stream")
        content = doc.xref_stream(xrefs[0])
        objects = list(text_objects(content))
        height = page.rect.height

        inserts = []
        for (x0, y0, x1, y1), parts in lines:
            # PyMuPDF boxes are top-left based; content origins are PDF user space (bottom-left).
            hits = [o for o in objects if x0 - 2 <= o[2] <= x1 + 2 and y0 - 2 <= height - o[3] <= y1 + 2]
            if not hits or not all(o[4] for o in hits):
                raise SystemExit(f"page {page.number + 1}: no usable text object for {' '.join(parts)!r}")
            if len(hits) != len(parts):
                raise SystemExit(f"page {page.number + 1}: {len(hits)} objects for {len(parts)} runs in {parts!r}")
            # One /Span per text object: some extractors apply a replacement text to a single object only.
            for (start, end, *_), part in zip(hits, parts):
                inserts.append((start, b"/Span <</ActualText " + utf16_hex(part) + b">> BDC\n"))
                inserts.append((end, b"\nEMC"))
            print(f"  p{page.number + 1}: {' | '.join(parts)}")
            total += 1

        for pos, data in sorted(inserts, key=lambda item: item[0], reverse=True):
            content = content[:pos] + data + content[pos:]
        doc.update_stream(xrefs[0], content)

    doc.save(dst, garbage=0, deflate=True)
    print(f"ActualText added to {total} lines")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: add_actualtext.py input.pdf output.pdf")
    main(sys.argv[1], sys.argv[2])
