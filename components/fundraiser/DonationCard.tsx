'use client';
/**
 * DonationCard — D1 (single-screen form) + D10 (smart presets) + D12 (recurring nudge).
 *
 * Desktop: sticky right-rail card. Mobile: bottom-sheet (caller controls).
 * Smart presets via useResolvedSlot('smart_presets', page, candidates).
 * D12 P9 skip rule: openInMonthly=true → open in monthly, hide inline nudge.
 *
 * Events: Amount Selected · Donate Started · Donate Completed · Donate Failed
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/shared/Button';
import { Instrumented } from '@/components/overlay/Instrumented';
import { useResolvedSlot } from '@/components/slots/PersonalizedSlot';
import { capture } from '@/lib/analytics/capture';
import { MockPaymentFields } from './MockPaymentFields';
import type { PageContext } from '@/lib/types';
import type { SlotCandidates } from '@/lib/personalization/slots';
import type { OverlayAttrs } from '@/lib/overlay/types';

export interface DonationCardProps {
  page: PageContext;
  candidates: SlotCandidates;
  fundraiserId: string;
  organizerName: string;
  goalUsd: number;
  openInMonthly: boolean;
  attributedShareId?: string;
  onCompleted: (amountUsd: number, frequency: 'one_time' | 'monthly') => void;
  /** Optional: called when the user presses the X close button. If omitted, no close button is rendered. */
  onClose?: () => void;
}

type Frequency = 'one_time' | 'monthly';
type TipLabel = '0%' | '5%' | '10%' | '15%' | '20%';
const TIP_RATES: Record<TipLabel, number> = { '0%': 0, '5%': 0.05, '10%': 0.1, '15%': 0.15, '20%': 0.2 };

const D1_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Amount Selected,Donate Started,Donate Completed,Donate Failed',
  'data-overlay-delta': 'D1',
  'data-overlay-metric': 'checkout-completion-rate',
  'data-overlay-why': 'Amount, tip, and payment on one screen removes multi-step drop-off',
  'data-overlay-dashboard': 'donate-funnel',
};
const D10_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Amount Selected',
  'data-overlay-delta': 'D10',
  'data-overlay-metric': 'avg-gift-size',
  'data-overlay-why': 'Personalized amount anchors lift avg gift via behavioral anchoring',
  'data-overlay-dashboard': 'donate-funnel',
};
const D12_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Amount Selected,Donate Completed',
  'data-overlay-delta': 'D12',
  'data-overlay-metric': 'recurring-uptake-rate',
  'data-overlay-why': 'Inline one-tap monthly toggle captures recurring donors at peak intent',
  'data-overlay-dashboard': 'donate-funnel',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function DonationCard({
  page, candidates, organizerName, openInMonthly, attributedShareId, onCompleted, onClose,
}: DonationCardProps) {
  const presetsData = useResolvedSlot('smart_presets', page, candidates);
  const { presets, selectedIndex } = presetsData.content;

  const [selectedPreset, setSelectedPreset] = useState<number | null>(selectedIndex);
  const [customAmount, setCustomAmount] = useState('');
  const [frequency, setFrequency] = useState<Frequency>(openInMonthly ? 'monthly' : 'one_time');
  const [tipLabel, setTipLabel] = useState<TipLabel>('15%');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setSelectedPreset(selectedIndex); }, [selectedIndex]);

  const amountUsd = customAmount && parseFloat(customAmount) > 0
    ? parseFloat(customAmount)
    : selectedPreset !== null ? presets[selectedPreset] : presets[1];

  const tipAmountUsd = Math.round(amountUsd * TIP_RATES[tipLabel] * 100) / 100;
  const totalUsd = amountUsd + tipAmountUsd;

  const handlePresetClick = useCallback((idx: number) => {
    setSelectedPreset(idx); setCustomAmount('');
    capture('Amount Selected', { amount_usd: presets[idx], selection_type: 'preset', frequency });
  }, [presets, frequency]);

  const handleCustomBlur = useCallback(() => {
    const val = parseFloat(customAmount);
    if (val > 0) capture('Amount Selected', { amount_usd: val, selection_type: 'custom', frequency });
  }, [customAmount, frequency]);

  const handleFrequency = useCallback((freq: Frequency) => {
    setFrequency(freq);
    capture('Amount Selected', { amount_usd: amountUsd, selection_type: selectedPreset !== null ? 'preset' : 'custom', frequency: freq });
  }, [amountUsd, selectedPreset]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSubmitting(true);
    capture('Donate Started', { amount_usd: amountUsd, payment_method_type: 'card' });
    await new Promise((r) => setTimeout(r, 900));
    if (amountUsd === 13) {
      capture('Donate Failed', { error_code: 'card_declined', amount_usd: amountUsd });
      setError('Your card was declined. Please try a different payment method.');
      setSubmitting(false); return;
    }
    capture('Donate Completed', {
      amount_usd: amountUsd, payment_method_type: 'card', frequency,
      transaction_id: `txn_${Date.now()}`, tip_amount_usd: tipAmountUsd, tip_preset_label: tipLabel,
      attributed_share_id: attributedShareId ?? null, attributed_sharer_token: null,
    });
    setSubmitting(false);
    onCompleted(amountUsd, frequency);
  }, [amountUsd, frequency, tipAmountUsd, tipLabel, attributedShareId, onCompleted]);

  return (
    <Instrumented attrs={D1_OVERLAY} regionLabel="donation-card">
      <div
        data-donation-card-wrap
        style={{ maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden' }}
        className="bg-[var(--hrt-color-surface-raised)] border border-[var(--hrt-color-border-neutral-extra-subtle)] rounded-xxxl p-[var(--hrt-size-spacing-3)]"
      >
        {/* CB-57: close button — rendered only when caller provides onClose */}
        {onClose && (
          <div className="flex justify-end mb-[var(--hrt-size-spacing-1)]">
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="text-[var(--hrt-color-text-supporting)] hover:text-[var(--hrt-color-text-default)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hrt-color-border-brand)] rounded-full p-1 leading-none text-lg"
            >
              &#x2715;
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} noValidate>

          {/* CB-56: brief explanatory copy — what the donation funds */}
          <p className="text-body-sm text-[var(--hrt-color-text-supporting)] m-0 mb-[var(--hrt-size-spacing-2)]">
            Your gift helps fund real-time alerts that protect families from wildfires. Every dollar keeps the alerts running.
          </p>

          {/* D10 Preset pills */}
          <Instrumented attrs={D10_OVERLAY} regionLabel="smart-presets">
            <fieldset className="border-0 p-0 m-0 mb-[var(--hrt-size-spacing-2)]">
              <legend className="sr-only">Donation amount</legend>
              <div className="flex gap-[var(--hrt-size-spacing-1)]">
                {presets.map((amt, idx) => (
                  <button key={idx} type="button" onClick={() => handlePresetClick(idx)}
                    aria-pressed={selectedPreset === idx && !customAmount}
                    className={['flex-1 rounded-full font-bold text-body-md border transition-[background,border-color]',
                      'min-h-[var(--hrt-size-spacing-5)] px-[var(--hrt-size-spacing-2)]',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hrt-color-border-brand)]',
                      selectedPreset === idx && !customAmount
                        ? 'bg-[var(--hrt-color-button-primary-surface)] text-[var(--hrt-color-button-primary-text)] border-transparent'
                        : 'bg-transparent text-[var(--hrt-color-text-default)] border-[var(--hrt-color-button-secondary-border)] hover:bg-[#2323230d]',
                    ].join(' ')}>
                    {fmt(amt)}{frequency === 'monthly' ? '/mo' : ''}
                  </button>
                ))}
              </div>
              <div className="mt-[var(--hrt-size-spacing-1)] relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body-md text-[var(--hrt-color-text-supporting)]">$</span>
                <input type="number" min="1" step="1" placeholder="Custom amount" value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedPreset(null); }}
                  onBlur={handleCustomBlur}
                  className="w-full pl-7 pr-3 py-2 rounded-[var(--hrt-size-radius-md)] border border-[var(--hrt-color-button-secondary-border)] text-body-md bg-white focus:outline-2 focus:outline-[var(--hrt-color-border-brand)] focus:border-transparent"
                  aria-label="Custom donation amount in dollars" />
              </div>
            </fieldset>
          </Instrumented>

          {/* D12 Recurring nudge — hidden when P9 already opted in */}
          {!openInMonthly && (
            <Instrumented attrs={D12_OVERLAY} regionLabel="recurring-nudge">
              <div className="rounded-[var(--hrt-size-radius-lg)] p-[var(--hrt-size-spacing-2)] mb-[var(--hrt-size-spacing-2)]"
                style={{ background: 'var(--hrt-color-surface-neutral-subtle)' }}>
                <p className="text-body-sm text-[var(--hrt-color-text-default)] m-0 mb-[var(--hrt-size-spacing-1)]">
                  {organizerName} needs ongoing support. Make this {fmt(amountUsd)}/month?
                </p>
                <div className="flex gap-[var(--hrt-size-spacing-1)]" role="group" aria-label="Payment frequency">
                  {(['one_time', 'monthly'] as Frequency[]).map((freq) => (
                    <button key={freq} type="button" onClick={() => handleFrequency(freq)} aria-pressed={frequency === freq}
                      className={['flex-1 rounded-full text-body-sm font-bold border transition-[background,border-color]',
                        'min-h-[var(--hrt-size-spacing-4)] px-[var(--hrt-size-spacing-2)]',
                        frequency === freq
                          ? 'bg-[var(--hrt-color-button-primary-surface)] text-[var(--hrt-color-button-primary-text)] border-transparent'
                          : 'bg-transparent text-[var(--hrt-color-text-default)] border-[var(--hrt-color-button-secondary-border)] hover:bg-[#2323230d]',
                      ].join(' ')}>
                      {freq === 'one_time' ? 'One-time' : 'Monthly'}
                    </button>
                  ))}
                </div>
              </div>
            </Instrumented>
          )}
          {openInMonthly && (
            <div className="mb-[var(--hrt-size-spacing-2)] rounded-[var(--hrt-size-radius-md)] p-[var(--hrt-size-spacing-1)] bg-[var(--hrt-color-surface-brand-subtle)]">
              <p className="text-body-xs text-[var(--hrt-color-text-brand-strong)] m-0 font-bold">Monthly giving selected</p>
            </div>
          )}

          {/* Tip selector */}
          <div className="mb-[var(--hrt-size-spacing-2)]">
            <label className="text-body-sm text-[var(--hrt-color-text-supporting)] block mb-1">Tip to support our platform</label>
            <div className="flex items-center gap-[var(--hrt-size-spacing-1)]">
              <select value={tipLabel} onChange={(e) => setTipLabel(e.target.value as TipLabel)}
                className="rounded-[var(--hrt-size-radius-md)] border border-[var(--hrt-color-button-secondary-border)] text-body-sm px-2 py-1 bg-white" aria-label="Tip percentage">
                {(Object.keys(TIP_RATES) as TipLabel[]).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-body-sm text-[var(--hrt-color-text-supporting)]">= {fmt(tipAmountUsd)}</span>
            </div>
          </div>

          <MockPaymentFields />

          {error && (
            <div role="alert" className="mb-[var(--hrt-size-spacing-1)] rounded-[var(--hrt-size-radius-md)] p-[var(--hrt-size-spacing-1)] bg-red-50 border border-red-200 text-body-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" block disabled={submitting || amountUsd <= 0}>
            {submitting ? 'Processing…' : frequency === 'monthly' ? `Donate ${fmt(totalUsd)}/month` : `Donate ${fmt(totalUsd)}`}
          </Button>
          <p className="text-body-xs text-[var(--hrt-color-text-supporting)] text-center mt-[var(--hrt-size-spacing-1)] m-0">
            Guest checkout · secured payment
          </p>
        </form>
      </div>
    </Instrumented>
  );
}
