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
    purple: resolveCssVar('--accent'),
    teal: resolveCssVar('--green'),
    pink: resolveCssVar('--red'),
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

export function CustomNode({ x = 0, y = 0, width = 0, height = 0, index = 0, payload = { name: '' }, palette }: CustomNodeProps) {
  const colors = [palette.blue, palette.amber, palette.red, palette.lime, palette.green, palette.purple, palette.teal, palette.pink, palette.slate];
  const color = colors[index % colors.length];
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
        fill="var(--card-foreground)"
        fontSize={11}
        fontWeight={600}
        fontFamily="var(--font-body)"
      >
        {payload.name}
      </text>
      <text
        x={isLeft ? x - 8 : x + width + 10}
        y={y + height / 2 + 9}
        textAnchor={isLeft ? 'end' : 'start'}
        dominantBaseline="middle"
        fill="var(--secondary)"
        fontSize={10}
        fontFamily="var(--font-body)"
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

  return (
    <path
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={strokeColor}
      strokeWidth={Math.max(1, linkWidth * 0.9)}
      strokeOpacity={0.25}
    />
  );
}