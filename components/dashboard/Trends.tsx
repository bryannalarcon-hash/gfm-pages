'use client';
// W7 — Trends panel using @nivo/line
// Default: Share Clicked grouped by share_channel, last 7 days.
// Live increments: streamed Share Clicked events increment the last data point (today).

import { ResponsiveLine } from '@nivo/line';
import type { TrendsProps } from './types';

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: '#25d366',
  facebook: '#1877f2',
  copy_link: '#ffd863',
  x: '#1da1f2',
  sms: '#ff6600',
  messenger: '#0084ff',
  email: '#b7b7b6',
  native_share: '#4a9d44',
  embed: '#9e9e9e',
};

export function Trends({ series }: TrendsProps) {
  if (!series.length) {
    return (
      <div id="share-trends" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e', fontSize: 13 }}>
        No trend data available.
      </div>
    );
  }

  return (
    <div id="share-trends" style={{ width: '100%' }}>
      <div style={{ height: 280 }}>
        <ResponsiveLine
          data={series}
          margin={{ top: 20, right: 130, bottom: 50, left: 45 }}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false }}
          curve="monotoneX"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -30,
            legend: 'Date',
            legendOffset: 44,
            legendPosition: 'middle',
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Share clicks',
            legendOffset: -38,
            legendPosition: 'middle',
          }}
          colors={(d) => CHANNEL_COLORS[d.id] ?? '#b7b7b6'}
          pointSize={6}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          enablePoints
          enableGridX={false}
          enableArea={false}
          useMesh
          tooltip={({ point }) => (
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
              <strong style={{ color: point.serieColor }}>{point.serieId}</strong>
              <div>{String(point.data.x)}: {String(point.data.y)} clicks</div>
            </div>
          )}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 120,
              translateY: 0,
              itemsSpacing: 3,
              itemDirection: 'left-to-right',
              itemWidth: 100,
              itemHeight: 16,
              itemOpacity: 0.85,
              symbolSize: 10,
              symbolShape: 'circle',
              symbolBorderColor: 'rgba(0, 0, 0, .5)',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemBackground: 'rgba(0, 0, 0, .03)',
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ]}
          animate
          motionConfig="gentle"
        />
      </div>
    </div>
  );
}
