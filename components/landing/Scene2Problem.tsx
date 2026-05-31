/**
 * Scene 2 — The Problem
 * Assignment brief callout + four metric pills.
 * Server component.
 */

import React from 'react';

const METRICS = ['Repeat Visits', 'Donate', 'Share', 'Follow'];

export function Scene2Problem() {
  return (
    <section
      id="scene-2"
      aria-label="Scene 2: The Problem"
      style={{
        minHeight: '100dvh',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6rem 1.5rem',
        scrollSnapAlign: 'start',
      }}
    >
      <div style={{ maxWidth: '640px', width: '100%' }}>
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
          The Brief
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily: 'var(--hrt-font-family)',
            fontSize: 'var(--hrt-size-font-display-md)',
            fontWeight: 700,
            color: '#232323',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            margin: '0 0 2rem',
          }}
        >
          GoFundMe wants to be a destination.
        </h2>

        {/* Brief callout card */}
        <div
          style={{
            background: '#f5f5f5',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0px 1px 2px #0000001a',
            marginBottom: '2rem',
          }}
        >
          <p
            style={{
              fontSize: '1rem',
              color: '#232323',
              lineHeight: 1.6,
              margin: '0 0 1.25rem',
            }}
          >
            Redesign Profile, Fundraiser, and Community pages as a more engaging destination
            where like-minded people support loved ones and unite around causes.
          </p>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#6f6f6f',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Impact metrics: Repeat Visits · Donate · Share · Follow
          </p>
        </div>

        {/* Metric pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1.5rem',
          }}
          aria-label="Target metrics"
        >
          {METRICS.map((m) => (
            <span
              key={m}
              style={{
                background: '#ccf88e',
                color: '#274a34',
                borderRadius: '624.9375rem',
                padding: '4px 16px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-block',
              }}
            >
              {m}
            </span>
          ))}
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
          These four are interdependent — sharing acquires visitors, following brings them back,
          donating is the core conversion.
        </p>
      </div>
    </section>
  );
}
