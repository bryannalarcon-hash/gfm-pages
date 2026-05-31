/**
 * Component tests for components/marks/*
 * Covers:
 *  - SunCreateModal: entry button DISABLED when unlockedBy=[], ENABLED when non-empty
 *  - GrewRibbon: rendered text has NO '$' (no donor identity / no dollar)
 *  - SunsLegend (CB-01/CB-13): board legend uses real CSS-mask sun primitive (no block placeholders)
 *  - MarksIntroSection (CB-13): community legend uses SunsLegend (inline-mask suns, animated, reduced-motion safe)
 *  - LOGO_MASK_URL validity (CB-01/CB-13): URL is percent-encoded (no raw `<`), no spurious position tokens
 *  - CB-02: legend animations (sunColor+sunWob on share, sunGrad+sunWobBig on give, static under reduced-motion)
 *  - CB-05: sharer highlight (isOwn ring + "Your sun"; isSharer ring + "X shared this")
 *  - CB-12: community density constant lower than fundraiser density
 *  - CB-14: SunsLayer fall animation present when motion allowed; static under reduced-motion; no scrollHeight probe
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { SunCreateModal } from '@/components/marks/SunCreateModal';
import { GrewRibbon } from '@/components/marks/GrewRibbon';
import { SunsLegend } from '@/components/marks/SunsLegend';
import { SunsLayer } from '@/components/marks/SunsLayer';
import { SunMark } from '@/components/marks/SunMark';
import { MarksIntroSection } from '@/components/community/MarksIntroSection';
import { OverlayProvider } from '@/lib/overlay/context';
import { LOGO_MASK_URL } from '@/lib/marks/logoMask';
import { COMMUNITY_DENSITY, BOARD_DENSITY } from '@/lib/marks/types';
import type { BoardSeed, SunMark as SunMarkType } from '@/lib/marks/types';

// Mock capture so we don't need fetch for these component tests
vi.mock('@/lib/analytics/capture', () => ({
  capture: vi.fn(),
  isCaptureSuppressed: vi.fn(() => false),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return <OverlayProvider>{children}</OverlayProvider>;
}

// ── SunCreateModal — greyed-until-unlocked guardrail ─────────────────────────

describe('SunCreateModal — greyed-until-unlocked guardrail', () => {
  it('entry button is DISABLED when unlockedBy is []', () => {
    render(
      <Wrapper>
        <SunCreateModal unlockedBy={[]} onCommit={vi.fn()} />
      </Wrapper>
    );
    // Find the entry button (it shows "Light your sun" when locked)
    const btn = screen.getByRole('button', { name: /light your sun/i });
    expect(btn).toHaveAttribute('disabled');
  });

  it('entry button is ENABLED when unlockedBy contains "follow"', () => {
    render(
      <Wrapper>
        <SunCreateModal unlockedBy={['follow']} onCommit={vi.fn()} />
      </Wrapper>
    );
    // When unlocked, button text changes to "View your sun"
    const btn = screen.getByRole('button', { name: /view your sun/i });
    expect(btn).not.toHaveAttribute('disabled');
    // Should also not have aria-disabled=true
    expect(btn.getAttribute('aria-disabled')).not.toBe('true');
  });

  it('entry button is ENABLED when unlockedBy contains "share"', () => {
    render(
      <Wrapper>
        <SunCreateModal unlockedBy={['share']} onCommit={vi.fn()} />
      </Wrapper>
    );
    const btn = screen.getByRole('button', { name: /view your sun/i });
    expect(btn).not.toHaveAttribute('disabled');
  });

  it('entry button is ENABLED when unlockedBy contains "give"', () => {
    render(
      <Wrapper>
        <SunCreateModal unlockedBy={['give']} onCommit={vi.fn()} />
      </Wrapper>
    );
    const btn = screen.getByRole('button', { name: /view your sun/i });
    expect(btn).not.toHaveAttribute('disabled');
  });

  it('entry button is ENABLED when multiple actions are present', () => {
    render(
      <Wrapper>
        <SunCreateModal unlockedBy={['follow', 'share', 'give']} onCommit={vi.fn()} />
      </Wrapper>
    );
    const btn = screen.getByRole('button', { name: /view your sun/i });
    expect(btn).not.toHaveAttribute('disabled');
  });

  it('disabled button has aria-disabled=true', () => {
    render(
      <Wrapper>
        <SunCreateModal unlockedBy={[]} onCommit={vi.fn()} />
      </Wrapper>
    );
    const btn = screen.getByRole('button', { name: /light your sun/i });
    expect(btn.getAttribute('aria-disabled')).toBe('true');
  });
});

// ── GrewRibbon — no donor identity / no dollar ───────────────────────────────

describe('GrewRibbon — no dollar, no donor identity in rendered text', () => {
  it('shows the reach count without any "$" in the text', () => {
    render(
      <Wrapper>
        <GrewRibbon reach={42} show={true} />
      </Wrapper>
    );
    // The ribbon should be visible with reach=42
    const ribbon = screen.getByRole('status');
    expect(ribbon.textContent).toContain('42');
    // No dollar sign anywhere
    expect(ribbon.textContent).not.toContain('$');
  });

  it('says "person" for reach=1', () => {
    render(
      <Wrapper>
        <GrewRibbon reach={1} show={true} />
      </Wrapper>
    );
    const ribbon = screen.getByRole('status');
    expect(ribbon.textContent).toContain('1 person');
    expect(ribbon.textContent).not.toContain('people');
    expect(ribbon.textContent).not.toContain('$');
  });

  it('says "people" for reach>1', () => {
    render(
      <Wrapper>
        <GrewRibbon reach={5} show={true} />
      </Wrapper>
    );
    const ribbon = screen.getByRole('status');
    expect(ribbon.textContent).toContain('5 people');
    expect(ribbon.textContent).not.toContain('$');
  });

  it('contains no donor name or identity (only reach count)', () => {
    render(
      <Wrapper>
        <GrewRibbon reach={10} show={true} />
      </Wrapper>
    );
    const ribbon = screen.getByRole('status');
    // Should only mention the reach count, not anything like "Sarah donated"
    // No email address, no name patterns
    expect(ribbon.textContent).not.toMatch(/@/);
    expect(ribbon.textContent).not.toContain('donor');
    expect(ribbon.textContent).not.toContain('$');
  });

  it('does not render when show=false', () => {
    render(
      <Wrapper>
        <GrewRibbon reach={5} show={false} />
      </Wrapper>
    );
    // Nothing should be rendered
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('does not render when restrained=true (memorial category suppression)', () => {
    render(
      <Wrapper>
        <GrewRibbon reach={5} show={true} restrained={true} />
      </Wrapper>
    );
    expect(screen.queryByRole('status')).toBeNull();
  });
});

// ── LOGO_MASK_URL validity — CB-01/CB-13: the shared mask URL must be a valid
//    bare url(...) with percent-encoded SVG and no embedded position/size/repeat tokens
//    that would corrupt the maskImage property and cause the browser to reject it (→ none).

describe('LOGO_MASK_URL — shared primitive is a valid CSS mask-image value (CB-01/CB-13)', () => {
  it('starts with url("data:image/svg+xml,', () => {
    expect(LOGO_MASK_URL).toMatch(/^url\("data:image\/svg\+xml,/);
  });

  it('contains NO raw angle brackets (SVG must be percent-encoded, not raw)', () => {
    // Raw `<` or `>` in a data-URI are rejected by all browsers; the SVG must be
    // percent-encoded so the browser can parse the URI.
    expect(LOGO_MASK_URL).not.toContain('<');
    expect(LOGO_MASK_URL).not.toContain('>');
  });

  it('does NOT contain " center " (position tokens must not be in maskImage value)', () => {
    // Bundling "center / contain no-repeat" into the maskImage value causes the whole
    // value to be rejected (those tokens belong to mask-position/size/repeat properties).
    expect(LOGO_MASK_URL).not.toContain(' center ');
    expect(LOGO_MASK_URL).not.toContain(' contain ');
    expect(LOGO_MASK_URL).not.toContain('no-repeat');
  });

  it('renders a sun span whose inline maskImage starts with url( (not none)', () => {
    const { container } = render(<SunsLegend />);
    const maskedSpans = Array.from(container.querySelectorAll('span[style]')).filter(el => {
      const style = (el as HTMLElement).style;
      const mask = style.getPropertyValue('mask-image') || style.getPropertyValue('-webkit-mask-image') || style.cssText;
      return mask.includes('data:image/svg+xml');
    });
    expect(maskedSpans.length).toBeGreaterThanOrEqual(3);
    // The inline style value must start with url( — confirming the browser would not reject it
    maskedSpans.forEach(span => {
      const style = (span as HTMLElement).style;
      const mask = style.getPropertyValue('mask-image') || style.getPropertyValue('-webkit-mask-image') || style.cssText;
      // Must reference url(...) and must NOT contain the spurious position tokens
      expect(mask).toMatch(/url\(/);
      expect(mask).not.toContain(' center ');
    });
  });
});

// ── SunsLegend — CB-01 / CB-13: real mask primitive, not block placeholders ──
// The mark primitive must use the CSS mask (GFM rising-sun logo), never a bare
// colored block. We check that SunsLegend renders spans with the inline maskImage
// style (the only reliable path — CSS class masks can be overridden by specificity).
// Guardrail: no dollar figures, no internal index labels in rendered text.

const LOGO_MASK_FRAGMENT = 'data:image/svg+xml';

describe('SunsLegend — sun primitive is CSS-mask logo, not a block (CB-01/CB-13)', () => {
  it('renders exactly 3 legend entries (follow / share / give)', () => {
    const { container } = render(<SunsLegend />);
    // SunsLegend wraps the whole legend in an aria-label'd div
    const legend = container.querySelector('[aria-label]');
    expect(legend).not.toBeNull();
    // Each entry is an inline-flex span with a DemoSun + text child
    const entries = container.querySelectorAll('[aria-label] > span');
    expect(entries.length).toBe(3);
  });

  it('each entry renders a span with inline maskImage referencing the SVG logo (not a bare block)', () => {
    const { container } = render(<SunsLegend />);
    // DemoSun spans have inline style with maskImage / webkitMaskImage
    const maskedSpans = container.querySelectorAll('span[style]');
    // All 3 demo-sun spans must have the logo mask URI in their style
    const sunSpans = Array.from(maskedSpans).filter(el => {
      const style = (el as HTMLElement).style;
      const mask = style.getPropertyValue('mask-image') || style.getPropertyValue('-webkit-mask-image') || style.cssText;
      return mask.includes(LOGO_MASK_FRAGMENT);
    });
    expect(sunSpans.length).toBeGreaterThanOrEqual(3);
  });

  it('no dollar figures appear in the legend rendered text (guardrail)', () => {
    const { container } = render(<SunsLegend />);
    expect(container.textContent).not.toContain('$');
  });

  it('no internal index labels (CB-/D#/C#/S#) appear in the legend rendered text', () => {
    const { container } = render(<SunsLegend />);
    expect(container.textContent).not.toMatch(/\b(CB-\d+|D\d{1,2}|C\d|S\d)\b/);
  });

  it('reduces to static (no animation) when reducedMotion=true', () => {
    const { container } = render(<SunsLegend reducedMotion={true} />);
    // When reducedMotion=true, no animation style is set on the demo suns
    const maskedSpans = Array.from(container.querySelectorAll('span[style]')).filter(el => {
      const style = (el as HTMLElement).style;
      const mask = style.getPropertyValue('mask-image') || style.getPropertyValue('-webkit-mask-image') || style.cssText;
      return mask.includes(LOGO_MASK_FRAGMENT);
    });
    maskedSpans.forEach(span => {
      const anim = (span as HTMLElement).style.animation;
      // Under reducedMotion, animation must be empty or undefined
      expect(anim || '').toBe('');
    });
  });

  it('has live animation style on share and give demo suns when reducedMotion=false', () => {
    const { container } = render(<SunsLegend reducedMotion={false} />);
    // At least the share and give suns should have an animation property
    const maskedSpans = Array.from(container.querySelectorAll('span[style]')).filter(el => {
      const style = (el as HTMLElement).style;
      const mask = style.getPropertyValue('mask-image') || style.getPropertyValue('-webkit-mask-image') || style.cssText;
      return mask.includes(LOGO_MASK_FRAGMENT);
    });
    // The share and give suns (index 1 and 2) should have non-empty animation
    const animatedCount = maskedSpans.filter(span => {
      const anim = (span as HTMLElement).style.animation;
      return anim && anim.length > 0;
    }).length;
    expect(animatedCount).toBeGreaterThanOrEqual(2);
  });
});

// ── MarksIntroSection — CB-13: community board legend uses SunsLegend ─────────
// The marks-intro section on the community page must render the same real-mask
// legend as the fundraiser — using SunsLegend (inline styles), not bare CSS class
// spans that could be overridden. No blocks, no dollar figures.

describe('MarksIntroSection — community marks intro uses real sun primitive (CB-13)', () => {
  it('renders without error for supporterCount > 0', () => {
    const { container } = render(
      <Wrapper>
        <MarksIntroSection supporterCount={1240} />
      </Wrapper>
    );
    expect(container.textContent).toContain('1,240');
  });

  it('renders the cold-start heading when supporterCount=0', () => {
    const { container } = render(
      <Wrapper>
        <MarksIntroSection supporterCount={0} />
      </Wrapper>
    );
    expect(container.textContent?.toLowerCase()).toContain('first');
  });

  it('legend contains masked sun spans (inline maskImage referencing SVG logo)', () => {
    const { container } = render(
      <Wrapper>
        <MarksIntroSection supporterCount={42} />
      </Wrapper>
    );
    // Look for any span with inline maskImage containing the SVG data-URI
    const maskedSpans = Array.from(container.querySelectorAll('span[style]')).filter(el => {
      const style = (el as HTMLElement).style;
      const mask = style.getPropertyValue('mask-image') || style.getPropertyValue('-webkit-mask-image') || style.cssText;
      return mask.includes(LOGO_MASK_FRAGMENT);
    });
    // Must have at least 3 masked sun spans (follow + share + give demo suns)
    expect(maskedSpans.length).toBeGreaterThanOrEqual(3);
  });

  it('no bare block-only .mark spans without inline mask (no block placeholders)', () => {
    const { container } = render(
      <Wrapper>
        <MarksIntroSection supporterCount={42} />
      </Wrapper>
    );
    // Spans that have class="mark ..." but NO inline maskImage are block placeholders
    const markClassSpans = Array.from(container.querySelectorAll('span[class*="mark"]')).filter(el => {
      const style = (el as HTMLElement).style;
      const mask = style.getPropertyValue('mask-image') || style.getPropertyValue('-webkit-mask-image') || style.cssText;
      // A block placeholder: has .mark class but no inline mask
      return !mask.includes(LOGO_MASK_FRAGMENT);
    });
    // There must be zero bare .mark block placeholders in the legend
    expect(markClassSpans.length).toBe(0);
  });

  it('no dollar figures in the marks-intro rendered text (guardrail)', () => {
    const { container } = render(
      <Wrapper>
        <MarksIntroSection supporterCount={100} />
      </Wrapper>
    );
    expect(container.textContent).not.toContain('$');
  });
});

// ── CB-02: SunsLegend animation classes — keyframes + class names from marks.css ──
// share → sunColor+sunWob; give → sunGrad+sunWobBig; follow → static
// Under prefers-reduced-motion: all static (animation property empty).

describe('SunsLegend — CB-02: animation keyframe names match marks.css spec', () => {
  const MASK_FRAG = 'data:image/svg+xml';

  function getMaskedSunSpans(container: HTMLElement) {
    return Array.from(container.querySelectorAll('span[style]')).filter(el => {
      const style = (el as HTMLElement).style;
      const mask = style.getPropertyValue('mask-image') || style.getPropertyValue('-webkit-mask-image') || style.cssText;
      return mask.includes(MASK_FRAG);
    }) as HTMLElement[];
  }

  it('share sun animation includes sunColor (color-shift) keyframe', () => {
    const { container } = render(<SunsLegend reducedMotion={false} />);
    const suns = getMaskedSunSpans(container);
    // suns[0]=follow(static), suns[1]=share, suns[2]=give
    expect(suns.length).toBeGreaterThanOrEqual(3);
    const shareAnim = suns[1].style.animation;
    expect(shareAnim).toMatch(/sunColor|legendSunColor/i);
  });

  it('share sun animation includes sunWob (wobble) keyframe', () => {
    const { container } = render(<SunsLegend reducedMotion={false} />);
    const suns = getMaskedSunSpans(container);
    const shareAnim = suns[1].style.animation;
    expect(shareAnim).toMatch(/sunWob|legendSunWobble/i);
  });

  it('give sun animation includes sunGrad (gradient-shift) keyframe', () => {
    const { container } = render(<SunsLegend reducedMotion={false} />);
    const suns = getMaskedSunSpans(container);
    const giveAnim = suns[2].style.animation;
    expect(giveAnim).toMatch(/sunGrad|legendSunGrad/i);
  });

  it('give sun animation includes sunWobBig (larger wobble) keyframe', () => {
    const { container } = render(<SunsLegend reducedMotion={false} />);
    const suns = getMaskedSunSpans(container);
    const giveAnim = suns[2].style.animation;
    expect(giveAnim).toMatch(/sunWobBig|legendSunWobbleBig/i);
  });

  it('follow sun is static (no animation) always', () => {
    const { container } = render(<SunsLegend reducedMotion={false} />);
    const suns = getMaskedSunSpans(container);
    const followAnim = suns[0].style.animation;
    expect(followAnim || '').toBe('');
  });

  it('all suns static when reducedMotion=true (prefers-reduced-motion: reduce)', () => {
    const { container } = render(<SunsLegend reducedMotion={true} />);
    const suns = getMaskedSunSpans(container);
    suns.forEach(sun => {
      expect(sun.style.animation || '').toBe('');
    });
  });
});

// ── CB-05: SunsLayer sharer highlight — isOwn + isSharer rendering ──────────────
// isOwn sun: ring + "Your sun" label
// isSharer sun (arrived via share link): ring + "X shared this" label
// Neither label should be empty; isSharer must show the sharer's name.

function makeMark(id: string, overrides: Partial<SunMarkType> = {}): SunMarkType {
  return {
    id,
    ownerToken: 't_' + id,
    displayName: null,
    actions: ['follow'],
    gradient: 'brand',
    sizeScore: 60,
    ...overrides,
  };
}

function makeSeed(marks: SunMarkType[]): BoardSeed {
  return { marks, fundedPct: 0.5, density: 0.74, sizeContrast: 1 };
}

// CB-46 (reopen of CB-05): label format is now "Your Sun" / "<Initial>'s Sun".
describe('SunsLayer — CB-05/CB-46: own sun ring and sharer highlight', () => {
  it('renders "Your Sun" label for the mark with isOwn=true', () => {
    const marks = [
      makeMark('a'),
      makeMark('b', { isOwn: true }),
      makeMark('c'),
    ];
    const { container } = render(
      <SunsLayer seed={makeSeed(marks)} reducedMotion={true} />
    );
    expect(container.textContent).toContain('Your Sun');
  });

  it('does NOT render "Your Sun" when no mark has isOwn=true', () => {
    const marks = [makeMark('a'), makeMark('b'), makeMark('c')];
    const { container } = render(
      <SunsLayer seed={makeSeed(marks)} reducedMotion={true} />
    );
    expect(container.textContent).not.toContain('Your Sun');
  });

  it('renders sharer-highlight label for the mark with isSharer=true ("<Initial>\'s Sun")', () => {
    const marks = [
      makeMark('a'),
      makeMark('mike', { isSharer: true, displayName: 'Mike T.' }),
      makeMark('c'),
    ];
    const { container } = render(
      <SunsLayer seed={makeSeed(marks)} reducedMotion={true} />
    );
    // The sharer highlight must show the sharer's initial in the "<Initial>'s Sun" form
    expect(container.textContent).toMatch(/MT's Sun/);
  });

  it('renders a fallback sharer label when displayName is null on isSharer mark', () => {
    const marks = [
      makeMark('a'),
      makeMark('sharerX', { isSharer: true, displayName: null }),
      makeMark('c'),
    ];
    const { container } = render(
      <SunsLayer seed={makeSeed(marks)} reducedMotion={true} />
    );
    // Must show a non-empty sun label for the sharer
    expect(container.textContent).toMatch(/Sun/);
  });

  it('renders no sharer label when no mark has isSharer=true', () => {
    const marks = [makeMark('a'), makeMark('b'), makeMark('c')];
    const { container } = render(
      <SunsLayer seed={makeSeed(marks)} reducedMotion={true} />
    );
    expect(container.textContent).not.toMatch(/'s Sun/);
  });

  it('both isOwn and isSharer can coexist on different marks', () => {
    const marks = [
      makeMark('own', { isOwn: true }),
      makeMark('sharer', { isSharer: true, displayName: 'Ana C.' }),
      makeMark('c'),
    ];
    const { container } = render(
      <SunsLayer seed={makeSeed(marks)} reducedMotion={true} />
    );
    expect(container.textContent).toContain('Your Sun');
    expect(container.textContent).toMatch(/AC's Sun/);
  });
});

// ── CB-45: the center initial MUST be visible on a named/consented PlacedSunSpan ──
// CB-42 added initials but they did not render (gated on size≥34 which excludes most gutter
// suns, and z/contrast). Here we assert that a named consented sun in SunsLayer renders a
// VISIBLE initial element: it must exist, have non-zero font size, and sit above the masked
// sun (z-index ≥ 1). Consent gate intact: anonymous (displayName null) shows no initial.

describe('CB-78: SunsLayer renders NO letter/initial glyph on any sun', () => {
  // A named, NON-highlighted sun (no isOwn/isSharer) — CB-78 says no glyph on the mark.
  function namedSeed(displayName: string | null): BoardSeed {
    const marks: SunMarkType[] = [
      makeMark('named-1', { displayName, gradient: 'teal', actions: ['share'], sizeScore: 200 }),
    ];
    return { marks, fundedPct: 0.3, density: 0.74, sizeContrast: 1 };
  }

  it('a named (non-highlighted) sun shows NO initial glyph (CB-78 reverses CB-42/45)', () => {
    const { container } = render(
      <SunsLayer seed={namedSeed('Mike T.')} reducedMotion={true} gutterW={300} gutterH={2000} />
    );
    // No standalone initial token on the mark (the only initial allowed is inside a
    // highlighted sun's "<Initial>'s Sun" ring LABEL — covered by CB-46, and this sun isn't highlighted).
    expect(container.textContent).not.toMatch(/\bMT\b/);
    expect(container.textContent).not.toContain('Mike T.');
    expect(container.textContent).not.toContain('$');
  });

  it('an anonymous sun renders no glyph either', () => {
    const { container } = render(
      <SunsLayer seed={namedSeed(null)} reducedMotion={true} gutterW={300} gutterH={2000} />
    );
    expect(container.textContent).not.toMatch(/\b[A-Z]{2}\b/);
  });
});

// ── CB-46: ring + "Your Sun" / "<Initial>'s Sun" highlight (CB-05 reopen) ──────────
// own/contributor sun (isOwn) → ring + "Your Sun"
// arrived via share link (isSharer) → sharer's sun ringed + "<Initial>'s Sun" (e.g. "MT's Sun")
// The ring must be a clear circle (borderRadius 50%, a border) AROUND the sun.

describe('CB-46: ring + "Your Sun" / "<Initial>\'s Sun" highlight', () => {
  function findLabelSpan(container: HTMLElement, re: RegExp): HTMLElement | undefined {
    return Array.from(container.querySelectorAll('span')).find((s) =>
      re.test(s.textContent?.trim() || '')
    ) as HTMLElement | undefined;
  }
  function findRing(container: HTMLElement): HTMLElement | undefined {
    return Array.from(container.querySelectorAll('span')).find((s) => {
      const st = (s as HTMLElement).style;
      return st.borderRadius === '50%' && (st.border?.length || 0) > 0;
    }) as HTMLElement | undefined;
  }

  it('own/contributor sun (isOwn) shows "Your Sun" (capitalized)', () => {
    const marks = [makeMark('a'), makeMark('b', { isOwn: true }), makeMark('c')];
    const { container } = render(<SunsLayer seed={makeSeed(marks)} reducedMotion={true} />);
    expect(container.textContent).toContain('Your Sun');
  });

  it('own sun renders a clear ring (circle: borderRadius 50% + a border)', () => {
    const marks = [makeMark('own', { isOwn: true })];
    const { container } = render(<SunsLayer seed={makeSeed(marks)} reducedMotion={true} />);
    const ring = findRing(container);
    expect(ring).toBeTruthy();
    expect((ring as HTMLElement).style.borderRadius).toBe('50%');
  });

  it('arriving via share link: sharer sun ringed + "<Initial>\'s Sun" (e.g. "MT\'s Sun")', () => {
    const marks = [
      makeMark('a'),
      makeMark('mike', { isSharer: true, displayName: 'Mike T.' }),
      makeMark('c'),
    ];
    const { container } = render(<SunsLayer seed={makeSeed(marks)} reducedMotion={true} />);
    expect(container.textContent).toMatch(/MT's Sun/);
    expect(findRing(container)).toBeTruthy();
  });

  it('sharer with single-word name: "<Initial>\'s Sun" uses first initial', () => {
    const marks = [makeMark('carlos', { isSharer: true, displayName: 'Carlos' })];
    const { container } = render(<SunsLayer seed={makeSeed(marks)} reducedMotion={true} />);
    expect(container.textContent).toMatch(/C's Sun/);
  });

  it('anonymous sharer (displayName null) still shows a non-empty sun label', () => {
    const marks = [makeMark('x', { isSharer: true, displayName: null })];
    const { container } = render(<SunsLayer seed={makeSeed(marks)} reducedMotion={true} />);
    const label = findLabelSpan(container, /Sun/);
    expect(label).toBeTruthy();
    expect((label as HTMLElement).textContent?.trim().length).toBeGreaterThan(0);
  });

  it('isOwn takes precedence: a contributor\'s own sun reads "Your Sun" not an initial label', () => {
    const marks = [makeMark('me', { isOwn: true, displayName: 'Mike T.' })];
    const { container } = render(<SunsLayer seed={makeSeed(marks)} reducedMotion={true} />);
    expect(container.textContent).toContain('Your Sun');
    expect(container.textContent).not.toMatch(/MT's Sun/);
  });

  it('no highlight label when neither isOwn nor isSharer set', () => {
    const marks = [makeMark('a'), makeMark('b'), makeMark('c')];
    const { container } = render(<SunsLayer seed={makeSeed(marks)} reducedMotion={true} />);
    expect(container.textContent).not.toMatch(/Your Sun|'s Sun/);
  });

  it('highlight label carries no dollar figure (guardrail)', () => {
    const marks = [makeMark('s', { isSharer: true, displayName: 'Ana C.' })];
    const { container } = render(<SunsLayer seed={makeSeed(marks)} reducedMotion={true} />);
    expect(container.textContent).not.toContain('$');
  });
});

// ── CB-12: Community density constant lower than default board density ──────────
// COMMUNITY_DENSITY must exist and be less than BOARD_DENSITY (0.74).
// This enforces the lighter community look vs the fundraiser.

describe('CB-12: COMMUNITY_DENSITY constant is lower than BOARD_DENSITY', () => {
  it('BOARD_DENSITY is 0.74 (unchanged fundraiser constant)', () => {
    expect(BOARD_DENSITY).toBe(0.74);
  });

  it('COMMUNITY_DENSITY is defined and less than BOARD_DENSITY', () => {
    expect(typeof COMMUNITY_DENSITY).toBe('number');
    expect(COMMUNITY_DENSITY).toBeLessThan(BOARD_DENSITY);
  });

  it('COMMUNITY_DENSITY is at least 0.3 (never-empty floor)', () => {
    expect(COMMUNITY_DENSITY).toBeGreaterThanOrEqual(0.3);
  });
});

// ── CB-14: SunsLayer fall animation — present when motion allowed, static under reduce ──
// When reducedMotion=false, placed sun spans must have an animation style set.
// When reducedMotion=true, no animation on placed suns (CSS variables still present; just no animation).
// Zero CLS: layer is position:absolute (checked via inline style).

describe('SunsLayer — CB-14: fall transition and reduced-motion safety', () => {
  const marks = Array.from({ length: 10 }, (_, i) => makeMark('m' + i));
  const seed = makeSeed(marks);

  it('layer wrapper is position:absolute (zero CLS guarantee)', () => {
    const { container } = render(
      <SunsLayer seed={seed} reducedMotion={true} />
    );
    // The outer layer div that holds suns must be position:absolute
    const layerDiv = container.querySelector('div[aria-hidden="true"]');
    expect(layerDiv).not.toBeNull();
    expect((layerDiv as HTMLElement).style.position).toBe('absolute');
  });

  it('placed sun spans have animation style when reducedMotion=false', () => {
    const { container } = render(
      <SunsLayer seed={seed} reducedMotion={false} />
    );
    // Find positioned sun spans (they are inside the absolute gutter divs)
    const sunSpans = Array.from(container.querySelectorAll('span[data-mark-id]')) as HTMLElement[];
    expect(sunSpans.length).toBeGreaterThan(0);
    const animated = sunSpans.filter(s => s.style.animation && s.style.animation.length > 0);
    expect(animated.length).toBeGreaterThan(0);
  });

  it('placed sun spans have NO animation style when reducedMotion=true', () => {
    const { container } = render(
      <SunsLayer seed={seed} reducedMotion={true} />
    );
    const sunSpans = Array.from(container.querySelectorAll('span[data-mark-id]')) as HTMLElement[];
    expect(sunSpans.length).toBeGreaterThan(0);
    sunSpans.forEach(s => {
      expect(s.style.animation || '').toBe('');
    });
  });
});

// ── CB-31: SunMark color mapping — follow=grey, share=key-gradient, give=gradient ──
// Every sun must use the color derived from mark.gradient (SUN_GRADIENTS), never a
// collapsed/hardcoded color. Follow-only suns must be grey (CSS token); share/give suns
// must render their curated gradient. The colors must differ across gradient values.

describe('CB-31: SunMark — color varies by mark.gradient (not collapsed to one color)', () => {
  it('follow-only (grey gradient) sun renders a grey background — not a colored gradient', () => {
    const mark: SunMarkType = makeMark('follow-grey', {
      actions: ['follow'],
      gradient: 'grey',
    });
    const { container } = render(<SunMark mark={mark} r={20} reducedMotion={true} />);
    const span = container.querySelector('span[data-gradient="grey"]') as HTMLElement;
    expect(span).not.toBeNull();
    // Must use the grey token, not a linear-gradient
    const bg = span.style.background || span.style.backgroundColor;
    expect(bg).not.toMatch(/linear-gradient/);
    // Must reference the neutral color token (not a brand/teal/gold/violet gradient)
    expect(bg).toMatch(/hrt-color-border-neutral|#d8d8d8|#b7b7b6/);
  });

  it('teal-gradient sun renders teal colors in its background', () => {
    const mark: SunMarkType = makeMark('share-teal', {
      actions: ['share'],
      gradient: 'teal',
    });
    const { container } = render(<SunMark mark={mark} r={20} reducedMotion={true} />);
    const span = container.querySelector('span[data-gradient="teal"]') as HTMLElement;
    expect(span).not.toBeNull();
    const bg = span.style.background;
    // Must be a linear-gradient referencing teal colors (#a7e3e3 or #1c456b)
    expect(bg).toMatch(/linear-gradient/);
    expect(bg).toMatch(/#a7e3e3|#1c456b/i);
  });

  it('brand-gradient sun renders brand colors (#acf86c / #4a9d44) in its background', () => {
    const mark: SunMarkType = makeMark('give-brand', {
      actions: ['give'],
      gradient: 'brand',
    });
    const { container } = render(<SunMark mark={mark} r={20} reducedMotion={true} />);
    const span = container.querySelector('span[data-gradient="brand"]') as HTMLElement;
    expect(span).not.toBeNull();
    const bg = span.style.background;
    expect(bg).toMatch(/linear-gradient/);
    expect(bg).toMatch(/#acf86c|#4a9d44/i);
  });

  it('gold-gradient sun renders gold colors (#ffd863 / #68570d) in its background', () => {
    const mark: SunMarkType = makeMark('give-gold', {
      actions: ['share', 'give'],
      gradient: 'gold',
    });
    const { container } = render(<SunMark mark={mark} r={20} reducedMotion={true} />);
    const span = container.querySelector('span[data-gradient="gold"]') as HTMLElement;
    expect(span).not.toBeNull();
    const bg = span.style.background;
    expect(bg).toMatch(/linear-gradient/);
    expect(bg).toMatch(/#ffd863|#68570d/i);
  });

  it('violet-gradient sun renders violet colors (#eccff6 / #642878) in its background', () => {
    const mark: SunMarkType = makeMark('share-violet', {
      actions: ['share'],
      gradient: 'violet',
    });
    const { container } = render(<SunMark mark={mark} r={20} reducedMotion={true} />);
    const span = container.querySelector('span[data-gradient="violet"]') as HTMLElement;
    expect(span).not.toBeNull();
    const bg = span.style.background;
    expect(bg).toMatch(/linear-gradient/);
    expect(bg).toMatch(/#eccff6|#642878/i);
  });

  it('teal and gold suns have distinct background values (colors do not collapse to one)', () => {
    const tealMark: SunMarkType = makeMark('teal-m', { actions: ['share'], gradient: 'teal' });
    const goldMark: SunMarkType = makeMark('gold-m', { actions: ['share'], gradient: 'gold' });
    const { container: c1 } = render(<SunMark mark={tealMark} r={20} reducedMotion={true} />);
    const { container: c2 } = render(<SunMark mark={goldMark} r={20} reducedMotion={true} />);
    const tealBg = (c1.querySelector('span[data-gradient="teal"]') as HTMLElement).style.background;
    const goldBg = (c2.querySelector('span[data-gradient="gold"]') as HTMLElement).style.background;
    expect(tealBg).not.toBe(goldBg);
  });

  it('grey and brand suns have distinct background values', () => {
    const greyMark: SunMarkType = makeMark('grey-m', { actions: ['follow'], gradient: 'grey' });
    const brandMark: SunMarkType = makeMark('brand-m', { actions: ['give'], gradient: 'brand' });
    const { container: c1 } = render(<SunMark mark={greyMark} r={20} reducedMotion={true} />);
    const { container: c2 } = render(<SunMark mark={brandMark} r={20} reducedMotion={true} />);
    const greyBg = (c1.querySelector('span[data-gradient="grey"]') as HTMLElement).style.background;
    const brandBg = (c2.querySelector('span[data-gradient="brand"]') as HTMLElement).style.background;
    expect(greyBg).not.toBe(brandBg);
    // Grey must not be a linear-gradient
    expect(greyBg).not.toMatch(/linear-gradient/);
    // Brand must be a linear-gradient
    expect(brandBg).toMatch(/linear-gradient/);
  });

  it('SunsLayer placed spans also reflect mark.gradient (teal mark renders teal bg)', () => {
    const marks: SunMarkType[] = [
      makeMark('teal-layer', { actions: ['share'], gradient: 'teal' }),
      makeMark('grey-layer', { actions: ['follow'], gradient: 'grey' }),
    ];
    const { container } = render(
      <SunsLayer seed={makeSeed(marks)} reducedMotion={true} />
    );
    const tealSpan = Array.from(container.querySelectorAll('span[data-mark-id="teal-layer"]')) as HTMLElement[];
    const greySpan = Array.from(container.querySelectorAll('span[data-mark-id="grey-layer"]')) as HTMLElement[];
    // Both must be rendered
    expect(tealSpan.length).toBeGreaterThan(0);
    expect(greySpan.length).toBeGreaterThan(0);
    // Backgrounds must differ
    expect(tealSpan[0].style.background).not.toBe(greySpan[0].style.background);
    expect(tealSpan[0].style.background).toMatch(/a7e3e3|1c456b/i);
  });
});

// ── CB-42: SunMark initials — named/consented suns show initials; anonymous suns show none ──
// displayName present → derive and render initials on the half-circle, centered.
// displayName null    → NO initials rendered (anonymous suns; privacy guardrail).
// No dollar figures, no full names — initials only (max 3 chars).

describe('CB-42: SunMark — initials centered on named/consented suns; none on anonymous', () => {
  it('named sun (displayName="Mike T.") renders initials "MT"', () => {
    const mark: SunMarkType = makeMark('named-mt', {
      actions: ['share'],
      gradient: 'teal',
      displayName: 'Mike T.',
    });
    const { container } = render(<SunMark mark={mark} r={24} reducedMotion={true} />);
    expect(container.textContent).toContain('MT');
  });

  it('named sun (displayName="Ana C.") renders initials "AC"', () => {
    const mark: SunMarkType = makeMark('named-ac', {
      actions: ['give'],
      gradient: 'gold',
      displayName: 'Ana C.',
    });
    const { container } = render(<SunMark mark={mark} r={24} reducedMotion={true} />);
    expect(container.textContent).toContain('AC');
  });

  it('named sun (displayName="Sarah K.") renders initials "SK"', () => {
    const mark: SunMarkType = makeMark('named-sk', {
      actions: ['share', 'give'],
      gradient: 'violet',
      displayName: 'Sarah K.',
    });
    const { container } = render(<SunMark mark={mark} r={24} reducedMotion={true} />);
    expect(container.textContent).toContain('SK');
  });

  it('named sun (single word displayName "Carlos") renders at least one initial "C"', () => {
    const mark: SunMarkType = makeMark('named-single', {
      actions: ['follow'],
      gradient: 'grey',
      displayName: 'Carlos',
    });
    const { container } = render(<SunMark mark={mark} r={24} reducedMotion={true} />);
    expect(container.textContent).toMatch(/C/);
    // Initials only — should not contain full name
    expect(container.textContent).not.toContain('Carlos');
  });

  it('anonymous sun (displayName=null) renders NO initials', () => {
    const mark: SunMarkType = makeMark('anon', {
      actions: ['follow'],
      gradient: 'grey',
      displayName: null,
    });
    const { container } = render(<SunMark mark={mark} r={24} reducedMotion={true} />);
    // Must have no initials text — only aria-hidden decorative content
    // The only non-empty text node would be the "Your sun" label (only if isOwn),
    // which is not set here, so textContent should be empty or whitespace.
    const allText = container.textContent?.trim() ?? '';
    expect(allText).toBe('');
  });

  it('initials element is aria-hidden (decorative, not a11y label)', () => {
    const mark: SunMarkType = makeMark('named-aria', {
      actions: ['share'],
      gradient: 'teal',
      displayName: 'Mike T.',
    });
    const { container } = render(<SunMark mark={mark} r={24} reducedMotion={true} />);
    // All rendered elements should be aria-hidden (initials are decorative)
    const nonHidden = Array.from(container.querySelectorAll('[aria-hidden="false"], :not([aria-hidden])'))
      .filter(el => el !== container && el.tagName !== 'BODY' && !el.querySelector('[aria-hidden]'));
    // The initials span must not expose the text to screen readers as a label
    expect(container.textContent).toContain('MT');
    // Find the span containing 'MT' and verify it's aria-hidden
    const allSpans = Array.from(container.querySelectorAll('span'));
    const initialsSpan = allSpans.find(s => s.textContent?.trim() === 'MT');
    expect(initialsSpan).not.toBeNull();
    expect(initialsSpan?.getAttribute('aria-hidden')).toBe('true');
  });

  it('initials contain NO dollar figure (guardrail)', () => {
    const mark: SunMarkType = makeMark('named-nodollar', {
      actions: ['give'],
      gradient: 'gold',
      displayName: 'Jane D.',
    });
    const { container } = render(<SunMark mark={mark} r={24} reducedMotion={true} />);
    expect(container.textContent).not.toContain('$');
  });

  it('initials contain NO full name — only the derived initials', () => {
    const mark: SunMarkType = makeMark('named-nofullname', {
      actions: ['share'],
      gradient: 'brand',
      displayName: 'Robert Johnson',
    });
    const { container } = render(<SunMark mark={mark} r={24} reducedMotion={true} />);
    // Should render "RJ" (or "R" if only first word), not "Robert Johnson"
    expect(container.textContent).not.toContain('Robert Johnson');
    expect(container.textContent).toMatch(/R[J]?/);
  });
});

// ── CB-33: SunsLegend — single axis layout (row only, no wrap) ──────────────
// The mock (mocks/community-v4.2.html §board__legend) uses a horizontal row of
// <span> items with no flex-wrap. SunsLegend must use flexDirection='row' and
// MUST NOT set flexWrap='wrap' — one axis only.

describe('CB-33: SunsLegend — single horizontal axis, no flex-wrap (matches mock)', () => {
  it('legend container has flexDirection "row" (horizontal layout)', () => {
    const { container } = render(<SunsLegend layout="row" />);
    const legend = container.querySelector('[aria-label]') as HTMLElement;
    expect(legend).not.toBeNull();
    expect(legend.style.flexDirection).toBe('row');
  });

  it('legend container does NOT have flexWrap "wrap" (single axis only)', () => {
    const { container } = render(<SunsLegend layout="row" />);
    const legend = container.querySelector('[aria-label]') as HTMLElement;
    expect(legend).not.toBeNull();
    // flexWrap must not be 'wrap' — single axis
    const wrap = legend.style.flexWrap;
    expect(wrap).not.toBe('wrap');
  });

  it('legend container in stack layout has flexDirection "column" (single vertical axis)', () => {
    const { container } = render(<SunsLegend layout="stack" />);
    const legend = container.querySelector('[aria-label]') as HTMLElement;
    expect(legend).not.toBeNull();
    expect(legend.style.flexDirection).toBe('column');
  });

  it('stack layout also does NOT have flexWrap "wrap"', () => {
    const { container } = render(<SunsLegend layout="stack" />);
    const legend = container.querySelector('[aria-label]') as HTMLElement;
    const wrap = legend.style.flexWrap;
    expect(wrap).not.toBe('wrap');
  });

  it('MarksIntroSection community legend is single-axis (no wrap on legend container)', () => {
    const { container } = render(
      <Wrapper>
        <MarksIntroSection supporterCount={42} />
      </Wrapper>
    );
    const legend = container.querySelector('[aria-label*="How marks work"]') as HTMLElement;
    expect(legend).not.toBeNull();
    expect(legend.style.flexWrap).not.toBe('wrap');
  });
});
