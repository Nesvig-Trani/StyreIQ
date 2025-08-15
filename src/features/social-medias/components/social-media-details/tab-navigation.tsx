import React from 'react'
import { TabType } from '.'

interface Tab {
  id: TabType
  label: string
  active: boolean
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, onTabChange }) => {
  return (
    <div className="bg-gray-100 p-1 rounded-lg">
      <div className="flex space-x-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab.active
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
