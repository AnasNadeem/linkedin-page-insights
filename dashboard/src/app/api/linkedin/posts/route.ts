import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { LinkedInApiService } from "@/lib/linkedin-api";
import { transformUserPosts } from "@/lib/data-transformer";

interface AuthorInfo {
  sub: string;
  name: string;
  picture?: string;
  type: "personal" | "organization";
}

export async function GET() {
  const session = await getSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const linkedin = new LinkedInApiService(session.accessToken);
    const allTransformedData: ReturnType<typeof transformUserPosts> = [];

    // Get selected pages from session, fallback to personal profile
    let selectedPages = session.selectedPages;

    // If no pages selected, default to personal profile
    if (!selectedPages || selectedPages.length === 0) {
      selectedPages = [`urn:li:person:${session.user.id}`];
    }

    console.log("[Posts API] Fetching posts for pages:", selectedPages);

    // Build a map of author info for selected pages
    const authorInfoMap = new Map<string, AuthorInfo>();

    // Add personal profile info
    authorInfoMap.set(`urn:li:person:${session.user.id}`, {
      sub: session.user.id,
      name: session.user.name,
      picture: session.user.image,
      type: "personal",
    });

    // Fetch organization details for selected org pages
    for (const pageUrn of selectedPages) {
      if (pageUrn.includes("organization")) {
        try {
          const orgId = pageUrn.split(":").pop();
          if (orgId) {
            const response = await fetch(`https://api.linkedin.com/v2/organizations/${orgId}`, {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
                "X-Restli-Protocol-Version": "2.0.0",
                "LinkedIn-Version": "202401",
              },
            });

            if (response.ok) {
              const orgDetails = await response.json();
              let logoUrl: string | undefined;
              if (orgDetails.logoV2?.["cropped~"]?.elements?.[0]?.identifiers?.[0]?.identifier) {
                logoUrl = orgDetails.logoV2["cropped~"].elements[0].identifiers[0].identifier;
              }

              authorInfoMap.set(pageUrn, {
                sub: orgId,
                name: orgDetails.localizedName || `Organization ${orgId}`,
                picture: logoUrl,
                type: "organization",
              });
            }
          }
        } catch (error) {
          console.error(`[Posts API] Error fetching org details for ${pageUrn}:`, error);
        }
      }
    }

    // Fetch posts for each selected page
    for (const pageUrn of selectedPages) {
      try {
        console.log(`[Posts API] Fetching posts for: ${pageUrn}`);

        const posts = await linkedin.getUserPosts(pageUrn);
        console.log(`[Posts API] Fetched ${posts.length} posts for ${pageUrn}`);

        if (posts.length > 0) {
          // Fetch analytics
          const postUrns = posts.map((p) => p.id);
          let analytics: Map<string, Parameters<typeof transformUserPosts>[1] extends Map<string, infer V> ? V : never>;

          // Try org analytics for organization pages
          if (pageUrn.includes("organization")) {
            analytics = await linkedin.getOrganizationPostsAnalytics(pageUrn);

            // Fallback to regular analytics if org analytics didn't work
            if (analytics.size === 0) {
              analytics = await linkedin.getPostAnalytics(postUrns);
            }
          } else {
            analytics = await linkedin.getPostAnalytics(postUrns);
          }

          // Get author info for this page
          const authorInfo = authorInfoMap.get(pageUrn) || {
            sub: session.user.id,
            name: session.user.name,
            picture: session.user.image,
            type: "personal" as const,
          };

          // Transform posts with author info
          const transformedPosts = transformUserPosts(posts, analytics, {
            sub: authorInfo.sub,
            name: authorInfo.name,
            picture: authorInfo.picture,
            type: authorInfo.type,
            pageUrn,
          });

          allTransformedData.push(...transformedPosts);
        }
      } catch (error) {
        console.error(`[Posts API] Error fetching posts for ${pageUrn}:`, error);
        // Continue with other pages
      }
    }

    // Sort all posts by date
    allTransformedData.sort((a, b) =>
      new Date(b.node.sentAt).getTime() - new Date(a.node.sentAt).getTime()
    );

    console.log(`[Posts API] Total posts fetched: ${allTransformedData.length}`);

    return NextResponse.json({
      data: {
        posts: {
          edges: allTransformedData,
        },
      },
      user: session.user,
      selectedPages,
    });
  } catch (error) {
    console.error("[Posts API] Failed to fetch posts:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
