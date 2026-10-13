import { useEffect, useState } from "react";
import "./AIForecast.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function AIForecast({ symbol }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;

    const fetchForecast = async () => {
      setLoading(true);
      setError("");
      setForecast(null);

      try {
        const yahooSymbol =
          symbol.endsWith(".NS") || symbol.endsWith(".BO")
            ? symbol
            : `${symbol}.NS`;

        const url = `${API_BASE_URL}/api/forecast/${encodeURIComponent(
          yahooSymbol
        )}`;

        console.log("AI Forecast API:", url);

        const response = await fetch(url);

        const result = await response.json();

        console.log("AI Forecast Response:", result);

        if (!response.ok) {
          throw new Error(
            result?.error ||
              result?.detail ||
              "Forecast unavailable"
          );
        }

        if (result?.success === false) {
          throw new Error(
            result?.error ||
              result?.detail ||
              "Forecast unavailable"
          );
        }

        /*
          Backend may return either:

          {
            success: true,
            data: {
              current_price: ...
            }
          }

          OR directly:

          {
            success: true,
            current_price: ...
          }

          Handle both.
        */
        const forecastData = result?.data || result;

        if (
          forecastData?.current_price === undefined &&
          forecastData?.predicted_price === undefined
        ) {
          throw new Error(
            "Invalid forecast response from backend"
          );
        }

        if (!cancelled) {
          setForecast(forecastData);
        }
      } catch (err) {
        console.error("Forecast error:", err);

        if (!cancelled) {
          setForecast(null);
          setError(
            err?.message ||
              "Unable to load AI forecast."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchForecast();

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  /*
    Backend can return:
    Bullish / Bearish / Neutral
    OR
    UP / DOWN
  */
  const direction = String(
    forecast?.direction || ""
  ).toLowerCase();

  const isUp =
    direction === "up" ||
    direction === "bullish" ||
    direction === "positive";

  const isDown =
    direction === "down" ||
    direction === "bearish" ||
    direction === "negative";

  const formatPrice = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "--";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "--";
    }

    return number.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatChange = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "--";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "--";
    }

    return `${number >= 0 ? "+" : ""}${number.toFixed(
      2
    )}`;
  };

  const formatPercent = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "--";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "--";
    }

    return `${number >= 0 ? "+" : ""}${number.toFixed(
      2
    )}%`;
  };

  const modelName =
    forecast?.model || "Random Forest";

  const isLSTM =
    modelName.toLowerCase().includes("lstm") ||
    modelName.toLowerCase().includes("deep");

  const horizon =
    forecast?.horizon ||
    forecast?.forecast_horizon ||
    "Next Trading Day";

  return (
    <div className="ai-forecast-card">

      {/* HEADER */}

      <div className="ai-forecast-header">

        <div className="ai-title-wrapper">

          <div className="ai-icon">
            ✦
          </div>

          <div>
            <div className="ai-title-row">

              <h2>StockAI Forecast</h2>

              <span className="ai-live-badge">
                AI
              </span>

            </div>

            <p>
              Machine learning based price forecast
            </p>
          </div>

        </div>

        <div className="ai-model-badge">
          {isLSTM ? "LSTM" : "ML"}
        </div>

      </div>

      {/* LOADING */}

      {loading && (
        <div className="ai-loading">

          <div className="ai-loading-animation">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div>
            <strong>
              Running AI model
            </strong>

            <p>
              Processing {symbol} historical data...
            </p>
          </div>

        </div>
      )}

      {/* ERROR */}

      {!loading && error && (
        <div className="ai-error">

          <div className="ai-error-icon">
            !
          </div>

          <div>

            <strong>
              Forecast unavailable
            </strong>

            <p>
              {error}
            </p>

            <small>
              The forecasting service could not return
              a valid model output.
            </small>

          </div>

        </div>
      )}

      {/* FORECAST */}

      {!loading && forecast && !error && (
        <div className="ai-forecast-content">

          {/* MAIN PRICE */}

          <div className="forecast-main">

            <div className="forecast-price-block">

              <span className="forecast-label">
                Current Price
              </span>

              <strong className="forecast-current-price">
                ₹{formatPrice(
                  forecast.current_price
                )}
              </strong>

            </div>

            <div className="forecast-arrow">
              →
            </div>

            <div className="forecast-price-block">

              <span className="forecast-label">
                Predicted Price
              </span>

              <strong className="forecast-predicted-price">
                ₹{formatPrice(
                  forecast.predicted_price
                )}
              </strong>

            </div>

          </div>

          {/* DIRECTION */}

          <div
            className={`forecast-direction ${
              isUp
                ? "forecast-up"
                : isDown
                ? "forecast-down"
                : "forecast-neutral"
            }`}
          >

            <div className="direction-icon">

              {isUp
                ? "↑"
                : isDown
                ? "↓"
                : "→"}

            </div>

            <div className="direction-text">

              <span>
                Model Direction
              </span>

              <strong>
                {forecast.direction || "Neutral"}
              </strong>

            </div>

            <div className="direction-change">

              <strong>
                {formatChange(
                  forecast.change
                )}
              </strong>

              <span>
                {formatPercent(
                  forecast.change_percent
                )}
              </span>

            </div>

          </div>

          {/* SUMMARY */}

          <div className="forecast-section-title">

            <span>
              Forecast Summary
            </span>

            <small>
              Model output
            </small>

          </div>

          <div className="forecast-metrics">

            <Metric
              title="Expected Change"
              value={formatChange(
                forecast.change
              )}
              suffix="₹"
              positive={
                Number(forecast.change) >= 0
              }
              negative={
                Number(forecast.change) < 0
              }
            />

            <Metric
              title="Change %"
              value={formatPercent(
                forecast.change_percent
              )}
              positive={
                Number(
                  forecast.change_percent
                ) >= 0
              }
              negative={
                Number(
                  forecast.change_percent
                ) < 0
              }
            />

            <Metric
              title="Forecast Horizon"
              value={horizon}
            />

          </div>

          {/* MODEL */}

          <div className="ai-model-section">

            <div className="ai-model-info">

              <div className="ai-model-symbol">
                AI
              </div>

              <div>

                <span>
                  Forecasting Model
                </span>

                <strong>
                  {modelName}
                </strong>

              </div>

            </div>

            {isLSTM && (
              <div className="deep-learning-tag">
                Deep Learning
              </div>
            )}

          </div>

          {/* METHODOLOGY */}

          <div className="ai-methodology">

            <div className="methodology-icon">
              ✓
            </div>

            <div>

              <strong>
                Historical market data
              </strong>

              <p>
                The model uses historical price
                patterns and engineered market
                features to generate the forecast.
              </p>

            </div>

          </div>

          {/* DISCLAIMER */}

          <div className="ai-disclaimer">

            <span>
              ⓘ
            </span>

            <p>
              This forecast is generated by a
              machine-learning model for educational
              and demonstration purposes. It should
              not be treated as financial advice or a
              guaranteed future price.
            </p>

          </div>

        </div>
      )}

    </div>
  );
}


/* =========================================================
   METRIC COMPONENT
   ========================================================= */

function Metric({
  title,
  value,
  suffix,
  positive,
  negative,
}) {
  let valueClass = "";

  if (positive) {
    valueClass = "metric-positive";
  }

  if (negative) {
    valueClass = "metric-negative";
  }

  return (
    <div className="forecast-metric">

      <span>
        {title}
      </span>

      <strong className={valueClass}>

        {suffix && value !== "--"
          ? `${value}${suffix}`
          : value}

      </strong>

    </div>
  );
}

export default AIForecast;