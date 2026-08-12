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
  ties: number;
  matches: number;
  winPct: number;
}

export default function RankingsPage() {
  const [loading, setLoading] = useState(true);
  const [teamStats, setTeamStats] = useState<TeamStat[]>([]);
  const [soloPlayers, setSoloPlayers] = useState<string[]>([]);

  useEffect(() => {
    async function fetchRankings() {
      const [sessionsRes, soloRes] = await Promise.all([
        supabase.from("sessions").select("*"),
        supabase.from("solo_rounds").select("player_name")
      ]);

      if (sessionsRes.error) {
        console.error("Error fetching sessions:", sessionsRes.error);
      } else if (sessionsRes.data) {
        
        const teamsData = new Map<string, { name: string, matches: Set<string>, wins: Set<string>, ties: Set<string> }>();

        const registerTeam = (rawString: string | null | undefined) => {
          if (!rawString || typeof rawString !== 'string' || !rawString.includes("&")) return null;
          const players = rawString.split("&").map(p => p.trim());
          if (players.length < 2) return null;
          
          const key = [...players].sort().join(" & ");
          
          if (!teamsData.has(key)) {
            teamsData.set(key, { name: rawString.trim(), matches: new Set(), wins: new Set(), ties: new Set() });
          }
          return { key, display: rawString.trim() };
        };

        // BASELINE GUARANTEE
        registerTeam("Dyshant & Harshal");
        registerTeam("Anuj & Michael");

        sessionsRes.data.forEach(row => {
          const matchId = `${row.round_date || 'date'}_${row.course_name || 'course'}_${row.winning_team || 'tie'}`;
          const teamsInThisRow = new Map<string, string>();

          const winTeam = registerTeam(row.winning_team);
          if (winTeam) teamsInThisRow.set(winTeam.key, winTeam.display);

          const loseTeam = registerTeam(row.loser_team);
          if (loseTeam) teamsInThisRow.set(loseTeam.key, loseTeam.display);

          if (row.shot_contributions) {
            const players = Object.keys(row.shot_contributions).filter(k => k !== 'matrix' && k !== 'penalties');
            if (players.length >= 2) {
              const scTeam = registerTeam(players.join(" & "));
              if (scTeam) teamsInThisRow.set(scTeam.key, scTeam.display);
            }
          }

          const isTie = row.winning_team && row.winning_team.toLowerCase().includes("tie");

          teamsInThisRow.forEach((display, teamKey) => {
            const teamStats = teamsData.get(teamKey)!;
            teamStats.matches.add(matchId);

            if (isTie) {
              teamStats.ties.add(matchId);
            } else if (winTeam && winTeam.key === teamKey) {
              teamStats.wins.add(matchId);
            }
          });
        });

        const statsArray = Array.from(teamsData.values()).map(stats => {
          const matches = stats.matches.size;
          const wins = stats.wins.size;
          const ties = stats.ties.size;
          return {
            name: stats.name, 
            wins,
            ties,
            matches,
            winPct: matches > 0 ? Math.round((wins / matches) * 100) : 0
          };
        }).sort((a, b) => b.winPct - a.winPct || b.wins - a.wins || a.name.localeCompare(b.name));

        setTeamStats(statsArray);
      }

      if (soloRes.data) {
        const uniqueSolo = Array.from(new Set(soloRes.data.map(r => r.player_name)));
        setSoloPlayers(uniqueSolo.length > 0 ? uniqueSolo : ["Harshal", "Dyshant", "Anuj", "Michael"]);
      }

      setLoading(false);
    }

    fetchRankings();
  }, []);

  return (
    <div className="p-4 pt-6 animate-in fade-in duration-500 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Leaderboards</h1>

      <div className="space-y-6">
        
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
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{team.wins} WINS | {team.ties} TIES | {team.matches} PLAYED</p>
                    </div>
                  </div>
                  <span className={`text-xl font-black ${index === 0 ? "text-emerald-600" : "text-slate-400"}`}>
                    {team.winPct}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-slate-500 py-4">No matches recorded yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center gap-2">
            <Medal size={20} className="text-blue-600" />
            <h2 className="font-bold text-blue-900">Solo Handicaps</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {loading ? (
               <div className="flex justify-center py-6">
                 <Loader2 className="animate-spin text-blue-500" />
               </div>
            ) : soloPlayers.length > 0 ? (
              soloPlayers.map((playerName, index) => (
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
              ))
            ) : (
              <p className="text-center text-sm text-slate-500 py-4">No solo players recorded yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}