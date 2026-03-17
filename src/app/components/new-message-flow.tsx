import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Users, 
  User, 
  Layers, 
  Check, 
  X, 
  Plus, 
  Sparkles, 
  Send, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Calendar,
  MessageSquare,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { cn } from "./types";

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags?: string[];
}

interface Group {
  id: string;
  name: string;
  contactCount: number;
  description?: string;
}

interface Template {
  id: string;
  name: string;
  content: string;
}

interface NewMessageFlowProps {
  onClose: () => void;
  contacts: Contact[];
  groups: Group[];
  templates: Template[];
  onCreateGroup?: (name: string, description: string, contactIds: string[]) => void;
}

const DropdownPortSelector = ({ value, onChange, label }: { value: string, onChange: (v: string) => void, label: string }) => {
  const ports = ["Port 1 (Marketing)", "Port 2 (Transactional)", "Port 3 (Alerts)"];
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">{label}</label>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background focus:ring-1 focus:ring-ring outline-none transition-all shadow-sm"
      >
        {ports.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  );
};

const FrequencySelector = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
  const options = ["One-time", "Daily", "Weekly", "Monthly"];
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Repeat</label>
      <div className="flex bg-muted p-1 rounded-md border border-input">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all",
              value === opt ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export const NewMessageFlow: React.FC<NewMessageFlowProps> = ({ 
  onClose, 
  contacts, 
  groups, 
  templates,
  onCreateGroup 
}) => {
  const [currentStep, setCurrentStep] = useState<"recipients" | "compose" | "schedule">("recipients");
  const [viewMode, setViewMode] = useState<"contacts" | "groups">("contacts");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [selectedPort, setSelectedPort] = useState("Port 1 (Marketing)");
  const [sendType, setSendType] = useState<"broadcast" | "individual">("broadcast");
  const [broadcastName, setBroadcastName] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [frequency, setFrequency] = useState("One-time");
  const [isNamingGroup, setIsNamingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const filteredContacts = useMemo(() => 
    contacts.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery)
    ), [contacts, searchQuery]
  );

  const filteredGroups = useMemo(() => 
    groups.filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [groups, searchQuery]
  );

  const totalRecipientsCount = useMemo(() => {
    const contactSet = new Set(selectedContactIds);
    // In a real app, we'd add contacts from selected groups too
    return contactSet.size + (selectedGroupIds.length * 50); // Mocking group size
  }, [selectedContactIds, selectedGroupIds]);

  const toggleContact = (id: string) => {
    setSelectedContactIds(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds(prev => 
      prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
    );
  };

  const steps = [
    { id: "recipients", label: "Recipients", icon: Users },
    { id: "compose", label: "Message", icon: MessageSquare },
    { id: "schedule", label: "Delivery", icon: Send },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Step Indicator */}
      <div className="flex items-center justify-between relative mb-10 px-2">
        <div className="absolute top-5 left-0 right-0 h-px bg-border -z-0" />
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > idx;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border bg-background",
                isActive ? "border-primary bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/10" : 
                isCompleted ? "border-primary bg-primary text-primary-foreground shadow-sm" : 
                "border-input text-muted-foreground"
              )}>
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {currentStep === "recipients" && (
            <motion.div 
              key="recipients"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full overflow-hidden"
            >
              {/* Search & View Toggle */}
              <div className="flex flex-col gap-4 mb-6 px-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${viewMode === "contacts" ? "contacts" : "groups"}...`}
                    className="w-full pl-9 pr-4 py-2.5 bg-background border border-input rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all shadow-sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex p-1 bg-muted/50 rounded-lg border border-border">
                    <button 
                      onClick={() => setViewMode("contacts")}
                      className={cn(
                        "px-5 py-1.5 rounded-md text-xs font-bold transition-all",
                        viewMode === "contacts" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Contacts
                    </button>
                    <button 
                      onClick={() => setViewMode("groups")}
                      className={cn(
                        "px-5 py-1.5 rounded-md text-xs font-bold transition-all",
                        viewMode === "groups" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Groups
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (viewMode === "contacts") {
                        const allIds = filteredContacts.map(c => c.id);
                        setSelectedContactIds(prev => prev.length === allIds.length ? [] : allIds);
                      } else {
                        const allIds = filteredGroups.map(g => g.id);
                        setSelectedGroupIds(prev => prev.length === allIds.length ? [] : allIds);
                      }
                    }}
                    className="text-xs font-bold text-primary hover:underline underline-offset-4 px-3 py-1.5 rounded-md transition-all"
                  >
                    { (viewMode === "contacts" ? selectedContactIds.length : selectedGroupIds.length) === (viewMode === "contacts" ? filteredContacts.length : filteredGroups.length) 
                      ? "Deselect All" 
                      : "Select All"
                    }
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {totalRecipientsCount > 1 && (
                  <div className="mb-6 bg-muted/30 p-4 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          Multi-Recipient Sending
                        </p>
                        <p className="text-xs text-muted-foreground">Delivery mode for {totalRecipientsCount} recipients</p>
                      </div>
                      <div className="flex bg-muted p-1 rounded-md border border-input">
                        <button 
                          onClick={() => setSendType("broadcast")}
                          className={cn(
                            "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all",
                            sendType === "broadcast" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground"
                          )}
                        >
                          Group
                        </button>
                        <button 
                          onClick={() => setSendType("individual")}
                          className={cn(
                            "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all",
                            sendType === "individual" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground"
                          )}
                        >
                          Individual
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedContactIds.length > 0 || selectedGroupIds.length > 0 ? (
                  <div className="mb-6 p-4 bg-background rounded-lg border border-border shadow-sm">
                    <div className="w-full flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Selection ({totalRecipientsCount})</span>
                      <div className="flex items-center gap-3">
                        {selectedContactIds.length >= 2 && !isNamingGroup && (
                          <button 
                            onClick={() => setIsNamingGroup(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/20 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" /> Save Group
                          </button>
                        )}
                        <button 
                          onClick={() => { setSelectedContactIds([]); setSelectedGroupIds([]); }}
                          className="text-[11px] font-bold text-destructive hover:underline"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isNamingGroup && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="w-full bg-muted/30 p-3 rounded-lg border border-border mb-4"
                        >
                          <div className="flex gap-2">
                            <input 
                              autoFocus
                              type="text"
                              value={newGroupName}
                              onChange={(e) => setNewGroupName(e.target.value)}
                              placeholder="Group name..."
                              className="flex-1 px-3 py-2 text-xs bg-background border border-input rounded-md outline-none focus:ring-1 focus:ring-ring transition-all"
                            />
                            <button 
                              onClick={() => {
                                if (newGroupName.trim()) {
                                  onCreateGroup?.(newGroupName, `Created from message flow`, selectedContactIds);
                                  setIsNamingGroup(false);
                                  setNewGroupName("");
                                }
                              }}
                              disabled={!newGroupName.trim()}
                              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-md disabled:opacity-50 hover:bg-primary/90 transition-all shadow-sm"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setIsNamingGroup(false)}
                              className="px-4 py-2 bg-background text-foreground text-xs font-bold rounded-md border border-border hover:bg-muted transition-all shadow-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar">
                      {selectedGroupIds.map(gid => {
                        const g = groups.find(group => group.id === gid);
                        return (
                          <div key={gid} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-md text-[11px] font-bold shadow-sm">
                            <Layers className="w-3.5 h-3.5 opacity-80" />
                            {g?.name}
                            <button onClick={() => toggleGroup(gid)} className="hover:text-primary-foreground/70 ml-1"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        );
                      })}
                      {selectedContactIds.map(cid => {
                        const c = contacts.find(contact => contact.id === cid);
                        return (
                          <div key={cid} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted text-foreground border border-border rounded-md text-[11px] font-bold shadow-sm">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {c?.name}
                            <button onClick={() => toggleContact(cid)} className="hover:text-destructive ml-1"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1">
                  {viewMode === "contacts" ? (
                    filteredContacts.map(contact => (
                      <button
                        key={contact.id}
                        onClick={() => toggleContact(contact.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-md border transition-all text-left group",
                          selectedContactIds.includes(contact.id) 
                            ? "bg-muted/50 border-primary/50 shadow-sm" 
                            : "bg-background border-transparent hover:bg-muted/30 hover:border-border"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all border",
                            selectedContactIds.includes(contact.id) 
                              ? "bg-primary text-primary-foreground border-primary" 
                              : "bg-muted text-muted-foreground border-border"
                          )}>
                            {contact.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground leading-tight">{contact.name}</span>
                            <span className="text-xs text-muted-foreground mt-0.5">{contact.phone}</span>
                          </div>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-sm border transition-all flex items-center justify-center",
                          selectedContactIds.includes(contact.id) 
                            ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                            : "border-input bg-background"
                        )}>
                          {selectedContactIds.includes(contact.id) && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    ))
                  ) : (
                    filteredGroups.map(group => (
                      <button
                        key={group.id}
                        onClick={() => toggleGroup(group.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-md border transition-all text-left group",
                          selectedGroupIds.includes(group.id) 
                            ? "bg-muted/50 border-primary/50 shadow-sm" 
                            : "bg-background border-transparent hover:bg-muted/30 hover:border-border"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-md flex items-center justify-center border transition-all",
                            selectedGroupIds.includes(group.id) 
                              ? "bg-primary text-primary-foreground border-primary" 
                              : "bg-muted text-primary border-border"
                          )}>
                            <Layers className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground leading-tight">{group.name}</span>
                            <span className="text-xs text-muted-foreground mt-0.5">{group.contactCount} contacts</span>
                          </div>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-sm border transition-all flex items-center justify-center",
                          selectedGroupIds.includes(group.id) 
                            ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                            : "border-input bg-background"
                        )}>
                          {selectedGroupIds.includes(group.id) && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    ))
                  )}
                  {((viewMode === "contacts" && filteredContacts.length === 0) || (viewMode === "groups" && filteredGroups.length === 0)) && (
                    <div className="py-20 text-center text-muted-foreground">
                      <Search className="w-10 h-10 mx-auto mb-4 opacity-10" />
                      <p className="text-sm font-bold">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === "compose" && (
            <motion.div 
              key="compose"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <div className="flex flex-col h-full max-w-3xl mx-auto w-full gap-8">
                <div className="flex flex-col gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-3">
                      <DropdownPortSelector 
                        value={selectedPort}
                        onChange={setSelectedPort}
                        label="Channel"
                      />
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-1">Selected port for delivery</p>
                    </div>
                    
                    {totalRecipientsCount > 1 && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Broadcast Title</label>
                        <input 
                          type="text"
                          value={broadcastName}
                          onChange={(e) => setBroadcastName(e.target.value)}
                          placeholder="e.g. VIP Newsletter Q1"
                          className="w-full px-4 py-2 bg-background border border-input rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all shadow-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Quick Templates</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                      {templates.slice(0, 5).map(tmpl => (
                        <button
                          key={tmpl.id}
                          onClick={() => setMessageContent(tmpl.content)}
                          className="shrink-0 px-3 py-1.5 bg-background border border-border rounded-md text-xs font-bold hover:bg-muted hover:text-foreground transition-all shadow-sm"
                        >
                          {tmpl.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Message Content</label>
                    <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-md transition-all">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Assist
                    </button>
                  </div>
                  <div className="relative flex-1 flex flex-col min-h-[300px]">
                    <textarea 
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Type your message here..."
                      className="flex-1 w-full p-4 bg-background border border-input rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all resize-none shadow-sm"
                    />
                    <div className="absolute bottom-4 right-4 flex gap-4 text-[10px] font-bold text-muted-foreground pointer-events-none">
                      <span>{messageContent.length} chars</span>
                      <span>{Math.ceil(messageContent.length / 160)} parts</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-bold text-muted-foreground">Recipients: <span className="text-foreground">{totalRecipientsCount}</span></p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === "schedule" && (
            <motion.div 
              key="schedule"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full max-w-2xl mx-auto w-full"
            >
              <div className="space-y-8">
                {/* Delivery Option Selection */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Choose Delivery Method</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setIsScheduled(false)}
                      className={cn(
                        "relative flex flex-col items-start p-6 rounded-xl border-2 transition-all text-left group",
                        !isScheduled 
                          ? "bg-primary/5 border-primary shadow-md ring-4 ring-primary/5" 
                          : "bg-background border-border hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all",
                        !isScheduled ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
                      )}>
                        <Send className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className={cn("text-sm font-bold", !isScheduled ? "text-primary" : "text-foreground")}>Send Immediately</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Broadcast your message to all recipients right now.</p>
                      </div>
                      {!isScheduled && (
                        <div className="absolute top-4 right-4">
                          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => setIsScheduled(true)}
                      className={cn(
                        "relative flex flex-col items-start p-6 rounded-xl border-2 transition-all text-left group",
                        isScheduled 
                          ? "bg-primary/5 border-primary shadow-md ring-4 ring-primary/5" 
                          : "bg-background border-border hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all",
                        isScheduled ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
                      )}>
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className={cn("text-sm font-bold", isScheduled ? "text-primary" : "text-foreground")}>Schedule for Later</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Pick a specific date and time for automated delivery.</p>
                      </div>
                      {isScheduled && (
                        <div className="absolute top-4 right-4">
                          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Scheduling Options */}
                <AnimatePresence>
                  {isScheduled && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 bg-muted/30 rounded-xl border border-border border-dashed space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Delivery Date & Time</label>
                            <input 
                              type="datetime-local"
                              value={scheduledAt}
                              onChange={(e) => setScheduledAt(e.target.value)}
                              className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                            />
                          </div>
                          <FrequencySelector 
                            value={frequency}
                            onChange={setFrequency}
                          />
                        </div>
                        <div className="p-3 bg-primary/5 rounded-md border border-primary/10 flex items-center gap-3 text-[10px] font-bold text-primary/80">
                          <Info className="w-4 h-4 shrink-0" />
                          Delivery will be based on your workspace timezone (UTC+0).
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Summary Card */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-border bg-muted/20">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Broadcast Summary</h4>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recipient Count</p>
                        <p className="text-xl font-bold text-foreground flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" />
                          {totalRecipientsCount}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Channel</p>
                        <p className="text-sm font-bold text-foreground bg-muted w-fit px-3 py-1 rounded-md border border-border">
                          {selectedPort}
                        </p>
                      </div>
                    </div>

                    {broadcastName && (
                      <div className="space-y-1 pt-4 border-t border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Broadcast Name</p>
                        <p className="text-sm font-bold text-foreground">{broadcastName}</p>
                      </div>
                    )}

                    <div className="space-y-2 pt-4 border-t border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Message Preview</p>
                      <div className="p-4 bg-muted/20 rounded-lg border border-border italic text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {messageContent || "No content provided."}
                      </div>
                    </div>
                  </div>
                </div>

                {!isScheduled && (
                  <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      <span className="font-bold">Immediate Delivery:</span> Once you click "Send Message", your broadcast will be processed and sent to all {totalRecipientsCount} recipients immediately. This action cannot be undone.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex items-center justify-between pt-6 border-t border-border">
        <button
          onClick={() => {
            if (currentStep === "recipients") onClose();
            else {
              const idx = steps.findIndex(s => s.id === currentStep);
              setCurrentStep(steps[idx - 1].id as any);
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          {currentStep === "recipients" ? "Cancel" : <><ChevronLeft className="w-4 h-4" /> Back</>}
        </button>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground hidden sm:block">
            {currentStep === "recipients" ? `${totalRecipientsCount} recipients selected` : "Draft saved automatically"}
          </span>
          <button
            onClick={() => {
              if (currentStep === "schedule") {
                // In a real app, this would trigger the actual send/schedule action
                toast.success(isScheduled ? "Broadcast scheduled successfully" : "Broadcast sent successfully");
                onClose();
              } else {
                const idx = steps.findIndex(s => s.id === currentStep);
                setCurrentStep(steps[idx + 1].id as any);
              }
            }}
            disabled={
              (currentStep === "recipients" && totalRecipientsCount === 0) ||
              (currentStep === "compose" && !messageContent.trim()) ||
              (currentStep === "schedule" && isScheduled && !scheduledAt)
            }
            className="inline-flex items-center gap-2 px-8 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {currentStep === "schedule" ? (isScheduled ? "Schedule Broadcast" : "Send Broadcast") : "Continue"}
            {currentStep !== "schedule" && <ChevronRight className="w-4 h-4" />}
            {currentStep === "schedule" && (isScheduled ? <Calendar className="w-4 h-4" /> : <Send className="w-4 h-4" />)}
          </button>
        </div>
      </div>
    </div>
  );
};
