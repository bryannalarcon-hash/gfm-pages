# GoFundMe Community Page — Feature Inventory

**Crawled URL:** https://www.gofundme.com/communities/watch-duty
**Crawl date:** 2026-05-27
**Method:** curl SSR fetch (Next.js server-rendered); 1.68 MB HTML; `__NEXT_DATA__` JSON parsed (1.60 MB Apollo state).

---

## Navigation & Global

### Header (persistent, all pages)
- GoFundMe logo → `/` (data-tracking-id: `gofundme logo`)
- Search icon button (aria-label: Search) → `/s` (btn_nav_search_icon)
- **Donate** dropdown (aria-haspopup):
  - Categories / Browse → `/discover`
  - Crisis relief → `/c/act`
  - Social Impact Funds → `/c/cause`
  - Supporter Space → `/c/supporter-space`
  - Nonprofits → `/s?nonprofits=1`
- **Fundraise** dropdown:
  - How to start a GoFundMe → `/c/start`
  - Fundraising categories → `/c/start/fundraising-categories`
  - Team fundraising → `/c/fundraising-tips/team`
  - Fundraising Blog → `/c/blog`
  - Fundraising tips → `/c/fundraising-tips`
  - Fundraising ideas → `/c/fundraising-ideas`
  - Charity fundraising → `/c/start/charity-fundraising`
  - Sign up as a nonprofit → `/c/charity-fundraising`
  - GoFundMe Pro for nonprofits → https://pro.gofundme.com
- **About** dropdown:
  - How GoFundMe works → `/c/how-it-works`
  - GoFundMe Giving Guarantee → `/c/safety/gofundme-guarantee`
  - Supported countries → support.gofundme.com
  - Pricing → `/c/pricing`
  - Help Center → support.gofundme.com
  - About GoFundMe → `/c/about-us`
  - Newsroom → `/c/press`
  - Careers → `/c/careers`
  - GoFundMe Partnerships → `/c/partnerships`
- Sign in → `/sign-in?redirect=/communities/watch-duty`
- Start a GoFundMe (header CTA) → `/create/fundraiser` (btn_nav_sign_up / btn_nav_start)
- Hamburger menu button (mobile, aria-label: menu)
- Skip to content link (screen-reader affordance)

### Sticky Community Header CTA
- **Start a GoFundMe** sticky button → `/campaign/605/startfundraising`
  (data-tracking-id: `start fundraiser from sticky`)

### Footer
- GoFundMe.org external link
- Social: Facebook, YouTube, Twitter/X, Instagram (aria-labels)
- Links: How GoFundMe works, GoFundMe Giving Guarantee, Supported countries, Pricing, Help Center, About GoFundMe, Newsroom, Careers, GoFundMe Partnerships, GoFundMe.org, Fundraising tips, Fundraising ideas, Rent assistance, Fundraising sites, Team fundraising ideas, What is crowdfunding?, Why GoFundMe, Common questions, Success stories, Help with bills, Help with medical bills, Fundraising ideas for college, School fundraising ideas, How to get a service dog, Crowdfunding sites, Help for veterans
- Legal: Terms `/c/terms`, Privacy Notice `/c/privacy`, Legal `/c/legal`, Accessibility Statement, Cookie Policy, Your Privacy Choices (opt-out)
- **Manage Cookie Preferences** button (consent management)

---

## Community Identity & Membership

### Hero Section
- Community name: **Watch Duty**
- Hero image: CloudFront CDN photo (`watch_duty_feb182026.png`), alt text present
- Hero image mask: SQUARE (config-driven)
- Community type: `CHALLENGE` (peer-to-peer challenge model)
- Community organizer: Watch Duty (via GoFundMe's `communityBy`; `showCommunityBy: false` — organizer name not surfaced in this view)
- Charity: Watch Duty (Charity ID 653181, ACTIVE, PayPal Giving Fund)
- Theme: NEUTRAL

### Stats (Visible Metrics — `visibleMetrics` config)
- Total raised: $38,745 (480 donations)
- Total fundraisers: 180
- Total followers: 68

### Follow / Join
- **Follow button** (data-tracking-id: `join community`)
  - Shows follower count: "68 followers"
  - Unfollow action also available when logged in
  - Error states: "Failed to follow community. Please try again."
  - Follower milestone copy (gamification): "Be this community's first follower!", "Be one of this community's first 5 followers!", etc.
  - Notification settings modal per post (web + mobile push options)
- **Followers count button** — opens follower list modal ("View community followers")

### Share
- **Share button** (data-tracking-id: `share`, aria-label: Share)
  - Share sheet with channels: Facebook, Twitter/X, WhatsApp, Facebook Messenger, SMS, Email, Copy link, Embed, Print/sign (per Optimizely event keys)
  - AI-generated share text (feature flags: `gen_ai_share_sheet_option`, `ai_share_precache`, `amp24_agentic_share_text`, `dynamic_share_text`)
  - Nextdoor share option (feature flag: `nextdoor_share_sheet_option`)
  - LinkedIn share (feature flags: `android_linkedin_share`, `generate_linkedin_ai_share_text`)
  - Instagram share story/feed (mobile; feature flags)
  - Snapchat share (feature flag: `android_snapchat_share`)
  - TikTok share (feature flag: `android_tiktok_share`)
  - Smart links / amplify URLs (feature flags: `shared_smart_links`, `causes_smartlinks`)

### Community Description (About section)
- Free-text description (stored in `communityConfiguration.sections.impact.about.description`)
- Community rules listed (5 rules: Be helpful, Be respectful, Be authentic, Be safe, Be responsible)
- "About this community" label; `showAboutSection: true`

### Organizer Tools (conditional, admin/organizer only)
- "Manage your community settings" link
- "Email all community followers" action
- "Send a web and mobile app notification to this Community's followers"

---

## Fundraiser Aggregation

### Data Model
- Community maps to a `Cause` object (GraphQL type: `Cause`, `communityType: CHALLENGE`).
- Fundraisers aggregated via `communityFundraisers` connection, ordered by `AMOUNT` (default).
- Total: 180 fundraisers in community; `totalCount: 180`.
- Each fundraiser references a `Fundraiser` node with: title, slug, currentAmount, goalAmount, donationCount, organizer (User ref), charity (Charity ref), fundDescription, photo (CloudFront/CDN).
- All listed fundraisers point to charity `Watch Duty` (Charity:653181).
- Campaign wrapper: `Campaign:605` (GoFundMe Pro campaign ID 764658).

### Leaderboard (top 3 shown server-side)
| Rank | Title | Amount Raised | Goal | Organizer |
|------|-------|---------------|------|-----------|
| 1 | Support WatchDuty to Improve Wildfire Safety | $16,344 | $18,000 | Tim Cadogan |
| 2 | Seconds Matter with Watch Duty | $5,392 | $6,500 | Arnie Katz |
| 3 | Real-Time Alerts for Wildfire Safety | $2,102 | $2,200 | Janahan Gofundme Vivekanandan |

- Each leaderboard card is a link → `/f/{slug}` (data-tracking-id: `leaderboard: fundraiser`)
- **See all** button — expands or navigates to full fundraiser list

### Fundraiser Tab (Fundraisers tab)
- Full paginated list of 180 community fundraisers
- Each card: title, photo, amount raised / goal, organizer name, link to fundraiser `/f/{slug}`
- **Donate** button per card → navigates to fundraiser donation flow
- Cursor-based pagination (`hasNextPage` / `cursor` in GraphQL)
- Error state: "We could not load fundraisers. Please refresh the page or try again later."

### Filters (Fundraisers tab, config: `searchFilters`)
- **LEGACY_CATEGORY** — filter by fundraiser category
- **TIME_PERIOD** — filter by recency
- **CLOSE_TO_GOAL** — filter by proximity to goal
- Filter UI label: "Fundraiser filters" / "Sort by: {{capitalizedLabel}}"
- Feature flag: `fe-ssr-communities-fundraiser-filters` (currently OFF per Optimizely decision for this session)
- Search input: "Search for fundraisers" (present in translation strings; JS-gated, no `<input>` in SSR HTML)

### Activity Tab
- Feed of activities in reverse-chronological order (`REVERSE_CHRONOLOGICAL`)
- Activity types observed: `POSTED` (fundraiser update posted), UserPost (community post)
- Each Activity has: actor (User), verb, object (FundraiserUpdate or UserPost), target (Fundraiser or feed)
- **Reactions**: HEART reaction on activities (`viewerReaction`, `reactionCountSummary`); feature flags `fe-ssr-generic-activity-reactions`, `be_activity_feed_reaction_created_feature`
- **Comments**: per-activity comment count; `commentsEnabled: true`; feature flags `fe-ssr-generic-activity-comments`, `shared-fundraiser-stream-comments`
- Load more / error state: "We could not load more activities. Please refresh the page or try again later."
- Feature flag: `fe-ssr-generic-activity-feed`

### Tab Order
Configured via `showControls.tabOrder`: **ACTIVITY → FUNDRAISERS → ABOUT**

### Nonprofits Tab
- `showNonprofitsTab: false` — not shown for this community.

### Start a GoFundMe (community-contextual)
- **Start a GoFundMe** button → `/campaign/605/startfundraising` (data-tracking-id: `start fundraiser`, also `start fundraiser from header`)
- `showStartFundraiser: true`; custom URL/label not set (`startFundraiserConfiguration.url: null`)

---

## Sharing & Social Proof

### Meta / OG Tags
- `og:type`: `gofundme:campaign`
- `og:title`: "Watch Duty: See the GoFundMe Community's Impact"
- `og:description`: community-awareness copy
- `og:image`: CloudFront CDN hero image
- `twitter:card`: summary_large_image; `twitter:site`: @gofundme
- Locales: en_US, en_GB, nl_NL, fr_FR, de_DE, es_LA

### Giving Guarantee
- "All fundraisers and nonprofits are verified by GoFundMe."
- "You're covered by the GoFundMe Giving Guarantee — the first and only donor protection guarantee." (linked to `/c/safety/gofundme-guarantee`)

### Social Links (footer)
- Facebook: facebook.com/gofundme
- YouTube: youtube.com/user/gofundme
- Twitter: twitter.com/gofundme
- Instagram: instagram.com/gofundme

---

## Full Interaction Table

| Feature | Type | Action / Destination | Region |
|---------|------|----------------------|--------|
| GoFundMe logo | Link | `/` | Global header |
| Search | Button + Link | `/s` | Global header |
| Donate (dropdown) | Dropdown button | Sub-links to /discover, /c/act, /c/cause, /s?nonprofits=1 | Global header |
| Fundraise (dropdown) | Dropdown button | Sub-links to /c/start, /c/blog, /c/fundraising-tips, etc. | Global header |
| About (dropdown) | Dropdown button | Sub-links to /c/how-it-works, /c/pricing, support, etc. | Global header |
| Sign in | Link | `/sign-in?redirect=/communities/watch-duty` | Global header |
| Start a GoFundMe (header) | Link | `/create/fundraiser` | Global header |
| Mobile menu | Button | Opens nav drawer | Global header (mobile) |
| Start a GoFundMe (sticky) | Link | `/campaign/605/startfundraising` | Sticky community header |
| Community hero image | Visual | Non-interactive | Hero section |
| Follow community | Button | POSTs follow; updates follower count | Hero section |
| 68 followers count | Button | Opens follower list modal | Hero section |
| Share community | Button | Opens share sheet modal | Hero section |
| Share: Facebook | Button | Opens Facebook share | Share sheet |
| Share: Twitter/X | Button | Opens Twitter share | Share sheet |
| Share: WhatsApp | Button | Opens WhatsApp share | Share sheet |
| Share: Messenger | Button | Opens FB Messenger share | Share sheet |
| Share: SMS | Button | Opens SMS client | Share sheet |
| Share: Email | Button | Opens email client | Share sheet |
| Share: Copy link | Button | Copies URL to clipboard | Share sheet |
| Share: Embed | Button | Shows embed code | Share sheet |
| Share: Nextdoor | Button (feature-flagged) | Opens Nextdoor share | Share sheet |
| Share: LinkedIn | Button (feature-flagged) | Opens LinkedIn share | Share sheet |
| Share: Instagram | Button (mobile, feature-flagged) | Opens Instagram | Share sheet |
| Share: TikTok | Button (mobile, feature-flagged) | Opens TikTok | Share sheet |
| Share: Snapchat | Button (mobile, feature-flagged) | Opens Snapchat | Share sheet |
| Activity tab | Tab | Shows reverse-chron feed | Tabs |
| Fundraisers tab | Tab | Shows community fundraisers | Tabs |
| About tab | Tab | Shows description + rules | Tabs |
| React (HEART) to activity | Button (JS-gated) | Sends reaction to activity | Activity feed |
| Comment on activity | Button (JS-gated) | Opens comment input | Activity feed |
| Load more activities | Button (JS-gated) | Fetches next page via cursor | Activity feed |
| Filter fundraisers (Category) | Filter (feature-flagged OFF) | Filters list | Fundraisers tab |
| Filter fundraisers (Time Period) | Filter (feature-flagged OFF) | Filters list | Fundraisers tab |
| Filter fundraisers (Close to Goal) | Filter (feature-flagged OFF) | Filters list | Fundraisers tab |
| Search fundraisers | Input (JS-gated) | GQL query with text | Fundraisers tab |
| Fundraiser card | Link | `/f/{slug}` | Fundraisers tab / Leaderboard |
| Donate (per fundraiser card) | Button/Link | `/f/{slug}` donation flow | Fundraisers tab |
| See all fundraisers | Button | Expands list or navigates | Leaderboard section |
| Organizer name | Link | Organizer profile | Fundraiser cards |
| Manage Cookie Preferences | Button | Opens consent modal | Footer |
| Footer nav links | Links | Various `/c/` and support URLs | Footer |
| Social icons | Links | Facebook, YouTube, Twitter, Instagram | Footer |
| GoFundMe Giving Guarantee | Link | `/c/safety/gofundme-guarantee` | Footer / About |
| Your Privacy Choices | Link | `/c/opt-out-rights` | Footer |

---

## Tracking & Metrics Observed

### Vendors Confirmed (string matches in HTML/`__NEXT_DATA__`)

| Vendor | Evidence | Hit Count |
|--------|----------|-----------|
| **Braze** | Segment/audience names, feature flag keys (`braze_email_*`), Optimizely datafile | 133 |
| **Optimizely** | Full datafile in `__NEXT_DATA__`; 1,111 feature flags; 126 events; `accountId: 14721270268` | 8 |
| **Amplitude** | Feature flag keys (`amplitude`, `send-gdid-as-mparticle-deviceid`, `campaign-amplitude-test-experiment`) | 3 |
| **mParticle** | Feature flag key `shared_mparticle`, `mparticle_share_event_tracking` | 10 |
| **TikTok** | Feature flag key `android_tiktok_share` | 12 |
| **Snapchat** | Feature flag key `android_snapchat_share` | 11 |
| **Bing** | Feature flag name references | 6 |
| **AppsFlyer** | Feature flag/config reference | 1 |
| **Adjust** | Feature flag/config reference | 6 |
| **Feroot** | External JS bundle loaded (`pg.feroot.com/v1/bundle/...`) — client-side security/bot detection | 1 |
| **reCAPTCHA** | `google.com/recaptcha/enterprise.js` loaded | 1 |

### Not Found in HTML
GTM, GA4/UA, Segment (cdn.segment.com / analytics.track), Facebook Pixel (fbq), Hotjar, Sentry, Datadog, Pinterest, FullStory, Mixpanel, Heap, Iterable.
Note: client-side-only vendors may be injected by JS bundles (not visible in SSR HTML).

### Active Optimizely Experiments (this session)
| Experiment Key | Decision |
|----------------|----------|
| `fe-ssr-communities-redesign` | `variant` (prod_communities_visibility_rule) |
| `fe-ssr-communities-fundraiser-filters` | OFF |
| `fe-ssr-community-overview` | ON |
| `shared_disable_old_analytics` | OFF |
| `shared_notifications_bell` | OFF |

### Analytics Keys
API keys for Amplitude, Optimizely, Braze, mParticle are not present in the SSR HTML; they reside in Next.js JS bundles (`/ssr/_next/static/chunks/`). Optimizely `accountId: 14721270268` and `projectId: 15265681341` present in datafile (public project metadata, not secret).

### External JS Bundles Requiring Inspection
- `https://pg.feroot.com/v1/bundle/b8c7e31b-10b0-4819-9a5c-b50b25ad9d86` (third-party security agent)
- `https://www.google.com/recaptcha/enterprise.js`
- `/ssr/_next/static/chunks/pages/communities/[communitySlug]-0542f5cf8315dd29.js` (community page logic)
- `/ssr/_next/static/chunks/pages/_app-8d466b74f9451e3c.js` (app-wide init, likely loads analytics SDKs)
