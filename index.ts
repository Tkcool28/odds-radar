import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { DemoAdapter, TheOddsApiAdapter } from './providers';
import type { DataMode, MarketKey, OddsFormat } from './types';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);
const apiKey = process.env.THE_ODDS_API_KEY || '';
const defaultMode = (process.env.DEFAULT_DATA_MODE as DataMode) || 'demo';

app.use(cors());
app.use(express.json());

function getAdapter(mode: DataMode) {
  if (mode === 'live') {
    if (!apiKey) {
      throw new Error('THE_ODDS_API_KEY is not configured');
    }
    return new TheOddsApiAdapter(apiKey);
  }
  return new DemoAdapter();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, defaultMode, liveConfigured: Boolean(apiKey) });
});

app.get('/api/sports', async (req, res) => {
  const mode = (req.query.mode as DataMode) || defaultMode;
  try {
    const adapter = getAdapter(mode);
    const sports = await adapter.listSports();
    res.json({ mode, sports });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/odds', async (req, res) => {
  const mode = (req.query.mode as DataMode) || defaultMode;
  const sport = (req.query.sport as string) || 'upcoming';
  const market = ((req.query.market as MarketKey) || 'h2h') as MarketKey;
  const oddsFormat = ((req.query.oddsFormat as OddsFormat) || 'american') as OddsFormat;

  try {
    const adapter = getAdapter(mode);
    const events = await adapter.getOdds({ sport, market, oddsFormat });
    res.json({
      mode,
      market,
      oddsFormat,
      events,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(port, () => {
  console.log(`Odds Radar server listening on http://localhost:${port}`);
});
