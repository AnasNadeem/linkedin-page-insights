'use client';

import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useData } from '@/context/DataContext';
import { getMetric, getHashtags, formatDate, hasImages } from '@/lib/utils';
import {
  Eye, ThumbsUp, MessageCircle, Share2, ExternalLink,
  TrendingUp, TrendingDown, Minus, Image as ImageIcon,
  FileText, Calendar, ArrowUpDown, ChevronDown, ChevronUp
} from 'lucide-react';
import { Post } from '@/types/linkedin';

type SortKey = 'date' | 'impressions' | 'reactions' | 'comments' | 'shares' | 'engagement' | 'length';
type SortOrder = 'asc' | 'desc';

function getEngagementLevel(post: Post, avgImpressions: number): 'high' | 'medium' | 'low' {
  const impressions = getMetric(post, 'impressions');
  if (impressions >= avgImpressions * 1.5) return 'high';
  if (impressions >= avgImpressions * 0.5) return 'medium';
  return 'low';
}

function getEngagementRate(post: Post): number {
  const impressions = getMetric(post, 'impressions');
  const reactions = getMetric(post, 'reactions');
  const comments = getMetric(post, 'comments');
  const shares = getMetric(post, 'shares');
  if (impressions === 0) return 0;
  return ((reactions + comments + shares) / impressions) * 100;
}

export default function PostsPage() {
  const { filteredPosts, analytics, loading, error } = useData();
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      let aVal: number, bVal: number;

      switch (sortKey) {
        case 'date':
          aVal = new Date(a.sentAt).getTime();
          bVal = new Date(b.sentAt).getTime();
          break;
        case 'impressions':
          aVal = getMetric(a, 'impressions');
          bVal = getMetric(b, 'impressions');
          break;
        case 'reactions':
          aVal = getMetric(a, 'reactions');
          bVal = getMetric(b, 'reactions');
          break;
        case 'comments':
          aVal = getMetric(a, 'comments');
          bVal = getMetric(b, 'comments');
          break;
        case 'shares':
          aVal = getMetric(a, 'shares');
          bVal = getMetric(b, 'shares');
          break;
        case 'engagement':
          aVal = getEngagementRate(a);
          bVal = getEngagementRate(b);
          break;
        case 'length':
          aVal = a.text?.length || 0;
          bVal = b.text?.length || 0;
          break;
        default:
          return 0;
      }

      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [filteredPosts, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
        sortKey === sortKeyName ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
      {sortKey === sortKeyName && (
        sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />
      )}
    </button>
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center text-red-600 py-12">{error}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">All Posts</h1>
        <p className="text-gray-600">Detailed analytics for each post with performance metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{filteredPosts.length}</div>
          <div className="text-xs text-gray-500 uppercase">Total Posts</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{analytics.totalImpressions.toLocaleString()}</div>
          <div className="text-xs text-gray-500 uppercase">Total Views</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{Math.round(analytics.avgImpressions).toLocaleString()}</div>
          <div className="text-xs text-gray-500 uppercase">Avg Views</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{analytics.avgEngagementRate.toFixed(2)}%</div>
          <div className="text-xs text-gray-500 uppercase">Avg Engagement</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{analytics.postsWithImages}</div>
          <div className="text-xs text-gray-500 uppercase">With Images</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{Math.round(analytics.avgPostLength)}</div>
          <div className="text-xs text-gray-500 uppercase">Avg Length</div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="col-span-4">
            <SortHeader label="Post Content" sortKeyName="date" />
          </div>
          <div className="col-span-1 text-center">
            <SortHeader label="Views" sortKeyName="impressions" />
          </div>
          <div className="col-span-1 text-center">
            <SortHeader label="Reactions" sortKeyName="reactions" />
          </div>
          <div className="col-span-1 text-center">
            <SortHeader label="Comments" sortKeyName="comments" />
          </div>
          <div className="col-span-1 text-center">
            <SortHeader label="Shares" sortKeyName="shares" />
          </div>
          <div className="col-span-1 text-center">
            <SortHeader label="Eng Rate" sortKeyName="engagement" />
          </div>
          <div className="col-span-1 text-center">
            <SortHeader label="Length" sortKeyName="length" />
          </div>
          <div className="col-span-2 text-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Performance</span>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {sortedPosts.map((post) => {
            const hashtags = getHashtags(post);
            const engagementLevel = getEngagementLevel(post, analytics.avgImpressions);
            const engagementRate = getEngagementRate(post);
            const postImage = post.assets?.[0]?.thumbnail || post.assets?.[0]?.source;
            const isExpanded = expandedPost === post.id;
            const impressions = getMetric(post, 'impressions');
            const vsAvg = analytics.avgImpressions > 0
              ? ((impressions - analytics.avgImpressions) / analytics.avgImpressions) * 100
              : 0;

            return (
              <div key={post.id} className="hover:bg-gray-50 transition-colors">
                <div
                  className="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer"
                  onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                >
                  {/* Post Content */}
                  <div className="col-span-4 flex items-start gap-3">
                    {postImage ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img src={postImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg flex-shrink-0 bg-gray-100 flex items-center justify-center">
                        <FileText size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 font-medium line-clamp-2">{post.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(post.sentAt)}
                        </span>
                        {hasImages(post) && (
                          <span className="text-xs text-blue-600 flex items-center gap-1">
                            <ImageIcon size={12} />
                            Image
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Impressions */}
                  <div className="col-span-1 text-center">
                    <div className="text-sm font-semibold text-gray-900">{impressions.toLocaleString()}</div>
                  </div>

                  {/* Reactions */}
                  <div className="col-span-1 text-center">
                    <div className="text-sm font-semibold text-gray-900">{getMetric(post, 'reactions')}</div>
                  </div>

                  {/* Comments */}
                  <div className="col-span-1 text-center">
                    <div className="text-sm font-semibold text-gray-900">{getMetric(post, 'comments')}</div>
                  </div>

                  {/* Shares */}
                  <div className="col-span-1 text-center">
                    <div className="text-sm font-semibold text-gray-900">{getMetric(post, 'shares')}</div>
                  </div>

                  {/* Engagement Rate */}
                  <div className="col-span-1 text-center">
                    <div className="text-sm font-semibold text-gray-900">{engagementRate.toFixed(1)}%</div>
                  </div>

                  {/* Length */}
                  <div className="col-span-1 text-center">
                    <div className="text-sm text-gray-600">{post.text?.length || 0}</div>
                  </div>

                  {/* Performance */}
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      engagementLevel === 'high'
                        ? 'bg-green-100 text-green-700'
                        : engagementLevel === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}>
                      {engagementLevel === 'high' && <TrendingUp size={12} />}
                      {engagementLevel === 'medium' && <Minus size={12} />}
                      {engagementLevel === 'low' && <TrendingDown size={12} />}
                      {engagementLevel}
                    </span>
                    <span className={`text-xs font-medium ${vsAvg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {vsAvg >= 0 ? '+' : ''}{vsAvg.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                      {/* Full Content */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Full Content</h4>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-200">
                          {post.text}
                        </p>
                        {hashtags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {hashtags.map(tag => (
                              <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Detailed Metrics */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Performance Analysis</h4>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Views vs Average</span>
                            <span className={`text-sm font-semibold ${vsAvg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {vsAvg >= 0 ? '+' : ''}{vsAvg.toFixed(1)}% ({impressions.toLocaleString()} vs {Math.round(analytics.avgImpressions).toLocaleString()})
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Engagement Rate</span>
                            <span className="text-sm font-semibold text-gray-900">{engagementRate.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Post Length</span>
                            <span className="text-sm text-gray-900">{post.text?.length || 0} characters</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Has Image</span>
                            <span className="text-sm text-gray-900">{hasImages(post) ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Hashtags</span>
                            <span className="text-sm text-gray-900">{hashtags.length}</span>
                          </div>
                        </div>

                        {post.externalLink && (
                          <a
                            href={post.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink size={14} />
                            View on LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sortedPosts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No posts match your current filters
          </div>
        )}
      </div>
    </MainLayout>
  );
}
