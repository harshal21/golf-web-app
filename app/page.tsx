"use client";

import { useState } from "react";
import { Trophy, TrendingUp, History } from "lucide-react";

export default function Dashboard() {
  // This state controls whether we are viewing Scramble or Solo data
  const [mode, setMode] = useState<"scramble" | "solo">("scramble");

  return (
    <div className="p-4 pt-6 animate-in fade-in duration-500">
      
      {/* Global Mode Toggle */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-gray-200 p-1 rounded-full flex w-full max-w-xs shadow-inner">
          <button
            onClick={() => setMode("scramble")}
            className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${
              mode === "scramble" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            2v2 Scramble
          </button>
          <button
            onClick={() => setMode("solo")}
            className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${
              mode === "solo" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Solo Round
          </button>
        </div>
      </div>

      {/* Dashboard Content (Changes based on toggle) */}
      {mode === "scramble" ? (
        
        /* SCRAMBLE VIEW */
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-emerald-600">
              <Trophy size={20} />
              <h2 className="font-bold text-slate-800">Team Head-to-Head</h2>
            </div>
            
            {/* Mock Data for you and your friends */}
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium uppercase mb-1">Harshal & Dyshant</p>
                <p className="text-3xl font-black text-slate-800">12</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Wins</p>
              </div>
              <div className="text-xl font-bold text-slate-300">VS</div>
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium uppercase mb-1">Anuj & Michael</p>
                <p className="text-3xl font-black text-slate-800">9</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Wins</p>
              </div>
            </div>
          </div>
        </div>

      ) : (

        /* SOLO VIEW */
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-emerald-600">
              <TrendingUp size={20} />
              <h2 className="font-bold text-slate-800">Solo Handicap</h2>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-5xl font-black text-slate-800">14.2</p>
              <p className="text-sm font-medium text-emerald-500 mb-1">-1.5 this month</p>
            </div>
          </div>
        </div>

      )}
    </div>
  );
}