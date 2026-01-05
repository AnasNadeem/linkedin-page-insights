import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { selectedPages } = body as { selectedPages: string[] };

    if (!selectedPages || !Array.isArray(selectedPages) || selectedPages.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one page" },
        { status: 400 }
      );
    }

    // Update session with selected pages
    const updatedSession = {
      ...session,
      selectedPages,
    };

    // Store updated session
    const cookieStore = await cookies();
    const sessionCookie = Buffer.from(JSON.stringify(updatedSession)).toString("base64");

    cookieStore.set("linkedin_session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: Math.floor((session.expiresAt - Date.now()) / 1000),
      path: "/",
    });

    return NextResponse.json({ success: true, selectedPages });
  } catch (error) {
    console.error("[Select Pages] Error:", error);
    return NextResponse.json(
      { error: "Failed to save selection" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      selectedPages: (session as typeof session & { selectedPages?: string[] }).selectedPages || [],
    });
  } catch (error) {
    console.error("[Select Pages] Error:", error);
    return NextResponse.json(
      { error: "Failed to get selection" },
      { status: 500 }
    );
  }
}
