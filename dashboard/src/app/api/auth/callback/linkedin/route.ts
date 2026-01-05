import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Check for errors from LinkedIn
  if (error) {
    console.error("[LinkedIn OAuth] Error from LinkedIn:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  if (!code || !state) {
    console.error("[LinkedIn OAuth] Missing code or state");
    return NextResponse.redirect(new URL("/login?error=Missing+code+or+state", request.url));
  }

  // Verify state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("linkedin_oauth_state")?.value;

  if (state !== savedState) {
    console.error("[LinkedIn OAuth] State mismatch");
    return NextResponse.redirect(new URL("/login?error=Invalid+state", request.url));
  }

  // Clear the state cookie
  cookieStore.delete("linkedin_oauth_state");

  try {
    // Exchange code for tokens
    const clientId = process.env.LINKEDIN_CLIENT_ID!;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/linkedin`;

    console.log("[LinkedIn OAuth] Exchanging code for tokens...");
    console.log("[LinkedIn OAuth] Client ID:", clientId);
    console.log("[LinkedIn OAuth] Redirect URI:", redirectUri);

    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("[LinkedIn OAuth] Token error:", tokens);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(tokens.error_description || tokens.error)}`, request.url)
      );
    }

    console.log("[LinkedIn OAuth] Token exchange successful!");

    // Get user info
    const userInfoResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      console.error("[LinkedIn OAuth] User info error:", userInfo);
      return NextResponse.redirect(new URL("/login?error=Failed+to+get+user+info", request.url));
    }

    console.log("[LinkedIn OAuth] User info fetched:", userInfo.name);

    // Create session data
    const sessionData = {
      user: {
        id: userInfo.sub,
        name: userInfo.name,
        email: userInfo.email,
        image: userInfo.picture,
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
    };

    // Store session in a cookie (encrypted in production you'd use a proper session store)
    const sessionCookie = Buffer.from(JSON.stringify(sessionData)).toString("base64");

    cookieStore.set("linkedin_session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in,
      path: "/",
    });

    console.log("[LinkedIn OAuth] Session created, redirecting to home...");

    return NextResponse.redirect(new URL("/", request.url));
  } catch (err) {
    console.error("[LinkedIn OAuth] Error:", err);
    return NextResponse.redirect(new URL("/login?error=Authentication+failed", request.url));
  }
}
