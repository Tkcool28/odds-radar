import React, { useMemo, useState } from 'react';

type BookKey = 'Pinnacle' | 'FanDuel' | 'DraftKings';
type MarketTab = 'moneyline' | 'spread' | 'total';

type MoneylineRow = {
  team: string;
  Pinnacle: number;
  FanDuel: number;
  DraftKings: number;
};

type SpreadRow = {
  team: string;
  line: number;
  Pinnacle: number;
  FanDuel: number;
  DraftKings: number;
};

type TotalRow = {
  side: 'Over' | 'Under';
  line: number;
  Pinnacle: number;
  FanDuel: number;
  DraftKings: number;
};

type EventCard = {
  id: string;
  league: string;
  status: string;
  matchup: string;
  moneyline: MoneylineRow[];
  spread: SpreadRow[];
  total: TotalRow[];
};

const BOOKS: BookKey[] = ['Pinnacle', 'FanDuel', 'DraftKings'];

const SAMPLE_EVENTS: EventCard[] = [
  {
    id: '1',
    league: 'NBA',
    status: 'Live • Q3 07:42',
    matchup: 'Lakers vs Nuggets',
    moneyline: [
      { team: 'Lakers', Pinnacle: 145, FanDuel: 150, DraftKings: 148 },
      { team: 'Nuggets', Pinnacle: -160, FanDuel: -155, DraftKings: -158 },
    ],
    spread: [
      { team: 'Lakers', line: 4.5, Pinnacle: -108, FanDuel: -105, DraftKings: -110 },
      { team: 'Nuggets', line: -4.5, Pinnacle: -112, FanDuel: -115, DraftKings: -110 },
    ],
    total: [
      { side: 'Over', line: 228.5, Pinnacle: -110, FanDuel: -108, DraftKings: -105 },
      { side: 'Under', line: 228.5, Pinnacle: -110, FanDuel: -112, DraftKings: -115 },
    ],
  },
  {
    id: '2',
    league: 'NHL',
    status: 'Pregame • 8:10 PM',
    matchup: 'Rangers vs Bruins',
    moneyline: [
      { team: 'Rangers', Pinnacle: 122, FanDuel: 118, DraftKings: 125 },
      { team: 'Bruins', Pinnacle: -132, FanDuel: -128, DraftKings: -135 },
    ],
    spread: [
      { team: 'Rangers', line: 1.5, Pinnacle: -175, FanDuel: -170, DraftKings: -168 },
      { team: 'Bruins', line: -1.5, Pinnacle: 155, FanDuel: 150, DraftKings: 158 },
    ],
    total: [
      { side: 'Over', line: 5.5, Pinnacle: -102, FanDuel: 100, DraftKings: -105 },
      { side: 'Under', line: 5.5, Pinnacle: -118, FanDuel: -120, DraftKings: -115 },
    ],
  },
];

function formatAmericanOdds(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function bestBookForPrice(row: Record<BookKey, number>): BookKey[] {
  const best = Math.max(...BOOKS.map((book) => row[book]));
  return BOOKS.filter((book) => row[book] === best);
}

function bestBookForLineAndPrice(
  row: Record<BookKey, number>,
  preferredHigher: boolean
): BookKey[] {
  const values = BOOKS.map((book) => row[book]);
  const target = preferredHigher ? Math.max(...values) : Math.min(...values);
  return BOOKS.filter((book) => row[book] === target);
}

function bestSpreadBooks(line: number, row: Record<BookKey, number>): BookKey[] {
  const prefersHigherLine = line > 0;
  return bestBookForLineAndPrice(row, prefersHigherLine);
}

function bestTotalBooks(side: 'Over' | 'Under', row: Record<BookKey, number>): BookKey[] {
  const prefersHigherLine = side === 'Over';
  return bestBookForLineAndPrice(row, prefersHigherLine);
}

function statPill(text: string) {
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
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  );
}

export default function App() {
  const [market, setMarket] = useState<MarketTab>('moneyline');

  const lastUpdated = useMemo(() => {
    return new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }, []);

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
              {statPill('Mode: Demo')}
              {statPill(`Updated: ${lastUpdated}`)}
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
        {SAMPLE_EVENTS.map((event) => (
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
                gridTemplateColumns: 'minmax(120px, 1.4fr) repeat(3, minmax(72px, 1fr))',
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

              {market === 'moneyline' &&
                event.moneyline.map((row, idx) => {
                  const best = bestBookForPrice({
                    Pinnacle: row.Pinnacle,
                    FanDuel: row.FanDuel,
                    DraftKings: row.DraftKings,
                  });

                  return (
                    <React.Fragment key={`${event.id}-ml-${idx}`}>
                      <div
                        style={{
                          padding: '14px',
                          borderBottom:
                            idx === event.moneyline.length - 1 ? 'none' : '1px solid #182235',
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{row.team}</div>
                      </div>

                      {BOOKS.map((book) => {
                        const isBest = best.includes(book);
                        return (
                          <div
                            key={book}
                            style={{
                              padding: '14px 10px',
                              textAlign: 'center',
                              borderBottom:
                                idx === event.moneyline.length - 1
                                  ? 'none'
                                  : '1px solid #182235',
                              background: isBest ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                              color: isBest ? '#dcfce7' : '#e5e7eb',
                              fontWeight: 800,
                            }}
                          >
                            {formatAmericanOdds(row[book])}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}

              {market === 'spread' &&
                event.spread.map((row, idx) => {
                  const best = bestSpreadBooks(row.line, {
                    Pinnacle: row.Pinnacle,
                    FanDuel: row.FanDuel,
                    DraftKings: row.DraftKings,
                  });

                  return (
                    <React.Fragment key={`${event.id}-sp-${idx}`}>
                      <div
                        style={{
                          padding: '14px',
                          borderBottom:
                            idx === event.spread.length - 1 ? 'none' : '1px solid #182235',
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{row.team}</div>
                        <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                          {row.line > 0 ? '+' : ''}
                          {row.line}
                        </div>
                      </div>

                      {BOOKS.map((book) => {
                        const isBest = best.includes(book);
                        return (
                          <div
                            key={book}
                            style={{
                              padding: '14px 10px',
                              textAlign: 'center',
                              borderBottom:
                                idx === event.spread.length - 1
                                  ? 'none'
                                  : '1px solid #182235',
                              background: isBest ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                              color: isBest ? '#dcfce7' : '#e5e7eb',
                            }}
                          >
                            <div style={{ fontWeight: 700 }}>
                              {row.line > 0 ? '+' : ''}
                              {row.line}
                            </div>
                            <div style={{ fontSize: 13, color: isBest ? '#bbf7d0' : '#94a3b8' }}>
                              {formatAmericanOdds(row[book])}
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}

              {market === 'total' &&
                event.total.map((row, idx) => {
                  const best = bestTotalBooks(row.side, {
                    Pinnacle: row.Pinnacle,
                    FanDuel: row.FanDuel,
                    DraftKings: row.DraftKings,
                  });

                  return (
                    <React.Fragment key={`${event.id}-to-${idx}`}>
                      <div
                        style={{
                          padding: '14px',
                          borderBottom:
                            idx === event.total.length - 1 ? 'none' : '1px solid #182235',
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{row.side}</div>
                        <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                          {row.line}
                        </div>
                      </div>

                      {BOOKS.map((book) => {
                        const isBest = best.includes(book);
                        return (
                          <div
                            key={book}
                            style={{
                              padding: '14px 10px',
                              textAlign: 'center',
                              borderBottom:
                                idx === event.total.length - 1
                                  ? 'none'
                                  : '1px solid #182235',
                              background: isBest ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                              color: isBest ? '#dcfce7' : '#e5e7eb',
                            }}
                          >
                            <div style={{ fontWeight: 700 }}>{row.line}</div>
                            <div style={{ fontSize: 13, color: isBest ? '#bbf7d0' : '#94a3b8' }}>
                              {formatAmericanOdds(row[book])}
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
                }
