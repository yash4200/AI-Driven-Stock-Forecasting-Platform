import os
import json
import pandas as pd


# =========================================================
# PATH
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODELS_DIR = os.path.join(
    BASE_DIR,
    "models"
)

RF_METRICS = os.path.join(
    MODELS_DIR,
    "rf_backtest_metrics.json"
)

LSTM_METRICS = os.path.join(
    MODELS_DIR,
    "lstm_backtest_metrics.json"
)

OUTPUT_CSV = os.path.join(
    MODELS_DIR,
    "model_comparison.csv"
)


# =========================================================
# LOAD
# =========================================================

with open(
    RF_METRICS,
    "r"
) as file:

    rf = json.load(file)


with open(
    LSTM_METRICS,
    "r"
) as file:

    lstm = json.load(file)


# =========================================================
# COMPARISON
# =========================================================

comparison = pd.DataFrame(
    [
        {
            "Metric": "MAE",
            "Random Forest": rf["mae"],
            "LSTM": lstm["mae"],
        },
        {
            "Metric": "RMSE",
            "Random Forest": rf["rmse"],
            "LSTM": lstm["rmse"],
        },
        {
            "Metric": "MAPE (%)",
            "Random Forest": rf["mape"],
            "LSTM": lstm["mape"],
        },
        {
            "Metric": "Directional Accuracy (%)",
            "Random Forest": rf[
                "directional_accuracy"
            ],
            "LSTM": lstm[
                "directional_accuracy"
            ],
        },
        {
            "Metric": "Market Return (%)",
            "Random Forest": rf[
                "market_return_percent"
            ],
            "LSTM": lstm[
                "market_return_percent"
            ],
        },
        {
            "Metric": "Strategy Return (%)",
            "Random Forest": rf[
                "strategy_return_percent"
            ],
            "LSTM": lstm[
                "strategy_return_percent"
            ],
        },
        {
            "Metric": "Maximum Drawdown (%)",
            "Random Forest": rf[
                "max_drawdown_percent"
            ],
            "LSTM": lstm[
                "max_drawdown_percent"
            ],
        },
    ]
)


# =========================================================
# SAVE
# =========================================================

comparison.to_csv(
    OUTPUT_CSV,
    index=False
)


# =========================================================
# PRINT
# =========================================================

print()
print("========================================")
print("RANDOM FOREST vs LSTM")
print("========================================")

print(
    comparison.to_string(
        index=False
    )
)

print()
print(
    f"Saved: {OUTPUT_CSV}"
)

print()
print("========================================")