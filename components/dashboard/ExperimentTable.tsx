'use client';
// W8 — Experiment Table
// Running experiments with variant counts, goal-metric delta, significance badge.
// Significance badge: p-value / CI from seeded data.

import type { ExperimentTableProps } from './types';

const EXPERIMENT_LABELS: Record<string, string> = {
  uc_tipping_ui: 'Checkout Tip UI',
  post_donate_share_prompt: 'Post-Donate Share Prompt',
  share_channel_reorder: 'Share Channel Order',
  progress_bar_urgency_copy: 'Progress Bar Urgency Copy',
};

export function ExperimentTable({ rows, onRowClick }: ExperimentTableProps) {
  return (
    <div id="experiments" style={{ width: '100%', overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
          tableLayout: 'auto',
        }}
        aria-label="Running experiments"
      >
        <thead>
          <tr>
            {['Experiment', 'Variant', 'Exposures', 'Control', 'Test', 'Uplift', 'Status'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '8px 12px',
                  textAlign: h === 'Experiment' ? 'left' : 'right',
                  fontWeight: 700,
                  fontSize: 11,
                  color: '#6f6f6f',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '2px solid #e8e8e8',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.key}
              onClick={() => onRowClick(row.key)}
              style={{
                cursor: 'pointer',
                background: i % 2 === 0 ? '#fff' : '#fafafa',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#fff8e6'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#fafafa'; }}
              aria-label={`Experiment: ${EXPERIMENT_LABELS[row.key] ?? row.key}`}
            >
              {/* Name */}
              <td style={{ padding: '10px 12px', fontWeight: 600, color: '#232323', textAlign: 'left' }}>
                {EXPERIMENT_LABELS[row.key] ?? row.key}
              </td>
              {/* Variant */}
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: row.variant === 'test' ? '#e8f5e9' : '#f5f5f5',
                    color: row.variant === 'test' ? '#2e7d32' : '#555',
                  }}
                >
                  {row.variant}
                </span>
              </td>
              {/* Exposures */}
              <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>
                {row.exposures.toLocaleString()}
              </td>
              {/* Control */}
              <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>
                {row.control.toFixed(1)}%
              </td>
              {/* Test */}
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#232323' }}>
                {row.conversionPct.toFixed(1)}%
              </td>
              {/* Uplift */}
              <td
                style={{
                  padding: '10px 12px',
                  textAlign: 'right',
                  fontWeight: 700,
                  color: row.uplift > 0 ? '#2e7d32' : '#e03131',
                }}
              >
                {row.uplift > 0 ? '+' : ''}{row.uplift.toFixed(1)}%
              </td>
              {/* Significance badge */}
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                <SignificanceBadge significant={row.significant} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SignificanceBadge({ significant }: { significant: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 20,
        background: significant ? '#e8f5e9' : '#fff3e0',
        color: significant ? '#2e7d32' : '#e65100',
        whiteSpace: 'nowrap',
      }}
      aria-label={significant ? 'Statistically significant' : 'Not yet significant'}
    >
      {significant ? '✓ Significant' : '⧗ Running'}
    </span>
  );
}
