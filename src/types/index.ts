export interface UserProfile {
  targetRole: string;
  currentRole: string;
  yearsOfExperience: number;
  skills: string[];
  weeklyHours: number;
  targetTimelineWeeks: number;
  pivotMotivation: string;
  resumeText: string;
  lastUpdated?: string;
}

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  sourceUrl: string;
  targetTier: 'dream' | 'target' | 'safety';
  rawText: string;
  dateAdded: string;
  isActiveTarget: boolean;
}

export type WorkspaceTab = 
  | 'profile'
  | 'job-intake'
  | 'skill-gaps'
  | 'learning-plan'
  | 'interview-practice'
  | 'applications';

export interface ValidationErrors {
  targetRole?: string;
  weeklyHours?: string;
  resumeText?: string;
  jobTitle?: string;
  jobCompany?: string;
  jobSourceUrl?: string;
  jobRawText?: string;
}

export type ApplicationStatus = 
  | 'wishlist' 
  | 'applied' 
  | 'screening' 
  | 'interviewing' 
  | 'offer' 
  | 'rejected';

export type RejectionStage = 
  | 'resume_screen' 
  | 'technical_round' 
  | 'hiring_manager' 
  | 'onsite' 
  | 'ghosted_no_response' 
  | 'other';

export interface ApplicationItem {
  id: string;
  company: string;
  role: string;
  roleCategory: string; // e.g., 'AI Product Management', 'Technical PM', 'Software Engineering'
  sourceUrl?: string;
  status: ApplicationStatus;
  appliedDate?: string;
  notes?: string;
  rejectionStage?: RejectionStage;
  rejectionFeedback?: string;
  targetTier?: 'dream' | 'target' | 'safety';
  lastUpdated?: string;
}

export interface ApplicationPatternInsight {
  category: string;
  totalCount: number;
  positiveResponses: number; // interviewing + offer
  explicitRejections: number; // rejected
  pendingCount: number; // wishlist + applied + screening
  responseRatePercent: number | null; // calculated from resolved or applied
  sampleSizeLabel: string;
  confidenceDisclaimer: string;
  observedPattern: string;
  suggestedAction?: {
    id: string;
    title: string;
    description: string;
    actionType: 'add_learning_task' | 'refine_resume' | 'pivot_tier';
    suggestedSkill?: string;
    suggestedHours?: number;
  };
}

export type SkillStatus = 
  | 'confirmed_gap' 
  | 'missing_evidence' 
  | 'matched_strength' 
  | 'transferable_strength';

export interface UserClarification {
  type: 'confirmed_gap' | 'added_evidence';
  note: string;
  updatedAt: string;
}

export interface GroundedSkillItem {
  id: string;
  skill: string;
  category: 'technical' | 'domain' | 'leadership' | 'tooling';
  importance: 'required' | 'preferred' | 'bonus';
  status: SkillStatus;
  supportingJobEvidence: string;
  resumeEvidence: string;
  gapReasoning: string;
  actionableBridge: string;
  userClarification?: UserClarification;
  isUserModified?: boolean;
}

export interface SkillGapAnalysisResult {
  jobTitle: string;
  jobCompany: string;
  analyzedAt: string;
  modelUsed?: string;
  inputSignature?: string;
  overallAssessment: string;
  readinessLevel: 'High Pivot Readiness' | 'Moderate Gap - Needs Bridge Projects' | 'Significant Gap - Foundation Required';
  competencies: GroundedSkillItem[];
  topPriorityGaps: string[];
  transferableSuperpowers: string[];
}

export interface LearningTask {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  linkedSkill: string;
  completionCriteria: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  targetDeliverable: string;
  linkedSkills: string[];
  estimatedHours: number;
  targetWeek: number;
}

export interface WeeklyPlanWeek {
  weekNumber: number;
  theme: string;
  weeklyTargetHours: number;
  allocatedHours: number;
  tasks: LearningTask[];
  projectMilestone?: string;
}

export interface TimelineFeasibility {
  status: 'feasible' | 'tight' | 'shortfall';
  totalEstimatedHoursNeeded: number;
  totalAvailableHours: number;
  shortfallHours?: number;
  shortfallExplanation?: string;
}

export interface WeeklyLearningPlan {
  id: string;
  targetRole: string;
  jobTitle: string;
  jobCompany: string;
  weeklyHours: number;
  totalWeeks: number;
  generatedAt: string;
  modelUsed?: string;
  summary: string;
  timelineFeasibility: TimelineFeasibility;
  weeks: WeeklyPlanWeek[];
  portfolioProjects: PortfolioProject[];
  replannedExplanation?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'technical_depth' | 'system_architecture' | 'behavioral_star' | 'role_alignment';
  targetSkillOrGap: string;
  contextPrompt: string;
  difficulty: 'introductory' | 'intermediate' | 'advanced';
}

export interface RubricDimensionScore {
  dimension: string;
  score: number; // 1-5
  maxScore: number; // 5
  feedback: string;
  supportingAnswerQuotes: string[];
}

export interface InterviewEvaluation {
  id: string;
  questionId: string;
  question: string;
  targetSkillOrGap: string;
  userAnswer: string;
  evaluatedAt: string;
  modelUsed?: string;
  overallScore: number; // 1 to 5
  rubricScores: RubricDimensionScore[];
  keyStrengths: string[];
  identifiedWeaknesses: string[];
  actionableFeedback: string;
  suggestedTaskTitle: string;
  suggestedTaskHours: number;
  isIncorporatedIntoPlan?: boolean;
}
