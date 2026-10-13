import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";
import "./StockChart.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const PERIOD_CONFIG = {
  "1D": {
    range: "1d",
    interval: "5m",
  },
  "1W": {
    range: "5d",
    interval: "15m",
  },
  "1M": {
    range: "1mo",
    interval: "1d",
  },
  "3M": {
    range: "3mo",
    interval: "1d",
  },
  "1Y": {
    range: "1y",
    interval: "1d",
  },
  "5Y": {
    range: "5y",
    interval: "1wk",
  },
};

function StockChart({ symbol = "RELIANCE" }) {
  const chartContainerRef = useRef(null);

  const [activePeriod, setActivePeriod] = useState("1D");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    let chart = null;
    let resizeObserver = null;

    const loadChart = async () => {
      setLoading(true);
      setError("");

      try {
        const yahooSymbol =
          symbol.endsWith(".NS") || symbol.endsWith(".BO")
            ? symbol
            : `${symbol}.NS`;

        const config = PERIOD_CONFIG[activePeriod];

        const url =
          `${API_BASE_URL}/api/stocks/` +
          `${encodeURIComponent(yahooSymbol)}` +
          `?range=${config.range}` +
          `&interval=${config.interval}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Backend error:", errorText);
          throw new Error(`Backend returned ${response.status}`);
        }

        const result = await response.json();

        if (!result.data || result.data.length === 0) {
          throw new Error("No chart data received");
        }

        const validData = result.data.filter(
          (item) =>
            Number.isFinite(Number(item.time)) &&
            Number.isFinite(Number(item.open)) &&
            Number.isFinite(Number(item.high)) &&
            Number.isFinite(Number(item.low)) &&
            Number.isFinite(Number(item.close))
        );

        if (validData.length === 0) {
          throw new Error("Invalid chart data");
        }

        if (chartContainerRef.current) {
          chartContainerRef.current.innerHTML = "";
        }

        chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: 430,

          layout: {
            background: {
              color: "#ffffff",
            },
            textColor: "#64748b",
            fontFamily:
              "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          },

          grid: {
            vertLines: {
              color: "#f1f5f9",
            },
            horzLines: {
              color: "#f1f5f9",
            },
          },

          crosshair: {
            mode: 1,

            vertLine: {
              color: "#94a3b8",
              width: 1,
              style: 2,
              labelBackgroundColor: "#0f172a",
            },

            horzLine: {
              color: "#94a3b8",
              width: 1,
              style: 2,
              labelBackgroundColor: "#0f172a",
            },
          },

          rightPriceScale: {
            borderColor: "#e2e8f0",

            scaleMargins: {
              top: 0.05,
              bottom: 0.20,
            },

            entireTextOnly: false,
          },

          timeScale: {
            borderColor: "#e2e8f0",

            timeVisible:
              activePeriod === "1D" ||
              activePeriod === "1W",

            secondsVisible: false,

            rightOffset: 5,

            barSpacing:
              activePeriod === "1D" ? 8 : 6,

            minBarSpacing: 2,
          },

          localization: {
            priceFormatter: (price) =>
              `₹${price.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
          },

          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: true,
          },

          handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
          },
        });

        // ================= CANDLE =================

        const candleSeries = chart.addSeries(
          CandlestickSeries,
          {
            upColor: "#16a34a",
            downColor: "#dc2626",

            borderUpColor: "#16a34a",
            borderDownColor: "#dc2626",

            wickUpColor: "#16a34a",
            wickDownColor: "#dc2626",
          }
        );

        candleSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.05,
            bottom: 0.20,
          },
        });

        // ================= VOLUME =================

        const volumeSeries = chart.addSeries(
          HistogramSeries,
          {
            priceFormat: {
              type: "volume",
            },

            priceScaleId: "volume",

            lastValueVisible: false,
            priceLineVisible: false,
          }
        );

        chart.priceScale("volume").applyOptions({
          scaleMargins: {
            top: 0.85,
            bottom: 0,
          },

          borderVisible: false,
        });

        // ================= CANDLE DATA =================

        candleSeries.setData(
          validData.map((item) => ({
            time: Number(item.time),
            open: Number(item.open),
            high: Number(item.high),
            low: Number(item.low),
            close: Number(item.close),
          }))
        );

        // ================= VOLUME DATA =================

        volumeSeries.setData(
          validData.map((item) => ({
            time: Number(item.time),
            value: Number(item.volume || 0),

            color:
              Number(item.close) >= Number(item.open)
                ? "rgba(22, 163, 74, 0.28)"
                : "rgba(220, 38, 38, 0.28)",
          }))
        );

        chart.timeScale().fitContent();

        // ================= RESIZE =================

        resizeObserver = new ResizeObserver(() => {
          if (
            chart &&
            chartContainerRef.current
          ) {
            chart.applyOptions({
              width:
                chartContainerRef.current.clientWidth,
            });
          }
        });

        resizeObserver.observe(
          chartContainerRef.current
        );
      } catch (err) {
        console.error("Chart error:", err);

        setError(
          err.message || "Unable to load chart"
        );
      } finally {
        setLoading(false);
      }
    };

    loadChart();

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      if (chart) {
        chart.remove();
      }
    };
  }, [symbol, activePeriod]);

  const cleanSymbol = symbol
    .replace(".NS", "")
    .replace(".BO", "");

  return (
    <div className="stock-chart-wrapper">

      {/* CHART TOOLBAR */}

      <div className="stock-chart-toolbar">

        <div className="chart-periods">
          {Object.keys(PERIOD_CONFIG).map(
            (period) => (
              <button
                key={period}
                type="button"
                onClick={() =>
                  setActivePeriod(period)
                }
                className={
                  activePeriod === period
                    ? "chart-period active"
                    : "chart-period"
                }
              >
                {period}
              </button>
            )
          )}
        </div>

        <div className="chart-symbol">
          <span className="chart-symbol-dot" />
          {cleanSymbol}
          <span className="chart-symbol-market">
            NSE
          </span>
        </div>
      </div>

      {/* CHART */}

      <div className="stock-chart-container">

        {loading && (
          <div className="chart-overlay">
            <div className="chart-loader">
              <div className="chart-spinner" />

              <span>
                Loading market data...
              </span>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="chart-overlay">
            <div className="chart-error">

              <div className="chart-error-icon">
                !
              </div>

              <p className="chart-error-title">
                Unable to load chart
              </p>

              <p className="chart-error-message">
                {error}
              </p>

              <p className="chart-error-help">
                Check that FastAPI is running
                on port 8000.
              </p>

            </div>
          </div>
        )}

        <div
          ref={chartContainerRef}
          className="stock-chart-canvas"
        />
      </div>

      {/* CHART FOOTER */}

      <div className="stock-chart-footer">

        <div className="chart-footer-left">
          <span className="chart-footer-dot" />
          <span>
            Candlestick
          </span>

          <span className="chart-footer-separator">
            |
          </span>

          <span>
            Volume
          </span>
        </div>

        <div className="chart-footer-right">
          Scroll to zoom
          <span>•</span>
          Drag to move
        </div>

      </div>
    </div>
  );
}

export default StockChart;