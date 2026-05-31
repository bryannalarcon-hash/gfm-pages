'use client';

/**
 * Scene 3 — What We Learned About GFM
 * Three hero numerals (126 events, 1,111 flags, 4 A/Bs) with count-up animation.
 * Stack callout card.
 */

import React from 'react';
import { CountUp } from './CountUp';

const HERO_STATS = [
  { target: 126, label: 'observed events' },
  { target: 1111, label: 'feature flags', format: (n: number) => n.toLocaleString() },
  { target: 4, label: 'live A/B tests' },
];

const STACK_TOOLS = [
  { name: 'Optimizely', role: 'flags' },
  { name: 'GrowthBook', role: 'stats' },
  { name: 'Amplitude', role: 'readout' },
  { name: 'mParticle', role: 'CDP' },
  { name: 'Braze', role: 'email' },
  { name: 'Snowflake', role: 'warehouse' },
];

export function Scene3GFMIntel() {
  return (
    <section
      id="scene-3"
      aria-label="Scene 3: What We Learned About GFM"
      style={{
        minHeight: '100dvh',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6rem 1.5rem',
        scrollSnapAlign: 'start',
      }}
    >
      <div style={{ maxWidth: '720px', width: '100%' }}>
        {/* Eyebrow */}
        <p
          style={{
            fontSize: '0.75rem',
            color: '#4a9d44',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            margin: '0 0 1rem',
          }}
        >
          Reverse Engineering
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily: 'var(--hrt-font-family)',
            fontSize: 'var(--hrt-size-font-display-sm)',
            fontWeight: 700,
            color: '#232323',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            margin: '0 0 1rem',
          }}
        >
          GFM is already running A/B tests on the exact surfaces we redesigned.
        </h2>

        {/* Sub-head */}
        <p
          style={{
            fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)',
            color: '#6f6f6f',
            lineHeight: 1.5,
            margin: '0 0 2.5rem',
          }}
        >
          We didn't invent the hypotheses — we stress-tested them against their live experiment data.
        </p>

        {/* Hero numerals */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '2rem',
          }}
        >
          {HERO_STATS.map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: '1 1 160px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid #efefef',
                borderRadius: '1.25rem',
                padding: '1.5rem 2rem',
                background: '#fff',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--hrt-font-family)',
                  fontSize: 'var(--hrt-size-font-display-md)',
                  fontWeight: 700,
                  color: '#232323',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                <CountUp
                  target={stat.target}
                  duration={800}
                  format={stat.format}
                />
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#6f6f6f',
                  fontWeight: 400,
                  marginTop: '0.25rem',
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Stack callout card */}
        <div
          style={{
            background: '#f5f5f5',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0px 1px 2px #0000001a',
            marginBottom: '1.5rem',
          }}
        >
          <p
            style={{
              fontSize: '0.75rem',
              color: '#6f6f6f',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: '0 0 0.75rem',
            }}
          >
            GFM&apos;s observed analytics stack
          </p>
          <div
            style={{
              fontFamily: 'var(--hrt-font-family-mono)',
              fontSize: '0.75rem',
              color: '#6f6f6f',
              lineHeight: 1.7,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.25rem 0.75rem',
            }}
          >
            {STACK_TOOLS.map((tool) => (
              <span key={tool.name}>
                <span style={{ color: '#232323', fontWeight: 600 }}>{tool.name}</span>
                {' '}
                <span>({tool.role})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Body copy */}
        <p
          style={{
            fontSize: '1rem',
            color: '#6f6f6f',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          4 of 4 live A/B tests are in the donation funnel. Two are live experiments on
          AI-generated share text. Every change in this redesign maps to a confirmed bet.
        </p>
      </div>
    </section>
  );
}
