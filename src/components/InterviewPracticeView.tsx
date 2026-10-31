'use client';

import React, { useState, useEffect } from 'react';
import {
  Headphones,
  Mic,
  Award,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  BookOpen,
  History,
  Trash2,
  Quote,
  Target,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Check
} from 'lucide-react';
import { 
  JobDescription, 
  InterviewQuestion, 
  InterviewEvaluation, 
  WorkspaceTab 
} from '@/types';
import { 
  getStoredSkillGapAnalysis,
  getStoredInterviewHistory,
  saveStoredInterviewHistory,
  clearStoredInterviewHistory,
  getStoredInterviewQuestions,
  saveStoredInterviewQuestions,
  incorporateWeaknessIntoPlan 
} from '@/lib/storage';

interface InterviewPracticeViewProps {
  activeJob?: JobDescription;
  onOpenWisprGuide: () => void;
  onNavigateToTab?: (tab: WorkspaceTab) => void;
  onShowToast?: (message: string) => void;
}

export default function InterviewPracticeView({
  activeJob,
  onOpenWisprGuide,
  onNavigateToTab,
  onShowToast,
}: InterviewPracticeViewProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<InterviewEvaluation | null>(null);
  const [history, setHistory] = useState<InterviewEvaluation[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [showHistory, setShowHistory] = useState(false);
  const [incorporatedSuccess, setIncorporatedSuccess] = useState(false);

  // Load questions and history on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const storedHistory = getStoredInterviewHistory();
      setHistory(storedHistory);

      const storedQuestions = getStoredInterviewQuestions();
      if (storedQuestions.length > 0) {
        setQuestions(storedQuestions);
        setSelectedQuestion(storedQuestions[0]);
      } else {
        // Fallback grounded sample questions based on active job or default
        const defaultQuestions: InterviewQuestion[] = [
          {
            id: 'q-demo-1',
            question: 'How would you measure and improve transcription latency and Word Error Rate (WER) in a streaming speech-to-text desktop dictation pipeline?',
            category: 'technical_depth',
            targetSkillOrGap: 'Whisper & Speech-to-Text Architecture',
            contextPrompt: 'Hiring managers test whether you understand the fundamental trade-offs between model parameter size, audio chunking windows, and acoustic latency.',
            difficulty: 'intermediate',
          },
          {
            id: 'q-demo-2',
            question: 'Tell me about a time you had to pivot a technical product roadmap when core engineering feasibility diverged from the user experience vision.',
            category: 'behavioral_star',
            targetSkillOrGap: 'Technical Product Management & Roadmapping',
            contextPrompt: 'Evaluates your ability to balance developer empathy and technical constraints using the STAR format.',
            difficulty: 'intermediate',
          },
          {
            id: 'q-demo-3',
            question: 'When designing a voice-first dictation UI, how do you handle transcription uncertainty and low-confidence phrase suggestions without breaking user flow?',
            category: 'system_architecture',
            targetSkillOrGap: 'Voice UI/UX & Acoustic Error Handling',
            contextPrompt: 'Evaluates whether you treat AI as an interactive human-in-the-loop experience rather than a black-box text dump.',
            difficulty: 'advanced',
          },
        ];
        setQuestions(defaultQuestions);
        setSelectedQuestion(defaultQuestions[0]);
        saveStoredInterviewQuestions(defaultQuestions);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    setApiError(null);

    const gapAnalysis = getStoredSkillGapAnalysis();

    try {
      const res = await fetch('/api/generate-interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: activeJob?.title || 'AI Product Manager',
          jobTitle: activeJob?.title || 'Senior AI Product Manager',
          jobCompany: activeJob?.company || 'Wispr Flow Technologies',
          jobRawText: activeJob?.rawText || '',
          gaps: gapAnalysis?.competencies || [],
        }),
      });

      const data = await res.json();

      if (!data.configured) {
        setIsConfigured(false);
        setApiError(data.error);
        setIsGeneratingQuestions(false);
        return;
      }

      if (!res.ok || data.error) {
        setApiError(data.error || 'Failed to generate interview questions.');
        setIsGeneratingQuestions(false);
        return;
      }

      setIsConfigured(true);
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
        setSelectedQuestion(data.questions[0]);
        saveStoredInterviewQuestions(data.questions);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setApiError(`Could not reach interview question generator: ${msg}`);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!selectedQuestion || !userAnswer.trim()) return;

    setIsEvaluating(true);
    setApiError(null);
    setIncorporatedSuccess(false);

    try {
      const res = await fetch('/api/evaluate-interview-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          question: selectedQuestion.question,
          targetSkillOrGap: selectedQuestion.targetSkillOrGap,
          userAnswer: userAnswer.trim(),
          jobTitle: activeJob?.title || 'Target Role',
          jobCompany: activeJob?.company || 'Target Employer',
        }),
      });

      const data = await res.json();

      if (!data.configured) {
        setIsConfigured(false);
        setApiError(data.error);
        setIsEvaluating(false);
        return;
      }

      if (!res.ok || data.error) {
        setApiError(data.error || 'Failed to evaluate interview answer.');
        setIsEvaluating(false);
        return;
      }

      setIsConfigured(true);
      const evalResult: InterviewEvaluation = data.evaluation;
      setCurrentEvaluation(evalResult);

      const updatedHistory = [evalResult, ...history];
      setHistory(updatedHistory);
      saveStoredInterviewHistory(updatedHistory);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setApiError(`Could not reach answer evaluation API: ${msg}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleIncorporateWeakness = () => {
    if (!currentEvaluation) return;

    const taskTitle = currentEvaluation.suggestedTaskTitle || `Bridge weakness in ${currentEvaluation.targetSkillOrGap}`;
    const result = incorporateWeaknessIntoPlan({
      title: taskTitle,
      linkedSkill: currentEvaluation.targetSkillOrGap,
      estimatedHours: currentEvaluation.suggestedTaskHours || 3,
      completionCriteria: `Draft STAR interview answer addressing: "${currentEvaluation.identifiedWeaknesses[0] || 'Domain metrics and failure modes'}" with verifiable deliverables.`,
    });

    if (result) {
      setIncorporatedSuccess(true);
      const updatedEval = { ...currentEvaluation, isIncorporatedIntoPlan: true };
      setCurrentEvaluation(updatedEval);

      const updatedHistory = history.map((item) =>
        item.id === currentEvaluation.id ? updatedEval : item
      );
      setHistory(updatedHistory);
      saveStoredInterviewHistory(updatedHistory);

      if (onShowToast) {
        onShowToast('Interview weakness incorporated into your Weekly Learning Plan!');
      }
    }
  };

  const handleClearHistory = () => {
    clearStoredInterviewHistory();
    setHistory([]);
    setCurrentEvaluation(null);
  };

  const wordCount = userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md border border-purple-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30">
                <Headphones className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                Voice Interview Studio & Rubric Evaluation
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Gemini AI Engine
              </span>
            </div>
            <p className="text-sm text-purple-200">
              Dictate realistic answers using Wispr Flow and receive rigorous, quote-backed rubric evaluations grounded in employer requirements.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onOpenWisprGuide}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/30 transition-colors flex items-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Wispr Dictation Workflow</span>
            </button>

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                <span>History ({history.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Honest Boundary Notice: Content Evaluation vs Audio Acoustics */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4.5 text-indigo-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-xs text-indigo-950 uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-indigo-600" />
          <span>Evaluation Boundary & Dictation Honesty</span>
        </div>
        <p className="text-xs text-indigo-900 leading-relaxed">
          <strong>Wispr Flow Workflow:</strong> Focus the answer input below, activate your Wispr Flow desktop app, and speak naturally. Wispr Flow converts your voice into text and injects it directly into the input field.
          <br />
          <strong>AI Rubric Boundary:</strong> NextRole evaluates the <em>textual transcript, domain reasoning, and structured arguments</em> of your response. NextRole <strong>does not</strong> evaluate vocal pitch, audio fidelity, confidence levels, or pronunciation from a transcript.
        </p>
      </div>

      {/* API Configuration & Error Banners */}
      {!isConfigured && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>Gemini API Key Required on Server</span>
          </div>
          <p className="text-xs text-amber-900">
            Configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code> in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env.local</code> to enable server-side interview question generation and answer evaluation.
          </p>
        </div>
      )}

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-950 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-red-900">Interview Studio Error</p>
            <p className="text-xs text-red-700">{apiError}</p>
          </div>
        </div>
      )}

      {/* Interview Question Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              Target Interview Questions
            </h3>
            <p className="text-xs text-slate-500">
              Grounded in {activeJob ? `"${activeJob.title}" at ${activeJob.company}` : 'your target role and identified skill gaps'}.
            </p>
          </div>

          <button
            type="button"
            disabled={isGeneratingQuestions}
            onClick={handleGenerateQuestions}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors shrink-0"
          >
            {isGeneratingQuestions ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating from Job Gaps...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Refresh Grounded Questions</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {questions.map((q) => {
            const isSelected = selectedQuestion?.id === q.id;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setSelectedQuestion(q);
                  setCurrentEvaluation(null);
                  setIncorporatedSuccess(false);
                }}
                className={`p-4 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {q.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-600">
                      Grounded in: {q.targetSkillOrGap}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 capitalize">
                    {q.difficulty}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 leading-snug">
                  {q.question}
                </p>
                {q.contextPrompt && (
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    Interviewer Context: {q.contextPrompt}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Answer Studio & Wispr Dictation Target */}
      {selectedQuestion && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                Dictation Target Box
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Your Spoken Answer (Editable)
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="font-mono">{wordCount} words</span>
              <button
                type="button"
                onClick={() => setUserAnswer('')}
                className="text-slate-400 hover:text-slate-700"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              rows={6}
              placeholder="Click here and speak through Wispr Flow, or type your answer. Structure your response with context, technical mechanisms (e.g. WER benchmarking, latency trade-offs), and quantifiable outcomes..."
              className="w-full text-xs p-4 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-slate-900 leading-relaxed font-sans placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Mic className="w-3.5 h-3.5 text-purple-600" />
              <span>Tip: Wispr Flow types directly into the focused field above. Review and edit before evaluating.</span>
            </div>

            <button
              type="button"
              disabled={isEvaluating || userAnswer.trim().length < 20}
              onClick={handleEvaluateAnswer}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all shrink-0"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scoring Against Rubric with Gemini...</span>
                </>
              ) : (
                <>
                  <Award className="w-3.5 h-3.5" />
                  <span>Evaluate with Gemini Rubric</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Visible Scoring Rubric Framework */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
          <Award className="w-4 h-4 text-indigo-600" />
          Transparent 4-Dimension Evaluation Rubric
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block text-[11px]">1. Problem Framing</span>
            <p className="text-[11px] text-slate-600 leading-snug">
              STAR method structure, premise definition, and trade-off analysis.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block text-[11px]">2. Technical Grounding</span>
            <p className="text-[11px] text-slate-600 leading-snug">
              Accuracy in speech AI, latency budgets, API specs, and model architectures.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block text-[11px]">3. Concrete Evidence</span>
            <p className="text-[11px] text-slate-600 leading-snug">
              Quantifiable metrics (WER, ms latency), real tools, and failure analysis.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block text-[11px]">4. Role Alignment</span>
            <p className="text-[11px] text-slate-600 leading-snug">
              Communicating from the perspective and strategic priorities of the target role.
            </p>
          </div>
        </div>
      </div>

      {/* Evaluation Results Card */}
      {currentEvaluation && (
        <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in">
          {/* Header Score Overview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                Evaluation Output
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Calibrated Rubric Score & Answer Breakdown
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated by {currentEvaluation.modelUsed || 'Gemini AI'} on {new Date(currentEvaluation.evaluatedAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 text-center">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">Score</span>
                <span className="text-xl font-black text-purple-900">
                  {currentEvaluation.overallScore.toFixed(1)} / 5.0
                </span>
              </div>
            </div>
          </div>

          {/* Actionable Feedback Summary */}
          {currentEvaluation.actionableFeedback && (
            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1 text-xs">
              <span className="font-bold text-purple-950 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Coach Summary & Answer Polish:
              </span>
              <p className="text-purple-900 leading-relaxed">
                {currentEvaluation.actionableFeedback}
              </p>
            </div>
          )}

          {/* Rubric Breakdown Grid with Cited Quotes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Dimension Scores & Cited Answer Proof
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentEvaluation.rubricScores.map((dim, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{dim.dimension}</span>
                    <span className="px-2 py-0.5 font-bold rounded-md bg-white border border-slate-200 text-purple-700">
                      {dim.score} / {dim.maxScore}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-snug text-[11px]">
                    {dim.feedback}
                  </p>

                  {dim.supportingAnswerQuotes && dim.supportingAnswerQuotes.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-200/60">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                        <Quote className="w-2.5 h-2.5 text-indigo-500" /> Supporting Answer Quote:
                      </span>
                      <p className="text-[11px] italic text-slate-700 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                        &ldquo;{dim.supportingAnswerQuotes[0]}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <span className="font-bold text-emerald-950 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Key Demonstrated Strengths:
              </span>
              <ul className="space-y-1 text-emerald-900">
                {currentEvaluation.keyStrengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
              <span className="font-bold text-amber-950 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                Identified Weaknesses to Bridge:
              </span>
              <ul className="space-y-1 text-amber-900">
                {currentEvaluation.identifiedWeaknesses.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-700 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Incorporate Weakness into Learning Plan Bridge */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-300" />
                <span className="font-bold text-sm">
                  Incorporate Weakness into Remaining Learning Plan
                </span>
              </div>
              <p className="text-xs text-purple-200">
                Suggested Bridge Task: <strong>&ldquo;{currentEvaluation.suggestedTaskTitle}&rdquo;</strong> (~{currentEvaluation.suggestedTaskHours} hrs)
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentEvaluation.isIncorporatedIntoPlan || incorporatedSuccess ? (
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Added to Learning Plan</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleIncorporateWeakness}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-purple-50 text-xs font-bold transition-all shadow-sm"
                >
                  <span>Add Task to Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('learning-plan')}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/10 transition-colors"
                >
                  View Plan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Historical Evaluations Drawer */}
      {showHistory && history.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              Saved Interview Session History ({history.length})
            </h3>
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {history.map((item) => (
              <div key={item.id} className="py-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{item.question}</span>
                  <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    {item.overallScore.toFixed(1)} / 5.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                  &ldquo;{item.userAnswer}&rdquo;
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Probing: {item.targetSkillOrGap}</span>
                  <span>{new Date(item.evaluatedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
