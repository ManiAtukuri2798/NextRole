'use client';

import React from 'react';
import { Mic, X, CheckCircle2, Keyboard, ExternalLink, Sparkles } from 'lucide-react';

interface WisprFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WisprFlowModal({ isOpen, onClose }: WisprFlowModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wispr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Mic className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="wispr-modal-title" className="text-xl font-semibold">
                  How NextRole Works With Wispr Flow
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  Voice-First
                </span>
              </div>
              <p className="text-sm text-indigo-200 mt-1">
                Transparent explanation of our dictation integration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-sm leading-relaxed">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4">
            <h4 className="font-semibold text-indigo-950 flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              The Desktop Dictation Workflow
            </h4>
            <p className="text-slate-600">
              <strong>Wispr Flow</strong> operates as an OS-level desktop companion app (on macOS and Windows). When you press your configured Wispr Flow hotkey, it records your voice, streams speech recognition, and automatically types the transcribed text directly into whatever text field currently has cursor focus.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 text-base">
              How NextRole Optimizes for Wispr Flow:
            </h4>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900 text-xs uppercase tracking-wider">
                    High-Visibility Focus Rings
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Glowing indigo rings clearly highlight which field is actively targeted for voice injection.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900 text-xs uppercase tracking-wider">
                    Generous Textarea Ergonomics
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Relaxed line height (leading-relaxed) and auto-fitting heights prevent jerky jumping while speaking long passages.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900 text-xs uppercase tracking-wider">
                    Spoken Prompt Templates
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Contextual hints coach you on what to say aloud (e.g. your transition story, past responsibilities).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900 text-xs uppercase tracking-wider">
                    Post-Dictation Helpers
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    One-click bullet insertion, whitespace trimming, and fast clear actions for rapid editing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-slate-500" />
              Quick Steps to Use Wispr Flow Here:
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
              <li>Launch the <strong>Wispr Flow desktop app</strong> on your computer.</li>
              <li>Click into any text field in NextRole (e.g. <em>Résumé Text</em> or <em>Pivot Motivation</em>).</li>
              <li>Press and hold your Wispr Flow hotkey (or tap to dictate).</li>
              <li>Speak naturally—Wispr Flow types your formatted thoughts instantly into NextRole.</li>
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
            <strong>Honest Integration Note:</strong> NextRole does not pretend to have a closed proprietary API integration with Wispr. Instead, it fully embraces Wispr Flow’s native desktop architecture, making all inputs maximally accessible and responsive to system-level dictation streaming.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <a
            href="https://wisprflow.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
          >
            Learn more about Wispr Flow <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Got it, Let&apos;s Dictate
          </button>
        </div>
      </div>
    </div>
  );
}
