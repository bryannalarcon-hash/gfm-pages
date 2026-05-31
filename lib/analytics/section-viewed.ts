'use client';
// Section Viewed dedup (test-plan §8 / metrics-research §4): an instrumented section fires
// `Section Viewed { section_name }` ONCE per section per session — even across persona-switch
// re-renders (no engagement-tier inflation). Backed by IntersectionObserver + a session-scoped
// Set so a re-render of the same section_name does not re-emit.
import { useEffect, useRef } from 'react';
import { capture } from '@/lib/analytics/capture';

const seenThisSession = new Set<string>();

/** Resets the per-session dedup set (test isolation only). */
export function __resetSectionViewed(): void {
  seenThisSession.clear();
}

export function useSectionViewed(sectionName: string): (el: HTMLElement | null) => void {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  // Ref callback: attach an observer to the section root. Fires once per section per session.
  return (el: HTMLElement | null) => {
    observerRef.current?.disconnect();
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (seenThisSession.has(sectionName)) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seenThisSession.has(sectionName)) {
            seenThisSession.add(sectionName);
            capture('Section Viewed', { section_name: sectionName });
            obs.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    observerRef.current = obs;
  };
}
