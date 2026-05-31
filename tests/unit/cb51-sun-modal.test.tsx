/**
 * CB-51 — sun create modal: flat colors for sharers, gradients for contributors
 *
 * Rules (feature-contribution-board.md §3 + CB-31 mapping):
 *  - unlockedBy includes 'share'  → flat-color swatches shown (no gradient swatches)
 *  - unlockedBy includes 'give'   → gradient swatches shown (no flat swatches)
 *  - unlockedBy includes both     → both sets shown
 *  - unlockedBy = ['follow'] only → no palette section at all (follow-only default)
 *  - Curated palettes only — flat colors derived from SUN_GRADIENTS primary (from) stops;
 *    no raw hex wheel anywhere.
 *
 * We open the modal via controlled-open (CB-34 API) so we can inspect the panel
 * without simulating a button click (the trigger is hidden; parent controls open).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { SunCreateModal } from '@/components/marks/SunCreateModal';

vi.mock('@/lib/analytics/capture', () => ({
  capture: vi.fn(),
  isCaptureSuppressed: vi.fn(() => false),
}));

// Helpers — open the modal via the CB-34 controlled-open API.
function renderOpen(unlockedBy: Array<'follow' | 'share' | 'give'>) {
  return render(
    <SunCreateModal
      unlockedBy={unlockedBy}
      onCommit={vi.fn()}
      open={true}
      hideTrigger={true}
    />
  );
}

// ── CB-51: palette split by unlockedBy ───────────────────────────────────────

describe('CB-51: SunCreateModal — flat vs gradient palette by unlockedBy', () => {
  // ── sharer only → flat swatches, no gradient swatches ──────────────────────

  it('sharer (share only): flat-color radiogroup is present', () => {
    renderOpen(['share']);
    // The flat-color radiogroup must be rendered with its aria-label
    expect(
      screen.getByRole('radiogroup', { name: /flat colou?r|solid colou?r/i })
    ).toBeTruthy();
  });

  it('sharer (share only): gradient radiogroup is NOT present', () => {
    renderOpen(['share']);
    expect(
      screen.queryByRole('radiogroup', { name: /gradient/i })
    ).toBeNull();
  });

  it('sharer (share only): flat swatches are curated — at least 4 swatches visible and enabled', () => {
    renderOpen(['share']);
    const group = screen.getByRole('radiogroup', { name: /flat colou?r|solid colou?r/i });
    const swatches = within(group).getAllByRole('radio');
    // Curated palette has one swatch per non-grey gradient (brand, gold, teal, violet) = 4 min
    expect(swatches.length).toBeGreaterThanOrEqual(4);
    // All should be enabled (sharer has unlocked flat colors)
    swatches.forEach(s => expect(s).not.toBeDisabled());
  });

  it('sharer (share only): no hex-wheel input anywhere in the panel (curated only guardrail)', () => {
    const { container } = renderOpen(['share']);
    // No color input type present
    const colorInputs = container.querySelectorAll('input[type="color"]');
    expect(colorInputs.length).toBe(0);
    // No free text input for entering hex codes
    const textInputs = Array.from(container.querySelectorAll('input[type="text"]')).filter(el =>
      /hex|colour|color/i.test((el as HTMLElement).getAttribute('placeholder') ?? '')
    );
    expect(textInputs.length).toBe(0);
  });

  // ── contributor (give only) → gradient swatches, no flat swatches ──────────

  it('contributor (give only): gradient radiogroup is present', () => {
    renderOpen(['give']);
    expect(
      screen.getByRole('radiogroup', { name: /gradient/i })
    ).toBeTruthy();
  });

  it('contributor (give only): flat-color radiogroup is NOT present', () => {
    renderOpen(['give']);
    expect(
      screen.queryByRole('radiogroup', { name: /flat colou?r|solid colou?r/i })
    ).toBeNull();
  });

  it('contributor (give only): gradient swatches include curated options (brand/gold/teal/violet)', () => {
    renderOpen(['give']);
    const group = screen.getByRole('radiogroup', { name: /gradient/i });
    const swatches = within(group).getAllByRole('radio');
    // 4 colored gradients (brand, gold, teal, violet) — grey excluded for contributors
    expect(swatches.length).toBeGreaterThanOrEqual(4);
    swatches.forEach(s => expect(s).not.toBeDisabled());
  });

  // ── both share + give → both sections present ──────────────────────────────

  it('both share+give: flat-color radiogroup IS present', () => {
    renderOpen(['share', 'give']);
    expect(
      screen.getByRole('radiogroup', { name: /flat colou?r|solid colou?r/i })
    ).toBeTruthy();
  });

  it('both share+give: gradient radiogroup IS present', () => {
    renderOpen(['share', 'give']);
    expect(
      screen.getByRole('radiogroup', { name: /gradient/i })
    ).toBeTruthy();
  });

  it('both share+give: both section headings visible and both groups enabled', () => {
    renderOpen(['share', 'give']);
    const flatGroup = screen.getByRole('radiogroup', { name: /flat colou?r|solid colou?r/i });
    const gradGroup = screen.getByRole('radiogroup', { name: /gradient/i });
    within(flatGroup).getAllByRole('radio').forEach(s => expect(s).not.toBeDisabled());
    within(gradGroup).getAllByRole('radio').forEach(s => expect(s).not.toBeDisabled());
  });

  // ── follow only → neither palette section ──────────────────────────────────

  it('follow only: no flat-color radiogroup (follow earns presence, not color)', () => {
    renderOpen(['follow']);
    expect(
      screen.queryByRole('radiogroup', { name: /flat colou?r|solid colou?r/i })
    ).toBeNull();
  });

  it('follow only: no gradient radiogroup (follow earns presence, not color)', () => {
    renderOpen(['follow']);
    expect(
      screen.queryByRole('radiogroup', { name: /gradient/i })
    ).toBeNull();
  });

  // ── CB-34 controlled-open API still works ──────────────────────────────────

  it('controlled-open=true renders the dialog panel (CB-34 API intact)', () => {
    renderOpen(['share']);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('controlled-open=false: dialog is not in the DOM', () => {
    render(
      <SunCreateModal
        unlockedBy={['share']}
        onCommit={vi.fn()}
        open={false}
        hideTrigger={true}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  // ── no dollar figures in either palette (guardrail) ────────────────────────

  it('no dollar sign appears in the modal palette section (guardrail)', () => {
    const { container } = renderOpen(['share', 'give']);
    expect(container.textContent).not.toContain('$');
  });
});
