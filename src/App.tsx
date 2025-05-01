import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { motion } from "framer-motion";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";

function Content({ isDarkMode }: { isDarkMode: boolean }) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const rooms = useQuery(api.rooms.list) || [];
  const joinRoom = useMutation(api.rooms.join);
  const leaveRoom = useMutation(api.rooms.leave);
  const updateParticipant = useMutation(api.rooms.updateParticipant);
  
  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMood, setSelectedMood] = useState("");
  const [nowPlaying, setNowPlaying] = useState("");
  const [focusedRoom, setFocusedRoom] = useState<typeof rooms[0] | null>(null);

  useEffect(() => {
    // Find if user is in any room
    const userRoom = rooms.find(room => 
      room.participants?.some(p => p.userId === loggedInUser?._id)
    );
    if (userRoom) {
      setFocusedRoom(userRoom);
    } else {
      setFocusedRoom(null);
    }
  }, [rooms, loggedInUser]);

  const setOnline = useMutation(api.onlineUsers.setOnline);

  useEffect(() => {
    if (!loggedInUser?._id) return;
  
    const name = loggedInUser.name ?? "Anonymous";  // ← fallback here
  
    // Ping immediately
    setOnline({ userId: loggedInUser._id, name });
  
    // Ping every 30s
    const interval = setInterval(() => {
      setOnline({ userId: loggedInUser._id, name });
    }, 30000);
  
    return () => clearInterval(interval);
  }, [loggedInUser, setOnline]);
  

  const handleJoin = async (roomId: Id<"rooms">) => {
    const task = taskInputs[roomId];
    if (!task?.trim()) {
      toast.error("Please enter what you're working on");
      return;
    }
    await joinRoom({ roomId, task, mood: selectedMood });
    setTaskInputs(prev => ({ ...prev, [roomId]: "" }));
    setSelectedMood("");
    toast.success("Joined room successfully!");
  };

  const handleLeave = async (roomId: Id<"rooms">) => {
    await leaveRoom({ roomId });
    setFocusedRoom(null);
    toast.success("Left room successfully!");
  };

  const updateNowPlaying = async (roomId: Id<"rooms">) => {
    await updateParticipant({ roomId, nowPlaying });
  };

  const getRemainingTime = (joinTime: number, duration: number) => {
    const elapsed = (Date.now() - joinTime) / 1000 / 60; // minutes
    const remaining = Math.max(0, duration - elapsed);
    return Math.floor(remaining);
  };

  if (focusedRoom) {
    const userParticipant = focusedRoom.participants?.find(
      p => p.userId === loggedInUser?._id
    );
    if (!userParticipant) return null;

    const remainingTime = getRemainingTime(
      userParticipant.joinTime,
      focusedRoom.duration
    );

    return (
      <div className="max-w-2xl mx-auto p-8">
        <div 
          className={`rounded-lg p-8 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'
          }`}
        >
          <h2 className="text-2xl font-bold mb-4">{focusedRoom.name}</h2>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Time remaining: {remainingTime} minutes
          </p>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Your task: {userParticipant.task}
          </p>
          <div className="mt-4">
            <input
              type="text"
              placeholder="What are you listening to?"
              value={nowPlaying}
              onChange={(e) => setNowPlaying(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border mb-2 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            />
            <button
              onClick={() => updateNowPlaying(focusedRoom._id)}
              className={`px-4 py-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Update
            </button>
          </div>
          <button
            onClick={() => handleLeave(focusedRoom._id)}
            className={`mt-8 px-6 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Focus Rooms</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {rooms.map((room) => (
          <motion.div
            key={room._id}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`aspect-square rounded-full flex flex-col items-center justify-center p-6 transition-all duration-300 hover:shadow-xl cursor-pointer ${
              isDarkMode 
                ? 'bg-gray-800 text-white' 
                : 'bg-white shadow-lg'
            }`}
          >
            <h3 className="text-xl font-semibold text-center mb-2">{room.name}</h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              {room.duration} minutes
            </p>
            
            {room.participants?.some(p => p.userId === loggedInUser?._id) ? (
              <button
                onClick={() => handleLeave(room._id)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                Leave
              </button>
            ) : (
              <div className="w-full space-y-3">
                <input
                  type="text"
                  placeholder="What are you working on?"
                  value={taskInputs[room._id] || ""}
                  onChange={(e) => setTaskInputs(prev => ({ ...prev, [room._id]: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-full border transition-colors focus:outline-none focus:ring-2 text-sm ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 focus:ring-gray-500 text-white' 
                      : 'bg-gray-50 border-gray-200 focus:ring-gray-400'
                  }`}
                />
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-2xl"
                  >
                    {selectedMood || '😊'}
                  </button>
                  <button
                    onClick={() => handleJoin(room._id)}
                    className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    Join
                  </button>
                </div>
              </div>
            )}
            
            {showEmojiPicker && (
              <div className="absolute z-10 mt-2">
                <EmojiPicker
                  onEmojiClick={(emoji: EmojiClickData) => {
                    setSelectedMood(emoji.emoji);
                    setShowEmojiPicker(false);
                  }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto flex">
          {/* Main Content */}
          <div className="flex-1 pr-6">
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-white shadow-md'
                }`}
              >
                {isDarkMode ? '🌞' : '🌙'}
              </button>
              <SignOutButton />
            </div>
            {loggedInUser ? (
              <Content isDarkMode={isDarkMode} />
            ) : (
              <SignInForm />
            )}
          </div>

          {/* Side Panel */}
          <div className="hidden md:block w-[220px] border-l border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 p-4 overflow-y-auto">
            <h3 className="font-bold mb-4 text-gray-800 dark:text-white">Online Users</h3>
            {useQuery(api.onlineUsers.getOnlineUsers)?.map((user) => (
              <div key={user.userId} className="flex items-center mb-3">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                <span className="text-gray-800 dark:text-gray-100">{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
