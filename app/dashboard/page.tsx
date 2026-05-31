'use client';
// Dashboard page — app/dashboard/page.tsx
// architecture.md §4.5, design-dashboard.md
//
// Rows:
//   1. Metric Tree (W1, full-width)
//   2. Stat Cards (W4 — NSM / Donate Conv / Repeat Visits)
//   3. Donate Funnel (W2, 2/3) + Retention Grid (W3, 1/3)
//   4. Event Ticker (W5, 2/3) + Active Now (W6, 1/3)
//   5. Trends (W7, 1/2) + Experiments (W8, 1/2)
//   6. Replay Surface (W9, full-width)
//   Footer legend
//
// Controls: Date range ▾, Persona filter ▾ (synced via useOverlay), ⟳ Refresh
// #anchor deep-link: reads window.location.hash, scrolls + halos the matching widget.

import { useCallback, useEffect, useState } from 'react';
import { useOverlay } from '@/lib/overlay/context';

import { MetricTree } from '@/components/dashboard/MetricTree';
import { StatCard } from '@/components/dashboard/StatCard';
import { FunnelChart } from '@/components/dashboard/FunnelChart';
import { RetentionGrid } from '@/components/dashboard/RetentionGrid';
import { EventTicker } from '@/components/dashboard/EventTicker';
import { ActiveNow } from '@/components/dashboard/ActiveNow';
import { Trends } from '@/components/dashboard/Trends';
import { ExperimentTable } from '@/components/dashboard/ExperimentTable';
import { ReplaySurface } from '@/components/dashboard/ReplaySurface';

// RETENTION_COHORTS + EXPERIMENT_ROWS are now gated via demoSeedGate
// (CB-36 / CB-39) — raw seed imports removed.

import {
  applyFunnelIncrements,
  applyTrendsIncrements,
  applyActiveNowIncrements,
} from '@/components/dashboard/liveIncrements';

import {
  getSeededFunnel,
  getSeededTrends,
  getSeededActiveNow,
  getSeededStatCards,
  getSeededMetricTree,
  getSeededRetention,
  getSeededExperiments,
  readDemoDataOn,
  writeDemoDataOn,
} from '@/components/dashboard/demoSeedGate';

import { MetricsCatalog } from '@/components/dashboard/MetricsCatalog';

import { isDemoMode } from '@/lib/personas/loader';

import { useEventStream } from '@/lib/ticker/client';
import { SESSION_ROWS } from '@/fixtures/sessions';
import type { DashboardAnchor } from '@/lib/types';
import type { PersonaSlug } from '@/lib/personas/types';

// ── Persona options ───────────────────────────────────────────────────────────
const PERSONA_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All personas' },
  { value: 'anonymous', label: 'Anonymous' },
  { value: 'close_friend', label: 'Close friend' },
  { value: 'extrovert', label: 'Extrovert' },
  { value: 'shared_by_extro', label: 'Shared-link visitor' },
  { value: 'returning_lapsed', label: 'Returning donor' },
  { value: 'profile_owner', label: 'Profile owner' },
];

// Date range presets
type DatePreset = 'last7d' | 'last14d' | 'last30d' | 'last90d';
const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'last7d', label: 'Last 7 days' },
  { value: 'last14d', label: 'Last 14 days' },
  { value: 'last30d', label: 'Last 30 days' },
  { value: 'last90d', label: 'Last 90 days' },
];

// Tier color legend
const TIER_LEGEND = [
  { color: '#ffd863', label: 'Tier 1 — Core conversion metrics' },
  { color: '#4a9d44', label: 'Tier 2 — Loop / retention metrics' },
  { color: '#b7b7b6', label: 'Guardrail — Performance & health metrics' },
];

export default function DashboardPage() {
  const { persona: overlayPersona, setPersona } = useOverlay();

  // ── Local state ───────────────────────────────────────────────────────────
  const [datePreset, setDatePreset] = useState<DatePreset>('last7d');
  const [localPersona, setLocalPersona] = useState<PersonaSlug | 'all'>('all');
  const [selectedReplayId, setSelectedReplayId] = useState<string | null>(null);
  const [haledAnchor, setHaloedAnchor] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState<number>(30);

  // CB-10: demo data toggle (gated by NEXT_PUBLIC_DEMO_MODE).
  // SSR-stable: start false (server has no localStorage) and hydrate from storage AFTER
  // mount so server and client first-render agree — reading localStorage in the useState
  // initializer caused a hydration mismatch once the gate drove retention/experiments/funnel.
  const [demoDataOn, setDemoDataOn] = useState<boolean>(false);
  useEffect(() => {
    setDemoDataOn(readDemoDataOn());
  }, []);

  function handleDemoDataToggle() {
    setDemoDataOn((prev) => {
      const next = !prev;
      writeDemoDataOn(next);
      return next;
    });
  }

  // Sync local persona ↔ overlay persona
  useEffect(() => {
    if (overlayPersona && overlayPersona !== 'anonymous') {
      setLocalPersona(overlayPersona);
    }
  }, [overlayPersona]);

  function handlePersonaChange(slug: PersonaSlug | 'all') {
    setLocalPersona(slug);
    if (slug !== 'all') {
      setPersona(slug);
    }
  }

  // ── SSE stream for live increments ────────────────────────────────────────
  const { events } = useEventStream({
    personaFilter: localPersona === 'all' ? 'all' : localPersona,
    max: 100,
  });

  // Derive live data — baselines are gated by the demo data toggle (CB-10).
  // Live SSE events accumulate regardless of toggle state.
  const liveFunnel = applyFunnelIncrements(getSeededFunnel(demoDataOn), events);
  const liveTrends = applyTrendsIncrements(getSeededTrends(demoDataOn), events);
  const liveActiveNow = applyActiveNowIncrements(getSeededActiveNow(demoDataOn), events);

  // Stat cards + metric tree are seeded-only (no live increments); the toggle
  // blanks their values when OFF while preserving labels/structure.
  const statCards = getSeededStatCards(demoDataOn);
  const metricTreeRoot = getSeededMetricTree(demoDataOn);

  // CB-36: Cohort Retention — gated; zeroed when OFF (layout-preserving).
  const retentionCohorts = getSeededRetention(demoDataOn);
  // CB-39: Running Experiments — gated; empty when OFF.
  const experimentRows = getSeededExperiments(demoDataOn);

  // ── #anchor deep-link + halo ──────────────────────────────────────────────
  // Reads URL hash, scrolls to matching widget, applies a gold halo ring.
  // Applies widget-halo directly on the target element so ALL anchor targets
  // (sections, StatCard divs, ActiveNow divs) receive the halo regardless of
  // whether they participate in the widgetClass() React-state path.
  const scrollToAnchor = useCallback((anchor: string) => {
    const el = document.getElementById(anchor);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Apply halo via direct DOM mutation (covers elements not using widgetClass)
    el.classList.add('widget-halo');
    setHaloedAnchor(anchor);
    const t = setTimeout(() => {
      el.classList.remove('widget-halo');
      setHaloedAnchor(null);
    }, 2500);
    return t;
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      // Small delay to ensure widgets are rendered
      const t = setTimeout(() => scrollToAnchor(hash), 300);
      return () => clearTimeout(t);
    }
  }, [scrollToAnchor]);

  // Handle node click from metric tree
  function handleNodeClick(anchor: DashboardAnchor) {
    window.location.hash = anchor;
    scrollToAnchor(anchor);
  }

  // Halo style injection
  useEffect(() => {
    const style = document.getElementById('halo-style') ?? document.createElement('style');
    style.id = 'halo-style';
    style.textContent = `
      .widget-halo {
        box-shadow: 0 0 0 3px #ffd863, 0 0 18px 4px rgba(255,216,99,0.45) !important;
        transition: box-shadow 0.3s;
      }
    `;
    if (!document.getElementById('halo-style')) document.head.appendChild(style);
  }, []);

  function widgetClass(id: string) {
    return haledAnchor === id ? 'widget-halo' : '';
  }

  // ── Auto-refresh interval ─────────────────────────────────────────────────
  useEffect(() => {
    if (refreshInterval <= 0) return;
    const id = setInterval(() => setRefreshKey((k) => k + 1), refreshInterval * 1000);
    return () => clearInterval(id);
  }, [refreshInterval]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e8e8e8',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#232323', margin: 0 }}>
            Analytics Dashboard
          </h1>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Date range selector */}
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePreset)}
              style={{
                fontSize: 13,
                padding: '6px 12px',
                border: '1px solid #e8e8e8',
                borderRadius: 20,
                background: '#f5f5f5',
                cursor: 'pointer',
                color: '#232323',
              }}
              aria-label="Date range"
            >
              {DATE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            {/* Persona filter — synced to overlay */}
            <select
              value={localPersona}
              onChange={(e) => handlePersonaChange(e.target.value as PersonaSlug | 'all')}
              style={{
                fontSize: 13,
                padding: '6px 12px',
                border: '1px solid #e8e8e8',
                borderRadius: 20,
                background: '#f5f5f5',
                cursor: 'pointer',
                color: '#232323',
              }}
              aria-label="Persona filter"
            >
              {PERSONA_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* CB-10: Demo data toggle — only rendered when NEXT_PUBLIC_DEMO_MODE=true */}
            {isDemoMode() && (
              <button
                onClick={handleDemoDataToggle}
                aria-pressed={demoDataOn}
                style={{
                  fontSize: 13,
                  padding: '6px 16px',
                  border: `1px solid ${demoDataOn ? '#232323' : '#e8e8e8'}`,
                  borderRadius: 20,
                  background: demoDataOn ? '#232323' : '#f5f5f5',
                  cursor: 'pointer',
                  color: demoDataOn ? '#fff' : '#232323',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                }}
                aria-label={demoDataOn ? 'Demo data on — click to turn off' : 'Demo data off — click to inject seed data'}
                data-testid="demo-data-toggle"
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: demoDataOn ? '#4a9d44' : '#e8e8e8',
                    flexShrink: 0,
                  }}
                />
                Demo data {demoDataOn ? 'on' : 'off'}
              </button>
            )}

            {/* Auto-refresh interval selector */}
            <select
              aria-label="Auto-refresh interval"
              data-testid="refresh-interval"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              style={{
                fontSize: 13,
                padding: '6px 12px',
                border: '1px solid #e8e8e8',
                borderRadius: 20,
                background: '#f5f5f5',
                cursor: 'pointer',
                color: '#232323',
              }}
            >
              <option value={0}>Off</option>
              <option value={5}>5s</option>
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 40px' }}>

        {/* ── ROW 1: Metric Tree ───────────────────────────────────────────── */}
        <section
          id="metric-tree"
          aria-labelledby="metric-tree-heading"
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: '24px 24px 20px',
            marginBottom: 20,
            border: '1px solid #e8e8e8',
          }}
          className={widgetClass('metric-tree')}
        >
          <h2
            id="metric-tree-heading"
            style={{ fontSize: 16, fontWeight: 700, color: '#232323', margin: '0 0 16px' }}
          >
            Metric Hierarchy
          </h2>
          <MetricTree
            root={metricTreeRoot}
            onNodeClick={handleNodeClick}
          />
          <p style={{ fontSize: 11, color: '#9e9e9e', marginTop: 8 }}>
            Click any metric node to jump to its widget below.
          </p>
        </section>

        {/* ── ROW 2: Stat Cards ────────────────────────────────────────────── */}
        <section
          aria-label="Key metric summary cards"
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          {statCards.map((card) => (
            <StatCard
              key={card.anchor}
              label={card.label}
              value={card.value}
              wowDeltaPct={card.wowDeltaPct}
              anchor={card.anchor}
              onClick={handleNodeClick}
            />
          ))}
        </section>

        {/* ── ROW 3: Funnel (2/3) + Retention Grid (1/3) ──────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 20,
            marginBottom: 20,
          }}
          className="dash-row-3"
        >
          <section
            id="donate-funnel"
            aria-labelledby="funnel-heading"
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '24px',
              border: '1px solid #e8e8e8',
            }}
            className={widgetClass('donate-funnel')}
          >
            <h2 id="funnel-heading" style={{ fontSize: 16, fontWeight: 700, color: '#232323', margin: '0 0 16px' }}>
              Donate Funnel
            </h2>
            <FunnelChart
              key={`funnel-${refreshKey}`}
              steps={liveFunnel}
              persona={localPersona}
              variant={{ control: [4820, 1850, 1520, 1020, 700], test: [4820, 1977, 1644, 1122, 765], ci: '[+8%, +23%]' }}
              onStepClick={() => {}}
            />
          </section>

          <section
            id="retention"
            aria-labelledby="retention-heading"
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '24px',
              border: '1px solid #e8e8e8',
            }}
            className={widgetClass('retention')}
          >
            <h2 id="retention-heading" style={{ fontSize: 16, fontWeight: 700, color: '#232323', margin: '0 0 16px' }}>
              Cohort Retention
            </h2>
            <RetentionGrid
              key={`retention-${refreshKey}`}
              cohorts={retentionCohorts}
              mode="unbounded"
            />
          </section>
        </div>

        {/* ── ROW 4: Event Ticker (2/3) + Active Now (1/3) ────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 20,
            marginBottom: 20,
          }}
          className="dash-row-4"
        >
          <section
            aria-labelledby="ticker-heading"
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '24px',
              border: '1px solid #e8e8e8',
            }}
          >
            <h2 id="ticker-heading" style={{ fontSize: 16, fontWeight: 700, color: '#232323', margin: '0 0 16px' }}>
              Live Event Stream
            </h2>
            <EventTicker
              personaFilter={localPersona}
              max={150}
            />
          </section>

          <section
            aria-label="Active visitors now"
            style={{
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #e8e8e8',
              padding: '24px',
            }}
          >
            <ActiveNow
              stat={liveActiveNow}
              anchor="nsm"
            />
          </section>
        </div>

        {/* ── ROW 5: Trends (1/2) + Experiments (1/2) ─────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            marginBottom: 20,
          }}
          className="dash-row-5"
        >
          <section
            id="share-trends"
            aria-labelledby="trends-heading"
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '24px',
              border: '1px solid #e8e8e8',
            }}
            className={widgetClass('share-trends')}
          >
            <h2 id="trends-heading" style={{ fontSize: 16, fontWeight: 700, color: '#232323', margin: '0 0 4px' }}>
              Share Trends by Channel
            </h2>
            <p style={{ fontSize: 12, color: '#9e9e9e', margin: '0 0 16px' }}>
              Share clicks per channel — last 7 days. Live events update today&apos;s count.
            </p>
            <Trends series={liveTrends} />
          </section>

          <section
            id="experiments"
            aria-labelledby="experiments-heading"
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '24px',
              border: '1px solid #e8e8e8',
            }}
            className={widgetClass('experiments')}
          >
            <h2 id="experiments-heading" style={{ fontSize: 16, fontWeight: 700, color: '#232323', margin: '0 0 16px' }}>
              Running Experiments
            </h2>
            <ExperimentTable
              rows={experimentRows}
              onRowClick={(key) => console.log('Experiment:', key)}
            />
          </section>
        </div>

        {/* ── ROW 6: Session Replay Surface ───────────────────────────────── */}
        <section
          id="replays"
          aria-labelledby="replay-heading"
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: '24px',
            border: '1px solid #e8e8e8',
            marginBottom: 20,
          }}
          className={widgetClass('replays')}
        >
          <h2 id="replay-heading" style={{ fontSize: 16, fontWeight: 700, color: '#232323', margin: '0 0 16px' }}>
            Session Replays
          </h2>
          <ReplaySurface
            sessions={SESSION_ROWS}
            selectedId={selectedReplayId}
            onSelect={setSelectedReplayId}
          />
        </section>

        {/* ── CB-11: Metrics Catalog ──────────────────────────────────────── */}
        <MetricsCatalog />

        {/* ── Footer legend ────────────────────────────────────────────────── */}
        <footer
          style={{
            display: 'flex',
            gap: 24,
            alignItems: 'center',
            padding: '16px 0 0',
            flexWrap: 'wrap',
          }}
          aria-label="Dashboard legend"
        >
          {TIER_LEGEND.map((t) => (
            <div key={t.color} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: t.color,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: '#6f6f6f' }}>{t.label}</span>
            </div>
          ))}
          <span style={{ fontSize: 11, color: '#9e9e9e', marginLeft: 'auto' }}>
            Session data is anonymized. No real donor PII is stored in this demo.
          </span>
        </footer>
      </div>

      {/* Mobile responsive grid overrides */}
      <style>{`
        @media (max-width: 900px) {
          .dash-row-3, .dash-row-4, .dash-row-5 {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .dash-row-3, .dash-row-4, .dash-row-5 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
