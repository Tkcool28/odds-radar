import type { BookOdds, NormalizedEvent, ProviderAdapter, ProviderQuery } from './types';
import { demoEvents, demoSports } from './mockData';

const BOOKMAKERS = ['draftkings', 'fanduel', 'pinnacle'] as const;
const BOOK_TITLES: Record<string, string> = {
  draftkings: 'DraftKings',
  fanduel: 'FanDuel',
  pinnacle: 'Pinnacle'
};

function inferLiveFromScoresPayload(item: any): boolean {
  if (typeof item.completed === 'boolean' && item.completed) return false;
  if (Array.isArray(item.scores) && item.scores.length > 0 && !item.completed) return true;
  return false;
}

function normalizeBookmakers(bookmakers: any[]): BookOdds[] {
  return bookmakers
    .filter((book) => BOOKMAKERS.includes(book.key))
    .map((book) => ({
      key: book.key,
      title: book.title ?? BOOK_TITLES[book.key] ?? book.key,
      lastUpdate: book.last_update,
      markets: (book.markets ?? []).map((market: any) => ({
        key: market.key,
        outcomes: (market.outcomes ?? []).map((outcome: any) => ({
          name: outcome.name,
          price: outcome.price,
          point: outcome.point
        }))
      }))
    }));
}

export class DemoAdapter implements ProviderAdapter {
  async listSports() {
    return demoSports;
  }

  async getOdds(query: ProviderQuery): Promise<NormalizedEvent[]> {
    return demoEvents
      .filter((event) => query.sport === 'upcoming' || event.sport === query.sport)
      .filter((event) => event.books.some((book) => book.markets.some((market) => market.key === query.market)));
  }
}

export class TheOddsApiAdapter implements ProviderAdapter {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listSports() {
    const url = new URL('https://api.the-odds-api.com/v4/sports');
    url.searchParams.set('apiKey', this.apiKey);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sports: ${response.status}`);
    }

    const data = await response.json();
    return data.map((sport: any) => ({
      key: sport.key,
      title: sport.title,
      group: sport.group
    }));
  }

  async getOdds(query: ProviderQuery): Promise<NormalizedEvent[]> {
    const oddsUrl = new URL(`https://api.the-odds-api.com/v4/sports/${query.sport}/odds`);
    oddsUrl.searchParams.set('apiKey', this.apiKey);
    oddsUrl.searchParams.set('bookmakers', BOOKMAKERS.join(','));
    oddsUrl.searchParams.set('markets', query.market);
    oddsUrl.searchParams.set('oddsFormat', query.oddsFormat);
    oddsUrl.searchParams.set('dateFormat', 'iso');

    const scoresUrl = new URL(`https://api.the-odds-api.com/v4/sports/${query.sport}/scores`);
    scoresUrl.searchParams.set('apiKey', this.apiKey);
    scoresUrl.searchParams.set('daysFrom', '1');
    scoresUrl.searchParams.set('dateFormat', 'iso');

    const [oddsResponse, scoresResponse] = await Promise.allSettled([
      fetch(oddsUrl),
      fetch(scoresUrl)
    ]);

    if (oddsResponse.status !== 'fulfilled' || !oddsResponse.value.ok) {
      const status = oddsResponse.status === 'fulfilled' ? oddsResponse.value.status : 'network';
      throw new Error(`Failed to fetch odds: ${status}`);
    }

    const oddsData = await oddsResponse.value.json();
    const scoresData =
      scoresResponse.status === 'fulfilled' && scoresResponse.value.ok ? await scoresResponse.value.json() : [];

    const scoreMap = new Map<string, any>();
    for (const item of scoresData) {
      scoreMap.set(item.id, item);
    }

    return oddsData.map((item: any) => {
      const scoreItem = scoreMap.get(item.id);
      const normalized: NormalizedEvent = {
        id: item.id,
        sport: item.sport_key,
        league: item.sport_title,
        homeTeam: item.home_team,
        awayTeam: item.away_team,
        commenceTime: item.commence_time,
        isLive: scoreItem ? inferLiveFromScoresPayload(scoreItem) : false,
        completed: scoreItem?.completed,
        scores: scoreItem?.scores,
        books: normalizeBookmakers(item.bookmakers ?? [])
      };
      return normalized;
    });
  }
}
