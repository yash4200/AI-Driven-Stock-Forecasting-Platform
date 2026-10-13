import { useState } from "react";
import "./WatchlistManager.css";

function WatchlistManager({
  watchlists,
  activeWatchlist,
  setActiveWatchlist,
  setWatchlists,
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const createWatchlist = () => {
    const name = newName.trim();

    if (!name) {
      setError("Enter a watchlist name");
      return;
    }

    const exists = watchlists.some(
      (watchlist) =>
        watchlist.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      setError("Watchlist already exists");
      return;
    }

    const newWatchlist = {
      id: Date.now(),
      name,
      stocks: [],
    };

    setWatchlists((prev) => [
      ...prev,
      newWatchlist,
    ]);

    setActiveWatchlist(newWatchlist.id);

    setNewName("");
    setError("");
    setShowCreate(false);
  };

  const deleteWatchlist = (id) => {
    if (watchlists.length <= 1) {
      setError("At least one watchlist is required");
      return;
    }

    const updated = watchlists.filter(
      (watchlist) => watchlist.id !== id
    );

    setWatchlists(updated);

    if (activeWatchlist === id) {
      setActiveWatchlist(updated[0].id);
    }
  };

  const renameWatchlist = (id) => {
    const current = watchlists.find(
      (watchlist) => watchlist.id === id
    );

    if (!current) return;

    const name = window.prompt(
      "Enter new watchlist name:",
      current.name
    );

    if (!name || !name.trim()) return;

    const trimmedName = name.trim();

    const duplicate = watchlists.some(
      (watchlist) =>
        watchlist.id !== id &&
        watchlist.name.toLowerCase() ===
          trimmedName.toLowerCase()
    );

    if (duplicate) {
      setError("Watchlist already exists");
      return;
    }

    setWatchlists((prev) =>
      prev.map((watchlist) =>
        watchlist.id === id
          ? {
              ...watchlist,
              name: trimmedName,
            }
          : watchlist
      )
    );

    setError("");
  };

  return (
    <div className="watchlist-manager">

      {/* Header */}

      <div className="watchlist-manager-header">

        <div>
          <div className="watchlist-title-row">
            <span className="watchlist-title-icon">
              ★
            </span>

            <h2>
              My Watchlists
            </h2>
          </div>

          <p>
            Track your favorite stocks
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreate((prev) => !prev);
            setError("");
          }}
          className={
            showCreate
              ? "watchlist-create-btn active"
              : "watchlist-create-btn"
          }
        >
          <span>+</span>
          Create
        </button>
      </div>

      {/* Create Form */}

      {showCreate && (
        <div className="watchlist-create-form">

          <div className="watchlist-create-input-wrap">

            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  createWatchlist();
                }

                if (e.key === "Escape") {
                  setShowCreate(false);
                  setNewName("");
                  setError("");
                }
              }}
              placeholder="e.g. Intraday, Long Term"
              autoFocus
            />

            <button
              type="button"
              onClick={createWatchlist}
            >
              Add
            </button>
          </div>

          {error && (
            <p className="watchlist-form-error">
              {error}
            </p>
          )}

          <span className="watchlist-form-hint">
            Press Enter to create · Esc to cancel
          </span>
        </div>
      )}

      {/* Watchlist Tabs */}

      <div className="watchlist-tabs">

        {watchlists.map((watchlist) => {
          const isActive =
            activeWatchlist === watchlist.id;

          const stockCount =
            watchlist.stocks?.length || 0;

          return (
            <div
              key={watchlist.id}
              className={
                isActive
                  ? "watchlist-tab active"
                  : "watchlist-tab"
              }
            >
              <button
                type="button"
                onClick={() =>
                  setActiveWatchlist(
                    watchlist.id
                  )
                }
                className="watchlist-tab-main"
              >
                <span className="watchlist-tab-name">
                  {watchlist.name}
                </span>

                <span className="watchlist-tab-count">
                  {stockCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  renameWatchlist(
                    watchlist.id
                  )
                }
                title="Rename watchlist"
                className="watchlist-action rename"
              >
                ✎
              </button>

              {watchlists.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    deleteWatchlist(
                      watchlist.id
                    )
                  }
                  title="Delete watchlist"
                  className="watchlist-action delete"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}

      {error && !showCreate && (
        <div className="watchlist-error">
          <span>!</span>
          {error}
        </div>
      )}
    </div>
  );
}

export default WatchlistManager;