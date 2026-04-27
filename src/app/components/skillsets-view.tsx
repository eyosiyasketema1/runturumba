'use client';

import React, { useState } from 'react';
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
  ChevronDown,
  Copy,
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

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="space-y-1">
    <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
  </div>
);

// Types
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
  assignedMentors: string[];
  enabled: boolean;
}

// Global skill sets data
const GLOBAL_SKILLSETS: SkillSet[] = [
  {
    id: 'gs-1',
    name: 'Seeker Conversation Guide',
    type: 'global',
    description: 'Guides AI in faith-based conversations with seekers, answering questions about Christianity and directing toward next steps.',
    instructions: `## Purpose
Engage seekers in meaningful faith-based dialogue.

## Guidelines
- Always be respectful and empathetic
- Reference Scripture when appropriate
- Never pressure or manipulate
- Escalate to human mentor when seeker shows signs of crisis

## Conversation Flow
1. **Greeting** — Warm, personal welcome
2. **Listen** — Understand their questions and concerns
3. **Respond** — Share relevant biblical truth with grace
4. **Next Steps** — Suggest resources, prayer, or mentor connection`,
    tools: [
      { id: 't1', name: 'scripture_lookup', description: 'Search and retrieve Bible verses by reference or topic' },
      { id: 't2', name: 'seeker_profile', description: "Access seeker's journey stage and conversation history" },
    ],
    attachments: [{ id: 'a1', name: 'conversation-guidelines.pdf', size: '245 KB' }],
    assignedMentors: [],
    enabled: true,
  },
  {
    id: 'gs-2',
    name: 'Content Generation',
    type: 'global',
    description: 'Auto-generate devotionals, Bible studies, follow-up messages, and discipleship content tailored to each seeker\'s stage.',
    instructions: `## Purpose
Generate personalized discipleship content.

## Content Types
- **Devotionals** — Short daily reflections with Scripture
- **Bible Studies** — Structured study guides on topics
- **Follow-up Messages** — Personalized check-ins after sessions

## Tone
Warm, encouraging, doctrinally sound. Avoid jargon.`,
    tools: [
      { id: 't3', name: 'content_template', description: 'Load and fill content templates by type' },
      { id: 't4', name: 'scripture_lookup', description: 'Search Bible verses for content inclusion' },
      { id: 't5', name: 'seeker_stage', description: "Get seeker's current discipleship stage" },
    ],
    attachments: [
      { id: 'a2', name: 'content-style-guide.pdf', size: '180 KB' },
      { id: 'a3', name: 'devotional-templates.docx', size: '92 KB' },
    ],
    assignedMentors: [],
    enabled: true,
  },
  {
    id: 'gs-3',
    name: 'Mentor Matching',
    type: 'global',
    description: 'Analyzes seeker profiles and mentor specialties to recommend optimal mentor-mentee pairings.',
    instructions: `## Purpose
Match seekers with the best-fit mentor.

## Matching Criteria
- Language compatibility
- Area of specialty alignment
- Availability and timezone
- Experience level vs seeker needs

## Rules
- Never assign more than 5 active seekers per mentor
- Prioritize language match over specialty
- Flag unmatched seekers after 48 hours`,
    tools: [
      { id: 't6', name: 'mentor_profiles', description: 'Retrieve available mentors with their specialties and capacity' },
      { id: 't7', name: 'seeker_assessment', description: "Get seeker's needs assessment and preferences" },
    ],
    attachments: [],
    assignedMentors: [],
    enabled: true,
  },
  {
    id: 'gs-4',
    name: 'Sentiment Analysis',
    type: 'global',
    description: 'Detect emotional tone in seeker messages to flag those who may need urgent pastoral care or encouragement.',
    instructions: `## Purpose
Monitor seeker emotional state.

## Alert Levels
- **Green** — Positive or neutral sentiment
- **Yellow** — Mild distress, discouragement
- **Red** — Crisis indicators (self-harm, despair, urgent need)

## Actions
- Green: Continue normal flow
- Yellow: Suggest encouraging content, notify mentor
- Red: Immediately escalate to human mentor, pause AI`,
    tools: [
      { id: 't8', name: 'sentiment_classifier', description: 'Classify message sentiment and urgency level' },
      { id: 't9', name: 'escalation_trigger', description: 'Notify assigned mentor of urgent seeker need' },
    ],
    attachments: [{ id: 'a4', name: 'crisis-protocol.pdf', size: '310 KB' }],
    assignedMentors: [],
    enabled: false,
  },
  {
    id: 'gs-5',
    name: 'Translation & Localization',
    type: 'global',
    description: "Auto-translate messages and content into the seeker's preferred language.",
    instructions: `## Purpose
Break language barriers.

## Supported Languages
All languages supported by the translation API.

## Rules
- Detect seeker's language from first message
- Translate AI responses to seeker's language
- Keep original + translated version for mentor review
- Flag uncertain translations for human review`,
    tools: [
      { id: 't10', name: 'translate_text', description: 'Translate text between languages' },
      { id: 't11', name: 'detect_language', description: 'Detect the language of input text' },
    ],
    attachments: [],
    assignedMentors: [],
    enabled: true,
  },
];

const SAMPLE_CUSTOM_SKILLSETS: SkillSet[] = [
  {
    id: 'cs-1',
    name: 'Youth Mentorship Framework',
    type: 'custom',
    description: 'Custom skill set for mentoring young believers ages 13-19 with contemporary language and relevant examples.',
    instructions: `## Purpose
Connect with young believers in their language and context.

## Key Approaches
- Use relatable examples and pop culture references where appropriate
- Focus on identity in Christ
- Address peer pressure and modern challenges

## Topics
- Dating and relationships
- Social media and technology
- Purpose and calling
- Friend conflicts`,
    tools: [
      { id: 'tc1', name: 'youth_resources', description: 'Access age-appropriate discipleship resources' },
      { id: 'tc2', name: 'cultural_context', description: 'Get current cultural topics relevant to youth' },
    ],
    attachments: [{ id: 'ac1', name: 'youth-discussion-guide.pdf', size: '156 KB' }],
    assignedMentors: ['Sarah Johnson', 'David Kim'],
    enabled: true,
  },
  {
    id: 'cs-2',
    name: 'Recovery & Restoration',
    type: 'custom',
    description: 'Specialized skill set for mentoring individuals in recovery from addiction, trauma, or spiritual struggle.',
    instructions: `## Purpose
Support recovery journey with compassion and hope.

## Core Values
- Unconditional acceptance
- Accountability with grace
- Scripture as foundation
- Community as strength

## Approach
- Celebrate small wins
- Normalize setbacks
- Connect to support groups
- Emphasize God's redemptive power`,
    tools: [
      { id: 'tc3', name: 'recovery_resources', description: 'Access recovery-focused materials and support groups' },
      { id: 'tc4', name: 'relapse_prevention', description: 'Get strategies for handling triggers and temptation' },
    ],
    attachments: [],
    assignedMentors: ['Maria Garcia'],
    enabled: true,
  },
];

const MENTOR_NAMES = [
  'Sarah Johnson',
  'David Kim',
  'Maria Garcia',
  'James Okonkwo',
  'Priya Patel',
  'Emmanuel Adeyemi',
];

// Simple markdown renderer
function renderMarkdown(markdown: string): React.ReactNode {
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headings
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-lg font-semibold mt-4 mb-2">
          {line.replace('## ', '')}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-xl font-bold mt-4 mb-3">
          {line.replace('# ', '')}
        </h1>
      );
      i++;
      continue;
    }

    // Code blocks (simple backtick detection)
    if (line.trim().startsWith('`')) {
      elements.push(
        <code key={i} className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground/80">
          {line.replace(/`/g, '')}
        </code>
      );
      i++;
      continue;
    }

    // Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        listItems.push(lines[i].trim().replace(/^[-*]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={`list-${i}`} className="list-disc list-inside space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm text-foreground/80">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered lists
    if (line.trim().match(/^\d+\.\s/)) {
      const listItems: string[] = [];
      let counter = 1;
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`olist-${i}`} className="list-decimal list-inside space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm text-foreground/80">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm text-foreground/80 my-2">
        {renderInlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-2">{elements}</div>;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  // Handle **bold**, *italic*, and `code`
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch) {
      const idx = remaining.indexOf(boldMatch[0]);
      if (idx > 0) parts.push(remaining.substring(0, idx));
      parts.push(
        <strong key={key++} className="font-semibold">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.substring(idx + boldMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch) {
      const idx = remaining.indexOf(italicMatch[0]);
      if (idx > 0) parts.push(remaining.substring(0, idx));
      parts.push(
        <em key={key++} className="italic">
          {italicMatch[1]}
        </em>
      );
      remaining = remaining.substring(idx + italicMatch[0].length);
      continue;
    }

    // Code
    const codeMatch = remaining.match(/`(.+?)`/);
    if (codeMatch) {
      const idx = remaining.indexOf(codeMatch[0]);
      if (idx > 0) parts.push(remaining.substring(0, idx));
      parts.push(
        <code key={key++} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.substring(idx + codeMatch[0].length);
      continue;
    }

    // No more matches
    parts.push(remaining);
    break;
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? text : parts;
}

// List View Component
function SkillSetsList({
  skillSets,
  onEdit,
  onView,
  onToggle,
}: {
  skillSets: SkillSet[];
  onEdit: (skillSet: SkillSet) => void;
  onView: (skillSet: SkillSet) => void;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'global' | 'custom'>('all');

  const filtered = skillSets.filter((ss) => {
    const matchesSearch = ss.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' || ss.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-2">
        <SectionHeader
          title="Skill Sets"
          description="Create and manage AI skill sets that guide behavior in your ministry context"
        />
      </div>

      {/* Search and Create */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search skill sets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => onEdit({} as SkillSet)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Skill Set
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
          <p className="text-sm text-muted-foreground">No skill sets found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((skillSet) => (
            <motion.div
              key={skillSet.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="flex flex-col h-full hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {skillSet.type === 'global' && (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <CardTitle className="text-base">{skillSet.name}</CardTitle>
                      </div>
                      <Badge variant={skillSet.type === 'global' ? 'secondary' : 'outline'}>
                        {skillSet.type === 'global' ? 'System' : 'Custom'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {skillSet.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Stats */}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">{skillSet.tools.length}</span> tools
                    </div>
                    <div>
                      <span className="font-medium">{skillSet.attachments.length}</span> files
                    </div>
                  </div>

                  <Separator />

                  {/* Toggle and Action */}
                  <div className="flex items-center justify-between pt-2">
                    {skillSet.type === 'custom' ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={skillSet.enabled}
                          onCheckedChange={(checked) =>
                            onToggle(skillSet.id, checked)
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {skillSet.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground text-italic">
                        System skill set
                      </span>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        skillSet.type === 'global' ? onView(skillSet) : onEdit(skillSet)
                      }
                      className="gap-1"
                    >
                      {skillSet.type === 'global' ? (
                        <>
                          <Eye className="h-4 w-4" />
                          View
                        </>
                      ) : (
                        <>
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// View (Read-only) Component
function SkillSetView({
  skillSet,
  onBack,
}: {
  skillSet: SkillSet;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header with Back */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{skillSet.name}</CardTitle>
              </div>
              <Badge variant="secondary">System</Badge>
            </div>
          </div>
          <CardDescription className="text-base mt-4">
            {skillSet.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="font-semibold">Instructions</h3>
            <div className="rounded-lg bg-muted/30 p-4 text-sm">
              {renderMarkdown(skillSet.instructions)}
            </div>
          </div>

          <Separator />

          {/* Tools */}
          {skillSet.tools.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Tools ({skillSet.tools.length})</h3>
              <div className="space-y-3">
                {skillSet.tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="rounded-lg bg-muted/30 p-3 space-y-1"
                  >
                    <div className="font-medium text-sm">{tool.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tool.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skillSet.attachments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Attachments ({skillSet.attachments.length})</h3>
                <div className="space-y-2">
                  {skillSet.attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
                    >
                      <div>
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{file.size}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Editor Component
function SkillSetEditor({
  skillSet,
  onBack,
  onSave,
}: {
  skillSet: SkillSet | {};
  onBack: () => void;
  onSave: (skillSet: SkillSet) => void;
}) {
  const isNew = !('id' in skillSet);
  const [name, setName] = useState(isNew ? '' : skillSet.name);
  const [description, setDescription] = useState(isNew ? '' : skillSet.description);
  const [instructions, setInstructions] = useState(isNew ? '' : skillSet.instructions);
  const [tools, setTools] = useState<Tool[]>(isNew ? [] : skillSet.tools);
  const [attachments, setAttachments] = useState<Attachment[]>(
    isNew ? [] : skillSet.attachments
  );
  const [assignedMentors, setAssignedMentors] = useState<string[]>(
    isNew ? [] : skillSet.assignedMentors
  );
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [showMentorDropdown, setShowMentorDropdown] = useState(false);

  const handleAddTool = () => {
    setTools([...tools, { id: `t-${Date.now()}`, name: '', description: '' }]);
  };

  const handleRemoveTool = (id: string) => {
    setTools(tools.filter((t) => t.id !== id));
  };

  const handleUpdateTool = (id: string, field: keyof Tool, value: string) => {
    setTools(
      tools.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleAddMentor = (mentor: string) => {
    if (!assignedMentors.includes(mentor)) {
      setAssignedMentors([...assignedMentors, mentor]);
    }
    setShowMentorDropdown(false);
  };

  const handleRemoveMentor = (mentor: string) => {
    setAssignedMentors(assignedMentors.filter((m) => m !== mentor));
  };

  const handleSimulateUpload = () => {
    const newFile: Attachment = {
      id: `a-${Date.now()}`,
      name: `resource-${attachments.length + 1}.pdf`,
      size: `${Math.floor(Math.random() * 400) + 50} KB`,
    };
    setAttachments([...attachments, newFile]);
    toast.success('File uploaded successfully');
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Skill set name is required');
      return;
    }
    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!instructions.trim()) {
      toast.error('Instructions are required');
      return;
    }

    const newSkillSet: SkillSet = {
      id: isNew ? `cs-${Date.now()}` : skillSet.id,
      name,
      description,
      instructions,
      tools,
      attachments,
      assignedMentors,
      type: 'custom',
      enabled: true,
    };

    onSave(newSkillSet);
    toast.success(isNew ? 'Skill set created' : 'Skill set updated');
  };

  const availableMentors = MENTOR_NAMES.filter((m) => !assignedMentors.includes(m));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Name */}
        <FormField label="Skill Set Name" required>
          <Input
            placeholder="e.g., Youth Mentorship Framework"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>

        {/* Description */}
        <FormField label="Description" required>
          <Textarea
            placeholder="Brief description of what this skill set does..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </FormField>

        {/* Instructions Editor */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Instructions (Markdown)</label>
          <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as 'edit' | 'preview')}>
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="edit">
              <Textarea
                placeholder="# Heading

Use markdown formatting:
- Lists
- **Bold**
- *Italic*
- `code`"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="font-mono text-xs min-h-96 p-3"
              />
            </TabsContent>

            <TabsContent value="preview">
              <div className="rounded-lg bg-muted/30 p-4 min-h-96 text-sm">
                {instructions ? renderMarkdown(instructions) : <p className="text-muted-foreground">No content yet</p>}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Separator />

        {/* Tools Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Tools</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddTool}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Tool
            </Button>
          </div>

          <div className="space-y-3">
            {tools.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tools added yet</p>
            ) : (
              tools.map((tool) => (
                <div key={tool.id} className="space-y-2 rounded-lg bg-muted/30 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <FormField label="Tool Name" size="sm">
                      <Input
                        placeholder="e.g., scripture_lookup"
                        value={tool.name}
                        onChange={(e) =>
                          handleUpdateTool(tool.id, 'name', e.target.value)
                        }
                        size="sm"
                      />
                    </FormField>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <FormField label="Description" size="sm">
                          <Input
                            placeholder="What does this tool do?"
                            value={tool.description}
                            onChange={(e) =>
                              handleUpdateTool(tool.id, 'description', e.target.value)
                            }
                            size="sm"
                          />
                        </FormField>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTool(tool.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Separator />

        {/* File Attachments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">File Attachments</h3>
          </div>

          {/* Upload Area */}
          <div
            onClick={handleSimulateUpload}
            className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <div className="text-sm font-medium">Click to upload or drag and drop</div>
            <div className="text-xs text-muted-foreground">PDF, DOCX, TXT up to 10MB</div>
          </div>

          {/* Attachments List */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
                >
                  <div>
                    <div className="text-sm font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{file.size}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAttachment(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Assignment Section */}
        <div className="space-y-4">
          <h3 className="font-semibold">Assigned Mentors</h3>

          {/* Mentor Chips */}
          {assignedMentors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {assignedMentors.map((mentor) => (
                <Badge key={mentor} variant="secondary" className="gap-1 px-2">
                  {mentor}
                  <button
                    onClick={() => handleRemoveMentor(mentor)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Assign Button with Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMentorDropdown(!showMentorDropdown)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Assign Mentor
              <ChevronDown className="h-4 w-4" />
            </Button>

            {showMentorDropdown && availableMentors.length > 0 && (
              <div className="absolute top-full left-0 mt-1 rounded-lg border border-border bg-background shadow-lg z-50">
                {availableMentors.map((mentor) => (
                  <button
                    key={mentor}
                    onClick={() => handleAddMentor(mentor)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted first:rounded-t-md last:rounded-b-md"
                  >
                    {mentor}
                  </button>
                ))}
              </div>
            )}
          </div>

          {availableMentors.length === 0 && assignedMentors.length > 0 && (
            <p className="text-xs text-muted-foreground">All mentors assigned</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-6 border-t border-border">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {isNew ? 'Create Skill Set' : 'Save Changes'}
        </Button>
      </div>
    </motion.div>
  );
}

// Main Component
export function SkillSetsView() {
  const [skillSets, setSkillSets] = useState<SkillSet[]>([
    ...GLOBAL_SKILLSETS,
    ...SAMPLE_CUSTOM_SKILLSETS,
  ]);
  const [view, setView] = useState<'list' | 'editor' | 'viewer'>('list');
  const [selectedSkillSet, setSelectedSkillSet] = useState<SkillSet | {}>({});

  const handleEdit = (skillSet: SkillSet | {}) => {
    setSelectedSkillSet(skillSet);
    setView('editor');
  };

  const handleView = (skillSet: SkillSet) => {
    setSelectedSkillSet(skillSet);
    setView('viewer');
  };

  const handleBack = () => {
    setView('list');
    setSelectedSkillSet({});
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

  const handleToggle = (id: string, enabled: boolean) => {
    setSkillSets(
      skillSets.map((ss) => (ss.id === id ? { ...ss, enabled } : ss))
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {view === 'list' && (
        <SkillSetsList
          skillSets={skillSets}
          onEdit={handleEdit}
          onView={handleView}
          onToggle={handleToggle}
        />
      )}
      {view === 'editor' && (
        <SkillSetEditor
          skillSet={selectedSkillSet}
          onBack={handleBack}
          onSave={handleSave}
        />
      )}
      {view === 'viewer' && 'id' in selectedSkillSet && (
        <SkillSetView skillSet={selectedSkillSet as SkillSet} onBack={handleBack} />
      )}
    </div>
  );
}
