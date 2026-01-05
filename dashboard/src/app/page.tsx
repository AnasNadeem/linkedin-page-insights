'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { OverviewView } from '@/components/views/OverviewView';
import { useData } from '@/context/DataContext';

export default function Home() {
  const { filteredPosts, loading, error } = useData();

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

  return (
    <MainLayout>
      <OverviewView posts={filteredPosts} />
    </MainLayout>
  );
}
