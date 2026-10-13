import os
import json
import joblib
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)


# =========================================================
# CONFIG
# =========================================================

DATA_PATH = "data/processed/reliance_processed.csv"

MODEL_DIR = "models"

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "stock_model.pkl"
)

METRICS_PATH = os.path.join(
    MODEL_DIR,
    "rf_metrics.json"
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
# CREATE MODEL DIRECTORY
# =========================================================

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


# =========================================================
# LOAD DATA
# =========================================================

print()
print("========================================")
print("LOADING PROCESSED DATA")
print("========================================")

data = pd.read_csv(
    DATA_PATH
)


if data.empty:
    raise ValueError(
        "Processed dataset is empty."
    )


# =========================================================
# CHECK FEATURES
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
]

test_data = data.iloc[
    split_index:
]


X_train = train_data[
    FEATURES
]

y_train = train_data[
    TARGET
]

X_test = test_data[
    FEATURES
]

y_test = test_data[
    TARGET
]


print()
print("========================================")
print("DATA SPLIT")
print("========================================")

print(
    f"Total rows : {len(data)}"
)

print(
    f"Train rows : {len(train_data)}"
)

print(
    f"Test rows  : {len(test_data)}"
)


# =========================================================
# MODEL
# =========================================================

print()
print("========================================")
print("TRAINING RANDOM FOREST")
print("========================================")


model = RandomForestRegressor(
    n_estimators=300,
    max_depth=12,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
)


model.fit(
    X_train,
    y_train
)


# =========================================================
# PREDICTION
# =========================================================

predictions = model.predict(
    X_test
)


# =========================================================
# METRICS
# =========================================================

mae = mean_absolute_error(
    y_test,
    predictions
)

rmse = mean_squared_error(
    y_test,
    predictions
) ** 0.5

r2 = r2_score(
    y_test,
    predictions
)


# =========================================================
# DIRECTIONAL ACCURACY
# =========================================================

actual_previous = test_data[
    "Close"
].values


actual_direction = (
    y_test.values
    > actual_previous
)

predicted_direction = (
    predictions
    > actual_previous
)

directional_accuracy = (
    actual_direction
    == predicted_direction
).mean() * 100


# =========================================================
# DISPLAY
# =========================================================

print()
print("========================================")
print("RANDOM FOREST PERFORMANCE")
print("========================================")

print(
    f"MAE                 : {mae:.4f}"
)

print(
    f"RMSE                : {rmse:.4f}"
)

print(
    f"R2 Score             : {r2:.4f}"
)

print(
    f"Directional Accuracy : {directional_accuracy:.2f}%"
)


# =========================================================
# SAVE MODEL
# =========================================================

joblib.dump(
    {
        "model": model,
        "features": FEATURES,
    },
    MODEL_PATH
)


# =========================================================
# SAVE METRICS
# =========================================================

metrics = {
    "model": "Random Forest",
    "mae": float(mae),
    "rmse": float(rmse),
    "r2": float(r2),
    "directional_accuracy": float(
        directional_accuracy
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


print()
print("========================================")
print("MODEL SAVED")
print("========================================")

print(
    f"Model   : {MODEL_PATH}"
)

print(
    f"Metrics : {METRICS_PATH}"
)