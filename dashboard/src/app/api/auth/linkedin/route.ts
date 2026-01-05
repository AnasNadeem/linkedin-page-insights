import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Custom LinkedIn OAuth - Step 1: Redirect to LinkedIn
export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/linkedin`;
  const scope = "openid profile email w_member_social";

  // Generate state for CSRF protection
  const state = crypto.randomUUID();

  // Store state in cookie
  const cookieStore = await cookies();
  cookieStore.set("linkedin_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", scope);

  return NextResponse.redirect(authUrl.toString());
}
