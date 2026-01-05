export interface LinkedInOrganization {
  id: string;
  localizedName: string;
  vanityName: string;
  logoV2?: {
    original: string;
  };
}

export interface LinkedInOrganizationRole {
  organization: string;
  role: "ADMINISTRATOR" | "DIRECT_SPONSORED_CONTENT_POSTER" | "RECRUITING_POSTER";
  state: "APPROVED" | "PENDING" | "REVOKED";
}

export interface OrganizationShare {
  id: string;
  text?: {
    text: string;
  };
  created: {
    time: number;
  };
  activity: string;
  content?: {
    contentEntities?: Array<{
      entityLocation?: string;
      thumbnails?: Array<{
        resolvedUrl: string;
      }>;
    }>;
  };
}

export interface ShareStatistics {
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

export interface OrganizationAclsResponse {
  elements: LinkedInOrganizationRole[];
}

export interface OrganizationsResponse {
  results: Record<string, LinkedInOrganization>;
}

export interface SharesResponse {
  elements: OrganizationShare[];
}

export interface ShareStatisticsResponse {
  elements: Array<{
    share: string;
    totalShareStatistics: ShareStatistics["totalShareStatistics"];
  }>;
}
