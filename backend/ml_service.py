from pathlib import Path
import subprocess
import json


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

ML_DIR = PROJECT_DIR / "ml-modell"

ML_PYTHON = ML_DIR / ".venv312" / "Scripts" / "python.exe"
PREDICT_SCRIPT = ML_DIR / "predict.py"


# =========================================================
# PREDICT STOCK
# =========================================================

def predict_stock(symbol: str):

    if not symbol:
        raise ValueError("Stock symbol is required.")

    yahoo_symbol = symbol.upper().strip()

    # Add NSE suffix if user sends RELIANCE instead of RELIANCE.NS
    if "." not in yahoo_symbol:
        yahoo_symbol = f"{yahoo_symbol}.NS"

    # =====================================================
    # CHECK ML ENVIRONMENT
    # =====================================================

    if not ML_PYTHON.exists():

        raise FileNotFoundError(
            f"ML Python environment not found:\n{ML_PYTHON}"
        )

    # =====================================================
    # CHECK PREDICTION SCRIPT
    # =====================================================

    if not PREDICT_SCRIPT.exists():

        raise FileNotFoundError(
            f"Prediction script not found:\n{PREDICT_SCRIPT}"
        )

    # =====================================================
    # RUN ML PREDICTION
    # =====================================================

    command = [
        str(ML_PYTHON),
        str(PREDICT_SCRIPT),
        yahoo_symbol,
    ]

    try:

        result = subprocess.run(
            command,
            cwd=str(ML_DIR),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )

    except Exception as error:

        raise RuntimeError(
            f"Failed to start ML prediction process: {error}"
        )

    # =====================================================
    # HANDLE ML ERROR
    # =====================================================

    if result.returncode != 0:

        error_message = (
            result.stderr.strip()
            or result.stdout.strip()
            or "LSTM prediction failed."
        )

        raise RuntimeError(
            f"ML prediction failed:\n{error_message}"
        )

    # =====================================================
    # READ JSON RESULT
    # =====================================================

    output = result.stdout.strip()

    if not output:

        raise RuntimeError(
            "ML prediction returned empty output."
        )

    # predict.py may print other information.
    # Therefore search JSON from the last lines.

    lines = output.splitlines()

    for line in reversed(lines):

        line = line.strip()

        if (
            line.startswith("{")
            and line.endswith("}")
        ):

            try:

                prediction = json.loads(line)

                if not isinstance(
                    prediction,
                    dict
                ):

                    raise RuntimeError(
                        "Invalid prediction format."
                    )

                return prediction

            except json.JSONDecodeError:

                continue

    # =====================================================
    # NO VALID JSON
    # =====================================================

    raise RuntimeError(
        "Prediction script did not return valid JSON.\n"
        f"Output:\n{output}"
    )