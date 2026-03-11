import React, { useEffect, useMemo, useState } from 'react';

type MarketTab = 'moneyline' | 'spread' | 'total';
type SportKey = 'basketball_nba' | 'icehockey_nhl';
type BookKey = 'Pinnacle' | 'FanDuel' | 'DraftKings';
type EdgeType = 'price' | 'point' | 'both' | null;
type ToolTab = 'odds' | 'hedge';

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
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return value > 0 ? `+${value}` : `${value}`;
}

function formatPoint(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
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
  const nums = BOOKS.map((b) => values[b]).filter(
    (v): v is number => typeof v === 'number'
  );
  if (nums.length === 0) return [];
  const best = Math.max(...nums);
  return BOOKS.filter((b) => values[b] === best);
}

function americanToImpliedPct(odds?: number): number {
  if (typeof odds !== 'number' || odds === 0) return 0;

  if (odds > 0) {
    return (100 / (odds + 100)) * 100;
  }

  return ((-odds) / ((-odds) + 100)) * 100;
}

function americanProfit(stake: number, odds: number): number {
  if (!Number.isFinite(stake) || !Number.isFinite(odds) || stake <= 0 || odds === 0) {
    return 0;
  }

  if (odds > 0) {
    return stake * (odds / 100);
  }

  return stake * (100 / Math.abs(odds));
}

function americanReturn(stake: number, odds: number): number {
  return stake + americanProfit(stake, odds);
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
    delta = otherPoint - pinPoint;
    return Math.max(0, delta * 2.0);
  }

  if (market === 'total') {
    if (label === 'Over') {
      delta = pinPoint - otherPoint;
    } else {
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

function parseNumberInput(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function App() {
  const [sport, setSport] = useState<SportKey>('basketball_nba');
  const [market, setMarket] = useState<MarketTab>('moneyline');
  const [games, setGames] = useState<RawGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState('');

  const [toolTab, setToolTab] = useState<ToolTab>('odds');

  const [calcOdds, setCalcOdds] = useState('');
  const [calcStake, setCalcStake] = useState('');

  const [hedgeOrigStake, setHedgeOrigStake] = useState('');
  const [hedgeOrigOdds, setHedgeOrigOdds] = useState('');
  const [hedgeHedgeStake, setHedgeHedgeStake] = useState('');
  const [hedgeHedgeOdds, setHedgeHedgeOdds] = useState('');

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

  const oddsCalc = useMemo(() => {
    const stake = parseNumberInput(calcStake);
    const odds = parseNumberInput(calcOdds);

    const profit = americanProfit(stake, odds);
    const totalReturn = americanReturn(stake, odds);
    const implied = americanToImpliedPct(odds);

    return { stake, odds, profit, totalReturn, implied };
  }, [calcStake, calcOdds]);

  const hedgeCalc = useMemo(() => {
    const origStake = parseNumberInput(hedgeOrigStake);
    const origOdds = parseNumberInput(hedgeOrigOdds);
    const hedgeStake = parseNumberInput(hedgeHedgeStake);
    const hedgeOdds = parseNumberInput(hedgeHedgeOdds);

    const origProfit = americanProfit(origStake, origOdds);
    const hedgeProfit = americanProfit(hedgeStake, hedgeOdds);

    const totalRisk = origStake + hedgeStake;

    const netIfOriginalWins = origProfit - hedgeStake;
    const netIfHedgeWins = hedgeProfit - origStake;

    let breakEvenHedgeStake = 0;
    if (Number.isFinite(origStake) && Number.isFinite(origOdds) && Number.isFinite(hedgeOdds)) {
      const originalWinNet = americanProfit(origStake, origOdds);
      const hedgeDecimalProfitPerDollar =
        hedgeOdds > 0 ? hedgeOdds / 100 : 100 / Math.abs(hedgeOdds);

      if (hedgeDecimalProfitPerDollar > 0) {
        breakEvenHedgeStake = (origStake + originalWinNet) / (1 + hedgeDecimalProfitPerDollar);
      }
    }

    return {
      origStake,
      origOdds,
      hedgeStake,
      hedgeOdds,
      totalRisk,
      netIfOriginalWins,
      netIfHedgeWins,
      breakEvenHedgeStake,
    };
  }, [hedgeOrigStake, hedgeOrigOdds, hedgeHedgeStake, hedgeHedgeOdds]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #07111f 0%, #0b1220 45%, #0d1424 100%)',
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
              gap: 6,
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              alignItems: 'start',
            }}
          >
            <LegendBox
              title="PRICE EDGE"
              text="Same number, better juice"
              edge="price"
            />
            <LegendBox
              title="NUMBER EDGE"
              text="Better point / total"
              edge="point"
            />
            <LegendBox
              title="BOTH"
              text="Better number and price"
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
                    padding: '0 16px 8px',
                    fontSize: 12,
                    color: '#94a3b8',
                  }}
                >
                  Swipe sideways to view all books
                </div>

                <div
                  style={{
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'minmax(160px, 1.4fr) repeat(3, minmax(140px, 1fr))',
                      minWidth: 620,
                    }}
                  >
                    <CellHeader>
                      {market === 'moneyline'
                        ? 'Team'
                        : market === 'spread'
                        ? 'Spread'
                        : 'Total'}
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
              </div>
            );
          })}

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid #1f2937',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 16, borderBottom: '1px solid #182235' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: '#38bdf8' }}>
              TOOLS
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
              Betting Calculators
            </div>
            <div style={{ marginTop: 8, color: '#94a3b8' }}>
              Local math only. No extra API requests.
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <button
                onClick={() => setToolTab('odds')}
                style={buttonStyle(toolTab === 'odds', '#22c55e')}
              >
                Odds Calculator
              </button>
              <button
                onClick=
