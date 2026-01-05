import { Post, PostMetric, PostEdge, Annotation } from "@/types/linkedin";
import { LinkedInPost, PostAnalytics } from "./linkedin-api";

function extractHashtags(text: string): Annotation[] {
  if (!text) return [];

  const hashtagRegex = /#(\w+)/g;
  const annotations: Annotation[] = [];
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    annotations.push({
      __typename: "Annotation",
      type: "hashtag",
      indices: [match.index, match.index + match[0].length],
      content: match[1],
      text: match[0],
      url: `https://www.linkedin.com/feed/hashtag/${match[1]}`,
    });
  }

  return annotations;
}

function getPostText(post: LinkedInPost): string {
  // Try different locations where text might be
  if (post.text) return post.text;

  const shareContent = post.specificContent?.["com.linkedin.ugc.ShareContent"];
  if (shareContent?.shareCommentary?.text) {
    return shareContent.shareCommentary.text;
  }

  return "";
}

function hasMedia(post: LinkedInPost): boolean {
  const shareContent = post.specificContent?.["com.linkedin.ugc.ShareContent"];
  if (shareContent?.shareMediaCategory === "IMAGE" || shareContent?.shareMediaCategory === "VIDEO") {
    return true;
  }
  if (shareContent?.media && shareContent.media.length > 0) {
    return true;
  }
  return false;
}

interface AuthorProfile {
  sub: string;
  name: string;
  picture?: string;
  type?: "personal" | "organization";
  pageUrn?: string;
}

export function transformUserPosts(
  posts: LinkedInPost[],
  analytics: Map<string, PostAnalytics["totalShareStatistics"]>,
  userProfile?: AuthorProfile
): PostEdge[] {
  return posts.map((post) => {
    const postUrn = post.id.startsWith("urn:") ? post.id : `urn:li:share:${post.id}`;
    const stats = analytics.get(postUrn) || analytics.get(post.id) || {
      impressionCount: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      engagement: 0,
    };

    const postText = getPostText(post);
    const sentAt = new Date(post.created?.time || Date.now()).toISOString();

    const metrics: PostMetric[] = [
      {
        type: "impressions",
        name: "impressions",
        displayName: "Impressions",
        description: "Number of times your post was shown",
        value: stats.impressionCount,
        nullableValue: stats.impressionCount,
        unit: "count",
        __typename: "PostMetric",
      },
      {
        type: "reactions",
        name: "reactions",
        displayName: "Reactions",
        description: "Number of reactions on your post",
        value: stats.likeCount,
        nullableValue: stats.likeCount,
        unit: "count",
        __typename: "PostMetric",
      },
      {
        type: "comments",
        name: "comments",
        displayName: "Comments",
        description: "Number of comments on your post",
        value: stats.commentCount,
        nullableValue: stats.commentCount,
        unit: "count",
        __typename: "PostMetric",
      },
      {
        type: "shares",
        name: "shares",
        displayName: "Shares",
        description: "Number of shares of your post",
        value: stats.shareCount,
        nullableValue: stats.shareCount,
        unit: "count",
        __typename: "PostMetric",
      },
      {
        type: "engagementRate",
        name: "engagementRate",
        displayName: "Engagement Rate",
        description: "Engagement rate percentage",
        value: stats.impressionCount > 0
          ? ((stats.likeCount + stats.commentCount + stats.shareCount) / stats.impressionCount) * 100
          : 0,
        nullableValue: stats.engagement * 100,
        unit: "percentage",
        __typename: "PostMetric",
      },
    ];

    // Extract media/images from post
    const shareContent = post.specificContent?.["com.linkedin.ugc.ShareContent"];
    const assets = (shareContent?.media || [])
      .filter((m) => m.status === "READY" && m.media)
      .map((m) => ({
        __typename: "ImageAsset" as const,
        mimeType: "image/jpeg",
        thumbnail: m.originalUrl || "",
        source: m.originalUrl || "",
        image: {
          altText: m.title?.text || "",
          width: 0,
          height: 0,
          isAnimated: false,
          __typename: "ImageMetadata",
        },
      }));

    const transformedPost: Post = {
      id: post.id,
      dueAt: sentAt,
      sentAt: sentAt,
      allowedActions: ["viewPost"],
      ideaId: null,
      status: "sent",
      notificationStatus: null,
      sharedNow: false,
      via: "linkedin",
      schedulingType: null,
      author: {
        __typename: "Author",
        id: userProfile?.sub || post.author || "",
        email: "",
        name: userProfile?.name || "",
        avatar: userProfile?.picture || "",
        isDeleted: false,
      },
      isCustomScheduled: false,
      isPinned: false,
      externalLink: `https://www.linkedin.com/feed/update/${postUrn}`,
      createdAt: sentAt,
      updatedAt: new Date(post.lastModified?.time || post.created?.time || Date.now()).toISOString(),
      metricsUpdatedAt: new Date().toISOString(),
      text: postText,
      metadata: {
        __typename: "LinkedInPostMetadata",
        type: hasMedia(post) ? "image" : "text",
        annotations: extractHashtags(postText),
        firstComment: null,
        linkAttachment: null,
      },
      channel: {
        __typename: "Channel",
        id: userProfile?.sub || "",
        type: userProfile?.type === "organization" ? "page" : "profile",
        name: userProfile?.name || "",
        avatar: userProfile?.picture || "",
        service: "linkedin",
        products: ["analyze"],
        serviceId: userProfile?.sub || "",
        serverUrl: null,
        timezone: "UTC",
        displayName: userProfile?.name || "",
        isQueuePaused: false,
        isDisconnected: false,
        locationData: null,
        scopes: [],
        pageUrn: userProfile?.pageUrn,
      },
      tags: [],
      notes: [],
      error: null,
      assets,
      metrics,
      __typename: "Post",
    };

    return {
      node: transformedPost,
      __typename: "PostEdge",
    };
  });
}
