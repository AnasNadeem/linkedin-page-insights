import { Post, PostMetric, PostEdge, Annotation } from "@/types/linkedin";
import { OrganizationShare, ShareStatisticsResponse, LinkedInOrganization } from "@/types/linkedin-api";

function extractHashtags(text: string): Annotation[] {
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

export function transformLinkedInData(
  posts: OrganizationShare[],
  analytics: Map<string, ShareStatisticsResponse["elements"][0]["totalShareStatistics"]>,
  organization?: LinkedInOrganization
): PostEdge[] {
  return posts.map((post) => {
    const shareUrn = `urn:li:share:${post.id}`;
    const stats = analytics.get(shareUrn) || analytics.get(post.activity) || {
      impressionCount: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      engagement: 0,
    };

    const postText = post.text?.text || "";
    const sentAt = new Date(post.created.time).toISOString();

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
        value: stats.engagement * 100,
        nullableValue: stats.engagement * 100,
        unit: "percentage",
        __typename: "PostMetric",
      },
    ];

    // Extract images from content entities
    const assets = (post.content?.contentEntities || [])
      .filter((entity) => entity.thumbnails && entity.thumbnails.length > 0)
      .map((entity) => ({
        __typename: "ImageAsset" as const,
        mimeType: "image/jpeg",
        thumbnail: entity.thumbnails?.[0]?.resolvedUrl || "",
        source: entity.thumbnails?.[0]?.resolvedUrl || "",
        image: {
          altText: "",
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
        id: organization?.id || "",
        email: "",
        name: organization?.localizedName || "",
        avatar: organization?.logoV2?.original || "",
        isDeleted: false,
      },
      isCustomScheduled: false,
      isPinned: false,
      externalLink: `https://www.linkedin.com/feed/update/${post.activity}`,
      createdAt: sentAt,
      updatedAt: sentAt,
      metricsUpdatedAt: new Date().toISOString(),
      text: postText,
      metadata: {
        __typename: "LinkedInPostMetadata",
        type: "post",
        annotations: extractHashtags(postText),
        firstComment: null,
        linkAttachment: null,
      },
      channel: {
        __typename: "Channel",
        id: organization?.id || "",
        type: "page",
        name: organization?.localizedName || "",
        avatar: organization?.logoV2?.original || "",
        service: "linkedin",
        products: ["analyze"],
        serviceId: organization?.id || "",
        serverUrl: null,
        timezone: "UTC",
        displayName: organization?.localizedName || "",
        isQueuePaused: false,
        isDisconnected: false,
        locationData: null,
        scopes: [],
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
