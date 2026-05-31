'use client';

/**
 * Scene 7 — Stack + Close
 * Locked tech stack pills, future work, closing line, and four deliverable footer links.
 */

import React from 'react';

const STACK = [
  'Next.js 14+',
  'Railway',
  'PostHog',
  'Postgres + pgvector',
  'Claude API',
];

const FUTURE_WORK = [
  'Organizer next-best-action reactivation (GFM\'s manage_nba_habit_loop flag)',
  'Real session replay via rrweb (dashboard session replay surface is mocked)',
  'GrowthBook upgrade path for experiment statistics (mirrors GFM\'s actual stats engine)',
];

const DELIVERABLE_LINKS = [
  { label: 'Source Code', href: 'https://github.com/bryannlarcon/gofundme-pages' },
  { label: 'Technical Documentation', href: '/docs' },
  { label: 'Demo Video', href: '#' },
  { label: 'AI Usage Log', href: '/ai-usage' },
];

export function Scene7Stack() {
  return (
    <section
      id="scene-7"
      aria-label="Scene 7: Stack and Close"
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
          Under the Hood
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
            margin: '0 0 1.5rem',
          }}
        >
          One platform, five tools.
        </h2>

        {/* Stack pills */}
        <div
          aria-label="Technology stack"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            justifyContent: 'center',
          }}
        >
          {STACK.map((tool) => (
            <span
              key={tool}
              style={{
                background: '#f5f5f5',
                color: '#232323',
                borderRadius: '624.9375rem',
                border: '1px solid #efefef',
                padding: '8px 16px',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {tool}
            </span>
          ))}
        </div>

        {/* Stack summary */}
        <p
          style={{
            fontSize: '1rem',
            color: '#6f6f6f',
            lineHeight: 1.6,
            margin: '0 0 2rem',
            textAlign: 'center',
          }}
        >
          Railway hosts the Next.js app, the Postgres + pgvector database, and the LLM batch worker.
          PostHog is the analytics layer — funnels, flags, replay, and the custom dashboard.
          Claude API generates share copy and update summaries at create time; all LLM calls are
          cached, none are on the request path.
        </p>

        {/* Future work */}
        <div style={{ marginBottom: '2.5rem' }}>
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
            Future work
          </p>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
            }}
          >
            {FUTURE_WORK.map((item) => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '1rem',
                  color: '#232323',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: '#b7b7b6', flexShrink: 0 }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Closing line */}
        <p
          style={{
            fontFamily: 'var(--hrt-font-family)',
            fontSize: 'clamp(1.125rem, 1rem + 0.5vw, 1.375rem)',
            color: '#232323',
            fontWeight: 500,
            lineHeight: 1.5,
            textAlign: 'center',
            margin: '0 0 3rem',
          }}
        >
          &ldquo;The overlay is the argument. Every design decision in this deck is one tap away
          from its evidence.&rdquo;
        </p>

        {/* Deliverable footer links */}
        <nav
          aria-label="Project deliverables"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem 1rem',
          }}
        >
          {DELIVERABLE_LINKS.map((link, i) => (
            <React.Fragment key={link.label}>
              {i > 0 && (
                <span
                  aria-hidden="true"
                  style={{ color: '#b7b7b6', fontSize: '0.875rem', alignSelf: 'center' }}
                >
                  ·
                </span>
              )}
              <a
                href={link.href}
                style={{
                  fontSize: '0.875rem',
                  color: '#4a9d44',
                  textDecoration: 'none',
                  borderBottom: '1px solid transparent',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderBottomColor = '#4a9d44')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderBottomColor = 'transparent')
                }
              >
                {link.label}
              </a>
            </React.Fragment>
          ))}
        </nav>
      </div>
    </section>
  );
}
