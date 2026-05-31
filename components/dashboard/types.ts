// Dashboard widget prop contracts. architecture.md §4.5.
// All types mirror the frozen seam — do not redefine; import from lib/types where possible.

import type {
  MetricNode,
  DashboardAnchor,
  SessionRow,
  SessionDetail,
  ExperimentRow,
  ActiveNowStat,
  TickerEvent,
} from '@/lib/types';
import type { PersonaSlug } from '@/lib/personas/types';

export interface MetricTreeProps {
  root: MetricNode;
  onNodeClick: (anchor: DashboardAnchor) => void;
}

export interface FunnelChartProps {
  steps: { id: string; label: string; value: number }[];
  persona: PersonaSlug | 'all';
  variant?: { control: number[]; test: number[]; ci?: string };
  onStepClick: (stepId: string) => void;
}

export interface RetentionGridProps {
  cohorts: { cohort: string; cells: { day: 1 | 7 | 14 | 30 | 60; pct: number; n: number }[] }[];
  mode: 'n_day' | 'unbounded';
}

export interface StatCardProps {
  label: string;
  value: string;
  // null = blank/placeholder state (no injected wow-delta shown) — used when the
  // demo data toggle is OFF. A number renders the delta pill.
  wowDeltaPct: number | null;
  anchor: DashboardAnchor;
  onClick?: (anchor: DashboardAnchor) => void;
}

export interface TrendsProps {
  series: { id: string; data: { x: string; y: number }[] }[];
}

export interface ReplayListProps {
  sessions: SessionRow[];
  filters: {
    persona?: PersonaSlug;
    hasError?: boolean;
    hasRageClick?: boolean;
    containsEvent?: string;
  };
  onSelect: (sessionId: string) => void;
  selectedId: string | null;
}

export interface ReplayPlayerProps {
  session: SessionDetail;
}

export interface ReplaySurfaceProps {
  sessions: SessionRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export interface EventTickerProps {
  personaFilter: PersonaSlug | 'all';
  max?: number;
}

export interface ActiveNowProps {
  stat: ActiveNowStat;
  anchor: DashboardAnchor;
}

export interface ExperimentTableProps {
  rows: ExperimentRow[];
  onRowClick: (key: string) => void;
}

// Re-export shared types used across widget files
export type { MetricNode, DashboardAnchor, SessionRow, SessionDetail, ExperimentRow, ActiveNowStat, TickerEvent };
export type { PersonaSlug };
