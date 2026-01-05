'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Post } from '@/types/linkedin';
import { analyzeHashtagPerformance } from '@/lib/utils';
import { ChartContainer } from '@/components/charts/ChartContainer';

interface HashtagsViewProps {
  posts: Post[];
}

export function HashtagsView({ posts }: HashtagsViewProps) {
  const hashtagStats = useMemo(() => analyzeHashtagPerformance(posts), [posts]);

  const byUsage = useMemo(() =>
    [...hashtagStats].sort((a, b) => b.count - a.count).slice(0, 10)
  , [hashtagStats]);

  const byPerformance = useMemo(() =>
    [...hashtagStats].sort((a, b) => b.avgImpressions - a.avgImpressions).slice(0, 10)
  , [hashtagStats]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Hashtag Performance</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Top Hashtags by Usage">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byUsage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="hashtag" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#0a66c2" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Top Hashtags by Avg Impressions">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="hashtag" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="avgImpressions" fill="#057642" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold">Hashtag Statistics</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hashtag</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Times Used</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Impressions</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Reactions</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Engagement</th>
            </tr>
          </thead>
          <tbody>
            {hashtagStats.sort((a, b) => b.count - a.count).map(stat => (
              <tr key={stat.hashtag} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                    {stat.hashtag}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{stat.count}</td>
                <td className="px-4 py-3 text-sm">{Math.round(stat.avgImpressions).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">{stat.avgReactions.toFixed(1)}</td>
                <td className="px-4 py-3 text-sm">{(stat.avgEngagement * 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
