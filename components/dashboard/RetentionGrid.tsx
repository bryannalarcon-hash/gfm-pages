'use client';
// W3 — Cohort Retention Grid using @nivo/heatmap
// Rows = D0 cohorts (weekly buckets); columns = D1/D7/D14/D30/D60.
// Cell color encodes retention % (darker = better).
// Mode toggle: n_day vs unbounded.

import { useState } from 'react';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import type { RetentionGridProps } from './types';

export function RetentionGrid({ cohorts, mode: initialMode }: RetentionGridProps) {
  const [mode, setMode] = useState<'n_day' | 'unbounded'>(initialMode);

  // Transform cohorts into heatmap-friendly format
  // Each "row" is a cohort; each cell is a day column.
  const DAY_LABELS = ['D1', 'D7', 'D14', 'D30', 'D60'];
  const DAY_VALS = [1, 7, 14, 30, 60] as const;

  const heatmapData = cohorts.map((c) => ({
    id: c.cohort,
    data: DAY_VALS.map((day, i) => {
      const cell = c.cells.find((x) => x.day === day);
      return {
        x: DAY_LABELS[i],
        y: cell?.pct ?? null,
        n: cell?.n ?? 0,
      };
    }),
  }));

  return (
    <div style={{ width: '100%' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['n_day', 'unbounded'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              fontSize: 12,
              padding: '4px 12px',
              border: '1px solid #e8e8e8',
              borderRadius: 20,
              background: mode === m ? '#ffd863' : '#f5f5f5',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#232323',
            }}
          >
            {m === 'n_day' ? 'N-day' : 'Unbounded'}
          </button>
        ))}
        <span style={{ fontSize: 11, color: '#9e9e9e', alignSelf: 'center' }}>
          {mode === 'n_day' ? 'Returned exactly on day N' : 'Returned on day N or later'}
        </span>
      </div>

      {/* Heatmap */}
      <div style={{ height: 220, overflowX: 'auto' }}>
        <div style={{ minWidth: 400, height: '100%' }}>
          <ResponsiveHeatMap
            data={heatmapData}
            margin={{ top: 20, right: 30, bottom: 60, left: 120 }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Days after first visit',
              legendOffset: 40,
              legendPosition: 'middle',
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
            }}
            colors={{
              type: 'sequential',
              scheme: 'yellow_orange_brown',
              minValue: 0,
              maxValue: 100,
            }}
            emptyColor="#f0f0f0"
            borderRadius={3}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.5]] }}
            enableLabels
            labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
            tooltip={({ cell }) => (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e8e8e8',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }}
              >
                <strong>{cell.serieId} — {cell.data.x}</strong>
                <div>
                  {cell.data.y !== null ? `${cell.data.y}% retention` : 'No data yet'}
                  {(cell.data as { n?: number }).n ? ` (n=${(cell.data as { n?: number }).n})` : ''}
                </div>
              </div>
            )}
            animate
            motionConfig="gentle"
          />
        </div>
      </div>
    </div>
  );
}
