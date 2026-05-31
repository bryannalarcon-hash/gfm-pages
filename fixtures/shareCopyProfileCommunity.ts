/**
 * PROFILE_SHARE_COPY and COMMUNITY_SHARE_COPY — per-(persona × channel) static copy.
 *
 * CB-98: Each persona gets their own share message on both the profile page
 * (sharing Janahan's profile / causes) and the community page (inviting to
 * Watch Duty). Copy is batch-precomputed (NO request-path LLM).
 *
 * Mirrors the SHARE_COPY_MATRIX structure/tone-per-channel from fixtures/shareCopyMatrix.ts.
 *
 * Tone guidance per channel (same as SHARE_COPY_MATRIX):
 *   whatsapp  — warm, friend-tone, conversational, personal
 *   x         — punchy/public, max 240 chars, action verb, strong hook
 *   facebook  — community-focused, warm
 *   email     — personal note, 2-4 sentences, heartfelt
 *   messenger — casual, direct, friendly check-in feel
 *   sms       — ultra-brief, max 160 chars
 *   copy_link — short descriptive phrase or tagline
 *
 * PROFILE surface: sharing someone's profile ("Check out Janahan's causes…")
 * COMMUNITY surface: inviting to Watch Duty ("Join Watch Duty…")
 */

import type { PersonaSlug } from '@/lib/personas/types';
import type { ShareChannel } from '@/lib/types';

export type ShareCopyMatrix = Record<PersonaSlug, Partial<Record<ShareChannel, string>>>;

// ── PROFILE_SHARE_COPY ──────────────────────────────────────────────────────
// Copy framing: the viewer is sharing Janahan's organizer profile to others.
// Persona shapes the voice: how they know Janahan and why they care.

export const PROFILE_SHARE_COPY: ShareCopyMatrix = {
  // anonymous — no personal history; discovery/encouragement framing
  anonymous: {
    whatsapp:
      "Hey! I found this organizer on GoFundMe — Janahan has been running fundraisers for some really important causes. Thought you might want to follow along 👇",
    x:
      "Meet Janahan — an organizer quietly running fundraisers for causes that matter. Worth following. 👉",
    facebook:
      "I came across this GoFundMe organizer profile and wanted to share it — Janahan has been working on fundraisers that could use more visibility.",
    email:
      "I wanted to share a GoFundMe organizer profile with you.\n\nJanahan has been organizing fundraisers for causes worth knowing about. Worth a look — and if something resonates, a follow or a share goes a long way.",
    messenger:
      "Hey, check out this organizer — Janahan runs some great fundraisers on GoFundMe!",
    sms:
      "Check out this organizer on GoFundMe — some really good causes: Link:",
    copy_link:
      "Share this organizer profile — causes worth following.",
  },

  // close_friend (Sarah K.) — repeat donor, deep personal connection, warmth
  close_friend: {
    whatsapp:
      "Hey! You know how much I've been following Janahan's work — the fundraisers they organize genuinely make a difference. I'd love it if you followed their profile and shared it with anyone who might care 💛",
    x:
      "I've been backing Janahan's causes for months — they organize fundraisers that actually move the needle. Take a look and follow! 🙌",
    facebook:
      "I've been personally supporting Janahan's fundraisers for a while — and every cause they take on is worth knowing about. Sharing their profile because more people should see this work.",
    email:
      "I've been following Janahan's fundraisers closely, and I can't say enough about the impact this work has had.\n\nI'm sharing their profile because I believe you'd connect with what they stand for. Even just following along — or passing this link to one other person — would mean a lot to me.\n\nThank you for taking a moment to look.",
    messenger:
      "Hey! I've been following Janahan's fundraisers for a while — they're doing real good. Would you check out their profile and maybe share it? 💛",
    sms:
      "This organizer's work means a lot to me — please check out Janahan's profile: Link:",
    copy_link:
      "Copy this — an organizer I've been backing for months.",
  },

  // extrovert (Mike T.) — frequent sharer, viral/social framing, broad reach
  extrovert: {
    whatsapp:
      "Yo! Sharing Janahan's GoFundMe organizer profile to everyone — the causes they run are legit. Forward this to your group chats and let's get them more visibility 🚀",
    x:
      "Janahan organizes fundraisers worth amplifying. I'm sharing — you should too. More eyes = more impact 🔥",
    facebook:
      "I share a lot of causes — and Janahan's organizer profile is one worth getting in your feed. Strong work, real impact. Tag someone who should know about this! 💪",
    email:
      "I've been sharing Janahan's profile across all my networks — and the response has been great.\n\nThis is an organizer worth amplifying. If you know anyone in your circle who'd connect with their causes, please forward this along. One share can reach a whole new audience.",
    messenger:
      "Bro/sis — sharing Janahan's organizer profile because it's the real deal. Send it on to anyone who'd care, the more reach the better!",
    sms:
      "Sharing Janahan's organizer profile — great causes, needs more reach. Pass it on: Link:",
    copy_link:
      "Grab the link — Janahan's organizer profile deserves a wider audience.",
  },

  // shared_by_extro — arrived via a friend's share, newcomer/discovery framing
  shared_by_extro: {
    whatsapp:
      "Hey! A friend shared this organizer profile with me and I had to pass it along — Janahan is doing some really meaningful work on GoFundMe. Worth following 🙏",
    x:
      "A friend sent me this organizer's profile and now I'm passing it on — Janahan's causes are worth knowing about.",
    facebook:
      "Someone shared this GoFundMe organizer profile with me — and after looking at Janahan's work, I had to share it myself. The causes are worth your attention.",
    email:
      "I first heard about Janahan's profile through a friend's share — and it made me stop and look.\n\nI'm passing it along because I think more people should know about this work. Please consider sharing it with anyone who might connect with these causes.",
    messenger:
      "Got sent this organizer's profile from a friend — it's worth a look! Check out Janahan's GoFundMe.",
    sms:
      "A friend shared this organizer profile with me — passing it on: Link:",
    copy_link:
      "Copy this link — found via a friend, worth sharing.",
  },

  // returning_lapsed (Priya M.) — donated once 14 months ago, reconnecting
  returning_lapsed: {
    whatsapp:
      "Hey! I followed Janahan's profile a while back and I'm glad I checked in again — the work continues and it's just as important. Would you follow along or share this with someone who might care? 💙",
    x:
      "Came back to Janahan's organizer profile after a long time — the causes are still going strong. Worth sharing again.",
    facebook:
      "I followed Janahan's fundraisers a while back, and revisiting their profile reminded me why it mattered. Still worth knowing about — sharing it so more people can find this work.",
    email:
      "I followed Janahan's work over a year ago and just reconnected with their profile — and I'm glad I did.\n\nIf you've been thinking about engaging with causes you care about, Janahan is an organizer worth following. Please share this with anyone who might be moved by it.",
    messenger:
      "Hey — I've been away for a while but I'm back following Janahan's work. Still really meaningful! Check out their profile.",
    sms:
      "Back following this organizer after a while away — still great work: Link:",
    copy_link:
      "Copy the link — an organizer worth revisiting.",
  },

  // profile_owner (Janahan S.) — first-person owner voice
  // Note: ShareSpread keeps its OWNER_WHATSAPP / OWNER_EMAIL constants for the
  // whatsapp/email channels. These entries cover additional channels.
  profile_owner: {
    whatsapp:
      "I've been organizing fundraisers for causes close to me — would mean a lot if you followed along and shared. 🙏",
    x:
      "I organize fundraisers for causes I believe in. Follow my profile and help me spread the word — one share reaches people I can't reach alone.",
    facebook:
      "I'm organizing fundraisers for causes that matter to me — if you'd like to follow along and help spread the word, sharing my profile on Facebook would mean everything.",
    email:
      "I wanted to share my GoFundMe profile with you — it's where I keep all the causes I'm organizing for. Would love your support…",
    messenger:
      "Hey — I organize fundraisers on GoFundMe for causes I really believe in. Would love it if you followed my profile and shared it!",
    sms:
      "I'm organizing fundraisers for causes I care about — follow my profile: Link:",
    copy_link:
      "Copy and share — I'm the organizer behind these causes.",
  },
};

// ── COMMUNITY_SHARE_COPY ────────────────────────────────────────────────────
// Copy framing: the viewer is inviting others to join Watch Duty community.
// Persona shapes the relationship to this community and urgency of the invite.

export const COMMUNITY_SHARE_COPY: ShareCopyMatrix = {
  // anonymous — discovery framing, no personal history with the community
  anonymous: {
    whatsapp:
      "Hey! I found this community on GoFundMe — Watch Duty brings people together to support wildfire safety fundraisers. Thought you might want to follow along 👇",
    x:
      "Watch Duty is a community rallying around wildfire safety. Worth following — real impact, real people. 👉",
    facebook:
      "I came across the Watch Duty community on GoFundMe and wanted to share it — they're organizing around wildfire safety and it's worth knowing about.",
    email:
      "I wanted to share the Watch Duty community with you.\n\nThey're bringing together fundraisers focused on wildfire safety and response — a community worth joining and following.",
    messenger:
      "Hey, check out this community — Watch Duty on GoFundMe. Wildfire safety, real fundraisers.",
    sms:
      "Check out Watch Duty community on GoFundMe — wildfire safety causes: Link:",
    copy_link:
      "Share Watch Duty — a community worth joining.",
  },

  // close_friend (Sarah K.) — personal connection, warm invitation
  close_friend: {
    whatsapp:
      "Hey! You know how much I care about wildfire safety — I've been following Watch Duty and the community has been doing incredible work. Would you join and share with anyone who might want to be part of this? 💛",
    x:
      "Watch Duty isn't just a community — it's people showing up for wildfire safety when it counts. I've been following for a while and it matters. Come join us 🙌",
    facebook:
      "I've been part of the Watch Duty community for a while and it means a lot to me. The fundraisers they're rallying around are making a real difference. Sharing this because more people should be part of it.",
    email:
      "I've been following the Watch Duty community closely, and I keep being moved by what the members are doing together.\n\nI'm reaching out personally because I think you'd connect with this community too. Even just joining and following along — or sharing the link with one person you know — would help grow something really meaningful.\n\nThank you.",
    messenger:
      "Hey! I've been following Watch Duty for a while — the community is doing real good for wildfire safety. Would you join and share it? 💛",
    sms:
      "Watch Duty community means a lot to me — please join and share: Link:",
    copy_link:
      "Copy this — Watch Duty, a community I've been following.",
  },

  // extrovert (Mike T.) — viral/social framing, high-energy invite
  extrovert: {
    whatsapp:
      "Yo! Sharing Watch Duty to everyone — this community is growing fast and making real impact on wildfire safety. Drop this in your group chats and let's get more people in 🚀",
    x:
      "Watch Duty community is moving. Wildfire safety, thousands of followers, real fundraisers. Get on this — share it now 🔥",
    facebook:
      "I share a lot of communities — Watch Duty is worth your feed. Real wildfire safety impact, strong community momentum. Tag someone who should be here! 💪",
    email:
      "I've been sharing the Watch Duty community across all my channels — and the growth has been real.\n\nThis is a community where a single invite can bring in someone who ends up making a big difference. Please forward this to anyone in your network who cares about wildfire safety and community response.",
    messenger:
      "Bro/sis — sharing Watch Duty because this community is legit. Get in, and send it to anyone who'd want to be part of this!",
    sms:
      "Sharing Watch Duty community — fast growing, real impact. Pass it on: Link:",
    copy_link:
      "Grab the link — share Watch Duty everywhere.",
  },

  // shared_by_extro — arrived via a friend's share, discovery framing
  shared_by_extro: {
    whatsapp:
      "Hey! A friend shared this community with me and I had to pass it along — Watch Duty is doing real work around wildfire safety on GoFundMe. Worth joining 🙏",
    x:
      "A friend sent me the Watch Duty community and now I'm sharing it — wildfire safety causes, real momentum.",
    facebook:
      "Someone shared Watch Duty with me and after seeing what the community is doing, I had to share it myself. Wildfire safety fundraisers that actually make a difference.",
    email:
      "I first heard about Watch Duty through a friend's share — and it stopped me in my tracks.\n\nI'm passing it along because this community is doing meaningful work around wildfire safety and deserves more people joining. Please share with anyone who might care.",
    messenger:
      "Got sent Watch Duty by a friend and it's really impressive — check out this wildfire safety community!",
    sms:
      "A friend shared Watch Duty with me — passing it on: Link:",
    copy_link:
      "Copy this link — Watch Duty, discovered via a friend.",
  },

  // returning_lapsed (Priya M.) — reconnecting after time away
  returning_lapsed: {
    whatsapp:
      "Hey! I followed Watch Duty a while back and just reconnected — the community is still going strong on wildfire safety. Would you join or share with someone who'd want to be part of this? 💙",
    x:
      "Came back to Watch Duty community after a while away — still fighting for wildfire safety, still worth joining. Share if you can.",
    facebook:
      "I followed Watch Duty a while back and I'm glad I reconnected — the community is still doing meaningful work. Sharing it so more people can find it.",
    email:
      "I first found Watch Duty over a year ago and just reconnected — and it reminded me why this community matters.\n\nIf you've been looking for a way to support wildfire safety causes, this community is still very much alive. Please share the link with anyone who might want to be part of it.",
    messenger:
      "Hey — I've been away for a while but I'm back following Watch Duty. Great wildfire safety community, worth sharing!",
    sms:
      "Back following Watch Duty after a while — great community: Link:",
    copy_link:
      "Copy the link — Watch Duty, a community worth revisiting.",
  },

  // profile_owner (Janahan S.) — owner/organizer voice for community
  profile_owner: {
    whatsapp:
      "Hey! I've been deeply involved in the Watch Duty community — organizing fundraisers for wildfire safety. Would mean a lot if you joined and helped spread the word 🙏",
    x:
      "I'm part of Watch Duty — a community built around wildfire safety. Join us and help grow something that matters.",
    facebook:
      "I'm involved in the Watch Duty community and it means everything to me. If you believe in what we're building around wildfire safety, please share this — every new member strengthens what we can do together.",
    email:
      "I've been part of the Watch Duty community and wanted to share it with you personally.\n\nThis is a community organizing around wildfire safety — and sharing it with even a few people you know could help us reach someone who becomes a key part of what we're building together.",
    messenger:
      "Hey — I'm part of Watch Duty, a community organizing around wildfire safety. Join us! Would really appreciate the share.",
    sms:
      "I'm part of Watch Duty community — please join and share: Link:",
    copy_link:
      "Copy and share — Watch Duty, a community I'm part of.",
  },
};
