import { useEffect, useMemo, useState } from 'react';
import type { DataMode, Density, EventItem, MarketKey, OddsFormat, SportItem, ViewMode } from './types';
import { BOOK_ORDER, bestOutcomeByLabel, eventStatus, formatOdds, getMarket, outcomeLabel, relativeUpdated, teamScore } from './utils';

const AUTO_REFRESH_MS = 30000;
const FAVORITES_KEY = 'odds-radar-favorites';

function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

export default function App() {
  const [sports, setSports] = useState<SportItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [sport, setSport] = useState('upcoming');
  const [market, setMarket] = useState<MarketKey>('h2h');
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>('american');
  const [dataMode, setDataMode] = useState<DataMode>('demo');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [density, setDensity] = useState<Density>('comfy');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [favorites, setFavorites] = useLocalStorage<string[]>(FAVORITES_KEY, []);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const listener = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', listener as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', listener as EventListener);
  }, []);

  useEffect(() => {
    fetch(`/api/sports?mode=${dataMode}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Failed to load sports');
        setSports(payload.sports);
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [dataMode]);

  useEffect(() => {
    let cancelled = false;

    const loadOdds = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/odds?mode=${dataMode}&sport=${sport}&market=${market}&oddsFormat=${oddsFormat}`
        );
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Failed to load odds');
        if (!cancelled) {
          setEvents(payload.events);
          setLastUpdated(payload.lastUpdated);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOdds();
    const timer = window.setInterval(loadOdds, AUTO_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [dataMode, sport, market, oddsFormat]);

  const filtered = useMemo(() => {
    return events
      .filter((event) => {
        if (viewMode === 'live') return event.isLive;
        if (viewMode === 'upcoming') return !event.isLive && !event.completed;
        return true;
      })
      .filter((event) => {
        const haystack = `${event.homeTeam} ${event.awayTeam} ${event.league}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .sort((a, b) => {
        const favoriteDelta = Number(favorites.includes(b.id)) - Number(favorites.includes(a.id));
        if (favoriteDelta !== 0) return favoriteDelta;
        return new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime();
      });
  }, [events, favorites, query, viewMode]);

  const toggleFavorite = (eventId: string) => {
    setFavorites((current) =>
      current.includes(eventId) ? current.filter((id) => id !== eventId) : [...current, eventId]
    );
  };

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Android-ready live odds PWA</p>
          <h1>Odds Radar</h1>
          <p className="subtle">Compare Pinnacle, FanDuel, and DraftKings in one glance.</p>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" onClick={() => setDataMode(dataMode === 'demo' ? 'live' : 'demo')}>
            Mode: {dataMode}
          </button>
          {installPrompt ? (
            <button className="primary-button" onClick={installApp}>Install on Android</button>
          ) : null}
        </div>
      </header>

      <section className="toolbar sticky">
        <div className="control-grid">
          <label>
            <span>Sport</span>
            <select value={sport} onChange={(e) => setSport(e.target.value)}>
              <option value="upcoming">Upcoming / mixed</option>
              {sports.map((item) => (
                <option key={item.key} value={item.key}>{item.title}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Market</span>
            <select value={market} onChange={(e) => setMarket(e.target.value as MarketKey)}>
              <option value="h2h">Moneyline</option>
              <option value="spreads">Spread</option>
              <option value="totals">Total</option>
            </select>
          </label>

          <label>
            <span>View</span>
            <select value={viewMode} onChange={(e) => setViewMode(e.target.value as ViewMode)}>
              <option value="all">All</option>
              <option value="live">Live only</option>
              <option value="upcoming">Upcoming only</option>
            </select>
          </label>

          <label>
            <span>Odds</span>
            <select value={oddsFormat} onChange={(e) => setOddsFormat(e.target.value as OddsFormat)}>
              <option value="american">American</option>
              <option value="decimal">Decimal</option>
            </select>
          </label>

          <label>
            <span>Density</span>
            <select value={density} onChange={(e) => setDensity(e.target.value as Density)}>
              <option value="comfy">Comfy</option>
              <option value="compact">Compact</option>
            </select>
          </label>

          <label className="search-box">
            <span>Search</span>
            <input
              type="search"
              placeholder="Team or league"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        <div className="status-row">
          <span className="pill">Refresh: 30s</span>
          <span className="pill">Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'}</span>
          <span className={`pill ${dataMode === 'live' ? 'live-pill' : ''}`}>{dataMode === 'live' ? 'Live connector' : 'Demo mode'}</span>
        </div>
      </section>

      {error ? <div className="error-box">{error}</div> : null}
      {loading ? <div className="loading-box">Loading odds…</div> : null}

      <main className={`cards ${density}`}>
        {filtered.map((event) => {
          const bestMap = bestOutcomeByLabel(event, market);
          return (
            <article key={event.id} className="event-card">
              <div className="event-header">
                <div>
                  <div className="event-meta">
                    <span className={`status ${event.isLive ? 'live' : ''}`}>{eventStatus(event)}</span>
                    <span>{event.league}</span>
                    <span>{new Date(event.commenceTime).toLocaleString()}</span>
                  </div>
                  <div className="teams">
                    <div className="team-row">
                      <strong>{event.awayTeam}</strong>
                      <span className="score-chip">{teamScore(event, event.awayTeam) ?? '—'}</span>
                    </div>
                    <div className="team-row">
                      <strong>{event.homeTeam}</strong>
                      <span className="score-chip">{teamScore(event, event.homeTeam) ?? '—'}</span>
                    </div>
                  </div>
                </div>
                <button className="star-button" onClick={() => toggleFavorite(event.id)}>
                  {favorites.includes(event.id) ? '★' : '☆'}
                </button>
              </div>

              <div className="books-grid books-header">
                <div>Outcome</div>
                {BOOK_ORDER.map((bookKey) => <div key={bookKey}>{event.books.find((book) => book.key === bookKey)?.title ?? bookKey}</div>)}
              </div>

              {Array.from(
                new Set(
                  event.books.flatMap((book) => getMarket(book, market)?.outcomes.map((outcome) => outcomeLabel(outcome, market)) ?? [])
                )
              ).map((label) => (
                <div className="books-grid book-row" key={label}>
                  <div className="outcome-label">{label}</div>
                  {BOOK_ORDER.map((bookKey) => {
                    const book = event.books.find((item) => item.key === bookKey);
                    const outcome = book ? getMarket(book, market)?.outcomes.find((item) => outcomeLabel(item, market) === label) : undefined;
                    const isBest = bestMap.get(label)?.bookKey === bookKey;
                    return (
                      <div key={bookKey} data-book={book?.title ?? bookKey} className={`odd-cell ${isBest ? 'best' : ''}`}>
                        <div>{outcome ? formatOdds(outcome.price, oddsFormat) : '—'}</div>
                        <small>Upd {relativeUpdated(book?.lastUpdate)}</small>
                      </div>
                    );
                  })}
                </div>
              ))}
            </article>
          );
        })}
      </main>
    </div>
  );
}
