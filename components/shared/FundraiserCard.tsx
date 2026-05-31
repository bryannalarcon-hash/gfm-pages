/**
 * FundraiserCard — displays a SimilarCard in three density modes.
 *
 * - default:   vertical, xxl radius, 3:2 image
 * - medium:    vertical, xxxl radius, bordered, white bg
 * - condensed: horizontal row, xl radius, 1:1 88px image
 *
 * Image error → graceful token-colored placeholder block.
 * Server component: no 'use client' needed (no interactive state).
 * Note: Next.js Image requires 'use client' for onError; we use a client
 * wrapper pattern — the card itself is a server component but the image
 * sub-component handles errors client-side.
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { SimilarCard } from '@/lib/types';
import { ProgressBar } from './ProgressBar';

export interface FundraiserCardProps {
  card: SimilarCard;
  size?: 'default' | 'medium' | 'condensed';
}

function CardImage({ src, alt, condensed }: { src: string; alt: string; condensed: boolean }) {
  const [errored, setErrored] = useState(false);

  const baseClasses = condensed
    ? 'w-[var(--hrt-size-spacing-11)] h-[var(--hrt-size-spacing-11)] flex-none object-cover rounded-md'
    : 'w-full aspect-[3/2] object-cover';

  if (errored || !src) {
    return (
      <div
        className={[
          baseClasses,
          'bg-[var(--hrt-color-surface-neutral-subtle)]',
          'flex items-center justify-center',
        ].join(' ')}
        aria-hidden="true"
        style={condensed ? { minWidth: 'var(--hrt-size-spacing-11)' } : { aspectRatio: condensed ? '1/1' : '3/2' }}
      />
    );
  }

  return (
    <div
      className={condensed ? 'flex-none' : 'w-full overflow-hidden'}
      style={condensed ? undefined : {}}
    >
      <Image
        src={src}
        alt={alt}
        width={condensed ? 88 : 600}
        height={condensed ? 88 : 400}
        className={[baseClasses, condensed ? '' : 'w-full'].join(' ')}
        onError={() => setErrored(true)}
        style={condensed ? { objectFit: 'cover' } : { aspectRatio: '3/2', objectFit: 'cover' }}
      />
    </div>
  );
}

export function FundraiserCard({ card, size = 'default' }: FundraiserCardProps) {
  const condensed = size === 'condensed';

  const outerClasses = condensed
    ? [
        'flex flex-row items-stretch gap-[var(--hrt-size-spacing-2)] p-[var(--hrt-size-spacing-2)]',
        'rounded-xl border border-[var(--hrt-color-border-neutral-extra-subtle)] shadow-soft',
        'bg-[var(--hrt-color-surface-raised)]',
      ].join(' ')
    : size === 'medium'
    ? [
        'flex flex-col rounded-xxxl border border-[var(--hrt-color-border-neutral-extra-subtle)]',
        'bg-[var(--hrt-color-surface-raised)] p-[var(--hrt-size-spacing-2)] gap-[var(--hrt-size-spacing-2)]',
        'max-w-[560px]',
      ].join(' ')
    : [
        'flex flex-col rounded-xxl border border-[var(--hrt-color-border-neutral-extra-subtle)]',
        'bg-[var(--hrt-color-surface-raised)] overflow-hidden',
      ].join(' ');

  const bodyClasses = condensed
    ? 'flex flex-col gap-[var(--hrt-size-spacing-1)] flex-1 min-w-0'
    : size === 'medium'
    ? 'flex flex-col gap-[var(--hrt-size-spacing-1)]'
    : 'flex flex-col gap-[var(--hrt-size-spacing-1)] p-[var(--hrt-size-spacing-2)]';

  return (
    <article className={outerClasses} aria-label={card.title}>
      <CardImage src={card.imageUrl} alt={card.title} condensed={condensed} />

      <div className={bodyClasses}>
        <h3 className="text-body-md font-bold leading-[1.2] text-[var(--hrt-color-text-default)] line-clamp-2 m-0">
          {card.title}
        </h3>

        <ProgressBar
          raisedUsd={card.raisedUsd}
          goalUsd={card.goalUsd}
          showLabels={!condensed}
          className={condensed ? 'mt-auto' : undefined}
        />

        {condensed && (
          <p className="text-body-xs text-[var(--hrt-color-text-supporting)] m-0">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            }).format(card.raisedUsd)}{' '}
            raised
          </p>
        )}
      </div>
    </article>
  );
}
