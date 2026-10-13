import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
)


# =========================================================
# CONFIG
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "reliance_processed.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "stock_model.pkl"
)

OUTPUT_PATH = os.path.join(
    BASE_DIR,
    "models",
    "rf_backtest_results.csv"
)

METRICS_PATH = os.path.join(
    BASE_DIR,
    "models",
    "rf_backtest_metrics.json"
)


FEATURES = [
    "Open",
    "High",
    "Low",
    "Close",
    "Volume",
    "Return",
    "MA_10",
    "MA_20",
    "MA_50",
    "Volatility",
]

TARGET = "Target"


# =========================================================
# LOAD DATA
# =========================================================

print()
print("========================================")
print("RANDOM FOREST BACKTEST")
print("========================================")

data = pd.read_csv(DATA_PATH)

if data.empty:
    raise ValueError("Processed dataset is empty.")


# =========================================================
# DATE
# =========================================================

if "Date" in data.columns:
    data["Date"] = pd.to_datetime(
        data["Date"],
        errors="coerce"
    )

    data = data.sort_values(
        "Date"
    )


# =========================================================
# CHECK COLUMNS
# =========================================================

required_columns = FEATURES + [TARGET]

missing_columns = [
    column
    for column in required_columns
    if column not in data.columns
]

if missing_columns:
    raise ValueError(
        f"Missing columns: {missing_columns}"
    )


# =========================================================
# CLEAN
# =========================================================

data = data.dropna(
    subset=required_columns
).reset_index(drop=True)


# =========================================================
# CHRONOLOGICAL SPLIT
# =========================================================

split_index = int(
    len(data) * 0.80
)

train_data = data.iloc[
    :split_index
].copy()

test_data = data.iloc[
    split_index:
].copy()


print()
print("Dataset Information")
print("----------------------------------------")
print(f"Total samples : {len(data)}")
print(f"Training      : {len(train_data)}")
print(f"Testing       : {len(test_data)}")


# =========================================================
# LOAD MODEL
# =========================================================

saved = joblib.load(
    MODEL_PATH
)

model = saved["model"]


# =========================================================
# PREDICTION
# =========================================================

test_data["Actual"] = test_data[TARGET]

test_data["Predicted"] = model.predict(
    test_data[FEATURES]
)


# =========================================================
# PRICE ERROR
# =========================================================

test_data["Error"] = (
    test_data["Actual"]
    - test_data["Predicted"]
)

test_data["Absolute_Error"] = (
    test_data["Error"].abs()
)


# =========================================================
# PERCENTAGE ERROR
# =========================================================

test_data["Absolute_Percentage_Error"] = (
    test_data["Absolute_Error"]
    / test_data["Actual"].abs()
) * 100


# =========================================================
# DIRECTION
# =========================================================

test_data["Actual_Direction"] = (
    test_data["Actual"]
    > test_data["Close"]
)

test_data["Predicted_Direction"] = (
    test_data["Predicted"]
    > test_data["Close"]
)

test_data["Direction_Correct"] = (
    test_data["Actual_Direction"]
    ==
    test_data["Predicted_Direction"]
)


# =========================================================
# METRICS
# =========================================================

mae = mean_absolute_error(
    test_data["Actual"],
    test_data["Predicted"]
)

rmse = np.sqrt(
    mean_squared_error(
        test_data["Actual"],
        test_data["Predicted"]
    )
)

mape = (
    test_data[
        "Absolute_Percentage_Error"
    ].mean()
)

directional_accuracy = (
    test_data[
        "Direction_Correct"
    ].mean()
    * 100
)


# =========================================================
# SIMPLE BACKTEST STRATEGY
# =========================================================

# Educational research backtest:
#
# If model predicts next close > current close:
#     signal = 1
#
# Otherwise:
#     signal = 0
#
# Strategy return is based on next-day actual return.

test_data["Actual_Return"] = (
    test_data["Actual"]
    - test_data["Close"]
) / test_data["Close"]


test_data["Signal"] = (
    test_data["Predicted"]
    >
    test_data["Close"]
).astype(int)


test_data["Strategy_Return"] = (
    test_data["Signal"]
    *
    test_data["Actual_Return"]
)


# =========================================================
# CUMULATIVE PERFORMANCE
# =========================================================

test_data["Cumulative_Market"] = (
    1
    +
    test_data["Actual_Return"]
).cumprod()


test_data["Cumulative_Strategy"] = (
    1
    +
    test_data["Strategy_Return"]
).cumprod()


market_return = (
    test_data["Cumulative_Market"].iloc[-1]
    - 1
) * 100


strategy_return = (
    test_data["Cumulative_Strategy"].iloc[-1]
    - 1
) * 100


# =========================================================
# MAX DRAWDOWN
# =========================================================

equity_curve = (
    test_data["Cumulative_Strategy"]
)

running_max = (
    equity_curve.cummax()
)

drawdown = (
    equity_curve
    /
    running_max
) - 1

max_drawdown = (
    drawdown.min()
    * 100
)


# =========================================================
# SAVE DETAILED RESULTS
# =========================================================

test_data.to_csv(
    OUTPUT_PATH,
    index=False
)


# =========================================================
# SAVE METRICS
# =========================================================

metrics = {
    "model": "Random Forest",
    "total_samples": int(len(data)),
    "train_samples": int(len(train_data)),
    "test_samples": int(len(test_data)),
    "mae": float(mae),
    "rmse": float(rmse),
    "mape": float(mape),
    "directional_accuracy": float(
        directional_accuracy
    ),
    "market_return_percent": float(
        market_return
    ),
    "strategy_return_percent": float(
        strategy_return
    ),
    "max_drawdown_percent": float(
        max_drawdown
    ),
}


with open(
    METRICS_PATH,
    "w"
) as file:

    json.dump(
        metrics,
        file,
        indent=4
    )


# =========================================================
# RESULTS
# =========================================================

print()
print("========================================")
print("BACKTEST RESULTS")
print("========================================")

print(
    f"Test samples         : {len(test_data)}"
)

print(
    f"MAE                  : {mae:.4f}"
)

print(
    f"RMSE                 : {rmse:.4f}"
)

print(
    f"MAPE                 : {mape:.2f}%"
)

print(
    f"Directional Accuracy : "
    f"{directional_accuracy:.2f}%"
)

print()
print("Backtest Performance")
print("----------------------------------------")

print(
    f"Market Return        : "
    f"{market_return:.2f}%"
)

print(
    f"Model Strategy Return: "
    f"{strategy_return:.2f}%"
)

print(
    f"Maximum Drawdown     : "
    f"{max_drawdown:.2f}%"
)

print()
print("Saved files")
print("----------------------------------------")

print(
    f"Results : {OUTPUT_PATH}"
)

print(
    f"Metrics : {METRICS_PATH}"
)

print()
print("========================================")