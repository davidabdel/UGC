"use client";

import { useState } from "react";

export default function DevTools() {
  const [message, setMessage] = useState<string | null>(null);

  const clearLocalStorage = () => {
    try {
      localStorage.clear();
      setMessage("LocalStorage cleared successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage("Error clearing localStorage");
      console.error("Error clearing localStorage:", error);
    }
  };

  return (
    <div className="glass-card p-4 my-4">
      <h2 className="text-lg font-semibold mb-2">Development Tools</h2>
      <button 
        onClick={clearLocalStorage}
        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-md transition-colors"
      >
        Clear LocalStorage
      </button>
      
      {message && (
        <div className="mt-2 p-2 bg-white/10 rounded-md text-sm">
          {message}
        </div>
      )}
    </div>
  );
}
