export default async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);

    const apiKey = process.env.THE_ODDS_API_KEY;
    if (!apiKey) {
      return json(
        {
          ok: false,
          error: 'Missing THE_ODDS_API_KEY environment variable on Vercel.',
        },
        500
      );
    }

    const sport = url.searchParams.get('sport') || 'basketball_nba';
    const markets = url.searchParams.get('markets') || 'h2h,spreads,totals';
    const regions = url.searchParams.get('regions') || 'us';
    const oddsFormat = url.searchParams.get('oddsFormat') || 'american';
    const dateFormat = url.searchParams.get('dateFormat') || 'iso';

    const upstream = new URL(`https://api.the-odds-api.com/v4/sports/${sport}/odds`);
    upstream.searchParams.set('apiKey', apiKey);
    upstream.searchParams.set('regions', regions);
    upstream.searchParams.set('markets', markets);
    upstream.searchParams.set('oddsFormat', oddsFormat);
    upstream.searchParams.set('dateFormat', dateFormat);
    upstream.searchParams.set('bookmakers', 'pinnacle,fanduel,draftkings');

    const res = await fetch(upstream.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await res.text();

    return new Response(text, {
      status: res.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'access-control-allow-origin': '*',
      },
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown server error',
      },
      500
    );
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    },
  });
      }
