import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Users, Award, Play, Clock, BookOpen, Video, FileText,
  MessageSquare, CheckCircle2, Circle, Loader2, ChevronRight,
  Plus, GraduationCap, ClipboardList, Timer, TrendingUp,
  Layers, Search, Edit3, Trash2, Send, Star, X,
  AlertCircle, ArrowRight, Eye, Save, BarChart3,
  ChevronDown, ChevronLeft, Filter, MoreHorizontal,
  ChevronUp, FolderOpen, GripVertical, Copy, Globe,
  UserCircle, Mail, CalendarDays, History,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn, type Contact, type Message, type User,
  formatTimeAgo,
} from "./types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { DateRangeFilter } from "./date-range-filter";
import type { DateRange } from "react-day-picker";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TrainerDashboardProps {
  contacts: Contact[];
  messages: Message[];
  users: User[];
  currentUser: User;
  initialTab?: TrainerTab;
}

type TrainerTab = "overview" | "trainees" | "content_studio" | "practice_chat";
type TraineeStatus = "In Training" | "Practice Phase" | "Ready for Review" | "Certified";
type MaterialType = "Module" | "Video" | "Quiz" | "Practice";
type TutorialStatus = "draft" | "published";

interface Trainee {
  id: string;
  name: string;
  progress: number;
  status: TraineeStatus;
  daysInTraining: number;
  checklistCompleted: number[];
  email: string;
  phone: string;
  enrolledDate: string;
  language: string;
  notes: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  status: TutorialStatus;
  modules: CourseModule[];
  enrolledCount: number;
  completionRate: number;
  createdAt: string;
}

interface CourseModule {
  id: string;
  title: string;
  type: MaterialType;
  duration: string;
  lessons: Lesson[];
  order: number;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  type: "text" | "video" | "quiz";
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

interface ChatMessage {
  id: string;
  sender: "seeker" | "trainee";
  senderName: string;
  text: string;
  timestamp: string;
}

interface PracticeScenario {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  objectives: string[];
  suggestedOpeners: string[];
}

type PracticeChatStep = "select_trainee" | "select_scenario" | "chatting" | "evaluate";

interface ActivityItem {
  id: string;
  text: string;
  icon: React.ElementType;
  color: string;
  time: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const PAGE_SIZE = 5;

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

const STATUS_BADGE: Record<TraineeStatus, string> = {
  "In Training": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Practice Phase": "bg-violet-500/10 text-violet-600 border-violet-500/20",
  "Ready for Review": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Certified: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const MATERIAL_BADGE: Record<MaterialType, string> = {
  Module: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Video: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  Quiz: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Practice: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const DIFFICULTY_BADGE: Record<string, string> = {
  Beginner: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Intermediate: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Advanced: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const TRAINEES: Trainee[] = [
  { id: "trainee-henok", name: "Henok Tadesse", progress: 88, status: "Ready for Review", daysInTraining: 14, checklistCompleted: [1,2,3,4,5,6,7], email: "henok@turumba.org", phone: "+251-911-234567", enrolledDate: "2026-07-07", language: "Amharic", notes: "Strong in conversations, needs more practice with crisis scenarios." },
  { id: "trainee-selam", name: "Selam Girma", progress: 100, status: "Certified", daysInTraining: 11, checklistCompleted: [1,2,3,4,5,6,7,8], email: "selam@turumba.org", phone: "+251-912-345678", enrolledDate: "2026-07-01", language: "Amharic", notes: "Completed all modules ahead of schedule. Excellent performance." },
  { id: "trainee-yared", name: "Yared Bekele", progress: 62, status: "Practice Phase", daysInTraining: 9, checklistCompleted: [1,2,3,4,5], email: "yared@turumba.org", phone: "+251-913-456789", enrolledDate: "2026-07-12", language: "Amharic", notes: "Progressing well through practice sessions." },
  { id: "trainee-mahlet", name: "Mahlet Hailu", progress: 38, status: "In Training", daysInTraining: 6, checklistCompleted: [1,2,3], email: "mahlet@turumba.org", phone: "+251-914-567890", enrolledDate: "2026-07-15", language: "Amharic", notes: "" },
  { id: "trainee-bereket", name: "Bereket Abebe", progress: 50, status: "In Training", daysInTraining: 8, checklistCompleted: [1,2,3,4], email: "bereket@turumba.org", phone: "+251-915-678901", enrolledDate: "2026-07-13", language: "Amharic", notes: "Needs extra support with trigger word protocol." },
  { id: "trainee-naomi", name: "Naomi Worku", progress: 75, status: "Practice Phase", daysInTraining: 12, checklistCompleted: [1,2,3,4,5,6], email: "naomi@turumba.org", phone: "+251-916-789012", enrolledDate: "2026-07-09", language: "Amharic", notes: "Very engaged, asking great questions during practice." },
  { id: "trainee-eyob", name: "Eyob Desta", progress: 12, status: "In Training", daysInTraining: 2, checklistCompleted: [1], email: "eyob@turumba.org", phone: "+251-917-890123", enrolledDate: "2026-07-19", language: "Tigrinya", notes: "" },
  { id: "trainee-tsion", name: "Tsion Mekonnen", progress: 25, status: "In Training", daysInTraining: 4, checklistCompleted: [1,2], email: "tsion@turumba.org", phone: "+251-918-901234", enrolledDate: "2026-07-17", language: "Amharic", notes: "" },
  { id: "trainee-dawit", name: "Dawit Kebede", progress: 100, status: "Certified", daysInTraining: 10, checklistCompleted: [1,2,3,4,5,6,7,8], email: "dawit@turumba.org", phone: "+251-919-012345", enrolledDate: "2026-06-28", language: "Amharic", notes: "Fast learner. Now active as volunteer." },
];

const COURSES: Course[] = [
  {
    id: "course-1", title: "Volunteer Onboarding Program", description: "Complete training path for new volunteers — from platform basics to certification.",
    status: "published", enrolledCount: 7, completionRate: 58, createdAt: "2026-06-10",
    modules: [
      { id: "mod-1", title: "Getting Started", type: "Module", duration: "20 min", order: 1, lessons: [
        { id: "l1", title: "Welcome & Platform Overview", content: "Introduction to the platform features and navigation.", type: "text" },
        { id: "l2", title: "Setting Up Your Account", content: "Step-by-step guide to configuring your volunteer profile.", type: "text" },
      ]},
      { id: "mod-2", title: "Gospel Conversation Fundamentals", type: "Video", duration: "35 min", order: 2, lessons: [
        { id: "l3", title: "Gospel Conversation Basics", content: "Core principles for engaging in gospel conversations online.", type: "video" },
        { id: "l4", title: "Responding to Difficult Questions", content: "Strategies for handling challenging questions.", type: "text" },
      ]},
      { id: "mod-3", title: "Safety & Protocols", type: "Module", duration: "20 min", order: 3, lessons: [
        { id: "l5", title: "Trigger Word Protocol", content: "Safety protocols for identifying and escalating sensitive content.", type: "text" },
        { id: "l6", title: "Platform Safety Quiz", content: "Assessment of safety protocol knowledge.", type: "quiz" },
      ]},
      { id: "mod-4", title: "Practice & Certification", type: "Practice", duration: "45 min", order: 4, lessons: [
        { id: "l7", title: "Practice Chat Session 1", content: "First contact scenario practice.", type: "text" },
        { id: "l8", title: "Practice Chat Session 2", content: "Crisis response scenario practice.", type: "text" },
        { id: "l9", title: "Final Certification Assessment", content: "Comprehensive evaluation for volunteer certification.", type: "quiz" },
      ]},
    ],
  },
  {
    id: "course-2", title: "Cultural Sensitivity Training", description: "Understanding cultural contexts in digital ministry across different regions.",
    status: "published", enrolledCount: 4, completionRate: 30, createdAt: "2026-06-25",
    modules: [
      { id: "mod-5", title: "Cultural Awareness", type: "Video", duration: "40 min", order: 1, lessons: [
        { id: "l10", title: "Understanding Cultural Context", content: "Why culture matters in digital evangelism.", type: "video" },
        { id: "l11", title: "Regional Considerations", content: "Key cultural considerations by region.", type: "text" },
      ]},
    ],
  },
  {
    id: "course-3", title: "Advanced Counseling Techniques", description: "Deep-dive into pastoral counseling for complex situations.",
    status: "draft", enrolledCount: 0, completionRate: 0, createdAt: "2026-07-10",
    modules: [
      { id: "mod-6", title: "Active Listening", type: "Module", duration: "30 min", order: 1, lessons: [
        { id: "l12", title: "Listening Techniques", content: "Techniques for demonstrating genuine care.", type: "text" },
      ]},
    ],
  },
];

const SCENARIOS: PracticeScenario[] = [
  { id: "sc-1", title: "First Contact", description: "A seeker reaches out for the first time after seeing a social media post.", difficulty: "Beginner", objectives: ["Warm greeting & welcome", "Active listening demonstrated", "Open-ended questions used", "Invite to continue conversation"], suggestedOpeners: ["Hi, I saw your post on Instagram about finding peace. I've been going through a really tough time.", "Hello, someone shared your page with me. I'm curious about what you believe.", "Hey, is this where I can talk to someone about God? I have a lot of questions."] },
  { id: "sc-2", title: "Crisis Response", description: "A seeker expresses emotional distress or mentions concerning language.", difficulty: "Advanced", objectives: ["Immediate acknowledgment", "Safety assessment", "Empathetic response", "Appropriate escalation", "Follow-up plan"], suggestedOpeners: ["I don't know if I can keep going anymore. Nothing makes sense.", "Everything is falling apart. My family doesn't care about me.", "I feel so alone and hopeless. I just want the pain to stop."] },
  { id: "sc-3", title: "Follow-up Conversation", description: "Continuing a conversation with a seeker who previously expressed interest.", difficulty: "Intermediate", objectives: ["Reference previous conversation", "Build on established rapport", "Deepen engagement", "Offer next steps"], suggestedOpeners: ["Hey, we talked last week about prayer. I actually tried it and something happened.", "Hi again! I've been thinking about what you said about forgiveness.", "I wanted to come back and ask more. Last time was really helpful."] },
  { id: "sc-4", title: "Difficult Questions", description: "A seeker asks challenging theological or philosophical questions.", difficulty: "Advanced", objectives: ["Acknowledge the question's validity", "Respond with humility", "Share relevant perspective", "Maintain relationship"], suggestedOpeners: ["If God is real, why does he allow so much suffering?", "How can you believe in something you can't see or prove?", "I was raised in a different religion. Why should I change?"] },
];

const TRAINEE_RESPONSES: string[] = [
  "Thank you for sharing that with me. I can see this is really weighing on you. Can you tell me more about how you've been feeling?",
  "I appreciate you being so open. What you're going through sounds incredibly difficult. You're not alone in this.",
  "That's a really great question. I think many people wonder about that. From my experience, I've found that...",
  "I hear you. It takes a lot of courage to be honest about these feelings. I want you to know this is a safe space to share.",
  "That resonates with me. I've talked with others who have felt similar things. Would it be okay if I shared something that might help?",
  "I'm glad you feel comfortable sharing that. Let me think about the best way to respond to what you've shared...",
];

const ACTIVITY_FEED: ActivityItem[] = [
  { id: "a1", text: "Henok Tadesse completed Practice Chat Session 2", icon: CheckCircle2, color: "text-emerald-500", time: "2 hours ago" },
  { id: "a2", text: "Selam Girma achieved certification", icon: Award, color: "text-amber-500", time: "1 day ago" },
  { id: "a3", text: "Naomi Worku started crisis response practice", icon: Play, color: "text-violet-500", time: "3 hours ago" },
  { id: "a4", text: "Yared Bekele completed Platform Safety Quiz", icon: ClipboardList, color: "text-blue-500", time: "5 hours ago" },
  { id: "a5", text: "Mahlet Hailu started Gospel Conversation Training", icon: BookOpen, color: "text-blue-500", time: "1 day ago" },
  { id: "a6", text: "New course draft: Advanced Counseling Techniques", icon: Edit3, color: "text-slate-500", time: "2 days ago" },
  { id: "a7", text: "Bereket Abebe completed Safety & Trigger Word Protocol", icon: CheckCircle2, color: "text-emerald-500", time: "2 days ago" },
  { id: "a8", text: "Eyob Desta enrolled in training program", icon: Users, color: "text-blue-500", time: "3 days ago" },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getInitial(name: string) {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
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

let _responseIdx = 0;
function getNextTraineeResponse() {
  const r = TRAINEE_RESPONSES[_responseIdx % TRAINEE_RESPONSES.length];
  _responseIdx++;
  return r;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const TrainerDashboard = ({
  contacts, messages, users, currentUser, initialTab,
}: TrainerDashboardProps) => {
  const [activeTab, setActiveTab] = useState<TrainerTab>(initialTab ?? "overview");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => { if (initialTab) setActiveTab(initialTab); }, [initialTab]);

  // -- Trainees --
  const [traineeSearch, setTraineeSearch] = useState("");
  const [traineeStatusFilter, setTraineeStatusFilter] = useState<TraineeStatus | "all">("all");
  const [traineePage, setTraineePage] = useState(1);
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | null>(null);

  // -- Content Studio (US31 — course builder) --
  const [courses, setCourses] = useState<Course[]>(COURSES);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [isModuleEditorOpen, setIsModuleEditorOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [edModTitle, setEdModTitle] = useState("");
  const [edModType, setEdModType] = useState<MaterialType>("Module");
  const [edModDuration, setEdModDuration] = useState("");
  const [edModLessons, setEdModLessons] = useState<Lesson[]>([]);
  // New course
  const [isNewCourseOpen, setIsNewCourseOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");

  // -- Practice Chat (US32 — guided flow) --
  const [chatStep, setChatStep] = useState<PracticeChatStep>("select_trainee");
  const [pcTraineeId, setPcTraineeId] = useState<string | null>(null);
  const [pcScenarioId, setPcScenarioId] = useState<string | null>(null);
  const [pcMessages, setPcMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [evalChecks, setEvalChecks] = useState<Record<string, boolean>>({});
  const [evalScore, setEvalScore] = useState<number | null>(null);
  const [evalNotes, setEvalNotes] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // -- Derived --
  const activeTrainees = TRAINEES.filter(t => t.status !== "Certified").length;
  const certifiedCount = TRAINEES.filter(t => t.status === "Certified").length;
  const avgCertDays = Math.round(TRAINEES.reduce((s, t) => s + t.daysInTraining, 0) / TRAINEES.length);

  const pipelineStages = useMemo(() => [
    { label: "In Training", count: TRAINEES.filter(t => t.status === "In Training").length, color: "bg-blue-500", text: "text-blue-600" },
    { label: "Practice", count: TRAINEES.filter(t => t.status === "Practice Phase").length, color: "bg-violet-500", text: "text-violet-600" },
    { label: "Review", count: TRAINEES.filter(t => t.status === "Ready for Review").length, color: "bg-amber-500", text: "text-amber-600" },
    { label: "Certified", count: TRAINEES.filter(t => t.status === "Certified").length, color: "bg-emerald-500", text: "text-emerald-600" },
  ], []);

  // Trainee filtering + pagination
  const filteredTrainees = useMemo(() => {
    let list = TRAINEES;
    if (traineeStatusFilter !== "all") list = list.filter(t => t.status === traineeStatusFilter);
    if (traineeSearch.trim()) {
      const q = traineeSearch.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q));
    }
    return list;
  }, [traineeStatusFilter, traineeSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredTrainees.length / PAGE_SIZE));
  const pagedTrainees = filteredTrainees.slice((traineePage - 1) * PAGE_SIZE, traineePage * PAGE_SIZE);
  const selectedTrainee = selectedTraineeId ? TRAINEES.find(t => t.id === selectedTraineeId) ?? null : null;

  useEffect(() => { setTraineePage(1); }, [traineeStatusFilter, traineeSearch]);

  // Practice Chat
  const pcTrainee = pcTraineeId ? TRAINEES.find(t => t.id === pcTraineeId) ?? null : null;
  const pcScenario = pcScenarioId ? SCENARIOS.find(s => s.id === pcScenarioId) ?? null : null;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [pcMessages.length]);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = currentUser.name.split(" ")[0];

  // -- Handlers --
  const sendChatMessage = useCallback(() => {
    if (!chatInput.trim() || !pcTrainee) return;
    const msg: ChatMessage = { id: `m-${Date.now()}`, sender: "seeker", senderName: "You (as Seeker)", text: chatInput.trim(), timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) };
    setPcMessages(prev => [...prev, msg]);
    setChatInput("");
    setTimeout(() => {
      setPcMessages(prev => [...prev, { id: `m-${Date.now()}`, sender: "trainee", senderName: pcTrainee.name, text: getNextTraineeResponse(), timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) }]);
    }, 1500);
  }, [chatInput, pcTrainee]);

  const startNewPractice = useCallback(() => {
    setChatStep("select_trainee");
    setPcTraineeId(null);
    setPcScenarioId(null);
    setPcMessages([]);
    setChatInput("");
    setEvalChecks({});
    setEvalScore(null);
    setEvalNotes("");
  }, []);

  const openModuleEditor = useCallback((courseId: string, mod?: CourseModule) => {
    setEditingCourseId(courseId);
    if (mod) {
      setEditingModuleId(mod.id);
      setEdModTitle(mod.title);
      setEdModType(mod.type);
      setEdModDuration(mod.duration);
      setEdModLessons([...mod.lessons]);
    } else {
      setEditingModuleId(null);
      setEdModTitle("");
      setEdModType("Module");
      setEdModDuration("");
      setEdModLessons([]);
    }
    setIsModuleEditorOpen(true);
  }, []);

  const saveModule = useCallback(() => {
    if (!edModTitle.trim() || !editingCourseId) return;
    setCourses(prev => prev.map(c => {
      if (c.id !== editingCourseId) return c;
      if (editingModuleId) {
        return { ...c, modules: c.modules.map(m => m.id === editingModuleId ? { ...m, title: edModTitle, type: edModType, duration: edModDuration, lessons: edModLessons } : m) };
      }
      return { ...c, modules: [...c.modules, { id: `mod-${Date.now()}`, title: edModTitle, type: edModType, duration: edModDuration, lessons: edModLessons, order: c.modules.length + 1 }] };
    }));
    setIsModuleEditorOpen(false);
    toast.success(editingModuleId ? "Module updated" : "Module added");
  }, [editingCourseId, editingModuleId, edModTitle, edModType, edModDuration, edModLessons]);

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 p-6 lg:p-8 animate-in fade-in duration-500 bg-gradient-to-br from-slate-50 via-background to-blue-50/30 min-h-full">

      {/* ================================================================ */}
      {/* OVERVIEW (Dashboard)                                             */}
      {/* ================================================================ */}
      {activeTab === "overview" && (<>
        {/* Hero Header */}
        <header className="relative overflow-hidden rounded-sm bg-slate-950 text-white p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)]">
          <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-violet-500/40 to-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-500/20 to-violet-500/10 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-300 uppercase tracking-[0.18em]">Trainer &middot; Volunteer Development</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05]">
                {greeting}, <span className="text-violet-300">{firstName}</span>.
              </h1>
              <p className="text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
                <span className="font-semibold text-white">{activeTrainees} trainees in progress</span>
                <span className="mx-2 text-slate-500">&middot;</span>
                <span className="font-semibold text-emerald-300">{certifiedCount} certified</span>
                <span className="mx-2 text-slate-500">&middot;</span>
                <span className="font-semibold text-pink-300">{courses.filter(c => c.status === "published").length} active courses</span>
              </p>
            </div>
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          </div>
        </header>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Trainees", value: activeTrainees, icon: Users, color: "text-blue-600", bg: "bg-blue-500/10" },
            { label: "Certified This Month", value: certifiedCount, icon: Award, color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { label: "Published Courses", value: courses.filter(c => c.status === "published").length, icon: BookOpen, color: "text-violet-600", bg: "bg-violet-500/10" },
            { label: "Avg Certification Time", value: `${avgCertDays}d`, icon: Timer, color: "text-amber-600", bg: "bg-amber-500/10" },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}
              className="bg-card p-5 rounded-lg border border-border shadow-sm group hover:border-primary/30 transition-all">
              <div className={cn("p-2 rounded-md border border-border mb-3 w-fit", kpi.bg)}>
                <kpi.icon className={cn("w-4 h-4", kpi.color)} />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
              <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Pipeline + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <h2 className="text-sm font-bold text-foreground mb-1">Training Pipeline</h2>
              <p className="text-xs text-muted-foreground mb-5">Volunteer progression through onboarding stages</p>
              <div className="flex items-center gap-2">
                {pipelineStages.map((stage, i) => (
                  <React.Fragment key={stage.label}>
                    <div className="flex-1 text-center">
                      <div className={cn("mx-auto w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-2", stage.color)}>{stage.count}</div>
                      <p className={cn("text-xs font-semibold", stage.text)}>{stage.label}</p>
                    </div>
                    {i < pipelineStages.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-border">
                <h2 className="text-sm font-bold text-foreground">Recent Activity</h2>
              </div>
              <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                {ACTIVITY_FEED.map((item, i) => (
                  <div key={item.id} className="px-5 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                    <div className={cn("mt-0.5 shrink-0", item.color)}><item.icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{item.text}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>)}

      {/* ================================================================ */}
      {/* TRAINEES PAGE                                                    */}
      {/* ================================================================ */}
      {activeTab === "trainees" && !selectedTraineeId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Trainees</h2>
              <p className="text-sm text-muted-foreground">{filteredTrainees.length} volunteers in onboarding pipeline</p>
            </div>
            <Button size="sm" className="text-xs gap-2" onClick={() => toast.info("Opening enrollment form...")}>
              <Plus className="w-3.5 h-3.5" /> Enroll Volunteer
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." className="pl-9 h-9 text-sm" value={traineeSearch} onChange={e => setTraineeSearch(e.target.value)} />
            </div>
            <div className="flex gap-1 p-0.5 bg-muted rounded-md border border-border">
              {(["all", "In Training", "Practice Phase", "Ready for Review", "Certified"] as const).map(f => (
                <button key={f} onClick={() => setTraineeStatusFilter(f)}
                  className={cn("px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap",
                    traineeStatusFilter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}>
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3">Trainee</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3">Status</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3">Progress</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3">Current Step</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3">Days</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pagedTrainees.map((trainee, i) => {
                    const nextStep = CHECKLIST_STEPS.find(s => !trainee.checklistCompleted.includes(s.step));
                    return (
                      <tr key={trainee.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedTraineeId(trainee.id)}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0", avatarColor(trainee.id))}>
                              {getInitial(trainee.name)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{trainee.name}</p>
                              <p className="text-[11px] text-muted-foreground">{trainee.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", STATUS_BADGE[trainee.status])}>{trainee.status}</Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 w-28">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", trainee.progress >= 100 ? "bg-emerald-500" : trainee.progress >= 60 ? "bg-blue-500" : "bg-amber-500")}
                                style={{ width: `${trainee.progress}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-muted-foreground w-8 text-right">{trainee.progress}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs text-foreground">{nextStep ? nextStep.title : "Completed"}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-muted-foreground">{trainee.daysInTraining}d</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-muted-foreground">{trainee.enrolledDate}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {(traineePage - 1) * PAGE_SIZE + 1}–{Math.min(traineePage * PAGE_SIZE, filteredTrainees.length)} of {filteredTrainees.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={traineePage <= 1} onClick={() => setTraineePage(p => p - 1)}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button key={i} variant={traineePage === i + 1 ? "default" : "outline"} size="sm" className="h-7 w-7 p-0 text-xs"
                      onClick={() => setTraineePage(i + 1)}>{i + 1}</Button>
                  ))}
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={traineePage >= totalPages} onClick={() => setTraineePage(p => p + 1)}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TRAINEE PROFILE (full page)                                      */}
      {/* ================================================================ */}
      {activeTab === "trainees" && selectedTrainee && (
        <div className="space-y-6">
          {/* Back button */}
          <Button variant="ghost" size="sm" className="text-xs gap-1.5 -ml-2" onClick={() => setSelectedTraineeId(null)}>
            <ChevronLeft className="w-4 h-4" /> Back to Trainees
          </Button>

          {/* Profile Header */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            <div className="flex items-start gap-5">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0", avatarColor(selectedTrainee.id))}>
                {getInitial(selectedTrainee.name)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-foreground">{selectedTrainee.name}</h2>
                  <Badge variant="outline" className={cn("text-xs", STATUS_BADGE[selectedTrainee.status])}>{selectedTrainee.status}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{selectedTrainee.email}</span>
                  <span className="flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5" />{selectedTrainee.phone}</span>
                  <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />Enrolled {selectedTrainee.enrolledDate}</span>
                  <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />{selectedTrainee.language}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-bold text-foreground">{selectedTrainee.progress}%</p>
                <p className="text-xs text-muted-foreground">Overall Progress</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-emerald-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${selectedTrainee.progress}%` }} transition={{ duration: 0.5 }} />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">{selectedTrainee.checklistCompleted.length}/{CHECKLIST_STEPS.length} steps</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Onboarding Checklist */}
            <div className="lg:col-span-2 bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-border">
                <h3 className="text-sm font-bold text-foreground">Onboarding Checklist</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Training milestones and completion status</p>
              </div>
              <div className="divide-y divide-border">
                {CHECKLIST_STEPS.map(step => {
                  const done = selectedTrainee.checklistCompleted.includes(step.step);
                  const isNext = !done && selectedTrainee.checklistCompleted.includes(step.step - 1);
                  return (
                    <div key={step.step} className={cn("px-6 py-4 flex items-center gap-4", done && "bg-emerald-500/5")}>
                      <div className="shrink-0">
                        {done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          : isNext ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                          : <Circle className="w-5 h-5 text-muted-foreground/30" />}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium", done || isNext ? "text-foreground" : "text-muted-foreground")}>{step.title}</p>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">Step {step.step}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar: Notes + Quick Actions */}
            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border shadow-sm p-5">
                <h3 className="text-sm font-bold text-foreground mb-3">Trainer Notes</h3>
                <Textarea className="text-sm min-h-[120px]" placeholder="Add notes about this trainee..."
                  defaultValue={selectedTrainee.notes} />
                <Button size="sm" className="mt-3 w-full text-xs gap-1" onClick={() => toast.success("Notes saved")}>
                  <Save className="w-3 h-3" /> Save Notes
                </Button>
              </div>

              <div className="bg-card rounded-lg border border-border shadow-sm p-5">
                <h3 className="text-sm font-bold text-foreground mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-2 justify-start" onClick={() => { setActiveTab("practice_chat"); startNewPractice(); setPcTraineeId(selectedTrainee.id); setChatStep("select_scenario"); }}>
                    <MessageSquare className="w-3.5 h-3.5" /> Start Practice Chat
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs gap-2 justify-start" onClick={() => toast.info("Sending reminder to " + selectedTrainee.name)}>
                    <Mail className="w-3.5 h-3.5" /> Send Reminder
                  </Button>
                  {selectedTrainee.status === "Ready for Review" && (
                    <Button size="sm" className="w-full text-xs gap-2 justify-start" onClick={() => toast.success(selectedTrainee.name + " submitted for certification review")}>
                      <Award className="w-3.5 h-3.5" /> Submit for Certification
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border shadow-sm p-5">
                <h3 className="text-sm font-bold text-foreground mb-3">Training Info</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Days in Training</span><span className="font-semibold">{selectedTrainee.daysInTraining}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Language Team</span><span className="font-semibold">{selectedTrainee.language}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Enrolled</span><span className="font-semibold">{selectedTrainee.enrolledDate}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Practice Sessions</span><span className="font-semibold">{selectedTrainee.checklistCompleted.filter(s => s >= 6 && s <= 7).length}/2</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* CONTENT STUDIO — Course Builder (US31)                           */}
      {/* ================================================================ */}
      {activeTab === "content_studio" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Content Studio</h2>
              <p className="text-sm text-muted-foreground">Build and manage training courses for your volunteers</p>
            </div>
            <Button size="sm" className="gap-2" onClick={() => { setNewCourseTitle(""); setNewCourseDesc(""); setIsNewCourseOpen(true); }}>
              <Plus className="w-4 h-4" /> New Course
            </Button>
          </div>

          {/* Course list */}
          <div className="space-y-4">
            {courses.map(course => (
              <div key={course.id} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                {/* Course header */}
                <button className="w-full text-left px-6 py-5 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedCourseId(expandedCourseId === course.id ? null : course.id)}>
                  <div className={cn("p-2.5 rounded-lg border border-border shrink-0", course.status === "published" ? "bg-emerald-500/10" : "bg-slate-500/10")}>
                    <BookOpen className={cn("w-5 h-5", course.status === "published" ? "text-emerald-600" : "text-slate-500")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-bold text-foreground">{course.title}</h3>
                      <Badge variant="outline" className={cn("text-[10px]", course.status === "published" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20")}>
                        {course.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{course.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                      <span>{course.modules.length} modules</span>
                      <span>{course.modules.reduce((s, m) => s + m.lessons.length, 0)} lessons</span>
                      {course.status === "published" && (<>
                        <span>{course.enrolledCount} enrolled</span>
                        <span>{course.completionRate}% completion</span>
                      </>)}
                    </div>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform shrink-0", expandedCourseId === course.id && "rotate-180")} />
                </button>

                {/* Expanded: Module list */}
                <AnimatePresence>
                  {expandedCourseId === course.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border overflow-hidden">
                      <div className="px-6 py-3 bg-muted/20 flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Modules</p>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openModuleEditor(course.id)}>
                          <Plus className="w-3 h-3" /> Add Module
                        </Button>
                      </div>
                      <div className="divide-y divide-border">
                        {course.modules.map((mod, mi) => (
                          <div key={mod.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-muted/20 transition-colors group">
                            <span className="text-xs font-bold text-muted-foreground bg-muted w-7 h-7 rounded flex items-center justify-center shrink-0">{mi + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground">{mod.title}</p>
                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", MATERIAL_BADGE[mod.type])}>{mod.type}</Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{mod.lessons.length} lessons &middot; {mod.duration}</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openModuleEditor(course.id, mod)}>
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500"
                                onClick={() => { setCourses(prev => prev.map(c => c.id === course.id ? { ...c, modules: c.modules.filter(m => m.id !== mod.id) } : c)); toast.success("Module removed"); }}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {course.modules.length === 0 && (
                          <div className="px-6 py-8 text-center text-xs text-muted-foreground">
                            No modules yet. Add your first module to start building this course.
                          </div>
                        )}
                      </div>

                      {/* Course actions */}
                      <div className="px-6 py-3 bg-muted/20 border-t border-border flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="text-xs gap-1 text-rose-500 hover:text-rose-600"
                          onClick={() => { setCourses(prev => prev.filter(c => c.id !== course.id)); toast.success("Course deleted"); }}>
                          <Trash2 className="w-3 h-3" /> Delete Course
                        </Button>
                        {course.status === "draft" && (
                          <Button size="sm" className="text-xs gap-1"
                            onClick={() => { setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: "published" } : c)); toast.success("Course published!"); }}>
                            <CheckCircle2 className="w-3 h-3" /> Publish
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* PRACTICE CHAT — Guided Flow (US32)                               */}
      {/* ================================================================ */}
      {activeTab === "practice_chat" && (
        <div className="space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Practice Chat</h2>
              <p className="text-sm text-muted-foreground">Simulate conversations to evaluate trainee readiness</p>
            </div>
            {chatStep !== "select_trainee" && (
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={startNewPractice}>
                <Plus className="w-3.5 h-3.5" /> New Session
              </Button>
            )}
          </div>

          {/* Steps progress bar */}
          <div className="flex items-center gap-0 bg-card rounded-lg border border-border shadow-sm p-1">
            {(["select_trainee", "select_scenario", "chatting", "evaluate"] as PracticeChatStep[]).map((step, i) => {
              const labels = ["1. Select Trainee", "2. Choose Scenario", "3. Chat Session", "4. Evaluate"];
              const stepOrder = ["select_trainee", "select_scenario", "chatting", "evaluate"];
              const currentIdx = stepOrder.indexOf(chatStep);
              const thisIdx = i;
              const isActive = thisIdx === currentIdx;
              const isDone = thisIdx < currentIdx;
              return (
                <div key={step} className={cn(
                  "flex-1 text-center py-2.5 rounded-md text-xs font-semibold transition-all",
                  isActive ? "bg-primary text-primary-foreground" :
                  isDone ? "bg-emerald-500/10 text-emerald-600" :
                  "text-muted-foreground"
                )}>
                  {isDone && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                  {labels[i]}
                </div>
              );
            })}
          </div>

          {/* Step 1: Select Trainee */}
          {chatStep === "select_trainee" && (
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <h3 className="text-sm font-bold text-foreground mb-1">Who are you practicing with?</h3>
              <p className="text-xs text-muted-foreground mb-4">Select a trainee to start a practice conversation</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TRAINEES.filter(t => t.status !== "Certified").map(t => (
                  <button key={t.id}
                    className={cn("text-left p-4 rounded-lg border transition-all", pcTraineeId === t.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-muted-foreground/40")}
                    onClick={() => setPcTraineeId(t.id)}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold", avatarColor(t.id))}>
                        {getInitial(t.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <Badge variant="outline" className={cn("text-[10px]", STATUS_BADGE[t.status])}>{t.status}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${t.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{t.progress}%</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-5 flex justify-end">
                <Button size="sm" disabled={!pcTraineeId} onClick={() => setChatStep("select_scenario")}>
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Select Scenario */}
          {chatStep === "select_scenario" && (
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <h3 className="text-sm font-bold text-foreground mb-1">Choose a scenario</h3>
              <p className="text-xs text-muted-foreground mb-4">You'll play the seeker role. {pcTrainee?.name} will respond as a volunteer.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SCENARIOS.map(sc => (
                  <button key={sc.id}
                    className={cn("text-left p-4 rounded-lg border transition-all", pcScenarioId === sc.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-muted-foreground/40")}
                    onClick={() => setPcScenarioId(sc.id)}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-foreground">{sc.title}</h4>
                      <Badge variant="outline" className={cn("text-[10px]", DIFFICULTY_BADGE[sc.difficulty])}>{sc.difficulty}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{sc.description}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Objectives:</p>
                    <ul className="mt-1 space-y-0.5">
                      {sc.objectives.map((obj, i) => (
                        <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Circle className="w-2 h-2 shrink-0" /> {obj}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
              <div className="mt-5 flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => setChatStep("select_trainee")}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button size="sm" disabled={!pcScenarioId} onClick={() => { setPcMessages([]); setChatStep("chatting"); }}>
                  Start Chat <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Chat */}
          {chatStep === "chatting" && pcTrainee && pcScenario && (
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 350px)", minHeight: 400 }}>
              {/* Chat header */}
              <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold", avatarColor(pcTrainee.id))}>
                    {getInitial(pcTrainee.name)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{pcTrainee.name}</p>
                    <p className="text-[11px] text-muted-foreground">Scenario: {pcScenario.title}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setChatStep("evaluate")}>
                  End &amp; Evaluate <ChevronRight className="w-3 h-3" />
                </Button>
              </div>

              {/* Scenario banner */}
              <div className="px-5 py-2.5 bg-blue-500/5 border-b border-blue-500/20 shrink-0">
                <p className="text-[11px] text-blue-600"><span className="font-semibold">Your role:</span> You are a seeker. Type messages to test how {pcTrainee.name} responds.</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {pcMessages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Start the conversation by typing a message as the seeker.</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {pcScenario.suggestedOpeners.map((opener, i) => (
                        <button key={i} className="text-[11px] text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg transition-colors max-w-[220px] text-left"
                          onClick={() => setChatInput(opener)}>
                          "{opener.slice(0, 60)}{opener.length > 60 ? "..." : ""}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {pcMessages.map(msg => (
                  <div key={msg.id} className={cn("flex gap-3", msg.sender === "seeker" ? "justify-end" : "justify-start")}>
                    {msg.sender === "trainee" && (
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-1", avatarColor(pcTrainee.id))}>
                        {getInitial(msg.senderName)}
                      </div>
                    )}
                    <div className={cn("max-w-[70%] rounded-xl px-4 py-2.5",
                      msg.sender === "seeker" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                    )}>
                      <p className={cn("text-[10px] font-semibold mb-0.5", msg.sender === "seeker" ? "text-primary-foreground/70" : "text-muted-foreground")}>{msg.senderName}</p>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={cn("text-[10px] mt-1", msg.sender === "seeker" ? "text-primary-foreground/50" : "text-muted-foreground/70")}>{msg.timestamp}</p>
                    </div>
                    {msg.sender === "seeker" && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0 mt-1">T</div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="px-5 py-3.5 border-t border-border shrink-0">
                <div className="flex items-center gap-3">
                  <Input placeholder="Type as the seeker..." className="flex-1 h-10 text-sm" value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }} />
                  <Button size="sm" className="h-10 px-4 gap-2" onClick={sendChatMessage} disabled={!chatInput.trim()}>
                    <Send className="w-4 h-4" /> Send
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Evaluate */}
          {chatStep === "evaluate" && pcTrainee && pcScenario && (
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold", avatarColor(pcTrainee.id))}>
                  {getInitial(pcTrainee.name)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Evaluate: {pcTrainee.name}</h3>
                  <p className="text-xs text-muted-foreground">Scenario: {pcScenario.title} &middot; {pcMessages.length} messages exchanged</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Objectives checklist */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Objectives Met</p>
                  <div className="space-y-2.5">
                    {pcScenario.objectives.map((obj, i) => {
                      const key = `obj-${i}`;
                      const checked = evalChecks[key] ?? false;
                      return (
                        <button key={i} className="flex items-center gap-3 w-full text-left group" onClick={() => setEvalChecks(prev => ({ ...prev, [key]: !prev[key] }))}>
                          <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                            checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30 group-hover:border-muted-foreground"
                          )}>
                            {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <span className={cn("text-sm", checked ? "text-foreground" : "text-muted-foreground")}>{obj}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Score + Notes */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Score (1–10)</p>
                    <div className="grid grid-cols-5 gap-2">
                      {[...Array(10)].map((_, i) => {
                        const score = i + 1;
                        return (
                          <button key={score} className={cn("h-10 rounded-md text-sm font-bold border transition-all",
                            evalScore === score ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                          )} onClick={() => setEvalScore(score)}>
                            {score}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Feedback</p>
                    <Textarea className="text-sm min-h-[100px]" placeholder="Write feedback for the trainee..."
                      value={evalNotes} onChange={e => setEvalNotes(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setChatStep("chatting")}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back to Chat
                </Button>
                <Button size="sm" className="gap-2" onClick={() => {
                  toast.success(`Evaluation saved for ${pcTrainee.name}: ${evalScore ?? "–"}/10`);
                  startNewPractice();
                }}>
                  <Save className="w-4 h-4" /> Submit Evaluation
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* Module Editor Drawer (Content Studio)                            */}
      {/* ================================================================ */}
      <AnimatePresence>
        {isModuleEditorOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsModuleEditorOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-xl bg-background border-l border-border shadow-2xl z-50 flex flex-col">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                <h2 className="text-base font-bold text-foreground">{editingModuleId ? "Edit Module" : "Add Module"}</h2>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsModuleEditorOpen(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <div>
                  <Label className="text-xs font-semibold">Module Title</Label>
                  <Input className="mt-1.5" placeholder="e.g., Gospel Conversation Fundamentals" value={edModTitle} onChange={e => setEdModTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">Type</Label>
                    <div className="flex gap-1 mt-1.5 p-0.5 bg-muted rounded-md border border-border">
                      {(["Module", "Video", "Quiz", "Practice"] as MaterialType[]).map(t => (
                        <button key={t} onClick={() => setEdModType(t)}
                          className={cn("flex-1 px-2 py-1.5 text-xs font-medium rounded-sm transition-colors", edModType === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Duration</Label>
                    <Input className="mt-1.5" placeholder="e.g., 25 min" value={edModDuration} onChange={e => setEdModDuration(e.target.value)} />
                  </div>
                </div>

                {/* Lessons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-semibold">Lessons ({edModLessons.length})</Label>
                    <Button variant="outline" size="sm" className="text-xs gap-1 h-7"
                      onClick={() => setEdModLessons(prev => [...prev, { id: `les-${Date.now()}`, title: "", content: "", type: "text" }])}>
                      <Plus className="w-3 h-3" /> Add Lesson
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {edModLessons.map((les, i) => (
                      <div key={les.id} className="bg-muted/30 rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{i + 1}</span>
                          <Input className="flex-1 h-7 text-xs" placeholder="Lesson title" value={les.title}
                            onChange={e => setEdModLessons(prev => prev.map(l => l.id === les.id ? { ...l, title: e.target.value } : l))} />
                          <div className="flex gap-0.5 p-0.5 bg-muted rounded border border-border">
                            {(["text", "video", "quiz"] as const).map(lt => (
                              <button key={lt} className={cn("px-1.5 py-0.5 text-[10px] rounded-sm", les.type === lt ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                                onClick={() => setEdModLessons(prev => prev.map(l => l.id === les.id ? { ...l, type: lt } : l))}>
                                {lt}
                              </button>
                            ))}
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500"
                            onClick={() => setEdModLessons(prev => prev.filter(l => l.id !== les.id))}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <Textarea className="text-xs min-h-[50px]" placeholder="Lesson content..." value={les.content}
                          onChange={e => setEdModLessons(prev => prev.map(l => l.id === les.id ? { ...l, content: e.target.value } : l))} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border flex justify-end gap-2 shrink-0 bg-muted/20">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsModuleEditorOpen(false)}>Cancel</Button>
                <Button size="sm" className="text-xs gap-1" onClick={saveModule}><Save className="w-3 h-3" /> Save Module</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Course Modal */}
      <AnimatePresence>
        {isNewCourseOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsNewCourseOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg border border-border shadow-2xl z-50 w-full max-w-md p-6">
              <h3 className="text-base font-bold text-foreground mb-4">Create New Course</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold">Course Title</Label>
                  <Input className="mt-1.5" placeholder="e.g., Advanced Counseling Techniques" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Description</Label>
                  <Textarea className="mt-1.5 text-sm" placeholder="What will trainees learn?" value={newCourseDesc} onChange={e => setNewCourseDesc(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsNewCourseOpen(false)}>Cancel</Button>
                <Button size="sm" className="text-xs gap-1" disabled={!newCourseTitle.trim()}
                  onClick={() => {
                    setCourses(prev => [...prev, { id: `course-${Date.now()}`, title: newCourseTitle, description: newCourseDesc, status: "draft", modules: [], enrolledCount: 0, completionRate: 0, createdAt: new Date().toISOString().split("T")[0] }]);
                    setIsNewCourseOpen(false);
                    toast.success("Course created as draft");
                  }}>
                  <Plus className="w-3 h-3" /> Create Course
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
