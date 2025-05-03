import React, { useState } from "react";

const PRESET_AVATARS = [
  // Fun preset avatar URLs (can be replaced with your own)
  "https://api.dicebear.com/7.x/bottts/svg?seed=1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=2",
  "https://api.dicebear.com/7.x/bottts/svg?seed=3",
  "https://api.dicebear.com/7.x/bottts/svg?seed=4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=5",
  "https://api.dicebear.com/7.x/bottts/svg?seed=6",
];

export function ProfileModal({
  currentName,
  currentAvatar,
  onSave,
  onClose,
  uploading,
}: {
  currentName: string;
  currentAvatar: string | null;
  onSave: (name: string, avatarUrl: string | null, file?: File) => void;
  onClose: () => void;
  uploading: boolean;
}) {
  const [name, setName] = useState(currentName || "");
  const [avatar, setAvatar] = useState<string | null>(currentAvatar || PRESET_AVATARS[0]);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [error, setError] = useState("");

  const handleAvatarClick = (url: string) => {
    setAvatar(url);
    setFile(undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAvatar(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a username");
      return;
    }
    onSave(name.trim(), avatar, file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center relative animate-fade-in">
        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Edit Profile</h2>
        <form className="w-full flex flex-col items-center" onSubmit={handleSubmit}>
          <div className="mb-4 flex flex-col items-center">
            <div className="flex gap-2 mb-2 flex-wrap justify-center">
              {PRESET_AVATARS.map((url, i) => (
                <button
                  type="button"
                  key={url}
                  className={`rounded-full border-2 ${avatar === url ? "border-blue-500" : "border-transparent"} focus:outline-none focus:ring-2 focus:ring-blue-400`}
                  onClick={() => handleAvatarClick(url)}
                >
                  <img src={url} alt={`Avatar ${i + 1}`} className="w-12 h-12 rounded-full" />
                </button>
              ))}
            </div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Or upload your own:</label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              className="mb-2"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <img src={URL.createObjectURL(file)} alt="Custom avatar preview" className="w-12 h-12 rounded-full border-2 border-blue-400 mt-2" />
            )}
          </div>
          <input
            className="w-full px-4 py-2 rounded-full border-2 border-blue-300 focus:outline-none focus:border-blue-500 text-lg mb-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-400"
            type="text"
            placeholder="Enter your username"
            value={name}
            onChange={e => { setName(e.target.value); setError(""); }}
            maxLength={24}
          />
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <button
            type="submit"
            className="w-full py-2 rounded-full bg-blue-500 text-white font-semibold text-lg hover:bg-blue-600 transition disabled:opacity-60"
            disabled={uploading}
          >
            {uploading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
} 