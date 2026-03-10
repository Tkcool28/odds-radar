export default function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    message: 'api route is working',
    method: req.method,
    hasApiKey: Boolean(process.env.THE_ODDS_API_KEY),
    query: req.query ?? {},
  });
}
