# GoFundMe Profile Page — Feature Inventory

**Crawled URL:** https://www.gofundme.com/u/janahan
**Date:** 2026-05-27
**Method:** `curl -s -L` with Chrome/124 UA; Next.js SSR page (1.6 MB HTML). `__NEXT_DATA__` JSON (1.57 MB) contained Apollo cache + Optimizely datafile. No GTM/GA4/FB pixel loaded server-side; vendor references appear in inline bundle strings and feature-flag configs only.

---

## Navigation & Global

| Element | Type | Destination / Action |
|---------|------|----------------------|
| GoFundMe logo | Link | `/` (home) |
| Search bar | Link (navigates) | `/s` (search page) |
| Donate (nav) | Button | Opens donate flow |
| Fundraise (nav) | Button | Opens fundraise flow |
| About (nav) | Button | Expands about dropdown |
| Menu (hamburger) | Button `aria-label=menu` | Opens mobile nav |
| Categories > Browse | Link | `/discover` |
| Crisis relief | Link | `/c/act` |
| Social Impact Funds | Link | `/c/cause` |
| Supporter Space | Link | `/c/supporter-space` |
| Nonprofits | Link | `/s?nonprofits=1` |
| How to start a GoFundMe | Link | `/c/start` |
| Fundraising categories | Link | `/c/start/fundraising-categories` |
| Team fundraising | Link | `/c/fundraising-tips/team` |
| Fundraising Blog | Link | `/c/blog` |
| Fundraising tips | Link | `/c/fundraising-tips` |
| Fundraising ideas | Link | `/c/fundraising-ideas` |
| Charity fundraising | Link | `/c/start/charity-fundraising` |
| Sign up as a nonprofit | Link | `/c/charity-fundraising` |
| GoFundMe Pro for nonprofits | Link | `https://pro.gofundme.com` (external) |
| Sign in | Link | `/sign-in` |
| Start a GoFundMe | Link (CTA) | `/create/fundraiser` |
| How GoFundMe works | Link | `/c/how-it-works` |
| GoFundMe Giving Guarantee | Link | `/c/safety/gofundme-guarantee` |
| Supported countries | Link | `https://support.gofundme.com/...` |
| Pricing | Link | `/c/pricing` |
| Help Center | Link | `https://support.gofundme.com/hc/en-us` |
| About GoFundMe | Link | `/c/about-us` |
| Newsroom | Link | `/c/press` |
| Careers | Link | `/c/careers` |
| GoFundMe.org | Link | `https://www.gofundme.org` (external) |
| GoFundMe Partnerships | Link | `/c/partnerships` |
| Terms | Footer link | `/c/terms` |
| Privacy Notice | Footer link | `/c/privacy` |
| Legal | Footer link | `/c/legal` |
| Accessibility Statement | Footer link | `/c/accessibility-statement` |
| Cookie Policy | Footer link | `/c/gofundme-cookie-policy` |
| Your Privacy Choices | Footer link | `/c/opt-out-rights` |
| Manage Cookie Preferences | Button | Opens cookie consent modal |
| Facebook (GFM brand) | Footer icon link | `https://www.facebook.com/gofundme` |
| YouTube (GFM brand) | Footer icon link | `https://www.youtube.com/user/gofundme` |
| Twitter/X (GFM brand) | Footer icon link | `https://twitter.com/gofundme` |
| Instagram (GFM brand) | Footer icon link | `https://www.instagram.com/gofundme/` |
| More resources | Button | Expands footer resource links |
| Skip to content | Anchor | `#skipnav` (a11y) |

---

## Identity & Follow

Profile data sourced from `__NEXT_DATA__.initialProfile` and `User:904281` Apollo node.

**Profile: Janahan Vivekanandan** (`slug: janahan`, `id: d2a8164f-e034-4fad-94ff-70d6ea3d6f4c`)

| Attribute | Value / State |
|-----------|--------------|
| Name | Janahan Vivekanandan (displayed as "Janahan Gofundme Vivekanandan" in User node) |
| Bio | None set (null) |
| Owner type | PERSON |
| Mode | PUBLIC |
| Status | ACTIVE |
| Profile photo | Avatar image (JPEG, 370x298 CDN-served) |
| Background image | DEFAULT gradient (no custom background URL) |
| Joined date | 2015-08-09 (GFM_JOINED_DATE setting, visibility: PUBLIC) |
| Location | Not set (LOCATION setting null) |
| Work | Not set |
| Education | Not set |
| NPO affiliation | Not set |
| Religious affiliation | Not set |
| Social links | None set (socials: []) |
| Causes | ANIMALS, ENVIRONMENT, ARTS_AND_CULTURE |
| Follower count | 109 |
| Following count | 11 |
| Giving Fund | None (givingFunds: []) |
| Verified badge | Not present (no explicit verified flag; badge_none/checkmark_none in feature flag config) |
| Gift Card attribute | GIFT_CARD about-setting slot present (value null) |
| Onboarding completed | true |

| Feature | Type | Action / Destination | Region |
|---------|------|----------------------|--------|
| Profile avatar | Image | Displays user photo | Profile hero |
| Profile name | Display | Non-interactive | Profile hero |
| 109 Followers count | Link | `/u/janahan/followers` | Profile hero |
| 11 Following count | Link | `/u/janahan/following` | Profile hero |
| Follow button | Button | Follow/unfollow this user (authenticated) | Profile hero |
| Share profile | Button `aria-label=Share profile` | Opens share sheet | Profile hero |
| Profile options menu | Button `aria-label=Profile options` | Opens dropdown (Report account, Block, Copy link, Message) | Profile hero |
| Report account | Option (in Profile options) | Report user flow | Options dropdown |
| Block user | Option | Block/unblock profile | Options dropdown |
| Copy link | Option | Copies profile URL to clipboard | Options dropdown |
| Message | Option | Opens DM/messaging thread | Options dropdown |
| Unfollow confirmation | Modal (viewer-specific) | "Unfollow {{name}}?" confirm dialog | On Follow toggle |
| Block confirmation | Modal | "Block {{name}}?" confirm dialog | Options dropdown |
| Learn more about people inspired | Button | Expands "people inspired" info tooltip | Hero / follow section |
| Notification settings | Feature (flag: `shared_notifications_bell`) | Subscribe to user activity notifications | Profile (SSR-gated) |
| Edit profile | Feature (viewer-only, `isEditable: false` for this viewer) | Edit name, bio, photo, causes, social links, URL | Owner-only |
| Follow sticky header | UI region (`data-testid=follow-sticky-header`) | Follows into view on scroll | Page scroll |
| Desktop hero backdrop | UI region (`data-testid=desktop-hero-backdrop`) | Background gradient display | Profile hero |
| Profile gradient | UI region (`data-testid=desktop-hero-profile-gradient`) | Decorative | Profile hero |
| About section | Tab (button) | Switches to About tab (location, joined date, work, education, causes) | Tab bar |
| Activity tab | Tab (button, active by default) | Shows activity feed | Tab bar |
| Suggested people to follow | Panel (20 suggestions served) | `/u/{slug}` for each suggestion | Follow suggestions widget |

---

## Fundraiser / Activity Aggregation

### Featured / Active Entries (carousel — `data-testid=carousel-content`)

Three fundraiser cards rendered in a content carousel. Each card is a smartlink-attributed link.

| Fundraiser | Goal (USD) | Raised (USD) | Progress | Link |
|-----------|-----------|-------------|----------|------|
| Keep Sandy on Ossabaw | 200,000 | 66,785 | 33% | `/f/sandywest?attribution_id=sl:ecb48585...` |
| Saving Eliza | 4,000,000 | 2,078,890 | 52% | `/f/ElizaONeill?attribution_id=sl:82f3141a...` |
| Andy Ritchie's Big Headache | 100,000 | 102,442 | 102% | `/f/AndyRitchie?attribution_id=sl:862dc18b...` |

Carousel controls: Previous slide button (`aria-label=Previous slide`), Next slide button (`aria-label=Next slide`), Pagination dots (`aria-label=Pagination`, 3 slides).

### Profile-Created Fundraiser (visible in activity feed / Apollo state)

| Fundraiser | Goal (USD) | Raised (USD) | Donations | Charity beneficiary | Link |
|-----------|-----------|-------------|-----------|--------------------|----|
| Real-Time Alerts for Wildfire Safety | 3,000 | 2,102 | 21 | Watch Duty (id: 653181) | `/f/realtime-alerts-for-wildfire-safety-r5jkk?attribution_id=73779e40...` |

Charity card: `/charity/watch-duty` — "Benefiting Watch Duty" link rendered on fundraiser card.

### Activity Feed (`data-testid=activity-feed`, `data-testid=activity-feed-list`)

Two activity entries present (Apollo Feed node: `ACTOR_PUBLIC:29b7f3eb-8b64-42a1-a40e-34226832cc31`):

| Activity | Verb | Object | Date |
|----------|------|--------|------|
| Activity 1 | PUBLISHED | Fundraiser: Real-Time Alerts for Wildfire Safety | 2026-02-14 |
| Activity 2 | DONATED | $2 donation to Real-Time Alerts for Wildfire Safety | 2026-02-14 |

Per-activity interactions:

| Feature | Type | Action / Destination | Region |
|---------|------|----------------------|--------|
| Like (HEART reaction) | Button `aria-label=Like this activity` | Toggle heart reaction | Activity card |
| View likes count | Button `aria-label=View likes` (count: 2) | Opens liker list | Activity card |
| Comment | Button `aria-label=Comment on this activity` | Opens comment composer | Activity card |
| Share activity | Button `aria-label=Share` | Opens share sheet for this activity | Activity card |
| Like actions menu | `aria-label=Like actions` | Secondary like options | Activity card |
| Share actions menu | `aria-label=Share actions` | Share sheet options | Activity card |
| Comments actions menu | `aria-label=Comments actions` | Comment moderation options | Activity card |
| Report activity | Button | Report content flow | Activity options |
| Options menu | Button `aria-label=Options` | Activity-level options (hide, report, delete) | Activity card |
| Hide activity | Option | Hides activity from feed | Options dropdown |
| Delete activity | Option (owner-only) | Removes activity | Options dropdown |
| Report comment | Option | Report a comment | Comment section |
| Delete comment | Option (owner-only) | Removes comment | Comment section |

### Data Model (from `__NEXT_DATA__`)

- Profile `1:1` User (`User:904281` references `Profile:d2a8164f...`)
- Profile has `activeEntries[]` — ordered list of FUNDRAISER content items (smartlink-attributed)
- Profile has `pinnedEntries[]` — pin-to-top slot (empty for this profile)
- Profile has `causes[]` — up to 3 cause categories (ANIMALS, ENVIRONMENT, ARTS_AND_CULTURE)
- Feed `ACTOR_PUBLIC:{feedId}` holds `ActivityConnection` of PUBLISHED and DONATED verbs
- Activity references: Actor (User) → verb → Object (Donation/Fundraiser) → Target (Fundraiser)
- `followSuggestions` returns 20 suggested profiles with `hasNextPage: true` (paginated)
- Charity objects embed `charityAggregates.totalFundraisers` count
- `isGivingCardsReceivingEnabled: true` — gift card receipt feature enabled for platform
- `canSeeGivingCardsBanner: false` — banner gated off for this viewer
- `publicGivingFund: null` — no giving fund on this profile

---

## Full Interaction Table

| Feature | Type | Action / Destination | Region |
|---------|------|----------------------|--------|
| Skip to content | Anchor | Jump to `#skipnav` | A11y |
| GoFundMe logo | Link | `/` | Global nav |
| Search | Link/Button | `/s` | Global nav |
| Donate (nav) | Button | Opens donate flow | Global nav |
| Fundraise (nav) | Button | Opens fundraise flow | Global nav |
| About (nav) | Button | Expands dropdown | Global nav |
| Menu (hamburger) | Button | Opens mobile nav | Global nav |
| Sign in | Link | `/sign-in` | Global nav |
| Start a GoFundMe | Link CTA | `/create/fundraiser` | Global nav |
| Profile avatar | Image | Non-interactive display | Hero |
| Profile name | Text | Non-interactive | Hero |
| Followers count | Link | `/u/janahan/followers` | Hero |
| Following count | Link | `/u/janahan/following` | Hero |
| Follow button | Button | Authenticated follow/unfollow | Hero |
| Share profile | Button | Opens share sheet | Hero |
| Profile options | Button | Dropdown menu | Hero |
| Report account | Menu item | Report flow | Options menu |
| Block user | Menu item | Block/unblock confirmation modal | Options menu |
| Unfollow | Menu item | Unfollow confirmation modal | Options menu |
| Copy link | Menu item | Clipboard copy | Options menu |
| Message | Menu item | DM/messaging thread | Options menu |
| Learn more (inspired) | Button | Info tooltip | Hero |
| Follow sticky header | Scroll UI | Follows viewport on scroll | Page |
| Activity tab | Tab button | Show activity feed | Tab bar |
| About tab | Tab button | Show about section (bio, dates, causes) | Tab bar |
| Carousel prev slide | Button | Navigate carousel back | Carousel |
| Carousel next slide | Button | Navigate carousel forward | Carousel |
| Carousel pagination | Dots | Jump to slide 1/2/3 | Carousel |
| Fundraiser card 1 (Keep Sandy) | Link | `/f/sandywest?attribution_id=...` | Carousel |
| Fundraiser card 2 (Saving Eliza) | Link | `/f/ElizaONeill?attribution_id=...` | Carousel |
| Fundraiser card 3 (Andy Ritchie) | Link | `/f/AndyRitchie?attribution_id=...` | Carousel |
| Fundraiser card (Wildfire Safety) | Link | `/f/realtime-alerts-for-wildfire-safety-r5jkk?...` | Activity / featured cause card |
| Benefiting Watch Duty | Link | `/charity/watch-duty` | Fundraiser card |
| Like activity | Button | Toggle HEART reaction | Activity card |
| View likes | Button | Opens liker list | Activity card |
| Comment on activity | Button | Opens comment composer | Activity card |
| Share activity | Button | Share sheet | Activity card |
| Activity options | Button | Options dropdown | Activity card |
| Report activity | Button | Report flow | Options dropdown |
| Hide activity | Option | Hide from feed | Options dropdown |
| Report comment | Option | Report comment | Comment section |
| Suggested people carousel | Panel | 20 profile suggestions, `hasNextPage` paginated | Follow suggestions |
| Manage Cookie Preferences | Button | Cookie consent modal | Footer |
| GFM Facebook | Link | `https://www.facebook.com/gofundme` | Footer |
| GFM YouTube | Link | `https://www.youtube.com/user/gofundme` | Footer |
| GFM Twitter | Link | `https://twitter.com/gofundme` | Footer |
| GFM Instagram | Link | `https://www.instagram.com/gofundme/` | Footer |
| More resources | Button | Expand footer links | Footer |
| Terms / Privacy / Legal / Accessibility / Cookie / Privacy Choices | Links (6) | Respective policy pages | Footer |

---

## Tracking & Metrics Observed

All vendor hits are from **bundle strings and feature-flag configs** embedded in the server-rendered HTML. No vendor JS was loaded on the network response directly (no GTM container ID, no GA4 tag, no FB pixel script tag found).

| Vendor | Signal Type | Hit Count | Notes |
|--------|------------|-----------|-------|
| Braze | Feature flags + string refs | 133 | Email transactional triggers (donation receipt, fundraiser published, smart goals, follow), `braze_email_*` flags. Key presence in bundle: yes. |
| mParticle | Feature flags + string refs | 10 | `shared_mparticle`, `mparticle_tracking`, `mparticle_domain`, `mparticle_share_event_tracking` flags; GDID-to-mParticle deviceId feature flag active (`send-gdid-as-mparticle-deviceid: on`). |
| Optimizely | Datafile embedded | 8+ | Full Optimizely datafile in `__NEXT_DATA__` (1,111 feature flags, 179 experiments, 126 events, SDK key present but redacted). Env: production. Account ID: 14721270268. |
| TikTok | Bundle refs | 12 | `android_tiktok_share` feature flag; share sheet integration. |
| Snapchat | Bundle refs | 11 | `android_snapchat_share` feature flag; share sheet integration. |
| Amplitude | Bundle refs + flag | 3 | `campaign-amplitude-test-experiment` flag; `amplitudeDecision` key present (empty for this visitor). `amp16/20/21/24/25/27` experiment series. |
| Bing | Bundle refs | 6 | Conversion/attribution references in bundle. |
| Heap | Bundle refs | 1 | Single reference; likely disabled. |
| AppsFlyer | Bundle refs | 1 | Mobile attribution reference. |
| Adjust | Bundle refs | 6 | Mobile attribution references. |
| GTM | None found | 0 | No GTM container ID in rendered HTML. |
| GA4 / UA | None found | 0 | No measurement ID in rendered HTML. |
| Segment | None found | 0 | No Segment snippet in rendered HTML. |
| Facebook Pixel | None found | 0 | No `fbq(` or `connect.facebook.net` in rendered HTML. |
| Hotjar | None found | 0 | Not detected. |
| Sentry | Not searched | — | Not checked (not in vendor list). |
| Datadog | Not searched | — | Not checked (not in vendor list). |
| Mixpanel | None found | 0 | Not detected. |
| Pinterest | None found | 0 | Not detected. |
| FullStory | None found | 0 | Not detected. |
| Iterable | None found | 0 | Not detected. |

### Optimizely Events (sample — 126 total)

Key event names observed: `donation_complete`, `donate_main_cta_click`, `share_main_cta_click`, `campaign_page.view.pg_donate_index`, `campaign_page.click.lb_share.btn_share_facebook/twitter/whatsapp/email/sms/messenger/fbmessenger`, `campaign_page.click.pg_donate_index.btn_donate_sticky`, `post_donate.view.lb_postdonate_share`, `cc.click.pg_w_share-sheet1.*` (share widget events).

### Active Experiments (Optimizely decisions for this page load)

| Flag | Decision | Variant |
|------|----------|---------|
| `shared_disable_old_analytics` | default-rollout | off |
| `shared_notifications_bell` | default-rollout | off |
| `fe-ssr-public-profiles-npo-profile-page` | charity-access-rule | npo_profile_page |
| `fe-ssr-public-profile-complete-profile-steps` | experiment | treatment |
| `fe-ssr-public-profiles-for-every-profile` | experiment | profiles |
| `fe-ssr-public-profiles-about-section` | default-rollout | off |

### External JS Domains

Only `www.gofundme.com` and `www.google.com` (`www.gstatic.com` in footer link) appear as external script sources in the server-rendered HTML. Vendor SDKs are bundled into GFM's own JS chunks.

---

## JS-Gated / Sparse Sections

The following features are present in `__NEXT_DATA__` or i18n strings but were not rendered as full HTML (require client-side hydration):

- Giving Fund / Giving Wallet creation and display
- Gift card send/receive flows
- Complete Profile Steps wizard (experiment: treatment variant active)
- Notification bell (`shared_notifications_bell: off` for this visitor)
- User Messaging Hub (DM inbox, deferred auth)
- Fitness Activity Tracking (`fitness_activity_tracking_v1` flag)
- Social post scheduler
- Profile search (`fe-ssr-search-on-profiles` experiment)
- Profiles switcher (`fe-ssr-profiles-switcher` experiment)
- About section (`fe-ssr-public-profiles-about-section: off` — section present in DOM as tab but content may be limited for this visitor)
- Pinned entries (slot exists, zero items)
- "People You May Know" (PYMK) donor recommendations
