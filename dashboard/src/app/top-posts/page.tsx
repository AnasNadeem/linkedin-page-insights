'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { TopPostsView } from '@/components/views/TopPostsView';
import { useData } from '@/context/DataContext';

export default function TopPostsPage() {
  const { filteredPosts, loading, error } = useData();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center text-red-600 py-12">{error}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <TopPostsView posts={filteredPosts} />
    </MainLayout>
  );
}
