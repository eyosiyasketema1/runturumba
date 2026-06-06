import React, { useState, useMemo } from "react";
import {
  Plus, Search, Play, Pause, Trash2, Edit2, MoreVertical, Copy,
  Eye, ArrowLeft, Save, ChevronDown, ChevronRight, ChevronUp,
  GripVertical, X, Check, ExternalLink, FileText, Video,
  ClipboardList, BarChart3, Link2, QrCode, Sparkles, Users,
  Mail, Phone, Type, Hash, Star, Smartphone, Globe, Palette,
  Settings2, Zap, CheckCircle2, Circle, AlertCircle, Archive,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  cn,
  type Campaign, type CampaignQuestion, type CampaignType, type CampaignStatus,
  type QuestionType, type CampaignSettings, type CampaignOutcomeConfig,
  INITIAL_CAMPAIGNS,
} from "./types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Separator } from "./ui/separator";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator
} from "./ui/dropdown-menu";

// ============================================================================
// HELPERS
// ============================================================================

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; dot: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", icon: Circle },
  active: { label: "Active", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", icon: Play },
  paused: { label: "Paused", color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500", icon: Pause },
  archived: { label: "Archived", color: "bg-gray-50 text-gray-500 border-gray-200", dot: "bg-gray-400", icon: Archive },
};

const QUESTION_TYPE_CONFIG: Record<QuestionType, { label: string; icon: any; color: string }> = {
  multiple_choice: { label: "Multiple Choice", icon: CheckCircle2, color: "text-blue-500" },
  text: { label: "Text", icon: Type, color: "text-emerald-500" },
  scale: { label: "Scale", icon: Star, color: "text-amber-500" },
  contact_info: { label: "Contact Info", icon: Users, color: "text-violet-500" },
};

const funnelPercent = (num: number, denom: number) => denom === 0 ? "0%" : `${Math.round((num / denom) * 100)}%`;

// ============================================================================
// QUESTION EDITOR
// ============================================================================

const CONTACT_FIELD_OPTIONS = [
  { field: "name", label: "Full Name", icon: Users },
  { field: "phone", label: "Phone Number", icon: Phone },
  { field: "email", label: "Email Address", icon: Mail },
  { field: "city", label: "City / Location", icon: Globe },
];

const QuestionCard = ({ question, index, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast, isActive, onSelect }: {
  question: CampaignQuestion;
  index: number;
  onUpdate: (q: CampaignQuestion) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  isActive: boolean;
  onSelect: () => void;
}) => {
  const qtCfg = QUESTION_TYPE_CONFIG[question.type];
  const QIcon = qtCfg.icon;

  return (
    <div
      className={cn(
        "border rounded-xl bg-card transition-all",
        isActive ? "border-primary shadow-md ring-1 ring-primary/20" : "border-border hover:border-primary/30 cursor-pointer"
      )}
      onClick={() => !isActive && onSelect()}
    >
      {/* Always visible: number + question text + type + actions */}
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Drag handle + reorder */}
        <div className="flex flex-col items-center gap-0.5 pt-1 shrink-0">
          <GripVertical className="w-4 h-4 text-muted-foreground/40" />
          <div className="flex flex-col gap-0">
            <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"><ChevronUp className="w-3 h-3" /></button>
            <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={isLast} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"><ChevronDown className="w-3 h-3" /></button>
          </div>
        </div>

        {/* Question number */}
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold", isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isActive ? (
            <input
              value={question.questionText}
              onChange={(e) => onUpdate({ ...question, questionText: e.target.value })}
              placeholder="Type your question here..."
              className="w-full text-sm font-semibold text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
              autoFocus
            />
          ) : (
            <p className="text-sm font-medium text-foreground truncate">{question.questionText || "Untitled question"}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", qtCfg.color)}>
              <QIcon className="w-3 h-3" /> {qtCfg.label}
            </span>
            {question.required && <span className="text-[10px] text-rose-500 font-medium">Required</span>}
          </div>
        </div>

        {/* Delete */}
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded editor — only when active */}
      {isActive && (
        <div className="px-4 pb-4 space-y-4 border-t border-border mx-4 pt-4">
          {/* Description */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Description (optional)</Label>
            <Input value={question.description || ""} onChange={(e) => onUpdate({ ...question, description: e.target.value })} placeholder="Add helper text for participants..." className="text-sm" />
          </div>

          {/* Type selector + required toggle */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground shrink-0">Type</Label>
              <select
                value={question.type}
                onChange={(e) => {
                  const newType = e.target.value as QuestionType;
                  const defaults: Record<QuestionType, any> = {
                    multiple_choice: { options: [{ value: "opt_1", label: "Option 1", score: 0 }, { value: "opt_2", label: "Option 2", score: 0 }] },
                    text: { placeholder: "Type your answer...", maxLength: 500 },
                    scale: { min: 1, max: 5, minLabel: "Not at all", maxLabel: "Very much" },
                    contact_info: { fields: CONTACT_FIELD_OPTIONS.slice(0, 3).map(f => ({ field: f.field, label: f.label, required: f.field === "name" })) },
                  };
                  onUpdate({ ...question, type: newType, config: defaults[newType] });
                }}
                className="h-9 px-3 text-sm rounded-lg border border-input bg-background"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="text">Open Text</option>
                <option value="scale">Rating Scale</option>
                <option value="contact_info">Contact Info</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={question.required} onCheckedChange={(v) => onUpdate({ ...question, required: v })} />
              <Label className="text-xs text-muted-foreground">Required</Label>
            </div>
          </div>

          {/* Type-specific config */}
          {question.type === "multiple_choice" && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Answer Options</Label>
              {(question.config.options || []).map((opt: any, i: number) => (
                <div key={i} className="flex items-center gap-2 group/opt">
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  <Input
                    value={opt.label}
                    placeholder={`Option ${i + 1}`}
                    className="h-9 text-sm flex-1"
                    autoFocus={!opt.label}
                    onChange={(e) => {
                      const opts = [...(question.config.options || [])];
                      opts[i] = { ...opts[i], label: e.target.value, value: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_") || `opt_${i}` };
                      onUpdate({ ...question, config: { ...question.config, options: opts } });
                    }}
                  />
                  <button
                    onClick={() => onUpdate({ ...question, config: { ...question.config, options: (question.config.options || []).filter((_: any, j: number) => j !== i) } })}
                    className="p-1 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover/opt:opacity-100 transition-all"
                  ><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button
                onClick={() => onUpdate({ ...question, config: { ...question.config, options: [...(question.config.options || []), { value: `opt_${Date.now()}`, label: "", score: 0 }] } })}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium pl-6 py-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add option
              </button>
            </div>
          )}

          {question.type === "scale" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Min Value</Label><Input type="number" value={question.config.min || 1} onChange={(e) => onUpdate({ ...question, config: { ...question.config, min: parseInt(e.target.value) || 1 } })} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Max Value</Label><Input type="number" value={question.config.max || 5} onChange={(e) => onUpdate({ ...question, config: { ...question.config, max: parseInt(e.target.value) || 5 } })} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Low Label</Label><Input value={question.config.minLabel || ""} onChange={(e) => onUpdate({ ...question, config: { ...question.config, minLabel: e.target.value } })} placeholder="e.g. Not at all" /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">High Label</Label><Input value={question.config.maxLabel || ""} onChange={(e) => onUpdate({ ...question, config: { ...question.config, maxLabel: e.target.value } })} placeholder="e.g. Very much" /></div>
              </div>
              {/* Scale preview */}
              <div className="flex items-center gap-1 pt-1">
                {Array.from({ length: Math.min((question.config.max || 5) - (question.config.min || 1) + 1, 11) }, (_, i) => (
                  <div key={i} className="flex-1 h-9 border border-border rounded-md flex items-center justify-center text-xs text-muted-foreground bg-muted/30">
                    {(question.config.min || 1) + i}
                  </div>
                ))}
              </div>
            </div>
          )}

          {question.type === "text" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Placeholder Text</Label>
                <Input value={question.config.placeholder || ""} onChange={(e) => onUpdate({ ...question, config: { ...question.config, placeholder: e.target.value } })} placeholder="e.g. Share your thoughts..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Max Characters</Label>
                <Input type="number" value={question.config.maxLength || 500} onChange={(e) => onUpdate({ ...question, config: { ...question.config, maxLength: parseInt(e.target.value) || 500 } })} />
              </div>
              {/* Text preview */}
              <div className="border border-border rounded-lg px-3 py-2 bg-muted/20 text-sm text-muted-foreground/50 min-h-[60px]">
                {question.config.placeholder || "Participant's answer will appear here..."}
              </div>
            </div>
          )}

          {question.type === "contact_info" && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Select which fields to collect</Label>
              <div className="space-y-2">
                {CONTACT_FIELD_OPTIONS.map(fieldOpt => {
                  const existing = (question.config.fields || []).find((f: any) => f.field === fieldOpt.field);
                  const isEnabled = !!existing;
                  const FieldIcon = fieldOpt.icon;
                  return (
                    <div key={fieldOpt.field} className={cn("flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors", isEnabled ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20")}>
                      <div className="flex items-center gap-3">
                        <FieldIcon className={cn("w-4 h-4", isEnabled ? "text-primary" : "text-muted-foreground")} />
                        <div>
                          <p className={cn("text-sm font-medium", isEnabled ? "text-foreground" : "text-muted-foreground")}>{fieldOpt.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isEnabled && (
                          <div className="flex items-center gap-1.5">
                            <Switch
                              checked={existing.required}
                              onCheckedChange={(v) => {
                                const fields = (question.config.fields || []).map((f: any) => f.field === fieldOpt.field ? { ...f, required: v } : f);
                                onUpdate({ ...question, config: { ...question.config, fields } });
                              }}
                            />
                            <span className="text-[11px] text-muted-foreground">Required</span>
                          </div>
                        )}
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(v) => {
                            if (v) {
                              const fields = [...(question.config.fields || []), { field: fieldOpt.field, label: fieldOpt.label, required: fieldOpt.field === "name" }];
                              onUpdate({ ...question, config: { ...question.config, fields } });
                            } else {
                              const fields = (question.config.fields || []).filter((f: any) => f.field !== fieldOpt.field);
                              onUpdate({ ...question, config: { ...question.config, fields } });
                            }
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// LIVE PREVIEW (Mobile Frame)
// ============================================================================

const LivePreview = ({ campaign }: { campaign: Campaign }) => {
  const [previewStep, setPreviewStep] = useState(0); // 0 = welcome, 1..n = questions, n+1 = completion
  const totalSteps = campaign.questions.length + 2;
  const { branding } = campaign.settings;

  return (
    <div className="w-[320px] shrink-0 flex flex-col items-center">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Live Preview</p>
      {/* Phone frame */}
      <div className="w-[300px] h-[580px] rounded-[2rem] border-4 border-gray-800 bg-white shadow-2xl overflow-hidden flex flex-col relative">
        {/* Status bar */}
        <div className="h-7 bg-gray-800 flex items-center justify-center">
          <div className="w-16 h-1.5 bg-gray-600 rounded-full" />
        </div>
        {/* Header */}
        <div className="px-4 py-3 border-b" style={{ backgroundColor: branding.primaryColor + "10" }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: branding.primaryColor }}>
              <ClipboardList className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-800 truncate">{campaign.name}</span>
          </div>
          {/* Progress */}
          {previewStep > 0 && previewStep < totalSteps - 1 && (
            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(previewStep / (totalSteps - 2)) * 100}%`, backgroundColor: branding.primaryColor }} />
            </div>
          )}
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {previewStep === 0 && (
            <div className="text-center py-6 space-y-4">
              {campaign.type === "video_quiz" && campaign.settings.videoUrl && (
                <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center border">
                  <Video className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <p className="text-sm text-gray-700 leading-relaxed">{campaign.settings.welcomeMessage}</p>
              <button className="w-full py-2.5 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: branding.primaryColor }} onClick={() => setPreviewStep(1)}>Start</button>
            </div>
          )}
          {previewStep > 0 && previewStep <= campaign.questions.length && (() => {
            const q = campaign.questions[previewStep - 1];
            if (!q) return null;
            return (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{q.questionText}</p>
                  {q.description && <p className="text-xs text-gray-500 mt-1">{q.description}</p>}
                  {q.required && <span className="text-[10px] text-red-500">*Required</span>}
                </div>
                {q.type === "multiple_choice" && (
                  <div className="space-y-2">
                    {(q.config.options || []).map((opt: any, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 border rounded-lg text-sm text-gray-700 hover:border-gray-400 cursor-pointer">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                        <span>{opt.label || `Option ${i + 1}`}</span>
                      </div>
                    ))}
                  </div>
                )}
                {q.type === "text" && (
                  <textarea className="w-full h-24 border rounded-lg px-3 py-2 text-sm text-gray-500 resize-none" placeholder={q.config.placeholder || "Type here..."} readOnly />
                )}
                {q.type === "scale" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>{q.config.minLabel || q.config.min || 1}</span>
                      <span>{q.config.maxLabel || q.config.max || 10}</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: (q.config.max || 10) - (q.config.min || 1) + 1 }, (_, i) => (
                        <div key={i} className="flex-1 h-9 border rounded-md flex items-center justify-center text-xs text-gray-600 hover:border-gray-400 cursor-pointer">
                          {(q.config.min || 1) + i}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {q.type === "contact_info" && (
                  <div className="space-y-2.5">
                    {(q.config.fields || []).map((f: any, i: number) => (
                      <div key={i} className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">{f.label}{f.required && " *"}</label>
                        <input className="w-full h-9 border rounded-lg px-3 text-sm text-gray-400" placeholder={f.label} readOnly />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
          {previewStep === totalSteps - 1 && (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: branding.primaryColor + "20" }}>
                <CheckCircle2 className="w-7 h-7" style={{ color: branding.primaryColor }} />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{campaign.settings.completionMessage}</p>
            </div>
          )}
        </div>
        {/* Bottom nav */}
        {previewStep > 0 && (
          <div className="px-4 py-3 border-t flex items-center gap-2">
            <button className="px-4 py-2 text-xs font-medium text-gray-600 border rounded-lg" onClick={() => setPreviewStep(Math.max(0, previewStep - 1))}>Back</button>
            <button className="flex-1 py-2 rounded-lg text-white text-xs font-semibold" style={{ backgroundColor: branding.primaryColor }}
              onClick={() => setPreviewStep(Math.min(totalSteps - 1, previewStep + 1))}>
              {previewStep >= totalSteps - 1 ? "Done" : "Next"}
            </button>
          </div>
        )}
      </div>
      {/* Step indicator */}
      <div className="flex items-center gap-1 mt-3">
        {Array.from({ length: totalSteps }, (_, i) => (
          <button key={i} onClick={() => setPreviewStep(i)} className={cn("w-2 h-2 rounded-full transition-all", i === previewStep ? "w-5" : "")} style={{ backgroundColor: i === previewStep ? branding.primaryColor : "#D1D5DB" }} />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// CAMPAIGN BUILDER (Full Page)
// ============================================================================

const CampaignBuilder = ({ campaign, onBack, onSave }: {
  campaign: Campaign;
  onBack: () => void;
  onSave: (c: Campaign) => void;
}) => {
  const [draft, setDraft] = useState<Campaign>(campaign);
  const [builderTab, setBuilderTab] = useState<"questions" | "settings" | "outcomes">("questions");
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const updateSettings = (data: Partial<CampaignSettings>) => setDraft(prev => ({ ...prev, settings: { ...prev.settings, ...data } }));
  const updateBranding = (data: Partial<Campaign["settings"]["branding"]>) => setDraft(prev => ({ ...prev, settings: { ...prev.settings, branding: { ...prev.settings.branding, ...data } } }));
  const updateOutcome = (data: Partial<CampaignOutcomeConfig>) => setDraft(prev => ({ ...prev, outcomeConfig: { ...prev.outcomeConfig, ...data } }));

  const addQuestion = (type: QuestionType) => {
    const defaults: Record<QuestionType, any> = {
      multiple_choice: { options: [{ value: "opt_1", label: "Option 1", score: 0 }, { value: "opt_2", label: "Option 2", score: 0 }] },
      text: { placeholder: "Type your answer...", maxLength: 500 },
      scale: { min: 1, max: 5, minLabel: "Not at all", maxLabel: "Very much" },
      contact_info: { fields: CONTACT_FIELD_OPTIONS.slice(0, 3).map(f => ({ field: f.field, label: f.label, required: f.field === "name" })) },
    };
    const newId = `q-${Date.now()}`;
    const q: CampaignQuestion = { id: newId, orderIndex: draft.questions.length, type, questionText: "", required: true, config: defaults[type] };
    setDraft(prev => ({ ...prev, questions: [...prev.questions, q] }));
    setActiveQuestionId(newId);
  };

  const updateQuestion = (id: string, q: CampaignQuestion) => setDraft(prev => ({ ...prev, questions: prev.questions.map(x => x.id === id ? q : x) }));
  const deleteQuestion = (id: string) => { setDraft(prev => ({ ...prev, questions: prev.questions.filter(x => x.id !== id).map((q, i) => ({ ...q, orderIndex: i })) })); if (activeQuestionId === id) setActiveQuestionId(null); };
  const moveQuestion = (index: number, dir: -1 | 1) => {
    const qs = [...draft.questions];
    const target = index + dir;
    if (target < 0 || target >= qs.length) return;
    [qs[index], qs[target]] = [qs[target], qs[index]];
    setDraft(prev => ({ ...prev, questions: qs.map((q, i) => ({ ...q, orderIndex: i })) }));
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-3 border-b border-border bg-background flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <input value={draft.name} onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
            className="text-lg font-bold text-foreground bg-transparent border-none outline-none w-full" />
          <p className="text-xs text-muted-foreground">
            {draft.type === "video_quiz" ? "Video + Quiz" : "Survey"} · {draft.questions.length} question{draft.questions.length !== 1 ? "s" : ""} · {STATUS_CONFIG[draft.status].label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { onSave(draft); toast.success("Saved"); }}><Save className="w-3.5 h-3.5 mr-1.5" /> Save</Button>
          {draft.status === "draft" && (
            <Button size="sm" onClick={() => { const updated = { ...draft, status: "active" as const, publishedAt: new Date().toISOString() }; setDraft(updated); onSave(updated); toast.success("Campaign published!"); }}>
              <Play className="w-3.5 h-3.5 mr-1.5" /> Publish
            </Button>
          )}
        </div>
      </div>

      {/* Builder tabs */}
      <div className="px-6 border-b border-border bg-muted/20 shrink-0">
        <div className="flex items-center gap-1">
          {([
            { id: "questions" as const, label: "Questions", icon: ClipboardList },
            { id: "settings" as const, label: "Settings", icon: Settings2 },
            { id: "outcomes" as const, label: "Outcomes", icon: Zap },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setBuilderTab(tab.id)}
              className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px",
                builderTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          {builderTab === "questions" && (
            <div className="space-y-4 max-w-2xl">
              <h3 className="text-base font-semibold text-foreground">Questions ({draft.questions.length})</h3>

              {draft.questions.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
                  <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">No questions yet</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-5">Add your first question to start building</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {(Object.entries(QUESTION_TYPE_CONFIG) as [QuestionType, typeof QUESTION_TYPE_CONFIG[QuestionType]][]).map(([type, cfg]) => {
                      const BtnIcon = cfg.icon;
                      return (
                        <Button key={type} size="sm" variant="outline" onClick={() => addQuestion(type)} className="gap-1.5">
                          <BtnIcon className={cn("w-3.5 h-3.5", cfg.color)} /> {cfg.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {draft.questions.map((q, i) => (
                    <QuestionCard key={q.id} question={q} index={i}
                      onUpdate={(updated) => updateQuestion(q.id, updated)}
                      onDelete={() => deleteQuestion(q.id)}
                      onMoveUp={() => moveQuestion(i, -1)}
                      onMoveDown={() => moveQuestion(i, 1)}
                      isFirst={i === 0} isLast={i === draft.questions.length - 1}
                      isActive={activeQuestionId === q.id}
                      onSelect={() => setActiveQuestionId(q.id)} />
                  ))}

                  {/* Add question buttons — always at the bottom */}
                  <div className="border-2 border-dashed border-border rounded-xl p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3 text-center">Add a question</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {(Object.entries(QUESTION_TYPE_CONFIG) as [QuestionType, typeof QUESTION_TYPE_CONFIG[QuestionType]][]).map(([type, cfg]) => {
                        const BtnIcon = cfg.icon;
                        return (
                          <Button key={type} size="sm" variant="outline" onClick={() => addQuestion(type)} className="gap-1.5">
                            <BtnIcon className={cn("w-3.5 h-3.5", cfg.color)} /> {cfg.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {builderTab === "settings" && (
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold">General</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-xs">Campaign Name</Label><Input value={draft.name} onChange={(e) => setDraft(p => ({ ...p, name: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Description</Label><Textarea value={draft.description} onChange={(e) => setDraft(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Type</Label>
                    <select value={draft.type} onChange={(e) => setDraft(p => ({ ...p, type: e.target.value as CampaignType }))} className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm">
                      <option value="survey">Survey / Quiz</option>
                      <option value="video_quiz">Video + Quiz</option>
                    </select>
                  </div>
                  <div className="space-y-1.5"><Label className="text-xs">URL Slug</Label><Input value={draft.slug} onChange={(e) => setDraft(p => ({ ...p, slug: e.target.value }))} /></div>
                </CardContent>
              </Card>

              {draft.type === "video_quiz" && (
                <Card>
                  <CardHeader><CardTitle className="text-sm font-semibold">Video</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5"><Label className="text-xs">Video URL</Label><Input value={draft.settings.videoUrl || ""} onChange={(e) => updateSettings({ videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." /></div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold">Messages</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-xs">Welcome Message</Label><Textarea value={draft.settings.welcomeMessage} onChange={(e) => updateSettings({ welcomeMessage: e.target.value })} rows={3} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Completion Message</Label><Textarea value={draft.settings.completionMessage} onChange={(e) => updateSettings({ completionMessage: e.target.value })} rows={3} /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold">Branding</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={draft.settings.branding.primaryColor} onChange={(e) => updateBranding({ primaryColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                        <Input value={draft.settings.branding.primaryColor} onChange={(e) => updateBranding({ primaryColor: e.target.value })} className="flex-1 h-8 text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Background Color</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={draft.settings.branding.backgroundColor} onChange={(e) => updateBranding({ backgroundColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                        <Input value={draft.settings.branding.backgroundColor} onChange={(e) => updateBranding({ backgroundColor: e.target.value })} className="flex-1 h-8 text-xs" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold">Contact Collection</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium">Collect Contact Info</p><p className="text-xs text-muted-foreground">Add a contact info question to your survey</p></div>
                    <Switch checked={draft.settings.collectContact} onCheckedChange={(v) => updateSettings({ collectContact: v })} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {builderTab === "outcomes" && (
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Post-Completion Actions</CardTitle>
                  <CardDescription className="text-xs">What happens after a participant completes this campaign</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium">Auto-Classify Seeker</p><p className="text-xs text-muted-foreground">AI classifies maturity level from survey answers</p></div>
                    <Switch checked={draft.outcomeConfig.autoClassify} onCheckedChange={(v) => updateOutcome({ autoClassify: v })} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium">Auto-Match with Mentor</p><p className="text-xs text-muted-foreground">Automatically propose a mentor match based on profile</p></div>
                    <Switch checked={draft.outcomeConfig.autoMatch} onCheckedChange={(v) => updateOutcome({ autoMatch: v })} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium">Content Recommendations</p><p className="text-xs text-muted-foreground">Show personalized content on the completion screen</p></div>
                    <Switch checked={draft.outcomeConfig.contentRecommendationEnabled} onCheckedChange={(v) => updateOutcome({ contentRecommendationEnabled: v })} />
                  </div>
                  <Separator />
                  <div className="space-y-1.5">
                    <Label className="text-xs">Enroll in Automation (optional)</Label>
                    <select value={draft.outcomeConfig.automationId || ""} onChange={(e) => updateOutcome({ automationId: e.target.value || undefined })} className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm">
                      <option value="">No automation</option>
                      <option value="auto-1">Welcome Message</option>
                      <option value="auto-8">Foundations of Faith Drip</option>
                      <option value="auto-14">Post-Baptism Follow-up</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className="border-l border-border bg-muted/20 p-6 overflow-y-auto hidden xl:block">
          <LivePreview campaign={draft} />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CAMPAIGNS LIST PAGE
// ============================================================================

export const CampaignsView = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | CampaignStatus>("all");
  const [filterType, setFilterType] = useState<"all" | CampaignType>("all");
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      const matchesStatus = filterStatus === "all" || c.status === filterStatus;
      const matchesType = filterType === "all" || c.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [campaigns, searchQuery, filterStatus, filterType]);

  const totalViews = campaigns.reduce((s, c) => s + c.analytics.views, 0);
  const totalCompletions = campaigns.reduce((s, c) => s + c.analytics.completions, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.analytics.conversions, 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;

  const handleCreate = () => {
    const c: Campaign = {
      id: `camp-${Date.now()}`, tenantId: "tenant-1", name: "New Campaign", description: "",
      type: "survey", status: "draft", slug: `campaign-${Date.now()}`,
      settings: { welcomeMessage: "Welcome! We'd love to learn about you.", completionMessage: "Thank you for completing this survey!", collectContact: true, contactFields: ["name", "phone"], branding: { primaryColor: "#4F46E5", backgroundColor: "#FFFFFF" }, language: "en" },
      outcomeConfig: { autoClassify: true, autoMatch: true, contentRecommendationEnabled: true },
      questions: [], analytics: { views: 0, starts: 0, completions: 0, conversions: 0 }, createdAt: new Date().toISOString(),
    };
    setCampaigns(prev => [...prev, c]);
    setEditingCampaign(c);
  };

  const handleSave = (c: Campaign) => setCampaigns(prev => prev.map(x => x.id === c.id ? c : x));
  const handleDelete = (id: string) => { setCampaigns(prev => prev.filter(c => c.id !== id)); toast.success("Campaign deleted"); };
  const handleDuplicate = (c: Campaign) => {
    const copy = { ...c, id: `camp-${Date.now()}`, name: `${c.name} (Copy)`, status: "draft" as const, slug: `${c.slug}-copy`, analytics: { views: 0, starts: 0, completions: 0, conversions: 0 }, publishedAt: undefined, questions: c.questions.map(q => ({ ...q, id: `q-${Date.now()}-${q.orderIndex}` })) };
    setCampaigns(prev => [...prev, copy]); toast.success("Campaign duplicated");
  };
  const handleToggleStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (c.status === "active") return { ...c, status: "paused" as const };
      if (c.status === "paused" || c.status === "draft") return { ...c, status: "active" as const, publishedAt: c.publishedAt || new Date().toISOString() };
      return c;
    }));
  };

  // Builder view
  if (editingCampaign) {
    const current = campaigns.find(c => c.id === editingCampaign.id) || editingCampaign;
    return <CampaignBuilder campaign={current} onBack={() => setEditingCampaign(null)} onSave={(c) => { handleSave(c); setEditingCampaign(c); }} />;
  }

  return (
    <div className="space-y-5 p-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">Create surveys and quizzes to acquire and understand new seekers</p>
        </div>
        <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-1.5" /> New Campaign</Button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Campaigns", value: activeCampaigns, icon: Play, color: "text-emerald-600" },
          { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "text-blue-600" },
          { label: "Completions", value: totalCompletions.toLocaleString(), icon: CheckCircle2, color: "text-violet-600" },
          { label: "Conversions", value: totalConversions.toLocaleString(), icon: Users, color: "text-primary" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0"><stat.icon className={cn("w-4 h-4", stat.color)} /></div>
            <div><p className="text-lg font-bold text-foreground leading-none">{stat.value}</p><p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search campaigns..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 text-sm" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="h-10 px-3 pr-8 rounded-lg border border-border bg-background text-sm appearance-none cursor-pointer">
          <option value="all">All types</option><option value="survey">Survey</option><option value="video_quiz">Video + Quiz</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="h-10 px-3 pr-8 rounded-lg border border-border bg-background text-sm appearance-none cursor-pointer">
          <option value="all">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base font-semibold text-foreground">No campaigns found</h3>
          <p className="text-sm text-muted-foreground mt-1">Create your first campaign to start acquiring seekers.</p>
          <Button className="mt-5" onClick={handleCreate}><Plus className="w-4 h-4 mr-1.5" /> New Campaign</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Views</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Completions</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Conv. Rate</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const stCfg = STATUS_CONFIG[c.status];
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => setEditingCampaign(c)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          {c.type === "video_quiz" ? <Video className="w-4 h-4 text-rose-500" /> : <ClipboardList className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="text-[10px]">{c.type === "video_quiz" ? "Video + Quiz" : "Survey"}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full border", stCfg.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", stCfg.dot)} />
                        {stCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-foreground tabular-nums">{c.analytics.views.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right font-medium text-foreground tabular-nums">{c.analytics.completions.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right font-medium text-foreground tabular-nums">{funnelPercent(c.analytics.conversions, c.analytics.views)}</td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onSelect={() => setEditingCampaign(c)}><Edit2 className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDuplicate(c)}><Copy className="w-3.5 h-3.5" /> Duplicate</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleToggleStatus(c.id)}>
                            {c.status === "active" ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Activate</>}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
