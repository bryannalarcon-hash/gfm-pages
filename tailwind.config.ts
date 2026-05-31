import type { Config } from 'tailwindcss';

/**
 * Tailwind theme is a thin map over the design-system CSS variables defined in
 * app/tokens.css (transcribed verbatim from gfm-design-system.md / mocks/tokens.css).
 * RULE: no invented hex here — every color references a --hrt-* token. No green CTA on white.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // brand / greens
        brand: 'var(--hrt-color-surface-brand)',
        'brand-medium': 'var(--hrt-color-surface-brand-medium)',
        'brand-subtle': 'var(--hrt-color-surface-brand-subtle)',
        'brand-strong': 'var(--hrt-color-surface-brand-strong)',
        'brand-strongest': 'var(--hrt-color-surface-brand-strongest)',
        'text-brand': 'var(--hrt-color-text-brand)',
        'text-brand-strong': 'var(--hrt-color-text-brand-strong)',
        // neutrals
        ink: 'var(--hrt-color-text-default)',
        'ink-strong': 'var(--hrt-color-text-strong)',
        supporting: 'var(--hrt-color-text-supporting)',
        helper: 'var(--hrt-color-text-helper)',
        'border-neutral': 'var(--hrt-color-border-neutral)',
        'surface-subtle': 'var(--hrt-color-surface-neutral-subtle)',
        'surface-extra-subtle': 'var(--hrt-color-surface-neutral-extra-subtle)',
        'surface-default': 'var(--hrt-color-surface-default)',
        'surface-medium': 'var(--hrt-color-surface-neutral-medium)',
        'border-subtle': 'var(--hrt-color-border-neutral-extra-subtle)',
        // semantic
        negative: 'var(--hrt-color-text-negative)',
        informative: 'var(--hrt-color-text-informative)',
        positive: 'var(--hrt-color-text-positive)',
        tip: 'var(--hrt-color-text-tip)',
        'tip-medium': 'var(--hrt-color-surface-tip-medium)',
        'tip-subtle': 'var(--hrt-color-surface-tip-subtle)',
        feature: 'var(--hrt-color-text-feature)',
        // buttons
        'btn-primary': 'var(--hrt-color-button-primary-surface)',
        'btn-primary-hover': 'var(--hrt-color-button-primary-surface-hover)',
        'btn-on-strong': 'var(--hrt-color-button-on-strong-surface)',
        'btn-on-strong-text': 'var(--hrt-color-button-on-strong-text)',
      },
      fontFamily: {
        sans: ['var(--hrt-font-family)'],
        mono: ['var(--hrt-font-family-mono)'],
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        bold: '700',
      },
      fontSize: {
        'display-lg': 'var(--hrt-size-font-display-lg)',
        'display-md': 'var(--hrt-size-font-display-md)',
        'display-sm': 'var(--hrt-size-font-display-sm)',
        'heading-xl': 'var(--hrt-size-font-heading-xl)',
        'heading-lg': 'var(--hrt-size-font-heading-lg)',
        'heading-md': 'var(--hrt-size-font-heading-md)',
        'heading-sm': 'var(--hrt-size-font-heading-sm)',
        'heading-xs': 'var(--hrt-size-font-heading-xs)',
        'body-lg': 'var(--hrt-size-font-body-lg)',
        'body-md': 'var(--hrt-size-font-body-md)',
        'body-sm': 'var(--hrt-size-font-body-sm)',
        'body-xs': 'var(--hrt-size-font-body-xs)',
      },
      spacing: {
        half: 'var(--hrt-size-spacing-half)',
        1: 'var(--hrt-size-spacing-1)',
        2: 'var(--hrt-size-spacing-2)',
        3: 'var(--hrt-size-spacing-3)',
        4: 'var(--hrt-size-spacing-4)',
        5: 'var(--hrt-size-spacing-5)',
        6: 'var(--hrt-size-spacing-6)',
        7: 'var(--hrt-size-spacing-7)',
        8: 'var(--hrt-size-spacing-8)',
        9: 'var(--hrt-size-spacing-9)',
        10: 'var(--hrt-size-spacing-10)',
        11: 'var(--hrt-size-spacing-11)',
        12: 'var(--hrt-size-spacing-12)',
        15: 'var(--hrt-size-spacing-15)',
        30: 'var(--hrt-size-spacing-30)',
      },
      borderRadius: {
        xs: 'var(--hrt-size-radius-xs)',
        sm: 'var(--hrt-size-radius-sm)',
        md: 'var(--hrt-size-radius-md)',
        lg: 'var(--hrt-size-radius-lg)',
        xl: 'var(--hrt-size-radius-xl)',
        xxl: 'var(--hrt-size-radius-xxl)',
        xxxl: 'var(--hrt-size-radius-xxxl)',
        full: 'var(--hrt-size-radius-full)',
      },
      boxShadow: {
        soft: 'var(--hrt-shadow-soft)',
        medium: 'var(--hrt-shadow-medium)',
        'medium-strong': 'var(--hrt-shadow-medium-strong)',
        strong: 'var(--hrt-shadow-strong)',
      },
      transitionTimingFunction: {
        default: 'var(--hrt-ease-default)',
      },
    },
  },
  plugins: [],
};

export default config;
