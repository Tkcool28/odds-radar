export default async function handler(req: Request): Promise<Response> {
  const startedAt = Date.now();

  try {
    const url = new URL(req.url);
    const env = (globalThis as any).process?.env ?? {};
    const apiKey = env.THE_ODDS_API_KEY;

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

    const upstream = new URL(`https://api.the-odds-api.com/v4/sports/${sport}/odds`);
    upstream.searchParams.set('apiKey', apiKey);
    upstream.searchParams.set('regions', 'us');
    upstream.searchParams.set('markets', 'h2h,spreads,totals');
    upstream.searchParams.set('oddsFormat', 'american');
    upstream.searchParams.set('dateFormat', 'iso');
    upstream.searchParams.set('bookmakers', 'pinnacle,fanduel,draftkings');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let res: Response;
    try {
      res = await fetch(upstream.toString(), {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store',
      });
    } finally {
      clearTimeout(timeout);
    }

    const text = await res.text();

    return new Response(text, {
      status: res.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-debug-upstream-status': String(res.status),
        'x-debug-duration-ms': String(Date.now() - startedAt),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown server error';

    return json(
      {
        ok: false,
        error: message,
        timedOut:
          message.toLowerCase().includes('abort') ||
          message.toLowerCase().includes('timeout'),
        durationMs: Date.now() - startedAt,
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
    },
  });
}
