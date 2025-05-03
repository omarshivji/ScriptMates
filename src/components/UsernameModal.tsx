import React, { useState } from "react";

export function UsernameModal({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a username");
      return;
    }
    onSubmit(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center relative animate-fade-in">
        <div className="mb-4 flex flex-col items-center">
          <span className="text-4xl mb-2">👋</span>
          <h2 className="text-2xl font-bold mb-1 text-gray-800 dark:text-gray-100">Welcome!</h2>
          <p className="text-gray-500 dark:text-gray-200 text-center mb-2">Choose a username to use in Focus Rooms</p>
        </div>
        <form className="w-full flex flex-col items-center" onSubmit={handleSubmit}>
          <input
            className="w-full px-4 py-2 rounded-full border-2 border-blue-300 focus:outline-none focus:border-blue-500 text-lg mb-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-400"
            type="text"
            placeholder="Enter your username"
            value={name}
            onChange={e => { setName(e.target.value); setError(""); }}
            maxLength={24}
            autoFocus
          />
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <button
            type="submit"
            className="w-full py-2 rounded-full bg-blue-500 text-white font-semibold text-lg hover:bg-blue-600 transition"
          >
            Save Username
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