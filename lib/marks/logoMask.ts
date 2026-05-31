// Single source of the GoFundMe rising-sun logo CSS mask (the Suns primitive shape).
//
// BUG THIS FIXES (CB-01 / CB-13): the previous inline masks used
//   url("data:image/svg+xml;utf8,<svg …>") center / contain no-repeat
// as the value of the `maskImage` property. Two defects made the mask compute to `none`,
// so suns rendered as plain gradient SQUARES (blocks):
//   1. raw `<`/`>` in the data-URI — invalid; browsers reject it.
//   2. `center / contain no-repeat` bundled into `maskImage` — those tokens belong to
//      mask-position/size/repeat, not mask-image; the whole value is rejected.
// Fix: percent-encode the SVG, and expose the bare `url(...)` plus a style object that sets
// position/size/repeat on their own properties.
import type { CSSProperties } from 'react';

const SUN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>" +
  "<path d='M4.8 17a7.2 7.2 0 0 1 14.4 0z'/>" +
  "<rect x='10.85' y='2.4' width='2.3' height='6.2' rx='1.15'/>" +
  "<rect x='5.4' y='3.9' width='2.3' height='5.8' rx='1.15' transform='rotate(-24 6.55 6.8)'/>" +
  "<rect x='16.3' y='3.9' width='2.3' height='5.8' rx='1.15' transform='rotate(24 17.45 6.8)'/>" +
  '</svg>';

/** Valid CSS `url(...)` for the logo mask image (percent-encoded data-URI). */
export const LOGO_MASK_URL = `url("data:image/svg+xml,${encodeURIComponent(SUN_SVG)}")`;

/** Spread onto a sun span to mask it into the rising-sun logo shape. */
export const logoMaskStyle: CSSProperties = {
  WebkitMaskImage: LOGO_MASK_URL,
  WebkitMaskRepeat: 'no-repeat',
  WebkitMaskSize: 'contain',
  WebkitMaskPosition: 'center',
  maskImage: LOGO_MASK_URL,
  maskRepeat: 'no-repeat',
  maskSize: 'contain',
  maskPosition: 'center',
};
