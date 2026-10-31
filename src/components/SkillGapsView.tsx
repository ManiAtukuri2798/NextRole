'use client';

import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  Sparkles, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Briefcase,
  User,
  Key,
  ExternalLink,
  RefreshCw,
  Quote,
  Target,
  FileText,
  HelpCircle,
  Zap,
  Check,
  Filter,
  PlusCircle,
  RotateCcw,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { UserProfile, JobDescription, SkillGapAnalysisResult, SkillStatus } from '@/types';
import { 
  getStoredSkillGapAnalysis, 
  saveStoredSkillGapAnalysis, 
  clearStoredSkillGapAnalysis,
  computeInputSignature 
} from '@/lib/storage';

interface SkillGapsViewProps {
  profile: UserProfile;
  activeJob?: JobDescription;
  onNavigateToTab: (tab: 'profile' | 'job-intake' | 'learning-plan') => void;
}

export default function SkillGapsView({
  profile,
  activeJob,
  onNavigateToTab,
}: SkillGapsViewProps) {
  const [analysis, setAnalysis] = useState<SkillGapAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedKeyEnv, setCopiedKeyEnv] = useState(false);

  // User clarification input state
  const [editingClarificationId, setEditingClarificationId] = useState<string | null>(null);
  const [clarificationText, setClarificationText] = useState<string>('');

  // Check cache invalidation
  const currentSignature = computeInputSignature(profile, activeJob);
  const hasInputChanged = Boolean(
    analysis && 
    analysis.inputSignature && 
    analysis.inputSignature !== currentSignature
  );

  // Load cached analysis on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const cached = getStoredSkillGapAnalysis();
      if (cached) {
        setAnalysis(cached);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleConfirmLackOfSkill = (compIndex: number) => {
    if (!analysis) return;
    const updated = { ...analysis };
    const comps = [...updated.competencies];
    const targetComp = { ...comps[compIndex] };
    
    targetComp.status = 'confirmed_gap';
    targetComp.isUserModified = true;
    targetComp.userClarification = {
      type: 'confirmed_gap',
      note: 'Candidate explicitly confirmed this is a core skill gap they need to learn during the transition.',
      updatedAt: new Date().toISOString(),
    };
    comps[compIndex] = targetComp;
    updated.competencies = comps;

    setAnalysis(updated);
    saveStoredSkillGapAnalysis(updated);
  };

  const handleSaveEvidenceClarification = (compIndex: number) => {
    if (!analysis || !clarificationText.trim()) return;
    const updated = { ...analysis };
    const comps = [...updated.competencies];
    const targetComp = { ...comps[compIndex] };

    targetComp.status = 'matched_strength';
    targetComp.isUserModified = true;
    targetComp.resumeEvidence = `Candidate Clarification: "${clarificationText.trim()}"`;
    targetComp.userClarification = {
      type: 'added_evidence',
      note: clarificationText.trim(),
      updatedAt: new Date().toISOString(),
    };
    comps[compIndex] = targetComp;
    updated.competencies = comps;

    setAnalysis(updated);
    saveStoredSkillGapAnalysis(updated);
    setEditingClarificationId(null);
    setClarificationText('');
  };

  const handleResetClarification = (compIndex: number) => {
    if (!analysis) return;
    const updated = { ...analysis };
    const comps = [...updated.competencies];
    const targetComp = { ...comps[compIndex] };

    delete targetComp.userClarification;
    targetComp.isUserModified = false;
    // Default back to missing_evidence if absent in resume
    if (targetComp.resumeEvidence.toLowerCase().includes('no mention')) {
      targetComp.status = 'missing_evidence';
    } else {
      targetComp.status = 'matched_strength';
    }
    comps[compIndex] = targetComp;
    updated.competencies = comps;

    setAnalysis(updated);
    saveStoredSkillGapAnalysis(updated);
    if (editingClarificationId === targetComp.id) {
      setEditingClarificationId(null);
      setClarificationText('');
    }
  };

  const hasProfile = Boolean(profile.targetRole && profile.resumeText.trim().length >= 40);
  const hasJob = Boolean(activeJob && activeJob.rawText.trim().length >= 50);
  const canAnalyze = hasProfile && hasJob;

  const handleRunAnalysis = async () => {
    if (!canAnalyze) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const res = await fetch('/api/analyze-skill-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: profile.targetRole,
          currentRole: profile.currentRole,
          yearsOfExperience: profile.yearsOfExperience,
          candidateSkills: profile.skills,
          pivotMotivation: profile.pivotMotivation,
          resumeText: profile.resumeText,
          jobTitle: activeJob?.title,
          jobCompany: activeJob?.company,
          jobText: activeJob?.rawText,
        }),
      });

      const data = await res.json();

      if (!data.configured) {
        setIsConfigured(false);
        setApiError(data.error);
        setIsLoading(false);
        return;
      }

      if (!res.ok || data.error) {
        setApiError(data.error || 'Server returned an error analyzing skills.');
        setIsLoading(false);
        return;
      }

      setIsConfigured(true);
      setAnalysis(data.analysis);
      saveStoredSkillGapAnalysis(data.analysis);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setApiError(`Failed to reach the analysis API: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAnalysis = () => {
    clearStoredSkillGapAnalysis();
    setAnalysis(null);
  };

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText('GEMINI_API_KEY=your_gemini_api_key_here\nGEMINI_MODEL=gemini-3.5-flash-lite');
    setCopiedKeyEnv(true);
    setTimeout(() => setCopiedKeyEnv(false), 2000);
  };

  // Filter competencies
  const filteredCompetencies = analysis?.competencies.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  }) || [];

  const counts = {
    all: analysis?.competencies.length || 0,
    confirmed_gap: analysis?.competencies.filter((c) => c.status === 'confirmed_gap').length || 0,
    missing_evidence: analysis?.competencies.filter((c) => c.status === 'missing_evidence').length || 0,
    matched_strength: analysis?.competencies.filter((c) => c.status === 'matched_strength').length || 0,
    transferable_strength: analysis?.competencies.filter((c) => c.status === 'transferable_strength').length || 0,
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 rounded-2xl p-6 text-white shadow-md border border-indigo-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <GitCompare className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                Grounded Skill Gap Analysis
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Gemini AI Engine
              </span>
            </div>
            <p className="text-sm text-indigo-200">
              Evaluates your résumé against your target job description, citing exact employer quotes and distinguishing confirmed gaps from missing evidence.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {analysis && (
              <button
                type="button"
                onClick={handleClearAnalysis}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Clear Results
              </button>
            )}
            <button
              type="button"
              disabled={isLoading || !canAnalyze}
              onClick={handleRunAnalysis}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/40"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing with Gemini...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{analysis ? 'Re-Analyze Skill Gaps' : 'Run Gemini Skill Analysis'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Inputs Changed Cache Invalidation Warning */}
      {hasInputChanged && (
        <div className="bg-amber-500/10 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-950">
                Inputs Changed Since Last Skill Gap Analysis
              </p>
              <p className="text-[11px] text-amber-800">
                Your target role, résumé, or active job posting was modified. We recommend re-running the analysis to re-align your gaps.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading || !canAnalyze}
            onClick={handleRunAnalysis}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 transition-colors"
          >
            Re-Analyze Gaps
          </button>
        </div>
      )}

      {/* Missing Gemini Configuration Notice */}
      {!isConfigured && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-amber-950 space-y-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-800 border border-amber-300 shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-amber-950">
                Gemini API Key Required on Server
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed">
                To perform real, grounded AI skill-gap evaluations, NextRole calls Google Gemini strictly from server-side code without exposing keys to the browser.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-3 text-xs">
            <h4 className="font-semibold text-slate-900">How to configure in 2 minutes:</h4>
            <ol className="list-decimal list-inside space-y-2 text-slate-700">
              <li>
                Get a free Gemini API key at{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-semibold underline inline-flex items-center gap-0.5"
                >
                  Google AI Studio <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                Open or create your local environment file:{' '}
                <code className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded-md font-mono text-[11px]">
                  .env.local
                </code>{' '}
                in the root directory.
              </li>
              <li>
                Add your variables:
                <div className="flex items-start justify-between bg-slate-900 text-slate-100 p-2.5 rounded-lg mt-1 font-mono text-[11px] sm:text-[12px] leading-relaxed">
                  <div>
                    <div>GEMINI_API_KEY=your_key_here</div>
                    <div className="text-emerald-400">GEMINI_MODEL=gemini-3.5-flash-lite</div>
                  </div>
                  <button
                    type="button"
                    onClick={copyEnvSnippet}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-[11px] text-white flex items-center gap-1 transition-colors shrink-0"
                  >
                    {copiedKeyEnv ? <Check className="w-3 h-3 text-emerald-400" /> : 'Copy'}
                  </button>
                </div>
              </li>
              <li>Restart the dev server (`npm run dev`) so Next.js loads the environment variable.</li>
            </ol>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRunAnalysis}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Test Gemini Connection Again
            </button>
          </div>
        </div>
      )}

      {/* Input Readiness Check If Incomplete */}
      {(!hasProfile || !hasJob) && !analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Card */}
          <div className={`p-5 rounded-2xl border transition-all ${
            hasProfile ? 'bg-white border-emerald-300 shadow-xs' : 'bg-white border-amber-300'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-sm text-slate-900">1. Candidate Profile & Résumé</h3>
              </div>
              {hasProfile ? (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Incomplete
                </span>
              )}
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <p><strong>Target Role:</strong> {profile.targetRole || <span className="text-amber-600 italic">Not set</span>}</p>
              <p><strong>Reported Skills:</strong> {profile.skills.length} skills listed</p>
              <p><strong>Résumé Text:</strong> {profile.resumeText.length > 0 ? `${profile.resumeText.length} characters` : <span className="text-amber-600 italic">No résumé text pasted</span>}</p>
            </div>

            {!hasProfile && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigateToTab('profile')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                >
                  Complete Profile & Résumé in Tab 1 <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Job Description Card */}
          <div className={`p-5 rounded-2xl border transition-all ${
            hasJob ? 'bg-white border-emerald-300 shadow-xs' : 'bg-white border-amber-300'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-sm text-slate-900">2. Target Job Description</h3>
              </div>
              {hasJob ? (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Target Set
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  No Active Target
                </span>
              )}
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <p><strong>Target Role:</strong> {activeJob?.title || <span className="text-amber-600 italic">None selected</span>}</p>
              <p><strong>Company:</strong> {activeJob?.company || 'N/A'}</p>
              <p><strong>Job Text Length:</strong> {activeJob ? `${activeJob.rawText.length} characters` : '0 characters'}</p>
            </div>

            {!hasJob && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigateToTab('job-intake')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                >
                  Add or Select Target Job in Tab 2 <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* General API Error Banner */}
      {apiError && isConfigured && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 animate-in fade-in text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Grounded Results View (When analysis is available) */}
      {analysis && (
        <div className="space-y-6">
          {/* Executive Assessment Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Grounded Assessment
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Pivot to {analysis.jobTitle} ({analysis.jobCompany})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    analysis.readinessLevel.includes('High')
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : analysis.readinessLevel.includes('Moderate')
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-purple-50 text-purple-800 border-purple-300'
                  }`}
                >
                  {analysis.readinessLevel}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              {analysis.overallAssessment}
            </p>

            {/* Superpowers vs Priority Gaps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  Transferable Superpowers (Unfair Advantage)
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {analysis.transferableSuperpowers.map((sp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{sp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <Target className="w-3.5 h-3.5 text-amber-700" />
                  Top Priority Gaps to Bridge First
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {analysis.topPriorityGaps.map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-700 font-bold">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All ({counts.all})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('confirmed_gap')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  statusFilter === 'confirmed_gap'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                }`}
              >
                Confirmed Gaps ({counts.confirmed_gap})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('missing_evidence')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  statusFilter === 'missing_evidence'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                Missing Evidence ({counts.missing_evidence})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('matched_strength')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  statusFilter === 'matched_strength'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                Matched Strengths ({counts.matched_strength})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('transferable_strength')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  statusFilter === 'transferable_strength'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                Transferable ({counts.transferable_strength})
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              {analysis.modelUsed && (
                <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  Model: {analysis.modelUsed}
                </span>
              )}
              <span>Evaluated: {new Date(analysis.analyzedAt).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Competency Cards Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredCompetencies.map((comp, idx) => {
              const statusStyles: Record<
                SkillStatus,
                { badge: string; border: string; bg: string; title: string }
              > = {
                confirmed_gap: {
                  badge: 'bg-red-100 text-red-800 border-red-300',
                  border: 'border-red-200',
                  bg: 'bg-white hover:border-red-300',
                  title: 'Confirmed Lack of Skill',
                },
                missing_evidence: {
                  badge: 'bg-amber-100 text-amber-800 border-amber-300',
                  border: 'border-amber-200',
                  bg: 'bg-white hover:border-amber-300',
                  title: 'Missing Evidence (Absent in Résumé)',
                },
                matched_strength: {
                  badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                  border: 'border-emerald-200',
                  bg: 'bg-white hover:border-emerald-300',
                  title: 'Verified Matched Strength',
                },
                transferable_strength: {
                  badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                  border: 'border-indigo-200',
                  bg: 'bg-white hover:border-indigo-300',
                  title: 'Transferable Capability',
                },
              };

              const style = statusStyles[comp.status];

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border ${style.border} ${style.bg} shadow-xs space-y-4 transition-all`}
                >
                  {/* Top Bar: Skill Name, Category, Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900">
                        {comp.skill}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600">
                        {comp.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600">
                        {comp.importance}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${style.badge} self-start sm:self-auto`}
                    >
                      {style.title}
                    </span>
                  </div>

                  {/* Grounded Evidence Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Employer JD Evidence */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="font-semibold text-slate-800 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                        <Quote className="w-3 h-3 text-indigo-600" />
                        Employer Job Description Requirement:
                      </div>
                      <p className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                        &ldquo;{comp.supportingJobEvidence}&rdquo;
                      </p>
                    </div>

                    {/* Candidate Résumé Evidence */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="font-semibold text-slate-800 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                        <FileText className="w-3 h-3 text-slate-500" />
                        Candidate Résumé Evidence:
                      </div>
                      <p className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                        {comp.resumeEvidence === 'No mention found in candidate résumé' ? (
                          <span className="text-amber-700 font-medium not-italic">
                            ⚠️ No mention found in candidate résumé
                          </span>
                        ) : (
                          `“${comp.resumeEvidence}”`
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Distinction / Reasoning Callout */}
                  <div className="text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                      Analysis Distinction:
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {comp.gapReasoning}
                    </p>
                  </div>

                  {/* Actionable Bridge Recommendation */}
                  <div className="text-xs bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 flex items-start gap-2">
                    <Target className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-indigo-950">
                        Actionable Pivot Bridge:
                      </span>{' '}
                      <span className="text-indigo-900">
                        {comp.actionableBridge}
                      </span>
                    </div>
                  </div>

                  {/* Candidate Clarification Controls */}
                  {(() => {
                    const originalIndex = analysis.competencies.findIndex(
                      (c) => (c.id && comp.id && c.id === comp.id) || (c.skill === comp.skill && c.supportingJobEvidence === comp.supportingJobEvidence)
                    );

                    if (comp.userClarification) {
                      return (
                        <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
                          <div>
                            <span className="font-semibold text-purple-900 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                              Candidate Clarification Applied:
                            </span>
                            <p className="text-purple-800 text-[11px] mt-0.5 font-medium">
                              {comp.userClarification.note}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleResetClarification(originalIndex)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-purple-200 text-[11px] font-semibold text-slate-700 hover:text-red-700 hover:border-red-200 transition-colors shrink-0"
                          >
                            <RotateCcw className="w-3 h-3 text-slate-500" />
                            <span>Reset to AI Assessment</span>
                          </button>
                        </div>
                      );
                    }

                    if (editingClarificationId === comp.id) {
                      return (
                        <div className="p-3.5 rounded-xl bg-slate-100/90 border border-slate-300 space-y-2.5 animate-in fade-in">
                          <label className="block text-[11px] font-bold text-slate-800">
                            Provide past experience / evidence for &ldquo;{comp.skill}&rdquo;:
                          </label>
                          <textarea
                            value={clarificationText}
                            onChange={(e) => setClarificationText(e.target.value)}
                            rows={2}
                            placeholder="e.g., At previous company, built audio processing pipeline with OpenAI Whisper; led fine-tuning experiments..."
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingClarificationId(null);
                                setClarificationText('');
                              }}
                              className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={!clarificationText.trim()}
                              onClick={() => handleSaveEvidenceClarification(originalIndex)}
                              className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                            >
                              Save Clarification (Turn into Strength)
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-500 font-medium">
                          Refine this item:
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingClarificationId(comp.id);
                              setClarificationText('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium transition-colors"
                          >
                            <PlusCircle className="w-3 h-3 text-indigo-600" />
                            <span>Add Evidence (Mark as Strength)</span>
                          </button>

                          {comp.status !== 'confirmed_gap' && (
                            <button
                              type="button"
                              onClick={() => handleConfirmLackOfSkill(originalIndex)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-medium transition-colors"
                            >
                              <CheckCircle2 className="w-3 h-3 text-red-600" />
                              <span>Confirm Need to Learn</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {/* Bottom CTA to Weekly Learning Plan */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-800 shadow-md">
            <div className="space-y-1">
              <h3 className="text-base font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-300" />
                Ready to Bridge These Gaps?
              </h3>
              <p className="text-xs text-indigo-200">
                Generate a structured weekly study plan calibrated to your {profile.weeklyHours || 10} hrs/week commitment and {profile.targetTimelineWeeks || 12}-week timeline.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('learning-plan')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold shadow-sm transition-all shrink-0"
            >
              <span>Build Weekly Learning Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
