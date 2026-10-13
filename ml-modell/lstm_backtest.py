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
# PATHS
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
    "lstm_model.keras"
)

SCALER_PATH = os.path.join(
    BASE_DIR,
    "models",
    "lstm_scaler.pkl"
)

OUTPUT_PATH = os.path.join(
    BASE_DIR,
    "models",
    "lstm_backtest_results.csv"
)

METRICS_PATH = os.path.join(
    BASE_DIR,
    "models",
    "lstm_backtest_metrics.json"
)


# =========================================================
# SETTINGS
# =========================================================

LOOKBACK = 60

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
# LOAD TENSORFLOW
# =========================================================

print()
print("========================================")
print("LSTM BACKTEST")
print("========================================")

from tensorflow.keras.models import load_model


# =========================================================
# LOAD MODEL
# =========================================================

print()
print("Loading LSTM model...")

model = load_model(
    MODEL_PATH
)

print("LSTM model loaded.")


# =========================================================
# LOAD SCALERS
# =========================================================

print()
print("Loading scalers...")

saved_scalers = joblib.load(
    SCALER_PATH
)

feature_scaler = saved_scalers[
    "feature_scaler"
]

target_scaler = saved_scalers[
    "target_scaler"
]

print("Scalers loaded.")


# =========================================================
# LOAD DATA
# =========================================================

data = pd.read_csv(
    DATA_PATH
)

if data.empty:
    raise ValueError(
        "Processed dataset is empty."
    )


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
# CHECK
# =========================================================

required_columns = (
    FEATURES +
    [TARGET]
)

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
).reset_index(
    drop=True
)


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

print(
    f"Total samples : {len(data)}"
)

print(
    f"Training      : {len(train_data)}"
)

print(
    f"Testing       : {len(test_data)}"
)

print(
    f"Lookback      : {LOOKBACK}"
)


# =========================================================
# PREPARE FEATURES
# =========================================================

X = data[
    FEATURES
].values

y = data[
    TARGET
].values.reshape(
    -1,
    1
)


# =========================================================
# SPLIT RAW DATA
# =========================================================

X_train_raw = X[
    :split_index
]

X_test_raw = X[
    split_index:
]

y_train_raw = y[
    :split_index
]

y_test_raw = y[
    split_index:
]


# =========================================================
# SCALE
# =========================================================

X_train_scaled = (
    feature_scaler.transform(
        X_train_raw
    )
)

X_test_scaled = (
    feature_scaler.transform(
        X_test_raw
    )
)

y_train_scaled = (
    target_scaler.transform(
        y_train_raw
    )
)

y_test_scaled = (
    target_scaler.transform(
        y_test_raw
    )
)


# =========================================================
# CREATE TEST SEQUENCES
# =========================================================

def create_sequences(
    features,
    target,
    lookback
):

    X_sequences = []
    y_sequences = []

    for i in range(
        lookback,
        len(features)
    ):

        X_sequences.append(
            features[
                i - lookback:i
            ]
        )

        y_sequences.append(
            target[i]
        )

    return (
        np.array(X_sequences),
        np.array(y_sequences)
    )


X_test, y_test = create_sequences(
    X_test_scaled,
    y_test_scaled,
    LOOKBACK
)


print()
print("Sequence Information")
print("----------------------------------------")

print(
    f"Test sequence shape : {X_test.shape}"
)


# =========================================================
# PREDICTION
# =========================================================

print()
print("Generating LSTM predictions...")

predicted_scaled = model.predict(
    X_test,
    verbose=0
)


# =========================================================
# INVERSE TRANSFORM
# =========================================================

predicted_prices = (
    target_scaler.inverse_transform(
        predicted_scaled
    )
    .flatten()
)

actual_prices = (
    target_scaler.inverse_transform(
        y_test
    )
    .flatten()
)


# =========================================================
# PREVIOUS CLOSE
# =========================================================

previous_prices = (
    data[
        "Close"
    ]
    .iloc[
        split_index + LOOKBACK:
    ]
    .values
)


# =========================================================
# DATES
# =========================================================

dates = (
    data[
        "Date"
    ]
    .iloc[
        split_index + LOOKBACK:
    ]
    .values
)


# =========================================================
# RESULT DATAFRAME
# =========================================================

results = pd.DataFrame(
    {
        "Date": dates,
        "Previous_Close": previous_prices,
        "Actual": actual_prices,
        "Predicted": predicted_prices,
    }
)


# =========================================================
# ERROR
# =========================================================

results["Error"] = (
    results["Actual"]
    -
    results["Predicted"]
)

results["Absolute_Error"] = (
    results["Error"]
    .abs()
)

results["Absolute_Percentage_Error"] = (
    results["Absolute_Error"]
    /
    results["Actual"].abs()
) * 100


# =========================================================
# DIRECTION
# =========================================================

results["Actual_Direction"] = (
    results["Actual"]
    >
    results["Previous_Close"]
)

results["Predicted_Direction"] = (
    results["Predicted"]
    >
    results["Previous_Close"]
)

results["Direction_Correct"] = (
    results["Actual_Direction"]
    ==
    results["Predicted_Direction"]
)


# =========================================================
# METRICS
# =========================================================

mae = mean_absolute_error(
    results["Actual"],
    results["Predicted"]
)

rmse = np.sqrt(
    mean_squared_error(
        results["Actual"],
        results["Predicted"]
    )
)

mape = (
    results[
        "Absolute_Percentage_Error"
    ].mean()
)

directional_accuracy = (
    results[
        "Direction_Correct"
    ].mean()
    * 100
)


# =========================================================
# STRATEGY BACKTEST
# =========================================================

results["Actual_Return"] = (
    results["Actual"]
    -
    results["Previous_Close"]
) / results["Previous_Close"]


results["Signal"] = (
    results["Predicted"]
    >
    results["Previous_Close"]
).astype(int)


results["Strategy_Return"] = (
    results["Signal"]
    *
    results["Actual_Return"]
)


# =========================================================
# CUMULATIVE PERFORMANCE
# =========================================================

results["Cumulative_Market"] = (
    1
    +
    results["Actual_Return"]
).cumprod()


results["Cumulative_Strategy"] = (
    1
    +
    results["Strategy_Return"]
).cumprod()


market_return = (
    results[
        "Cumulative_Market"
    ].iloc[-1]
    -
    1
) * 100


strategy_return = (
    results[
        "Cumulative_Strategy"
    ].iloc[-1]
    -
    1
) * 100


# =========================================================
# MAX DRAWDOWN
# =========================================================

equity_curve = (
    results[
        "Cumulative_Strategy"
    ]
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
# SAVE RESULTS
# =========================================================

results.to_csv(
    OUTPUT_PATH,
    index=False
)


# =========================================================
# SAVE METRICS
# =========================================================

metrics = {

    "model": "LSTM",

    "total_samples": int(
        len(data)
    ),

    "train_samples": int(
        len(train_data)
    ),

    "test_samples": int(
        len(results)
    ),

    "lookback": LOOKBACK,

    "mae": float(
        mae
    ),

    "rmse": float(
        rmse
    ),

    "mape": float(
        mape
    ),

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
# DISPLAY
# =========================================================

print()
print("========================================")
print("LSTM BACKTEST RESULTS")
print("========================================")

print(
    f"Test samples         : {len(results)}"
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
    f"LSTM Strategy Return : "
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