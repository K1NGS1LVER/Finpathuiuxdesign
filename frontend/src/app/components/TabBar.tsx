import type React from 'react';

export interface TabBarProps {
  /** Array of tab definitions with id and label */
  tabs: { id: string; label: string }[];
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
export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-selected={isActive}
            style={{
              flex: 1,
              padding: 'var(--space-2) var(--space-3)',
              fontSize: 'var(--text-sm)',
              fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
              color: isActive ? 'var(--accent-text)' : 'var(--tertiary)',
              background: isActive ? 'var(--accent-subtle)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: '200ms ease',
              transitionProperty: 'background-color, color',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
