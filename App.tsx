import React from 'react';

export default function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0b1220',
        color: '#e5e7eb',
        fontFamily: 'Arial, sans-serif',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            margin: '0 0 8px 0',
            fontSize: '32px',
            lineHeight: 1.1,
          }}
        >
          Odds Radar
        </h1>

        <p
          style={{
            margin: '0 0 24px 0',
            color: '#94a3b8',
            fontSize: '16px',
          }}
        >
          PWA shell is live. Core deployment is working.
        </p>

        <div
          style={{
            display: 'grid',
            gap: '16px',
          }}
        >
          <div
            style={{
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '16px',
              padding: '16px',
            }}
          >
            <h2
              style={{
                margin: '0 0 8px 0',
                fontSize: '20px',
              }}
            >
              Status
            </h2>
            <p
              style={{
                margin: 0,
                color: '#cbd5e1',
              }}
            >
              The app is deployed and rendering. Next step is wiring the live
              odds comparison logic back in cleanly.
            </p>
          </div>

          <div
            style={{
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '16px',
              padding: '16px',
            }}
          >
            <h2
              style={{
                margin: '0 0 8px 0',
                fontSize: '20px',
              }}
            >
              Planned Features
            </h2>
            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                color: '#cbd5e1',
                lineHeight: 1.7,
              }}
            >
              <li>Compare Pinnacle, FanDuel, and DraftKings</li>
              <li>Highlight best available odds</li>
              <li>Support live and pregame views</li>
              <li>Android-friendly installable PWA</li>
            </ul>
          </div>

          <div
            style={{
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '16px',
              padding: '16px',
            }}
          >
            <h2
              style={{
                margin: '0 0 8px 0',
                fontSize: '20px',
              }}
            >
              Next Move
            </h2>
            <p
              style={{
                margin: 0,
                color: '#cbd5e1',
              }}
            >
              Once this builds successfully, we can restore the real odds
              dashboard in smaller, safer pieces.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
