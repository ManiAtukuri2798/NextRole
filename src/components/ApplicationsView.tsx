'use client';

import React, { useState } from 'react';
import { 
  SendHorizontal, 
  Plus, 
  ExternalLink, 
  Database, 
  Trash2,
  Building2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Layers,
  ArrowRight,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { 
  ApplicationItem, 
  JobDescription, 
  ApplicationStatus, 
  RejectionStage, 
  WorkspaceTab 
} from '@/types';
import { incorporateWeaknessIntoPlan } from '@/lib/storage';

interface ApplicationsViewProps {
  applications: ApplicationItem[];
  jobs: JobDescription[];
  onSaveApplication: (app: ApplicationItem) => void;
  onDeleteApplication: (id: string) => void;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onUpdateApplication?: (app: ApplicationItem) => void;
  onNavigateToTab?: (tab: WorkspaceTab) => void;
  onShowToast?: (message: string) => void;
}

export default function ApplicationsView({
  applications,
  jobs,
  onSaveApplication,
  onDeleteApplication,
  onUpdateStatus,
  onUpdateApplication,
  onNavigateToTab,
  onShowToast,
}: ApplicationsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationItem | null>(null);

  // Form states for new application
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [roleCategory, setRoleCategory] = useState('AI Product Management');
  const [targetTier, setTargetTier] = useState<'dream' | 'target' | 'safety'>('target');
  const [status, setStatus] = useState<ApplicationStatus>('applied');
  const [sourceUrl, setSourceUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Review suggestion modal state
  const [selectedSuggestion, setSelectedSuggestion] = useState<{
    id: string;
    title: string;
    category: string;
    rationale: string;
    suggestedTaskTitle: string;
    suggestedHours: number;
    suggestedSkill: string;
  } | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    const newItem: ApplicationItem = {
      id: `app-${Date.now()}`,
      company: company.trim(),
      role: role.trim(),
      roleCategory: roleCategory.trim() || 'AI Product Management',
      targetTier,
      sourceUrl: sourceUrl.trim() || undefined,
      status,
      appliedDate: new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    };

    onSaveApplication(newItem);
    setCompany('');
    setRole('');
    setSourceUrl('');
    setNotes('');
    setShowAddForm(false);
    if (onShowToast) onShowToast('Application logged to browser storage.');
  };

  const handleQuickAddFromJob = (job: JobDescription) => {
    const newItem: ApplicationItem = {
      id: `app-${Date.now()}`,
      company: job.company,
      role: job.title,
      roleCategory: job.title.toLowerCase().includes('product') ? 'AI Product Management' : 'Technical Product Management',
      sourceUrl: job.sourceUrl || undefined,
      targetTier: job.targetTier,
      status: 'wishlist',
      appliedDate: new Date().toISOString().split('T')[0],
      notes: `Target tier: ${job.targetTier}. Logged from Job Intake tab.`,
    };
    onSaveApplication(newItem);
    if (onShowToast) onShowToast(`Added ${job.company} to applications.`);
  };

  const handleSaveEditedApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    if (onUpdateApplication) {
      onUpdateApplication(editingApp);
    } else {
      onSaveApplication(editingApp);
    }
    setEditingApp(null);
    if (onShowToast) onShowToast('Application outcome updated.');
  };

  const handleApplySuggestionToPlan = () => {
    if (!selectedSuggestion) return;

    const plan = incorporateWeaknessIntoPlan({
      title: selectedSuggestion.suggestedTaskTitle,
      linkedSkill: selectedSuggestion.suggestedSkill,
      estimatedHours: selectedSuggestion.suggestedHours,
      completionCriteria: `Refine application outreach based on pattern feedback: complete "${selectedSuggestion.suggestedTaskTitle}" to improve response conversion.`,
    });

    if (plan && onShowToast) {
      onShowToast(`Updated Learning Plan with suggested task: "${selectedSuggestion.suggestedTaskTitle}"!`);
    }
    setSelectedSuggestion(null);
  };

  // Group applications by roleCategory
  const groupedCategories = applications.reduce<Record<string, ApplicationItem[]>>((acc, app) => {
    const cat = app.roleCategory || 'General Product / Tech';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(app);
    return acc;
  }, {});

  // Compute pattern analytics per category
  const categoryAnalytics = Object.entries(groupedCategories).map(([category, items]) => {
    const totalCount = items.length;
    const positiveResponses = items.filter(
      (i) => i.status === 'interviewing' || i.status === 'offer'
    ).length;
    const explicitRejections = items.filter((i) => i.status === 'rejected').length;
    const pendingCount = items.filter(
      (i) => i.status === 'applied' || i.status === 'screening' || i.status === 'wishlist'
    ).length;

    const resolvedCount = positiveResponses + explicitRejections;
    const responseRate = resolvedCount > 0 
      ? Math.round((positiveResponses / resolvedCount) * 100) 
      : (totalCount > 0 && positiveResponses > 0 ? Math.round((positiveResponses / totalCount) * 100) : null);

    // Cautious sample size description
    const isSmallSample = totalCount < 4;
    const sampleLabel = isSmallSample 
      ? `Directional Only (Small Sample: n=${totalCount})` 
      : `Moderate Sample (n=${totalCount})`;
    
    const disclaimer = isSmallSample
      ? 'Limited sample size. Directional indicator only; insufficient data for definitive conclusions.'
      : 'Pattern derived from current local application outcomes.';

    return {
      category,
      totalCount,
      positiveResponses,
      explicitRejections,
      pendingCount,
      responseRate,
      isSmallSample,
      sampleLabel,
      disclaimer,
      items,
    };
  });

  const statusColors: Record<ApplicationStatus, string> = {
    wishlist: 'bg-slate-100 text-slate-700 border-slate-300',
    applied: 'bg-blue-50 text-blue-700 border-blue-200',
    screening: 'bg-amber-50 text-amber-800 border-amber-300',
    interviewing: 'bg-purple-50 text-purple-700 border-purple-200',
    offer: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  const rejectionStageLabels: Record<RejectionStage, string> = {
    resume_screen: 'Resume Screen Filter',
    technical_round: 'Technical Assessment Round',
    hiring_manager: 'Hiring Manager Discussion',
    onsite: 'Final Round / Onsite',
    ghosted_no_response: 'No Response / Ghosted',
    other: 'General / Unspecified',
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <SendHorizontal className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                Application Pipeline & Heuristic Feedback Loop
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Database className="w-3.5 h-3.5" />
                Browser Local Storage
              </span>
            </div>
            <p className="text-sm text-indigo-200">
              Track submissions, record detailed outcomes, and examine response patterns grouped by target role category to refine your career pivot.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Close Form' : 'Log Application'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Honest Storage & Machine Learning Notice */}
      <div className="bg-slate-100/80 border border-slate-300 rounded-2xl p-4.5 text-slate-800 space-y-1 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Transparent Pattern Insights & Storage Architecture</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-[11px]">
          <strong>Storage Behavior:</strong> All applications and outcome stages are stored locally in your browser (<code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">localStorage</code>). No remote database or automatic cloud sync is enabled, ensuring private tracking on your personal device.
          <br />
          <strong>Pattern Analysis:</strong> Response insights use structured heuristic correlation (treating pending stages separately from explicit rejections), <em>not a trained black-box machine-learning model</em>. When sample size is small (n &lt; 4), conclusions are explicitly marked as directional.
        </p>
      </div>

      {/* Grouped Response Pattern Analytics Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Response Rates & Outcome Patterns by Role Category
            </h3>
            <p className="text-xs text-slate-500">
              Evaluated with sample sizes (n). Pending applications are separated from confirmed rejections.
            </p>
          </div>
        </div>

        {categoryAnalytics.length === 0 ? (
          <div className="p-6 rounded-2xl border border-slate-200 bg-white text-center text-xs text-slate-500">
            No application data to analyze yet. Log your first application below.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAnalytics.map((cat, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3.5 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Category
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">
                      {cat.category}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                    cat.isSmallSample
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    n = {cat.totalCount}
                  </span>
                </div>

                {/* Response Rate Metric */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Positive Response Rate:</span>
                    <span className="font-bold text-slate-900">
                      {cat.responseRate !== null ? `${cat.responseRate}%` : 'Pending Data'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {cat.positiveResponses} positive (interview/offer) • {cat.explicitRejections} rejected • {cat.pendingCount} pending
                  </div>
                </div>

                {/* Cautious Pattern Note */}
                <div className="text-[11px] space-y-1">
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Info className="w-3 h-3 text-indigo-500" />
                    Observed Direction:
                  </span>
                  <p className="text-slate-600 leading-snug">
                    {cat.positiveResponses > 0 && cat.explicitRejections === 0
                      ? 'Positive traction noted. Current résumé positioning aligns with early screen criteria.'
                      : cat.explicitRejections > 0 && cat.positiveResponses > 0
                      ? 'Mixed conversion rate. Reviewing stage drop-offs (resume screen vs. interview) can isolate gaps.'
                      : cat.explicitRejections > 0 && cat.positiveResponses === 0
                      ? 'Early friction detected. Suggest strengthening domain proof points in resume.'
                      : 'Applications are currently pending recruiter review.'}
                  </p>
                  <p className="text-[10px] text-amber-700 italic pt-0.5">
                    {cat.disclaimer}
                  </p>
                </div>

                {/* Suggested Pivot Action Trigger */}
                {cat.explicitRejections > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSuggestion({
                        id: `sugg-${cat.category}`,
                        title: `Bridge Resume Proof for ${cat.category}`,
                        category: cat.category,
                        rationale: `Applications in "${cat.category}" experienced screening rejection. Suggest prioritizing a tangible project deliverable to prove hands-on capability.`,
                        suggestedTaskTitle: `Build and publish demonstrable proof-of-concept for ${cat.category}`,
                        suggestedHours: 4,
                        suggestedSkill: cat.category.includes('Voice') || cat.category.includes('AI') ? 'Whisper & Speech-to-Text Architecture' : 'API & Architecture Specs',
                      })
                    }
                    className="w-full py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Review Suggested Adjustment</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Suggested Plan Adjustment Modal */}
      {selectedSuggestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Review Suggested Career Plan Update</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSuggestion(null)}
                className="text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">
                {selectedSuggestion.title}
              </p>
              <p className="leading-relaxed text-slate-600">
                {selectedSuggestion.rationale}
              </p>

              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1.5 mt-2">
                <span className="font-bold text-indigo-950 block">Proposed Action for Weekly Learning Plan:</span>
                <p className="text-indigo-900 font-medium">
                  Add Sprint Task: &ldquo;{selectedSuggestion.suggestedTaskTitle}&rdquo;
                </p>
                <div className="flex items-center gap-3 text-[11px] text-indigo-700 pt-1">
                  <span>Target Focus: {selectedSuggestion.suggestedSkill}</span>
                  <span>•</span>
                  <span>Estimated Time: ~{selectedSuggestion.suggestedHours} hours</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                You are in full control. The task will only be added to your Weekly Learning Plan if you click &ldquo;Apply to Learning Plan&rdquo; below.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSuggestion(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleApplySuggestionToPlan}
                className="px-4.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
              >
                Apply to Learning Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Application Form Dropdown */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-md space-y-4 animate-in fade-in">
          <h3 className="text-sm font-semibold text-slate-900">
            Log New Target Application
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Wispr Flow"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Role Title *</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. AI Product Manager"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Role Category *</label>
              <select
                value={roleCategory}
                onChange={(e) => setRoleCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden bg-white"
              >
                <option value="AI Product Management">AI Product Management</option>
                <option value="Technical Product Management">Technical Product Management</option>
                <option value="AI Solutions Architecture">AI Solutions Architecture</option>
                <option value="Voice UI/UX Design">Voice UI/UX Design</option>
                <option value="Machine Learning Engineering">Machine Learning Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Target Tier</label>
              <select
                value={targetTier}
                onChange={(e) => setTargetTier(e.target.value as 'dream' | 'target' | 'safety')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden bg-white"
              >
                <option value="dream">Dream Role</option>
                <option value="target">Target Fit</option>
                <option value="safety">Safety / Baseline</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden bg-white"
              >
                <option value="wishlist">Wishlist</option>
                <option value="applied">Applied (Pending)</option>
                <option value="screening">Recruiter Screening</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer Received</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Job URL (Optional)</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-800 mb-1">Outreach Angle / Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Tailored resume highlighting audio AI benchmarking and Python basics"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              Save Application
            </button>
          </div>
        </form>
      )}

      {/* Edit Outcome Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveEditedApp} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Update Application Outcome: {editingApp.company} ({editingApp.role})
              </h3>
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Application Status</label>
                <select
                  value={editingApp.status}
                  onChange={(e) => setEditingApp({ ...editingApp, status: e.target.value as ApplicationStatus })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="wishlist">Wishlist</option>
                  <option value="applied">Applied (Pending)</option>
                  <option value="screening">Recruiter Screening</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offer">Offer Received</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {editingApp.status === 'rejected' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-red-50/60 border border-red-200 animate-in fade-in">
                  <div>
                    <label className="block font-semibold text-red-950 mb-1">Rejection Stage</label>
                    <select
                      value={editingApp.rejectionStage || 'resume_screen'}
                      onChange={(e) => setEditingApp({ ...editingApp, rejectionStage: e.target.value as RejectionStage })}
                      className="w-full px-3 py-1.5 rounded-lg border border-red-300 text-xs bg-white text-slate-900"
                    >
                      <option value="resume_screen">Resume Screen Filter</option>
                      <option value="technical_round">Technical Assessment Round</option>
                      <option value="hiring_manager">Hiring Manager Discussion</option>
                      <option value="onsite">Final Round / Onsite</option>
                      <option value="ghosted_no_response">Ghosted / No Response</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-red-950 mb-1">Feedback / Reason (if provided)</label>
                    <input
                      type="text"
                      value={editingApp.rejectionFeedback || ''}
                      onChange={(e) => setEditingApp({ ...editingApp, rejectionFeedback: e.target.value })}
                      placeholder="e.g. Lacked hands-on Whisper benchmark experience on initial resume scan"
                      className="w-full px-3 py-1.5 rounded-lg border border-red-300 text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Outreach Angle / Notes</label>
                <textarea
                  value={editingApp.notes || ''}
                  onChange={(e) => setEditingApp({ ...editingApp, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4.5 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xs"
              >
                Save Outcome
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Applications List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              Logged Applications Pipeline ({applications.length})
            </h3>
            <p className="text-xs text-slate-500">
              Retained in browser localStorage.
            </p>
          </div>

          {jobs.length > 0 && (
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <span className="hidden sm:inline">Quick log from Intake:</span>
              <button
                type="button"
                onClick={() => handleQuickAddFromJob(jobs[0])}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors"
              >
                + Add {jobs[0].company}
              </button>
            </div>
          )}
        </div>

        {applications.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <SendHorizontal className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">No applications logged yet.</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            >
              Log First Application
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Company & Role</th>
                  <th className="py-3 px-4">Category & Tier</th>
                  <th className="py-3 px-4">Stage / Status</th>
                  <th className="py-3 px-4">Outcome Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {app.company}
                        {app.sourceUrl && (
                          <a
                            href={app.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-slate-600">{app.role}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-900 block">{app.roleCategory || 'General'}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{app.targetTier || 'target'} tier</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          onUpdateStatus(app.id, e.target.value as ApplicationStatus)
                        }
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-hidden ${
                          statusColors[app.status]
                        }`}
                      >
                        <option value="wishlist">Wishlist</option>
                        <option value="applied">Applied (Pending)</option>
                        <option value="screening">Screening</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {app.status === 'rejected' && app.rejectionStage ? (
                        <div className="text-[11px] text-red-800">
                          <span className="font-semibold">{rejectionStageLabels[app.rejectionStage]}</span>
                          {app.rejectionFeedback && (
                            <p className="text-[10px] text-red-600 truncate mt-0.5">&ldquo;{app.rejectionFeedback}&rdquo;</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-600 truncate text-[11px]">
                          {app.notes || '—'}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingApp(app)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit outcome details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteApplication(app.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
