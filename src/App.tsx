import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { motion } from "framer-motion";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { SignInForm } from "./SignInForm";
import { Navbar } from "./components/Navbar";
import { UsernameModal } from "./components/UsernameModal";
import { ProfileModal } from "./components/ProfileModal";
import { PomodoroWidget } from "./components/PomodoroWidget";

// --- Content Component ---
function Content({ isDarkMode }: { isDarkMode: boolean }) {
  const loggedInUser = useQuery(api.auth.loggedInUser) ?? null;
  const rooms = useQuery(api.rooms.list) || [];
  const joinRoom = useMutation(api.rooms.join);
  const leaveRoom = useMutation(api.rooms.leave);
  const updateParticipant = useMutation(api.rooms.updateParticipant);
  const setOnline = useMutation(api.onlineUsers.setOnline);

  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);
  const [moodInputs, setMoodInputs] = useState<Record<string, string>>({});
  const [nowPlaying, setNowPlaying] = useState("");
  const [focusedRoom, setFocusedRoom] = useState<typeof rooms[0] | null>(null);
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);

  // Use the XP+image version so avatars work
  const onlineUsers = useQuery(api.onlineUsers.getOnlineUsersWithXP) || [];
  const userIdToName: Record<string, string> = {};
  for (const u of onlineUsers) {
    userIdToName[u.userId] = u.name;
  }

  // Track which room the user is in
  useEffect(() => {
    const userRoom = rooms.find(r =>
      r.participants?.some(p => p.userId === loggedInUser?._id)
    );
    setFocusedRoom(userRoom || null);
  }, [rooms, loggedInUser]);

  // Presence ping
  useEffect(() => {
    if (!loggedInUser?._id) return;
    const name = loggedInUser.name ?? "Anonymous";
    setOnline({ userId: loggedInUser._id, name });
    const iv = setInterval(
      () => setOnline({ userId: loggedInUser._id, name }),
      30000
    );
    return () => clearInterval(iv);
  }, [loggedInUser, setOnline]);

  const handleJoin = async (roomId: Id<"rooms">, task: string, mood: string) => {
    if (!task.trim()) return toast.error("Please enter your task");
    await joinRoom({ roomId, task, mood });
    setTaskInputs(p => ({ ...p, [roomId]: "" }));
    setMoodInputs(p => ({ ...p, [roomId]: "" }));
    toast.success("Joined!");
  };

  const handleLeaveRoom = () => {
    if (!focusedRoom) return;
    leaveRoom({ roomId: focusedRoom._id });
    setFocusedRoom(null);
    toast.success("Left room");
  };

  const updateNowPlaying = async (roomId: Id<"rooms">) => {
    await updateParticipant({ roomId, nowPlaying });
    toast.success("Now playing updated");
  };

  const getRemaining = (joinTime: number, duration: number) => {
    const mins = (Date.now() - joinTime) / 1000 / 60;
    return Math.max(0, Math.floor(duration - mins));
  };

  // --- Focused Room View ---
  if (focusedRoom) {
    const part = focusedRoom.participants!.find(
      p => p.userId === loggedInUser?._id
    );
    if (!part) return null;
    const remaining = getRemaining(part.joinTime, focusedRoom.duration);
    const participants = focusedRoom.participants || [];
    const mainColor = "bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400";
    const floatAnimations = [
      "animate-[float_4s_ease-in-out_infinite]",
      "animate-[float2_5s_ease-in-out_infinite]",
      "animate-[float3_6s_ease-in-out_infinite]",
      "animate-[float_4.5s_ease-in-out_infinite]",
      "animate-[float2_5.5s_ease-in-out_infinite]",
      "animate-[float3_6.5s_ease-in-out_infinite]",
    ];

    // Arrange avatars in a circle
    const avatarCount = participants.length;
    const radius = 170; // px, distance from center
    const center = 180; // px, center of main bubble

    return (
      <div className="min-h-screen flex justify-center items-center mt-0 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="relative w-[360px] h-[360px] flex items-center justify-center">
          {/* Floating Avatars */}
          {participants.map((p, idx) => {
            const angle = (2 * Math.PI * idx) / avatarCount;
            const x = center + radius * Math.cos(angle) - 32; // 32 = avatar size/2
            const y = center + radius * Math.sin(angle) - 32;
            const float = floatAnimations[idx % floatAnimations.length];
            const name = userIdToName[p.userId] || "User";
            const avatarUrl = (onlineUsers.find(u => u.userId === p.userId)?.image) ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ffffff&color=555555&rounded=true&size=64`;
            const timeLeft = getRemaining(p.joinTime, focusedRoom.duration);
            const task = p.task;
            return (
              <div
                key={p.userId}
                className={`absolute flex flex-col items-center ${float}`}
                style={{ left: x, top: y }}
                onMouseEnter={() => setHoveredUserId(p.userId)}
                onMouseLeave={() => setHoveredUserId(null)}
              >
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-16 h-16 rounded-full border-4 border-white shadow-lg bg-white object-cover"
                />
                <span className="mt-1 text-xs font-semibold text-white bg-black/60 px-2 py-0.5 rounded-full shadow">
                  {timeLeft} min
                </span>
                {/* Popover on hover */}
                {hoveredUserId === p.userId && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-20 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl px-4 py-3 flex flex-col items-center min-w-[180px] border border-gray-200 dark:border-gray-700 animate-fade-in">
                    <img src={avatarUrl} alt={name} className="w-12 h-12 rounded-full mb-2 object-cover" />
                    <div className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1">{name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300 mb-1">{task ? `"${task}"` : "No status set"}</div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Main Room Bubble */}
          <div
            className={`relative w-72 h-72 rounded-full flex flex-col items-center justify-center shadow-2xl ${mainColor} ring-4 ring-blue-500/60 animate-[float_5s_ease-in-out_infinite]`}
          >
            <h2 className="text-3xl font-extrabold mb-2 text-white drop-shadow-lg tracking-wide text-center">
              {focusedRoom.name}
            </h2>
            <p className="text-lg text-white/80 mb-4 font-medium drop-shadow text-center">
              {remaining} min remaining
            </p>
            <p className="text-white/90 mb-4 text-center">
              Your task: <span className="font-semibold">{part.task}</span>
            </p>
            <button
              onClick={handleLeaveRoom}
              className="px-7 py-2 rounded-full bg-white/90 text-blue-600 font-semibold shadow hover:bg-white/95 transition mt-2"
            >
              Leave Room
            </button>
          </div>

          {/* Floating animation keyframes */}
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-16px); }
            }
            @keyframes float2 {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(12px); }
            }
            @keyframes float3 {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // --- Room Grid ---
  // Define a palette of nice colors for the bubbles
  const bubbleColors = [
    "bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400",
    "bg-gradient-to-br from-green-400 via-teal-400 to-blue-400",
    "bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-400",
    "bg-gradient-to-br from-pink-400 via-red-400 to-yellow-300",
    "bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-400",
    "bg-gradient-to-br from-emerald-400 via-lime-300 to-yellow-200",
  ];

  // Add floating animation
  const floatAnimations = [
    "animate-[float_4s_ease-in-out_infinite]",
    "animate-[float2_5s_ease-in-out_infinite]",
    "animate-[float3_6s_ease-in-out_infinite]",
    "animate-[float_4.5s_ease-in-out_infinite]",
    "animate-[float2_5.5s_ease-in-out_infinite]",
    "animate-[float3_6.5s_ease-in-out_infinite]",
  ];

  return (
    <div className="min-h-screen w-full h-full bg-[#23272e] flex flex-col items-center justify-start pt-10">
      <h1 className="text-3xl font-bold mb-8 text-gray-100 tracking-tight">Focus Rooms</h1>
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7 px-4">
        {rooms.map((room) => {
          const joined = room.participants?.some(p => p.userId === loggedInUser?._id);
          const task = taskInputs[room._id] || "";
          const mood = moodInputs[room._id] || "";
          return (
            <motion.div
              key={room._id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-xl bg-[#262a32] border border-[#2e323a] shadow-md p-5 flex flex-col gap-4 min-h-[170px]"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-1 truncate">{room.name}</h3>
                <p className="text-xs text-gray-400 mb-2">{room.duration} min</p>
              </div>
              {joined ? (
                <button
                  onClick={handleLeaveRoom}
                  className="px-4 py-1.5 rounded bg-gray-800 text-gray-100 font-semibold text-xs hover:bg-gray-700 border border-gray-700 transition"
                >
                  Leave Room
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="What are you working on?"
                    value={task}
                    onChange={e => setTaskInputs(p => ({
                      ...p,
                      [room._id]: e.target.value
                    }))}
                    className="w-full px-3 py-1.5 rounded bg-[#23272e] border border-[#2e323a] text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() =>
                        setShowEmojiPickerFor(prev => prev === room._id ? null : room._id)
                      }
                      className="text-xl bg-[#23272e] rounded px-2 py-1 border border-[#2e323a] text-gray-300 hover:bg-[#23272e]/80 transition"
                    >
                      {mood || "😊"}
                    </button>
                    <button
                      onClick={() => handleJoin(room._id, task, mood)}
                      className="px-4 py-1.5 rounded bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 border border-blue-700 transition"
                    >
                      Join
                    </button>
                  </div>
                  {showEmojiPickerFor === room._id && (
                    <div className="absolute z-10 mt-2 left-1/2 transform -translate-x-1/2">
                      <EmojiPicker
                        onEmojiClick={(emoji: EmojiClickData) => {
                          setMoodInputs(p => ({
                            ...p,
                            [room._id]: emoji.emoji,
                          }));
                          setShowEmojiPickerFor(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100vw;
          min-height: 100vh;
          box-sizing: border-box;
          background: #23272e;
        }
      `}</style>
      {/* XP Progress Bar */}
      {loggedInUser && (
        <XPBar user={loggedInUser} />
      )}
      <PomodoroWidget />
    </div>
  );
}

// --- Online Users Panel ---
function OnlineUsersPanel() {
  const onlineUsers = useQuery(api.onlineUsers.getOnlineUsersWithXP) || [];

  return (
    <div>
      <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Online Users</h3>
      <div className="space-y-3">
        {onlineUsers.map(u => {
          // Use user's avatar if available, else fallback to preset or emoji
          const avatarUrl = u.image ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "User")}&background=ffffff&color=555555&rounded=true&size=48`;
          return (
            <div key={u.userId} className="flex items-center space-x-3">
              <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover bg-gray-200 dark:bg-gray-700" alt={u.name} />
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {u.name}
                {u.isAnonymous ? (
                  <span className="ml-2 text-xs text-gray-400 italic">(Anonymous - no XP/level)</span>
                ) : (
                  <span className="ml-2 text-xs text-blue-600 font-bold">Lvl {u.level}</span>
                )}
              </span>
            </div>
          );
        })}
        {!onlineUsers.length && (
          <p className="text-sm text-gray-500 dark:text-gray-300">No one online</p>
        )}
      </div>
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showOnlinePanel, setShowOnlinePanel] = useState(false);
  const [userRefreshKey, setUserRefreshKey] = useState(0);
  const loggedInUser = useQuery(api.auth.loggedInUser) ?? null;
  const rooms = useQuery(api.rooms.list) || [];
  const leaveRoom = useMutation(api.rooms.leave);
  const setName = useMutation(api.users.setName);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const setAvatar = useMutation(api.users.setAvatar);
  const generateUploadUrl = useAction(api.storage.generateUploadUrl);
  const getFileUrl = useAction(api.storage.getUrl);

  // If user is in a room, find that roomId
  const currentRoom = rooms.find(r =>
    r.participants?.some(p => loggedInUser && p.userId === loggedInUser._id)
  );

  // Handler for header's Leave button
  const handleHeaderLeave = async () => {
    if (!currentRoom) return;           // bail early if no room
    await leaveRoom({ roomId: currentRoom._id });
    toast.success("Left room");
  };

  useEffect(() => {
    if (loggedInUser && (!loggedInUser.name || loggedInUser.name === "Anonymous")) {
      setShowUsernameModal(true);
    } else {
      setShowUsernameModal(false);
    }
  }, [loggedInUser]);

  const handleSetName = async (name: string) => {
    await setName({ name });
    setShowUsernameModal(false);
    setUserRefreshKey(k => k + 1); // Force refetch by changing state
  };

  // Helper to get avatar URL (custom, preset, or fallback)
  const getAvatarUrl = (user: any) => {
    if (!user) return null;
    if (user.image) return user.image;
    // If user has a preset avatar URL in image, use it
    return null;
  };

  // Handle profile save (name/avatar)
  const handleProfileSave = async (name: string, avatarUrl: string | null, file?: File) => {
    setProfileUploading(true);
    try {
      if (file) {
        // 1. Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();
        // 2. Upload file to Convex storage
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
        const { storageId } = await uploadRes.json();
        // 3. Get the file URL from Convex
        const fileUrl = await getFileUrl({ storageId });
        // 4. Save avatar URL to user
        if (typeof fileUrl === "string") {
          await setAvatar({ url: fileUrl });
        }
        await setName({ name });
      } else if (avatarUrl) {
        if (typeof avatarUrl === "string") {
          await setAvatar({ url: avatarUrl });
        }
        await setName({ name });
      } else {
        await setName({ name });
      }
      setShowProfileModal(false);
      setUserRefreshKey(k => k + 1);
    } finally {
      setProfileUploading(false);
    }
  };

  return (
    <div className={`${isDarkMode ? "dark" : ""} font-sans antialiased`}>
      {showUsernameModal && <UsernameModal onSubmit={handleSetName} />}
      {showProfileModal && (
        <ProfileModal
          currentName={loggedInUser?.name || ""}
          currentAvatar={getAvatarUrl(loggedInUser)}
          onSave={handleProfileSave}
          onClose={() => setShowProfileModal(false)}
          uploading={profileUploading}
        />
      )}
      <div className="min-h-screen w-full h-full flex flex-col bg-gray-50 dark:bg-gray-800 transition-colors">
        <Navbar
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          showOnlinePanel={showOnlinePanel}
          setShowOnlinePanel={setShowOnlinePanel}
          currentRoom={currentRoom}
          onLeaveRoom={handleHeaderLeave}
          userAvatarUrl={getAvatarUrl(loggedInUser)}
          onProfileClick={() => setShowProfileModal(true)}
        />
        
        <div className="flex-1 flex">
          {/* Main Content */}
          <div className="flex-1 overflow-auto py-8">
            <div className="max-w-7xl mx-auto px-4">
              {/* Either the main Content or SignInForm */}
              {loggedInUser ? (
                <Content isDarkMode={isDarkMode} />
              ) : (
                <SignInForm />
              )}
            </div>
          </div>

          {/* Toggleable Online Panel */}
          {showOnlinePanel && (
            <aside className="w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
              <OnlineUsersPanel />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

// --- XP Progress Bar Component ---
function XPBar({ user }: { user: any }) {
  // XP/level logic: e.g., 100 XP per level
  const xpPerLevel = 100;
  const level = user.level || 1;
  const xp = user.xp || 0;
  const isAnonymous = user.isAnonymous;
  const xpThisLevel = xp % xpPerLevel;
  const xpToNext = xpPerLevel - xpThisLevel;
  const percent = Math.min(100, Math.round((xpThisLevel / xpPerLevel) * 100));

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-xl mx-auto mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg px-6 py-3 flex items-center gap-4 border border-gray-200 dark:border-gray-700 pointer-events-auto">
          {isAnonymous ? (
            <span className="text-sm text-gray-500 dark:text-gray-300">Sign up to earn XP and levels!</span>
          ) : (
            <>
              <span className="font-bold text-blue-600 text-lg">Lvl {level}</span>
              <div className="flex-1">
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-300 mt-1 text-center">
                  {xpThisLevel} / {xpPerLevel} XP to next level ({xpToNext} XP left)
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}