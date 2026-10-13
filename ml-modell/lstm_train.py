import os
import json
import joblib

import numpy as np
import pandas as pd

from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
)

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    LSTM,
    Dense,
    Dropout,
)
from tensorflow.keras.callbacks import EarlyStopping


# =========================================================
# CONFIG
# =========================================================

DATA_PATH = (
    "data/processed/reliance_processed.csv"
)

MODEL_DIR = "models"

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "lstm_model.keras"
)

SCALER_PATH = os.path.join(
    MODEL_DIR,
    "lstm_scaler.pkl"
)

METRICS_PATH = os.path.join(
    MODEL_DIR,
    "lstm_metrics.json"
)


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
# DIRECTORY
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
print("LOADING DATA FOR LSTM")
print("========================================")


data = pd.read_csv(
    DATA_PATH
)


if data.empty:
    raise ValueError(
        "Dataset is empty."
    )


# =========================================================
# CHECK
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
# RAW DATA
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
# CHRONOLOGICAL SPLIT
# =========================================================

split_index = int(
    len(data) * 0.80
)


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
# SCALING
# =========================================================

feature_scaler = MinMaxScaler()

target_scaler = MinMaxScaler()


X_train_scaled = (
    feature_scaler.fit_transform(
        X_train_raw
    )
)

X_test_scaled = (
    feature_scaler.transform(
        X_test_raw
    )
)


y_train_scaled = (
    target_scaler.fit_transform(
        y_train_raw
    )
)

y_test_scaled = (
    target_scaler.transform(
        y_test_raw
    )
)


# =========================================================
# CREATE SEQUENCES
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


# =========================================================
# TRAIN SEQUENCES
# =========================================================

X_train, y_train = create_sequences(
    X_train_scaled,
    y_train_scaled,
    LOOKBACK
)


# =========================================================
# TEST SEQUENCES
# =========================================================

X_test, y_test = create_sequences(
    X_test_scaled,
    y_test_scaled,
    LOOKBACK
)


print()
print("========================================")
print("LSTM SEQUENCE INFORMATION")
print("========================================")

print(
    "Lookback days:",
    LOOKBACK
)

print(
    "Features:",
    len(FEATURES)
)

print(
    "Training shape:",
    X_train.shape
)

print(
    "Testing shape:",
    X_test.shape
)


# =========================================================
# MODEL
# =========================================================

model = Sequential(
    [

        LSTM(
            64,
            return_sequences=True,
            input_shape=(
                LOOKBACK,
                len(FEATURES)
            )
        ),

        Dropout(0.20),

        LSTM(
            32,
            return_sequences=False
        ),

        Dropout(0.20),

        Dense(
            16,
            activation="relu"
        ),

        Dense(
            1
        )
    ]
)


# =========================================================
# COMPILE
# =========================================================

model.compile(
    optimizer="adam",
    loss="mean_squared_error"
)


print()
print("========================================")
print("LSTM ARCHITECTURE")
print("========================================")

model.summary()


# =========================================================
# EARLY STOPPING
# =========================================================

early_stopping = EarlyStopping(
    monitor="val_loss",
    patience=10,
    restore_best_weights=True
)


# =========================================================
# TRAIN
# =========================================================

print()
print("========================================")
print("TRAINING LSTM")
print("========================================")


history = model.fit(
    X_train,
    y_train,
    epochs=50,
    batch_size=32,
    validation_split=0.10,
    callbacks=[
        early_stopping
    ],
    verbose=1
)


# =========================================================
# PREDICT
# =========================================================

predicted_scaled = model.predict(
    X_test,
    verbose=0
)


# =========================================================
# INVERSE SCALE
# =========================================================

predicted_prices = (
    target_scaler
    .inverse_transform(
        predicted_scaled
    )
    .flatten()
)


actual_prices = (
    target_scaler
    .inverse_transform(
        y_test
    )
    .flatten()
)


# =========================================================
# METRICS
# =========================================================

mae = mean_absolute_error(
    actual_prices,
    predicted_prices
)

rmse = (
    mean_squared_error(
        actual_prices,
        predicted_prices
    ) ** 0.5
)


# =========================================================
# DIRECTIONAL ACCURACY
# =========================================================

# Test sequence starts after LOOKBACK.
previous_prices = data[
    "Close"
].iloc[
    split_index + LOOKBACK:
].values


actual_direction = (
    actual_prices
    > previous_prices
)

predicted_direction = (
    predicted_prices
    > previous_prices
)


directional_accuracy = (
    actual_direction
    == predicted_direction
).mean() * 100


# =========================================================
# PRINT RESULTS
# =========================================================

print()
print("========================================")
print("LSTM PERFORMANCE")
print("========================================")

print(
    f"MAE                 : {mae:.4f}"
)

print(
    f"RMSE                : {rmse:.4f}"
)

print(
    f"Directional Accuracy : "
    f"{directional_accuracy:.2f}%"
)


# =========================================================
# SAVE MODEL
# =========================================================

model.save(
    MODEL_PATH
)


# =========================================================
# SAVE SCALERS
# =========================================================

joblib.dump(
    {
        "feature_scaler": feature_scaler,
        "target_scaler": target_scaler,
        "features": FEATURES,
        "lookback": LOOKBACK,
    },
    SCALER_PATH
)


# =========================================================
# SAVE METRICS
# =========================================================

metrics = {
    "model": "LSTM",
    "lookback": LOOKBACK,
    "mae": float(mae),
    "rmse": float(rmse),
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
print("LSTM MODEL SAVED")
print("========================================")

print(
    f"Model  : {MODEL_PATH}"
)

print(
    f"Scaler : {SCALER_PATH}"
)

print(
    f"Metric : {METRICS_PATH}"
)