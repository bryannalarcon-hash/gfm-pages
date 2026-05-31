'use client';
// W1 — Metric Tree using @nivo/tree
// Renders the 3-tier metric hierarchy. Nodes use tier colors matching the overlay.
// Tier 1 = gold (#ffd863), Tier 2 = green (#4a9d44), guardrail = grey (#b7b7b6).
// onNodeClick(anchor) scrolls to the target widget.

import { useState } from 'react';
import { ResponsiveTree } from '@nivo/tree';
import type { ComputedNode, ComputedLink, DefaultDatum } from '@nivo/tree';
import type { MetricTreeProps } from './types';
import type { MetricNode, DashboardAnchor } from '@/lib/types';

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;

const TIER_COLORS: Record<string, string> = {
  '1': '#ffd863',
  '2': '#4a9d44',
  guardrail: '#b7b7b6',
};

// Nivo tree DefaultDatum compatible: value must be number if present.
// We embed extra fields using a discriminated interface that satisfies DefaultDatum.
type TreeNode = DefaultDatum & {
  id: string;
  metricLabel: string;
  metricValue: string;
  tier: string;
  anchor: DashboardAnchor;
  children?: TreeNode[];
};

function toTreeNode(node: MetricNode): TreeNode {
  return {
    id: node.id,
    metricLabel: node.label,
    metricValue: node.value,
    tier: node.tier,
    anchor: node.anchor,
    children: node.children?.map(toTreeNode),
  };
}

// Extract our extra fields from the opaque Nivo data object.
function asTreeNode(d: unknown): TreeNode {
  return d as TreeNode;
}

export function MetricTree({ root, onNodeClick }: MetricTreeProps) {
  const treeData = toTreeNode(root);
  const [scale, setScale] = useState(1);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const noop = () => undefined;

  function zoomIn() {
    setScale((s) => Math.min(parseFloat((s + ZOOM_STEP).toFixed(2)), ZOOM_MAX));
  }
  function zoomOut() {
    setScale((s) => Math.max(parseFloat((s - ZOOM_STEP).toFixed(2)), ZOOM_MIN));
  }
  function resetZoom() {
    setScale(1);
  }

  return (
    <div
      id="metric-tree"
      style={{ width: '100%', position: 'relative' }}
      aria-label="Metric hierarchy tree"
    >
      {/* Zoom controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={zoomOut}
          aria-label="Zoom out"
          style={{
            width: 28,
            height: 28,
            border: '1px solid #e8e8e8',
            borderRadius: 6,
            background: '#f5f5f5',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            color: '#232323',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          −
        </button>
        <button
          onClick={zoomIn}
          aria-label="Zoom in"
          style={{
            width: 28,
            height: 28,
            border: '1px solid #e8e8e8',
            borderRadius: 6,
            background: '#f5f5f5',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            color: '#232323',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
        <button
          onClick={resetZoom}
          aria-label="Reset zoom"
          style={{
            padding: '4px 10px',
            border: '1px solid #e8e8e8',
            borderRadius: 6,
            background: '#f5f5f5',
            cursor: 'pointer',
            fontSize: 11,
            color: '#6f6f6f',
          }}
        >
          Reset
        </button>
        <span style={{ fontSize: 11, color: '#9e9e9e', minWidth: 36, textAlign: 'right' }}>
          {Math.round(scale * 100)}%
        </span>
      </div>
      {/* Zoom container — CSS transform scale applied here */}
      <div
        data-testid="metric-tree-zoom-container"
        data-scale={scale}
        style={{
          height: 420,
          transformOrigin: 'top center',
          transform: `scale(${scale})`,
          transition: 'transform 0.2s',
          overflow: 'visible',
        }}
      >
        <ResponsiveTree<TreeNode>
          data={treeData}
          identity="id"
          activeNodeSize={24}
          inactiveNodeSize={16}
          nodeSize={20}
          fixNodeColorAtDepth={0}
          motionConfig="stiff"
          meshDetectionRadius={80}
          mode="tree"
          layout="top-to-bottom"
          nodeColor={(node) => {
            const d = asTreeNode(node.data);
            return TIER_COLORS[d.tier] ?? '#b7b7b6';
          }}
          linkThickness={2}
          activeLinkThickness={4}
          linkColor={{ from: 'source.color', modifiers: [] }}
          nodeTooltip={({ node }: { node: ComputedNode<TreeNode> }) => {
            const d = asTreeNode(node.data);
            const bg = TIER_COLORS[d.tier] ?? '#b7b7b6';
            const textColor = d.tier === '2' ? '#fff' : '#333';
            return (
              <div
                style={{
                  background: bg,
                  color: textColor,
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  maxWidth: 220,
                }}
              >
                <div style={{ fontWeight: 700 }}>{d.metricLabel}</div>
                <div style={{ opacity: 0.85 }}>{d.metricValue}</div>
              </div>
            );
          }}
          onNodeClick={(node: ComputedNode<TreeNode>) => {
            const d = asTreeNode(node.data);
            onNodeClick(d.anchor);
          }}
          // Required link event handlers (no-op — we don't need link interaction)
          onLinkMouseEnter={noop}
          onLinkMouseMove={noop}
          onLinkMouseLeave={noop}
          onLinkClick={noop}
          linkTooltip={({ link }: { link: ComputedLink<TreeNode> }) => {
            void link;
            return null as any;
          }}
          linkTooltipAnchor="top"
          enableLabel
          label={(node: ComputedNode<TreeNode>) => asTreeNode(node.data).metricLabel}
          labelsPosition="outward"
          labelOffset={8}
          theme={{
            labels: {
              text: {
                fontSize: 10,
                fontWeight: 600,
                fill: '#333',
              },
            },
          }}
        />
      </div>
    </div>
  );
}
