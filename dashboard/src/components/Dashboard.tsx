'use client';

import { useState } from 'react';
import { useLinkedInData } from '@/hooks/useLinkedInData';
import { getUniqueHashtags } from '@/lib/utils';
import { Sidebar } from '@/components/layout/Sidebar';
import { FilterBar } from '@/components/filters/FilterBar';
import { OverviewView } from '@/components/views/OverviewView';
import { PostsView } from '@/components/views/PostsView';
import { TopPostsView } from '@/components/views/TopPostsView';
import { EngagementView } from '@/components/views/EngagementView';
import { TimingView } from '@/components/views/TimingView';
import { HashtagsView } from '@/components/views/HashtagsView';
import { ContentView } from '@/components/views/ContentView';
import { AIView } from '@/components/views/AIView';

export function Dashboard() {
  const [activeView, setActiveView] = useState('overview');
  const { allPosts, filteredPosts, filters, updateFilters, resetFilters, loading, error } = useLinkedInData();

  const hashtags = getUniqueHashtags(allPosts);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error loading data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <OverviewView posts={filteredPosts} />;
      case 'posts':
        return <PostsView posts={filteredPosts} />;
      case 'top-posts':
        return <TopPostsView posts={filteredPosts} />;
      case 'engagement':
        return <EngagementView posts={filteredPosts} />;
      case 'timing':
        return <TimingView posts={filteredPosts} />;
      case 'hashtags':
        return <HashtagsView posts={filteredPosts} />;
      case 'content':
        return <ContentView posts={filteredPosts} />;
      case 'ai':
        return <AIView />;
      default:
        return <OverviewView posts={filteredPosts} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="ml-64 p-6">
        <FilterBar
          filters={filters}
          hashtags={hashtags}
          onFilterChange={updateFilters}
          onReset={resetFilters}
        />

        {renderView()}
      </main>
    </div>
  );
}
