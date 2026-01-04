'use client';

import { useMemo, useState } from 'react';
import { Post } from '@/types/linkedin';
import { getMetric, getHashtags, formatDate } from '@/lib/utils';
import { Eye, ThumbsUp, MessageCircle, Share2, Calendar, ExternalLink, X, ImageIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface TopPostsViewProps {
  posts: Post[];
}

function PostCard({ post, rank, type }: { post: Post; rank: number; type: 'top' | 'worst' }) {
  const [showModal, setShowModal] = useState(false);
  const postImage = post.assets?.[0]?.thumbnail || post.assets?.[0]?.source;

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex">
          {/* Rank Badge */}
          <div className={`w-12 flex items-center justify-center flex-shrink-0 ${type === 'top' ? 'bg-gradient-to-b from-blue-500 to-blue-600' : 'bg-gradient-to-b from-gray-400 to-gray-500'}`}>
            <span className="text-white font-bold text-lg">#{rank}</span>
          </div>

          <div className="flex-1 p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                {post.channel?.avatar ? (
                  <img src={post.channel.avatar} alt="" className="w-full h-full object-cover" />
                ) : 'F'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{post.channel?.displayName || 'Fleetzz.io'}</p>
                <p className="text-xs text-gray-500">{formatDate(post.sentAt)}</p>
              </div>
            </div>

            {/* Content */}
            <p className="text-sm text-gray-800 line-clamp-2 mb-3">{post.text}</p>

            {/* Metrics */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-gray-700">
                <Eye size={14} className="text-blue-600" />
                <span className="font-semibold">{getMetric(post, 'impressions').toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <ThumbsUp size={14} className="text-green-600" />
                <span className="font-semibold">{getMetric(post, 'reactions')}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <MessageCircle size={14} className="text-purple-600" />
                <span className="font-semibold">{getMetric(post, 'comments')}</span>
              </div>
            </div>
          </div>

          {/* Thumbnail */}
          {postImage && (
            <div className="w-24 h-24 flex-shrink-0 bg-gray-100">
              <img src={postImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${type === 'top' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {type === 'top' ? <TrendingUp size={14} className="inline mr-1" /> : <TrendingDown size={14} className="inline mr-1" />}
                  #{rank} {type === 'top' ? 'Top' : 'Low'} Performer
                </span>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden">
                  {post.channel?.avatar ? (
                    <img src={post.channel.avatar} alt="" className="w-full h-full object-cover" />
                  ) : 'F'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{post.channel?.displayName || 'Fleetzz.io'}</h3>
                  <p className="text-sm text-gray-600">{new Date(post.sentAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-4">
              <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">{post.text}</p>
              {getHashtags(post).length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {getHashtags(post).map(tag => (
                    <span key={tag} className="text-blue-600">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {postImage && (
              <div className="w-full bg-gray-100">
                <img src={postImage} alt="" className="w-full object-contain max-h-[400px]" />
              </div>
            )}

            <div className="p-6 border-t border-gray-200">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                  <Eye className="mx-auto mb-2 text-blue-600" size={24} />
                  <div className="text-2xl font-bold text-gray-900">{getMetric(post, 'impressions').toLocaleString()}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase">Impressions</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                  <ThumbsUp className="mx-auto mb-2 text-green-600" size={24} />
                  <div className="text-2xl font-bold text-gray-900">{getMetric(post, 'reactions')}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase">Reactions</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                  <MessageCircle className="mx-auto mb-2 text-purple-600" size={24} />
                  <div className="text-2xl font-bold text-gray-900">{getMetric(post, 'comments')}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase">Comments</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
                  <Share2 className="mx-auto mb-2 text-orange-600" size={24} />
                  <div className="text-2xl font-bold text-gray-900">{getMetric(post, 'shares')}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase">Shares</div>
                </div>
              </div>
            </div>

            {post.externalLink && (
              <div className="px-6 pb-6">
                <a
                  href={post.externalLink}
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
    </>
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
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Top Performing Posts</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top by Impressions */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye size={20} className="text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Top by Impressions</h3>
          </div>
          <div className="space-y-3">
            {topByImpressions.map((post, i) => (
              <PostCard key={post.id} post={post} rank={i + 1} type="top" />
            ))}
            {topByImpressions.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No posts available</p>
            )}
          </div>
        </div>

        {/* Top by Reactions */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <ThumbsUp size={20} className="text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Top by Reactions</h3>
          </div>
          <div className="space-y-3">
            {topByReactions.map((post, i) => (
              <PostCard key={post.id} post={post} rank={i + 1} type="top" />
            ))}
            {topByReactions.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No posts available</p>
            )}
          </div>
        </div>

        {/* Top by Comments */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageCircle size={20} className="text-purple-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Top by Comments</h3>
          </div>
          <div className="space-y-3">
            {topByComments.map((post, i) => (
              <PostCard key={post.id} post={post} rank={i + 1} type="top" />
            ))}
            {topByComments.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No posts available</p>
            )}
          </div>
        </div>

        {/* Worst Performers */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Low Performers</h3>
          </div>
          <div className="space-y-3">
            {worstPosts.map((post, i) => (
              <PostCard key={post.id} post={post} rank={i + 1} type="worst" />
            ))}
            {worstPosts.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No posts available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
