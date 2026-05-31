// BATCH-ONLY — content-create / build time.
// NEVER import this file from app/ or components/.
// Pages read the cached share_copy / update_summary rows via lib/db/client.
// architecture.md §4.6 + strategy-tech-stack.md (Claude Anthropic API).

import type { ShareChannel } from '@/lib/types';
import { query } from '@/lib/db/client';

export type { ShareChannel };

export interface ShareCopyVariant {
  channel: ShareChannel;
  copy: string;
}

// Channels written at create-time per D9 / C6 / P8.
const SHARE_CHANNELS: ShareChannel[] = [
  'facebook',
  'x',
  'whatsapp',
  'messenger',
  'sms',
  'email',
  'copy_link',
];

const MODEL = 'claude-haiku-4-5'; // cheap copy-generation model

// ---------------------------------------------------------------------------
// Fixtures fallback
// ---------------------------------------------------------------------------

function isFixturesMode(): boolean {
  return (
    process.env.LLM_FIXTURES === 'true' ||
    process.env.NODE_ENV === 'test' ||
    !process.env.ANTHROPIC_API_KEY
  );
}

/** Deterministic per-channel copy when no API key or in fixtures/test mode. */
function fixtureShareCopy(
  context: string,
  entityType: 'fundraiser' | 'community' | 'profile',
): ShareCopyVariant[] {
  const label =
    entityType === 'fundraiser'
      ? 'fundraiser'
      : entityType === 'community'
        ? 'community'
        : 'profile';

  return [
    {
      channel: 'facebook',
      copy: `Support this ${label}: ${context}. Every donation counts — share with your friends.`,
    },
    {
      channel: 'x',
      copy: `${context} — help make a difference. ${label === 'fundraiser' ? 'Donate now' : 'Join us'} 🙌`,
    },
    {
      channel: 'whatsapp',
      copy: `Hey! I wanted to share something close to my heart — "${context}". Would mean so much if you could help or spread the word 💛`,
    },
    {
      channel: 'messenger',
      copy: `Thought you might care about this ${label}: "${context}". Check it out when you get a chance!`,
    },
    {
      channel: 'sms',
      copy: `Check this out: ${context}. Link:`,
    },
    {
      channel: 'email',
      copy: `I wanted to reach out about something important to me.\n\n"${context}"\n\nYour support — even just sharing the link — makes a real difference. Thank you for taking a moment to read this.`,
    },
    {
      channel: 'copy_link',
      copy: `${context}`,
    },
  ];
}

/** Deterministic fallback summary: first sentence (max 120 chars). */
function fixtureSummary(updateId: string, updateBody: string): string {
  const firstSentence = updateBody.split(/[.!?]/)[0]?.trim() ?? updateBody;
  return firstSentence.length > 120
    ? firstSentence.slice(0, 117) + '...'
    : firstSentence + '.';
}

// ---------------------------------------------------------------------------
// Channel-specific prompt guidance
// ---------------------------------------------------------------------------

const CHANNEL_GUIDANCE: Record<ShareChannel, string> = {
  facebook:
    'Warm, community-focused. 1-2 sentences. Encourage sharing with friends/family.',
  x: 'Short and punchy, max 240 chars. No hashtag spam. Strong hook, action verb.',
  whatsapp:
    'Conversational and warm, as if from a friend. 1-3 sentences. Personal tone.',
  messenger:
    'Casual, direct. 1-2 sentences. Friendly check-in feel.',
  sms: 'Ultra-brief — max 160 chars. Just the key point and context.',
  email:
    'More expansive — 2-4 sentences. Personal, heartfelt. Can include a brief story detail.',
  copy_link:
    'A short descriptive phrase or tagline (max 80 chars) for the copied URL.',
  native_share: 'Short descriptive summary for the native share sheet.',
  embed: 'Brief descriptive caption for an embed widget.',
};

// ---------------------------------------------------------------------------
// Claude API helper (lazy import so missing SDK never breaks fixtures path)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAnthropicClient(): Promise<any> {
  // Dynamic import so a missing ANTHROPIC_API_KEY never causes a module-load crash.
  const { default: AnthropicSDK } = await import('@anthropic-ai/sdk');
  return new AnthropicSDK({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ---------------------------------------------------------------------------
// Exported batch functions
// ---------------------------------------------------------------------------

/**
 * Generate per-channel share copy for a fundraiser, community, or profile.
 * Writes are handled by persistShareCopy(); this function just returns variants.
 *
 * Safe with no API key — returns deterministic fixture copy.
 */
export async function precomputeShareCopy(input: {
  entityType: 'fundraiser' | 'community' | 'profile';
  entityId: string;
  context: string;
}): Promise<ShareCopyVariant[]> {
  const { entityType, context } = input;

  if (isFixturesMode()) {
    return fixtureShareCopy(context, entityType);
  }

  try {
    const client = await getAnthropicClient();

    const systemPrompt = `You are a copywriting assistant generating share copy for a ${entityType} on a crowdfunding platform. Respond ONLY with a JSON array — no markdown, no explanation.`;

    const channelInstructions = SHARE_CHANNELS.map(
      (ch) => `  - "${ch}": ${CHANNEL_GUIDANCE[ch]}`,
    ).join('\n');

    const userPrompt = `Context about this ${entityType}: "${context}"

Generate share copy for exactly these channels in this exact JSON shape:
[
  { "channel": "facebook", "copy": "..." },
  { "channel": "x",        "copy": "..." },
  { "channel": "whatsapp", "copy": "..." },
  { "channel": "messenger","copy": "..." },
  { "channel": "sms",      "copy": "..." },
  { "channel": "email",    "copy": "..." },
  { "channel": "copy_link","copy": "..." }
]

Per-channel guidance:
${channelInstructions}

Output ONLY the JSON array — no other text.`;

    // Use the beta prompt-caching API so the stable system prompt is cached
    // across the 7 per-entity calls (architecture §4.6 best practice).
    const response = await client.beta.promptCaching.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    const parsed = JSON.parse(rawText) as { channel: ShareChannel; copy: string }[];

    // Validate we got all expected channels; fall back to fixture for any missing.
    const byChannel = new Map(parsed.map((v) => [v.channel, v.copy]));
    const fixtures = fixtureShareCopy(context, entityType);

    return SHARE_CHANNELS.map((ch) => ({
      channel: ch,
      copy: byChannel.get(ch) ?? fixtures.find((f) => f.channel === ch)?.copy ?? context,
    }));
  } catch {
    // Never propagate — return deterministic fixtures on any error.
    return fixtureShareCopy(context, entityType);
  }
}

/**
 * Generate a 1-line summary of a fundraiser update post.
 * Safe with no API key — returns first sentence of the update body.
 */
export async function precomputeUpdateSummary(input: {
  updateId: string;
  updateBody: string;
}): Promise<{ updateId: string; summary: string }> {
  const { updateId, updateBody } = input;

  if (isFixturesMode()) {
    return { updateId, summary: fixtureSummary(updateId, updateBody) };
  }

  try {
    const client = await getAnthropicClient();

    const systemPrompt =
      'You summarize fundraiser update posts into a single plain-text sentence (max 120 chars). No markdown, no quotes. Output only the sentence.';

    // Prompt-cache the stable system prompt across all update summaries.
    const response = await client.beta.promptCaching.messages.create({
      model: MODEL,
      max_tokens: 64,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Summarize this fundraiser update in one sentence:\n\n${updateBody}`,
        },
      ],
    });

    const summary =
      response.content[0]?.type === 'text'
        ? response.content[0].text.trim()
        : fixtureSummary(updateId, updateBody);

    return { updateId, summary: summary.slice(0, 120) };
  } catch {
    return { updateId, summary: fixtureSummary(updateId, updateBody) };
  }
}

// ---------------------------------------------------------------------------
// Persistence helpers (DB only; called by seed / worker scripts)
// ---------------------------------------------------------------------------

/**
 * UPSERT per-channel share copy variants into the share_copy table.
 * Called from seed/worker — pages read these rows directly via lib/db/client.
 */
export async function persistShareCopy(
  entityType: 'fundraiser' | 'community' | 'profile',
  entityId: string,
  variants: ShareCopyVariant[],
): Promise<void> {
  for (const { channel, copy } of variants) {
    await query(
      `INSERT INTO share_copy (entity_type, entity_id, channel, copy)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (entity_type, entity_id, channel)
       DO UPDATE SET copy = EXCLUDED.copy`,
      [entityType, entityId, channel, copy],
    );
  }
}

/**
 * UPSERT a 1-line update summary into the update_summary table.
 * Called from seed/worker — pages read these rows directly via lib/db/client.
 */
export async function persistUpdateSummary(
  updateId: string,
  summary: string,
): Promise<void> {
  await query(
    `INSERT INTO update_summary (update_id, summary)
     VALUES ($1, $2)
     ON CONFLICT (update_id)
     DO UPDATE SET summary = EXCLUDED.summary`,
    [updateId, summary],
  );
}
