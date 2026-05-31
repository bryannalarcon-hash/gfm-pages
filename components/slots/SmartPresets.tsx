'use client';
/**
 * SmartPresets — slot 'smart_presets' (D10).
 *
 * Renders three preset amount buttons + a custom-amount option.
 * selectedIndex pre-selects one button on mount. Amounts are locale-formatted.
 *
 * Always renders cohort defaults when no personalization signal exists — no null
 * content state because resolveSlot always provides presets. The slot NEVER unmounts.
 *
 * L3.5 rule: structure fixed, tokens only, no green CTA on white.
 */

import React, { useState, useEffect } from 'react';
import { Instrumented } from '@/components/overlay/Instrumented';
import { Button } from '@/components/shared/Button';
import type { SlotComponentProps } from '@/lib/personalization/slots';

function formatAmount(amount: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SmartPresets({ data, overlay }: SlotComponentProps<'smart_presets'>) {
  const { content } = data;
  const { presets, selectedIndex } = content;

  const [active, setActive] = useState<number | 'custom'>(selectedIndex);

  // Sync selected preset when persona changes (L3.5: data prop updates, useState doesn't).
  // presets[0] is the persona-specific anchor amount — reset to selectedIndex whenever
  // the resolved presets change so the correct amount is highlighted after a switch.
  useEffect(() => {
    setActive(selectedIndex);
  }, [selectedIndex, presets[0]]);

  return (
    <Instrumented attrs={overlay} regionLabel="smart-presets">
      <div
        data-slot="smart_presets"
        data-section-name="Amount Presets"
        className="flex flex-col gap-[var(--hrt-size-spacing-2)]"
        role="group"
        aria-label="Donation amount options"
      >
        {/* Preset buttons row */}
        <div className="grid grid-cols-3 gap-[var(--hrt-size-spacing-1)]">
          {presets.map((amount, idx) => {
            const isSelected = active === idx;
            return (
              <Button
                key={amount}
                variant={isSelected ? 'primary' : 'secondary'}
                size="md"
                aria-pressed={isSelected}
                onClick={() => setActive(idx)}
              >
                {formatAmount(amount)}
              </Button>
            );
          })}
        </div>

        {/* Custom amount option */}
        <Button
          variant={active === 'custom' ? 'primary' : 'secondary'}
          size="md"
          aria-pressed={active === 'custom'}
          onClick={() => setActive('custom')}
          block
        >
          Custom amount
        </Button>

        {/* Custom amount input — only visible when "custom" is active */}
        {active === 'custom' && (
          <div className="relative mt-[var(--hrt-size-spacing-1)]">
            <span
              className={[
                'absolute left-[var(--hrt-size-spacing-2)] top-1/2 -translate-y-1/2',
                'text-body-md text-[var(--hrt-color-text-supporting)] select-none pointer-events-none',
              ].join(' ')}
              aria-hidden="true"
            >
              $
            </span>
            <input
              type="number"
              min={1}
              step={1}
              placeholder="Enter amount"
              aria-label="Custom donation amount in USD"
              className={[
                'w-full pl-[calc(var(--hrt-size-spacing-2)+1ch)] pr-[var(--hrt-size-spacing-2)]',
                'min-h-[var(--hrt-size-spacing-5)] rounded-full border',
                'border-[var(--hrt-color-button-secondary-border)]',
                'text-body-md text-[var(--hrt-color-text-default)] bg-transparent',
                'focus:outline-2 focus:outline-[var(--hrt-color-border-brand)] focus:outline-offset-2',
              ].join(' ')}
            />
          </div>
        )}
      </div>
    </Instrumented>
  );
}
