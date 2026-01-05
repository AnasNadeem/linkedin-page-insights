import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { LinkedInApiService } from "@/lib/linkedin-api";

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const linkedin = new LinkedInApiService(session.accessToken);
    const organizations = await linkedin.getAdministeredOrganizations();
    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Failed to fetch organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
