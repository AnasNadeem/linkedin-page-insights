import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const LINKEDIN_API_BASE = "https://api.linkedin.com";

export interface LinkedInOrganization {
  id: string;
  localizedName: string;
  vanityName?: string;
  logoV2?: {
    original?: string;
    "cropped~"?: {
      elements?: Array<{
        identifiers?: Array<{
          identifier?: string;
        }>;
      }>;
    };
  };
}

export interface OrganizationAcl {
  organization: string; // URN format: urn:li:organization:123
  role: string;
  state: string;
}

async function fetchWithAuth(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": "202401",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`LinkedIn API Error: ${response.status} - ${error}`);
    throw new Error(`LinkedIn API Error: ${response.status}`);
  }

  return response.json();
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessToken, user } = session;

    // Fetch organizations where user has admin or content poster role
    // Using organizationAcls endpoint with roleAssignee finder
    let organizations: Array<{
      id: string;
      urn: string;
      name: string;
      vanityName?: string;
      logo?: string;
      role: string;
      type: "organization";
    }> = [];

    try {
      // Get all organization ACLs for the current user
      const aclsResponse = await fetchWithAuth(
        `${LINKEDIN_API_BASE}/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED`,
        accessToken
      );

      console.log("[Organizations] ACLs response:", JSON.stringify(aclsResponse, null, 2));

      const acls: OrganizationAcl[] = aclsResponse.elements || [];

      // Fetch details for each organization
      for (const acl of acls) {
        try {
          // Extract organization ID from URN (urn:li:organization:123 -> 123)
          const orgId = acl.organization.split(":").pop();

          if (orgId) {
            // Fetch organization details
            const orgDetails = await fetchWithAuth(
              `${LINKEDIN_API_BASE}/v2/organizations/${orgId}`,
              accessToken
            );

            console.log("[Organizations] Org details:", JSON.stringify(orgDetails, null, 2));

            // Extract logo URL if available
            let logoUrl: string | undefined;
            if (orgDetails.logoV2?.["cropped~"]?.elements?.[0]?.identifiers?.[0]?.identifier) {
              logoUrl = orgDetails.logoV2["cropped~"].elements[0].identifiers[0].identifier;
            } else if (orgDetails.logoV2?.original) {
              logoUrl = orgDetails.logoV2.original;
            }

            organizations.push({
              id: orgId,
              urn: acl.organization,
              name: orgDetails.localizedName || orgDetails.name?.localized?.en_US || `Organization ${orgId}`,
              vanityName: orgDetails.vanityName,
              logo: logoUrl,
              role: acl.role,
              type: "organization",
            });
          }
        } catch (orgError) {
          console.error(`[Organizations] Error fetching org ${acl.organization}:`, orgError);
          // Continue with other organizations
        }
      }
    } catch (aclError) {
      console.error("[Organizations] Error fetching ACLs:", aclError);
      // Continue without organization data - user might not have org access
    }

    // Also try to get organizations where user is a content poster
    try {
      const posterAclsResponse = await fetchWithAuth(
        `${LINKEDIN_API_BASE}/v2/organizationAcls?q=roleAssignee&role=DIRECT_SPONSORED_CONTENT_POSTER&state=APPROVED`,
        accessToken
      );

      const posterAcls: OrganizationAcl[] = posterAclsResponse.elements || [];

      for (const acl of posterAcls) {
        // Skip if already added as admin
        const orgId = acl.organization.split(":").pop();
        if (organizations.some((o) => o.id === orgId)) continue;

        try {
          if (orgId) {
            const orgDetails = await fetchWithAuth(
              `${LINKEDIN_API_BASE}/v2/organizations/${orgId}`,
              accessToken
            );

            let logoUrl: string | undefined;
            if (orgDetails.logoV2?.["cropped~"]?.elements?.[0]?.identifiers?.[0]?.identifier) {
              logoUrl = orgDetails.logoV2["cropped~"].elements[0].identifiers[0].identifier;
            }

            organizations.push({
              id: orgId,
              urn: acl.organization,
              name: orgDetails.localizedName || `Organization ${orgId}`,
              vanityName: orgDetails.vanityName,
              logo: logoUrl,
              role: acl.role,
              type: "organization",
            });
          }
        } catch (orgError) {
          console.error(`[Organizations] Error fetching poster org:`, orgError);
        }
      }
    } catch {
      // Ignore poster ACL errors
    }

    // Include personal profile as an option
    const personalProfile = {
      id: user.id,
      urn: `urn:li:person:${user.id}`,
      name: user.name,
      logo: user.image,
      role: "OWNER",
      type: "personal" as const,
    };

    return NextResponse.json({
      personal: personalProfile,
      organizations,
    });
  } catch (error) {
    console.error("[Organizations] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
