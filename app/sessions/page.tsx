"use client";

import { useState } from "react";
import { Calendar, MapPin, Hash, CheckCircle } from "lucide-react";

export default function SessionsPage() {
  const [type, setType] = useState<"scramble" | "solo">("scramble");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Later, this will connect to a database to actually save the data
    setSaved(true);
    setTimeout(() => setSaved(false), 3000); // Reset the success state after 3 seconds
  };

  return (
    <div className="p-4 pt-6 animate-in fade-in duration-500 pb-24">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Log a Session</h1>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Round Type Toggle */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Round Type</label>
          <div className="bg-gray-100 p-1 rounded-xl flex">
            <button
              type="button"
              onClick={() => setType("scramble")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                type === "scramble" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              2v2 Scramble
            </button>
            <button
              type="button"
              onClick={() => setType("solo")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                type === "solo" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              Solo
            </button>
          </div>
        </div>

        {/* General Info */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <MapPin size={16} className="text-emerald-500" />
              Course Name
            </label>
            <input
              type="text"
              placeholder="e.g., Pebble Beach"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Calendar size={16} className="text-emerald-500" />
                Date
              </label>
              <input
                type="date"
                className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Hash size={16} className="text-emerald-500" />
                Score
              </label>
              <input
                type="number"
                placeholder="e.g., 72"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                required
              />
            </div>
          </div>
        </div>

        {/* Dynamic Section based on Scramble vs Solo */}
        {type === "scramble" ? (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Winning Team</label>
            <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition">
              <option value="">Select winner...</option>
              <option value="team1">Dyshant & Harshal</option>
              <option value="team2">Anuj & Michael</option>
              <option value="tie">Tie / Push</option>
            </select>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Key Metrics</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-500">Putts</span>
                <input type="number" placeholder="32" className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500">Fairways Hit</span>
                <input type="number" placeholder="8" className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl active:bg-slate-800 transition flex justify-center items-center gap-2 shadow-md shadow-slate-900/20"
        >
          {saved ? (
            <>
              <CheckCircle size={20} className="text-emerald-400" />
              Saved Successfully!
            </>
          ) : (
            "Save Session"
          )}
        </button>
      </form>
    </div>
  );
}