import os
import pandas as pd
import matplotlib.pyplot as plt


# =========================================================
# PATHS
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODELS_DIR = os.path.join(
    BASE_DIR,
    "models"
)

RF_PATH = os.path.join(
    MODELS_DIR,
    "rf_backtest_results.csv"
)

LSTM_PATH = os.path.join(
    MODELS_DIR,
    "lstm_backtest_results.csv"
)


# =========================================================
# LOAD
# =========================================================

rf = pd.read_csv(
    RF_PATH
)

lstm = pd.read_csv(
    LSTM_PATH
)


rf["Date"] = pd.to_datetime(
    rf["Date"]
)

lstm["Date"] = pd.to_datetime(
    lstm["Date"]
)


# =========================================================
# GRAPH 1
# ACTUAL vs RF
# =========================================================

plt.figure(
    figsize=(12, 6)
)

plt.plot(
    rf["Date"],
    rf["Actual"],
    label="Actual Price"
)

plt.plot(
    rf["Date"],
    rf["Predicted"],
    label="Random Forest Prediction"
)

plt.title(
    "Random Forest: Actual vs Predicted"
)

plt.xlabel(
    "Date"
)

plt.ylabel(
    "Stock Price"
)

plt.legend()

plt.tight_layout()

plt.savefig(
    os.path.join(
        MODELS_DIR,
        "rf_actual_vs_predicted.png"
    ),
    dpi=200
)

plt.close()


# =========================================================
# GRAPH 2
# ACTUAL vs LSTM
# =========================================================

plt.figure(
    figsize=(12, 6)
)

plt.plot(
    lstm["Date"],
    lstm["Actual"],
    label="Actual Price"
)

plt.plot(
    lstm["Date"],
    lstm["Predicted"],
    label="LSTM Prediction"
)

plt.title(
    "LSTM: Actual vs Predicted"
)

plt.xlabel(
    "Date"
)

plt.ylabel(
    "Stock Price"
)

plt.legend()

plt.tight_layout()

plt.savefig(
    os.path.join(
        MODELS_DIR,
        "lstm_actual_vs_predicted.png"
    ),
    dpi=200
)

plt.close()


# =========================================================
# GRAPH 3
# CUMULATIVE PERFORMANCE
# =========================================================

plt.figure(
    figsize=(12, 6)
)

plt.plot(
    rf["Date"],
    rf["Cumulative_Market"],
    label="Market"
)

plt.plot(
    rf["Date"],
    rf["Cumulative_Strategy"],
    label="RF Strategy"
)

plt.plot(
    lstm["Date"],
    lstm["Cumulative_Strategy"],
    label="LSTM Strategy"
)

plt.title(
    "Backtest Cumulative Performance"
)

plt.xlabel(
    "Date"
)

plt.ylabel(
    "Growth of ₹1"
)

plt.legend()

plt.tight_layout()

plt.savefig(
    os.path.join(
        MODELS_DIR,
        "backtest_cumulative_performance.png"
    ),
    dpi=200
)

plt.close()


# =========================================================
# GRAPH 4
# MODEL METRIC COMPARISON
# =========================================================

comparison = pd.DataFrame(
    {
        "Model": [
            "Random Forest",
            "LSTM"
        ],

        "MAE": [
            rf["Absolute_Error"].mean(),
            lstm["Absolute_Error"].mean()
        ],

        "RMSE": [
            (
                rf["Error"] ** 2
            ).mean() ** 0.5,

            (
                lstm["Error"] ** 2
            ).mean() ** 0.5
        ]
    }
)


comparison.plot(
    x="Model",
    y=[
        "MAE",
        "RMSE"
    ],
    kind="bar",
    figsize=(8, 6)
)

plt.title(
    "Random Forest vs LSTM Error Metrics"
)

plt.xlabel(
    "Model"
)

plt.ylabel(
    "Error"
)

plt.tight_layout()

plt.savefig(
    os.path.join(
        MODELS_DIR,
        "model_error_comparison.png"
    ),
    dpi=200
)

plt.close()


print()
print("========================================")
print("BACKTEST GRAPHS GENERATED")
print("========================================")

print(
    "1. rf_actual_vs_predicted.png"
)

print(
    "2. lstm_actual_vs_predicted.png"
)

print(
    "3. backtest_cumulative_performance.png"
)

print(
    "4. model_error_comparison.png"
)

print()