"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface LinkedInPage {
  id: string;
  urn: string;
  name: string;
  vanityName?: string;
  logo?: string;
  role: string;
  type: "personal" | "organization";
}

interface OrganizationsResponse {
  personal: LinkedInPage;
  organizations: LinkedInPage[];
  permissions?: {
    hasOrgAccess: boolean;
    error: string | null;
  };
}

export default function SelectPagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personalProfile, setPersonalProfile] = useState<LinkedInPage | null>(null);
  const [organizations, setOrganizations] = useState<LinkedInPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        // First check if user is authenticated
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();

        if (!sessionData.user) {
          router.push("/login");
          return;
        }

        // Fetch organizations
        const res = await fetch("/api/linkedin/organizations");

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch organizations");
        }

        const data: OrganizationsResponse = await res.json();

        setPersonalProfile(data.personal);
        setOrganizations(data.organizations || []);

        // Check for permission warnings
        if (data.permissions && !data.permissions.hasOrgAccess) {
          setPermissionWarning(data.permissions.error);
        }

        // Auto-select personal profile by default
        if (data.personal) {
          setSelectedPages([data.personal.urn]);
        }
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setError(err instanceof Error ? err.message : "Failed to load pages");
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizations();
  }, [router]);

  const togglePage = (urn: string) => {
    setSelectedPages((prev) =>
      prev.includes(urn)
        ? prev.filter((p) => p !== urn)
        : [...prev, urn]
    );
  };

  const handleContinue = async () => {
    if (selectedPages.length === 0) {
      setError("Please select at least one page to analyze");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Save selected pages to session
      const res = await fetch("/api/linkedin/select-pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedPages }),
      });

      if (!res.ok) {
        throw new Error("Failed to save selection");
      }

      // Redirect to dashboard
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save selection");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your LinkedIn pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="#0a66c2">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Select Pages to Analyze
            </h1>
            <p className="text-gray-600 mt-2">
              Choose which LinkedIn profiles and pages you want to analyze
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Personal Profile Section */}
            {personalProfile && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Personal Profile
                </h3>
                <PageCard
                  page={personalProfile}
                  selected={selectedPages.includes(personalProfile.urn)}
                  onToggle={() => togglePage(personalProfile.urn)}
                />
              </div>
            )}

            {/* Organization Pages Section */}
            {organizations.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Organization Pages
                </h3>
                <div className="space-y-3">
                  {organizations.map((org) => (
                    <PageCard
                      key={org.id}
                      page={org}
                      selected={selectedPages.includes(org.urn)}
                      onToggle={() => togglePage(org.urn)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Permission warning */}
            {permissionWarning && (
              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Limited API Access</p>
                    <p className="text-sm text-amber-700 mt-1">{permissionWarning}</p>
                  </div>
                </div>
              </div>
            )}

            {/* No organizations message */}
            {organizations.length === 0 && !permissionWarning && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  No organization pages found. You may not have admin access to any LinkedIn pages.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {selectedPages.length} page{selectedPages.length !== 1 ? "s" : ""} selected
              </p>
              <button
                onClick={handleContinue}
                disabled={selectedPages.length === 0 || saving}
                className="px-6 py-3 bg-[#0a66c2] hover:bg-[#004182] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue to Dashboard
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          You can change your selection later from the user menu
        </p>

        {/* API Products Info */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Required LinkedIn API Products
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            To access full analytics and organization pages, your LinkedIn app needs these products:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Sign In with LinkedIn</p>
                <p className="text-xs text-gray-500">For authentication (you have this)</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Community Management API</p>
                <p className="text-xs text-gray-500">Required for reading posts, analytics, and organization pages</p>
              </div>
            </li>
          </ul>
          <a
            href="https://www.linkedin.com/developers/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Manage your LinkedIn app products
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

function PageCard({
  page,
  selected,
  onToggle,
}: {
  page: LinkedInPage;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
          selected
            ? "border-blue-500 bg-blue-500"
            : "border-gray-300"
        }`}
      >
        {selected && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>

      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        {page.logo ? (
          <Image
            src={page.logo}
            alt={page.name}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xl font-semibold text-gray-600">
            {page.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{page.name}</p>
        <p className="text-sm text-gray-500">
          {page.type === "personal" ? "Personal Profile" : "Organization Page"}
          {page.role && page.type !== "personal" && (
            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs">
              {page.role.replace(/_/g, " ")}
            </span>
          )}
        </p>
      </div>
    </button>
  );
}
