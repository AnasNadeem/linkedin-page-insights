'use client';

import { FilterState } from '@/types/linkedin';

interface FilterBarProps {
  filters: FilterState;
  hashtags: string[];
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
}

export function FilterBar({ filters, hashtags, onFilterChange, onReset }: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Date Range
        </label>
        <select
          value={filters.dateRange}
          onChange={e => onFilterChange({ dateRange: e.target.value as FilterState['dateRange'] })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Time</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {filters.dateRange === 'custom' && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => onFilterChange({ dateFrom: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => onFilterChange({ dateTo: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Content Type
        </label>
        <select
          value={filters.contentType}
          onChange={e => onFilterChange({ contentType: e.target.value as FilterState['contentType'] })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="image">With Images</option>
          <option value="text">Text Only</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Hashtag
        </label>
        <select
          value={filters.hashtag}
          onChange={e => onFilterChange({ hashtag: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Hashtags</option>
          {hashtags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Engagement
        </label>
        <select
          value={filters.engagement}
          onChange={e => onFilterChange({ engagement: e.target.value as FilterState['engagement'] })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Levels</option>
          <option value="high">High Performers</option>
          <option value="medium">Medium</option>
          <option value="low">Low Performers</option>
        </select>
      </div>

      <button
        onClick={onReset}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );
}
