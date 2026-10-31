import { NextRequest, NextResponse } from 'next/server';
import { InterviewEvaluation } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        {
          configured: false,
          error:
            'GEMINI_API_KEY is missing from environment variables. Configure it in .env.local to evaluate interview answers.',
        },
        { status: 200 }
      );
    }

    const body = await req.json();
    const {
      questionId = 'q-1',
      question = '',
      targetSkillOrGap = '',
      userAnswer = '',
      jobTitle = 'Target Role',
      jobCompany = 'Target Employer',
    } = body;

    if (!userAnswer || userAnswer.trim().length < 20) {
      return NextResponse.json(
        {
          configured: true,
          error: 'Answer text is too short. Please dictate or write a substantive response (at least 2-3 sentences).',
        },
        { status: 400 }
      );
    }

    const systemPrompt = `You are NextRole's strict, objective AI Technical Interview Evaluator.
You are evaluating a candidate's transcribed spoken interview answer for a role as: ${jobTitle} at ${jobCompany}.

CRITICAL BOUNDARY AND HONESTY RULES:
1. TRANSCRIPT CONTENT EVALUATION ONLY:
   - You are evaluating the TEXTUAL CONTENT and intellectual reasoning of the candidate's response.
   - You DO NOT have access to raw acoustic audio, microphone recordings, pitch, vocal confidence, tone of voice, or pronunciation.
   - NEVER CLAIM TO EVALUATE VOCAL CONFIDENCE, AUDIO QUALITY, ACCENT, OR PRONUNCIATION. State all feedback purely in terms of verbal arguments, domain terminology, logical structure, and clarity.
2. 4-DIMENSION TRANSPARENT RUBRIC:
   Evaluate the answer against these 4 dimensions (scored 1 to 5, where 1=Poor/Absent, 3=Adequate, 5=Exemplary):
   - "Problem Framing & Structured Communication": Clear structure (e.g. STAR: Situation, Task, Action, Result, or clear premise -> tradeoff -> conclusion).
   - "Technical & Domain Grounding": Factual accuracy and technical depth on the target skill (${targetSkillOrGap}).
   - "Depth of Evidence & Concrete Metrics": Citing tangible metrics, tools, benchmarks, or real-world implementation details rather than generic buzzwords.
   - "Target Role & Gap Alignment": Addressing the specific prompt directly from the perspective of an incoming ${jobTitle}.
3. SUPPORTING ANSWER QUOTES:
   - For EACH rubric dimension, you MUST cite 1-2 exact verbatim phrases from the candidate's answer as supporting evidence for your score.
4. ACTIONABLE BRIDGE FOR WEAKNESSES:
   - Identify 1-3 specific weaknesses in the answer.
   - Synthesize a concise, concrete task ("suggestedTaskTitle") and estimated study time ("suggestedTaskHours", typically 2-6 hours) that the candidate can incorporate into their weekly learning plan to permanently bridge this weak spot.

OUTPUT FORMAT:
Return ONLY valid JSON matching:
{
  "overallScore": number (1.0 to 5.0, e.g. 3.8),
  "rubricScores": [
    {
      "dimension": "Problem Framing & Structured Communication",
      "score": number (1 to 5),
      "maxScore": 5,
      "feedback": string,
      "supportingAnswerQuotes": string[]
    },
    {
      "dimension": "Technical & Domain Grounding",
      "score": number (1 to 5),
      "maxScore": 5,
      "feedback": string,
      "supportingAnswerQuotes": string[]
    },
    {
      "dimension": "Depth of Evidence & Concrete Metrics",
      "score": number (1 to 5),
      "maxScore": 5,
      "feedback": string,
      "supportingAnswerQuotes": string[]
    },
    {
      "dimension": "Target Role & Gap Alignment",
      "score": number (1 to 5),
      "maxScore": 5,
      "feedback": string,
      "supportingAnswerQuotes": string[]
    }
  ],
  "keyStrengths": string[],
  "identifiedWeaknesses": string[],
  "actionableFeedback": string (2-3 sentences advising how to refine this answer),
  "suggestedTaskTitle": string (e.g. "Draft STAR response with Word Error Rate (WER) metrics for audio model evaluations"),
  "suggestedTaskHours": number (e.g. 3)
}`;

    const userPrompt = `INTERVIEW QUESTION:
"${question}"

TARGET SKILL / GAP BEING PROBED:
"${targetSkillOrGap}"

CANDIDATE'S TRANSCRIBED ANSWER:
"""
${userAnswer}
"""

Evaluate this transcribed answer strictly against the 4-dimension rubric. Output valid JSON only.`;

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
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = `Model ${model} returned HTTP ${response.status}: ${errText.substring(0, 160)}`;
          if (response.status === 404 || response.status === 503) continue;
          return NextResponse.json({ configured: true, error: lastError }, { status: 502 });
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
        { configured: true, error: lastError || 'Failed to evaluate interview answer.' },
        { status: 502 }
      );
    }

    let parsedResult: Omit<InterviewEvaluation, 'id' | 'questionId' | 'question' | 'targetSkillOrGap' | 'userAnswer' | 'evaluatedAt' | 'modelUsed'>;
    try {
      parsedResult = JSON.parse(rawContent);
    } catch {
      const cleanJson = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      parsedResult = JSON.parse(cleanJson);
    }

    const fullEvaluation: InterviewEvaluation = {
      id: `eval-${Date.now()}`,
      questionId,
      question,
      targetSkillOrGap,
      userAnswer,
      evaluatedAt: new Date().toISOString(),
      modelUsed: successfulModel,
      overallScore: Number(parsedResult.overallScore) || 3.0,
      rubricScores: parsedResult.rubricScores || [],
      keyStrengths: parsedResult.keyStrengths || [],
      identifiedWeaknesses: parsedResult.identifiedWeaknesses || [],
      actionableFeedback: parsedResult.actionableFeedback || '',
      suggestedTaskTitle: parsedResult.suggestedTaskTitle || `Practice ${targetSkillOrGap} interview scenario`,
      suggestedTaskHours: Number(parsedResult.suggestedTaskHours) || 3,
      isIncorporatedIntoPlan: false,
    };

    return NextResponse.json({
      configured: true,
      modelUsed: successfulModel,
      evaluation: fullEvaluation,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { configured: true, error: `Failed to evaluate interview response: ${message}` },
      { status: 500 }
    );
  }
}

