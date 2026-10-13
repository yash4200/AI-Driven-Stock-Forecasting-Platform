import os
import yfinance as yf
import pandas as pd


SYMBOL = "RELIANCE.NS"

RAW_PATH = "data/raw/reliance_raw.csv"
PROCESSED_PATH = "data/processed/reliance_processed.csv"


# Create folders
os.makedirs("data/raw", exist_ok=True)
os.makedirs("data/processed", exist_ok=True)


print(f"Downloading data for {SYMBOL}...")


# Download historical data
data = yf.download(
    SYMBOL,
    period="5y",
    interval="1d",
    auto_adjust=False,
    progress=False
)


if data.empty:
    raise ValueError("No data received from Yahoo Finance.")


# Handle MultiIndex columns
if isinstance(data.columns, pd.MultiIndex):

    level_0 = data.columns.get_level_values(0)

    if "Open" in level_0:
        data.columns = level_0
    else:
        data.columns = data.columns.get_level_values(-1)


# Convert index to Date column
data = data.reset_index()


# Required columns
required_columns = [
    "Date",
    "Open",
    "High",
    "Low",
    "Close",
    "Volume"
]


# Keep only available columns
data = data[
    [
        column
        for column in required_columns
        if column in data.columns
    ]
]


# Clean data
data = data.dropna()

data = data.drop_duplicates(
    subset=["Date"]
)

data = data.sort_values("Date")


# Save raw dataset
data.to_csv(
    RAW_PATH,
    index=False
)


# ==============================
# FEATURE ENGINEERING
# ==============================

# Daily return
data["Return"] = data["Close"].pct_change()


# Moving averages
data["MA_10"] = (
    data["Close"]
    .rolling(window=10)
    .mean()
)

data["MA_20"] = (
    data["Close"]
    .rolling(window=20)
    .mean()
)

data["MA_50"] = (
    data["Close"]
    .rolling(window=50)
    .mean()
)


# Volatility
data["Volatility"] = (
    data["Return"]
    .rolling(window=20)
    .std()
)


# Target = next day's closing price
data["Target"] = (
    data["Close"]
    .shift(-1)
)


# Remove rows created by rolling/shift
data = data.dropna()


# Save processed dataset
data.to_csv(
    PROCESSED_PATH,
    index=False
)


# ==============================
# OUTPUT
# ==============================

print()
print("================================")
print("DATASET PIPELINE COMPLETED")
print("================================")

print(f"Symbol       : {SYMBOL}")
print(f"Rows         : {len(data)}")

print(f"Raw dataset  : {RAW_PATH}")
print(f"Processed    : {PROCESSED_PATH}")

print()
print("Columns:")

print(list(data.columns))

print()
print("Latest records:")

print(data.tail())