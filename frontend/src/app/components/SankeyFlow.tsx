import { useMemo } from 'react';
import { Rectangle, Layer } from 'recharts';
import { formatInr } from '@/lib/format';

export type SankeyNodePayload = {
  name: string;
  value?: number;
};

export function resolveCssVar(name: string): string {
  if (typeof document === 'undefined') return '#6366f1';
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue(name).trim() || '#6366f1';
}

export function usePalette() {
  return useMemo(() => ({
    blue: resolveCssVar('--accent'),
    'blue-mid': resolveCssVar('--accent-mid'),
    'blue-soft': resolveCssVar('--accent-soft'),
    lime: resolveCssVar('--tertiary-accent'),
    red: resolveCssVar('--red'),
    amber: resolveCssVar('--amber'),
    green: resolveCssVar('--green'),
    purple: resolveCssVar('--secondary-accent'),
    slate: resolveCssVar('--tertiary'),
  }), []);
}

export interface CustomNodeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: SankeyNodePayload;
  palette: Record<string, string>;
  hoveredNodeIdx?: number | null;
  activeNodeIdx?: number | null;
  onNodeHover?: (idx: number, x: number, y: number, w: number, h: number) => void;
  onNodeUnhover?: () => void;
  onNodeClick?: (idx: number, x: number, y: number, w: number, h: number) => void;
}

const NODE_COLOR_KEYS: Record<string, keyof ReturnType<typeof usePalette>> = {
  'Income':              'blue',
  'Primary Income':      'blue',
  'Secondary Income':    'blue-mid',
  'Passive Income':      'blue-soft',
  'Variable Income':     'blue-soft',
  'Total Income':        'blue',
  'Essential Expenses':  'amber',
  'Debt & Savings':      'red',
  'Disposable':          'green',
  'Housing & Utilities': 'amber',
  'Food':                'amber',
  'Transport':           'amber',
  'Other Expenses':      'amber',
  'Debt Payments':       'red',
  'Goals Progress':      'lime',
  'Surplus Reserve':     'purple',
  'Free Cash':           'green',
};

export function CustomNode({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index: nodeIndex = 0,
  payload = { name: '' },
  palette,
  hoveredNodeIdx = null,
  onNodeHover,
  onNodeUnhover,
  onNodeClick,
}: CustomNodeProps) {
  const colorKey = NODE_COLOR_KEYS[payload.name] ?? 'slate';
  const color = palette[colorKey];
  const isLeft = x < 280;

  const isHovered = hoveredNodeIdx !== null && nodeIndex === hoveredNodeIdx;
  const isDimmed = hoveredNodeIdx !== null && !isHovered;

  const rectStyle: React.CSSProperties = {
    transition: 'all 0.15s ease',
    ...(isHovered
      ? {
          filter: `drop-shadow(0 0 8px ${color})`,
          transform: 'scaleY(1.12)',
          transformOrigin: 'center',
        }
      : {}),
  };

  return (
    <g
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => onNodeHover?.(nodeIndex, x, y, width, height)}
      onMouseLeave={() => onNodeUnhover?.()}
      onClick={() => onNodeClick?.(nodeIndex, x, y, width, height)}
    >
      <Layer>
        <Rectangle
          x={x}
          y={y}
          width={width}
          height={Math.max(height, 1)}
          fill={color}
          fillOpacity={isDimmed ? 0.25 : 0.88}
          stroke={color}
          strokeWidth={0.5}
          radius={[4, 4, 4, 4]}
          style={rectStyle}
        />
        <text
          x={isLeft ? x - 8 : x + width + 10}
          y={y + height / 2 - 7}
          textAnchor={isLeft ? 'end' : 'start'}
          dominantBaseline="middle"
          style={{ fill: 'var(--card-foreground)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', fontFamily: 'var(--font-body)' }}
        >
          {payload.name}
        </text>
        <text
          x={isLeft ? x - 8 : x + width + 10}
          y={y + height / 2 + 9}
          textAnchor={isLeft ? 'end' : 'start'}
          dominantBaseline="middle"
          style={{ fill: 'var(--secondary)', fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-body)' }}
        >
          {formatInr(payload.value ?? 0)}
        </text>
      </Layer>
    </g>
  );
}

export interface CustomLinkProps {
  sourceX?: number;
  sourceY?: number;
  sourceControlX?: number;
  targetX?: number;
  targetY?: number;
  targetControlX?: number;
  linkWidth?: number;
  index?: number;
  payload?: {
    source?: SankeyNodePayload & { index?: number };
    target?: SankeyNodePayload & { index?: number };
  };
  palette: Record<string, string>;
  hoveredNodeIdx?: number | null;
  hoveredLinkIdx?: number | null;
  activeNodeIdx?: number | null;
  onLinkHover?: (idx: number) => void;
  onLinkUnhover?: () => void;
}

export function CustomLink({
  sourceX = 0,
  sourceY = 0,
  sourceControlX = 0,
  targetX = 0,
  targetY = 0,
  targetControlX = 0,
  linkWidth = 0,
  index = 0,
  payload = {},
  palette,
  hoveredNodeIdx = null,
  onLinkHover,
  onLinkUnhover,
}: CustomLinkProps) {
  let strokeColor = palette.slate;
  const srcName = payload.source?.name ?? '';
  const tgtName = payload.target?.name ?? '';
  if (srcName.includes('Income')) {
    const tgtAlsoIncome = tgtName.includes('Income');
    if (tgtAlsoIncome) {
      const srcKey = NODE_COLOR_KEYS[srcName] ?? 'blue';
      strokeColor = palette[srcKey];
    } else if (tgtName === 'Essential Expenses') {
      strokeColor = palette.amber;
    } else if (tgtName === 'Debt & Savings') {
      strokeColor = palette.red;
    } else if (tgtName === 'Disposable') {
      strokeColor = palette.green;
    }
  } else if (srcName === 'Essential Expenses') {
    strokeColor = palette.amber;
  } else if (srcName === 'Debt & Savings') {
    strokeColor = palette.red;
  } else if (srcName === 'Disposable') {
    strokeColor = palette.green;
  }

  // Recharts may pass source/target as node objects with .index or as numbers
  const rawSrc = payload.source;
  const rawTgt = payload.target;
  const sourceIdx: number | null = rawSrc == null
    ? null
    : typeof rawSrc === 'object' && 'index' in rawSrc
      ? (rawSrc.index ?? null)
      : (rawSrc as unknown as number);
  const targetIdx: number | null = rawTgt == null
    ? null
    : typeof rawTgt === 'object' && 'index' in rawTgt
      ? (rawTgt.index ?? null)
      : (rawTgt as unknown as number);

  const isActive = hoveredNodeIdx !== null &&
    (sourceIdx === hoveredNodeIdx || targetIdx === hoveredNodeIdx);

  const fillOpacity = isActive
    ? 0.72
    : hoveredNodeIdx !== null
      ? 0.08
      : 0.35;

  const hw = linkWidth / 2;
  const bandPath = [
    `M${sourceX},${sourceY - hw}`,
    `C${sourceControlX},${sourceY - hw} ${targetControlX},${targetY - hw} ${targetX},${targetY - hw}`,
    `L${targetX},${targetY + hw}`,
    `C${targetControlX},${targetY + hw} ${sourceControlX},${sourceY + hw} ${sourceX},${sourceY + hw}`,
    'Z',
  ].join(' ');

  return (
    <path
      d={bandPath}
      fill={strokeColor}
      fillOpacity={fillOpacity}
      stroke="none"
      style={{ cursor: 'pointer', transition: 'fill-opacity 0.15s ease' }}
      onMouseEnter={() => onLinkHover?.(index)}
      onMouseLeave={() => onLinkUnhover?.()}
    />
  );
}
