import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Plus, Trash2, Edit2, Copy, Power, GripVertical,
  Globe, Code2, Search, ChevronDown, X, Filter,
  MessageSquare, Smartphone, Mail, Send, Facebook, Server,
  Monitor, Bot, Info, ShieldCheck, FormInput, Eye, Paperclip, Smile,
  ChevronLeft, ChevronRight, ArrowLeft
} from "lucide-react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn,
  type ChatEndpoint, type ConversationRule,
  type EndpointStatus, type WidgetPosition, type AudienceMode,
  type CreationMode, type ReopenPolicy,
  type User, type TeamGroup, type Group, type Contact,
  copyToClipboard,
} from "./types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Modal } from "./shared-ui";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatEndpointsViewProps {
  chatEndpoints: ChatEndpoint[];
  conversationRules: ConversationRule[];
  users: User[];
  teamGroups: TeamGroup[];
  groups: Group[];
  contacts: Contact[];
  onAddEndpoint: (data: Partial<ChatEndpoint>) => void;
  onUpdateEndpoint: (id: string, data: Partial<ChatEndpoint>) => void;
  onDeleteEndpoint: (id: string) => void;
  onAddRule: (data: Partial<ConversationRule>) => void;
  onUpdateRule: (id: string, data: Partial<ConversationRule>) => void;
  onDeleteRule: (id: string) => void;
  onReorderRules: (rules: ConversationRule[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RULE_DRAG_TYPE = "CONVERSATION_RULE";

const CHANNEL_SOURCE_OPTIONS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-emerald-600" },
  { id: "sms",      label: "SMS",      icon: Smartphone,    color: "text-blue-600" },
  { id: "email",    label: "Email",    icon: Mail,          color: "text-purple-600" },
  { id: "telegram", label: "Telegram", icon: Send,          color: "text-sky-600" },
  { id: "messenger",label: "Messenger",icon: Facebook,      color: "text-blue-500" },
  { id: "smpp",     label: "SMPP",     icon: Server,        color: "text-gray-600" },
];

const AUDIENCE_MODE_OPTIONS: { id: AudienceMode; label: string; description: string }[] = [
  { id: "all",       label: "All Users",            description: "Any inbound contact" },
  { id: "known",     label: "Known Contacts Only",  description: "Contacts already in your CRM" },
  { id: "groups",    label: "Specific Groups",      description: "Select allowed contact groups" },
  { id: "allowlist", label: "Allowlist",            description: "Specific contacts only" },
];

const REOPEN_POLICY_OPTIONS: { id: ReopenPolicy; label: string; description: string }[] = [
  { id: "always_reopen", label: "Always Reopen Existing Conversation", description: "Continue any prior conversation" },
  { id: "always_new",    label: "Always Create New Conversation",      description: "Fresh thread for every contact" },
  { id: "threshold",     label: "Reopen Within Time Threshold",        description: "Reopen if within configured hours" },
];

// ─── Brand Color Presets ─────────────────────────────────────────────────────

const PRESET_SOLID_COLORS = [
  { hex: "#7c3aed", label: "Purple"  },
  { hex: "#4f46e5", label: "Indigo"  },
  { hex: "#2563eb", label: "Blue"    },
  { hex: "#0891b2", label: "Cyan"    },
  { hex: "#059669", label: "Green"   },
  { hex: "#d97706", label: "Amber"   },
  { hex: "#ea580c", label: "Orange"  },
  { hex: "#dc2626", label: "Red"     },
  { hex: "#db2777", label: "Pink"    },
  { hex: "#475569", label: "Slate"   },
];

const PRESET_GRADIENTS = [
  { id: "violet-pink",    label: "Violet → Pink",    from: "#7c3aed", to: "#ec4899", dir: "135deg" },
  { id: "blue-cyan",      label: "Blue → Cyan",      from: "#2563eb", to: "#06b6d4", dir: "135deg" },
  { id: "green-teal",     label: "Green → Teal",     from: "#16a34a", to: "#0d9488", dir: "135deg" },
  { id: "orange-red",     label: "Orange → Red",     from: "#f97316", to: "#dc2626", dir: "135deg" },
  { id: "indigo-violet",  label: "Indigo → Violet",  from: "#4f46e5", to: "#9333ea", dir: "135deg" },
  { id: "pink-amber",     label: "Pink → Amber",     from: "#db2777", to: "#d97706", dir: "135deg" },
];

const GRADIENT_DIRS = [
  { value: "90deg",  label: "→"  },
  { value: "135deg", label: "↘"  },
  { value: "180deg", label: "↓"  },
  { value: "225deg", label: "↙"  },
];

type BrandForm = {
  brandColor: string;
  brandColorMode?: "solid" | "gradient" | "image";
  brandGradientFrom?: string;
  brandGradientTo?: string;
  brandGradientDir?: string;
  brandHeaderImage?: string;
};

/** Full brand style — used for the widget header only */
function getBrandStyle(form: BrandForm): React.CSSProperties {
  if (form.brandColorMode === "gradient" && form.brandGradientFrom && form.brandGradientTo) {
    return { background: `linear-gradient(${form.brandGradientDir || "135deg"}, ${form.brandGradientFrom}, ${form.brandGradientTo})` };
  }
  if (form.brandColorMode === "image" && form.brandHeaderImage) {
    return {
      backgroundImage: `url(${form.brandHeaderImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { backgroundColor: form.brandColor };
}

/** Button / accent style — in "image" mode buttons use brandColor independently;
 *  in solid/gradient mode they mirror the header brand style. */
function getButtonStyle(form: BrandForm): React.CSSProperties {
  if (form.brandColorMode === "image") {
    return { backgroundColor: form.brandColor };
  }
  return getBrandStyle(form);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateEmbedCode(ep: Pick<ChatEndpoint, "publicKey" | "position">): string {
  return `<script\n  src="https://cdn.turumba.io/widget.js"\n  data-key="${ep.publicKey}"\n  data-position="${ep.position}"\n  async\n></script>`;
}

function getSourceLabel(
  sourceId: string,
  endpoints: ChatEndpoint[],
): { label: string; icon: React.ElementType; color: string } {
  const channel = CHANNEL_SOURCE_OPTIONS.find(c => c.id === sourceId);
  if (channel) return channel;
  const ep = endpoints.find(e => e.id === sourceId);
  if (ep) return { label: ep.name, icon: Bot, color: "text-primary" };
  return { label: sourceId, icon: Globe, color: "text-muted-foreground" };
}

// ─── Draggable Rule Row ────────────────────────────────────────────────────────

interface DragItem { id: string; index: number }

function DraggableRuleRow({
  rule, index, moveRule, endpoints, teamGroups,
  onEdit, onToggle, onDelete,
}: {
  rule: ConversationRule;
  index: number;
  moveRule: (dragIndex: number, hoverIndex: number) => void;
  endpoints: ChatEndpoint[];
  teamGroups: TeamGroup[];
  onEdit: (rule: ConversationRule) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const rowRef  = useRef<HTMLDivElement>(null);
  const gripRef = useRef<HTMLDivElement>(null);

  // FIX: use factory function so `item` is always fresh when drag starts
  const [{ isDragging }, drag, dragPreview] = useDrag<DragItem, unknown, { isDragging: boolean }>(
    () => ({
      type: RULE_DRAG_TYPE,
      item: () => ({ id: rule.id, index }),
      collect: monitor => ({ isDragging: monitor.isDragging() }),
    }),
    [rule.id, index],
  );

  const [, drop] = useDrop<DragItem>({
    accept: RULE_DRAG_TYPE,
    hover(item, monitor) {
      if (!rowRef.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const rect = rowRef.current.getBoundingClientRect();
      const midY = (rect.bottom - rect.top) / 2;
      const offset = monitor.getClientOffset();
      if (!offset) return;
      const clientY = offset.y - rect.top;
      if (dragIndex < hoverIndex && clientY < midY) return;
      if (dragIndex > hoverIndex && clientY > midY) return;
      moveRule(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  // Connect: drag preview + drop zone → whole row; drag source → grip handle
  dragPreview(drop(rowRef));
  drag(gripRef);

  const audienceConfig: Record<AudienceMode, { label: string; color: string }> = {
    all:       { label: "All Users",       color: "bg-blue-50 text-blue-600 border-blue-200" },
    known:     { label: "Known Contacts",  color: "bg-amber-50 text-amber-600 border-amber-200" },
    groups:    { label: "Specific Groups", color: "bg-purple-50 text-purple-700 border-purple-200" },
    allowlist: { label: "Allowlist",       color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };

  const creationConfig: Record<CreationMode, { label: string; color: string }> = {
    auto:   { label: "Auto",   color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    manual: { label: "Manual", color: "bg-orange-50 text-orange-600 border-orange-200" },
  };

  return (
    // FIX: removed `border border-border` — parent uses divide-y, so no double borders
    <div
      ref={rowRef}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className={cn(
        "group bg-background transition-all duration-200",
        isDragging && "shadow-lg"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* FIX: grip ref instead of inline `ref={drag as any}` cast */}
        <div
          ref={gripRef}
          className="mt-1 cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Priority badge */}
        <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[11px] font-bold text-muted-foreground">{rule.priority}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-foreground">{rule.name}</span>
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 border uppercase tracking-wide",
              rule.active
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-muted text-muted-foreground border-border"
            )}>
              {rule.active ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {rule.sources.map(src => {
              const s = getSourceLabel(src, endpoints);
              return (
                <span key={src} className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 bg-muted border border-border text-muted-foreground">
                  <s.icon className={cn("w-2.5 h-2.5", s.color)} />
                  {s.label}
                </span>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 border", audienceConfig[rule.audienceMode].color)}>
              {audienceConfig[rule.audienceMode].label}
            </span>
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 border", creationConfig[rule.creationMode].color)}>
              {creationConfig[rule.creationMode].label} creation
            </span>
            {rule.reopenPolicy === "threshold" && rule.reopenWindowHours && (
              <span className="text-[10px] text-muted-foreground">
                Reopen ≤ {rule.reopenWindowHours}h
              </span>
            )}
            {rule.defaultTeam && (() => {
              const tg = teamGroups.find(t => t.id === rule.defaultTeam);
              return tg ? (
                <span className="text-[10px] text-muted-foreground">Team: {tg.name}</span>
              ) : null;
            })()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(rule)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggle(rule.id)}
            className={cn(
              "p-1.5 transition-colors",
              rule.active
                ? "text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
            )}
            title={rule.active ? "Deactivate" : "Activate"}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(rule.id)}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Endpoint Form Modal ───────────────────────────────────────────────────────

const BLANK_ENDPOINT_FORM = {
  name: "",
  description: "",
  logoUrl: "",
  status: "active" as EndpointStatus,
  position: "bottom-right" as WidgetPosition,
  brandColorMode: "solid" as "solid" | "gradient" | "image",
  brandColor: "#7c3aed",
  brandGradientFrom: "#7c3aed",
  brandGradientTo: "#ec4899",
  brandGradientDir: "135deg",
  brandHeaderImage: "",
  cornerRadius: 12,
  widgetWidth: 380,
  widgetHeight: 520,
  launcherText: "Chat with us",
  welcomeMessage: "Hi! How can we help you today?",
  offlineMessage: "Our team is currently offline. Leave a message and we'll get back to you.",
  preChatForm: false,
  preChatFields: {
    name:  { enabled: true,  required: true  },
    email: { enabled: true,  required: false },
  },
  allowedOrigins: [] as string[],
};

type EndpointForm = typeof BLANK_ENDPOINT_FORM;

function EndpointFormModal({
  isOpen, onClose, endpoint, onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  endpoint?: ChatEndpoint | null;
  onSave: (data: EndpointForm) => void;
}) {
  const [form, setForm] = useState<EndpointForm>(BLANK_ENDPOINT_FORM);
  const [originInput, setOriginInput] = useState("");
  const [showEmbed, setShowEmbed] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const logoInputRef      = useRef<HTMLInputElement>(null);
  const headerImgInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("logoUrl", reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleHeaderImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("brandHeaderImage", reader.result as string);
    reader.readAsDataURL(file);
  };

  // FIX: reset form every time the modal opens (or the target endpoint changes)
  useEffect(() => {
    if (!isOpen) return;
    setOriginInput("");
    setShowEmbed(false);
    if (endpoint) {
      setForm({
        name:              endpoint.name,
        description:       endpoint.description ?? "",
        logoUrl:           endpoint.logoUrl ?? "",
        status:            endpoint.status,
        position:          endpoint.position,
        brandColorMode:    (endpoint.brandColorMode ?? "solid") as "solid" | "gradient" | "image",
        brandColor:        endpoint.brandColor,
        brandGradientFrom: endpoint.brandGradientFrom ?? "#7c3aed",
        brandGradientTo:   endpoint.brandGradientTo   ?? "#ec4899",
        brandGradientDir:  endpoint.brandGradientDir  ?? "135deg",
        brandHeaderImage:  endpoint.brandHeaderImage  ?? "",
        cornerRadius:      endpoint.cornerRadius      ?? 12,
        widgetWidth:       (endpoint as any).widgetWidth  ?? 380,
        widgetHeight:      (endpoint as any).widgetHeight ?? 520,
        launcherText:      endpoint.launcherText,
        welcomeMessage:    endpoint.welcomeMessage,
        offlineMessage:    endpoint.offlineMessage,
        preChatForm:       endpoint.preChatForm,
        preChatFields: {
          name:  { ...endpoint.preChatFields.name  },
          email: { ...endpoint.preChatFields.email },
        },
        allowedOrigins: [...endpoint.allowedOrigins],
      });
    } else {
      setForm({ ...BLANK_ENDPOINT_FORM, allowedOrigins: [], preChatFields: { name: { enabled: true, required: true }, email: { enabled: true, required: false } } });
    }
  }, [isOpen, endpoint?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isEdit = !!endpoint;

  const embedCode = isEdit && endpoint
    ? generateEmbedCode(endpoint)
    : generateEmbedCode({ publicKey: "pk_live_...", position: form.position });

  const addOrigin = () => {
    const trimmed = originInput.trim();
    if (!trimmed) return;
    if (form.allowedOrigins.includes(trimmed)) { toast.error("Origin already added"); return; }
    setForm(prev => ({ ...prev, allowedOrigins: [...prev.allowedOrigins, trimmed] }));
    setOriginInput("");
  };

  const removeOrigin = (o: string) =>
    setForm(prev => ({ ...prev, allowedOrigins: prev.allowedOrigins.filter(x => x !== o) }));

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    onSave(form);
    onClose();
    toast.success(isEdit ? "Endpoint updated" : "Endpoint created");
  };

  const set = (key: keyof EndpointForm, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const setPreChatField = (field: "name" | "email", key: "enabled" | "required", value: boolean) =>
    setForm(prev => ({
      ...prev,
      preChatFields: {
        ...prev.preChatFields,
        [field]: { ...prev.preChatFields[field], [key]: value },
      },
    }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Endpoint" : "Create Endpoint"} size="4xl">
      <div className="flex flex-col lg:flex-row gap-0">
        {/* ── Left: Form ──────────────────���──────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5 lg:pr-6 overflow-y-auto max-h-[72vh]">
        {/* Logo + Name + Description */}
        <div className="flex gap-4 items-start">
          {/* Logo upload */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <Label className="text-[11px]">Logo</Label>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="relative w-14 h-14 border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 transition-all flex items-center justify-center overflow-hidden group"
              title="Click to upload logo"
            >
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <Bot className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[8px] text-muted-foreground group-hover:text-primary transition-colors font-bold">DEFAULT</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[9px] text-white font-bold">UPLOAD</span>
              </div>
            </button>
            {form.logoUrl && (
              <button
                type="button"
                onClick={() => set("logoUrl", "")}
                className="text-[9px] text-destructive hover:underline font-semibold"
              >
                Remove
              </button>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>

          {/* Name + Description */}
          <div className="flex-1 space-y-3">
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input placeholder="Support Chat" value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-[11px] text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                placeholder="Help visitors with questions about our products…"
                value={form.description}
                onChange={e => set("description", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Launcher Text */}
        <div className="space-y-1.5">
          <Label>Launcher Text</Label>
          <Input placeholder="Chat with us" value={form.launcherText} onChange={e => set("launcherText", e.target.value)} />
        </div>

        {/* ── Brand Color ──────────────────────────────────────────────────── */}
        <div className="space-y-3 border border-border p-4 bg-muted/10">
          {/* Mode tabs */}
          <div className="flex items-center justify-between">
            <Label>Brand Color</Label>
            <div className="flex gap-0.5 p-0.5 bg-muted border border-border">
              {([["solid", "Solid"], ["gradient", "Gradient"], ["image", "Image"]] as [string, string][]).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => set("brandColorMode", mode as "solid" | "gradient" | "image")}
                  className={cn(
                    "px-3 py-1 text-[11px] font-semibold transition-all",
                    form.brandColorMode === mode
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* SOLID mode */}
          {form.brandColorMode === "solid" && (
            <div className="space-y-3">
              {/* Preset swatches */}
              <div className="flex flex-wrap gap-2">
                {PRESET_SOLID_COLORS.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.label}
                    onClick={() => set("brandColor", c.hex)}
                    className={cn(
                      "w-7 h-7 transition-all",
                      form.brandColor === c.hex ? "ring-2 ring-offset-1 ring-primary scale-110" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                {/* Custom picker toggle */}
                <button
                  type="button"
                  onClick={() => setShowCustomPicker(v => !v)}
                  className={cn(
                    "w-7 h-7 border-2 border-dashed flex items-center justify-center text-muted-foreground transition-all hover:scale-110",
                    showCustomPicker ? "border-primary text-primary" : "border-border"
                  )}
                  title="Custom color"
                >
                  <span className="text-[13px] font-bold leading-none">+</span>
                </button>
              </div>
              {/* Custom color picker */}
              {showCustomPicker && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border">
                  <input
                    type="color"
                    value={form.brandColor}
                    onChange={e => set("brandColor", e.target.value)}
                    className="w-9 h-9 border-0 bg-transparent cursor-pointer p-0"
                  />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold text-foreground">Custom Color</p>
                    <p className="text-[11px] font-mono text-muted-foreground">{form.brandColor}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GRADIENT mode */}
          {form.brandColorMode === "gradient" && (
            <div className="space-y-3">
              {/* Preset gradients */}
              <div className="flex flex-wrap gap-2">
                {PRESET_GRADIENTS.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    title={g.label}
                    onClick={() => {
                      set("brandGradientFrom", g.from);
                      set("brandGradientTo",   g.to);
                      set("brandGradientDir",  g.dir);
                    }}
                    className={cn(
                      "w-8 h-8 transition-all",
                      form.brandGradientFrom === g.from && form.brandGradientTo === g.to
                        ? "ring-2 ring-offset-1 ring-primary scale-110"
                        : "hover:scale-110"
                    )}
                    style={{ background: `linear-gradient(${g.dir}, ${g.from}, ${g.to})` }}
                  />
                ))}
              </div>
              {/* Custom from/to */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground">From</p>
                  <div className="flex items-center gap-2 border border-border p-2 bg-background">
                    <input type="color" value={form.brandGradientFrom}
                      onChange={e => set("brandGradientFrom", e.target.value)}
                      className="w-7 h-7 border-0 bg-transparent cursor-pointer p-0"
                    />
                    <span className="text-[11px] font-mono text-foreground">{form.brandGradientFrom}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground">To</p>
                  <div className="flex items-center gap-2 border border-border p-2 bg-background">
                    <input type="color" value={form.brandGradientTo}
                      onChange={e => set("brandGradientTo", e.target.value)}
                      className="w-7 h-7 border-0 bg-transparent cursor-pointer p-0"
                    />
                    <span className="text-[11px] font-mono text-foreground">{form.brandGradientTo}</span>
                  </div>
                </div>
              </div>
              {/* Direction */}
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold text-muted-foreground mr-1">Direction</p>
                {GRADIENT_DIRS.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => set("brandGradientDir", d.value)}
                    className={cn(
                      "w-8 h-8 border text-sm font-bold transition-all",
                      form.brandGradientDir === d.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* IMAGE mode */}
          {form.brandColorMode === "image" && (
            <div className="space-y-3">
              {/* Size guidance */}
              <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-800">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold">Recommended: 800 × 160 px</p>
                  <p className="text-[10px] opacity-80">JPG or PNG · max 2 MB · wide banner crops best in the widget header</p>
                </div>
              </div>

              {/* Drop zone / preview */}
              {form.brandHeaderImage ? (
                <div className="relative border border-border overflow-hidden" style={{ aspectRatio: "5/1" }}>
                  <img
                    src={form.brandHeaderImage}
                    alt="Header"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => headerImgInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white text-[10px] font-bold text-foreground hover:bg-white/90 transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => set("brandHeaderImage", "")}
                      className="px-2.5 py-1 bg-destructive text-[10px] font-bold text-white hover:bg-destructive/90 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => headerImgInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col items-center justify-center gap-2 py-6 group"
                >
                  <div className="w-8 h-8 border-2 border-dashed border-muted-foreground/40 group-hover:border-primary/50 flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-foreground group-hover:text-primary transition-colors">Click to upload header image</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">800 × 160 px recommended</p>
                  </div>
                </button>
              )}
              <input
                ref={headerImgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleHeaderImgUpload}
              />

              {/* Button & Accent Color — independent from header image */}
              <div className="space-y-2 pt-1 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-foreground">Button &amp; Accent Color</p>
                  <span
                    className="w-5 h-5 border border-border/60 shrink-0"
                    style={{ backgroundColor: form.brandColor }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground -mt-1">
                  Used for buttons, send icon, launcher and bot avatar — independent from the header image.
                </p>
                {/* Preset swatches */}
                <div className="flex flex-wrap gap-2">
                  {PRESET_SOLID_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.label}
                      onClick={() => set("brandColor", c.hex)}
                      className={cn(
                        "w-7 h-7 transition-all",
                        form.brandColor === c.hex ? "ring-2 ring-offset-1 ring-primary scale-110" : "hover:scale-110"
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowCustomPicker(v => !v)}
                    className={cn(
                      "w-7 h-7 border-2 border-dashed flex items-center justify-center text-muted-foreground transition-all hover:scale-110",
                      showCustomPicker ? "border-primary text-primary" : "border-border"
                    )}
                    title="Custom color"
                  >
                    <span className="text-[13px] font-bold leading-none">+</span>
                  </button>
                </div>
                {showCustomPicker && (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border">
                    <input
                      type="color"
                      value={form.brandColor}
                      onChange={e => set("brandColor", e.target.value)}
                      className="w-9 h-9 border-0 bg-transparent cursor-pointer p-0"
                    />
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-semibold text-foreground">Custom Color</p>
                      <p className="text-[11px] font-mono text-muted-foreground">{form.brandColor}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Position */}
        <div className="space-y-1.5">
          <Label>Position</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["bottom-right", "bottom-left"] as WidgetPosition[]).map(pos => (
              <button
                key={pos}
                type="button"
                onClick={() => set("position", pos)}
                className={cn(
                  "flex flex-col items-center gap-1.5 border p-3 transition-all text-[11px] font-semibold",
                  form.position === pos
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                <div className="relative w-10 h-7 bg-muted/60 border border-border/60">
                  <div
                    className="absolute w-2.5 h-2.5 rounded-full bottom-0.5"
                    style={{
                      ...getButtonStyle(form),
                      opacity: form.position === pos ? 1 : 0.3,
                      [pos === "bottom-right" ? "right" : "left"]: "2px",
                    }}
                  />
                </div>
                {pos === "bottom-right" ? "Bottom Right" : "Bottom Left"}
              </button>
            ))}
          </div>
        </div>

        {/* Corner Radius */}
        <div className="space-y-3 border border-border p-4 bg-muted/10">
          <div className="flex items-center justify-between">
            <Label>Corner Radius</Label>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-muted border border-border text-foreground">
              {form.cornerRadius}px
            </span>
          </div>
          {/* Preset chips */}
          <div className="grid grid-cols-4 gap-1.5">
            {([
              { label: "Sharp",  value: 0,  preview: 0  },
              { label: "Soft",   value: 8,  preview: 4  },
              { label: "Round",  value: 16, preview: 8  },
              { label: "Pill",   value: 24, preview: 12 },
            ] as const).map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => set("cornerRadius", p.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 border py-2 px-1 transition-all text-[10px] font-semibold",
                  form.cornerRadius === p.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                {/* Mini widget shape preview */}
                <div
                  className="w-8 h-6 border-2 shrink-0"
                  style={{
                    borderRadius: p.preview,
                    borderColor: form.cornerRadius === p.value ? "var(--primary)" : "var(--border)",
                  }}
                />
                {p.label}
              </button>
            ))}
          </div>
          {/* Slider */}
          <input
            type="range"
            min={0}
            max={24}
            step={1}
            value={form.cornerRadius}
            onChange={e => set("cornerRadius", Number(e.target.value))}
            className="w-full accent-primary h-1.5 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
            <span>0</span><span>6</span><span>12</span><span>18</span><span>24</span>
          </div>
        </div>

        {/* Widget Size */}
        <div className="space-y-3 border border-border p-4 bg-muted/10">
          <Label>Chat Widget Size</Label>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {([
              { label: "Small",  w: 320, h: 440 },
              { label: "Medium", w: 380, h: 520 },
              { label: "Large",  w: 440, h: 600 },
            ] as const).map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => { set("widgetWidth", p.w); set("widgetHeight", p.h); }}
                className={cn(
                  "flex flex-col items-center gap-1.5 border py-2 px-1 transition-all text-[10px] font-semibold",
                  form.widgetWidth === p.w && form.widgetHeight === p.h
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                <div
                  className="border-2 shrink-0"
                  style={{
                    width: Math.round(p.w / 14),
                    height: Math.round(p.h / 14),
                    borderRadius: 3,
                    borderColor: form.widgetWidth === p.w && form.widgetHeight === p.h ? "var(--primary)" : "var(--border)",
                  }}
                />
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">Width</span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-muted border border-border text-foreground">{form.widgetWidth}px</span>
              </div>
              <input
                type="range"
                min={280}
                max={500}
                step={10}
                value={form.widgetWidth}
                onChange={e => set("widgetWidth", Number(e.target.value))}
                className="w-full accent-primary h-1.5 cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">Height</span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-muted border border-border text-foreground">{form.widgetHeight}px</span>
              </div>
              <input
                type="range"
                min={360}
                max={700}
                step={10}
                value={form.widgetHeight}
                onChange={e => set("widgetHeight", Number(e.target.value))}
                className="w-full accent-primary h-1.5 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-1.5">
          <Label>Welcome Message</Label>
          <Textarea
            placeholder="Hi! How can we help you today?"
            value={form.welcomeMessage}
            onChange={e => set("welcomeMessage", e.target.value)}
            rows={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Offline Message</Label>
          <Textarea
            placeholder="Our team is currently offline. Leave a message and we'll get back to you."
            value={form.offlineMessage}
            onChange={e => set("offlineMessage", e.target.value)}
            rows={2}
          />
        </div>

        {/* Pre-Chat Form */}
        <div className="space-y-3 border border-border p-4 bg-muted/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Pre-Chat Form</p>
              <p className="text-[11px] text-muted-foreground">Collect visitor info before starting chat</p>
            </div>
            <Switch checked={form.preChatForm} onCheckedChange={v => set("preChatForm", v)} />
          </div>
          {form.preChatForm && (
            <div className="space-y-2 pt-1 border-t border-border">
              {(["name", "email"] as const).map(field => (
                <div key={field} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-foreground">{field}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.preChatFields[field].enabled}
                        onChange={e => setPreChatField(field, "enabled", e.target.checked)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      Enabled
                    </label>
                    <label className={cn(
                      "flex items-center gap-1.5 text-xs cursor-pointer",
                      form.preChatFields[field].enabled
                        ? "text-muted-foreground"
                        : "text-muted-foreground/40 pointer-events-none"
                    )}>
                      <input
                        type="checkbox"
                        checked={form.preChatFields[field].required}
                        onChange={e => setPreChatField(field, "required", e.target.checked)}
                        disabled={!form.preChatFields[field].enabled}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      Required
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Allowed Origins */}
        <div className="space-y-1.5">
          <Label>Allowed Origins</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={originInput}
              onChange={e => setOriginInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOrigin(); } }}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={addOrigin} size="sm">Add</Button>
          </div>
          {form.allowedOrigins.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.allowedOrigins.map(o => (
                <span key={o} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-muted border border-border font-mono">
                  {o}
                  <button onClick={() => removeOrigin(o)} className="ml-1 text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between py-3 border-t border-border">
          <div>
            <p className="text-sm font-semibold text-foreground">Status</p>
            <p className="text-[11px] text-muted-foreground">Enable or disable this widget</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold", form.status === "active" ? "text-emerald-600" : "text-muted-foreground")}>
              {form.status === "active" ? "Active" : "Inactive"}
            </span>
            <Switch
              checked={form.status === "active"}
              onCheckedChange={v => set("status", v ? "active" : "inactive")}
            />
          </div>
        </div>

        {/* Embed Code */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setShowEmbed(v => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Code2 className="w-3.5 h-3.5" />
            {showEmbed ? "Hide" : "Show"} Embed Code
          </button>
          {showEmbed && (
            <div className="relative">
              <pre className="text-xs font-mono bg-muted border border-border p-3 overflow-x-auto whitespace-pre text-foreground">
                {embedCode}
              </pre>
              <button
                onClick={() => { copyToClipboard(embedCode); toast.success("Embed code copied!"); }}
                className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 border border-border transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {isEdit ? "Save Changes" : "Create Endpoint"}
            </Button>
          </div>
        </div>{/* end left col */}

        {/* ── Right: Live Preview ─────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[280px] shrink-0 flex-col gap-3 lg:pl-6 lg:border-l border-border">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Live Preview</p>
            <p className="text-[11px] text-muted-foreground">Updates as you type</p>
          </div>

          {/* Browser mockup */}
          <div className="relative border border-border overflow-hidden bg-slate-100 flex flex-col" style={{ height: 420 }}>
            {/* Browser chrome */}
            <div className="bg-white border-b border-border px-2.5 py-1.5 flex items-center gap-2 shrink-0">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-muted/60 text-[9px] text-muted-foreground px-2 py-0.5 font-mono truncate">
                yoursite.com
              </div>
            </div>

            {/* Page body */}
            <div className="flex-1 relative overflow-hidden">
              {/* Fake page content */}
              <div className="p-3 space-y-2 opacity-30 pointer-events-none select-none">
                <div className="h-3 bg-white rounded w-2/3" />
                <div className="h-2 bg-white rounded w-1/2" />
                <div className="h-2 bg-white rounded w-3/4" />
                <div className="h-6 bg-white/80 rounded w-full mt-3" />
                <div className="h-2 bg-white rounded w-5/6 mt-2" />
                <div className="h-2 bg-white rounded w-2/3" />
                <div className="h-2 bg-white rounded w-3/4" />
                <div className="h-2 bg-white rounded w-1/2 mt-3" />
                <div className="h-2 bg-white rounded w-4/5" />
              </div>

              {/* Widget — slides to the chosen corner */}
              <motion.div
                key={form.position}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "absolute bottom-3 flex flex-col gap-1.5",
                  form.position === "bottom-right" ? "right-3 items-end" : "left-3 items-start"
                )}
              >
                {/* Chat window */}
                <div
                  className="overflow-hidden shadow-xl border border-black/10 bg-white"
                  style={{ borderRadius: form.cornerRadius, width: Math.round(form.widgetWidth / 2), height: Math.round(form.widgetHeight / 2.5) }}
                >
                  {/* Header */}
                  <div
                    className="px-2.5"
                    style={{
                      ...getBrandStyle(form),
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      paddingTop: 10,
                      paddingBottom: 10,
                    }}
                  >
                    {/* Top row: logo + close */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {form.logoUrl ? (
                          <img src={form.logoUrl} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <Bot className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <X className="w-2.5 h-2.5 text-white/60 shrink-0" />
                    </div>
                    {/* Bottom row: name + description */}
                    <div>
                      <p className="text-white text-[11px] font-bold leading-tight truncate">
                        {form.name || "Support Chat"}
                      </p>
                      {form.description && (
                        <p className="text-white/70 text-[8px] leading-tight truncate mt-0.5">
                          {form.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-2.5 space-y-1.5 min-h-[80px]">
                    {form.preChatForm ? (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-foreground">Before we start…</p>
                        {form.preChatFields.name.enabled && (
                          <div
                            className="border border-border/60 bg-muted/30 px-2 py-1 text-[9px] text-muted-foreground"
                            style={{ borderRadius: Math.round(form.cornerRadius * 0.5) }}
                          >
                            Your name{form.preChatFields.name.required ? " *" : ""}
                          </div>
                        )}
                        {form.preChatFields.email.enabled && (
                          <div
                            className="border border-border/60 bg-muted/30 px-2 py-1 text-[9px] text-muted-foreground"
                            style={{ borderRadius: Math.round(form.cornerRadius * 0.5) }}
                          >
                            Email address{form.preChatFields.email.required ? " *" : ""}
                          </div>
                        )}
                        <div
                          className="w-full text-center text-[9px] font-semibold text-white py-1"
                          style={{ ...getButtonStyle(form), borderRadius: form.cornerRadius }}
                        >
                          Start Chat
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-1.5 items-start">
                        <div
                          className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center mt-0.5 overflow-hidden"
                          style={getButtonStyle(form)}
                        >
                          {form.logoUrl ? (
                            <img src={form.logoUrl} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <Bot className="w-2.5 h-2.5 text-white" />
                          )}
                        </div>
                        <div
                          className="bg-muted/60 px-2 py-1.5 max-w-[130px]"
                          style={{
                            borderTopLeftRadius: Math.max(2, Math.round(form.cornerRadius * 0.15)),
                            borderTopRightRadius: form.cornerRadius,
                            borderBottomRightRadius: form.cornerRadius,
                            borderBottomLeftRadius: form.cornerRadius,
                          }}
                        >
                          <p className="text-[9px] text-foreground leading-relaxed">
                            {form.welcomeMessage || "Hi! How can we help you today?"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Composer */}
                  <div className="border-t border-border/40 px-2 py-1.5 flex items-center gap-1">
                    <div
                      className="flex-1 flex items-center gap-0.5 bg-muted/40 px-1.5 py-1"
                      style={{ borderRadius: Math.round(form.cornerRadius * 0.5) }}
                    >
                      <Paperclip className="w-2 h-2 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-[9px] text-muted-foreground px-1">Type a message…</span>
                      <Smile className="w-2 h-2 text-muted-foreground shrink-0" />
                    </div>
                    <div
                      className="w-5 h-5 flex items-center justify-center shrink-0"
                      style={{ ...getButtonStyle(form), borderRadius: Math.round(form.cornerRadius * 0.5) }}
                    >
                      <Send className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Launcher pill */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 shadow-lg text-white text-[10px] font-semibold whitespace-nowrap"
                  style={{ ...getButtonStyle(form), borderRadius: Math.max(form.cornerRadius, 4) * 2 }}
                >
                  <MessageSquare className="w-3 h-3" />
                  {form.launcherText || "Chat with us"}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Hint */}
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={getButtonStyle(form)} />
            Widget anchored to{" "}
            <span className="font-semibold text-foreground">
              {form.position === "bottom-right" ? "bottom-right" : "bottom-left"}
            </span>
          </p>
        </div>{/* end right col */}

      </div>
    </Modal>
  );
}

// ─── Rule Form Modal ───────────────────────────────────────────────────────────

const BLANK_RULE_FORM = {
  name:             "",
  priority:         1,
  sources:          [] as string[],
  audienceMode:     "all"           as AudienceMode,
  allowedGroups:    [] as string[],
  allowedContacts:  [] as string[],
  creationMode:     "auto"          as CreationMode,
  reopenPolicy:     "always_reopen" as ReopenPolicy,
  reopenWindowHours: 24,
  defaultTeam:      "",
  defaultAssignee:  "",
  active:           true,
};

type RuleForm = typeof BLANK_RULE_FORM;

function RuleFormModal({
  isOpen, onClose, rule, onSave, chatEndpoints, groups, teamGroups, users,
}: {
  isOpen: boolean;
  onClose: () => void;
  rule?: ConversationRule | null;
  onSave: (data: RuleForm) => void;
  chatEndpoints: ChatEndpoint[];
  groups: Group[];
  teamGroups: TeamGroup[];
  users: User[];
}) {
  const [form, setForm] = useState<RuleForm>(BLANK_RULE_FORM);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // FIX: reset form every time the modal opens (or the target rule changes)
  useEffect(() => {
    if (!isOpen) return;
    setSourceDropdownOpen(false);
    setContactSearch("");
    if (rule) {
      setForm({
        name:              rule.name,
        priority:          rule.priority,
        sources:           [...rule.sources],
        audienceMode:      rule.audienceMode,
        allowedGroups:     rule.allowedGroups    ? [...rule.allowedGroups]    : [],
        allowedContacts:   rule.allowedContacts  ? [...rule.allowedContacts]  : [],
        creationMode:      rule.creationMode,
        reopenPolicy:      rule.reopenPolicy,
        reopenWindowHours: rule.reopenWindowHours ?? 24,
        defaultTeam:       rule.defaultTeam      ?? "",
        defaultAssignee:   rule.defaultAssignee  ?? "",
        active:            rule.active,
      });
    } else {
      setForm({ ...BLANK_RULE_FORM });
    }
  }, [isOpen, rule?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // FIX: close source dropdown when clicking outside
  useEffect(() => {
    if (!sourceDropdownOpen) return;
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSourceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [sourceDropdownOpen]);

  const isEdit = !!rule;

  const set = (key: keyof RuleForm, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleSource = (id: string) =>
    setForm(prev => ({
      ...prev,
      sources: prev.sources.includes(id)
        ? prev.sources.filter(s => s !== id)
        : [...prev.sources, id],
    }));

  const toggleGroup = (id: string) =>
    setForm(prev => ({
      ...prev,
      allowedGroups: prev.allowedGroups.includes(id)
        ? prev.allowedGroups.filter(g => g !== id)
        : [...prev.allowedGroups, id],
    }));

  const toggleContact = (id: string) =>
    setForm(prev => ({
      ...prev,
      allowedContacts: prev.allowedContacts.includes(id)
        ? prev.allowedContacts.filter(c => c !== id)
        : [...prev.allowedContacts, id],
    }));

  const handleSubmit = () => {
    if (!form.name.trim())          { toast.error("Rule name is required");          return; }
    if (form.sources.length === 0)  { toast.error("Select at least one source");     return; }
    onSave(form);
    onClose();
    toast.success(isEdit ? "Rule updated" : "Rule created");
  };

  const allSourceOptions = [
    ...CHANNEL_SOURCE_OPTIONS,
    ...chatEndpoints.map(ep => ({ id: ep.id, label: ep.name, icon: Bot, color: "text-primary" })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Rule" : "Create Rule"} size="2xl">
      <div className="space-y-5">
        {/* Name + Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Rule Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder="VIP Telegram Support"
              value={form.name}
              onChange={e => set("name", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Input
              type="number"
              min={1}
              value={form.priority}
              onChange={e => set("priority", Number(e.target.value))}
            />
            <p className="text-[10px] text-muted-foreground">Lower = evaluated first</p>
          </div>
        </div>

        {/* Source Targeting */}
        <div className="space-y-1.5">
          <Label>Source Targeting <span className="text-destructive">*</span></Label>
          {/* FIX: attached dropdownRef for click-outside detection */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setSourceDropdownOpen(v => !v)}
              className="w-full flex items-center justify-between border border-border px-3 py-2 text-sm text-left bg-background hover:bg-muted/20 transition-colors"
            >
              <span className={form.sources.length === 0 ? "text-muted-foreground" : "text-foreground"}>
                {form.sources.length === 0
                  ? "Select channels or endpoints..."
                  : `${form.sources.length} source${form.sources.length > 1 ? "s" : ""} selected`}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            {sourceDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 bg-background border border-border shadow-lg mt-1 max-h-52 overflow-y-auto">
                <div className="p-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1">Channels</p>
                  {CHANNEL_SOURCE_OPTIONS.map(opt => (
                    <label key={opt.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/40 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={form.sources.includes(opt.id)}
                        onChange={() => toggleSource(opt.id)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      <opt.icon className={cn("w-3.5 h-3.5", opt.color)} />
                      <span className="text-foreground">{opt.label}</span>
                    </label>
                  ))}
                  {chatEndpoints.length > 0 && (
                    <>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1 mt-1 border-t border-border pt-2">
                        Chat Endpoints
                      </p>
                      {chatEndpoints.map(ep => (
                        <label key={ep.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/40 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={form.sources.includes(ep.id)}
                            onChange={() => toggleSource(ep.id)}
                            className="w-3.5 h-3.5 accent-primary"
                          />
                          <Bot className="w-3.5 h-3.5 text-primary" />
                          <span className="text-foreground">{ep.name}</span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
                <div className="border-t border-border p-2 flex justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setSourceDropdownOpen(false)}>Done</Button>
                </div>
              </div>
            )}
          </div>
          {form.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {form.sources.map(src => {
                const s = allSourceOptions.find(o => o.id === src);
                return s ? (
                  <span key={src} className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 bg-muted border border-border">
                    <s.icon className={cn("w-3 h-3", s.color)} />
                    {s.label}
                    <button onClick={() => toggleSource(src)} className="ml-0.5 hover:text-destructive transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Audience Mode */}
        <div className="space-y-1.5">
          <Label>Audience Mode</Label>
          <select
            value={form.audienceMode}
            onChange={e => set("audienceMode", e.target.value as AudienceMode)}
            className="w-full h-10 border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {AUDIENCE_MODE_OPTIONS.map(o => (
              <option key={o.id} value={o.id}>{o.label} — {o.description}</option>
            ))}
          </select>
        </div>

        {/* Conditional: Specific Groups */}
        {form.audienceMode === "groups" && (
          <div className="space-y-1.5 border border-border p-3 bg-purple-50/30">
            <Label>Allowed Groups</Label>
            <div className="grid grid-cols-2 gap-1">
              {groups.map(g => (
                <label key={g.id} className="flex items-center gap-2 p-2 hover:bg-white/60 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.allowedGroups.includes(g.id)}
                    onChange={() => toggleGroup(g.id)}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  <span className="text-foreground">{g.name}</span>
                  <span className="text-muted-foreground text-[10px]">({g.contactCount})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Conditional: Allowlist */}
        {form.audienceMode === "allowlist" && (
          <div className="space-y-1.5 border border-border p-3 bg-emerald-50/30">
            <Label>Allowed Contacts</Label>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                className="pl-8 text-sm h-9"
              />
            </div>
            <div className="max-h-36 overflow-y-auto space-y-0.5">
              {users
                .filter(u => !contactSearch ||
                  u.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                  u.email.toLowerCase().includes(contactSearch.toLowerCase()))
                .map(u => (
                  <label key={u.id} className="flex items-center gap-2 p-1.5 hover:bg-white/60 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={form.allowedContacts.includes(u.id)}
                      onChange={() => toggleContact(u.id)}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    <span className="text-foreground">{u.name}</span>
                    <span className="text-muted-foreground text-[10px]">{u.email}</span>
                  </label>
                ))}
            </div>
          </div>
        )}

        {/* Creation Mode */}
        <div className="space-y-2">
          <Label>Creation Mode</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(["auto", "manual"] as CreationMode[]).map(mode => (
              <label
                key={mode}
                className={cn(
                  "flex items-start gap-3 border p-3 cursor-pointer transition-colors",
                  form.creationMode === mode ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}
              >
                <input
                  type="radio"
                  name="creationMode"
                  value={mode}
                  checked={form.creationMode === mode}
                  onChange={() => set("creationMode", mode)}
                  className="mt-0.5 accent-primary"
                />
                <div>
                  <p className="text-sm font-semibold capitalize text-foreground">{mode}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {mode === "auto"
                      ? "Conversation created immediately when a message arrives."
                      : "Inbound messages go to a Pending Messages queue."}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Reopen Policy */}
        <div className="space-y-2">
          <Label>Reopen Policy</Label>
          <div className="space-y-1.5">
            {REOPEN_POLICY_OPTIONS.map(opt => (
              <label
                key={opt.id}
                className={cn(
                  "flex items-center gap-3 border p-3 cursor-pointer transition-colors",
                  form.reopenPolicy === opt.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}
              >
                <input
                  type="radio"
                  name="reopenPolicy"
                  value={opt.id}
                  checked={form.reopenPolicy === opt.id}
                  onChange={() => set("reopenPolicy", opt.id)}
                  className="accent-primary"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                  <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
          {form.reopenPolicy === "threshold" && (
            <div className="space-y-1.5 mt-2">
              <Label>Reopen Window (hours)</Label>
              <Input
                type="number"
                min={1}
                value={form.reopenWindowHours}
                onChange={e => set("reopenWindowHours", Number(e.target.value))}
                className="w-32"
              />
            </div>
          )}
        </div>

        {/* Team + Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Default Team</Label>
            <select
              value={form.defaultTeam}
              onChange={e => set("defaultTeam", e.target.value)}
              className="w-full h-10 border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">No default team</option>
              {teamGroups.map(tg => <option key={tg.id} value={tg.id}>{tg.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Default Assignee</Label>
            <select
              value={form.defaultAssignee}
              onChange={e => set("defaultAssignee", e.target.value)}
              className="w-full h-10 border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">No default assignee</option>
              {users.filter(u => u.role !== "viewer").map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between py-3 border-t border-border">
          <div>
            <p className="text-sm font-semibold text-foreground">Rule Active</p>
            <p className="text-[11px] text-muted-foreground">Enable or disable this routing rule</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold", form.active ? "text-emerald-600" : "text-muted-foreground")}>
              {form.active ? "Active" : "Inactive"}
            </span>
            <Switch checked={form.active} onCheckedChange={v => set("active", v)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            {isEdit ? "Save Changes" : "Create Rule"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Widget Preview Overlay ───────────────────────────────────────────────────

function WidgetPreviewOverlay({
  endpoint,
  onClose,
}: {
  endpoint: ChatEndpoint;
  onClose: () => void;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ id: string; text: string; from: "agent" | "user" }[]>([
    { id: "init", text: endpoint.welcomeMessage || "Hi! How can we help you today?", from: "agent" },
  ]);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const EMOJIS = [
    "😀","😂","😍","🥰","😎","😊","🙏","👍","👎","❤️",
    "🔥","✨","🎉","😭","😅","🤔","😱","🙌","💪","👏",
    "😢","😤","🥳","😴","🤩","😇","🤗","😬","🫡","💯",
    "🚀","💬","📎","🎯","✅","❌","⚡","🌟","💡","🎁",
  ];

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const cr  = endpoint.cornerRadius ?? 12;
  const ww  = (endpoint as any).widgetWidth  ?? 380;
  const wh  = (endpoint as any).widgetHeight ?? 520;
  const ep  = endpoint as unknown as BrandForm;

  const sendMessage = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), text: trimmed, from: "user" }]);
    setMessage("");
    // Simulated reply after a short delay
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: "Thanks for reaching out! A team member will be with you shortly.", from: "agent" },
      ]);
    }, 1200);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Top label bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 py-2.5 bg-black/80 text-white z-10 pointer-events-none">
        <div className="flex items-center gap-2.5">
          <Eye className="w-3.5 h-3.5 text-white/60" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/60">Widget Preview</span>
          <span className="text-white/30">·</span>
          <span className="text-xs font-semibold text-white">{endpoint.name || "Untitled Endpoint"}</span>
        </div>
        <button
          className="pointer-events-auto p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Hint at bottom */}
      <div className="absolute bottom-0 inset-x-0 pb-3 flex justify-center pointer-events-none">
        <span className="text-[11px] text-white/40">Click anywhere outside the widget to close</span>
      </div>

      {/* Widget — actual size, anchored to the configured corner */}
      <div
        className={cn(
          "absolute bottom-8 flex flex-col gap-3 pointer-events-auto",
          endpoint.position === "bottom-right" ? "right-6 items-end" : "left-6 items-start"
        )}
      >
        {/* Chat window */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              key="chat-window"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="overflow-hidden shadow-2xl border border-black/10 bg-white flex flex-col"
              style={{ borderRadius: cr, width: ww, height: wh }}
            >
              {/* Header */}
              <div
                className="px-6 shrink-0"
                style={{
                  ...getBrandStyle(ep),
                  borderRadius: cr,
                  paddingTop: 24,
                  paddingBottom: 24,
                }}
              >
                {/* Top row: logo + close */}
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {endpoint.logoUrl
                      ? <img src={endpoint.logoUrl} alt="" className="w-full h-full object-contain" />
                      : <Bot className="w-5 h-5 text-white" />}
                  </div>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="text-white/60 hover:text-white transition-colors p-1 -mr-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Bottom row: name + description */}
                <div>
                  <p className="text-white font-bold text-base leading-tight">
                    {endpoint.name || "Support Chat"}
                  </p>
                  {endpoint.description && (
                    <p className="text-white/70 text-sm mt-1 leading-snug">{endpoint.description}</p>
                  )}
                </div>
              </div>

              {/* Body */}
              {endpoint.preChatForm ? (
                /* Pre-chat form */
                <div className="p-5 space-y-4">
                  <p className="text-sm font-semibold text-foreground">Before we start…</p>
                  {endpoint.preChatFields.name.enabled && (
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground font-medium block">
                        Your name{endpoint.preChatFields.name.required ? " *" : ""}
                      </label>
                      <input
                        type="text"
                        className="w-full border border-border px-3 py-1.5 text-sm bg-background outline-none focus:border-primary transition-colors"
                        style={{ borderRadius: Math.round(cr * 0.5) }}
                        placeholder="Jane Smith"
                      />
                    </div>
                  )}
                  {endpoint.preChatFields.email.enabled && (
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground font-medium block">
                        Email address{endpoint.preChatFields.email.required ? " *" : ""}
                      </label>
                      <input
                        type="email"
                        className="w-full border border-border px-3 py-1.5 text-sm bg-background outline-none focus:border-primary transition-colors"
                        style={{ borderRadius: Math.round(cr * 0.5) }}
                        placeholder="jane@email.com"
                      />
                    </div>
                  )}
                  <button
                    className="w-full py-2.5 text-sm font-semibold text-white"
                    style={{ ...getButtonStyle(ep), borderRadius: cr }}
                  >
                    Start Chat
                  </button>
                </div>
              ) : (
                <>
                  {/* Message list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={cn("flex gap-2 items-end", msg.from === "user" ? "flex-row-reverse" : "flex-row")}
                      >
                        {msg.from === "agent" && (
                          <div
                            className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mb-0.5"
                            style={getButtonStyle(ep)}
                          >
                            <Bot className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "px-3 py-2 max-w-[260px] text-sm leading-relaxed",
                            msg.from === "user" ? "text-white" : "bg-muted/60 text-foreground"
                          )}
                          style={{
                            ...(msg.from === "user" ? getButtonStyle(ep) : {}),
                            ...(msg.from === "agent"
                              ? {
                                  borderTopLeftRadius: cr,
                                  borderTopRightRadius: cr,
                                  borderBottomRightRadius: cr,
                                  borderBottomLeftRadius: Math.max(2, Math.round(cr * 0.15)),
                                }
                              : {
                                  borderTopLeftRadius: cr,
                                  borderTopRightRadius: cr,
                                  borderBottomLeftRadius: cr,
                                  borderBottomRightRadius: Math.max(2, Math.round(cr * 0.15)),
                                }),
                          }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Composer */}
                  <div className="border-t border-border px-3 py-2.5 shrink-0">
                    {/* Emoji picker */}
                    <AnimatePresence>
                      {showEmoji && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.12 }}
                          className="mb-2 p-2 bg-background border border-border shadow-lg grid grid-cols-8 gap-0.5"
                          style={{ borderRadius: Math.round(cr * 0.5) }}
                        >
                          {EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => insertEmoji(emoji)}
                              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-muted transition-colors"
                              style={{ borderRadius: Math.round(cr * 0.3) }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-2">
                      {/* Input wrapper */}
                      <div
                        className="flex-1 flex items-center gap-1 bg-muted/40 px-2 py-1"
                        style={{ borderRadius: Math.round(cr * 0.5) }}
                      >
                        {/* Attachment */}
                        <label
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                          title="Attach file"
                        >
                          <Paperclip className="w-4 h-4" />
                          <input ref={fileInputRef} type="file" className="hidden" />
                        </label>

                        <input
                          ref={inputRef}
                          type="text"
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                          className="flex-1 bg-transparent text-sm py-0.5 outline-none placeholder:text-muted-foreground min-w-0"
                          placeholder="Type a message…"
                          autoFocus
                        />

                        {/* Emoji */}
                        <button
                          onClick={() => setShowEmoji(v => !v)}
                          className={cn(
                            "p-1 transition-colors shrink-0",
                            showEmoji ? "text-primary" : "text-muted-foreground hover:text-foreground"
                          )}
                          title="Emoji"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Send */}
                      <button
                        onClick={sendMessage}
                        className="w-8 h-8 flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
                        style={{ ...getButtonStyle(ep), borderRadius: Math.round(cr * 0.5) }}
                      >
                        <Send className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Launcher button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setChatOpen(v => !v)}
          className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white shadow-xl whitespace-nowrap"
          style={{ ...getButtonStyle(ep), borderRadius: Math.max(cr, 4) * 2 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {chatOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-4 h-4" />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageSquare className="w-4 h-4" />
              </motion.span>
            )}
          </AnimatePresence>
          {chatOpen ? "Close" : (endpoint.launcherText || "Chat with us")}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export const ChatEndpointsView = ({
  chatEndpoints,
  conversationRules,
  users,
  teamGroups,
  groups,
  contacts,
  onAddEndpoint,
  onUpdateEndpoint,
  onDeleteEndpoint,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onReorderRules,
}: ChatEndpointsViewProps) => {
  const [activeTab, setActiveTab] = useState<"endpoints" | "rules">("endpoints");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage]   = useState(1);
  const [pageSize,    setPageSize]       = useState(10);
  const [selectedRows, setSelectedRows]  = useState<Set<string>>(new Set());

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [filterStatus,     setFilterStatus]     = useState<"all" | "active" | "inactive">("all");
  const [filterPosition,   setFilterPosition]   = useState<"all" | "bottom-right" | "bottom-left">("all");
  const [filterPreChat,    setFilterPreChat]    = useState<"all" | "enabled" | "disabled">("all");
  const [filterRestricted, setFilterRestricted] = useState<"all" | "restricted" | "open">("all");

  const hasActiveFilters =
    filterStatus !== "all" || filterPosition !== "all" ||
    filterPreChat !== "all" || filterRestricted !== "all";

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterPosition("all");
    setFilterPreChat("all");
    setFilterRestricted("all");
  };

  const [isEndpointModalOpen, setIsEndpointModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<ChatEndpoint | null>(null);
  const [previewEndpoint, setPreviewEndpoint] = useState<ChatEndpoint | null>(null);

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ConversationRule | null>(null);

  // Local sorted rules list for optimistic DnD reordering
  const [localRules, setLocalRules] = useState<ConversationRule[]>(() =>
    [...conversationRules].sort((a, b) => a.priority - b.priority)
  );

  useEffect(() => {
    setLocalRules([...conversationRules].sort((a, b) => a.priority - b.priority));
  }, [conversationRules]);

  const moveRule = useCallback((dragIndex: number, hoverIndex: number) => {
    setLocalRules(prev => {
      const updated = [...prev];
      const [dragged] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, dragged);
      const reindexed = updated.map((r, i) => ({ ...r, priority: i + 1 }));
      onReorderRules(reindexed);
      return reindexed;
    });
  }, [onReorderRules]);

  const filteredEndpoints = chatEndpoints.filter(ep => {
    const q = searchQuery.toLowerCase();
    if (q && !ep.name.toLowerCase().includes(q) && !ep.publicKey.toLowerCase().includes(q)) return false;
    if (filterStatus !== "all" && ep.status !== filterStatus) return false;
    if (filterPosition !== "all" && ep.position !== filterPosition) return false;
    if (filterPreChat === "enabled"  && !ep.preChatForm) return false;
    if (filterPreChat === "disabled" &&  ep.preChatForm) return false;
    if (filterRestricted === "restricted" && ep.allowedOrigins.length === 0) return false;
    if (filterRestricted === "open"       && ep.allowedOrigins.length >  0) return false;
    return true;
  });

  const filteredRules = localRules.filter(r => {
    const q = searchQuery.toLowerCase();
    return !q || r.name.toLowerCase().includes(q);
  });

  const activeEndpoints       = chatEndpoints.filter(e => e.status === "active").length;
  const inactiveEndpoints     = chatEndpoints.filter(e => e.status === "inactive").length;
  const preChatCount          = chatEndpoints.filter(e => e.preChatForm).length;
  const originRestrictedCount = chatEndpoints.filter(e => e.allowedOrigins.length > 0).length;

  const openCreateEndpoint = () => { setEditingEndpoint(null); setIsEndpointModalOpen(true); };
  const openCreateRule     = () => { setEditingRule(null);     setIsRuleModalOpen(true); };

  // ── Pagination helpers ──────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filteredEndpoints.length / pageSize));
  const safePage    = Math.min(currentPage, totalPages);
  const pageStart   = (safePage - 1) * pageSize;
  const pagedEndpoints = filteredEndpoints.slice(pageStart, pageStart + pageSize);

  const allPageSelected = pagedEndpoints.length > 0 && pagedEndpoints.every(ep => selectedRows.has(ep.id));
  const toggleSelectAll = () => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (allPageSelected) pagedEndpoints.forEach(ep => next.delete(ep.id));
      else pagedEndpoints.forEach(ep => next.add(ep.id));
      return next;
    });
  };
  const toggleRow = (id: string) => setSelectedRows(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const pageNumbers = (() => {
    const pages: (number | "…")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("…");
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("…");
      pages.push(totalPages);
    }
    return pages;
  })();

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 bg-background min-h-full">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button className="hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5" />
          <span>Channels</span>
        </span>
        <span className="text-border">/</span>
        <span className="flex items-center gap-1.5 text-foreground font-medium">
          <Monitor className="w-3.5 h-3.5" />
          <span>Chat Endpoints</span>
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chat Endpoints</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm leading-snug">
            Manage live chat widgets and routing rules for incoming conversations.
          </p>
        </div>
        <Button
          onClick={openCreateEndpoint}
          className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Endpoint
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "TOTAL ENDPOINTS", value: chatEndpoints.length, sub: "all widgets",
            active: filterStatus === "all" && filterPreChat === "all" && filterRestricted === "all",
            onClick: clearFilters,
          },
          {
            label: "ACTIVE", value: activeEndpoints, sub: `${inactiveEndpoints} inactive`,
            active: filterStatus === "active",
            onClick: () => { setFilterStatus(prev => prev === "active" ? "all" : "active"); setCurrentPage(1); },
          },
          {
            label: "PRE-CHAT FORMS", value: preChatCount, sub: "collecting visitor info",
            active: filterPreChat === "enabled",
            onClick: () => { setFilterPreChat(prev => prev === "enabled" ? "all" : "enabled"); setCurrentPage(1); },
          },
          {
            label: "ORIGIN-RESTRICTED", value: originRestrictedCount, sub: "with domain allowlist",
            active: filterRestricted === "restricted",
            onClick: () => { setFilterRestricted(prev => prev === "restricted" ? "all" : "restricted"); setCurrentPage(1); },
          },
        ].map(stat => (
          <div
            key={stat.label}
            onClick={stat.onClick}
            className={cn(
              "cursor-pointer border bg-background p-5 transition-all duration-150 hover:shadow-sm",
              stat.active ? "border-blue-500 ring-1 ring-blue-500" : "border-border"
            )}
          >
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest">{stat.label}</p>
            <p className={cn("text-4xl font-bold mt-1 mb-1", stat.active ? "text-blue-600" : "text-foreground")}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or key..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full h-9 pl-9 pr-3 text-sm border border-border bg-background outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value as typeof filterStatus); setCurrentPage(1); }}
            className="h-9 pl-3 pr-8 text-sm border border-border bg-background appearance-none outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer text-foreground"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>

        {/* Position dropdown */}
        <div className="relative">
          <select
            value={filterPosition}
            onChange={e => { setFilterPosition(e.target.value as typeof filterPosition); setCurrentPage(1); }}
            className="h-9 pl-3 pr-8 text-sm border border-border bg-background appearance-none outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer text-foreground"
          >
            <option value="all">All position</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => { clearFilters(); setCurrentPage(1); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {filteredEndpoints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
          <Monitor className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No chat endpoints found</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {hasActiveFilters || searchQuery ? "Try adjusting your filters." : "Create your first chat widget to get started."}
          </p>
          {!hasActiveFilters && !searchQuery && (
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white" size="sm" onClick={openCreateEndpoint}>
              <Plus className="w-4 h-4 mr-1.5" />
              Create Endpoint
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border overflow-x-auto">
          {/* Table head */}
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Name</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Color</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Public Key</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Position</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Created</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pagedEndpoints.map(ep => {
                const isActive = ep.status === "active";
                return (
                  <tr
                    key={ep.id}
                    className={cn(
                      "hover:bg-muted/20 transition-colors",
                      selectedRows.has(ep.id) && "bg-blue-50/50"
                    )}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(ep.id)}
                        onChange={() => toggleRow(ep.id)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3.5 min-w-[160px]">
                      <p className="text-sm font-semibold text-foreground leading-tight">{ep.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ep.description || ep.launcherText}</p>
                    </td>

                    {/* Color */}
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: ep.brandColor, borderRadius: 4 }}
                      >
                        {ep.brandColor}
                      </span>
                    </td>

                    {/* Status toggle */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onUpdateEndpoint(ep.id, { status: isActive ? "inactive" : "active" });
                            toast.success(isActive ? "Endpoint deactivated" : "Endpoint activated");
                          }}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                            isActive ? "bg-blue-600" : "bg-muted-foreground/30"
                          )}
                          role="switch"
                          aria-checked={isActive}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200",
                              isActive ? "translate-x-4" : "translate-x-0"
                            )}
                          />
                        </button>
                        <span className={cn("text-xs font-bold", isActive ? "text-blue-600" : "text-muted-foreground")}>
                          {isActive ? "ON" : "OFF"}
                        </span>
                      </div>
                    </td>

                    {/* Public Key */}
                    <td className="px-4 py-3.5">
                      <span
                        className="text-xs font-mono text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        title={ep.publicKey}
                        onClick={() => { copyToClipboard(ep.publicKey); toast.success("Key copied!"); }}
                      >
                        {ep.publicKey.slice(0, 18)}...
                      </span>
                    </td>

                    {/* Position */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-muted-foreground">{ep.position}</span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-muted-foreground">
                        {new Date(ep.createdAt).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewEndpoint(ep)}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          title="Live Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { copyToClipboard(generateEmbedCode(ep)); toast.success("Embed code copied!"); }}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy Embed Code"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingEndpoint(ep); setIsEndpointModalOpen(true); }}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { onDeleteEndpoint(ep.id); toast.success("Endpoint deleted"); }}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background flex-wrap gap-3">
            {/* Show per page */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-7 pl-2 pr-6 text-sm border border-border bg-background appearance-none outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-foreground"
                >
                  {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Count */}
            <span className="text-sm text-muted-foreground">
              Showing {filteredEndpoints.length === 0 ? 0 : pageStart + 1} to {Math.min(pageStart + pageSize, filteredEndpoints.length)} of {filteredEndpoints.length} entries
            </span>

            {/* Page controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="flex items-center gap-1 px-2.5 py-1 text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              {pageNumbers.map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-1 text-sm text-muted-foreground">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={cn(
                      "w-8 h-7 text-sm border transition-colors",
                      safePage === p
                        ? "bg-blue-600 text-white border-blue-600 font-semibold"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="flex items-center gap-1 px-2.5 py-1 text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules tab (hidden, accessible via activeTab state if needed) */}
      {activeTab === "rules" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Rules are evaluated in <strong className="text-foreground">priority order — first match wins</strong>.
              Drag the grip handle to reorder.
            </p>
          </div>

          {filteredRules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/10">
              <Bot className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No routing rules yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Rules determine how inbound conversations are created and routed.
              </p>
              <Button className="mt-4" size="sm" onClick={openCreateRule}>
                <Plus className="w-4 h-4 mr-1.5" />
                Create Rule
              </Button>
            </div>
          ) : (
            <DndProvider backend={HTML5Backend}>
              <div className="border border-border divide-y divide-border">
                {filteredRules.map((rule, index) => (
                  <DraggableRuleRow
                    key={rule.id}
                    rule={rule}
                    index={index}
                    moveRule={moveRule}
                    endpoints={chatEndpoints}
                    teamGroups={teamGroups}
                    onEdit={r => { setEditingRule(r); setIsRuleModalOpen(true); }}
                    onToggle={id => {
                      const r = conversationRules.find(x => x.id === id);
                      if (r) {
                        onUpdateRule(id, { active: !r.active });
                        toast.success(r.active ? "Rule deactivated" : "Rule activated");
                      }
                    }}
                    onDelete={id => { onDeleteRule(id); toast.success("Rule deleted"); }}
                  />
                ))}
              </div>
            </DndProvider>
          )}
        </div>
      )}

      {/* Modals */}
      <EndpointFormModal
        isOpen={isEndpointModalOpen}
        onClose={() => { setIsEndpointModalOpen(false); setEditingEndpoint(null); }}
        endpoint={editingEndpoint}
        onSave={data => {
          if (editingEndpoint) {
            onUpdateEndpoint(editingEndpoint.id, data);
          } else {
            onAddEndpoint(data);
          }
        }}
      />

      <RuleFormModal
        isOpen={isRuleModalOpen}
        onClose={() => { setIsRuleModalOpen(false); setEditingRule(null); }}
        rule={editingRule}
        onSave={data => {
          if (editingRule) {
            onUpdateRule(editingRule.id, data);
          } else {
            onAddRule(data);
          }
        }}
        chatEndpoints={chatEndpoints}
        groups={groups}
        teamGroups={teamGroups}
        users={users}
      />

      {/* Live widget preview overlay */}
      <AnimatePresence>
        {previewEndpoint && (
          <motion.div
            key="preview-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <WidgetPreviewOverlay
              endpoint={previewEndpoint}
              onClose={() => setPreviewEndpoint(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};