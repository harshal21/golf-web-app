"use client";

import { Trophy, Medal } from "lucide-react";

export default function RankingsPage() {
  return (
    <div className="p-4 pt-6 animate-in fade-in duration-500 pb-24">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Leaderboards</h1>

      <div className="space-y-6">
        {/* Scramble Team Rankings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center gap-2">
            <Trophy size={20} className="text-emerald-600" />
            <h2 className="font-bold text-emerald-900">2v2 Scramble Teams</h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Rank 1 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-sm">1</div>
                <div>
                  <p className="font-bold text-slate-800">Kush & You</p>
                  <p className="text-xs text-slate-500 font-medium">12 Wins • 68.4 Avg</p>
                </div>
              </div>
              <span className="text-sm font-black text-emerald-600">62% Win</span>
            </div>

            {/* Rank 2 */}
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-slate-200 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center font-black shadow-inner">2</div>
                <div>
                  <p className="font-bold text-slate-800">TJ & Tarang</p>
                  <p className="text-xs text-slate-500 font-medium">9 Wins • 70.1 Avg</p>
                </div>
              </div>
              <span className="text-sm font-black text-slate-400">38% Win</span>
            </div>
          </div>
        </div>

        {/* Solo Handicap Rankings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center gap-2">
            <Medal size={20} className="text-blue-600" />
            <h2 className="font-bold text-blue-900">Solo Handicaps</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {[
              { name: "Dyshant", hdcp: "8.4", trend: "-0.2" },
              { name: "Harshal", hdcp: "14.2", trend: "-1.5" },
              { name: "Anuj", hdcp: "16.1", trend: "+0.4" },
              { name: "Michael", hdcp: "18.5", trend: "-0.1" },
            ].map((player, index) => (
              <div key={player.name} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-bold w-4">{index + 1}</span>
                  <p className="font-semibold text-slate-800">{player.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${player.trend.startsWith('-') ? 'text-emerald-500' : 'text-red-400'}`}>
                    {player.trend}
                  </span>
                  <span className="font-black text-slate-800 w-12 text-right">{player.hdcp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}