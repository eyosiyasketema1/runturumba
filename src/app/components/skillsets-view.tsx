'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit2,
  Eye,
  Trash2,
  Upload,
  X,
  Lock,
  Copy,
  Wrench,
  Paperclip,
  FileText,
  Code2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Minus,
  Link2,
  ImageIcon,
  Undo2,
  Redo2,
} from 'lucide-react';
import { cn } from './types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

// --- Types ---
interface Tool {
  id: string;
  name: string;
  description: string;
}

interface Attachment {
  id: string;
  name: string;
  size: string;
}

interface SkillSet {
  id: string;
  name: string;
  type: 'global' | 'custom';
  description: string;
  instructions: string;
  tools: Tool[];
  attachments: Attachment[];
  enabled: boolean;
  accentColor: string;
}

// --- Accent colors for cards ---
const ACCENT_COLORS = [
  'border-l-indigo-500',
  'border-l-emerald-500',
  'border-l-amber-500',
  'border-l-rose-500',
  'border-l-cyan-500',
  'border-l-violet-500',
  'border-l-orange-500',
];

const ACCENT_DOTS: Record<string, string> = {
  'border-l-indigo-500': 'bg-indigo-500',
  'border-l-emerald-500': 'bg-emerald-500',
  'border-l-amber-500': 'bg-amber-500',
  'border-l-rose-500': 'bg-rose-500',
  'border-l-cyan-500': 'bg-cyan-500',
  'border-l-violet-500': 'bg-violet-500',
  'border-l-orange-500': 'bg-orange-500',
};

const ACCENT_BADGES: Record<string, string> = {
  'border-l-indigo-500': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'border-l-emerald-500': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'border-l-amber-500': 'bg-amber-50 text-amber-700 border-amber-200',
  'border-l-rose-500': 'bg-rose-50 text-rose-700 border-rose-200',
  'border-l-cyan-500': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'border-l-violet-500': 'bg-violet-50 text-violet-700 border-violet-200',
  'border-l-orange-500': 'bg-orange-50 text-orange-700 border-orange-200',
};

// --- Global Skill Sets ---
const GLOBAL_SKILLSETS: SkillSet[] = [
  {
    id: 'gs-1',
    name: 'Seeker Conversation Guide',
    type: 'global',
    accentColor: ACCENT_COLORS[0],
    description: 'Guides AI in faith-based conversations with seekers, answering questions about Christianity and directing toward next steps.',
    instructions: `## Purpose\nEngage seekers in meaningful faith-based dialogue.\n\n## Guidelines\n- Always be respectful and empathetic\n- Reference Scripture when appropriate\n- Never pressure or manipulate\n- Escalate to human mentor when seeker shows signs of crisis\n\n## Conversation Flow\n1. **Greeting** — Warm, personal welcome\n2. **Listen** — Understand their questions and concerns\n3. **Respond** — Share relevant biblical truth with grace\n4. **Next Steps** — Suggest resources, prayer, or mentor connection`,
    tools: [
      { id: 't1', name: 'scripture_lookup', description: 'Search and retrieve Bible verses by reference or topic' },
      { id: 't2', name: 'seeker_profile', description: "Access seeker's journey stage and conversation history" },
    ],
    attachments: [{ id: 'a1', name: 'conversation-guidelines.pdf', size: '245 KB' }],
    enabled: true,
  },
  {
    id: 'gs-2',
    name: 'Content Generation',
    type: 'global',
    accentColor: ACCENT_COLORS[1],
    description: 'Auto-generate devotionals, Bible studies, follow-up messages, and discipleship content tailored to each seeker\'s stage.',
    instructions: `## Purpose\nGenerate personalized discipleship content.\n\n## Content Types\n- **Devotionals** — Short daily reflections with Scripture\n- **Bible Studies** — Structured study guides on topics\n- **Follow-up Messages** — Personalized check-ins after sessions\n\n## Tone\nWarm, encouraging, doctrinally sound. Avoid jargon.`,
    tools: [
      { id: 't3', name: 'content_template', description: 'Load and fill content templates by type' },
      { id: 't4', name: 'scripture_lookup', description: 'Search Bible verses for content inclusion' },
      { id: 't5', name: 'seeker_stage', description: "Get seeker's current discipleship stage" },
    ],
    attachments: [
      { id: 'a2', name: 'content-style-guide.pdf', size: '180 KB' },
      { id: 'a3', name: 'devotional-templates.docx', size: '92 KB' },
    ],
    enabled: true,
  },
  {
    id: 'gs-3',
    name: 'Mentor Matching',
    type: 'global',
    accentColor: ACCENT_COLORS[2],
    description: 'Analyzes seeker profiles and mentor specialties to recommend optimal mentor-mentee pairings.',
    instructions: `## Purpose\nMatch seekers with the best-fit mentor.\n\n## Matching Criteria\n- Language compatibility\n- Area of specialty alignment\n- Availability and timezone\n- Experience level vs seeker needs\n\n## Rules\n- Never assign more than 5 active seekers per mentor\n- Prioritize language match over specialty\n- Flag unmatched seekers after 48 hours`,
    tools: [
      { id: 't6', name: 'mentor_profiles', description: 'Retrieve available mentors with their specialties and capacity' },
      { id: 't7', name: 'seeker_assessment', description: "Get seeker's needs assessment and preferences" },
    ],
    attachments: [],
    enabled: true,
  },
  {
    id: 'gs-4',
    name: 'Sentiment Analysis',
    type: 'global',
    accentColor: ACCENT_COLORS[3],
    description: 'Detect emotional tone in seeker messages to flag those who may need urgent pastoral care or encouragement.',
    instructions: `## Purpose\nMonitor seeker emotional state.\n\n## Alert Levels\n- **Green** — Positive or neutral sentiment\n- **Yellow** — Mild distress, discouragement\n- **Red** — Crisis indicators (self-harm, despair, urgent need)\n\n## Actions\n- Green: Continue normal flow\n- Yellow: Suggest encouraging content, notify mentor\n- Red: Immediately escalate to human mentor, pause AI`,
    tools: [
      { id: 't8', name: 'sentiment_classifier', description: 'Classify message sentiment and urgency level' },
      { id: 't9', name: 'escalation_trigger', description: 'Notify assigned mentor of urgent seeker need' },
    ],
    attachments: [{ id: 'a4', name: 'crisis-protocol.pdf', size: '310 KB' }],
    enabled: false,
  },
  {
    id: 'gs-5',
    name: 'Translation & Localization',
    type: 'global',
    accentColor: ACCENT_COLORS[4],
    description: "Auto-translate messages and content into the seeker's preferred language.",
    instructions: `## Purpose\nBreak language barriers.\n\n## Supported Languages\nAll languages supported by the translation API.\n\n## Rules\n- Detect seeker's language from first message\n- Translate AI responses to seeker's language\n- Keep original + translated version for mentor review\n- Flag uncertain translations for human review`,
    tools: [
      { id: 't10', name: 'translate_text', description: 'Translate text between languages' },
      { id: 't11', name: 'detect_language', description: 'Detect the language of input text' },
    ],
    attachments: [],
    enabled: true,
  },
];

const SAMPLE_CUSTOM_SKILLSETS: SkillSet[] = [
  {
    id: 'cs-1',
    name: 'Youth Mentorship Framework',
    type: 'custom',
    accentColor: ACCENT_COLORS[5],
    description: 'Custom skill set for mentoring young believers ages 13-19 with contemporary language and relevant examples.',
    instructions: `## Purpose\nConnect with young believers in their language and context.\n\n## Key Approaches\n- Use relatable examples and pop culture references where appropriate\n- Focus on identity in Christ\n- Address peer pressure and modern challenges\n\n## Topics\n- Dating and relationships\n- Social media and technology\n- Purpose and calling\n- Friend conflicts`,
    tools: [
      { id: 'tc1', name: 'youth_resources', description: 'Access age-appropriate discipleship resources' },
      { id: 'tc2', name: 'cultural_context', description: 'Get current cultural topics relevant to youth' },
    ],
    attachments: [{ id: 'ac1', name: 'youth-discussion-guide.pdf', size: '156 KB' }],
    enabled: true,
  },
  {
    id: 'cs-2',
    name: 'Recovery & Restoration',
    type: 'custom',
    accentColor: ACCENT_COLORS[6],
    description: 'Specialized skill set for mentoring individuals in recovery from addiction, trauma, or spiritual struggle.',
    instructions: `## Purpose\nSupport recovery journey with compassion and hope.\n\n## Core Values\n- Unconditional acceptance\n- Accountability with grace\n- Scripture as foundation\n- Community as strength\n\n## Approach\n- Celebrate small wins\n- Normalize setbacks\n- Connect to support groups\n- Emphasize God's redemptive power`,
    tools: [
      { id: 'tc3', name: 'recovery_resources', description: 'Access recovery-focused materials and support groups' },
      { id: 'tc4', name: 'relapse_prevention', description: 'Get strategies for handling triggers and temptation' },
    ],
    attachments: [],
    enabled: true,
  },
];

// --- Simple Markdown Renderer ---
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch) {
      const idx = remaining.indexOf(boldMatch[0]);
      if (idx > 0) parts.push(remaining.substring(0, idx));
      parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
      remaining = remaining.substring(idx + boldMatch[0].length);
      continue;
    }
    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch) {
      const idx = remaining.indexOf(italicMatch[0]);
      if (idx > 0) parts.push(remaining.substring(0, idx));
      parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>);
      remaining = remaining.substring(idx + italicMatch[0].length);
      continue;
    }
    const codeMatch = remaining.match(/`(.+?)`/);
    if (codeMatch) {
      const idx = remaining.indexOf(codeMatch[0]);
      if (idx > 0) parts.push(remaining.substring(0, idx));
      parts.push(<code key={key++} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{codeMatch[1]}</code>);
      remaining = remaining.substring(idx + codeMatch[0].length);
      continue;
    }
    parts.push(remaining);
    break;
  }
  return parts.length === 1 && typeof parts[0] === 'string' ? text : parts;
}

function renderMarkdown(markdown: string): React.ReactNode {
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-base font-semibold text-foreground mt-5 mb-2">{line.replace('## ', '')}</h2>);
      i++; continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-lg font-bold text-foreground mt-5 mb-3">{line.replace('# ', '')}</h1>);
      i++; continue;
    }
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        listItems.push(lines[i].trim().replace(/^[-*]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={`list-${i}`} className="list-disc list-inside space-y-1 my-2 ml-1">
          {listItems.map((item, idx) => <li key={idx} className="text-sm text-foreground/80 leading-relaxed">{renderInlineMarkdown(item)}</li>)}
        </ul>
      );
      continue;
    }
    if (line.trim().match(/^\d+\.\s/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`olist-${i}`} className="list-decimal list-inside space-y-1 my-2 ml-1">
          {listItems.map((item, idx) => <li key={idx} className="text-sm text-foreground/80 leading-relaxed">{renderInlineMarkdown(item)}</li>)}
        </ol>
      );
      continue;
    }
    if (line.trim() === '') { i++; continue; }
    elements.push(<p key={i} className="text-sm text-foreground/80 my-1.5 leading-relaxed">{renderInlineMarkdown(line)}</p>);
    i++;
  }

  return <>{elements}</>;
}

// --- Markdown Toolbar ---
function MarkdownToolbar({ textareaRef, value, onChange }: { textareaRef: React.RefObject<HTMLTextAreaElement | null>; value: string; onChange: (v: string) => void }) {
  const insert = (before: string, after: string = '', placeholder: string = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);
    const text = selected || placeholder;
    const newValue = value.substring(0, start) + before + text + after + value.substring(end);
    onChange(newValue);
    setTimeout(() => {
      el.focus();
      const newPos = start + before.length + text.length + after.length;
      el.setSelectionRange(start + before.length, start + before.length + text.length);
    }, 0);
  };

  const tools = [
    { icon: Bold, label: 'Bold', action: () => insert('**', '**', 'bold text') },
    { icon: Italic, label: 'Italic', action: () => insert('*', '*', 'italic text') },
    { icon: Code2, label: 'Code', action: () => insert('`', '`', 'code') },
    'sep',
    { icon: Heading2, label: 'Heading', action: () => insert('## ', '', 'Heading') },
    { icon: List, label: 'Bullet list', action: () => insert('- ', '', 'List item') },
    { icon: ListOrdered, label: 'Numbered list', action: () => insert('1. ', '', 'List item') },
    { icon: Quote, label: 'Quote', action: () => insert('> ', '', 'Quote') },
    'sep',
    { icon: Minus, label: 'Divider', action: () => insert('\n---\n', '') },
    { icon: Link2, label: 'Link', action: () => insert('[', '](url)', 'link text') },
  ];

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/20 rounded-t-lg overflow-x-auto">
      {tools.map((tool, idx) => {
        if (tool === 'sep') return <div key={idx} className="w-px h-5 bg-border mx-1" />;
        const t = tool as { icon: any; label: string; action: () => void };
        return (
          <button
            key={idx}
            type="button"
            title={t.label}
            onClick={t.action}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <t.icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

// ============================
// LIST VIEW
// ============================
function SkillSetsList({
  skillSets,
  onEdit,
  onView,
  onToggle,
  onCreate,
}: {
  skillSets: SkillSet[];
  onEdit: (skillSet: SkillSet) => void;
  onView: (skillSet: SkillSet) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onCreate: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'global' | 'custom'>('all');

  const filtered = skillSets.filter((ss) => {
    const matchesSearch = ss.name.toLowerCase().includes(search.toLowerCase()) ||
      ss.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || ss.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Skill Sets</h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Create and manage AI skill sets — each one is a set of instructions and tools that guide how AI behaves in your ministry context.
          </p>
        </div>
        <Button onClick={onCreate} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Create Skill Set
        </Button>
      </div>

      {/* Search + Filter Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search skill sets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({skillSets.length})</TabsTrigger>
            <TabsTrigger value="global">Global ({skillSets.filter(s => s.type === 'global').length})</TabsTrigger>
            <TabsTrigger value="custom">Custom ({skillSets.filter(s => s.type === 'custom').length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Cards Grid — 3 columns */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-16 text-center">
          <Search className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No skill sets found</p>
          <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((skillSet, idx) => (
            <motion.div
              key={skillSet.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
            >
              <Card className={cn(
                "flex flex-col h-full border-l-4 transition-all hover:shadow-md",
                skillSet.accentColor,
                !skillSet.enabled && skillSet.type === 'custom' && "opacity-60"
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {skillSet.type === 'global' && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                        <CardTitle className="text-sm font-semibold leading-tight truncate">{skillSet.name}</CardTitle>
                      </div>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                        ACCENT_BADGES[skillSet.accentColor] || "bg-muted text-muted-foreground border-border"
                      )}>
                        {skillSet.type === 'global' ? 'System' : 'Custom'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-2">
                    {skillSet.description}
                  </p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col justify-end pt-0">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                      <Wrench className="h-3 w-3" />
                      <span><span className="font-semibold text-foreground">{skillSet.tools.length}</span> tools</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Paperclip className="h-3 w-3" />
                      <span><span className="font-semibold text-foreground">{skillSet.attachments.length}</span> files</span>
                    </div>
                  </div>

                  <Separator className="mb-4" />

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    {skillSet.type === 'custom' ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={skillSet.enabled}
                          onCheckedChange={(checked) => onToggle(skillSet.id, checked)}
                        />
                        <span className="text-[11px] text-muted-foreground">{skillSet.enabled ? 'Active' : 'Disabled'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-2 h-2 rounded-full", ACCENT_DOTS[skillSet.accentColor] || "bg-muted-foreground")} />
                        <span className="text-[11px] text-muted-foreground">System</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => skillSet.type === 'global' ? onView(skillSet) : onEdit(skillSet)}
                    >
                      {skillSet.type === 'global' ? (
                        <><Eye className="h-3 w-3" /> View</>
                      ) : (
                        <><Edit2 className="h-3 w-3" /> Edit</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================
// READ-ONLY VIEW
// ============================
function SkillSetView({
  skillSet,
  onBack,
  onClone,
}: {
  skillSet: SkillSet;
  onBack: () => void;
  onClone: (ss: SkillSet) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Back + Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{skillSet.name}</h1>
            <Badge variant="secondary" className="text-[10px]">System</Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onClone(skillSet)}>
          <Copy className="h-3.5 w-3.5" /> Clone & Customize
        </Button>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl -mt-2">{skillSet.description}</p>

      {/* Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/30 border border-border p-5">
            {renderMarkdown(skillSet.instructions)}
          </div>
        </CardContent>
      </Card>

      {/* Tools */}
      {skillSet.tools.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Tools ({skillSet.tools.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {skillSet.tools.map((tool) => (
                <div key={tool.id} className="flex items-start gap-3 rounded-lg bg-muted/30 border border-border p-3.5">
                  <div className="w-8 h-8 rounded-md bg-indigo-100 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-mono font-medium text-foreground">{tool.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tool.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {skillSet.attachments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Attachments ({skillSet.attachments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {skillSet.attachments.map((file) => (
                <div key={file.id} className="flex items-center gap-3 rounded-lg bg-muted/30 border border-border p-3">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================
// EDITOR
// ============================
function SkillSetEditor({
  skillSet,
  onBack,
  onSave,
}: {
  skillSet: SkillSet | null;
  onBack: () => void;
  onSave: (skillSet: SkillSet) => void;
}) {
  const isNew = !skillSet;
  const [name, setName] = useState(skillSet?.name || '');
  const [description, setDescription] = useState(skillSet?.description || '');
  const [instructions, setInstructions] = useState(skillSet?.instructions || '');
  const [tools, setTools] = useState<Tool[]>(skillSet?.tools || []);
  const [attachments, setAttachments] = useState<Attachment[]>(skillSet?.attachments || []);
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAddTool = () => {
    setTools([...tools, { id: `t-${Date.now()}`, name: '', description: '' }]);
  };

  const handleRemoveTool = (id: string) => {
    setTools(tools.filter((t) => t.id !== id));
  };

  const handleUpdateTool = (id: string, field: keyof Tool, value: string) => {
    setTools(tools.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSimulateUpload = () => {
    const newFile: Attachment = {
      id: `a-${Date.now()}`,
      name: `resource-${attachments.length + 1}.pdf`,
      size: `${Math.floor(Math.random() * 400) + 50} KB`,
    };
    setAttachments([...attachments, newFile]);
    toast.success('File uploaded');
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!description.trim()) { toast.error('Description is required'); return; }
    if (!instructions.trim()) { toast.error('Instructions are required'); return; }

    const saved: SkillSet = {
      id: skillSet?.id || `cs-${Date.now()}`,
      name,
      description,
      instructions,
      tools,
      attachments,
      type: 'custom',
      enabled: skillSet?.enabled ?? true,
      accentColor: skillSet?.accentColor || ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
    };
    onSave(saved);
    toast.success(isNew ? 'Skill set created' : 'Skill set updated');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-lg font-semibold">{isNew ? 'Create Skill Set' : `Edit: ${skillSet.name}`}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>{isNew ? 'Create' : 'Save Changes'}</Button>
        </div>
      </div>

      {/* Two-column layout: Left = main content, Right = sidebar */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left Column — Main */}
        <div className="space-y-8">
          {/* Name & Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</label>
                <Input
                  placeholder="e.g., Youth Mentorship Framework"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-base font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                <Textarea
                  placeholder="Brief description of what this skill set does..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Instructions Markdown Editor */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Instructions</CardTitle>
                <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as 'edit' | 'preview')}>
                  <TabsList className="h-7">
                    <TabsTrigger value="edit" className="text-xs h-6 px-3">Edit</TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs h-6 px-3">Preview</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <CardDescription className="text-xs">Write instructions in Markdown to guide AI behavior</CardDescription>
            </CardHeader>
            <CardContent>
              {previewTab === 'edit' ? (
                <div className="rounded-lg border border-border overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                  <MarkdownToolbar textareaRef={textareaRef} value={instructions} onChange={setInstructions} />
                  <textarea
                    ref={textareaRef}
                    placeholder={"# Getting Started\n\nWrite your instructions here using Markdown...\n\n## Guidelines\n- Be specific about AI behavior\n- Include examples when helpful\n- Reference Scripture where appropriate"}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full min-h-[400px] p-4 font-mono text-sm bg-background text-foreground resize-y outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/20 p-5 min-h-[400px]">
                  {instructions ? renderMarkdown(instructions) : (
                    <p className="text-sm text-muted-foreground italic">No content yet — switch to Edit tab to write instructions</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tools Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Tools</CardTitle>
                  <CardDescription className="text-xs">Define tools the AI can use with this skill set</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddTool} className="gap-1.5 h-7 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Tool
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tools.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 text-center">
                  <Wrench className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No tools yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Add tools that the AI can call when using this skill set</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tools.map((tool, idx) => (
                    <div key={tool.id} className="flex items-start gap-3 rounded-lg border border-border bg-muted/10 p-3.5">
                      <div className="w-7 h-7 rounded bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Wrench className="h-3.5 w-3.5 text-indigo-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="tool_name"
                          value={tool.name}
                          onChange={(e) => handleUpdateTool(tool.id, 'name', e.target.value)}
                          className="font-mono text-sm h-8"
                        />
                        <Input
                          placeholder="What does this tool do?"
                          value={tool.description}
                          onChange={(e) => handleUpdateTool(tool.id, 'description', e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => handleRemoveTool(tool.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* File Attachments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Attachments</CardTitle>
              <CardDescription className="text-xs">Upload reference files for this skill set</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                onClick={handleSimulateUpload}
                className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all"
              >
                <Upload className="h-6 w-6 mx-auto text-muted-foreground/60 mb-1.5" />
                <p className="text-xs font-medium text-foreground">Upload file</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">PDF, DOCX, TXT · 10MB max</p>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 border border-border p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{file.name}</p>
                          <p className="text-[10px] text-muted-foreground">{file.size}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => handleRemoveAttachment(file.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-muted/20">
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-foreground mb-2">Writing Tips</p>
              <div className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                <p>• Start with a clear <span className="font-medium text-foreground">## Purpose</span> section</p>
                <p>• Use headings to organize guidelines, rules, and flows</p>
                <p>• Be specific about what the AI should and shouldn't do</p>
                <p>• Include examples of good responses when possible</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================
// MAIN VIEW
// ============================
export function SkillSetsView() {
  const [skillSets, setSkillSets] = useState<SkillSet[]>([
    ...GLOBAL_SKILLSETS,
    ...SAMPLE_CUSTOM_SKILLSETS,
  ]);
  const [view, setView] = useState<'list' | 'editor' | 'viewer'>('list');
  const [selectedSkillSet, setSelectedSkillSet] = useState<SkillSet | null>(null);

  const handleEdit = (skillSet: SkillSet) => {
    setSelectedSkillSet(skillSet);
    setView('editor');
  };

  const handleCreate = () => {
    setSelectedSkillSet(null);
    setView('editor');
  };

  const handleView = (skillSet: SkillSet) => {
    setSelectedSkillSet(skillSet);
    setView('viewer');
  };

  const handleBack = () => {
    setView('list');
    setSelectedSkillSet(null);
  };

  const handleSave = (skillSet: SkillSet) => {
    const index = skillSets.findIndex((ss) => ss.id === skillSet.id);
    if (index >= 0) {
      const updated = [...skillSets];
      updated[index] = skillSet;
      setSkillSets(updated);
    } else {
      setSkillSets([...skillSets, skillSet]);
    }
    handleBack();
  };

  const handleClone = (ss: SkillSet) => {
    const cloned: SkillSet = {
      ...ss,
      id: `cs-${Date.now()}`,
      name: `${ss.name} (Copy)`,
      type: 'custom',
      accentColor: ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
    };
    setSelectedSkillSet(cloned);
    setView('editor');
    toast.success('Cloned — you can now customize it');
  };

  const handleToggle = (id: string, enabled: boolean) => {
    setSkillSets(skillSets.map((ss) => (ss.id === id ? { ...ss, enabled } : ss)));
    toast.success(enabled ? 'Skill set enabled' : 'Skill set disabled');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 lg:p-10"
    >
      {view === 'list' && (
        <SkillSetsList
          skillSets={skillSets}
          onEdit={handleEdit}
          onView={handleView}
          onToggle={handleToggle}
          onCreate={handleCreate}
        />
      )}
      {view === 'editor' && (
        <SkillSetEditor
          skillSet={selectedSkillSet}
          onBack={handleBack}
          onSave={handleSave}
        />
      )}
      {view === 'viewer' && selectedSkillSet && (
        <SkillSetView
          skillSet={selectedSkillSet}
          onBack={handleBack}
          onClone={handleClone}
        />
      )}
    </motion.div>
  );
}
