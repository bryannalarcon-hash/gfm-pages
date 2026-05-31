'use client';

/**
 * CountUp — animates a number from 0 to `target` over `duration` ms
 * when the element enters the viewport.
 * Respects prefers-reduced-motion: renders the final value instantly.
 */

import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  target: number;
  duration?: number;
  /** Optional formatter, e.g. (n) => n.toLocaleString() */
  format?: (n: number) => string;
}

export function CountUp({ target, duration = 800, format }: CountUpProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check reduced-motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setValue(target);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // easeOut cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  const display = format ? format(value) : value.toLocaleString();

  return <span ref={ref}>{display}</span>;
}
