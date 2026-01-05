import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { LinkedInApiService } from "@/lib/linkedin-api";
import { transformUserPosts } from "@/lib/data-transformer";

export async function GET() {
  const session = await getSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const linkedin = new LinkedInApiService(session.accessToken);

    // Get user URN from session
    const authorUrn = `urn:li:person:${session.user.id}`;

    console.log("[Posts API] Fetching posts for user:", authorUrn);

    // Fetch user's posts
    const posts = await linkedin.getUserPosts(authorUrn);
    console.log("[Posts API] Fetched posts count:", posts.length);

    // Fetch analytics for posts
    const postUrns = posts.map((p) => p.id);
    const analytics = await linkedin.getPostAnalytics(postUrns);

    // Transform to match existing Post interface
    const transformedData = transformUserPosts(posts, analytics, {
      sub: session.user.id,
      name: session.user.name,
      picture: session.user.image,
    });

    return NextResponse.json({
      data: {
        posts: {
          edges: transformedData,
        },
      },
      user: session.user,
    });
  } catch (error) {
    console.error("[Posts API] Failed to fetch posts:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
