/**
 * CB-20 — Replay Player: single seeded session + time-driven frame progression
 *
 * Acceptance criteria:
 * (a) SESSION_ROWS has exactly 1 entry
 * (b) frameForSec() returns different frame ids at different playhead positions
 * (c) The ReplayPlayer reconstruction container carries data-frame that changes
 *     when currentSec advances across a frame boundary
 *
 * CB-40 — Replay click & filter bugs:
 * (d) Clicking a session row in ReplaySurface opens the ReplayPlayer
 * (e) "Has error" checkbox filters out sessions with errorCount=0
 * (f) "Rage clicks" checkbox filters out sessions with rageClickCount=0
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SESSION_ROWS, SESSION_DETAILS } from '@/fixtures/sessions';
import { frameForSec, REPLAY_FRAMES } from '@/components/dashboard/ReplayPlayer';
import { ReplayPlayer } from '@/components/dashboard/ReplayPlayer';
import { ReplaySurface } from '@/components/dashboard/ReplaySurface';

// ── (a) Fixture shape ────────────────────────────────────────────────────────

describe('SESSION_ROWS fixture', () => {
  it('contains exactly 1 session', () => {
    expect(SESSION_ROWS).toHaveLength(1);
  });

  it('the single session is sess-001 with persona close_friend', () => {
    const s = SESSION_ROWS[0];
    expect(s.sessionId).toBe('sess-001');
    expect(s.persona).toBe('close_friend');
  });

  it('SESSION_DETAILS has an entry for sess-001', () => {
    expect(SESSION_DETAILS['sess-001']).toBeDefined();
  });

  it('sess-001 detail has markers, network, vitals, deadClickCount', () => {
    const d = SESSION_DETAILS['sess-001'];
    expect(Array.isArray(d.markers)).toBe(true);
    expect(d.markers.length).toBeGreaterThan(0);
    expect(Array.isArray(d.network)).toBe(true);
    expect(d.vitals).toBeDefined();
    expect(typeof d.deadClickCount).toBe('number');
  });
});

// ── (b) frameForSec pure-function unit tests ─────────────────────────────────

describe('frameForSec', () => {
  it('REPLAY_FRAMES is a non-empty ordered array', () => {
    expect(REPLAY_FRAMES.length).toBeGreaterThan(1);
    for (let i = 1; i < REPLAY_FRAMES.length; i++) {
      expect(REPLAY_FRAMES[i].fromSec).toBeGreaterThan(REPLAY_FRAMES[i - 1].fromSec);
    }
  });

  it('returns the first frame id at sec=0', () => {
    const id = frameForSec(0);
    expect(id).toBe(REPLAY_FRAMES[0].id);
  });

  it('returns the last frame id at sec=85 (confirmation frame)', () => {
    const id = frameForSec(85);
    // sec=85 is >= final frame threshold
    expect(id).toBe(REPLAY_FRAMES[REPLAY_FRAMES.length - 1].id);
  });

  it('frame id at sec=0 DIFFERS from frame id at sec=85', () => {
    expect(frameForSec(0)).not.toBe(frameForSec(85));
  });

  it('frame id at sec=0 DIFFERS from sec=45 (donate panel frame)', () => {
    expect(frameForSec(0)).not.toBe(frameForSec(45));
  });

  it('frame id at sec=45 DIFFERS from sec=65 (payment frame)', () => {
    expect(frameForSec(45)).not.toBe(frameForSec(65));
  });

  it('frame id at sec=65 DIFFERS from sec=85 (confirmation frame)', () => {
    expect(frameForSec(65)).not.toBe(frameForSec(85));
  });

  it('covers all 5 distinct frames across the session', () => {
    const probePoints = [0, 25, 50, 70, 88];
    const ids = probePoints.map(frameForSec);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);
  });
});

// ── (c) ReplayPlayer DOM: data-frame attribute changes with playhead ──────────

describe('ReplayPlayer — data-frame changes as playhead advances', () => {
  const detail = SESSION_DETAILS['sess-001'];

  it('renders the reconstruction container with data-testid="replay-frame"', () => {
    render(<ReplayPlayer session={detail} />);
    const frame = screen.getByTestId('replay-frame');
    expect(frame).toBeTruthy();
  });

  it('starts at the landing frame (data-frame matches frameForSec(0))', () => {
    render(<ReplayPlayer session={detail} />);
    const frame = screen.getByTestId('replay-frame');
    expect(frame.getAttribute('data-frame')).toBe(frameForSec(0));
  });

  it('data-frame changes after scrubbing the playhead to 85s via ArrowRight', () => {
    render(<ReplayPlayer session={detail} />);
    const initialFrame = screen.getByTestId('replay-frame').getAttribute('data-frame');

    const scrubber = screen.getByRole('slider');
    // Each ArrowRight press advances 5s; press 17 times to reach 85s from 0
    for (let i = 0; i < 17; i++) {
      fireEvent.keyDown(scrubber, { key: 'ArrowRight' });
    }

    const finalFrame = screen.getByTestId('replay-frame').getAttribute('data-frame');
    expect(finalFrame).not.toBe(initialFrame);
  });

  it('shows confirmation content at the final frame', () => {
    render(<ReplayPlayer session={detail} />);
    const scrubber = screen.getByRole('slider');
    for (let i = 0; i < 17; i++) {
      fireEvent.keyDown(scrubber, { key: 'ArrowRight' });
    }
    // The confirmation frame should have "Thank you" or "Donation complete" text
    const frame = screen.getByTestId('replay-frame');
    expect(frame.textContent).toMatch(/thank you|donation complete/i);
  });

  it('shows masked card input in the payment frame (~65s)', () => {
    render(<ReplayPlayer session={detail} />);
    const scrubber = screen.getByRole('slider');
    // Advance to ~65s (13 presses * 5s = 65s)
    for (let i = 0; i < 13; i++) {
      fireEvent.keyDown(scrubber, { key: 'ArrowRight' });
    }
    const maskedInput = screen.getByLabelText('Masked input');
    expect(maskedInput).toBeTruthy();
  });
});

// ── (d-f) CB-40: ReplaySurface click and filter bugs ────────────────────────

describe('ReplaySurface — CB-40 click and filter fixes', () => {
  function renderSurface() {
    const onSelect = vi.fn();
    const utils = render(
      <ReplaySurface
        sessions={SESSION_ROWS}
        selectedId={null}
        onSelect={onSelect}
      />
    );
    return { onSelect, ...utils };
  }

  // (d) Clicking a session row opens the ReplayPlayer
  it('clicking the session row renders the ReplayPlayer', () => {
    renderSurface();
    // The single seeded session row is the close_friend session
    const row = screen.getByRole('option', { name: /sess-001/i });
    fireEvent.click(row);
    // After click, the player should be visible
    const player = screen.getByLabelText('Session replay player');
    expect(player).toBeTruthy();
  });

  it('calls onSelect with the session id when the row is clicked', () => {
    const { onSelect } = renderSurface();
    const row = screen.getByRole('option', { name: /sess-001/i });
    fireEvent.click(row);
    expect(onSelect).toHaveBeenCalledWith('sess-001');
  });

  // (e) "Has error" checkbox filters sessions with errorCount=0
  it('"Has error" checkbox ON filters out the session (errorCount=0) → empty state', () => {
    renderSurface();
    // Session should be visible before toggling
    expect(screen.getByRole('option', { name: /sess-001/i })).toBeTruthy();

    const checkbox = screen.getByRole('checkbox', { name: /has error/i });
    fireEvent.click(checkbox);

    // Session has errorCount=0 so it should be filtered out
    expect(screen.queryByRole('option', { name: /sess-001/i })).toBeNull();
    // Empty state message should appear
    expect(screen.getByText(/no sessions match/i)).toBeTruthy();
  });

  it('"Has error" checkbox OFF after ON restores the session row', () => {
    renderSurface();
    const checkbox = screen.getByRole('checkbox', { name: /has error/i });

    // Toggle ON
    fireEvent.click(checkbox);
    expect(screen.queryByRole('option', { name: /sess-001/i })).toBeNull();

    // Toggle OFF
    fireEvent.click(checkbox);
    expect(screen.getByRole('option', { name: /sess-001/i })).toBeTruthy();
  });

  // (f) "Rage clicks" checkbox filters sessions with rageClickCount=0
  it('"Rage clicks" checkbox ON filters out the session (rageClickCount=0) → empty state', () => {
    renderSurface();
    expect(screen.getByRole('option', { name: /sess-001/i })).toBeTruthy();

    const checkbox = screen.getByRole('checkbox', { name: /rage clicks/i });
    fireEvent.click(checkbox);

    // Session has rageClickCount=0 so it should be filtered out
    expect(screen.queryByRole('option', { name: /sess-001/i })).toBeNull();
    expect(screen.getByText(/no sessions match/i)).toBeTruthy();
  });

  it('"Rage clicks" checkbox OFF after ON restores the session row', () => {
    renderSurface();
    const checkbox = screen.getByRole('checkbox', { name: /rage clicks/i });

    // Toggle ON
    fireEvent.click(checkbox);
    expect(screen.queryByRole('option', { name: /sess-001/i })).toBeNull();

    // Toggle OFF
    fireEvent.click(checkbox);
    expect(screen.getByRole('option', { name: /sess-001/i })).toBeTruthy();
  });
});
