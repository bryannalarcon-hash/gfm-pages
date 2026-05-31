/**
 * GlobalNav — top navigation, ported to the v4.2 mock's `gnav` structure (shared.css).
 * Server component. NO green CTA on white.
 *
 * Mirrors mocks/*-v4.2.html <header class="gnav">: logo + search pill + Donate/Fundraise/About
 * links + hamburger. Outer element stays <nav> and the logo keeps aria-label "GoFundMe — home"
 * + hamburger aria-label "Open menu" so the E2E nav selectors still resolve.
 */

import React from 'react';
import Link from 'next/link';
import { IconSearch, IconMenu } from './icons';
import { SunLogo } from './SunLogo';

export function GlobalNav() {
  return (
    <nav className="gnav" aria-label="Site navigation">
      <div className="hrt-container xl gnav__inner">
        <Link href="/" className="gnav__logo" aria-label="GoFundMe — home">
          <SunLogo size={22} />
          <span>gofundme</span>
        </Link>

        <span className="gnav__search">
          <IconSearch size={16} aria-hidden /> Search
        </span>

        <nav className="gnav__links" aria-label="Primary">
          <Link href="/">Donate</Link>
          <Link href="/">Fundraise</Link>
          <Link href="/dashboard">About</Link>
        </nav>

        <span className="gnav__spacer" />

        <button className="gnav__hamburger" type="button" aria-label="Open menu">
          <IconMenu size={22} aria-hidden />
        </button>
      </div>
    </nav>
  );
}
