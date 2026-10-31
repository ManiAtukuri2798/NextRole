'use client';

import React from 'react';
import { 
  Compass, 
  Mic, 
  Database, 
  RotateCcw, 
  Sparkles, 
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface HeaderProps {
  onOpenWisprModal: () => void;
  onLoadDemo: () => void;
  onReset: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
}

export default function Header({
  onOpenWisprModal,
  onLoadDemo,
  onReset,
  isSaving,
  hasUnsavedChanges,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                  NextRole
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Product Space × Wispr Flow Hackathon
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Voice-First Career Pivot Coach
              </p>
            </div>
          </div>

          {/* Center / Right Badges & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Honest Wispr Dictation Guide Button (No Fake Connection Ping) */}
            <button
              onClick={onOpenWisprModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 transition-all shadow-2xs"
              title="Click to view honest instructions for dictating via Wispr Flow desktop app"
            >
              <Mic className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Dictation Guide</span>
              <HelpCircle className="w-3 h-3 text-slate-400 hidden xs:inline" />
            </button>

            {/* Storage status pill */}
            <div 
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
              title="Data is saved automatically in browser localStorage. Migration to Supabase scheduled for Milestone 2."
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Storage: Browser (Local)</span>
              {hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes pending" />
              )}
              {isSaving && (
                <span className="text-[10px] text-indigo-600 font-semibold animate-pulse">Saving...</span>
              )}
            </div>

            {/* Demo & Reset Buttons */}
            <button
              onClick={onLoadDemo}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
              title="Load sample AI Product Manager profile and job description"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Load Demo</span>
            </button>

            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Reset all fields to blank"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
