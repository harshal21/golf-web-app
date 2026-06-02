"use client";

import { useState, useEffect } from "react";
import { Trophy, TrendingUp, Loader2, MapPin, Calendar } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Session {
  id: string;
  course_name: string;
  round_date: string;
  score: number;
  loser_score: number;
  winning_team: string;
  par: number;
  tee_color: string;
  total_distance: number;
}

// Helper to determine the losing team automatically
const getLosingTeam = (winner: string) => {
  if (winner === "Dyshant & Harshal") return "Anuj & Michael";
  if (winner === "Anuj & Michael") return "Dyshant & Harshal";
  return "Tie";
};

// Helper to get exact color codes for the UI dots
const getTeeColorHex = (color: string) => {
  const map: Record<string, string> = { Blue: "#3b82f6", White: "#e5e7eb", Silver: "#C4C4C4", Black: "#1f2937", Gold: "#eab308", Red: "#ef4444" };
  return map[color] || "#9ca3af";
};

export default function Dashboard() {
  const [mode, setMode] = useState<"scramble" | "solo">("scramble");
  const [loading, setLoading] = useState(true);
  const [team1Wins, setTeam1Wins] = useState(0);
  const [team2Wins, setTeam2Wins] = useState(0);
  const [recentGames, setRecentGames] = useState<Session[]>([]);

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("type", "scramble")
        .order("round_date", { ascending: false });

      if (error) {
        console.error("Error fetching sessions:", error);
      } else if (data) {
        setTeam1Wins(data.filter(s => s.winning_team === "Dyshant & Harshal").length);
        setTeam2Wins(data.filter(s => s.winning_team === "Anuj & Michael").length);
        setRecentGames(data);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 p-4 pt-6 animate-in fade-in duration-500 pb-24">
    <div className="max-w-md mx-auto">
      
      {/* Global Mode Toggle */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-gray-200 p-1 rounded-full flex w-full max-w-xs shadow-inner">
          <button onClick={() => setMode("scramble")} className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${mode === "scramble" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>2v2 Scramble</button>
          <button onClick={() => setMode("solo")} className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${mode === "solo" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Solo Round</button>
        </div>
      </div>

      {mode === "scramble" ? (
        <div className="space-y-6">
          
          {/* Head to Head Scoreboard */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-emerald-600">
              <Trophy size={20} />
              <h2 className="font-bold text-slate-800">Team Head-to-Head</h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-green-700" />
              </div>
            ) : (
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                
                {/* Team 1 - Removed w-1/3, added flex-1 and leading-tight */}
                <div className="text-center flex-1 px-1">
                  <p className="text-[10px] text-stone-500 font-bold uppercase mb-1 leading-tight">
                    Dyshant &<br/>Harshal
                  </p>
                  <p className="text-3xl font-black text-stone-800">{team1Wins}</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wide mt-1">Wins</p>
                </div>
                
                <div className="text-lg font-black text-stone-200 px-2">VS</div>
                
                {/* Team 2 - Removed w-1/3, added flex-1 and leading-tight */}
                <div className="text-center flex-1 px-1">
                  <p className="text-[10px] text-stone-500 font-bold uppercase mb-1 leading-tight">
                    Anuj &<br/>Michael
                  </p>
                  <p className="text-3xl font-black text-stone-800">{team2Wins}</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wide mt-1">Wins</p>
                </div>
                
              </div>
            )}
          </div>

          {/* Recent Matches Feed */}
          {!loading && recentGames.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-800 px-1 pt-2">Recent Matches</h2>
              
              {recentGames.map((game, index) => (
                <div key={game.id || index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                  
                  {/* Top: Course Info */}
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 text-slate-800">
                      <MapPin size={18} className="text-emerald-500" />
                      <span className="font-bold text-lg">{game.course_name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs font-medium mt-1">
                      <Calendar size={12} />
                      <span>{new Date(game.round_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Sub-row: Par, Tees, Distance */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 ml-6 mb-4">
                    {game.par && <span>Par {game.par}</span>}
                    {game.par && <span>•</span>}
                    {game.tee_color && (
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{ backgroundColor: getTeeColorHex(game.tee_color) }}></div>
                        <span>{game.tee_color} Tees</span>
                      </div>
                    )}
                    {game.total_distance && <span>•</span>}
                    {game.total_distance && <span>{game.total_distance.toLocaleString()} yds</span>}
                  </div>

                  {/* Bottom: Winner / Loser Grid */}
                  <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-3 items-center border border-gray-100">
                    
                    {/* Winner Row */}
                    <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-100/50 px-2 py-1 rounded">Winner</div>
                    <div className="font-bold text-slate-800">{game.winning_team === "Tie" ? "Tie / Push" : game.winning_team}</div>
                    <div className="font-black text-emerald-600 text-lg text-right">{game.score || "-"}</div>

                    {/* Divider */}
                    <div className="col-span-3 h-px bg-gray-200"></div>

                    {/* Loser Row */}
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-gray-200/50 px-2 py-1 rounded">Loser</div>
                    <div className="font-bold text-slate-500">{getLosingTeam(game.winning_team)}</div>
                    <div className="font-black text-slate-600 text-lg text-right">{game.loser_score || "-"}</div>
                    
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
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
    </div>
  );
}