'use client';

import { useMemo } from 'react';
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
  Legend
} from 'recharts';
import { Post } from '@/types/linkedin';
import { getMetric, getDayOfWeek, DAYS, hasImages, analyzeHashtagPerformance } from '@/lib/utils';
import { MetricCard } from '@/components/charts/MetricCard';
import { ChartContainer } from '@/components/charts/ChartContainer';

interface OverviewViewProps {
  posts: Post[];
}

const COLORS = ['#0a66c2', '#057642', '#b24020', '#5f4b8b'];

export function OverviewView({ posts }: OverviewViewProps) {
  const metrics = useMemo(() => {
    const totalImpressions = posts.reduce((sum, p) => sum + getMetric(p, 'impressions'), 0);
    const totalReactions = posts.reduce((sum, p) => sum + getMetric(p, 'reactions'), 0);
    const totalComments = posts.reduce((sum, p) => sum + getMetric(p, 'comments'), 0);
    const totalShares = posts.reduce((sum, p) => sum + getMetric(p, 'shares'), 0);
    const avgEngagement = posts.length > 0
      ? ((totalReactions + totalComments + totalShares) / totalImpressions * 100)
      : 0;

    return {
      totalPosts: posts.length,
      totalImpressions,
      totalReactions,
      totalComments,
      totalShares,
      avgEngagement: isNaN(avgEngagement) ? 0 : avgEngagement
    };
  }, [posts]);

  const engagementOverTime = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
      .map(post => ({
        date: new Date(post.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        impressions: getMetric(post, 'impressions'),
        reactions: getMetric(post, 'reactions')
      }));
  }, [posts]);

  const metricsDistribution = useMemo(() => [
    { name: 'Reactions', value: metrics.totalReactions },
    { name: 'Comments', value: metrics.totalComments },
    { name: 'Shares', value: metrics.totalShares }
  ], [metrics]);

  const postsByDay = useMemo(() => {
    const counts = new Array(7).fill(0);
    const engagement = new Array(7).fill(0);

    posts.forEach(post => {
      const day = getDayOfWeek(post.sentAt);
      counts[day]++;
      engagement[day] += getMetric(post, 'impressions');
    });

    return DAYS.map((name, i) => ({
      name,
      posts: counts[i],
      avgImpressions: counts[i] > 0 ? Math.round(engagement[i] / counts[i]) : 0
    }));
  }, [posts]);

  const quickInsights = useMemo(() => {
    const avgImpressions = posts.length > 0
      ? posts.reduce((sum, p) => sum + getMetric(p, 'impressions'), 0) / posts.length
      : 0;
    const avgReactions = posts.length > 0
      ? posts.reduce((sum, p) => sum + getMetric(p, 'reactions'), 0) / posts.length
      : 0;
    const withImages = posts.filter(hasImages).length;
    const imageRatio = posts.length > 0 ? (withImages / posts.length) * 100 : 0;
    const avgLength = posts.length > 0
      ? posts.reduce((sum, p) => sum + (p.text?.length || 0), 0) / posts.length
      : 0;

    return {
      avgImpressions: Math.round(avgImpressions),
      avgReactions: avgReactions.toFixed(1),
      imageRatio: imageRatio.toFixed(0),
      avgLength: Math.round(avgLength)
    };
  }, [posts]);

  const recommendations = useMemo(() => {
    const recs: string[] = [];

    // Best day
    const bestDay = postsByDay.reduce((best, day) =>
      day.avgImpressions > best.avgImpressions ? day : best
    , postsByDay[0]);

    if (bestDay.avgImpressions > 0) {
      recs.push(`Post more on ${bestDay.name} - it's your best performing day`);
    }

    // Images vs text
    const withImages = posts.filter(hasImages);
    const withoutImages = posts.filter(p => !hasImages(p));

    const avgWithImages = withImages.length > 0
      ? withImages.reduce((sum, p) => sum + getMetric(p, 'impressions'), 0) / withImages.length
      : 0;
    const avgWithoutImages = withoutImages.length > 0
      ? withoutImages.reduce((sum, p) => sum + getMetric(p, 'impressions'), 0) / withoutImages.length
      : 0;

    if (avgWithImages > avgWithoutImages * 1.2) {
      recs.push('Posts with images perform better - use more visuals');
    } else if (avgWithoutImages > avgWithImages * 1.2) {
      recs.push('Text-only posts are performing well - keep the quality content');
    }

    // Top hashtag
    const hashtagStats = analyzeHashtagPerformance(posts);
    const topHashtag = hashtagStats.sort((a, b) => b.avgImpressions - a.avgImpressions)[0];
    if (topHashtag?.avgImpressions > 0) {
      recs.push(`${topHashtag.hashtag} is your best performing hashtag`);
    }

    if (posts.length < 10) {
      recs.push('Increase posting frequency for better visibility');
    }

    return recs;
  }, [posts, postsByDay]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Overview Dashboard</h2>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <MetricCard label="Total Posts" value={metrics.totalPosts} />
        <MetricCard label="Total Impressions" value={metrics.totalImpressions} />
        <MetricCard label="Total Reactions" value={metrics.totalReactions} />
        <MetricCard label="Total Comments" value={metrics.totalComments} />
        <MetricCard label="Total Shares" value={metrics.totalShares} />
        <MetricCard label="Avg Engagement" value={metrics.avgEngagement} suffix="%" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Engagement Over Time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={engagementOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="impressions" stroke="#0a66c2" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Metrics Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={metricsDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {metricsDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Posts by Day of Week">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={postsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="posts" fill="#0a66c2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Avg Engagement by Day of Week">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={postsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="avgImpressions" fill="#057642" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Quick Insights
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Avg Impressions per Post</span>
              <span className="font-semibold text-blue-600">{quickInsights.avgImpressions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Avg Reactions per Post</span>
              <span className="font-semibold text-blue-600">{quickInsights.avgReactions}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Posts with Images</span>
              <span className="font-semibold text-blue-600">{quickInsights.imageRatio}%</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Avg Post Length</span>
              <span className="font-semibold text-blue-600">{quickInsights.avgLength} chars</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.length > 0 ? (
              recommendations.map((rec, i) => (
                <div key={i} className="py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">{rec}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Not enough data for recommendations</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
