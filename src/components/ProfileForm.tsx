'use client';

import React, { useState } from 'react';
import { 
  User, 
  Sparkles, 
  Mic, 
  Clock, 
  X, 
  Plus, 
  AlertCircle, 
  Save, 
  FileText, 
  ClipboardPaste, 
  Trash2, 
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { UserProfile, ValidationErrors } from '@/types';
import { validateProfile } from '@/lib/validation';
import { DEMO_PROFILE } from '@/lib/storage';

interface ProfileFormProps {
  profile: UserProfile;
  onChange: (updated: UserProfile) => void;
  onSave: () => void;
  isSaving: boolean;
  onOpenWisprGuide: () => void;
}

const POPULAR_TARGET_ROLES = [
  'AI Product Manager',
  'Prompt & Context Engineer',
  'MLOps Engineer',
  'AI Solutions Architect',
  'Full-Stack AI Developer',
  'Voice UI/UX Designer',
];

const SUGGESTED_SKILLS = [
  'Python',
  'SQL',
  'Product Strategy',
  'User Research',
  'System Architecture',
  'Agile / Scrum',
  'API Design',
  'LLM Prompting',
  'RAG Systems',
  'Data Visualization',
  'Customer Empathy',
];

export default function ProfileForm({
  profile,
  onChange,
  onSave,
  isSaving,
  onOpenWisprGuide,
}: ProfileFormProps) {
  const [skillInput, setSkillInput] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [copiedNotification, setCopiedNotification] = useState(false);

  const errors: ValidationErrors = validateProfile(profile);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (profile.skills.includes(trimmed)) return;
    onChange({
      ...profile,
      skills: [...profile.skills, trimmed],
    });
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange({
      ...profile,
      skills: profile.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill(skillInput);
    }
  };

  const handlePasteResumeFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange({ ...profile, resumeText: text });
      }
    } catch {
      alert('Unable to access clipboard automatically. Please paste using Ctrl+V / Cmd+V.');
    }
  };

  const handleLoadSampleResume = () => {
    onChange({
      ...profile,
      resumeText: DEMO_PROFILE.resumeText,
      pivotMotivation: DEMO_PROFILE.pivotMotivation,
    });
  };

  const resumeWordCount = profile.resumeText.trim()
    ? profile.resumeText.trim().split(/\s+/).length
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      targetRole: true,
      weeklyHours: true,
      resumeText: true,
    });
    onSave();
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md border border-indigo-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <User className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                Candidate Profile & Career Pivot Intake
              </h2>
            </div>
            <p className="text-sm text-indigo-200">
              Define where you are, where you want to go, and how many hours you can commit.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenWisprGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 transition-colors"
            >
              <Mic className="w-3.5 h-3.5 text-indigo-300" />
              <span>Wispr Dictation Guide</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Role, Experience, Commitment */}
        <div className="lg:col-span-1 space-y-6">
          {/* Target Role Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="targetRole" 
                className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Target Pivot Role *
              </label>
              <span className="text-[11px] font-medium text-slate-500">Required</span>
            </div>

            <div className="relative">
              <input
                id="targetRole"
                type="text"
                value={profile.targetRole}
                onChange={(e) => onChange({ ...profile, targetRole: e.target.value })}
                onBlur={() => handleBlur('targetRole')}
                placeholder="e.g. AI Product Manager"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition-all focus:outline-hidden focus:ring-2 ${
                  touched.targetRole && errors.targetRole
                    ? 'border-red-400 focus:ring-red-400/50 bg-red-50/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30 bg-white'
                }`}
              />
            </div>
            {touched.targetRole && errors.targetRole && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.targetRole}
              </p>
            )}

            {/* Quick role suggestions */}
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Quick suggestions:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {POPULAR_TARGET_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => onChange({ ...profile, targetRole: role })}
                    className={`px-2 py-1 text-xs rounded-lg transition-colors border ${
                      profile.targetRole === role
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current Background Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Current Background
            </h3>

            <div>
              <label htmlFor="currentRole" className="block text-xs font-medium text-slate-700 mb-1">
                Current Title / Domain
              </label>
              <input
                id="currentRole"
                type="text"
                value={profile.currentRole}
                onChange={(e) => onChange({ ...profile, currentRole: e.target.value })}
                placeholder="e.g. Senior Technical Project Manager"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="experience" className="text-xs font-medium text-slate-700">
                  Total Experience
                </label>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {profile.yearsOfExperience} {profile.yearsOfExperience === 1 ? 'year' : 'years'}
                </span>
              </div>
              <input
                id="experience"
                type="range"
                min="0"
                max="20"
                step="1"
                value={profile.yearsOfExperience}
                onChange={(e) => onChange({ ...profile, yearsOfExperience: parseInt(e.target.value, 10) || 0 })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>Entry (0)</span>
                <span>Mid (5)</span>
                <span>Senior (10+)</span>
                <span>Executive (20)</span>
              </div>
            </div>
          </div>

          {/* Weekly Commitment & Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Weekly Study Hours Commitment *
              </h3>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-slate-600">Hours dedicated per week</span>
                <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                  {profile.weeklyHours} hrs/week
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="40"
                step="1"
                value={profile.weeklyHours}
                onChange={(e) => onChange({ ...profile, weeklyHours: parseInt(e.target.value, 10) || 2 })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1 italic">
                ≈ {Math.round((profile.weeklyHours / 5) * 10) / 10} hours each weekday or {profile.weeklyHours / 2} hours per weekend day.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Target Pivot Timeline
                </label>
                <span className="text-xs font-semibold text-slate-800">
                  {profile.targetTimelineWeeks} weeks ({Math.round(profile.targetTimelineWeeks / 4)} months)
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[6, 12, 18, 24].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => onChange({ ...profile, targetTimelineWeeks: w })}
                    className={`py-1 text-xs font-medium rounded-lg border transition-colors ${
                      profile.targetTimelineWeeks === w
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {w}w
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Skills, Voice Narrative, and Résumé text */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills Management */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Current Skills & Core Competencies
                </h3>
                <p className="text-xs text-slate-500">
                  Add tools, frameworks, and domain expertise. Type and hit Enter, or click suggestions.
                </p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                {profile.skills.length} skills
              </span>
            </div>

            {/* Input & Add */}
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="e.g. Python, Agile, SQL, Figma..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleAddSkill(skillInput)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Existing Skills Chips */}
            <div className="flex flex-wrap gap-2 min-h-[42px] p-2 bg-slate-50/70 border border-slate-200 rounded-xl">
              {profile.skills.length === 0 ? (
                <span className="text-xs text-slate-400 italic flex items-center px-1">
                  No skills added yet. Add your current strengths to calculate skill gaps.
                </span>
              ) : (
                profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-800 border border-slate-300 shadow-2xs group"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove skill ${skill}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Suggested skill pool */}
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Quick add competencies:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {SUGGESTED_SKILLS.filter((s) => !profile.skills.includes(s)).slice(0, 8).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddSkill(s)}
                    className="px-2 py-0.5 text-xs rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pivot Motivation & Narrative (Dictation-Optimized) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <label 
                  htmlFor="pivotMotivation" 
                  className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"
                >
                  <Mic className="w-4 h-4 text-indigo-600" />
                  Pivot Motivation & Narrative (Voice-Friendly)
                </label>
                <p className="text-xs text-slate-500">
                  Why are you making this transition? What unique edge do you bring?
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Dictate via Desktop App
              </span>
            </div>

            {/* Honest spoken cue instructions */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                How to Dictate with Wispr Flow:
              </div>
              <p className="text-slate-600">
                1) Click inside the box below to focus your cursor. 2) Press your Wispr Flow desktop hotkey. 3) Speak aloud—Wispr Flow simulates keyboard typing directly into this field.
              </p>
              <p className="text-slate-500 italic">
                Suggested phrase: &ldquo;I have spent the last few years leading engineering delivery, and now I want to pivot into AI Product Management because...&rdquo;
              </p>
            </div>

            <textarea
              id="pivotMotivation"
              rows={3}
              value={profile.pivotMotivation}
              onChange={(e) => onChange({ ...profile, pivotMotivation: e.target.value })}
              placeholder="Dictate or type your pivot story..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 leading-relaxed transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden"
            />
          </div>

          {/* Résumé Text Intake Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label 
                  htmlFor="resumeText" 
                  className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Candidate Résumé / CV Text *
                </label>
                <p className="text-xs text-slate-500">
                  Paste your full résumé text or dictate bullet points using Wispr Flow.
                </p>
              </div>

              {/* Utility shortcuts */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleLoadSampleResume}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Fill with sample technical resume"
                >
                  Sample Résumé
                </button>
                <button
                  type="button"
                  onClick={handlePasteResumeFromClipboard}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Paste
                </button>
                {profile.resumeText && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...profile, resumeText: '' })}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Clear résumé text"
                    aria-label="Clear résumé"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Dictation-ready textarea */}
            <div className="relative">
              <textarea
                id="resumeText"
                rows={11}
                value={profile.resumeText}
                onChange={(e) => onChange({ ...profile, resumeText: e.target.value })}
                onBlur={() => handleBlur('resumeText')}
                placeholder="Paste your résumé text here or click to dictate experiences using Wispr Flow...

Example format:
- Summary & Target Direction
- Work Experience & Impact Metrics
- Education & Technical Certifications"
                className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 font-mono text-[13px] leading-relaxed transition-all focus:outline-hidden focus:ring-2 ${
                  touched.resumeText && errors.resumeText
                    ? 'border-amber-400 focus:ring-amber-400/50 bg-amber-50/10'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30 bg-white'
                }`}
              />
            </div>

            {/* Validation & Stats footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2 pt-1 border-t border-slate-100">
              <div className="text-slate-500">
                {touched.resumeText && errors.resumeText ? (
                  <span className="text-amber-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.resumeText}
                  </span>
                ) : (
                  <span>
                    Ready for Milestone 2 Gemini parsing. Résumé details ground the skill-gap model.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-slate-500 font-medium shrink-0">
                <span>{profile.resumeText.length} chars</span>
                <span>•</span>
                <span className={resumeWordCount >= 50 ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                  {resumeWordCount} words {resumeWordCount >= 50 && '✓'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600 text-center sm:text-left">
              <span className="font-semibold text-slate-800">Browser Storage:</span> Changes are kept locally across reloads.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {copiedNotification && (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved locally!
                </span>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
