/**
 * personas/loader — unit tests
 * Covers: isDemoMode, getPersonaFixture (demo-gated), PERSONA_ORDER.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { PERSONA_ORDER } from '@/fixtures/personas';

// We re-import via the module so vi.stubEnv takes effect.
// Each test suite uses dynamic imports so env is read fresh.

describe('isDemoMode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true when NEXT_PUBLIC_DEMO_MODE="true"', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'true');
    const { isDemoMode } = await import('@/lib/personas/loader');
    expect(isDemoMode()).toBe(true);
  });

  it('returns false when NEXT_PUBLIC_DEMO_MODE="false"', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'false');
    // Need to bust the module cache so the function reads the new env
    const { isDemoMode } = await import('@/lib/personas/loader');
    expect(isDemoMode()).toBe(false);
  });

  it('returns false when NEXT_PUBLIC_DEMO_MODE is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', '');
    const { isDemoMode } = await import('@/lib/personas/loader');
    expect(isDemoMode()).toBe(false);
  });
});

describe('getPersonaFixture — demo ON', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the correct fixture for the requested slug when demo mode is on', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'true');
    const { getPersonaFixture } = await import('@/lib/personas/loader');
    const fixture = getPersonaFixture('close_friend');
    expect(fixture.slug).toBe('close_friend');
    expect(fixture.name).toBe('Sarah K.');
    expect(fixture.authenticated).toBe(true);
  });

  it('returns anonymous fixture for slug "anonymous" in demo mode', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'true');
    const { getPersonaFixture } = await import('@/lib/personas/loader');
    const fixture = getPersonaFixture('anonymous');
    expect(fixture.slug).toBe('anonymous');
    expect(fixture.name).toBeNull();
    expect(fixture.authenticated).toBe(false);
  });

  it('returns the profile_owner fixture correctly in demo mode', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'true');
    const { getPersonaFixture } = await import('@/lib/personas/loader');
    const fixture = getPersonaFixture('profile_owner');
    expect(fixture.slug).toBe('profile_owner');
    expect(fixture.isProfileOwner).toBe(true);
  });

  it('falls back to anonymous for an unknown slug in demo mode', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'true');
    const { getPersonaFixture } = await import('@/lib/personas/loader');
    // @ts-expect-error testing unknown slug
    const fixture = getPersonaFixture('nonexistent_slug');
    expect(fixture.slug).toBe('anonymous');
  });
});

describe('getPersonaFixture — demo OFF', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns anonymous when NEXT_PUBLIC_DEMO_MODE is not "true"', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'false');
    const { getPersonaFixture } = await import('@/lib/personas/loader');
    // Even when requesting a specific persona, demo off → anonymous
    const fixture = getPersonaFixture('close_friend');
    expect(fixture.slug).toBe('anonymous');
    expect(fixture.authenticated).toBe(false);
  });

  it('returns anonymous even for profile_owner when demo is off', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'false');
    const { getPersonaFixture } = await import('@/lib/personas/loader');
    const fixture = getPersonaFixture('profile_owner');
    expect(fixture.slug).toBe('anonymous');
  });
});

describe('PERSONA_ORDER', () => {
  it('has exactly 6 entries', () => {
    expect(PERSONA_ORDER).toHaveLength(6);
  });

  it('starts with "anonymous" (the default/fallback persona)', () => {
    expect(PERSONA_ORDER[0]).toBe('anonymous');
  });

  it('contains all 6 persona slugs', () => {
    const expected = ['anonymous', 'close_friend', 'extrovert', 'shared_by_extro', 'returning_lapsed', 'profile_owner'];
    for (const slug of expected) {
      expect(PERSONA_ORDER).toContain(slug);
    }
  });
});
