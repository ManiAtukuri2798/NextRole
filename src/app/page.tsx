'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ProfileForm from '@/components/ProfileForm';
import JobIntakeForm from '@/components/JobIntakeForm';
import SkillGapsView from '@/components/SkillGapsView';
import LearningPlanView from '@/components/LearningPlanView';
import InterviewPracticeView from '@/components/InterviewPracticeView';
import ApplicationsView from '@/components/ApplicationsView';
import WisprFlowModal from '@/components/WisprFlowModal';
import StorageNotice from '@/components/StorageNotice';
import { WorkspaceTab, UserProfile, JobDescription, ApplicationItem } from '@/types';
import {
  DEFAULT_PROFILE,
  DEMO_PROFILE,
  DEMO_JOBS,
  DEMO_APPLICATIONS,
  getStoredProfile,
  saveStoredProfile,
  getStoredJobDescriptions,
  saveStoredJobDescriptions,
  getStoredApplications,
  saveStoredApplications,
  clearAllLocalData,
  STORAGE_KEYS,
} from '@/lib/storage';
import { CheckCircle2 } from 'lucide-react';

// Hydration-safe client-mount detection via useSyncExternalStore
function subscribe() {
  return () => { };
}

function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

export default function Home() {
  const isMounted = useMounted();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('profile');
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isWisprModalOpen, setIsWisprModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize data on mount asynchronously to prevent cascading renders
  useEffect(() => {
    const timer = setTimeout(() => {
      const storedProfile = getStoredProfile();
      const storedJobs = getStoredJobDescriptions();
      const storedApps = getStoredApplications();

      const hasExistingData =
        Boolean(storedProfile.targetRole) ||
        storedJobs.length > 0 ||
        storedApps.length > 0;

      if (!hasExistingData) {
        setProfile(DEMO_PROFILE);
        setJobs(DEMO_JOBS);
        setApplications(DEMO_APPLICATIONS);
        saveStoredProfile(DEMO_PROFILE);
        saveStoredJobDescriptions(DEMO_JOBS);
        saveStoredApplications(DEMO_APPLICATIONS);
      } else {
        setProfile(storedProfile);
        setJobs(storedJobs);
        setApplications(storedApps);
      }

      const savedTab = localStorage.getItem(STORAGE_KEYS.LAST_TAB) as WorkspaceTab;
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTabChange = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LAST_TAB, tab);
    }
  };

  const handleProfileChange = (updated: UserProfile) => {
    setProfile(updated);
    saveStoredProfile(updated);
    setHasUnsavedChanges(false);
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    saveStoredProfile(profile);
    setHasUnsavedChanges(false);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Profile saved to browser local storage!');
    }, 300);
  };

  const handleSaveJob = (job: JobDescription) => {
    let updatedJobs: JobDescription[];
    const exists = jobs.some((j) => j.id === job.id);

    if (job.isActiveTarget) {
      updatedJobs = exists
        ? jobs.map((j) => (j.id === job.id ? job : { ...j, isActiveTarget: false }))
        : [{ ...job, isActiveTarget: true }, ...jobs.map((j) => ({ ...j, isActiveTarget: false }))];
    } else {
      updatedJobs = exists
        ? jobs.map((j) => (j.id === job.id ? job : j))
        : [job, ...jobs];
    }

    setJobs(updatedJobs);
    saveStoredJobDescriptions(updatedJobs);
    showToast('Job description saved to browser storage!');
  };

  const handleDeleteJob = (id: string) => {
    const updated = jobs.filter((j) => j.id !== id);
    if (updated.length > 0 && !updated.some((j) => j.isActiveTarget)) {
      updated[0].isActiveTarget = true;
    }
    setJobs(updated);
    saveStoredJobDescriptions(updated);
    showToast('Job description removed.');
  };

  const handleSetActiveTarget = (id: string) => {
    const updated = jobs.map((j) => ({
      ...j,
      isActiveTarget: j.id === id,
    }));
    setJobs(updated);
    saveStoredJobDescriptions(updated);
    showToast('Active target job updated!');
  };

  const handleSaveApplication = (app: ApplicationItem) => {
    const updated = [app, ...applications];
    setApplications(updated);
    saveStoredApplications(updated);
    showToast('Application logged in local storage!');
  };

  const handleDeleteApplication = (id: string) => {
    const updated = applications.filter((a) => a.id !== id);
    setApplications(updated);
    saveStoredApplications(updated);
    showToast('Application record removed.');
  };

  const handleUpdateAppStatus = (id: string, status: ApplicationItem['status']) => {
    const updated = applications.map((a) => (a.id === id ? { ...a, status } : a));
    setApplications(updated);
    saveStoredApplications(updated);
    showToast(`Status updated to "${status}"!`);
  };

  const handleLoadDemo = () => {
    setProfile(DEMO_PROFILE);
    setJobs(DEMO_JOBS);
    setApplications(DEMO_APPLICATIONS);
    saveStoredProfile(DEMO_PROFILE);
    saveStoredJobDescriptions(DEMO_JOBS);
    saveStoredApplications(DEMO_APPLICATIONS);
    setHasUnsavedChanges(false);
    showToast('Loaded demo AI Product Manager dataset!');
  };

  const handleReset = () => {
    if (confirm('Reset all profile, job, and application data in local storage?')) {
      clearAllLocalData();
      setProfile(DEFAULT_PROFILE);
      setJobs([]);
      setApplications([]);
      setHasUnsavedChanges(false);
      showToast('All local storage data cleared.');
    }
  };

  const activeJob = jobs.find((j) => j.isActiveTarget) || jobs[0];
  const profileCompleted = Boolean(profile.targetRole && profile.resumeText.length > 50);
  const jobCompleted = jobs.length > 0;

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading NextRole workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 w-full max-w-full overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        onOpenWisprModal={() => setIsWisprModalOpen(true)}
        onLoadDemo={handleLoadDemo}
        onReset={handleReset}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Workspace Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        profileCompleted={profileCompleted}
        jobCompleted={jobCompleted}
      />

      {/* Workspace Main Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {activeTab === 'profile' && (
          <ProfileForm
            profile={profile}
            onChange={handleProfileChange}
            onSave={handleSaveProfile}
            isSaving={isSaving}
            onOpenWisprGuide={() => setIsWisprModalOpen(true)}
          />
        )}

        {activeTab === 'job-intake' && (
          <JobIntakeForm
            jobs={jobs}
            onSaveJob={handleSaveJob}
            onDeleteJob={handleDeleteJob}
            onSetActiveTarget={handleSetActiveTarget}
            onOpenWisprGuide={() => setIsWisprModalOpen(true)}
          />
        )}

        {activeTab === 'skill-gaps' && (
          <SkillGapsView
            profile={profile}
            activeJob={activeJob}
            onNavigateToTab={(tab) => handleTabChange(tab)}
          />
        )}

        {activeTab === 'learning-plan' && (
          <LearningPlanView
            profile={profile}
            activeJob={activeJob}
            onNavigateToTab={(tab) => handleTabChange(tab)}
            onUpdateProfileHours={(weeklyHours, timelineWeeks) => {
              const updated = {
                ...profile,
                weeklyHours,
                targetTimelineWeeks: timelineWeeks,
              };
              setProfile(updated);
              saveStoredProfile(updated);
            }}
          />
        )}

        {activeTab === 'interview-practice' && (
          <InterviewPracticeView
            activeJob={activeJob}
            onOpenWisprGuide={() => setIsWisprModalOpen(true)}
          />
        )}

        {activeTab === 'applications' && (
          <ApplicationsView
            applications={applications}
            jobs={jobs}
            onSaveApplication={handleSaveApplication}
            onDeleteApplication={handleDeleteApplication}
            onUpdateStatus={handleUpdateAppStatus}
          />
        )}
      </main>

      {/* Storage Architecture Footer Notice */}
      <StorageNotice />

      {/* Wispr Flow Explanatory Modal */}
      <WisprFlowModal
        isOpen={isWisprModalOpen}
        onClose={() => setIsWisprModalOpen(false)}
      />
    </div>
  );
}
