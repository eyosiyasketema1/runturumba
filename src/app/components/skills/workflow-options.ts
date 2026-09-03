// ============================================================
// Skill Sets — workflow explorations
//
// Four authoring workflows over one shared data model, so they can be
// compared as working screens rather than as descriptions. Evidence and
// standards for each are in docs/skill-sets-authoring-research.md.
// ============================================================

export type WorkflowId = 'form' | 'guidance' | 'describe' | 'guided';

export interface WorkflowOption {
  id: WorkflowId;
  title: string;
  /** One line on what the workflow actually is. */
  summary: string;
  /** Why it might be the right answer. */
  reason: string;
  /** What it costs. Every option gives something up. */
  tradeoff: string;
  /** Who does this de-jargoning for, in practice. */
  bestFor: string;
  /** Shipping products that use this pattern. */
  evidence: string;
  status: 'built' | 'planned';
  isDefault?: boolean;
}

export const WORKFLOW_OPTIONS: WorkflowOption[] = [
  {
    id: 'form',
    title: 'Configuration form',
    summary:
      'Every part of the definition on one page — instructions, prompts, tools, model, trigger, budgets — with draft and active versions.',
    reason:
      'Maximum control and an honest view of exactly what gets saved. Any skill the platform supports can be expressed and debugged here.',
    tradeoff:
      'Asks a non-engineer to write a system prompt, a JSON Schema and a JSON trigger object. No mature competitor does this.',
    bestFor: 'Technical admins who already know what a good agent definition looks like.',
    evidence: 'Closest to OpenAI GPT Builder’s Configure tab.',
    status: 'built',
    isDefault: true,
  },
  {
    id: 'guidance',
    title: 'Guidance rules',
    summary:
      'The prompt is replaced by short plain-English rules, grouped by purpose, each scoped with “use it when” and “don’t use it when” examples.',
    reason:
      'A rule can be read, tested and deleted on its own; a 400-word prompt cannot. Example-based scoping lets someone teach intent by pointing at real conversations instead of writing conditions.',
    tradeoff:
      'Fits the read-conversation → infer → write-to-contact shape. Many rules can quietly contradict each other, which is why the flow includes a check step.',
    bestFor: 'Coordinators who know the ministry, not the model.',
    evidence: 'Intercom Fin Guidance · Gorgias Guidance · Decagon AOPs · Salesforce topic scope.',
    status: 'built',
  },
  {
    id: 'describe',
    title: 'Describe it, then refine',
    summary:
      'One question — what should this skill do? — produces a complete draft: rules, permissions, when it runs. The author edits a result instead of a blank page.',
    reason:
      'Kills the blank page, the single biggest barrier for someone who does not write prompts. It also teaches: after two or three drafts an author has learned the shape of a good skill.',
    tradeoff:
      'People can ship things they do not fully understand. Mitigated by showing the whole draft in plain language and never hiding what was generated.',
    bestFor: 'Anyone starting from scratch who knows the outcome they want.',
    evidence: 'OpenAI GPT Builder · Zapier Agents · Sierra Journeys · Salesforce Agentforce Builder.',
    status: 'built',
  },
  {
    id: 'guided',
    title: 'Guided setup',
    summary:
      'One question per screen — name, purpose, when it runs, what it may read, what it may change, handover, budget — ending in a review of every answer.',
    reason:
      'The strongest at leading someone who has never done this. The review screen is the highest-leverage part: GOV.UK credits the pattern with both higher completion and lower error rates.',
    tradeoff:
      'Wizards are good for creating and poor for editing, so this needs a separate edit surface rather than replacing one.',
    bestFor: 'First-time authors, and anyone who needs to be sure before switching something on.',
    evidence: 'HubSpot Breeze · Zendesk’s no-code setup · GOV.UK one-thing-per-page.',
    status: 'built',
  },
];

export const DEFAULT_WORKFLOW: WorkflowId =
  WORKFLOW_OPTIONS.find((o) => o.isDefault)?.id ?? 'form';
