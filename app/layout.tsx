import type { Metadata, Viewport } from 'next';
import './globals.css';
// Designer's v4.2 stylesheets (the visual source of truth — KEEP-for-ship per mocks/HANDOFF.md).
// Imported after globals so the pages can match the mock exactly using its own classes.
import './shared.css';
import './v4.css';
import './marks.css';
import './overrides.css'; // re-assert the transparent-body suns trick (must be last)
import { OverlayProvider } from '@/lib/overlay/context';
import { OverlayPill } from '@/components/overlay/OverlayPill';
import { OverlayLayer } from '@/components/overlay/OverlayLayer';
import { UnifiedNav } from '@/components/shared/UnifiedNav';
import { MobileFrameToggle } from '@/components/shared/MobileFrameToggle';

export const metadata: Metadata = {
  title: 'GoFundMe — redesign demo',
  description: 'Fundraiser · Community · Profile redesign with a live metric overlay and the Suns contribution board.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // safe-area-inset for the mobile overlay pill
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OverlayProvider>
          {/* CB-41/CB-29: ONE cross-surface top bar on every surface (sun brand mark). */}
          <UnifiedNav />
          {/* Demo-only: preview any page inside a centered mobile phone frame.
              No-op pass-through when NEXT_PUBLIC_DEMO_MODE !== 'true'. */}
          <MobileFrameToggle>{children}</MobileFrameToggle>
          {/* Demo-only chrome — both no-op when NEXT_PUBLIC_DEMO_MODE !== 'true'. */}
          <OverlayLayer />
          <OverlayPill />
        </OverlayProvider>
      </body>
    </html>
  );
}
