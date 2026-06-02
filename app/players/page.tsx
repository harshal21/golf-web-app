"use client";

import { useState, useEffect } from "react";
import { UserCircle, Activity, Loader2, Navigation, Crosshair, Target, Flag } from "lucide-react";
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

export default function PlayersPage() {
  const [loading, setLoading] = useState(true);
  const [roundsLogged, setRoundsLogged] = useState(0);
  const [harshalStats, setHarshalStats] = useState<PlayerStats>({ drives: 0, approaches: 0, chips: 0, putts: 0 });
  const [dyshantStats, setDyshantStats] = useState<PlayerStats>({ drives: 0, approaches: 0, chips: 0, putts: 0 });

  useEffect(() => {
    async function fetchPlayerStats() {
      const { data, error } = await supabase
        .from("sessions")
        .select("shot_contributions")
        .not("shot_contributions", "is", null);

      if (error) {
        console.error("Error fetching stats:", error);
      } else if (data) {
        setRoundsLogged(data.length);
        
        // Sum up all the JSON data
        const hStats = { drives: 0, approaches: 0, chips: 0, putts: 0 };
        const dStats = { drives: 0, approaches: 0, chips: 0, putts: 0 };

        data.forEach(session => {
          const stats = session.shot_contributions;
          if (stats?.Harshal && stats?.Dyshant) {
            hStats.drives += stats.Harshal.drives || 0;
            hStats.approaches += stats.Harshal.approaches || 0;
            hStats.chips += stats.Harshal.chips || 0;
            hStats.putts += stats.Harshal.putts || 0;
            
            dStats.drives += stats.Dyshant.drives || 0;
            dStats.approaches += stats.Dyshant.approaches || 0;
            dStats.chips += stats.Dyshant.chips || 0;
            dStats.putts += stats.Dyshant.putts || 0;
          }
        });

        setHarshalStats(hStats);
        setDyshantStats(dStats);
      }
      setLoading(false);
    }
    fetchPlayerStats();
  }, []);

  // Helper to calculate percentage for the progress bars
  const getPct = (p1: number, p2: number) => {
    const total = p1 + p2;
    if (total === 0) return 50; // Default to middle if no data
    return Math.round((p1 / total) * 100);
  };

  const statCategories = [
    { id: "drives", label: "Drives", icon: <Navigation size={16} className="text-amber-600" />, color: "bg-amber-600" },
    { id: "approaches", label: "Approach", icon: <Crosshair size={16} className="text-green-800" />, color: "bg-green-800" },
    { id: "chips", label: "Short Game", icon: <Target size={16} className="text-stone-500" />, color: "bg-stone-500" },
    { id: "putts", label: "Putting", icon: <Flag size={16} className="text-yellow-500" />, color: "bg-yellow-500" },
  ];

  return (
    <div className="p-4 pt-6 animate-in fade-in duration-500 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Team Analytics</h1>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" /></div>
      ) : roundsLogged === 0 ? (
        <p className="text-center text-slate-500 mt-10">Log a scramble round with shot data to see analytics.</p>
      ) : (
        <div className="space-y-6">
          
          {/* Top Level Player Profiles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <UserCircle size={28} className="text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-800">Harshal</h3>
              <p className="text-[10px] uppercase font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full mt-1">Player 1</p>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <UserCircle size={28} className="text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-800">Dyshant</h3>
              <p className="text-[10px] uppercase font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full mt-1">Player 2</p>
            </div>
          </div>

          {/* Shot Contribution Breakdown */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Activity size={18} className="text-emerald-500" /> Shot Selection Split
            </h2>

            <div className="space-y-6">
              {statCategories.map((cat) => {
                const hVal = harshalStats[cat.id as keyof PlayerStats];
                const dVal = dyshantStats[cat.id as keyof PlayerStats];
                const hPct = getPct(hVal, dVal);
                
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 text-sm">
                        {cat.icon} {cat.label}
                      </div>
                    </div>
                    
                    {/* The Tug-of-War Progress Bar */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-500 w-8 text-right">{hPct}%</span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden flex relative">
                        {/* Center marker line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50 z-10" />
                        <div className={`h-full ${cat.color} transition-all duration-1000 ease-out`} style={{ width: `${hPct}%` }} />
                        <div className="h-full bg-slate-300 transition-all duration-1000 ease-out" style={{ width: `${100 - hPct}%` }} />
                      </div>
                      <span className="text-xs font-black text-slate-500 w-8">{100 - hPct}%</span>
                    </div>
                    
                    {/* Raw Shot Counts */}
                    <div className="flex justify-between mt-1 px-10">
                      <span className="text-[10px] text-slate-400 font-medium">{hVal} used</span>
                      <span className="text-[10px] text-slate-400 font-medium">{dVal} used</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}