// Shared types, constants, and mock data for Turumba

import {
  MessageSquare, Smartphone, Mail, Send, Facebook, Phone, Server
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility for Tailwind class merging */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

export type Role = "admin" | "agent" | "viewer";
export type Plan = "free" | "pro" | "enterprise";
export type Status = "active" | "pending";
export type MessageStatus = "sent" | "delivered" | "read" | "failed" | "scheduled" | "received";
export type ChannelType = "whatsapp" | "sms" | "email" | "telegram" | "messenger" | "smpp";
/** @deprecated Use ChannelType instead */
export type MessagePort = ChannelType;
export type ScheduleFrequency = "once" | "daily" | "weekly" | "biweekly" | "monthly";
export type ChannelStatus = "connected" | "disconnected" | "error" | "rate_limited";

// --- Discipleship Types ---

export type MaturityLevel = "Interested" | "Pre-Seeker" | "Seeker" | "New Believer" | "Growing" | "Mature" | "Leader";
export type DiscipleshipStatus = "Active" | "Pending" | "Inactive" | "Graduated" | "Archived";
export type JourneyStage = "Touchpoint" | "Engaged" | "Active Journey" | "Decision";
export type JourneyType = "Salvation" | "Baptism" | "Community" | "Growth";
export type JourneySource = "Telegram" | "WhatsApp" | "SMS" | "Self-guided" | "Messenger" | "Conversation";
export type JourneyValidation = "Pending" | "Confirmed" | "N/A";
export type MilestoneKey = "salvation" | "baptism" | "community" | "growth";
export type MilestoneState = "done" | "progress" | "pending";
export type MatchStatus = "Proposed" | "Accepted" | "Active" | "Completed" | "Ended";
export type MentorExperience = "Beginner" | "Intermediate" | "Experienced" | "Senior";
export type ContentStatus = "Draft" | "Published" | "Archived";
export type ContentAuthor = "curated" | "ai_generated";

/** Mentor-specific profile attached to a User */
export interface MentorProfile {
  specialty: string;
  languages: string;
  capacity: string;          // "4/5"
  load: number;              // 0-100
  experience: MentorExperience;
  gender: "female" | "male";
  strengths: string[];
  bio: string;
  joined: string;
}

export interface FaithJourney {
  id: string;
  contactId: string;         // ← links to Contact.id
  tenantId: string;
  source: JourneySource;
  type: JourneyType;
  stage: JourneyStage;
  indicators: number;
  total: number;
  milestone: string;         // current milestone label
  validation: JourneyValidation;
  language: string;
  startedAt: string;
}

export interface MilestoneEntry {
  key: MilestoneKey;
  label: string;
  date: string;
  state: MilestoneState;
  sub: string[];
}

export interface ContactMilestones {
  id: string;
  contactId: string;         // ← links to Contact.id
  tenantId: string;
  milestones: MilestoneEntry[];
}

export interface Match {
  id: string;
  tenantId: string;
  seekerContactId: string;   // ← links to Contact.id
  mentorUserId: string;      // ← links to User.id
  score: number;             // 0-100
  factors: [string, number, string][];
  status: MatchStatus;
  reasoning: string;
  createdAt: string;
}

export interface ContentRow {
  id: string;
  title: string;
  type: string;
  typeTone: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  lang: string;
  status: ContentStatus;
  statusTone: string;
  summary: string;
  body: string;
  tags: string[];
  author: ContentAuthor;
  source?: string;
  readTimeMin: number;
  variants: { telegram: string; whatsapp: string; sms: string; web: string };
  stats: { views: number; engagement: number; completion: number };
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  industry: string;
  plan: Plan;
  createdAt: string;
  stats: {
    contacts: number;
    messages: number;
    activeUsers: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  tenantId: string;
  avatar?: string;
  mentorProfile?: MentorProfile;
}

export interface TeamGroup {
  id: string;
  name: string;
  label: string;
  description?: string;
  userIds: string[];
  tenantId: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string[];
  groupIds: string[];
  tenantId: string;
  createdAt: string;
  customAttributes?: Record<string, string>;
  preferredChannel?: ChannelType;
  // --- discipleship fields (optional — only present for seekers) ---
  maturity?: MaturityLevel;
  engagement?: number;                 // 0-100
  discipleshipStatus?: DiscipleshipStatus;
  assignedMentorId?: string;           // → User.id with mentorProfile
  preferredLanguage?: string;
  spiritualBackground?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  contactCount: number;
  tenantId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  contactId: string;
  tenantId: string;
  senderId: string;
  senderType: "user" | "contact";
  content: string;
  status: MessageStatus;
  port: ChannelType;
  channelId?: string;
  createdAt: string;
}

export interface Broadcast {
  id: string;
  tenantId: string;
  name: string;
  targetGroupId: string;
  targetContactIds?: string[];
  content: string;
  status: MessageStatus;
  port: ChannelType;
  channelId?: string;
  stats: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  scheduledAt?: string;
  frequency?: ScheduleFrequency;
  createdAt: string;
}

export interface ContactNote {
  id: string;
  contactId: string;
  content: string;
  createdAt: string;
  authorId: string;
}

export interface QuickTemplate {
  id: string;
  label: string;
  content: string;
  category: string;
  placeholders?: string[];
}

// --- Delivery Channel ---

export interface DeliveryChannel {
  id: string;
  tenantId: string;
  name: string;
  type: ChannelType;
  status: ChannelStatus;
  enabled: boolean;
  config: Record<string, string>;
  senderName?: string;
  defaultCountryCode?: string;
  rateLimit?: number;
  priority?: number;
  createdAt: string;
  lastActiveAt?: string;
  stats: {
    sent: number;
    delivered: number;
    failed: number;
  };
}

// --- Automation ---

export type AutomationTrigger = "contact_added" | "message_received" | "tag_added" | "broadcast_completed" | "webhook_received" | "scheduled";
export type AutomationAction = "send_message" | "add_tag" | "remove_tag" | "add_to_group" | "send_broadcast" | "webhook_call";

export interface AutomationRule {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  triggerConfig: Record<string, any>;
  action: AutomationAction;
  actionConfig: Record<string, any>;
  enabled: boolean;
  lastTriggeredAt?: string;
  triggerCount: number;
  createdAt: string;
}

export interface Webhook {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  enabled: boolean;
  lastCalledAt?: string;
  failureCount: number;
  createdAt: string;
}

// --- Contact Segment ---

export interface ContactSegment {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  filters: { field: string; operator: string; value: string }[];
  contactCount: number;
  createdAt: string;
}

// --- Audit Log ---

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

// --- Constants ---

export const PLAN_LIMITS: Record<Plan, {
  name: string,
  maxContacts: number,
  price: string,
  period: string,
  features: string[],
  featureFlags: { automation: boolean, analytics: boolean, api: boolean }
}> = {
  free: {
    name: "Free",
    maxContacts: 100,
    price: "$0",
    period: "forever",
    features: ["Up to 100 contacts", "Basic messaging", "Email support"],
    featureFlags: { automation: false, analytics: false, api: false }
  },
  pro: {
    name: "Pro",
    maxContacts: 5000,
    price: "$49",
    period: "per month",
    features: ["Up to 5,000 contacts", "Multi-channel messaging", "Advanced automation", "Priority support", "Analytics dashboard"],
    featureFlags: { automation: true, analytics: true, api: false }
  },
  enterprise: {
    name: "Enterprise",
    maxContacts: Infinity,
    price: "Custom",
    period: "contact sales",
    features: ["Unlimited contacts", "All Pro features", "Custom workflows", "Dedicated support", "Full API access"],
    featureFlags: { automation: true, analytics: true, api: true }
  }
};

export const CHANNEL_TYPES: { id: ChannelType; label: string; icon: any; color: string; bgColor: string; borderColor: string; description: string }[] = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", description: "WhatsApp Business API" },
  { id: "sms", label: "SMS", icon: Smartphone, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200", description: "SMS gateway provider" },
  { id: "email", label: "Email", icon: Mail, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200", description: "SMTP/IMAP email" },
  { id: "telegram", label: "Telegram", icon: Send, color: "text-sky-600", bgColor: "bg-sky-50", borderColor: "border-sky-200", description: "Telegram Bot API" },
  { id: "messenger", label: "Messenger", icon: Facebook, color: "text-blue-500", bgColor: "bg-blue-50", borderColor: "border-blue-200", description: "Facebook Messenger" },
  { id: "smpp", label: "SMPP", icon: Server, color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200", description: "SMPP protocol direct" },
];

/** @deprecated Use CHANNEL_TYPES instead */
export const MESSAGE_PORTS = CHANNEL_TYPES;

export const SCHEDULE_FREQUENCIES: { id: ScheduleFrequency; label: string; description: string }[] = [
  { id: "once", label: "Once", description: "Send one time only" },
  { id: "daily", label: "Daily", description: "Repeat every day" },
  { id: "weekly", label: "Weekly", description: "Repeat every week" },
  { id: "biweekly", label: "Bi-weekly", description: "Repeat every 2 weeks" },
  { id: "monthly", label: "Monthly", description: "Repeat every month" },
];

export const QUICK_TEMPLATES: QuickTemplate[] = [
  { id: "tpl-1", label: "Welcome", content: "Hi! Welcome to our platform. How can we help?", category: "Greeting" },
  { id: "tpl-2", label: "Follow Up", content: "Just checking in! Any other questions?", category: "Follow Up" },
  { id: "tpl-3", label: "Thank You", content: "Thank you for reaching out! We look forward to working with you.", category: "Closing" },
  { id: "tpl-4", label: "Schedule Call", content: "Let's hop on a call. Morning or afternoon?", category: "Meeting" },
  { id: "tpl-5", label: "Order Update", content: "Order processed! Shipping in 1-2 business days.", category: "Support" },
  { id: "tpl-6", label: "Issue Resolved", content: "The issue has been resolved. Let us know if you need anything else.", category: "Support" },
  { id: "tpl-7", label: "Promo Offer", content: "Exclusive: SPECIAL15 for 15% off. Valid this month!", category: "Sales" },
  { id: "tpl-8", label: "Feedback Request", content: "Rate your experience 1-10. We'd love your feedback!", category: "Engagement" },
];

// --- Mock Data ---

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: "tenant-1",
    name: "Acme Corp",
    industry: "E-commerce",
    plan: "pro",
    createdAt: "2025-01-12",
    stats: { contacts: 1260, messages: 8420, activeUsers: 12 }
  },
  {
    id: "tenant-2",
    name: "Global Health",
    industry: "Healthcare",
    plan: "enterprise",
    createdAt: "2025-01-15",
    stats: { contacts: 5400, messages: 12050, activeUsers: 25 }
  }
];

export const INITIAL_TEAM_GROUPS: TeamGroup[] = [
  {
    id: "tg-1",
    name: "VIP Support",
    label: "VIP",
    description: "Handles VIP customers contacting us.",
    userIds: ["user-1", "user-2"],
    tenantId: "tenant-1",
    createdAt: "2025-02-01T10:00:00Z"
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: "user-1",
    name: "Alex Rivera",
    email: "alex@acme.com",
    role: "admin",
    status: "active",
    tenantId: "tenant-1",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    mentorProfile: { specialty: "New Believers, Grief", languages: "EN, AM", capacity: "4/5", load: 80, experience: "Senior", gender: "male", strengths: ["Empathy", "Bible knowledge", "Prayer"], bio: "20+ years walking alongside new believers and those in grief. Passionate about foundational discipleship.", joined: "Jan 10, 2024" },
  },
  {
    id: "user-2",
    name: "Sarah Chen",
    email: "sarah@acme.com",
    role: "agent",
    status: "active",
    tenantId: "tenant-1",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    mentorProfile: { specialty: "Youth, Apologetics", languages: "EN", capacity: "3/5", load: 60, experience: "Experienced", gender: "female", strengths: ["Apologetics", "Teaching", "Patience"], bio: "Works with young seekers navigating questions of faith. Background in campus ministry.", joined: "Mar 22, 2024" },
  },
  {
    id: "user-3",
    name: "Mike Ross",
    email: "mike@acme.com",
    role: "viewer",
    status: "active",
    tenantId: "tenant-1",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
  },
  {
    id: "user-4",
    name: "Jessica Pearson",
    email: "jessica@global.com",
    role: "admin",
    status: "active",
    tenantId: "tenant-2",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
  },
  {
    id: "user-5",
    name: "Daniel Ortiz",
    email: "daniel@acme.com",
    role: "agent",
    status: "pending",
    tenantId: "tenant-1",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
  },
  {
    id: "user-6",
    name: "Priya Sharma",
    email: "priya@acme.com",
    role: "agent",
    status: "active",
    tenantId: "tenant-1",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop",
    mentorProfile: { specialty: "Women, Prayer", languages: "EN, OM", capacity: "5/5", load: 100, experience: "Experienced", gender: "female", strengths: ["Prayer", "Counseling", "Pastoral care"], bio: "Women's ministry leader. Specialises in prayer accompaniment and seasons of transition.", joined: "May 18, 2024" },
  }
];

export const INITIAL_GROUPS: Group[] = [
  { id: "group-1", name: "Seekers",         description: "New people exploring the Christian faith",         contactCount: 3, tenantId: "tenant-1", createdAt: "2025-12-01" },
  { id: "group-2", name: "New Believers",   description: "Recently made a decision and started a journey",   contactCount: 3, tenantId: "tenant-1", createdAt: "2025-12-05" },
  { id: "group-3", name: "Active Disciples", description: "Currently meeting with a mentor weekly",          contactCount: 3, tenantId: "tenant-1", createdAt: "2026-01-08" },
  { id: "group-4", name: "Mentors Pool",    description: "Trained mentors available for matches",            contactCount: 2, tenantId: "tenant-1", createdAt: "2026-01-15" },
  { id: "group-5", name: "Alumni",          description: "Completed a journey and connected to fellowship",  contactCount: 2, tenantId: "tenant-1", createdAt: "2026-02-01" },
];

export const INITIAL_CONTACTS: Contact[] = [
  { id: "contact-1",  name: "Abel Tesfaye",        phone: "+251911234567", email: "abel.tesfaye@gmail.com",       tags: ["amharic", "telegram", "prayer-request"], groupIds: ["group-1"],                 tenantId: "tenant-1", createdAt: "2026-04-15T09:30:00Z", maturity: "Seeker",      engagement: 58,  discipleshipStatus: "Active",  assignedMentorId: "user-1", preferredLanguage: "Amharic" },
  { id: "contact-2",  name: "Hanna Bekele",        phone: "+251922456780", email: "hanna.bekele@outlook.com",     tags: ["amharic", "whatsapp", "baptized"],       groupIds: ["group-2", "group-3"],      tenantId: "tenant-1", createdAt: "2026-04-14T14:05:00Z", maturity: "Growing",     engagement: 91,  discipleshipStatus: "Active",  assignedMentorId: "user-2", preferredLanguage: "Amharic" },
  { id: "contact-3",  name: "Mikias Alemu",        phone: "+251933789012", email: "mikias.alemu@yahoo.com",       tags: ["oromo", "telegram", "new-believer"],     groupIds: ["group-2"],                 tenantId: "tenant-1", createdAt: "2026-04-13T11:12:00Z", maturity: "New Believer", engagement: 72,  discipleshipStatus: "Active",  assignedMentorId: "user-6", preferredLanguage: "Afaan Oromoo" },
  { id: "contact-4",  name: "Yordanos Girma",      phone: "+251944321098", email: "yordanos.girma@gmail.com",     tags: ["english", "whatsapp", "follow-up"],      groupIds: ["group-1", "group-5"],      tenantId: "tenant-1", createdAt: "2026-04-12T08:47:00Z", maturity: "Seeker",      engagement: 34,  discipleshipStatus: "Pending", preferredLanguage: "English" },
  { id: "contact-5",  name: "Daniel Haile",        phone: "+251955876543", email: "daniel.haile@proton.me",       tags: ["amharic", "sms", "catechumen"],          groupIds: ["group-3"],                 tenantId: "tenant-1", createdAt: "2026-04-11T17:22:00Z", maturity: "Growing",     engagement: 85,  discipleshipStatus: "Active",  assignedMentorId: "user-1", preferredLanguage: "Amharic" },
  { id: "contact-6",  name: "Meron Abebe",         phone: "+251966543210", email: "meron.abebe@gmail.com",        tags: ["amharic", "telegram", "prayer-request"], groupIds: ["group-1", "group-2"],      tenantId: "tenant-1", createdAt: "2026-04-10T13:58:00Z", maturity: "New Believer", engagement: 65,  discipleshipStatus: "Active",  assignedMentorId: "user-2", preferredLanguage: "Amharic" },
  { id: "contact-7",  name: "Samuel Tadesse",      phone: "+251977109876", email: "samuel.tadesse@gmail.com",     tags: ["english", "whatsapp", "baptized"],       groupIds: ["group-4"],                 tenantId: "tenant-1", createdAt: "2026-04-09T10:15:00Z", maturity: "Mature",      engagement: 95,  discipleshipStatus: "Graduated", preferredLanguage: "English" },
  { id: "contact-8",  name: "Bethlehem Yohannes",  phone: "+251988234501", email: "beti.yohannes@outlook.com",    tags: ["amharic", "whatsapp"],                   groupIds: ["group-3", "group-5"],      tenantId: "tenant-1", createdAt: "2026-04-08T16:40:00Z", maturity: "Growing",     engagement: 78,  discipleshipStatus: "Active",  assignedMentorId: "user-6", preferredLanguage: "Amharic" },
  { id: "contact-9",  name: "Robel Desta",         phone: "+251999456781", email: "robel.desta@gmail.com",        tags: ["oromo", "telegram", "follow-up"],        groupIds: ["group-3"],                 tenantId: "tenant-1", createdAt: "2026-04-07T09:03:00Z", maturity: "New Believer", engagement: 52,  discipleshipStatus: "Active",  assignedMentorId: "user-1", preferredLanguage: "Afaan Oromoo" },
  { id: "contact-10", name: "Selamawit Kebede",    phone: "+251911678923", email: "selam.kebede@gmail.com",       tags: ["amharic", "whatsapp", "baptized"],       groupIds: ["group-4"],                 tenantId: "tenant-1", createdAt: "2026-04-06T12:27:00Z", maturity: "Leader",      engagement: 98,  discipleshipStatus: "Graduated", preferredLanguage: "Amharic" },
];

export const INITIAL_MESSAGES: Message[] = [
  { id: "msg-1", contactId: "contact-1", tenantId: "tenant-1", senderId: "contact-1", senderType: "contact", content: "Hey, question about order #4521.", status: "received", port: "whatsapp", createdAt: "2025-02-10T09:00:00Z" },
  { id: "msg-2", contactId: "contact-1", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Sure thing! What can I help with?", status: "read", port: "whatsapp", createdAt: "2025-02-10T09:05:00Z" },
  { id: "msg-3", contactId: "contact-1", tenantId: "tenant-1", senderId: "contact-1", senderType: "contact", content: "Got Basic instead of Premium. Can you check?", status: "received", port: "whatsapp", createdAt: "2025-02-10T09:08:00Z" },
  { id: "msg-4", contactId: "contact-1", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Shipping mix-up. Sending correct package with priority delivery today.", status: "delivered", port: "whatsapp", createdAt: "2025-02-10T09:15:00Z" },
  { id: "msg-5", contactId: "contact-1", tenantId: "tenant-1", senderId: "contact-1", senderType: "contact", content: "Great, thank you! You guys are always so fast.", status: "received", port: "whatsapp", createdAt: "2025-02-10T09:18:00Z" },
  { id: "msg-6", contactId: "contact-2", tenantId: "tenant-1", senderId: "contact-2", senderType: "contact", content: "Is the newsletter coming out today?", status: "received", port: "email", createdAt: "2025-02-11T08:30:00Z" },
  { id: "msg-7", contactId: "contact-2", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Yes, going out at 2 PM today!", status: "delivered", port: "email", createdAt: "2025-02-11T08:35:00Z" },
  { id: "msg-8", contactId: "contact-2", tenantId: "tenant-1", senderId: "contact-2", senderType: "contact", content: "Is there a referral program?", status: "received", port: "email", createdAt: "2025-02-11T08:40:00Z" },
  { id: "msg-9", contactId: "contact-2", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Yes! You both get 15% off. Sending link now.", status: "read", port: "email", createdAt: "2025-02-11T08:45:00Z" },
  { id: "msg-10", contactId: "contact-3", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Appointment scheduled for tomorrow at 3 PM.", status: "scheduled", port: "sms", createdAt: "2025-02-12T10:00:00Z" },
  { id: "msg-11", contactId: "contact-3", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Subscription renews on Feb 15th.", status: "failed", port: "sms", createdAt: "2025-02-11T12:00:00Z" },
  { id: "msg-12", contactId: "contact-3", tenantId: "tenant-1", senderId: "contact-3", senderType: "contact", content: "Can I upgrade to annual plan?", status: "received", port: "sms", createdAt: "2025-02-11T14:00:00Z" },
  { id: "msg-13", contactId: "contact-3", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Done! You save 20% with annual billing.", status: "delivered", port: "sms", createdAt: "2025-02-11T14:10:00Z" },
  { id: "msg-14", contactId: "contact-4", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Welcome Emily! Here's your guide: acme.co/start", status: "delivered", port: "whatsapp", createdAt: "2025-02-04T10:00:00Z" },
  { id: "msg-15", contactId: "contact-4", tenantId: "tenant-1", senderId: "contact-4", senderType: "contact", content: "How do I set up notifications?", status: "received", port: "whatsapp", createdAt: "2025-02-04T11:30:00Z" },
  { id: "msg-16", contactId: "contact-4", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Settings > Notifications. Let me know if you need help!", status: "read", port: "whatsapp", createdAt: "2025-02-04T11:35:00Z" },
  { id: "msg-17", contactId: "contact-4", tenantId: "tenant-1", senderId: "contact-4", senderType: "contact", content: "All set up now. Love the platform!", status: "received", port: "whatsapp", createdAt: "2025-02-04T12:00:00Z" },
  { id: "msg-18", contactId: "contact-5", tenantId: "tenant-1", senderId: "contact-5", senderType: "contact", content: "Interested in enterprise pricing. Can we talk?", status: "received", port: "telegram", createdAt: "2025-02-06T09:00:00Z" },
  { id: "msg-19", contactId: "contact-5", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Thursday 10 AM or 2 PM — which works?", status: "delivered", port: "telegram", createdAt: "2025-02-06T09:15:00Z" },
  { id: "msg-20", contactId: "contact-5", tenantId: "tenant-1", senderId: "contact-5", senderType: "contact", content: "2 PM Thursday works great!", status: "received", port: "telegram", createdAt: "2025-02-06T09:20:00Z" },
  { id: "msg-21", contactId: "contact-5", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Confirmed! Calendar invite coming shortly.", status: "sent", port: "telegram", createdAt: "2025-02-06T09:25:00Z" },
  { id: "msg-22", contactId: "contact-6", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Your Q1 code: SAVE20Q1. Valid until March 31.", status: "delivered", port: "whatsapp", createdAt: "2025-02-07T10:00:00Z" },
  { id: "msg-23", contactId: "contact-6", tenantId: "tenant-1", senderId: "contact-6", senderType: "contact", content: "Thanks! Already adding items to cart.", status: "received", port: "whatsapp", createdAt: "2025-02-07T10:30:00Z" },
  { id: "msg-24", contactId: "contact-6", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Need any product recommendations?", status: "read", port: "whatsapp", createdAt: "2025-02-07T10:35:00Z" },
  { id: "msg-25", contactId: "contact-7", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Welcome aboard, Chris!", status: "delivered", port: "sms", createdAt: "2025-02-08T14:00:00Z" },
  { id: "msg-26", contactId: "contact-7", tenantId: "tenant-1", senderId: "contact-7", senderType: "contact", content: "Thanks! Tell me more about Pro plan?", status: "received", port: "sms", createdAt: "2025-02-08T14:30:00Z" },
  { id: "msg-28", contactId: "contact-8", tenantId: "tenant-1", senderId: "contact-8", senderType: "contact", content: "I need to update my billing address.", status: "received", port: "email", createdAt: "2025-02-09T11:00:00Z" },
  { id: "msg-29", contactId: "contact-8", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Go to Account > Billing > Update Address.", status: "delivered", port: "email", createdAt: "2025-02-09T11:05:00Z" },
  { id: "msg-32", contactId: "contact-9", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Hi Ahmed, welcome! How's everything going?", status: "delivered", port: "whatsapp", createdAt: "2025-02-09T15:00:00Z" },
  { id: "msg-33", contactId: "contact-9", tenantId: "tenant-1", senderId: "contact-9", senderType: "contact", content: "Great! API integration was smooth.", status: "received", port: "whatsapp", createdAt: "2025-02-09T15:30:00Z" },
  { id: "msg-35", contactId: "contact-10", tenantId: "tenant-1", senderId: "contact-10", senderType: "contact", content: "Your design tools look incredible!", status: "received", port: "telegram", createdAt: "2025-02-10T16:00:00Z" },
  { id: "msg-36", contactId: "contact-10", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Want early access to beta features?", status: "delivered", port: "telegram", createdAt: "2025-02-10T16:10:00Z" },
  { id: "msg-38", contactId: "contact-5", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Enterprise trial expires in 3 days.", status: "scheduled", port: "whatsapp", createdAt: "2025-02-13T09:00:00Z" },
  { id: "msg-39", contactId: "contact-7", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "Check out new Pro features!", status: "failed", port: "sms", createdAt: "2025-02-09T08:00:00Z" },
  { id: "msg-40", contactId: "contact-9", tenantId: "tenant-1", senderId: "user-1", senderType: "user", content: "API usage report for January is ready.", status: "scheduled", port: "email", createdAt: "2025-02-14T08:00:00Z" },
];

export const INITIAL_BROADCASTS: Broadcast[] = [
  {
    id: "bc-1",
    tenantId: "tenant-1",
    name: "Monthly Newsletter — February",
    targetGroupId: "group-4",
    content: "Check out our latest updates and customer success stories!",
    status: "delivered",
    port: "email",
    stats: { sent: 150, delivered: 148, read: 120, failed: 2 },
    frequency: "monthly",
    createdAt: "2025-02-01T10:00:00Z"
  },
  {
    id: "bc-2",
    tenantId: "tenant-1",
    name: "Weekend Flash Sale",
    targetGroupId: "all",
    content: "50% off this weekend! Code FLASH50. Limited time.",
    status: "scheduled",
    port: "whatsapp",
    stats: { sent: 0, delivered: 0, read: 0, failed: 0 },
    scheduledAt: "2025-02-14T09:00:00Z",
    frequency: "weekly",
    createdAt: "2025-02-10T15:00:00Z"
  },
  {
    id: "bc-3",
    tenantId: "tenant-1",
    name: "System Maintenance Notice",
    targetGroupId: "group-2",
    content: "Scheduled downtime Sunday 10 PM - 2 AM EST.",
    status: "failed",
    port: "sms",
    stats: { sent: 50, delivered: 0, read: 0, failed: 50 },
    createdAt: "2025-02-05T08:00:00Z"
  },
  {
    id: "bc-4",
    tenantId: "tenant-1",
    name: "VIP Exclusive — Early Access",
    targetGroupId: "group-3",
    content: "VIP early access to new products launching March 1st!",
    status: "delivered",
    port: "whatsapp",
    stats: { sent: 85, delivered: 83, read: 71, failed: 2 },
    createdAt: "2025-02-08T11:00:00Z"
  },
  {
    id: "bc-5",
    tenantId: "tenant-1",
    name: "Q1 Promo Broadcast",
    targetGroupId: "group-1",
    content: "Code SAVE20Q1 for 20% off. Valid through March 31!",
    status: "sent",
    port: "whatsapp",
    stats: { sent: 210, delivered: 195, read: 142, failed: 15 },
    createdAt: "2025-02-03T09:00:00Z"
  },
  {
    id: "bc-6",
    tenantId: "tenant-1",
    name: "New Feature Announcement",
    targetGroupId: "all",
    content: "New: conversation analytics, bulk messaging, and 3 integrations!",
    status: "delivered",
    port: "telegram",
    stats: { sent: 320, delivered: 312, read: 245, failed: 8 },
    createdAt: "2025-02-09T14:00:00Z"
  },
  {
    id: "bc-7",
    tenantId: "tenant-1",
    name: "Valentine's Day Special",
    targetGroupId: "group-4",
    content: "Special Valentine's Day offer inside!",
    status: "scheduled",
    port: "email",
    stats: { sent: 0, delivered: 0, read: 0, failed: 0 },
    scheduledAt: "2025-02-14T07:00:00Z",
    frequency: "once",
    createdAt: "2025-02-11T16:00:00Z"
  },
];

export const INITIAL_NOTES: ContactNote[] = [
  { id: "note-1", contactId: "contact-1", content: "VIP customer. Prefers WhatsApp.", createdAt: "2025-02-08T10:00:00Z", authorId: "user-1" },
  { id: "note-2", contactId: "contact-1", content: "Shipping issue resolved Feb 10.", createdAt: "2025-02-10T09:20:00Z", authorId: "user-1" },
  { id: "note-3", contactId: "contact-2", content: "Referral link sent Feb 11.", createdAt: "2025-02-11T08:50:00Z", authorId: "user-1" },
  { id: "note-4", contactId: "contact-5", content: "Enterprise prospect. Demo Thu 2 PM.", createdAt: "2025-02-06T09:30:00Z", authorId: "user-1" },
  { id: "note-5", contactId: "contact-8", content: "Billing address updated. Happy with dashboard.", createdAt: "2025-02-09T11:30:00Z", authorId: "user-1" },
  { id: "note-6", contactId: "contact-10", content: "Beta program. Great UX feedback candidate.", createdAt: "2025-02-10T16:20:00Z", authorId: "user-1" },
];

export const INITIAL_CHANNELS: DeliveryChannel[] = [
  {
    id: "ch-1", tenantId: "tenant-1", name: "Main WhatsApp", type: "whatsapp",
    status: "connected", enabled: true,
    config: { phoneNumber: "+1 555-0199", businessId: "waba-123456" },
    senderName: "Acme Corp", rateLimit: 1000, priority: 1,
    createdAt: "2025-01-15T10:00:00Z", lastActiveAt: "2026-02-21T08:30:00Z",
    stats: { sent: 4520, delivered: 4380, failed: 140 }
  },
  {
    id: "ch-2", tenantId: "tenant-1", name: "Transactional SMS", type: "sms",
    status: "connected", enabled: true,
    config: { provider: "Twilio", accountSid: "AC***", authToken: "***" },
    senderName: "ACME", defaultCountryCode: "+1", rateLimit: 500, priority: 2,
    createdAt: "2025-01-20T10:00:00Z", lastActiveAt: "2026-02-20T14:00:00Z",
    stats: { sent: 2100, delivered: 2050, failed: 50 }
  },
  {
    id: "ch-3", tenantId: "tenant-1", name: "Support Email", type: "email",
    status: "connected", enabled: true,
    config: { smtpHost: "smtp.acme.com", smtpPort: "587", imapHost: "imap.acme.com" },
    senderName: "support@acme.com", priority: 3,
    createdAt: "2025-01-22T10:00:00Z", lastActiveAt: "2026-02-21T09:00:00Z",
    stats: { sent: 1800, delivered: 1790, failed: 10 }
  },
  {
    id: "ch-4", tenantId: "tenant-1", name: "Acme Bot", type: "telegram",
    status: "disconnected", enabled: false,
    config: { botToken: "bot***" },
    senderName: "AcmeBot", priority: 4,
    createdAt: "2025-02-01T10:00:00Z", lastActiveAt: "2026-01-15T16:00:00Z",
    stats: { sent: 320, delivered: 312, failed: 8 }
  },
  {
    id: "ch-5", tenantId: "tenant-1", name: "Bulk SMS Gateway", type: "smpp",
    status: "error", enabled: true,
    config: { host: "smsc.provider.com", port: "2775", systemId: "acme_sys" },
    senderName: "ACME", defaultCountryCode: "+1", rateLimit: 2000,
    createdAt: "2025-02-10T10:00:00Z",
    stats: { sent: 0, delivered: 0, failed: 0 }
  },
];

export const INITIAL_AUTOMATIONS: AutomationRule[] = [
  {
    id: "auto-1", tenantId: "tenant-1", name: "Welcome Message",
    description: "Send a welcome message when a new contact is added",
    trigger: "contact_added", triggerConfig: {},
    action: "send_message", actionConfig: { template: "Welcome", channelType: "whatsapp" },
    enabled: true, lastTriggeredAt: "2026-02-20T14:00:00Z", triggerCount: 156,
    createdAt: "2025-01-20T10:00:00Z"
  },
  {
    id: "auto-2", tenantId: "tenant-1", name: "VIP Tag Auto-Group",
    description: "Automatically add contacts tagged 'vip' to VIP Tier group",
    trigger: "tag_added", triggerConfig: { tag: "vip" },
    action: "add_to_group", actionConfig: { groupId: "group-3" },
    enabled: true, lastTriggeredAt: "2026-02-18T09:30:00Z", triggerCount: 42,
    createdAt: "2025-02-01T10:00:00Z"
  },
  {
    id: "auto-3", tenantId: "tenant-1", name: "Failed Delivery Re-route",
    description: "When a broadcast fails, retry via SMS channel",
    trigger: "broadcast_completed", triggerConfig: { status: "failed" },
    action: "send_message", actionConfig: { channelType: "sms", retryFailed: true },
    enabled: false, triggerCount: 0,
    createdAt: "2025-02-10T10:00:00Z"
  },
  {
    id: "auto-4", tenantId: "tenant-1", name: "CRM Sync Webhook",
    description: "Post contact data to CRM when message is received",
    trigger: "message_received", triggerConfig: {},
    action: "webhook_call", actionConfig: { url: "https://crm.acme.com/api/sync" },
    enabled: true, lastTriggeredAt: "2026-02-21T07:45:00Z", triggerCount: 892,
    createdAt: "2025-01-25T10:00:00Z"
  },
];

export const INITIAL_WEBHOOKS: Webhook[] = [
  {
    id: "wh-1", tenantId: "tenant-1", name: "CRM Integration",
    url: "https://crm.acme.com/api/webhooks/turumba",
    secret: "whsec_***", events: ["message.received", "contact.created", "contact.updated"],
    enabled: true, lastCalledAt: "2026-02-21T07:45:00Z", failureCount: 0,
    createdAt: "2025-01-25T10:00:00Z"
  },
  {
    id: "wh-2", tenantId: "tenant-1", name: "Analytics Pipeline",
    url: "https://analytics.acme.com/ingest",
    events: ["message.sent", "message.delivered", "broadcast.completed"],
    enabled: true, lastCalledAt: "2026-02-20T23:00:00Z", failureCount: 2,
    createdAt: "2025-02-05T10:00:00Z"
  },
  {
    id: "wh-3", tenantId: "tenant-1", name: "Slack Alerts",
    url: "https://hooks.slack.com/services/T00/B00/xxx",
    events: ["message.failed", "channel.disconnected"],
    enabled: false, failureCount: 12,
    createdAt: "2025-02-12T10:00:00Z"
  },
];

export const INITIAL_SEGMENTS: ContactSegment[] = [
  { id: "seg-1", tenantId: "tenant-1", name: "Active VIPs", description: "VIP contacts who messaged in last 30 days", filters: [{ field: "tags", operator: "contains", value: "vip" }], contactCount: 5, createdAt: "2025-02-01T10:00:00Z" },
  { id: "seg-2", tenantId: "tenant-1", name: "Newsletter Subscribers", description: "Contacts subscribed to newsletter", filters: [{ field: "tags", operator: "contains", value: "newsletter" }], contactCount: 4, createdAt: "2025-02-05T10:00:00Z" },
  { id: "seg-3", tenantId: "tenant-1", name: "New This Month", description: "Contacts added in the current month", filters: [{ field: "createdAt", operator: "after", value: "2025-02-01" }], contactCount: 7, createdAt: "2025-02-10T10:00:00Z" },
];

export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  { id: "log-1", tenantId: "tenant-1", userId: "user-1", userName: "Alex Rivera", action: "broadcast.sent", target: "Q1 Promo Broadcast", details: "Sent to 210 contacts via WhatsApp", createdAt: "2025-02-03T09:00:00Z" },
  { id: "log-2", tenantId: "tenant-1", userId: "user-1", userName: "Alex Rivera", action: "channel.configured", target: "Main WhatsApp", details: "Updated rate limit from 500 to 1000", createdAt: "2025-02-05T11:00:00Z" },
  { id: "log-3", tenantId: "tenant-1", userId: "user-2", userName: "Sarah Chen", action: "contact.imported", target: "CSV Import", details: "Imported 45 contacts from contacts_feb.csv", createdAt: "2025-02-06T14:30:00Z" },
  { id: "log-4", tenantId: "tenant-1", userId: "user-1", userName: "Alex Rivera", action: "user.invited", target: "Daniel Ortiz", details: "Invited as agent role", createdAt: "2025-02-07T09:00:00Z" },
  { id: "log-5", tenantId: "tenant-1", userId: "user-1", userName: "Alex Rivera", action: "automation.created", target: "Welcome Message", details: "New automation rule: send welcome on contact_added", createdAt: "2025-02-08T10:00:00Z" },
  { id: "log-6", tenantId: "tenant-1", userId: "user-2", userName: "Sarah Chen", action: "message.sent", target: "John Smith", details: "Direct message via WhatsApp", createdAt: "2025-02-10T09:15:00Z" },
  { id: "log-7", tenantId: "tenant-1", userId: "user-1", userName: "Alex Rivera", action: "channel.disabled", target: "Acme Bot", details: "Disabled Telegram channel", createdAt: "2025-02-12T16:00:00Z" },
  { id: "log-8", tenantId: "tenant-1", userId: "user-6", userName: "Priya Sharma", action: "broadcast.scheduled", target: "Weekend Flash Sale", details: "Scheduled for Feb 14 via WhatsApp", createdAt: "2025-02-10T15:00:00Z" },
];

export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export const copyToClipboard = (text: string) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

// --- Chat Endpoints ---

export type EndpointStatus = "active" | "inactive";
export type WidgetPosition = "bottom-right" | "bottom-left";
export type AudienceMode = "all" | "known" | "groups" | "allowlist";
export type CreationMode = "auto" | "manual";
export type ReopenPolicy = "always_reopen" | "always_new" | "threshold";
export type AssignmentMode = "auto_assign" | "grab_pool" | "manual";
export type GrabFallback = "auto_assign_available" | "escalate_admin" | "stay_in_pool";
export type ReassignmentMode = "auto" | "manual";

export interface ChatEndpoint {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  status: EndpointStatus;
  position: WidgetPosition;
  brandColor: string;
  brandColorMode?: "solid" | "gradient" | "image";
  brandGradientFrom?: string;
  brandGradientTo?: string;
  brandGradientDir?: string;
  brandHeaderImage?: string;
  cornerRadius?: number;
  widgetWidth?: number;
  widgetHeight?: number;
  publicKey: string;
  launcherText: string;
  welcomeMessage: string;
  offlineMessage: string;
  preChatForm: boolean;
  preChatFields: {
    name: { enabled: boolean; required: boolean };
    email: { enabled: boolean; required: boolean };
  };
  allowedOrigins: string[];
  createdAt: string;
}

export interface ConversationRule {
  id: string;
  tenantId: string;
  name: string;
  priority: number;
  sources: string[];
  audienceMode: AudienceMode;
  allowedGroups?: string[];
  allowedContacts?: string[];
  creationMode: CreationMode;
  reopenPolicy: ReopenPolicy;
  reopenWindowHours?: number;
  defaultTeam?: string;
  defaultAssignee?: string;
  assignmentMode: AssignmentMode;
  grabWindowMinutes?: number;
  grabFallback?: GrabFallback;
  reassignmentMode: ReassignmentMode;
  active: boolean;
  createdAt: string;
}

export const INITIAL_CHAT_ENDPOINTS: ChatEndpoint[] = [
  {
    id: "ep-1",
    tenantId: "tenant-1",
    name: "Support Chat",
    status: "active",
    position: "bottom-right",
    brandColor: "#7c3aed",
    publicKey: "pk_live_abc123xyz456def789",
    launcherText: "Chat with us",
    welcomeMessage: "Hi! How can we help you today?",
    offlineMessage: "Our team is currently offline. Leave a message and we'll get back to you.",
    preChatForm: true,
    preChatFields: {
      name: { enabled: true, required: true },
      email: { enabled: true, required: false },
    },
    allowedOrigins: ["https://acme.com", "https://app.acme.com"],
    createdAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "ep-2",
    tenantId: "tenant-1",
    name: "Sales Widget",
    status: "active",
    position: "bottom-left",
    brandColor: "#0ea5e9",
    publicKey: "pk_live_def789ghi012jkl345",
    launcherText: "Talk to Sales",
    welcomeMessage: "Hey! Ready to grow your business? Let's chat!",
    offlineMessage: "Leave your details and a sales rep will contact you shortly.",
    preChatForm: false,
    preChatFields: {
      name: { enabled: false, required: false },
      email: { enabled: false, required: false },
    },
    allowedOrigins: ["https://acme.com"],
    createdAt: "2025-02-10T14:00:00Z",
  },
  {
    id: "ep-3",
    tenantId: "tenant-1",
    name: "Developer Portal Chat",
    status: "inactive",
    position: "bottom-right",
    brandColor: "#10b981",
    publicKey: "pk_live_jkl345mno678pqr901",
    launcherText: "Need help?",
    welcomeMessage: "Welcome to the Acme Developer Portal! How can we assist?",
    offlineMessage: "Our devrel team will respond within 24 hours.",
    preChatForm: true,
    preChatFields: {
      name: { enabled: true, required: true },
      email: { enabled: true, required: true },
    },
    allowedOrigins: ["https://developers.acme.com"],
    createdAt: "2025-02-15T09:00:00Z",
  },
];

export const INITIAL_CONVERSATION_RULES: ConversationRule[] = [
  {
    id: "rule-1",
    tenantId: "tenant-1",
    name: "VIP Telegram Support",
    priority: 1,
    sources: ["telegram", "whatsapp"],
    audienceMode: "groups",
    allowedGroups: ["group-3"],
    creationMode: "auto",
    reopenPolicy: "always_reopen",
    defaultTeam: "tg-1",
    defaultAssignee: "user-1",
    assignmentMode: "auto_assign",
    reassignmentMode: "auto",
    active: true,
    createdAt: "2025-02-05T10:00:00Z",
  },
  {
    id: "rule-2",
    tenantId: "tenant-1",
    name: "New Website Visitors",
    priority: 2,
    sources: ["ep-1"],
    audienceMode: "all",
    creationMode: "manual",
    reopenPolicy: "threshold",
    reopenWindowHours: 24,
    defaultTeam: "tg-1",
    assignmentMode: "grab_pool",
    grabWindowMinutes: 30,
    grabFallback: "auto_assign_available",
    reassignmentMode: "manual",
    active: true,
    createdAt: "2025-02-08T12:00:00Z",
  },
  {
    id: "rule-3",
    tenantId: "tenant-1",
    name: "Known Contacts Only — SMS",
    priority: 3,
    sources: ["sms"],
    audienceMode: "known",
    creationMode: "auto",
    reopenPolicy: "always_new",
    assignmentMode: "manual",
    reassignmentMode: "auto",
    active: false,
    createdAt: "2025-02-12T08:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Discipleship initial data — linked to Contact.id and User.id
// ---------------------------------------------------------------------------

export const INITIAL_FAITH_JOURNEYS: FaithJourney[] = [
  { id: "j-1",  contactId: "contact-1",  tenantId: "tenant-1", source: "Telegram",     type: "Salvation",  stage: "Touchpoint",      indicators: 1, total: 7, milestone: "First contact",          validation: "N/A",       language: "Amharic",       startedAt: "2026-04-15" },
  { id: "j-2",  contactId: "contact-2",  tenantId: "tenant-1", source: "WhatsApp",     type: "Growth",     stage: "Active Journey",  indicators: 5, total: 7, milestone: "Weekly mentor check",     validation: "Confirmed",  language: "Amharic",       startedAt: "2026-02-10" },
  { id: "j-3",  contactId: "contact-3",  tenantId: "tenant-1", source: "Telegram",     type: "Salvation",  stage: "Engaged",         indicators: 3, total: 7, milestone: "Prayer guide step 2",     validation: "Pending",    language: "Afaan Oromoo",  startedAt: "2026-03-20" },
  { id: "j-4",  contactId: "contact-4",  tenantId: "tenant-1", source: "WhatsApp",     type: "Salvation",  stage: "Touchpoint",      indicators: 1, total: 7, milestone: "Initial interest",        validation: "N/A",       language: "English",       startedAt: "2026-04-12" },
  { id: "j-5",  contactId: "contact-5",  tenantId: "tenant-1", source: "Conversation", type: "Community",  stage: "Active Journey",  indicators: 6, total: 7, milestone: "Fellowship referral",     validation: "Confirmed",  language: "Amharic",       startedAt: "2026-01-25" },
  { id: "j-6",  contactId: "contact-6",  tenantId: "tenant-1", source: "Telegram",     type: "Salvation",  stage: "Engaged",         indicators: 3, total: 7, milestone: "Devotional engagement",   validation: "Pending",    language: "Amharic",       startedAt: "2026-03-05" },
  { id: "j-7",  contactId: "contact-7",  tenantId: "tenant-1", source: "Self-guided",  type: "Growth",     stage: "Decision",        indicators: 7, total: 7, milestone: "All milestones reached",  validation: "Confirmed",  language: "English",       startedAt: "2026-01-12" },
  { id: "j-8",  contactId: "contact-8",  tenantId: "tenant-1", source: "WhatsApp",     type: "Community",  stage: "Active Journey",  indicators: 4, total: 7, milestone: "Study group started",     validation: "Pending",    language: "Amharic",       startedAt: "2026-02-20" },
  { id: "j-9",  contactId: "contact-9",  tenantId: "tenant-1", source: "Telegram",     type: "Salvation",  stage: "Engaged",         indicators: 2, total: 7, milestone: "Bible basics started",    validation: "N/A",       language: "Afaan Oromoo",  startedAt: "2026-03-15" },
  { id: "j-10", contactId: "contact-10", tenantId: "tenant-1", source: "Self-guided",  type: "Growth",     stage: "Decision",        indicators: 7, total: 7, milestone: "Serving consistently",    validation: "Confirmed",  language: "Amharic",       startedAt: "2025-12-01" },
];

export const INITIAL_CONTACT_MILESTONES: ContactMilestones[] = [
  {
    id: "ms-1", contactId: "contact-2", tenantId: "tenant-1",
    milestones: [
      { key: "salvation", label: "Salvation Decision", date: "Feb 28, 2026", state: "done", sub: ["Self-reported during conversation", "Confirmed by Sarah Chen"] },
      { key: "baptism",   label: "Baptism",           date: "Mar 22, 2026", state: "done", sub: ["Public statement of faith confirmed"] },
      { key: "community", label: "Community",         date: "In Progress",  state: "progress", sub: ["Referred to local fellowship", "Awaiting connection confirmation"] },
      { key: "growth",    label: "Growth Evidence",   date: "Not Started",  state: "pending", sub: ["Prayer (0/7 days)", "Bible engagement (0/7 days)", "Contribution / Serving"] },
    ],
  },
  {
    id: "ms-2", contactId: "contact-5", tenantId: "tenant-1",
    milestones: [
      { key: "salvation", label: "Salvation Decision", date: "Feb 5, 2026",  state: "done", sub: ["Confirmed by Alex Rivera"] },
      { key: "baptism",   label: "Baptism",           date: "Mar 10, 2026", state: "done", sub: ["Baptized at Addis community gathering"] },
      { key: "community", label: "Community",         date: "Mar 28, 2026", state: "done", sub: ["Joined Tuesday study group"] },
      { key: "growth",    label: "Growth Evidence",   date: "In Progress",  state: "progress", sub: ["Prayer 5/7 days", "Bible 4/7 days", "Serving weekly at church"] },
    ],
  },
  {
    id: "ms-3", contactId: "contact-7", tenantId: "tenant-1",
    milestones: [
      { key: "salvation", label: "Salvation Decision", date: "Feb 1, 2026",  state: "done", sub: ["Confirmed by Alex Rivera"] },
      { key: "baptism",   label: "Baptism",           date: "Mar 9, 2026",  state: "done", sub: ["Baptized at community gathering"] },
      { key: "community", label: "Community",         date: "Mar 20, 2026", state: "done", sub: ["Joined Tuesday study group", "Active fellowship member"] },
      { key: "growth",    label: "Growth Evidence",   date: "Apr 5, 2026",  state: "done", sub: ["Prayer 6/7 days", "Bible 5/7 days", "Serves weekly", "Leading small group"] },
    ],
  },
  {
    id: "ms-4", contactId: "contact-10", tenantId: "tenant-1",
    milestones: [
      { key: "salvation", label: "Salvation Decision", date: "Jan 15, 2026", state: "done", sub: ["Long-term believer", "Confirmed by mentor"] },
      { key: "baptism",   label: "Baptism",           date: "Jan 28, 2026", state: "done", sub: ["Baptized years ago, re-committed"] },
      { key: "community", label: "Community",         date: "Feb 10, 2026", state: "done", sub: ["Fellowship leader", "Hosts weekly gathering"] },
      { key: "growth",    label: "Growth Evidence",   date: "Mar 1, 2026",  state: "done", sub: ["Prayer 7/7 days", "Bible 7/7 days", "Mentoring 2 seekers"] },
    ],
  },
  {
    id: "ms-5", contactId: "contact-3", tenantId: "tenant-1",
    milestones: [
      { key: "salvation", label: "Salvation Decision", date: "In Progress",  state: "progress", sub: ["Exploring faith through Bible basics", "Open to prayer"] },
      { key: "baptism",   label: "Baptism",           date: "Not Started",  state: "pending", sub: [] },
      { key: "community", label: "Community",         date: "Not Started",  state: "pending", sub: [] },
      { key: "growth",    label: "Growth Evidence",   date: "Not Started",  state: "pending", sub: [] },
    ],
  },
  {
    id: "ms-6", contactId: "contact-8", tenantId: "tenant-1",
    milestones: [
      { key: "salvation", label: "Salvation Decision", date: "Jan 20, 2026", state: "done", sub: ["Confirmed during group session"] },
      { key: "baptism",   label: "Baptism",           date: "In Progress",  state: "progress", sub: ["Preparing for baptism class", "Scheduled for May 2026"] },
      { key: "community", label: "Community",         date: "In Progress",  state: "progress", sub: ["Attends study group", "Building friendships"] },
      { key: "growth",    label: "Growth Evidence",   date: "Not Started",  state: "pending", sub: ["Prayer 3/7 days", "Bible 2/7 days"] },
    ],
  },
];

export const INITIAL_MATCHES: Match[] = [
  { id: "match-1", tenantId: "tenant-1", seekerContactId: "contact-1", mentorUserId: "user-1", score: 94, factors: [["Language", 95, "green"], ["Interests", 88, "blue"], ["Availability", 90, "green"]], status: "Active",    reasoning: "Abel shares strong language alignment (Amharic, 95%) and interest overlap (Prayer, Bible Study) with Alex. Both are available during mornings.", createdAt: "2026-04-15T10:00:00Z" },
  { id: "match-2", tenantId: "tenant-1", seekerContactId: "contact-2", mentorUserId: "user-2", score: 87, factors: [["Language", 80, "blue"], ["Growth Stage", 92, "green"], ["Gender", 100, "green"]],    status: "Active",    reasoning: "Hanna's growth stage aligns well with Sarah's experience in youth discipleship. Gender preference met.", createdAt: "2026-04-14T14:30:00Z" },
  { id: "match-3", tenantId: "tenant-1", seekerContactId: "contact-3", mentorUserId: "user-6", score: 72, factors: [["Language", 70, "amber"], ["Interests", 75, "blue"]],                                status: "Accepted",  reasoning: "Mikias's Oromo background has moderate overlap with Priya's language skills. Interest alignment is solid.", createdAt: "2026-04-13T12:00:00Z" },
  { id: "match-4", tenantId: "tenant-1", seekerContactId: "contact-5", mentorUserId: "user-1", score: 91, factors: [["Language", 98, "green"], ["Maturity", 85, "blue"], ["Availability", 88, "green"]],   status: "Active",    reasoning: "Daniel and Alex share Amharic fluency and Daniel's growing maturity matches Alex's discipleship focus.", createdAt: "2026-04-11T18:00:00Z" },
  { id: "match-5", tenantId: "tenant-1", seekerContactId: "contact-6", mentorUserId: "user-2", score: 83, factors: [["Language", 75, "blue"], ["Gender", 100, "green"], ["Needs", 80, "blue"]],            status: "Active",    reasoning: "Meron expressed preference for female mentor. Sarah's background in prayer ministry aligns with Meron's prayer requests.", createdAt: "2026-04-10T14:00:00Z" },
  { id: "match-6", tenantId: "tenant-1", seekerContactId: "contact-9", mentorUserId: "user-1", score: 68, factors: [["Language", 55, "amber"], ["Stage", 80, "blue"]],                                    status: "Proposed",  reasoning: "Robel is Oromo-speaking — Alex has limited overlap but strong new-believer experience. Proposed pending language mentor availability.", createdAt: "2026-04-07T09:30:00Z" },
  { id: "match-7", tenantId: "tenant-1", seekerContactId: "contact-8", mentorUserId: "user-6", score: 79, factors: [["Language", 70, "amber"], ["Community", 85, "blue"], ["Prayer", 82, "blue"]],         status: "Active",    reasoning: "Bethlehem and Priya connect through prayer focus and community building. Language is secondary as Bethlehem is bilingual.", createdAt: "2026-04-08T17:00:00Z" },
];

export const INITIAL_CONTENT: ContentRow[] = [
  { id: "c-1", title: "Welcome to Your Faith Journey",       type: "Devotional",    typeTone: "pink",   category: "Salvation",     difficulty: "Beginner",      lang: "English",       status: "Published", statusTone: "green", summary: "A gentle introduction to beginning a relationship with Jesus.",                    body: "Stepping into faith can feel like standing at the edge of something vast…", tags: ["salvation", "new_believer", "prayer"],       author: "curated",      source: "John 3:16",     readTimeMin: 3,  variants: { telegram: "🕊️ Starting your journey? Begin with a simple prayer…", whatsapp: "Welcome! Today's thought: John 3:16…", sms: "Start here: John 3:16", web: "Full devotional content…" }, stats: { views: 1420, engagement: 78, completion: 64 }, updatedAt: "2 days ago" },
  { id: "c-2", title: "Finding Peace in His Presence",       type: "Study",         typeTone: "blue",   category: "Prayer",        difficulty: "Intermediate",  lang: "English",       status: "Published", statusTone: "green", summary: "An in-depth study on stilling your heart in prayer.",                               body: "Peace isn't the absence of chaos — it's the presence of Someone…",         tags: ["prayer", "peace", "mark_4"],                author: "curated",      source: "Mark 4:35-41",  readTimeMin: 7,  variants: { telegram: "☮️ Peace study: sit for 3 quiet minutes…",            whatsapp: "Mark 4 study: Peace in the storm…",     sms: "Mark 4:35-41",    web: "Full study…" },                           stats: { views: 890,  engagement: 82, completion: 55 }, updatedAt: "1 week ago" },
  { id: "c-3", title: "What Does It Mean to Follow Jesus?",  type: "Guide",         typeTone: "amber",  category: "Salvation",     difficulty: "Beginner",      lang: "Amharic",       status: "Published", statusTone: "green", summary: "A culturally-grounded guide for Ethiopian seekers.",                                body: "Following Jesus starts with a single step of trust…",                      tags: ["salvation", "amharic", "beginner"],          author: "curated",      source: "Matthew 4:19",  readTimeMin: 5,  variants: { telegram: "✝️ የኢየሱስን መንገድ ለመከተል…",                             whatsapp: "ኢየሱስን መከተል ምን ማለት ነው?…",                 sms: "ማቴ. 4:19",       web: "Full guide…" },                           stats: { views: 2100, engagement: 85, completion: 71 }, updatedAt: "3 days ago" },
  { id: "c-4", title: "7-Day Prayer Challenge",              type: "Challenge",     typeTone: "purple", category: "Prayer",        difficulty: "Beginner",      lang: "English",       status: "Published", statusTone: "green", summary: "A week-long guided prayer experience for new believers.",                           body: "Day 1: Begin with gratitude. Name three things…",                          tags: ["prayer", "challenge", "7_day"],              author: "ai_generated",                              readTimeMin: 4,  variants: { telegram: "🙏 Day 1: Name 3 things you're grateful for…",        whatsapp: "Prayer challenge Day 1: Gratitude…",     sms: "Pray: 3 gratitudes", web: "Full challenge…" },                       stats: { views: 650,  engagement: 71, completion: 48 }, updatedAt: "5 days ago" },
  { id: "c-5", title: "Understanding Baptism",               type: "Bible Study",   typeTone: "blue",   category: "Bible Basics",  difficulty: "Intermediate",  lang: "English",       status: "Draft",     statusTone: "amber", summary: "What baptism means and why it matters in the life of a believer.",                  body: "Baptism is an outward expression of an inward transformation…",            tags: ["baptism", "bible_study", "sacrament"],      author: "curated",      source: "Romans 6:3-4",  readTimeMin: 8,  variants: { telegram: "💧 Baptism study: Romans 6…",                         whatsapp: "Why baptism matters…",                    sms: "Rom 6:3-4",       web: "Full study…" },                           stats: { views: 340,  engagement: 65, completion: 32 }, updatedAt: "1 week ago" },
  { id: "c-6", title: "Building Community: You're Not Alone", type: "Prayer Guide", typeTone: "green",  category: "Community",     difficulty: "Advanced",      lang: "Amharic",       status: "Published", statusTone: "green", summary: "A guide for seekers ready to connect with fellowship.",                            body: "Faith was never meant to be a solo journey…",                              tags: ["community", "fellowship", "amharic"],       author: "curated",      source: "Hebrews 10:25", readTimeMin: 6,  variants: { telegram: "👥 ማህበረሰብ: ብቻህን አይደለህም…",                           whatsapp: "ማህበረሰብ መገንባት…",                           sms: "ዕብ. 10:25",      web: "Full guide…" },                           stats: { views: 780,  engagement: 88, completion: 60 }, updatedAt: "4 days ago" },
];