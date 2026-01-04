'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Post } from '@/types/linkedin';
import { getMetric, getHashtags, formatDate, hasImages } from '@/lib/utils';
import { Eye, ThumbsUp, MessageCircle, Share2, Calendar, ExternalLink, X, ImageIcon } from 'lucide-react';

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
        <h2 className="text-2xl font-semibold text-gray-900">All Posts</h2>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="impressions-desc">Most Impressions</option>
          <option value="reactions-desc">Most Reactions</option>
          <option value="comments-desc">Most Comments</option>
        </select>
      </div>

      {/* LinkedIn-style Post Cards */}
      <div className="space-y-4">
        {sortedPosts.map(post => {
          const hashtags = getHashtags(post);
          const postImage = post.assets?.[0]?.thumbnail || post.assets?.[0]?.source;

          return (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Post Header */}
              <div className="p-4 pb-3">
                <div className="flex items-start gap-3">
                  {/* Channel Avatar */}
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                    {post.channel?.avatar ? (
                      <img
                        src={post.channel.avatar}
                        alt={post.channel.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      post.channel?.displayName?.charAt(0) || 'F'
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{post.channel?.displayName || 'Fleetzz.io'}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(post.sentAt)}
                    </p>
                  </div>

                  {/* Metrics Badge */}
                  <div className="flex items-center gap-1 text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                    <Eye size={14} />
                    <span className="font-medium">{getMetric(post, 'impressions').toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <p className="text-gray-900 text-[15px] leading-relaxed line-clamp-3 whitespace-pre-wrap">
                  {post.text}
                </p>

                {/* Hashtags */}
                {hashtags.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {hashtags.slice(0, 5).map(tag => (
                      <span key={tag} className="text-sm text-blue-600 hover:underline">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Post Image */}
              {postImage && (
                <div className="relative w-full aspect-video bg-gray-100">
                  <img
                    src={postImage}
                    alt="Post image"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Engagement Stats */}
              <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white">
                    <ThumbsUp size={10} />
                  </span>
                  <span className="font-medium text-gray-900">{getMetric(post, 'reactions')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>{getMetric(post, 'comments')} comments</span>
                  <span>{getMetric(post, 'shares')} shares</span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-around">
                <div className="flex items-center gap-2 text-gray-700 hover:text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                  <ThumbsUp size={18} />
                  <span className="font-medium text-sm">Reactions</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 hover:text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                  <MessageCircle size={18} />
                  <span className="font-medium text-sm">Comments</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 hover:text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                  <Share2 size={18} />
                  <span className="font-medium text-sm">Shares</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Modal - LinkedIn Style */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-lg font-semibold text-gray-900">Post Details</h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Post Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden">
                  {selectedPost.channel?.avatar ? (
                    <img
                      src={selectedPost.channel.avatar}
                      alt={selectedPost.channel.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedPost.channel?.displayName?.charAt(0) || 'F'
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{selectedPost.channel?.displayName || 'Fleetzz.io'}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedPost.sentAt).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="px-6 pb-4">
              <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
                {selectedPost.text}
              </p>

              {/* Hashtags */}
              {getHashtags(selectedPost).length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {getHashtags(selectedPost).map(tag => (
                    <span key={tag} className="text-blue-600 hover:underline cursor-pointer">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Post Image */}
            {(selectedPost.assets?.[0]?.thumbnail || selectedPost.assets?.[0]?.source) && (
              <div className="w-full bg-gray-100">
                <img
                  src={selectedPost.assets[0].thumbnail || selectedPost.assets[0].source}
                  alt="Post image"
                  className="w-full object-contain max-h-[400px]"
                />
              </div>
            )}

            {/* Metrics Cards */}
            <div className="p-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Performance Metrics</h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                  <Eye className="mx-auto mb-2 text-blue-600" size={24} />
                  <div className="text-2xl font-bold text-gray-900">{getMetric(selectedPost, 'impressions').toLocaleString()}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase">Impressions</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                  <ThumbsUp className="mx-auto mb-2 text-green-600" size={24} />
                  <div className="text-2xl font-bold text-gray-900">{getMetric(selectedPost, 'reactions')}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase">Reactions</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                  <MessageCircle className="mx-auto mb-2 text-purple-600" size={24} />
                  <div className="text-2xl font-bold text-gray-900">{getMetric(selectedPost, 'comments')}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase">Comments</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
                  <Share2 className="mx-auto mb-2 text-orange-600" size={24} />
                  <div className="text-2xl font-bold text-gray-900">{getMetric(selectedPost, 'shares')}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase">Shares</div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            {selectedPost.externalLink && (
              <div className="px-6 pb-6">
                <a
                  href={selectedPost.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink size={16} />
                  View on LinkedIn
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
