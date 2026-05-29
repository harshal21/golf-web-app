"use client";

import { UserCircle, Activity } from "lucide-react";

export default function PlayersPage() {
  const players = [
    { name: "Harshal", role: "Iron Specialist", rounds: 42, active: true },
    { name: "Dyshant", role: "Scramble Captain", rounds: 38, active: true },
    { name: "Anuj", role: "Putting Guru", rounds: 35, active: true },
    { name: "Michael", role: "Long Drive", rounds: 31, active: true },
  ];

  return (
    <div className="p-4 pt-6 animate-in fade-in duration-500 pb-24">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">The Roster</h1>

      <div className="grid grid-cols-2 gap-4">
        {players.map((player) => (
          <button 
            key={player.name}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <UserCircle size={32} className="text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">{player.name}</h3>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-emerald-600 mb-3 bg-emerald-50 px-2 py-1 rounded-full">
              {player.role}
            </p>
            
            <div className="w-full flex justify-between items-center pt-3 border-t border-gray-100 mt-auto">
              <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                <Activity size={12} />
                <span>{player.rounds} rds</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${player.active ? 'bg-emerald-400' : 'bg-gray-300'}`} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}