import { Post, MetricType, HashtagStats } from '@/types/linkedin';

export function getMetric(post: Post, type: MetricType): number {
  const metric = post.metrics?.find(m => m.type === type);
  return metric?.value || 0;
}

export function getHashtags(post: Post): string[] {
  return (post.metadata?.annotations || [])
    .filter(a => a.type === 'hashtag')
    .map(a => a.content);
}

export function hasImages(post: Post): boolean {
  return post.assets && post.assets.length > 0;
}

export function calculateAvgMetric(posts: Post[], metric: MetricType): number {
  if (posts.length === 0) return 0;
  const total = posts.reduce((sum, post) => sum + getMetric(post, metric), 0);
  return total / posts.length;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function analyzeHashtagPerformance(posts: Post[]): HashtagStats[] {
  const hashtagStats: Record<string, { count: number; impressions: number; reactions: number; engagement: number }> = {};

  posts.forEach(post => {
    const hashtags = getHashtags(post);
    hashtags.forEach(tag => {
      if (!hashtagStats[tag]) {
        hashtagStats[tag] = { count: 0, impressions: 0, reactions: 0, engagement: 0 };
      }
      hashtagStats[tag].count++;
      hashtagStats[tag].impressions += getMetric(post, 'impressions');
      hashtagStats[tag].reactions += getMetric(post, 'reactions');
      hashtagStats[tag].engagement += getMetric(post, 'engagementRate');
    });
  });

  return Object.entries(hashtagStats).map(([hashtag, stats]) => ({
    hashtag,
    count: stats.count,
    avgImpressions: stats.impressions / stats.count,
    avgReactions: stats.reactions / stats.count,
    avgEngagement: stats.engagement / stats.count
  }));
}

export function getUniqueHashtags(posts: Post[]): string[] {
  const hashtags = new Set<string>();
  posts.forEach(post => {
    getHashtags(post).forEach(tag => hashtags.add(tag));
  });
  return [...hashtags].sort();
}

export function getDayOfWeek(dateString: string): number {
  return new Date(dateString).getDay();
}

export function getHour(dateString: string): number {
  return new Date(dateString).getHours();
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
