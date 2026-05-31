# GoFundMe — Observed Metrics & Experiments (from Optimizely datafile)

**Source:** Embedded Optimizely SDK datafile (JSON), extracted from server-side-rendered HTML at
`/tmp/gfm_community.html` (also cross-checked against `/tmp/gfm_fundraiser.html`, `/tmp/gfm_profile.html` —
all three pages embed the same datafile revision `27940`).
**Extracted:** 2026-05-27
**Method:** Targeted regex against the raw SSR HTML (`experimentIds`/`rolloutId`/`status`+`layerId` patterns).
These are **Optimizely's** event tracking keys and feature-flag/experiment registry only. Client-side
Amplitude, Braze, and mParticle event names are **not** present here — they fire at runtime and are
not embedded in the datafile.

---

## Summary

| Entity | Count | Notes |
|--------|-------|-------|
| **Events** | 126 | Optimizely conversion-tracking goals; these map closest to GFM's real behavioral event taxonomy |
| **Feature flags** | 1,111 | Boolean and multivariate flags controlling every product surface |
| **True A/B experiments** | 4 | Full randomized experiments in the Optimizely "groups" layer |
| **Rollout/rule keys** | 303 | Named audience rules and traffic-ramped rollouts (typed-decision, not split tests) |

**Headline takeaway:** GFM's Optimizely registry reveals a product deeply invested in three loops —
(1) the tipping/checkout conversion funnel (dozens of tipping-UI variants, 10+ recurring-donation flags),
(2) the sharing/amplification pipeline (a numbered `amp*` flag series up to amp28 plus AI-generated share
text at multiple stages), and (3) a social graph layer (50+ `social_graph_platformization_*` flags)
powering follow, feed, community, and PYMK surfaces. The 4 live split tests all touch the donation flow.

---

## Event names (126)

Grouped by theme. These are the closest observable proxy to GFM's behavioral event taxonomy.

### Donation / checkout (core conversion)
```
checkout.success — checkout flow completed successfully (payment submitted) [inferred]
donate_main_cta_click — primary "Donate now" hero button clicked on campaign page [inferred]
donation_complete — donation transaction fully confirmed end-to-end [inferred]
donation_to_test_google_pay_campaign — Google Pay donation on internal test campaign (QA/instrumentation event) [inferred]
effective_rate_tip_amounts — conversion goal tracking which tip amount selections lead to completed donations [inferred]
gfm_pro_stripe_payments — Stripe payment processed via GoFundMe Pro (nonprofit/charity checkout path) [inferred]
campaign_page.click.lb_donation_list.btn_donations_donate — "Donate" button clicked inside the donation-list lightbox [inferred]
campaign_page.click.lb_donation_list.btn_donations_message — "Message" / comment button clicked inside the donation-list lightbox [inferred]
campaign_page.click.lb_donation_list.btn_exp_donate — experiment variant of the "Donate" button inside the donation-list lightbox [inferred]
campaign_page.click.lb_donation_top.btn_donations_donate — "Donate" button clicked in the top-donors view lightbox [inferred]
campaign_page.click.pg_donate_index.btn_donate — main hero "Donate now" CTA clicked on the campaign page [inferred]
campaign_page.click.pg_donate_index.btn_donate_moredonations — "See all" / more-donations expand button clicked on campaign page [inferred]
campaign_page.click.pg_donate_index.btn_donate_sticky — sticky-banner "Donate" button clicked on campaign page [inferred]
campaign_page.click.pg_donate_index.btn_exp_donate — experiment variant donate button clicked on campaign page [inferred]
campaign_page.click.pg_donate_index.btn_nav_donate — nav-menu "Donate" button clicked on campaign page [inferred]
campaign_page.click.pg_donate_index.btn_story_donate — "Donate" button embedded within the story section clicked on campaign page [inferred]
campaign_page.click.pg_donate_index.donate_button_clicks — aggregate roll-up of all donate button clicks on campaign page [inferred]
campaign_page.view.pg_donate_index — campaign page donate-index view (page impression for conversion funnel entry) [inferred]
click.pg_donate_index.btn_navmenu_donate — global nav-menu "Donate" button clicked (page-agnostic variant) [inferred]
p41_sidebar_donate_button_click — sidebar donate button click, likely on a partner or embed page layout (P41 placement) [inferred]
uc_classy_charity_recs — use-case event: Classy-integrated charity recommendation shown or acted upon [inferred]
us_account_creation_psp — account creation triggered via payment service provider (PSP) checkout path [inferred]
```

### Share
```
share_main_cta_click — primary "Share" hero button clicked on campaign page [inferred]
capapodo.click.shares — share click on a "capapodo" surface (likely an internal codename for a campaign widget or embed) [inferred — name unclear]
campaign_page.click.lb_postdonate_share.share_button_clicks — any share channel button clicked inside the post-donate share lightbox [inferred]
campaign_page.click.lb_share.btn_share_copy_link — "Copy link" button clicked inside the share lightbox on the campaign page [inferred]
campaign_page.click.lb_share.btn_share_copy_link_tip — tip-variant "Copy link" button clicked inside the share lightbox (A/B copy variant) [inferred]
campaign_page.click.lb_share.btn_share_email — "Email" share button clicked inside the share lightbox on the campaign page [inferred]
campaign_page.click.lb_share.btn_share_facebook — "Facebook" share button clicked inside the share lightbox on the campaign page [inferred]
campaign_page.click.lb_share.btn_share_fbmessenger — "Facebook Messenger" share button clicked inside the share lightbox [inferred]
campaign_page.click.lb_share.btn_share_moreshares — "More shares" / overflow share options button clicked inside the share lightbox [inferred]
campaign_page.click.lb_share.btn_share_print — "Print" share button clicked inside the share lightbox on the campaign page [inferred]
campaign_page.click.lb_share.btn_share_sms — "SMS / Text" share button clicked inside the share lightbox on the campaign page [inferred]
campaign_page.click.lb_share.btn_share_twitter — "Twitter / X" share button clicked inside the share lightbox on the campaign page [inferred]
campaign_page.click.lb_share.btn_share_whatsapp — "WhatsApp" share button clicked inside the share lightbox on the campaign page [inferred]
campaign_page.click.lb_share.input_share_copy_link — copy-link input field interacted with (focus/click) inside the share lightbox [inferred]
campaign_page.click.pg_donate_index.btn_exp_share — experiment variant of the share button clicked on campaign page [inferred]
campaign_page.click.pg_donate_index.btn_nav_share — nav-menu "Share" button clicked on campaign page [inferred]
campaign_page.click.pg_donate_index.btn_share — main share CTA button clicked on campaign page [inferred]
campaign_page.click.pg_donate_index.btn_share_sticky — sticky-banner "Share" button clicked on campaign page [inferred]
campaign_page.click.pg_donate_index.btn_story_share — "Share" button inside the story section clicked on campaign page [inferred]
campaign_page.click.pg_donate_index.share_button_clicks — aggregate roll-up of all share button clicks on campaign page [inferred]
campaign_page.click.pg_donate_index.share_clicks — aggregate share click signal (may overlap with share_button_clicks; possibly a different instrumentation layer) [inferred]
campaign_page.click.pg_donate_index.share_sheet_clicks — any click that opens the share sheet on campaign page [inferred]
p41_sidebar_share_button_click — sidebar share button click on partner/embed page layout (P41 placement) [inferred]
post_donate.click.lb_postdonate_share.btn_share_copy_link — "Copy link" clicked inside the post-donate share lightbox [inferred]
post_donate.click.lb_postdonate_share.input_share_copy_link — copy-link input interacted with inside the post-donate share lightbox [inferred]
post_donate.click.lb_postdonate_share.share_button_clicks — any share channel button clicked inside the post-donate share lightbox [inferred]
post_donate.click.lb_postdonate_share.share_clicks — aggregate share click signal on the post-donate screen [inferred]
cc.click.pg_w_share-sheet1.btn_embed — "Embed" button clicked on share-sheet step 1 of the post-creation share wizard [inferred]
cc.click.pg_w_share-sheet1.btn_nav_gfm_logo — GoFundMe logo nav link clicked on share-sheet step 1 of the creation wizard [inferred]
cc.click.pg_w_share-sheet1.btn_next — "Next" button clicked on share-sheet step 1 of the creation wizard [inferred]
cc.click.pg_w_share-sheet1.btn_print_sign — "Print a sign" button clicked on share-sheet step 1 of the creation wizard [inferred]
cc.click.pg_w_share-sheet1.btn_ss_copylink — "Copy link" button clicked on share-sheet step 1 of the creation wizard [inferred]
cc.click.pg_w_share-sheet1.btn_ss_email_client — "Email" button clicked on share-sheet step 1 of the creation wizard [inferred]
cc.click.pg_w_share-sheet1.btn_ss_facebook_post — "Facebook post" button clicked on share-sheet step 1 of the creation wizard [inferred]
cc.click.pg_w_share-sheet1.btn_ss_messenger — "Messenger" button clicked on share-sheet step 1 of the creation wizard [inferred]
cc.click.pg_w_share-sheet1.btn_ss_more — "More" / overflow share button clicked on share-sheet step 1 of the creation wizard [inferred]
cc.click.pg_w_share-sheet1.btn_ss_text_client — "SMS / Text" button clicked on share-sheet step 1 of the creation wizard [inferred]
cc.click.pg_w_share-sheet1.btn_ss_twitter_client — "Twitter / X" button clicked on share-sheet step 1 of the creation wizard [inferred]
cc.click.pg_w_share-sheet1.btn_ss_whatsapp — "WhatsApp" button clicked on share-sheet step 1 of the creation wizard [inferred]
cc.click.pg_w_share-sheet1.input_ss_copy_link — copy-link input interacted with on share-sheet step 1 of the creation wizard [inferred]
click.pg_donate_index.pg_guidance_card_facebook — donor guidance card "Facebook" link clicked (prompts donor to share on Facebook) [inferred]
click.pg_donate_index.pg_guidance_card_link — donor guidance card generic link clicked (prompts donor on how to maximize impact) [inferred]
```

### Post-donate engagement
```
post_donate.click.lb_postdonate_comment.btn_comment — "Comment" / submit button clicked inside the post-donate comment lightbox [inferred]
post_donate.view.lb_postdonate_comment — post-donate comment lightbox viewed (impression for comment prompt) [inferred]
post_donate.view.lb_postdonate_share — post-donate share lightbox viewed (impression for share prompt shown after donating) [inferred]
```

### Fundraiser creation (cc.* = campaign creation)
```
Fundraiser Published — fundraiser creation wizard completed and campaign published live [inferred]
cc.click.pg_campaign_details.btn_next_campaign_details — "Next" button clicked on the campaign details step of the creation wizard [inferred]
cc.click.pg_campaign_doors.btn_campaign_nonprofit_door — "Nonprofit / charity" path selected on the campaign-type door step [inferred]
cc.click.pg_campaign_doors.btn_campaign_personal_door — "Personal" path selected on the campaign-type door step [inferred]
cc.click.pg_campaign_goal.btn_next_campaign_goal — "Next" button clicked after setting the fundraising goal [inferred]
cc.click.pg_campaign_kyc.btn_complete — "Complete" / submit button clicked on the KYC identity verification step [inferred]
cc.click.pg_campaign_media.btn_next_campaign_media — "Next" button clicked after adding campaign media (photo/video) [inferred]
cc.click.pg_campaign_media.btn_next_campaign_photo_upload — "Next" button clicked after uploading a campaign photo specifically [inferred]
cc.click.pg_campaign_ppgfagreement.btn_next — "Next" / agree button clicked on the PayPal/GoFundMe terms agreement step [inferred]
cc.click.pg_campaign_story.btn_complete_fundraiser_story_editor — "Complete" button clicked to finish editing the fundraiser story [inferred]
cc.click.pg_charity_campaign_details.btn_next — "Next" button clicked on the charity-specific campaign details step [inferred]
cc.view.pg_campaign_details — campaign details step viewed in creation wizard (funnel impression) [inferred]
cc.view.pg_campaign_doors — campaign-type selection step ("doors" page) viewed in creation wizard [inferred]
cc.view.pg_campaign_goal — fundraising goal step viewed in creation wizard [inferred]
cc.view.pg_campaign_kyc — KYC identity verification step viewed in creation wizard [inferred]
cc.view.pg_campaign_media — media upload step viewed in creation wizard [inferred]
cc.view.pg_campaign_ppgfagreement — PayPal/GoFundMe terms agreement step viewed in creation wizard [inferred]
cc.view.pg_campaign_ready — "Ready to publish" confirmation step viewed in creation wizard [inferred]
cc.view.pg_campaign_story — story editor step viewed in creation wizard [inferred]
cc.view.pg_campaign_title — campaign title entry step viewed in creation wizard [inferred]
cc.view.pg_charity_campaign_details — charity-specific campaign details step viewed in creation wizard [inferred]
cc.view.team_product_upsell_2 — team fundraising upsell screen (version 2) viewed during creation wizard [inferred]
pg_create_ada_help — ADA / accessibility help page viewed during campaign creation [inferred]
customize_complete — fundraiser customization step completed (post-publish branding/theme step) [inferred]
```

### Post-creation share flow (cc.* wizard share sheet)
```
cc.click.pg_w_calender-reminder.btn_back — "Back" button clicked on the calendar-reminder step of the post-creation share wizard [inferred]
cc.click.pg_w_calender-reminder.btn_manage — "Manage" link clicked on the calendar-reminder step (navigates to manage dashboard) [inferred]
cc.click.pg_w_calender-reminder.btn_nav_gfm_logo — GoFundMe logo nav clicked on the calendar-reminder step of the share wizard [inferred]
cc.click.pg_w_calender-reminder.btn_ss_add_gcal — "Add to Google Calendar" button clicked on the calendar-reminder step [inferred]
cc.click.pg_w_calender-reminder.btn_ss_add_ical — "Add to iCal" button clicked on the calendar-reminder step [inferred]
cc.click.pg_w_share_message2.btn_back — "Back" button clicked on personalized share message step 2 of the wizard [inferred]
cc.click.pg_w_share_message2.btn_continue — "Continue" button clicked on personalized share message step 2 [inferred]
cc.click.pg_w_share_message2.btn_manage — "Manage" link clicked on personalized share message step 2 [inferred]
cc.click.pg_w_share_message2.btn_nav_gfm_logo — GoFundMe logo nav clicked on personalized share message step 2 [inferred]
cc.click.pg_w_share_message2.btn_skip — "Skip" button clicked on personalized share message step 2 (bypasses AI message editing) [inferred]
cc.view.pg_w_calender-reminder — calendar-reminder step viewed in post-creation share wizard [inferred]
cc.view.pg_w_share-sheet1 — share-sheet step 1 viewed in post-creation share wizard [inferred]
cc.view.pg_w_share-sheet3-5 — share-sheet steps 3-5 viewed in post-creation share wizard (AMP multi-step variant) [inferred]
cc.view.pg_w_share_message2 — personalized share message step 2 viewed in post-creation share wizard [inferred]
cc.view.pg_w_share_message3-5 — personalized share message steps 3-5 viewed in post-creation share wizard (AMP multi-step variant) [inferred]
```

### Signup / login
```
sign_in.success — user successfully authenticated (sign-in flow completed) [inferred]
sign_up.success — new user account successfully created (registration flow completed) [inferred]
```

### Manage / organizer dashboard
```
manage.view.pg_dashboard — organizer manage dashboard page viewed [inferred]
transfers_dashboard_success — fund transfer successfully initiated from the organizer transfers dashboard [inferred]
view_transfers_overview — organizer viewed the transfers overview page [inferred]
adyenHopWithdrawalCompleted — Adyen HOP (Hosted Onboarding Page) withdrawal/payout flow completed [inferred]
wakandaAdyenV6Completed — Adyen v6 payout flow completed under internal "Wakanda" payout infrastructure [inferred]
wakanda_adyen_v6_payout_pause — Adyen v6 payout paused under Wakanda payout infrastructure (may be a kill-switch or compliance hold event) [inferred]
```

### KYC / beneficiary
```
bene.view_kyc_identity — beneficiary viewed the KYC identity verification screen [inferred]
kyc_confirm — KYC identity verification confirmed / submitted [inferred]
```

### App / misc
```
cp-new-mobile-nav — campaign page new mobile navigation interacted with (likely an A/B test of mobile nav layout) [inferred]
home-new-mobile-nav — homepage new mobile navigation interacted with (A/B test of mobile nav layout on home) [inferred]
home-starts-increase — homepage "Start a GoFundMe" CTA click or funnel entry tracked for starts-increase experiment [inferred]
homepage_header_nextlink_success — successful navigation via a Next.js Link in the homepage header [inferred]
impact-dashboard-event — interaction or view on the organizer impact/analytics dashboard [inferred]
rebrand_metric — event tied to a GFM rebranding initiative to measure reach or adoption of new brand assets [inferred]
additional_404_links — user clicked one of the additional recovery links on a 404 error page [inferred]
```

### Test / internal
```
ben_test — internal QA / developer test event (named "ben", likely an engineer's sandbox event) [inferred]
fe-ssr-lambda-cdn-test — internal test event for SSR Lambda + CDN infrastructure validation [inferred]
test_event_1 — generic internal test event (instrumentation smoke test) [inferred]
```

---

## Feature flags (1,111)

Too many to list exhaustively. Groups by prefix/theme with counts, then the most relevant 50 verbatim.

### Counts by theme

| Theme | Count |
|-------|-------|
| Payments / checkout / tipping | ~260 |
| Sharing / amplification (`amp*`, posters, video, AI share text) | ~134 |
| Activity feed / social engagement | ~65 |
| Profile / auth / KYC | ~79 |
| Opaque IDs (UUID-style, no readable key) | ~80 |
| Infrastructure / rollout / test | ~53 |
| Charity / nonprofit | ~51 |
| Fundraiser management | ~44 |
| Community / discovery | ~40 |
| Mobile / native app | ~29 |
| AI / ML | ~21 |
| Other (Braze email triggers, partner integrations) | ~250 |
| Fundraiser creation | ~5 |

### 50 most relevant flags for fundraiser / community / profile / donate / share / follow / social surfaces

```
# Sharing & Amplification
ai_share_precache
amp20-share-asset-visibility
amp21_sharesheet_ranking
amp24_agentic_share_text
amp25_sharehub_v2
amp26-podo-painted-door
amp27-podo-shareable-assets
amp28-simplified-podo
dynamic_share_text
expedited_share_ai
generate_ai_share_text
gen_ai_share_sheet_option
share_confirmation_auto_open_delay
share_text_on_fundraiser_event
share_text_persona_grouping
sharesheet_buttons_order
sharetext_anyword_deprecation
shared-fundraiser-is-viral
video_sharing
fe-ssr-generic-activity-share
fe-ssr-podo-copy-link
fe-ssr-feed-social-popup

# Activity Feed, Comments, Reactions
be_activity_feed_comment_moderation_feature
be_activity_feed_reaction_created_feature
be_activity_follow_feature
be_stream_comments_enable
fe-ssr-generic-activity-comments
fe-ssr-generic-activity-feed
fe-ssr-generic-activity-reactions
reactions_endpoints
shared-fundraiser-stream-comments
activity_feed_dsr_redaction
enabled_community_activity_types

# Follow / Social Graph
be_profile_follow_feature
be_community_organizer_auto_follow
be_vip_follows_community
native_profiles_follow_feature
social_graph_platformization_profile_followed_community
social_graph_platformization_v2_profile_relationships
social_graph_second_connection_lookup

# Community / Discovery / PYMK
be_community_digest
be_community_fundraiser_search
be_fundraiser_recommendation_good_to_recommend
donations-pymk
fe-ssr-campaign-pymk
fe-ssr-community-overview
personal-hub-discovery-module
personal_hub_cause_feed
suggested_goal_feature

# Donation / Checkout / Tipping
checkout_donate_cta_color_text_impact
checkout_recurring_nudge
donate_cta_experimentation
fe-ssr-campaign-recurring-nudge
fe-ssr-donate-smart_donations_v2026_02
fe-ssr-post-donate-redesign
global_tipping_fallback
hide_tip_slider_for_unclaimed_charities
money_box_donation_list_prompt
recurring_donations_upsell
why_to_donate_experiment
```

### Kill-switch and rollout indicators visible from the crawl

These flags correspond directly to features observed in the crawled pages:

| Flag | What it controls | Type |
|------|-----------------|------|
| `fe-ssr-generic-activity-feed` | Activity feed panel on fundraiser page | rollout |
| `fe-ssr-generic-activity-reactions` | Heart/emoji reactions on updates | rollout |
| `fe-ssr-generic-activity-comments` | Comments on activity items | rollout |
| `be_activity_follow_feature` | Backend follow event publishing | rollout |
| `amp24_agentic_share_text` | AI-generated share text in share sheet | feature flag w/ A/B |
| `amp25_sharehub_v2` | Redesigned share hub UI | feature flag w/ A/B |
| `fe-ssr-campaign-pymk` | "People you may know" donor suggestions | rollout |
| `fe-leaderboard-enabled` | Donor leaderboard widget | rollout / kill-switch |
| `suggested_goal_feature` | AI-suggested fundraising goal | rollout |
| `fe-ssr-post-donate-redesign` | Post-donation page overhaul | feature flag w/ A/B |
| `shared-fundraiser-is-viral` | "Viral" badge / algorithm trigger | rollout |
| `personal-hub-discovery-module` | Personal hub discovery feed | rollout |

---

## Experiments (307 total: 4 true A/B + 303 rollout rules)

### True A/B experiments (groups layer — full random splits)

| Key | Theme | Status |
|-----|-------|--------|
| `uc_tipping_ui` | Tip amount UI — many variants (v1–v9+) | Running |
| `uc_tipping_ui_v2` | Tip UI iteration 2 | Running |
| `fe-ssr-campaign-money-box-donation-list-prompt` | Money-box prompt above donor list | Running |
| `donation_upsell` | Post-checkout donation upsell modal | Running |

### Rollout experiment keys grouped by theme (303 named keys)

#### Donation / payments / tipping (67 keys, highlights)
`3ds_payment_method_for_recurring_donations` · `ach-fe` · `aud/cad/eur/gbp/mxn_uc_tipping_ui` · `braintree_adyen` · `checkout_donate_cta_color_text_impact` · `checkout_headers` · `daf_giving_fund_discovery_v2_td` · `fe-enable-donations-page-v2` · `fe-fundraiser-daf-upsell` · `fe-ssr-campaign-recurring-nudge` · `fe-ssr-donate-smart_donations_v2026_02` · `fe-ssr-post-donate-redesign-ab` · `gift_cards_accept_td` · `giving_fund_prod_td` · `global_tipping_fallback` · `hide_tip_slider_for_unclaimed_charities` · `payment_identity_launch_verification` · `recurring_convenience_fee_vat` · `recurring_donations_non_us` · `recurring_inline_reminder` · `recurring_saved_ach` · `stock_and_cash_td` · `uc_tipping_ui_v20250107` · `uc_tipping_ui_v20250115_international` · `yuno_recurring_donation_with_apple_pay`

#### Sharing / amplification (37 keys, highlights)
`amp10_video_sharing_abtest` · `amp12_additional_ugc_from_organizers_abtest` · `amp13_anyword_auto_abtest` · `amp14_posters_v2_test` · `amp16_connected_social_accounts_a_b_test` · `amp20-share-asset-visibility-ab` · `amp24_agentic_share_text_ab` (AI-written share copy, active) · `amp25_sharehub_v2_ab` (share hub redesign, active) · `api-amplify-for-share-urls-td` · `campaign_instagram_post_story` · `desktop_to_mobile_flow_for-igs_ab` · `fe-ssr-podo-copy-link-ab` · `generate_ai_share_text_td` · `ios_gen_ai_share_abtest` · `meta_opengraph_special_share_urls_td` · `share_text_on_fundraiser_event_td` · `shared-fundraiser-is-viral` · `sharesheet_buttons_order_td` · `video_sharing_td`

#### Activity feed / engagement (26 keys, highlights)
`auto_thanks_prompt_variations` · `be-thankyou-messaging-experiment` · `be_stream_comments_enable` · `comments_prod` · `fe-ssr-cause-end-of-feed-rule` · `fe-ssr-user-messaging` · `fe_user_messaging_thank_you_messages` · `leaderboard-partner-id-givepanel-ab-deploy-prod` · `manage_nba_habit_loop` · `nba_ranking_model_split` · `reactions_feature` · `supporters_page_nbas_td`

#### AI / personalization (13 keys)
`android_smart_goals_abtest` · `ios_smart_goals_abtest` · `anyword_suggested_fundraiser_titles_rule_copy2` · `create_ai_title` · `fundraiser_giving_text_experiment` · `generate_images` · `smart_goals_manage_flag` · `suggested_goal_feature` · `suggested_goal_fire_and_forget`

#### Community / discovery (21 keys, highlights)
`community_page` · `fe-ssr-campaign-pymk` · `fe-ssr-personal-hub-experiment` · `federated_search_a_b` · `home_page` · `personal-hub-your-network-module` · `ph_trending_network_module` · `pymk_production_xplr_fe_team` · `show_line_graph_chart`

#### Fundraiser creation / auth / onboarding / profile (combined 46 keys, highlights)
`android_create_web_flow_abtest` · `ios_create_web_flow_abtest` · `create_show_preview_and_review_v3` · `enhanced_story_feature` · `fe-ssr-smart-goals-fundraiser` · `cc_funeral_flow` · `descope_enabled` · `ios_descope_abtest` · `native_custom_onboarding_android` · `fe-susi-modal-fund-claim` · `fe-ssr-public-profiles-for-every-profile-experiment` · `fe-ssr-profiles-switcher` · `impact_dashboard` · `txn_beneficiary_invite_rollout`

---

## What this tells us for our build

1. **Donation conversion is GFM's primary optimization surface.** The 4 live A/B tests all touch the
   checkout funnel: two tip-UI variants, a money-box prompt in the donor list, and a post-checkout upsell.
   Our `Donate Intent` → `Donate Started` → `Donate Completed` funnel schema (from `docs/strategy-metrics-research.md`)
   maps directly to GFM's `campaign_page.click.pg_donate_index.btn_donate` → `checkout.success` sequence.
   Instrument the same funnel steps; the dropout between intent and payment entry is where GFM is actively
   running split tests.

2. **Share events have channel-level granularity, not just a single "Share Clicked."** GFM tracks every
   channel (facebook, whatsapp, sms, copy_link, twitter, email) as a distinct event, plus separate events
   for post-donate share vs. mid-page share. Our `Share Clicked` event should carry `share_channel` and
   `share_context` as properties — that matches their observed taxonomy and lets us replicate their
   `amp20`-series share-asset visibility experiments.

3. **The `amp*` flag series (amp8 through amp28) is a numbered roadmap of sharing improvements** spanning
   image sharing, video, AI-written copy (Anyword then agentic), connected social accounts, Instagram Story
   flows, and a unified "share hub." `amp24_agentic_share_text` and `amp25_sharehub_v2` are both active
   A/B tests. This validates that GFM treats sharing as a product discipline, not a feature; we should
   design our share surface with the same iterability in mind.

4. **Follow is instrumented as a social graph event, not just a button click.** Flags like
   `social_graph_platformization_profile_followed_community`, `be_activity_follow_feature`, and
   `be_community_organizer_auto_follow` reveal a backend social-graph service that publishes follow events
   to an activity stream. Our `Follow Clicked` event should map to a durable graph edge, and we should
   emit a corresponding feed activity — that is exactly what GFM's `be_send_activity_to_stream` flag gates.

5. **Leaderboard and PYMK ("People You May Know") are tested separately, not bundled.** Flags
   `fe-leaderboard-enabled`, `fe-leaderboard-nudges-enabled`, and `fe-ssr-campaign-pymk` are independent
   rollouts. This tells us GFM isolates their contribution to conversion; our build should do the same so
   we can measure the lift from each social-proof element independently.

6. **Smart goals / AI coach are recent and experimental.** Flags `fe-ssr-smart-goals`, `suggested_goal_feature`,
   `create_ai_title`, and `fundraiser_giving_text_experiment` are all rollout-stage. This is where GFM is
   investing in reducing organizer friction at creation. For our metrics schema, `fundraiser_created`
   (mapped from GFM's `Fundraiser Published` event) is the primary creation funnel endpoint to track.

7. **Recurring donation nudges are heavily tested.** `fe-ssr-campaign-recurring-nudge`,
   `fe-ssr-campaign-recurring-is-default`, `recurring_inline_reminder`, and multiple tipping-UI rollout
   variants indicate that recurring is a major revenue lever under active optimization. Our `frequency`
   property on `Donate Completed` (one_time vs monthly) should be tracked from day one — this is exactly
   what GFM's `3ds_payment_method_for_recurring_donations` and `recurring_donations_non_us` experiments
   are isolating.

8. **Post-donate engagement is a distinct instrumented surface.** Events `post_donate.view.lb_postdonate_share`,
   `post_donate.click.lb_postdonate_comment.btn_comment`, and the `fe-ssr-post-donate-redesign-ab` experiment
   confirm GFM treats the post-donation moment as its own conversion step (share + comment prompts). Our
   schema's `Share Clicked` with `share_context: post_donate` should be a first-class segment, not just
   another share event row.
