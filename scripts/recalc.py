"""
recalc.py — validates an openpyxl workbook and reports any issues.
Usage: python scripts/recalc.py <path_to_xlsx>
"""
import sys
from openpyxl import load_workbook

def recalc(path: str) -> None:
    try:
        wb = load_workbook(path, data_only=False)
    except Exception as e:
        print(f"ERROR: cannot open {path}: {e}")
        sys.exit(1)

    print(f"OK  Opened: {path}")
    print(f"    Sheets: {wb.sheetnames}")

    errors = []
    for name in wb.sheetnames:
        ws = wb[name]
        print(f"    [{name}]  dims={ws.dimensions}  rtl={ws.sheet_view.rightToLeft}")
        for row in ws.iter_rows():
            for cell in row:
                if isinstance(cell.value, str) and cell.value.startswith("="):
                    # basic syntax check: must have matching parens
                    formula = cell.value
                    if formula.count("(") != formula.count(")"):
                        errors.append(f"  {name}!{cell.coordinate}: unbalanced parens in {formula!r}")

    if errors:
        print("\nFORMULA ERRORS:")
        for e in errors:
            print(e)
        sys.exit(1)
    else:
        print("\nAll formulas OK — workbook is valid.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/recalc.py <path_to_xlsx>")
        sys.exit(1)
    recalc(sys.argv[1])
