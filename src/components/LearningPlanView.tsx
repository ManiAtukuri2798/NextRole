'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarRange, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Circle,
  AlertCircle, 
  AlertTriangle,
  FolderGit2, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  ArrowRight,
  Sliders,
  Check,
  Target,
  ExternalLink,
  BookOpen,
  Briefcase
} from 'lucide-react';
import { 
  UserProfile, 
  JobDescription, 
  WeeklyLearningPlan, 
  LearningTask, 
  WeeklyPlanWeek, 
  WorkspaceTab 
} from '@/types';
import { 
  getStoredLearningPlan, 
  saveStoredLearningPlan, 
  clearStoredLearningPlan,
  getStoredSkillGapAnalysis 
} from '@/lib/storage';

interface LearningPlanViewProps {
  profile: UserProfile;
  activeJob?: JobDescription;
  onNavigateToTab?: (tab: WorkspaceTab) => void;
  onUpdateProfileHours?: (weeklyHours: number, timelineWeeks: number) => void;
}

export default function LearningPlanView({
  profile,
  activeJob,
  onNavigateToTab,
  onUpdateProfileHours,
}: LearningPlanViewProps) {
  const [plan, setPlan] = useState<WeeklyLearningPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});
  
  // Replan adjustment state
  const [showReplanControls, setShowReplanControls] = useState(false);
  const [replanHours, setReplanHours] = useState<number>(profile.weeklyHours || 10);
  const [replanWeeks, setReplanWeeks] = useState<number>(profile.targetTimelineWeeks || 12);
  const [replanReason, setReplanReason] = useState<string>('');

  // Load cached plan on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = getStoredLearningPlan();
      if (stored) {
        setPlan(stored);
        // Expand first 3 weeks by default
        const initExpanded: Record<number, boolean> = {};
        stored.weeks.forEach((w, idx) => {
          initExpanded[w.weekNumber] = idx < 3;
        });
        setExpandedWeeks(initExpanded);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Sync replan sliders with profile when profile changes
  useEffect(() => {
    setReplanHours(profile.weeklyHours || 10);
    setReplanWeeks(profile.targetTimelineWeeks || 12);
  }, [profile.weeklyHours, profile.targetTimelineWeeks]);

  const skillGapAnalysis = typeof window !== 'undefined' ? getStoredSkillGapAnalysis() : null;

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNumber]: !prev[weekNumber],
    }));
  };

  const expandAll = () => {
    if (!plan) return;
    const all: Record<number, boolean> = {};
    plan.weeks.forEach((w) => {
      all[w.weekNumber] = true;
    });
    setExpandedWeeks(all);
  };

  const collapseAll = () => {
    setExpandedWeeks({});
  };

  // Toggle task completion
  const handleToggleTask = (weekNumber: number, taskId: string) => {
    if (!plan) return;

    const updatedWeeks = plan.weeks.map((week) => {
      if (week.weekNumber !== weekNumber) return week;
      return {
        ...week,
        tasks: week.tasks.map((task) => {
          if (task.id !== taskId) return task;
          const nextCompleted = !task.isCompleted;
          return {
            ...task,
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }),
      };
    });

    const updatedPlan: WeeklyLearningPlan = {
      ...plan,
      weeks: updatedWeeks,
    };

    setPlan(updatedPlan);
    saveStoredLearningPlan(updatedPlan);
  };

  // Generate or Replan with Gemini
  const handleGeneratePlan = async (isReplanMode = false) => {
    setIsLoading(true);
    setApiError(null);
    if (isReplanMode) setIsReplanning(true);

    try {
      const storedGaps = skillGapAnalysis?.competencies || [];
      const completedTasks: LearningTask[] = [];

      if (isReplanMode && plan) {
        plan.weeks.forEach((w) => {
          w.tasks.forEach((t) => {
            if (t.isCompleted) completedTasks.push(t);
          });
        });
      }

      const res = await fetch('/api/generate-learning-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: profile.targetRole || skillGapAnalysis?.jobTitle || 'AI Product Manager',
          currentRole: profile.currentRole,
          weeklyHours: isReplanMode ? replanHours : profile.weeklyHours || 10,
          targetTimelineWeeks: isReplanMode ? replanWeeks : profile.targetTimelineWeeks || 12,
          jobTitle: activeJob?.title || skillGapAnalysis?.jobTitle || 'Target Role',
          jobCompany: activeJob?.company || skillGapAnalysis?.jobCompany || 'Target Employer',
          gaps: storedGaps,
          completedTasks,
          isReplan: isReplanMode,
          replanningReason: replanReason || (isReplanMode ? `Adjusted study budget to ${replanHours} hrs/week over ${replanWeeks} weeks.` : ''),
        }),
      });

      const data = await res.json();

      if (!data.configured) {
        setIsConfigured(false);
        setApiError(data.error);
        setIsLoading(false);
        setIsReplanning(false);
        return;
      }

      if (!res.ok || data.error) {
        setApiError(data.error || 'Failed to generate learning plan.');
        setIsLoading(false);
        setIsReplanning(false);
        return;
      }

      setIsConfigured(true);
      setPlan(data.plan);
      saveStoredLearningPlan(data.plan);
      setShowReplanControls(false);

      // Notify parent to update profile hours if changed during replan
      if (isReplanMode && onUpdateProfileHours) {
        onUpdateProfileHours(replanHours, replanWeeks);
      }

      // Expand first 3 weeks
      const initExpanded: Record<number, boolean> = {};
      data.plan.weeks.forEach((w: WeeklyPlanWeek, idx: number) => {
        initExpanded[w.weekNumber] = idx < 3;
      });
      setExpandedWeeks(initExpanded);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setApiError(`Could not reach learning plan API: ${msg}`);
    } finally {
      setIsLoading(false);
      setIsReplanning(false);
    }
  };

  const handleClearPlan = () => {
    clearStoredLearningPlan();
    setPlan(null);
  };

  // Calculations for progress & hours
  const totalTasks = plan?.weeks.reduce((acc, w) => acc + w.tasks.length, 0) || 0;
  const completedTasksCount = plan?.weeks.reduce(
    (acc, w) => acc + w.tasks.filter((t) => t.isCompleted).length,
    0
  ) || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  const totalAllocatedHours = plan?.weeks.reduce((acc, w) => acc + w.allocatedHours, 0) || 0;
  const completedHours = plan?.weeks.reduce(
    (acc, w) =>
      acc +
      w.tasks
        .filter((t) => t.isCompleted)
        .reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0),
    0
  ) || 0;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md border border-indigo-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <CalendarRange className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                Weekly Learning Plan & Portfolio Architecture
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Gemini AI Plan
              </span>
            </div>
            <p className="text-sm text-indigo-200">
              Personalized study sprints and portfolio projects strictly calibrated to your weekly hours budget and verified skill gaps.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {plan && (
              <button
                type="button"
                onClick={() => setShowReplanControls(!showReplanControls)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/10 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-300" />
                <span>Adjust & Replan</span>
              </button>
            )}

            {plan && (
              <button
                type="button"
                onClick={handleClearPlan}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Clear Plan
              </button>
            )}

            {!plan && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleGeneratePlan(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/40"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Architecting Plan with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Learning Plan</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Missing Gemini Configuration Notice */}
      {!isConfigured && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-amber-950 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>Gemini API Key Required on Server</span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            Configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code> in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env.local</code> to enable real server-side learning plan generation.
          </p>
        </div>
      )}

      {/* API Error Callout */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-950 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-red-900">Plan Generation Error</p>
            <p className="text-xs text-red-700">{apiError}</p>
          </div>
        </div>
      )}

      {/* Empty State: Prompt to Generate */}
      {!plan && !isLoading && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-5 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
              <CalendarRange className="w-6 h-6" />
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <h3 className="text-base font-bold text-slate-900">
                Generate Your Calibrated Weekly Plan
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                NextRole builds a week-by-week study roadmap calibrated to your{' '}
                <span className="font-semibold text-slate-900">{profile.weeklyHours || 10} hrs/week</span> commitment and{' '}
                <span className="font-semibold text-slate-900">{profile.targetTimelineWeeks || 12}-week</span> timeline. Tasks are grounded in your verified skill gaps, complete with deliverables and completion criteria.
              </p>
            </div>

            {/* Gap Context Badge */}
            {skillGapAnalysis ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Found {skillGapAnalysis.competencies.length} grounded competencies from your skill gap analysis</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>No skill gap analysis run yet. Plan will use profile skills & target role.</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              {onNavigateToTab && !skillGapAnalysis && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('skill-gaps')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Run Skill Gap Analysis First
                </button>
              )}
              <button
                type="button"
                onClick={() => handleGeneratePlan(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Plan with Gemini AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              {isReplanning ? 'Replanning Schedule with Gemini...' : 'Designing Weekly Curriculum with Gemini...'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Synthesizing skill gaps, calculating weekly time budgets, enforcing hourly caps, and mapping tangible portfolio deliverables.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Plan Content */}
      {plan && !isLoading && (
        <div className="space-y-8 animate-in fade-in">
          {/* Progress & Overview Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Target Curriculum Pacing
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {plan.targetRole} Roadmap ({plan.totalWeeks} Weeks @ {plan.weeklyHours} hrs/week)
                </h3>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                  <span className="text-slate-500 mr-1.5">Tasks:</span>
                  <span className="font-bold text-slate-900">
                    {completedTasksCount} / {totalTasks}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                  <span className="text-slate-500 mr-1.5">Hours:</span>
                  <span className="font-bold text-slate-900">
                    {Math.round(completedHours * 10) / 10} / {Math.round(totalAllocatedHours * 10) / 10} hrs
                  </span>
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Overall Pivot Readiness</span>
                <span className="font-bold text-indigo-600">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
              {plan.summary}
            </p>
          </div>

          {/* Timeline Feasibility & Shortfall Banner */}
          {plan.timelineFeasibility && (
            <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
              plan.timelineFeasibility.status === 'shortfall'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : plan.timelineFeasibility.status === 'tight'
                ? 'bg-blue-50 border-blue-200 text-blue-950'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-2">
                  {plan.timelineFeasibility.status === 'shortfall' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>
                    Schedule Feasibility: {plan.timelineFeasibility.status.toUpperCase()}
                  </span>
                </div>
                <span>
                  {plan.timelineFeasibility.totalEstimatedHoursNeeded} hrs needed / {plan.timelineFeasibility.totalAvailableHours} hrs available
                </span>
              </div>

              {plan.timelineFeasibility.shortfallExplanation && (
                <p className="text-[11px] leading-relaxed opacity-90">
                  {plan.timelineFeasibility.shortfallExplanation}
                </p>
              )}
            </div>
          )}

          {/* Replanned Explanation Banner */}
          {plan.replannedExplanation && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-xs text-purple-950 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-purple-900">Schedule Successfully Replanned:</span>
                <p className="text-purple-800 mt-0.5 text-[11px] leading-relaxed">
                  {plan.replannedExplanation}
                </p>
              </div>
            </div>
          )}

          {/* Replanning Adjustments Toolbar */}
          {showReplanControls && (
            <div className="bg-slate-100/90 border border-slate-300 rounded-2xl p-5 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Replan Remaining Weeks (Preserves Completed Tasks)
                </h4>
                <button
                  type="button"
                  onClick={() => setShowReplanControls(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Weekly Hours Budget: {replanHours} hrs/week
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={30}
                    step={1}
                    value={replanHours}
                    onChange={(e) => setReplanHours(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>4 hrs (Light)</span>
                    <span>12 hrs (Standard)</span>
                    <span>30 hrs (Intensive)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Target Timeline: {replanWeeks} weeks
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={24}
                    step={1}
                    value={replanWeeks}
                    onChange={(e) => setReplanWeeks(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>4 wks (Sprint)</span>
                    <span>12 wks (3 mos)</span>
                    <span>24 wks (6 mos)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-[11px] text-slate-500">
                  {completedTasksCount} completed tasks will be locked in place.
                </span>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleGeneratePlan(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Execute Replan</span>
                </button>
              </div>
            </div>
          )}

          {/* Week-by-Week Accordion */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Week-by-Week Study Sprints
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={expandAll}
                  className="text-slate-500 hover:text-indigo-600 font-medium"
                >
                  Expand All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="text-slate-500 hover:text-indigo-600 font-medium"
                >
                  Collapse All
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {plan.weeks.map((week) => {
                const isExpanded = Boolean(expandedWeeks[week.weekNumber]);
                const weekTasksCount = week.tasks.length;
                const weekCompletedCount = week.tasks.filter((t) => t.isCompleted).length;
                const isWeekComplete = weekTasksCount > 0 && weekCompletedCount === weekTasksCount;

                return (
                  <div
                    key={week.weekNumber}
                    className={`border rounded-2xl transition-all ${
                      isWeekComplete 
                        ? 'border-emerald-200 bg-emerald-50/20' 
                        : 'border-slate-200 bg-white'
                    } shadow-xs overflow-hidden`}
                  >
                    {/* Week Header Accordion Bar */}
                    <button
                      type="button"
                      onClick={() => toggleWeek(week.weekNumber)}
                      className="w-full p-4.5 text-left flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                          isWeekComplete
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          W{week.weekNumber}
                        </span>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-slate-900">
                              Week {week.weekNumber}: {week.theme}
                            </h4>
                            {isWeekComplete && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800">
                                Completed
                              </span>
                            )}
                          </div>
                          {week.projectMilestone && (
                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Target className="w-3 h-3 text-indigo-500" />
                              Milestone: {week.projectMilestone}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          {week.allocatedHours} / {week.weeklyTargetHours} hrs
                        </span>
                        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                          {weekCompletedCount}/{weekTasksCount}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Week Tasks List */}
                    {isExpanded && (
                      <div className="p-4 pt-1 border-t border-slate-100 space-y-2.5">
                        {week.tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`p-3.5 rounded-xl border text-xs transition-all ${
                              task.isCompleted
                                ? 'bg-slate-50/80 border-slate-200 opacity-75'
                                : 'bg-white border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <button
                                type="button"
                                onClick={() => handleToggleTask(week.weekNumber, task.id)}
                                className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                              >
                                {task.isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500" />
                                )}
                              </button>

                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span className={`font-bold text-sm ${
                                    task.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                                  }`}>
                                    {task.title}
                                  </span>

                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      {task.linkedSkill}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                      {task.estimatedHours} hrs
                                    </span>
                                  </div>
                                </div>

                                <p className="text-slate-600 leading-relaxed text-[11px]">
                                  {task.description}
                                </p>

                                <div className="flex items-start gap-1.5 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-700">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold text-slate-800">Completion Criteria: </span>
                                    <span>{task.completionCriteria}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Portfolio Projects Section */}
          {plan.portfolioProjects && plan.portfolioProjects.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-indigo-600" />
                  Portfolio Projects & Tangible Proof Artifacts
                </h3>
                <span className="text-xs text-slate-500">
                  {plan.portfolioProjects.length} Projects Mapped to Gaps
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.portfolioProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Target Week {proj.targetWeek}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        ~{proj.estimatedHours} hrs
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900">
                      {proj.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {proj.description}
                    </p>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 space-y-1">
                      <span className="font-bold text-slate-900 block">Deliverable:</span>
                      <p>{proj.targetDeliverable}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.linkedSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
