import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { useState } from "react";
import { Toaster, toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold accent-text">Focus Rooms</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const rooms = useQuery(api.rooms.list);
  const createRoom = useMutation(api.rooms.create);
  const joinRoom = useMutation(api.rooms.join);
  const leaveRoom = useMutation(api.rooms.leave);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [task, setTask] = useState("");

  if (loggedInUser === undefined || rooms === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    try {
      await createRoom({
        name: formData.get("name") as string,
        duration: parseInt(formData.get("duration") as string),
        task,
      });
      setShowCreateForm(false);
      setTask("");
      toast.success("Room created!");
    } catch (error) {
      toast.error("Failed to create room");
    }
  };

  const handleJoin = async (roomId: Id<"rooms">) => {
    if (!task) {
      toast.error("Please enter your task first");
      return;
    }
    try {
      await joinRoom({ roomId, task });
      toast.success("Joined room!");
    } catch (error) {
      toast.error("Failed to join room");
    }
  };

  const handleLeave = async (roomId: Id<"rooms">) => {
    try {
      await leaveRoom({ roomId });
      toast.success("Left room");
    } catch (error) {
      toast.error("Failed to leave room");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold accent-text mb-4">Focus Rooms</h1>
        <Authenticated>
          <p className="text-xl text-slate-600">
            Work alongside others in silent focus.
          </p>
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-slate-600">Sign in to join focus rooms</p>
        </Unauthenticated>
      </div>

      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <input
              type="text"
              placeholder="What are you working on?"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="flex-1 max-w-md px-4 py-2 border rounded-lg"
            />
            <button
              onClick={() => setShowCreateForm(true)}
              className="ml-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
            >
              Create Room
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg border">
              <div className="flex flex-col gap-4">
                <input
                  name="name"
                  placeholder="Room name"
                  required
                  className="px-4 py-2 border rounded-lg"
                />
                <select
                  name="duration"
                  required
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="25">25 minutes</option>
                  <option value="50">50 minutes</option>
                  <option value="75">75 minutes</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div key={room._id} className="p-6 border rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{room.name}</h3>
                    <p className="text-sm text-gray-500">
                      {room.duration} minutes
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {room.status === "waiting" ? (
                      "Waiting to start"
                    ) : (
                      <Timer startTime={room.startTime} duration={room.duration} />
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Participants</h4>
                  <ul className="space-y-2">
                    {room.participants.map((p) => (
                      <li key={p._id} className="text-sm">
                        {p.task}
                      </li>
                    ))}
                  </ul>
                </div>

                {room.participants.some(p => p.userId === loggedInUser?._id) ? (
                  <button
                    onClick={() => handleLeave(room._id)}
                    className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Leave Room
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoin(room._id)}
                    className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                    disabled={!task}
                  >
                    Join Room
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Authenticated>
    </div>
  );
}

function Timer({ startTime, duration }: { startTime: number; duration: number }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const endTime = startTime + duration * 60 * 1000;
    return Math.max(0, endTime - Date.now());
  });

  useState(() => {
    const interval = setInterval(() => {
      const endTime = startTime + duration * 60 * 1000;
      setTimeLeft(Math.max(0, endTime - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  });

  const minutes = Math.floor(timeLeft / (60 * 1000));
  const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

  return (
    <span>
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}
