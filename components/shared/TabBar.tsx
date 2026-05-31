'use client';

/**
 * TabBar — accessible tab list.
 * role="tablist" / role="tab", aria-selected, arrow-key navigation.
 * Activates on ArrowLeft/ArrowRight, Home, End.
 */

import React, { useRef, useCallback } from 'react';

export interface Tab {
  id: string;
  label: string;
}

export interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function TabBar({ tabs, active, onChange, className }: TabBarProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let next: number | null = null;

      if (e.key === 'ArrowRight') {
        next = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        next = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        next = 0;
      } else if (e.key === 'End') {
        next = tabs.length - 1;
      }

      if (next !== null) {
        e.preventDefault();
        tabRefs.current[next]?.focus();
        onChange(tabs[next].id);
      }
    },
    [tabs, onChange]
  );

  return (
    <div
      role="tablist"
      aria-label="Page sections"
      className={[
        'flex gap-[var(--hrt-size-spacing-3)]',
        'border-b border-[var(--hrt-color-border-neutral-extra-subtle)]',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {tabs.map((tab, i) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[i] = el; }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            type="button"
            className={[
              'relative bg-none border-none',
              'py-[var(--hrt-size-spacing-2)] px-0',
              'text-body-md leading-none',
              'border-b-2 -mb-px',
              'transition-[color,border-color] duration-[var(--hrt-time-transition-fast)] ease-[var(--hrt-ease-default)]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hrt-color-border-brand)]',
              isActive
                ? 'text-[var(--hrt-color-text-default)] font-bold border-[var(--hrt-color-border-brand)]'
                : 'text-[var(--hrt-color-text-supporting)] font-regular border-transparent hover:text-[var(--hrt-color-text-default)]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
