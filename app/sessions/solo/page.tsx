"use client";

import { useState } from "react";
import { Calendar, MapPin, CheckCircle, Loader2, Lock, Unlock, ArrowLeft, User, ChevronLeft, ChevronRight, Minus, Plus, Hash } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_PASSWORD = "hpatel4296";

interface HoleData {
  hole: number;
  par: number;
  score: number;
  penalties: number; 
  fairway: "Hit" | "Left" | "Right" | "N/A" | "Short" | "Long"; 
  gir: boolean;
  girMiss: "Left" | "Short" | "Long" | "Right" | null;
  chips: number;
  bunker: number;
  putts: number;
}

export default function SoloSessionPage() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [availablePlayers, setAvailablePlayers] = useState(["Harshal", "Dyshant", "Anuj", "Michael"]);
  const [playerName, setPlayerName] = useState("Harshal");
  
  const [courseName, setCourseName] = useState("");
  const [roundDate, setRoundDate] = useState("");
  
  // NEW: Track if it's a 9 or 18 hole round
  const [roundType, setRoundType] = useState<"9" | "18">("18");
  
  const [currentHole, setCurrentHole] = useState(1);
  const [holes, setHoles] = useState<HoleData[]>(
    Array.from({ length: 18 }, (_, i) => ({
      hole: i + 1,
      par: 4,
      score: 0, 
      penalties: 0, 
      fairway: "Hit",
      gir: false,
      girMiss: "Short", 
      chips: 0,
      bunker: 0,
      putts: 2,
    }))
  );

  const maxHoles = roundType === "9" ? 9 : 18;
  const activeHoles = holes.slice(0, maxHoles);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordAttempt === ADMIN_PASSWORD) { setIsAdmin(true); setPasswordError(false); } 
    else { setPasswordError(true); setPasswordAttempt(""); }
  };

  const updateHole = <K extends keyof HoleData>(field: K, value: HoleData[K]) => {
    setHoles((prevHoles) => {
      const newHoles = [...prevHoles];
      newHoles[currentHole - 1] = { ...newHoles[currentHole - 1], [field]: value };
      return newHoles;
    });
  };

  const adjustNumber = (field: keyof HoleData, amount: number, min: number = 0) => {
    const currentValue = holes[currentHole - 1][field] as number;
    const newValue = Math.max(min, currentValue + amount);
    updateHole(field, newValue as HoleData[typeof field]);
  };

  const activeData = holes[currentHole - 1];
  const isReadyToSave = activeHoles.every(h => h.score > 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadyToSave) return;
    setLoading(true);

    const calculatedTotalScore = activeHoles.reduce((acc, curr) => acc + curr.score, 0);

    const { error } = await supabase.from("solo_rounds").insert([
      {
        player_name: playerName,
        course_name: courseName,
        round_date: roundDate,
        total_score: calculatedTotalScore,
        hole_data: activeHoles, // Only saves the selected 9 or 18 holes
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("Error saving solo round:", error);
      alert("Error saving session. Check console.");
    } else {
      setSaved(true);
      setCourseName(""); 
      setHoles(Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 4, score: 0, penalties: 0, fairway: "Hit", gir: false, girMiss: "Short", chips: 0, bunker: 0, putts: 2 })));
      setTimeout(() => setSaved(false), 3000);
      setCurrentHole(1);
    }
  };

  const handlePlayerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "ADD_NEW") {
      const newPlayer = prompt("Enter the new player's name:");
      if (newPlayer && newPlayer.trim() !== "") {
        setAvailablePlayers([...availablePlayers, newPlayer.trim()]);
        setPlayerName(newPlayer.trim());
      }
    } else {
      setPlayerName(e.target.value);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-4 pt-6 animate-in fade-in duration-500 pb-24">
      <div className="max-w-md mx-auto">
        
        <div className="flex items-center gap-3 mb-6">
          <Link href="/sessions" className="p-2 bg-white rounded-full shadow-sm border border-stone-200 text-stone-500 hover:text-green-800 transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-stone-800 flex-1">Solo Round</h1>
          {isAdmin ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md uppercase tracking-wider"><Unlock size={12} /> Unlocked</span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-200 px-2 py-1 rounded-md uppercase tracking-wider"><Lock size={12} /> Locked</span>
          )}
        </div>

        {!isAdmin && (
          <form onSubmit={handleUnlock} className="bg-stone-900 p-4 rounded-2xl shadow-md mb-6 flex items-center gap-3 animate-in slide-in-from-top-2">
            <input type="password" placeholder="Admin Password" value={passwordAttempt} onChange={(e) => setPasswordAttempt(e.target.value)} className={`flex-1 p-3 bg-stone-800 text-white border ${passwordError ? 'border-red-500' : 'border-stone-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-stone-500`} />
            <button type="submit" className="bg-green-800 hover:bg-green-700 text-white font-bold p-3 rounded-xl transition">Unlock</button>
          </form>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <fieldset disabled={!isAdmin} className={`space-y-6 transition-opacity duration-300 ${!isAdmin ? 'opacity-50' : 'opacity-100'}`}>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2"><User size={16} className="text-green-800" /> Player</label>
                  <select 
                    value={playerName} 
                    onChange={handlePlayerChange} 
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-sm font-bold text-stone-900"
                  >
                    {availablePlayers.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="ADD_NEW" className="font-bold text-green-700">+ Add New Player</option>
                  </select>
                </div>
                 <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2"><Calendar size={16} className="text-green-800" /> Date</label>
                  <input type="date" value={roundDate} onChange={(e) => setRoundDate(e.target.value)} required className="w-full p-3 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-stone-900 disabled:bg-stone-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2"><MapPin size={16} className="text-green-800" /> Course Name</label>
                  <input type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} required className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-stone-900 disabled:bg-stone-100" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2"><Hash size={16} className="text-green-800" /> Round Type</label>
                  <select 
                    value={roundType} 
                    onChange={(e) => {
                      setRoundType(e.target.value as "9" | "18");
                      if (e.target.value === "9" && currentHole > 9) setCurrentHole(9);
                    }} 
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-sm font-bold text-stone-900"
                  >
                    <option value="18">18 Holes</option>
                    <option value="9">9 Holes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="bg-stone-900 p-4 flex items-center justify-between text-white">
                <button type="button" onClick={() => setCurrentHole(Math.max(1, currentHole - 1))} className={`p-2 rounded-full ${currentHole === 1 ? 'opacity-30' : 'hover:bg-stone-800 active:bg-stone-700'}`}>
                  <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Hole</p>
                  <p className="text-3xl font-black text-amber-500">{currentHole}</p>
                </div>
                <button type="button" onClick={() => setCurrentHole(Math.min(maxHoles, currentHole + 1))} className={`p-2 rounded-full ${currentHole === maxHoles ? 'opacity-30' : 'hover:bg-stone-800 active:bg-stone-700'}`}>
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="p-5 space-y-6">
                
                <div className="grid grid-cols-3 gap-4 pb-6 border-b border-stone-100">
                  <div className="flex flex-col items-center">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Par</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => adjustNumber("par", -1, 3)} className="w-7 h-7 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Minus size={14} /></button>
                      <span className="text-xl font-black text-stone-800 w-5 text-center">{activeData.par}</span>
                      <button type="button" onClick={() => adjustNumber("par", 1, 5)} className="w-7 h-7 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Score</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateHole("score", Math.max(0, activeData.score - 1))} className="w-7 h-7 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Minus size={14} /></button>
                      <span className={`text-xl font-black w-5 text-center ${activeData.score === 0 ? 'text-stone-300' : activeData.score < activeData.par ? 'text-red-500' : activeData.score > activeData.par ? 'text-blue-500' : 'text-stone-800'}`}>
                        {activeData.score === 0 ? "-" : activeData.score}
                      </span>
                      <button type="button" onClick={() => updateHole("score", activeData.score === 0 ? activeData.par : activeData.score + 1)} className="w-7 h-7 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <label className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Penalties</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => adjustNumber("penalties", -1, 0)} className="w-7 h-7 flex items-center justify-center bg-red-50 rounded-full text-red-600 active:bg-red-100"><Minus size={14} /></button>
                      <span className="text-xl font-black text-red-600 w-4 text-center">{activeData.penalties}</span>
                      <button type="button" onClick={() => adjustNumber("penalties", 1)} className="w-7 h-7 flex items-center justify-center bg-red-50 rounded-full text-red-600 active:bg-red-100"><Plus size={14} /></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pb-6 border-b border-stone-100">
                  {activeData.par === 3 ? (
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Par 3 Tee Shot</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {(["Left", "Short", "Hit", "Long", "Right"] as const).map((opt) => (
                          <button key={opt} type="button" onClick={() => updateHole("fairway", opt)} className={`py-2 text-[10px] uppercase font-bold rounded-lg transition ${activeData.fairway === opt ? (opt === 'Hit' ? 'bg-green-600 text-white' : 'bg-amber-600 text-white') : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Fairway Off Tee</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(["Left", "Hit", "Right", "Short"] as const).map((opt) => (
                          <button key={opt} type="button" onClick={() => updateHole("fairway", opt)} className={`py-2 text-xs font-bold rounded-lg transition ${activeData.fairway === opt ? (opt === 'Hit' ? 'bg-green-600 text-white' : 'bg-amber-600 text-white') : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-100">
                      <label className="text-sm font-bold text-stone-700">Green in Regulation (GIR)</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { updateHole("gir", false); if (!activeData.girMiss) updateHole("girMiss", "Short"); }} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${!activeData.gir ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-500'}`}>No</button>
                        <button type="button" onClick={() => { updateHole("gir", true); updateHole("girMiss", null); }} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${activeData.gir ? 'bg-green-600 text-white' : 'bg-stone-200 text-stone-500'}`}>Yes</button>
                      </div>
                    </div>
                    
                    {!activeData.gir && (
                      <div className="bg-stone-100 p-3 rounded-xl border border-stone-200 animate-in fade-in slide-in-from-top-1">
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2 text-center">Where did the approach miss?</label>
                        <div className="grid grid-cols-4 gap-2">
                          {(["Left", "Short", "Long", "Right"] as const).map(opt => (
                            <button key={opt} type="button" onClick={() => updateHole("girMiss", opt)} className={`py-2 text-[10px] uppercase font-bold rounded-lg transition ${activeData.girMiss === opt ? 'bg-red-500 text-white shadow-sm' : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'}`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "chips", label: "Chips" },
                    { id: "bunker", label: "Sand" },
                    { id: "putts", label: "Putts" }
                  ].map((stat) => (
                    <div key={stat.id} className="bg-stone-50 border border-stone-100 p-3 rounded-xl flex flex-col items-center">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{stat.label}</label>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => adjustNumber(stat.id as keyof HoleData, -1)} className="p-1.5 bg-white shadow-sm border border-stone-200 rounded-md text-stone-500 active:bg-stone-100"><Minus size={12} /></button>
                        <span className="font-black text-lg text-stone-800 w-4 text-center">{activeData[stat.id as keyof HoleData]}</span>
                        <button type="button" onClick={() => adjustNumber(stat.id as keyof HoleData, 1)} className="p-1.5 bg-white shadow-sm border border-stone-200 rounded-md text-stone-500 active:bg-stone-100"><Plus size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            <button type="submit" disabled={!isReadyToSave || loading} className={`w-full font-bold py-4 rounded-xl transition flex justify-center items-center gap-2 ${isReadyToSave ? 'bg-green-900 text-white active:bg-green-800' : 'bg-stone-200 text-stone-400'}`}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : saved ? <><CheckCircle size={20} className="text-amber-400" /> Saved!</> : isReadyToSave ? `Save ${roundType}-Hole Round` : `Enter all ${roundType} scores to save`}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}