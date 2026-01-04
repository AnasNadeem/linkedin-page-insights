'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Post, FilterState, LinkedInData } from '@/types/linkedin';
import { getMetric, getHashtags, hasImages, calculateAvgMetric } from '@/lib/utils';

const defaultFilters: FilterState = {
  dateRange: 'all',
  dateFrom: '',
  dateTo: '',
  contentType: 'all',
  hashtag: 'all',
  engagement: 'all'
};

interface DataContextType {
  allPosts: Post[];
  filteredPosts: Post[];
  filters: FilterState;
  updateFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  loading: boolean;
  error: string | null;
  analytics: {
    totalPosts: number;
    totalImpressions: number;
    totalReactions: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate: number;
    avgImpressions: number;
    avgReactions: number;
    postsWithImages: number;
    avgPostLength: number;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/fleetzz_data.json');
        if (!response.ok) throw new Error('Failed to load data');
        const data: LinkedInData = await response.json();
        setAllPosts(data.data.posts.edges.map(edge => edge.node));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const avgImpressions = useMemo(() => calculateAvgMetric(allPosts, 'impressions'), [allPosts]);

  const filteredPosts = useMemo(() => {
    return allPosts.filter(post => {
      // Date filter
      if (filters.dateRange !== 'all' && filters.dateRange !== 'custom') {
        const days = parseInt(filters.dateRange);
        const postDate = new Date(post.sentAt);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        if (postDate < cutoff) return false;
      }

      if (filters.dateRange === 'custom') {
        const postDate = new Date(post.sentAt);
        if (filters.dateFrom && postDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && postDate > new Date(filters.dateTo)) return false;
      }

      // Content type filter
      if (filters.contentType !== 'all') {
        const postHasImages = hasImages(post);
        if (filters.contentType === 'image' && !postHasImages) return false;
        if (filters.contentType === 'text' && postHasImages) return false;
      }

      // Hashtag filter
      if (filters.hashtag !== 'all') {
        const postHashtags = getHashtags(post);
        if (!postHashtags.includes(filters.hashtag)) return false;
      }

      // Engagement filter
      if (filters.engagement !== 'all') {
        const impressions = getMetric(post, 'impressions');
        if (filters.engagement === 'high' && impressions < avgImpressions * 1.5) return false;
        if (filters.engagement === 'medium' && (impressions < avgImpressions * 0.5 || impressions > avgImpressions * 1.5)) return false;
        if (filters.engagement === 'low' && impressions > avgImpressions * 0.5) return false;
      }

      return true;
    });
  }, [allPosts, filters, avgImpressions]);

  const analytics = useMemo(() => {
    const posts = filteredPosts;
    const totalImpressions = posts.reduce((sum, p) => sum + getMetric(p, 'impressions'), 0);
    const totalReactions = posts.reduce((sum, p) => sum + getMetric(p, 'reactions'), 0);
    const totalComments = posts.reduce((sum, p) => sum + getMetric(p, 'comments'), 0);
    const totalShares = posts.reduce((sum, p) => sum + getMetric(p, 'shares'), 0);

    return {
      totalPosts: posts.length,
      totalImpressions,
      totalReactions,
      totalComments,
      totalShares,
      avgEngagementRate: totalImpressions > 0 ? ((totalReactions + totalComments + totalShares) / totalImpressions) * 100 : 0,
      avgImpressions: posts.length > 0 ? totalImpressions / posts.length : 0,
      avgReactions: posts.length > 0 ? totalReactions / posts.length : 0,
      postsWithImages: posts.filter(hasImages).length,
      avgPostLength: posts.length > 0 ? posts.reduce((sum, p) => sum + (p.text?.length || 0), 0) / posts.length : 0
    };
  }, [filteredPosts]);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return (
    <DataContext.Provider value={{
      allPosts,
      filteredPosts,
      filters,
      updateFilters,
      resetFilters,
      loading,
      error,
      analytics
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
