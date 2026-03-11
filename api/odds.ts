export default async function handler(req, res) {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        ok: false,
        error: "Missing API key"
      });
    }

    const sport = req.query.sport || "basketball_nba";

    const url =
      `https://api.the-odds-api.com/v4/sports/${sport}/odds` +
      `?apiKey=${apiKey}` +
      `&regions=us` +
      `&markets=h2h,spreads,totals` +
      `&oddsFormat=american` +
      `&bookmakers=pinnacle,draftkings,fanduel`;

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        ok: false,
        error: text
      });
    }

    const data = await response.json();

    return res.status(200).json({
      ok: true,
      games: data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
