/**
 * Inline SVG icon components — filled paths, fill="currentColor", no strokes.
 * Ported from mocks/icons.js as named React components.
 * Each accepts an optional className and size (defaults to 1.5rem / 24px).
 */

import React from 'react';

interface IconProps {
  className?: string;
  size?: number | string;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
}

function mkIcon(path: string) {
  return function Icon({ className, size = 24, 'aria-hidden': ariaHidden = true, 'aria-label': ariaLabel }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        aria-hidden={ariaLabel ? undefined : ariaHidden}
        aria-label={ariaLabel}
        role={ariaLabel ? 'img' : undefined}
      >
        <path d={path} />
      </svg>
    );
  };
}

export const IconFacebook = mkIcon(
  'M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z'
);

export const IconX = mkIcon(
  'M18.24 2H21l-6.55 7.5L22 22h-6.2l-4.86-6.36L5.4 22H2.6l7-8.02L2 2h6.36l4.39 5.8L18.24 2Zm-1.09 18h1.69L7.02 3.78H5.2L17.15 20Z'
);

export const IconWhatsapp = mkIcon(
  'M12 2a10 10 0 0 0-8.6 15.08L2 22l5.06-1.33A10 10 0 1 0 12 2Zm5.84 14.16c-.25.7-1.45 1.34-2 1.38-.51.05-1.16.07-1.87-.12a16.7 16.7 0 0 1-1.7-.63 11.6 11.6 0 0 1-4.45-3.93c-.33-.45-1.07-1.43-1.07-2.73s.68-1.93.92-2.2a.96.96 0 0 1 .7-.33c.17 0 .35 0 .5.01.16.01.38-.06.59.45.21.51.73 1.78.79 1.91.06.13.1.28.02.45-.08.17-.12.28-.25.43-.12.15-.26.33-.37.44-.12.13-.25.26-.11.5.14.25.63 1.04 1.36 1.69.93.83 1.72 1.09 1.96 1.21.25.13.39.11.53-.06.15-.17.62-.72.79-.97.16-.25.33-.21.55-.13.22.08 1.42.67 1.66.79.25.12.41.18.47.29.06.1.06.6-.19 1.3Z'
);

export const IconMessenger = mkIcon(
  'M12 2C6.27 2 2 6.2 2 11.7c0 2.9 1.2 5.4 3.13 7.13.16.14.26.34.27.56l.05 1.76c.02.56.6.93 1.11.7l1.96-.86c.17-.08.36-.09.54-.04 1 .27 2.06.42 3.84.42 5.73 0 10-4.2 10-9.7S17.73 2 12 2Zm6 7.46-2.93 4.65c-.47.74-1.47.93-2.18.4l-2.33-1.74a.6.6 0 0 0-.72 0l-3.15 2.39c-.42.32-.97-.18-.69-.63l2.93-4.65c.47-.74 1.47-.92 2.18-.4l2.33 1.75a.6.6 0 0 0 .72 0l3.15-2.39c.42-.32.97.18.69.62Z'
);

export const IconSms = mkIcon(
  'M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm3 6h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Z'
);

export const IconEmail = mkIcon(
  'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 7.01L4.5 7h15L12 12.01ZM4 9.24V17h16V9.24l-7.4 4.93a1 1 0 0 1-1.2 0L4 9.24Z'
);

export const IconLink = mkIcon(
  'M10.59 13.41a1 1 0 0 0 1.42 0l4-4a3 3 0 0 0-4.24-4.24l-1.3 1.3a1 1 0 0 0 1.42 1.42l1.3-1.3a1 1 0 0 1 1.4 1.4l-4 4a1 1 0 0 0 0 1.42Zm2.82-2.82a1 1 0 0 0-1.42 0l-4 4a3 3 0 0 0 4.24 4.24l1.3-1.3a1 1 0 0 0-1.42-1.42l-1.3 1.3a1 1 0 0 1-1.4-1.4l4-4a1 1 0 0 0 0-1.42Z'
);

export const IconShare = mkIcon(
  'M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.35a3 3 0 0 0 0-1.7l6.7-3.35a3 3 0 1 0-.9-1.8L8 9.65a3 3 0 1 0 0 4.7l6.7 3.35A3 3 0 1 0 18 16Z'
);

export const IconHeart = mkIcon(
  'M12 21s-7.5-4.6-9.7-9.06C.86 8.7 2.3 5.5 5.3 5.06c1.9-.28 3.6.7 4.7 2.18C11.1 5.76 12.8 4.78 14.7 5.06c3 .44 4.44 3.64 3 6.88C19.5 16.4 12 21 12 21Z'
);

export const IconPerson = mkIcon(
  'M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z'
);

export const IconChevronDown = mkIcon(
  'M12 15.5 5.5 9 7 7.5l5 5 5-5L18.5 9 12 15.5Z'
);

export const IconChevronRight = mkIcon(
  'M8.5 5.5 15 12l-6.5 6.5-1.4-1.4L12.2 12 7.1 6.9l1.4-1.4Z'
);

export const IconCheck = mkIcon(
  'M9.5 17 4 11.5 5.5 10l4 4 9-9L20 6.5 9.5 17Z'
);

export const IconClose = mkIcon(
  'M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.4 1.4Z'
);

export const IconSearch = mkIcon(
  'M21 20l-5.2-5.2a7 7 0 1 0-1.4 1.4L20 21l1-1ZM5 10a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z'
);

export const IconMenu = mkIcon(
  'M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z'
);

export const IconArrow = mkIcon(
  'M13 5l-1.4 1.4 4.6 4.6H4v2h12.2l-4.6 4.6L13 19l7-7-7-7Z'
);

export const IconBell = mkIcon(
  'M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6-1.5-1.5V10a5.5 5.5 0 0 0-4-5.3V4a1.5 1.5 0 0 0-3 0v.7A5.5 5.5 0 0 0 6.5 10v4.5L5 16v1h14v-1Z'
);
