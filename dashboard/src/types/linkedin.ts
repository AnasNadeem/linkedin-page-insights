export interface PostMetric {
  type: 'reactions' | 'comments' | 'impressions' | 'shares' | 'engagementRate';
  name: string;
  displayName: string;
  description: string;
  value: number;
  nullableValue: number | null;
  unit: 'count' | 'percentage';
  __typename: string;
}

export interface Annotation {
  __typename: string;
  type: 'hashtag' | 'mention';
  indices: [number, number];
  content: string;
  text: string;
  url: string;
}

export interface ImageMetadata {
  altText: string;
  width: number;
  height: number;
  isAnimated: boolean;
  __typename: string;
}

export interface ImageAsset {
  __typename: 'ImageAsset';
  mimeType: string;
  thumbnail: string;
  source: string;
  image: ImageMetadata;
}

export interface Author {
  __typename: string;
  id: string;
  email: string;
  name: string;
  avatar: string;
  isDeleted: boolean;
}

export interface Channel {
  __typename: string;
  id: string;
  type: string;
  name: string;
  avatar: string;
  service: string;
  products: string[];
  serviceId: string;
  serverUrl: string | null;
  timezone: string;
  displayName: string;
  isQueuePaused: boolean;
  isDisconnected: boolean;
  locationData: string | null;
  scopes: string[];
  pageUrn?: string; // URN of the page/organization
}

export interface PostMetadata {
  __typename: string;
  type: string;
  annotations: Annotation[];
  firstComment: string | null;
  linkAttachment: string | null;
}

export interface Post {
  id: string;
  dueAt: string;
  sentAt: string;
  allowedActions: string[];
  ideaId: string | null;
  status: 'sent' | 'pending' | 'draft';
  notificationStatus: string | null;
  sharedNow: boolean;
  via: string;
  schedulingType: string | null;
  author: Author;
  isCustomScheduled: boolean;
  isPinned: boolean;
  externalLink: string;
  createdAt: string;
  updatedAt: string;
  metricsUpdatedAt: string;
  text: string;
  metadata: PostMetadata;
  channel: Channel;
  tags: string[];
  notes: string[];
  error: string | null;
  assets: ImageAsset[];
  metrics: PostMetric[];
  __typename: string;
}

export interface PostEdge {
  node: Post;
  __typename: string;
}

export interface LinkedInData {
  data: {
    posts: {
      edges: PostEdge[];
    };
  };
}

export type MetricType = 'reactions' | 'comments' | 'impressions' | 'shares' | 'engagementRate';

export interface FilterState {
  dateRange: 'all' | '7' | '30' | '90' | 'custom';
  dateFrom: string;
  dateTo: string;
  contentType: 'all' | 'image' | 'text';
  hashtag: string;
  engagement: 'all' | 'high' | 'medium' | 'low';
}

export interface HashtagStats {
  hashtag: string;
  count: number;
  avgImpressions: number;
  avgReactions: number;
  avgEngagement: number;
}
