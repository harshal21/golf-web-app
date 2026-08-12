"use client";

import { useState, useEffect } from "react";
import { UserCircle, Activity, Loader2, Navigation, Crosshair, Target, Flag, PieChart, TrendingUp, ChevronDown, ListOrdered, Users, Trophy, MapPin, Calendar } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface PlayerStats { drives: number; approaches: number; chips?: number; putts: number; }
interface ScrambleMatrixRow { hole: number; penalties?: number; d: string[]; a: string[]; c?: string[]; p: string[]; }
interface SoloHoleData { hole: number; par: number; score: number; penalties: number; fairway: "Hit" | "Left" | "Right" | "N/A" | "Short" | "Long"; gir: boolean; girMiss: "Left" | "Short" | "Long" | "Right" | null; chips: number; bunker: number; putts: number; }
interface SessionRecord { round_date: string; course_name?: string; winning_team: string; loser_team?: string; score: number; loser_score: number; shot_contributions: Record<string, PlayerStats> & { matrix?: ScrambleMatrixRow[]; }; }
interface SoloRoundRecord { player_name: string; course_name: string; total_score: number; hole_data: SoloHoleData[]; }

export default function AnalyticsPage() {
  const [view, setView] = useState<"scramble" | "solo">("scramble");
  const [soloSubView, setSoloSubView] = useState<"overview" | "scratch">("overview");
  const [scrambleSubView, setScrambleSubView] = useState<"recap" | "synergy">("recap");
  
  const [selectedTeamRound, setSelectedTeamRound] = useState<string>("Overall");
  
  const [loading, setLoading] = useState(true);
  
  const [allSessions, setAllSessions] = useState<SessionRecord[]>([]);
  const [soloRounds, setSoloRounds] = useState<SoloRoundRecord[]>([]);

  const [scrambleTeam, setScrambleTeam] = useState("Dyshant & Harshal");
  const [soloPlayer, setSoloPlayer] = useState("Harshal");
  const [soloCourseFilter, setSoloCourseFilter] = useState("All Courses");

  useEffect(() => {
    async function fetchData() {
      const { data: sessionData } = await supabase.from("sessions").select("*");
      const { data: soloData } = await supabase.from("solo_rounds").select("*");

      if (sessionData) setAllSessions(sessionData as SessionRecord[]);
      if (soloData) setSoloRounds(soloData as SoloRoundRecord[]);
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const teamsMap = new Map<string, string>(); 
  
  const addTeam = (displayStr: string | null | undefined) => {
    if (displayStr && displayStr.includes("&")) {
      const key = displayStr.split("&").map(s => s.trim()).sort().join(" & ");
      if (!teamsMap.has(key)) teamsMap.set(key, displayStr.trim());
    }
  };

  addTeam("Dyshant & Harshal");
  addTeam("Anuj & Michael");

  allSessions.forEach(s => {
    addTeam(s.winning_team);
    addTeam(s.loser_team);
    if (s.shot_contributions) {
      const keys = Object.keys(s.shot_contributions).filter(k => k !== 'matrix' && k !== 'penalties');
      if (keys.length >= 2) addTeam(keys.join(" & "));
    }
  });
  
  const uniqueTeams = Array.from(teamsMap.values());
  const uniqueSoloPlayers = Array.from(new Set(soloRounds.map(r => r.player_name)));
  if (uniqueSoloPlayers.length === 0) uniqueSoloPlayers.push("Harshal");

  const activeTeamSelection = uniqueTeams.includes(scrambleTeam) ? scrambleTeam : uniqueTeams[0];
  const activeSoloSelection = uniqueSoloPlayers.includes(soloPlayer) ? soloPlayer : uniqueSoloPlayers[0];

  const teamPlayers = activeTeamSelection.split("&").map(p => p.trim());
  const p1Name = teamPlayers[0] || "";
  const p2Name = teamPlayers[1] || "";

  const activeTeamKey = activeTeamSelection.split("&").map(x=>x.trim()).sort().join(" & ");
  const sortedAllSessions = [...allSessions].sort((a, b) => new Date(a.round_date || 0).getTime() - new Date(b.round_date || 0).getTime());

  const activeTeamMatches: { id: string, label: string }[] = [];
  const seenMatchIds = new Set<string>();

  sortedAllSessions.forEach(session => {
    const matchId = `${session.round_date || 'date'}_${session.course_name || 'course'}_${session.winning_team || 'tie'}`;
    const winTeamKey = session.winning_team && session.winning_team.includes("&") ? session.winning_team.split("&").map(x=>x.trim()).sort().join(" & ") : null;
    const loseTeamKey = session.loser_team && session.loser_team.includes("&") ? session.loser_team.split("&").map(x=>x.trim()).sort().join(" & ") : null;
    const hasStats = session.shot_contributions && session.shot_contributions[p1Name] && session.shot_contributions[p2Name];

    if (winTeamKey === activeTeamKey || loseTeamKey === activeTeamKey || hasStats) {
        if (!seenMatchIds.has(matchId)) {
            seenMatchIds.add(matchId);
            const dateLabel = session.round_date ? new Date(session.round_date + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Unknown Date";
            activeTeamMatches.push({
                id: matchId,
                label: `${dateLabel} - ${session.course_name || 'Unknown Course'}`
            });
        }
    }
  });

  activeTeamMatches.reverse(); 

  const p1Stats: PlayerStats = { drives: 0, approaches: 0, chips: 0, putts: 0 };
  const p2Stats: PlayerStats = { drives: 0, approaches: 0, chips: 0, putts: 0 };
  let teamWins = 0;
  let teamTies = 0;
  let totalMatchesCount = 0;
  const scores9: number[] = [];
  const scores18: number[] = [];
  
  let activeMatrix: ScrambleMatrixRow[] = [];
  let activeMatrixDate = "";
  let activeMatrixStats: Record<string, PlayerStats> | null = null;
  const processedMatches = new Set<string>();

  sortedAllSessions.forEach(session => {
    const matchId = `${session.round_date || 'date'}_${session.course_name || 'course'}_${session.winning_team || 'tie'}`;
    
    if (selectedTeamRound !== "Overall" && matchId !== selectedTeamRound) return;

    const winTeamKey = session.winning_team && session.winning_team.includes("&") ? session.winning_team.split("&").map(x=>x.trim()).sort().join(" & ") : null;
    const loseTeamKey = session.loser_team && session.loser_team.includes("&") ? session.loser_team.split("&").map(x=>x.trim()).sort().join(" & ") : null;
    const isTie = session.winning_team && session.winning_team.toLowerCase().includes("tie");
    const hasStats = session.shot_contributions && session.shot_contributions[p1Name] && session.shot_contributions[p2Name];

    let isParticipant = false;
    let scoreForThisTeam = 0;

    if (winTeamKey === activeTeamKey) {
        isParticipant = true;
        scoreForThisTeam = session.score;
    } else if (loseTeamKey === activeTeamKey) {
        isParticipant = true;
        scoreForThisTeam = session.loser_score || session.score;
    } else if (hasStats) {
        isParticipant = true;
        scoreForThisTeam = session.score; 
    }

    if (isParticipant) {
        if (!processedMatches.has(matchId)) {
            processedMatches.add(matchId);
            totalMatchesCount++;

            if (winTeamKey === activeTeamKey && !isTie) teamWins++;
            if (isTie) teamTies++;

            let is9 = false;
            if (session.shot_contributions?.matrix && session.shot_contributions.matrix.length > 0) {
              is9 = session.shot_contributions.matrix.length <= 9;
            } else {
              is9 = scoreForThisTeam < 55; 
            }

            if (scoreForThisTeam > 0) {
              if (is9) scores9.push(scoreForThisTeam);
              else scores18.push(scoreForThisTeam);
            }
        }

        if (hasStats) {
            p1Stats.drives += session.shot_contributions[p1Name].drives || 0;
            p1Stats.approaches += session.shot_contributions[p1Name].approaches || 0;
            p1Stats.putts += session.shot_contributions[p1Name].putts || 0;

            p2Stats.drives += session.shot_contributions[p2Name].drives || 0;
            p2Stats.approaches += session.shot_contributions[p2Name].approaches || 0;
            p2Stats.putts += session.shot_contributions[p2Name].putts || 0;

            if (session.shot_contributions.matrix && session.shot_contributions.matrix.length > 0) {
                activeMatrix = session.shot_contributions.matrix;
                activeMatrixDate = session.round_date;
                activeMatrixStats = session.shot_contributions;
            }
        }
    }
  });

  let matrixP1Name = p1Name;
  let matrixP2Name = p2Name;

  if (activeMatrix.length > 0) {
      const p1MatrixDrives = activeMatrix.reduce((acc, r) => acc + (r.d?.filter(x => x === "P1").length || 0), 0);
      const p1MatrixApps = activeMatrix.reduce((acc, r) => acc + (r.a?.filter(x => x === "P1").length || 0), 0);
      const p1MatrixPutts = activeMatrix.reduce((acc, r) => acc + (r.p?.filter(x => x === "P1").length || 0), 0);

      const safeStats = activeMatrixStats as Record<string, PlayerStats> | null;
      const p1StatsRaw = safeStats?.[p1Name];
      const p2StatsRaw = safeStats?.[p2Name];

      const p1Diff = Math.abs(p1MatrixDrives - (p1StatsRaw?.drives || 0)) +
                     Math.abs(p1MatrixApps - (p1StatsRaw?.approaches || 0)) +
                     Math.abs(p1MatrixPutts - (p1StatsRaw?.putts || 0));

      const p2Diff = Math.abs(p1MatrixDrives - (p2StatsRaw?.drives || 0)) +
                     Math.abs(p1MatrixApps - (p2StatsRaw?.approaches || 0)) +
                     Math.abs(p1MatrixPutts - (p2StatsRaw?.putts || 0));

      if (p2Diff < p1Diff) {
          matrixP1Name = p2Name;
          matrixP2Name = p1Name;
      }
  }

  const avg9 = scores9.length > 0 ? Math.round((scores9.reduce((a, b) => a + b, 0) / scores9.length) * 10) / 10 : 0;
  const avg18 = scores18.length > 0 ? Math.round((scores18.reduce((a, b) => a + b, 0) / scores18.length) * 10) / 10 : 0;
  const teamWinRate = totalMatchesCount > 0 ? Math.round((teamWins / totalMatchesCount) * 100) : 0;
  const getPct = (val1: number, val2: number) => { const total = val1 + val2; return total === 0 ? 50 : Math.round((val1 / total) * 100); };

  const statCategories = [
    { id: "drives", label: "Drives", icon: <Navigation size={16} className="text-amber-600" /> },
    { id: "approaches", label: "Approach", icon: <Crosshair size={16} className="text-green-800" /> },
    { id: "putts", label: "Putting", icon: <Flag size={16} className="text-yellow-500" /> },
  ];

  const totalTeamShots = p1Stats.drives + p1Stats.approaches + p1Stats.putts + p2Stats.drives + p2Stats.approaches + p2Stats.putts;
  const isFiltered = selectedTeamRound !== "Overall";

  const allRoundsForPlayer = soloRounds.filter(r => r.player_name === activeSoloSelection);
  const playedCourses = Array.from(new Set(allRoundsForPlayer.map(r => r.course_name)));
  const playerSoloRounds = allRoundsForPlayer.filter(r => soloCourseFilter === "All Courses" || r.course_name === soloCourseFilter);
  
  const soloStats = {
    rounds: playerSoloRounds.length, avg9: 0, avg18: 0, girPct: 0,
    fairways: { hit: 0, left: 0, right: 0, short: 0, total: 0 },
    putts: { one: 0, two: 0, threePlus: 0, total: 0 },
    shortGame: { chips: 0, bunker: 0 },
    scratch: { scrambleOpps: 0, scrambleSaves: 0, sandOpps: 0, sandSaves: 0, girPutts: 0, girCount: 0, p3Score: 0, p3Count: 0, p4Score: 0, p4Count: 0, p5Score: 0, p5Count: 0, cleanScore: 0, cleanCount: 0, penaltyScore: 0, penaltyCount: 0 }
  };

  if (playerSoloRounds.length > 0) {
    let totalScore9 = 0; let count9 = 0;
    let totalScore18 = 0; let count18 = 0;
    let totalGir = 0; let totalHoles = 0; let totalChips = 0; let totalBunker = 0;
    
    playerSoloRounds.forEach(round => {
      const holes = round.hole_data || [];
      const is9 = holes.length <= 9;
      
      if (is9) { totalScore9 += round.total_score; count9++; } 
      else { totalScore18 += round.total_score; count18++; }

      holes.forEach(h => {
        totalHoles++;
        if (h.gir) { totalGir++; soloStats.scratch.girCount++; soloStats.scratch.girPutts += h.putts; }
        else { soloStats.scratch.scrambleOpps++; if (h.score <= h.par && h.score > 0) soloStats.scratch.scrambleSaves++; }
        if (h.par !== 3 && h.fairway !== "N/A") {
          soloStats.fairways.total++;
          if (h.fairway === "Hit") soloStats.fairways.hit++;
          else if (h.fairway === "Left") soloStats.fairways.left++;
          else if (h.fairway === "Right") soloStats.fairways.right++;
          else if (h.fairway === "Short") soloStats.fairways.short++;
        }
        soloStats.putts.total++;
        if (h.putts === 1) soloStats.putts.one++;
        else if (h.putts === 2) soloStats.putts.two++;
        else if (h.putts >= 3) soloStats.putts.threePlus++;
        totalChips += h.chips; totalBunker += h.bunker;
        if (h.bunker > 0) { soloStats.scratch.sandOpps++; if (h.score <= h.par && h.score > 0) soloStats.scratch.sandSaves++; }
        if (h.par === 3 && h.score > 0) { soloStats.scratch.p3Count++; soloStats.scratch.p3Score += (h.score - h.par); }
        if (h.par === 4 && h.score > 0) { soloStats.scratch.p4Count++; soloStats.scratch.p4Score += (h.score - h.par); }
        if (h.par === 5 && h.score > 0) { soloStats.scratch.p5Count++; soloStats.scratch.p5Score += (h.score - h.par); }
        if (h.penalties === 0 && h.score > 0) { soloStats.scratch.cleanCount++; soloStats.scratch.cleanScore += h.score; }
        else if (h.penalties > 0 && h.score > 0) { soloStats.scratch.penaltyCount++; soloStats.scratch.penaltyScore += h.score; }
      });
    });
    soloStats.avg9 = count9 > 0 ? Math.round((totalScore9 / count9) * 10) / 10 : 0;
    soloStats.avg18 = count18 > 0 ? Math.round((totalScore18 / count18) * 10) / 10 : 0;
    soloStats.girPct = Math.round((totalGir / totalHoles) * 100) || 0;
    soloStats.shortGame.chips = Math.round((totalChips / playerSoloRounds.length) * 10) / 10;
    soloStats.shortGame.bunker = Math.round((totalBunker / playerSoloRounds.length) * 10) / 10;
  }

  const getSoloPct = (value: number, total: number) => total === 0 ? 0 : Math.round((value / total) * 100);
  const scramblingPct = getSoloPct(soloStats.scratch.scrambleSaves, soloStats.scratch.scrambleOpps);
  const sandSavePct = getSoloPct(soloStats.scratch.sandSaves, soloStats.scratch.sandOpps);
  const puttsPerGir = soloStats.scratch.girCount > 0 ? (soloStats.scratch.girPutts / soloStats.scratch.girCount).toFixed(1) : "0.0";
  const avgP3 = soloStats.scratch.p3Count > 0 ? ((soloStats.scratch.p3Score / soloStats.scratch.p3Count) > 0 ? "+" : "") + (soloStats.scratch.p3Score / soloStats.scratch.p3Count).toFixed(1) : "E";
  const avgP4 = soloStats.scratch.p4Count > 0 ? ((soloStats.scratch.p4Score / soloStats.scratch.p4Count) > 0 ? "+" : "") + (soloStats.scratch.p4Score / soloStats.scratch.p4Count).toFixed(1) : "E";
  const avgP5 = soloStats.scratch.p5Count > 0 ? ((soloStats.scratch.p5Score / soloStats.scratch.p5Count) > 0 ? "+" : "") + (soloStats.scratch.p5Score / soloStats.scratch.p5Count).toFixed(1) : "E";

  const renderShotBadges = (players: string | string[]) => {
    if (!players || players.length === 0 || players === "-") return <span className="text-stone-300 font-black">-</span>;
    const playerArray = Array.isArray(players) ? players : [players];
    return (
      <div className="flex flex-wrap items-center justify-center gap-1 min-h-[24px]">
        {playerArray.map((p, index) => {
          const actualName = p === "P1" ? matrixP1Name : matrixP2Name;
          const isFirstPlayer = actualName === p1Name;

          return (
            <div key={index} className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shadow-sm ${isFirstPlayer ? "bg-amber-600 text-white" : "bg-green-800 text-white"}`}>
              {actualName.charAt(0)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 p-4 pt-6 animate-in fade-in duration-500 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Performance Analytics</h1>

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
          
          {/* TOUCH-FRIENDLY TEAM SELECTOR */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between relative overflow-hidden focus-within:ring-2 focus-within:ring-stone-200">
            <select 
              value={activeTeamSelection} 
              onChange={(e) => {
                setScrambleTeam(e.target.value);
                setSelectedTeamRound("Overall");
              }} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            >
              {uniqueTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            <div className="flex items-center gap-3 pointer-events-none">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center"><Users size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Viewing Team Stats</p>
                <p className="font-black text-lg text-stone-800">{activeTeamSelection}</p>
              </div>
            </div>
            <ChevronDown size={20} className="text-stone-300 pointer-events-none" />
          </div>

          {totalMatchesCount === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center text-stone-500">
              No scramble sessions logged for this team yet.
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setScrambleSubView("recap")} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all border ${scrambleSubView === "recap" ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-500 border-stone-200"}`}>Match Recap</button>
                <button onClick={() => setScrambleSubView("synergy")} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all border ${scrambleSubView === "synergy" ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-500 border-stone-200"}`}>Team Synergy</button>
              </div>

              {scrambleSubView === "recap" ? (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* TOUCH-FRIENDLY TIMEFRAME SELECTOR */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-stone-100 relative focus-within:ring-2 focus-within:ring-stone-200">
                    <select
                      value={selectedTeamRound}
                      onChange={(e) => setSelectedTeamRound(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                      <option value="Overall">Overall (All Matches)</option>
                      {activeTeamMatches.map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2 text-stone-500 pointer-events-none">
                      <Calendar size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Timeframe</span>
                    </div>
                    <div className="flex items-center gap-1 pointer-events-none">
                      <span className="font-bold text-sm text-stone-800 text-right max-w-[180px] text-ellipsis overflow-hidden whitespace-nowrap">
                        {selectedTeamRound === "Overall" ? "Overall (All Matches)" : activeTeamMatches.find(m => m.id === selectedTeamRound)?.label}
                      </span>
                      <ChevronDown size={14} className="text-stone-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-stone-900 text-white p-4 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 opacity-10"><Activity size={80} /></div>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Avg Score</p>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-3xl font-black text-amber-500">{avg9 > 0 ? avg9 : "-"}</p>
                          <p className="text-[9px] font-bold text-stone-500 mt-1 uppercase">9 Holes</p>
                        </div>
                        <div className="w-px h-8 bg-stone-700"></div>
                        <div>
                          <p className="text-3xl font-black text-amber-500">{avg18 > 0 ? avg18 : "-"}</p>
                          <p className="text-[9px] font-bold text-stone-500 mt-1 uppercase">18 Holes</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 opacity-5"><Trophy size={80} className="text-green-800" /></div>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Trophy size={12}/> {isFiltered ? "Match Result" : "Win Rate"}
                      </p>
                      {isFiltered ? (
                        <p className={`text-2xl font-black ${teamWins > 0 ? 'text-green-600' : teamTies > 0 ? 'text-stone-500' : 'text-red-500'}`}>
                          {teamWins > 0 ? "WIN" : teamTies > 0 ? "TIE" : "LOSS"}
                        </p>
                      ) : (
                        <p className="text-3xl font-black text-stone-800">{teamWinRate}%</p>
                      )}
                      <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase">
                        {isFiltered ? "Head-to-Head" : `${teamWins} WINS | ${teamTies} TIES | ${totalMatchesCount} PLAYED`}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                    <h2 className="font-bold text-stone-800 mb-5 flex items-center gap-2"><Activity size={18} className="text-green-800" /> Overall Shot Split</h2>
                    
                    {totalTeamShots === 0 ? (
                      <div className="py-6 text-center bg-stone-50 rounded-xl border border-stone-100">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">No Shot Data Logged</p>
                        <p className="text-[10px] text-stone-400 mt-1 px-4">This team has a total score recorded, but individual shots were not tracked for this selection.</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4 px-8">
                          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-600 rounded-full"></div><span className="text-xs font-bold text-stone-600">{p1Name}</span></div>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-800 rounded-full"></div><span className="text-xs font-bold text-stone-600">{p2Name}</span></div>
                        </div>
                        <div className="space-y-6">
                          {statCategories.map((cat) => {
                            const p1Val = p1Stats[cat.id as keyof PlayerStats] || 0;
                            const p2Val = p2Stats[cat.id as keyof PlayerStats] || 0;
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
                      </>
                    )}
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                    <h2 className="font-bold text-stone-800 mb-2 flex items-center gap-2">
                      <ListOrdered size={18} className="text-stone-500" /> 
                      {isFiltered ? "Round Matrix" : "Latest Match Matrix"}
                    </h2>
                    
                    {totalTeamShots === 0 ? (
                       <div className="py-8 text-center text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                         No hole-by-hole data available
                       </div>
                    ) : (
                      <>
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-4">From {new Date(activeMatrixDate || "").toLocaleDateString()}</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-center">
                            <thead>
                              <tr className="border-b border-stone-100">
                                <th className="py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest text-left">Hole</th>
                                <th className="py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">Drive</th>
                                <th className="py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">App</th>
                                <th className="py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">Putt</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                              {activeMatrix.map((row) => {
                                const isEmpty = (!row.d || row.d.length === 0) && (!row.a || row.a.length === 0) && (!row.p || row.p.length === 0);
                                return (
                                  <tr key={row.hole} className="hover:bg-stone-50 transition">
                                    <td className="py-2.5 text-xs font-black text-stone-800 text-left w-8">{row.hole}</td>
                                    {isEmpty ? (
                                      <td colSpan={3} className="py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">No data logged</td>
                                    ) : (
                                      <>
                                        <td className="py-2.5 w-14">{renderShotBadges(row.d)}</td>
                                        <td className="py-2.5 w-16">{renderShotBadges(row.a)}</td>
                                        <td className="py-2.5 w-20">{renderShotBadges(row.p)}</td>
                                      </>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center text-stone-500 animate-in fade-in">
                  Team Synergy logic coming next!
                </div>
              )}
            </>
          )}
        </div>

      ) : (

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 space-y-4">
            
            {/* TOUCH-FRIENDLY SOLO PLAYER SELECTOR */}
            <div className="flex items-center justify-between relative focus-within:ring-2 focus-within:ring-stone-200 rounded-xl">
              <select 
                value={activeSoloSelection} 
                onChange={(e) => {
                  setSoloPlayer(e.target.value);
                  setSoloCourseFilter("All Courses"); 
                }} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              >
                {uniqueSoloPlayers.map((player) => (
                  <option key={player} value={player}>{player}</option>
                ))}
              </select>
              <div className="flex items-center gap-3 pointer-events-none">
                <div className="w-10 h-10 bg-green-50 text-green-800 rounded-full flex items-center justify-center"><UserCircle size={20} /></div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Viewing Stats For</p>
                  <p className="font-black text-lg text-stone-800">{activeSoloSelection}</p>
                </div>
              </div>
              <ChevronDown size={20} className="text-stone-300 pointer-events-none" />
            </div>

            {/* TOUCH-FRIENDLY COURSE SELECTOR */}
            <div className="border-t border-stone-100 pt-4 flex items-center justify-between relative focus-within:ring-2 focus-within:ring-stone-200 rounded-xl">
              <select 
                value={soloCourseFilter} 
                onChange={(e) => setSoloCourseFilter(e.target.value)} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              >
                <option value="All Courses">All Courses</option>
                {playedCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
              <div className="flex items-center gap-3 pointer-events-none">
                <div className="w-10 h-10 bg-stone-50 text-stone-500 rounded-full flex items-center justify-center"><MapPin size={20} /></div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Course Filter</p>
                  <p className="font-bold text-sm text-stone-600">{soloCourseFilter}</p>
                </div>
              </div>
              <ChevronDown size={20} className="text-stone-300 pointer-events-none" />
            </div>
            
          </div>

          {soloStats.rounds === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center text-stone-500">
              No solo rounds match this filter for {activeSoloSelection}.
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setSoloSubView("overview")} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all border ${soloSubView === "overview" ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-500 border-stone-200"}`}>Overview</button>
                <button onClick={() => setSoloSubView("scratch")} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all border flex items-center gap-1 ${soloSubView === "scratch" ? "bg-green-800 text-white border-green-800" : "bg-white text-stone-500 border-stone-200"}`}><Target size={12}/> Scratch Stats</button>
              </div>

              {soloSubView === "overview" ? (
                <div className="space-y-6 animate-in fade-in">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-800 text-white p-4 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 opacity-10"><Activity size={80} /></div>
                      <p className="text-xs font-bold text-green-200 uppercase tracking-wider mb-2">Avg Score</p>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-3xl font-black">{soloStats.avg9 > 0 ? soloStats.avg9 : "-"}</p>
                          <p className="text-[9px] font-bold text-green-400 mt-1 uppercase">9 Holes</p>
                        </div>
                        <div className="w-px h-8 bg-green-700"></div>
                        <div>
                          <p className="text-3xl font-black">{soloStats.avg18 > 0 ? soloStats.avg18 : "-"}</p>
                          <p className="text-[9px] font-bold text-green-400 mt-1 uppercase">18 Holes</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center">
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Target size={12}/> GIR %</p>
                      <p className="text-3xl font-black text-stone-800">{soloStats.girPct}%</p>
                      <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase">Over {soloStats.rounds} Rounds</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                    <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                      <Navigation size={18} className="text-amber-600" /> Driving Accuracy
                    </h2>
                    
                    <div className="h-4 w-full bg-stone-100 rounded-full overflow-hidden flex mb-4">
                      <div className="h-full bg-red-400 transition-all duration-1000" style={{ width: `${getSoloPct(soloStats.fairways.left, soloStats.fairways.total)}%` }} />
                      <div className="h-full bg-orange-400 transition-all duration-1000" style={{ width: `${getSoloPct(soloStats.fairways.short, soloStats.fairways.total)}%` }} />
                      <div className="h-full bg-green-600 transition-all duration-1000" style={{ width: `${getSoloPct(soloStats.fairways.hit, soloStats.fairways.total)}%` }} />
                      <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${getSoloPct(soloStats.fairways.right, soloStats.fairways.total)}%` }} />
                    </div>
                    
                    <div className="flex justify-between text-center px-1 mt-1">
                      <div><p className="text-xl font-black text-red-500">{getSoloPct(soloStats.fairways.left, soloStats.fairways.total)}%</p><p className="text-[10px] font-bold text-red-400 uppercase">Left</p></div>
                      <div><p className="text-xl font-black text-orange-500">{getSoloPct(soloStats.fairways.short, soloStats.fairways.total)}%</p><p className="text-[10px] font-bold text-orange-400 uppercase">Short</p></div>
                      <div><p className="text-xl font-black text-green-600">{getSoloPct(soloStats.fairways.hit, soloStats.fairways.total)}%</p><p className="text-[10px] font-bold text-green-600/70 uppercase">Fairway</p></div>
                      <div><p className="text-xl font-black text-amber-500">{getSoloPct(soloStats.fairways.right, soloStats.fairways.total)}%</p><p className="text-[10px] font-bold text-amber-400 uppercase">Right</p></div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                    <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><Flag size={18} className="text-yellow-500" /> Putting Breakdown</h2>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-stone-50 border border-stone-100 p-3 rounded-xl text-center"><p className="text-2xl font-black text-stone-800">{getSoloPct(soloStats.putts.one, soloStats.putts.total)}%</p><p className="text-[10px] font-bold text-stone-500 uppercase mt-1">1 Putt</p></div>
                      <div className="bg-green-50 border border-green-100 p-3 rounded-xl text-center"><p className="text-2xl font-black text-green-800">{getSoloPct(soloStats.putts.two, soloStats.putts.total)}%</p><p className="text-[10px] font-bold text-green-800/70 uppercase mt-1">2 Putts</p></div>
                      <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-center"><p className="text-2xl font-black text-red-600">{getSoloPct(soloStats.putts.threePlus, soloStats.putts.total)}%</p><p className="text-[10px] font-bold text-red-400 uppercase mt-1">3+ Putts</p></div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                    <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                      <TrendingUp size={18} className="text-stone-500" /> Scrambling Averages
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-4 border-r border-stone-100 pr-4">
                        <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500"><Target size={18} /></div>
                        <div><p className="text-[10px] font-bold text-stone-400 uppercase">Chips / Round</p><p className="text-2xl font-black text-stone-800">{soloStats.shortGame.chips}</p></div>
                      </div>
                      <div className="flex items-center gap-4 pl-2">
                        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600"><PieChart size={18} /></div>
                        <div><p className="text-[10px] font-bold text-stone-400 uppercase">Sand / Round</p><p className="text-2xl font-black text-stone-800">{soloStats.shortGame.bunker}</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={12} className="text-green-600" /> Scrambling %</p>
                      <p className="text-3xl font-black text-stone-800">{scramblingPct}%</p>
                      <p className="text-xs text-stone-500 font-medium mt-1">Par saves on missed GIR</p>
                    </div>
                    <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1"><PieChart size={12} className="text-amber-500" /> Sand Saves</p>
                      <p className="text-3xl font-black text-stone-800">{sandSavePct}%</p>
                      <p className="text-xs text-stone-500 font-medium mt-1">Up & down from bunker</p>
                    </div>
                  </div>

                  <div className="bg-stone-900 text-white border border-stone-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Flag size={12} className="text-amber-400" /> Putts per GIR</p>
                      <p className="text-xs text-stone-400 font-medium w-48">True putting performance (excludes off-green chips)</p>
                    </div>
                    <p className="text-4xl font-black text-green-400">{puttsPerGir}</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
                    <h2 className="font-bold text-stone-800 mb-4 text-sm uppercase tracking-wider text-center">Scoring Averages</h2>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-stone-50 p-3 rounded-xl text-center border border-stone-100">
                        <p className="text-[10px] font-bold text-stone-400 uppercase">Par 3s</p>
                        <p className={`text-xl font-black mt-1 ${avgP3.includes('+') ? 'text-red-500' : avgP3.includes('-') ? 'text-blue-500' : 'text-stone-800'}`}>{avgP3}</p>
                      </div>
                      <div className="bg-stone-50 p-3 rounded-xl text-center border border-stone-100">
                        <p className="text-[10px] font-bold text-stone-400 uppercase">Par 4s</p>
                        <p className={`text-xl font-black mt-1 ${avgP4.includes('+') ? 'text-red-500' : avgP4.includes('-') ? 'text-blue-500' : 'text-stone-800'}`}>{avgP4}</p>
                      </div>
                      <div className="bg-stone-50 p-3 rounded-xl text-center border border-stone-100">
                        <p className="text-[10px] font-bold text-stone-400 uppercase">Par 5s</p>
                        <p className={`text-xl font-black mt-1 ${avgP5.includes('+') ? 'text-red-500' : avgP5.includes('-') ? 'text-blue-500' : 'text-stone-800'}`}>{avgP5}</p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}