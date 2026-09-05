// ============================================================
// Guided composition — question sets and composers
//
// Powers the "Instruction guide" and "Prompt guide" modals in the
// configuration form. The form stays the expert surface; these are
// scaffolding for anyone who does not want to face a blank textarea.
//
// Question shape follows NN/g's CARE structure (Context, Ask, Rules,
// Examples) rather than one open-ended box.
// ============================================================

export type GuideKind = 'instructions' | 'userPrompt';

export interface GuideQuestion {
  id: string;
  /** Asked in the modal. */
  question: string;
  help: string;
  placeholder: string;
  multiline: boolean;
  /** Blocks Insert when empty. */
  required?: boolean;
  /** Repeatable answers, e.g. one rule per line. */
  list?: boolean;
}

// ------------------------------------------------------------
// Available runtime variables, for the prompt template picker
// ------------------------------------------------------------

export interface TemplateVariable {
  token: string;
  label: string;
  description: string;
  group: 'This run' | 'Your organisation';
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  {
    token: '{{input.conversation_id}}',
    label: 'Conversation',
    description: 'The conversation that triggered this run.',
    group: 'This run',
  },
  {
    token: '{{input.contact_id}}',
    label: 'Contact',
    description: 'The person on the other end.',
    group: 'This run',
  },
  {
    token: '{{input.message_id}}',
    label: 'Message',
    description: 'The specific message that set this off.',
    group: 'This run',
  },
  {
    token: '{{input.channel}}',
    label: 'Channel',
    description: 'Where the conversation is happening.',
    group: 'This run',
  },
  {
    token: '{{tenant.classification_definitions_json}}',
    label: 'Your classifications',
    description: 'Every label your organisation has defined, with allowed values.',
    group: 'Your organisation',
  },
  {
    token: '{{tenant.field_definitions_json}}',
    label: 'Your contact fields',
    description: 'Every contact field, with its type and allowed values.',
    group: 'Your organisation',
  },
  {
    token: '{{tenant.name}}',
    label: 'Organisation name',
    description: 'Useful when the AI should mention who it works for.',
    group: 'Your organisation',
  },
];

// ------------------------------------------------------------
// Instructions — standing rules, written once
// ------------------------------------------------------------

export const INSTRUCTION_QUESTIONS: GuideQuestion[] = [
  {
    id: 'role',
    question: 'What is this skill, in one line?',
    help: 'Give it a job title and a workplace. This becomes the opening sentence.',
    placeholder: 'A conversation analyst for a customer-support platform',
    multiline: false,
    required: true,
  },
  {
    id: 'job',
    question: 'What is it supposed to do?',
    help: 'Describe the work itself, not how to do it. Two or three sentences.',
    placeholder:
      'Read the recent messages on a conversation and apply the right labels to the contact when the evidence is clear.',
    multiline: true,
    required: true,
  },
  {
    id: 'act',
    question: 'When should it act?',
    help: 'One condition per line. Be concrete — these are the situations you want it to catch.',
    placeholder:
      'The customer asks for a refund outright\nThey describe a broken item and want it sorted',
    multiline: true,
    list: true,
  },
  {
    id: 'stop',
    question: 'When should it do nothing?',
    help: 'One per line. Saying where it should stay out is as important as where it acts.',
    placeholder:
      'The conversation is only about delivery timing\nYou cannot tell what they bought',
    multiline: true,
    list: true,
  },
  {
    id: 'escalate',
    question: 'When should a person take over?',
    help: 'One per line. Anything you never want handled automatically.',
    placeholder: 'Anyone who sounds distressed\nAnyone asking for a manager',
    multiline: true,
    list: true,
  },
  {
    id: 'tone',
    question: 'How should it speak?',
    help: 'Only matters if it writes anything a customer will read.',
    placeholder: 'Warm and brief. Acknowledge the problem before anything else.',
    multiline: true,
  },
  {
    id: 'never',
    question: 'Anything it must never do?',
    help: 'One per line. Hard limits worth stating outright.',
    placeholder: 'Never promise a refund\nNever invent an order number',
    multiline: true,
    list: true,
  },
];

// ------------------------------------------------------------
// User prompt template — the per-run briefing
// ------------------------------------------------------------

export const USER_PROMPT_QUESTIONS: GuideQuestion[] = [
  {
    id: 'situation',
    question: 'What has just happened when this runs?',
    help: 'One line setting the scene. Use the variable picker to drop in the live values.',
    placeholder:
      'A new message arrived in conversation {{input.conversation_id}} from contact {{input.contact_id}}.',
    multiline: true,
    required: true,
  },
  {
    id: 'context',
    question: 'What does it need handed to it?',
    help: 'Reference data it cannot work without. Pick from the variables on the right.',
    placeholder: 'Labels available, with their allowed values:\n{{tenant.classification_definitions_json}}',
    multiline: true,
  },
  {
    id: 'steps',
    question: 'What steps should it follow this time?',
    help: 'One step per line, in order. These become a numbered procedure.',
    placeholder:
      'Fetch the contact to see their current labels\nRead the last 20 messages on the conversation\nApply any label the conversation clearly supports, with a short quote as evidence',
    multiline: true,
    list: true,
  },
  {
    id: 'finish',
    question: 'How should it finish?',
    help: 'What it should output, and when to stop.',
    placeholder: 'Output the final decision and stop.',
    multiline: true,
  },
];

export function questionsFor(kind: GuideKind): GuideQuestion[] {
  return kind === 'instructions' ? INSTRUCTION_QUESTIONS : USER_PROMPT_QUESTIONS;
}

// ------------------------------------------------------------
// Composers — answers to markdown
// ------------------------------------------------------------

export type GuideAnswers = Record<string, string>;

function lines(value: string | undefined): string[] {
  return (value ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function bulletSection(title: string, value: string | undefined): string[] {
  const items = lines(value);
  if (items.length === 0) return [];
  return ['', `## ${title}`, ...items.map((i) => `- ${i}`)];
}

export function composeInstructionsFromGuide(a: GuideAnswers): string {
  const out: string[] = [];

  const role = (a.role ?? '').trim();
  if (role) out.push(`You are ${role.replace(/^(a|an|the)\s+/i, (m) => m.toLowerCase())}.`);

  const job = (a.job ?? '').trim();
  if (job) out.push('', job);

  out.push(...bulletSection('When to act', a.act));
  out.push(...bulletSection('When to do nothing', a.stop));
  out.push(...bulletSection('When to hand over to a person', a.escalate));

  const tone = (a.tone ?? '').trim();
  if (tone) out.push('', '## How to speak', tone);

  out.push(...bulletSection('Never', a.never));

  out.push('', '## Always');
  out.push('- Only act on what is actually in the conversation. Never invent information.');
  out.push('- When the evidence is unclear, do nothing and say why.');

  return out.join('\n').trim();
}

export function composeUserPromptFromGuide(a: GuideAnswers): string {
  const out: string[] = [];

  const situation = (a.situation ?? '').trim();
  if (situation) out.push(situation);

  const context = (a.context ?? '').trim();
  if (context) out.push('', context);

  const steps = lines(a.steps);
  if (steps.length > 0) {
    out.push('', 'Procedure:');
    steps.forEach((step, idx) => out.push(`${idx + 1}. ${step}`));
  }

  const finish = (a.finish ?? '').trim();
  if (finish) out.push('', finish);

  return out.join('\n').trim();
}

export function composeFromGuide(kind: GuideKind, answers: GuideAnswers): string {
  return kind === 'instructions'
    ? composeInstructionsFromGuide(answers)
    : composeUserPromptFromGuide(answers);
}

/** Blocking problems, keyed by question id. */
export function guideProblems(kind: GuideKind, answers: GuideAnswers): Record<string, string> {
  const problems: Record<string, string> = {};
  for (const q of questionsFor(kind)) {
    if (q.required && !(answers[q.id] ?? '').trim()) {
      problems[q.id] = 'Answer this before you can insert';
    }
  }
  return problems;
}
