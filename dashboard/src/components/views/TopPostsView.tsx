'use client';

import { useMemo } from 'react';
import { Post } from '@/types/linkedin';
import { getMetric } from '@/lib/utils';

interface TopPostsViewProps {
  posts: Post[];
}

function PostCard({ post, rank, metric }: { post: Post; rank: number; metric: string }) {
  return (
    <div className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 line-clamp-3 mb-2">{post.text}</p>
        <div className="flex gap-4 text-xs text-gray-500">
          <span>{getMetric(post, 'impressions').toLocaleString()} impressions</span>
          <span>{getMetric(post, 'reactions')} reactions</span>
          <span>{getMetric(post, 'comments')} comments</span>
        </div>
      </div>
    </div>
  );
}

export function TopPostsView({ posts }: TopPostsViewProps) {
  const topByImpressions = useMemo(() =>
    [...posts].sort((a, b) => getMetric(b, 'impressions') - getMetric(a, 'impressions')).slice(0, 5)
  , [posts]);

  const topByReactions = useMemo(() =>
    [...posts].sort((a, b) => getMetric(b, 'reactions') - getMetric(a, 'reactions')).slice(0, 5)
  , [posts]);

  const topByComments = useMemo(() =>
    [...posts].sort((a, b) => getMetric(b, 'comments') - getMetric(a, 'comments')).slice(0, 5)
  , [posts]);

  const worstPosts = useMemo(() =>
    [...posts].sort((a, b) => getMetric(a, 'impressions') - getMetric(b, 'impressions')).slice(0, 5)
  , [posts]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Top Performing Posts</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold mb-4">Top by Impressions</h3>
          <div className="space-y-3">
            {topByImpressions.map((post, i) => (
              <PostCard key={post.id} post={post} rank={i + 1} metric="impressions" />
            ))}
            {topByImpressions.length === 0 && (
              <p className="text-gray-500 text-sm">No posts available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold mb-4">Top by Reactions</h3>
          <div className="space-y-3">
            {topByReactions.map((post, i) => (
              <PostCard key={post.id} post={post} rank={i + 1} metric="reactions" />
            ))}
            {topByReactions.length === 0 && (
              <p className="text-gray-500 text-sm">No posts available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold mb-4">Top by Comments</h3>
          <div className="space-y-3">
            {topByComments.map((post, i) => (
              <PostCard key={post.id} post={post} rank={i + 1} metric="comments" />
            ))}
            {topByComments.length === 0 && (
              <p className="text-gray-500 text-sm">No posts available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold mb-4">Worst Performers</h3>
          <div className="space-y-3">
            {worstPosts.map((post, i) => (
              <PostCard key={post.id} post={post} rank={i + 1} metric="impressions" />
            ))}
            {worstPosts.length === 0 && (
              <p className="text-gray-500 text-sm">No posts available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
