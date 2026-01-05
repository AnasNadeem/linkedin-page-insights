import {
  LinkedInOrganization,
  OrganizationAclsResponse,
  OrganizationsResponse,
  OrganizationShare,
  SharesResponse,
  ShareStatisticsResponse,
} from "@/types/linkedin-api";

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

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

  async getAdministeredOrganizations(): Promise<LinkedInOrganization[]> {
    // Get organization roles where user is admin
    const rolesResponse = await this.fetch<OrganizationAclsResponse>(
      "/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED"
    );

    if (!rolesResponse.elements || rolesResponse.elements.length === 0) {
      return [];
    }

    // Extract organization URNs
    const orgUrns = rolesResponse.elements.map((r) => r.organization);

    // Batch fetch organization details
    const orgIds = orgUrns.map((urn) => urn.replace("urn:li:organization:", ""));
    const orgsResponse = await this.fetch<OrganizationsResponse>(
      `/organizations?ids=List(${orgIds.join(",")})`
    );

    return Object.values(orgsResponse.results || {});
  }

  async getOrganizationPosts(organizationId: string, count = 100): Promise<OrganizationShare[]> {
    const response = await this.fetch<SharesResponse>(
      `/shares?q=owners&owners=List(urn:li:organization:${organizationId})&count=${count}&sortBy=LAST_MODIFIED`
    );
    return response.elements || [];
  }

  async getPostAnalytics(
    organizationId: string,
    shareUrns: string[]
  ): Promise<Map<string, ShareStatisticsResponse["elements"][0]["totalShareStatistics"]>> {
    if (shareUrns.length === 0) {
      return new Map();
    }

    const analyticsMap = new Map<
      string,
      ShareStatisticsResponse["elements"][0]["totalShareStatistics"]
    >();

    // LinkedIn API has limits, so we batch the requests
    const batchSize = 20;
    for (let i = 0; i < shareUrns.length; i += batchSize) {
      const batch = shareUrns.slice(i, i + batchSize);
      const encodedShares = batch.map((urn) => encodeURIComponent(urn)).join(",");

      try {
        const response = await this.fetch<ShareStatisticsResponse>(
          `/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}&shares=List(${encodedShares})`
        );

        for (const stat of response.elements || []) {
          analyticsMap.set(stat.share, stat.totalShareStatistics);
        }
      } catch (error) {
        console.error("Error fetching analytics batch:", error);
      }
    }

    return analyticsMap;
  }

  async getOrganizationFollowerStats(organizationId: string) {
    return this.fetch(
      `/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}`
    );
  }
}
