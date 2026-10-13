import joblib
import pandas as pd


MODEL_PATH = "models/stock_model.pkl"

DATA_PATH = "data/processed/reliance_processed.csv"


# ==============================
# LOAD MODEL
# ==============================

print("Loading trained model...")

saved_model = joblib.load(
    MODEL_PATH
)


model = saved_model["model"]

features = saved_model["features"]


# ==============================
# LOAD DATA
# ==============================

data = pd.read_csv(
    DATA_PATH
)


# Get latest available row
latest_data = data.iloc[-1]


# Create input DataFrame
input_data = pd.DataFrame(
    [
        latest_data[features].values
    ],
    columns=features
)


# ==============================
# PREDICTION
# ==============================

prediction = model.predict(
    input_data
)[0]


current_price = float(
    latest_data["Close"]
)


# ==============================
# CALCULATE CHANGE
# ==============================

change = prediction - current_price


percentage_change = (
    change / current_price
) * 100


# ==============================
# OUTPUT
# ==============================

print()
print("================================")
print("STOCK FORECAST")
print("================================")

print(
    f"Current Price : ₹{current_price:.2f}"
)

print(
    f"Predicted Next Close : ₹{prediction:.2f}"
)

print(
    f"Expected Change : ₹{change:.2f}"
)

print(
    f"Expected Change % : {percentage_change:.2f}%"
)


if prediction > current_price:
    print("Forecast Direction : UP")
else:
    print("Forecast Direction : DOWN")