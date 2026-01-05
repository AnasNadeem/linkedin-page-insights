'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
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
  baseAvgImpressions: number;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Routes that don't require authentication
const publicRoutes = ['/login'];

export function DataProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Handle authentication redirects
  useEffect(() => {
    if (status === 'loading') return;

    const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

    if (status === 'unauthenticated' && !isPublicRoute) {
      router.push('/login');
    }
  }, [status, pathname, router]);

  const loadData = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/linkedin/posts');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load data');
      }

      const data: LinkedInData = await response.json();
      const posts = data.data?.posts?.edges?.map(edge => edge.node) || [];
      console.log('Loaded posts:', posts.length);
      setAllPosts(posts);
      setDataLoaded(true);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, router]);

  // Load data when authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken && !dataLoaded) {
      loadData();
    }
  }, [status, session?.accessToken, dataLoaded, loadData]);

  // Calculate base average from ALL posts (for engagement level comparisons)
  const baseAvgImpressions = useMemo(() => {
    const avg = calculateAvgMetric(allPosts, 'impressions');
    return avg;
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    const result = allPosts.filter(post => {
      // Date filter
      if (filters.dateRange !== 'all' && filters.dateRange !== 'custom') {
        const days = parseInt(filters.dateRange);
        const postDate = new Date(post.sentAt);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        if (postDate < cutoff) {
          return false;
        }
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

      // Engagement filter - uses base average from ALL posts
      if (filters.engagement !== 'all' && baseAvgImpressions > 0) {
        const impressions = getMetric(post, 'impressions');
        if (filters.engagement === 'high' && impressions < baseAvgImpressions * 1.5) return false;
        if (filters.engagement === 'medium' && (impressions < baseAvgImpressions * 0.5 || impressions > baseAvgImpressions * 1.5)) return false;
        if (filters.engagement === 'low' && impressions >= baseAvgImpressions * 0.5) return false;
      }

      return true;
    });

    return result;
  }, [allPosts, filters, baseAvgImpressions]);

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

  const refreshData = useCallback(async () => {
    setDataLoaded(false);
    await loadData();
  }, [loadData]);

  return (
    <DataContext.Provider value={{
      allPosts,
      filteredPosts,
      filters,
      updateFilters,
      resetFilters,
      loading,
      error,
      analytics,
      baseAvgImpressions,
      refreshData
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
