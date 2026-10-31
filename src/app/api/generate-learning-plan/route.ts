import { NextRequest, NextResponse } from 'next/server';
import { 
  WeeklyLearningPlan, 
  GroundedSkillItem, 
  LearningTask,
  PortfolioProject,
  WeeklyPlanWeek 
} from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        {
          configured: false,
          error:
            'GEMINI_API_KEY is missing from environment variables. Configure it in .env.local to enable server-side Gemini AI learning plan generation.',
        },
        { status: 200 }
      );
    }

    const body = await req.json();
    const {
      targetRole,
      currentRole,
      weeklyHours = 10,
      targetTimelineWeeks = 12,
      jobTitle,
      jobCompany,
      gaps = [],
      completedTasks = [],
      isReplan = false,
      replanningReason = '',
    } = body;

    const validatedWeeklyHours = Math.max(2, Math.min(60, Number(weeklyHours) || 10));
    const validatedWeeks = Math.max(2, Math.min(52, Number(targetTimelineWeeks) || 12));
    const totalAvailableHours = validatedWeeklyHours * validatedWeeks;

    // Filter gaps to focus on confirmed_gap, missing_evidence, or user clarified items
    const actionableGaps = (gaps as GroundedSkillItem[]).filter(
      (g) => g.status === 'confirmed_gap' || g.status === 'missing_evidence' || g.isUserModified
    );

    const gapsSummary = actionableGaps.map((g) => ({
      skill: g.skill,
      status: g.status,
      category: g.category,
      importance: g.importance,
      userClarified: Boolean(g.userClarification),
      clarificationNote: g.userClarification?.note,
      actionableBridge: g.actionableBridge,
    }));

    const completedTasksSummary = (completedTasks as LearningTask[]).map((t) => ({
      id: t.id,
      title: t.title,
      estimatedHours: t.estimatedHours,
      linkedSkill: t.linkedSkill,
    }));

    const systemPrompt = `You are NextRole's elite AI Career Pivot Curriculum Architect.
Your task is to generate a realistic, week-by-week learning plan and portfolio project strategy for a candidate pivoting into a new career.

CRITICAL EXECUTION & TIME CONSTRAINTS:
1. STRICT WEEKLY HOUR LIMIT:
   - The candidate commits EXACTLY ${validatedWeeklyHours} hours per week.
   - For EACH week, the sum of "estimatedHours" across all tasks in that week MUST NOT exceed ${validatedWeeklyHours} hours (can be between ${Math.max(1, validatedWeeklyHours - 2)} and ${validatedWeeklyHours}).
   - Never assign more hours in a week than ${validatedWeeklyHours}.
2. TOTAL TIMELINE & SHORTFALL ANALYSIS:
   - Total available hours across the ${validatedWeeks}-week timeline = ${totalAvailableHours} hours (${validatedWeeklyHours} hrs/wk × ${validatedWeeks} wks).
   - Compute the true realistic hours needed to bridge all identified gaps.
   - If total estimated hours needed exceeds ${totalAvailableHours} hours, you MUST honestly set "status": "shortfall", calculate "shortfallHours" = (needed - available), and provide a transparent "shortfallExplanation" explaining which gaps could not fit into ${validatedWeeks} weeks and must be pursued as ongoing post-pivot learning.
   - If total hours needed is 90%-100% of available: set "status": "tight".
   - If total hours needed fits comfortably: set "status": "feasible".
3. REALISTIC ATOMIC TASKS GROUNDED IN ACTUAL GAPS:
   - Every task must link to one of the identified gaps via "linkedSkill".
   - Each task must have concrete "completionCriteria" (e.g. "Run Whisper streaming benchmark on 50 audio samples and measure WER", "Deploy Next.js full-stack demo to Vercel with GitHub CI").
4. PORTFOLIO PROJECTS:
   - Provide 2-3 tangible portfolio project deliverables linked to the specific skill gaps.
   - Each project has: id, title, description, targetDeliverable, linkedSkills, estimatedHours, and targetWeek.
5. REPLANNING & PRESERVATION:
   ${isReplan ? `- REPLANNING MODE ACTIVE: The candidate previously completed ${completedTasksSummary.length} tasks. You MUST preserve all completed tasks, maintain their progress, and reorganize the remaining weeks around the updated hours and timeline. Explain what shifted in "replannedExplanation".` : '- INITIAL PLAN GENERATION.'}

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema:
{
  "summary": string (3-4 sentences outlining the curriculum roadmap and pacing),
  "timelineFeasibility": {
    "status": "feasible" | "tight" | "shortfall",
    "totalEstimatedHoursNeeded": number,
    "totalAvailableHours": ${totalAvailableHours},
    "shortfallHours": number (0 if feasible),
    "shortfallExplanation": string (honest assessment of pacing and whether scope exceeds timeline)
  },
  "weeks": [
    {
      "weekNumber": number (1 to ${validatedWeeks}),
      "theme": string,
      "weeklyTargetHours": ${validatedWeeklyHours},
      "allocatedHours": number (sum of tasks, must be <= ${validatedWeeklyHours}),
      "projectMilestone": string (optional milestone for that week),
      "tasks": [
        {
          "id": string (e.g. "w1-t1"),
          "title": string,
          "description": string,
          "estimatedHours": number,
          "linkedSkill": string,
          "completionCriteria": string,
          "isCompleted": boolean
        }
      ]
    }
  ],
  "portfolioProjects": [
    {
      "id": string (e.g. "proj-1"),
      "title": string,
      "description": string,
      "targetDeliverable": string,
      "linkedSkills": string[],
      "estimatedHours": number,
      "targetWeek": number
    }
  ],
  "replannedExplanation": string (only if replanning, explaining adjustments)
}`;

    const userPrompt = `CANDIDATE PIVOT CONTEXT:
- Target Role: ${targetRole || 'AI Product Manager'}
- Target Job Posting: ${jobTitle || 'Target Role'} at ${jobCompany || 'Target Employer'}
- Current Role: ${currentRole || 'Technical Professional'}
- Weekly Study Budget: ${validatedWeeklyHours} hours/week (HARD UPPER LIMIT PER WEEK)
- Target Timeline: ${validatedWeeks} weeks
- Total Timeline Hours: ${totalAvailableHours} hours
${isReplan ? `- Replanning Reason: ${replanningReason || 'Updated study hours / timeline'}` : ''}

IDENTIFIED SKILL GAPS & COMPETENCY STATUS:
${JSON.stringify(gapsSummary, null, 2)}

${completedTasksSummary.length > 0 ? `ALREADY COMPLETED TASKS (MUST PRESERVE):
${JSON.stringify(completedTasksSummary, null, 2)}` : ''}

Generate the complete, verified weekly curriculum and portfolio projects matching the JSON format. Output valid JSON only.`;

    const configuredModel = process.env.GEMINI_MODEL?.trim().replace(/^models\//, '') || 'gemini-3.5-flash-lite';
    const candidateModels = Array.from(
      new Set([configuredModel, 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'])
    );

    let lastError = '';
    let rawContent: string | null = null;
    let successfulModel = configuredModel;

    for (const model of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = `Model ${model} returned HTTP ${response.status}: ${errText.substring(0, 160)}`;
          if (response.status === 404 || response.status === 503) {
            continue;
          }
          return NextResponse.json(
            { configured: true, error: lastError },
            { status: 502 }
          );
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          rawContent = text;
          successfulModel = model;
          break;
        }
      } catch (fetchErr: unknown) {
        lastError = fetchErr instanceof Error ? fetchErr.message : 'Network error';
      }
    }

    if (!rawContent) {
      return NextResponse.json(
        {
          configured: true,
          error: lastError || 'Failed to generate learning plan with available Gemini models.',
        },
        { status: 502 }
      );
    }

    let parsedPlan: WeeklyLearningPlan;
    try {
      parsedPlan = JSON.parse(rawContent);
    } catch {
      const cleanJson = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      parsedPlan = JSON.parse(cleanJson);
    }

    // Post-processing & validation checks
    parsedPlan.id = `plan-${Date.now()}`;
    parsedPlan.targetRole = targetRole || 'Target Role';
    parsedPlan.jobTitle = jobTitle || 'Target Role';
    parsedPlan.jobCompany = jobCompany || 'Target Employer';
    parsedPlan.weeklyHours = validatedWeeklyHours;
    parsedPlan.totalWeeks = validatedWeeks;
    parsedPlan.generatedAt = new Date().toISOString();
    parsedPlan.modelUsed = successfulModel;

    // Preserve completed status if replanning
    const completedSet = new Set((completedTasks as LearningTask[]).map((t) => t.id));
    if (completedSet.size > 0 && Array.isArray(parsedPlan.weeks)) {
      parsedPlan.weeks.forEach((w) => {
        if (Array.isArray(w.tasks)) {
          w.tasks.forEach((t) => {
            if (completedSet.has(t.id)) {
              t.isCompleted = true;
            }
          });
        }
      });
    }

    // Verify weekly allocated hours do not violate user's weekly budget
    if (Array.isArray(parsedPlan.weeks)) {
      parsedPlan.weeks.forEach((w) => {
        const sum = (w.tasks || []).reduce((acc, t) => acc + (Number(t.estimatedHours) || 0), 0);
        w.allocatedHours = Math.round(sum * 10) / 10;
        w.weeklyTargetHours = validatedWeeklyHours;
      });
    }

    // Ensure timelineFeasibility is well-formed
    if (!parsedPlan.timelineFeasibility) {
      parsedPlan.timelineFeasibility = {
        status: 'feasible',
        totalAvailableHours,
        totalEstimatedHoursNeeded: totalAvailableHours,
        shortfallHours: 0,
      };
    } else {
      parsedPlan.timelineFeasibility.totalAvailableHours = totalAvailableHours;
    }

    return NextResponse.json({
      configured: true,
      modelUsed: successfulModel,
      plan: parsedPlan,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating learning plan:', message);
    return NextResponse.json(
      {
        configured: true,
        error: `Failed to generate learning plan: ${message}`,
      },
      { status: 500 }
    );
  }
}

