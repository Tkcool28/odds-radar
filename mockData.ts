import type { NormalizedEvent } from './types';

const now = Date.now();

export const demoSports = [
  { key: 'basketball_nba', title: 'NBA', group: 'Basketball' },
  { key: 'americanfootball_nfl', title: 'NFL', group: 'Football' },
  { key: 'icehockey_nhl', title: 'NHL', group: 'Hockey' },
  { key: 'baseball_mlb', title: 'MLB', group: 'Baseball' }
];

export const demoEvents: NormalizedEvent[] = [
  {
    id: 'evt_nba_live_1',
    sport: 'basketball_nba',
    league: 'NBA',
    homeTeam: 'Denver Nuggets',
    awayTeam: 'Phoenix Suns',
    commenceTime: new Date(now - 35 * 60 * 1000).toISOString(),
    isLive: true,
    scores: [
      { name: 'Phoenix Suns', score: '58' },
      { name: 'Denver Nuggets', score: '61' }
    ],
    books: [
      {
        key: 'pinnacle',
        title: 'Pinnacle',
        lastUpdate: new Date(now - 15 * 1000).toISOString(),
        markets: [
          { key: 'h2h', outcomes: [
            { name: 'Phoenix Suns', price: 138 },
            { name: 'Denver Nuggets', price: -152 }
          ]},
          { key: 'spreads', outcomes: [
            { name: 'Phoenix Suns', price: -108, point: 3.5 },
            { name: 'Denver Nuggets', price: -104, point: -3.5 }
          ]},
          { key: 'totals', outcomes: [
            { name: 'Over', price: -101, point: 228.5 },
            { name: 'Under', price: -109, point: 228.5 }
          ]}
        ]
      },
      {
        key: 'fanduel',
        title: 'FanDuel',
        lastUpdate: new Date(now - 20 * 1000).toISOString(),
        markets: [
          { key: 'h2h', outcomes: [
            { name: 'Phoenix Suns', price: 142 },
            { name: 'Denver Nuggets', price: -160 }
          ]},
          { key: 'spreads', outcomes: [
            { name: 'Phoenix Suns', price: -105, point: 3.5 },
            { name: 'Denver Nuggets', price: -115, point: -3.5 }
          ]},
          { key: 'totals', outcomes: [
            { name: 'Over', price: -102, point: 229.5 },
            { name: 'Under', price: -118, point: 229.5 }
          ]}
        ]
      },
      {
        key: 'draftkings',
        title: 'DraftKings',
        lastUpdate: new Date(now - 18 * 1000).toISOString(),
        markets: [
          { key: 'h2h', outcomes: [
            { name: 'Phoenix Suns', price: 135 },
            { name: 'Denver Nuggets', price: -155 }
          ]},
          { key: 'spreads', outcomes: [
            { name: 'Phoenix Suns', price: -102, point: 4.0 },
            { name: 'Denver Nuggets', price: -118, point: -4.0 }
          ]},
          { key: 'totals', outcomes: [
            { name: 'Over', price: -110, point: 228.5 },
            { name: 'Under', price: -110, point: 228.5 }
          ]}
        ]
      }
    ]
  },
  {
    id: 'evt_nhl_up_1',
    sport: 'icehockey_nhl',
    league: 'NHL',
    homeTeam: 'Colorado Avalanche',
    awayTeam: 'Dallas Stars',
    commenceTime: new Date(now + 42 * 60 * 1000).toISOString(),
    isLive: false,
    books: [
      {
        key: 'pinnacle',
        title: 'Pinnacle',
        lastUpdate: new Date(now - 30 * 1000).toISOString(),
        markets: [
          { key: 'h2h', outcomes: [
            { name: 'Dallas Stars', price: 118 },
            { name: 'Colorado Avalanche', price: -126 }
          ]},
          { key: 'spreads', outcomes: [
            { name: 'Dallas Stars', price: -108, point: 1.5 },
            { name: 'Colorado Avalanche', price: -102, point: -1.5 }
          ]},
          { key: 'totals', outcomes: [
            { name: 'Over', price: 102, point: 6.0 },
            { name: 'Under', price: -114, point: 6.0 }
          ]}
        ]
      },
      {
        key: 'fanduel',
        title: 'FanDuel',
        lastUpdate: new Date(now - 26 * 1000).toISOString(),
        markets: [
          { key: 'h2h', outcomes: [
            { name: 'Dallas Stars', price: 120 },
            { name: 'Colorado Avalanche', price: -130 }
          ]},
          { key: 'spreads', outcomes: [
            { name: 'Dallas Stars', price: -104, point: 1.5 },
            { name: 'Colorado Avalanche', price: -118, point: -1.5 }
          ]},
          { key: 'totals', outcomes: [
            { name: 'Over', price: 100, point: 6.0 },
            { name: 'Under', price: -120, point: 6.0 }
          ]}
        ]
      },
      {
        key: 'draftkings',
        title: 'DraftKings',
        lastUpdate: new Date(now - 22 * 1000).toISOString(),
        markets: [
          { key: 'h2h', outcomes: [
            { name: 'Dallas Stars', price: 115 },
            { name: 'Colorado Avalanche', price: -135 }
          ]},
          { key: 'spreads', outcomes: [
            { name: 'Dallas Stars', price: -115, point: 1.5 },
            { name: 'Colorado Avalanche', price: -105, point: -1.5 }
          ]},
          { key: 'totals', outcomes: [
            { name: 'Over', price: -105, point: 5.5 },
            { name: 'Under', price: -115, point: 5.5 }
          ]}
        ]
      }
    ]
  },
  {
    id: 'evt_mlb_live_1',
    sport: 'baseball_mlb',
    league: 'MLB',
    homeTeam: 'Los Angeles Dodgers',
    awayTeam: 'Atlanta Braves',
    commenceTime: new Date(now - 70 * 60 * 1000).toISOString(),
    isLive: true,
    scores: [
      { name: 'Atlanta Braves', score: '2' },
      { name: 'Los Angeles Dodgers', score: '3' }
    ],
    books: [
      {
        key: 'pinnacle',
        title: 'Pinnacle',
        lastUpdate: new Date(now - 12 * 1000).toISOString(),
        markets: [
          { key: 'h2h', outcomes: [
            { name: 'Atlanta Braves', price: 110 },
            { name: 'Los Angeles Dodgers', price: -118 }
          ]},
          { key: 'spreads', outcomes: [
            { name: 'Atlanta Braves', price: -135, point: 1.5 },
            { name: 'Los Angeles Dodgers', price: 118, point: -1.5 }
          ]},
          { key: 'totals', outcomes: [
            { name: 'Over', price: 100, point: 8.5 },
            { name: 'Under', price: -112, point: 8.5 }
          ]}
        ]
      },
      {
        key: 'fanduel',
        title: 'FanDuel',
        lastUpdate: new Date(now - 16 * 1000).toISOString(),
        markets: [
          { key: 'h2h', outcomes: [
            { name: 'Atlanta Braves', price: 108 },
            { name: 'Los Angeles Dodgers', price: -122 }
          ]},
          { key: 'spreads', outcomes: [
            { name: 'Atlanta Braves', price: -138, point: 1.5 },
            { name: 'Los Angeles Dodgers', price: 114, point: -1.5 }
          ]},
          { key: 'totals', outcomes: [
            { name: 'Over', price: -102, point: 8.5 },
            { name: 'Under', price: -118, point: 8.5 }
          ]}
        ]
      },
      {
        key: 'draftkings',
        title: 'DraftKings',
        lastUpdate: new Date(now - 17 * 1000).toISOString(),
        markets: [
          { key: 'h2h', outcomes: [
            { name: 'Atlanta Braves', price: 112 },
            { name: 'Los Angeles Dodgers', price: -125 }
          ]},
          { key: 'spreads', outcomes: [
            { name: 'Atlanta Braves', price: -142, point: 1.5 },
            { name: 'Los Angeles Dodgers', price: 120, point: -1.5 }
          ]},
          { key: 'totals', outcomes: [
            { name: 'Over', price: -105, point: 9.0 },
            { name: 'Under', price: -115, point: 9.0 }
          ]}
        ]
      }
    ]
  }
];
