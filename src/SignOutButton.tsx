"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="p-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs min-w-7 min-h-7 transition-colors"
      onClick={() => void signOut()}
    >
      Sign out
    </button>
  );
}
