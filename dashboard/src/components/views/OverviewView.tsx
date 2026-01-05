'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { Post } from '@/types/linkedin';
import { getMetric, getDayOfWeek, DAYS, hasImages, analyzeHashtagPerformance, getHashtags, DAYS_SHORT } from '@/lib/utils';
import { MetricCard } from '@/components/charts/MetricCard';
import { ChartContainer } from '@/components/charts/ChartContainer';
import {
  TrendingUp, TrendingDown, Eye, ThumbsUp, MessageCircle,
  Share2, Image as ImageIcon, FileText, Clock, Hash, ArrowRight,
  Calendar, Target, Zap, Award
} from 'lucide-react';

interface OverviewViewProps {
  posts: Post[];
}

const COLORS = ['#0a66c2', '#057642', '#b24020', '#5f4b8b', '#d4a853'];

export function OverviewView({ posts }: OverviewViewProps) {
  // Basic Metrics
  const metrics = useMemo(() => {
    const totalImpressions = posts.reduce((sum, p) => sum + getMetric(p, 'impressions'), 0);
    const totalReactions = posts.reduce((sum, p) => sum + getMetric(p, 'reactions'), 0);
    const totalComments = posts.reduce((sum, p) => sum + getMetric(p, 'comments'), 0);
    const totalShares = posts.reduce((sum, p) => sum + getMetric(p, 'shares'), 0);
    const totalEngagement = totalReactions + totalComments + totalShares;
    const avgEngagement = posts.length > 0 && totalImpressions > 0
      ? (totalEngagement / totalImpressions) * 100
      : 0;

    return {
      totalPosts: posts.length,
      totalImpressions,
      totalReactions,
      totalComments,
      totalShares,
      totalEngagement,
      avgEngagement: isNaN(avgEngagement) ? 0 : avgEngagement,
      avgImpressions: posts.length > 0 ? totalImpressions / posts.length : 0,
      avgReactions: posts.length > 0 ? totalReactions / posts.length : 0
    };
  }, [posts]);

  // Posting Frequency Analysis
  const postingFrequency = useMemo(() => {
    if (posts.length < 2) return { postsPerWeek: 0, avgDaysBetween: 0 };

    const sortedPosts = [...posts].sort((a, b) =>
      new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    );

    const firstPost = new Date(sortedPosts[0].sentAt);
    const lastPost = new Date(sortedPosts[sortedPosts.length - 1].sentAt);
    const daysDiff = Math.max(1, (lastPost.getTime() - firstPost.getTime()) / (1000 * 60 * 60 * 24));

    return {
      postsPerWeek: (posts.length / daysDiff) * 7,
      avgDaysBetween: daysDiff / posts.length
    };
  }, [posts]);

  // Weekly Performance Trend
  const weeklyTrend = useMemo(() => {
    const weeklyData: Record<string, { impressions: number; reactions: number; posts: number }> = {};

    posts.forEach(post => {
      const date = new Date(post.sentAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { impressions: 0, reactions: 0, posts: 0 };
      }
      weeklyData[weekKey].impressions += getMetric(post, 'impressions');
      weeklyData[weekKey].reactions += getMetric(post, 'reactions');
      weeklyData[weekKey].posts++;
    });

    return Object.entries(weeklyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8) // Last 8 weeks
      .map(([week, data]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        impressions: data.impressions,
        reactions: data.reactions,
        posts: data.posts,
        avgImpressions: data.posts > 0 ? Math.round(data.impressions / data.posts) : 0
      }));
  }, [posts]);

  // Content Performance Comparison
  const contentComparison = useMemo(() => {
    const withImages = posts.filter(hasImages);
    const withoutImages = posts.filter(p => !hasImages(p));

    const avgWithImages = withImages.length > 0
      ? withImages.reduce((sum, p) => sum + getMetric(p, 'impressions'), 0) / withImages.length
      : 0;
    const avgWithoutImages = withoutImages.length > 0
      ? withoutImages.reduce((sum, p) => sum + getMetric(p, 'impressions'), 0) / withoutImages.length
      : 0;

    return {
      withImages: { count: withImages.length, avgImpressions: avgWithImages },
      withoutImages: { count: withoutImages.length, avgImpressions: avgWithoutImages }
    };
  }, [posts]);

  // Post Length Analysis
  const lengthAnalysis = useMemo(() => {
    const buckets = [
      { label: 'Short (<200)', min: 0, max: 200, posts: [] as Post[] },
      { label: 'Medium (200-500)', min: 200, max: 500, posts: [] as Post[] },
      { label: 'Long (>500)', min: 500, max: Infinity, posts: [] as Post[] }
    ];

    posts.forEach(post => {
      const len = post.text?.length || 0;
      const bucket = buckets.find(b => len >= b.min && len < b.max);
      bucket?.posts.push(post);
    });

    return buckets.map(b => ({
      label: b.label,
      count: b.posts.length,
      avgImpressions: b.posts.length > 0
        ? Math.round(b.posts.reduce((sum, p) => sum + getMetric(p, 'impressions'), 0) / b.posts.length)
        : 0
    }));
  }, [posts]);

  // Day of Week Performance
  const dayPerformance = useMemo(() => {
    const dayData = DAYS.map(() => ({ posts: 0, impressions: 0, reactions: 0 }));

    posts.forEach(post => {
      const day = getDayOfWeek(post.sentAt);
      dayData[day].posts++;
      dayData[day].impressions += getMetric(post, 'impressions');
      dayData[day].reactions += getMetric(post, 'reactions');
    });

    return DAYS_SHORT.map((name, i) => ({
      name,
      fullName: DAYS[i],
      posts: dayData[i].posts,
      avgImpressions: dayData[i].posts > 0 ? Math.round(dayData[i].impressions / dayData[i].posts) : 0,
      avgReactions: dayData[i].posts > 0 ? (dayData[i].reactions / dayData[i].posts).toFixed(1) : 0
    }));
  }, [posts]);

  const bestDay = dayPerformance.reduce((best, day) =>
    day.avgImpressions > best.avgImpressions ? day : best
  , dayPerformance[0]);

  // Top Hashtags
  const topHashtags = useMemo(() => {
    const stats = analyzeHashtagPerformance(posts);
    return stats.sort((a, b) => b.avgImpressions - a.avgImpressions).slice(0, 5);
  }, [posts]);

  // Recent Performance (last 5 posts)
  const recentPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .slice(0, 5);
  }, [posts]);

  // Engagement over time
  const engagementOverTime = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
      .map(post => ({
        date: new Date(post.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        impressions: getMetric(post, 'impressions'),
        reactions: getMetric(post, 'reactions'),
        engagement: getMetric(post, 'reactions') + getMetric(post, 'comments') + getMetric(post, 'shares')
      }));
  }, [posts]);

  // Recommendations based on data
  const recommendations = useMemo(() => {
    const recs: { icon: typeof TrendingUp; title: string; description: string }[] = [];

    // Best day recommendation
    if (bestDay.avgImpressions > 0) {
      recs.push({
        icon: Calendar,
        title: `Post on ${bestDay.fullName}s`,
        description: `Your best performing day with ${bestDay.avgImpressions.toLocaleString()} avg impressions`
      });
    }

    // Content type recommendation
    if (contentComparison.withImages.avgImpressions > contentComparison.withoutImages.avgImpressions * 1.2) {
      recs.push({
        icon: ImageIcon,
        title: 'Use more images',
        description: `Image posts get ${((contentComparison.withImages.avgImpressions / contentComparison.withoutImages.avgImpressions - 1) * 100).toFixed(0)}% more impressions`
      });
    }

    // Post length recommendation
    const bestLength = lengthAnalysis.reduce((best, l) => l.avgImpressions > best.avgImpressions ? l : best, lengthAnalysis[0]);
    if (bestLength.avgImpressions > 0) {
      recs.push({
        icon: FileText,
        title: `Write ${bestLength.label.toLowerCase()} posts`,
        description: `This length gets ${bestLength.avgImpressions.toLocaleString()} avg impressions`
      });
    }

    // Top hashtag recommendation
    if (topHashtags.length > 0) {
      recs.push({
        icon: Hash,
        title: `Use ${topHashtags[0].hashtag}`,
        description: `Your best hashtag with ${Math.round(topHashtags[0].avgImpressions).toLocaleString()} avg impressions`
      });
    }

    return recs;
  }, [bestDay, contentComparison, lengthAnalysis, topHashtags]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Key metrics and insights for your LinkedIn page performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FileText size={16} className="text-blue-600" />
            </div>
            <span className="text-xs text-gray-500 uppercase font-medium">Posts</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.totalPosts}</div>
          <div className="text-xs text-gray-500 mt-1">{postingFrequency.postsPerWeek.toFixed(1)}/week</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Eye size={16} className="text-purple-600" />
            </div>
            <span className="text-xs text-gray-500 uppercase font-medium">Impressions</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.totalImpressions.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">{Math.round(metrics.avgImpressions).toLocaleString()} avg</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <ThumbsUp size={16} className="text-green-600" />
            </div>
            <span className="text-xs text-gray-500 uppercase font-medium">Reactions</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.totalReactions.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">{metrics.avgReactions.toFixed(1)} avg</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-orange-100 rounded-lg">
              <MessageCircle size={16} className="text-orange-600" />
            </div>
            <span className="text-xs text-gray-500 uppercase font-medium">Comments</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.totalComments.toLocaleString()}</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-pink-100 rounded-lg">
              <Share2 size={16} className="text-pink-600" />
            </div>
            <span className="text-xs text-gray-500 uppercase font-medium">Shares</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.totalShares.toLocaleString()}</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Target size={16} className="text-indigo-600" />
            </div>
            <span className="text-xs text-gray-500 uppercase font-medium">Eng. Rate</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.avgEngagement.toFixed(2)}%</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Weekly Performance Trend">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyTrend}>
              <defs>
                <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0a66c2" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0a66c2" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="avgImpressions" stroke="#0a66c2" strokeWidth={2} fill="url(#colorImpressions)" name="Avg Impressions" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Performance by Day of Week">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="avgImpressions" fill="#0a66c2" radius={[4, 4, 0, 0]} name="Avg Impressions" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {recommendations.map((rec, i) => {
          const Icon = rec.icon;
          return (
            <div key={i} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={18} className="text-blue-600" />
                <span className="font-semibold text-gray-900">{rec.title}</span>
              </div>
              <p className="text-sm text-gray-600">{rec.description}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ChartContainer title="Content Type Performance">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'With Images', impressions: Math.round(contentComparison.withImages.avgImpressions), count: contentComparison.withImages.count },
              { name: 'Text Only', impressions: Math.round(contentComparison.withoutImages.avgImpressions), count: contentComparison.withoutImages.count }
            ]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(value, name) => [String(value ?? 0).toLocaleString(), name === 'impressions' ? 'Avg Impressions' : 'Posts']} />
              <Bar dataKey="impressions" fill="#0a66c2" radius={[0, 4, 4, 0]} name="Avg Impressions" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Post Length Impact">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lengthAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="avgImpressions" fill="#057642" radius={[4, 4, 0, 0]} name="Avg Impressions" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Top Hashtags">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topHashtags.slice(0, 5)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="hashtag" tick={{ fontSize: 10 }} width={100} />
              <Tooltip />
              <Bar dataKey="avgImpressions" fill="#5f4b8b" radius={[0, 4, 4, 0]} name="Avg Impressions" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Recent Posts Performance</h3>
          <Link href="/posts" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentPosts.map(post => {
            const impressions = getMetric(post, 'impressions');
            const vsAvg = metrics.avgImpressions > 0
              ? ((impressions - metrics.avgImpressions) / metrics.avgImpressions) * 100
              : 0;

            return (
              <div key={post.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{post.text}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(post.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">{impressions.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">{getMetric(post, 'reactions')}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Reactions</div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    vsAvg >= 20 ? 'bg-green-100 text-green-700' :
                    vsAvg <= -20 ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {vsAvg >= 0 ? '+' : ''}{vsAvg.toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
