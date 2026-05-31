'use client';
// W6 — Active Now panel
// Live count of active sessions + per-persona colored dots.
// Derived from the SSE stream via liveIncrements.ts in the parent.

import type { ActiveNowProps } from './types';
import { PERSONAS } from '@/fixtures/personas';
import type { PersonaSlug } from '@/lib/personas/types';

const PERSONA_LABELS: Record<string, string> = {
  anonymous: 'Anonymous',
  close_friend: 'Close friend',
  extrovert: 'Extrovert',
  shared_by_extro: 'Shared-link visitor',
  returning_lapsed: 'Returning donor',
  profile_owner: 'Profile owner',
};

export function ActiveNow({ stat, anchor }: ActiveNowProps) {
  return (
    <div
      id={anchor}
      style={{
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: 12,
        padding: '20px 20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
      aria-label="Active visitors now"
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6f6f6f', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Active Now
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: '#232323',
              lineHeight: 1,
            }}
          >
            {stat.liveVisitors}
          </span>
          <span style={{ fontSize: 14, color: '#6f6f6f' }}>visitors</span>
          {/* Live pulse dot */}
          <span
            aria-hidden="true"
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#4a9d44',
              display: 'inline-block',
              marginLeft: 4,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.3); }
          }
        `}</style>
      </div>

      {/* Top page */}
      <div>
        <div style={{ fontSize: 11, color: '#9e9e9e', marginBottom: 2 }}>Top page</div>
        <div
          style={{
            fontSize: 11,
            color: '#232323',
            fontFamily: 'monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={stat.topPage}
        >
          {stat.topPage}
        </div>
      </div>

      {/* Per-persona breakdown */}
      <div>
        <div style={{ fontSize: 11, color: '#9e9e9e', marginBottom: 8 }}>By persona</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {stat.byPersona.filter((b) => b.n > 0).map((b) => {
            const bg = PERSONAS[b.persona as PersonaSlug]?.avatar.bg ?? '#b7b7b6';
            return (
              <div key={b.persona} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: bg,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, color: '#555', flex: 1 }}>
                  {PERSONA_LABELS[b.persona] ?? b.persona}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#232323' }}>
                  {b.n}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
