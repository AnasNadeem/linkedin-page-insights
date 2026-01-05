import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { LinkedInApiService } from "@/lib/linkedin-api";
import { transformLinkedInData } from "@/lib/data-transformer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId } = await params;

  try {
    const linkedin = new LinkedInApiService(session.accessToken);

    // Fetch organization details
    const organizations = await linkedin.getAdministeredOrganizations();
    const organization = organizations.find((org) => org.id === orgId);

    // Fetch posts
    const posts = await linkedin.getOrganizationPosts(orgId);

    // Fetch analytics for posts
    const shareUrns = posts.map((p) => p.activity || `urn:li:share:${p.id}`);
    const analytics = await linkedin.getPostAnalytics(orgId, shareUrns);

    // Transform to match existing Post interface
    const transformedData = transformLinkedInData(posts, analytics, organization);

    return NextResponse.json({
      data: {
        posts: {
          edges: transformedData,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
