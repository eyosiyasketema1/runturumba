import React, { useState, useMemo } from "react";
import {
  Users, Award, Play, Clock, BookOpen, Video, FileText,
  MessageSquare, CheckCircle2, Circle, Loader2, ChevronRight,
  Plus, GraduationCap, ClipboardList, Timer,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn, type Contact, type Message, type User,
  formatTimeAgo,
} from "./types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DateRangeFilter } from "./date-range-filter";
import type { DateRange } from "react-day-picker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrainerDashboardProps {
  contacts: Contact[];
  messages: Message[];
  users: User[];
  currentUser: User;
}

type TraineeStatus = "In Training" | "Practice Phase" | "Ready for Review" | "Certified";

interface Trainee {
  id: string;
  name: string;
  progress: number;
  status: TraineeStatus;
  daysInTraining: number;
  checklistCompleted: number[];
}

type MaterialType = "Module" | "Video" | "Quiz" | "Practice";

interface TrainingMaterial {
  id: string;
  title: string;
  type: MaterialType;
  icon: React.ElementType;
  duration: string;
  completionPercent: number;
}

type PracticeStatus = "In Progress" | "Completed" | "Scheduled";

interface PracticeSession {
  id: string;
  traineeName: string;
  scenario: string;
  status: PracticeStatus;
  time: string;
}

interface ChecklistItem {
  step: number;
  title: string;
  status: "completed" | "in_progress" | "not_started";
  completedDate?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitial(name: string) {
  return name
    .split(" ")
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-amber-600",
  "bg-rose-600", "bg-cyan-600", "bg-indigo-600", "bg-teal-600",
];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 4294967296;
  };
}

const STATUS_BADGE_STYLES: Record<TraineeStatus, string> = {
  "In Training": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Practice Phase": "bg-violet-500/10 text-violet-600 border-violet-500/20",
  "Ready for Review": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "Certified": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const MATERIAL_TYPE_STYLES: Record<MaterialType, string> = {
  Module: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Video: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  Quiz: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Practice: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const PRACTICE_STATUS_STYLES: Record<PracticeStatus, string> = {
  "In Progress": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Completed": "bg-slate-500/10 text-slate-500 border-slate-500/20",
  "Scheduled": "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const CHECKLIST_STEPS: { step: number; title: string }[] = [
  { step: 1, title: "Account Setup" },
  { step: 2, title: "Platform Orientation" },
  { step: 3, title: "Gospel Conversation Training" },
  { step: 4, title: "Safety & Trigger Word Protocol" },
  { step: 5, title: "Platform Quiz (pass required)" },
  { step: 6, title: "Practice Chat Session 1" },
  { step: 7, title: "Practice Chat Session 2" },
  { step: 8, title: "Final Assessment & Certification" },
];

// ---------------------------------------------------------------------------
// Synthetic Data
// ---------------------------------------------------------------------------

const TRAINEES: Trainee[] = [
  {
    id: "trainee-henok",
    name: "Henok Tadesse",
    progress: 88,
    status: "Ready for Review",
    daysInTraining: 14,
    checklistCompleted: [1, 2, 3, 4, 5, 6, 7],
  },
  {
    id: "trainee-selam",
    name: "Selam Girma",
    progress: 100,
    status: "Certified",
    daysInTraining: 11,
    checklistCompleted: [1, 2, 3, 4, 5, 6, 7, 8],
  },
  {
    id: "trainee-yared",
    name: "Yared Bekele",
    progress: 62,
    status: "Practice Phase",
    daysInTraining: 9,
    checklistCompleted: [1, 2, 3, 4, 5],
  },
  {
    id: "trainee-mahlet",
    name: "Mahlet Hailu",
    progress: 38,
    status: "In Training",
    daysInTraining: 6,
    checklistCompleted: [1, 2, 3],
  },
  {
    id: "trainee-bereket",
    name: "Bereket Abebe",
    progress: 50,
    status: "In Training",
    daysInTraining: 8,
    checklistCompleted: [1, 2, 3, 4],
  },
  {
    id: "trainee-naomi",
    name: "Naomi Worku",
    progress: 75,
    status: "Practice Phase",
    daysInTraining: 12,
    checklistCompleted: [1, 2, 3, 4, 5, 6],
  },
  {
    id: "trainee-eyob",
    name: "Eyob Desta",
    progress: 12,
    status: "In Training",
    daysInTraining: 2,
    checklistCompleted: [1],
  },
];

const TRAINING_MATERIALS: TrainingMaterial[] = [
  {
    id: "mat-1",
    title: "Welcome & Platform Overview",
    type: "Module",
    icon: BookOpen,
    duration: "20 min",
    completionPercent: 100,
  },
  {
    id: "mat-2",
    title: "Gospel Conversation Basics",
    type: "Video",
    icon: Video,
    duration: "35 min",
    completionPercent: 86,
  },
  {
    id: "mat-3",
    title: "Responding to Difficult Questions",
    type: "Module",
    icon: BookOpen,
    duration: "25 min",
    completionPercent: 71,
  },
  {
    id: "mat-4",
    title: "Trigger Word Protocol",
    type: "Module",
    icon: FileText,
    duration: "10 min",
    completionPercent: 71,
  },
  {
    id: "mat-5",
    title: "Platform Safety Quiz",
    type: "Quiz",
    icon: ClipboardList,
    duration: "12 questions",
    completionPercent: 57,
  },
  {
    id: "mat-6",
    title: "Practice: First Contact Scenario",
    type: "Practice",
    icon: MessageSquare,
    duration: "3 scenarios",
    completionPercent: 43,
  },
  {
    id: "mat-7",
    title: "Cultural Sensitivity Training",
    type: "Video",
    icon: Video,
    duration: "40 min",
    completionPercent: 29,
  },
  {
    id: "mat-8",
    title: "Final Certification Assessment",
    type: "Quiz",
    icon: ClipboardList,
    duration: "20 questions",
    completionPercent: 14,
  },
];

const PRACTICE_SESSIONS: PracticeSession[] = [
  {
    id: "ps-1",
    traineeName: "Yared Bekele",
    scenario: "First Contact",
    status: "In Progress",
    time: "12 min",
  },
  {
    id: "ps-2",
    traineeName: "Naomi Worku",
    scenario: "Crisis Response",
    status: "In Progress",
    time: "8 min",
  },
  {
    id: "ps-3",
    traineeName: "Henok Tadesse",
    scenario: "Follow-up",
    status: "Completed",
    time: "22 min",
  },
  {
    id: "ps-4",
    traineeName: "Bereket Abebe",
    scenario: "First Contact",
    status: "Completed",
    time: "18 min",
  },
];

const UPCOMING_SESSIONS: { traineeName: string; scenario: string; scheduledTime: string }[] = [
  { traineeName: "Mahlet Hailu", scenario: "First Contact", scheduledTime: "Today, 3:00 PM" },
  { traineeName: "Eyob Desta", scenario: "Platform Walkthrough", scheduledTime: "Today, 4:30 PM" },
  { traineeName: "Bereket Abebe", scenario: "Crisis Response", scheduledTime: "Tomorrow, 10:00 AM" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TrainerDashboard = ({
  contacts,
  messages,
  users,
  currentUser,
}: TrainerDashboardProps) => {
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Derived data
  const activeTrainees = TRAINEES.filter(t => t.status !== "Certified").length;
  const certifiedThisMonth = TRAINEES.filter(t => t.status === "Certified").length;
  const practiceSessions = PRACTICE_SESSIONS.filter(p => p.status === "In Progress").length;
  const avgCertDays = Math.round(
    TRAINEES.reduce((sum, t) => sum + t.daysInTraining, 0) / TRAINEES.length
  );

  const selectedTrainee = selectedTraineeId
    ? TRAINEES.find(t => t.id === selectedTraineeId) || null
    : null;

  // Build checklist for selected trainee
  const checklist = useMemo<ChecklistItem[]>(() => {
    if (!selectedTrainee) {
      // Show general overview with aggregated status
      const rand = seededRandom("checklist-overview");
      return CHECKLIST_STEPS.map(step => {
        const completedCount = TRAINEES.filter(t =>
          t.checklistCompleted.includes(step.step)
        ).length;
        const allComplete = completedCount === TRAINEES.length;
        const someComplete = completedCount > 0;
        return {
          step: step.step,
          title: step.title,
          status: allComplete
            ? "completed" as const
            : someComplete
              ? "in_progress" as const
              : "not_started" as const,
          completedDate: allComplete
            ? new Date(Date.now() - Math.floor(rand() * 2592000000)).toISOString()
            : undefined,
        };
      });
    }

    const rand = seededRandom(selectedTrainee.id + "-dates");
    return CHECKLIST_STEPS.map(step => {
      const isCompleted = selectedTrainee.checklistCompleted.includes(step.step);
      const isNext = !isCompleted &&
        selectedTrainee.checklistCompleted.includes(step.step - 1);
      return {
        step: step.step,
        title: step.title,
        status: isCompleted
          ? "completed" as const
          : isNext
            ? "in_progress" as const
            : "not_started" as const,
        completedDate: isCompleted
          ? new Date(
              Date.now() -
              Math.floor(rand() * selectedTrainee.daysInTraining * 86400000)
            ).toISOString()
          : undefined,
      };
    });
  }, [selectedTrainee]);

  const checklistProgress = selectedTrainee
    ? Math.round(
        (selectedTrainee.checklistCompleted.length / CHECKLIST_STEPS.length) * 100
      )
    : Math.round(
        (CHECKLIST_STEPS.filter((_, i) =>
          TRAINEES.every(t => t.checklistCompleted.includes(i + 1))
        ).length / CHECKLIST_STEPS.length) * 100
      );

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = currentUser.name.split(" ")[0];

  return (
    <div className="space-y-6 p-6 lg:p-8 animate-in fade-in duration-500 bg-gradient-to-br from-slate-50 via-background to-blue-50/30 min-h-full">
      {/* ================================================================ */}
      {/* Hero Header                                                      */}
      {/* ================================================================ */}
      <header className="relative overflow-hidden rounded-sm bg-slate-950 text-white p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)]">
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/40 to-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-500/20 to-blue-500/10 blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-[0.18em]">
                Trainer · Volunteer Development
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05]">
              {greeting},{" "}
              <span className="text-blue-300">{firstName}</span>.
            </h1>
            <p className="text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
              <span className="font-semibold text-white">
                {activeTrainees} trainees in progress
              </span>
              <span className="mx-2 text-slate-500">&middot;</span>
              <span className="font-semibold text-emerald-300">
                {certifiedThisMonth} certified this month
              </span>
              <span className="mx-2 text-slate-500">&middot;</span>
              <span className="font-semibold text-pink-300">
                {practiceSessions} practice sessions today
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              onClick={() => toast.info("Opening training library...")}
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              Training Library
            </Button>
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* KPI Stats Row                                                    */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Active Trainees",
            value: activeTrainees,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-500/10",
          },
          {
            label: "Certified This Month",
            value: certifiedThisMonth,
            icon: Award,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Practice Sessions",
            value: practiceSessions,
            icon: Play,
            color: "text-violet-600",
            bg: "bg-violet-500/10",
          },
          {
            label: "Avg Certification Time",
            value: `${avgCertDays} days`,
            icon: Timer,
            color: "text-amber-600",
            bg: "bg-amber-500/10",
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
            className="bg-card p-5 rounded-lg border border-border shadow-sm group hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={cn(
                  "p-2 rounded-md border border-border group-hover:border-primary/20 transition-all",
                  kpi.bg
                )}
              >
                <kpi.icon
                  className={cn("w-4 h-4 transition-all", kpi.color)}
                />
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
              {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ================================================================ */}
      {/* Three-Panel Layout                                               */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* -------------------------------------------------------------- */}
        {/* Left Panel — Trainee Roster (col-span-5)                       */}
        {/* -------------------------------------------------------------- */}
        <div className="lg:col-span-5">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Trainee Roster
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {TRAINEES.length} volunteers in onboarding pipeline
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    {activeTrainees} active
                  </span>
                </div>
              </div>
            </div>

            {/* Trainee List */}
            <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
              {TRAINEES.map((trainee, i) => (
                <motion.button
                  key={trainee.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
                  onClick={() => {
                    setSelectedTraineeId(
                      selectedTraineeId === trainee.id ? null : trainee.id
                    );
                  }}
                  className={cn(
                    "w-full text-left px-5 py-4 hover:bg-muted/50 transition-colors group flex items-center gap-3",
                    selectedTraineeId === trainee.id && "bg-muted/70"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                      avatarColor(trainee.id)
                    )}
                  >
                    {getInitial(trainee.name)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {trainee.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 shrink-0",
                          STATUS_BADGE_STYLES[trainee.status]
                        )}
                      >
                        {trainee.status}
                      </Badge>
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            trainee.progress >= 100
                              ? "bg-emerald-500"
                              : trainee.progress >= 70
                                ? "bg-blue-500"
                                : trainee.progress >= 40
                                  ? "bg-violet-500"
                                  : "bg-amber-500"
                          )}
                          style={{ width: `${trainee.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground w-8 text-right">
                        {trainee.progress}%
                      </span>
                    </div>
                  </div>

                  {/* Days */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {trainee.daysInTraining}d
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                </motion.button>
              ))}
            </div>

            {/* Add Trainee Button */}
            <div className="px-5 py-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-2"
                onClick={() => toast.info("Opening trainee enrollment form...")}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Trainee
              </Button>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Center Panel — Training Materials (col-span-4)                 */}
        {/* -------------------------------------------------------------- */}
        <div className="lg:col-span-4">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Training Library
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {TRAINING_MATERIALS.length} resources available
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">
                  {TRAINING_MATERIALS.length} items
                </span>
              </div>
            </div>

            {/* Materials List */}
            <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
              {TRAINING_MATERIALS.map((material, i) => (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
                  className="px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={cn(
                        "p-2 rounded-md border border-border shrink-0 mt-0.5",
                        MATERIAL_TYPE_STYLES[material.type].split(" ")[0]
                      )}
                    >
                      <material.icon
                        className={cn(
                          "w-4 h-4",
                          MATERIAL_TYPE_STYLES[material.type].split(" ")[1]
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground truncate">
                          {material.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            MATERIAL_TYPE_STYLES[material.type]
                          )}
                        >
                          {material.type}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {material.duration}
                        </span>
                      </div>
                      {/* Completion bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${material.completionPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground w-8 text-right">
                          {material.completionPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Right Panel — Practice Sessions (col-span-3)                   */}
        {/* -------------------------------------------------------------- */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden sticky top-6">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">
                    Live Practice
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {PRACTICE_SESSIONS.filter(p => p.status === "In Progress").length} active
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Simulated conversations for trainees
              </p>
            </div>

            {/* Active / Recent Sessions */}
            <div className="divide-y divide-border">
              {PRACTICE_SESSIONS.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
                  className="px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {session.traineeName}
                        </span>
                        {session.status === "In Progress" && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {session.scenario}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          PRACTICE_STATUS_STYLES[session.status]
                        )}
                      >
                        {session.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {session.time}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Start New Button */}
            <div className="px-5 py-3 border-t border-border">
              <Button
                size="sm"
                className="w-full text-xs gap-2"
                onClick={() => toast.info("Starting new practice session...")}
              >
                <Play className="w-3.5 h-3.5" />
                Start New Practice Session
              </Button>
            </div>

            {/* Upcoming Section */}
            <div className="px-5 pt-3 pb-4 border-t border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Upcoming
              </h3>
              <div className="space-y-3">
                {UPCOMING_SESSIONS.map((session, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {session.traineeName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {session.scenario} · {session.scheduledTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Bottom Section — Onboarding Checklist                            */}
      {/* ================================================================ */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        {/* Checklist Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">
                  Onboarding Checklist
                </h2>
                {selectedTrainee && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      STATUS_BADGE_STYLES[selectedTrainee.status]
                    )}
                  >
                    {selectedTrainee.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedTrainee
                  ? `${selectedTrainee.checklistCompleted.length} of ${CHECKLIST_STEPS.length} steps completed`
                  : "Select a trainee from the roster to view their individual progress"}
              </p>
            </div>
            {selectedTrainee && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setSelectedTraineeId(null)}
              >
                Show Overview
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${checklistProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs font-bold text-foreground w-10 text-right">
              {checklistProgress}%
            </span>
          </div>
        </div>

        {/* Checklist Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {checklist.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03, ease: "easeOut" }}
              className={cn(
                "px-5 py-4 flex items-start gap-3",
                item.status === "completed" && "bg-emerald-500/5"
              )}
            >
              {/* Status Icon */}
              <div className="shrink-0 mt-0.5">
                {item.status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : item.status === "in_progress" ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground/30" />
                )}
              </div>

              {/* Step Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    STEP {item.step}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-xs font-medium mt-0.5",
                    item.status === "completed"
                      ? "text-foreground"
                      : item.status === "in_progress"
                        ? "text-foreground"
                        : "text-muted-foreground"
                  )}
                >
                  {item.title}
                </p>
                {item.completedDate && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(item.completedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
