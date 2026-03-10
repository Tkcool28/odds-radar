export default async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') || 'debug';
    const env = (globalThis as any).process?.env ?? {};
    const apiKey = env.THE_ODDS_API_KEY;

    if (mode === 'debug') {
      return json({
        ok: true,
        mode: 'debug',
        hasApiKey: Boolean(apiKey),
        message: 'Function is running.',
      });
    }

    if (!apiKey) {
      return json(
        {
          ok: false,
          error: 'Missing THE_ODDS_API_KEY environment variable on Vercel.',
        },
        500
      );
    }

    if (mode === 'sports') {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const res = await fetch(
          `https://api.the-odds-api.com/v4/sports/?apiKey=${encodeURIComponent(apiKey)}`,
          {
            method: 'GET',
            headers: { accept: 'application/json' },
            signal: controller.signal,
            cache: 'no-store',
          }
        );

        const text = await res.text();

        return new Response(text, {
          status: res.status,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
          },
        });
      } finally {
        clearTimeout(timeout);
      }
    }

    return json({
      ok: false,
      error: 'Unknown mode. Use ?mode=debug or ?mode=sports',
    }, 400);
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
    },
  });
          }
