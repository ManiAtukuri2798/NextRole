'use client';

import React from 'react';
import { 
  User, 
  Briefcase, 
  GitCompare, 
  CalendarRange, 
  Headphones, 
  SendHorizontal,
  Lock,
  ChevronDown
} from 'lucide-react';
import { WorkspaceTab } from '@/types';

interface NavigationProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  profileCompleted: boolean;
  jobCompleted: boolean;
  hasAnalysis?: boolean;
}

export default function Navigation({
  activeTab,
  onTabChange,
  profileCompleted,
  jobCompleted,
  hasAnalysis,
}: NavigationProps) {
  const tabs = [
    {
      id: 'profile' as WorkspaceTab,
      label: 'Profile & Résumé',
      shortLabel: 'Profile',
      icon: User,
      badge: profileCompleted ? 'Ready' : 'Incomplete',
      badgeColor: profileCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600',
      milestone: 'M1',
      isLocked: false,
    },
    {
      id: 'job-intake' as WorkspaceTab,
      label: 'Target Job Intake',
      shortLabel: 'Job Intake',
      icon: Briefcase,
      badge: jobCompleted ? 'Target Set' : 'Required',
      badgeColor: jobCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
      milestone: 'M1',
      isLocked: false,
    },
    {
      id: 'skill-gaps' as WorkspaceTab,
      label: 'Skill Gaps',
      shortLabel: 'Skill Gaps',
      icon: GitCompare,
      badge: hasAnalysis ? 'Analyzed' : 'Gemini AI',
      badgeColor: hasAnalysis 
        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
        : 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      isLocked: false,
      milestone: 'M2',
    },
    {
      id: 'learning-plan' as WorkspaceTab,
      label: 'Weekly Learning Plan',
      shortLabel: 'Learning Plan',
      icon: CalendarRange,
      badge: 'Gemini Plan',
      badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      isLocked: false,
      milestone: 'M2',
    },
    {
      id: 'interview-practice' as WorkspaceTab,
      label: 'Interview Practice',
      shortLabel: 'Interviews',
      icon: Headphones,
      badge: 'Voice Loop',
      badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200',
      isLocked: true,
      milestone: 'M2',
    },
    {
      id: 'applications' as WorkspaceTab,
      label: 'Applications Tracker',
      shortLabel: 'Applications',
      icon: SendHorizontal,
      badge: 'Pipeline',
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      isLocked: false,
      milestone: 'M1',
    },
  ];

  return (
    <div className="w-full bg-white border-b border-slate-200 max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Mobile Dropdown View (< sm) */}
        <div className="sm:hidden py-2.5">
          <label htmlFor="mobile-tab-select" className="sr-only">
            Select workspace section
          </label>
          <div className="relative">
            <select
              id="mobile-tab-select"
              value={activeTab}
              onChange={(e) => onTabChange(e.target.value as WorkspaceTab)}
              className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-xl py-2.5 pl-3.5 pr-10 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} {tab.isLocked ? `(${tab.milestone} Preview)` : `(${tab.badge})`}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Horizontal Navigation Pills (Scrollable on mobile/tablet, fully reachable) */}
        <nav 
          aria-label="Workspace navigation tabs"
          className="flex space-x-1 sm:space-x-2.5 overflow-x-auto py-2 scrollbar-none max-w-full"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-all duration-150 shrink-0 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>

                {/* Milestone or Status Pill */}
                {tab.isLocked ? (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${
                      isActive
                        ? 'bg-indigo-500/40 text-indigo-100 border border-indigo-400/40'
                        : tab.badgeColor
                    }`}
                  >
                    <Lock className="w-2.5 h-2.5" />
                    <span>{tab.milestone}</span>
                  </span>
                ) : (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
