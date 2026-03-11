import React, { useEffect, useState } from 'react';

type MarketTab = 'moneyline' | 'spread' | 'total';
type SportKey = 'basketball_nba' | 'icehockey_nhl';
type BookKey = 'Pinnacle' | 'FanDuel' | 'DraftKings';

type Outcome = {
  name: string;
  price: number;
  point?: number;
};

type Market = {
  key: string;
  outcomes: Outcome[];
};

type Bookmaker = {
  key: string;
  title: string;
  markets: Market[];
};

type RawGame = {
  id: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Bookmaker[];
};

const BOOKS: BookKey[] = ['Pinnacle', 'FanDuel', 'DraftKings'];

function toBookKey(book: Bookmaker): BookKey | null {
  const v = `${book.key} ${book.title}`.toLowerCase();
  if (v.includes('pinnacle')) return 'Pinnacle';
  if (v.includes('fanduel')) return 'FanDuel';
  if (v.includes('draftkings')) return 'DraftKings';
  return null;
}

function formatOdds(value?: number) {
  if (typeof value !== 'number') return '—';
  return value > 0 ? `+${value}` : `${value}`;
}

function formatPoint(value?: number) {
  if (typeof value !== 'number') return '—';
  return value > 0 ? `+${value}` : `${value}`;
}

function statusText(commenceTime: string) {
  const start = new Date(commenceTime).getTime();
  const now = Date.now();
  if (start <= now) return 'Live / In Progress';

  return `Starts ${new Date(commenceTime).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function getBestPrice(values: Partial<Record<BookKey, number>>): BookKey[] {
  const nums = BOOKS.map((b) => values[b]).filter((v): v is number => typeof v === 'number');
  if (nums.length === 0) return [];
  const best = Math.max(...nums);
  return BOOKS.filter((b) => values[b] === best);
}

export default function App() {
  const [sport, setSport] = useState<SportKey>('basketball_nba');
  const [market, setMarket] = useState<MarketTab>('moneyline');
  const [games, setGames] = useState<RawGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState('');

  async function loadGames() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/odds?sport=${sport}`, { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to load odds');
      }

      setGames(Array.isArray(data.games) ? data.games : []);
      setUpdated(
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
    loadGames();
  }, [sport]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #07111f 0%, #0b1220 45%, #0d1424 100%)',
        color: '#e5e7eb',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(7,17,31,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div style={{ maxWidth: 980, margin: '0 auto', padding: 16 }}>
          <h1 style={{ margin: 0, fontSize: 40 }}>Odds Radar</h1>
          <p style={{ margin: '8px 0 14px', color: '#94a3b8' }}>
            Compare live odds across Pinnacle, FanDuel, and DraftKings.
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={pillStyle}>Mode: Live</span>
            <span style={pillStyle}>Updated: {updated || '—'}</span>
            <button onClick={loadGames} style={refreshButtonStyle} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <button
              onClick={() => setSport('basketball_nba')}
              style={buttonStyle(sport === 'basketball_nba', '#38bdf8')}
            >
              NBA
            </button>
            <button
              onClick={() => setSport('icehockey_nhl')}
              style={buttonStyle(sport === 'icehockey_nhl', '#38bdf8')}
            >
              NHL
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setMarket('moneyline')}
              style={buttonStyle(market === 'moneyline', '#22c55e')}
            >
              Moneyline
            </button>
            <button
              onClick={() => setMarket('spread')}
              style={buttonStyle(market === 'spread', '#22c55e')}
            >
              Spread
            </button>
            <button
              onClick={() => setMarket('total')}
              style={buttonStyle(market === 'total', '#22c55e')}
            >
              Total
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: 16, display: 'grid', gap: 16 }}>
        {loading && <Box>Loading live odds…</Box>}
        {!loading && error && <Box>Error: {error}</Box>}
        {!loading && !error && games.length === 0 && <Box>No games returned.</Box>}

        {!loading &&
          !error &&
          games.map((game) => {
            const h2hRows = buildMoneylineRows(game);
            const spreadRows = buildSpreadRows(game);
            const totalRows = buildTotalRows(game);

            const rows =
              market === 'moneyline'
                ? h2hRows
                : market === 'spread'
                ? spreadRows
                : totalRows;

            return (
              <div
                key={game.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.92)',
                  border: '1px solid #1f2937',
                  borderRadius: 20,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: 16, borderBottom: '1px solid #182235' }}>
                  <div style={{ color: '#38bdf8', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    {game.sport_title}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>
                    {game.away_team} vs {game.home_team}
                  </div>
                  <div style={{ marginTop: 8, color: '#94a3b8', fontWeight: 700 }}>
                    {statusText(game.commence_time)}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(120px, 1.4fr) repeat(3, minmax(72px, 1fr))',
                  }}
                >
                  <CellHeader>
                    {market === 'moneyline' ? 'Team' : market === 'spread' ? 'Spread' : 'Total'}
                  </CellHeader>
                  {BOOKS.map((book) => (
                    <CellHeader key={book}>{book}</CellHeader>
                  ))}

                  {rows.map((row, idx) => {
                    const best = getBestPrice(row.prices);

                    return (
                      <React.Fragment key={`${game.id}-${row.label}-${idx}`}>
                        <div style={leftCellStyle(idx === rows.length - 1)}>
                          <div style={{ fontWeight: 700 }}>{row.label}</div>
                          {market !== 'moneyline' && (
                            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                              {row.displayPoint}
                            </div>
                          )}
                        </div>

                        {BOOKS.map((book) => {
                          const isBest = best.includes(book);
                          return (
                            <div
                              key={book}
                              style={valueCellStyle(idx === rows.length - 1, isBest)}
                            >
                              {market === 'moneyline' ? (
                                <div style={{ fontWeight: 800 }}>
                                  {formatOdds(row.prices[book])}
                                </div>
                              ) : (
                                <>
                                  <div style={{ fontWeight: 800 }}>{row.points[book] ?? '—'}</div>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: isBest ? '#bbf7d0' : '#94a3b8',
                                    }}
                                  >
                                    {formatOdds(row.prices[book])}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function buildMoneylineRows(game: RawGame) {
  const rows: Array<{
    label: string;
    displayPoint: string;
    prices: Partial<Record<BookKey, number>>;
    points: Partial<Record<BookKey, string>>;
  }> = [];

  const labels = [game.away_team, game.home_team];

  for (const label of labels) {
    const prices: Partial<Record<BookKey, number>> = {};
    const points: Partial<Record<BookKey, string>> = {};

    for (const bookmaker of game.bookmakers || []) {
      const book = toBookKey(bookmaker);
      if (!book) continue;

      const market = bookmaker.markets?.find((m) => m.key === 'h2h');
      const outcome = market?.outcomes?.find((o) => o.name === label);

      if (outcome) {
        prices[book] = outcome.price;
      }
    }

    rows.push({
      label,
      displayPoint: '',
      prices,
      points,
    });
  }

  return rows;
}

function buildSpreadRows(game: RawGame) {
  const rows: Array<{
    label: string;
    displayPoint: string;
    prices: Partial<Record<BookKey, number>>;
    points: Partial<Record<BookKey, string>>;
  }> = [];

  const labels = [game.away_team, game.home_team];

  for (const label of labels) {
    const prices: Partial<Record<BookKey, number>> = {};
    const points: Partial<Record<BookKey, string>> = {};
    let displayPoint = '—';

    for (const bookmaker of game.bookmakers || []) {
      const book = toBookKey(bookmaker);
      if (!book) continue;

      const market = bookmaker.markets?.find((m) => m.key === 'spreads');
      const outcome = market?.outcomes?.find((o) => o.name === label);

      if (outcome) {
        prices[book] = outcome.price;
        points[book] = formatPoint(outcome.point);
        if (displayPoint === '—') displayPoint = formatPoint(outcome.point);
      }
    }

    rows.push({
      label,
      displayPoint,
      prices,
      points,
    });
  }

  return rows;
}

function buildTotalRows(game: RawGame) {
  const rows: Array<{
    label: string;
    displayPoint: string;
    prices: Partial<Record<BookKey, number>>;
    points: Partial<Record<BookKey, string>>;
  }> = [];

  const labels = ['Over', 'Under'];

  for (const label of labels) {
    const prices: Partial<Record<BookKey, number>> = {};
    const points: Partial<Record<BookKey, string>> = {};
    let displayPoint = '—';

    for (const bookmaker of game.bookmakers || []) {
      const book = toBookKey(bookmaker);
      if (!book) continue;

      const market = bookmaker.markets?.find((m) => m.key === 'totals');
      const outcome = market?.outcomes?.find((o) => o.name === label);

      if (outcome) {
        prices[book] = outcome.price;
        points[book] = typeof outcome.point === 'number' ? `${outcome.point}` : '—';
        if (displayPoint === '—' && typeof outcome.point === 'number') {
          displayPoint = `${outcome.point}`;
        }
      }
    }

    rows.push({
      label,
      displayPoint,
      prices,
      points,
    });
  }

  return rows;
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid #1f2937',
        borderRadius: 20,
        padding: 20,
        color: '#cbd5e1',
      }}
    >
      {children}
    </div>
  );
}

function CellHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '12px 10px',
        textAlign: 'center',
        borderBottom: '1px solid #182235',
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

const pillStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: 999,
  border: '1px solid #243041',
  background: '#111827',
  color: '#cbd5e1',
  fontSize: 12,
  fontWeight: 700,
};

const refreshButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 999,
  border: '1px solid #22c55e',
  background: 'rgba(34, 197, 94, 0.12)',
  color: '#dcfce7',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
};

function buttonStyle(active: boolean, color: string): React.CSSProperties {
  return {
    border: active ? `1px solid ${color}` : '1px solid #243041',
    background: active ? `${color}22` : '#111827',
    color: active ? '#ffffff' : '#cbd5e1',
    padding: '10px 14px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  };
}

function leftCellStyle(last: boolean): React.CSSProperties {
  return {
    padding: 14,
    borderBottom: last ? 'none' : '1px solid #182235',
  };
}

function valueCellStyle(last: boolean, best: boolean): React.CSSProperties {
  return {
    padding: '14px 10px',
    textAlign: 'center',
    borderBottom: last ? 'none' : '1px solid #182235',
    background: best ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
    color: best ? '#dcfce7' : '#e5e7eb',
  };
    }
