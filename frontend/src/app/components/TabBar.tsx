import { useState } from 'react';
import type React from 'react';

export interface TabItem {
  id: string;
  label: string;
}

export interface TabBarProps {
  /** Array of tab definitions with id and label */
  tabs: TabItem[];
  /** ID of the currently active tab */
  active: string;
  /** Callback fired when a tab is clicked */
  onChange: (id: string) => void;
}

/**
 * A shared tab switcher component used across multiple screens.
 * Renders as a horizontal row of button tabs with visual feedback.
 *
 * Visual design:
 * - Active tab: background color var(--accent-subtle), text var(--accent-text), semibold weight
 * - Inactive tab: text color var(--tertiary), hover background var(--surface-hover), medium weight
 * - Bottom border on container: 1px solid var(--border)
 * - Font size: var(--text-sm), transitions 200ms ease on background/color
 *
 * @example
 * const [activeTab, setTab] = useTabParam('view', 'overview');
 * return (
 *   <TabBar
 *     tabs={[
 *       { id: 'overview', label: 'Overview' },
 *       { id: 'details', label: 'Details' }
 *     ]}
 *     active={activeTab}
 *     onChange={setTab}
 *   />
 * );
 */
function TabButton({
  tab,
  isActive,
  onClick,
}: {
  tab: TabItem;
  isActive: boolean;
  onClick: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      key={tab.id}
      role="tab"
      type="button"
      aria-selected={isActive}
      onClick={() => onClick(tab.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        padding: 'var(--space-2) var(--space-3)',
        fontSize: 'var(--text-sm)',
        fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
        color: isActive ? 'var(--accent-text)' : 'var(--tertiary)',
        background: isActive
          ? 'var(--accent-subtle)'
          : hovered
            ? 'var(--surface-hover)'
            : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transitionProperty: 'background-color, color',
        transitionDuration: '200ms',
        transitionTimingFunction: 'ease',
      }}
    >
      {tab.label}
    </button>
  );
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        width: '100%',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return <TabButton key={tab.id} tab={tab} isActive={isActive} onClick={onChange} />;
      })}
    </div>
  );
}
