const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

export interface LinkedInPost {
  id: string;
  author: string;
  lifecycleState: string;
  visibility: {
    "com.linkedin.ugc.MemberNetworkVisibility": string;
  };
  created: {
    time: number;
  };
  lastModified: {
    time: number;
  };
  specificContent?: {
    "com.linkedin.ugc.ShareContent"?: {
      shareCommentary?: {
        text: string;
      };
      shareMediaCategory?: string;
      media?: Array<{
        status: string;
        media?: string;
        originalUrl?: string;
        title?: {
          text: string;
        };
      }>;
    };
  };
  text?: string;
}

export interface PostAnalytics {
  totalShareStatistics: {
    shareCount: number;
    clickCount: number;
    engagement: number;
    likeCount: number;
    commentCount: number;
    impressionCount: number;
    uniqueImpressionsCount: number;
  };
}

export interface UserProfile {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

export class LinkedInApiService {
  constructor(private accessToken: string) {}

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${LINKEDIN_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202401",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`LinkedIn API Error: ${response.status} - ${error}`);
      throw new Error(`LinkedIn API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Get current user profile
  async getUserProfile(): Promise<UserProfile> {
    return this.fetch<UserProfile>("/userinfo");
  }

  // Get posts for a specific author (person or organization)
  async getUserPosts(authorUrn: string, count = 50): Promise<LinkedInPost[]> {
    try {
      // Try the posts endpoint first (newer API)
      const response = await this.fetch<{ elements: LinkedInPost[] }>(
        `/posts?author=${encodeURIComponent(authorUrn)}&q=author&count=${count}`
      );
      return response.elements || [];
    } catch (error) {
      console.error("Error fetching posts via /posts endpoint:", error);

      // Fallback to ugcPosts endpoint
      try {
        const ugcResponse = await this.fetch<{ elements: LinkedInPost[] }>(
          `/ugcPosts?q=authors&authors=List(${encodeURIComponent(authorUrn)})&count=${count}`
        );
        return ugcResponse.elements || [];
      } catch (ugcError) {
        console.error("Error fetching ugcPosts:", ugcError);
        return [];
      }
    }
  }

  // Get posts for multiple authors (persons and organizations)
  async getPostsForMultipleAuthors(authorUrns: string[], count = 50): Promise<LinkedInPost[]> {
    const allPosts: LinkedInPost[] = [];

    for (const authorUrn of authorUrns) {
      try {
        const posts = await this.getUserPosts(authorUrn, count);
        // Add author info to each post for identification
        allPosts.push(...posts);
      } catch (error) {
        console.error(`Error fetching posts for ${authorUrn}:`, error);
      }
    }

    // Sort by creation time descending
    return allPosts.sort((a, b) => (b.created?.time || 0) - (a.created?.time || 0));
  }

  // Get organization posts analytics (more detailed for org pages)
  async getOrganizationPostsAnalytics(organizationUrn: string): Promise<Map<string, PostAnalytics["totalShareStatistics"]>> {
    const analyticsMap = new Map<string, PostAnalytics["totalShareStatistics"]>();

    try {
      // Try organizational share statistics endpoint
      const response = await this.fetch<{ elements: Array<{
        totalShareStatistics: PostAnalytics["totalShareStatistics"];
        share: string;
      }> }>(
        `/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(organizationUrn)}`
      );

      for (const element of response.elements || []) {
        if (element.share && element.totalShareStatistics) {
          analyticsMap.set(element.share, element.totalShareStatistics);
        }
      }
    } catch (error) {
      console.error("Error fetching organization analytics:", error);
    }

    return analyticsMap;
  }

  // Get analytics for user's posts
  async getPostAnalytics(postUrns: string[]): Promise<Map<string, PostAnalytics["totalShareStatistics"]>> {
    const analyticsMap = new Map<string, PostAnalytics["totalShareStatistics"]>();

    if (postUrns.length === 0) {
      return analyticsMap;
    }

    // Try to fetch social actions (likes, comments) for each post
    for (const postUrn of postUrns) {
      try {
        // Get social actions summary
        const socialActions = await this.fetch<{
          likes?: { count?: number };
          comments?: { count?: number };
        }>(`/socialActions/${encodeURIComponent(postUrn)}`);

        analyticsMap.set(postUrn, {
          likeCount: socialActions.likes?.count || 0,
          commentCount: socialActions.comments?.count || 0,
          shareCount: 0,
          clickCount: 0,
          engagement: 0,
          impressionCount: 0,
          uniqueImpressionsCount: 0,
        });
      } catch (error) {
        // If we can't get analytics, set defaults
        analyticsMap.set(postUrn, {
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
          clickCount: 0,
          engagement: 0,
          impressionCount: 0,
          uniqueImpressionsCount: 0,
        });
      }
    }

    return analyticsMap;
  }

  // Get reactions count for a specific post
  async getPostReactions(postUrn: string): Promise<number> {
    try {
      const response = await this.fetch<{ paging?: { total?: number } }>(
        `/reactions?q=entity&entity=${encodeURIComponent(postUrn)}`
      );
      return response.paging?.total || 0;
    } catch {
      return 0;
    }
  }

  // Get comments count for a specific post
  async getPostComments(postUrn: string): Promise<number> {
    try {
      const response = await this.fetch<{ paging?: { total?: number } }>(
        `/socialActions/${encodeURIComponent(postUrn)}/comments`
      );
      return response.paging?.total || 0;
    } catch {
      return 0;
    }
  }
}
