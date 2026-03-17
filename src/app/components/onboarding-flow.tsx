import React, { useState, useCallback, useRef } from "react";
import {
  Globe, ArrowRight, ArrowLeft, Check, Building2, Users,
  Zap, Upload, Plus, X,
  ChevronRight, Eye, EyeOff, Radio,
  Rocket, Shield, Clock, CircleCheck,
  TestTube, Loader2, CircleX, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  cn, type ChannelType,
  CHANNEL_TYPES
} from "./types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";

// ---- Types ----

interface OnboardingData {
  // Step 1: Account
  fullName: string;
  email: string;
  password: string;
  // Step 2: Organization
  orgName: string;
  industry: string;
  teamSize: string;
  // Step 3: Channels
  selectedChannels: ChannelType[];
  // Step 4: Channel Config
  channelConfigs: Record<string, Record<string, string>>;
  // Step 5: Contacts
  contactMethod: "skip" | "manual" | "csv";
  manualContacts: { name: string; phone: string; email: string }[];
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

const STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "account", label: "Account" },
  { id: "organization", label: "Organization" },
  { id: "channels", label: "Channels" },
  { id: "configure", label: "Configure" },
  { id: "contacts", label: "Contacts" },
  { id: "ready", label: "Ready" },
];

const INDUSTRIES = [
  "E-commerce", "Healthcare", "Education", "Finance", "Technology",
  "Marketing", "Real Estate", "Non-Profit", "Logistics", "Other"
];

const TEAM_SIZES = [
  { value: "1", label: "Just me" },
  { value: "2-5", label: "2–5 people" },
  { value: "6-20", label: "6–20 people" },
  { value: "21-50", label: "21–50 people" },
  { value: "50+", label: "50+ people" },
];

// Channel-specific config fields
const CHANNEL_CONFIG_FIELDS: Record<ChannelType, { key: string; label: string; placeholder: string; type?: string }[]> = {
  whatsapp: [
    { key: "phoneNumber", label: "Business Phone Number", placeholder: "+1 555-0100" },
    { key: "businessId", label: "WhatsApp Business ID", placeholder: "waba-123456" },
  ],
  sms: [
    { key: "provider", label: "SMS Provider", placeholder: "e.g. Twilio, Vonage, Africa's Talking" },
    { key: "accountSid", label: "Account SID / API Key", placeholder: "AC..." },
    { key: "authToken", label: "Auth Token", placeholder: "••••••••", type: "password" },
  ],
  email: [
    { key: "smtpHost", label: "SMTP Host", placeholder: "smtp.yourcompany.com" },
    { key: "smtpPort", label: "SMTP Port", placeholder: "587" },
    { key: "emailAddress", label: "Email Address", placeholder: "support@yourcompany.com" },
  ],
  telegram: [
    { key: "botToken", label: "Bot Token (from @BotFather)", placeholder: "123456:ABC-DEF..." },
    { key: "botUsername", label: "Bot Username", placeholder: "@YourBot" },
  ],
  messenger: [
    { key: "pageId", label: "Facebook Page ID", placeholder: "123456789" },
    { key: "accessToken", label: "Page Access Token", placeholder: "EAABs...", type: "password" },
  ],
  smpp: [
    { key: "host", label: "SMSC Host", placeholder: "smsc.provider.com" },
    { key: "port", label: "SMSC Port", placeholder: "2775" },
    { key: "systemId", label: "System ID", placeholder: "your_system_id" },
    { key: "password", label: "Password", placeholder: "••••••••", type: "password" },
  ],
};

// ---- Component ----

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    fullName: "",
    email: "",
    password: "",
    orgName: "",
    industry: "",
    teamSize: "",
    selectedChannels: [],
    channelConfigs: {},
    contactMethod: "skip",
    manualContacts: [{ name: "", phone: "", email: "" }],
  });

  // Active channel being configured (index into selectedChannels)
  const [activeChannelIdx, setActiveChannelIdx] = useState(0);

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: return true; // Welcome
      case 1: return data.fullName.trim().length >= 2 && data.email.includes("@") && data.password.length >= 6;
      case 2: return data.orgName.trim().length >= 2 && data.industry !== "" && data.teamSize !== "";
      case 3: return data.selectedChannels.length > 0;
      case 4: return true; // Config is optional — they can fill later
      case 5: return true; // Contacts step is optional
      case 6: return true; // Ready
      default: return true;
    }
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      // Skip configure step if no channels selected
      if (currentStep === 3 && data.selectedChannels.length === 0) {
        setCurrentStep(5);
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      if (currentStep === 5 && data.selectedChannels.length === 0) {
        setCurrentStep(3);
      } else {
        setCurrentStep(prev => prev - 1);
      }
    }
  };

  const toggleChannel = (id: ChannelType) => {
    setData(prev => {
      const exists = prev.selectedChannels.includes(id);
      const newChannels = exists
        ? prev.selectedChannels.filter(c => c !== id)
        : [...prev.selectedChannels, id];
      return { ...prev, selectedChannels: newChannels };
    });
  };

  const updateChannelConfig = (channelType: ChannelType, key: string, value: string) => {
    setData(prev => ({
      ...prev,
      channelConfigs: {
        ...prev.channelConfigs,
        [channelType]: {
          ...(prev.channelConfigs[channelType] || {}),
          [key]: value,
        }
      }
    }));
  };

  const addManualContact = () => {
    setData(prev => ({
      ...prev,
      manualContacts: [...prev.manualContacts, { name: "", phone: "", email: "" }]
    }));
  };

  const updateManualContact = (index: number, field: string, value: string) => {
    setData(prev => {
      const updated = [...prev.manualContacts];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, manualContacts: updated };
    });
  };

  const removeManualContact = (index: number) => {
    setData(prev => ({
      ...prev,
      manualContacts: prev.manualContacts.filter((_, i) => i !== index)
    }));
  };

  const progressPercent = Math.round((currentStep / (STEPS.length - 1)) * 100);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const contacts = results.data.map((row: any) => ({
            name: row.name || "",
            phone: row.phone || "",
            email: row.email || ""
          }));
          updateData({ manualContacts: contacts });
          toast.success("Contacts imported successfully!");
        },
        error: (error) => {
          toast.error("Failed to import contacts. Please check the file format.");
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden">
      {/* Top Bar */}
      {currentStep > 0 && currentStep < STEPS.length - 1 && (
        <div className="h-1.5 bg-muted w-full shrink-0">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      )}

      {/* Header */}
      {currentStep > 0 && currentStep < STEPS.length - 1 && (
        <header className="h-16 border-b border-border px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">Turumba</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {STEPS.slice(1, -1).map((step, i) => {
              const stepIdx = i + 1;
              const isActive = currentStep === stepIdx;
              const isDone = currentStep > stepIdx;
              return (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-all",
                    isDone ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground/50"
                  )}>
                    <div className={cn(
                      "w-5 h-5 flex items-center justify-center text-xs font-bold border transition-all",
                      isDone ? "bg-primary text-primary-foreground border-primary" :
                      isActive ? "border-foreground text-foreground" : "border-muted-foreground/30 text-muted-foreground/50"
                    )}>
                      {isDone ? <Check className="w-3 h-3" /> : stepIdx}
                    </div>
                    <span className="hidden lg:inline">{step.label}</span>
                  </div>
                  {i < STEPS.length - 3 && (
                    <ChevronRight className="w-3 h-3 text-muted-foreground/30 mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            Step {currentStep} of {STEPS.length - 2}
          </div>
        </header>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full"
          >
            {currentStep === 0 && (
              <WelcomeStep onGetStarted={next} onSkip={() => onComplete(data)} />
            )}
            {currentStep === 1 && (
              <AccountStep
                data={data}
                updateData={updateData}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
            )}
            {currentStep === 2 && (
              <OrganizationStep data={data} updateData={updateData} />
            )}
            {currentStep === 3 && (
              <ChannelSelectStep
                selectedChannels={data.selectedChannels}
                onToggle={toggleChannel}
              />
            )}
            {currentStep === 4 && (
              <ChannelConfigStep
                selectedChannels={data.selectedChannels}
                configs={data.channelConfigs}
                onUpdateConfig={updateChannelConfig}
                activeIdx={activeChannelIdx}
                setActiveIdx={setActiveChannelIdx}
              />
            )}
            {currentStep === 5 && (
              <ContactsStep
                data={data}
                updateData={updateData}
                onAddContact={addManualContact}
                onUpdateContact={updateManualContact}
                onRemoveContact={removeManualContact}
                handleCSVUpload={handleCSVUpload}
                fileInputRef={fileInputRef}
              />
            )}
            {currentStep === 6 && (
              <ReadyStep data={data} onFinish={() => onComplete(data)} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      {currentStep > 0 && currentStep < STEPS.length - 1 && (
        <footer className="h-20 border-t border-border px-6 flex items-center justify-between shrink-0 bg-background">
          <Button variant="ghost" onClick={prev} disabled={currentStep <= 1}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            {(currentStep === 4 || currentStep === 5) && (
              <Button variant="ghost" className="text-muted-foreground" onClick={next}>
                Skip for now
              </Button>
            )}
            <Button onClick={next} disabled={!canProceed()}>
              {currentStep === STEPS.length - 2 ? "Finish Setup" : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
};


// ===== STEP COMPONENTS =====


// --- Step 0: Welcome ---
const WelcomeStep = ({ onGetStarted, onSkip }: { onGetStarted: () => void; onSkip: () => void }) => (
  <div className="h-full flex">
    {/* Left: Content */}
    <div className="flex-1 flex flex-col items-center justify-center px-8 lg:px-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="max-w-lg w-full text-center"
      >
        <div className="w-16 h-16 bg-primary flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Globe className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
          Welcome to Turumba
        </h1>
        <p className="text-lg text-muted-foreground mb-3 leading-relaxed">
          The multi-channel message automation platform for teams that want to communicate smarter.
        </p>
        <p className="text-sm text-muted-foreground/70 mb-10 max-w-md mx-auto">
          Connect WhatsApp, SMS, Telegram, Email and more — all in one place. Automate messages, manage contacts, and track delivery across every channel.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: Radio, label: "Multi-Channel", desc: "6+ messaging platforms" },
            { icon: Zap, label: "Automation", desc: "Rules, triggers & webhooks" },
            { icon: Users, label: "Team Ready", desc: "Roles & permissions" },
          ].map((feature) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 border border-border bg-card text-center"
            >
              <feature.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs font-bold text-foreground">{feature.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <Button size="lg" className="px-10 h-12 text-sm font-bold" onClick={onGetStarted}>
          Get Started
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground mt-4">Free to start. No credit card required.</p>
        <button
          onClick={onSkip}
          className="block mx-auto mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          I've done this before — skip setup
        </button>
      </motion.div>
    </div>

    {/* Right: Visual */}
    <div className="hidden lg:flex w-[420px] bg-primary/5 border-l border-border items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="relative z-10 space-y-4 p-10">
        {[
          { ch: "WhatsApp", status: "Connected", color: "bg-emerald-500" },
          { ch: "SMS Gateway", status: "Ready", color: "bg-blue-500" },
          { ch: "Telegram Bot", status: "Connected", color: "bg-sky-500" },
          { ch: "Email SMTP", status: "Pending", color: "bg-purple-500" },
        ].map((item, i) => (
          <motion.div
            key={item.ch}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
            className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-border p-3.5 shadow-sm"
          >
            <div className={cn("w-2 h-2 rounded-full shrink-0", item.color)} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{item.ch}</p>
              <p className="text-xs text-muted-foreground">{item.status}</p>
            </div>
            <Check className="w-4 h-4 text-emerald-500" />
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center pt-4"
        >
          <p className="text-xs text-muted-foreground font-medium">Your channels, one dashboard</p>
        </motion.div>
      </div>
    </div>
  </div>
);


// --- Step 1: Account ---
const AccountStep = ({ data, updateData, showPassword, setShowPassword }: {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
}) => (
  <div className="max-w-md mx-auto py-16 px-6">
    <div className="text-center mb-10">
      <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
        <Shield className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h2>
      <p className="text-sm text-muted-foreground mt-2">Let's start with your personal details.</p>
    </div>
    <div className="space-y-5">
      <div className="grid gap-2">
        <Label className="text-xs font-semibold">Full Name</Label>
        <Input
          placeholder="Jane Smith"
          value={data.fullName}
          onChange={(e) => updateData({ fullName: e.target.value })}
          className="h-11"
        />
      </div>
      <div className="grid gap-2">
        <Label className="text-xs font-semibold">Email Address</Label>
        <Input
          type="email"
          placeholder="you@company.com"
          value={data.email}
          onChange={(e) => updateData({ email: e.target.value })}
          className="h-11"
        />
      </div>
      <div className="grid gap-2">
        <Label className="text-xs font-semibold">Password</Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Min. 6 characters"
            value={data.password}
            onChange={(e) => updateData({ password: e.target.value })}
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex gap-1 mt-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 transition-all",
                data.password.length >= i * 2
                  ? data.password.length >= 8 ? "bg-emerald-500" : data.password.length >= 6 ? "bg-amber-500" : "bg-destructive"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center pt-2">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  </div>
);


// --- Step 2: Organization ---
const OrganizationStep = ({ data, updateData }: {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
}) => (
  <div className="max-w-lg mx-auto py-16 px-6">
    <div className="text-center mb-10">
      <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
        <Building2 className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Set up your organization</h2>
      <p className="text-sm text-muted-foreground mt-2">This is the workspace where your team will collaborate.</p>
    </div>
    <div className="space-y-6">
      <div className="grid gap-2">
        <Label className="text-xs font-semibold">Organization Name</Label>
        <Input
          placeholder="Acme Corp"
          value={data.orgName}
          onChange={(e) => updateData({ orgName: e.target.value })}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">This will appear as your sender identity on some channels.</p>
      </div>

      <div className="grid gap-2">
        <Label className="text-xs font-semibold">Industry</Label>
        <div className="grid grid-cols-2 gap-2">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              onClick={() => updateData({ industry: ind })}
              className={cn(
                "px-3 py-2.5 border text-xs font-medium text-left transition-all",
                data.industry === ind
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              )}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label className="text-xs font-semibold">Team Size</Label>
        <div className="flex gap-2 flex-wrap">
          {TEAM_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => updateData({ teamSize: size.value })}
              className={cn(
                "px-4 py-2.5 border text-xs font-medium transition-all",
                data.teamSize === size.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              )}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);


// --- Step 3: Channel Selection ---
const ChannelSelectStep = ({ selectedChannels, onToggle }: {
  selectedChannels: ChannelType[];
  onToggle: (id: ChannelType) => void;
}) => (
  <div className="max-w-2xl mx-auto py-16 px-6">
    <div className="text-center mb-10">
      <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
        <Radio className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Connect your channels</h2>
      <p className="text-sm text-muted-foreground mt-2">Which messaging platforms do you want to use? Select one or more.</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {CHANNEL_TYPES.map((ct) => {
        const isSelected = selectedChannels.includes(ct.id);
        return (
          <button
            key={ct.id}
            onClick={() => onToggle(ct.id)}
            className={cn(
              "flex items-center gap-4 p-5 border text-left transition-all group relative",
              isSelected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/30 hover:bg-muted/20"
            )}
          >
            {/* Checkbox indicator */}
            <div className={cn(
              "absolute top-3 right-3 w-5 h-5 flex items-center justify-center border transition-all",
              isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
            )}>
              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>

            <div className={cn("w-12 h-12 flex items-center justify-center shrink-0 border", ct.bgColor, ct.borderColor)}>
              <ct.icon className={cn("w-6 h-6", ct.color)} />
            </div>
            <div>
              <p className={cn("text-sm font-bold transition-all", isSelected ? "text-foreground" : "text-foreground")}>
                {ct.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{ct.description}</p>
            </div>
          </button>
        );
      })}
    </div>

    <div className="text-center mt-8">
      <p className="text-xs text-muted-foreground">
        You can always add or remove channels later from Settings &rarr; Channels.
      </p>
    </div>
  </div>
);


// --- Step 4: Channel Configuration ---
const ChannelConfigStep = ({ selectedChannels, configs, onUpdateConfig, activeIdx, setActiveIdx }: {
  selectedChannels: ChannelType[];
  configs: Record<string, Record<string, string>>;
  onUpdateConfig: (ch: ChannelType, key: string, val: string) => void;
  activeIdx: number;
  setActiveIdx: (i: number) => void;
}) => {
  const activeChannel = selectedChannels[activeIdx] || selectedChannels[0];
  const channelInfo = CHANNEL_TYPES.find(c => c.id === activeChannel);
  const fields = activeChannel ? CHANNEL_CONFIG_FIELDS[activeChannel] : [];
  const channelConfig = configs[activeChannel] || {};

  // Test connection state per channel
  const [testStatus, setTestStatus] = useState<Record<string, "idle" | "testing" | "success" | "failed">>({});
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const runTest = (chType: ChannelType) => {
    const config = configs[chType] || {};
    const hasCredentials = Object.values(config).some(v => v && v.trim().length > 0);

    setTestStatus(prev => ({ ...prev, [chType]: "testing" }));

    // Clear any existing timers for this channel
    timersRef.current.forEach(t => clearTimeout(t));

    const timer = setTimeout(() => {
      if (hasCredentials) {
        setTestStatus(prev => ({ ...prev, [chType]: "success" }));
        toast.success(`${CHANNEL_TYPES.find(c => c.id === chType)?.label} connection verified`);
      } else {
        setTestStatus(prev => ({ ...prev, [chType]: "failed" }));
        toast.error("Connection failed — please enter your credentials first");
      }
    }, 1500 + Math.random() * 1000);

    timersRef.current.push(timer);
  };

  const currentTestStatus = testStatus[activeChannel] || "idle";

  return (
    <div className="max-w-2xl mx-auto py-16 px-6">
      <div className="text-center mb-10">
        <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Configure your channels</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Enter the credentials for each channel. You can also do this later.
        </p>
      </div>

      {/* Channel tabs */}
      {selectedChannels.length > 1 && (
        <div className="flex gap-1.5 p-1 bg-muted border border-border mb-8 overflow-x-auto">
          {selectedChannels.map((chId, i) => {
            const info = CHANNEL_TYPES.find(c => c.id === chId);
            const isActive = i === activeIdx;
            const config = configs[chId] || {};
            const hasConfig = Object.values(config).some(v => v.trim());
            const chTestStatus = testStatus[chId] || "idle";
            return (
              <button
                key={chId}
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap shrink-0",
                  isActive ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {info && <info.icon className="w-3.5 h-3.5" />}
                {info?.label}
                {chTestStatus === "success" ? (
                  <CircleCheck className="w-3 h-3 text-emerald-500" />
                ) : chTestStatus === "failed" ? (
                  <CircleX className="w-3 h-3 text-destructive" />
                ) : hasConfig ? (
                  <CircleCheck className="w-3 h-3 text-emerald-500/50" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {/* Config form */}
      {channelInfo && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={cn("w-10 h-10 flex items-center justify-center border", channelInfo.bgColor, channelInfo.borderColor)}>
                <channelInfo.icon className={cn("w-5 h-5", channelInfo.color)} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{channelInfo.label}</p>
                <p className="text-xs text-muted-foreground">{channelInfo.description}</p>
              </div>
              {/* Test Connection status indicator */}
              {currentTestStatus === "success" && (
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <CircleCheck className="w-4 h-4" />
                  <span className="text-xs font-semibold">Connected</span>
                </div>
              )}
              {currentTestStatus === "failed" && (
                <div className="flex items-center gap-1.5 text-destructive">
                  <CircleX className="w-4 h-4" />
                  <span className="text-xs font-semibold">Failed</span>
                </div>
              )}
            </div>

            <Separator className="mb-6" />

            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key} className="grid gap-2">
                  <Label className="text-xs font-semibold">{field.label}</Label>
                  <Input
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={channelConfig[field.key] || ""}
                    onChange={(e) => onUpdateConfig(activeChannel, field.key, e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              ))}
            </div>

            {/* Test Connection button */}
            <div className="mt-6 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runTest(activeChannel)}
                disabled={currentTestStatus === "testing"}
              >
                {currentTestStatus === "testing" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="w-3.5 h-3.5 mr-1.5" />
                    Test Connection
                  </>
                )}
              </Button>
              {currentTestStatus === "success" && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-emerald-600 font-medium"
                >
                  All checks passed
                </motion.span>
              )}
              {currentTestStatus === "failed" && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-destructive font-medium"
                >
                  Check credentials and try again
                </motion.span>
              )}
            </div>

            {/* Test result banner */}
            <AnimatePresence>
              {currentTestStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3 bg-emerald-50 border border-emerald-200 overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <CircleCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-xs text-emerald-700">
                      <span className="font-semibold">Connection successful!</span> Your {channelInfo.label} credentials are valid and ready to use.
                    </p>
                  </div>
                </motion.div>
              )}
              {currentTestStatus === "failed" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3 bg-destructive/5 border border-destructive/20 overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <p className="text-xs text-destructive">
                      <span className="font-semibold">Connection failed.</span> Please verify your {channelInfo.label} credentials and try again. You can also skip and configure later.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 p-3 bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Tip:</span> You don't need to fill these in right now. You can configure channel credentials at any time from the Channels settings page.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


// --- Step 5: Contacts ---
const ContactsStep = ({ data, updateData, onAddContact, onUpdateContact, onRemoveContact, handleCSVUpload, fileInputRef }: {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
  onAddContact: () => void;
  onUpdateContact: (i: number, field: string, val: string) => void;
  onRemoveContact: (i: number) => void;
  handleCSVUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) => (
  <div className="max-w-xl mx-auto py-16 px-6">
    <div className="text-center mb-10">
      <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
        <Users className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Add your first contacts</h2>
      <p className="text-sm text-muted-foreground mt-2">Import contacts or add a few manually to get started.</p>
    </div>

    {/* Method selector */}
    <div className="grid grid-cols-3 gap-3 mb-8">
      {[
        { id: "manual" as const, icon: Plus, label: "Add Manually", desc: "Type in contacts" },
        { id: "csv" as const, icon: Upload, label: "Upload CSV", desc: "Bulk import file" },
        { id: "skip" as const, icon: Clock, label: "Do It Later", desc: "Skip for now" },
      ].map((method) => (
        <button
          key={method.id}
          onClick={() => updateData({ contactMethod: method.id })}
          className={cn(
            "flex flex-col items-center gap-2 p-4 border text-center transition-all",
            data.contactMethod === method.id
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/30"
          )}
        >
          <method.icon className={cn("w-5 h-5", data.contactMethod === method.id ? "text-primary" : "text-muted-foreground")} />
          <div>
            <p className="text-xs font-bold text-foreground">{method.label}</p>
            <p className="text-xs text-muted-foreground">{method.desc}</p>
          </div>
        </button>
      ))}
    </div>

    {/* Manual entry */}
    {data.contactMethod === "manual" && (
      <div className="space-y-3">
        {data.manualContacts.map((contact, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Contact {i + 1}</span>
                {data.manualContacts.length > 1 && (
                  <button onClick={() => onRemoveContact(i)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Name"
                  value={contact.name}
                  onChange={(e) => onUpdateContact(i, "name", e.target.value)}
                  className="h-9 text-sm"
                />
                <Input
                  placeholder="Phone"
                  value={contact.phone}
                  onChange={(e) => onUpdateContact(i, "phone", e.target.value)}
                  className="h-9 text-sm"
                />
                <Input
                  placeholder="Email"
                  value={contact.email}
                  onChange={(e) => onUpdateContact(i, "email", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" size="sm" onClick={onAddContact} className="w-full">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Another Contact
        </Button>
      </div>
    )}

    {/* CSV upload */}
    {data.contactMethod === "csv" && (
      <Card>
        <CardContent className="p-8">
          <div className="border-2 border-dashed border-border p-10 text-center hover:border-primary/40 transition-all cursor-pointer">
            <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">Drop your CSV file here</p>
            <p className="text-xs text-muted-foreground mb-4">or click to browse. Columns: name, phone, email</p>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Browse Files
            </Button>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleCSVUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>
    )}

    {/* Skip */}
    {data.contactMethod === "skip" && (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground mb-1">No worries!</p>
          <p className="text-xs text-muted-foreground">You can import contacts anytime from the Contacts page.</p>
        </CardContent>
      </Card>
    )}
  </div>
);


// --- Step 6: Ready ---
const ReadyStep = ({ data, onFinish }: { data: OnboardingData; onFinish: () => void }) => {
  const channelCount = data.selectedChannels.length;
  const contactCount = data.contactMethod === "manual"
    ? data.manualContacts.filter(c => c.name.trim()).length
    : 0;

  return (
    <div className="h-full flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-primary flex items-center justify-center mx-auto mb-8 shadow-lg"
        >
          <Rocket className="w-10 h-10 text-primary-foreground" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold tracking-tight text-foreground mb-3"
        >
          You're all set, {data.fullName.split(" ")[0] || "there"}!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-8"
        >
          {data.orgName} is ready to go. Here's a summary of your setup:
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 mb-10"
        >
          <div className="flex items-center justify-between p-4 border bg-card text-left">
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Organization</span>
            </div>
            <span className="text-sm text-muted-foreground">{data.orgName}</span>
          </div>
          <div className="flex items-center justify-between p-4 border bg-card text-left">
            <div className="flex items-center gap-3">
              <Radio className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Channels</span>
            </div>
            <div className="flex items-center gap-1.5">
              {data.selectedChannels.map(chId => {
                const info = CHANNEL_TYPES.find(c => c.id === chId);
                return info ? (
                  <div key={chId} className={cn("w-7 h-7 flex items-center justify-center border", info.bgColor, info.borderColor)}>
                    <info.icon className={cn("w-3.5 h-3.5", info.color)} />
                  </div>
                ) : null;
              })}
              {channelCount === 0 && <span className="text-xs text-muted-foreground">None yet</span>}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border bg-card text-left">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Contacts</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {contactCount > 0 ? `${contactCount} added` : "Import later"}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button size="lg" className="px-12 h-12 text-sm font-bold" onClick={onFinish}>
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};