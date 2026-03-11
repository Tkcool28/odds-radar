import React, { useEffect, useMemo, useState } from 'react';

type BookKey = 'Pinnacle' | 'FanDuel' | 'DraftKings';
type MarketTab = 'moneyline' | 'spread' | 'total';
type SportKey = 'basketball_nba' | 'icehockey_nhl';

type OddsCell = {
  price?: number;
  point?: number;
};

type OutcomeRow = {
  label: string;
  books: Record<BookKey, OddsCell>;
};

type EventCard = {
  id: string;
  league: string;
  status: string;
  matchup: string;
  moneyline: OutcomeRow[];
  spread: OutcomeRow[];
  total: OutcomeRow[];
};

type RawOutcome = {
  name: string;
  price: number;
  point?: number;
};

type RawMarket = {
  key: string;
  outcomes: RawOutcome[];
};

type RawBookmaker = {
  key: string;
  title: string;
  markets: RawMarket[];
};

type RawGame = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: RawBookmaker[];
};

const BOOKS: BookKey[] = ['Pinnacle', 'FanDuel', 'DraftKings'];
const AUTO_REFRESH_MS = 30000;

function emptyBooks(): Record<BookKey, OddsCell> {
  return {
    Pinnacle: {},
    FanDuel: {},
    DraftKings: {},
  };
}

function formatAmericanOdds(value?: number): string {
  if (typeof value !== 'number') return '—';
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function formatPoint(value?: number): string {
  if (typeof value !== 'number') return '—';
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function toBookKey(title?: string, key?: string): BookKey | null {
  const v = `${title || ''} ${key || ''}`.toLowerCase();

  if (v.includes('pinnacle')) return 'Pinnacle';
  if (v.includes('fanduel')) return 'FanDuel';
  if (v.includes('draftkings')) return 'DraftKings';

  return null;
}

function getStatus(commenceTime: string): string {
  const start = new Date(commenceTime).getTime();
  const now = Date.now();
  const diff = start - now;

  if (diff <= 0) {
    return 'Live / In Progress';
  }

  return `Starts ${new Date(commenceTime).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function buildMoneylineRows(game: RawGame): OutcomeRow[] {
  const map = new Map<string, OutcomeRow>();

  for (const bookmaker of game.bookmakers || []) {
    const book = toBookKey(bookmaker.title, bookmaker.key);
    if (!book) continue;

    const market = bookmaker.markets?.find((m) => m.key === 'h2h');
    if (!market) continue;

    for (const outcome of market.outcomes || []) {
      const label = outcome.name;
      if (!map.has(label)) {
        map.set(label, {
          label,
          books: emptyBooks(),
        });
      }

      map.get(label)!.books[book] = {
        price: outcome.price,
      };
    }
  }

  const rows = Array.from(map.values());

  rows.sort((a, b) => {
    if (a.label === game.away_team) return -1;
    if (b.label === game.away_team) return 1;
    if (a.label === game.home_team) return 1;
    if (b.label === game.home_team) return -1;
    return a.label.localeCompare(b.label);
  });

  return rows;
}

function buildSpreadRows(game: RawGame): OutcomeRow[] {
  const map = new Map<string, OutcomeRow>();

  for (const bookmaker of game.bookmakers || []) {
    const book = toBookKey(bookmaker.title, bookmaker.key);
    if (!book) continue;

    const market = bookmaker.markets?.find((m) => m.key === 'spreads');
    if (!market) continue;

    for (const outcome of market.outcomes || []) {
      const label = outcome.name;
      if (!map.has(label)) {
        map.set(label, {
          label,
          books: emptyBooks(),
        });
      }

      map.get(label)!.books[book] = {
        price: outcome.price,
        point: outcome.point,
      };
    }
  }

  const rows = Array.from(map.values());

  rows.sort((a, b) => {
    if (a.label === game.away_team) return -1;
    if (b.label === game.away_team) return 1;
    if (a.label === game.home_team) return 1;
    if (b.label === game.home_team) return -1;
    return a.label.localeCompare(b.label);
  });

  return rows;
}

function buildTotalRows(game: RawGame): OutcomeRow[] {
  const map = new Map<string, OutcomeRow>();

  for (const bookmaker of game.bookmakers || []) {
    const book = toBookKey(bookmaker.title, bookmaker.key);
    if (!book) continue;

    const market = bookmaker.markets?.find((m) => m.key === 'totals');
    if (!market) continue;

    for (const outcome of market.outcomes || []) {
      const label = outcome.name;
      if (!map.has(label)) {
        map.set(label, {
          label,
          books: emptyBooks(),
        });
      }

      map.get(label)!.books[book] = {
        price: outcome.price,
        point: outcome.point,
      };
    }
  }

  const rows = Array.from(map.values());

  rows.sort((a, b) => {
    if (a.label === 'Over') return -1;
    if (b.label === 'Over') return 1;
    if (a.label === 'Under') return -1;
    if (b.label === 'Under') return 1;
    return a.label.localeCompare(b.label);
  });

  return rows;
}

function normalizeGames(rawGames: RawGame[]): EventCard[] {
  return rawGames.map((game) => ({
    id: game.id,
    league: game.sport_title,
    status: getStatus(game.commence_time),
    matchup: `${game.away_team} vs ${game.home_team}`,
    moneyline: buildMoneylineRows(game),
    spread: buildSpreadRows(game),
    total: buildTotalRows(game),
  }));
}

function bestMoneylineBooks(row: OutcomeRow): BookKey[] {
  let best = -Infinity;

  for (const book of BOOKS) {
    const price = row.books[book].price;
    if (typeof price === 'number' && price > best) {
      best = price;
    }
  }

  if (!Number.isFinite(best)) return [];

  return BOOKS.filter((book) => row.books[book].price === best);
}

function compareSpreadCell(a: OddsCell, b: OddsCell): number {
  const aPoint = typeof a.point === 'number' ? a.point : -Infinity;
  const bPoint = typeof b.point === 'number' ? b.point : -Infinity;

  if (aPoint !== bPoint) return aPoint - bPoint;

  const aPrice = typeof a.price === 'number' ? a.price : -Infinity;
  const bPrice = typeof b.price === 'number' ? b.price : -Infinity;

  return aPrice - bPrice;
}

function compareTotalCell(label: string, a: OddsCell, b: OddsCell): number {
  const aPoint = typeof a.point === 'number' ? a.point : label === 'Over' ? Infinity : -Infinity;
  const bPoint = typeof b.point === 'number' ? b.point : label === 'Over' ? Infinity : -Infinity;

  if (label === 'Over') {
    if (aPoint !== bPoint) return bPoint - aPoint;
  } else {
    if (aPoint !== bPoint) return aPoint - bPoint;
  }

  const aPrice = typeof a.price === 'number' ? a.price : -Infinity;
  const bPrice = typeof b.price === 'number' ? b.price : -Infinity;

  return aPrice - bPrice;
}

function bestSpreadBooks(row: OutcomeRow): BookKey[] {
  let bestBook: BookKey | null = null;

  for (const book of BOOKS) {
    const cell = row.books[book];
    if (typeof cell.point !== 'number' && typeof cell.price !== 'number') continue;

    if (!bestBook) {
      bestBook = book;
      continue;
    }

    if (compareSpreadCell(cell, row.books[bestBook]) > 0) {
      bestBook = book;
    }
  }

  if (!bestBook) return [];

  return BOOKS.filter(
    (book) => compareSpreadCell(row.books[book], row.books[bestBook!]) === 0
  );
}

function bestTotalBooks(row: OutcomeRow): BookKey[] {
  let bestBook: BookKey | null = null;

  for (const book of BOOKS) {
    const cell = row.books[book];
    if (typeof cell.point !== 'number' && typeof cell.price !== 'number') continue;

    if (!bestBook) {
      bestBook = book;
      continue;
    }

    if (compareTotalCell(row.label, cell, row.books[bestBook]) > 0) {
      bestBook = book;
    }
  }

  if (!bestBook) return [];

  return BOOKS.filter(
    (book) => compareTotalCell(row.label, row.books[book], row.books[bestBook!]) === 0
  );
}

function pill(text: string) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid #243041',
        background: '#111827',
        color: '#cbd5e1',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {text}
    </span>
  );
}

export default function App() {
  const [market, setMarket] = useState<MarketTab>('moneyline');
  const [sport, setSport] = useState<SportKey>('basketball_nba');
  const [events, setEvents] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  async function loadOdds() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/odds?sport=${sport}`, {
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to load odds');
      }

      const rawGames: RawGame[] = Array.isArray(data.games) ? data.games : [];
      setEvents(normalizeGames(rawGames));
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        })
      );
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOdds();
  }, [sport]);

  useEffect(() => {
    const id = window.setInterval(() => {
      loadOdds();
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(id);
  }, [sport]);

  const titleSport = useMemo(() => {
    return sport === 'basketball_nba' ? 'NBA' : 'NHL';
  }, [sport]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #07111f 0%, #0b1220 45%, #0d1424 100%)',
        color: '#e5e7eb',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backdropFilter: 'blur(12px)',
          background: 'rgba(7, 17, 31, 0.88)',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: '0 auto',
            padding: '16px 16px 14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 40,
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                }}
              >
                Odds Radar
              </h1>
              <p
                style={{
                  margin: '8px 0 0 0',
                  color: '#94a3b8',
                  fontSize: 15,
                }}
              >
                Compare live odds across Pinnacle, FanDuel, and DraftKings.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {pill(`Mode: Live ${titleSport}`)}
              {pill(`Updated: ${lastUpdated || '—'}`)}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 14,
              flexWrap: 'wrap',
            }}
          >
            {(['basketball_nba', 'icehockey_nhl'] as SportKey[]).map((s) => {
              const active = sport === s;
              const label = s === 'basketball_nba' ? 'NBA' : 'NHL';

              return (
                <button
                  key={s}
                  onClick={() => setSport(s)}
                  style={{
                    border: active ? '1px solid #38bdf8' : '1px solid #243041',
                    background: active ? 'rgba(56, 189, 248, 0.12)' : '#111827',
                    color: active ? '#e0f2fe' : '#cbd5e1',
                    padding: '10px 14px',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 10,
              flexWrap: 'wrap',
            }}
          >
            {(['moneyline', 'spread', 'total'] as MarketTab[]).map((tab) => {
              const active = market === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setMarket(tab)}
                  style={{
                    border: active ? '1px solid #22c55e' : '1px solid #243041',
                    background: active ? 'rgba(34, 197, 94, 0.12)' : '#111827',
                    color: active ? '#dcfce7' : '#cbd5e1',
                    padding: '10px 14px',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {tab === 'moneyline'
                    ? 'Moneyline'
                    : tab === 'spread'
                    ? 'Spread'
                    : 'Total'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          padding: '16px',
          display: 'grid',
          gap: 16,
        }}
      >
        {loading && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.92)',
              border: '1px solid #1f2937',
              borderRadius: 20,
              padding: 20,
              color: '#cbd5e1',
            }}
          >
            Loading live odds…
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              background: 'rgba(60, 10, 10, 0.9)',
              border: '1px solid #7f1d1d',
              borderRadius: 20,
              padding: 20,
              color: '#fecaca',
              fontWeight: 700,
            }}
          >
            Error: {error}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.92)',
              border: '1px solid #1f2937',
              borderRadius: 20,
              padding: 20,
              color: '#cbd5e1',
            }}
          >
            No games returned for this sport right now.
          </div>
        )}

        {!loading &&
          !error &&
          events.map((event) => {
            const rows =
              market === 'moneyline'
                ? event.moneyline
                : market === 'spread'
                ? event.spread
                : event.total;

            return (
              <div
                key={event.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.92)',
                  border: '1px solid #1f2937',
                  borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                }}
              >
                <div
                  style={{
                    padding: '16px 16px 12px',
                    borderBottom: '1px solid #182235',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: '#38bdf8',
                          marginBottom: 6,
                        }}
                      >
                        {event.league}
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          lineHeight: 1.15,
                        }}
                      >
                        {event.matchup}
                      </div>
                    </div>

                    <div
                      style={{
                        alignSelf: 'flex-start',
                        fontSize: 13,
                        color: '#94a3b8',
                        fontWeight: 700,
                      }}
                    >
                      {event.status}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'minmax(120px, 1.4fr) repeat(3, minmax(72px, 1fr))',
                    gap: 0,
                  }}
                >
                  <div
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #182235',
                      color: '#94a3b8',
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {market === 'moneyline'
                      ? 'Team'
                      : market === 'spread'
                      ? 'Spread'
                      : 'Total'}
                  </div>

                  {BOOKS.map((book) => (
                    <div
                      key={book}
                      style={{
                        padding: '12px 10px',
                        textAlign: 'center',
                        borderBottom: '1px solid #182235',
                        color: '#94a3b8',
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {book}
                    </div>
                  ))}

                  {rows.map((row, idx) => {
                    const best =
                      market === 'moneyline'
                        ? bestMoneylineBooks(row)
                        : market === 'spread'
                        ? bestSpreadBooks(row)
                        : bestTotalBooks(row);

                    return (
                      <React.Fragment key={`${event.id}-${market}-${row.label}-${idx}`}>
                        <div
                          style={{
                            padding: '14px',
                            borderBottom:
                              idx === rows.length - 1 ? 'none' : '1px solid #182235',
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>{row.label}</div>
                          {market !== 'moneyline' && (
                            <div
                              style={{
                                color: '#94a3b8',
                                fontSize: 13,
                                marginTop: 4,
                              }}
                            >
                              {market === 'total'
                                ? typeof row.books.Pinnacle.poi
