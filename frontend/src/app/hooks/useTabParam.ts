import { useSearchParams } from 'react-router';

/**
 * Syncs tab state to a URL search param.
 *
 * @param key - The search param key (e.g., 'tab')
 * @param defaultTab - The default tab ID if param is absent
 * @returns A tuple of [currentTab, setTab]
 *
 * @example
 * const [activeTab, setTab] = useTabParam('tab', 'overview');
 * // Reading: returns value of ?tab=<value> or 'overview' if absent
 * // Writing: setTab('this-month') → URL becomes ?tab=this-month
 */
export function useTabParam(key: string, defaultTab: string): [string, (t: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get(key) ?? defaultTab;

  const setTab = (tabId: string) => {
    setSearchParams(
      (prev) => {
        prev.set(key, tabId);
        return prev;
      },
      { replace: true },
    );
  };

  return [currentTab, setTab];
}
