'use client';

import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Post } from '@/types/linkedin';
import { getMetric, hasImages } from '@/lib/utils';
import { ChartContainer } from '@/components/charts/ChartContainer';

interface ContentViewProps {
  posts: Post[];
}

export function ContentView({ posts }: ContentViewProps) {
  const lengthVsEngagement = useMemo(() => {
    return posts.map(post => ({
      length: post.text?.length || 0,
      impressions: getMetric(post, 'impressions')
    }));
  }, [posts]);

  const contentTypeData = useMemo(() => {
    const withImages = posts.filter(hasImages);
    const withoutImages = posts.filter(p => !hasImages(p));

    const avgWithImages = withImages.length > 0
      ? withImages.reduce((sum, p) => sum + getMetric(p, 'impressions'), 0) / withImages.length
      : 0;
    const avgWithoutImages = withoutImages.length > 0
      ? withoutImages.reduce((sum, p) => sum + getMetric(p, 'impressions'), 0) / withoutImages.length
      : 0;

    return [
      { name: 'With Images', avgImpressions: Math.round(avgWithImages), count: withImages.length },
      { name: 'Text Only', avgImpressions: Math.round(avgWithoutImages), count: withoutImages.length }
    ];
  }, [posts]);

  const contentInsights = useMemo(() => {
    const lengths = posts.map(p => p.text?.length || 0);
    const avgLength = lengths.length > 0
      ? lengths.reduce((a, b) => a + b, 0) / lengths.length
      : 0;

    const withImagesCount = posts.filter(hasImages).length;
    const imageRatio = posts.length > 0 ? (withImagesCount / posts.length) * 100 : 0;

    return {
      avgLength: Math.round(avgLength),
      withImages: withImagesCount,
      withoutImages: posts.length - withImagesCount,
      imageRatio: imageRatio.toFixed(0)
    };
  }, [posts]);

  const lengthBuckets = useMemo(() => {
    const buckets = {
      short: { posts: [] as Post[], label: '< 200 chars' },
      medium: { posts: [] as Post[], label: '200-500 chars' },
      long: { posts: [] as Post[], label: '> 500 chars' }
    };

    posts.forEach(p => {
      const len = p.text?.length || 0;
      if (len < 200) buckets.short.posts.push(p);
      else if (len <= 500) buckets.medium.posts.push(p);
      else buckets.long.posts.push(p);
    });

    return Object.entries(buckets).map(([key, bucket]) => ({
      key,
      label: bucket.label,
      avgImpressions: bucket.posts.length > 0
        ? bucket.posts.reduce((sum, p) => sum + getMetric(p, 'impressions'), 0) / bucket.posts.length
        : 0,
      count: bucket.posts.length
    })).sort((a, b) => b.avgImpressions - a.avgImpressions);
  }, [posts]);

  const bestContentType = contentTypeData[0].avgImpressions > contentTypeData[1].avgImpressions
    ? 'With Images'
    : 'Text Only';

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Content Analysis</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Post Length vs Engagement">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" dataKey="length" name="Length" tick={{ fontSize: 12 }} label={{ value: 'Post Length (chars)', position: 'bottom', offset: -5 }} />
              <YAxis type="number" dataKey="impressions" name="Impressions" tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={lengthVsEngagement} fill="#0a66c2" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Content Type Performance">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contentTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="avgImpressions" fill="#0a66c2" radius={[4, 4, 0, 0]} name="Avg Impressions" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold mb-4">Content Insights</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Average Post Length</span>
              <span className="font-semibold text-blue-600">{contentInsights.avgLength} chars</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Posts with Images</span>
              <span className="font-semibold text-blue-600">{contentInsights.withImages} ({contentInsights.imageRatio}%)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Text-only Posts</span>
              <span className="font-semibold text-blue-600">{contentInsights.withoutImages} ({100 - parseInt(contentInsights.imageRatio)}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold mb-4">Optimal Post Characteristics</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Best Post Length</span>
              <span className="font-semibold text-blue-600">{lengthBuckets[0]?.label || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Best Content Type</span>
              <span className="font-semibold text-blue-600">{bestContentType}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Best Length Avg Impressions</span>
              <span className="font-semibold text-blue-600">{Math.round(lengthBuckets[0]?.avgImpressions || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
