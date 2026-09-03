// ============================================================
// Skill Sets — tool catalog, provider connections, starter templates
// ============================================================

export type ToolAccess = 'read' | 'write';
export type OutputMode = 'text' | 'structured';
export type TriggerType = 'event' | 'manual' | 'schedule';
export type SkillStatus = 'active' | 'paused';

export interface ToolDef {
  /** Fully-qualified platform function name, e.g. "contacts.fetch". */
  id: string;
  label: string;
  description: string;
  category: string;
  access: ToolAccess;
}

export interface ProviderConnection {
  id: string;
  label: string;
  models: { id: string; label: string }[];
}

/**
 * A single plain-English rule. Used by the Guidance workflow, which composes
 * the system prompt from these instead of asking anyone to write one.
 */
export type GuidanceCategory = 'tone' | 'when-to-act' | 'when-to-stop' | 'escalation' | 'other';

export interface GuidanceRule {
  id: string;
  category: GuidanceCategory;
  /** The rule itself, in plain language. */
  text: string;
  /** Positive examples — when this should apply. */
  applyWhen: string[];
  /** Negative examples — when it should not. */
  dontApplyWhen: string[];
  enabled: boolean;
}

export const GUIDANCE_CATEGORIES: { id: GuidanceCategory; label: string; help: string }[] = [
  { id: 'tone', label: 'How it speaks', help: 'Voice, warmth, formality, length of replies.' },
  {
    id: 'when-to-act',
    label: 'When to act',
    help: 'What has to be true before it does anything.',
  },
  {
    id: 'when-to-stop',
    label: 'When to stop',
    help: 'Situations where it should do nothing at all.',
  },
  {
    id: 'escalation',
    label: 'When to get a person',
    help: 'What should be handed to a human straight away.',
  },
  { id: 'other', label: 'Anything else', help: "Rules that don't fit the other groups." },
];

/** One editable revision of a skill. */
export interface SkillVersion {
  name: string;
  description: string;
  /** System prompt, written in Markdown. */
  instructions: string;
  /**
   * Plain-English rules. When present, these are the source of truth and
   * `instructions` is generated from them.
   */
  guidance?: GuidanceRule[];
  /** Rendered per run, with {{variable}} placeholders. */
  userPromptTemplate: string;
  outputMode: OutputMode;
  /** JSON Schema string. Required when outputMode is "structured". */
  outputSchema: string;
  tools: string[];
  providerConnection: string;
  model: string;
  triggerType: TriggerType;
  /** JSON object string passed to the trigger. */
  triggerParams: string;
  budgetPerRunUsd: number;
  dailyBudgetUsd: number;
  maxIterations: number;
}

export interface SkillVersionRecord extends SkillVersion {
  version: number;
  activatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  status: SkillStatus;
  /** Live version. Null until a draft is activated for the first time. */
  active: SkillVersionRecord | null;
  /** Unactivated edits. Null when there is nothing pending. */
  draft: SkillVersion | null;
  /** Previously activated versions, newest first. */
  history: SkillVersionRecord[];
  updatedAt: string;
}

// ------------------------------------------------------------
// Tool catalog
// ------------------------------------------------------------

export const TOOL_CATALOG: ToolDef[] = [
  {
    id: 'contacts.fetch',
    label: 'Fetch contact',
    description: "Get a contact's public profile, dynamic properties, and current classifications.",
    category: 'contacts',
    access: 'read',
  },
  {
    id: 'contacts.classify',
    label: 'Classify contact',
    description: 'Apply an org-defined classification value to a contact.',
    category: 'contacts',
    access: 'write',
  },
  {
    id: 'contacts.suggest_enrichment',
    label: 'Suggest contact enrichment',
    description: 'Propose a value for a contact field (goes to agent approval queue).',
    category: 'contacts',
    access: 'write',
  },
  {
    id: 'conversations.fetch_history',
    label: 'Fetch conversation history',
    description: 'Get the most recent messages on a conversation, oldest first.',
    category: 'conversations',
    access: 'read',
  },
  {
    id: 'conversations.fetch_messages',
    label: 'Fetch conversation messages',
    description: "Fetch a contact's conversation transcript by channel, or by a message id.",
    category: 'conversations',
    access: 'read',
  },
];

export const TOOL_CATEGORIES = Array.from(new Set(TOOL_CATALOG.map((t) => t.category))).sort();

// ------------------------------------------------------------
// Provider connections
// ------------------------------------------------------------

export const PROVIDER_CONNECTIONS: ProviderConnection[] = [
  { id: 'anthropic-agent', label: 'Antropic Agent (anthropic)', models: [] },
];

// ------------------------------------------------------------
// Starter templates
// ------------------------------------------------------------

export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  version: SkillVersion;
}

const CLASSIFICATION_SCHEMA = `{
  "type": "object",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "required": [
    "decision",
    "classification_count"
  ],
  "properties": {
    "summary": {
      "type": "string",
      "maxLength": 300
    },
    "decision": {
      "enum": [
        "classified",
        "no_classifications_to_apply",
        "insufficient_context"
      ],
      "type": "string"
    },
    "classification_count": {
      "type": "integer",
      "maximum": 20,
      "minimum": 0
    }
  },
  "additionalProperties": false
}`;

const ENRICHMENT_SCHEMA = `{
  "type": "object",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "required": [
    "decision",
    "suggestion_count"
  ],
  "properties": {
    "summary": {
      "type": "string",
      "maxLength": 300
    },
    "decision": {
      "enum": [
        "suggested",
        "no_fields_to_enrich",
        "insufficient_context"
      ],
      "type": "string"
    },
    "suggestion_count": {
      "type": "integer",
      "maximum": 20,
      "minimum": 0
    }
  },
  "additionalProperties": false
}`;

const MESSAGE_CREATED_TRIGGER = `{
  "filters": [
    {
      "op": "eq",
      "field": "direction",
      "value": "inbound"
    }
  ],
  "event_type": "message.created",
  "debounce_seconds": 30,
  "conversation_override": {
    "field": "conversation.ci_override",
    "behaviour": "if_true_force_match"
  }
}`;

const CONVERSATION_CLOSED_TRIGGER = `{
  "filters": [],
  "event_type": "conversation.closed",
  "debounce_seconds": 0
}`;

const SENTIMENT_SCHEMA = `{
  "type": "object",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "required": [
    "decision",
    "sentiment"
  ],
  "properties": {
    "summary": {
      "type": "string",
      "maxLength": 300
    },
    "decision": {
      "enum": [
        "classified",
        "no_signal",
        "insufficient_context"
      ],
      "type": "string"
    },
    "sentiment": {
      "enum": [
        "positive",
        "neutral",
        "negative"
      ],
      "type": "string"
    },
    "escalation_risk": {
      "enum": [
        "low",
        "medium",
        "high"
      ],
      "type": "string"
    }
  },
  "additionalProperties": false
}`;

const LANGUAGE_SCHEMA = `{
  "type": "object",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "required": [
    "decision"
  ],
  "properties": {
    "decision": {
      "enum": [
        "suggested",
        "already_set",
        "insufficient_context"
      ],
      "type": "string"
    },
    "language_code": {
      "type": "string",
      "maxLength": 12
    },
    "confidence": {
      "type": "number",
      "maximum": 1,
      "minimum": 0
    }
  },
  "additionalProperties": false
}`;

const SUMMARY_SCHEMA = `{
  "type": "object",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "required": [
    "summary",
    "outcome"
  ],
  "properties": {
    "summary": {
      "type": "string",
      "maxLength": 600
    },
    "topics": {
      "type": "array",
      "maxItems": 5,
      "items": {
        "type": "string"
      }
    },
    "outcome": {
      "enum": [
        "resolved",
        "pending_customer",
        "pending_agent",
        "unresolved"
      ],
      "type": "string"
    },
    "follow_up_required": {
      "type": "boolean"
    }
  },
  "additionalProperties": false
}`;

const INTENT_SCHEMA = `{
  "type": "object",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "required": [
    "decision"
  ],
  "properties": {
    "summary": {
      "type": "string",
      "maxLength": 300
    },
    "decision": {
      "enum": [
        "classified",
        "no_clear_intent",
        "insufficient_context"
      ],
      "type": "string"
    },
    "intent": {
      "type": "string",
      "maxLength": 60
    },
    "confidence": {
      "type": "number",
      "maximum": 1,
      "minimum": 0
    }
  },
  "additionalProperties": false
}`;

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'ci-classification',
    name: 'CI — Classification',
    description:
      'Applies org-defined classifications to a contact based on conversation content, citing evidence for each decision.',
    version: {
      name: 'CI — Classification',
      description:
        'Applies org-defined classifications to a contact based on conversation content, citing evidence for each decision.',
      instructions: `You are a conversation analyst for a customer-support platform. Your job is to read recent messages on a conversation and apply org-defined classifications to the contact when the conversation provides clear evidence.

You have three tools:
- contacts.fetch — read the contact's current profile and existing classifications.
- conversations.fetch_history — read recent messages on the conversation.
- contacts.classify — set the value of one classification for the contact. The value is applied directly, so only classify when the evidence is clear.

Rules:
1. Only classify when you are confident (confidence >= 0.6). When the conversation is ambiguous, do not classify.
2. Always cite specific evidence from the conversation (quote or paraphrase the message that justifies the value).
3. Choose the value only from the allowed values listed for each classification. Never invent a value outside the allowed set.
4. Do not re-apply a classification that already holds the same value.
5. Apply at most one value per classification. Do not call contacts.classify twice for the same classification in one run.
6. Never invent information that is not in the conversation.
7. When you have considered every relevant classification, output the final structured decision and stop.`,
      userPromptTemplate: `A new message arrived in conversation {{input.conversation_id}} from contact {{input.contact_id}}.

Triggering event:
- Message ID: {{input.message_id}}

Org-defined classifications available, with their allowed values:
{{tenant.classification_definitions_json}}

Procedure:
1. Call contacts.fetch with contact_id="{{input.contact_id}}" to see the contact's current classifications.
2. Call conversations.fetch_history with conversation_id="{{input.conversation_id}}" and limit=20 to read the recent message context.
3. For each classification where the conversation provides clear evidence, call contacts.classify with the contact_id, classification_id, value (from the allowed set), confidence, and evidence (a 1–2 sentence citation).
4. Skip classifications that already hold the value you would set.
5. Output the final structured decision and stop.`,
      outputMode: 'structured',
      outputSchema: CLASSIFICATION_SCHEMA,
      tools: ['contacts.fetch', 'conversations.fetch_history', 'contacts.classify'],
      providerConnection: 'anthropic-agent',
      model: '',
      triggerType: 'event',
      triggerParams: MESSAGE_CREATED_TRIGGER,
      budgetPerRunUsd: 0.05,
      dailyBudgetUsd: 10,
      maxIterations: 4,
    },
  },
  {
    id: 'ci-enrichment',
    name: 'CI — Enrichment',
    description:
      'Proposes values for org-defined contact fields based on conversation content. Suggestions go to an agent approval queue.',
    version: {
      name: 'CI — Enrichment',
      description:
        'Proposes values for org-defined contact fields based on conversation content. Suggestions go to an agent approval queue.',
      instructions: `You are a conversation analyst for a customer-support platform. Your job is to read recent messages on a conversation and propose values for org-defined contact fields when the conversation provides clear evidence.

You have three tools:
- contacts.fetch — read the contact's current profile and existing field values.
- conversations.fetch_history — read recent messages on the conversation.
- contacts.suggest_enrichment — propose a value for one contact field. Suggestions are queued for human approval, never applied directly.

Rules:
1. Only suggest a value when you are confident (confidence >= 0.6). When the conversation is ambiguous, do not suggest.
2. Always cite specific evidence from the conversation (quote or paraphrase the message that justifies the value).
3. Respect the field's type and allowed values. Never invent a value outside the allowed set.
4. Do not suggest a value for a field that already holds it.
5. Propose at most one value per field per run.
6. Never invent information that is not in the conversation.
7. When you have considered every relevant field, output the final structured decision and stop.`,
      userPromptTemplate: `A new message arrived in conversation {{input.conversation_id}} from contact {{input.contact_id}}.

Triggering event:
- Message ID: {{input.message_id}}

Org-defined contact fields available, with their types and allowed values:
{{tenant.field_definitions_json}}

Procedure:
1. Call contacts.fetch with contact_id="{{input.contact_id}}" to see the contact's current field values.
2. Call conversations.fetch_history with conversation_id="{{input.conversation_id}}" and limit=20 to read the recent message context.
3. For each field where the conversation provides clear evidence, call contacts.suggest_enrichment with the contact_id, field_id, value, confidence, and evidence (a 1–2 sentence citation).
4. Skip fields that already hold the value you would suggest.
5. Output the final structured decision and stop.`,
      outputMode: 'structured',
      outputSchema: ENRICHMENT_SCHEMA,
      tools: ['contacts.fetch', 'conversations.fetch_history', 'contacts.suggest_enrichment'],
      providerConnection: 'anthropic-agent',
      model: '',
      triggerType: 'event',
      triggerParams: MESSAGE_CREATED_TRIGGER,
      budgetPerRunUsd: 0.05,
      dailyBudgetUsd: 10,
      maxIterations: 4,
    },
  },
  {
    id: 'sentiment',
    name: 'Sentiment',
    description:
      'Reads the emotional tone of a conversation and records sentiment and escalation risk on the contact.',
    version: {
      name: 'Sentiment',
      description:
        'Reads the emotional tone of a conversation and records sentiment and escalation risk on the contact.',
      instructions: `You are a conversation analyst for a customer-support platform. Your job is to read recent messages on a conversation and judge how the contact is feeling, so the team can prioritise people who need attention.

You have three tools:
- contacts.fetch — read the contact's current profile and existing classifications.
- conversations.fetch_history — read recent messages on the conversation.
- contacts.classify — set the value of one classification for the contact.

Rules:
1. Judge sentiment from the contact's own messages only. Ignore agent messages except as context.
2. Weight the most recent messages more heavily than older ones — sentiment changes over a conversation.
3. Escalation risk is high when the contact threatens to leave, mentions a complaint or refund, repeats an unanswered question, or expresses anger. It is not high merely because they are unhappy.
4. Always cite specific evidence (quote or paraphrase the message that justifies the rating).
5. Do not re-apply a classification that already holds the same value.
6. A short or purely factual message is usually neutral. Do not read emotion into it.
7. Never invent information that is not in the conversation.
8. Output the final structured decision and stop.`,
      userPromptTemplate: `A new message arrived in conversation {{input.conversation_id}} from contact {{input.contact_id}}.

Triggering event:
- Message ID: {{input.message_id}}

Sentiment classifications available, with their allowed values:
{{tenant.classification_definitions_json}}

Procedure:
1. Call contacts.fetch with contact_id="{{input.contact_id}}" to see the contact's current classifications.
2. Call conversations.fetch_history with conversation_id="{{input.conversation_id}}" and limit=20 to read the recent message context.
3. Judge overall sentiment and escalation risk from the contact's messages.
4. Where a sentiment classification applies and differs from the current value, call contacts.classify with the contact_id, classification_id, value, confidence, and evidence (a 1–2 sentence citation).
5. Output the final structured decision and stop.`,
      outputMode: 'structured',
      outputSchema: SENTIMENT_SCHEMA,
      tools: ['contacts.fetch', 'conversations.fetch_history', 'contacts.classify'],
      providerConnection: 'anthropic-agent',
      model: '',
      triggerType: 'event',
      triggerParams: MESSAGE_CREATED_TRIGGER,
      budgetPerRunUsd: 0.02,
      dailyBudgetUsd: 10,
      maxIterations: 3,
    },
  },
  {
    id: 'language-detection',
    name: 'Language Detection',
    description:
      "Detects the contact's primary language from their messages and proposes it as a contact field.",
    version: {
      name: 'Language Detection',
      description:
        "Detects the contact's primary language from their messages and proposes it as a contact field.",
      instructions: `You are a language detector for a customer-support platform. Your job is to work out which language a contact writes in, so the team can route and reply appropriately.

You have three tools:
- contacts.fetch — read the contact's current profile and existing field values.
- conversations.fetch_history — read recent messages on the conversation.
- contacts.suggest_enrichment — propose a value for one contact field. Suggestions are queued for human approval, never applied directly.

Rules:
1. Judge only from the contact's own messages. Agent messages tell you nothing about the contact's language.
2. Report the language as an ISO 639-1 code (for example "en", "am", "om", "ar").
3. Ignore greetings, names, and product terms — they appear in every language and prove nothing.
4. If the contact writes in more than one language, choose the one they use for most of their substantive messages.
5. Only suggest when confidence is at least 0.7. Short messages are rarely enough.
6. Do not suggest a language the contact record already holds.
7. Never invent information that is not in the conversation.
8. Output the final structured decision and stop.`,
      userPromptTemplate: `A new message arrived in conversation {{input.conversation_id}} from contact {{input.contact_id}}.

Triggering event:
- Message ID: {{input.message_id}}

Contact fields available, with their types and allowed values:
{{tenant.field_definitions_json}}

Procedure:
1. Call contacts.fetch with contact_id="{{input.contact_id}}" to see whether a language is already recorded.
2. Call conversations.fetch_history with conversation_id="{{input.conversation_id}}" and limit=20 to read the contact's messages.
3. Determine the contact's primary language as an ISO 639-1 code.
4. If confidence is at least 0.7 and the value differs from the current one, call contacts.suggest_enrichment with the contact_id, field_id, value, confidence, and evidence.
5. Output the final structured decision and stop.`,
      outputMode: 'structured',
      outputSchema: LANGUAGE_SCHEMA,
      tools: ['contacts.fetch', 'conversations.fetch_history', 'contacts.suggest_enrichment'],
      providerConnection: 'anthropic-agent',
      model: '',
      triggerType: 'event',
      triggerParams: MESSAGE_CREATED_TRIGGER,
      budgetPerRunUsd: 0.01,
      dailyBudgetUsd: 5,
      maxIterations: 3,
    },
  },
  {
    id: 'conversation-summary',
    name: 'Conversation Summary',
    description:
      'Summarises a closed conversation into a short handoff note with topics, outcome, and follow-up flag.',
    version: {
      name: 'Conversation Summary',
      description:
        'Summarises a closed conversation into a short handoff note with topics, outcome, and follow-up flag.',
      instructions: `You are a conversation summariser for a customer-support platform. Your job is to turn a finished conversation into a short note the next person can read in fifteen seconds.

You have two tools:
- contacts.fetch — read the contact's profile for context.
- conversations.fetch_messages — read the full conversation transcript.

Rules:
1. Write the summary in plain past tense, describing what the contact wanted and what happened.
2. Keep it under 120 words. A summary nobody reads is worse than no summary.
3. List at most five topics, each a short noun phrase.
4. Mark the outcome as resolved only when the contact's question was actually answered or their problem fixed — not merely because the conversation ended.
5. Set follow_up_required when something was promised, left open, or needs another person.
6. Never invent detail that is not in the transcript. If the transcript is too thin to summarise, say so in the summary and mark the outcome unresolved.
7. Do not include personal data beyond what the summary needs.
8. Output the final structured decision and stop.`,
      userPromptTemplate: `Conversation {{input.conversation_id}} with contact {{input.contact_id}} has closed.

Procedure:
1. Call contacts.fetch with contact_id="{{input.contact_id}}" for background on who this is.
2. Call conversations.fetch_messages with conversation_id="{{input.conversation_id}}" to read the full transcript.
3. Write a summary of under 120 words, list up to five topics, judge the outcome, and decide whether follow-up is required.
4. Output the final structured decision and stop.`,
      outputMode: 'structured',
      outputSchema: SUMMARY_SCHEMA,
      tools: ['contacts.fetch', 'conversations.fetch_messages'],
      providerConnection: 'anthropic-agent',
      model: '',
      triggerType: 'event',
      triggerParams: CONVERSATION_CLOSED_TRIGGER,
      budgetPerRunUsd: 0.03,
      dailyBudgetUsd: 15,
      maxIterations: 3,
    },
  },
  {
    id: 'intent-routing',
    name: 'Intent Routing',
    description:
      "Identifies what the contact is trying to do and applies the matching routing classification.",
    version: {
      name: 'Intent Routing',
      description:
        "Identifies what the contact is trying to do and applies the matching routing classification.",
      instructions: `You are an intent classifier for a customer-support platform. Your job is to work out what the contact actually wants, so the conversation reaches the right team without a human triaging it first.

You have three tools:
- contacts.fetch — read the contact's current profile and existing classifications.
- conversations.fetch_history — read recent messages on the conversation.
- contacts.classify — set the value of one classification for the contact.

Rules:
1. Classify the contact's primary intent — the thing they want resolved. Ignore pleasantries and side remarks.
2. When a contact raises several things, choose the one they lead with or return to most.
3. Choose the value only from the allowed values listed for the routing classification. Never invent an intent outside the allowed set.
4. Only classify when confidence is at least 0.6. A vague opening message such as "hello" is not an intent.
5. Always cite specific evidence (quote or paraphrase the message that justifies the intent).
6. Do not re-apply a classification that already holds the same value.
7. Never invent information that is not in the conversation.
8. Output the final structured decision and stop.`,
      userPromptTemplate: `A new message arrived in conversation {{input.conversation_id}} from contact {{input.contact_id}}.

Triggering event:
- Message ID: {{input.message_id}}

Routing classifications available, with their allowed values:
{{tenant.classification_definitions_json}}

Procedure:
1. Call contacts.fetch with contact_id="{{input.contact_id}}" to see the contact's current classifications.
2. Call conversations.fetch_history with conversation_id="{{input.conversation_id}}" and limit=10 to read the opening context.
3. Determine the contact's primary intent from the allowed values.
4. If confidence is at least 0.6 and the value differs from the current one, call contacts.classify with the contact_id, classification_id, value, confidence, and evidence.
5. Output the final structured decision and stop.`,
      outputMode: 'structured',
      outputSchema: INTENT_SCHEMA,
      tools: ['contacts.fetch', 'conversations.fetch_history', 'contacts.classify'],
      providerConnection: 'anthropic-agent',
      model: '',
      triggerType: 'event',
      triggerParams: MESSAGE_CREATED_TRIGGER,
      budgetPerRunUsd: 0.02,
      dailyBudgetUsd: 10,
      maxIterations: 3,
    },
  },
];

// ------------------------------------------------------------
// Defaults
// ------------------------------------------------------------

export const EMPTY_VERSION: SkillVersion = {
  name: '',
  description: '',
  instructions: '',
  userPromptTemplate: '',
  outputMode: 'text',
  outputSchema: '',
  tools: [],
  providerConnection: PROVIDER_CONNECTIONS[0]?.id ?? '',
  model: '',
  triggerType: 'manual',
  triggerParams: '{}',
  budgetPerRunUsd: 0.05,
  dailyBudgetUsd: 10,
  maxIterations: 4,
};

// ------------------------------------------------------------
// Guidance → system prompt
// ------------------------------------------------------------

/**
 * Compose a system prompt from plain-English rules. The Guidance workflow
 * never shows this to the author — it is what gets sent to the model.
 */
export function composeInstructions(name: string, description: string, rules: GuidanceRule[]) {
  const live = rules.filter((r) => r.enabled && r.text.trim());
  const lines: string[] = [];

  lines.push(`You are "${name || 'an assistant'}" working inside a customer conversation platform.`);
  if (description.trim()) lines.push('', description.trim());

  for (const group of GUIDANCE_CATEGORIES) {
    const inGroup = live.filter((r) => r.category === group.id);
    if (inGroup.length === 0) continue;
    lines.push('', `## ${group.label}`);
    for (const rule of inGroup) {
      lines.push(`- ${rule.text.trim()}`);
      const apply = rule.applyWhen.filter((e) => e.trim());
      const dont = rule.dontApplyWhen.filter((e) => e.trim());
      for (const e of apply) lines.push(`  - Applies when: ${e.trim()}`);
      for (const e of dont) lines.push(`  - Does not apply when: ${e.trim()}`);
    }
  }

  lines.push('', '## Always');
  lines.push('- Only act on what is actually in the conversation. Never invent information.');
  lines.push('- When the evidence is unclear, do nothing and say why.');

  return lines.join('\n');
}

export function emptyRule(category: GuidanceCategory = 'when-to-act'): GuidanceRule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category,
    text: '',
    applyWhen: [],
    dontApplyWhen: [],
    enabled: true,
  };
}

// ------------------------------------------------------------
// Worked examples
//
// Seeded so every workflow opens on a populated skill rather than an
// empty state. Each carries a full definition AND plain-English rules,
// so it renders correctly in all four authoring workflows.
// ------------------------------------------------------------

function seedRule(
  id: string,
  category: GuidanceCategory,
  text: string,
  applyWhen: string[] = [],
  dontApplyWhen: string[] = [],
): GuidanceRule {
  return { id, category, text, applyWhen, dontApplyWhen, enabled: true };
}

const REFUND_RULES: GuidanceRule[] = [
  seedRule(
    'refund-1',
    'when-to-act',
    'Read the last few messages and decide whether the person is actually asking for money back.',
    ['They ask for a refund outright', 'They say the item arrived broken and want it sorted'],
    ['They are only asking when their order will arrive'],
  ),
  seedRule(
    'refund-2',
    'when-to-stop',
    'Do nothing if you cannot tell what they bought or when.',
    [],
    ['The order number is right there in the conversation'],
  ),
  seedRule(
    'refund-3',
    'escalation',
    'Hand the conversation to a person instead of answering it yourself. Never promise a refund.',
    ['Any mention of a refund, return or chargeback'],
  ),
  seedRule('refund-4', 'tone', 'Be warm and brief. Acknowledge the problem before anything else.'),
];

const SUMMARY_RULES: GuidanceRule[] = [
  seedRule(
    'summary-1',
    'when-to-act',
    'Write a short note covering what the person wanted and what happened.',
    ['The conversation has at least three messages'],
    ['Nobody replied to the first message'],
  ),
  seedRule('summary-2', 'other', 'Keep it under 120 words. A summary nobody reads is worse than none.'),
  seedRule(
    'summary-3',
    'when-to-stop',
    'Say plainly that there was too little to summarise rather than padding it out.',
  ),
];

const REFUND_VERSION: SkillVersion = {
  name: 'Refund requests',
  description: 'Spots people asking for money back and hands them to a person.',
  guidance: REFUND_RULES,
  instructions: composeInstructionsSeed(
    'Refund requests',
    'Spots people asking for money back and hands them to a person.',
    REFUND_RULES,
  ),
  userPromptTemplate: `A new message arrived in conversation {{input.conversation_id}} from contact {{input.contact_id}}.

Procedure:
1. Call contacts.fetch with contact_id="{{input.contact_id}}".
2. Call conversations.fetch_history with conversation_id="{{input.conversation_id}}" and limit=20.
3. Decide whether this is a refund request. If it is, label the contact and stop.
4. Output the final structured decision and stop.`,
  outputMode: 'text',
  outputSchema: '',
  tools: ['contacts.fetch', 'conversations.fetch_history', 'contacts.classify'],
  providerConnection: 'anthropic-agent',
  model: '',
  triggerType: 'event',
  triggerParams: `{
  "filters": [
    {
      "op": "eq",
      "field": "direction",
      "value": "inbound"
    }
  ],
  "event_type": "message.created",
  "debounce_seconds": 30
}`,
  budgetPerRunUsd: 0.02,
  dailyBudgetUsd: 10,
  maxIterations: 4,
};

const SUMMARY_VERSION: SkillVersion = {
  name: 'Wrap-up notes',
  description: 'Writes a short handover note when a conversation closes.',
  guidance: SUMMARY_RULES,
  instructions: composeInstructionsSeed(
    'Wrap-up notes',
    'Writes a short handover note when a conversation closes.',
    SUMMARY_RULES,
  ),
  userPromptTemplate: `Conversation {{input.conversation_id}} with contact {{input.contact_id}} has closed.

Read the transcript and write the handover note.`,
  outputMode: 'text',
  outputSchema: '',
  tools: ['contacts.fetch', 'conversations.fetch_messages'],
  providerConnection: 'anthropic-agent',
  model: '',
  triggerType: 'event',
  triggerParams: `{
  "filters": [],
  "event_type": "conversation.closed",
  "debounce_seconds": 0
}`,
  budgetPerRunUsd: 0.03,
  dailyBudgetUsd: 15,
  maxIterations: 3,
};

/** Declared before composeInstructions to keep the seeds above readable. */
function composeInstructionsSeed(name: string, description: string, rules: GuidanceRule[]) {
  return composeInstructions(name, description, rules);
}

export const EXAMPLE_SKILLS: Skill[] = [
  {
    id: 'example-refunds',
    name: REFUND_VERSION.name,
    description: REFUND_VERSION.description,
    status: 'active',
    active: { ...REFUND_VERSION, version: 1, activatedAt: '2026-08-24T09:12:00Z' },
    draft: null,
    history: [],
    updatedAt: '2026-08-24T09:12:00Z',
  },
  {
    id: 'example-wrapup',
    name: SUMMARY_VERSION.name,
    description: SUMMARY_VERSION.description,
    status: 'paused',
    active: null,
    draft: SUMMARY_VERSION,
    history: [],
    updatedAt: '2026-08-28T14:40:00Z',
  },
];

// ------------------------------------------------------------
// Validation
// ------------------------------------------------------------

export interface ValidationIssue {
  level: 'error' | 'warning';
  message: string;
}

/**
 * Errors block activation; warnings do not.
 */
export function validateVersion(v: SkillVersion): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!v.name.trim()) issues.push({ level: 'error', message: 'Name is required.' });
  if (!v.description.trim()) issues.push({ level: 'warning', message: 'Description is empty.' });
  if (!v.instructions.trim())
    issues.push({ level: 'error', message: 'Instructions (system prompt) are required.' });

  if (v.outputMode === 'structured') {
    if (!v.outputSchema.trim()) {
      issues.push({ level: 'error', message: 'Output schema is required for structured mode.' });
    } else {
      try {
        JSON.parse(v.outputSchema);
      } catch {
        issues.push({ level: 'error', message: 'Output schema is not valid JSON.' });
      }
    }
  }

  try {
    const parsed = JSON.parse(v.triggerParams || '{}');
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      issues.push({ level: 'error', message: 'Trigger params must be a JSON object.' });
    }
  } catch {
    issues.push({ level: 'error', message: 'Trigger params are not valid JSON.' });
  }

  if (!v.providerConnection)
    issues.push({ level: 'error', message: 'A provider connection is required.' });
  if (!v.model) issues.push({ level: 'warning', message: 'No model selected for this provider.' });

  if (v.tools.length === 0)
    issues.push({ level: 'warning', message: 'No tools enabled — this skill cannot act.' });

  if (v.budgetPerRunUsd <= 0)
    issues.push({ level: 'error', message: 'Budget per run must be greater than 0.' });
  if (v.dailyBudgetUsd <= 0)
    issues.push({ level: 'error', message: 'Daily budget must be greater than 0.' });
  if (v.dailyBudgetUsd < v.budgetPerRunUsd)
    issues.push({
      level: 'warning',
      message: 'Daily budget is lower than the per-run budget — only one run will fit.',
    });
  if (v.maxIterations < 1 || v.maxIterations > 10)
    issues.push({ level: 'error', message: 'Max iterations must be between 1 and 10.' });

  if (v.outputMode === 'structured' && !/\{\{[^}]+\}\}/.test(v.userPromptTemplate))
    issues.push({
      level: 'warning',
      message: 'User prompt template has no {{variable}} placeholders.',
    });

  return issues;
}
