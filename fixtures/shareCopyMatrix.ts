/**
 * SHARE_COPY_MATRIX — static precomputed (persona × channel) share copy matrix.
 *
 * CB-47: Per-persona share copy keyed on (persona history/activity × target platform).
 * HARD CONSTRAINT: no request-path LLM. This is a batch-precomputed fixture.
 * In production, this would be emitted by `lib/llm/batch.ts`'s precompute pipeline
 * and stored as a static map. Here we define the canonical static fixture.
 *
 * Tone guidance per channel (mirrors CHANNEL_GUIDANCE in lib/llm/batch.ts):
 *   whatsapp  — warm, friend-tone, conversational, personal
 *   x         — punchy/public, max 240 chars, action verb, strong hook
 *   facebook  — community-focused, warm, share with friends/family
 *   email     — personal note, 2-4 sentences, heartfelt
 *   messenger — casual, direct, friendly check-in feel
 *   sms       — ultra-brief, max 160 chars
 *   copy_link — short descriptive phrase or tagline
 *
 * Persona characteristics that shape copy:
 *   anonymous       — no history; generic but encouraging
 *   close_friend    — repeat donor (Sarah K.), followed the fundraiser, personal emotional connection
 *   extrovert       — frequent sharer (Mike T.), broad network, social/viral framing
 *   shared_by_extro — arrived via a friend's share; discovery/newcomer framing
 *   returning_lapsed — donated once long ago (Priya M.), reconnect framing
 *   profile_owner   — owns the fundraiser; owner voice, direct ask
 */

import type { PersonaSlug } from '@/lib/personas/types';
import type { ShareChannel } from '@/lib/types';

export type ShareCopyMatrix = Record<PersonaSlug, Partial<Record<ShareChannel, string>>>;

export const SHARE_COPY_MATRIX: ShareCopyMatrix = {
  // ── anonymous ──────────────────────────────────────────────────────────────
  anonymous: {
    facebook:
      'This fundraiser is making a real difference — help spread the word by sharing on Facebook.',
    x:
      'Every share counts. Help this fundraiser reach more people. #GiveNow',
    whatsapp:
      "Hi! I came across this fundraiser and thought you might want to help — even sharing it makes a difference 🙏",
    messenger:
      'Hey, check out this fundraiser — it could use your support!',
    sms:
      'Check this fundraiser out — every share helps. Link:',
    email:
      'I wanted to share a fundraiser that could use some support.\n\nEvery donation and every share makes a real difference. Thank you for taking a moment to look.',
    copy_link:
      'Share this fundraiser — copy the link.',
  },

  // ── close_friend (Sarah K. — repeat donor, deep personal connection) ────────
  close_friend: {
    facebook:
      "I've been supporting this fundraiser since the beginning — and it's still going strong. If this cause resonates with you, please share it with your family and friends on Facebook.",
    x:
      "Been backing this cause for months. It's the real deal — every share brings it closer to the goal. Please RT 🙌",
    whatsapp:
      "Hey! You know how much this cause means to me — I've donated twice. Would it be okay if you shared this link with a couple of people you think might care? Even one share could change things 💛",
    messenger:
      "Hey, you know I've been following this fundraiser closely — it means a lot to me. Would you mind sharing it? It really helps.",
    sms:
      "Hey — this fundraiser matters a lot to me. Share it if you can! Link:",
    email:
      "I've been supporting this fundraiser for a while now, and it continues to touch my heart.\n\nI'm reaching out personally because I believe in this cause and I know you care too. If you could share the link with even one or two people in your life, it would mean the world.\n\nThank you — truly.",
    copy_link:
      'Copy this link — a cause I\'ve been backing.',
  },

  // ── extrovert (Mike T. — frequent sharer, broad network, social-viral) ──────
  extrovert: {
    facebook:
      "I share a lot of causes — this one is worth your feed. A real community rallying together. Tag someone who'd want to help! 💪",
    x:
      "This fundraiser is moving fast and needs more eyes on it. Drop a share, bring more people in. Let's go 🔥",
    whatsapp:
      "Yo! Sharing this to everyone I know — the momentum is real. Forward this to your group chats, even just two people helps the numbers climb fast 🚀",
    messenger:
      "Bro/sis, forwarding this because it's legit. Send it to anyone who cares — the more shares the better!",
    sms:
      "Pass this on — sharing to my whole network! Link:",
    email:
      "I've been sharing this fundraiser across all my channels — and the response has been incredible.\n\nThis is one of those rare causes where a single share can genuinely move the needle. Please forward this to anyone in your network who you think would connect with it.\n\nLet's keep the momentum going.",
    copy_link:
      'Grab the link — share it everywhere you can.',
  },

  // ── shared_by_extro (arrived via a friend's share, newcomer/discovery) ──────
  shared_by_extro: {
    facebook:
      "A friend shared this fundraiser with me and I had to pass it along — the cause is worth knowing about. Share it on Facebook if it moves you too.",
    x:
      "A friend sent me this fundraiser and now I'm passing it on. This cause deserves more reach.",
    whatsapp:
      "Hey! A friend shared this with me and I immediately wanted to pass it on. If this resonates with you, please send it along — every share adds up 🙏",
    messenger:
      "Got sent this from a friend and it really made me think — take a look and share it if you can!",
    sms:
      "A friend shared this with me — passing it on. Check it out: Link:",
    email:
      "I first heard about this fundraiser through a friend's share — and it stopped me in my tracks.\n\nI'm passing it along because I think more people should know about it. Please consider forwarding to anyone who might care.",
    copy_link:
      'Copy this link — discovered via a friend.',
  },

  // ── returning_lapsed (Priya M. — donated once 14 months ago, reconnecting) ──
  returning_lapsed: {
    facebook:
      "I supported this cause a while back — and I'm glad to see it's still going. It deserves more reach. Sharing on Facebook to get more eyes on it.",
    x:
      "Came back to check on this fundraiser after a long time away — it's still fighting. Worth sharing again.",
    whatsapp:
      "Hey! I donated to this cause a while back and just reconnected with it — still as important as ever. Would you mind passing the link to anyone who might want to help? 💙",
    messenger:
      "Hey, I've been away for a while but I'm back supporting this fundraiser. It's worth sharing — have a look!",
    sms:
      "Back supporting this cause after a while away. Please share: Link:",
    email:
      "I first got involved with this fundraiser over a year ago, and coming back to it has reminded me why it matters so much.\n\nIf you've been thinking about reconnecting with causes you care about, this one is still very much alive and needs support. Please share it with anyone who might be moved by it.",
    copy_link:
      'Copy the link — a cause worth revisiting.',
  },

  // ── profile_owner (Janahan S. — organizing the fundraiser) ──────────────────
  profile_owner: {
    facebook:
      "I'm organizing this fundraiser and it means everything to me — if you believe in this cause, please share it on Facebook. Every new person who sees it matters.",
    x:
      "I'm running this fundraiser and I need your help to spread the word. Please share — one RT can unlock a whole new audience. Thank you 🙏",
    whatsapp:
      "Hey! I've been organizing this fundraiser and it means so much to me personally. Would you be willing to send this link to a few people you know? Your network could make a huge difference 💛",
    messenger:
      "Hey — I'm the one organizing this fundraiser. Would really appreciate if you shared it. Thank you!",
    sms:
      "I'm organizing this fundraiser — please share the link: ",
    email:
      "I'm personally organizing this fundraiser, and I'm reaching out because I believe you might know people who care about this cause.\n\nSharing this link — even with just two or three people — could be the thing that helps us cross the finish line. I'd be deeply grateful for your help.\n\nThank you for taking the time to read this.",
    copy_link:
      'Copy and share — I\'m organizing this fundraiser.',
  },
};
