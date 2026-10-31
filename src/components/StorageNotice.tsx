'use client';

import React from 'react';
import { Database, ShieldCheck, Lock } from 'lucide-react';

export default function StorageNotice() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white/60 backdrop-blur-xs py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Database className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-semibold text-slate-900">
                State Architecture: Browser-Local Persistence (localStorage)
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              All candidate profiles, target job descriptions, grounded skill gap analyses, weekly study plans, interview practice sessions, and application trackers are stored directly in your browser. Data remains private and local to this machine. AI evaluations run through server-side Gemini routes without exposing API keys to the browser.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero client-side API keys</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-700">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Private local storage</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>NextRole • Voice-First Career Pivot Coach • Product Space × Wispr Flow Hackathon</span>
          <div className="flex items-center gap-4">
            <span>Next.js 16 • React 19 • Tailwind CSS • Google Gemini AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
