'use client';

/**
 * SunCreateModal — "Light your sun" creation/customization modal.
 *
 * Guardrails (feature-contribution-board.md §3):
 *  - Entry BUTTON is disabled/greyed until p.unlockedBy is non-empty (greyed-until-unlocked).
 *    The mock bug in suncreate.js always called removeAttribute('disabled') — fixed here:
 *    the button's disabled state is derived SOLELY from unlockedBy.length === 0.
 *  - Gradient picker offers ONLY the curated SunGradient presets (grey/gold/teal/violet/brand).
 *    NO free hex/RGB input exists anywhere in this component.
 *  - Name consent is opt-in, non-blocking (default anonymous; checkbox).
 *  - No dollar figures anywhere in DOM.
 *  - Focus trap + Esc.
 *  - reducedMotion respected (no entrance animation when true).
 *  - Fires capture('Mark Created') and capture('Mark Customized') appropriately.
 */

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import type { SunCreateModalProps, SunGradient, SunAction } from '@/lib/marks/types';
import { SUN_GRADIENTS } from '@/lib/marks/types';
import { capture } from '@/lib/analytics/capture';

import { logoMaskStyle } from '@/lib/marks/logoMask';

// Curated gradient presets — this is the COMPLETE and ONLY list. No hex wheel.
// Shown to contributors (give action).
const GRADIENT_OPTIONS: { id: SunGradient; label: string }[] = [
  { id: 'brand',  label: 'Lime green' },
  { id: 'gold',   label: 'Gold'       },
  { id: 'teal',   label: 'Teal'       },
  { id: 'violet', label: 'Violet'     },
];

// Curated flat (solid) color swatches for sharers — derived from the gradient primary
// (from) stop of each SunGradient key. Same on-brand hues, no hex wheel.
// CB-51: share action unlocks these; no free color picker.
const FLAT_COLOR_OPTIONS: { id: SunGradient; label: string; solidColor: string }[] = [
  { id: 'brand',  label: 'Lime green', solidColor: SUN_GRADIENTS.brand.from  },
  { id: 'gold',   label: 'Gold',       solidColor: SUN_GRADIENTS.gold.from   },
  { id: 'teal',   label: 'Teal',       solidColor: SUN_GRADIENTS.teal.from   },
  { id: 'violet', label: 'Violet',     solidColor: SUN_GRADIENTS.violet.from },
];

// The three unlock avenues with their reminder lines (§3 copy).
const AVENUES: { action: SunAction; icon: string; title: string; reminderLine: string }[] = [
  {
    action: 'follow',
    icon: '🔔',
    title: 'Follow this cause',
    reminderLine: 'Follow this fundraiser to place your mark.',
  },
  {
    action: 'share',
    icon: '↗',
    title: 'Share it',
    reminderLine: 'Share to unlock color for your mark.',
  },
  {
    action: 'give',
    icon: '♥',
    title: 'Give',
    reminderLine: 'Your donation gives your mark its size.',
  },
];

// Modal entrance animation (suppressed under reducedMotion)
const MODAL_ANIM_CSS = `
@keyframes sunModalSlideUp {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes sunModalFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`;

let modalAnimInjected = false;
function ensureModalAnim(): void {
  if (modalAnimInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.dataset['sunModalAnim'] = '1';
  el.textContent = MODAL_ANIM_CSS;
  document.head.appendChild(el);
  modalAnimInjected = true;
}

interface SunCreateModalInternalProps extends SunCreateModalProps {
  /** Whether to suppress entrance animation */
  reducedMotion?: boolean;
  /**
   * CB-34: controlled-open mode. When `open` is provided the modal's visibility is
   * driven by the parent (e.g. the marks-intro "Edit my sun" button) and the built-in
   * trigger button is hidden. `onOpenChange` is called whenever the modal wants to
   * open/close so the parent can keep its own state in sync. Defaults to the existing
   * self-managed behaviour (uncontrolled, renders its own trigger) when omitted.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the built-in trigger button (used when the parent supplies its own). */
  hideTrigger?: boolean;
}

export function SunCreateModal({
  unlockedBy,
  onCommit,
  reducedMotion = false,
  open: openProp,
  onOpenChange,
  hideTrigger = false,
}: SunCreateModalInternalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const isOpen = isControlled ? openProp : uncontrolledOpen;
  const setIsOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );
  // CB-51: which palette sections to show
  // share → flat colors; give → gradients; both → both; follow-only → neither (stays grey)
  const showFlats = unlockedBy.includes('share');
  const showGradients = unlockedBy.includes('give');

  // Default to 'brand' if any color-unlocking action present, otherwise 'grey'
  const defaultGradient: SunGradient =
    showFlats || showGradients ? 'brand' : 'grey';

  const [selectedGradient, setSelectedGradient] = useState<SunGradient>(defaultGradient);
  const [consentName, setConsentName] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const consentId = useId();

  const isUnlocked = unlockedBy.length > 0;

  // Ensure animations are loaded on client
  if (typeof window !== 'undefined') {
    ensureModalAnim();
  }

  const open = useCallback(() => {
    setIsOpen(true);
    capture('Mark Customized', { gradient_id: selectedGradient });
  }, [selectedGradient]);

  const close = useCallback(() => {
    setIsOpen(false);
    // Return focus to trigger button on close
    setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  const handleCommit = useCallback(() => {
    capture('Mark Created', {
      action_type: unlockedBy[0] ?? 'follow',
      gradient_id: selectedGradient,
      consent_name: consentName,
    });
    onCommit(selectedGradient, consentName);
    close();
  }, [selectedGradient, consentName, unlockedBy, onCommit, close]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  // Focus trap — keep focus inside the panel while open
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const panel = panelRef.current;

    // Focus the first focusable element when opening
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      (focusable[0] as HTMLElement).focus();
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const els = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Preview gradient CSS
  const { from, to } = SUN_GRADIENTS[selectedGradient];
  const previewBg =
    selectedGradient === 'grey'
      ? 'var(--hrt-color-border-neutral)'
      : `linear-gradient(135deg, ${from}, ${to})`;

  // Preview status line
  const previewStatus = showFlats
    ? 'Coloured because you shared · grows when you give'
    : isUnlocked
    ? 'Following — sharing will add colour'
    : 'Light it by taking any action above';

  // Panel entrance animation
  const panelAnimation: React.CSSProperties =
    !reducedMotion
      ? { animation: 'sunModalSlideUp 0.35s var(--hrt-ease-default) both' }
      : {};

  return (
    <>
      {/* Entry trigger button — greyed/disabled until unlockedBy is non-empty.
          CB-34: hidden when the parent supplies its own trigger (controlled-open mode). */}
      {!hideTrigger && (
      <button
        ref={triggerRef}
        onClick={isUnlocked ? open : undefined}
        disabled={!isUnlocked}
        aria-disabled={!isUnlocked}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.625rem 1.25rem',
          borderRadius: 'var(--hrt-size-radius-full)',
          border: 'none',
          cursor: isUnlocked ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--hrt-font-family)',
          fontWeight: 700,
          fontSize: 'var(--hrt-size-font-body-sm)',
          background: isUnlocked
            ? 'var(--hrt-color-button-primary-surface)'
            : 'var(--hrt-color-surface-neutral-medium)',
          color: isUnlocked
            ? 'var(--hrt-color-button-primary-text)'
            : 'var(--hrt-color-text-disabled)',
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        {isUnlocked ? 'View your sun' : 'Light your sun'}
      </button>
      )}

      {/* Backdrop + modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Your sun"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            background: 'rgba(11,41,26,0.55)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            ref={panelRef}
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: 460,
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: 'var(--hrt-size-radius-xxxl) var(--hrt-size-radius-xxxl) 0 0',
              padding: 'var(--hrt-size-spacing-3)',
              boxShadow: 'var(--hrt-shadow-strong)',
              ...panelAnimation,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--hrt-size-spacing-2)',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 'var(--hrt-size-font-heading-md)',
                  fontWeight: 700,
                  color: 'var(--hrt-color-text-headings)',
                }}
              >
                Your sun
              </h3>
              <button
                onClick={close}
                aria-label="Close"
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  color: 'var(--hrt-color-text-supporting)',
                  lineHeight: 1,
                  padding: '0.25rem',
                }}
              >
                ×
              </button>
            </div>

            <p
              style={{
                fontSize: 'var(--hrt-size-font-body-sm)',
                color: 'var(--hrt-color-text-supporting)',
                margin: '0 0 var(--hrt-size-spacing-2)',
              }}
            >
              Follow places your sun · sharing colours it · giving grows it.
              Anonymous by default.
            </p>

            {/* Three unlock avenues */}
            {AVENUES.map(({ action, icon, title, reminderLine }) => {
              const done = unlockedBy.includes(action);
              return (
                <div
                  key={action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--hrt-size-spacing-2)',
                    padding: 'var(--hrt-size-spacing-2)',
                    borderRadius: 'var(--hrt-size-radius-lg)',
                    background: done
                      ? 'var(--hrt-color-surface-brand-subtle)'
                      : 'var(--hrt-color-surface-neutral-subtle)',
                    marginTop: 'var(--hrt-size-spacing-1)',
                  }}
                >
                  {/* Icon circle */}
                  <span
                    aria-hidden="true"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: done
                        ? 'var(--hrt-color-surface-brand-medium)'
                        : '#fff',
                      color: done
                        ? 'var(--hrt-color-text-brand-strong)'
                        : 'var(--hrt-color-text-supporting)',
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    {icon}
                  </span>

                  {/* Text */}
                  <span style={{ flex: 1, fontSize: 'var(--hrt-size-font-body-sm)' }}>
                    <b style={{ display: 'block', fontWeight: 700 }}>{title}</b>
                    {/* Reminder line shown whether done or not — always visible */}
                    <span style={{ color: 'var(--hrt-color-text-supporting)' }}>
                      {reminderLine}
                    </span>
                  </span>

                  {/* Status badge */}
                  <span
                    style={{
                      fontSize: 'var(--hrt-size-font-body-xs)',
                      fontWeight: 700,
                      color: done
                        ? 'var(--hrt-color-text-brand-strong)'
                        : 'var(--hrt-color-text-supporting)',
                    }}
                  >
                    {done ? '✓ done' : 'locked'}
                  </span>
                </div>
              );
            })}

            {/* CB-51: Palette picker — curated presets ONLY, no free hex input.
                share action → flat color swatches; give action → gradient swatches;
                both → both sections; follow-only → neither. */}

            {/* Flat color swatches — for sharers (CB-51) */}
            {showFlats && (
              <div style={{ marginTop: 'var(--hrt-size-spacing-3)' }}>
                <div
                  style={{
                    fontSize: 'var(--hrt-size-font-body-sm)',
                    fontWeight: 700,
                    marginBottom: 'var(--hrt-size-spacing-1)',
                    color: 'var(--hrt-color-text-default)',
                  }}
                >
                  Solid colour{' '}
                  <span
                    style={{
                      fontWeight: 400,
                      color: 'var(--hrt-color-text-supporting)',
                    }}
                  >
                    · curated sharer palette (no free colour picker)
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--hrt-size-spacing-2)',
                    flexWrap: 'wrap',
                  }}
                  role="radiogroup"
                  aria-label="Choose a flat colour"
                >
                  {FLAT_COLOR_OPTIONS.map(({ id, label, solidColor }) => {
                    const isSelected = selectedGradient === id;
                    return (
                      <button
                        key={'flat-' + id}
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={label}
                        onClick={() => {
                          setSelectedGradient(id);
                          capture('Mark Customized', { gradient_id: id, palette: 'flat' });
                        }}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: solidColor,
                          border: isSelected
                            ? '2px solid var(--hrt-color-text-default)'
                            : '2px solid transparent',
                          boxShadow: isSelected ? '0 0 0 2px #fff inset' : 'none',
                          cursor: 'pointer',
                          opacity: 1,
                          flexShrink: 0,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gradient swatches — for contributors (CB-51) */}
            {showGradients && (
              <div style={{ marginTop: 'var(--hrt-size-spacing-3)' }}>
                <div
                  style={{
                    fontSize: 'var(--hrt-size-font-body-sm)',
                    fontWeight: 700,
                    marginBottom: 'var(--hrt-size-spacing-1)',
                    color: 'var(--hrt-color-text-default)',
                  }}
                >
                  Key gradient{' '}
                  <span
                    style={{
                      fontWeight: 400,
                      color: 'var(--hrt-color-text-supporting)',
                    }}
                  >
                    · curated contributor palette (no free colour picker)
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--hrt-size-spacing-2)',
                    flexWrap: 'wrap',
                  }}
                  role="radiogroup"
                  aria-label="Choose a gradient"
                >
                  {GRADIENT_OPTIONS.map(({ id, label }) => {
                    const { from: gFrom, to: gTo } = SUN_GRADIENTS[id];
                    const swatchBg = `linear-gradient(135deg, ${gFrom}, ${gTo})`;
                    const isSelected = selectedGradient === id;
                    return (
                      <button
                        key={'grad-' + id}
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={label}
                        onClick={() => {
                          setSelectedGradient(id);
                          capture('Mark Customized', { gradient_id: id, palette: 'gradient' });
                        }}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: swatchBg,
                          border: isSelected
                            ? '2px solid var(--hrt-color-text-default)'
                            : '2px solid transparent',
                          boxShadow: isSelected ? '0 0 0 2px #fff inset' : 'none',
                          cursor: 'pointer',
                          opacity: 1,
                          flexShrink: 0,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Name consent — opt-in, non-blocking, anonymous by default */}
            <label
              htmlFor={consentId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--hrt-size-spacing-2)',
                marginTop: 'var(--hrt-size-spacing-2)',
                fontSize: 'var(--hrt-size-font-body-sm)',
                cursor: 'pointer',
              }}
            >
              <input
                id={consentId}
                type="checkbox"
                checked={consentName}
                onChange={(e) => setConsentName(e.target.checked)}
                style={{
                  width: 18,
                  height: 18,
                  accentColor: 'var(--hrt-color-surface-brand)',
                  flexShrink: 0,
                }}
              />
              Show my name on my sun{' '}
              <span style={{ color: 'var(--hrt-color-text-supporting)', fontWeight: 400 }}>
                (optional · anonymous by default)
              </span>
            </label>

            {/* Preview */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--hrt-size-spacing-2)',
                background: 'var(--hrt-color-surface-neutral-subtle)',
                borderRadius: 'var(--hrt-size-radius-lg)',
                padding: 'var(--hrt-size-spacing-2)',
                marginTop: 'var(--hrt-size-spacing-2)',
              }}
            >
              {/* Preview sun mark */}
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  background: previewBg,
                  ...logoMaskStyle,
                }}
              />
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 'var(--hrt-size-font-body-sm)',
                    color: 'var(--hrt-color-text-default)',
                  }}
                >
                  {isUnlocked ? 'Your sun is lit' : 'Your sun'}
                </div>
                <div
                  style={{
                    fontSize: 'var(--hrt-size-font-body-xs)',
                    color: 'var(--hrt-color-text-supporting)',
                  }}
                >
                  {previewStatus}
                </div>
              </div>
            </div>

            {/* Confirm button — always enabled when modal is open (user has unlocked to get here) */}
            <button
              onClick={handleCommit}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 'var(--hrt-size-spacing-2)',
                padding: '0.75rem 1.25rem',
                border: 'none',
                borderRadius: 'var(--hrt-size-radius-full)',
                cursor: 'pointer',
                fontFamily: 'var(--hrt-font-family)',
                fontWeight: 700,
                fontSize: 'var(--hrt-size-font-body-md)',
                background: 'var(--hrt-color-button-primary-surface)',
                color: 'var(--hrt-color-button-primary-text)',
              }}
            >
              Light my sun
            </button>
          </div>
        </div>
      )}
    </>
  );
}
