import { NextRequest, NextResponse } from 'next/server';
import { InterviewQuestion, GroundedSkillItem } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        {
          configured: false,
          error:
            'GEMINI_API_KEY is missing from environment variables. Configure it in .env.local to generate grounded interview questions.',
        },
        { status: 200 }
      );
    }

    const body = await req.json();
    const {
      targetRole = 'AI Product Manager',
      jobTitle = 'Target Role',
      jobCompany = 'Target Employer',
      jobRawText = '',
      gaps = [],
    } = body;

    const gapsSummary = (gaps as GroundedSkillItem[])
      .filter((g) => g.status === 'confirmed_gap' || g.status === 'missing_evidence')
      .map((g) => ({
        skill: g.skill,
        category: g.category,
        jobEvidence: g.supportingJobEvidence,
        status: g.status,
      }));

    const systemPrompt = `You are NextRole's elite Technical Hiring Manager and Career Transition Interview Architect.
Your task is to generate realistic, rigorous interview questions for a candidate pivoting into: ${targetRole} (${jobTitle} at ${jobCompany}).

CRITICAL REQUIREMENTS:
1. GROUNDED IN GAPS & JOB POSTING:
   - Each question MUST probe either a required capability cited in the employer's Job Description or an identified candidate skill gap.
   - For example: if the job description mentions "Whisper, speech-to-text models, acoustic model fine-tuning", ask an in-depth question specifically about speech transcription latency, Word Error Rate (WER) vs. user experience, or handling streaming audio.
2. QUESTION CATEGORIES:
   - "technical_depth": Probing direct architecture, metrics, or technical mechanisms.
   - "system_architecture": High-level tradeoffs, API pipelines, or integration design.
   - "behavioral_star": Situation-Task-Action-Result scenarios probing transition transferability.
   - "role_alignment": Product sense, prioritization, and domain strategy for the target role.
3. INCLUDE 3 TO 5 QUESTIONS:
   - Give each question a unique string id (e.g. "q-1", "q-2").
   - Define difficulty: "introductory" | "intermediate" | "advanced".
   - State the "targetSkillOrGap" explicitly.
   - Provide "contextPrompt" explaining what the interviewer is listening for.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching:
{
  "questions": [
    {
      "id": string,
      "question": string,
      "category": "technical_depth" | "system_architecture" | "behavioral_star" | "role_alignment",
      "targetSkillOrGap": string,
      "contextPrompt": string,
      "difficulty": "introductory" | "intermediate" | "advanced"
    }
  ]
}`;

    const userPrompt = `TARGET ROLE CONTEXT:
- Role: ${targetRole}
- Employer: ${jobCompany}
- Posting Title: ${jobTitle}
- Job Description Snippet:
"""
${(jobRawText || '').slice(0, 3000)}
"""

IDENTIFIED SKILL GAPS TO PROBE:
${JSON.stringify(gapsSummary, null, 2)}

Generate 4 high-signal interview questions grounded in these exact gaps and requirements. Output valid JSON only.`;

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
              temperature: 0.3,
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
        { configured: true, error: lastError || 'Failed to generate interview questions.' },
        { status: 502 }
      );
    }

    let parsed: { questions: InterviewQuestion[] };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const cleanJson = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      parsed = JSON.parse(cleanJson);
    }

    return NextResponse.json({
      configured: true,
      modelUsed: successfulModel,
      questions: parsed.questions || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { configured: true, error: `Failed to generate interview questions: ${message}` },
      { status: 500 }
    );
  }
}

