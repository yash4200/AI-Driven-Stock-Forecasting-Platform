import json
import os


# =========================================================
# PATHS
# =========================================================

RF_METRICS_PATH = (
    "models/rf_metrics.json"
)

LSTM_METRICS_PATH = (
    "models/lstm_metrics.json"
)


# =========================================================
# LOAD
# =========================================================

with open(
    RF_METRICS_PATH,
    "r"
) as file:

    rf = json.load(file)


with open(
    LSTM_METRICS_PATH,
    "r"
) as file:

    lstm = json.load(file)


# =========================================================
# PRINT COMPARISON
# =========================================================

print()
print(
    "================================================"
)

print(
    "             MODEL COMPARISON"
)

print(
    "================================================"
)

print()

print(
    f"{'Metric':<25}"
    f"{'Random Forest':<20}"
    f"{'LSTM':<20}"
)

print(
    "-" * 65
)

print(
    f"{'MAE':<25}"
    f"{rf['mae']:<20.4f}"
    f"{lstm['mae']:<20.4f}"
)

print(
    f"{'RMSE':<25}"
    f"{rf['rmse']:<20.4f}"
    f"{lstm['rmse']:<20.4f}"
)

print(
    f"{'Direction Accuracy':<25}"
    f"{rf['directional_accuracy']:<20.2f}%"
    f"{lstm['directional_accuracy']:<20.2f}%"
)

print(
    "================================================"
)


# =========================================================
# INTERPRETATION
# =========================================================

print()
print(
    "INTERPRETATION"
)

print()


if lstm["mae"] < rf["mae"]:

    print(
        "LSTM has lower MAE on the evaluated test set."
    )

else:

    print(
        "Random Forest has lower MAE on the evaluated test set."
    )


if lstm["rmse"] < rf["rmse"]:

    print(
        "LSTM has lower RMSE on the evaluated test set."
    )

else:

    print(
        "Random Forest has lower RMSE on the evaluated test set."
    )


if (
    lstm["directional_accuracy"]
    >
    rf["directional_accuracy"]
):

    print(
        "LSTM has higher directional accuracy "
        "on the evaluated test set."
    )

else:

    print(
        "Random Forest has higher directional accuracy "
        "on the evaluated test set."
    )