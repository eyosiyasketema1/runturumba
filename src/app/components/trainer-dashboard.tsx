import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Users, Award, Play, Clock, BookOpen, Video, FileText,
  MessageSquare, CheckCircle2, Circle, Loader2, ChevronRight,
  Plus, GraduationCap, ClipboardList, Timer, TrendingUp,
  Layers, Search, Edit3, Trash2, Send, Star, X,
  AlertCircle, ArrowRight, Eye, Save, BarChart3,
  ChevronDown, ChevronLeft, Filter, MoreHorizontal,
  ChevronUp, FolderOpen, GripVertical, Copy, Globe,
  UserCircle, Mail, CalendarDays, History, Link2, Upload,
  Settings, Sparkles, Headphones, File,
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
type LessonType = "video" | "article" | "quiz" | "pdf" | "audio" | "assignment";

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
  type: LessonType;
  videoUrl?: string;
  videoSource?: "link" | "upload";
  thumbnailUrl?: string;
  transcript?: string;
  duration?: string;
  quizQuestions?: QuizQuestion[];
  passingScore?: number;
  randomizeQuestions?: boolean;
  showCorrectAnswers?: boolean;
  pdfUrl?: string;
  isRequired?: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  questionType: "multiple_choice" | "true_false" | "checkbox" | "short_answer";
  options: string[];
  correctIndex: number;
  correctIndices?: number[];
  correctAnswer?: string;
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

const LESSON_TYPE_CONFIG: Record<LessonType, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  video: { icon: Video, label: "Video", color: "text-violet-600", bg: "bg-violet-500/10" },
  article: { icon: FileText, label: "Article", color: "text-blue-600", bg: "bg-blue-500/10" },
  quiz: { icon: ClipboardList, label: "Quiz", color: "text-amber-600", bg: "bg-amber-500/10" },
  pdf: { icon: File, label: "PDF", color: "text-rose-600", bg: "bg-rose-500/10" },
  audio: { icon: Headphones, label: "Audio", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  assignment: { icon: Edit3, label: "Assignment", color: "text-cyan-600", bg: "bg-cyan-500/10" },
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
        { id: "l1", title: "Welcome & Platform Overview", content: "Introduction to the platform features and navigation.", type: "article" },
        { id: "l2", title: "Setting Up Your Account", content: "Step-by-step guide to configuring your volunteer profile.", type: "article" },
      ]},
      { id: "mod-2", title: "Gospel Conversation Fundamentals", type: "Video", duration: "35 min", order: 2, lessons: [
        { id: "l3", title: "Gospel Conversation Basics", content: "Core principles for engaging in gospel conversations online.", type: "video", videoUrl: "https://youtube.com/watch?v=example123" },
        { id: "l4", title: "Responding to Difficult Questions", content: "Strategies for handling challenging questions.", type: "article" },
      ]},
      { id: "mod-3", title: "Safety & Protocols", type: "Module", duration: "20 min", order: 3, lessons: [
        { id: "l5", title: "Trigger Word Protocol", content: "Safety protocols for identifying and escalating sensitive content.", type: "article" },
        { id: "l6", title: "Platform Safety Quiz", content: "Assessment of safety protocol knowledge.", type: "quiz", passingScore: 80, quizQuestions: [
          { id: "q1", question: "What should you do when a seeker mentions self-harm?", questionType: "multiple_choice", options: ["Continue the conversation normally", "Immediately escalate to a supervisor", "Ignore the message", "End the chat"], correctIndex: 1 },
          { id: "q2", question: "Trigger words should always be reported.", questionType: "true_false", options: ["True", "False"], correctIndex: 0 },
          { id: "q3", question: "Which of the following are considered trigger words?", questionType: "checkbox", options: ["Suicide", "Hopeless", "Weather", "Harm"], correctIndex: 0, correctIndices: [0, 1, 3] },
        ]},
      ]},
      { id: "mod-4", title: "Practice & Certification", type: "Practice", duration: "45 min", order: 4, lessons: [
        { id: "l7", title: "Practice Chat Session 1", content: "First contact scenario practice.", type: "article" },
        { id: "l8", title: "Practice Chat Session 2", content: "Crisis response scenario practice.", type: "article" },
        { id: "l9", title: "Final Certification Assessment", content: "Comprehensive evaluation for volunteer certification.", type: "quiz", passingScore: 80, quizQuestions: [
          { id: "q4", question: "What is the primary goal of a first-contact conversation?", questionType: "multiple_choice", options: ["Convert the seeker immediately", "Build trust and rapport", "Share as much information as possible", "Get personal details"], correctIndex: 1 },
          { id: "q5", question: "Active listening involves only hearing the words spoken.", questionType: "true_false", options: ["True", "False"], correctIndex: 1 },
        ]},
      ]},
    ],
  },
  {
    id: "course-2", title: "Cultural Sensitivity Training", description: "Understanding cultural contexts in digital ministry across different regions.",
    status: "published", enrolledCount: 4, completionRate: 30, createdAt: "2026-06-25",
    modules: [
      { id: "mod-5", title: "Cultural Awareness", type: "Video", duration: "40 min", order: 1, lessons: [
        { id: "l10", title: "Understanding Cultural Context", content: "Why culture matters in digital evangelism.", type: "video", videoUrl: "https://youtube.com/watch?v=example123" },
        { id: "l11", title: "Regional Considerations", content: "Key cultural considerations by region.", type: "article" },
      ]},
    ],
  },
  {
    id: "course-3", title: "Advanced Counseling Techniques", description: "Deep-dive into pastoral counseling for complex situations.",
    status: "draft", enrolledCount: 0, completionRate: 0, createdAt: "2026-07-10",
    modules: [
      { id: "mod-6", title: "Active Listening", type: "Module", duration: "30 min", order: 1, lessons: [
        { id: "l12", title: "Listening Techniques", content: "Techniques for demonstrating genuine care.", type: "article" },
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

  // -- Content Studio (course builder) --
  const [courses, setCourses] = useState<Course[]>(COURSES);
  const [isNewCourseOpen, setIsNewCourseOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");

  // Studio editor states
  const [studioCourseId, setStudioCourseId] = useState<string | null>(null);
  const [studioLessonPath, setStudioLessonPath] = useState<{moduleId: string, lessonId: string} | null>(null);
  const [studioExpandedMods, setStudioExpandedMods] = useState<string[]>([]);
  const [studioSearch, setStudioSearch] = useState("");
  const [lastAutoSave, setLastAutoSave] = useState<Date>(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isAddingModule, setIsAddingModule] = useState(false);

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

  // Studio derived values
  const studioCourse = studioCourseId ? courses.find(c => c.id === studioCourseId) ?? null : null;
  const studioLesson = studioLessonPath && studioCourse
    ? studioCourse.modules.find(m => m.id === studioLessonPath.moduleId)?.lessons.find(l => l.id === studioLessonPath.lessonId) ?? null
    : null;
  const studioModule = studioLessonPath && studioCourse
    ? studioCourse.modules.find(m => m.id === studioLessonPath.moduleId) ?? null
    : null;

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

  // Studio handlers
  const updateLesson = useCallback((moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
    if (!studioCourseId) return;
    setCourses(prev => prev.map(c => {
      if (c.id !== studioCourseId) return c;
      return { ...c, modules: c.modules.map(m => {
        if (m.id !== moduleId) return m;
        return { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l) };
      })};
    }));
    setLastAutoSave(new Date());
  }, [studioCourseId]);

  const addStudioModule = useCallback((title: string) => {
    if (!studioCourseId || !title.trim()) return;
    const newId = `mod-${Date.now()}`;
    setCourses(prev => prev.map(c => {
      if (c.id !== studioCourseId) return c;
      return { ...c, modules: [...c.modules, { id: newId, title, type: "Module" as MaterialType, duration: "0 min", lessons: [], order: c.modules.length + 1 }] };
    }));
    setStudioExpandedMods(prev => [...prev, newId]);
    toast.success("Module added");
  }, [studioCourseId]);

  const addStudioLesson = useCallback((moduleId: string, type: LessonType = "article") => {
    if (!studioCourseId) return;
    const newId = `les-${Date.now()}`;
    setCourses(prev => prev.map(c => {
      if (c.id !== studioCourseId) return c;
      return { ...c, modules: c.modules.map(m => {
        if (m.id !== moduleId) return m;
        return { ...m, lessons: [...m.lessons, { id: newId, title: "Untitled Lesson", content: "", type }] };
      })};
    }));
    setStudioLessonPath({ moduleId, lessonId: newId });
    setLastAutoSave(new Date());
  }, [studioCourseId]);

  const deleteStudioModule = useCallback((moduleId: string) => {
    if (!studioCourseId) return;
    setCourses(prev => prev.map(c => {
      if (c.id !== studioCourseId) return c;
      return { ...c, modules: c.modules.filter(m => m.id !== moduleId) };
    }));
    if (studioLessonPath?.moduleId === moduleId) setStudioLessonPath(null);
    toast.success("Module deleted");
  }, [studioCourseId, studioLessonPath]);

  const deleteStudioLesson = useCallback((moduleId: string, lessonId: string) => {
    if (!studioCourseId) return;
    setCourses(prev => prev.map(c => {
      if (c.id !== studioCourseId) return c;
      return { ...c, modules: c.modules.map(m => {
        if (m.id !== moduleId) return m;
        return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
      })};
    }));
    if (studioLessonPath?.lessonId === lessonId) setStudioLessonPath(null);
    setLastAutoSave(new Date());
  }, [studioCourseId, studioLessonPath]);

  const duplicateStudioModule = useCallback((moduleId: string) => {
    if (!studioCourseId) return;
    setCourses(prev => prev.map(c => {
      if (c.id !== studioCourseId) return c;
      const mod = c.modules.find(m => m.id === moduleId);
      if (!mod) return c;
      const newMod = { ...mod, id: `mod-${Date.now()}`, title: `${mod.title} (Copy)`, lessons: mod.lessons.map(l => ({ ...l, id: `les-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })) };
      const idx = c.modules.findIndex(m => m.id === moduleId);
      const mods = [...c.modules];
      mods.splice(idx + 1, 0, newMod);
      return { ...c, modules: mods };
    }));
    toast.success("Module duplicated");
  }, [studioCourseId]);

  const addQuizQuestion = useCallback((moduleId: string, lessonId: string) => {
    updateLesson(moduleId, lessonId, {
      quizQuestions: [
        ...(studioLesson?.quizQuestions ?? []),
        { id: `q-${Date.now()}`, question: "", questionType: "multiple_choice", options: ["", "", "", ""], correctIndex: 0 }
      ]
    });
  }, [updateLesson, studioLesson]);

  // Autosave time ago
  const autoSaveAgo = useMemo(() => {
    const diff = Math.floor((Date.now() - lastAutoSave.getTime()) / 1000);
    if (diff < 5) return "just now";
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  }, [lastAutoSave]);

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
      {/* CONTENT STUDIO — Course Builder                                  */}
      {/* ================================================================ */}
      {activeTab === "content_studio" && !studioCourseId && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Content Studio</h2>
              <p className="text-sm text-muted-foreground">Build and manage training courses for your volunteers</p>
            </div>
            <Button size="sm" className="gap-2" onClick={() => { setNewCourseTitle(""); setNewCourseDesc(""); setIsNewCourseOpen(true); }}>
              <Plus className="w-4 h-4" /> New Course
            </Button>
          </div>

          {/* Course Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {courses.map(course => {
              const lessonCount = course.modules.reduce((s, m) => s + m.lessons.length, 0);
              return (
                <motion.div key={course.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
                  onClick={() => { setStudioCourseId(course.id); setStudioLessonPath(null); setStudioExpandedMods(course.modules.map(m => m.id)); }}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn("p-2.5 rounded-xl border border-border", course.status === "published" ? "bg-emerald-500/10" : "bg-slate-500/10")}>
                        <BookOpen className={cn("w-5 h-5", course.status === "published" ? "text-emerald-600" : "text-slate-500")} />
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] font-semibold", course.status === "published" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20")}>
                        {course.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{course.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{course.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{course.modules.length} modules</span>
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{lessonCount} lessons</span>
                    </div>
                  </div>
                  {course.status === "published" && (
                    <div className="px-6 py-3.5 border-t border-border bg-muted/20 rounded-b-xl flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">{course.enrolledCount}</span> enrolled</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${course.completionRate}%` }} />
                        </div>
                        <span className="text-[11px] font-semibold text-muted-foreground">{course.completionRate}%</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* CONTENT STUDIO — Two-Panel Course Editor                         */}
      {/* ================================================================ */}
      {activeTab === "content_studio" && studioCourseId && studioCourse && (
        <div className="-m-6 lg:-m-8 flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
          {/* Top Action Bar */}
          <div className="bg-white border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => { setStudioCourseId(null); setStudioLessonPath(null); }}>
                <ChevronLeft className="w-4 h-4" /> Back to Courses
              </Button>
              <div className="h-5 w-px bg-border" />
              <input
                className="text-sm font-bold text-foreground bg-transparent border-none outline-none focus:ring-0 w-auto min-w-[200px]"
                value={studioCourse.title}
                onChange={e => setCourses(prev => prev.map(c => c.id === studioCourseId ? { ...c, title: e.target.value } : c))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={cn("text-[10px] font-semibold", studioCourse.status === "published" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20")}>
                {studioCourse.status === "published" ? "Published" : "Draft"}
              </Badge>
              <span className="text-[11px] text-muted-foreground">Autosaved {autoSaveAgo}</span>
              <div className="h-5 w-px bg-border" />
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => toast.info("Preview mode coming soon")}>
                <Eye className="w-3.5 h-3.5" /> Preview
              </Button>
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => { setLastAutoSave(new Date()); toast.success("Draft saved"); }}>
                <Save className="w-3.5 h-3.5" /> Save Draft
              </Button>
              {studioCourse.status === "draft" ? (
                <Button size="sm" className="text-xs gap-1.5" onClick={() => { setCourses(prev => prev.map(c => c.id === studioCourseId ? { ...c, status: "published" } : c)); toast.success("Course published!"); }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Publish
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => { setCourses(prev => prev.map(c => c.id === studioCourseId ? { ...c, status: "draft" } : c)); toast.info("Course unpublished"); }}>
                  Unpublish
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Two panels container */}
          <div className="flex flex-1 overflow-hidden">
            {/* ── Left Panel: Course Structure ── */}
            <div className="w-[300px] shrink-0 border-r border-border bg-muted/30 flex flex-col overflow-hidden">
              {/* Search */}
              <div className="px-4 pt-4 pb-3 space-y-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Search lessons..." className="pl-9 h-8 text-xs bg-background" value={studioSearch} onChange={e => setStudioSearch(e.target.value)} />
                </div>
                {/* Add module */}
                {isAddingModule ? (
                  <div className="flex gap-1.5">
                    <Input className="h-8 text-xs flex-1" placeholder="Module title..." value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { addStudioModule(newModuleTitle); setNewModuleTitle(""); setIsAddingModule(false); } if (e.key === "Escape") { setIsAddingModule(false); setNewModuleTitle(""); } }}
                      autoFocus />
                    <Button size="sm" className="h-8 px-2 text-xs" onClick={() => { addStudioModule(newModuleTitle); setNewModuleTitle(""); setIsAddingModule(false); }} disabled={!newModuleTitle.trim()}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5 justify-center" onClick={() => setIsAddingModule(true)}>
                    <Plus className="w-3.5 h-3.5" /> New Module
                  </Button>
                )}
              </div>

              {/* Module tree */}
              <div className="flex-1 overflow-y-auto px-2 pb-3">
                {studioCourse.modules.map((mod, mi) => {
                  const isExpanded = studioExpandedMods.includes(mod.id);
                  const filteredLessons = studioSearch.trim()
                    ? mod.lessons.filter(l => l.title.toLowerCase().includes(studioSearch.toLowerCase()))
                    : mod.lessons;
                  if (studioSearch.trim() && filteredLessons.length === 0) return null;

                  return (
                    <div key={mod.id} className="mb-1">
                      {/* Module header */}
                      <div className="flex items-center gap-1 group rounded-lg hover:bg-muted/50 transition-colors">
                        <button className="p-1 text-muted-foreground/50 cursor-grab"><GripVertical className="w-3.5 h-3.5" /></button>
                        <button className="flex-1 flex items-center gap-2 py-2 pr-1 text-left" onClick={() => setStudioExpandedMods(prev => prev.includes(mod.id) ? prev.filter(id => id !== mod.id) : [...prev, mod.id])}>
                          <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-90")} />
                          <span className="text-xs font-semibold text-foreground truncate">{mod.title}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{mod.lessons.length}</span>
                        </button>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button className="p-1 rounded text-muted-foreground hover:text-foreground" title="Duplicate" onClick={() => duplicateStudioModule(mod.id)}>
                            <Copy className="w-3 h-3" />
                          </button>
                          <button className="p-1 rounded text-muted-foreground hover:text-rose-500" title="Delete" onClick={() => deleteStudioModule(mod.id)}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Lessons */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="ml-5 pl-3 border-l border-border/60 space-y-0.5 py-1">
                              {filteredLessons.map(les => {
                                const isSelected = studioLessonPath?.lessonId === les.id;
                                const cfg = LESSON_TYPE_CONFIG[les.type] || LESSON_TYPE_CONFIG.article;
                                const LesIcon = cfg.icon;
                                return (
                                  <button key={les.id}
                                    className={cn("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all text-xs",
                                      isSelected ? "bg-primary/10 border-l-2 border-primary -ml-px" : "hover:bg-muted/50"
                                    )}
                                    onClick={() => setStudioLessonPath({ moduleId: mod.id, lessonId: les.id })}>
                                    <LesIcon className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-primary" : cfg.color)} />
                                    <span className={cn("truncate", isSelected ? "font-semibold text-foreground" : "text-muted-foreground")}>{les.title}</span>
                                    {les.duration && <span className="text-[10px] text-muted-foreground/70 ml-auto shrink-0">{les.duration}</span>}
                                  </button>
                                );
                              })}

                              {/* Add lesson */}
                              <div className="pt-1">
                                <div className="flex items-center gap-1 pl-2">
                                  <button className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors" onClick={() => addStudioLesson(mod.id, "article")}>
                                    <Plus className="w-3 h-3" /> Add
                                  </button>
                                  <div className="flex items-center gap-0.5 ml-1">
                                    {(["article", "video", "quiz", "pdf"] as LessonType[]).map(lt => {
                                      const ltCfg = LESSON_TYPE_CONFIG[lt];
                                      const LtIcon = ltCfg.icon;
                                      return (
                                        <button key={lt} className={cn("p-1 rounded hover:bg-muted transition-colors", ltCfg.color)} title={ltCfg.label}
                                          onClick={() => addStudioLesson(mod.id, lt)}>
                                          <LtIcon className="w-3 h-3" />
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {studioCourse.modules.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <FolderOpen className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No modules yet. Add one above.</p>
                  </div>
                )}
              </div>

              {/* Bottom actions */}
              {studioCourse.modules.length > 0 && (
                <div className="px-4 py-3 border-t border-border shrink-0">
                  <button className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setStudioExpandedMods(studioExpandedMods.length === studioCourse.modules.length ? [] : studioCourse.modules.map(m => m.id))}>
                    {studioExpandedMods.length === studioCourse.modules.length ? "Collapse All" : "Expand All"}
                  </button>
                </div>
              )}
            </div>

            {/* ── Right Panel: Content Editor ── */}
            <div className="flex-1 overflow-y-auto bg-background">
              {/* Empty state */}
              {!studioLesson && (
                <div className="flex-1 flex items-center justify-center h-full">
                  <div className="text-center max-w-sm">
                    <BookOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-foreground mb-2">Select a lesson to edit</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Choose a lesson from the course structure on the left, or create a new one.</p>
                  </div>
                </div>
              )}

              {/* Lesson editor */}
              {studioLesson && studioLessonPath && (
                <div className="max-w-3xl mx-auto px-8 py-8 space-y-8">
                  {/* Lesson title */}
                  <div>
                    <input
                      className="w-full h-12 text-lg font-semibold text-foreground bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground/50"
                      value={studioLesson.title}
                      onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { title: e.target.value })}
                      placeholder="Lesson title..."
                    />
                  </div>

                  {/* Lesson type selector + actions */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(Object.keys(LESSON_TYPE_CONFIG) as LessonType[]).map(lt => {
                        const cfg = LESSON_TYPE_CONFIG[lt];
                        const LtIcon = cfg.icon;
                        const isActive = studioLesson.type === lt;
                        return (
                          <button key={lt}
                            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                              isActive ? `${cfg.bg} ${cfg.color} border-current ring-1 ring-current/20` : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                            )}
                            onClick={() => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { type: lt })}>
                            <LtIcon className="w-3.5 h-3.5" /> {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => toast.info("AI content generation coming soon!")}>
                        <Sparkles className="w-3.5 h-3.5" /> AI Generate
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                        onClick={() => deleteStudioLesson(studioLessonPath.moduleId, studioLessonPath.lessonId)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* ── Video Editor ── */}
                  {studioLesson.type === "video" && (
                    <div className="space-y-8">
                      {/* Video Source */}
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-3 block">Video Source</Label>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <button className={cn("flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all",
                              (studioLesson.videoSource ?? "link") === "link" ? "border-violet-500 bg-violet-500/5 text-violet-700" : "border-border text-muted-foreground hover:border-muted-foreground")}
                            onClick={() => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { videoSource: "link" })}>
                            <Link2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Paste a Link</span>
                          </button>
                          <button className={cn("flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all",
                              studioLesson.videoSource === "upload" ? "border-violet-500 bg-violet-500/5 text-violet-700" : "border-border text-muted-foreground hover:border-muted-foreground")}
                            onClick={() => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { videoSource: "upload" })}>
                            <Upload className="w-5 h-5" />
                            <span className="text-sm font-medium">Upload File</span>
                          </button>
                        </div>

                        {(studioLesson.videoSource ?? "link") === "link" ? (
                          <div>
                            <Input className="h-11 text-sm" placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                              value={studioLesson.videoUrl ?? ""}
                              onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { videoUrl: e.target.value })} />
                            <p className="text-xs text-muted-foreground mt-2">Supports YouTube, Vimeo, and direct video URLs.</p>
                          </div>
                        ) : (
                          <button className="w-full py-10 rounded-xl border-2 border-dashed border-violet-500/30 bg-violet-500/5 text-sm text-muted-foreground hover:text-violet-700 hover:border-violet-500/50 transition-colors flex flex-col items-center gap-3"
                            onClick={() => toast.info("File picker would open here")}>
                            <Upload className="w-8 h-8 text-violet-400" />
                            <span className="font-medium">Click to choose a video file</span>
                            <span className="text-xs text-muted-foreground">MP4, MOV, or WebM -- up to 500MB</span>
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-2 block">Description</Label>
                        <Textarea className="text-sm min-h-[120px] leading-relaxed" placeholder="Describe what this video covers..."
                          value={studioLesson.content}
                          onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { content: e.target.value })} />
                      </div>

                      {/* Transcript */}
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-2 block">Transcript (optional)</Label>
                        <Textarea className="text-sm min-h-[100px] leading-relaxed font-mono text-xs" placeholder="Paste or generate a transcript..."
                          value={studioLesson.transcript ?? ""}
                          onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { transcript: e.target.value })} />
                      </div>

                      {/* Duration */}
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-2 block">Duration</Label>
                        <Input className="h-10 text-sm max-w-[200px]" placeholder="e.g., 12:30"
                          value={studioLesson.duration ?? ""}
                          onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { duration: e.target.value })} />
                      </div>

                      {/* Downloadable Resources */}
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-2 block">Downloadable Resources</Label>
                        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => toast.info("File upload coming soon")}>
                          <Plus className="w-3.5 h-3.5" /> Add Resource
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ── Article Editor ── */}
                  {studioLesson.type === "article" && (
                    <div className="space-y-6">
                      {/* Formatting toolbar (visual only) */}
                      <div className="flex items-center gap-0.5 p-1 rounded-lg border border-border bg-muted/30">
                        {[
                          { icon: "B", title: "Bold", cls: "font-bold" },
                          { icon: "I", title: "Italic", cls: "italic" },
                          { icon: "H", title: "Heading", cls: "font-bold" },
                        ].map(btn => (
                          <button key={btn.title} className={cn("w-8 h-8 rounded-md flex items-center justify-center text-sm text-muted-foreground hover:text-foreground hover:bg-background transition-colors", btn.cls)} title={btn.title}
                            onClick={() => toast.info(`${btn.title} formatting -- rich text editor coming soon`)}>
                            {btn.icon}
                          </button>
                        ))}
                        <div className="w-px h-5 bg-border mx-1" />
                        {[
                          { Icon: ClipboardList, title: "List" },
                          { Icon: Link2, title: "Link" },
                          { Icon: FileText, title: "Image" },
                        ].map(btn => (
                          <button key={btn.title} className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors" title={btn.title}
                            onClick={() => toast.info(`${btn.title} -- rich text editor coming soon`)}>
                            <btn.Icon className="w-4 h-4" />
                          </button>
                        ))}
                        <div className="w-px h-5 bg-border mx-1" />
                        <button className="px-2.5 h-8 rounded-md flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-background transition-colors" title="Code block"
                          onClick={() => toast.info("Code block -- rich text editor coming soon")}>
                          {"</>"}
                        </button>
                        <button className="px-2.5 h-8 rounded-md flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-background transition-colors" title="Callout"
                          onClick={() => toast.info("Callout -- rich text editor coming soon")}>
                          Callout
                        </button>
                      </div>

                      {/* Content area */}
                      <Textarea className="text-sm min-h-[300px] leading-relaxed" placeholder="Write the lesson content that trainees will read..."
                        value={studioLesson.content}
                        onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { content: e.target.value })} />

                      {/* Attachments */}
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-2 block">Attachments</Label>
                        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => toast.info("File upload coming soon")}>
                          <Plus className="w-3.5 h-3.5" /> Add Attachment
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ── Quiz Editor ── */}
                  {studioLesson.type === "quiz" && (
                    <div className="space-y-8">
                      {/* Quiz settings */}
                      <div className="flex items-center gap-6 flex-wrap p-4 rounded-xl border border-border bg-muted/20">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Passing Score</Label>
                          <Input className="h-8 w-20 text-xs text-center" type="number" min={0} max={100}
                            value={studioLesson.passingScore ?? 80}
                            onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { passingScore: parseInt(e.target.value) || 0 })} />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Randomize</Label>
                          <button className={cn("w-9 h-5 rounded-full transition-colors relative",
                              studioLesson.randomizeQuestions ? "bg-primary" : "bg-muted-foreground/30")}
                            onClick={() => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { randomizeQuestions: !studioLesson.randomizeQuestions })}>
                            <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform",
                              studioLesson.randomizeQuestions ? "translate-x-4" : "translate-x-0.5")} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Show Answers</Label>
                          <button className={cn("w-9 h-5 rounded-full transition-colors relative",
                              studioLesson.showCorrectAnswers ? "bg-primary" : "bg-muted-foreground/30")}
                            onClick={() => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { showCorrectAnswers: !studioLesson.showCorrectAnswers })}>
                            <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform",
                              studioLesson.showCorrectAnswers ? "translate-x-4" : "translate-x-0.5")} />
                          </button>
                        </div>
                      </div>

                      {/* Questions */}
                      <div className="space-y-4">
                        {(studioLesson.quizQuestions ?? []).map((q, qi) => (
                          <div key={q.id} className="rounded-xl border border-border p-5 space-y-4 bg-card">
                            <div className="flex items-start gap-3">
                              <span className="text-xs font-bold text-white bg-amber-500 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1">{qi + 1}</span>
                              <div className="flex-1 space-y-3">
                                <Input className="h-10 text-sm font-medium" placeholder="Enter the question..."
                                  value={q.question}
                                  onChange={e => {
                                    const updated = [...(studioLesson.quizQuestions ?? [])];
                                    updated[qi] = { ...updated[qi], question: e.target.value };
                                    updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { quizQuestions: updated });
                                  }} />
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-muted-foreground">Type:</Label>
                                  <select className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                    value={q.questionType}
                                    onChange={e => {
                                      const updated = [...(studioLesson.quizQuestions ?? [])];
                                      updated[qi] = { ...updated[qi], questionType: e.target.value as QuizQuestion["questionType"] };
                                      updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { quizQuestions: updated });
                                    }}>
                                    <option value="multiple_choice">Multiple Choice</option>
                                    <option value="true_false">True / False</option>
                                    <option value="checkbox">Checkbox</option>
                                    <option value="short_answer">Short Answer</option>
                                  </select>
                                </div>

                                {/* Options (for non-short-answer) */}
                                {q.questionType !== "short_answer" && (
                                  <div className="space-y-2 pl-1">
                                    {q.options.map((opt, oi) => (
                                      <div key={oi} className="flex items-center gap-2.5">
                                        <button className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                            (q.questionType === "checkbox" ? (q.correctIndices ?? []).includes(oi) : q.correctIndex === oi)
                                              ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30 hover:border-muted-foreground")}
                                          onClick={() => {
                                            const updated = [...(studioLesson.quizQuestions ?? [])];
                                            if (q.questionType === "checkbox") {
                                              const indices = [...(q.correctIndices ?? [])];
                                              const idx = indices.indexOf(oi);
                                              if (idx >= 0) indices.splice(idx, 1); else indices.push(oi);
                                              updated[qi] = { ...updated[qi], correctIndices: indices };
                                            } else {
                                              updated[qi] = { ...updated[qi], correctIndex: oi };
                                            }
                                            updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { quizQuestions: updated });
                                          }}>
                                          {((q.questionType === "checkbox" ? (q.correctIndices ?? []).includes(oi) : q.correctIndex === oi)) && <CheckCircle2 className="w-3 h-3" />}
                                        </button>
                                        <Input className="h-8 text-xs flex-1" placeholder={`Option ${oi + 1}`}
                                          value={opt}
                                          onChange={e => {
                                            const updated = [...(studioLesson.quizQuestions ?? [])];
                                            const opts = [...updated[qi].options];
                                            opts[oi] = e.target.value;
                                            updated[qi] = { ...updated[qi], options: opts };
                                            updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { quizQuestions: updated });
                                          }} />
                                        {q.options.length > 2 && (
                                          <button className="p-1 rounded text-muted-foreground hover:text-rose-500 transition-colors"
                                            onClick={() => {
                                              const updated = [...(studioLesson.quizQuestions ?? [])];
                                              const opts = [...updated[qi].options];
                                              opts.splice(oi, 1);
                                              updated[qi] = { ...updated[qi], options: opts };
                                              updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { quizQuestions: updated });
                                            }}>
                                            <X className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    {q.questionType !== "true_false" && (
                                      <button className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 pl-7 transition-colors"
                                        onClick={() => {
                                          const updated = [...(studioLesson.quizQuestions ?? [])];
                                          updated[qi] = { ...updated[qi], options: [...updated[qi].options, ""] };
                                          updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { quizQuestions: updated });
                                        }}>
                                        <Plus className="w-3 h-3" /> Add option
                                      </button>
                                    )}
                                  </div>
                                )}

                                {q.questionType === "short_answer" && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground mb-1 block">Expected Answer</Label>
                                    <Input className="h-8 text-xs" placeholder="Enter the correct answer..."
                                      value={q.correctAnswer ?? ""}
                                      onChange={e => {
                                        const updated = [...(studioLesson.quizQuestions ?? [])];
                                        updated[qi] = { ...updated[qi], correctAnswer: e.target.value };
                                        updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { quizQuestions: updated });
                                      }} />
                                  </div>
                                )}
                              </div>
                              <button className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                                onClick={() => {
                                  const updated = (studioLesson.quizQuestions ?? []).filter((_: QuizQuestion, i: number) => i !== qi);
                                  updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { quizQuestions: updated });
                                }}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Add question */}
                        <button className="w-full py-5 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                          onClick={() => addQuizQuestion(studioLessonPath.moduleId, studioLessonPath.lessonId)}>
                          <Plus className="w-4 h-4" /> Add Question
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── PDF Editor ── */}
                  {studioLesson.type === "pdf" && (
                    <div className="space-y-8">
                      {/* Upload zone */}
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-3 block">PDF File</Label>
                        <button className="w-full py-12 rounded-xl border-2 border-dashed border-rose-500/30 bg-rose-500/5 text-sm text-muted-foreground hover:text-rose-700 hover:border-rose-500/50 transition-colors flex flex-col items-center gap-3"
                          onClick={() => toast.info("File picker would open here")}>
                          <File className="w-10 h-10 text-rose-400" />
                          <span className="font-medium">Click to upload a PDF</span>
                          <span className="text-xs text-muted-foreground">or drag and drop -- PDF files up to 50MB</span>
                        </button>
                      </div>

                      {/* Or external URL */}
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-2 block">Or paste an external URL</Label>
                        <Input className="h-10 text-sm" placeholder="https://example.com/document.pdf"
                          value={studioLesson.pdfUrl ?? ""}
                          onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { pdfUrl: e.target.value })} />
                      </div>

                      {/* Description */}
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-2 block">Description</Label>
                        <Textarea className="text-sm min-h-[100px] leading-relaxed" placeholder="Describe this PDF resource..."
                          value={studioLesson.content}
                          onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { content: e.target.value })} />
                      </div>

                      {/* Allow download */}
                      <div className="flex items-center gap-3">
                        <Label className="text-sm font-medium text-foreground">Allow download</Label>
                        <button className={cn("w-9 h-5 rounded-full transition-colors relative",
                            studioLesson.isRequired ? "bg-primary" : "bg-muted-foreground/30")}
                          onClick={() => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { isRequired: !studioLesson.isRequired })}>
                          <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform",
                            studioLesson.isRequired ? "translate-x-4" : "translate-x-0.5")} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Audio Editor ── */}
                  {studioLesson.type === "audio" && (
                    <div className="space-y-8">
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-3 block">Audio Source</Label>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <button className={cn("flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all",
                              (studioLesson.videoSource ?? "link") === "link" ? "border-emerald-500 bg-emerald-500/5 text-emerald-700" : "border-border text-muted-foreground hover:border-muted-foreground")}
                            onClick={() => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { videoSource: "link" })}>
                            <Link2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Paste a Link</span>
                          </button>
                          <button className={cn("flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all",
                              studioLesson.videoSource === "upload" ? "border-emerald-500 bg-emerald-500/5 text-emerald-700" : "border-border text-muted-foreground hover:border-muted-foreground")}
                            onClick={() => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { videoSource: "upload" })}>
                            <Upload className="w-5 h-5" />
                            <span className="text-sm font-medium">Upload File</span>
                          </button>
                        </div>

                        {(studioLesson.videoSource ?? "link") === "link" ? (
                          <div>
                            <Input className="h-11 text-sm" placeholder="https://example.com/audio.mp3"
                              value={studioLesson.videoUrl ?? ""}
                              onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { videoUrl: e.target.value })} />
                            <p className="text-xs text-muted-foreground mt-2">Supports MP3, WAV, and direct audio URLs.</p>
                          </div>
                        ) : (
                          <button className="w-full py-10 rounded-xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 text-sm text-muted-foreground hover:text-emerald-700 hover:border-emerald-500/50 transition-colors flex flex-col items-center gap-3"
                            onClick={() => toast.info("File picker would open here")}>
                            <Headphones className="w-8 h-8 text-emerald-400" />
                            <span className="font-medium">Click to choose an audio file</span>
                            <span className="text-xs text-muted-foreground">MP3, WAV, or OGG -- up to 200MB</span>
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-2 block">Description</Label>
                        <Textarea className="text-sm min-h-[120px] leading-relaxed" placeholder="Describe what this audio covers..."
                          value={studioLesson.content}
                          onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { content: e.target.value })} />
                      </div>

                      {/* Transcript */}
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-2 block">Transcript (optional)</Label>
                        <Textarea className="text-sm min-h-[100px] leading-relaxed font-mono text-xs" placeholder="Paste or generate a transcript..."
                          value={studioLesson.transcript ?? ""}
                          onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { transcript: e.target.value })} />
                      </div>

                      {/* Duration */}
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-2 block">Duration</Label>
                        <Input className="h-10 text-sm max-w-[200px]" placeholder="e.g., 15:00"
                          value={studioLesson.duration ?? ""}
                          onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { duration: e.target.value })} />
                      </div>
                    </div>
                  )}

                  {/* ── Assignment Editor ── */}
                  {studioLesson.type === "assignment" && (
                    <div className="space-y-8">
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-2 block">Assignment Instructions</Label>
                        <Textarea className="text-sm min-h-[200px] leading-relaxed" placeholder="Describe the assignment, requirements, and expectations..."
                          value={studioLesson.content}
                          onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { content: e.target.value })} />
                      </div>

                      {/* Resources */}
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-2 block">Reference Materials</Label>
                        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => toast.info("File upload coming soon")}>
                          <Plus className="w-3.5 h-3.5" /> Add Reference File
                        </Button>
                      </div>

                      {/* Duration */}
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-2 block">Estimated Completion Time</Label>
                        <Input className="h-10 text-sm max-w-[200px]" placeholder="e.g., 45 min"
                          value={studioLesson.duration ?? ""}
                          onChange={e => updateLesson(studioLessonPath.moduleId, studioLessonPath.lessonId, { duration: e.target.value })} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
      {/* Course Settings Drawer                                           */}
      {/* ================================================================ */}
      <AnimatePresence>
        {isSettingsOpen && studioCourse && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setIsSettingsOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col">
              {/* Drawer header */}
              <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-base font-bold text-foreground">Course Settings</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Configure course details and options</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsSettingsOpen(false)}><X className="w-4 h-4" /></Button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <div>
                  <Label className="text-sm font-medium text-foreground">Course Title</Label>
                  <Input className="mt-2 h-10 text-sm" value={studioCourse.title}
                    onChange={e => setCourses(prev => prev.map(c => c.id === studioCourseId ? { ...c, title: e.target.value } : c))} />
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground">Description</Label>
                  <Textarea className="mt-2 text-sm min-h-[80px]" value={studioCourse.description}
                    onChange={e => setCourses(prev => prev.map(c => c.id === studioCourseId ? { ...c, description: e.target.value } : c))} />
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground">Difficulty</Label>
                  <select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    defaultValue="Beginner">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground">Estimated Completion Time</Label>
                  <Input className="mt-2 h-10 text-sm" placeholder="e.g., 2 hours" />
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground">Category</Label>
                  <Input className="mt-2 h-10 text-sm" placeholder="e.g., Onboarding, Safety" />
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground">Tags</Label>
                  <Input className="mt-2 h-10 text-sm" placeholder="e.g., beginner, safety, gospel" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-foreground">Certificate Enabled</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Award a certificate upon completion</p>
                  </div>
                  <button className="w-9 h-5 rounded-full bg-primary relative">
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 translate-x-4" />
                  </button>
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground">Visibility</Label>
                  <select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    defaultValue="Public">
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                    <option value="Unlisted">Unlisted</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground">Enrollment Limit</Label>
                  <Input className="mt-2 h-10 text-sm" type="number" placeholder="Unlimited" />
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground">Language</Label>
                  <Input className="mt-2 h-10 text-sm" placeholder="e.g., English" />
                </div>
              </div>

              {/* Drawer footer */}
              <div className="px-6 py-4 border-t border-border shrink-0">
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                  <Button className="flex-1 gap-2" onClick={() => { setIsSettingsOpen(false); toast.success("Settings saved"); }}>
                    <Save className="w-4 h-4" /> Save Settings
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Course Modal */}
      <AnimatePresence>
        {isNewCourseOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsNewCourseOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-xl border border-border shadow-2xl z-50 w-full max-w-lg">
              <div className="px-8 pt-8 pb-0">
                <h3 className="text-xl font-bold text-foreground">Create New Course</h3>
                <p className="text-sm text-muted-foreground mt-1">Set up a new training course. You can add modules and lessons after creating it.</p>
              </div>
              <div className="px-8 py-6 space-y-5">
                <div>
                  <Label className="text-sm font-medium text-foreground">Course Title</Label>
                  <Input className="mt-2 h-11 text-sm" placeholder="e.g., Advanced Counseling Techniques" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground">Description</Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">Briefly describe what trainees will learn in this course.</p>
                  <Textarea className="text-sm min-h-[100px]" placeholder="What topics will this course cover? What skills will trainees gain?" value={newCourseDesc} onChange={e => setNewCourseDesc(e.target.value)} />
                </div>
              </div>
              <div className="px-8 py-5 border-t border-border flex justify-end gap-3 bg-muted/10 rounded-b-xl">
                <Button variant="outline" onClick={() => setIsNewCourseOpen(false)}>Cancel</Button>
                <Button className="gap-2" disabled={!newCourseTitle.trim()}
                  onClick={() => {
                    const newId = `course-${Date.now()}`;
                    setCourses(prev => [...prev, { id: newId, title: newCourseTitle, description: newCourseDesc, status: "draft", modules: [], enrolledCount: 0, completionRate: 0, createdAt: new Date().toISOString().split("T")[0] }]);
                    setIsNewCourseOpen(false);
                    toast.success("Course created as draft");
                  }}>
                  <Plus className="w-4 h-4" /> Create Course
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
