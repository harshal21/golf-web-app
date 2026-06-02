"use client";

import Link from "next/link";
import { Users, User, ArrowRight } from "lucide-react";

export default function SessionsHubPage() {
  return (
    <div className="min-h-screen bg-stone-50 p-4 pt-8 animate-in fade-in duration-500 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-black text-stone-800 mb-2">Log a Round</h1>
        <p className="text-stone-500 mb-8">What type of session are we tracking today?</p>

        <div className="space-y-4">
          {/* Scramble Button */}
          <Link href="/sessions/scramble" className="block bg-white p-6 rounded-3xl shadow-sm border border-stone-200 hover:border-green-800 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 text-green-800 rounded-full flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-800">2v2 Scramble</h2>
                  <p className="text-sm text-stone-500 font-medium mt-1">Team scores & shot tracking</p>
                </div>
              </div>
              <ArrowRight className="text-stone-300 group-hover:text-green-800 transition-colors" />
            </div>
          </Link>

          {/* Solo Button */}
          <Link href="/sessions/solo" className="block bg-white p-6 rounded-3xl shadow-sm border border-stone-200 hover:border-blue-800 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-800">Solo Round</h2>
                  <p className="text-sm text-stone-500 font-medium mt-1">Individual handicap & stats</p>
                </div>
              </div>
              <ArrowRight className="text-stone-300 group-hover:text-blue-800 transition-colors" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}