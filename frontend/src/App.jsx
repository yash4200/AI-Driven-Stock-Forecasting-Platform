import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./index.css";
import "./App.css";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StockChart from "./components/StockChart";
import StockSearch from "./components/StockSearch";
import StockDetails from "./pages/StockDetails";
import AIForecast from "./components/AIForecast";
import TechnicalAnalysis from "./components/TechnicalAnalysis";

const API_BASE_URL = "http://127.0.0.1:8000";

// =====================================================
// DEFAULT WATCHLISTS
// =====================================================

const DEFAULT_WATCHLISTS = [
  {
    id: 1,
    name: "Intraday",
    stocks: ["RELIANCE", "TCS", "HDFCBANK"],
  },
  {
    id: 2,
    name: "Swing",
    stocks: ["TITAN", "HAL", "LT"],
  },
  {
    id: 3,
    name: "Long Term",
    stocks: ["INFY", "ITC", "ICICIBANK"],
  },
];

// =====================================================
// FALLBACK STOCK NAMES
// =====================================================

const FALLBACK_STOCKS = {
  RELIANCE: "Reliance Industries",
  TCS: "Tata Consultancy Services",
  INFY: "Infosys",
  HDFCBANK: "HDFC Bank",
  ICICIBANK: "ICICI Bank",
  SBIN: "State Bank of India",
  ITC: "ITC Limited",
  LT: "Larsen & Toubro",
  TITAN: "Titan Company",
  HAL: "Hindustan Aeronautics",
  BHARTIARTL: "Bharti Airtel",
  AXISBANK: "Axis Bank",
  KOTAKBANK: "Kotak Mahindra Bank",
  MARUTI: "Maruti Suzuki India",
  "M&M": "Mahindra & Mahindra",
  SUNPHARMA: "Sun Pharmaceutical Industries",
  TATASTEEL: "Tata Steel",
  TATAMOTORS: "Tata Motors",
  ADANIENT: "Adani Enterprises",
  ADANIPORTS: "Adani Ports",
  NTPC: "NTPC",
  POWERGRID: "Power Grid Corporation",
  ONGC: "Oil & Natural Gas Corporation",
  COALINDIA: "Coal India",
  HINDUNILVR: "Hindustan Unilever",
  ASIANPAINT: "Asian Paints",
  ULTRACEMCO: "UltraTech Cement",
  BAJFINANCE: "Bajaj Finance",
  BAJAJFINSV: "Bajaj Finserv",
  WIPRO: "Wipro",
  TECHM: "Tech Mahindra",
  HCLTECH: "HCL Technologies",
  DRREDDY: "Dr. Reddy's Laboratories",
  CIPLA: "Cipla",
  EICHERMOT: "Eicher Motors",
  HEROMOTOCO: "Hero MotoCorp",
  TVSMOTOR: "TVS Motor Company",
  BEL: "Bharat Electronics",
  BHEL: "Bharat Heavy Electricals",
  TRENT: "Trent",
};

// =====================================================
// TOP NAV
// =====================================================

const MAIN_NAV = [
  "Watchlist",
  "Portfolio",
  "Orders",
  "Funds",
  "Markets",
  "Options",
  "Automate",
  "More",
];

// =====================================================
// STOCK TABS
// =====================================================

const STOCK_TABS = [
  "Overview",
  "Chart",
  "Technicals",
  "Option Chain",
  "Futures",
  "Fundamentals",
  "Shareholdings",
  "Corporate Details",
  "News",
];

// =====================================================
// UTILS
// =====================================================

function cleanSymbol(symbol = "") {
  return String(symbol)
    .replace(".NS", "")
    .replace(".BO", "")
    .trim()
    .toUpperCase();
}

function toYahooSymbol(symbol = "") {
  const clean = cleanSymbol(symbol);

  if (
    clean.endsWith(".NS") ||
    clean.endsWith(".BO")
  ) {
    return clean;
  }

  return `${clean}.NS`;
}

function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatSigned(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${number >= 0 ? "+" : ""}${number.toFixed(2)}`;
}

function getStockName(symbol, stockNames) {
  const clean = cleanSymbol(symbol);

  return (
    stockNames[clean] ||
    FALLBACK_STOCKS[clean] ||
    clean
  );
}

// =====================================================
// EXTRACT API DATA
// =====================================================

function extractStockData(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.history)) {
    return result.history;
  }

  if (Array.isArray(result?.prices)) {
    return result.prices;
  }

  return [];
}

function getCandleValue(candle, names) {
  for (const name of names) {
    if (
      candle &&
      candle[name] !== undefined &&
      candle[name] !== null
    ) {
      const value = Number(candle[name]);

      if (Number.isFinite(value)) {
        return value;
      }
    }
  }

  return null;
}

// =====================================================
// APP
// =====================================================

function App() {
  // ===================================================
  // AUTH
  // ===================================================

  const [page, setPage] = useState("login");

  // ===================================================
  // NAVIGATION
  // ===================================================

  const [activeMenu, setActiveMenu] =
    useState("Watchlist");

  const [activeTab, setActiveTab] =
    useState("Overview");

  // ===================================================
  // ACTIVE STOCK
  // ===================================================

  const [activeStock, setActiveStock] =
    useState("RELIANCE");

  // ===================================================
  // STOCK DATA
  // ===================================================

  const [stockInfo, setStockInfo] =
    useState(null);

  const [stockLoading, setStockLoading] =
    useState(false);

  const [stockError, setStockError] =
    useState("");

  // ===================================================
  // STOCK NAMES
  // ===================================================

  const [stockNames, setStockNames] =
    useState({});

  // ===================================================
  // WATCHLISTS
  // ===================================================

  const [watchlists, setWatchlists] =
    useState(DEFAULT_WATCHLISTS);

  const [activeWatchlistId, setActiveWatchlistId] =
    useState(1);

  const [showWatchlistManager, setShowWatchlistManager] =
    useState(false);

  const [newWatchlistName, setNewWatchlistName] =
    useState("");

  // ===================================================
  // UI
  // ===================================================

  const [sidebarTab, setSidebarTab] =
    useState("My Watchlist");

  const [sortAscending, setSortAscending] =
    useState(true);

  // ===================================================
  // ACTIVE WATCHLIST
  // ===================================================

  const activeWatchlist = useMemo(() => {
    return (
      watchlists.find(
        (list) =>
          list.id === activeWatchlistId
      ) || watchlists[0]
    );
  }, [
    watchlists,
    activeWatchlistId,
  ]);

  const activeWatchlistStocks =
    activeWatchlist?.stocks || [];

  // ===================================================
  // ACTIVE STOCK HELPERS
  // ===================================================

  const yahooSymbol =
    toYahooSymbol(activeStock);

  const activeStockName =
    getStockName(
      activeStock,
      stockNames
    );

  const isPositive =
    Number(stockInfo?.percent || 0) >= 0;

  // ===================================================
  // FETCH STOCK
  // ===================================================

  useEffect(() => {
    if (!activeStock) {
      return;
    }

    let cancelled = false;

    const fetchStockInfo = async () => {
      setStockLoading(true);
      setStockError("");

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/stocks/${encodeURIComponent(
              yahooSymbol
            )}?range=1d&interval=5m`
          );

        if (!response.ok) {
          throw new Error(
            `Unable to fetch ${activeStock}`
          );
        }

        const result =
          await response.json();

        const rawData =
          extractStockData(result);

        const data =
          rawData
            .map((item) => ({
              ...item,
              open: getCandleValue(
                item,
                ["open", "Open"]
              ),
              high: getCandleValue(
                item,
                ["high", "High"]
              ),
              low: getCandleValue(
                item,
                ["low", "Low"]
              ),
              close: getCandleValue(
                item,
                ["close", "Close"]
              ),
              volume: getCandleValue(
                item,
                ["volume", "Volume"]
              ),
            }))
            .filter(
              (item) =>
                Number.isFinite(
                  item.close
                )
            );

        if (!data.length) {
          throw new Error(
            "No stock data available"
          );
        }

        const latest =
          data[data.length - 1];

        const currentPrice =
          latest.close;

        const open =
          latest.open;

        const high =
          latest.high;

        const low =
          latest.low;

        // ---------------------------------------------
        // PREVIOUS CLOSE
        // ---------------------------------------------

        let previousClose =
          Number(
            result?.previousClose
          );

        if (
          !Number.isFinite(
            previousClose
          )
        ) {
          previousClose =
            Number(
              result?.previous_close
            );
        }

        if (
          !Number.isFinite(
            previousClose
          )
        ) {
          try {
            const quoteResponse =
              await fetch(
                `${API_BASE_URL}/api/stocks/${encodeURIComponent(
                  yahooSymbol
                )}/quote`
              );

            if (
              quoteResponse.ok
            ) {
              const quote =
                await quoteResponse.json();

              previousClose =
                Number(
                  quote?.previousClose
                );

              if (
                !Number.isFinite(
                  previousClose
                )
              ) {
                previousClose =
                  Number(
                    quote?.previous_close
                  );
              }
            }
          } catch {
            // fallback below
          }
        }

        if (
          !Number.isFinite(
            previousClose
          )
        ) {
          previousClose =
            currentPrice;
        }

        const change =
          currentPrice -
          previousClose;

        const percent =
          previousClose !== 0
            ? (change /
                previousClose) *
              100
            : 0;

        // ---------------------------------------------
        // 52 WEEK DATA IF BACKEND PROVIDES IT
        // ---------------------------------------------

        let week52High =
          Number(
            result?.week52High
          );

        let week52Low =
          Number(
            result?.week52Low
          );

        if (
          !Number.isFinite(
            week52High
          )
        ) {
          week52High =
            Number(
              result?.["52WeekHigh"]
            );
        }

        if (
          !Number.isFinite(
            week52Low
          )
        ) {
          week52Low =
            Number(
              result?.["52WeekLow"]
            );
        }

        // ---------------------------------------------
        // UPDATE STATE
        // ---------------------------------------------

        if (cancelled) {
          return;
        }

        setStockInfo({
          symbol:
            cleanSymbol(activeStock),

          yahooSymbol,

          fullName:
            activeStockName,

          price:
            currentPrice,

          change,

          percent,

          open,

          high,

          low,

          previousClose,

          week52High,

          week52Low,

          data,
        });
      } catch (error) {
        console.error(
          "Stock data error:",
          error
        );

        if (!cancelled) {
          setStockInfo(null);

          setStockError(
            "Unable to load stock data. Check whether the FastAPI backend is running."
          );
        }
      } finally {
        if (!cancelled) {
          setStockLoading(false);
        }
      }
    };

    fetchStockInfo();

    return () => {
      cancelled = true;
    };
  }, [
    activeStock,
    yahooSymbol,
    activeStockName,
  ]);

  // ===================================================
  // STOCK SELECT FROM SEARCH
  // ===================================================

  const handleStockSelect = (stock) => {
    if (!stock) {
      return;
    }

    const symbol = cleanSymbol(
      stock.symbol ||
        stock.ticker ||
        stock.name ||
        ""
    );

    if (!symbol) {
      return;
    }

    const name =
      stock.name ||
      stock.companyName ||
      FALLBACK_STOCKS[symbol] ||
      symbol;

    setStockNames((previous) => ({
      ...previous,
      [symbol]: name,
    }));

    setActiveStock(symbol);
    setActiveTab("Overview");
    setActiveMenu("Watchlist");

    // -----------------------------------------------
    // Add selected stock to active watchlist
    // -----------------------------------------------

    setWatchlists((previous) =>
      previous.map((list) => {
        if (
          list.id !==
          activeWatchlistId
        ) {
          return list;
        }

        if (
          list.stocks.includes(
            symbol
          )
        ) {
          return list;
        }

        return {
          ...list,
          stocks: [
            ...list.stocks,
            symbol,
          ],
        };
      })
    );
  };

  // ===================================================
  // WATCHLIST STOCK CLICK
  // ===================================================

  const handleWatchlistStockClick = (
    symbol
  ) => {
    setActiveStock(
      cleanSymbol(symbol)
    );

    setActiveTab("Overview");
  };

  // ===================================================
  // REMOVE STOCK
  // ===================================================

  const removeFromWatchlist = (
    symbol
  ) => {
    const clean =
      cleanSymbol(symbol);

    setWatchlists((previous) =>
      previous.map((list) =>
        list.id ===
        activeWatchlistId
          ? {
              ...list,
              stocks:
                list.stocks.filter(
                  (stock) =>
                    cleanSymbol(
                      stock
                    ) !== clean
                ),
            }
          : list
      )
    );

    if (
      cleanSymbol(
        activeStock
      ) === clean
    ) {
      const remaining =
        activeWatchlistStocks.filter(
          (stock) =>
            cleanSymbol(
              stock
            ) !== clean
        );

      if (
        remaining.length > 0
      ) {
        setActiveStock(
          cleanSymbol(
            remaining[0]
          )
        );
      }
    }
  };

  // ===================================================
  // CREATE WATCHLIST
  // ===================================================

  const createWatchlist = () => {
    const name =
      newWatchlistName.trim();

    if (!name) {
      return;
    }

    const exists =
      watchlists.some(
        (list) =>
          list.name.toLowerCase() ===
          name.toLowerCase()
      );

    if (exists) {
      window.alert(
        "Watchlist already exists."
      );
      return;
    }

    const newList = {
      id: Date.now(),
      name,
      stocks: [],
    };

    setWatchlists((previous) => [
      ...previous,
      newList,
    ]);

    setActiveWatchlistId(
      newList.id
    );

    setNewWatchlistName("");
    setShowWatchlistManager(false);
  };

  // ===================================================
  // RENAME WATCHLIST
  // ===================================================

  const renameWatchlist = (list) => {
    const name =
      window.prompt(
        "Enter new watchlist name:",
        list.name
      );

    if (!name?.trim()) {
      return;
    }

    const cleanName =
      name.trim();

    const duplicate =
      watchlists.some(
        (item) =>
          item.id !== list.id &&
          item.name.toLowerCase() ===
            cleanName.toLowerCase()
      );

    if (duplicate) {
      window.alert(
        "Watchlist already exists."
      );
      return;
    }

    setWatchlists((previous) =>
      previous.map((item) =>
        item.id === list.id
          ? {
              ...item,
              name: cleanName,
            }
          : item
      )
    );
  };

  // ===================================================
  // DELETE WATCHLIST
  // ===================================================

  const deleteWatchlist = (
    listId
  ) => {
    if (watchlists.length === 1) {
      window.alert(
        "At least one watchlist is required."
      );
      return;
    }

    const updated =
      watchlists.filter(
        (list) =>
          list.id !== listId
      );

    setWatchlists(updated);

    if (
      activeWatchlistId ===
      listId
    ) {
      const nextList =
        updated[0];

      setActiveWatchlistId(
        nextList.id
      );

      if (
        nextList.stocks.length
      ) {
        setActiveStock(
          cleanSymbol(
            nextList.stocks[0]
          )
        );
      }
    }
  };

  // ===================================================
  // CHANGE WATCHLIST
  // ===================================================

  const changeWatchlist = (
    list
  ) => {
    setActiveWatchlistId(
      list.id
    );

    if (list.stocks.length > 0) {
      setActiveStock(
        cleanSymbol(
          list.stocks[0]
        )
      );
    }
  };

  // ===================================================
  // SORT WATCHLIST
  // ===================================================

  const displayedStocks =
    useMemo(() => {
      const stocks = [
        ...activeWatchlistStocks,
      ];

      return stocks.sort((a, b) => {
        const nameA =
          getStockName(
            a,
            stockNames
          );

        const nameB =
          getStockName(
            b,
            stockNames
          );

        return sortAscending
          ? nameA.localeCompare(
              nameB
            )
          : nameB.localeCompare(
              nameA
            );
      });
    }, [
      activeWatchlistStocks,
      stockNames,
      sortAscending,
    ]);

  // ===================================================
  // AUTH
  // ===================================================

  if (page === "login") {
    return (
      <Login
        onLogin={() =>
          setPage("dashboard")
        }
        onSignup={() =>
          setPage("signup")
        }
      />
    );
  }

  if (page === "signup") {
    return (
      <Signup
        onSignup={() =>
          setPage("dashboard")
        }
        onLogin={() =>
          setPage("login")
        }
      />
    );
  }

  if (page === "stock-details") {
    return (
      <StockDetails
        onBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // ===================================================
  // MAIN TERMINAL
  // ===================================================

  return (
    <div className="stock-terminal">

      {/* ================================================= */}
      {/* TOP NAVBAR */}
      {/* ================================================= */}

      <header className="top-navbar">

        {/* LOGO */}

        <button
          className="brand-logo"
          onClick={() => {
            setActiveMenu(
              "Watchlist"
            );
            setActiveTab(
              "Overview"
            );
          }}
          title="StockAI Home"
        >
          <span>TF</span>
        </button>

        {/* MARKET INDEX */}

        <div className="market-index">

          <div>
            <p className="market-index-name">
              NIFTY 50
            </p>

            <p className="market-index-label">
              NSE Index
            </p>
          </div>

          <div className="market-index-value">
            <strong>
              24,175.65
            </strong>

            <span>
              +84.80
            </span>

            <span>
              (+0.35%)
            </span>
          </div>

        </div>

        {/* SEARCH */}

        <div className="top-search">
          <StockSearch
            onSelect={
              handleStockSelect
            }
          />
        </div>

        {/* DESKTOP NAV */}

        <nav className="desktop-nav">

          {MAIN_NAV.map(
            (item) => (
              <button
                key={item}
                className={
                  activeMenu === item
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  setActiveMenu(
                    item
                  )
                }
              >
                {item}
              </button>
            )
          )}

        </nav>

        {/* RIGHT ACTIONS */}

        <div className="top-actions">

          <button
            className="icon-button"
            title="Notifications"
          >
            🔔
          </button>

          <button
            className="profile-button"
            title="Profile"
          >
            Y
          </button>

        </div>

      </header>

      {/* ================================================= */}
      {/* TERMINAL BODY */}
      {/* ================================================= */}

      <div className="terminal-body">

        {/* ================================================= */}
        {/* SIDEBAR */}
        {/* ================================================= */}

        <aside className="watchlist-sidebar">

          {/* SIDEBAR TABS */}

          <div className="sidebar-tabs">

            {[
              "My Watchlist",
              "Readymade",
              "Smart Watchlist",
            ].map(
              (item) => (
                <button
                  key={item}
                  className={
                    sidebarTab ===
                    item
                      ? "sidebar-tab active"
                      : "sidebar-tab"
                  }
                  onClick={() =>
                    setSidebarTab(
                      item
                    )
                  }
                >
                  {item}
                </button>
              )
            )}

          </div>

          {/* MY WATCHLIST */}

          {sidebarTab ===
          "My Watchlist" ? (

            <>

              {/* WATCHLIST MANAGER */}

              <div className="watchlist-manager">

                <div className="section-heading">

                  <span>
                    MY WATCHLISTS
                  </span>

                  <button
                    onClick={() =>
                      setShowWatchlistManager(
                        !showWatchlistManager
                      )
                    }
                  >
                    + Create
                  </button>

                </div>

                {showWatchlistManager && (
                  <div className="create-watchlist">

                    <input
                      value={
                        newWatchlistName
                      }
                      onChange={(e) =>
                        setNewWatchlistName(
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key ===
                          "Enter"
                        ) {
                          createWatchlist();
                        }

                        if (
                          e.key ===
                          "Escape"
                        ) {
                          setShowWatchlistManager(
                            false
                          );
                        }
                      }}
                      placeholder="Watchlist name"
                      autoFocus
                    />

                    <button
                      onClick={
                        createWatchlist
                      }
                    >
                      Add
                    </button>

                  </div>
                )}

                {/* WATCHLIST PILLS */}

                <div className="watchlist-pills">

                  {watchlists.map(
                    (list) => (
                      <div
                        key={list.id}
                        className={
                          activeWatchlistId ===
                          list.id
                            ? "watchlist-pill active"
                            : "watchlist-pill"
                        }
                      >

                        <button
                          onClick={() =>
                            changeWatchlist(
                              list
                            )
                          }
                          className="watchlist-pill-main"
                        >
                          {list.name}

                          <span>
                            {
                              list
                                .stocks
                                .length
                            }
                          </span>
                        </button>

                        <button
                          onClick={() =>
                            renameWatchlist(
                              list
                            )
                          }
                          className="watchlist-action"
                          title="Rename"
                        >
                          ✎
                        </button>

                        {watchlists.length >
                          1 && (
                          <button
                            onClick={() =>
                              deleteWatchlist(
                                list.id
                              )
                            }
                            className="watchlist-action"
                            title="Delete"
                          >
                            ×
                          </button>
                        )}

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* TOOLBAR */}

              <div className="watchlist-toolbar">

                <div>
                  <strong>
                    {activeWatchlist?.name ||
                      "Watchlist"}
                  </strong>

                  <span>
                    {activeWatchlistStocks.length}{" "}
                    stocks
                  </span>
                </div>

                <div className="toolbar-actions">

                  <button
                    onClick={() => {
                      const search =
                        document.querySelector(
                          'input[placeholder="Search stocks..."]'
                        );

                      search?.focus();
                    }}
                    title="Add Stock"
                  >
                    ⊕
                  </button>

                  <button
                    onClick={() =>
                      setSortAscending(
                        (value) =>
                          !value
                      )
                    }
                    title="Sort"
                  >
                    {sortAscending
                      ? "A↓"
                      : "Z↓"}
                  </button>

                  <button
                    onClick={() =>
                      setShowWatchlistManager(
                        true
                      )
                    }
                    title="Manage"
                  >
                    ⋮
                  </button>

                </div>

              </div>

              {/* STOCK LIST */}

              <div className="watchlist-count">
                {displayedStocks.length}{" "}
                Stocks
              </div>

              <div className="watchlist-stocks">

                {displayedStocks.map(
                  (symbol) => {
                    const clean =
                      cleanSymbol(
                        symbol
                      );

                    const name =
                      getStockName(
                        clean,
                        stockNames
                      );

                    const selected =
                      clean ===
                      cleanSymbol(
                        activeStock
                      );

                    return (
                      <div
                        key={symbol}
                        className={
                          selected
                            ? "watch-stock selected"
                            : "watch-stock"
                        }
                      >

                        <button
                          className="watch-stock-main"
                          onClick={() =>
                            handleWatchlistStockClick(
                              clean
                            )
                          }
                        >

                          <div className="watch-stock-left">

                            <div className="stock-symbol-row">

                              <strong>
                                {clean}
                              </strong>

                              <span>
                                NSE
                              </span>

                            </div>

                            <p>
                              {name}
                            </p>

                          </div>

                          <div className="watch-stock-right">

                            {selected &&
                            stockInfo ? (
                              <>
                                <strong>
                                  {formatPrice(
                                    stockInfo.price
                                  )}
                                </strong>

                                <span
                                  className={
                                    stockInfo.percent >=
                                    0
                                      ? "positive"
                                      : "negative"
                                  }
                                >
                                  {formatSigned(
                                    stockInfo.change
                                  )}
                                  {" "}
                                  (
                                  {stockInfo.percent.toFixed(
                                    2
                                  )}
                                  %)
                                </span>
                              </>
                            ) : (
                              <span className="view-label">
                                View
                              </span>
                            )}

                          </div>

                        </button>

                        <button
                          className="remove-stock"
                          onClick={() =>
                            removeFromWatchlist(
                              clean
                            )
                          }
                          title="Remove"
                        >
                          ×
                        </button>

                      </div>
                    );
                  }
                )}

                {!displayedStocks.length && (
                  <div className="empty-watchlist">

                    <div>
                      ☆
                    </div>

                    <strong>
                      Your watchlist is empty
                    </strong>

                    <p>
                      Search for a stock above
                      to add it.
                    </p>

                  </div>
                )}

              </div>

            </>

          ) : (

            /* --------------------------------------------- */
            /* READYMAD / SMART */
            /* --------------------------------------------- */

            <div className="sidebar-placeholder">

              <div className="placeholder-icon">
                ✦
              </div>

              <h3>
                {sidebarTab}
              </h3>

              <p>
                This section will be connected
                to StockAI screening and
                predefined watchlists.
              </p>

              <span>
                Coming in next UI phase
              </span>

            </div>

          )}

        </aside>

        {/* ================================================= */}
        {/* MAIN CONTENT */}
        {/* ================================================= */}

        <main className="terminal-main">

          {/* ================================================= */}
          {/* STOCK HEADER */}
          {/* ================================================= */}

          <section className="stock-header">

            {/* TABS */}

            <div className="stock-tabs">

              {STOCK_TABS.map(
                (tab) => (
                  <button
                    key={tab}
                    className={
                      activeTab ===
                      tab
                        ? "stock-tab active"
                        : "stock-tab"
                    }
                    onClick={() =>
                      setActiveTab(
                        tab
                      )
                    }
                  >
                    {tab}
                  </button>
                )
              )}

            </div>

            {/* STOCK TITLE */}

            <div className="stock-summary">

              <div className="stock-summary-left">

                <div className="stock-title-row">

                  <h1>
                    {activeStockName}
                  </h1>

                  <span className="exchange-badge">
                    NSE
                  </span>

                  <span className="equity-badge">
                    EQUITY
                  </span>

                </div>

                <div className="price-row">

                  {stockLoading ? (

                    <span className="loading-price">
                      Loading market data...
                    </span>

                  ) : stockError ? (

                    <span className="error-price">
                      {stockError}
                    </span>

                  ) : stockInfo ? (

                    <>
                      <strong>
                        {formatPrice(
                          stockInfo.price
                        )}
                      </strong>

                      <span
                        className={
                          isPositive
                            ? "price-change positive"
                            : "price-change negative"
                        }
                      >
                        {formatSigned(
                          stockInfo.change
                        )}
                        {" "}
                        (
                        {stockInfo.percent.toFixed(
                          2
                        )}
                        %)
                      </span>
                    </>

                  ) : (
                    <span>
                      —
                    </span>
                  )}

                </div>

                <div className="market-status">

                  <span className="status-dot" />

                  Market data connected

                  <span className="status-divider">
                    •
                  </span>

                  {yahooSymbol}

                </div>

              </div>

              {/* TRADE STYLE BUTTONS */}

              <div className="stock-actions">

                <button
                  className="buy-button"
                  title="Demo buy interface"
                >
                  Buy
                </button>

                <button
                  className="sell-button"
                  title="Demo sell interface"
                >
                  Sell
                </button>

                <button
                  className="mtf-button"
                >
                  MTF Buy 3.3x
                </button>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* OVERVIEW */}
          {/* ================================================= */}

          {activeTab ===
            "Overview" && (
            <>

              {/* CHART */}

              <section className="terminal-card chart-card">

                <div className="card-header">

                  <div>
                    <h2>
                      {cleanSymbol(
                        activeStock
                      )}{" "}
                      Price Chart
                    </h2>

                    <p>
                      NSE · Equity · 5 minute
                      market candles
                    </p>
                  </div>

                  <div className="data-source-badge">
                    ● Backend Data
                  </div>

                </div>

                <div className="chart-wrapper">

                  <StockChart
                    symbol={
                      activeStock
                    }
                    stockSymbol={
                      activeStock
                    }
                    selectedStock={
                      activeStock
                    }
                    data={
                      stockInfo?.data ||
                      []
                    }
                  />

                </div>

              </section>

              {/* MARKET SNAPSHOT */}

              <section className="market-snapshot">

                <InfoCard
                  title="Open"
                  value={formatPrice(
                    stockInfo?.open
                  )}
                />

                <InfoCard
                  title="Day High"
                  value={formatPrice(
                    stockInfo?.high
                  )}
                />

                <InfoCard
                  title="Day Low"
                  value={formatPrice(
                    stockInfo?.low
                  )}
                />

                <InfoCard
                  title="Previous Close"
                  value={formatPrice(
                    stockInfo?.previousClose
                  )}
                />

                <InfoCard
                  title="52W High"
                  value={formatPrice(
                    stockInfo?.week52High
                  )}
                />

                <InfoCard
                  title="52W Low"
                  value={formatPrice(
                    stockInfo?.week52Low
                  )}
                />

              </section>

              {/* TECHNICAL + AI */}

              <section className="analysis-grid">

                <div className="terminal-card">

                  <div className="analysis-card-title">

                    <div>
                      <h2>
                        Technical Analysis
                      </h2>

                      <p>
                        SMA · EMA · RSI · MACD
                      </p>
                    </div>

                    <span>
                      Indicators
                    </span>

                  </div>

                  <TechnicalAnalysis
                    symbol={
                      activeStock
                    }
                    stockSymbol={
                      activeStock
                    }
                    selectedStock={
                      activeStock
                    }
                    data={
                      stockInfo?.data ||
                      []
                    }
                  />

                </div>

                <div className="terminal-card">

                  <div className="analysis-card-title">

                    <div>
                      <h2>
                        StockAI Forecast
                      </h2>

                      <p>
                        LSTM + ML forecasting
                        pipeline
                      </p>
                    </div>

                    <span className="ai-badge">
                      AI
                    </span>

                  </div>

                  <AIForecast
                    symbol={
                      activeStock
                    }
                    stockSymbol={
                      activeStock
                    }
                    selectedStock={
                      activeStock
                    }
                  />

                </div>

              </section>

            </>
          )}

          {/* ================================================= */}
          {/* CHART TAB */}
          {/* ================================================= */}

          {activeTab ===
            "Chart" && (
            <section className="terminal-card large-tab-card">

              <div className="card-header">

                <div>
                  <h2>
                    Advanced Chart
                  </h2>

                  <p>
                    {activeStockName} · NSE
                  </p>
                </div>

                <span className="data-source-badge">
                  ● Live API
                </span>

              </div>

              <div className="advanced-chart">

                <StockChart
                  symbol={
                    activeStock
                  }
                  stockSymbol={
                    activeStock
                  }
                  selectedStock={
                    activeStock
                  }
                  data={
                    stockInfo?.data ||
                    []
                  }
                />

              </div>

            </section>
          )}

          {/* ================================================= */}
          {/* TECHNICAL TAB */}
          {/* ================================================= */}

          {activeTab ===
            "Technicals" && (
            <section className="terminal-card large-tab-card">

              <div className="card-header">

                <div>
                  <h2>
                    Technical Analysis
                  </h2>

                  <p>
                    Technical indicators calculated
                    from market candles
                  </p>
                </div>

                <span className="indicator-count">
                  SMA · EMA · RSI · MACD
                </span>

              </div>

              <TechnicalAnalysis
                symbol={
                  activeStock
                }
                stockSymbol={
                  activeStock
                }
                selectedStock={
                  activeStock
                }
                data={
                  stockInfo?.data ||
                  []
                }
              />

            </section>
          )}

          {/* ================================================= */}
          {/* AI / FORECAST */}
          {/* ================================================= */}

          {activeTab ===
            "Fundamentals" && (
            <PlaceholderPage
              title="Fundamentals"
              description="Company fundamentals, valuation ratios and financial metrics will be connected here."
            />
          )}

          {activeTab ===
            "Shareholdings" && (
            <PlaceholderPage
              title="Shareholdings"
              description="Promoter, FII, DII and public shareholding data will be displayed here."
            />
          )}

          {activeTab ===
            "Corporate Details" && (
            <PlaceholderPage
              title="Corporate Details"
              description="Corporate actions, announcements and company information will be added here."
            />
          )}

          {activeTab ===
            "News" && (
            <PlaceholderPage
              title="Market News"
              description="Stock-specific market news will be connected to the backend in the next phase."
            />
          )}

          {activeTab ===
            "Option Chain" && (
            <PlaceholderPage
              title="Option Chain"
              description="Option-chain UI is reserved for the next derivatives module."
            />
          )}

          {activeTab ===
            "Futures" && (
            <PlaceholderPage
              title="Futures"
              description="Futures contracts and derivatives analytics will be added in the next phase."
            />
          )}

        </main>

      </div>

      {/* ================================================= */}
      {/* MOBILE BOTTOM NAV */}
      {/* ================================================= */}

      <div className="mobile-bottom-nav">

        {[
          "Watchlist",
          "Portfolio",
          "Orders",
          "Funds",
          "Markets",
        ].map(
          (item) => (
            <button
              key={item}
              className={
                activeMenu ===
                item
                  ? "mobile-nav-item active"
                  : "mobile-nav-item"
              }
              onClick={() =>
                setActiveMenu(
                  item
                )
              }
            >

              <span>
                {getNavIcon(
                  item
                )}
              </span>

              {item}

            </button>
          )
        )}

      </div>

    </div>
  );
}

// =====================================================
// INFO CARD
// =====================================================

function InfoCard({
  title,
  value,
}) {
  return (
    <div className="info-card">

      <span className="info-card-title">
        {title}
      </span>

      <strong className="info-card-value">
        {value}
      </strong>

    </div>
  );
}

// =====================================================
// PLACEHOLDER
// =====================================================

function PlaceholderPage({
  title,
  description,
}) {
  return (
    <section className="terminal-card placeholder-page">

      <div className="placeholder-page-icon">
        ◈
      </div>

      <h2>
        {title}
      </h2>

      <p>
        {description}
      </p>

      <span>
        StockAI module · Coming next
      </span>

    </section>
  );
}

// =====================================================
// NAV ICON
// =====================================================

function getNavIcon(item) {
  const icons = {
    Watchlist: "☆",
    Portfolio: "▣",
    Orders: "☷",
    Funds: "₹",
    Markets: "⌁",
  };

  return icons[item] || "•";
}

export default App;