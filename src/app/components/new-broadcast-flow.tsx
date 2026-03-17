import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Users, 
  Layers, 
  Check, 
  X, 
  MessageSquare,
  Send,
  Clock,
  Sparkles,
  Calendar,
  AlertCircle,
  Megaphone,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Settings,
  Target,
  Layout
} from "lucide-react";
import { cn, type Contact, type Group, type QuickTemplate, type MessagePort } from "./types";
import { DropdownPortSelector, FrequencySelector } from "./shared-ui";

interface NewBroadcastFlowProps {
  onClose: () => void;
  contacts: Contact[];
  groups: Group[];
  templates: QuickTemplate[];
  onSend: (broadcast: any) => void;
}

export const NewBroadcastFlow: React.FC<NewBroadcastFlowProps> = ({ 
  onClose, 
  contacts, 
  groups, 
  templates,
  onSend
}) => {
  const [currentStep, setCurrentStep] = useState<"targets" | "content" | "review">("targets");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [selectedPort, setSelectedPort] = useState<MessagePort>("whatsapp");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [frequency, setFrequency] = useState<any>("once");

  const filteredGroups = useMemo(() => 
    groups.filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [groups, searchQuery]
  );

  const totalRecipients = useMemo(() => {
    // In a real app, we'd calculate unique contacts across selected groups
    return selectedGroupIds.reduce((acc, gid) => {
      const g = groups.find(group => group.id === gid);
      return acc + (g?.contactCount || 0);
    }, 0);
  }, [selectedGroupIds, groups]);

  const toggleGroup = (id: string) => {
    setSelectedGroupIds(prev => 
      prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
    );
  };

  const steps = [
    { id: "targets", label: "Targeting", icon: Target },
    { id: "content", label: "Compose", icon: MessageSquare },
    { id: "review", label: "Review", icon: Layout },
  ];

  const canProceed = () => {
    if (currentStep === "targets") return selectedGroupIds.length > 0;
    if (currentStep === "content") return messageContent.trim().length > 0 && broadcastTitle.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep === "targets") setCurrentStep("content");
    else if (currentStep === "content") setCurrentStep("review");
    else {
      onSend({
        name: broadcastTitle,
        content: messageContent,
        port: selectedPort,
        groupIds: selectedGroupIds,
        isScheduled,
        scheduledAt: isScheduled ? scheduledAt : undefined,
        frequency: isScheduled ? frequency : undefined
      });
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep === "content") setCurrentStep("targets");
    else if (currentStep === "review") setCurrentStep("content");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-8 px-4 relative">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2 -z-10" />
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > idx;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 bg-background px-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border shadow-sm",
                isActive ? "bg-primary text-primary-foreground border-primary scale-110 ring-4 ring-primary/10" : 
                isCompleted ? "bg-primary text-primary-foreground border-primary" : 
                "bg-muted text-muted-foreground border-border"
              )}>
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={cn(
                "text-xs font-bold uppercase tracking-widest",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {currentStep === "targets" && (
            <motion.div 
              key="targets"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">Select Broadcast Targets</h3>
                <p className="text-sm text-muted-foreground">Choose the groups that will receive this broadcast.</p>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search groups by name..."
                  className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-input rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {filteredGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group",
                      selectedGroupIds.includes(group.id) 
                        ? "bg-primary/5 border-primary shadow-sm" 
                        : "bg-card border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center border transition-all",
                        selectedGroupIds.includes(group.id) 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-muted text-muted-foreground border-border"
                      )}>
                        <Layers className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-foreground">{group.name}</span>
                        <span className="text-xs text-muted-foreground">{group.contactCount} active contacts</span>
                      </div>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-md border flex items-center justify-center transition-all",
                      selectedGroupIds.includes(group.id) ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
                    )}>
                      {selectedGroupIds.includes(group.id) && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>

              {selectedGroupIds.length > 0 && (
                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-bold text-primary">{selectedGroupIds.length} Groups Selected</p>
                      <p className="text-xs text-primary/70">Estimated reach: {totalRecipients} recipients</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedGroupIds([])}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {currentStep === "content" && (
            <motion.div 
              key="content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-foreground">Create Broadcast Content</h3>
                <p className="text-sm text-muted-foreground">Define your message and choose the delivery channel.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Broadcast Title</label>
                  <input 
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Monthly Newsletter"
                    className="w-full px-4 py-2.5 bg-muted/30 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <DropdownPortSelector 
                    value={selectedPort}
                    onChange={setSelectedPort}
                    label="Delivery Channel"
                  />
                </div>
              </div>

              <div className="space-y-2 flex-1 flex flex-col">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Message Content</label>
                  <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-md transition-all">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Assist
                  </button>
                </div>
                <div className="relative flex-1 min-h-[250px] flex flex-col">
                  <textarea 
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type your broadcast message here... Use {name} for personalization."
                    className="flex-1 w-full p-4 bg-muted/30 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  />
                  <div className="absolute bottom-4 right-4 flex gap-4 text-xs font-bold text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded-md border border-border">
                    <span>{messageContent.length} chars</span>
                    <span>{Math.ceil(messageContent.length / 160)} parts</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Templates</label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {templates.slice(0, 6).map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => setMessageContent(tmpl.content)}
                      className="shrink-0 px-3 py-1.5 bg-background border border-border rounded-md text-xs font-bold hover:bg-primary/10 hover:border-primary/30 transition-all shadow-sm whitespace-nowrap"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === "review" && (
            <motion.div 
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full space-y-8"
            >
              <div>
                <h3 className="text-lg font-bold text-foreground">Review & Schedule</h3>
                <p className="text-sm text-muted-foreground">Confirm your broadcast details and set a delivery time.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                    <div className="flex items-center gap-3 border-b border-border pb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Broadcast</p>
                        <p className="text-base font-bold text-foreground leading-none">{broadcastTitle}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Channel</span>
                        <span className="font-bold text-foreground capitalize">{selectedPort}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Groups</span>
                        <span className="font-bold text-foreground">{selectedGroupIds.length} groups</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Estimated Reach</span>
                        <span className="font-bold text-foreground">{totalRecipients} recipients</span>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground leading-relaxed italic">"{messageContent}"</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Delivery Schedule</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setIsScheduled(false)}
                        className={cn(
                          "p-4 rounded-lg border-2 text-left transition-all",
                          !isScheduled ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                        )}
                      >
                        <Send className={cn("w-5 h-5 mb-2", !isScheduled ? "text-primary" : "text-muted-foreground")} />
                        <p className="text-sm font-bold text-foreground">Immediate</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-tight">Send right now</p>
                      </button>
                      <button
                        onClick={() => setIsScheduled(true)}
                        className={cn(
                          "p-4 rounded-lg border-2 text-left transition-all",
                          isScheduled ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                        )}
                      >
                        <Clock className={cn("w-5 h-5 mb-2", isScheduled ? "text-primary" : "text-muted-foreground")} />
                        <p className="text-sm font-bold text-foreground">Scheduled</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-tight">Send later</p>
                      </button>
                    </div>
                  </div>

                  {isScheduled && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-6 p-5 bg-muted/20 rounded-xl border border-border shadow-inner"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Send Date & Time</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input 
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </div>
                      <FrequencySelector value={frequency} onChange={setFrequency} />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex items-center justify-between pt-6 border-t border-border">
        <button 
          onClick={onClose}
          className="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-all"
        >
          Cancel
        </button>
        <div className="flex items-center gap-3">
          {currentStep !== "targets" && (
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-2.5 bg-background border border-border rounded-md text-sm font-bold text-foreground hover:bg-muted transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <button 
            onClick={handleNext}
            disabled={!canProceed()}
            className={cn(
              "flex items-center gap-2 px-8 py-2.5 rounded-md text-sm font-bold transition-all shadow-md disabled:opacity-50",
              currentStep === "review" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {currentStep === "review" ? (isScheduled ? "Schedule Broadcast" : "Send Broadcast Now") : "Next Step"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
