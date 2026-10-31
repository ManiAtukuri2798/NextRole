import { 
  UserProfile, 
  JobDescription, 
  ApplicationItem, 
  SkillGapAnalysisResult,
  WeeklyLearningPlan,
  InterviewEvaluation,
  InterviewQuestion 
} from '@/types';

export const STORAGE_KEYS = {
  PROFILE: 'nextrole_user_profile_v1',
  JOB_DESCRIPTIONS: 'nextrole_job_descriptions_v1',
  APPLICATIONS: 'nextrole_applications_v1',
  SKILL_GAPS: 'nextrole_skill_gaps_cache_v1',
  LEARNING_PLAN: 'nextrole_learning_plan_v1',
  INTERVIEW_HISTORY: 'nextrole_interview_history_v1',
  INTERVIEW_QUESTIONS: 'nextrole_interview_questions_v1',
  LAST_TAB: 'nextrole_active_tab_v1',
};

export const DEFAULT_PROFILE: UserProfile = {
  targetRole: '',
  currentRole: '',
  yearsOfExperience: 3,
  skills: [],
  weeklyHours: 10,
  targetTimelineWeeks: 12,
  pivotMotivation: '',
  resumeText: '',
  lastUpdated: new Date().toISOString(),
};

export const DEMO_PROFILE: UserProfile = {
  targetRole: 'AI Product Manager',
  currentRole: 'Senior Technical Project Manager',
  yearsOfExperience: 5,
  skills: [
    'Agile & Scrum',
    'Stakeholder Management',
    'Roadmapping',
    'Python Basics',
    'SQL & Data Analysis',
    'User Research',
    'System Architecture',
  ],
  weeklyHours: 12,
  targetTimelineWeeks: 12,
  pivotMotivation:
    'Transition from project delivery to leading voice AI & multimodal product experiences. Seeking roles integrating LLMs and audio workflows.',
  resumeText: `Alex Morgan - Technical Project Manager
Summary:
Results-driven PM with 5+ years driving cross-functional engineering initiatives across B2B SaaS and enterprise workflows. Adept at agile sprint planning, developer empathy, API specifications, and customer-facing delivery. Currently upskilling in LLM evaluation, prompt engineering, and voice AI UX.

Experience:
Senior Project Manager | CloudSync Technologies (2022 - Present)
- Led team of 14 engineers & designers deploying enterprise integrations.
- Coordinated migration of legacy REST services to GraphQL, reducing response latency by 28%.
- Partnered with product leaders to translate customer feedback into technical roadmaps.

Technical Coordinator | DataStream Systems (2019 - 2022)
- Managed sprint execution across 3 agile teams delivering real-time telemetry dashboards.
- Authored technical specs and ran SQL analytics for quarterly release retrospectives.

Education & Skills:
- B.S. in Information Systems, State University
- Skills: Scrum, Jira, SQL, Python, System Design, Wireframing, User Testing`,
  lastUpdated: new Date().toISOString(),
};

export const DEMO_JOBS: JobDescription[] = [
  {
    id: 'demo-jd-1',
    title: 'Senior AI Product Manager, Voice Experiences',
    company: 'Wispr Flow Technologies',
    sourceUrl: 'https://careers.wisprflow.ai/roles/sr-ai-pm-voice',
    targetTier: 'dream',
    isActiveTarget: true,
    dateAdded: new Date().toISOString(),
    rawText: `Wispr Flow is seeking a Senior AI Product Manager to pioneer voice-first desktop interactions.

Responsibilities:
- Define product strategy and roadmap for real-time speech dictation and contextual agent workflows.
- Partner closely with ML research engineers on acoustic model fine-tuning, latency optimization, and streaming transcription accuracy.
- Design seamless multimodal user experiences that blend keyboard shortcuts, hands-free voice commanding, and desktop application injection.
- Establish product metrics for dictation acceptance rate, word error rate (WER), and user retention.

Requirements:
- 4+ years of Product Management experience in AI/ML, developer tools, or productivity platforms.
- Deep understanding of modern foundation models (LLMs, Whisper, speech-to-text models).
- Strong technical background: ability to read API specs, write product PRDs, and evaluate AI evaluation benchmarks.
- Passion for frictionless human-computer interaction and voice interfaces.`,
  },
];

export const DEMO_APPLICATIONS: ApplicationItem[] = [
  {
    id: 'app-1',
    company: 'Wispr Flow Technologies',
    role: 'Senior AI Product Manager, Voice Experiences',
    roleCategory: 'AI Product Management',
    sourceUrl: 'https://careers.wisprflow.ai/roles/sr-ai-pm-voice',
    status: 'interviewing',
    appliedDate: '2026-10-18',
    targetTier: 'dream',
    notes: 'Recruiter screen passed. Technical discussion scheduled on Whisper WER evaluation and voice UX workflows.',
  },
  {
    id: 'app-2',
    company: 'ElevenLabs',
    role: 'Product Manager, Speech Synthesis & Conversational AI',
    roleCategory: 'AI Product Management',
    sourceUrl: 'https://elevenlabs.io/careers/pm-speech',
    status: 'screening',
    appliedDate: '2026-10-24',
    targetTier: 'dream',
    notes: 'Applied with tailored resume highlighting audio AI benchmarking and Python basics.',
  },
  {
    id: 'app-3',
    company: 'Stripe',
    role: 'Technical Product Manager, Developer Platforms',
    roleCategory: 'Technical Product Management',
    sourceUrl: 'https://stripe.com/jobs/tpm-dev-plat',
    status: 'offer',
    appliedDate: '2026-09-15',
    targetTier: 'target',
    notes: 'Full loop completed. Strong validation of GraphQL migration and API spec delivery from current role.',
  },
  {
    id: 'app-4',
    company: 'Datadog',
    role: 'Technical Product Manager, Real-time Observability',
    roleCategory: 'Technical Product Management',
    sourceUrl: 'https://careers.datadoghq.com/tpm-telemetry',
    status: 'rejected',
    rejectionStage: 'resume_screen',
    rejectionFeedback: 'Resume lacked sufficient distributed tracing / telemetry depth on initial screen.',
    appliedDate: '2026-09-28',
    targetTier: 'target',
    notes: 'Standard resume screened out without recruiter call. Emphasized process over low-level infrastructure.',
  },
  {
    id: 'app-5',
    company: 'Scale AI',
    role: 'Enterprise AI Solutions Architect',
    roleCategory: 'AI Solutions Architecture',
    sourceUrl: 'https://scale.com/careers/solutions-arch',
    status: 'applied',
    appliedDate: '2026-10-27',
    targetTier: 'target',
    notes: 'Application submitted through referral. Pending initial review.',
  },
];

export function computeInputSignature(profile: UserProfile, job?: JobDescription): string {
  const parts = [
    profile.targetRole.trim().toLowerCase(),
    profile.resumeText.trim().length.toString(),
    job?.id || 'none',
    (job?.rawText || '').trim().length.toString(),
  ];
  return parts.join('|');
}

export function getStoredProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load profile from localStorage', err);
    return DEFAULT_PROFILE;
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEYS.PROFILE,
      JSON.stringify({ ...profile, lastUpdated: new Date().toISOString() })
    );
  } catch (err) {
    console.error('Failed to save profile to localStorage', err);
  }
}

export function getStoredJobDescriptions(): JobDescription[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.JOB_DESCRIPTIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load job descriptions from localStorage', err);
    return [];
  }
}

export function saveStoredJobDescriptions(jobs: JobDescription[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.JOB_DESCRIPTIONS, JSON.stringify(jobs));
  } catch (err) {
    console.error('Failed to save job descriptions to localStorage', err);
  }
}

export function getStoredApplications(): ApplicationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load applications from localStorage', err);
    return [];
  }
}

export function saveStoredApplications(apps: ApplicationItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
  } catch (err) {
    console.error('Failed to save applications to localStorage', err);
  }
}

export function getStoredSkillGapAnalysis(): SkillGapAnalysisResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SKILL_GAPS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load skill gap analysis from localStorage', err);
    return null;
  }
}

export function saveStoredSkillGapAnalysis(analysis: SkillGapAnalysisResult): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SKILL_GAPS, JSON.stringify(analysis));
  } catch (err) {
    console.error('Failed to save skill gap analysis to localStorage', err);
  }
}

export function clearStoredSkillGapAnalysis(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.SKILL_GAPS);
}

export function getStoredLearningPlan(): WeeklyLearningPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNING_PLAN);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load learning plan from localStorage', err);
    return null;
  }
}

export function saveStoredLearningPlan(plan: WeeklyLearningPlan): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.LEARNING_PLAN, JSON.stringify(plan));
  } catch (err) {
    console.error('Failed to save learning plan to localStorage', err);
  }
}

export function clearStoredLearningPlan(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.LEARNING_PLAN);
}

export function getStoredInterviewHistory(): InterviewEvaluation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INTERVIEW_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load interview history from localStorage', err);
    return [];
  }
}

export function saveStoredInterviewHistory(history: InterviewEvaluation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.INTERVIEW_HISTORY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to save interview history to localStorage', err);
  }
}

export function clearStoredInterviewHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.INTERVIEW_HISTORY);
}

export function getStoredInterviewQuestions(): InterviewQuestion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INTERVIEW_QUESTIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load interview questions from localStorage', err);
    return [];
  }
}

export function saveStoredInterviewQuestions(questions: InterviewQuestion[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.INTERVIEW_QUESTIONS, JSON.stringify(questions));
  } catch (err) {
    console.error('Failed to save interview questions to localStorage', err);
  }
}

/**
 * Incorporate a weakness identified in interview practice directly into the active learning plan
 */
export function incorporateWeaknessIntoPlan(taskData: {
  title: string;
  linkedSkill: string;
  estimatedHours: number;
  completionCriteria: string;
}): WeeklyLearningPlan | null {
  const plan = getStoredLearningPlan();
  if (!plan || !Array.isArray(plan.weeks) || plan.weeks.length === 0) return null;

  // Find the first week that still has incomplete tasks, or default to the second week
  let targetWeek = plan.weeks.find((w) => w.tasks.some((t) => !t.isCompleted));
  if (!targetWeek) {
    targetWeek = plan.weeks[0];
  }

  const newTask = {
    id: `interview-bridge-${Date.now()}`,
    title: taskData.title,
    description: `Bridging weakness identified in Voice Interview Practice. Target focus: ${taskData.linkedSkill}.`,
    estimatedHours: taskData.estimatedHours || 3,
    linkedSkill: taskData.linkedSkill,
    completionCriteria: taskData.completionCriteria,
    isCompleted: false,
  };

  const updatedWeeks = plan.weeks.map((week) => {
    if (week.weekNumber !== targetWeek.weekNumber) return week;
    const newTasks = [newTask, ...week.tasks];
    const newAllocated = Math.round(newTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0) * 10) / 10;
    return {
      ...week,
      tasks: newTasks,
      allocatedHours: newAllocated,
    };
  });

  const updatedPlan: WeeklyLearningPlan = {
    ...plan,
    weeks: updatedWeeks,
    replannedExplanation: `Incorporated targeted interview weakness bridge: "${taskData.title}" into Week ${targetWeek.weekNumber}.`,
  };

  saveStoredLearningPlan(updatedPlan);
  return updatedPlan;
}

export function clearAllLocalData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  localStorage.removeItem(STORAGE_KEYS.JOB_DESCRIPTIONS);
  localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
  localStorage.removeItem(STORAGE_KEYS.SKILL_GAPS);
  localStorage.removeItem(STORAGE_KEYS.LEARNING_PLAN);
  localStorage.removeItem(STORAGE_KEYS.INTERVIEW_HISTORY);
  localStorage.removeItem(STORAGE_KEYS.INTERVIEW_QUESTIONS);
}
