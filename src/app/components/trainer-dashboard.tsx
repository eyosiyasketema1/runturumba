import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Users, Award, Play, Clock, BookOpen, Video, FileText,
  MessageSquare, CheckCircle2, Circle, Loader2, ChevronRight,
  Plus, GraduationCap, ClipboardList, Timer, TrendingUp,
  Layers, Search, Edit3, Trash2, Send, Star, X,
  AlertCircle, ArrowRight, Eye, Save, BarChart3,
  ChevronDown, Filter, MoreHorizontal,
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
}

interface Tutorial {
  id: string;
  title: string;
  type: MaterialType;
  duration: string;
  description: string;
  steps: TutorialStep[];
  questions: QuizQuestion[];
  status: TutorialStatus;
  completionPercent: number;
  createdAt: string;
  icon: React.ElementType;
}

interface TutorialStep {
  id: string;
  title: string;
  content: string;
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

interface PracticeSessionData {
  id: string;
  traineeId: string;
  traineeName: string;
  scenarioId: string;
  scenarioTitle: string;
  status: "active" | "completed";
  startedAt: string;
  duration: string;
  score?: number;
}

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

const TABS: { id: TrainerTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "trainees", label: "Trainees", icon: GraduationCap },
  { id: "content_studio", label: "Content Studio", icon: Layers },
  { id: "practice_chat", label: "Practice Chat", icon: MessageSquare },
];

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
  { id: "trainee-henok", name: "Henok Tadesse", progress: 88, status: "Ready for Review", daysInTraining: 14, checklistCompleted: [1,2,3,4,5,6,7], email: "henok@example.com" },
  { id: "trainee-selam", name: "Selam Girma", progress: 100, status: "Certified", daysInTraining: 11, checklistCompleted: [1,2,3,4,5,6,7,8], email: "selam@example.com" },
  { id: "trainee-yared", name: "Yared Bekele", progress: 62, status: "Practice Phase", daysInTraining: 9, checklistCompleted: [1,2,3,4,5], email: "yared@example.com" },
  { id: "trainee-mahlet", name: "Mahlet Hailu", progress: 38, status: "In Training", daysInTraining: 6, checklistCompleted: [1,2,3], email: "mahlet@example.com" },
  { id: "trainee-bereket", name: "Bereket Abebe", progress: 50, status: "In Training", daysInTraining: 8, checklistCompleted: [1,2,3,4], email: "bereket@example.com" },
  { id: "trainee-naomi", name: "Naomi Worku", progress: 75, status: "Practice Phase", daysInTraining: 12, checklistCompleted: [1,2,3,4,5,6], email: "naomi@example.com" },
  { id: "trainee-eyob", name: "Eyob Desta", progress: 12, status: "In Training", daysInTraining: 2, checklistCompleted: [1], email: "eyob@example.com" },
];

const INITIAL_TUTORIALS: Tutorial[] = [
  { id: "tut-1", title: "Welcome & Platform Overview", type: "Module", icon: BookOpen, duration: "20 min", description: "Introduction to the platform features and navigation.", steps: [{ id: "s1", title: "Getting Started", content: "Learn how to navigate the dashboard." }, { id: "s2", title: "Key Features", content: "Overview of messaging, contacts, and reporting." }], questions: [], status: "published", completionPercent: 100, createdAt: "2026-06-15" },
  { id: "tut-2", title: "Gospel Conversation Basics", type: "Video", icon: Video, duration: "35 min", description: "Core principles for engaging in gospel conversations online.", steps: [{ id: "s1", title: "Introduction", content: "Why digital evangelism matters." }], questions: [], status: "published", completionPercent: 86, createdAt: "2026-06-16" },
  { id: "tut-3", title: "Responding to Difficult Questions", type: "Module", icon: BookOpen, duration: "25 min", description: "Strategies for handling challenging theological and personal questions.", steps: [{ id: "s1", title: "Common Objections", content: "The most frequent questions seekers ask." }, { id: "s2", title: "Response Framework", content: "Listen, Empathize, Share, Invite." }], questions: [], status: "published", completionPercent: 71, createdAt: "2026-06-17" },
  { id: "tut-4", title: "Trigger Word Protocol", type: "Module", icon: FileText, duration: "10 min", description: "Safety protocols for identifying and escalating sensitive content.", steps: [{ id: "s1", title: "Trigger Words List", content: "Words that require immediate escalation." }], questions: [], status: "published", completionPercent: 71, createdAt: "2026-06-18" },
  { id: "tut-5", title: "Platform Safety Quiz", type: "Quiz", icon: ClipboardList, duration: "12 questions", description: "Assessment of safety protocol knowledge.", steps: [], questions: [{ id: "q1", question: "What should you do when a seeker mentions self-harm?", options: ["Continue the conversation normally", "Escalate immediately to coordinator", "End the conversation", "Ask more details"], correctIndex: 1 }, { id: "q2", question: "Which of these is a trigger word?", options: ["Prayer", "Church", "Suicide", "Bible"], correctIndex: 2 }], status: "published", completionPercent: 57, createdAt: "2026-06-20" },
  { id: "tut-6", title: "Practice: First Contact Scenario", type: "Practice", icon: MessageSquare, duration: "3 scenarios", description: "Simulated first interactions with seekers.", steps: [{ id: "s1", title: "Scenario 1: Curious Seeker", content: "A young person asking about Christianity for the first time." }], questions: [], status: "published", completionPercent: 43, createdAt: "2026-06-22" },
  { id: "tut-7", title: "Cultural Sensitivity Training", type: "Video", icon: Video, duration: "40 min", description: "Understanding cultural contexts in digital ministry.", steps: [], questions: [], status: "published", completionPercent: 29, createdAt: "2026-06-25" },
  { id: "tut-8", title: "Final Certification Assessment", type: "Quiz", icon: ClipboardList, duration: "20 questions", description: "Comprehensive evaluation for volunteer certification.", steps: [], questions: [{ id: "q1", question: "What is the recommended response time?", options: ["Within 1 hour", "Within 24 hours", "Within 1 week", "No deadline"], correctIndex: 1 }], status: "published", completionPercent: 14, createdAt: "2026-07-01" },
  { id: "tut-9", title: "Advanced Counseling Techniques", type: "Module", icon: BookOpen, duration: "30 min", description: "Deep-dive into pastoral counseling best practices for complex situations.", steps: [{ id: "s1", title: "Active Listening", content: "Techniques for demonstrating genuine care." }], questions: [], status: "draft", completionPercent: 0, createdAt: "2026-07-10" },
];

const SCENARIOS: PracticeScenario[] = [
  { id: "sc-1", title: "First Contact", description: "A seeker reaches out for the first time after seeing a social media post.", difficulty: "Beginner", objectives: ["Warm greeting", "Active listening", "Open-ended questions", "Invite to continue conversation"], suggestedOpeners: ["Hi, I saw your post on Instagram about finding peace. I've been going through a really tough time.", "Hello, someone shared your page with me. I'm curious about what you believe.", "Hey, is this where I can talk to someone about God? I have a lot of questions."] },
  { id: "sc-2", title: "Crisis Response", description: "A seeker expresses emotional distress or mentions concerning language.", difficulty: "Advanced", objectives: ["Immediate acknowledgment", "Safety assessment", "Empathetic response", "Appropriate escalation", "Follow-up plan"], suggestedOpeners: ["I don't know if I can keep going anymore. Nothing makes sense.", "Everything is falling apart. My family doesn't care about me.", "I feel so alone and hopeless. I just want the pain to stop."] },
  { id: "sc-3", title: "Follow-up Conversation", description: "Continuing a conversation with a seeker who previously expressed interest.", difficulty: "Intermediate", objectives: ["Reference previous conversation", "Build on established rapport", "Deepen engagement", "Offer next steps"], suggestedOpeners: ["Hey, we talked last week about prayer. I actually tried it and something happened.", "Hi again! I've been thinking about what you said about forgiveness.", "I wanted to come back and ask more. Last time was really helpful."] },
  { id: "sc-4", title: "Difficult Questions", description: "A seeker asks challenging theological or philosophical questions.", difficulty: "Advanced", objectives: ["Acknowledge the question's validity", "Respond with humility", "Share relevant scripture", "Maintain relationship"], suggestedOpeners: ["If God is real, why does he allow so much suffering?", "How can you believe in something you can't see or prove?", "I was raised in a different religion. Why should I change?"] },
];

const PRACTICE_SESSIONS: PracticeSessionData[] = [
  { id: "ps-1", traineeId: "trainee-yared", traineeName: "Yared Bekele", scenarioId: "sc-1", scenarioTitle: "First Contact", status: "active", startedAt: "12 min ago", duration: "12 min" },
  { id: "ps-2", traineeId: "trainee-naomi", traineeName: "Naomi Worku", scenarioId: "sc-2", scenarioTitle: "Crisis Response", status: "active", startedAt: "8 min ago", duration: "8 min" },
  { id: "ps-3", traineeId: "trainee-henok", traineeName: "Henok Tadesse", scenarioId: "sc-3", scenarioTitle: "Follow-up Conversation", status: "completed", startedAt: "1 hour ago", duration: "22 min", score: 9 },
  { id: "ps-4", traineeId: "trainee-bereket", traineeName: "Bereket Abebe", scenarioId: "sc-1", scenarioTitle: "First Contact", status: "completed", startedAt: "3 hours ago", duration: "18 min", score: 7 },
];

const INITIAL_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  "ps-1": [
    { id: "m1", sender: "seeker", senderName: "Trainer (as Seeker)", text: "Hi, I saw your post on Instagram about finding peace. I've been going through a really tough time and I'm not sure what to believe anymore.", timestamp: "2:14 PM" },
    { id: "m2", sender: "trainee", senderName: "Yared Bekele", text: "Hello! Thank you so much for reaching out. I'm really glad you did. I'd love to hear more about what you're going through. What's been on your mind lately?", timestamp: "2:15 PM" },
    { id: "m3", sender: "seeker", senderName: "Trainer (as Seeker)", text: "My parents just got divorced and I feel like everything is falling apart. A friend told me about God but I don't know if I believe in that stuff.", timestamp: "2:17 PM" },
    { id: "m4", sender: "trainee", senderName: "Yared Bekele", text: "I'm so sorry to hear about your parents. That must be incredibly painful. It's completely normal to have questions and doubts during hard times like these. Can I ask — what made you decide to reach out today?", timestamp: "2:18 PM" },
  ],
  "ps-2": [
    { id: "m1", sender: "seeker", senderName: "Trainer (as Seeker)", text: "I don't know if I can keep going anymore. Nothing makes sense.", timestamp: "2:22 PM" },
    { id: "m2", sender: "trainee", senderName: "Naomi Worku", text: "I hear you, and I want you to know that what you're feeling matters. You reached out, and that takes courage. Can you tell me a little more about what's going on right now?", timestamp: "2:23 PM" },
    { id: "m3", sender: "seeker", senderName: "Trainer (as Seeker)", text: "I just lost my job and my girlfriend left me. I have nothing left.", timestamp: "2:24 PM" },
  ],
  "ps-3": [
    { id: "m1", sender: "seeker", senderName: "Trainer (as Seeker)", text: "Hey, we talked last week about prayer. I actually tried it and something happened.", timestamp: "1:00 PM" },
    { id: "m2", sender: "trainee", senderName: "Henok Tadesse", text: "That's wonderful to hear! I'm so glad you tried it. I'd love to hear what happened — what was your experience like?", timestamp: "1:01 PM" },
    { id: "m3", sender: "seeker", senderName: "Trainer (as Seeker)", text: "I felt this peace I haven't felt in years. Like something lifted off my shoulders. Is that normal?", timestamp: "1:03 PM" },
    { id: "m4", sender: "trainee", senderName: "Henok Tadesse", text: "What you're describing is something many people experience when they begin connecting with God. That sense of peace is a beautiful thing. Would you like to explore that connection further? I can share some passages that speak to what you felt.", timestamp: "1:04 PM" },
  ],
};

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
  { id: "a6", text: "New tutorial draft: Advanced Counseling Techniques", icon: Edit3, color: "text-slate-500", time: "2 days ago" },
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
  contacts,
  messages,
  users,
  currentUser,
}: TrainerDashboardProps) => {
  // -- Tab state --
  const [activeTab, setActiveTab] = useState<TrainerTab>("overview");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // -- Trainees tab --
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | null>(null);

  // -- Content Studio (US31) --
  const [tutorials, setTutorials] = useState<Tutorial[]>(INITIAL_TUTORIALS);
  const [contentFilter, setContentFilter] = useState<MaterialType | "all">("all");
  const [contentSearch, setContentSearch] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorType, setEditorType] = useState<MaterialType>("Module");
  const [editorDuration, setEditorDuration] = useState("");
  const [editorDescription, setEditorDescription] = useState("");
  const [editorSteps, setEditorSteps] = useState<TutorialStep[]>([]);
  const [editorQuestions, setEditorQuestions] = useState<QuizQuestion[]>([]);
  const [editorStatus, setEditorStatus] = useState<TutorialStatus>("draft");

  // -- Practice Chat (US32) --
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_CHAT_MESSAGES);
  const [chatInput, setChatInput] = useState("");
  const [evalChecks, setEvalChecks] = useState<Record<string, Record<string, boolean>>>({});
  const [evalNotes, setEvalNotes] = useState<Record<string, string>>({});
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionTrainee, setNewSessionTrainee] = useState("");
  const [newSessionScenario, setNewSessionScenario] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // -- Derived data --
  const activeTrainees = TRAINEES.filter(t => t.status !== "Certified").length;
  const certifiedCount = TRAINEES.filter(t => t.status === "Certified").length;
  const activeSessionCount = PRACTICE_SESSIONS.filter(p => p.status === "active").length;
  const avgCertDays = Math.round(TRAINEES.reduce((s, t) => s + t.daysInTraining, 0) / TRAINEES.length);

  const pipelineStages = useMemo(() => [
    { label: "In Training", count: TRAINEES.filter(t => t.status === "In Training").length, color: "bg-blue-500", textColor: "text-blue-600" },
    { label: "Practice", count: TRAINEES.filter(t => t.status === "Practice Phase").length, color: "bg-violet-500", textColor: "text-violet-600" },
    { label: "Review", count: TRAINEES.filter(t => t.status === "Ready for Review").length, color: "bg-amber-500", textColor: "text-amber-600" },
    { label: "Certified", count: TRAINEES.filter(t => t.status === "Certified").length, color: "bg-emerald-500", textColor: "text-emerald-600" },
  ], []);

  const selectedTrainee = selectedTraineeId ? TRAINEES.find(t => t.id === selectedTraineeId) ?? null : null;

  const filteredTutorials = useMemo(() => {
    let result = tutorials;
    if (contentFilter !== "all") result = result.filter(t => t.type === contentFilter);
    if (contentSearch.trim()) {
      const q = contentSearch.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    return result;
  }, [tutorials, contentFilter, contentSearch]);

  const activeSession = activeSessionId ? PRACTICE_SESSIONS.find(s => s.id === activeSessionId) ?? null : null;
  const activeScenario = activeSession ? SCENARIOS.find(s => s.id === activeSession.scenarioId) ?? null : null;
  const sessionMessages = activeSessionId ? (chatMessages[activeSessionId] ?? []) : [];

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessionMessages.length]);

  // -- Greeting --
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = currentUser.name.split(" ")[0];

  // -- Editor actions --
  const openNewTutorial = useCallback(() => {
    setEditingId(null);
    setEditorTitle("");
    setEditorType("Module");
    setEditorDuration("");
    setEditorDescription("");
    setEditorSteps([]);
    setEditorQuestions([]);
    setEditorStatus("draft");
    setIsEditorOpen(true);
  }, []);

  const openEditTutorial = useCallback((tut: Tutorial) => {
    setEditingId(tut.id);
    setEditorTitle(tut.title);
    setEditorType(tut.type);
    setEditorDuration(tut.duration);
    setEditorDescription(tut.description);
    setEditorSteps([...tut.steps]);
    setEditorQuestions([...tut.questions]);
    setEditorStatus(tut.status);
    setIsEditorOpen(true);
  }, []);

  const saveTutorial = useCallback((asStatus: TutorialStatus) => {
    if (!editorTitle.trim()) { toast.error("Title is required"); return; }
    const icon = editorType === "Video" ? Video : editorType === "Quiz" ? ClipboardList : editorType === "Practice" ? MessageSquare : BookOpen;
    if (editingId) {
      setTutorials(prev => prev.map(t => t.id === editingId ? {
        ...t, title: editorTitle, type: editorType, duration: editorDuration, description: editorDescription,
        steps: editorSteps, questions: editorQuestions, status: asStatus, icon,
      } : t));
      toast.success(`Tutorial updated${asStatus === "published" ? " and published" : ""}`);
    } else {
      const newTut: Tutorial = {
        id: `tut-${Date.now()}`, title: editorTitle, type: editorType, icon, duration: editorDuration,
        description: editorDescription, steps: editorSteps, questions: editorQuestions,
        status: asStatus, completionPercent: 0, createdAt: new Date().toISOString().split("T")[0],
      };
      setTutorials(prev => [newTut, ...prev]);
      toast.success(`Tutorial created${asStatus === "published" ? " and published" : " as draft"}`);
    }
    setIsEditorOpen(false);
  }, [editingId, editorTitle, editorType, editorDuration, editorDescription, editorSteps, editorQuestions]);

  const addStep = useCallback(() => {
    setEditorSteps(prev => [...prev, { id: `step-${Date.now()}`, title: "", content: "" }]);
  }, []);

  const removeStep = useCallback((stepId: string) => {
    setEditorSteps(prev => prev.filter(s => s.id !== stepId));
  }, []);

  const addQuestion = useCallback(() => {
    setEditorQuestions(prev => [...prev, { id: `q-${Date.now()}`, question: "", options: ["", "", "", ""], correctIndex: 0 }]);
  }, []);

  const removeQuestion = useCallback((qId: string) => {
    setEditorQuestions(prev => prev.filter(q => q.id !== qId));
  }, []);

  // -- Chat actions (US32) --
  const sendMessage = useCallback(() => {
    if (!chatInput.trim() || !activeSessionId || !activeSession) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "seeker",
      senderName: "Trainer (as Seeker)",
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
    setChatMessages(prev => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] ?? []), newMsg],
    }));
    setChatInput("");

    // Simulate trainee response after a brief delay
    setTimeout(() => {
      const response: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "trainee",
        senderName: activeSession.traineeName,
        text: getNextTraineeResponse(),
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      };
      setChatMessages(prev => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] ?? []), response],
      }));
    }, 1500);
  }, [chatInput, activeSessionId, activeSession]);

  const toggleEvalCheck = useCallback((sessionId: string, key: string) => {
    setEvalChecks(prev => ({
      ...prev,
      [sessionId]: { ...(prev[sessionId] ?? {}), [key]: !(prev[sessionId]?.[key]) },
    }));
  }, []);

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 p-6 lg:p-8 animate-in fade-in duration-500 bg-gradient-to-br from-slate-50 via-background to-blue-50/30 min-h-full">
      {/* ================================================================ */}
      {/* Hero Header                                                      */}
      {/* ================================================================ */}
      <header className="relative overflow-hidden rounded-sm bg-slate-950 text-white p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)]">
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-violet-500/40 to-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-500/20 to-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-[0.18em]">
                Trainer &middot; Volunteer Development
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05]">
              {greeting},{" "}
              <span className="text-violet-300">{firstName}</span>.
            </h1>
            <p className="text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
              <span className="font-semibold text-white">{activeTrainees} trainees in progress</span>
              <span className="mx-2 text-slate-500">&middot;</span>
              <span className="font-semibold text-emerald-300">{certifiedCount} certified</span>
              <span className="mx-2 text-slate-500">&middot;</span>
              <span className="font-semibold text-pink-300">{activeSessionCount} active practice sessions</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* Tab Bar                                                          */}
      {/* ================================================================ */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg border border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* OVERVIEW TAB                                                     */}
      {/* ================================================================ */}
      {activeTab === "overview" && (
        <>
          {/* KPI Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Active Trainees", value: activeTrainees, icon: Users, color: "text-blue-600", bg: "bg-blue-500/10" },
              { label: "Certified This Month", value: certifiedCount, icon: Award, color: "text-emerald-600", bg: "bg-emerald-500/10" },
              { label: "Active Practice Sessions", value: activeSessionCount, icon: Play, color: "text-violet-600", bg: "bg-violet-500/10" },
              { label: "Avg Certification Time", value: `${avgCertDays}d`, icon: Timer, color: "text-amber-600", bg: "bg-amber-500/10" },
            ].map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}
                className="bg-card p-5 rounded-lg border border-border shadow-sm group hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-2 rounded-md border border-border group-hover:border-primary/20 transition-all", kpi.bg)}>
                    <kpi.icon className={cn("w-4 h-4", kpi.color)} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
                <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">{kpi.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Pipeline + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Training Pipeline */}
            <div className="lg:col-span-7">
              <div className="bg-card rounded-lg border border-border shadow-sm p-6">
                <h2 className="text-sm font-bold text-foreground mb-1">Training Pipeline</h2>
                <p className="text-xs text-muted-foreground mb-5">Volunteer progression through onboarding stages</p>
                <div className="flex items-center gap-2">
                  {pipelineStages.map((stage, i) => (
                    <React.Fragment key={stage.label}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex-1 text-center"
                      >
                        <div className={cn("mx-auto w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-2", stage.color)}>
                          {stage.count}
                        </div>
                        <p className={cn("text-xs font-semibold", stage.textColor)}>{stage.label}</p>
                      </motion.div>
                      {i < pipelineStages.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                {/* Trainee names under each stage */}
                <div className="flex gap-2 mt-4">
                  {pipelineStages.map((stage) => {
                    const traineesInStage = TRAINEES.filter(t => {
                      if (stage.label === "In Training") return t.status === "In Training";
                      if (stage.label === "Practice") return t.status === "Practice Phase";
                      if (stage.label === "Review") return t.status === "Ready for Review";
                      return t.status === "Certified";
                    });
                    return (
                      <div key={stage.label} className="flex-1 text-center">
                        {traineesInStage.map(t => (
                          <p key={t.id} className="text-[11px] text-muted-foreground truncate">{t.name.split(" ")[0]}</p>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{tutorials.filter(t => t.status === "published").length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Published Tutorials</p>
                </div>
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{tutorials.filter(t => t.status === "draft").length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Draft Tutorials</p>
                </div>
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{PRACTICE_SESSIONS.filter(s => s.score).length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Sessions Scored</p>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="lg:col-span-5">
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-border">
                  <h2 className="text-sm font-bold text-foreground">Recent Activity</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Latest updates from your trainees</p>
                </div>
                <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
                  {ACTIVITY_FEED.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="px-5 py-3.5 flex items-start gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className={cn("mt-0.5 shrink-0", item.color)}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground leading-relaxed">{item.text}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{item.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================================================================ */}
      {/* TRAINEES TAB                                                     */}
      {/* ================================================================ */}
      {activeTab === "trainees" && (
        <div className="space-y-6">
          {/* Trainee Table */}
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Trainee Roster</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{TRAINEES.length} volunteers in onboarding pipeline</p>
              </div>
              <Button size="sm" className="text-xs gap-2" onClick={() => toast.info("Opening enrollment form...")}>
                <Plus className="w-3.5 h-3.5" />
                Enroll Trainee
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3">Trainee</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3">Status</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3">Progress</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3">Current Step</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3">Days</th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {TRAINEES.map((trainee, i) => {
                    const nextStep = CHECKLIST_STEPS.find(s => !trainee.checklistCompleted.includes(s.step));
                    return (
                      <motion.tr key={trainee.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className={cn(
                          "hover:bg-muted/30 transition-colors cursor-pointer",
                          selectedTraineeId === trainee.id && "bg-muted/50"
                        )}
                        onClick={() => setSelectedTraineeId(selectedTraineeId === trainee.id ? null : trainee.id)}
                      >
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
                          <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", STATUS_BADGE[trainee.status])}>
                            {trainee.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 w-32">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", trainee.progress >= 100 ? "bg-emerald-500" : trainee.progress >= 60 ? "bg-blue-500" : "bg-amber-500")}
                                style={{ width: `${trainee.progress}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-muted-foreground w-8 text-right">{trainee.progress}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs text-foreground">{nextStep ? `Step ${nextStep.step}: ${nextStep.title}` : "Completed"}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{trainee.daysInTraining}d</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setActiveTab("practice_chat"); toast.info(`Select ${trainee.name.split(" ")[0]} in Practice Chat to start a session`); }}>
                              <MessageSquare className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); }}>
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trainee Detail — Onboarding Checklist (shown when a trainee is selected) */}
          <AnimatePresence>
            {selectedTrainee && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
              >
                <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold", avatarColor(selectedTrainee.id))}>
                      {getInitial(selectedTrainee.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-foreground">{selectedTrainee.name}</h2>
                        <Badge variant="outline" className={cn("text-[10px]", STATUS_BADGE[selectedTrainee.status])}>{selectedTrainee.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedTrainee.checklistCompleted.length} of {CHECKLIST_STEPS.length} steps completed &middot; Day {selectedTrainee.daysInTraining}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedTraineeId(null)}>
                    <X className="w-3.5 h-3.5 mr-1" /> Close
                  </Button>
                </div>

                {/* Progress bar */}
                <div className="px-6 py-3 border-b border-border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${selectedTrainee.progress}%` }}
                        transition={{ duration: 0.5 }} />
                    </div>
                    <span className="text-xs font-bold text-foreground w-10 text-right">{selectedTrainee.progress}%</span>
                  </div>
                </div>

                {/* Checklist grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">
                  {CHECKLIST_STEPS.map((step, i) => {
                    const isCompleted = selectedTrainee.checklistCompleted.includes(step.step);
                    const isNext = !isCompleted && selectedTrainee.checklistCompleted.includes(step.step - 1);
                    return (
                      <div key={step.step} className={cn("px-5 py-4 flex items-start gap-3", isCompleted && "bg-emerald-500/5")}>
                        <div className="shrink-0 mt-0.5">
                          {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            : isNext ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                            : <Circle className="w-5 h-5 text-muted-foreground/30" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-muted-foreground">STEP {step.step}</span>
                          <p className={cn("text-xs font-medium mt-0.5", isCompleted || isNext ? "text-foreground" : "text-muted-foreground")}>{step.title}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ================================================================ */}
      {/* CONTENT STUDIO TAB (US31)                                        */}
      {/* ================================================================ */}
      {activeTab === "content_studio" && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Content Studio</h2>
              <p className="text-sm text-muted-foreground">Create and manage training tutorials, quizzes, and practice scenarios</p>
            </div>
            <Button size="sm" className="gap-2" onClick={openNewTutorial}>
              <Plus className="w-4 h-4" />
              Create Tutorial
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tutorials..."
                className="pl-9 h-9 text-sm"
                value={contentSearch}
                onChange={e => setContentSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 p-0.5 bg-muted rounded-md border border-border">
              {(["all", "Module", "Video", "Quiz", "Practice"] as const).map(f => (
                <button key={f} onClick={() => setContentFilter(f)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
                    contentFilter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTutorials.map((tut, i) => (
              <motion.div key={tut.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-lg border border-border shadow-sm overflow-hidden group hover:border-primary/30 transition-all"
              >
                {/* Card top accent */}
                <div className={cn("h-1", tut.type === "Module" ? "bg-blue-500" : tut.type === "Video" ? "bg-violet-500" : tut.type === "Quiz" ? "bg-amber-500" : "bg-emerald-500")} />

                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("p-2 rounded-md border border-border", MATERIAL_BADGE[tut.type].split(" ")[0])}>
                      <tut.icon className={cn("w-4 h-4", MATERIAL_BADGE[tut.type].split(" ")[1])} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", tut.status === "published" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20")}>
                        {tut.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-2 leading-snug">{tut.title}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">{tut.description}</p>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", MATERIAL_BADGE[tut.type])}>{tut.type}</Badge>
                    <span className="text-[11px] text-muted-foreground">{tut.duration}</span>
                  </div>

                  {/* Completion bar */}
                  {tut.status === "published" && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${tut.completionPercent}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">{tut.completionPercent}%</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px] gap-1" onClick={() => openEditTutorial(tut)}>
                      <Edit3 className="w-3 h-3" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => toast.info("Preview: " + tut.title)}>
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600"
                      onClick={() => { setTutorials(prev => prev.filter(t => t.id !== tut.id)); toast.success("Tutorial deleted"); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredTutorials.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <Layers className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No tutorials found</p>
                <Button size="sm" variant="outline" className="mt-3 text-xs gap-1" onClick={openNewTutorial}>
                  <Plus className="w-3 h-3" /> Create your first tutorial
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* PRACTICE CHAT TAB (US32)                                         */}
      {/* ================================================================ */}
      {activeTab === "practice_chat" && (
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-340px)] min-h-[500px]">
          {/* Left — Session List */}
          <div className="col-span-3 bg-card rounded-lg border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 pt-4 pb-3 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">Sessions</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Practice conversations</p>
            </div>

            {/* Active sessions */}
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              <div className="px-3 pt-3 pb-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Active</p>
              </div>
              {PRACTICE_SESSIONS.filter(s => s.status === "active").map(session => (
                <button key={session.id}
                  className={cn("w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors", activeSessionId === session.id && "bg-muted/70")}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate">{session.traineeName}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 pl-4">{session.scenarioTitle} &middot; {session.duration}</p>
                </button>
              ))}

              <div className="px-3 pt-3 pb-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Completed</p>
              </div>
              {PRACTICE_SESSIONS.filter(s => s.status === "completed").map(session => (
                <button key={session.id}
                  className={cn("w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors", activeSessionId === session.id && "bg-muted/70")}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">{session.traineeName}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 pl-[22px]">
                    <p className="text-[11px] text-muted-foreground">{session.scenarioTitle}</p>
                    {session.score != null && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20">
                        {session.score}/10
                      </Badge>
                    )}
                  </div>
                </button>
              ))}

              {/* Scenarios */}
              <div className="px-3 pt-4 pb-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Scenarios</p>
              </div>
              {SCENARIOS.map(sc => (
                <div key={sc.id} className="px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground">{sc.title}</p>
                    <Badge variant="outline" className={cn("text-[9px] px-1 py-0", DIFFICULTY_BADGE[sc.difficulty])}>{sc.difficulty}</Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* New Session Button */}
            <div className="px-3 py-3 border-t border-border">
              <Button size="sm" className="w-full text-xs gap-2" onClick={() => setShowNewSessionModal(true)}>
                <Plus className="w-3.5 h-3.5" />
                New Practice Session
              </Button>
            </div>
          </div>

          {/* Center — Chat Area */}
          <div className="col-span-6 bg-card rounded-lg border border-border shadow-sm overflow-hidden flex flex-col">
            {activeSession ? (
              <>
                {/* Chat header */}
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">{activeSession.traineeName}</h3>
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0",
                        activeSession.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                      )}>
                        {activeSession.status === "active" ? "Live" : "Completed"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Scenario: {activeSession.scenarioTitle} &middot; Duration: {activeSession.duration}
                    </p>
                  </div>
                  {activeSession.status === "active" && (
                    <Button variant="outline" size="sm" className="text-xs gap-1 text-rose-500 hover:text-rose-600 border-rose-500/20"
                      onClick={() => toast.success("Practice session ended. Score the trainee in the evaluation panel.")}>
                      <AlertCircle className="w-3 h-3" /> End Session
                    </Button>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {/* Scenario context banner */}
                  {activeScenario && (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 mb-2">
                      <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-widest mb-1">Scenario: {activeScenario.title}</p>
                      <p className="text-xs text-muted-foreground">{activeScenario.description}</p>
                    </div>
                  )}

                  {sessionMessages.map(msg => (
                    <div key={msg.id} className={cn("flex gap-3", msg.sender === "seeker" ? "justify-end" : "justify-start")}>
                      {msg.sender === "trainee" && (
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-1", avatarColor(activeSession.traineeId))}>
                          {getInitial(msg.senderName)}
                        </div>
                      )}
                      <div className={cn("max-w-[70%] rounded-xl px-4 py-2.5",
                        msg.sender === "seeker"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      )}>
                        <p className={cn("text-[10px] font-semibold mb-0.5", msg.sender === "seeker" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {msg.senderName}
                        </p>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p className={cn("text-[10px] mt-1", msg.sender === "seeker" ? "text-primary-foreground/50" : "text-muted-foreground/70")}>{msg.timestamp}</p>
                      </div>
                      {msg.sender === "seeker" && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0 mt-1">
                          T
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat input */}
                {activeSession.status === "active" && (
                  <div className="px-5 py-3.5 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Type as seeker to test trainee's response..."
                          className="pr-10 h-10 text-sm"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        />
                      </div>
                      <Button size="sm" className="h-10 px-4 gap-2" onClick={sendMessage} disabled={!chatInput.trim()}>
                        <Send className="w-4 h-4" />
                        Send
                      </Button>
                    </div>
                    {activeScenario && (
                      <div className="mt-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Suggested prompts:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {activeScenario.suggestedOpeners.slice(0, 3).map((opener, i) => (
                            <button key={i} className="text-[11px] text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-2.5 py-1 rounded-md transition-colors truncate max-w-[200px]"
                              onClick={() => setChatInput(opener)}>
                              {opener.slice(0, 50)}{opener.length > 50 ? "..." : ""}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Select a session to view the conversation</p>
                  <p className="text-xs text-muted-foreground mt-1">Or start a new practice session from the sidebar</p>
                </div>
              </div>
            )}
          </div>

          {/* Right — Evaluation Panel */}
          <div className="col-span-3 bg-card rounded-lg border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 pt-4 pb-3 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">Evaluation</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Score trainee performance</p>
            </div>

            {activeSession && activeScenario ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Objectives checklist */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Objectives</p>
                  <div className="space-y-2">
                    {activeScenario.objectives.map((obj, i) => {
                      const key = `${activeSessionId}-obj-${i}`;
                      const checked = evalChecks[activeSessionId!]?.[`obj-${i}`] ?? false;
                      return (
                        <button key={i}
                          className="flex items-center gap-2.5 w-full text-left group"
                          onClick={() => toggleEvalCheck(activeSessionId!, `obj-${i}`)}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                            checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30 group-hover:border-muted-foreground"
                          )}>
                            {checked && <CheckCircle2 className="w-3 h-3" />}
                          </div>
                          <span className={cn("text-xs", checked ? "text-foreground" : "text-muted-foreground")}>{obj}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Scoring */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Quick Score</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[...Array(10)].map((_, i) => {
                      const score = i + 1;
                      const currentScore = evalChecks[activeSessionId!]?.["score"];
                      const isSelected = currentScore === score;
                      return (
                        <button key={score}
                          className={cn(
                            "h-9 rounded-md text-xs font-bold border transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                          )}
                          onClick={() => setEvalChecks(prev => ({ ...prev, [activeSessionId!]: { ...(prev[activeSessionId!] ?? {}), score } }))}
                        >
                          {score}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Feedback Notes */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Feedback Notes</p>
                  <Textarea
                    placeholder="Write feedback for the trainee..."
                    className="text-xs min-h-[100px] resize-none"
                    value={evalNotes[activeSessionId!] ?? ""}
                    onChange={e => setEvalNotes(prev => ({ ...prev, [activeSessionId!]: e.target.value }))}
                  />
                </div>

                {/* Save button */}
                <Button size="sm" className="w-full text-xs gap-2"
                  onClick={() => toast.success(`Evaluation saved for ${activeSession.traineeName}`)}>
                  <Save className="w-3.5 h-3.5" />
                  Save Evaluation
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <Star className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Select a session to evaluate</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* Tutorial Editor Drawer (US31)                                    */}
      {/* ================================================================ */}
      <AnimatePresence>
        {isEditorOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsEditorOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background border-l border-border shadow-2xl z-50 flex flex-col"
            >
              {/* Editor Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {editingId ? "Edit Tutorial" : "Create Tutorial"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Build training content for your volunteers</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditorOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Editor Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold">Title</Label>
                    <Input className="mt-1.5" placeholder="e.g., Advanced Gospel Conversation Techniques" value={editorTitle} onChange={e => setEditorTitle(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Type</Label>
                      <div className="flex gap-1 mt-1.5 p-0.5 bg-muted rounded-md border border-border">
                        {(["Module", "Video", "Quiz", "Practice"] as MaterialType[]).map(t => (
                          <button key={t} onClick={() => setEditorType(t)}
                            className={cn("flex-1 px-2 py-1.5 text-xs font-medium rounded-sm transition-colors",
                              editorType === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Duration</Label>
                      <Input className="mt-1.5" placeholder="e.g., 25 min" value={editorDuration} onChange={e => setEditorDuration(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Description</Label>
                    <Textarea className="mt-1.5 text-sm min-h-[80px]" placeholder="Brief description of this tutorial..."
                      value={editorDescription} onChange={e => setEditorDescription(e.target.value)} />
                  </div>
                </div>

                {/* Steps Editor */}
                {(editorType === "Module" || editorType === "Practice" || editorType === "Video") && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-xs font-semibold">Steps ({editorSteps.length})</Label>
                      <Button variant="outline" size="sm" className="text-xs gap-1 h-7" onClick={addStep}>
                        <Plus className="w-3 h-3" /> Add Step
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {editorSteps.map((step, i) => (
                        <div key={step.id} className="bg-muted/30 rounded-lg border border-border p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Step {i + 1}</span>
                            <Input className="flex-1 h-7 text-xs" placeholder="Step title"
                              value={step.title} onChange={e => setEditorSteps(prev => prev.map(s => s.id === step.id ? { ...s, title: e.target.value } : s))} />
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500" onClick={() => removeStep(step.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <Textarea className="text-xs min-h-[60px]" placeholder="Step content..."
                            value={step.content} onChange={e => setEditorSteps(prev => prev.map(s => s.id === step.id ? { ...s, content: e.target.value } : s))} />
                        </div>
                      ))}
                      {editorSteps.length === 0 && (
                        <div className="text-center py-6 text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                          No steps yet. Click "Add Step" to begin.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quiz Question Builder */}
                {editorType === "Quiz" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-xs font-semibold">Questions ({editorQuestions.length})</Label>
                      <Button variant="outline" size="sm" className="text-xs gap-1 h-7" onClick={addQuestion}>
                        <Plus className="w-3 h-3" /> Add Question
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {editorQuestions.map((q, qi) => (
                        <div key={q.id} className="bg-muted/30 rounded-lg border border-border p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Q{qi + 1}</span>
                            <Input className="flex-1 h-7 text-xs" placeholder="Question text"
                              value={q.question} onChange={e => setEditorQuestions(prev => prev.map(x => x.id === q.id ? { ...x, question: e.target.value } : x))} />
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500" onClick={() => removeQuestion(q.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="space-y-1.5 ml-1">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <button
                                  className={cn("w-4 h-4 rounded-full border-2 shrink-0 transition-colors",
                                    q.correctIndex === oi ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/30 hover:border-muted-foreground"
                                  )}
                                  onClick={() => setEditorQuestions(prev => prev.map(x => x.id === q.id ? { ...x, correctIndex: oi } : x))}
                                />
                                <Input className="h-7 text-xs flex-1" placeholder={`Option ${oi + 1}`}
                                  value={opt}
                                  onChange={e => setEditorQuestions(prev => prev.map(x => x.id === q.id ? {
                                    ...x, options: x.options.map((o, k) => k === oi ? e.target.value : o)
                                  } : x))} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {editorQuestions.length === 0 && (
                        <div className="text-center py-6 text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                          No questions yet. Click "Add Question" to begin building the quiz.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Editor Footer */}
              <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0 bg-muted/20">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => saveTutorial("draft")}>
                    <Save className="w-3 h-3" /> Save Draft
                  </Button>
                  <Button size="sm" className="text-xs gap-1" onClick={() => saveTutorial("published")}>
                    <CheckCircle2 className="w-3 h-3" /> Publish
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* New Session Modal (US32)                                         */}
      {/* ================================================================ */}
      <AnimatePresence>
        {showNewSessionModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowNewSessionModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg border border-border shadow-2xl z-50 w-full max-w-md p-6"
            >
              <h3 className="text-base font-bold text-foreground mb-1">New Practice Session</h3>
              <p className="text-xs text-muted-foreground mb-5">Pair a trainee with a scenario to start practicing</p>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold">Trainee</Label>
                  <div className="mt-1.5 space-y-1">
                    {TRAINEES.filter(t => t.status !== "Certified").map(t => (
                      <button key={t.id}
                        className={cn("w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors",
                          newSessionTrainee === t.id ? "bg-primary/10 text-primary border border-primary/30" : "hover:bg-muted border border-transparent"
                        )}
                        onClick={() => setNewSessionTrainee(t.id)}
                      >
                        {t.name} <span className="text-muted-foreground">({t.status})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Scenario</Label>
                  <div className="mt-1.5 space-y-1">
                    {SCENARIOS.map(sc => (
                      <button key={sc.id}
                        className={cn("w-full text-left px-3 py-2 rounded-md text-xs transition-colors",
                          newSessionScenario === sc.id ? "bg-primary/10 text-primary border border-primary/30" : "hover:bg-muted border border-transparent"
                        )}
                        onClick={() => setNewSessionScenario(sc.id)}
                      >
                        <span className="font-medium">{sc.title}</span>
                        <Badge variant="outline" className={cn("ml-2 text-[9px] px-1 py-0", DIFFICULTY_BADGE[sc.difficulty])}>{sc.difficulty}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowNewSessionModal(false)}>Cancel</Button>
                <Button size="sm" className="text-xs gap-1"
                  disabled={!newSessionTrainee || !newSessionScenario}
                  onClick={() => {
                    const trainee = TRAINEES.find(t => t.id === newSessionTrainee);
                    const scenario = SCENARIOS.find(s => s.id === newSessionScenario);
                    if (trainee && scenario) {
                      toast.success(`Practice session started: ${trainee.name} → ${scenario.title}`);
                      setShowNewSessionModal(false);
                      setNewSessionTrainee("");
                      setNewSessionScenario("");
                    }
                  }}
                >
                  <Play className="w-3 h-3" /> Start Session
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
