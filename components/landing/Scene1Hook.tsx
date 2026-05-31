'use client';

/**
 * Scene 1 — The Hook
 * Full-bleed, centered headline. Primary CTA scrolls to Scene 6; secondary scrolls to Scene 2.
 */

import React from 'react';
import Link from 'next/link';

export function Scene1Hook() {
  const scrollToScene = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      id="scene-1"
      aria-label="Scene 1: The Hook"
      style={{
        minHeight: '100dvh',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '5rem 1.5rem',
        position: 'relative',
        scrollSnapAlign: 'start',
        overflow: 'hidden',
      }}
    >
      {/* Atmospheric glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(204,248,142,0.20) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Skip to demo — top of DOM for keyboard users */}
      <a
        href="#scene-6"
        onClick={(e) => { e.preventDefault(); scrollToScene('scene-6'); }}
        style={{
          position: 'absolute',
          top: '1.25rem',
          left: '1.5rem',
          fontSize: '0.75rem',
          color: '#6f6f6f',
          textDecoration: 'underline',
          zIndex: 10,
        }}
      >
        Skip to demo →
      </a>

      {/* Content */}
      <div style={{ maxWidth: '640px', position: 'relative', zIndex: 1 }}>
        {/* Eyebrow */}
        <p
          style={{
            fontSize: '0.75rem',
            color: '#4a9d44',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            margin: '0 0 1.5rem',
          }}
        >
          Portfolio project
        </p>

        {/* Headline */}
        <h1
          style={{
            fontFamily: 'var(--hrt-font-family)',
            fontSize: 'var(--hrt-size-font-display-lg)',
            fontWeight: 700,
            color: '#232323',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            margin: '0 0 1.5rem',
          }}
        >
          A GoFundMe redesign that explains itself.
        </h1>

        {/* Sub-line */}
        <p
          style={{
            fontSize: 'clamp(1.125rem, 1rem + 0.5vw, 1.375rem)',
            color: '#6f6f6f',
            fontWeight: 400,
            lineHeight: 1.5,
            margin: '0 0 2.5rem',
          }}
        >
          Toggle the overlay — every UI choice is tied to a metric and a research finding.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
          }}
        >
          {/* Primary CTA: #232323 bg on white — NO green on white */}
          <button
            onClick={() => scrollToScene('scene-6')}
            style={{
              background: '#232323',
              color: '#fff',
              borderRadius: '624.9375rem',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--hrt-font-family)',
              fontWeight: 700,
              fontSize: '1rem',
              minHeight: '3rem',
              padding: '0 1.5rem',
              transition: 'background 0.25s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#585858')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#232323')}
          >
            Enter the demo
          </button>

          {/* Secondary link */}
          <button
            onClick={() => scrollToScene('scene-2')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--hrt-font-family)',
              fontWeight: 400,
              fontSize: '1rem',
              color: '#4a9d44',
              textDecoration: 'underline',
              padding: '0 0.5rem',
            }}
          >
            How we got here ↓
          </button>
        </div>
      </div>

      {/* Down-caret scroll cue */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#6f6f6f',
          animation: 'bob 1.6s ease-in-out infinite',
          fontSize: '1.5rem',
        }}
      >
        ↓
      </div>

      <style>{`
        @keyframes bob {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes bob {
            0%, 100% { transform: translateX(-50%) translateY(0); }
          }
        }
      `}</style>
    </section>
  );
}
