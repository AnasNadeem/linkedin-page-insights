'use client';

import { useState, useMemo } from 'react';
import { Post } from '@/types/linkedin';
import { getMetric, getHashtags, formatDate } from '@/lib/utils';

interface PostsViewProps {
  posts: Post[];
}

type SortKey = 'date-desc' | 'date-asc' | 'impressions-desc' | 'reactions-desc' | 'comments-desc';

export function PostsView({ posts }: PostsViewProps) {
  const [sortBy, setSortBy] = useState<SortKey>('date-desc');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
        case 'date-asc':
          return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
        case 'impressions-desc':
          return getMetric(b, 'impressions') - getMetric(a, 'impressions');
        case 'reactions-desc':
          return getMetric(b, 'reactions') - getMetric(a, 'reactions');
        case 'comments-desc':
          return getMetric(b, 'comments') - getMetric(a, 'comments');
        default:
          return 0;
      }
    });
  }, [posts, sortBy]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">All Posts</h2>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="impressions-desc">Most Impressions</option>
          <option value="reactions-desc">Most Reactions</option>
          <option value="comments-desc">Most Comments</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Post Content</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Impressions</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reactions</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Comments</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Shares</th>
            </tr>
          </thead>
          <tbody>
            {sortedPosts.map(post => {
              const hashtags = getHashtags(post).slice(0, 3);
              return (
                <tr
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-4 max-w-md">
                    <p className="text-sm text-gray-900 line-clamp-2">{post.text}</p>
                    {hashtags.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {hashtags.map(tag => (
                          <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{formatDate(post.sentAt)}</td>
                  <td className="px-4 py-4">
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">{getMetric(post, 'impressions').toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">{getMetric(post, 'reactions')}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">{getMetric(post, 'comments')}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">{getMetric(post, 'shares')}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Post Details</h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="mb-4 text-sm text-gray-500">
              Posted: {new Date(selectedPost.sentAt).toLocaleString()}
            </div>

            <p className="text-gray-900 whitespace-pre-wrap mb-4 leading-relaxed">
              {selectedPost.text}
            </p>

            {getHashtags(selectedPost).length > 0 && (
              <div className="mb-4 flex gap-2 flex-wrap">
                {getHashtags(selectedPost).map(tag => (
                  <span key={tag} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-4 gap-3 mb-4">
              {(['impressions', 'reactions', 'comments', 'shares'] as const).map(metric => (
                <div key={metric} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-semibold">{getMetric(selectedPost, metric).toLocaleString()}</div>
                  <div className="text-xs text-gray-500 capitalize">{metric}</div>
                </div>
              ))}
            </div>

            {selectedPost.externalLink && (
              <a
                href={selectedPost.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                View on LinkedIn
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
