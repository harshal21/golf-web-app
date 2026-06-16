"use client";

import { useState, useEffect } from "react";
import { UserCircle, Activity, Loader2, Navigation, Crosshair, Target, Flag, PieChart, TrendingUp, ChevronDown, ListOrdered, Users } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface PlayerStats {
  drives: number;
  approaches: number;
  chips: number;
  putts: number;
}
interface SessionRecord {
  shot_contributions: Record<string, PlayerStats>;
}

// MOCK DATA: Base Matrix
// We will dynamically swap these letters based on which team is selected!
const baseMockHoleMatrix = [
  { hole: 1, d: "P1", a: ["P2"], c: [], p: ["P1", "P2"] },
  { hole: 2, d: "P2", a: ["P1"], c: ["P2"], p: ["P2"] },
  { hole: 3, d: "P1", a: ["P1", "P2"], c: [], p: ["P2"] },
  { hole: 4, d: "P2", a: ["P2"], c: ["P1"], p: ["P1"] },
  { hole: 5, d: "P1", a: ["P2"], c: [], p: ["P1", "P1", "P2"] },
  { hole: 6, d: "P2", a: ["P1"], c: [], p: ["P2"] },
  { hole: 7, d: "P1", a: ["P2"], c: ["P1", "P2"], p: ["P1"] },
  { hole: 8, d: "P2", a: ["P1"], c: [], p: ["P2", "P2"] },
  { hole: 9, d: "P1", a: ["P1"], c: ["P2"], p: ["P1"] },
  { hole: 10, d: "P1", a: ["P2"], c: [], p: ["P2"] },
  { hole: 11, d: "P2", a: ["P1"], c: [], p: ["P1", "P2"] },
  { hole: 12, d: "P1", a: ["P2"], c: ["P1"], p: ["P1"] },
  { hole: 13, d: "P2", a: ["P1"], c: [], p: ["P2", "P1"] },
  { hole: 14, d: "P1", a: ["P1"], c: ["P2"], p: ["P1"] },
  { hole: 15, d: "P2", a: ["P2"], c: [], p: ["P2"] },
  { hole: 16, d: "P1", a: ["P1"], c: [], p: ["P1", "P2"] },
  { hole: 17, d: "P2", a: ["P2"], c: ["P1"], p: ["P2"] },
  { hole: 18, d: "P1", a: ["P2"], c: [], p: ["P1"] },
];

export default function PlayersPage() {
  const [view, setView] = useState<"scramble" | "solo">("scramble");
  const [loading, setLoading] = useState(true);
  
  // All Raw Data
  const [allSessions, setAllSessions] = useState<SessionRecord[]>([]);

  // Toggles
  const [scrambleTeam, setScrambleTeam] = useState("Dyshant & Harshal");
  const [soloPlayer, setSoloPlayer] = useState("Harshal");

  // Dynamic Scramble Player Names
  const teamPlayers = scrambleTeam.split(" & ");
  const p1Name = teamPlayers[0]; // e.g., Dyshant or Anuj
  const p2Name = teamPlayers[1]; // e.g., Harshal or Michael

  useEffect(() => {
    async function fetchPlayerStats() {
      const { data, error } = await supabase
        .from("sessions")
        .select("shot_contributions")
        .not("shot_contributions", "is", null);

      if (error) {
        console.error("Error fetching stats:", error);
      } else if (data) {
        setAllSessions(data);
      }
      setLoading(false);
    }
    fetchPlayerStats();
  }, []);

  // Calculate stats dynamically based on the selected team
  const p1Stats = { drives: 0, approaches: 0, chips: 0, putts: 0 };
  const p2Stats = { drives: 0, approaches: 0, chips: 0, putts: 0 };

  allSessions.forEach(session => {
    const stats = session.shot_contributions;
    if (stats?.[p1Name] && stats?.[p2Name]) {
      p1Stats.drives += stats[p1Name].drives || 0;
      p1Stats.approaches += stats[p1Name].approaches || 0;
      p1Stats.chips += stats[p1Name].chips || 0;
      p1Stats.putts += stats[p1Name].putts || 0;
      
      p2Stats.drives += stats[p2Name].drives || 0;
      p2Stats.approaches += stats[p2Name].approaches || 0;
      p2Stats.chips += stats[p2Name].chips || 0;
      p2Stats.putts += stats[p2Name].putts || 0;
    }
  });

  const getPct = (val1: number, val2: number) => {
    const total = val1 + val2;
    if (total === 0) return 50; 
    return Math.round((val1 / total) * 100);
  };

  const statCategories = [
    { id: "drives", label: "Drives", icon: <Navigation size={16} className="text-amber-600" />, color: "bg-amber-600" },
    { id: "approaches", label: "Approach", icon: <Crosshair size={16} className="text-green-800" />, color: "bg-green-800" },
    { id: "chips", label: "Short Game", icon: <Target size={16} className="text-stone-500" />, color: "bg-stone-500" },
    { id: "putts", label: "Putting", icon: <Flag size={16} className="text-yellow-500" />, color: "bg-yellow-500" },
  ];

  const mockSoloStats = {
    avgScore: 84.5, girPct: 42,
    fairways: { hit: 55, left: 25, right: 20 },
    putts: { one: 15, two: 65, threePlus: 20 },
    shortGame: { chips: 5.2, bunker: 1.8 }
  };

  const mockTeamStats = {
    avgScore: scrambleTeam === "Dyshant & Harshal" ? 67.2 : 69.5, 
    girPct: scrambleTeam === "Dyshant & Harshal" ? 78 : 65,
    fairways: { hit: 85, left: 10, right: 5 },
    putts: { one: 45, two: 55, threePlus: 0 }
  };

  // Helper to dynamically render badges based on P1/P2
  const renderShotBadges = (players: string | string[]) => {
    if (!players || players.length === 0 || players === "-") {
      return <span className="text-stone-300 font-black">-</span>;
    }

    const playerArray = Array.isArray(players) ? players : [players];

    return (
      <div className="flex flex-wrap items-center justify-center gap-1 min-h-[24px]">
        {playerArray.map((p, index) => {
          const isP1 = p === "P1";
          const initial = isP1 ? p1Name.charAt(0) : p2Name.charAt(0);
          
          return (
            <div 
              key={index} 
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shadow-sm ${
                isP1 ? "bg-amber-600 text-white" : "bg-green-800 text-white"
              }`}
            >
              {initial}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 p-4 pt-6 animate-in fade-in duration-500 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Team & Player Analytics</h1>

      <div className="bg-white p-1 rounded-xl shadow-sm border border-stone-200 flex mb-6">
        <button onClick={() => setView("scramble")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${view === "scramble" ? "bg-stone-800 text-white shadow" : "text-stone-500 hover:text-stone-800"}`}>
          2v2 Scramble
        </button>
        <button onClick={() => setView("solo")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${view === "solo" ? "bg-stone-800 text-white shadow" : "text-stone-500 hover:text-stone-800"}`}>
          Solo Rounds
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-800" /></div>
      ) : view === "scramble" ? (
        
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          
          {/* NEW: Team Selector Toggle */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center"><Users size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Viewing Team Stats</p>
                <select value={scrambleTeam} onChange={(e) => setScrambleTeam(e.target.value)} className="bg-transparent font-black text-lg text-stone-800 focus:outline-none appearance-none pr-6 cursor-pointer">
                  <option value="Dyshant & Harshal">Dyshant & Harshal</option>
                  <option value="Anuj & Michael">Anuj & Michael</option>
                </select>
              </div>
            </div>
            <ChevronDown size={20} className="text-stone-300 pointer-events-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-900 text-white p-4 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10"><Activity size={80} /></div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Team Avg Score</p>
              <p className="text-4xl font-black text-amber-500">{mockTeamStats.avgScore}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Target size={12}/> Team GIR %</p>
              <p className="text-3xl font-black text-stone-800">{mockTeamStats.girPct}%</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
            <h2 className="font-bold text-stone-800 mb-5 flex items-center gap-2"><Activity size={18} className="text-green-800" /> Overall Shot Split</h2>
            <div className="flex items-center justify-between mb-4 px-8">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-600 rounded-full"></div><span className="text-xs font-bold text-stone-600">{p1Name}</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-800 rounded-full"></div><span className="text-xs font-bold text-stone-600">{p2Name}</span></div>
            </div>
            <div className="space-y-6">
              {statCategories.map((cat) => {
                const p1Val = p1Stats[cat.id as keyof PlayerStats];
                const p2Val = p2Stats[cat.id as keyof PlayerStats];
                const p1Pct = getPct(p1Val, p2Val);
                
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between items-center mb-2"><div className="flex items-center gap-1.5 font-bold text-stone-700 text-sm">{cat.icon} {cat.label}</div></div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-stone-500 w-8 text-right">{p1Pct}%</span>
                      <div className="flex-1 h-3 bg-green-800 rounded-full overflow-hidden flex relative">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50 z-10" />
                        <div className="h-full bg-amber-600 transition-all duration-1000 ease-out" style={{ width: `${p1Pct}%` }} />
                      </div>
                      <span className="text-xs font-black text-stone-500 w-8">{100 - p1Pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><ListOrdered size={18} className="text-stone-500" /> Hole-by-Hole Summary</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-center">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest text-left">Hole</th>
                    <th className="py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">Drive</th>
                    <th className="py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">App</th>
                    <th className="py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">Chip</th>
                    <th className="py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">Putt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {baseMockHoleMatrix.map((row) => (
                    <tr key={row.hole} className="hover:bg-stone-50 transition">
                      <td className="py-2.5 text-xs font-black text-stone-800 text-left w-8">{row.hole}</td>
                      <td className="py-2.5 w-14">{renderShotBadges(row.d)}</td>
                      <td className="py-2.5 w-16">{renderShotBadges(row.a)}</td>
                      <td className="py-2.5 w-16">{renderShotBadges(row.c)}</td>
                      <td className="py-2.5 w-20">{renderShotBadges(row.p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      ) : (

        /* ------------------------------------------------ */
        /* SOLO ROUNDS VIEW                                 */
        /* ------------------------------------------------ */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 text-green-800 rounded-full flex items-center justify-center"><UserCircle size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Viewing Stats For</p>
                <select value={soloPlayer} onChange={(e) => setSoloPlayer(e.target.value)} className="bg-transparent font-black text-lg text-stone-800 focus:outline-none appearance-none pr-6 cursor-pointer">
                  <option value="Harshal">Harshal</option><option value="Dyshant">Dyshant</option><option value="Anuj">Anuj</option><option value="Michael">Michael</option>
                </select>
              </div>
            </div>
            <ChevronDown size={20} className="text-stone-300 pointer-events-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-800 text-white p-4 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10"><Activity size={80} /></div>
              <p className="text-xs font-bold text-green-200 uppercase tracking-wider mb-1">Avg Score</p>
              <p className="text-4xl font-black">{mockSoloStats.avgScore}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Target size={12}/> GIR %</p>
              <p className="text-3xl font-black text-stone-800">{mockSoloStats.girPct}%</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
            <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><Navigation size={18} className="text-amber-600" /> Driving Accuracy</h2>
            <div className="h-4 w-full bg-stone-100 rounded-full overflow-hidden flex mb-4">
              <div className="h-full bg-red-400" style={{ width: `${mockSoloStats.fairways.left}%` }} />
              <div className="h-full bg-green-600" style={{ width: `${mockSoloStats.fairways.hit}%` }} />
              <div className="h-full bg-amber-400" style={{ width: `${mockSoloStats.fairways.right}%` }} />
            </div>
            <div className="flex justify-between text-center px-2">
              <div><p className="text-xl font-black text-stone-800">{mockSoloStats.fairways.left}%</p><p className="text-[10px] font-bold text-stone-400 uppercase">Left</p></div>
              <div><p className="text-xl font-black text-green-700">{mockSoloStats.fairways.hit}%</p><p className="text-[10px] font-bold text-green-800/60 uppercase">Fairway</p></div>
              <div><p className="text-xl font-black text-stone-800">{mockSoloStats.fairways.right}%</p><p className="text-[10px] font-bold text-stone-400 uppercase">Right</p></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
            <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><Flag size={18} className="text-yellow-500" /> Putting Breakdown</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-stone-50 border border-stone-100 p-3 rounded-xl text-center"><p className="text-2xl font-black text-stone-800">{mockSoloStats.putts.one}%</p><p className="text-[10px] font-bold text-stone-500 uppercase mt-1">1 Putt</p></div>
              <div className="bg-green-50 border border-green-100 p-3 rounded-xl text-center"><p className="text-2xl font-black text-green-800">{mockSoloStats.putts.two}%</p><p className="text-[10px] font-bold text-green-800/70 uppercase mt-1">2 Putts</p></div>
              <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-center"><p className="text-2xl font-black text-red-600">{mockSoloStats.putts.threePlus}%</p><p className="text-[10px] font-bold text-red-400 uppercase mt-1">3+ Putts</p></div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}