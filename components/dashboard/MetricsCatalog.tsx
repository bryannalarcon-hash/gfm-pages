'use client';
// CB-11: Metrics Catalog — surfaces event names, flag names, and capture sites
// for every canonical event in strategy-metrics-research.md §4.
//
// Names MIRROR §4/lib/types.ts exactly — never redefined here.
// Capture sites are human-readable descriptions of where each event fires.
// No internal indices (CB-/W#/§/D#/persona slugs) appear in rendered output.

import React, { useState } from 'react';
import type { EventName } from '@/lib/types';

// ── Data model ────────────────────────────────────────────────────────────────

export interface CatalogEvent {
  name: EventName;
  capturesite: string; // human-readable source description
  keyProps: string | string[]; // key properties emitted with this event
}

export interface CatalogFlag {
  flagKey: string;
  description: string; // human label for the experiment
  capturesite: string; // where the variant assignment is evaluated
}

// ── Canonical event catalog (mirrors §4, never redefines names) ──────────────

export const CATALOG_EVENTS: CatalogEvent[] = [
  // Fundraiser funnel
  {
    name: 'Page Viewed',
    capturesite: 'Fundraiser page — fires on mount in the fundraiser page component',
    keyProps: 'referrer_source',
  },
  {
    name: 'Story Scrolled',
    capturesite: 'Fundraiser page — IntersectionObserver on the story section, triggers at >50% visible',
    keyProps: ['scroll_depth_pct', 'time_on_page_sec'],
  },
  {
    name: 'Donate Intent',
    capturesite: 'DonationCard — fired when the user clicks any donate CTA button',
    keyProps: 'cta_location (hero / sticky / bottom)',
  },
  {
    name: 'Amount Selected',
    capturesite: 'DonationCard — fired when the user picks a preset amount or types a custom amount',
    keyProps: ['amount_usd', 'selection_type (preset/custom)', 'frequency (one_time/monthly)'],
  },
  {
    name: 'Donate Started',
    capturesite: 'DonationCard — fired when the payment form renders after amount entry',
    keyProps: ['amount_usd', 'payment_method_type'],
  },
  {
    name: 'Donate Completed',
    capturesite: 'DonationCard — fired on successful mock checkout confirmation',
    keyProps: ['amount_usd', 'payment_method_type', 'frequency', 'tip_amount_usd', 'tip_preset_label', 'attributed_share_id'],
  },
  {
    name: 'Donate Failed',
    capturesite: 'DonationCard — fired when the mock checkout returns an error state',
    keyProps: ['error_code', 'amount_usd'],
  },
  {
    name: 'Share Clicked',
    capturesite: 'ShareSheet component — fired on every share channel button click across all share surfaces',
    keyProps: ['share_channel (facebook/x/whatsapp/messenger/sms/email/copy_link/native_share/embed)', 'share_context', 'share_id'],
  },
  {
    name: 'Follow Clicked',
    capturesite: 'FollowButton component — fired when the user clicks the follow CTA',
    keyProps: 'follow_context (post_donate / sidebar / header)',
  },
  // Post-donate group
  {
    name: 'Post Donate Viewed',
    capturesite: 'Post-donate screen — fires on mount of the post-donation success screen',
    keyProps: ['amount_usd', 'frequency', 'first_time_donor'],
  },
  {
    name: 'Post Donate Share Clicked',
    capturesite: 'Post-donate screen — ShareSheet fired from the post-donation share surface',
    keyProps: ['share_channel', 'time_since_donate_sec'],
  },
  {
    name: 'Post Donate Recurring Upgrade Clicked',
    capturesite: 'Post-donate screen — fires on the one-time to monthly upgrade CTA tap',
    keyProps: ['current_amount_usd', 'proposed_amount_usd'],
  },
  {
    name: 'Post Donate Follow Clicked',
    capturesite: 'Post-donate screen — fires when the user taps the follow organizer or community button',
    keyProps: 'follow_target (organizer / community)',
  },
  {
    name: 'Post Donate Dismissed',
    capturesite: 'Post-donate screen — fires when the user leaves without taking a secondary action',
    keyProps: 'time_on_screen_sec',
  },
  // Community and Profile
  {
    name: 'Community Followed',
    capturesite: 'Community page — fires on the community follow button click',
    keyProps: 'referrer_source',
  },
  {
    name: 'Update Read',
    capturesite: 'Community page — IntersectionObserver on update cards, fires when an update is read',
    keyProps: 'referrer_source',
  },
  {
    name: 'Fundraiser Clicked Through',
    capturesite: 'Community page — fires on click of a fundraiser card linking to a fundraiser',
    keyProps: 'referrer_source',
  },
  // Board and Mark events
  {
    name: 'Section Viewed',
    capturesite: 'Fundraiser page — IntersectionObserver fires when an instrumented section scrolls into view (replaces per-slot impression events)',
    keyProps: 'section_name (returning_banner / activity_feed / pymk / recurring_nudge / suns_board)',
  },
  {
    name: 'Mark Created',
    capturesite: 'Contribution board — fires when a sun mark is first placed by a user action',
    keyProps: ['action_type (follow/share/give)', 'entity_type', 'persona'],
  },
  {
    name: 'Mark Customized',
    capturesite: 'Contribution board — fires when the user changes the gradient or color of their sun',
    keyProps: ['gradient_id', 'stops (1–3)'],
  },
  {
    name: 'Mark Grew',
    capturesite: 'Contribution board — fires when a sun size increases due to a settled donation',
    keyProps: 'trigger (own_gift / referred_gift)',
  },
  {
    name: 'Mark Shared',
    capturesite: 'Contribution board — fires when the user shares the board or their own sun as an artifact',
    keyProps: 'share_channel',
  },
  // Community interactions
  {
    name: 'Fundraiser Filter Applied',
    capturesite: 'Community page — fires when the user changes the filter on the fundraisers tab',
    keyProps: ['filter_type', 'filter_value'],
  },
  {
    name: 'Start Fundraiser Clicked',
    capturesite: 'Community page — fires when the user clicks the "Start a fundraiser" CTA',
    keyProps: 'cta_location',
  },
];

// ── Feature flag catalog (experiment flags mirrored from EXPERIMENT_ROWS) ─────

export const CATALOG_FLAGS: CatalogFlag[] = [
  {
    flagKey: 'uc_tipping_ui',
    description: 'Tip preset layout experiment — tests different tip amount presets and checkout UI on the donation flow',
    capturesite: 'DonationCard — variant assigned at donation form render; goal metric is Donate Completed conversion rate',
  },
  {
    flagKey: 'post_donate_share_prompt',
    description: 'Post-donate share prompt experiment — tests placement and copy of the share CTA on the success screen',
    capturesite: 'Post-donate screen — variant assigned on post-donate mount; goal metric is Post Donate Share Clicked rate',
  },
  {
    flagKey: 'share_channel_reorder',
    description: 'Share channel order experiment — tests reordering share buttons to surface higher-conversion channels first',
    capturesite: 'ShareSheet component — variant assigned at share sheet open; goal metric is Share Clicked conversion',
  },
  {
    flagKey: 'progress_bar_urgency_copy',
    description: 'Progress bar urgency copy experiment — tests goal-gradient copy variants when campaign is near its target',
    capturesite: 'Fundraiser page progress bar — variant assigned on page load; goal metric is Donate Completed conversion rate',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function MetricsCatalog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'flags'>('events');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  function toggleEventRow(name: string) {
    setExpandedEvent((prev) => (prev === name ? null : name));
  }

  return (
    <section
      aria-labelledby="metrics-catalog-heading"
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e8e8e8',
        marginBottom: 20,
        overflow: 'hidden',
      }}
      data-testid="metrics-catalog"
    >
      {/* Header / toggle */}
      <button
        id="metrics-catalog-heading"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '18px 24px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 10,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 16,
            height: 16,
            borderRadius: 4,
            background: '#ffd863',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 16, fontWeight: 700, color: '#232323', flex: 1 }}>
          Metrics Catalog
        </span>
        <span style={{ fontSize: 12, color: '#9e9e9e' }}>
          {CATALOG_EVENTS.length} events · {CATALOG_FLAGS.length} flags
        </span>
        <span
          aria-hidden="true"
          style={{
            fontSize: 14,
            color: '#6f6f6f',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #e8e8e8' }}>
          {/* Tab bar */}
          <div
            role="tablist"
            aria-label="Catalog sections"
            style={{
              display: 'flex',
              gap: 0,
              borderBottom: '1px solid #e8e8e8',
              padding: '0 24px',
            }}
          >
            {(['events', 'flags'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #232323' : '2px solid transparent',
                  background: 'transparent',
                  fontWeight: activeTab === tab ? 700 : 400,
                  fontSize: 13,
                  color: activeTab === tab ? '#232323' : '#6f6f6f',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
              >
                {tab === 'events' ? `Events (${CATALOG_EVENTS.length})` : `Feature Flags (${CATALOG_FLAGS.length})`}
              </button>
            ))}
          </div>

          {/* Events tab */}
          {activeTab === 'events' && (
            <div
              role="tabpanel"
              aria-label="Event catalog"
              style={{ padding: '16px 24px 20px', overflowX: 'auto' }}
            >
              <p style={{ fontSize: 12, color: '#9e9e9e', margin: '0 0 14px' }}>
                All event names match the canonical schema in the metrics strategy doc.
                Each row shows the event name, where it is fired, and the key properties it carries.
              </p>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 12,
                }}
                aria-label="Event names and capture sites"
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #e8e8e8' }}>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px 6px 0',
                        fontWeight: 700,
                        color: '#232323',
                        whiteSpace: 'nowrap',
                        width: '22%',
                      }}
                    >
                      Event Name
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        fontWeight: 700,
                        color: '#232323',
                        width: '42%',
                      }}
                    >
                      Capture Site
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px 0 6px 10px',
                        fontWeight: 700,
                        color: '#232323',
                      }}
                    >
                      Key Properties
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CATALOG_EVENTS.map((entry, i) => {
                    const isExpanded = expandedEvent === entry.name;
                    return (
                      <React.Fragment key={entry.name}>
                        <tr
                          style={{
                            borderBottom: isExpanded ? 'none' : '1px solid #f0f0f0',
                            background: i % 2 === 0 ? 'transparent' : '#fafafa',
                          }}
                        >
                          <td
                            style={{
                              padding: '8px 10px 8px 0',
                              fontWeight: 600,
                              color: '#232323',
                              fontFamily: 'monospace',
                              fontSize: 11,
                              verticalAlign: 'top',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <button
                              onClick={() => toggleEventRow(entry.name)}
                              aria-expanded={isExpanded}
                              aria-label={entry.name}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 600,
                                color: '#232323',
                                fontFamily: 'monospace',
                                fontSize: 11,
                                padding: 0,
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                              }}
                            >
                              <span
                                aria-hidden="true"
                                style={{
                                  fontSize: 10,
                                  color: '#9e9e9e',
                                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.15s',
                                  display: 'inline-block',
                                }}
                              >
                                ▶
                              </span>
                              {entry.name}
                            </button>
                          </td>
                          <td
                            style={{
                              padding: '8px 10px',
                              color: '#444',
                              verticalAlign: 'top',
                              lineHeight: 1.5,
                            }}
                          >
                            {entry.capturesite}
                          </td>
                          <td
                            style={{
                              padding: '8px 0 8px 10px',
                              color: '#6f6f6f',
                              verticalAlign: 'top',
                              lineHeight: 1.5,
                              fontFamily: 'monospace',
                              fontSize: 11,
                            }}
                          >
                            {Array.isArray(entry.keyProps)
                              ? entry.keyProps.join(', ')
                              : entry.keyProps}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr
                            style={{
                              borderBottom: '1px solid #f0f0f0',
                              background: i % 2 === 0 ? '#f9f6e8' : '#f5f2e0',
                            }}
                          >
                            <td
                              colSpan={3}
                              style={{ padding: '0 0 12px 0' }}
                            >
                              <div
                                data-testid="event-row-detail"
                                style={{
                                  margin: '0 0 0 24px',
                                  padding: '12px 16px',
                                  background: '#fff8e8',
                                  border: '1px solid #ffd863',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  lineHeight: 1.6,
                                }}
                              >
                                <div style={{ fontWeight: 700, color: '#232323', marginBottom: 6 }}>
                                  {entry.name}
                                </div>
                                <div style={{ marginBottom: 4 }}>
                                  <span style={{ fontWeight: 600, color: '#444' }}>Capture site: </span>
                                  <span style={{ color: '#444' }}>{entry.capturesite}</span>
                                </div>
                                <div>
                                  <span style={{ fontWeight: 600, color: '#444' }}>Key properties: </span>
                                  <span style={{ color: '#6f6f6f', fontFamily: 'monospace', fontSize: 11 }}>
                                    {Array.isArray(entry.keyProps)
                                      ? entry.keyProps.join(', ')
                                      : entry.keyProps}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Flags tab */}
          {activeTab === 'flags' && (
            <div
              role="tabpanel"
              aria-label="Feature flag catalog"
              style={{ padding: '16px 24px 20px', overflowX: 'auto' }}
            >
              <p style={{ fontSize: 12, color: '#9e9e9e', margin: '0 0 14px' }}>
                Feature flag keys used in running experiments. Each flag key is the single identifier
                used in the experiment table and in the analytics event properties.
              </p>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 12,
                }}
                aria-label="Feature flag names and descriptions"
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #e8e8e8' }}>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px 6px 0',
                        fontWeight: 700,
                        color: '#232323',
                        whiteSpace: 'nowrap',
                        width: '24%',
                      }}
                    >
                      Flag Key
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        fontWeight: 700,
                        color: '#232323',
                        width: '38%',
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px 0 6px 10px',
                        fontWeight: 700,
                        color: '#232323',
                      }}
                    >
                      Capture Site
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CATALOG_FLAGS.map((flag, i) => (
                    <tr
                      key={flag.flagKey}
                      style={{
                        borderBottom: '1px solid #f0f0f0',
                        background: i % 2 === 0 ? 'transparent' : '#fafafa',
                      }}
                    >
                      <td
                        style={{
                          padding: '8px 10px 8px 0',
                          fontWeight: 600,
                          color: '#232323',
                          fontFamily: 'monospace',
                          fontSize: 11,
                          verticalAlign: 'top',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {flag.flagKey}
                      </td>
                      <td
                        style={{
                          padding: '8px 10px',
                          color: '#444',
                          verticalAlign: 'top',
                          lineHeight: 1.5,
                        }}
                      >
                        {flag.description}
                      </td>
                      <td
                        style={{
                          padding: '8px 0 8px 10px',
                          color: '#6f6f6f',
                          verticalAlign: 'top',
                          lineHeight: 1.5,
                        }}
                      >
                        {flag.capturesite}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
