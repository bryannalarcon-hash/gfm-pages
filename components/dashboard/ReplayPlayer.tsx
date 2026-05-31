'use client';
// ReplayPlayer — Session replay player (mock DOM reconstruction).
// The 5 credibility features per design-dashboard.md:
// 1. Typed event markers on a scrubber at correct relative timestamps
// 2. Rage-click badge on the list row (done in ReplayList)
// 3. Breadcrumb panel synced to scrubber position (click → jump)
// 4. Network tab — status-color-coded, 1-2 red
// 5. Privacy-masked input element visible in DOM reconstruction (payment frame)

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReplayPlayerProps } from './types';

type Marker = { tsSec: number; type: 'error' | 'click' | 'nav' | 'vital' };

const MARKER_COLORS: Record<string, string> = {
  error: '#e03131',
  click: '#228be6',
  nav: '#2f9e44',
  vital: '#f59f00',
};

const MARKER_LABELS: Record<string, string> = {
  error: 'Error',
  click: 'Click',
  nav: 'Navigation',
  vital: 'Web vital',
};

function statusColor(status: number): string {
  if (status >= 500) return '#e03131';
  if (status >= 400) return '#f08c00';
  if (status >= 300) return '#228be6';
  return '#2f9e44';
}

// ── Frame definitions ─────────────────────────────────────────────────────────
// Each frame is active from `fromSec` until the next frame's `fromSec`.
// The active frame is the LAST entry whose fromSec <= currentSec.

export interface ReplayFrame {
  id: string;
  fromSec: number;
  label: string;
}

export const REPLAY_FRAMES: ReplayFrame[] = [
  { id: 'landing',      fromSec: 0,  label: 'Fundraiser Landing' },
  { id: 'story',        fromSec: 20, label: 'Story Scrolled' },
  { id: 'donate-panel', fromSec: 45, label: 'Amount Selected' },
  { id: 'payment',      fromSec: 65, label: 'Payment Form' },
  { id: 'confirmation', fromSec: 85, label: 'Donation Complete' },
];

/** Pure function — returns the frame id active at a given second. Exported for unit tests. */
export function frameForSec(sec: number): string {
  let active = REPLAY_FRAMES[0];
  for (const frame of REPLAY_FRAMES) {
    if (frame.fromSec <= sec) active = frame;
    else break;
  }
  return active.id;
}

// ── Per-frame content renderers ───────────────────────────────────────────────

function FrameLanding() {
  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#232323', marginBottom: 8 }}>
        Wildfire Safety Fundraiser
      </div>
      <div style={{ fontSize: 12, color: '#6f6f6f', marginBottom: 10 }}>
        Help fund real-time alerts keeping communities safe during wildfire season.
      </div>
      {/* Story skeleton */}
      <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3, marginBottom: 6 }} />
      <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3, width: '85%', marginBottom: 6 }} />
      <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3, width: '70%', marginBottom: 12 }} />
      {/* Progress bar */}
      <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3, marginBottom: 4 }}>
        <div style={{ height: '100%', width: '62%', background: '#ffd863', borderRadius: 3 }} />
      </div>
      <div style={{ fontSize: 11, color: '#6f6f6f' }}>$6,200 raised of $10,000 goal</div>
      {/* Scroll indicator — near top */}
      <div style={{ marginTop: 12, fontSize: 10, color: '#b7b7b6', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ display: 'inline-block', width: 3, height: 20, background: '#e8e8e8', borderRadius: 2, position: 'relative' }}>
          <span style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '25%', background: '#ffd863', borderRadius: 2 }} />
        </span>
        Scroll position: top
      </div>
    </div>
  );
}

function FrameStory() {
  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#232323', marginBottom: 8 }}>
        Wildfire Safety Fundraiser
      </div>
      {/* Story content (scrolled in) */}
      <div style={{ fontSize: 12, color: '#232323', marginBottom: 6, lineHeight: 1.5 }}>
        Last year&apos;s fires destroyed over 400 homes. Watch Duty needs continuous funding…
      </div>
      <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3, marginBottom: 5 }} />
      <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3, width: '75%', marginBottom: 5 }} />
      <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3, width: '55%', marginBottom: 12 }} />
      {/* Donate CTA visible lower on page */}
      <div style={{ padding: '8px 14px', background: '#ffd863', borderRadius: 6, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#232323', marginBottom: 10 }}>
        Donate now
      </div>
      {/* Scroll indicator — mid-page */}
      <div style={{ fontSize: 10, color: '#b7b7b6', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ display: 'inline-block', width: 3, height: 20, background: '#e8e8e8', borderRadius: 2, position: 'relative' }}>
          <span style={{ position: 'absolute', top: '40%', left: 0, width: '100%', height: '25%', background: '#ffd863', borderRadius: 2 }} />
        </span>
        Scroll position: mid
      </div>
    </div>
  );
}

function FrameDonatePanel() {
  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#232323', marginBottom: 10 }}>
        Choose an amount
      </div>
      {/* Amount buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {['$25', '$50', '$100', '$250'].map((amt) => (
          <div
            key={amt}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: amt === '$50' ? '2px solid #232323' : '1px solid #e8e8e8',
              background: amt === '$50' ? '#ffd863' : '#f5f5f5',
              fontWeight: amt === '$50' ? 700 : 400,
              fontSize: 13,
              color: '#232323',
              cursor: 'default',
            }}
          >
            {amt}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: '#6f6f6f', marginBottom: 8 }}>
        Amount selected: <strong>$50</strong>
      </div>
      {/* Tip row */}
      <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3, width: '80%', marginBottom: 6 }} />
      <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3, width: '60%' }} />
    </div>
  );
}

function FramePayment() {
  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#232323', marginBottom: 10 }}>
        Payment details
      </div>
      {/* Name field */}
      <label style={{ fontSize: 11, color: '#6f6f6f', display: 'block', marginBottom: 3 }}>
        Full name
      </label>
      <div
        style={{
          height: 32,
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 6,
          marginBottom: 8,
        }}
      />
      {/* CREDIBILITY FEATURE 5: Privacy-masked card input */}
      <label style={{ fontSize: 11, color: '#6f6f6f', display: 'block', marginBottom: 3 }}>
        Card number
      </label>
      <div
        aria-label="Masked input"
        style={{
          height: 32,
          borderRadius: 6,
          border: '1px dashed #bbb',
          backgroundImage:
            'repeating-linear-gradient(45deg, #d0d0d0 0px, #d0d0d0 4px, #e8e8e8 4px, #e8e8e8 10px)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 10,
          fontSize: 11,
          color: '#9e9e9e',
          fontStyle: 'italic',
          marginBottom: 8,
          userSelect: 'none',
        }}
      >
        Masked input
      </div>
      <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3, width: '60%', marginBottom: 6 }} />
      <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3, width: '40%' }} />
    </div>
  );
}

function FrameConfirmation() {
  return (
    <div style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>
        ✓
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#232323', marginBottom: 4 }}>
        Thank you
      </div>
      <div style={{ fontSize: 12, color: '#6f6f6f', marginBottom: 10 }}>
        Donation complete — your $50 is on its way.
      </div>
      {/* Share / follow nudge skeleton */}
      <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3, width: '70%', margin: '0 auto 6px' }} />
      <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3, width: '50%', margin: '0 auto' }} />
    </div>
  );
}

const FRAME_RENDERERS: Record<string, () => React.ReactNode> = {
  landing:      () => <FrameLanding />,
  story:        () => <FrameStory />,
  'donate-panel': () => <FrameDonatePanel />,
  payment:      () => <FramePayment />,
  confirmation: () => <FrameConfirmation />,
};

// ── Main component ────────────────────────────────────────────────────────────

export function ReplayPlayer({ session }: ReplayPlayerProps) {
  const [currentSec, setCurrentSec] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1 | 2 | 4>(1);
  const [skipInactivity, setSkipInactivity] = useState(false);
  const [activeTab, setActiveTab] = useState<'breadcrumb' | 'network'>('breadcrumb');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breadcrumbRef = useRef<HTMLDivElement>(null);

  const duration = session.durationSec;

  // Advance playhead
  const tick = useCallback(() => {
    setCurrentSec((prev) => {
      if (prev >= duration) {
        setPlaying(false);
        return prev;
      }
      const next = prev + speed;
      return Math.min(next, duration);
    });
  }, [duration, speed]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, tick]);

  // Scroll active breadcrumb into view (guarded for jsdom compatibility)
  useEffect(() => {
    const activeEl = breadcrumbRef.current?.querySelector('[data-active="true"]');
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentSec]);

  const markers: Marker[] = session.markers;

  // Active marker = last marker at or before currentSec
  const activeMarkerIdx = markers.reduce<number>((best, m, i) => {
    if (m.tsSec <= currentSec) return i;
    return best;
  }, -1);

  function jumpTo(sec: number) {
    setCurrentSec(Math.max(0, Math.min(sec, duration)));
  }

  const pct = duration > 0 ? (currentSec / duration) * 100 : 0;

  // Active frame driven by currentSec
  const activeFrameId = frameForSec(currentSec);
  const renderFrame = FRAME_RENDERERS[activeFrameId] ?? FRAME_RENDERERS['landing'];

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 460,
      }}
      aria-label="Session replay player"
    >
      {/* ── Mock DOM reconstruction — changes with currentSec ─────────────── */}
      <div
        data-testid="replay-frame"
        data-frame={activeFrameId}
        style={{
          background: '#f8f8f8',
          borderBottom: '1px solid #e8e8e8',
          padding: '16px 20px',
          flex: '1 1 auto',
          position: 'relative',
          minHeight: 160,
        }}
        aria-label="Mock DOM reconstruction"
      >
        {renderFrame()}

        {/* Frame label badge */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 12,
            fontSize: 10,
            fontFamily: 'monospace',
            color: '#232323',
            background: '#ffd863',
            borderRadius: 4,
            padding: '2px 7px',
            fontWeight: 700,
          }}
        >
          {REPLAY_FRAMES.find(f => f.id === activeFrameId)?.label ?? activeFrameId}
        </div>

        {/* Vital badge */}
        {session.vitals.lcp && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 12,
              fontSize: 10,
              fontFamily: 'monospace',
              color: session.vitals.lcp <= 2500 ? '#2f9e44' : '#e03131',
              background: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: 4,
              padding: '2px 6px',
            }}
          >
            LCP {(session.vitals.lcp / 1000).toFixed(2)}s
          </div>
        )}
      </div>

      {/* ── Scrubber with typed event markers ────────────────────────────── */}
      {/* CREDIBILITY FEATURE 1 */}
      <div style={{ padding: '10px 20px 6px', borderBottom: '1px solid #f0f0f0' }}>
        <div
          style={{
            position: 'relative',
            height: 24,
            background: '#f0f0f0',
            borderRadius: 4,
            cursor: 'pointer',
          }}
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const frac = x / rect.width;
            jumpTo(Math.round(frac * duration));
          }}
          aria-label={`Scrubber. Current position: ${currentSec}s of ${duration}s`}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentSec}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') jumpTo(currentSec + 5);
            if (e.key === 'ArrowLeft') jumpTo(currentSec - 5);
          }}
        >
          {/* Progress fill */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${pct}%`,
              background: '#ffd863',
              borderRadius: 4,
              pointerEvents: 'none',
            }}
          />

          {/* Typed event markers at correct relative positions */}
          {markers.map((m, i) => {
            const x = duration > 0 ? (m.tsSec / duration) * 100 : 0;
            const isActive = i === activeMarkerIdx;
            return (
              <button
                key={i}
                title={`${MARKER_LABELS[m.type]} at ${m.tsSec}s`}
                onClick={(e) => {
                  e.stopPropagation();
                  jumpTo(m.tsSec);
                }}
                aria-label={`${MARKER_LABELS[m.type]} event at ${m.tsSec}s`}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: isActive ? 14 : 10,
                  height: isActive ? 14 : 10,
                  borderRadius: '50%',
                  background: MARKER_COLORS[m.type] ?? '#b7b7b6',
                  border: isActive ? '2px solid #232323' : '2px solid #fff',
                  cursor: 'pointer',
                  zIndex: 10,
                  pointerEvents: 'all',
                  transition: 'all 0.15s',
                  padding: 0,
                }}
              />
            );
          })}

          {/* Playhead */}
          <div
            style={{
              position: 'absolute',
              left: `${pct}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#232323',
              border: '2px solid #fff',
              zIndex: 20,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Marker legend */}
        <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
          {Object.entries(MARKER_COLORS).map(([type, color]) => (
            <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6f6f6f' }}>
              <span
                aria-hidden="true"
                style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }}
              />
              {MARKER_LABELS[type]}
            </span>
          ))}
        </div>
      </div>

      {/* ── Playback controls ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 20px',
          background: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setPlaying(!playing)}
          style={{
            padding: '5px 14px',
            borderRadius: 20,
            border: '1px solid #e8e8e8',
            background: playing ? '#ffd863' : '#f5f5f5',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            color: '#232323',
          }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>

        <span style={{ fontSize: 12, color: '#6f6f6f', fontFamily: 'monospace' }}>
          {currentSec}s / {duration}s
        </span>

        {/* Speed selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          {([0.5, 1, 2, 4] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                padding: '3px 8px',
                borderRadius: 20,
                border: '1px solid #e8e8e8',
                background: speed === s ? '#ffd863' : '#f5f5f5',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                color: '#232323',
              }}
              aria-label={`${s}x speed`}
              aria-pressed={speed === s}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Skip inactivity toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer', color: '#555' }}>
          <input
            type="checkbox"
            checked={skipInactivity}
            onChange={(e) => setSkipInactivity(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Skip inactivity
        </label>
      </div>

      {/* ── Tabs: Breadcrumb | Network ────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e8e8e8', background: '#fff' }}>
        {(['breadcrumb', 'network'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #ffd863' : '2px solid transparent',
              background: 'transparent',
              fontWeight: activeTab === tab ? 700 : 400,
              fontSize: 12,
              color: activeTab === tab ? '#232323' : '#6f6f6f',
              cursor: 'pointer',
            }}
            aria-selected={activeTab === tab}
            role="tab"
          >
            {tab === 'breadcrumb' ? 'Activity' : 'Network'}
          </button>
        ))}
      </div>

      {/* ── Breadcrumb panel — CREDIBILITY FEATURE 3 ─────────────────────── */}
      {activeTab === 'breadcrumb' && (
        <div
          ref={breadcrumbRef}
          role="tabpanel"
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            maxHeight: 160,
          }}
          aria-label="Activity breadcrumb"
        >
          {markers.map((m, i) => {
            const isActive = i === activeMarkerIdx;
            return (
              <button
                key={i}
                data-active={String(isActive)}
                onClick={() => jumpTo(m.tsSec)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 16px',
                  border: 'none',
                  borderBottom: '1px solid #f8f8f8',
                  background: isActive ? '#fff8e6' : 'transparent',
                  cursor: 'pointer',
                  borderLeft: isActive ? '3px solid #ffd863' : '3px solid transparent',
                }}
                aria-label={`Jump to ${MARKER_LABELS[m.type]} at ${m.tsSec}s`}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: MARKER_COLORS[m.type] ?? '#ccc',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: '#232323', flex: 1 }}>
                  {MARKER_LABELS[m.type]}
                </span>
                <span style={{ fontSize: 11, color: '#9e9e9e', fontFamily: 'monospace' }}>
                  {m.tsSec}s
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Network tab — CREDIBILITY FEATURE 4 ──────────────────────────── */}
      {activeTab === 'network' && (
        <div
          role="tabpanel"
          style={{ flex: '1 1 auto', overflowY: 'auto', maxHeight: 160 }}
          aria-label="Network requests"
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['URL', 'Method', 'Status', 'Duration'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '5px 12px',
                      fontWeight: 700,
                      color: '#6f6f6f',
                      textAlign: 'left',
                      borderBottom: '1px solid #e8e8e8',
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      position: 'sticky',
                      top: 0,
                      background: '#fafafa',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {session.network.map((req, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td
                    style={{
                      padding: '5px 12px',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#232323',
                    }}
                    title={req.url}
                  >
                    {req.url}
                  </td>
                  <td style={{ padding: '5px 12px', color: '#555' }}>{req.method}</td>
                  <td
                    style={{
                      padding: '5px 12px',
                      fontWeight: 700,
                      color: statusColor(req.status),
                    }}
                  >
                    {req.status}
                  </td>
                  <td style={{ padding: '5px 12px', color: '#555', fontFamily: 'monospace' }}>
                    {req.durationMs}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
