from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import yfinance as yf


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

MODEL_PATH = MODEL_DIR / "stock_model.pkl"


# =========================================================
# DEFAULT FEATURES
# =========================================================

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


# =========================================================
# MODEL CACHE
# =========================================================

_model_data = None


# =========================================================
# LOAD RANDOM FOREST MODEL
# =========================================================

def load_model():

    global _model_data

    if _model_data is None:

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Random Forest model not found: {MODEL_PATH}"
            )

        print("Loading Random Forest model...")

        # IMPORTANT:
        # stock_model.pkl was created using joblib
        _model_data = joblib.load(MODEL_PATH)

        print("Random Forest model loaded.")

    return _model_data


# =========================================================
# EXTRACT MODEL FROM SAVED FILE
# =========================================================

def extract_model(model_data):

    # Case 1:
    # The saved file itself is the sklearn model
    if hasattr(model_data, "predict"):
        return model_data

    # Case 2:
    # The saved file is a dictionary
    if isinstance(model_data, dict):

        possible_keys = [
            "model",
            "rf_model",
            "random_forest",
            "randomforest",
            "regressor",
            "estimator",
            "stock_model",
        ]

        # Try known keys first
        for key in possible_keys:

            if key in model_data:

                candidate = model_data[key]

                if hasattr(candidate, "predict"):
                    return candidate

        # Automatic search through dictionary values
        for key, value in model_data.items():

            if hasattr(value, "predict"):
                print(
                    f"Using model from dictionary key: {key}"
                )

                return value

    raise ValueError(
        "Could not find a prediction model inside "
        "models/stock_model.pkl"
    )


# =========================================================
# EXTRACT TRAINED FEATURES
# =========================================================

def extract_features(model_data, model):

    # Check saved dictionary
    if isinstance(model_data, dict):

        possible_keys = [
            "features",
            "feature_names",
            "columns",
            "feature_columns",
            "FEATURES",
        ]

        for key in possible_keys:

            if key in model_data:

                features = model_data[key]

                if isinstance(
                    features,
                    (list, tuple, np.ndarray)
                ):

                    return list(features)

    # Check sklearn model
    if hasattr(model, "feature_names_in_"):

        return list(
            model.feature_names_in_
        )

    # Fallback
    return FEATURES


# =========================================================
# FEATURE ENGINEERING
# =========================================================

def create_features(df):

    df = df.copy()

    # Daily return
    df["Return"] = (
        df["Close"].pct_change()
    )

    # Moving averages
    df["MA_10"] = (
        df["Close"]
        .rolling(10)
        .mean()
    )

    df["MA_20"] = (
        df["Close"]
        .rolling(20)
        .mean()
    )

    df["MA_50"] = (
        df["Close"]
        .rolling(50)
        .mean()
    )

    # Volatility
    df["Volatility"] = (
        df["Return"]
        .rolling(20)
        .std()
    )

    # Remove invalid values
    df = df.replace(
        [np.inf, -np.inf],
        np.nan
    )

    df = df.dropna()

    return df


# =========================================================
# DOWNLOAD STOCK DATA
# =========================================================

def get_stock_data(
    symbol,
    period="1y"
):

    # Add NSE suffix automatically
    if "." not in symbol:
        symbol = f"{symbol}.NS"

    print(
        f"Downloading data for {symbol}..."
    )

    df = yf.download(
        symbol,
        period=period,
        interval="1d",
        auto_adjust=False,
        progress=False,
    )

    if df.empty:
        raise ValueError(
            f"No stock data available for {symbol}"
        )

    # -----------------------------------------------------
    # Handle yfinance MultiIndex
    # -----------------------------------------------------

    if isinstance(
        df.columns,
        pd.MultiIndex
    ):

        df.columns = (
            df.columns
            .get_level_values(0)
        )

    # -----------------------------------------------------
    # Required columns
    # -----------------------------------------------------

    required_columns = [
        "Open",
        "High",
        "Low",
        "Close",
        "Volume",
    ]

    missing = [
        col
        for col in required_columns
        if col not in df.columns
    ]

    if missing:

        raise ValueError(
            f"Missing columns: {missing}"
        )

    # -----------------------------------------------------
    # Select columns
    # -----------------------------------------------------

    df = df[
        required_columns
    ].copy()

    # -----------------------------------------------------
    # Clean data
    # -----------------------------------------------------

    df = df.replace(
        [np.inf, -np.inf],
        np.nan
    )

    df = df.dropna()

    if df.empty:

        raise ValueError(
            f"No valid stock data available "
            f"for {symbol}"
        )

    return df


# =========================================================
# MAIN PREDICTION
# =========================================================

def predict_stock(
    symbol="RELIANCE.NS"
):

    # -----------------------------------------------------
    # Load model
    # -----------------------------------------------------

    model_data = load_model()

    model = extract_model(
        model_data
    )

    # -----------------------------------------------------
    # Get trained feature names
    # -----------------------------------------------------

    trained_features = extract_features(
        model_data,
        model
    )

    print(
        "Using features:",
        trained_features
    )

    # -----------------------------------------------------
    # Download data
    # -----------------------------------------------------

    df = get_stock_data(
        symbol
    )

    # -----------------------------------------------------
    # Create features
    # -----------------------------------------------------

    df = create_features(
        df
    )

    if df.empty:

        raise ValueError(
            "Feature dataframe is empty."
        )

    # -----------------------------------------------------
    # Check required features
    # -----------------------------------------------------

    missing_features = [
        feature
        for feature in trained_features
        if feature not in df.columns
    ]

    if missing_features:

        raise ValueError(
            "Missing model features: "
            f"{missing_features}"
        )

    # -----------------------------------------------------
    # Current price
    # -----------------------------------------------------

    current_price = float(
        df["Close"].iloc[-1]
    )

    # -----------------------------------------------------
    # Latest feature row
    # -----------------------------------------------------

    X = df[
        trained_features
    ].iloc[-1:]

    # -----------------------------------------------------
    # Clean input
    # -----------------------------------------------------

    X = X.replace(
        [np.inf, -np.inf],
        np.nan
    )

    X = X.fillna(0)

    # -----------------------------------------------------
    # Prediction
    # -----------------------------------------------------

    print(
        "Generating prediction..."
    )

    prediction = model.predict(
        X
    )

    predicted_price = float(
        np.asarray(
            prediction
        ).reshape(-1)[0]
    )

    # -----------------------------------------------------
    # Validate prediction
    # -----------------------------------------------------

    if not np.isfinite(
        predicted_price
    ):

        raise ValueError(
            "Model returned an invalid prediction."
        )

    # -----------------------------------------------------
    # Price change
    # -----------------------------------------------------

    price_change = (
        predicted_price
        - current_price
    )

    # -----------------------------------------------------
    # Percentage change
    # -----------------------------------------------------

    if current_price != 0:

        percentage_change = (
            price_change
            / current_price
        ) * 100

    else:

        percentage_change = 0

    # -----------------------------------------------------
    # Direction
    # -----------------------------------------------------

    if predicted_price > current_price:

        direction = "Bullish"

    elif predicted_price < current_price:

        direction = "Bearish"

    else:

        direction = "Neutral"

    # -----------------------------------------------------
    # Result
    # -----------------------------------------------------

    result = {

        "symbol": symbol.upper(),

        "current_price": round(
            current_price,
            2
        ),

        "predicted_price": round(
            predicted_price,
            2
        ),

        "change": round(
            price_change,
            2
        ),

        "change_percent": round(
            percentage_change,
            2
        ),

        "direction": direction,

        "model": "Random Forest",

        "horizon": "Next Trading Day",

    }

    return result


# =========================================================
# COMMAND LINE TEST
# =========================================================

if __name__ == "__main__":

    try:

        result = predict_stock(
            "RELIANCE.NS"
        )

        print()
        print(
            "========================================"
        )
        print(
            "       AI STOCK PREDICTION"
        )
        print(
            "========================================"
        )

        for key, value in result.items():

            print(
                f"{key:20}: {value}"
            )

        print(
            "========================================"
        )

    except Exception as e:

        print()
        print(
            "========================================"
        )
        print(
            "PREDICTION ERROR"
        )
        print(
            "========================================"
        )

        print(
            str(e)
        )

        raise