export default async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);

    const apiKey = (globalThis as any).process?.env?.THE_ODDS_API_KEY;

    if (!apiKey) {
      return json(
        {
          ok: false,
          error: "Missing THE_ODDS_API_KEY environment variable on Vercel.",
        },
        500
      );
    }

    const sport = url.searchParams.get("sport") || "basketball_nba";

    const upstream = new URL(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds`
    );

    upstream.searchParams.set("apiKey", apiKey);
    upstream.searchParams.set("regions", "us");
    upstream.searchParams.set("markets", "h2h,spreads,totals");
    upstream.searchParams.set("oddsFormat", "american");
    upstream.searchParams.set("bookmakers", "pinnacle,fanduel,draftkings");

    const res = await fetch(upstream.toString());

    const text = await res.text();

    return new Response(text, {
      status: res.status,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      500
    );
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });
}
