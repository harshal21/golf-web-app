"use client";

import { useState } from "react";
import React from "react";
import { Calendar, MapPin, CheckCircle, Loader2, Target, Crosshair, Flag, Navigation, Lock, Unlock, ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, Users } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_PASSWORD = "hpatel4296";

type PlayerID = "P1" | "P2";

interface ScrambleHoleData {
  hole: number;
  par: number;
  score: number;
  d: PlayerID[];
  a: PlayerID[];
  c: PlayerID[];
  p: PlayerID[];
}

export default function ScrambleSessionPage() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // General Match Info
  const [courseName, setCourseName] = useState("");
  const [roundDate, setRoundDate] = useState("");
  const [par, setPar] = useState("");
  const [teeColor, setTeeColor] = useState("Blue");
  const [totalDistance, setTotalDistance] = useState("");
  const [winningTeam, setWinningTeam] = useState("");
  const [winnerScore, setWinnerScore] = useState("");
  const [loserScore, setLoserScore] = useState("");

  // Team Setup
  const [player1, setPlayer1] = useState("Dyshant");
  const [player2, setPlayer2] = useState("Harshal");

  // Hole-by-Hole State
  const [currentHole, setCurrentHole] = useState(1);
  const [holes, setHoles] = useState<ScrambleHoleData[]>(
    Array.from({ length: 18 }, (_, i) => ({
      hole: i + 1,
      par: 4,
      score: 4,
      d: [],
      a: [],
      c: [],
      p: [],
    }))
  );

  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleCourseNameChange = async (text: string) => {
    setCourseName(text);
    if (text.length >= 2) {
      const { data, error } = await supabase.from("sessions").select("course_name").ilike("course_name", `%${text}%`).limit(10);
      if (data && !error) setSuggestions(Array.from(new Set(data.map((s) => s.course_name))));
    } else {
      setSuggestions([]); 
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordAttempt === ADMIN_PASSWORD) { setIsAdmin(true); setPasswordError(false); } 
    else { setPasswordError(true); setPasswordAttempt(""); }
  };

  // Stepper Helpers
  const adjustScore = (field: "par" | "score", amount: number, min: number = 1) => {
    const newHoles = [...holes];
    const currentValue = newHoles[currentHole - 1][field];
    newHoles[currentHole - 1][field] = Math.max(min, currentValue + amount);
    setHoles(newHoles);
  };

  // Shot Array Helpers
  const addShot = (category: "d" | "a" | "c" | "p", player: PlayerID) => {
    const newHoles = [...holes];
    newHoles[currentHole - 1][category].push(player);
    setHoles(newHoles);
  };

  const undoShot = (category: "d" | "a" | "c" | "p") => {
    const newHoles = [...holes];
    newHoles[currentHole - 1][category].pop();
    setHoles(newHoles);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Calculate the aggregate totals for the old charts
    const p1Stats = {
      drives: holes.reduce((acc, h) => acc + h.d.filter((p) => p === "P1").length, 0),
      approaches: holes.reduce((acc, h) => acc + h.a.filter((p) => p === "P1").length, 0),
      chips: holes.reduce((acc, h) => acc + h.c.filter((p) => p === "P1").length, 0),
      putts: holes.reduce((acc, h) => acc + h.p.filter((p) => p === "P1").length, 0),
    };

    const p2Stats = {
      drives: holes.reduce((acc, h) => acc + h.d.filter((p) => p === "P2").length, 0),
      approaches: holes.reduce((acc, h) => acc + h.a.filter((p) => p === "P2").length, 0),
      chips: holes.reduce((acc, h) => acc + h.c.filter((p) => p === "P2").length, 0),
      putts: holes.reduce((acc, h) => acc + h.p.filter((p) => p === "P2").length, 0),
    };

    const { error } = await supabase.from("sessions").insert([{
        course_name: courseName, round_date: roundDate, type: "scramble", par: parseInt(par), tee_color: teeColor, total_distance: parseInt(totalDistance),
        winning_team: winningTeam, score: parseInt(winnerScore), loser_score: parseInt(loserScore),
        shot_contributions: {
          [player1]: p1Stats,
          [player2]: p2Stats,
          matrix: holes.map(h => ({ hole: h.hole, d: h.d, a: h.a, c: h.c, p: h.p }))
        }
      }]);

    setLoading(false);
    if (error) { 
      alert("Error saving session. Check console."); 
      console.error(error);
    } else {
      setSaved(true); 
      setCourseName(""); setWinnerScore(""); setLoserScore(""); setTotalDistance("");
      setHoles(Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 4, score: 4, d: [], a: [], c: [], p: [] })));
      setSuggestions([]); setTimeout(() => setSaved(false), 3000);
    }
  };

  const activeData = holes[currentHole - 1];

  const renderShotRow = (catId: "d" | "a" | "c" | "p", label: string, icon: React.ReactNode) => {
    const shots = activeData[catId];
    return (
      <div className="bg-stone-50 border border-stone-100 p-3 rounded-xl">
        <div className="flex justify-between items-center mb-3">
          <label className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-wider">
            {icon} {label}
          </label>
          <button type="button" onClick={() => undoShot(catId)} disabled={shots.length === 0} className="text-[10px] font-bold text-stone-400 hover:text-stone-600 disabled:opacity-30 flex items-center gap-1 uppercase">
            <RotateCcw size={12} /> Undo
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => addShot(catId, "P1")} className="flex-1 py-3 bg-white border border-amber-200 text-amber-700 font-black rounded-lg active:bg-amber-50 transition shadow-sm text-sm">
            + {player1}
          </button>
          <button type="button" onClick={() => addShot(catId, "P2")} className="flex-1 py-3 bg-white border border-green-200 text-green-800 font-black rounded-lg active:bg-green-50 transition shadow-sm text-sm">
            + {player2}
          </button>
        </div>

        {/* Dynamic Badge Display */}
        {shots.length > 0 && (
          <div className="mt-3 p-2 bg-white rounded-lg border border-stone-200 flex flex-wrap gap-2 min-h-[40px] items-center">
            {shots.map((p, idx) => (
              <div key={idx} className={`px-3 py-1 text-xs font-black rounded-md text-white shadow-sm animate-in zoom-in duration-200 ${p === "P1" ? "bg-amber-600" : "bg-green-800"}`}>
                {p === "P1" ? player1 : player2}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 p-4 pt-6 animate-in fade-in duration-500 pb-24">
      <div className="max-w-md mx-auto">
        
        <div className="flex items-center gap-3 mb-6">
          <Link href="/sessions" className="p-2 bg-white rounded-full shadow-sm border border-stone-200 text-stone-500 hover:text-green-800 transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-stone-800 flex-1">Log Scramble</h1>
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
            
            {/* Team Setup */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
              <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-3"><Users size={16} className="text-green-800" /> Team Roster</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Player 1</label>
                  <select value={player1} onChange={(e) => setPlayer1(e.target.value)} className="w-full p-2 bg-amber-50 border border-amber-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-sm font-bold text-stone-900 mt-1">
                    <option value="Dyshant">Dyshant</option><option value="Harshal">Harshal</option><option value="Anuj">Anuj</option><option value="Michael">Michael</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-green-800 uppercase tracking-wider">Player 2</label>
                  <select value={player2} onChange={(e) => setPlayer2(e.target.value)} className="w-full p-2 bg-green-50 border border-green-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 transition text-sm font-bold text-stone-900 mt-1">
                    <option value="Harshal">Harshal</option><option value="Dyshant">Dyshant</option><option value="Anuj">Anuj</option><option value="Michael">Michael</option>
                  </select>
                </div>
              </div>
            </div>

            {/* General Info */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 space-y-4">
              <div className="relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2"><MapPin size={16} className="text-green-800" /> Course Info</label>
                <input type="text" placeholder="Course Name" value={courseName} onChange={(e) => handleCourseNameChange(e.target.value)} required className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-stone-900 disabled:bg-stone-100 mb-3" />
                {suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-stone-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((suggestion, idx) => (
                      <button key={idx} type="button" onClick={() => { setCourseName(suggestion); setSuggestions([]); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 border-b border-stone-50 last:border-0 transition">{suggestion}</button>
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                   <input type="date" value={roundDate} onChange={(e) => setRoundDate(e.target.value)} required className="w-full p-3 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-stone-900 disabled:bg-stone-100" />
                   <select value={teeColor} onChange={(e) => setTeeColor(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-sm text-stone-900 disabled:bg-stone-100">
                    <option value="Blue">Blue Tees</option><option value="White">White Tees</option><option value="Silver">Silver Tees</option><option value="Black">Black Tees</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Total Par" value={par} onChange={(e) => setPar(e.target.value)} required className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-stone-900 disabled:bg-stone-100" />
                  <input type="number" placeholder="Total Yards" value={totalDistance} onChange={(e) => setTotalDistance(e.target.value)} required className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-stone-900 disabled:bg-stone-100" />
                </div>
              </div>
            </div>

            {/* Match Results */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
              <label className="block text-sm font-semibold text-stone-700 mb-3">Match Results</label>
              <select value={winningTeam} onChange={(e) => setWinningTeam(e.target.value)} required className="w-full p-3 mb-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-stone-900 disabled:bg-stone-100">
                <option value="">Select winner...</option><option value="Dyshant & Harshal">Dyshant & Harshal</option><option value="Anuj & Michael">Anuj & Michael</option><option value="Tie">Tie / Push</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-green-800 mb-2 uppercase tracking-wide">Win Score</label>
                  <input type="number" value={winnerScore} onChange={(e) => setWinnerScore(e.target.value)} required className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl font-black text-stone-900 disabled:bg-stone-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Lose Score</label>
                  <input type="number" value={loserScore} onChange={(e) => setLoserScore(e.target.value)} required className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl font-black text-stone-900 disabled:bg-stone-100" />
                </div>
              </div>
            </div>

            {/* HOLE BY HOLE TRACKER */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="bg-stone-900 p-4 flex items-center justify-between text-white">
                <button type="button" onClick={() => setCurrentHole(Math.max(1, currentHole - 1))} className={`p-2 rounded-full ${currentHole === 1 ? 'opacity-30' : 'hover:bg-stone-800 active:bg-stone-700'}`}>
                  <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Team Hole</p>
                  <p className="text-3xl font-black text-amber-500">{currentHole}</p>
                </div>
                <button type="button" onClick={() => setCurrentHole(Math.min(18, currentHole + 1))} className={`p-2 rounded-full ${currentHole === 18 ? 'opacity-30' : 'hover:bg-stone-800 active:bg-stone-700'}`}>
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="p-5 space-y-6">
                
                {/* Par & Score Steppers */}
                <div className="grid grid-cols-2 gap-6 pb-6 border-b border-stone-100">
                  <div className="flex flex-col items-center">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Hole Par</label>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => adjustScore("par", -1, 3)} className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Minus size={16} /></button>
                      <span className="text-2xl font-black text-stone-800 w-6 text-center">{activeData.par}</span>
                      <button type="button" onClick={() => adjustScore("par", 1)} className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Plus size={16} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Team Score</label>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => adjustScore("score", -1, 1)} className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Minus size={16} /></button>
                      <span className={`text-2xl font-black w-6 text-center ${activeData.score < activeData.par ? 'text-red-500' : activeData.score > activeData.par ? 'text-blue-500' : 'text-stone-800'}`}>{activeData.score}</span>
                      <button type="button" onClick={() => adjustScore("score", 1)} className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Plus size={16} /></button>
                    </div>
                  </div>
                </div>

                {/* Shot Selection Rows */}
                <div className="space-y-4">
                  {renderShotRow("d", "Drives Used", <Navigation size={14} className="text-amber-600" />)}
                  {renderShotRow("a", "Approaches Used", <Crosshair size={14} className="text-green-800" />)}
                  {renderShotRow("c", "Chips / Sand Used", <Target size={14} className="text-stone-500" />)}
                  {renderShotRow("p", "Putts Used", <Flag size={14} className="text-yellow-500" />)}
                </div>

              </div>
            </div>

            <button type="submit" className="w-full bg-green-900 text-white font-bold py-4 rounded-xl active:bg-green-800 transition flex justify-center items-center gap-2 disabled:bg-stone-300 disabled:text-stone-500">
              {loading ? <Loader2 size={20} className="animate-spin" /> : saved ? <><CheckCircle size={20} className="text-amber-400" /> Saved!</> : "Save Scramble Data"}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}