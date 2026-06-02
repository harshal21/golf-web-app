"use client";

import { useState } from "react";
import React from "react";
import { Calendar, MapPin, CheckCircle, Loader2, Target, Crosshair, Flag, Navigation, Lock, Unlock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Your newly updated admin password
const ADMIN_PASSWORD = "hpatel4296";

export default function SessionsPage() {
  const [type] = useState<"scramble" | "solo">("scramble");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // General Info
  const [courseName, setCourseName] = useState("");
  const [roundDate, setRoundDate] = useState("");
  const [par, setPar] = useState("");
  const [teeColor, setTeeColor] = useState("Blue");
  const [totalDistance, setTotalDistance] = useState("");
  
  // Scramble Info
  const [winningTeam, setWinningTeam] = useState("");
  const [winnerScore, setWinnerScore] = useState("");
  const [loserScore, setLoserScore] = useState("");

  // Shot Contributions State
  const [stats, setStats] = useState({
    Harshal: { drives: "", approaches: "", chips: "", putts: "" },
    Dyshant: { drives: "", approaches: "", chips: "", putts: "" }
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleCourseNameChange = async (text: string) => {
    setCourseName(text);
    if (text.length >= 2) {
      const { data, error } = await supabase.from("sessions").select("course_name").ilike("course_name", `%${text}%`).limit(10);
      if (data && !error) {
        setSuggestions(Array.from(new Set(data.map((s) => s.course_name))));
      }
    } else {
      setSuggestions([]); 
    }
  };

  const updateStat = (player: "Harshal" | "Dyshant", category: string, value: string) => {
    setStats(prev => ({
      ...prev,
      [player]: { ...prev[player], [category]: value }
    }));
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordAttempt === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordAttempt("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("sessions").insert([
      {
        course_name: courseName,
        round_date: roundDate,
        type: type,
        par: parseInt(par),
        tee_color: teeColor,
        total_distance: parseInt(totalDistance),
        winning_team: type === "scramble" ? winningTeam : null,
        score: parseInt(winnerScore),
        loser_score: parseInt(loserScore),
        shot_contributions: type === "scramble" ? {
          Harshal: {
            drives: parseInt(stats.Harshal.drives) || 0,
            approaches: parseInt(stats.Harshal.approaches) || 0,
            chips: parseInt(stats.Harshal.chips) || 0,
            putts: parseInt(stats.Harshal.putts) || 0,
          },
          Dyshant: {
            drives: parseInt(stats.Dyshant.drives) || 0,
            approaches: parseInt(stats.Dyshant.approaches) || 0,
            chips: parseInt(stats.Dyshant.chips) || 0,
            putts: parseInt(stats.Dyshant.putts) || 0,
          }
        } : null
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("Error saving:", error);
      alert("Error saving session. Check console.");
    } else {
      setSaved(true);
      setCourseName(""); setWinnerScore(""); setLoserScore(""); setTotalDistance("");
      setStats({ Harshal: { drives: "", approaches: "", chips: "", putts: "" }, Dyshant: { drives: "", approaches: "", chips: "", putts: "" } });
      setSuggestions([]);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="p-4 pt-6 animate-in fade-in duration-500 pb-24 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Log a Session</h1>
        {isAdmin ? (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">
            <Unlock size={14} /> Unlocked
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wider">
            <Lock size={14} /> Locked
          </span>
        )}
      </div>

      {/* Admin Unlock Box */}
      {!isAdmin && (
        <form onSubmit={handleUnlock} className="bg-slate-900 p-4 rounded-2xl shadow-md mb-6 flex items-center gap-3 animate-in slide-in-from-top-2">
          <input 
            type="password" 
            placeholder="Admin Password" 
            value={passwordAttempt}
            onChange={(e) => setPasswordAttempt(e.target.value)}
            className={`flex-1 p-3 bg-slate-800 text-white border ${passwordError ? 'border-red-500' : 'border-slate-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500`}
          />
          <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold p-3 rounded-xl transition">
            Unlock
          </button>
        </form>
      )}

      {/* The main form wrapped in a fieldset to disable everything at once */}
      <form onSubmit={handleSave} className="space-y-6">
        <fieldset disabled={!isAdmin} className={`space-y-6 transition-opacity duration-300 ${!isAdmin ? 'opacity-50' : 'opacity-100'}`}>
          
          {/* General Info */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="relative">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <MapPin size={16} className="text-emerald-500" /> Course Name
              </label>
              <input type="text" value={courseName} onChange={(e) => handleCourseNameChange(e.target.value)} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900 disabled:bg-gray-100" />
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion, idx) => (
                    <button key={idx} type="button" onClick={() => { setCourseName(suggestion); setSuggestions([]); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition">{suggestion}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Calendar size={16} className="text-emerald-500" /> Date
                </label>
                <input type="date" value={roundDate} onChange={(e) => setRoundDate(e.target.value)} required className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900 disabled:bg-gray-100" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Par</label>
                <input type="number" value={par} onChange={(e) => setPar(e.target.value)} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900 disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Tees</label>
                <select value={teeColor} onChange={(e) => setTeeColor(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm text-slate-900 disabled:bg-gray-100">
                  <option value="Blue">Blue</option><option value="White">White</option><option value="Silver">Silver</option><option value="Black">Black</option><option value="Gold">Gold</option><option value="Red">Red</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Yards</label>
                <input type="number" value={totalDistance} onChange={(e) => setTotalDistance(e.target.value)} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900 disabled:bg-gray-100" />
              </div>
            </div>
          </div>

          {/* Match Results */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Match Results</label>
            <select value={winningTeam} onChange={(e) => setWinningTeam(e.target.value)} required className="w-full p-3 mb-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900 disabled:bg-gray-100">
              <option value="">Select winner...</option><option value="Dyshant & Harshal">Dyshant & Harshal</option><option value="Anuj & Michael">Anuj & Michael</option><option value="Tie">Tie / Push</option>
            </select>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-600 mb-2 uppercase tracking-wide">Winning Score</label>
                <input type="number" value={winnerScore} onChange={(e) => setWinnerScore(e.target.value)} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-slate-900 disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Losing Score</label>
                <input type="number" value={loserScore} onChange={(e) => setLoserScore(e.target.value)} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-slate-900 disabled:bg-gray-100" />
              </div>
            </div>
          </div>

          {/* Shot Contribution Tracker */}
          {type === "scramble" && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-slate-700 mb-4">Team Shot Selection</label>
              
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Category</div>
                <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wide text-center">Harshal</div>
                <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wide text-center">Dyshant</div>

                {[
                  { id: "drives", label: "Drives", icon: <Navigation size={14} className="text-amber-600" /> },
                  { id: "approaches", label: "Approach", icon: <Crosshair size={14} className="text-green-800" /> },
                  { id: "chips", label: "Chips", icon: <Target size={14} className="text-stone-500" /> },
                  { id: "putts", label: "Putts", icon: <Flag size={14} className="text-yellow-500" /> },
                ].map((cat) => (
                  <React.Fragment key={cat.id}>
                    <div className="flex items-center gap-2">
                      {cat.icon}
                      <span className="text-sm font-semibold text-slate-700">{cat.label}</span>
                    </div>
                    <input 
                      type="number" 
                      value={stats.Harshal[cat.id as keyof typeof stats.Harshal]} 
                      onChange={(e) => updateStat("Harshal", cat.id, e.target.value)}
                      className="w-16 p-2 text-center bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 transition font-bold text-slate-900 disabled:bg-gray-100"
                    />
                    <input 
                      type="number" 
                      value={stats.Dyshant[cat.id as keyof typeof stats.Dyshant]} 
                      onChange={(e) => updateStat("Dyshant", cat.id, e.target.value)}
                      className="w-16 p-2 text-center bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 transition font-bold text-slate-900 disabled:bg-gray-100"
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl active:bg-slate-800 transition flex justify-center items-center gap-2 disabled:bg-slate-300 disabled:text-slate-500">
            {loading ? <Loader2 size={20} className="animate-spin" /> : saved ? <><CheckCircle size={20} className="text-emerald-400" /> Saved!</> : "Save Session"}
          </button>
        </fieldset>
      </form>
    </div>
  );
}