"""
Build a reference.docx for Pandoc that matches the PDF styling
(white background, mint accent, black text).
"""

import os
import subprocess
import sys
from pathlib import Path

from docx import Document
from docx.shared import Pt, RGBColor

DOCS_DIR = Path(__file__).resolve().parent
REFERENCE = DOCS_DIR / 'reference.docx'
PANDOC = Path(os.environ['LOCALAPPDATA']) / 'Microsoft' / 'WinGet' / 'Packages' / \
    'JohnMacFarlane.Pandoc_Microsoft.Winget.Source_8wekyb3d8bbwe' / \
    'pandoc-3.9.0.2' / 'pandoc.exe'

# Color tokens — same as PDF theme
INK   = RGBColor(0x14, 0x17, 0x1B)   # body / headings
INK_2 = RGBColor(0x2C, 0x33, 0x3D)   # secondary
INK_3 = RGBColor(0x5B, 0x65, 0x73)   # captions
MINT  = RGBColor(0x0C, 0x9E, 0x6A)   # the only accent

# 1. Extract Pandoc's default reference.docx (binary stdout via subprocess).
print('Extracting Pandoc default reference.docx ...')
result = subprocess.run(
    [str(PANDOC), '--print-default-data-file', 'reference.docx'],
    capture_output=True, check=True,
)
REFERENCE.write_bytes(result.stdout)

# 2. Override styles to match the PDF.
print('Customizing styles ...')
doc = Document(REFERENCE)

def set_color(style_name, color, *, size=None, italic=None, bold=None):
    if style_name not in doc.styles:
        return
    style = doc.styles[style_name]
    f = style.font
    f.color.rgb = color
    if size is not None: f.size = Pt(size)
    if italic is not None: f.italic = italic
    if bold is not None: f.bold = bold

# Cover / front matter
set_color('Title',     INK,   size=30, bold=True)
set_color('Subtitle',  MINT,  size=14)
set_color('Author',    INK_3, size=11)
set_color('Date',      INK_3, size=11)

# Headings — black, accent comes from layout (Word adds horizontal rule under H1/H2 by default)
set_color('Heading 1', INK,   size=20, bold=True)
set_color('Heading 2', INK,   size=14, bold=True)
set_color('Heading 3', INK,   size=12, bold=True)
set_color('Heading 4', INK_2, size=11, bold=True)

# Body
set_color('Normal',    INK,   size=10.5)

# Inline emphasis / links
set_color('Hyperlink', MINT)
set_color('Emphasis',  MINT,  italic=True)
set_color('Strong',    INK,   bold=True)

# Code-related — Pandoc emits "Source Code" (block) and "Verbatim Char" (inline)
set_color('Source Code',   INK,   size=9)
set_color('Verbatim Char', INK_2, size=9)

# Quote / blockquote
set_color('Quote',         INK_2, italic=True)
set_color('Block Text',    INK_2)

# TOC
for i in range(1, 6):
    set_color(f'TOC {i}', INK if i == 1 else INK_2, size=10.5 if i == 1 else 10)
set_color('TOC Heading', INK, size=16, bold=True)

doc.save(REFERENCE)
print(f'Saved: {REFERENCE}  ({REFERENCE.stat().st_size:,} bytes)')
