# GoFundMe Fundraiser Page — Feature Inventory

**Crawled URL:** https://www.gofundme.com/f/realtime-alerts-for-wildfire-safety-r5jkk
**Date:** 2026-05-27
**Method:** Static SSR HTML via curl (Next.js `__N_SSP: true` server-side render, ~1.6 MB). Dynamically-injected widgets (donate flow iframe, share modal, comment form, post-donate lightbox) are present in the HTML as feature-flag definitions and Optimizely event names but their full DOM is not rendered server-side.

---

## Navigation & Global

### Header
| Element | Type | Action / Destination |
|---|---|---|
| GoFundMe logo | link (internal) | `/` — homepage |
| Search icon | button | Opens search (`/s`) |
| "Donate" nav menu button | button | Dropdown: Discover, Categories, Crisis relief, Social Impact Funds, Supporter Space, Nonprofits |
| "Fundraise" nav menu button | button | Dropdown: How to start, Categories, Team fundraising, Blog, Tips, Ideas, Charity fundraising, Sign up as nonprofit |
| "About" nav menu button | button | Dropdown (About GoFundMe, Newsroom, Careers, Partnerships) |
| Sign in | link (internal) | `/sign-in?redirect=/f/realtime-alerts-for-wildfire-safety-r5jkk` |
| Start a GoFundMe | link (internal) | `/create/fundraiser` |
| Main menu (mobile) | aria-label button | Opens mobile nav drawer |

### Sub-nav links (Donate dropdown)
| Link | Destination |
|---|---|
| Browse fundraisers | `/discover` |
| Crisis relief | `/c/act` |
| Social Impact Funds | `/c/cause` |
| Supporter Space | `/c/supporter-space` |
| Nonprofits | `/s?nonprofits=1` |
| GoFundMe.org | `https://www.gofundme.org` |

### Sub-nav links (Fundraise dropdown)
| Link | Destination |
|---|---|
| How to start a GoFundMe | `/c/start` |
| Fundraising categories | `/c/start/fundraising-categories` |
| Team fundraising | `/c/fundraising-tips/team` |
| Fundraising Blog | `/c/blog` |
| Fundraising tips | `/c/fundraising-tips` |
| Fundraising ideas | `/c/fundraising-ideas` |
| Charity fundraising | `/c/start/charity-fundraising` |
| Sign up as a nonprofit | `/c/charity-fundraising` |

### Footer links (partial — full set in table below)
Social: Facebook (`https://www.facebook.com/gofundme`), YouTube, Twitter/X, Instagram.
Legal: Terms `/c/terms`, Privacy Notice `/c/privacy`, Legal `/c/legal`, Accessibility Statement, Cookie Policy, Your Privacy Choices.
Info: How GoFundMe works, Giving Guarantee, Supported countries, Pricing, Help Center, About GoFundMe, Newsroom, Careers, Partnerships, GoFundMe Pro for nonprofits.
Cookie preference: "Manage Cookie Preferences" button (triggers consent modal).

---

## Primary Conversion Actions

| Feature | Type | What it does |
|---|---|---|
| **Donate now** (hero CTA) | button/link | `/f/realtime-alerts-for-wildfire-safety-r5jkk/donate?source=btn_donate` — opens donate flow |
| **Donate** (sticky banner) | button/link | Same destination with `source=btn_donate_sticky` — tracked separately via Optimizely event `campaign_page.click.pg_donate_index.btn_donate_sticky` |
| **Donate** (nav menu) | button | Tracked as `campaign_page.click.pg_donate_index.btn_nav_donate` |
| **Donate** (inside story) | button | Tracked as `campaign_page.click.pg_donate_index.btn_story_donate` |
| **Donate** (more donations panel) | button | `data-tracking-id="donations see all"` — `btn_donate_moredonations` event |
| **Donate** (donation list lightbox) | button | `campaign_page.click.lb_donation_list.btn_donations_donate` |
| **Donate** (Update entry) | link | `/f/realtime-alerts-for-wildfire-safety-r5jkk/donate?source=btn_donate_update` |
| **Share** (primary CTA) | button | Opens share sheet lightbox (`lb_share`); tracked as `share_main_cta_click` |
| **Share** (nav) | button | `campaign_page.click.pg_donate_index.btn_nav_share` |
| **Share** (sticky) | button | `campaign_page.click.pg_donate_index.btn_share_sticky` |
| **Share** (inside story) | button | `campaign_page.click.pg_donate_index.btn_story_share` |
| **Follow / Heart** | button | Increments `heartCount` (20 hearts at crawl time); Optimizely flag `be_profile_follow_feature` controls extended follow behavior |
| **Recurring donation nudge** | UI experiment | Feature flag `fe-ssr-campaign-recurring-nudge:kitchen_sink` — prompts one-time donors to switch to monthly |

### Share Sheet Channels (in lightbox `lb_share`)
Facebook, X/Twitter, WhatsApp, Facebook Messenger, SMS/Text, Email, Copy Link, Copy Link (tip variant), Print, Embed code, More shares, Nextdoor (flag: `nextdoor_share_sheet_option`), AI-generated share text (flag: `gen_ai_share_sheet_option`).
Mobile platform extras (feature-flagged): TikTok, Snapchat, Instagram (feed + story), LinkedIn.

---

## Story & Content Interactions

| Feature | Type | Action |
|---|---|---|
| **Organizer profile link** | link | `/f/realtime-alerts-for-wildfire-safety-r5jkk?_dt=<token>` — organizer "Janahan Gofundme Vivekanandan" profile hyperlink (experiment `fe-ssr-campaign-profile-hyperlinks:modal_treatment` — opens modal) |
| **Watch Duty (beneficiary / charity)** | link | `https://www.gofundme.com/charity/watch-duty` — charity page |
| **Read story / Read more** | button | Expands collapsed fundraiser description |
| **Gallery images** | interactive | `galleryImages` Apollo field present; viewer component in DOM (`hero-media-viewer`) |
| **Fundraiser photo** | image viewer | Hero media; `fe-ssr-campaign-hero-media` flag |
| **Category tag** | link | Category ID 15 → "Other" (Nextdoor meta); links to category browse |
| **Report fundraiser** | link | `https://support.gofundme.com/hc/en-us/articles/203604694` |
| **Story slide summary** | static | "Watch Duty's alerts fund 24/7 wildfire monitoring, clearer updates, wider coverage" |
| **Poster sharing** | feature-flagged | `posterSharingEnabled: true`; `fe-ssr-campaign-carousel-poster-visibility-desktop/mobile` experiments active (carousel poster variant-a-second-position on mobile) |

---

## Social Proof & Community

| Feature | Type | Action |
|---|---|---|
| **Donation count / progress bar** | display | 21 donations; `Progress: 0%` aria label (goal not yet reached); `$3K` goal button |
| **See all (donations)** | button | `btn_donate_moredonations` — expands donation list lightbox; pagination: pages 1-3 (`Page 1 of 3`, `Page 2 of 3`, `Page 3 of 3` + Previous/Next) |
| **See top (donations)** | button | `campaign_page.click.lb_donation_top.btn_donations_donate` — sorted by amount |
| **Donations list** | interactive | 21 `Donation` entities in Apollo state; each donor shows name, amount, optional message field (`donorComment`) |
| **Words of support / Comments** | form (JS-gated) | `commentSystem: LEGACY`, `commentsEnabled: true`, `commentCount: 0`; create comment via feature flag `campaign_page_create_comment`. Comment button in donation list tracked as `campaign_page.click.lb_donation_list.btn_donations_message` |
| **Heart / Like** | button | `heartCount: 20`; `isLinkedWithMeta: true` (syncs with Meta/Instagram follow) |
| **People You May Know (PYMK)** | feature experiment | `fe-ssr-campaign-pymk:variant` — shows suggested connections on the fundraiser page |
| **Organizer / beneficiary section** | link + display | Scroll-to-organizers link; organizer name, beneficiary "Watch Duty" charity |
| **Scroll to organizers** | link | `aria-label="Scroll to organizers"` — anchor within page |
| **Post-donate comment** | lightbox | `post_donate.view.lb_postdonate_comment` — post-donation comment prompt |
| **Post-donate share** | lightbox | `post_donate.view.lb_postdonate_share` — share sheet shown after donation |
| **Money box / donation list prompt** | experiment | `fe-ssr-campaign-money-box-donation-list-prompt:off` at crawl time |

---

## Updates & Other

| Feature | Type | Notes |
|---|---|---|
| **Campaign updates** | section | `updateCount: 0` — no updates posted at crawl time; `updates_modal` feature flag present |
| **More resources** | button | Footer-region; links to blog articles (rent assistance, fundraising sites, team ideas, crowdfunding, medical bills, college, schools, service dogs, veterans) |
| **GoFundMe Pro for nonprofits** | link | `https://pro.gofundme.com` — upsell CTA |
| **App download (Instagram deep link)** | feature-flagged | `instagramDeepLink` field in Apollo (mobile app handoff for Instagram story sharing) |
| **Fundraise for this cause / Start a GoFundMe** | link | `/create/fundraiser` — global header CTA |
| **Calendar reminder (add to iCal/Google Calendar)** | share-sheet step | Events: `cc.click.pg_w_calender-reminder.btn_ss_add_ical`, `btn_ss_add_gcal` |
| **Embed widget** | share-sheet option | `cc.click.pg_w_share-sheet1.btn_embed` |
| **Print a sign** | share-sheet option | `cc.click.pg_w_share-sheet1.btn_print_sign` |
| **Smart Goals** | feature | `smartGoalsOptIn: ENABLED`; `fe-ssr-smart-goals-fundraiser` flag; auto-adjusts goal |
| **Recurring donation (monthly)** | checkout experiment | `fe-ssr-campaign-recurring-nudge:kitchen_sink`; `recurringNudgeExperiment: kitchen_sink`; multiple flags: `recurring_donations`, `fe-ssr-campaign-recurring-is-default` |
| **Tipping (platform tip)** | checkout | `uc_tipping_ui` flags (v2, v20241216, v20250107, v20250115, v20250304); `cad/gbp/eur/aud_uc_tipping_ui` experiments active |
| **Guidance card / donor guidance** | feature | `campaign_guidance_drawer_donors` flag; event `click.pg_donate_index.pg_guidance_card_link` |

---

## Full Interaction Table

| Feature | Type | Action / Destination | Region |
|---|---|---|---|
| GoFundMe logo | link | `/` | Header |
| Search | button/link | `/s` | Header |
| Donate nav menu | button | Dropdown | Header |
| Fundraise nav menu | button | Dropdown | Header |
| About nav menu | button | Dropdown | Header |
| Sign in | link | `/sign-in?redirect=...` | Header |
| Start a GoFundMe | link | `/create/fundraiser` | Header |
| Discover / Browse | link | `/discover` | Header dropdown |
| Crisis relief | link | `/c/act` | Header dropdown |
| Social Impact Funds | link | `/c/cause` | Header dropdown |
| Supporter Space | link | `/c/supporter-space` | Header dropdown |
| Nonprofits | link | `/s?nonprofits=1` | Header dropdown |
| Donate now (hero) | button/link | `.../donate?source=btn_donate` | Hero |
| Share (primary) | button | Opens share lightbox | Hero |
| Heart / Follow | button | Increments heartCount + Meta sync | Hero |
| Progress bar ($3K goal) | display | — | Hero money box |
| Gallery viewer | interactive | Opens photo modal | Hero media |
| Read story / Read more | button | Expands description | Story |
| Organizer profile link | link | Profile modal (experiment) | Story byline |
| Watch Duty (charity) | link | `/charity/watch-duty` | Story byline |
| Donate (story) | button | Donate flow | Story |
| Share (story) | button | Share lightbox | Story |
| Donate (sticky) | button | Donate flow | Sticky bar |
| Share (sticky) | button | Share lightbox | Sticky bar |
| See all (donations) | button | Donation list lightbox (paged) | Donation panel |
| See top (donations) | button | Top-donors view | Donation panel |
| Donate (donation list) | button | Donate flow | Donation lightbox |
| Comment (donation list) | button | Post comment/message form | Donation lightbox |
| Share — Facebook | button | Facebook share dialog | Share lightbox |
| Share — X/Twitter | button | X share dialog | Share lightbox |
| Share — WhatsApp | button | WhatsApp share | Share lightbox |
| Share — Messenger | button | FB Messenger | Share lightbox |
| Share — SMS/Text | button | SMS client | Share lightbox |
| Share — Email | button | Email client | Share lightbox |
| Share — Copy link | button/input | Clipboard copy | Share lightbox |
| Share — Print | button | Print dialog | Share lightbox |
| Share — Embed | button | Embed code widget | Share lightbox |
| Share — Nextdoor | button (flagged) | Nextdoor share | Share lightbox |
| Share — AI text | button (flagged) | AI-generated message | Share lightbox |
| Share — More | button | Extended share options | Share lightbox |
| Add to iCal | button | Calendar download | Share wizard |
| Add to Google Calendar | button | Google Calendar link | Share wizard |
| Scroll to organizers | anchor | In-page scroll | Organizer section |
| Report fundraiser | link | Support article | Content |
| Manage Cookie Preferences | button | Cookie consent modal | Footer |
| GoFundMe.org | link (external) | `https://www.gofundme.org` | Footer |
| Facebook (GFM page) | link (external) | Facebook.com/gofundme | Footer |
| YouTube (GFM) | link (external) | YouTube | Footer |
| Twitter/X (GFM) | link (external) | Twitter.com/gofundme | Footer |
| Instagram (GFM) | link (external) | Instagram.com/gofundme | Footer |
| How GoFundMe works | link | `/c/how-it-works` | Footer |
| GoFundMe Giving Guarantee | link | `.../c/safety/gofundme-guarantee` | Footer |
| Pricing | link | `/c/pricing` | Footer |
| Help Center | link | `support.gofundme.com` | Footer |
| About GoFundMe | link | `/c/about-us` | Footer |
| Newsroom | link | `/c/press` | Footer |
| Careers | link | `/c/careers` | Footer |
| Partnerships | link | `/c/partnerships` | Footer |
| GoFundMe Pro | link | `https://pro.gofundme.com` | Footer |
| Terms | link | `/c/terms` | Footer |
| Privacy Notice | link | `/c/privacy` | Footer |
| Legal | link | `/c/legal` | Footer |
| Accessibility Statement | link | `/c/accessibility-statement` | Footer |
| Cookie Policy | link | `/c/gofundme-cookie-policy` | Footer |
| Your Privacy Choices | link | `/c/opt-out-rights` | Footer |
| Blog links (8 articles) | links | Various `/c/blog/...` | Footer resources |

---

## Tracking & Metrics Observed

### Vendors Found (with evidence)

| Vendor | Hits | Evidence |
|---|---|---|
| **Braze** | 133 | Feature flags: `braze_email_*` (20+ flags), `braze_fundraiser_*`, audience segments named "Braze Email Tester", "Users Receiving Braze KYC Validation Failed". Braze used for transactional email (donation receipt, share nudge, recurring failure) and marketing campaigns. |
| **Optimizely** | 8 direct + datafile | Full Optimizely datafile embedded in `__NEXT_DATA__`: accountId `14721270268`, projectId `15265681341`, SDK key present (`AiS1...`). 179 running experiments. 1,111 feature flags. |
| **TikTok** | 12 | Feature flags `android_tiktok_share` (rollout-181771); referenced in share platform inference list. No pixel/script tag in static HTML — loaded client-side. |
| **Snapchat** | 11 | Feature flag `android_snapchat_share` (rollout-218474). No pixel tag in static HTML. |
| **Bing** | 6 | Mentioned only in a translated UI string about search engine visibility ("Google, Bing, and Yahoo!"). No UET tag found in static HTML. |
| **Amplitude** | 3 | `amplitudeDecision` key in `initialPropsFromServer` (empty at crawl time); feature flag `campaign-amplitude-test-experiment`. No SDK tag in static HTML — loaded via Next.js bundle. |
| **mParticle** | 10 | Feature flag `shared_mparticle`; `send-gdid-as-mparticle-deviceid` flag; `mparticle_share_event_tracking` flag. Customer data platform for event routing. |
| **Google reCAPTCHA Enterprise** | 1 | `<script src="https://www.google.com/recaptcha/enterprise.js">` loaded on page. |
| **Feroot** | 1 | `<script src="https://pg.feroot.com/v1/bundle/b8c7e31b-10b0-4819-9a5c-b50b25ad9d86">` — client-side security scanner / PII detection. |

**NOT found in static HTML:** Google Tag Manager (GTM-*), Google Analytics GA4/UA, Segment, Facebook Pixel (`fbq`), Heap, Mixpanel, Hotjar, Sentry, Datadog, Pinterest, FullStory, Iterable. These may load client-side from Next.js JS bundles.

### Event Names (Optimizely — 126 total, key campaign-page subset)

```
campaign_page.view.pg_donate_index
campaign_page.click.pg_donate_index.btn_donate
campaign_page.click.pg_donate_index.btn_donate_sticky
campaign_page.click.pg_donate_index.btn_nav_donate
campaign_page.click.pg_donate_index.btn_story_donate
campaign_page.click.pg_donate_index.btn_donate_moredonations
campaign_page.click.pg_donate_index.btn_share
campaign_page.click.pg_donate_index.btn_nav_share
campaign_page.click.pg_donate_index.btn_share_sticky
campaign_page.click.pg_donate_index.btn_story_share
campaign_page.click.pg_donate_index.share_button_clicks
campaign_page.click.pg_donate_index.share_sheet_clicks
campaign_page.click.lb_share.btn_share_{facebook,twitter,whatsapp,fbmessenger,sms,email,copy_link,print,moreshares}
campaign_page.click.lb_donation_list.btn_donations_donate
campaign_page.click.lb_donation_list.btn_donations_message
campaign_page.click.lb_donation_top.btn_donations_donate
post_donate.view.lb_postdonate_comment
post_donate.view.lb_postdonate_share
post_donate.click.lb_postdonate_share.share_button_clicks
donation_complete
```

### Active Experiments (this page visit, server-assigned)

| Experiment Key | Variation |
|---|---|
| `fe-ssr-campaign-recurring-nudge` | `kitchen_sink` |
| `fe-ssr-campaign-profile-hyperlinks` | `modal_treatment` |
| `fe-ssr-campaign-pymk` | `variant` |
| `fe-ssr-campaign-cta-colors` | `variant_b` |
| `fe-ssr-campaign-pricing` | `large` |
| `fe-ssr-campaign-empty-state` | `donor_badge_none` |
| `fe-ssr-campaign-carousel-poster-visibility-mobile` | `variant-a-second-position` |
| `fe-ssr-campaign-fitness-activity-tracking` | `variant` |
| `fe-ssr-campaign-gql-for-charity-donate` | `on` |
| `fe-ssr-campaign-partner-designated-recipients` | `on` |
| `fe-ssr-campaign-enable-in-native-webview` | `on` |

### API Keys / Identifiers Present
- Optimizely accountId and projectId: present (values not copied).
- Optimizely SDK key: present (prefix `AiS1...`).
- No Braze, Amplitude, mParticle, or Facebook API keys found in static HTML.

### External JS Bundles Requiring Inspection
Analytics SDK loading is deferred to Next.js client-side chunks. To recover full event names for Braze, Amplitude, mParticle, and TikTok, inspect:
- `pages/f/[campaignUrl]/[[...fundraiserPageParams]]-367272b40...js`
- `21064.cac07840e21bd339.js`, `20572.33029078bb76d56d.js` (likely vendor bundles)
- `pg.feroot.com` bundle (Feroot security scanner)
