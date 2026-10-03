"use client";

import { useState, useEffect } from "react";
import { Trophy, TrendingUp, Loader2, MapPin, Calendar, ChevronDown } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. New strict interface for the raw database rows
interface SessionRow {
  type: string;
  course_name: string;
  round_date: string;
  score: number;
  loser_score?: number;
  winning_team: string;
  loser_team?: string;
  par: number;
  tee_color: string;
  total_distance: number;
  shot_contributions?: Record<string, unknown>;
}

interface UnifiedMatch {
  id: string;
  course_name: string;
  round_date: string;
  topTeam: string;
  topScore: number;
  bottomTeam: string;
  bottomScore: number;
  isTie: boolean;
  par: number;
  tee_color: string;
  total_distance: number;
}

interface GameMapEntry {
  id: string;
  course_name: string;
  round_date: string;
  par: number;
  tee_color: string;
  total_distance: number;
  isTie: boolean;
  winner: string;
  winnerScore: number;
  loser: string;
  loserScore: number;
  teamsFromStats: string[];
}

const normalizeTeam = (str: string | null | undefined) => {
  if (!str || !str.includes("&")) return str || "";
  return str.split("&").map(s => s.trim()).sort().join(" & ");
};

const getLosingTeam = (winner: string) => {
  const w = normalizeTeam(winner);
  if (w === normalizeTeam("Dyshant & Harshal")) return "Anuj & Michael";
  if (w === normalizeTeam("Anuj & Michael")) return "Dyshant & Harshal";
  return "Opponents";
};

const getTeeColorHex = (color: string) => {
  const map: Record<string, string> = { Blue: "#3b82f6", White: "#e5e7eb", Silver: "#C4C4C4", Black: "#1f2937", Gold: "#eab308", Red: "#ef4444" };
  return map[color] || "#9ca3af";
};

export default function Dashboard() {
  const [mode, setMode] = useState<"scramble" | "solo">("scramble");
  const [loading, setLoading] = useState(true);
  
  const [teamA, setTeamA] = useState("Dyshant & Harshal");
  const [teamB, setTeamB] = useState("Anuj & Michael");
  
  const [recentGames, setRecentGames] = useState<UnifiedMatch[]>([]);

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("round_date", { ascending: false });

      if (error) {
        console.error("Error fetching sessions:", error);
      } else if (data) {
        // Cast the raw data to our strict interface
        const rawSessions = data as SessionRow[];
        const gamesMap = new Map<string, GameMapEntry>();

        // 2. Swapped 'any[]' to 'SessionRow[]'
        const groupedRows = new Map<string, SessionRow[]>();
        
        rawSessions.forEach(row => {
          if (row.type !== 'scramble') return;
          const matchId = `${row.round_date}_${row.course_name}`;
          if (!groupedRows.has(matchId)) groupedRows.set(matchId, []);
          groupedRows.get(matchId)!.push(row);
        });

        const uniqueMatches: UnifiedMatch[] = [];

        groupedRows.forEach((rows, matchId) => {
           const firstRow = rows[0];
           const course_name = firstRow.course_name;
           const round_date = firstRow.round_date;
           const par = firstRow.par;
           const tee_color = firstRow.tee_color;
           const total_distance = firstRow.total_distance;
           
           let declared_winner = "Team 1";
           let declared_loser = "";
           let winning_score = 0;
           let max_loser_score = 0;
           let isTie = false;

           rows.forEach(r => {
               if (r.winning_team && !r.winning_team.toLowerCase().includes("tie")) declared_winner = r.winning_team;
               if (r.winning_team?.toLowerCase().includes("tie")) isTie = true;
               if (r.loser_team && !declared_loser) declared_loser = r.loser_team;
               if (r.score > winning_score) winning_score = r.score;
               if (r.loser_score && r.loser_score > max_loser_score) max_loser_score = r.loser_score;
           });

           if (max_loser_score === 0) max_loser_score = winning_score;

           const teamsMap = new Map<string, number>();

           rows.forEach(r => {
               let teamFromStats = "";
               if (r.shot_contributions) {
                   const players = Object.keys(r.shot_contributions).filter(k => k !== 'matrix' && k !== 'penalties');
                   if (players.length >= 2) {
                       teamFromStats = `${players[0]} & ${players[1]}`;
                   }
               }
               
               if (teamFromStats) {
                   if (isTie) {
                       teamsMap.set(teamFromStats, winning_score);
                   } else {
                       if (normalizeTeam(teamFromStats) === normalizeTeam(declared_winner)) {
                           teamsMap.set(teamFromStats, winning_score);
                       } else {
                           teamsMap.set(teamFromStats, max_loser_score);
                       }
                   }
               } else {
                   if (r.winning_team && !isTie) teamsMap.set(r.winning_team, winning_score);
                   if (r.loser_team && !isTie) teamsMap.set(r.loser_team, max_loser_score);
               }
           });

           let topTeam = "Team 1";
           let topScore = 0;
           let bottomTeam = "Team 2";
           let bottomScore = 0;
           
           const teamsArray = Array.from(teamsMap.entries());
           
           if (teamsArray.length >= 2) {
               topTeam = teamsArray[0][0];
               topScore = teamsArray[0][1];
               bottomTeam = teamsArray[1][0];
               bottomScore = teamsArray[1][1];
               
               if (!isTie && normalizeTeam(bottomTeam) === normalizeTeam(declared_winner)) {
                   [topTeam, bottomTeam] = [bottomTeam, topTeam];
                   [topScore, bottomScore] = [bottomScore, topScore];
               }
           } else if (teamsArray.length === 1) {
               topTeam = teamsArray[0][0];
               topScore = teamsArray[0][1];
               bottomTeam = declared_loser || getLosingTeam(topTeam);
               bottomScore = max_loser_score;
               
               if (!isTie && normalizeTeam(bottomTeam) === normalizeTeam(declared_winner)) {
                   [topTeam, bottomTeam] = [bottomTeam, topTeam];
                   [topScore, bottomScore] = [bottomScore, topScore];
               }
           } else {
               topTeam = declared_winner !== "Tie" ? declared_winner : "Team 1";
               bottomTeam = declared_loser || "Opponents";
               topScore = winning_score;
               bottomScore = max_loser_score;
           }

           if (bottomTeam === "Opponents") bottomTeam = getLosingTeam(topTeam);
           
           uniqueMatches.push({
              id: matchId, course_name, round_date, par, tee_color, total_distance,
              isTie, topTeam, topScore, bottomTeam, bottomScore
           });
        });

        setRecentGames(uniqueMatches);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const uniqueTeamsArray = Array.from(new Set(recentGames.flatMap(g => [g.topTeam, g.bottomTeam]))).filter(t => t !== "Opponents" && t !== "Team 1" && t !== "Team 2");
  if (!uniqueTeamsArray.includes("Dyshant & Harshal")) uniqueTeamsArray.push("Dyshant & Harshal");
  if (!uniqueTeamsArray.includes("Anuj & Michael")) uniqueTeamsArray.push("Anuj & Michael");

  const winsA = recentGames.filter(g => !g.isTie && normalizeTeam(g.topTeam) === normalizeTeam(teamA) && normalizeTeam(g.bottomTeam) === normalizeTeam(teamB)).length;
  const winsB = recentGames.filter(g => !g.isTie && normalizeTeam(g.topTeam) === normalizeTeam(teamB) && normalizeTeam(g.bottomTeam) === normalizeTeam(teamA)).length;

  const latestH2H = recentGames.find(g => 
    (normalizeTeam(g.topTeam) === normalizeTeam(teamA) && normalizeTeam(g.bottomTeam) === normalizeTeam(teamB)) ||
    (normalizeTeam(g.topTeam) === normalizeTeam(teamB) && normalizeTeam(g.bottomTeam) === normalizeTeam(teamA))
  );

  return (
    <div className="min-h-screen bg-stone-50 p-4 pt-6 animate-in fade-in duration-500 pb-24">
    <div className="max-w-md mx-auto">
      
      <div className="flex flex-col items-center mb-8">
        <div className="bg-gray-200 p-1 rounded-full flex w-full max-w-xs shadow-inner">
          <button onClick={() => setMode("scramble")} className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${mode === "scramble" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>2v2 Scramble</button>
          <button onClick={() => setMode("solo")} className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${mode === "solo" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Solo Round</button>
        </div>
      </div>

      {mode === "scramble" ? (
        <div className="space-y-6">
          
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
              <>
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                  
                  <div className="text-center flex-1 px-1 overflow-hidden relative">
                    <select 
                      value={teamA} 
                      onChange={(e) => setTeamA(e.target.value)}
                      className="text-[10px] text-stone-500 font-bold uppercase mb-1 w-full bg-transparent border-b border-stone-200 pb-1 outline-none cursor-pointer appearance-none z-10 relative"
                      style={{ textAlignLast: 'center' }}
                    >
                      {uniqueTeamsArray.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1 text-stone-300 pointer-events-none" />
                    
                    <p className="text-3xl font-black text-stone-800 mt-2">{winsA}</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wide mt-1">Wins</p>
                  </div>
                  
                  <div className="text-lg font-black text-stone-200 px-2">VS</div>
                  
                  <div className="text-center flex-1 px-1 overflow-hidden relative">
                    <select 
                      value={teamB} 
                      onChange={(e) => setTeamB(e.target.value)}
                      className="text-[10px] text-stone-500 font-bold uppercase mb-1 w-full bg-transparent border-b border-stone-200 pb-1 outline-none cursor-pointer appearance-none z-10 relative"
                      style={{ textAlignLast: 'center' }}
                    >
                      {uniqueTeamsArray.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1 text-stone-300 pointer-events-none" />
                    
                    <p className="text-3xl font-black text-stone-800 mt-2">{winsB}</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wide mt-1">Wins</p>
                  </div>

                </div>

                {latestH2H ? (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Latest Matchup</p>
                      <p className="text-xs font-semibold text-stone-700">{new Date(latestH2H.round_date + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {latestH2H.course_name}</p>
                    </div>
                    <div className="text-right">
                      {latestH2H.isTie ? (
                        <span className="text-[10px] font-black tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1.5 rounded uppercase">TIE: {latestH2H.topScore} to {latestH2H.bottomScore}</span>
                      ) : (
                        <span className="text-[10px] font-black tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1.5 rounded uppercase">
                          {latestH2H.topTeam.split(" & ")[0]} & {latestH2H.topTeam.split(" & ")[1]} WON
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">No Head-to-Head History Found</p>
                  </div>
                )}
              </>
            )}
          </div>

          {!loading && recentGames.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-800 px-1 pt-2">Recent Matches</h2>
              
              <div className="max-h-[500px] overflow-y-auto space-y-4 pr-1 pb-4">
                {recentGames.map((game, index) => (
                  <div key={game.id || index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 text-slate-800">
                        <MapPin size={18} className="text-emerald-500" />
                        <span className="font-bold text-lg">{game.course_name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-xs font-medium mt-1">
                        <Calendar size={12} />
                        <span>{new Date(game.round_date + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>

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

                    <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-3 items-center border border-gray-100">
                      
                      <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${game.isTie ? 'bg-amber-100/50 text-amber-600' : 'bg-emerald-100/50 text-emerald-600'}`}>
                        {game.isTie ? 'TIE' : 'WINNER'}
                      </div>
                      <div className="font-bold text-slate-800">{game.topTeam}</div>
                      <div className={`font-black text-lg text-right ${game.isTie ? 'text-amber-600' : 'text-emerald-600'}`}>{game.topScore || "-"}</div>

                      <div className="col-span-3 h-px bg-gray-200"></div>

                      <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${game.isTie ? 'bg-amber-100/50 text-amber-600' : 'bg-gray-200/50 text-slate-500'}`}>
                        {game.isTie ? 'TIE' : 'LOSER'}
                      </div>
                      <div className={`font-bold ${game.isTie ? 'text-slate-800' : 'text-slate-500'}`}>{game.bottomTeam}</div>
                      <div className={`font-black text-lg text-right ${game.isTie ? 'text-amber-600' : 'text-slate-600'}`}>{game.bottomScore || "-"}</div>
                      
                    </div>
                  </div>
                ))}
              </div>
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