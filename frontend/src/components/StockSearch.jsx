import { useEffect, useState } from "react";
import "./StockSearch.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function StockSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const value = query.trim();

    if (!value) {
      setResults([]);
      setLoading(false);
      return;
    }

    const searchStocks = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/stocks/search?q=${encodeURIComponent(value)}`
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();

        setResults(Array.isArray(data.results) ? data.results : []);
      } catch (error) {
        console.error("Stock search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchStocks, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (stock) => {
    if (!stock) return;

    setQuery(stock.symbol || "");
    setShowResults(false);

    if (onSelect) {
      onSelect(stock);
    }
  };

  return (
    <div className="stock-search">
      <div className="stock-search-box">
        <span className="stock-search-icon">⌕</span>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => {
            if (query.trim()) {
              setShowResults(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setShowResults(false);
            }
          }}
          placeholder="Search stocks, ETFs..."
          autoComplete="off"
        />

        {query && (
          <button
            type="button"
            className="stock-search-clear"
            onClick={() => {
              setQuery("");
              setResults([]);
              setShowResults(false);
            }}
          >
            ×
          </button>
        )}

        {loading && (
          <span className="stock-search-spinner" />
        )}

        <span className="stock-search-shortcut">
          /
        </span>
      </div>

      {showResults && query.trim() && (
        <div className="stock-search-results">
          <div className="stock-search-results-header">
            <span>Search Results</span>
            <span>{results.length}</span>
          </div>

          {loading ? (
            <div className="stock-search-state">
              <span className="stock-search-loader" />
              Searching stocks...
            </div>
          ) : results.length > 0 ? (
            results.map((stock) => (
              <button
                key={stock.symbol}
                type="button"
                className="stock-search-result"
                onClick={() => handleSelect(stock)}
              >
                <div className="stock-result-left">
                  <div className="stock-result-symbol">
                    {stock.symbol}
                  </div>

                  <div className="stock-result-name">
                    {stock.name || "NSE Equity"}
                  </div>
                </div>

                <div className="stock-result-right">
                  <span>NSE</span>
                  <span>›</span>
                </div>
              </button>
            ))
          ) : (
            <div className="stock-search-state no-results">
              <div className="no-results-icon">⌕</div>
              <strong>No stock found</strong>
              <span>Try another symbol or company name</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StockSearch;