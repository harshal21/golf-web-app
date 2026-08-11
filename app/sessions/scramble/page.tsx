"use client";

import { useState } from "react";
import React from "react";
import { Calendar, MapPin, CheckCircle, Loader2, Target, Crosshair, Flag, Navigation, Lock, Unlock, ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, Users, Hash } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_PASSWORD = "hpatel4296";

type PlayerID = "P1" | "P2";

interface TeamHoleData {
  score: number;
  penalties: number;
  d: PlayerID[];
  a: PlayerID[];
  p: PlayerID[];
}

interface ScrambleHoleData {
  hole: number;
  par: number;
  team1: TeamHoleData;
  team2: TeamHoleData;
}

export default function ScrambleSessionPage() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [availablePlayers, setAvailablePlayers] = useState(["Harshal", "Dyshant", "Anuj", "Michael"]);
  
  const [courseName, setCourseName] = useState("");
  const [roundDate, setRoundDate] = useState("");
  const [roundType, setRoundType] = useState<"9" | "18">("18");

  const [par, setPar] = useState("");
  const [teeColor, setTeeColor] = useState("Blue");
  const [totalDistance, setTotalDistance] = useState("");
  
  const [winningTeam, setWinningTeam] = useState("");

  // Team 1
  const [t1p1, setT1p1] = useState("Dyshant");
  const [t1p2, setT1p2] = useState("Harshal");
  
  // Team 2
  const [t2p1, setT2p1] = useState("Anuj");
  const [t2p2, setT2p2] = useState("Michael");

  const [activeTeam, setActiveTeam] = useState<"team1" | "team2">("team1");
  const [currentHole, setCurrentHole] = useState(1);
  
  const [holes, setHoles] = useState<ScrambleHoleData[]>(
    Array.from({ length: 18 }, (_, i) => ({
      hole: i + 1,
      par: 4,
      team1: { score: 0, penalties: 0, d: [], a: [], p: [] },
      team2: { score: 0, penalties: 0, d: [], a: [], p: [] },
    }))
  );

  const maxHoles = roundType === "9" ? 9 : 18;
  const activeHoles = holes.slice(0, maxHoles);
  
  const team1TotalScore = activeHoles.reduce((acc, h) => acc + h.team1.score, 0);
  const team2TotalScore = activeHoles.reduce((acc, h) => acc + h.team2.score, 0);

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

  const adjustPar = (amount: number, min: number = 3) => {
    const newHoles = [...holes];
    newHoles[currentHole - 1].par = Math.max(min, newHoles[currentHole - 1].par + amount);
    setHoles(newHoles);
  };

  const adjustScore = (field: "score" | "penalties", amount: number, min: number = 0) => {
    const newHoles = [...holes];
    const current = newHoles[currentHole - 1][activeTeam][field];
    
    let next = current + amount;
    if (field === "score" && current === 0 && amount > 0) {
      next = newHoles[currentHole - 1].par; // Jump to par on first click
    }
    
    newHoles[currentHole - 1][activeTeam][field] = Math.max(min, next);
    setHoles(newHoles);
  };

  const addShot = (category: "d" | "a" | "p", player: PlayerID) => {
    const newHoles = [...holes];
    newHoles[currentHole - 1][activeTeam][category].push(player);
    setHoles(newHoles);
  };

  const undoShot = (category: "d" | "a" | "p") => {
    const newHoles = [...holes];
    newHoles[currentHole - 1][activeTeam][category].pop();
    setHoles(newHoles);
  };

  const activeData = holes[currentHole - 1];
  const activeTeamData = activeData[activeTeam];
  const isReadyToSave = activeHoles.every(h => h.team1.score > 0 && h.team2.score > 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadyToSave) return;
    setLoading(true);

    const winnerScore = Math.min(team1TotalScore, team2TotalScore);
    const loserScore = Math.max(team1TotalScore, team2TotalScore);

    // Team 1 Payload
    const t1p1Stats = {
      drives: activeHoles.reduce((acc, h) => acc + h.team1.d.filter((p) => p === "P1").length, 0),
      approaches: activeHoles.reduce((acc, h) => acc + h.team1.a.filter((p) => p === "P1").length, 0),
      putts: activeHoles.reduce((acc, h) => acc + h.team1.p.filter((p) => p === "P1").length, 0),
    };
    const t1p2Stats = {
      drives: activeHoles.reduce((acc, h) => acc + h.team1.d.filter((p) => p === "P2").length, 0),
      approaches: activeHoles.reduce((acc, h) => acc + h.team1.a.filter((p) => p === "P2").length, 0),
      putts: activeHoles.reduce((acc, h) => acc + h.team1.p.filter((p) => p === "P2").length, 0),
    };

    // Team 2 Payload
    const t2p1Stats = {
      drives: activeHoles.reduce((acc, h) => acc + h.team2.d.filter((p) => p === "P1").length, 0),
      approaches: activeHoles.reduce((acc, h) => acc + h.team2.a.filter((p) => p === "P1").length, 0),
      putts: activeHoles.reduce((acc, h) => acc + h.team2.p.filter((p) => p === "P1").length, 0),
    };
    const t2p2Stats = {
      drives: activeHoles.reduce((acc, h) => acc + h.team2.d.filter((p) => p === "P2").length, 0),
      approaches: activeHoles.reduce((acc, h) => acc + h.team2.a.filter((p) => p === "P2").length, 0),
      putts: activeHoles.reduce((acc, h) => acc + h.team2.p.filter((p) => p === "P2").length, 0),
    };

    // Save 2 separate records so analytics parse automatically
    const { error } = await supabase.from("sessions").insert([
      {
        course_name: courseName, round_date: roundDate, type: "scramble", par: parseInt(par), tee_color: teeColor, total_distance: parseInt(totalDistance),
        winning_team: winningTeam, score: winnerScore, loser_score: loserScore,
        shot_contributions: { [t1p1]: t1p1Stats, [t1p2]: t1p2Stats, matrix: activeHoles.map(h => ({ hole: h.hole, d: h.team1.d, a: h.team1.a, p: h.team1.p, penalties: h.team1.penalties })) }
      },
      {
        course_name: courseName, round_date: roundDate, type: "scramble", par: parseInt(par), tee_color: teeColor, total_distance: parseInt(totalDistance),
        winning_team: winningTeam, score: winnerScore, loser_score: loserScore,
        shot_contributions: { [t2p1]: t2p1Stats, [t2p2]: t2p2Stats, matrix: activeHoles.map(h => ({ hole: h.hole, d: h.team2.d, a: h.team2.a, p: h.team2.p, penalties: h.team2.penalties })) }
      }
    ]);

    setLoading(false);
    if (error) { 
      alert("Error saving session. Check console."); 
      console.error(error);
    } else {
      setSaved(true); 
      setCourseName(""); setTotalDistance(""); setWinningTeam("");
      setHoles(Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 4, team1: { score: 0, penalties: 0, d: [], a: [], p: [] }, team2: { score: 0, penalties: 0, d: [], a: [], p: [] } })));
      setSuggestions([]); setTimeout(() => setSaved(false), 3000);
      setCurrentHole(1);
    }
  };

  const handlePlayerChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "ADD_NEW") {
      const newPlayer = prompt("Enter the new player's name:");
      if (newPlayer && newPlayer.trim() !== "") {
        setAvailablePlayers([...availablePlayers, newPlayer.trim()]);
        setter(newPlayer.trim());
      }
    } else {
      setter(e.target.value);
    }
  };

  const renderShotRow = (catId: "d" | "a" | "p", label: string, icon: React.ReactNode) => {
    const shots = activeTeamData[catId];
    const currentPlayer1 = activeTeam === "team1" ? t1p1 : t2p1;
    const currentPlayer2 = activeTeam === "team1" ? t1p2 : t2p2;

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
            + {currentPlayer1}
          </button>
          <button type="button" onClick={() => addShot(catId, "P2")} className="flex-1 py-3 bg-white border border-green-200 text-green-800 font-black rounded-lg active:bg-green-50 transition shadow-sm text-sm">
            + {currentPlayer2}
          </button>
        </div>

        {shots.length > 0 && (
          <div className="mt-3 p-2 bg-white rounded-lg border border-stone-200 flex flex-wrap gap-2 min-h-[40px] items-center">
            {shots.map((p, idx) => (
              <div key={idx} className={`px-3 py-1 text-xs font-black rounded-md text-white shadow-sm animate-in zoom-in duration-200 ${p === "P1" ? "bg-amber-600" : "bg-green-800"}`}>
                {p === "P1" ? currentPlayer1 : currentPlayer2}
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
          <h1 className="text-2xl font-bold text-stone-800 flex-1">Log Match</h1>
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
            
            {/* UPDATED ROSTER: 4 PLAYERS */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-stone-700"><Users size={16} className="text-green-800" /> Team Rosters</label>
              
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2 block">Team 1</label>
                <div className="grid grid-cols-2 gap-2">
                  <select value={t1p1} onChange={handlePlayerChange(setT1p1)} className="w-full p-2 bg-white border border-stone-200 rounded-lg text-sm font-bold text-stone-900">
                    {availablePlayers.map(p => <option key={p} value={p}>{p}</option>)}<option value="ADD_NEW">+ New</option>
                  </select>
                  <select value={t1p2} onChange={handlePlayerChange(setT1p2)} className="w-full p-2 bg-white border border-stone-200 rounded-lg text-sm font-bold text-stone-900">
                    {availablePlayers.map(p => <option key={p} value={p}>{p}</option>)}<option value="ADD_NEW">+ New</option>
                  </select>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2 block">Team 2</label>
                <div className="grid grid-cols-2 gap-2">
                  <select value={t2p1} onChange={handlePlayerChange(setT2p1)} className="w-full p-2 bg-white border border-stone-200 rounded-lg text-sm font-bold text-stone-900">
                    {availablePlayers.map(p => <option key={p} value={p}>{p}</option>)}<option value="ADD_NEW">+ New</option>
                  </select>
                  <select value={t2p2} onChange={handlePlayerChange(setT2p2)} className="w-full p-2 bg-white border border-stone-200 rounded-lg text-sm font-bold text-stone-900">
                    {availablePlayers.map(p => <option key={p} value={p}>{p}</option>)}<option value="ADD_NEW">+ New</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 space-y-4">
              <div className="relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2"><MapPin size={16} className="text-green-800" /> Course Info</label>
                <input type="text" placeholder="Course Name" value={courseName} onChange={(e) => handleCourseNameChange(e.target.value)} required className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-stone-900 disabled:bg-stone-100 mb-3" />
                <div className="grid grid-cols-2 gap-3 mb-3">
                   <input type="date" value={roundDate} onChange={(e) => setRoundDate(e.target.value)} required className="w-full p-3 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-stone-900 disabled:bg-stone-100" />
                   <select value={teeColor} onChange={(e) => setTeeColor(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-sm text-stone-900 disabled:bg-stone-100">
                    <option value="Blue">Blue Tees</option><option value="White">White Tees</option><option value="Silver">Silver Tees</option><option value="Black">Black Tees</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input type="number" placeholder="Total Par" value={par} onChange={(e) => setPar(e.target.value)} required className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-stone-900 disabled:bg-stone-100" />
                  <input type="number" placeholder="Total Yards" value={totalDistance} onChange={(e) => setTotalDistance(e.target.value)} required className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-stone-900 disabled:bg-stone-100" />
                </div>
                <div className="w-full">
                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 mb-2"><Hash size={16} className="text-green-800" /> Round Type</label>
                  <select 
                    value={roundType} 
                    onChange={(e) => { setRoundType(e.target.value as "9" | "18"); if (e.target.value === "9" && currentHole > 9) setCurrentHole(9); }} 
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-sm font-bold text-stone-900"
                  >
                    <option value="18">18 Holes</option>
                    <option value="9">9 Holes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* UPDATED MATCH RESULTS: AUTO-CALCULATED SCORES */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
              <label className="block text-sm font-semibold text-stone-700 mb-3">Match Results</label>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                  <p className="text-[10px] font-bold text-stone-500 uppercase">Team 1 Score</p>
                  <p className="text-2xl font-black text-stone-800">{team1TotalScore}</p>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                  <p className="text-[10px] font-bold text-stone-500 uppercase">Team 2 Score</p>
                  <p className="text-2xl font-black text-stone-800">{team2TotalScore}</p>
                </div>
              </div>

              <select value={winningTeam} onChange={(e) => setWinningTeam(e.target.value)} required className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 transition text-stone-900 disabled:bg-stone-100">
                <option value="">Confirm Winner...</option>
                <option value={`${t1p1} & ${t1p2}`}>Team 1: {t1p1} & {t1p2}</option>
                <option value={`${t2p1} & ${t2p2}`}>Team 2: {t2p1} & {t2p2}</option>
                <option value="Tie">Tie / Push</option>
              </select>
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
                
                {/* NEW PILL TOGGLE FOR TEAM ENTRY */}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setActiveTeam("team1")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition border ${activeTeam === "team1" ? "bg-stone-800 text-white border-stone-800 shadow-sm" : "bg-white text-stone-500 border-stone-200"}`}>
                    Team 1
                  </button>
                  <button type="button" onClick={() => setActiveTeam("team2")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition border ${activeTeam === "team2" ? "bg-stone-800 text-white border-stone-800 shadow-sm" : "bg-white text-stone-500 border-stone-200"}`}>
                    Team 2
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pb-6 border-b border-stone-100">
                  <div className="flex flex-col items-center">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Hole Par</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => adjustPar(-1, 3)} className="w-7 h-7 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Minus size={14} /></button>
                      <span className="text-xl font-black text-stone-800 w-5 text-center">{activeData.par}</span>
                      <button type="button" onClick={() => adjustPar(1, 5)} className="w-7 h-7 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Score</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => adjustScore("score", -1, 0)} className="w-7 h-7 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Minus size={14} /></button>
                      <span className={`text-xl font-black w-5 text-center ${activeTeamData.score === 0 ? 'text-stone-300' : activeTeamData.score < activeData.par ? 'text-red-500' : activeTeamData.score > activeData.par ? 'text-blue-500' : 'text-stone-800'}`}>
                        {activeTeamData.score === 0 ? "-" : activeTeamData.score}
                      </span>
                      <button type="button" onClick={() => adjustScore("score", 1)} className="w-7 h-7 flex items-center justify-center bg-stone-100 rounded-full text-stone-600 active:bg-stone-200"><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <label className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Penalties</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => adjustScore("penalties", -1, 0)} className="w-7 h-7 flex items-center justify-center bg-red-50 rounded-full text-red-600 active:bg-red-100"><Minus size={14} /></button>
                      <span className="text-xl font-black text-red-600 w-4 text-center">{activeTeamData.penalties}</span>
                      <button type="button" onClick={() => adjustScore("penalties", 1)} className="w-7 h-7 flex items-center justify-center bg-red-50 rounded-full text-red-600 active:bg-red-100"><Plus size={14} /></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {activeData.par !== 3 && renderShotRow("d", "Drives Used", <Navigation size={14} className="text-amber-600" />)}
                  {renderShotRow("a", "Approaches Used", <Crosshair size={14} className="text-green-800" />)}
                  {renderShotRow("p", "Putts Used", <Flag size={14} className="text-yellow-500" />)}
                </div>

              </div>
            </div>

            <button type="submit" disabled={!isReadyToSave || loading} className={`w-full font-bold py-4 rounded-xl transition flex justify-center items-center gap-2 ${isReadyToSave ? 'bg-green-900 text-white active:bg-green-800' : 'bg-stone-200 text-stone-400'}`}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : saved ? <><CheckCircle size={20} className="text-amber-400" /> Saved!</> : isReadyToSave ? `Save ${roundType}-Hole Match` : `Enter all ${roundType} scores to save`}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}