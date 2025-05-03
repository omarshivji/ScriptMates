import { useConvexAuth } from "convex/react";
import { SignOutButton } from "../SignOutButton";

interface NavbarProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  showOnlinePanel: boolean;
  setShowOnlinePanel: (value: boolean) => void;
  currentRoom: any;
  onLeaveRoom: () => void;
  userAvatarUrl?: string | null;
  onProfileClick?: () => void;
}

export function Navbar({
  isDarkMode,
  setIsDarkMode,
  showOnlinePanel,
  setShowOnlinePanel,
  currentRoom,
  onLeaveRoom,
  userAvatarUrl,
  onProfileClick,
}: NavbarProps) {
  const { isAuthenticated } = useConvexAuth();

  return (
    <nav className="w-full bg-white dark:bg-gray-900 shadow-sm p-0 m-0">
      <div className="w-full px-0 py-0">
        <div className="flex items-center justify-between min-h-8">
          {/* Logo/Brand */}
          <div className="text-sm font-semibold text-gray-800 dark:text-white px-2">
            Focus Rooms
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-1">
            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs min-w-7 min-h-7"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? "🌞" : "🌙"}
            </button>

            {/* Only show Leave Room if user is currently in a room */}
            {currentRoom && (
              <button
                onClick={onLeaveRoom}
                className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white transition-colors text-xs min-w-7 min-h-7"
              >
                Leave Room
              </button>
            )}

            {/* Online Users toggle - only show if authenticated */}
            {isAuthenticated && (
              <button
                onClick={() => setShowOnlinePanel(!showOnlinePanel)}
                className="p-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs min-w-7 min-h-7"
                aria-label="Toggle online users panel"
              >
                {showOnlinePanel ? "👥 ✕" : "👥"}
              </button>
            )}

            {/* Sign out button */}
            <SignOutButton />

            {/* Profile icon/avatar */}
            {isAuthenticated && (
              <button
                onClick={onProfileClick}
                className="ml-0.5 p-0.5 rounded-full border border-transparent hover:border-blue-400 transition min-w-7 min-h-7"
                aria-label="Edit profile"
              >
                {userAvatarUrl ? (
                  <img src={userAvatarUrl} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 text-base">👤</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 