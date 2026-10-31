import { UserProfile, JobDescription, ValidationErrors } from '@/types';

export function validateProfile(profile: UserProfile): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!profile.targetRole.trim()) {
    errors.targetRole = 'Target role is required (e.g., "AI Product Manager").';
  } else if (profile.targetRole.trim().length < 3) {
    errors.targetRole = 'Target role must be at least 3 characters.';
  }

  if (profile.weeklyHours < 1 || profile.weeklyHours > 60) {
    errors.weeklyHours = 'Weekly study hours must be between 1 and 60.';
  }

  if (profile.resumeText.trim().length > 0 && profile.resumeText.trim().length < 50) {
    errors.resumeText = 'Résumé text looks very brief. For accurate gap analysis, paste your full summary and experience.';
  }

  return errors;
}

export function validateJobDescription(job: Partial<JobDescription>): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!job.title?.trim()) {
    errors.jobTitle = 'Job title is required (e.g., "Senior AI Product Manager").';
  }

  if (!job.company?.trim()) {
    errors.jobCompany = 'Company name is required.';
  }

  if (job.sourceUrl && job.sourceUrl.trim().length > 0) {
    try {
      const url = new URL(job.sourceUrl.trim());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.jobSourceUrl = 'URL must start with http:// or https://';
      }
    } catch {
      errors.jobSourceUrl = 'Please enter a valid website URL.';
    }
  }

  if (!job.rawText?.trim()) {
    errors.jobRawText = 'Job description text is required for AI skill-gap grounding.';
  } else if (job.rawText.trim().length < 60) {
    errors.jobRawText = 'Please paste a more complete job description (minimum 60 characters).';
  }

  return errors;
}

