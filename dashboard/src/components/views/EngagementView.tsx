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
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Post } from '@/types/linkedin';
import { getMetric, calculateAvgMetric } from '@/lib/utils';
import { ChartContainer } from '@/components/charts/ChartContainer';

interface EngagementViewProps {
  posts: Post[];
}

const COLORS = ['#057642', '#0a66c2', '#b24020'];

export function EngagementView({ posts }: EngagementViewProps) {
  const trendData = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
      .map(post => ({
        date: new Date(post.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        impressions: getMetric(post, 'impressions'),
        reactions: getMetric(post, 'reactions'),
        comments: getMetric(post, 'comments')
      }));
  }, [posts]);

  const scatterData = useMemo(() => {
    return posts.map(post => ({
      impressions: getMetric(post, 'impressions'),
      reactions: getMetric(post, 'reactions'),
      text: post.text?.substring(0, 50) + '...'
    }));
  }, [posts]);

  const distribution = useMemo(() => {
    const avgImpressions = calculateAvgMetric(posts, 'impressions');

    const high = posts.filter(p => getMetric(p, 'impressions') > avgImpressions * 1.5).length;
    const medium = posts.filter(p => {
      const imp = getMetric(p, 'impressions');
      return imp >= avgImpressions * 0.5 && imp <= avgImpressions * 1.5;
    }).length;
    const low = posts.filter(p => getMetric(p, 'impressions') < avgImpressions * 0.5).length;

    return [
      { name: 'High Performers', value: high },
      { name: 'Medium', value: medium },
      { name: 'Low Performers', value: low }
    ];
  }, [posts]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Engagement Analysis</h2>

      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <h3 className="text-base font-semibold mb-4">Engagement Metrics Trend</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="impressions" stroke="#0a66c2" strokeWidth={2} dot={false} name="Impressions" />
              <Line type="monotone" dataKey="reactions" stroke="#057642" strokeWidth={2} dot={false} name="Reactions" />
              <Line type="monotone" dataKey="comments" stroke="#b24020" strokeWidth={2} dot={false} name="Comments" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Reactions vs Impressions">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" dataKey="impressions" name="Impressions" tick={{ fontSize: 12 }} />
              <YAxis type="number" dataKey="reactions" name="Reactions" tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Posts" data={scatterData} fill="#0a66c2" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Engagement Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {distribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
