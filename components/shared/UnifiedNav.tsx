'use client';

/**
 * UnifiedNav — ONE cross-surface top bar mounted once in app/layout.tsx and present on
 * all 5 surfaces (deck `/`, the 3 product demos, and `/dashboard`).
 *
 * Design: DeckNav-style demo chrome (clean, framed) — NOT the GoFundMe product bar.
 *   - Brand mark = the rising-sun logo primitive (the GFM Sun), masked via lib/marks/logoMask.
 *     Replaces the old wordmark/heart logo (sun is the brand mark).
 *   - Cross-surface links: deck (/), Fundraiser, Community, Profile, Dashboard.
 *   - Uses next/link everywhere → client-side navigation, so localStorage (persona/overlay
 *     state) persists across navigation (no full reload). HARD acceptance criterion.
 *
 * a11y continuity (E2E `global nav links navigate correctly` in 02-interactability.spec.ts):
 *   - The home/brand link keeps aria-label="GoFundMe — home".
 *   - The mobile hamburger keeps aria-label="Open menu" (when closed).
 *   - The bar renders inside a <nav> so `nav a[href="/dashboard"]` resolves on desktop.
 *
 * No green CTA on white: link pills are #232323; the sun mark carries the green/gold accent.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SunLogo } from './SunLogo';

// Representative demo surfaces + dashboard — every other surface reachable from any surface.
const SURFACE_LINKS = [
  { label: 'Fundraiser', href: '/f/realtime-alerts-for-wildfire-safety-r5jkk', match: '/f/' },
  { label: 'Community', href: '/communities/watch-duty', match: '/communities/' },
  { label: 'Profile', href: '/u/janahan', match: '/u/' },
  { label: 'Dashboard', href: '/dashboard', match: '/dashboard' },
] as const;

function isActive(pathname: string | null, match: string): boolean {
  if (!pathname) return false;
  return pathname === match || pathname.startsWith(match);
}

export function UnifiedNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const homeActive = pathname === '/';

  return (
    <nav
      aria-label="Site navigation"
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
        gap: '1rem',
      }}
    >
      {/* Brand / home — sun mark + label. Keeps the E2E aria-label. */}
      <Link
        href="/"
        aria-label="GoFundMe — home"
        aria-current={homeActive ? 'page' : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexShrink: 0,
          textDecoration: 'none',
        }}
      >
        <SunLogo size={22} />
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
      </Link>

      {/* Cross-surface links — desktop pills; collapsed into the hamburger on mobile. */}
      <nav
        aria-label="Surfaces"
        className="unified-nav__links"
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginLeft: 'auto',
        }}
      >
        {SURFACE_LINKS.map((link) => {
          const active = isActive(pathname, link.match);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              style={{
                background: active ? '#000' : '#232323',
                color: '#fff',
                borderRadius: '624.9375rem',
                padding: '0.25rem 0.875rem',
                fontSize: '0.8125rem',
                fontFamily: 'var(--hrt-font-family)',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                outline: active ? '2px solid #ffd863' : 'none',
                outlineOffset: active ? '1px' : 0,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile hamburger — keeps the E2E aria-label "Open menu" when closed. */}
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        className="unified-nav__hamburger"
        style={{
          display: 'none',
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          color: '#232323',
          flexShrink: 0,
        }}
      >
        {menuOpen ? (
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden>
            <rect y="4" width="20" height="2" rx="1" fill="currentColor" />
            <rect y="9" width="20" height="2" rx="1" fill="currentColor" />
            <rect y="14" width="20" height="2" rx="1" fill="currentColor" />
          </svg>
        )}
      </button>

      {/* Mobile drawer — same cross-surface links via next/link (state persists). */}
      {menuOpen && (
        <div
          role="dialog"
          aria-label="Navigation menu"
          className="unified-nav__drawer"
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
            flexWrap: 'wrap',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            style={{
              background: '#f5f5f5',
              color: '#232323',
              borderRadius: '624.9375rem',
              padding: '0.375rem 1rem',
              fontSize: '0.875rem',
              fontFamily: 'var(--hrt-font-family)',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Deck
          </Link>
          {SURFACE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
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
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* Responsive: collapse pills into the hamburger on mobile. */}
      <style>{`
        @media (max-width: 768px) {
          .unified-nav__links { display: none !important; }
          .unified-nav__hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
