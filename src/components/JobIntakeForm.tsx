'use client';

import React, { useState } from 'react';
import { 
  Briefcase, 
  Building2, 
  Globe, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ClipboardPaste, 
  Star,
  ExternalLink,
  Target
} from 'lucide-react';
import { JobDescription, ValidationErrors } from '@/types';
import { validateJobDescription } from '@/lib/validation';
import { DEMO_JOBS } from '@/lib/storage';

interface JobIntakeFormProps {
  jobs: JobDescription[];
  onSaveJob: (job: JobDescription) => void;
  onDeleteJob: (id: string) => void;
  onSetActiveTarget: (id: string) => void;
  onOpenWisprGuide: () => void;
}

const EMPTY_JOB: Omit<JobDescription, 'id' | 'dateAdded'> = {
  title: '',
  company: '',
  sourceUrl: '',
  targetTier: 'target',
  rawText: '',
  isActiveTarget: true,
};

export default function JobIntakeForm({
  jobs,
  onSaveJob,
  onDeleteJob,
  onSetActiveTarget,
  onOpenWisprGuide,
}: JobIntakeFormProps) {
  const [formData, setFormData] = useState<Omit<JobDescription, 'id' | 'dateAdded'>>(EMPTY_JOB);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const errors: ValidationErrors = validateJobDescription(formData);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleEditJob = (job: JobDescription) => {
    setEditingId(job.id);
    setFormData({
      title: job.title,
      company: job.company,
      sourceUrl: job.sourceUrl,
      targetTier: job.targetTier,
      rawText: job.rawText,
      isActiveTarget: job.isActiveTarget,
    });
    setTouched({});
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(EMPTY_JOB);
    setTouched({});
  };

  const handleLoadDemoJob = () => {
    const demo = DEMO_JOBS[0];
    setFormData({
      title: demo.title,
      company: demo.company,
      sourceUrl: demo.sourceUrl,
      targetTier: demo.targetTier,
      rawText: demo.rawText,
      isActiveTarget: true,
    });
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setFormData((prev) => ({ ...prev, rawText: text }));
      }
    } catch {
      alert('Unable to read clipboard automatically. Please press Ctrl+V / Cmd+V.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      jobTitle: true,
      jobCompany: true,
      jobSourceUrl: true,
      jobRawText: true,
    });

    const currentErrors = validateJobDescription(formData);
    if (Object.keys(currentErrors).length > 0) {
      return;
    }

    const jobToSave: JobDescription = {
      ...formData,
      id: editingId || `job-${Date.now()}`,
      dateAdded: new Date().toISOString(),
      isActiveTarget: formData.isActiveTarget || jobs.length === 0,
    };

    onSaveJob(jobToSave);
    setSuccessBanner(editingId ? 'Job description updated successfully!' : 'Target job description added successfully!');
    setFormData(EMPTY_JOB);
    setEditingId(null);
    setTouched({});

    setTimeout(() => setSuccessBanner(null), 3000);
  };

  const activeJob = jobs.find((j) => j.isActiveTarget) || jobs[0];
  const jdWordCount = formData.rawText.trim() ? formData.rawText.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Briefcase className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                Target Role & Job Description Intake
              </h2>
            </div>
            <p className="text-sm text-indigo-200">
              Ground your career pivot analysis in authentic, real-world job postings rather than generic role descriptions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenWisprGuide}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 transition-colors"
            >
              Dictation Instructions
            </button>
            <button
              type="button"
              onClick={handleLoadDemoJob}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 transition-colors"
            >
              Load Wispr Flow Demo Role
            </button>
          </div>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successBanner}</span>
        </div>
      )}

      {/* Main Grid: Form on left, saved targets on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Container */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                {editingId ? 'Edit Job Description' : 'Add New Target Job Description'}
              </h3>
              <p className="text-xs text-slate-500">
                Paste the full job specification for accurate skill-gap parsing.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title & Company Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label 
                  htmlFor="jobTitle" 
                  className="block text-xs font-semibold text-slate-900 mb-1"
                >
                  Job Title *
                </label>
                <input
                  id="jobTitle"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  onBlur={() => handleBlur('jobTitle')}
                  placeholder="e.g. Senior AI Product Manager"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition-all focus:outline-hidden focus:ring-2 ${
                    touched.jobTitle && errors.jobTitle
                      ? 'border-red-400 focus:ring-red-400/50 bg-red-50/20'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30'
                  }`}
                />
                {touched.jobTitle && errors.jobTitle && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.jobTitle}
                  </p>
                )}
              </div>

              <div>
                <label 
                  htmlFor="jobCompany" 
                  className="block text-xs font-semibold text-slate-900 mb-1"
                >
                  Company Name *
                </label>
                <div className="relative">
                  <input
                    id="jobCompany"
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    onBlur={() => handleBlur('jobCompany')}
                    placeholder="e.g. Wispr Flow, Anthropic, OpenAI"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition-all focus:outline-hidden focus:ring-2 ${
                      touched.jobCompany && errors.jobCompany
                        ? 'border-red-400 focus:ring-red-400/50 bg-red-50/20'
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30'
                    }`}
                  />
                </div>
                {touched.jobCompany && errors.jobCompany && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.jobCompany}
                  </p>
                )}
              </div>
            </div>

            {/* Source URL & Tier Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label 
                  htmlFor="sourceUrl" 
                  className="block text-xs font-semibold text-slate-900 mb-1"
                >
                  Posting URL (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <input
                    id="sourceUrl"
                    type="url"
                    value={formData.sourceUrl}
                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                    onBlur={() => handleBlur('jobSourceUrl')}
                    placeholder="https://..."
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition-all focus:outline-hidden focus:ring-2 ${
                      touched.jobSourceUrl && errors.jobSourceUrl
                        ? 'border-red-400 focus:ring-red-400/50 bg-red-50/20'
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30'
                    }`}
                  />
                </div>
                {touched.jobSourceUrl && errors.jobSourceUrl && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.jobSourceUrl}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Target Tier Classification
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['dream', 'target', 'safety'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setFormData({ ...formData, targetTier: tier })}
                      className={`py-2 text-xs font-medium rounded-xl border capitalize transition-all ${
                        formData.targetTier === tier
                          ? tier === 'dream'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                            : tier === 'target'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pasted Raw JD Text Area */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                <label 
                  htmlFor="rawText" 
                  className="text-xs font-semibold text-slate-900 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Full Job Description Text *
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    Paste Text
                  </button>
                  {formData.rawText && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, rawText: '' })}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Clear text"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                id="rawText"
                rows={10}
                value={formData.rawText}
                onChange={(e) => setFormData({ ...formData, rawText: e.target.value })}
                onBlur={() => handleBlur('jobRawText')}
                placeholder="Paste the full job post text here (Responsibilities, Qualifications, Must-haves, Tech Stack)...

You can also use Wispr Flow to dictate summary notes or role requirements directly into this box."
                className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 font-mono text-[13px] leading-relaxed transition-all focus:outline-hidden focus:ring-2 ${
                  touched.jobRawText && errors.jobRawText
                    ? 'border-red-400 focus:ring-red-400/50 bg-red-50/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30'
                }`}
              />

              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>
                  {touched.jobRawText && errors.jobRawText ? (
                    <span className="text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.jobRawText}
                    </span>
                  ) : (
                    'Raw text will be analyzed by Gemini to extract grounded skills & rubric.'
                  )}
                </span>
                <span className={jdWordCount >= 50 ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                  {jdWordCount} words
                </span>
              </div>
            </div>

            {/* Set as active checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActiveTarget"
                checked={formData.isActiveTarget}
                onChange={(e) => setFormData({ ...formData, isActiveTarget: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="isActiveTarget" className="text-xs font-medium text-slate-700 cursor-pointer">
                Set as Active Target for Skill Gap Analysis & Mock Interviews
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
              >
                <Plus className="w-4 h-4" />
                <span>{editingId ? 'Update Target Job' : 'Save Target Job to Local Storage'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Saved Targets List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Target Job Descriptions ({jobs.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Select which JD acts as your primary pivot target.
                </p>
              </div>
            </div>

            {jobs.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-600">
                  No target job descriptions added yet.
                </p>
                <button
                  type="button"
                  onClick={handleLoadDemoJob}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  Load Sample Wispr Flow JD
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const isActive = job.isActiveTarget;
                  const wordCount = job.rawText.trim().split(/\s+/).length;

                  return (
                    <div
                      key={job.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isActive
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-slate-900">
                              {job.title}
                            </span>
                            {isActive && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-full">
                                Active Target
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                                job.targetTier === 'dream'
                                  ? 'bg-purple-100 text-purple-800'
                                  : job.targetTier === 'target'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {job.targetTier}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                            <span className="font-medium flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {job.company}
                            </span>
                            <span>•</span>
                            <span>{wordCount} words</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {job.sourceUrl && (
                            <a
                              href={job.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Open original job posting"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleEditJob(job)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 transition-colors text-xs font-medium"
                            title="Edit job"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteJob(job.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete job"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Excerpt */}
                      <p className="text-xs text-slate-600 line-clamp-2 mt-2 bg-slate-50 p-2 rounded-lg font-mono text-[11px]">
                        {job.rawText.substring(0, 160)}...
                      </p>

                      {/* Active toggle button */}
                      {!isActive && (
                        <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => onSetActiveTarget(job.id)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                          >
                            <Star className="w-3 h-3" />
                            Set as Active Comparison Target
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active target summary card */}
          {activeJob && (
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-4 text-xs space-y-2">
              <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Active Target Role for Milestone 2:
              </span>
              <p className="text-slate-700">
                <strong>{activeJob.title}</strong> at <strong>{activeJob.company}</strong>. When Milestone 2 activates Gemini, this role’s requirements will directly ground your skill gap scores and mock interview prompts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
