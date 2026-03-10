export type OddsFormat = 'american' | 'decimal';
export type DataMode = 'demo' | 'live';
export type MarketKey = 'h2h' | 'spreads' | 'totals';

export interface ProviderQuery {
  sport: string;
  market: MarketKey;
  oddsFormat: OddsFormat;
}

export interface BookOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface BookMarket {
  key: MarketKey;
  outcomes: BookOutcome[];
}

export interface BookOdds {
  key: string;
  title: string;
  lastUpdate?: string;
  markets: BookMarket[];
}

export interface NormalizedEvent {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  isLive: boolean;
  completed?: boolean;
  scores?: Array<{ name: string; score: string }>;
  books: BookOdds[];
}

export interface ProviderAdapter {
  listSports: () => Promise<Array<{ key: string; title: string; group?: string }>>;
  getOdds: (query: ProviderQuery) => Promise<NormalizedEvent[]>;
}
