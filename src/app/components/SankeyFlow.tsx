import { useMemo } from 'react';
import { Rectangle, Layer } from 'recharts';

export type SankeyNodePayload = {
  name: string;
  value?: number;
};

export const formatInr = (value: number) =>
  `₹${Math.round(Math.max(0, value)).toLocaleString('en-IN')}`;

export function resolveCssVar(name: string): string {
  if (typeof document === 'undefined') return '#6366f1';
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue(name).trim() || '#6366f1';
}

export function usePalette() {
  return useMemo(() => ({
    blue: resolveCssVar('--accent'),
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
}

const NODE_COLOR_KEYS: Record<string, keyof ReturnType<typeof usePalette>> = {
  'Income':              'blue',
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

export function CustomNode({ x = 0, y = 0, width = 0, height = 0, index: _index = 0, payload = { name: '' }, palette }: CustomNodeProps) {
  const colorKey = NODE_COLOR_KEYS[payload.name] ?? 'slate';
  const color = palette[colorKey];
  const isLeft = x < 280;

  return (
    <Layer>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={Math.max(height, 1)}
        fill={color}
        fillOpacity={0.88}
        stroke={color}
        strokeWidth={0.5}
        radius={[4, 4, 4, 4]}
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
  payload?: { source?: SankeyNodePayload; target?: SankeyNodePayload };
  palette: Record<string, string>;
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
}: CustomLinkProps) {
  let strokeColor = palette.slate;
  const srcName = payload.source?.name ?? '';
  const tgtName = payload.target?.name ?? '';
  if (srcName === 'Income') {
    if (tgtName === 'Essential Expenses') strokeColor = palette.amber;
    else if (tgtName === 'Debt & Savings') strokeColor = palette.red;
    else if (tgtName === 'Disposable') strokeColor = palette.green;
  } else if (srcName === 'Essential Expenses') {
    strokeColor = palette.amber;
  } else if (srcName === 'Debt & Savings') {
    strokeColor = palette.red;
  } else if (srcName === 'Disposable') {
    strokeColor = palette.green;
  }

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
      fillOpacity={0.35}
      stroke="none"
    />
  );
}