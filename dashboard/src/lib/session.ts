import { cookies } from "next/headers";

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("linkedin_session")?.value;

    if (!sessionCookie) {
      return null;
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie, "base64").toString("utf-8"));

    // Check if session is expired
    if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
      return null;
    }

    return sessionData as Session;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("linkedin_session");
}
