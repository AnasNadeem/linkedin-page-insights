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
import { getMetric, getDayOfWeek, getHour, DAYS_SHORT } from '@/lib/utils';
import { ChartContainer } from '@/components/charts/ChartContainer';

interface TimingViewProps {
  posts: Post[];
}

export function TimingView({ posts }: TimingViewProps) {
  const heatmapData = useMemo(() => {
    const data: { day: number; hour: number; count: number; engagement: number }[][] =
      Array(7).fill(null).map(() =>
        Array(24).fill(null).map((_, h) => ({ day: 0, hour: h, count: 0, engagement: 0 }))
      );

    posts.forEach(post => {
      const day = getDayOfWeek(post.sentAt);
      const hour = getHour(post.sentAt);
      data[day][hour].day = day;
      data[day][hour].count++;
      data[day][hour].engagement += getMetric(post, 'impressions');
    });

    return data;
  }, [posts]);

  const maxEngagement = useMemo(() => {
    let max = 0;
    heatmapData.forEach(row => row.forEach(cell => {
      if (cell.engagement > max) max = cell.engagement;
    }));
    return max;
  }, [heatmapData]);

  const hourlyData = useMemo(() => {
    const hourly = Array(24).fill(null).map((_, i) => ({ hour: `${i}:00`, avgImpressions: 0, count: 0 }));

    posts.forEach(post => {
      const hour = getHour(post.sentAt);
      hourly[hour].count++;
      hourly[hour].avgImpressions += getMetric(post, 'impressions');
    });

    return hourly.map(h => ({
      ...h,
      avgImpressions: h.count > 0 ? Math.round(h.avgImpressions / h.count) : 0
    }));
  }, [posts]);

  const bestTimes = useMemo(() => {
    return hourlyData
      .filter(h => h.avgImpressions > 0)
      .sort((a, b) => b.avgImpressions - a.avgImpressions)
      .slice(0, 5);
  }, [hourlyData]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Best Time to Post</h2>

      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <h3 className="text-base font-semibold mb-4">Engagement Heatmap by Day & Hour</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="flex mb-1">
              <div className="w-12"></div>
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="flex-1 text-center text-xs text-gray-500">
                  {i}
                </div>
              ))}
            </div>

            {/* Grid */}
            {DAYS_SHORT.map((day, dayIndex) => (
              <div key={day} className="flex mb-1">
                <div className="w-12 text-xs text-gray-500 flex items-center">{day}</div>
                {heatmapData[dayIndex].map((cell, hourIndex) => {
                  const intensity = maxEngagement > 0 ? cell.engagement / maxEngagement : 0;
                  return (
                    <div
                      key={hourIndex}
                      className="flex-1 aspect-square rounded-sm mx-0.5"
                      style={{ backgroundColor: `rgba(10, 102, 194, ${intensity})` }}
                      title={`${day} ${hourIndex}:00 - ${cell.count} posts, ${cell.engagement} impressions`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Average Engagement by Hour">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="avgImpressions" fill="#0a66c2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold mb-4">Best Posting Times</h3>
          <div className="space-y-3">
            {bestTimes.map((time, i) => (
              <div key={time.hour} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-600">
                  <span className="font-semibold text-blue-600 mr-2">#{i + 1}</span>
                  {time.hour} - {parseInt(time.hour) + 1}:00
                </span>
                <span className="font-semibold text-blue-600">{time.avgImpressions.toLocaleString()} avg impressions</span>
              </div>
            ))}
            {bestTimes.length === 0 && (
              <p className="text-gray-500 text-sm">Not enough data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
