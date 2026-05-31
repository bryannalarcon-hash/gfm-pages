'use client';
/**
 * SimilarCarousel — slot 'similar_carousel' (D3/D11 / C5).
 *
 * Horizontal scrolling carousel of FundraiserCard items.
 * source is translated to a human caption — the raw slug is NEVER shown.
 *
 * Empty cards (cold-start): renders a graceful trending placeholder — still in DOM.
 * L3.5 rule: NEVER unmounts; structure identical across personas.
 */

import React from 'react';
import { Instrumented } from '@/components/overlay/Instrumented';
import { FundraiserCard } from '@/components/shared/FundraiserCard';
import type { SlotComponentProps } from '@/lib/personalization/slots';

/** Translate the internal source enum to a human-facing caption. */
function sourceCaption(source: 'embedding' | 'trending' | 'followed_categories'): string {
  switch (source) {
    case 'embedding':
      return "Because you've given before";
    case 'followed_categories':
      return 'From causes you follow';
    case 'trending':
      return 'Trending now';
  }
}

export function SimilarCarousel({ data, overlay }: SlotComponentProps<'similar_carousel'>) {
  const { content } = data;
  const { cards, source } = content;
  const caption = sourceCaption(source);

  return (
    <Instrumented attrs={overlay} regionLabel="similar-carousel">
      <section
        data-slot="similar_carousel"
        data-section-name="Similar Fundraisers"
        aria-label={caption}
        className="flex flex-col gap-[var(--hrt-size-spacing-2)]"
      >
        {/* Human caption — never the raw source slug */}
        <p className="text-body-sm font-bold text-[var(--hrt-color-text-supporting)] m-0 px-[var(--hrt-size-spacing-0)]">
          {caption}
        </p>

        {cards.length === 0 ? (
          /* Graceful placeholder — preserves layout height when no cards are ready */
          <div
            className={[
              'flex items-center justify-center',
              'min-h-[var(--hrt-size-spacing-10)]',
              'rounded-xxl border border-[var(--hrt-color-border-neutral-extra-subtle)]',
              'bg-[var(--hrt-color-surface-neutral-subtle)]',
            ].join(' ')}
            aria-label="Fundraisers loading"
          >
            <span className="text-body-sm text-[var(--hrt-color-text-disabled)]">
              More fundraisers coming soon
            </span>
          </div>
        ) : (
          /* Scrollable carousel row */
          <div
            className={[
              'flex flex-row gap-[var(--hrt-size-spacing-2)]',
              'overflow-x-auto',
              /* Hide scrollbar visually but keep it accessible */
              '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              'snap-x snap-mandatory',
              '-mx-[var(--hrt-size-spacing-2)] px-[var(--hrt-size-spacing-2)]',
              'pb-[var(--hrt-size-spacing-1)]',
            ].join(' ')}
            role="list"
          >
            {cards.map((card) => (
              <div
                key={card.id}
                role="listitem"
                className="snap-start flex-none w-[min(80vw,280px)]"
              >
                <FundraiserCard card={card} size="medium" />
              </div>
            ))}
          </div>
        )}
      </section>
    </Instrumented>
  );
}
