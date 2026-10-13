from pathlib import Path
import sys


# =========================================================
# ML MODEL DIRECTORY
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

ML_DIR = PROJECT_ROOT / "ml-modell"

if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))


# =========================================================
# IMPORT MODEL
# =========================================================

from predict import predict_stock


# =========================================================
# PUBLIC SERVICE
# =========================================================

def get_stock_forecast(symbol: str):

    if not symbol:
        raise ValueError(
            "Stock symbol is required."
        )

    symbol = symbol.upper().strip()

    if "." not in symbol:
        symbol = f"{symbol}.NS"

    result = predict_stock(symbol)

    return result