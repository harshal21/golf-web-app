"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface TeamStat {
  name: string;
  wins: number;
  winPct: number;
}

export default function RankingsPage() {
  const [loading, setLoading] = useState(true);
  const [teamStats, setTeamStats] = useState<TeamStat[]>([]);

  useEffect(() => {
    async function fetchRankings() {
      const { data, error } = await supabase
        .from("sessions")
        .select("winning_team")
        .eq("type", "scramble");

      if (error) {
        console.error("Error fetching sessions:", error);
      } else if (data) {
        const totalMatches = data.length;
        
        // Count wins
        const dWins = data.filter(s => s.winning_team === "Dyshant & Harshal").length;
        const aWins = data.filter(s => s.winning_team === "Anuj & Michael").length;

        // Calculate stats and sort them so the highest Win % is always index 0
        const stats = [
          {
            name: "Dyshant & Harshal",
            wins: dWins,
            winPct: totalMatches > 0 ? Math.round((dWins / totalMatches) * 100) : 0
          },
          {
            name: "Anuj & Michael",
            wins: aWins,
            winPct: totalMatches > 0 ? Math.round((aWins / totalMatches) * 100) : 0
          }
        ].sort((a, b) => b.winPct - a.winPct);

        setTeamStats(stats);
      }
      setLoading(false);
    }

    fetchRankings();
  }, []);

  return (
    <div className="p-4 pt-6 animate-in fade-in duration-500 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Leaderboards</h1>

      <div className="space-y-6">
        
        {/* Dynamic 2v2 Scramble Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center gap-2">
            <Trophy size={20} className="text-emerald-600" />
            <h2 className="font-bold text-emerald-900">2v2 Scramble Teams</h2>
          </div>
          
          <div className="p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-emerald-500" />
              </div>
            ) : teamStats.length > 0 ? (
              teamStats.map((team, index) => (
                <div 
                  key={team.name} 
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    index === 0 ? "bg-gray-50 border-gray-200" : "bg-white border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black shadow-sm ${
                      index === 0 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600 shadow-inner"
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{team.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{team.wins} Wins Total</p>
                    </div>
                  </div>
                  <span className={`text-sm font-black ${index === 0 ? "text-emerald-600" : "text-slate-400"}`}>
                    {team.winPct}% Win
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-slate-500 py-4">No matches recorded yet.</p>
            )}
          </div>
        </div>

        {/* Solo Handicaps (Coming Soon) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center gap-2">
            <Medal size={20} className="text-blue-600" />
            <h2 className="font-bold text-blue-900">Solo Handicaps</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {["Dyshant", "Harshal", "Anuj", "Michael"].map((playerName, index) => (
              <div key={playerName} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-bold w-4">{index + 1}</span>
                  <p className="font-semibold text-slate-800">{playerName}</p>
                </div>
                <div className="flex items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}