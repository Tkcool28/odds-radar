import React, { useEffect, useState } from 'react';

type MarketTab = 'moneyline' | 'spread' | 'total';
type SportKey = 'basketball_nba' | 'icehockey_nhl';
type BookKey = 'Pinnacle' | 'FanDuel' | 'DraftKings';
type EdgeType = 'price' | 'point' | 'both' | null;

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

type RowData = {
  label: string;
  displayPoint: string;
  prices: Partial<Record<BookKey, number>>;
  points: Partial<Record<BookKey, string>>;
  pointNums: Partial<Record<BookKey, number>>;
};

type EdgeInfo = {
  type: EdgeType;
  pct: number;
  reason: string;
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

function americanToImpliedPct(odds?: number): number {
  if (typeof odds !== 'number') return 0;

  if (odds > 0) {
    return (100 / (odds + 100)) * 100;
  }

  return ((-odds) / ((-odds) + 100)) * 100;
}

function priceEdgePct(pinPrice?: number, otherPrice?: number): number {
  if (typeof pinPrice !== 'number' || typeof otherPrice !== 'number') return 0;

  const pinImp = americanToImpliedPct(pinPrice);
  const otherImp = americanToImpliedPct(otherPrice);

  return Math.max(0, pinImp - otherImp);
}

function pointEdgePct(
  market: MarketTab,
  label: string,
  pinPoint?: number,
  otherPoint?: number
): number {
  if (typeof pinPoint !== 'number' || typeof otherPoint !== 'number') return 0;

  let delta = 0;

  if (market === 'spread') {
    // Bigger number is always better for the bettor:
    // +5.5 better than +4.5, -3.5 better than -4.5
    delta = otherPoint - pinPoint;
    return Math.max(0, delta * 2.0);
  }

  if (market === 'total') {
    if (label === 'Over') {
      // Lower total is better for Over
      delta = pinPoint - otherPoint;
    } else {
      // Higher total is better for Under
      delta = otherPoint - pinPoint;
    }

    return Math.max(0, delta * 1.5);
  }

  return 0;
}

function getEdgeInfo(
  market: MarketTab,
  row: RowData,
  book: BookKey
): EdgeInfo {
  if (book === 'Pinnacle') {
    return { type: null, pct: 0, reason: '' };
  }

  const pinPrice = row.prices.Pinnacle;
  const otherPrice = row.prices[book];
  const pinPoint = row.pointNums.Pinnacle;
  const otherPoint = row.pointNums[book];

  if (market === 'moneyline') {
    const pEdge = priceEdgePct(pinPrice, otherPrice);

    if (pEdge > 0) {
      return {
        type: 'price',
        pct: pEdge,
        reason: 'price',
      };
    }

    return { type: null, pct: 0, reason: '' };
  }

  const samePoint =
    typeof pinPoint === 'number' &&
    typeof otherPoint === 'number' &&
    pinPoint === otherPoint;

  const pEdge = samePoint ? priceEdgePct(pinPrice, otherPrice) : 0;
  const nEdge = pointEdgePct(market, row.label, pinPoint, otherPoint);

  if (nEdge > 0 && pEdge > 0) {
    return {
      type: 'both',
      pct: nEdge + pEdge,
      reason: 'number + price',
    };
  }

  if (nEdge > 0) {
    return {
      type: 'point',
      pct: nEdge,
      reason: 'number',
    };
  }

  if (pEdge > 0) {
    return {
      type: 'price',
      pct: pEdge,
      reason: 'price',
    };
  }

  return { type: null, pct: 0, reason: '' };
}

function edgeBoxStyle(edge: EdgeType): React.CSSProperties {
  if (edge === 'price') {
    return {
      background: 'rgba(59, 130, 246, 0.18)',
      border: '1px solid rgba(59, 130, 246, 0.65)',
      color: '#dbeafe',
    };
  }

  if (edge === 'point') {
    return {
      background: 'rgba(245, 158, 11, 0.18)',
      border: '1px solid rgba(245, 158, 11, 0.65)',
      color: '#fef3c7',
    };
  }

  if (edge === 'both') {
    return {
      background: 'rgba(168, 85, 247, 0.20)',
      border: '1px solid rgba(168, 85, 247, 0.70)',
      color: '#f3e8ff',
    };
  }

  return {
    background: 'transparent',
    border: '1px solid transparent',
    color: '#94a3b8',
  };
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

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
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

          <div
            style={{
              display: 'grid',
              gap: 8,
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            }}
          >
            <LegendBox
              title="PRICE EDGE"
              text="Same number, better juice than Pinnacle"
              edge="price"
            />
            <LegendBox
              title="NUMBER EDGE"
              text="Better point / total than Pinnacle"
              edge="point"
            />
            <LegendBox
              title="BOTH"
              text="Better number and better price"
              edge="both"
            />
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
                    gridTemplateColumns: 'minmax(120px, 1.4fr) repeat(3, minmax(90px, 1fr))',
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
                          const edge = getEdgeInfo(market, row, book);

                          return (
                            <div
                              key={book}
                              style={valueCellStyle(idx === rows.length - 1, isBest)}
                            >
                              {market === 'moneyline' ? (
                                <div style={{ fontWeight: 800, fontSize: 17 }}>
                                  {formatOdds(row.prices[book])}
                                </div>
                              ) : (
                                <>
                                  <div style={{ fontWeight: 800, fontSize: 17 }}>
                                    {row.points[book] ?? '—'}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: isBest ? '#bbf7d0' : '#94a3b8',
                                      marginTop: 2,
                                    }}
                                  >
                                    {formatOdds(row.prices[book])}
                                  </div>
                                </>
                              )}

                              {book !== 'Pinnacle' && edge.type && (
                                <div
                                  style={{
                                    marginTop: 8,
                                    borderRadius: 12,
                                    padding: '6px 6px',
                                    textAlign: 'center',
                                    ...edgeBoxStyle(edge.type),
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      letterSpacing: '0.04em',
                                    }}
                                  >
                                    EDGE
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 900,
                                      marginTop: 2,
                                    }}
                                  >
                                    {edge.pct.toFixed(1)}%
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 10,
                                      marginTop: 2,
                                      opacity: 0.95,
                                    }}
                                  >
                                    {edge.reason}
                                  </div>
                                </div>
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

function buildMoneylineRows(game: RawGame): RowData[] {
  const rows: RowData[] = [];
  const labels = [game.away_team, game.home_team];

  for (const label of labels) {
    const prices: Partial<Record<BookKey, number>> = {};
    const points: Partial<Record<BookKey, string>> = {};
    const pointNums: Partial<Record<BookKey, number>> = {};

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
      pointNums,
    });
  }

  return rows;
}

function buildSpreadRows(game: RawGame): RowData[] {
  const rows: RowData[] = [];
  const labels = [game.away_team, game.home_team];

  for (const label of labels) {
    const prices: Partial<Record<BookKey, number>> = {};
    const points: Partial<Record<BookKey, string>> = {};
    const pointNums: Partial<Record<BookKey, number>> = {};
    let displayPoint = '—';

    for (const bookmaker of game.bookmakers || []) {
      const book = toBookKey(bookmaker);
      if (!book) continue;

      const market = bookmaker.markets?.find((m) => m.key === 'spreads');
      const outcome = market?.outcomes?.find((o) => o.name === label);

      if (outcome) {
        prices[book] = outcome.price;
        points[book] = formatPoint(outcome.point);
        if (typeof outcome.point === 'number') {
          pointNums[book] = outcome.point;
        }
        if (displayPoint === '—') displayPoint = formatPoint(outcome.point);
      }
    }

    rows.push({
      label,
      displayPoint,
      prices,
      points,
      pointNums,
    });
  }

  return rows;
}

function buildTotalRows(game: RawGame): RowData[] {
  const rows: RowData[] = [];
  const labels = ['Over', 'Under'];

  for (const label of labels) {
    const prices: Partial<Record<BookKey, number>> = {};
    const points: Partial<Record<BookKey, string>> = {};
    const pointNums: Partial<Record<BookKey, number>> = {};
    let displayPoint = '—';

    for (const bookmaker of game.bookmakers || []) {
      const book = toBookKey(bookmaker);
      if (!book) continue;

      const market = bookmaker.markets?.find((m) => m.key === 'totals');
      const outcome = market?.outcomes?.find((o) => o.name === label);

      if (outcome) {
        prices[book] = outcome.price;
        points[book] = typeof outcome.point === 'number' ? `${outcome.point}` : '—';
        if (typeof outcome.point === 'number') {
          pointNums[book] = outcome.point;
          if (displayPoint === '—') {
            displayPoint = `${outcome.point}`;
          }
        }
      }
    }

    rows.push({
      label,
      displayPoint,
      prices,
      points,
      pointNums,
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

function LegendBox({
  title,
  text,
  edge,
}: {
  title: string;
  text: string;
  edge: EdgeType;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 12,
        ...edgeBoxStyle(edge),
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.05em' }}>
        {title}
      </div>
      <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.35 }}>
        {text}
      </div>
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

const refresh
