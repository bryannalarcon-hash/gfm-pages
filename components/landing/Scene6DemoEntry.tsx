/**
 * Scene 6 — The Demo Entry
 * Four CTA tiles linking to the four demo surfaces.
 * NO green CTA on white — tile buttons use #232323 bg.
 * Dashboard tile is a dark inversion (bg #232323).
 */

import React from 'react';
import Link from 'next/link';

const TILES = [
  {
    title: 'Fundraiser',
    slug: '/f/realtime-alerts-for-wildfire-safety-r5jkk',
    watchFor: 'The single-screen donate form + the welcome-back banner',
    dark: false,
  },
  {
    title: 'Community',
    slug: '/communities/watch-duty',
    watchFor: 'The Follow CTA with value prop; the "Since last visit" feed divider; people you may know with inline Follow',
    dark: false,
  },
  {
    title: 'Profile',
    slug: '/u/janahan',
    watchFor: 'The Follow microcopy; the "what you missed" feed + the recurring nudge',
    dark: false,
  },
  {
    title: 'Dashboard',
    slug: '/dashboard',
    watchFor: 'Live event ticker, donate funnel, cohort retention grid, session replay surface',
    dark: true,
  },
] as const;

export function Scene6DemoEntry() {
  return (
    <section
      id="scene-6"
      aria-label="Scene 6: Explore the Demo"
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
      <div style={{ maxWidth: '800px', width: '100%' }}>
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
          Explore the Demo
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
            margin: '0 0 2rem',
          }}
        >
          Pick a surface and look for the overlay pill.
        </h2>

        {/* Tile grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {TILES.map((tile) => (
            <article
              key={tile.title}
              style={{
                background: tile.dark ? '#232323' : '#fff',
                border: tile.dark ? 'none' : '1px solid #efefef',
                borderRadius: '1.5rem',
                padding: '2rem',
                boxShadow: '0px 2px 6px #0000001a',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
            >
              {/* Page name */}
              <h3
                style={{
                  fontFamily: 'var(--hrt-font-family)',
                  fontSize: 'clamp(1.5rem, 1.35rem + 0.6vw, 1.75rem)',
                  fontWeight: 700,
                  color: tile.dark ? '#fff' : '#232323',
                  margin: 0,
                  lineHeight: 1.15,
                }}
              >
                {tile.title}
              </h3>

              {/* Route slug */}
              <p
                style={{
                  fontFamily: 'var(--hrt-font-family-mono)',
                  fontSize: '0.75rem',
                  color: tile.dark ? '#ccf88e' : '#4a9d44',
                  margin: 0,
                  wordBreak: 'break-all',
                }}
              >
                {tile.slug}
              </p>

              {/* Watch-for copy */}
              <p
                style={{
                  fontSize: '0.875rem',
                  color: tile.dark ? '#b7b7b6' : '#6f6f6f',
                  lineHeight: 1.5,
                  margin: 0,
                  flex: 1,
                }}
              >
                <strong
                  style={{
                    color: tile.dark ? '#b7b7b6' : '#6f6f6f',
                    fontWeight: 700,
                  }}
                >
                  Watch for:{' '}
                </strong>
                {tile.watchFor}
              </p>

              {/* CTA button — dark bg on white tile; light bg on dark tile */}
              <Link
                href={tile.slug}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: tile.dark ? '#fff' : '#232323',
                  color: tile.dark ? '#232323' : '#fff',
                  borderRadius: '624.9375rem',
                  border: 'none',
                  fontFamily: 'var(--hrt-font-family)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  minHeight: '2.5rem',
                  padding: '0 1.25rem',
                  textDecoration: 'none',
                  marginTop: 'auto',
                  transition: 'opacity 0.2s',
                }}
              >
                Enter →
              </Link>
            </article>
          ))}
        </div>

        {/* Tip hint */}
        <p
          style={{
            fontSize: '0.875rem',
            color: '#6f6f6f',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Tip: try switching personas in the overlay pill to see how personalization changes each
          surface. The overlay pill is available on every page.
        </p>
      </div>
    </section>
  );
}
