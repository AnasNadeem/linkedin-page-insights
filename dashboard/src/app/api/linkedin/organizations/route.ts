import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const LINKEDIN_API_BASE = "https://api.linkedin.com";

export interface OrganizationAcl {
  organization: string;
  role: string;
  state: string;
}

interface FetchResult<T> {
  data: T | null;
  error: string | null;
  status: number;
  permissionError?: boolean;
}

async function fetchWithAuth<T>(url: string, accessToken: string): Promise<FetchResult<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202401",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      const isPermissionError = response.status === 403 || error.includes("ACCESS_DENIED");
      console.error(`LinkedIn API Error: ${response.status} - ${error}`);
      return { data: null, error, status: response.status, permissionError: isPermissionError };
    }

    const data = await response.json();
    return { data, error: null, status: response.status };
  } catch (err) {
    return { data: null, error: String(err), status: 500 };
  }
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessToken, user } = session;

    let organizations: Array<{
      id: string;
      urn: string;
      name: string;
      vanityName?: string;
      logo?: string;
      role: string;
      type: "organization";
    }> = [];

    let hasOrgPermission = true;
    let orgPermissionError: string | null = null;

    // Try to fetch organizations where user has admin role
    const aclsResult = await fetchWithAuth<{ elements: OrganizationAcl[] }>(
      `${LINKEDIN_API_BASE}/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED`,
      accessToken
    );

    if (aclsResult.permissionError) {
      hasOrgPermission = false;
      orgPermissionError = "Your LinkedIn app doesn't have permission to access organization data. You need the 'Community Management API' product.";
      console.log("[Organizations] No permission for organizationAcls API");
    } else if (aclsResult.data?.elements) {
      const acls = aclsResult.data.elements;
      console.log(`[Organizations] Found ${acls.length} admin organizations`);

      for (const acl of acls) {
        const orgId = acl.organization.split(":").pop();
        if (!orgId) continue;

        const orgResult = await fetchWithAuth<{
          localizedName?: string;
          name?: { localized?: { en_US?: string } };
          vanityName?: string;
          logoV2?: {
            original?: string;
            "cropped~"?: {
              elements?: Array<{
                identifiers?: Array<{ identifier?: string }>;
              }>;
            };
          };
        }>(`${LINKEDIN_API_BASE}/v2/organizations/${orgId}`, accessToken);

        if (orgResult.data) {
          let logoUrl: string | undefined;
          if (orgResult.data.logoV2?.["cropped~"]?.elements?.[0]?.identifiers?.[0]?.identifier) {
            logoUrl = orgResult.data.logoV2["cropped~"].elements[0].identifiers[0].identifier;
          } else if (orgResult.data.logoV2?.original) {
            logoUrl = orgResult.data.logoV2.original;
          }

          organizations.push({
            id: orgId,
            urn: acl.organization,
            name: orgResult.data.localizedName || orgResult.data.name?.localized?.en_US || `Organization ${orgId}`,
            vanityName: orgResult.data.vanityName,
            logo: logoUrl,
            role: acl.role,
            type: "organization",
          });
        }
      }
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
      permissions: {
        hasOrgAccess: hasOrgPermission,
        error: orgPermissionError,
      },
    });
  } catch (error) {
    console.error("[Organizations] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
