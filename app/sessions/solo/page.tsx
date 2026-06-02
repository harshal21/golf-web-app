"use client";

import { useState } from "react";
import { Calendar, MapPin, CheckCircle, Loader2, Lock, Unlock, ArrowLeft, User, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_PASSWORD = "hpatel4296";

// Interface for our new 18-hole state
interface HoleData {
  hole: number;
  par: number;
  score: number;
  fairway: "Hit" | "Left" | "Right" | "N/A";
  gir: boolean;
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

  // General Info
  const [playerName, setPlayerName] = useState("Harshal");
  const [courseName, setCourseName] = useState("");
  const [roundDate, setRoundDate] = useState("");
  
  // Hole-by-Hole State
  const [currentHole, setCurrentHole] = useState(1);
  const [holes, setHoles] = useState<HoleData[]>(
    Array.from({ length: 18 }, (_, i) => ({
      hole: i + 1,
      par: 4,
      score: 4,
      fairway: "Hit",
      gir: false,
      chips: 0,
      bunker: 0,
      putts: 2,
    }))
  );

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordAttempt === ADMIN_PASSWORD) { setIsAdmin(true); setPasswordError(false); } 
    else { setPasswordError(true); setPasswordAttempt(""); }
  };

  // Helper to update data for the current hole
  const updateHole = (field: keyof HoleData, value: string | number | boolean) => {
    const newHoles = [...holes];
    newHoles[currentHole - 1] = { ...newHoles[currentHole - 1], [field]: value };
    setHoles(newHoles);
  };

  // Stepper helper to easily increment/decrement numbers
  const adjustNumber = (field: keyof HoleData, amount: number, min: number = 0) => {
    const currentValue = holes[currentHole - 1][field] as number;
    const newValue = Math.max(min, currentValue + amount);
    updateHole(field, newValue);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // We will expand this Supabase insert logic later when we build the Solo database tables!
    // For now, it just simulates saving all 18 holes.
    console.log("Saving 18 Hole Data:", holes);
    
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  // Get current hole data for clean rendering
  const activeData = holes[currentHole - 1];

  return (
    <div className="min-h-screen bg-stone-50 p-4 pt-6 animate-in fade-in duration-500 pb-24">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
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
            
            {/* General Info */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2"><User size={16} className="text-green-800" /> Player</label>
                  <select value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-sm font-bold text-stone-900">
                    <option value="Harshal">Harshal</option>
                    <option value="Dyshant">Dyshant</option>
                    <option value="Anuj">Anuj</option>
                    <option value="Michael">Michael</option>
                  </select>
                </div>
                 <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2"><Calendar size={16} className="text-green-800" /> Date</label>
                  <input type="date" value={roundDate} onChange={(e) => setRoundDate(e.target.value)} required className="w-full p-3 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-stone-900 disabled:bg-stone-100" />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2"><MapPin size={16} className="text-green-800" /> Course Name</label>
                <input type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} required className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-stone-900 disabled:bg-stone-100" />
              </div>
            </div>

            {/* HOLE BY HOLE TRACKER */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              
              {/* Hole Navigator */}
              <div className="bg-stone-900 p-4 flex items-center justify-between text-white">
                <button type="button" onClick={() => setCurrentHole(Math.max(1, currentHole - 1))} className={`p-2 rounded-full ${currentHole === 1 ? 'opacity-30' : 'hover:bg-stone-800 active:bg-stone-700'}`}>
                  <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Hole</p>
                  <p className="text-3xl font-black text-amber-500">{currentHole}</p>
                </div>
                <button type="button" onClick={() => setCurrentHole(Math.min(18, currentHole + 1))} className={`p-2 rounded-full ${currentHole === 18 ? 'opacity-30' : 'hover:bg-stone-800 active:bg-stone-700'}`}>
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="p-5 space-y-6">
                
                {/* Par & Score */}
                <div className="grid grid-cols-2 gap-6 pb-6 border-b border-stone-100">
                  <div className="flex flex-col items-center">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Par</label>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => adjustNumber("par", -1, 3)} className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Minus size={16} /></button>
                      <span className="text-2xl font-black text-stone-800 w-6 text-center">{activeData.par}</span>
                      <button type="button" onClick={() => adjustNumber("par", 1, 5)} className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Plus size={16} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Score</label>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => adjustNumber("score", -1, 1)} className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Minus size={16} /></button>
                      <span className={`text-2xl font-black w-6 text-center ${activeData.score < activeData.par ? 'text-red-500' : activeData.score > activeData.par ? 'text-blue-500' : 'text-stone-800'}`}>{activeData.score}</span>
                      <button type="button" onClick={() => adjustNumber("score", 1)} className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Plus size={16} /></button>
                    </div>
                  </div>
                </div>

                {/* Fairway & GIR */}
                <div className="space-y-4 pb-6 border-b border-stone-100">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Fairway Off Tee</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["Left", "Hit", "Right", "N/A"].map((opt) => (
                        <button key={opt} type="button" onClick={() => updateHole("fairway", opt)} className={`py-2 text-xs font-bold rounded-lg transition ${activeData.fairway === opt ? (opt === 'Hit' ? 'bg-green-600 text-white' : opt === 'N/A' ? 'bg-stone-600 text-white' : 'bg-amber-600 text-white') : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <label className="text-sm font-bold text-stone-700">Green in Regulation (GIR)</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => updateHole("gir", false)} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${!activeData.gir ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-500'}`}>No</button>
                      <button type="button" onClick={() => updateHole("gir", true)} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${activeData.gir ? 'bg-green-600 text-white' : 'bg-stone-200 text-stone-500'}`}>Yes</button>
                    </div>
                  </div>
                </div>

                {/* Short Game */}
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

            <button type="submit" className="w-full bg-green-900 text-white font-bold py-4 rounded-xl active:bg-green-800 transition flex justify-center items-center gap-2 disabled:bg-stone-300 disabled:text-stone-500">
              {loading ? <Loader2 size={20} className="animate-spin" /> : saved ? <><CheckCircle size={20} className="text-amber-400" /> Saved!</> : "Save 18-Hole Round"}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}