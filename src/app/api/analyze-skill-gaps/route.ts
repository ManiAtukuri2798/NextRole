import { NextRequest, NextResponse } from 'next/server';
import { SkillGapAnalysisResult } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        {
          configured: false,
          error:
            'GEMINI_API_KEY is missing from environment variables. Configure it in .env.local to enable server-side Gemini AI analysis.',
        },
        { status: 200 }
      );
    }

    const body = await req.json();
    const {
      targetRole,
      currentRole,
      yearsOfExperience,
      candidateSkills,
      pivotMotivation,
      resumeText,
      jobTitle,
      jobCompany,
      jobText,
    } = body;

    if (!resumeText || resumeText.trim().length < 40) {
      return NextResponse.json(
        {
          configured: true,
          error: 'Candidate résumé text is too brief or missing. Please paste candidate résumé text.',
        },
        { status: 400 }
      );
    }

    if (!jobText || jobText.trim().length < 50) {
      return NextResponse.json(
        {
          configured: true,
          error: 'Job description text is too brief or missing. Please paste target job posting.',
        },
        { status: 400 }
      );
    }

    const systemPrompt = `You are NextRole's strict, objective AI Career Pivot Evaluator.
Your mission is to perform a factual, grounded skill-gap analysis comparing a candidate's actual résumé and background against an employer's real job description.

CRITICAL EVIDENCE-CLASSIFICATION & EVALUATION RULES:
1. STRICT GROUNDING: Every competency you analyze MUST be derived directly from the employer's Job Description.
2. JOB EVIDENCE: You MUST include the exact verbatim quote or phrase from the Job Description in "supportingJobEvidence" for every item.
3. PRECISE STATUS DISTINCTION (STRICT RULES):
   - "missing_evidence": A skill, tool, or domain required by the Job Description is absent or not explicitly documented in the candidate's résumé. A skill absent from the résumé MUST ALWAYS be classified as "missing_evidence", NEVER as "confirmed_gap".
   - "confirmed_gap": Used ONLY when the candidate explicitly stated they lack this capability (e.g. in their pivot motivation, self-reported notes, or prior direct confirmation). If the candidate simply did not write it on their résumé, it is "missing_evidence" because absence of documentation is not confirmation of absence of skill.
   - "matched_strength": Verified directly in the candidate's résumé text with concrete proof cited in "resumeEvidence".
   - "transferable_strength": An existing capability from the candidate's current background that directly bridges or translates into this requirement.
4. ATOMIC COMPETENCIES (SPLIT COMPOUND REQUIREMENTS):
   - Split compound or multi-technology requirements into distinct, individual competencies.
   - Example: If the job description asks for "LLMs, Whisper, speech-to-text models", do NOT group them together into one generic AI item. Evaluate "LLMs & Generative AI" separately from "Whisper & Speech-to-Text / Audio AI". Having LLM or RAG experience alone does NOT establish speech-to-text / acoustic model expertise!
5. HONESTY: Do not fabricate skills, do not sugarcoat gaps, and do not hallucinate experiences not present in the résumé.
6. Provide actionable bridge recommendations for every gap.
7. Assign each competency item a stable "id" like "comp-1", "comp-2", etc.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this structure:
{
  "jobTitle": string,
  "jobCompany": string,
  "analyzedAt": string (ISO timestamp),
  "overallAssessment": string (2-3 sentences analyzing transition realism from current role to target role),
  "readinessLevel": "High Pivot Readiness" | "Moderate Gap - Needs Bridge Projects" | "Significant Gap - Foundation Required",
  "competencies": [
    {
      "id": string (e.g. "comp-1"),
      "skill": string,
      "category": "technical" | "domain" | "leadership" | "tooling",
      "importance": "required" | "preferred" | "bonus",
      "status": "confirmed_gap" | "missing_evidence" | "matched_strength" | "transferable_strength",
      "supportingJobEvidence": string (exact quote from Job Description),
      "resumeEvidence": string (quote from resume, or "No mention found in candidate résumé"),
      "gapReasoning": string (explaining precisely why this is missing evidence vs confirmed lack or matched strength),
      "actionableBridge": string (concrete learning sprint or portfolio deliverable)
    }
  ],
  "topPriorityGaps": string[] (3 highest-priority skills candidate must build first),
  "transferableSuperpowers": string[] (2-3 strengths from current role that transfer directly)
}`;

    const userPrompt = `CANDIDATE INFORMATION:
- Target Role: ${targetRole || 'Not specified'}
- Current Role: ${currentRole || 'Not specified'}
- Years of Experience: ${yearsOfExperience || 0}
- Self-Reported Skills: ${Array.isArray(candidateSkills) ? candidateSkills.join(', ') : 'None'}
- Pivot Motivation: ${pivotMotivation || 'Not specified'}

CANDIDATE RÉSUMÉ TEXT:
"""
${resumeText}
"""

TARGET EMPLOYER JOB DESCRIPTION:
- Target Job Title: ${jobTitle || 'Target Role'}
- Target Company: ${jobCompany || 'Target Employer'}
"""
${jobText}
"""

Analyze all key requirements in this Job Description against the candidate's résumé according to the evaluation rules. Output valid JSON only.`;

    // Configurable model name via GEMINI_MODEL (defaults to verified available free-tier model)
    const configuredModel = process.env.GEMINI_MODEL?.trim().replace(/^models\//, '') || 'gemini-3.5-flash-lite';
    
    // Priority order of verified available models
    const candidateModels = Array.from(
      new Set([configuredModel, 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'])
    );

    let lastError: string = '';
    let rawContent: string | null = null;
    let successfulModel: string = configuredModel;

    for (const model of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = `Model ${model} returned HTTP ${response.status}: ${errText.substring(0, 160)}`;
          // If 404 (model not found/deprecated) or 503 (high demand spike), continue to fallback model
          if (response.status === 404 || response.status === 503) {
            continue;
          }
          // For other client errors (e.g. 400 or 403), stop and report honest error
          return NextResponse.json(
            {
              configured: true,
              error: lastError,
            },
            { status: 502 }
          );
        }

        const geminiData = await response.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
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
          error: lastError || 'Failed to generate analysis with available Gemini models.',
        },
        { status: 502 }
      );
    }

    let parsedResult: SkillGapAnalysisResult;
    try {
      parsedResult = JSON.parse(rawContent);
    } catch {
      // In case of any Markdown fence wrapping
      const cleanJson = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      parsedResult = JSON.parse(cleanJson);
    }

    parsedResult.jobTitle = jobTitle || parsedResult.jobTitle || 'Target Role';
    parsedResult.jobCompany = jobCompany || parsedResult.jobCompany || 'Target Employer';
    parsedResult.analyzedAt = new Date().toISOString();
    parsedResult.modelUsed = successfulModel;

    // Ensure every competency has a stable id and strict classification enforcement
    if (Array.isArray(parsedResult.competencies)) {
      parsedResult.competencies = parsedResult.competencies.map((c, idx) => {
        const id = c.id || `comp-${idx + 1}`;
        // Enforce: Absent from résumé cannot be confirmed_gap unless user explicitly stated it
        let status = c.status;
        const noMention = 
          c.resumeEvidence?.toLowerCase().includes('no mention') || 
          c.resumeEvidence?.toLowerCase().includes('not found') || 
          c.resumeEvidence?.toLowerCase().includes('not mentioned');

        if (status === 'confirmed_gap' && noMention) {
          status = 'missing_evidence';
        }

        return {
          ...c,
          id,
          status,
        };
      });
    }

    // Attach input signature for client-side cache invalidation detection
    const sigParts = [
      (targetRole || '').trim().toLowerCase(),
      (resumeText || '').trim().length.toString(),
      (jobTitle || '').trim().toLowerCase(),
      (jobText || '').trim().length.toString(),
    ];
    parsedResult.inputSignature = sigParts.join('|');

    return NextResponse.json({
      configured: true,
      modelUsed: successfulModel,
      analysis: parsedResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error analyzing skill gaps:', message);
    return NextResponse.json(
      {
        configured: true,
        error: `Failed to process skill gap analysis: ${message}`,
      },
      { status: 500 }
    );
  }
}
