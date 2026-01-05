'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { getUniqueHashtags } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Star,
  TrendingUp,
  Clock,
  Hash,
  MessageSquare,
  Sparkles,
  Filter,
  X,
  ChevronDown
} from 'lucide-react';
import { UserMenu } from './UserMenu';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard, section: 'Analytics' },
  { href: '/posts', label: 'All Posts', icon: FileText, section: 'Analytics' },
  { href: '/top-posts', label: 'Top Performers', icon: Star, section: 'Analytics' },
  { href: '/engagement', label: 'Engagement', icon: TrendingUp, section: 'Analytics' },
  { href: '/timing', label: 'Best Time to Post', icon: Clock, section: 'Insights' },
  { href: '/hashtags', label: 'Hashtag Analysis', icon: Hash, section: 'Insights' },
  { href: '/content', label: 'Content Analysis', icon: MessageSquare, section: 'Insights' },
];

interface MainLayoutProps {
  children: ReactNode;
  showFilters?: boolean;
}

export function MainLayout({ children, showFilters = true }: MainLayoutProps) {
  const pathname = usePathname();
  const { allPosts, filteredPosts, filters, updateFilters, resetFilters, analytics, baseAvgImpressions } = useData();

  const hashtags = getUniqueHashtags(allPosts);
  const sections = [...new Set(navItems.map(item => item.section))];

  const hasActiveFilters = filters.dateRange !== 'all' ||
    filters.contentType !== 'all' ||
    filters.hashtag !== 'all' ||
    filters.engagement !== 'all';

  // Count active filters
  const activeFilterCount = [
    filters.dateRange !== 'all',
    filters.contentType !== 'all',
    filters.hashtag !== 'all',
    filters.engagement !== 'all'
  ].filter(Boolean).length;

  // Get filter labels for active filters
  const getActiveFilterLabels = () => {
    const labels: string[] = [];
    if (filters.dateRange !== 'all') {
      labels.push(filters.dateRange === 'custom' ? 'Custom Date' : `Last ${filters.dateRange} days`);
    }
    if (filters.contentType !== 'all') {
      labels.push(filters.contentType === 'image' ? 'With Images' : 'Text Only');
    }
    if (filters.hashtag !== 'all') {
      labels.push(filters.hashtag);
    }
    if (filters.engagement !== 'all') {
      labels.push(`${filters.engagement.charAt(0).toUpperCase() + filters.engagement.slice(1)} Engagement`);
    }
    return labels;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-white border-r border-gray-200 overflow-y-auto z-50">
        <div className="p-5 border-b border-gray-200">
          <Link href="/" className="block">
            <h1 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              LinkedIn Insights
            </h1>
          </Link>
          <span className="text-xs text-gray-500">Page Analytics Dashboard</span>
        </div>

        {/* Quick Stats */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-white rounded-lg p-2">
              <div className="text-lg font-bold text-gray-900">{filteredPosts.length}</div>
              <div className="text-[10px] text-gray-500 uppercase">Posts</div>
            </div>
            <div className="bg-white rounded-lg p-2">
              <div className="text-lg font-bold text-gray-900">{Math.round(analytics.avgImpressions).toLocaleString()}</div>
              <div className="text-[10px] text-gray-500 uppercase">Avg Views</div>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-2 text-xs text-center text-blue-600">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </div>
          )}
        </div>

        <nav className="py-4">
          {sections.map(section => (
            <div key={section} className="mb-4 px-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                {section}
              </h3>
              {navItems
                .filter(item => item.section === section)
                .map(item => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon size={20} />
                      {item.label}
                    </Link>
                  );
                })}
            </div>
          ))}

          <div className="px-3 mb-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Coming Soon
            </h3>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 cursor-not-allowed">
              <Sparkles size={20} />
              AI Insights
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Filters Bar */}
        {showFilters && (
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Filter size={16} />
                Filters
                {hasActiveFilters && (
                  <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>

              <select
                value={filters.dateRange}
                onChange={e => {
                  console.log('Date range changed to:', e.target.value);
                  updateFilters({ dateRange: e.target.value as any });
                }}
                className={cn(
                  "px-3 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                  filters.dateRange !== 'all' ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-gray-300 text-gray-900'
                )}
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>

              <select
                value={filters.contentType}
                onChange={e => {
                  console.log('Content type changed to:', e.target.value);
                  updateFilters({ contentType: e.target.value as any });
                }}
                className={cn(
                  "px-3 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                  filters.contentType !== 'all' ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-gray-300 text-gray-900'
                )}
              >
                <option value="all">All Types</option>
                <option value="image">With Images</option>
                <option value="text">Text Only</option>
              </select>

              <select
                value={filters.hashtag}
                onChange={e => {
                  console.log('Hashtag changed to:', e.target.value);
                  updateFilters({ hashtag: e.target.value });
                }}
                className={cn(
                  "px-3 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                  filters.hashtag !== 'all' ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-gray-300 text-gray-900'
                )}
              >
                <option value="all">All Hashtags</option>
                {hashtags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>

              <select
                value={filters.engagement}
                onChange={e => {
                  console.log('Engagement changed to:', e.target.value);
                  updateFilters({ engagement: e.target.value as any });
                }}
                className={cn(
                  "px-3 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                  filters.engagement !== 'all' ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-gray-300 text-gray-900'
                )}
              >
                <option value="all">All Engagement</option>
                <option value="high">High (&gt;{Math.round(baseAvgImpressions * 1.5)} views)</option>
                <option value="medium">Medium ({Math.round(baseAvgImpressions * 0.5)}-{Math.round(baseAvgImpressions * 1.5)} views)</option>
                <option value="low">Low (&lt;{Math.round(baseAvgImpressions * 0.5)} views)</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    console.log('Clearing all filters');
                    resetFilters();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                >
                  <X size={14} />
                  Clear All
                </button>
              )}

              <div className="ml-auto flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-gray-900">{filteredPosts.length}</span> of {allPosts.length} posts
                </span>
                <UserMenu />
              </div>
            </div>

            {/* Active filter tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100">
                {getActiveFilterLabels().map((label, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
