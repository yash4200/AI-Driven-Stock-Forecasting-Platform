import { useEffect, useState } from "react";
import "./TechnicalAnalysis.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function TechnicalAnalysis({ symbol }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;

    const fetchTechnicalData = async () => {
      setLoading(true);
      setError("");

      try {
        const yahooSymbol =
          symbol.endsWith(".NS") || symbol.endsWith(".BO")
            ? symbol
            : `${symbol}.NS`;

        const response = await fetch(
          `${API_BASE_URL}/api/stocks/${encodeURIComponent(
            yahooSymbol
          )}?range=1y&interval=1d`
        );

        if (!response.ok) {
          throw new Error("Unable to fetch stock data");
        }

        const result = await response.json();

        const rows =
          result.data ||
          result.history ||
          result.prices ||
          result;

        if (!Array.isArray(rows) || rows.length < 20) {
          throw new Error("Not enough historical data");
        }

        const cleanData = rows
          .map((item) => ({
            close: Number(
              item.Close ??
              item.close ??
              item.close_price
            ),
          }))
          .filter((item) => Number.isFinite(item.close));

        if (cleanData.length < 20) {
          throw new Error("Not enough valid price data");
        }

        const closes = cleanData.map((item) => item.close);

        const sma = (values, period) => {
          if (values.length < period) return null;

          const last = values.slice(-period);

          return (
            last.reduce((sum, value) => sum + value, 0) /
            period
          );
        };

        const ema = (values, period) => {
          if (values.length < period) return null;

          const multiplier = 2 / (period + 1);

          let emaValue =
            values
              .slice(0, period)
              .reduce((sum, value) => sum + value, 0) /
            period;

          for (let i = period; i < values.length; i++) {
            emaValue =
              (values[i] - emaValue) * multiplier +
              emaValue;
          }

          return emaValue;
        };

        const calculateRSI = (values, period = 14) => {
          if (values.length <= period) return null;

          let gains = 0;
          let losses = 0;

          for (let i = 1; i <= period; i++) {
            const change = values[i] - values[i - 1];

            if (change > 0) {
              gains += change;
            } else {
              losses += Math.abs(change);
            }
          }

          let averageGain = gains / period;
          let averageLoss = losses / period;

          for (let i = period + 1; i < values.length; i++) {
            const change = values[i] - values[i - 1];

            const gain = Math.max(change, 0);
            const loss = Math.max(-change, 0);

            averageGain =
              (averageGain * (period - 1) + gain) /
              period;

            averageLoss =
              (averageLoss * (period - 1) + loss) /
              period;
          }

          if (averageLoss === 0) return 100;

          const rs = averageGain / averageLoss;

          return 100 - 100 / (1 + rs);
        };

        const calculateMACD = (values) => {
          const ema12 = ema(values, 12);
          const ema26 = ema(values, 26);

          if (ema12 === null || ema26 === null) {
            return null;
          }

          return ema12 - ema26;
        };

        const currentPrice = closes[closes.length - 1];

        const sma20 = sma(closes, 20);
        const sma50 = sma(closes, 50);
        const ema20 = ema(closes, 20);
        const rsi = calculateRSI(closes, 14);
        const macd = calculateMACD(closes);

        let trend = "Neutral";

        if (sma20 && sma50) {
          if (
            currentPrice > sma20 &&
            sma20 > sma50
          ) {
            trend = "Bullish";
          } else if (
            currentPrice < sma20 &&
            sma20 < sma50
          ) {
            trend = "Bearish";
          }
        }

        let rsiSignal = "Neutral";

        if (rsi >= 70) {
          rsiSignal = "Overbought";
        } else if (rsi <= 30) {
          rsiSignal = "Oversold";
        } else if (rsi > 50) {
          rsiSignal = "Bullish";
        } else {
          rsiSignal = "Bearish";
        }

        let macdSignal = "Neutral";

        if (macd > 0) {
          macdSignal = "Bullish";
        } else if (macd < 0) {
          macdSignal = "Bearish";
        }

        if (!cancelled) {
          setData({
            currentPrice,
            sma20,
            sma50,
            ema20,
            rsi,
            macd,
            trend,
            rsiSignal,
            macdSignal,
          });
        }
      } catch (err) {
        console.error(
          "Technical analysis error:",
          err
        );

        if (!cancelled) {
          setError(
            err.message ||
              "Technical analysis unavailable"
          );
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTechnicalData();

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return "--";
    }

    return Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getSignalClass = (signal) => {
    if (
      signal === "Bullish" ||
      signal === "Oversold"
    ) {
      return "ta-signal-positive";
    }

    if (
      signal === "Bearish" ||
      signal === "Overbought"
    ) {
      return "ta-signal-negative";
    }

    return "ta-signal-neutral";
  };

  return (
    <div className="technical-card">

      {/* Header */}
      <div className="technical-header">

        <div>
          <div className="technical-title-row">
            <div className="technical-icon">
              ↗
            </div>

            <div>
              <h2>Technical Analysis</h2>

              <p>
                Technical indicators for{" "}
                <strong>{symbol}</strong>
              </p>
            </div>
          </div>
        </div>

        <div
          className={`trend-badge ${
            data
              ? getSignalClass(data.trend)
              : "ta-signal-neutral"
          }`}
        >
          <span className="trend-dot"></span>

          {loading
            ? "Calculating"
            : data?.trend || "Neutral"}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="technical-loading">
          <div className="loading-spinner"></div>

          <div>
            <strong>
              Calculating indicators
            </strong>

            <span>
              Processing historical market data...
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="technical-error">
          <div className="error-icon">!</div>

          <div>
            <strong>
              Technical analysis unavailable
            </strong>

            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Data */}
      {!loading && data && (
        <div className="technical-content">

          {/* Current Price */}
          <div className="current-price-section">
            <div>
              <span className="metric-label">
                Current Price
              </span>

              <div className="current-price">
                ₹{formatValue(data.currentPrice)}
              </div>
            </div>

            <div className="market-status">
              <span></span>
              Market Data
            </div>
          </div>

          {/* Moving Averages */}
          <div className="section-heading">
            <span>Moving Averages</span>
            <small>1Y historical</small>
          </div>

          <div className="indicator-grid">

            <Indicator
              title="SMA 20"
              value={`₹${formatValue(data.sma20)}`}
              description="20-day average"
            />

            <Indicator
              title="SMA 50"
              value={`₹${formatValue(data.sma50)}`}
              description="50-day average"
            />

            <Indicator
              title="EMA 20"
              value={`₹${formatValue(data.ema20)}`}
              description="20-day exponential"
            />

            <Indicator
              title="MACD"
              value={formatValue(data.macd)}
              description="Trend momentum"
              valueClass={
                data.macd > 0
                  ? "positive-value"
                  : "negative-value"
              }
            />

          </div>

          {/* Signals */}
          <div className="section-heading signals-heading">
            <span>Market Signals</span>
            <small>Technical view</small>
          </div>

          <div className="signal-grid">

            <Signal
              title="Overall Trend"
              value={data.trend}
              description="Price vs moving averages"
              className={getSignalClass(
                data.trend
              )}
            />

            <Signal
              title="RSI (14)"
              value={formatValue(data.rsi)}
              secondary={data.rsiSignal}
              description="Momentum indicator"
              className={getSignalClass(
                data.rsiSignal
              )}
            />

            <Signal
              title="MACD Signal"
              value={data.macdSignal}
              description="Momentum direction"
              className={getSignalClass(
                data.macdSignal
              )}
            />

          </div>

          {/* RSI Bar */}
          <div className="rsi-section">

            <div className="rsi-header">
              <span>RSI (14)</span>
              <strong>
                {formatValue(data.rsi)}
              </strong>
            </div>

            <div className="rsi-track">
              <div className="rsi-zone-low"></div>
              <div className="rsi-zone-mid"></div>
              <div className="rsi-zone-high"></div>

              <div
                className="rsi-marker"
                style={{
                  left: `${Math.min(
                    100,
                    Math.max(
                      0,
                      data.rsi || 0
                    )
                  )}%`,
                }}
              ></div>
            </div>

            <div className="rsi-labels">
              <span>Oversold</span>
              <span>Neutral</span>
              <span>Overbought</span>
            </div>

          </div>

          {/* Disclaimer */}
          <div className="technical-disclaimer">
            <span>ⓘ</span>

            <p>
              Technical indicators are calculated
              from historical market data. They are
              informational only and are not financial
              advice.
            </p>
          </div>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   INDICATOR CARD
   ========================================================= */

function Indicator({
  title,
  value,
  description,
  valueClass = "",
}) {
  return (
    <div className="indicator-card">

      <div className="indicator-top">
        <span>{title}</span>

        <div className="indicator-dot"></div>
      </div>

      <strong className={valueClass}>
        {value}
      </strong>

      <small>{description}</small>

    </div>
  );
}

/* =========================================================
   SIGNAL CARD
   ========================================================= */

function Signal({
  title,
  value,
  secondary,
  description,
  className,
}) {
  return (
    <div className="signal-card">

      <div className="signal-card-header">
        <span>{title}</span>

        <div
          className={`signal-status-dot ${className}`}
        ></div>
      </div>

      <div className="signal-main-row">

        <strong>{value}</strong>

        {secondary && (
          <span
            className={`signal-pill ${className}`}
          >
            {secondary}
          </span>
        )}

      </div>

      <small>{description}</small>

    </div>
  );
}

export default TechnicalAnalysis;