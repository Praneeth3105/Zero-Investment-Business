import pymupdf
from pathlib import Path

# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

PDF_PATH = BASE_DIR / "private" / "book.pdf"
OUTPUT_DIR = BASE_DIR / "book-pages"

# Create output folder
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------
# OPEN PDF
# ---------------------------------------------------------

pdf = pymupdf.open(PDF_PATH)

print(f"PDF: {PDF_PATH}")
print(f"Total pages: {len(pdf)}")

# ---------------------------------------------------------
# CONVERT EACH PAGE TO JPG
# ---------------------------------------------------------

for page_number in range(len(pdf)):

    page = pdf[page_number]

    # 2x resolution
    matrix = pymupdf.Matrix(2, 2)

    pix = page.get_pixmap(
        matrix=matrix,
        alpha=False
    )

    filename = OUTPUT_DIR / f"page-{page_number + 1:03d}.jpg"

    pix.save(str(filename))

    print(
        f"Created page {page_number + 1}/{len(pdf)}: "
        f"{filename}"
    )

pdf.close()

print("\nBook conversion completed successfully.")