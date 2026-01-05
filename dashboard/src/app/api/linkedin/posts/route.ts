import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { LinkedInApiService } from "@/lib/linkedin-api";
import { transformUserPosts } from "@/lib/data-transformer";

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const linkedin = new LinkedInApiService(session.accessToken);

    // Get user profile to get the author URN
    const userProfile = await linkedin.getUserProfile();
    const authorUrn = `urn:li:person:${userProfile.sub}`;

    console.log("Fetching posts for user:", authorUrn);

    // Fetch user's posts
    const posts = await linkedin.getUserPosts(authorUrn);
    console.log("Fetched posts count:", posts.length);

    // Fetch analytics for posts
    const postUrns = posts.map((p) => p.id);
    const analytics = await linkedin.getPostAnalytics(postUrns);

    // Transform to match existing Post interface
    const transformedData = transformUserPosts(posts, analytics, userProfile);

    return NextResponse.json({
      data: {
        posts: {
          edges: transformedData,
        },
      },
      user: {
        id: userProfile.sub,
        name: userProfile.name,
        email: userProfile.email,
        image: userProfile.picture,
      },
    });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
