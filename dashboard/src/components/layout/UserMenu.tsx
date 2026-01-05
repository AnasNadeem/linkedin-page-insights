"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import { LogOut, ChevronDown, Building2, RefreshCw } from "lucide-react";

export function UserMenu() {
  const { data: session } = useSession();
  const { setSelectedOrganization, refreshData, loading } = useData();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSignOut = async () => {
    localStorage.removeItem("selectedOrganization");
    await signOut({ callbackUrl: "/login" });
  };

  const handleSwitchOrganization = () => {
    setSelectedOrganization(null);
    router.push("/select-page");
    setIsOpen(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
    setIsOpen(false);
  };

  if (!session?.user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {session.user.name?.[0] || "U"}
          </div>
        )}
        <ChevronDown size={16} className="text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-100">
              <p className="font-medium text-gray-900 truncate">
                {session.user.name}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {session.user.email}
              </p>
            </div>
            <div className="p-2">
              <button
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  size={16}
                  className={isRefreshing ? "animate-spin" : ""}
                />
                Refresh Data
              </button>
              <button
                onClick={handleSwitchOrganization}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <Building2 size={16} />
                Switch Company Page
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
