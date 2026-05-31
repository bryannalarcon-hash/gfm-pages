'use client';
// W2 — Funnel Chart using @nivo/funnel
// Steps: Page Viewed → Donate Intent → Amount Selected → Donate Started → Donate Completed
// Per-persona filter. Optional A/B variant overlay + CI badge.
// Step click opens a drop-off drawer with usernames + last event + "Watch replay" link.
// Live-increments from streamed events are applied by the parent via the steps prop.

import { useState } from 'react';
import { ResponsiveFunnel } from '@nivo/funnel';
import type { FunnelChartProps } from './types';
import type { EventName } from '@/lib/types';

// ── Funnel stage definitions (mirrors §4 canonical event definitions) ──────────
// Each stage: what it is + how its increase is measured.

export interface FunnelStageDefinition {
  eventName: EventName;
  definition: string;
  measurement: string;
}

export const FUNNEL_STAGE_DEFINITIONS: Record<string, FunnelStageDefinition> = {
  'page-viewed': {
    eventName: 'Page Viewed',
    definition: 'A visitor has loaded the fundraiser page.',
    measurement: 'Measured by the Page Viewed event, fired on mount of the fundraiser page component.',
  },
  'donate-intent': {
    eventName: 'Donate Intent',
    definition: 'A visitor opened the donation form by clicking a donate call-to-action.',
    measurement: 'Measured by the Donate Intent event, fired when the user clicks any donate CTA button.',
  },
  'amount-selected': {
    eventName: 'Amount Selected',
    definition: 'A donor chose a donation amount — either a preset or a custom entry.',
    measurement: 'Measured by the Amount Selected event, fired when the user picks a preset amount or types a custom amount.',
  },
  'donate-started': {
    eventName: 'Donate Started',
    definition: 'A donor proceeded to the payment form after selecting an amount.',
    measurement: 'Measured by the Donate Started event, fired when the payment form renders after amount entry.',
  },
  'donate-completed': {
    eventName: 'Donate Completed',
    definition: 'A donation was successfully submitted and confirmed.',
    measurement: 'Measured by the Donate Completed event, fired on successful checkout confirmation.',
  },
};

const STEP_COLORS = ['#ffd863', '#f5c842', '#e8a200', '#c97d00', '#a05e00'];
const STEP_USERS: Record<string, { name: string; lastEvent: string; sessionId: string }[]> = {
  'page-viewed': [
    { name: 'Anonymous visitor', lastEvent: 'Page Viewed', sessionId: 'sess-009' },
    { name: 'Mike T.', lastEvent: 'Story Scrolled', sessionId: 'sess-002' },
  ],
  'donate-intent': [
    { name: 'Sarah K.', lastEvent: 'Donate Intent', sessionId: 'sess-001' },
    { name: 'Returning visitor', lastEvent: 'Donate Intent', sessionId: 'sess-004' },
  ],
  'amount-selected': [
    { name: 'Sarah K.', lastEvent: 'Amount Selected', sessionId: 'sess-001' },
  ],
  'donate-started': [
    { name: 'Dropped at payment form', lastEvent: 'Donate Started', sessionId: 'sess-007' },
    { name: 'Shared-link visitor', lastEvent: 'Donate Started', sessionId: 'sess-012' },
  ],
  'donate-completed': [
    { name: 'Sarah K.', lastEvent: 'Donate Completed', sessionId: 'sess-001' },
    { name: 'Returning visitor', lastEvent: 'Donate Completed', sessionId: 'sess-004' },
  ],
};

export function FunnelChart({ steps, persona, variant, onStepClick }: FunnelChartProps) {
  const [drawerStep, setDrawerStep] = useState<string | null>(null);
  const [showVariant, setShowVariant] = useState(false);

  const displaySteps = steps.map((s, i) => ({
    id: s.id,
    label: s.label,
    value: s.value,
    color: STEP_COLORS[i] ?? '#ccc',
  }));

  function handleStepClick(stepId: string) {
    setDrawerStep(drawerStep === stepId ? null : stepId);
    onStepClick(stepId);
  }

  const drawerUsers = drawerStep ? (STEP_USERS[drawerStep] ?? []) : [];

  return (
    <div id="donate-funnel" style={{ width: '100%' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#6f6f6f', fontWeight: 600 }}>
          Filter: {persona === 'all' ? 'All personas' : persona.replace(/_/g, ' ')}
        </span>
        {variant && (
          <button
            onClick={() => setShowVariant(!showVariant)}
            style={{
              fontSize: 12,
              padding: '3px 10px',
              border: '1px solid #e8e8e8',
              borderRadius: 20,
              background: showVariant ? '#ffd863' : '#f5f5f5',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#232323',
            }}
          >
            {showVariant ? 'Hide A/B variant' : 'Show A/B variant'}
          </button>
        )}
        {showVariant && variant?.ci && (
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              background: '#e8f5e9',
              color: '#2e7d32',
              borderRadius: 20,
              fontWeight: 700,
            }}
          >
            95% CI: {variant.ci}
          </span>
        )}
      </div>

      {/* Funnel chart */}
      <div style={{ height: 340 }}>
        <ResponsiveFunnel
          data={displaySteps}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          valueFormat=">-.0f"
          colors={['#ffe6a3', '#ffd863', '#f6b73c', '#f59f00', '#e8850c']}
          borderWidth={20}
          borderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
          labelColor={{ from: 'color', modifiers: [['darker', 3]] }}
          beforeSeparatorLength={100}
          afterSeparatorLength={100}
          beforeSeparatorOffset={20}
          afterSeparatorOffset={20}
          currentPartSizeExtension={10}
          currentBorderWidth={40}
          motionConfig="wobbly"
          tooltip={({ part }) => {
            const stageDef = FUNNEL_STAGE_DEFINITIONS[part.data.id];
            return (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e8e8e8',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  maxWidth: 280,
                }}
              >
                <strong style={{ display: 'block', marginBottom: 4, color: '#232323' }}>
                  {part.data.label}
                </strong>
                <div style={{ marginBottom: 2 }}>Count: {part.data.value.toLocaleString()}</div>
                {stageDef && (
                  <>
                    <div style={{ marginTop: 8, color: '#444', lineHeight: 1.5 }}>
                      {stageDef.definition}
                    </div>
                    <div style={{ marginTop: 4, color: '#6f6f6f', fontStyle: 'italic', lineHeight: 1.5 }}>
                      {stageDef.measurement}
                    </div>
                  </>
                )}
              </div>
            );
          }}
          onClick={(part) => handleStepClick(part.data.id)}
        />
      </div>

      {/* Drop-off drawer */}
      {drawerStep && (
        <div
          style={{
            marginTop: 12,
            border: '1px solid #e8e8e8',
            borderRadius: 10,
            padding: '12px 16px',
            background: '#fafafa',
          }}
          aria-label="Drop-off detail panel"
        >
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: '#232323' }}>
            Users at this step
          </div>
          {drawerUsers.length === 0 ? (
            <div style={{ color: '#9e9e9e', fontSize: 12 }}>No drop-off detail available.</div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {drawerUsers.map((u, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                  <span style={{ flex: 1, color: '#232323', fontWeight: 600 }}>{u.name}</span>
                  <span style={{ color: '#6f6f6f' }}>Last: {u.lastEvent}</span>
                  <a
                    href={`#replays`}
                    style={{ color: '#0066cc', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById('replays');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Watch replay →
                  </a>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => setDrawerStep(null)}
            style={{ marginTop: 10, fontSize: 11, color: '#9e9e9e', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
