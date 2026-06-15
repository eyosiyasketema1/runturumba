import React, { useState, useMemo } from "react";
import {
  Zap, Plus, Search, Play, Pause, Trash2, Edit2,
  Webhook, ArrowRight, MoreVertical, Activity, Clock,
  AlertCircle, Check, X, Globe, Link2, Copy, Eye,
  Settings2, Filter, Tag, Users, MessageSquare, Send,
  RefreshCw, ExternalLink, ChevronRight, ChevronLeft, Shield,
  Inbox, ListOrdered, GitBranch, FolderPlus, Folder, FolderOpen,
  ArrowUpDown, SlidersHorizontal, ChevronDown,
  CornerDownRight, FileText, LayoutTemplate,
  Reply, Droplet, Workflow, Megaphone, Star, TrendingUp,
  UserPlus, Heart, CalendarDays, Gift, BookOpen, Sparkles,
  Bell, HandHeart, GraduationCap, Target
} from "lucide-react";
// motion/AnimatePresence removed — webhooks tab eliminated.
import { toast } from "sonner";
import {
  cn, type AutomationRule, type AutomationTrigger, type AutomationAction,
  type Webhook as WebhookType, formatTimeAgo
} from "./types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
// Switch removed — webhooks tab eliminated.
import { Textarea } from "./ui/textarea";
import { Modal } from "./shared-ui";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator
} from "./ui/dropdown-menu";
import { AutomationCanvas, type AutomationDraft } from "./automation-v2";
import {
  BasicAutomationBuilder, SequenceBuilder, AutomationTypePicker,
  type BasicAutomationDraft, type SequenceDraft, type SequenceStep,
} from "./automation-builders";

const TRIGGER_OPTIONS: { id: AutomationTrigger; label: string; icon: any; description: string }[] = [
  { id: "contact_added", label: "Contact Added", icon: Users, description: "When a new contact is created" },
  { id: "message_received", label: "Message Received", icon: MessageSquare, description: "When an inbound message arrives" },
  { id: "tag_added", label: "Tag Added", icon: Tag, description: "When a tag is applied to a contact" },
  { id: "broadcast_completed", label: "Broadcast Completed", icon: Send, description: "When a broadcast finishes sending" },
  { id: "webhook_received", label: "Webhook Received", icon: Webhook, description: "When an external webhook fires" },
  { id: "scheduled", label: "Scheduled", icon: Clock, description: "At a specified time interval" },
];

const ACTION_OPTIONS: { id: AutomationAction; label: string; icon: any; description: string }[] = [
  { id: "send_message", label: "Send Message", icon: MessageSquare, description: "Send a message to the contact" },
  { id: "add_tag", label: "Add Tag", icon: Tag, description: "Apply a tag to the contact" },
  { id: "remove_tag", label: "Remove Tag", icon: X, description: "Remove a tag from the contact" },
  { id: "add_to_group", label: "Add to Group", icon: Users, description: "Add the contact to a group" },
  { id: "send_broadcast", label: "Send Broadcast", icon: Send, description: "Trigger a broadcast message" },
  { id: "webhook_call", label: "Call Webhook", icon: Globe, description: "POST data to an external URL" },
];

// ============================================================
// Automation Templates
// ============================================================

type TemplateType = "basic" | "sequence" | "flow" | "broadcast";
type TemplateCategory = "onboarding" | "engagement" | "nurture" | "outreach" | "discipleship" | "events" | "support";

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  type: TemplateType;
  category: TemplateCategory;
  icon: any;
  iconTint: string;
  popular?: boolean;
  steps?: number;
  trigger: string;
  action: string;
  tags: string[];
  // Pre-built content for builders
  basicDraft?: Partial<BasicAutomationDraft>;
  sequenceDraft?: Partial<SequenceDraft>;
  flowNodes?: { name: string; description: string; nodeLabels: string[] };
}

const TEMPLATE_CATEGORIES: { id: TemplateCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "onboarding", label: "Onboarding" },
  { id: "engagement", label: "Engagement" },
  { id: "nurture", label: "Nurture" },
  { id: "outreach", label: "Outreach" },
  { id: "discipleship", label: "Discipleship" },
  { id: "events", label: "Events" },
  { id: "support", label: "Support" },
];

const TEMPLATE_TYPE_CONFIG: Record<TemplateType, { label: string; icon: any; color: string; bg: string; border: string }> = {
  basic:     { label: "Auto-Reply",  icon: Reply,     color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200" },
  sequence:  { label: "Drip",        icon: Droplet,   color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-200" },
  flow:      { label: "Flow",        icon: Workflow,   color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200" },
  broadcast: { label: "Broadcast",   icon: Megaphone,  color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200" },
};

const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  // ── Auto-Reply (basic) ──
  { id: "tpl-1",  name: "Welcome Message",         description: "Greet new contacts with a personalized welcome message when they first reach out.", type: "basic", category: "onboarding", icon: HandHeart, iconTint: "bg-emerald-50 text-emerald-600",  popular: true, trigger: "First message received", action: "Send welcome reply", tags: ["welcome", "greeting"],
    basicDraft: { name: "Welcome Message", triggerKind: "welcome", message: "Welcome! We're so glad you reached out. Whether you're looking for community, prayer support, or just have questions — we're here for you.\n\nHow can we help you today?", quickReplies: ["Prayer Request", "Join a Group", "Learn More"] }
  },
  { id: "tpl-2",  name: "Keyword FAQ Bot",          description: "Auto-respond to common questions like 'hours', 'location', or 'price' with instant answers.", type: "basic", category: "support", icon: MessageSquare, iconTint: "bg-blue-50 text-blue-600", popular: true, trigger: "Keyword match", action: "Send templated reply", tags: ["faq", "keywords", "support"],
    basicDraft: { name: "Keyword FAQ Bot", triggerKind: "keyword", keyword: "hours, location, price, contact", message: "Thanks for reaching out! Here are some quick answers:\n\n📍 Location: 123 Faith Avenue, Addis Ababa\n🕐 Hours: Mon-Fri 9 AM - 5 PM, Sun 8 AM - 12 PM\n📞 Phone: +251-11-123-4567\n\nNeed something else? Just ask!", quickReplies: ["Directions", "Service Times", "Talk to Someone"] }
  },
  { id: "tpl-3",  name: "After-Hours Reply",        description: "Let contacts know you're away and when they can expect a response.", type: "basic", category: "support", icon: Clock, iconTint: "bg-gray-50 text-gray-600", trigger: "Message outside hours", action: "Send away message", tags: ["away", "hours", "oof"],
    basicDraft: { name: "After-Hours Reply", triggerKind: "default_reply", message: "Thank you for your message! Our team is currently offline.\n\nOur office hours are Monday - Friday, 9 AM to 5 PM (EAT). We'll respond to your message first thing when we're back.\n\nIf this is urgent, please call our emergency line: +251-11-999-0000", quickReplies: ["Leave a Message", "Emergency Contact"] }
  },
  { id: "tpl-4",  name: "New Subscriber Greeting",  description: "Automatically welcome new subscribers and share key resources or next steps.", type: "basic", category: "onboarding", icon: UserPlus, iconTint: "bg-violet-50 text-violet-600", trigger: "Contact added", action: "Send greeting + resource links", tags: ["subscribe", "welcome"],
    basicDraft: { name: "New Subscriber Greeting", triggerKind: "event", eventName: "intake_complete", message: "Hi there! 👋 Welcome to our community. We're excited to have you here.\n\nHere are a few things to get you started:\n📖 Daily Devotionals — delivered each morning\n🙏 Prayer Wall — share and support others\n👥 Small Groups — find your people\n\nWhich would you like to explore first?", quickReplies: ["Devotionals", "Prayer Wall", "Small Groups", "All of the Above"] }
  },

  // ── Drip (sequence) ──
  { id: "tpl-5",  name: "7-Day Onboarding",         description: "Guide new contacts through your platform with a 7-day drip sequence of tips and resources.", type: "sequence", category: "onboarding", icon: BookOpen, iconTint: "bg-blue-50 text-blue-600", popular: true, steps: 7, trigger: "Contact added", action: "Send daily message", tags: ["onboarding", "drip", "welcome"],
    sequenceDraft: { name: "7-Day Onboarding", trigger: "intake_complete", steps: [
      { id: "s1", delay: { amount: 0, unit: "days" as const }, message: "Welcome to the family! 🎉 Over the next 7 days, we'll walk you through everything you need to know. Today, take a moment to explore the app and set up your profile.", aiPersonalize: false, quickReplies: ["Done!", "Help me"] },
      { id: "s2", delay: { amount: 1, unit: "days" as const }, message: "Day 2: Community is at the heart of what we do. Today, try joining a small group that interests you. We have groups for Bible study, prayer, young adults, and more!", aiPersonalize: false, quickReplies: ["Show groups", "Not yet"] },
      { id: "s3", delay: { amount: 1, unit: "days" as const }, message: "Day 3: Did you know you can request prayer anytime? Our prayer team responds within 24 hours. Try submitting a prayer request today — no request is too big or small.", aiPersonalize: true, quickReplies: ["Submit prayer", "I'm good"] },
      { id: "s4", delay: { amount: 1, unit: "days" as const }, message: "Day 4: Dive into today's devotional! We publish fresh content every morning to help you grow in faith. Check it out and let us know what resonates with you.", aiPersonalize: false, quickReplies: ["Read devotional", "Remind me later"] },
      { id: "s5", delay: { amount: 1, unit: "days" as const }, message: "Day 5: Want to serve? We have volunteering opportunities in outreach, media, worship, and hospitality. Serving is one of the best ways to connect!", aiPersonalize: false, quickReplies: ["Volunteer", "Tell me more"] },
      { id: "s6", delay: { amount: 1, unit: "days" as const }, message: "Day 6: Have questions about faith, the Bible, or life? Our mentors are here to help. You can connect with a mentor for one-on-one guidance anytime.", aiPersonalize: true, quickReplies: ["Connect me", "Maybe later"] },
      { id: "s7", delay: { amount: 1, unit: "days" as const }, message: "Day 7: You made it through your first week! 🙌 We're so glad you're here. What would you like to focus on going forward?", aiPersonalize: false, quickReplies: ["Bible Study", "Prayer", "Volunteering", "Mentorship"] },
    ] }
  },
  { id: "tpl-6",  name: "Re-Engagement Campaign",   description: "Win back inactive contacts with a 3-message sequence offering value and a personal check-in.", type: "sequence", category: "engagement", icon: Heart, iconTint: "bg-rose-50 text-rose-600", steps: 3, trigger: "30 days inactive", action: "Send re-engagement series", tags: ["re-engage", "inactive", "winback"],
    sequenceDraft: { name: "Re-Engagement Campaign", trigger: "tag_added", steps: [
      { id: "s1", delay: { amount: 0, unit: "days" as const }, message: "Hey, we've missed you! 💛 It's been a while since we connected. Just wanted to check in and let you know we're still here for you. How are you doing?", aiPersonalize: true, quickReplies: ["I'm great!", "Could use prayer", "Tell me what's new"] },
      { id: "s2", delay: { amount: 3, unit: "days" as const }, message: "Here's something we thought you'd enjoy — this week's most popular devotional has been inspiring so many people. Give it a read and let us know what you think!", aiPersonalize: false, quickReplies: ["Read it", "Not now"] },
      { id: "s3", delay: { amount: 5, unit: "days" as const }, message: "We'd love to have you back in the community. Here's what's coming up: Sunday Service, a new small group series starting next week, and a community prayer night. Would any of these interest you?", aiPersonalize: false, quickReplies: ["Sunday Service", "Small Group", "Prayer Night", "All of them!"] },
    ] }
  },
  { id: "tpl-7",  name: "Course Follow-Up",         description: "Drip additional resources and check-ins after someone completes a course or event.", type: "sequence", category: "nurture", icon: GraduationCap, iconTint: "bg-amber-50 text-amber-600", steps: 5, trigger: "Tag 'course-complete' added", action: "Send follow-up series", tags: ["course", "follow-up", "learning"],
    sequenceDraft: { name: "Course Follow-Up", trigger: "tag_added", steps: [
      { id: "s1", delay: { amount: 0, unit: "days" as const }, message: "Congratulations on completing the course! 🎓 We hope it was a meaningful experience. Here's a PDF summary of the key takeaways for you to revisit anytime.", aiPersonalize: false, quickReplies: ["Thanks!", "What's next?"] },
      { id: "s2", delay: { amount: 2, unit: "days" as const }, message: "Quick check-in: Have you had a chance to apply anything you learned? Sometimes it helps to pick just one takeaway and practice it this week.", aiPersonalize: true, quickReplies: ["Yes!", "Need ideas", "Remind me later"] },
      { id: "s3", delay: { amount: 4, unit: "days" as const }, message: "Here are some additional resources that go deeper into the topics we covered. Pick one that resonates with you!", aiPersonalize: false, quickReplies: ["Show resources", "I'm good"] },
      { id: "s4", delay: { amount: 7, unit: "days" as const }, message: "One week later — how are things going? We'd love to hear your reflections. Feel free to share or ask any questions.", aiPersonalize: true, quickReplies: ["Share reflection", "Ask a question"] },
      { id: "s5", delay: { amount: 14, unit: "days" as const }, message: "Ready for the next step? We have more courses and small groups that build on what you've learned. Want us to recommend something?", aiPersonalize: false, quickReplies: ["Yes please!", "Browse courses", "Maybe later"] },
    ] }
  },
  { id: "tpl-8",  name: "Discipleship Journey",     description: "A 14-day guided devotional sequence with daily scripture, reflection, and mentor check-ins.", type: "sequence", category: "discipleship", icon: Sparkles, iconTint: "bg-purple-50 text-purple-600", popular: true, steps: 14, trigger: "Opted into discipleship", action: "Daily devotional message", tags: ["discipleship", "devotional", "faith"],
    sequenceDraft: { name: "Discipleship Journey", trigger: "manual", steps: [
      { id: "s1", delay: { amount: 0, unit: "days" as const }, message: "Welcome to the Discipleship Journey! 🌱 Over the next 14 days, we'll explore the foundations of faith together. Today's focus: What does it mean to follow Jesus?\n\n📖 Read: Matthew 4:18-22", aiPersonalize: false, quickReplies: ["I read it", "Tell me more"] },
      { id: "s2", delay: { amount: 1, unit: "days" as const }, message: "Day 2: Prayer — your direct line to God. Prayer isn't about perfect words; it's about honest conversation. Try spending 5 minutes today just talking to God.\n\n📖 Read: Matthew 6:5-13", aiPersonalize: false, quickReplies: ["Done", "Need help praying"] },
      { id: "s3", delay: { amount: 1, unit: "days" as const }, message: "Day 3: The Bible — God's love letter to you. Today, read John 3:16-21. What stands out to you? Share your thoughts!", aiPersonalize: true, quickReplies: ["Share thoughts", "Read again"] },
      { id: "s4", delay: { amount: 1, unit: "days" as const }, message: "Day 4: Community matters. God designed us to grow together, not alone. Who in your life encourages your faith?\n\n📖 Read: Hebrews 10:24-25", aiPersonalize: false, quickReplies: ["I have someone", "I need community"] },
      { id: "s5", delay: { amount: 1, unit: "days" as const }, message: "Day 5: Serving others. When we serve, we reflect God's love in action. What's one small way you could serve someone today?\n\n📖 Read: Galatians 5:13-14", aiPersonalize: true, quickReplies: ["I served!", "Give me ideas"] },
      { id: "s6", delay: { amount: 1, unit: "days" as const }, message: "Day 6: Forgiveness — one of the hardest but most freeing parts of faith. Is there someone you need to forgive, or do you need to receive forgiveness?\n\n📖 Read: Colossians 3:12-14", aiPersonalize: true, quickReplies: ["I'm reflecting", "This is hard"] },
      { id: "s7", delay: { amount: 1, unit: "days" as const }, message: "Day 7: Week 1 complete! 🎉 You've been exploring prayer, Scripture, community, service, and forgiveness. Which one resonated most with you?", aiPersonalize: false, quickReplies: ["Prayer", "Scripture", "Community", "All of them"] },
      { id: "s8", delay: { amount: 1, unit: "days" as const }, message: "Day 8: Worship — it's more than singing. Worship is a lifestyle of gratitude. What are 3 things you're thankful for today?\n\n📖 Read: Psalm 100", aiPersonalize: false, quickReplies: ["I listed them!", "Help me think"] },
      { id: "s9", delay: { amount: 1, unit: "days" as const }, message: "Day 9: Trusting God in difficult times. Life isn't always easy, but God promises to be with us.\n\n📖 Read: Isaiah 41:10\n\nWhat's something you need to trust God with right now?", aiPersonalize: true, quickReplies: ["Share", "Just praying"] },
      { id: "s10", delay: { amount: 1, unit: "days" as const }, message: "Day 10: Sharing your faith. You don't need to have all the answers — just share what God has done in your life.\n\n📖 Read: 1 Peter 3:15", aiPersonalize: false, quickReplies: ["I shared!", "I'm nervous"] },
      { id: "s11", delay: { amount: 1, unit: "days" as const }, message: "Day 11: Spiritual disciplines. Fasting, journaling, silence — these are tools to deepen your relationship with God. Want to try one this week?\n\n📖 Read: Matthew 6:16-18", aiPersonalize: false, quickReplies: ["Fasting", "Journaling", "Silence"] },
      { id: "s12", delay: { amount: 1, unit: "days" as const }, message: "Day 12: God's purpose for you. You were created with a unique purpose. What gifts and passions has God given you?\n\n📖 Read: Jeremiah 29:11-13", aiPersonalize: true, quickReplies: ["Share gifts", "Still discovering"] },
      { id: "s13", delay: { amount: 1, unit: "days" as const }, message: "Day 13: Perseverance. The Christian life is a marathon, not a sprint. Keep going — God is faithful.\n\n📖 Read: James 1:2-4", aiPersonalize: false, quickReplies: ["Encouraged!", "Need prayer"] },
      { id: "s14", delay: { amount: 1, unit: "days" as const }, message: "Day 14: You did it! 🌟 14 days of growing in faith. This isn't the end — it's just the beginning. Want to continue with a mentor or join a small group?\n\nWe're so proud of you!", aiPersonalize: false, quickReplies: ["Connect with mentor", "Join a group", "Both!"] },
    ] }
  },

  // ── Flow (journey) ──
  { id: "tpl-9",  name: "Lead Qualification",       description: "Ask qualifying questions, score responses, and route contacts to the right team member.", type: "flow", category: "outreach", icon: Target, iconTint: "bg-orange-50 text-orange-600", popular: true, steps: 6, trigger: "New lead message", action: "Qualify → Route → Assign", tags: ["lead", "qualification", "routing"],
    flowNodes: { name: "Lead Qualification", description: "Qualify and route new leads", nodeLabels: ["Trigger: New Message", "Ask: What brings you here?", "Ask: How did you hear about us?", "Score Responses", "Route: High Interest → Team Lead", "Route: Low Interest → Nurture Sequence"] }
  },
  { id: "tpl-10", name: "Event Registration",       description: "Collect RSVPs, send confirmations, reminders, and post-event follow-ups — all automated.", type: "flow", category: "events", icon: CalendarDays, iconTint: "bg-cyan-50 text-cyan-600", steps: 8, trigger: "Keyword 'register'", action: "Collect info → Confirm → Remind", tags: ["event", "registration", "rsvp"],
    flowNodes: { name: "Event Registration Flow", description: "Full event registration journey", nodeLabels: ["Trigger: Keyword 'register'", "Ask: Full Name", "Ask: Email Address", "Ask: Number of Guests", "Send: Confirmation Message", "Wait: 1 Day Before Event", "Send: Reminder + Location", "Send: Post-Event Thank You"] }
  },
  { id: "tpl-11", name: "Survey + Smart Routing",   description: "Run a survey, branch on answers, and route contacts to different paths based on responses.", type: "flow", category: "engagement", icon: GitBranch, iconTint: "bg-indigo-50 text-indigo-600", steps: 5, trigger: "Survey started", action: "Branch on answers → Route", tags: ["survey", "routing", "branch"],
    flowNodes: { name: "Survey + Smart Routing", description: "Branch contacts based on survey answers", nodeLabels: ["Trigger: Survey Started", "Ask: Rate your experience (1-5)", "Branch: Score ≥ 4 → Testimonial Request", "Branch: Score ≤ 3 → Follow-Up Support", "Send: Thank You Message"] }
  },
  { id: "tpl-12", name: "Seeker Follow-Up Path",    description: "A multi-step journey that guides seekers from initial interest to connection with a mentor.", type: "flow", category: "discipleship", icon: TrendingUp, iconTint: "bg-emerald-50 text-emerald-600", steps: 10, trigger: "Campaign response", action: "Nurture → Match mentor → Check-in", tags: ["seeker", "mentor", "follow-up"],
    flowNodes: { name: "Seeker Follow-Up Path", description: "Guide seekers from interest to mentorship", nodeLabels: ["Trigger: Campaign Response", "Send: Welcome & Ask Interest", "Branch: Interested → Continue", "Send: Share Testimony Video", "Wait: 2 Days", "Ask: Would you like a mentor?", "Branch: Yes → Match Mentor", "Send: Mentor Introduction", "Wait: 7 Days", "Send: Check-In & Next Steps"] }
  },

  // ── Broadcast ──
  { id: "tpl-13", name: "Weekly Newsletter",        description: "Send a weekly update to all active contacts with news, events, and encouragement.", type: "broadcast", category: "outreach", icon: Send, iconTint: "bg-blue-50 text-blue-600", popular: true, trigger: "Every Monday 9 AM", action: "Broadcast to all active", tags: ["newsletter", "weekly", "update"],
    sequenceDraft: { name: "Weekly Newsletter", trigger: "manual", steps: [
      { id: "s1", delay: { amount: 0, unit: "minutes" as const }, message: "📬 Weekly Update — [Date]\n\n🙏 This Week's Verse: \"For I know the plans I have for you...\" — Jeremiah 29:11\n\n📅 Upcoming Events:\n• Sunday Service — 10 AM\n• Midweek Prayer — Wednesday 7 PM\n• Youth Night — Friday 6 PM\n\n💡 Tip of the Week: Take 5 minutes today to write down 3 things you're grateful for.\n\nBlessings from the GCM Team!", aiPersonalize: false, quickReplies: ["Register for event", "Share with a friend"] },
    ] }
  },
  { id: "tpl-14", name: "Event Announcement",       description: "Blast an upcoming event to your audience with date, location, and registration link.", type: "broadcast", category: "events", icon: Bell, iconTint: "bg-amber-50 text-amber-600", trigger: "Manual or scheduled", action: "Broadcast to segment", tags: ["event", "announcement", "invite"],
    sequenceDraft: { name: "Event Announcement", trigger: "manual", steps: [
      { id: "s1", delay: { amount: 0, unit: "minutes" as const }, message: "🎉 You're Invited!\n\n[Event Name]\n📅 Date: [Date & Time]\n📍 Location: [Venue Address]\n\nJoin us for an incredible time of worship, fellowship, and inspiration. Bring a friend!\n\nReply 'REGISTER' to save your spot. Space is limited!", aiPersonalize: false, quickReplies: ["Register", "More Info", "Share"] },
    ] }
  },
  { id: "tpl-15", name: "Holiday Greeting",         description: "Send a warm holiday or special occasion greeting to all contacts.", type: "broadcast", category: "outreach", icon: Gift, iconTint: "bg-pink-50 text-pink-600", trigger: "Scheduled date", action: "Broadcast greeting", tags: ["holiday", "greeting", "seasonal"],
    sequenceDraft: { name: "Holiday Greeting", trigger: "manual", steps: [
      { id: "s1", delay: { amount: 0, unit: "minutes" as const }, message: "✨ Wishing you and your loved ones a blessed [Holiday Name]!\n\nMay this season fill your heart with joy, peace, and gratitude. You are loved and valued.\n\n\"The Lord bless you and keep you; the Lord make His face shine on you and be gracious to you.\" — Numbers 6:24-25\n\nWith love from the GCM Family 💛", aiPersonalize: false, quickReplies: ["Thank you!", "Share blessings"] },
    ] }
  },
  { id: "tpl-16", name: "Promotion / Campaign",     description: "Announce a promotion, campaign launch, or special offer to a targeted segment.", type: "broadcast", category: "engagement", icon: Star, iconTint: "bg-yellow-50 text-yellow-600", trigger: "Manual trigger", action: "Broadcast to tagged segment", tags: ["promo", "campaign", "offer"],
    sequenceDraft: { name: "Promotion / Campaign", trigger: "manual", steps: [
      { id: "s1", delay: { amount: 0, unit: "minutes" as const }, message: "🚀 Exciting News!\n\n[Campaign Name] is here! We're launching [describe campaign/initiative] and we'd love for you to be part of it.\n\n🎯 Goal: [Campaign goal]\n📅 Dates: [Start] — [End]\n\nReady to join? Reply 'YES' to get involved!", aiPersonalize: false, quickReplies: ["Count me in!", "Tell me more", "Share with friends"] },
    ] }
  },
];

interface AutomationViewProps {
  automations: AutomationRule[];
  webhooks: WebhookType[];
  onToggleAutomation: (id: string) => void;
  onDeleteAutomation: (id: string) => void;
  onAddAutomation: (data: Partial<AutomationRule>) => void;
  onUpdateAutomation: (id: string, data: Partial<AutomationRule>) => void;
  onToggleWebhook: (id: string) => void;
  onDeleteWebhook: (id: string) => void;
  onAddWebhook: (data: Partial<WebhookType>) => void;
  onUpdateWebhook: (id: string, data: Partial<WebhookType>) => void;
}

// Derive a Basic / Sequence / Flow bucket for each automation so the list can
// be organised into folders matching the spec. Deterministic per-automation.
type AutoType = "basic" | "sequence" | "flow";
const getAutoType = (a: AutomationRule): AutoType => {
  if (a.trigger === "scheduled" || a.action === "send_broadcast") return "sequence";
  if (a.trigger === "webhook_received" || a.action === "webhook_call") return "flow";
  return "basic";
};
const getAutoStatus = (a: AutomationRule): "active" | "draft" | "stopped" => {
  if (a.enabled) return "active";
  if (a.triggerCount === 0) return "draft";
  return "stopped";
};
// Deterministic pseudo-CTR per automation id so numbers stay stable between renders.
const getAutoCtr = (a: AutomationRule): number | null => {
  if (a.triggerCount === 0) return null;
  let h = 0; for (let i = 0; i < a.id.length; i++) h = (h * 31 + a.id.charCodeAt(i)) | 0;
  return 40 + (Math.abs(h) % 55); // 40–94%
};
const statusBadge = (s: "active" | "draft" | "stopped") => {
  const map = {
    active:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    draft:   "bg-amber-50 text-amber-700 border-amber-200",
    stopped: "bg-rose-50 text-rose-700 border-rose-200",
  } as const;
  return map[s];
};
const typeLabel = (t: AutoType) => t === "basic" ? "Basic" : t === "sequence" ? "Sequence" : "Journey";

// Colorful type badge derived from trigger+action
type TypeBadgeInfo = { label: string; icon: any; color: string; bg: string; border: string };
const getTypeBadge = (a: AutomationRule): TypeBadgeInfo => {
  if (a.trigger === "message_received" && a.action === "send_message")
    return { label: "Auto-Reply", icon: CornerDownRight, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" };
  if (a.action === "add_tag" || a.action === "remove_tag")
    return { label: "Tag Rule", icon: Tag, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
  if (a.action === "add_to_group")
    return { label: "Survey", icon: FileText, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
  if (a.action === "send_broadcast" || a.trigger === "broadcast_completed")
    return { label: "Broadcast", icon: Send, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" };
  if (a.trigger === "scheduled")
    return { label: "Drip", icon: Clock, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" };
  if (a.trigger === "webhook_received" || a.action === "webhook_call")
    return { label: "Flow", icon: GitBranch, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" };
  if (a.trigger === "contact_added")
    return { label: "Auto-Reply", icon: CornerDownRight, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" };
  return { label: "Auto-Reply", icon: CornerDownRight, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" };
};

// Build pre-populated flow nodes from template labels
const buildTemplateFlowNodes = (labels: string[]) => {
  const nodeTypeMap: Record<string, { type: "trigger" | "action" | "condition" | "delay" | "end"; category: string; icon: any; iconColor: string; iconBg: string }> = {
    "Trigger": { type: "trigger", category: "message_received", icon: MessageSquare, iconColor: "text-blue-400", iconBg: "bg-blue-500/20" },
    "Ask":     { type: "action",  category: "send_message",     icon: Send,           iconColor: "text-blue-400", iconBg: "bg-blue-500/20" },
    "Send":    { type: "action",  category: "send_message",     icon: Send,           iconColor: "text-blue-400", iconBg: "bg-blue-500/20" },
    "Wait":    { type: "delay",   category: "wait",             icon: Clock,          iconColor: "text-teal-400", iconBg: "bg-teal-500/20" },
    "Branch":  { type: "condition", category: "if_else",        icon: GitBranch,      iconColor: "text-orange-400", iconBg: "bg-orange-500/20" },
    "Route":   { type: "condition", category: "filter",         icon: Filter,         iconColor: "text-sky-400",  iconBg: "bg-sky-500/20" },
    "Score":   { type: "action",  category: "update_stage",     icon: ArrowRight,     iconColor: "text-sky-400",  iconBg: "bg-sky-500/20" },
  };

  return labels.map((label, i) => {
    const prefix = label.split(":")[0]?.trim() ?? "";
    const match = nodeTypeMap[prefix] ?? nodeTypeMap["Send"];
    return {
      id: `tpl-node-${i}`,
      type: match.type,
      category: match.category,
      label,
      description: "",
      icon: match.icon,
      iconColor: match.iconColor,
      iconBg: match.iconBg,
      config: {},
      position: { x: i, y: 0 },
    };
  });
};

const buildTemplateFlowConnections = (nodeCount: number) => {
  return Array.from({ length: nodeCount - 1 }, (_, i) => ({
    id: `tpl-conn-${i}`,
    from: `tpl-node-${i}`,
    to: `tpl-node-${i + 1}`,
  }));
};

// Wrapper that manages journey draft state so nodes persist across renders
const JourneyCanvasWrapper = ({ rule, onBack, onPersist, templateName, templateNodeLabels }: {
  rule?: AutomationRule;
  onBack: () => void;
  onPersist: (data: Partial<AutomationRule>) => void;
  templateName?: string;
  templateNodeLabels?: string[];
}) => {
  const [draft, setDraft] = useState<AutomationDraft>(() => {
    const tplNodes = templateNodeLabels ? buildTemplateFlowNodes(templateNodeLabels) : [];
    const tplConns = templateNodeLabels ? buildTemplateFlowConnections(templateNodeLabels.length) : [];
    return {
      id: rule?.id ?? `auto-${Date.now()}`,
      name: rule?.name ?? templateName ?? "New Journey",
      description: rule?.description ?? "Journey",
      nodes: tplNodes,
      connections: tplConns,
      enabled: rule?.enabled ?? false,
      createdAt: rule?.createdAt ?? new Date().toISOString(),
      runs: rule?.triggerCount ?? 0,
      mode: "journey",
      folderId: null,
    };
  });
  return (
    <AutomationCanvas
      automation={draft}
      onBack={onBack}
      onSave={(a) => { setDraft(a); onPersist({ name: a.name, description: "Journey", trigger: "webhook_received", action: "webhook_call", enabled: false }); }}
      onUpdate={(a) => { setDraft(a); onPersist({ name: a.name, description: "Journey", trigger: "webhook_received", action: "webhook_call", enabled: a.enabled }); }}
    />
  );
};

export const AutomationView = ({
  automations,
  webhooks,
  onToggleAutomation,
  onDeleteAutomation,
  onAddAutomation,
  onUpdateAutomation,
  onToggleWebhook,
  onDeleteWebhook,
  onAddWebhook,
  onUpdateWebhook,
}: AutomationViewProps) => {
  // Webhooks tab removed — webhooks now live inside the Journey Builder.
  const activeTab = "rules" as const;
  const [viewMode, setViewMode] = useState<"automations" | "templates">("automations");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  // isAddWebhookOpen removed — webhooks are managed inside the Journey Builder.
  const [activeFolder, setActiveFolder] = useState<"all" | AutoType>("all");
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<AutomationRule | null>(null);
  // Builders are full-page overlays. `builderState` carries the kind + mode;
  // null means the list view is showing.
  const [builderState, setBuilderState] = useState<
    | { kind: "basic";    mode: "new" | "edit"; rule?: AutomationRule; template?: AutomationTemplate }
    | { kind: "sequence"; mode: "new" | "edit"; rule?: AutomationRule; template?: AutomationTemplate }
    | { kind: "flow";     mode: "new" | "edit"; rule?: AutomationRule; template?: AutomationTemplate }
    | null
  >(null);
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [customFolders, setCustomFolders] = useState<{ id: string; name: string; automationIds: string[] }[]>([
    { id: "folder-onboarding",   name: "Onboarding",    automationIds: ["auto-1", "auto-6", "auto-11"] },
    { id: "folder-followups",    name: "Follow-ups",    automationIds: ["auto-10", "auto-15"] },
    { id: "folder-discipleship", name: "Discipleship",  automationIds: ["auto-8", "auto-12", "auto-14"] },
  ]);
  const [movingRule, setMovingRule] = useState<AutomationRule | null>(null);
  // Filters
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "draft" | "stopped">("all");
  const [filterType, setFilterType] = useState<"all" | AutoType>("all");
  const [sortBy, setSortBy] = useState<"name" | "modified" | "runs" | "status">("modified");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const id = `folder-${Date.now()}`;
    setCustomFolders(prev => [...prev, { id, name: newFolderName.trim(), automationIds: [] }]);
    setActiveFolder(id as any);
    toast.success(`Folder "${newFolderName.trim()}" created`);
    setNewFolderName("");
    setIsNewFolderOpen(false);
  };

  const handleDeleteFolder = (folderId: string) => {
    setCustomFolders(prev => prev.filter(f => f.id !== folderId));
    if (activeFolder === folderId) setActiveFolder("all");
    toast.success("Folder deleted");
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    setCustomFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: newName } : f));
    toast.success("Folder renamed");
  };

  const handleMoveToFolder = (ruleId: string, folderId: string) => {
    setCustomFolders(prev => prev.map(f => ({
      ...f,
      automationIds: f.id === folderId
        ? [...new Set([...f.automationIds, ruleId])]
        : f.automationIds.filter(id => id !== ruleId),
    })));
    setMovingRule(null);
    const folderName = customFolders.find(f => f.id === folderId)?.name || "folder";
    toast.success(`Moved to "${folderName}"`);
  };

  const handleRemoveFromFolder = (ruleId: string, folderId: string) => {
    setCustomFolders(prev => prev.map(f =>
      f.id === folderId ? { ...f, automationIds: f.automationIds.filter(id => id !== ruleId) } : f
    ));
    toast.success("Removed from folder");
  };

  const handleDuplicateRule = (rule: AutomationRule) => {
    onAddAutomation({
      tenantId: rule.tenantId,
      name: `${rule.name} (Copy)`,
      description: rule.description,
      trigger: rule.trigger,
      triggerConfig: rule.triggerConfig,
      action: rule.action,
      actionConfig: rule.actionConfig,
      enabled: false,
      triggerCount: 0,
    });
    toast.success(`"${rule.name}" duplicated`);
  };

  const handleConfirmDelete = () => {
    if (!ruleToDelete) return;
    onDeleteAutomation(ruleToDelete.id);
    toast.success(`"${ruleToDelete.name}" deleted`);
    setRuleToDelete(null);
  };

  // Contextual copy per folder so the create button, modal, and empty state
  // feel native to whichever category the user is in.
  const customFolderMatch = customFolders.find(f => f.id === activeFolder);
  const folderCopy = customFolderMatch
    ? { createLabel: "New Automation", singular: "Automation", emptyTitle: `No automations in "${customFolderMatch.name}"`, emptyBody: "Move automations into this folder using the menu on each automation row." }
    : {
      all:      { createLabel: "New Automation", singular: "Automation", emptyTitle: "Create your first Automation", emptyBody: "Automate interactions with your contacts by creating rules, sequences, and flows so you have more time to handle meaningful conversations." },
      basic:    { createLabel: "New Basic",      singular: "Basic rule", emptyTitle: "Create your first Basic rule", emptyBody: "Basic rules pair a single trigger with a single action — perfect for welcome messages, keyword replies, and quick automations." },
      sequence: { createLabel: "New Sequence",   singular: "Sequence",   emptyTitle: "Create your first Sequence", emptyBody: "Automate interactions with your contacts by creating a series of automatic messages so you have more time to handle meaningful conversations." },
      flow:     { createLabel: "New Journey",     singular: "Journey",    emptyTitle: "Create your first Journey",  emptyBody: "Journeys let you build branching, multi-step automations with milestones and webhooks — ideal for discipleship paths." },
    }[activeTab === "rules" ? (activeFolder as "all" | AutoType) : "all"];

  const activeAutomations = automations.filter(a => a.enabled).length;
  const totalTriggers = automations.reduce((sum, a) => sum + a.triggerCount, 0);
  const activeWebhooks = webhooks.filter(w => w.enabled).length;

  // Tag each automation with its derived type once, then filter.
  const typedAutos = useMemo(() => automations.map(a => ({ ...a, _type: getAutoType(a) })), [automations]);
  const folderCounts = useMemo(() => ({
    all:      typedAutos.length,
    basic:    typedAutos.filter(a => a._type === "basic").length,
    sequence: typedAutos.filter(a => a._type === "sequence").length,
    flow:     typedAutos.filter(a => a._type === "flow").length,
  }), [typedAutos]);

  const filteredRules = useMemo(() => {
    const filtered = typedAutos.filter(a => {
      const customFolder = customFolders.find(f => f.id === activeFolder);
      const matchesFolder = activeFolder === "all"
        || a._type === activeFolder
        || (customFolder && customFolder.automationIds.includes(a.id));
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
      const matchesStatus = filterStatus === "all" || getAutoStatus(a) === filterStatus;
      const matchesType = filterType === "all" || a._type === filterType;
      return matchesFolder && matchesSearch && matchesStatus && matchesType;
    });
    // Sort
    const dir = sortDir === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":     return dir * a.name.localeCompare(b.name);
        case "runs":     return dir * (a.triggerCount - b.triggerCount);
        case "status": {
          const order = { active: 0, draft: 1, stopped: 2 };
          return dir * (order[getAutoStatus(a)] - order[getAutoStatus(b)]);
        }
        case "modified":
        default: {
          const ta = new Date(a.lastTriggeredAt || a.createdAt).getTime();
          const tb = new Date(b.lastTriggeredAt || b.createdAt).getTime();
          return dir * (ta - tb);
        }
      }
    });
    return filtered;
  }, [typedAutos, activeFolder, customFolders, searchQuery, filterStatus, filterType, sortBy, sortDir]);

  const filteredWebhooks = webhooks.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Full-page builders take over when active, short-circuiting the list view.
  if (builderState) {
    const { kind, mode, rule, template } = builderState;
    const isEdit = mode === "edit";
    const close = () => setBuilderState(null);

    // Common persistence helper: route creates / updates through existing handlers.
    const persist = (opts: { name: string; description?: string; trigger: AutomationTrigger; action: AutomationAction; enabled: boolean }) => {
      if (isEdit && rule) {
        onUpdateAutomation(rule.id, { name: opts.name, description: opts.description, trigger: opts.trigger, action: opts.action, enabled: opts.enabled });
      } else {
        onAddAutomation({
          tenantId: "tenant-1",
          name: opts.name,
          description: opts.description ?? "",
          trigger: opts.trigger,
          triggerConfig: {},
          action: opts.action,
          actionConfig: {},
          enabled: opts.enabled,
          triggerCount: 0,
        });
      }
    };
    const statusFor = (r?: AutomationRule) => r ? (r.enabled ? "active" : r.triggerCount === 0 ? "draft" : "stopped") : "draft";

    if (kind === "basic") {
      const initialData: Partial<BasicAutomationDraft> | undefined = rule
        ? { id: rule.id, name: rule.name }
        : template?.basicDraft ?? undefined;
      return (
        <BasicAutomationBuilder
          status={statusFor(rule)}
          runs={rule?.triggerCount}
          initial={initialData}
          onBack={close}
          onSave={(draft) => persist({ name: draft.name, description: `Basic · ${draft.triggerKind}`, trigger: draft.triggerKind === "keyword" ? "message_received" : draft.triggerKind === "event" ? "webhook_received" : "message_received", action: "send_message", enabled: false })}
          onPublish={(draft) => { persist({ name: draft.name, description: `Basic · ${draft.triggerKind}`, trigger: draft.triggerKind === "keyword" ? "message_received" : draft.triggerKind === "event" ? "webhook_received" : "message_received", action: "send_message", enabled: true }); close(); }}
        />
      );
    }
    if (kind === "sequence") {
      const initialData: Partial<SequenceDraft> | undefined = rule
        ? { id: rule.id, name: rule.name }
        : template?.sequenceDraft ?? undefined;
      return (
        <SequenceBuilder
          status={statusFor(rule)}
          runs={rule?.triggerCount}
          initial={initialData}
          onBack={close}
          onSave={(draft) => persist({ name: draft.name, description: `Sequence · ${draft.steps.length} step${draft.steps.length === 1 ? "" : "s"}`, trigger: "scheduled", action: "send_message", enabled: false })}
          onPublish={(draft) => { persist({ name: draft.name, description: `Sequence · ${draft.steps.length} step${draft.steps.length === 1 ? "" : "s"}`, trigger: "scheduled", action: "send_message", enabled: true }); close(); }}
        />
      );
    }
    // kind === "flow" → Journey Builder (v2 React Flow canvas)
    return (
      <JourneyCanvasWrapper rule={rule} onBack={() => { close(); }} onPersist={persist} templateName={template?.flowNodes?.name} templateNodeLabels={template?.flowNodes?.nodeLabels} />
    );
  }

  return (
    <div className="space-y-5 p-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Automations</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your automation workflows</p>
        </div>
        <Button onClick={() => {
          if (activeFolder === "basic")    { setBuilderState({ kind: "basic",    mode: "new" }); return; }
          if (activeFolder === "sequence") { setBuilderState({ kind: "sequence", mode: "new" }); return; }
          if (activeFolder === "flow")     { setBuilderState({ kind: "flow",     mode: "new" }); return; }
          setIsTypePickerOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-1.5" />
          {folderCopy.createLabel}
        </Button>
      </header>

      {/* Top-level tab switcher — pill style matching dashboard */}
      <div className="inline-flex items-center gap-1 bg-muted/60 border border-border rounded-full p-1 h-12">
        {([
          ["automations", "My Automations", Zap],
          ["templates",   "Templates",      LayoutTemplate],
        ] as const).map(([k, label, Icon]) => {
          const isActive = viewMode === k;
          return (
            <button
              key={k}
              onClick={() => setViewMode(k)}
              className={cn(
                "flex items-center gap-2 px-4 h-10 text-sm font-semibold rounded-full transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {viewMode === "templates" && (
        <AutomationTemplatesTab
          onUseTemplate={(tpl) => {
            setViewMode("automations");
            if (tpl.type === "broadcast") {
              setBuilderState({ kind: "sequence", mode: "new", template: tpl });
            } else {
              setBuilderState({ kind: tpl.type, mode: "new", template: tpl });
            }
            toast.success(`Started new ${TEMPLATE_TYPE_CONFIG[tpl.type].label} from "${tpl.name}"`);
          }}
        />
      )}

      {viewMode === "automations" && <>
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: automations.length, icon: Zap, color: "text-primary" },
          { label: "Active", value: activeAutomations, icon: Play, color: "text-emerald-600" },
          { label: "Total Runs", value: totalTriggers.toLocaleString(), icon: Activity, color: "text-blue-600" },
          { label: "Webhooks", value: webhooks.filter(w => w.enabled).length, icon: Globe, color: "text-violet-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-9 h-10 text-sm border-border bg-background w-full"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value as any); setCurrentPage(1); }}
          className="h-10 px-3 pr-8 rounded-lg border border-border bg-background text-sm text-foreground appearance-none cursor-pointer hover:border-muted-foreground/40 transition-colors"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
        >
          <option value="all">All types</option>
          <option value="basic">Basic</option>
          <option value="sequence">Sequence</option>
          <option value="flow">Journey</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as any); setCurrentPage(1); }}
          className="h-10 px-3 pr-8 rounded-lg border border-border bg-background text-sm text-foreground appearance-none cursor-pointer hover:border-muted-foreground/40 transition-colors"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="stopped">Stopped</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row gap-5 items-start animate-in fade-in duration-300">
            {/* Folders sidebar — sticky, soft-tint active state */}
            <aside className="bg-card border border-border rounded-xl p-4 md:sticky md:top-6 self-start w-full md:w-[260px] md:shrink-0">
              <p className="text-sm font-semibold text-foreground px-2 pb-3">Folders</p>
              <div className="space-y-1" role="tablist" aria-label="Automation folders">
                {([
                  ["all",      "All Automations", folderCounts.all,      Inbox],
                  ["basic",    "Basic",           folderCounts.basic,    Zap],
                  ["sequence", "Sequences",       folderCounts.sequence, ListOrdered],
                  ["flow",     "Journey Builder", folderCounts.flow,     GitBranch],
                ] as const).map(([k, label, count, Icon]) => {
                  const isActive = activeFolder === k;
                  return (
                    <button
                      key={k}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveFolder(k as any)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground font-medium hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{label}</span>
                      <span className={cn(
                        "text-xs tabular-nums",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>{count}</span>
                    </button>
                  );
                })}
                {/* Custom folders */}
                {customFolders.length > 0 && (
                  <div className="border-t border-border mt-2 pt-2">
                    {customFolders.map(folder => {
                      const isActive = activeFolder === folder.id;
                      const count = folder.automationIds.length;
                      return (
                        <div key={folder.id} className="group/folder flex items-center gap-1">
                          <button
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveFolder(folder.id as any)}
                            className={cn(
                              "flex-1 min-w-0 flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-muted-foreground font-medium hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {isActive ? <FolderOpen className="w-4 h-4 shrink-0" /> : <Folder className="w-4 h-4 shrink-0" />}
                            <span className="flex-1 text-left truncate">{folder.name}</span>
                            <span className={cn(
                              "text-xs tabular-nums shrink-0",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )}>{count}</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                            className="shrink-0 opacity-0 group-hover/folder:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            title="Delete folder"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => setIsNewFolderOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span className="flex-1 text-left">New Folder</span>
                </button>
              </div>
            </aside>

            {/* Right panel — content of the selected folder */}
            <div className="bg-card border border-border rounded-xl overflow-hidden flex-1 min-w-0 w-full">
              {/* Folder header — makes it clear which folder's content is shown */}
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const customFolder = customFolders.find(f => f.id === activeFolder);
                    const Icon = customFolder ? FolderOpen
                      : activeFolder === "all" ? Inbox
                      : activeFolder === "basic" ? Zap
                      : activeFolder === "sequence" ? ListOrdered : GitBranch;
                    const label = customFolder ? customFolder.name
                      : activeFolder === "all" ? "All Automations"
                      : activeFolder === "basic" ? "Basic"
                      : activeFolder === "sequence" ? "Sequences" : "Journey Builder";
                    return (
                      <>
                        <Icon className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                        <Badge variant="secondary" className="text-xs">{filteredRules.length}</Badge>
                      </>
                    );
                  })()}
                </div>
              </div>
              {filteredRules.length === 0 ? (
                <div className="px-6 py-16 text-center max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    {(() => {
                      const EmptyIcon = customFolderMatch ? FolderOpen
                        : activeFolder === "sequence" ? ListOrdered
                        : activeFolder === "flow" ? GitBranch
                        : activeFolder === "basic" ? Zap : Inbox;
                      return <EmptyIcon className="w-5 h-5 text-primary" />;
                    })()}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {searchQuery ? "No automations match your search" : folderCopy.emptyTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {searchQuery ? "Try a different keyword or clear your search." : folderCopy.emptyBody}
                  </p>
                  {!searchQuery && (
                    customFolderMatch ? (
                      <Button variant="outline" className="mt-5" onClick={() => setActiveFolder("all")}>
                        <Inbox className="w-4 h-4 mr-1.5" />
                        Browse All Automations
                      </Button>
                    ) : (
                      <Button className="mt-5" onClick={() => {
                        if (activeFolder === "basic")    setBuilderState({ kind: "basic",    mode: "new" });
                        else if (activeFolder === "sequence") setBuilderState({ kind: "sequence", mode: "new" });
                        else if (activeFolder === "flow")     setBuilderState({ kind: "flow",     mode: "new" });
                        else setIsTypePickerOpen(true);
                      }}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        {folderCopy.createLabel}
                      </Button>
                    )
                  )}
                </div>
              ) : (
                <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground tracking-wide">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wide">Version</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wide">Modified</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const totalPages = Math.max(1, Math.ceil(filteredRules.length / pageSize));
                      const safePage = Math.min(currentPage, totalPages);
                      const paged = filteredRules.slice((safePage - 1) * pageSize, safePage * pageSize);
                      return paged.map((rule) => {
                        const status = getAutoStatus(rule);
                        const badge = getTypeBadge(rule);
                        const BadgeIcon = badge.icon;
                        const modified = rule.lastTriggeredAt || rule.createdAt;
                        return (
                          <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setBuilderState({ kind: rule._type, mode: "edit", rule })}
                                className="flex flex-col gap-0.5 text-left group/name"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-foreground group-hover/name:text-primary transition-colors">{rule.name}</span>
                                  {(() => {
                                    const f = customFolders.find(f => f.automationIds.includes(rule.id));
                                    if (!f) return null;
                                    return (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">
                                        <Folder className="w-2.5 h-2.5" />{f.name}
                                      </span>
                                    );
                                  })()}
                                </div>
                                {rule.description && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[420px]">{rule.description}</span>
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-4">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
                                badge.bg, badge.color, badge.border
                              )}>
                                <BadgeIcon className="w-3 h-3" />
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <button
                                onClick={() => onToggleAutomation(rule.id)}
                                title={rule.enabled ? "Click to stop" : "Click to activate"}
                                className="cursor-pointer"
                              >
                                <span className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all hover:ring-2 hover:ring-offset-1",
                                  statusBadge(status),
                                  status === "active" ? "hover:ring-emerald-300" : status === "draft" ? "hover:ring-amber-300" : "hover:ring-rose-300"
                                )}>
                                  <span className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    status === "active" ? "bg-emerald-500" : status === "draft" ? "bg-amber-500" : "bg-rose-500"
                                  )} />
                                  {status === "active" ? "Active" : status === "draft" ? "Draft" : "Stopped"}
                                </span>
                              </button>
                            </td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">v1</td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">{formatTimeAgo(modified)}</td>
                            <td className="px-4 py-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  aria-label={`Actions for ${rule.name}`}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem onSelect={() => setBuilderState({ kind: rule._type, mode: "edit", rule })}>
                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleDuplicateRule(rule)}>
                                    <Copy className="w-3.5 h-3.5" /> Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => onToggleAutomation(rule.id)}>
                                    {rule.enabled ? <><Pause className="w-3.5 h-3.5" />Stop</> : <><Play className="w-3.5 h-3.5" />Activate</>}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => setMovingRule(rule)}>
                                    <FolderPlus className="w-3.5 h-3.5" /> Move to Folder
                                  </DropdownMenuItem>
                                  {(() => {
                                    const parentFolder = customFolders.find(f => f.automationIds.includes(rule.id));
                                    if (!parentFolder) return null;
                                    return (
                                      <DropdownMenuItem onSelect={() => handleRemoveFromFolder(rule.id, parentFolder.id)}>
                                        <X className="w-3.5 h-3.5" /> Remove from "{parentFolder.name}"
                                      </DropdownMenuItem>
                                    );
                                  })()}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem variant="destructive" onSelect={() => setRuleToDelete(rule)}>
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
                {/* Pagination footer */}
                {(() => {
                  const totalPages = Math.max(1, Math.ceil(filteredRules.length / pageSize));
                  const safePage = Math.min(currentPage, totalPages);
                  const from = filteredRules.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
                  const to = Math.min(safePage * pageSize, filteredRules.length);
                  return (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-border text-sm">
                      <span className="text-muted-foreground">
                        Showing {from}–{to} of {filteredRules.length}
                      </span>
                      <div className="flex items-center gap-3">
                        <select
                          value={pageSize}
                          onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                          className="h-8 px-2 pr-7 rounded-md border border-border bg-background text-sm text-foreground appearance-none cursor-pointer"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
                        >
                          <option value={10}>10 / page</option>
                          <option value={25}>25 / page</option>
                          <option value={50}>50 / page</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={safePage <= 1}
                            className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage >= totalPages}
                            className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                </>
              )}
            </div>
      </div>

      </>}

      {/* Type picker — shown when the user clicks New from the All folder */}
      <Modal
        isOpen={isTypePickerOpen}
        onClose={() => setIsTypePickerOpen(false)}
        title="New automation"
        size="xl"
      >
        <AutomationTypePicker onPick={(t) => {
          setIsTypePickerOpen(false);
          if (t === "broadcast") {
            setBuilderState({ kind: "sequence", mode: "new" });
          } else {
            setBuilderState({ kind: t, mode: "new" });
          }
        }} />
        <div className="border-t border-border pt-4 mt-2 text-center">
          <button
            onClick={() => { setIsTypePickerOpen(false); setViewMode("templates"); }}
            className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1.5"
          >
            <LayoutTemplate className="w-4 h-4" />
            Or start from a template
          </button>
        </div>
      </Modal>

      {/* Legacy Add Rule Modal — retained for edit-by-modal compatibility, not
          reachable from the primary "New" CTAs anymore */}
      <AddRuleModal isOpen={isAddRuleOpen} onClose={() => setIsAddRuleOpen(false)} onAdd={onAddAutomation} />

      {/* Edit Rule Modal */}
      <EditRuleModal
        rule={editingRule}
        onClose={() => setEditingRule(null)}
        onUpdate={(id, data) => { onUpdateAutomation(id, data); toast.success("Automation updated"); }}
      />

      {/* Delete confirmation */}
      <Modal
        isOpen={ruleToDelete !== null}
        onClose={() => setRuleToDelete(null)}
        title="Delete Automation"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Delete "{ruleToDelete?.name}"?</p>
              <p className="text-xs text-muted-foreground mt-1">
                This automation will be permanently removed. Any active enrollments will stop. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRuleToDelete(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmDelete}>
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Folder modal */}
      <Modal
        isOpen={isNewFolderOpen}
        onClose={() => { setIsNewFolderOpen(false); setNewFolderName(""); }}
        title="Create Folder"
        size="sm"
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label className="text-xs font-semibold">Folder Name</Label>
            <Input
              placeholder="e.g. Onboarding, Follow-ups"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              className="h-9 text-sm"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setIsNewFolderOpen(false); setNewFolderName(""); }}>Cancel</Button>
            <Button size="sm" disabled={!newFolderName.trim()} onClick={handleCreateFolder}>
              <FolderPlus className="w-3.5 h-3.5" />
              Create Folder
            </Button>
          </div>
        </div>
      </Modal>

      {/* Move to Folder modal */}
      <MoveToFolderModal
        rule={movingRule}
        customFolders={customFolders}
        onClose={() => setMovingRule(null)}
        onMove={handleMoveToFolder}
        onCreateAndMove={(folderName, ruleId) => {
          const id = `folder-${Date.now()}`;
          setCustomFolders(prev => [...prev, { id, name: folderName, automationIds: [ruleId] }]);
          setMovingRule(null);
          toast.success(`Created "${folderName}" and moved automation`);
        }}
      />

      {/* Webhooks are now managed inside the Journey Builder */}
    </div>
  );
};

// ============================================================
// Automation Templates Tab
// ============================================================

const AutomationTemplatesTab = ({ onUseTemplate }: { onUseTemplate: (tpl: AutomationTemplate) => void }) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TemplateType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");
  const [previewTemplate, setPreviewTemplate] = useState<AutomationTemplate | null>(null);

  const filtered = useMemo(() => {
    return AUTOMATION_TEMPLATES.filter(tpl => {
      const q = search.toLowerCase();
      const matchesSearch = !q || tpl.name.toLowerCase().includes(q) || tpl.description.toLowerCase().includes(q) || tpl.tags.some(t => t.includes(q));
      const matchesType = typeFilter === "all" || tpl.type === typeFilter;
      const matchesCategory = categoryFilter === "all" || tpl.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [search, typeFilter, categoryFilter]);

  const popular = filtered.filter(t => t.popular);
  const rest = filtered.filter(t => !t.popular);

  return (
    <div className="space-y-5">
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="h-10 px-3 pr-8 rounded-lg border border-border bg-background text-sm text-foreground appearance-none cursor-pointer hover:border-muted-foreground/40 transition-colors"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
        >
          <option value="all">All Types</option>
          <option value="basic">Auto-Reply</option>
          <option value="sequence">Drip</option>
          <option value="flow">Flow</option>
          <option value="broadcast">Broadcast</option>
        </select>
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
              categoryFilter === cat.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{filtered.length} template{filtered.length !== 1 ? "s" : ""} found</p>

      {/* Popular section */}
      {popular.length > 0 && typeFilter === "all" && categoryFilter === "all" && !search && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">Popular Templates</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {popular.map(tpl => (
              <TemplateCard key={tpl.id} template={tpl} onUse={onUseTemplate} onPreview={setPreviewTemplate} />
            ))}
          </div>
        </div>
      )}

      {/* All / filtered templates */}
      <div className="space-y-3">
        {(popular.length > 0 && typeFilter === "all" && categoryFilter === "all" && !search) && (
          <h3 className="text-sm font-semibold text-foreground">All Templates</h3>
        )}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <LayoutTemplate className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No templates match your filters</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Try a different search or category.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearch(""); setTypeFilter("all"); setCategoryFilter("all"); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(popular.length > 0 && typeFilter === "all" && categoryFilter === "all" && !search ? rest : filtered).map(tpl => (
              <TemplateCard key={tpl.id} template={tpl} onUse={onUseTemplate} onPreview={setPreviewTemplate} />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Modal isOpen={!!previewTemplate} onClose={() => setPreviewTemplate(null)} title="" size="lg">
        {previewTemplate && (() => {
          const typeCfg = TEMPLATE_TYPE_CONFIG[previewTemplate.type];
          const TypeIcon = typeCfg.icon;
          const TplIcon = previewTemplate.icon;
          return (
            <div className="space-y-5 -mt-2">
              <div className="flex items-start gap-4">
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0", previewTemplate.iconTint)}>
                  <TplIcon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground">{previewTemplate.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border", typeCfg.bg, typeCfg.color, typeCfg.border)}>
                      <TypeIcon className="w-3 h-3" />
                      {typeCfg.label}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{previewTemplate.category}</span>
                    {previewTemplate.popular && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                        <Star className="w-3 h-3" /> Popular
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{previewTemplate.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 border rounded-lg bg-muted/20">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Trigger</p>
                  <p className="text-sm text-foreground font-medium">{previewTemplate.trigger}</p>
                </div>
                <div className="p-4 border rounded-lg bg-muted/20">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Action</p>
                  <p className="text-sm text-foreground font-medium">{previewTemplate.action}</p>
                </div>
              </div>

              {previewTemplate.steps && (
                <div className="p-4 border rounded-lg bg-muted/20">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Steps</p>
                  <p className="text-sm text-foreground font-medium">{previewTemplate.steps} steps in this automation</p>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {previewTemplate.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-xs text-muted-foreground bg-muted rounded-full border border-border">#{tag}</span>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(null)}>Close</Button>
                <Button size="sm" onClick={() => { setPreviewTemplate(null); onUseTemplate(previewTemplate); }}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Use This Template
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

const TemplateCard = ({ template, onUse, onPreview }: {
  template: AutomationTemplate;
  onUse: (tpl: AutomationTemplate) => void;
  onPreview: (tpl: AutomationTemplate) => void;
}) => {
  const typeCfg = TEMPLATE_TYPE_CONFIG[template.type];
  const TypeIcon = typeCfg.icon;
  const TplIcon = template.icon;

  return (
    <div className="group border border-border rounded-xl bg-card hover:border-primary/30 hover:shadow-md transition-all p-5 flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", template.iconTint)}>
          <TplIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{template.name}</p>
            {template.popular && <Star className="w-3 h-3 text-amber-500 shrink-0" />}
          </div>
          <span className={cn("inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full border", typeCfg.bg, typeCfg.color, typeCfg.border)}>
            <TypeIcon className="w-2.5 h-2.5" />
            {typeCfg.label}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-3">{template.description}</p>
      <div className="flex items-center gap-2">
        {template.steps && (
          <span className="text-[10px] text-muted-foreground font-medium">{template.steps} steps</span>
        )}
        <div className="flex-1" />
        {/* Hover-only actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onPreview(template)}
            className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            Preview
          </button>
          <Button size="sm" className="h-7 text-xs" onClick={() => onUse(template)}>
            Use
          </Button>
        </div>
      </div>
    </div>
  );
};


// --- Move to Folder Modal ---
const MoveToFolderModal = ({
  rule, customFolders, onClose, onMove, onCreateAndMove,
}: {
  rule: AutomationRule | null;
  customFolders: { id: string; name: string; automationIds: string[] }[];
  onClose: () => void;
  onMove: (ruleId: string, folderId: string) => void;
  onCreateAndMove: (folderName: string, ruleId: string) => void;
}) => {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreateAndMove = () => {
    if (!newName.trim() || !rule) return;
    onCreateAndMove(newName.trim(), rule.id);
    setNewName("");
    setShowNewFolder(false);
  };

  // Reset when modal opens/closes
  React.useEffect(() => {
    if (!rule) { setShowNewFolder(false); setNewName(""); }
  }, [rule]);

  return (
    <Modal
      isOpen={rule !== null}
      onClose={onClose}
      title={`Move "${rule?.name}" to Folder`}
      size="sm"
    >
      <div className="space-y-3">
        {/* Existing folders */}
        {customFolders.map(folder => {
          const alreadyIn = rule ? folder.automationIds.includes(rule.id) : false;
          return (
            <button
              key={folder.id}
              disabled={alreadyIn}
              onClick={() => rule && onMove(rule.id, folder.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg border transition-colors text-left",
                alreadyIn
                  ? "bg-muted/50 text-muted-foreground border-border cursor-not-allowed"
                  : "hover:bg-primary/5 hover:border-primary/30 border-border"
              )}
            >
              <Folder className="w-4 h-4 shrink-0" />
              <span className="flex-1 font-medium">{folder.name}</span>
              {alreadyIn && (
                <Badge variant="secondary" className="text-[10px]">Current</Badge>
              )}
              <span className="text-xs text-muted-foreground">{folder.automationIds.length} item{folder.automationIds.length !== 1 ? "s" : ""}</span>
            </button>
          );
        })}

        {/* Create new folder inline */}
        {showNewFolder ? (
          <div className="flex items-center gap-2 px-1">
            <Input
              placeholder="Folder name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateAndMove()}
              className="h-9 text-sm flex-1"
              autoFocus
            />
            <Button size="sm" disabled={!newName.trim()} onClick={handleCreateAndMove}>
              Create & Move
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowNewFolder(false); setNewName(""); }}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewFolder(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left text-muted-foreground hover:text-foreground"
          >
            <FolderPlus className="w-4 h-4 shrink-0" />
            <span className="font-medium">Create New Folder</span>
          </button>
        )}
      </div>
    </Modal>
  );
};

// --- Edit Rule Modal ---
const EditRuleModal = ({
  rule, onClose, onUpdate
}: { rule: AutomationRule | null; onClose: () => void; onUpdate: (id: string, data: Partial<AutomationRule>) => void }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<AutomationTrigger | "">("");
  const [action, setAction] = useState<AutomationAction | "">("");

  // Rehydrate form whenever a new rule is passed in for editing.
  React.useEffect(() => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description);
      setTrigger(rule.trigger);
      setAction(rule.action);
    }
  }, [rule]);

  const handleUpdate = () => {
    if (!rule || !name.trim() || !trigger || !action) return;
    onUpdate(rule.id, {
      name: name.trim(),
      description: description.trim(),
      trigger: trigger as AutomationTrigger,
      action: action as AutomationAction,
    });
    onClose();
  };

  return (
    <Modal isOpen={rule !== null} onClose={onClose} title="Edit Automation" size="lg">
      <div className="space-y-5">
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="text-sm min-h-[60px]" />
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Trigger</Label>
          <div className="grid grid-cols-2 gap-2">
            {TRIGGER_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTrigger(t.id)}
                className={cn(
                  "flex items-center gap-2 p-3 border rounded-md text-left transition-all text-xs",
                  trigger === t.id ? "border-primary bg-primary/5" : "hover:bg-muted/30"
                )}
              >
                <t.icon className={cn("w-4 h-4 shrink-0", trigger === t.id ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <p className="font-semibold">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Action</Label>
          <div className="grid grid-cols-2 gap-2">
            {ACTION_OPTIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAction(a.id)}
                className={cn(
                  "flex items-center gap-2 p-3 border rounded-md text-left transition-all text-xs",
                  action === a.id ? "border-emerald-500 bg-emerald-50" : "hover:bg-muted/30"
                )}
              >
                <a.icon className={cn("w-4 h-4 shrink-0", action === a.id ? "text-emerald-600" : "text-muted-foreground")} />
                <div>
                  <p className="font-semibold">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!name.trim() || !trigger || !action} onClick={handleUpdate}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
};

// --- Add Rule Modal ---
const AddRuleModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (data: Partial<AutomationRule>) => void }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<AutomationTrigger | "">("");
  const [action, setAction] = useState<AutomationAction | "">("");

  const handleAdd = () => {
    if (!name.trim() || !trigger || !action) return;
    onAdd({
      tenantId: "tenant-1",
      name: name.trim(),
      description: description.trim(),
      trigger: trigger as AutomationTrigger,
      triggerConfig: {},
      action: action as AutomationAction,
      actionConfig: {},
      enabled: false,
      triggerCount: 0,
    });
    toast.success(`Rule "${name}" created`);
    setName(""); setDescription(""); setTrigger(""); setAction("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Automation Rule" size="lg">
      <div className="space-y-5">
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Rule Name</Label>
          <Input placeholder="e.g. Welcome Message" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Description</Label>
          <Textarea placeholder="What does this rule do?" value={description} onChange={(e) => setDescription(e.target.value)} className="text-sm min-h-[60px]" />
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-semibold">When this happens (Trigger)</Label>
          <div className="grid grid-cols-2 gap-2">
            {TRIGGER_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTrigger(t.id)}
                className={cn(
                  "flex items-center gap-2 p-3 border text-left transition-all text-xs",
                  trigger === t.id ? "border-primary bg-primary/5" : "hover:bg-muted/30"
                )}
              >
                <t.icon className={cn("w-4 h-4 shrink-0", trigger === t.id ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <p className="font-semibold">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Do this (Action)</Label>
          <div className="grid grid-cols-2 gap-2">
            {ACTION_OPTIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAction(a.id)}
                className={cn(
                  "flex items-center gap-2 p-3 border text-left transition-all text-xs",
                  action === a.id ? "border-emerald-500 bg-emerald-50" : "hover:bg-muted/30"
                )}
              >
                <a.icon className={cn("w-4 h-4 shrink-0", action === a.id ? "text-emerald-600" : "text-muted-foreground")} />
                <div>
                  <p className="font-semibold">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!name.trim() || !trigger || !action} onClick={handleAdd}>Create Rule</Button>
        </div>
      </div>
    </Modal>
  );
};

// AddWebhookModal removed — webhooks are now managed inside the Journey Builder (flow-builder.tsx).