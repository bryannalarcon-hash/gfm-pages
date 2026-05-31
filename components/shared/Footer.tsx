/**
 * Footer — ported to the v4.2 mock's `gfooter` 4-column grid (shared.css).
 * Mirrors mocks/*-v4.2.html <footer class="gfooter">: brand col + Fundraise/About/Resources.
 */

import React from 'react';
import Link from 'next/link';
import { SunLogo } from './SunLogo';

export function Footer() {
  return (
    <footer className="gfooter">
      <div className="hrt-container xl gfooter__grid">
        <div className="gfooter__col">
          <div className="gfooter__brand">
            <SunLogo size={20} />
            <strong style={{ color: 'var(--hrt-color-text-brand)' }}>gofundme</strong>
          </div>
          <p>The world’s most trusted free fundraising platform.</p>
        </div>

        <div className="gfooter__col">
          <h4>Fundraise</h4>
          <Link href="/">How it works</Link>
          <Link href="/">Categories</Link>
          <Link href="/">Team fundraising</Link>
        </div>

        <div className="gfooter__col">
          <h4>About</h4>
          <Link href="/">About us</Link>
          <Link href="/">Newsroom</Link>
          <Link href="/">Careers</Link>
        </div>

        <div className="gfooter__col">
          <h4>Resources</h4>
          <Link href="/">Help center</Link>
          <Link href="/">Giving Guarantee</Link>
          <Link href="/">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
