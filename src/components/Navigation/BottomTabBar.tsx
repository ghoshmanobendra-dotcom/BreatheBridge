import { memo } from 'react';
import type { TabId } from '@/types';

interface TabItem {
  id: TabId;
  label: string;
  icon: string;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const BottomTabBar = memo(function BottomTabBar({
  tabs,
  activeTab,
  setActiveTab,
}: BottomTabBarProps) {
  return (
    <nav className="bb-bottom-bar" aria-label="Main application tabs">
      <div role="tablist" aria-label="Main navigation panels" className="flex w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-mobile-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`bb-tab-item${isActive ? ' active' : ''}`}
            >
              <span className="bb-tab-icon" aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});
