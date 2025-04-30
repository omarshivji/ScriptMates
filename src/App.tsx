import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";
import { ChevronDownIcon, MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <div className={isDarkMode ? "dark bg-[#1a1a1a] min-h-screen text-white" : "bg-[#f5f5dc] min-h-screen"}>
      <Navbar
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
      />
      <main className="container mx-auto px-4 py-8">
        <Authenticated>
          <Content isDarkMode={isDarkMode} />
        </Authenticated>
      </main>
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${
            isDarkMode 
              ? 'bg-[#2f3136] border border-[#202225]' 
              : 'bg-white/80 backdrop-blur-sm'
          } p-6 rounded-lg max-w-md w-full mx-4`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Sign In</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <SignInForm />
          </div>
        </div>
      )}
      <Toaster theme={isDarkMode ? "dark" : "light"} />
    </div>
  );
}

function Navbar({ 
  isDarkMode, 
  setIsDarkMode,
  showLoginModal,
  setShowLoginModal
}: { 
  isDarkMode: boolean; 
  setIsDarkMode: (value: boolean) => void;
  showLoginModal: boolean;
  setShowLoginModal: (value: boolean) => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className={`sticky top-0 z-10 ${
      isDarkMode 
        ? 'bg-[#2f3136] border-[#202225]' 
        : 'bg-white/60'
    } backdrop-blur-sm p-4 flex justify-between items-center border-b`}>
      <h2 className="text-xl font-semibold accent-text">ScriptMates</h2>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2.5 rounded-lg transition-all duration-200 ${
            isDarkMode 
              ? 'bg-[#4a4a4a] hover:bg-[#5a5a5a] text-gray-300' 
              : 'bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white'
          } shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
        >
          {isDarkMode ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </button>
        <Unauthenticated>
          <button
            onClick={() => setShowLoginModal(true)}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${
              isDarkMode 
                ? 'bg-[#4a4a4a] hover:bg-[#5a5a5a] text-white border border-[#666666]' 
                : 'bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white'
            } shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
          >
            Sign In
          </button>
        </Unauthenticated>
        <Authenticated>
          {loggedInUser && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-[#4a4a4a] hover:bg-[#5a5a5a] text-white' 
                    : 'bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white'
                } shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
              >
                <span className="font-medium">{loggedInUser.name || 'User'}</span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              {showDropdown && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl ${
                  isDarkMode 
                    ? 'bg-[#2f3136] border border-[#202225]' 
                    : 'bg-white/80 backdrop-blur-sm'
                }`}>
                  <div className="py-1">
                    <SignOutButton />
                  </div>
                </div>
              )}
            </div>
          )}
        </Authenticated>
      </div>
    </header>
  );
}

function Content({ isDarkMode }: { isDarkMode: boolean }) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const rooms = useQuery(api.rooms.list) || [];
  const createRoom = useMutation(api.rooms.create);
  const joinRoom = useMutation(api.rooms.join);
  const leaveRoom = useMutation(api.rooms.leave);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [task, setTask] = useState("");

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const duration = parseInt(formData.get("duration") as string);
    const task = formData.get("task") as string;

    await createRoom({ name, duration, task });
    setShowCreateForm(false);
    toast.success("Room created successfully!");
  };

  const handleJoin = async (roomId: Id<"rooms">) => {
    if (!task.trim()) {
      toast.error("Please enter what you're working on");
      return;
    }
    await joinRoom({ roomId, task });
    setTask("");
    toast.success("Joined room successfully!");
  };

  const handleLeave = async (roomId: Id<"rooms">) => {
    await leaveRoom({ roomId });
    toast.success("Left room successfully!");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Focus Rooms</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${
            isDarkMode 
              ? 'bg-[#4a4a4a] hover:bg-[#5a5a5a] text-white border border-[#666666]' 
              : 'bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white'
          } shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
        >
          Create Room
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${
            isDarkMode 
              ? 'bg-[#2f3136] border border-[#202225]' 
              : 'bg-white/80 backdrop-blur-sm'
          } p-6 rounded-lg max-w-md w-full mx-4 shadow-xl`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Room</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Room Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-[#40444b] border-[#202225] focus:ring-gray-500 text-gray-200' 
                        : 'bg-white/80 backdrop-blur-sm border-gray-300 focus:ring-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Duration (minutes)</label>
                  <select
                    name="duration"
                    required
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-[#40444b] border-[#202225] focus:ring-gray-500 text-gray-200' 
                        : 'bg-white/80 backdrop-blur-sm border-gray-300 focus:ring-gray-400'
                    }`}
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="75">75</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Your Task</label>
                  <input
                    type="text"
                    name="task"
                    required
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-[#40444b] border-[#202225] focus:ring-gray-500 text-gray-200' 
                        : 'bg-white/80 backdrop-blur-sm border-gray-300 focus:ring-gray-400'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className={`w-full px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-[#4a4a4a] hover:bg-[#5a5a5a] text-white border border-[#666666]' 
                      : 'bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white'
                  } shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div
            key={room._id}
            className={`p-6 rounded-lg border transition-all duration-300 hover:shadow-xl ${
              isDarkMode 
                ? 'bg-[#2f3136] border-[#202225]' 
                : 'bg-white/80 backdrop-blur-sm border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{room.name}</h3>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {room.duration} minutes
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                room.status === 'waiting' 
                  ? 'bg-gray-200 text-gray-800' 
                  : room.status === 'active' 
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-300 text-gray-700'
              }`}>
                {room.status}
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">Participants</h4>
              {room.participants.length === 0 ? (
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  No participants yet
                </p>
              ) : (
                <ul className="space-y-2">
                  {room.participants.map((participant) => (
                    <li key={participant._id} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {participant.task}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {room.participants.some(p => p.userId === loggedInUser?._id) ? (
              <button
                onClick={() => handleLeave(room._id)}
                className={`w-full px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white border border-[#666666]' 
                    : 'bg-gray-700 hover:bg-gray-800 text-white'
                } shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
              >
                Leave Room
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="What are you working on?"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                    isDarkMode 
                      ? 'bg-[#40444b] border-[#202225] focus:ring-gray-500 text-gray-200' 
                      : 'bg-white/80 backdrop-blur-sm border-gray-300 focus:ring-gray-400'
                  }`}
                />
                <button
                  onClick={() => handleJoin(room._id)}
                  className={`w-full px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-[#4a4a4a] hover:bg-[#5a5a5a] text-white border border-[#666666]' 
                      : 'bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white'
                  } shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
                >
                  Join Room
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
