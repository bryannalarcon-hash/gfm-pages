'use client';

/**
 * DeckNav — deck-specific top nav bar for the landing slide deck (/).
 * Replaces the GFM product nav (GlobalNav) on the landing only.
 *
 * Layout: logo wordmark (left) + scene jump links (center) + four demo entry CTAs (right).
 * Demo entry CTAs use #232323 bg — no green CTA on white.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SunLogo } from '@/components/shared/SunLogo';

const SCENE_LINKS = [
  { label: 'Brief', sceneId: 'scene-2' },
  { label: 'Research', sceneId: 'scene-3' },
  { label: 'Redesign', sceneId: 'scene-4' },
  { label: 'Features', sceneId: 'scene-5' },
  { label: 'Demo', sceneId: 'scene-6' },
];

const DEMO_ENTRIES = [
  { label: 'Fundraiser', href: '/f/realtime-alerts-for-wildfire-safety-r5jkk' },
  { label: 'Community', href: '/communities/watch-duty' },
  { label: 'Profile', href: '/u/janahan' },
  { label: 'Dashboard', href: '/dashboard' },
] as const;

export function DeckNav() {
  const [activeScene, setActiveScene] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const match = id.match(/^scene-(\d+)$/);
            if (match) setActiveScene(parseInt(match[1], 10));
          }
        }
      },
      { threshold: 0.5 }
    );
    for (let i = 1; i <= 7; i++) {
      const el = document.getElementById(`scene-${i}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  return (
    <header
      aria-label="Deck navigation"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: '#fff',
        borderBottom: '1px solid #efefef',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        gap: '1.5rem',
      }}
    >
      {/* Logo / wordmark — links to scene 1 */}
      <button
        onClick={() => scrollTo('scene-1')}
        aria-label="Go to beginning"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexShrink: 0,
        }}
      >
        <SunLogo size={20} />
        <span
          style={{
            fontFamily: 'var(--hrt-font-family)',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: '#232323',
            letterSpacing: '-0.01em',
          }}
        >
          gofundme redesign
        </span>
      </button>

      {/* Scene jump links — desktop only */}
      <nav
        aria-label="Jump to scene"
        style={{
          display: 'flex',
          gap: '0.25rem',
          flex: 1,
          justifyContent: 'center',
        }}
        className="deck-nav__scenes"
      >
        {SCENE_LINKS.map((link) => {
          const sceneNum = parseInt(link.sceneId.replace('scene-', ''), 10);
          const isActive = activeScene === sceneNum;
          return (
            <button
              key={link.sceneId}
              onClick={() => scrollTo(link.sceneId)}
              aria-current={isActive ? 'true' : undefined}
              style={{
                background: isActive ? '#232323' : 'transparent',
                color: isActive ? '#fff' : '#6f6f6f',
                border: 'none',
                borderRadius: '624.9375rem',
                padding: '0.25rem 0.875rem',
                fontSize: '0.8125rem',
                fontFamily: 'var(--hrt-font-family)',
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* Demo entry links — desktop: pills; mobile: collapsed into hamburger */}
      <nav
        aria-label="Demo surfaces"
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexShrink: 0,
        }}
        className="deck-nav__demos"
      >
        {DEMO_ENTRIES.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href}
            style={{
              background: '#232323',
              color: '#fff',
              borderRadius: '624.9375rem',
              padding: '0.25rem 0.875rem',
              fontSize: '0.8125rem',
              fontFamily: 'var(--hrt-font-family)',
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger — toggles demo entry list */}
      <button
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
        className="deck-nav__hamburger"
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          color: '#232323',
          flexShrink: 0,
        }}
      >
        {menuOpen ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <rect y="4" width="20" height="2" rx="1" fill="currentColor" />
            <rect y="9" width="20" height="2" rx="1" fill="currentColor" />
            <rect y="14" width="20" height="2" rx="1" fill="currentColor" />
          </svg>
        )}
      </button>

      {/* Mobile drawer — demo entry + scene links */}
      {menuOpen && (
        <div
          role="dialog"
          aria-label="Navigation menu"
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            right: 0,
            background: '#fff',
            borderBottom: '1px solid #efefef',
            padding: '1rem 1.5rem',
            zIndex: 39,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
          className="deck-nav__drawer"
        >
          <p style={{ fontSize: '0.6875rem', color: '#6f6f6f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Scenes
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {SCENE_LINKS.map((link) => (
              <button
                key={link.sceneId}
                onClick={() => scrollTo(link.sceneId)}
                style={{
                  background: '#f5f5f5',
                  color: '#232323',
                  border: 'none',
                  borderRadius: '624.9375rem',
                  padding: '0.375rem 1rem',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--hrt-font-family)',
                  fontWeight: 400,
                  cursor: 'pointer',
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#6f6f6f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Enter a demo surface
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {DEMO_ENTRIES.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  background: '#232323',
                  color: '#fff',
                  borderRadius: '624.9375rem',
                  padding: '0.375rem 1rem',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--hrt-font-family)',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                {entry.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .deck-nav__scenes { display: none !important; }
          .deck-nav__demos { display: none !important; }
          .deck-nav__hamburger { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
