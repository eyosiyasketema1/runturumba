# Skill Sets — authoring workflow research

Research brief for choosing how non-engineers author AI skills in Turumba.

**Problem statement:** the current page asks a non-engineer to write engineering artifacts — a system prompt, a JSON Schema, and a JSON trigger object. Design goal: simple, unambiguous, usable, jargon-free, gives feedback, leads the user.

---

## 1. The headline finding

**No mature product shows a non-engineer a single raw system prompt box.** Every serious competitor decomposes the prompt into small, named, independently-editable units, and most now lead with "describe what you want" and generate the first draft.

| Product | What replaced the prompt |
|---|---|
| Intercom Fin | **Guidance** — categorised natural-language rules, max 2500 chars each |
| Gorgias | **Skills** + **Guidance** |
| Decagon | **AOPs** (Agent Operating Procedures) — deliberately echoes "SOP" |
| Salesforce Agentforce | **Topics** → Scope / Instructions / Actions |
| HubSpot Breeze | **Role** + **Personality** dropdowns — no free text at all |
| Microsoft Copilot Studio | **Topics** with descriptions |
| respond.io (closest competitor) | **Prompt templates** filling named fields |

The only products exposing a raw textarea are OpenAI's GPT Builder Configure tab and Zapier — both developer-lineage, and both auto-draft the content first.

---

## 2. Standards that back this

### Microsoft HAX — Guidelines for Human-AI Interaction (18 guidelines)

Directly applicable, with exact wording:

- **G1 — Make clear what the system can do.** "Help the user understand what the AI system is capable of doing."
- **G2 — Make clear how well the system can do what it can do.** "Help the user understand how often the AI system may make mistakes."
- **G11 — Make clear why the system did what it did.** "Enable the user to access an explanation of why the AI system behaved as it did."
- **G16 — Convey the consequences of user actions.** "Immediately update or convey how user actions will impact future behaviors of the AI system."
- **G17 — Provide global controls.** "Allow the user to globally customize what the AI system monitors and how it behaves."
- **G18 — Notify users about changes.**

G11 and G16 are where the current design is weakest: nothing explains why a skill did what it did, and toggling a write-capable tool has no visible consequence.

### Nielsen Norman Group

- **CARE** — structure a prompt as **C**ontext, **A**sk, **R**ules, **E**xamples. Directly suggests replacing one textarea with four labelled fields.
- **Progressive disclosure** — "Defer secondary options to a subsidiary screen, which focuses users' attention on the primary options." Budgets, schemas, and trigger params are textbook secondary options.
- **Wizards** — "a powerful design pattern to simplify complex processes performed infrequently or by novice users." Authoring a skill is infrequent and novice-performed.

### Google PAIR — People + AI Guidebook

- **Explainability + Trust** — users "shouldn't trust the system completely, but rather should know when to trust the system's predictions and when to apply their own judgment."
- **Errors + Graceful Failure** — "focus on what users can do after the system fails"; provide graceful degradation.
- **Mental Models** — set expectations before the user commits.

### IBM — 6 Design Principles for Generative AI Applications (CHI 2024)

Most relevant: **Design for Generative Variability** (same config produces different outputs run to run — so preview real runs, don't assume the prompt determines behaviour) and **Design for Imperfection** (build correction into the config UI).

### ISO 9241-110:2020 — Interaction principles (7)

Suitability for the task · Self-descriptiveness · Conformity with user expectations · Learnability · Controllability · Use error robustness · User engagement.

*Suitability for the task* is explicitly about basing the dialogue on task characteristics "rather than the technology chosen to perform the task." A JSON editor is the technology showing through.

### ISO 24495-1:2023 — Plain language

Four principles: content must be **relevant, findable, understandable, and usable** for its readers.

### GOV.UK Service Manual

- **One thing per page** — "low confidence users find them easier to use… better at handling errors, branches, loops and saving progress."
- **Check your answers** — a review page before final submit. Documented benefits: higher completion rates, lower error rates.
- **Error messages** — tell the user how to fix it; never "valid/invalid", never jargon or codes; echo the field label; show both a summary at top and inline messages.

### WCAG 2.2 — forms

- 3.3.1 Error Identification — **A**
- 3.3.2 Labels or Instructions — **A**
- 3.3.3 Error Suggestion — **AA**
- 3.3.7 Redundant Entry — **A**
- 3.3.8 Accessible Authentication — **AA**

**Note:** there is no ISO/W3C-tier standard specific to no-code AI agent builders. Items above are the citable foundation; competitor patterns are corroboration, not authority.

---

## 3. The three options

### Option A — Guidance rules

Replace the prompt with a list of short, named, plain-English rules. Each has a category (Tone, When to act, When to stop, Escalation), an optional audience/channel scope, and — critically — **positive and negative examples**: "Apply when…" / "Don't apply when…".

**Evidence:** Intercom Fin Guidance, Gorgias Guidance, Decagon AOPs, Salesforce Topic scope. Four independent vendors converged here.

**Standards:** NN/g CARE (rules and examples become first-class fields); ISO 9241-110 self-descriptiveness; ISO 24495-1 (each rule is short enough to be understandable in isolation).

**Why it's strong:** a rule is reviewable, testable, and deletable on its own. A 400-word prompt is none of those. Non-engineers can reason about "when should this apply" far better than about prompt phrasing. Example-based scoping lets someone teach intent by pointing at real conversations instead of writing conditions.

**Trade-off:** only fits skills matching the read-conversation → infer → write-to-contact shape. Needs an escape hatch, and composing many rules can produce contradictions — which is why Intercom built a linter for exactly this.

---

### Option B — Describe it, then refine

Primary entry is one question: *"What should this skill do?"* The system drafts instructions, suggests tools, proposes a trigger and output shape. The user reviews and edits in a structured view. Structure becomes the **editing** surface, not the **creation** surface.

**Evidence:** OpenAI GPT Builder (Create tab → Configure tab), Zapier Agents, Sierra Journeys, Salesforce Agentforce Builder, Copilot Studio NL topic authoring, Decagon AOP Copilot. This is now the default entry point across the category, not an alternative.

**Standards:** PAIR Mental Models (a generated draft teaches what a good definition looks like); NN/g progressive disclosure; ISO 9241-110 learnability.

**Why it's strong:** kills the blank page, which is the single biggest barrier for a non-writer. It also *teaches* — after two or three generated drafts a coordinator learns the shape of a good skill.

**Trade-off:** people ship things they don't understand. Mitigate by making the generated result fully visible and editable, never a black box, and pairing it with a mandatory review step.

---

### Option C — Guided setup

A short wizard, one question per screen: What should it do → When should it run → What can it see → What can it change → Limits → **Review** → Activate. Templates seed the wizard rather than sitting in a separate modal.

**Evidence:** HubSpot Breeze (Role/Personality dropdowns, no free text), Zendesk's 3-page no-code wizard.

**Standards:** GOV.UK one-thing-per-page and check-your-answers; NN/g wizards; WCAG 3.3.7 (don't re-ask for what's already known); HAX G16 (consequence before commit).

**Why it's strong:** the strongest at *leading* the user, which was one of your stated goals. The review step is the highest-leverage single screen — GOV.UK attributes both higher completion and lower error rates to it.

**Trade-off:** wizards are good for creation and bad for editing. Needs the form to remain as the edit surface, so this is additive rather than a replacement — a cost worth naming.

---

## 4. What applies regardless of which option wins

These came up repeatedly and are independent of the authoring model:

1. **"Show reasoning" in testing.** Four vendors converged on this independently under four names: Salesforce **Plan Tracer**, Gorgias **Show reasoning**, HubSpot **Message Insights**, respond.io **source citations**. It gives a non-engineer a debug trace without showing them a debugger. This is the strongest pattern in the whole scan and Turumba currently has nothing like it. Satisfies HAX G11.

2. **Test on real past conversations, safely.** respond.io lets you test unpublished agents against real content while never touching real contacts, and documents candidly what *can't* be simulated. Our "Run a test" button is currently a stub.

3. **Lint the configuration, not just the output.** Intercom's writing assistant flags ambiguity, redundancy, contradiction, and "system limitations" before a rule can go live. This is distinct from validating syntax — it reviews meaning.

4. **Never auto-enable a tool.** No product auto-infers capabilities without explicit confirmation. Suggest, always confirm. Our Read/Write badges are good; the consequence of enabling a Write tool should be spelled out (HAX G16).

5. **Keep draft/active.** Near-universal, and we already have it. Worth protecting in any redesign.

6. **Separate knowledge from instructions.** OpenAI states it most crisply: "use knowledge for reference material, not rules or behavior."

---

## 5. Jargon to remove

The two hard blockers are **Output schema** and **Trigger params** — both raw JSON. Neither belongs on a non-engineer's screen; both should sit behind an advanced disclosure with a generated default.

| Current | Problem | Suggested |
|---|---|---|
| System prompt / Instructions | Term of art | **How it should behave** |
| User prompt template | Two jargon words | **What it gets told each time** |
| Output mode: structured (JSON) | Meaningless to a coordinator | **Answer format: fixed fields / free text** |
| Output schema | Raw JSON Schema | Generated from chosen fields; JSON behind "Advanced" |
| Trigger / Trigger params | Raw JSON object | **When it runs** — a sentence builder |
| Tools | Ambiguous | **What it can do** (already grouped Read/Write — good) |
| Max iterations | Implementation detail | **How many steps before it gives up** |
| Provider connection | Vendor plumbing | **AI service** |

Current validation copy also breaks GOV.UK rules — "Trigger params are not valid JSON" tells the user what's wrong but not how to fix it, and uses two jargon terms.

---

## 6. Recommendation

**B + C as the create path, A as the edit surface, plus "show reasoning" testing across all of them.**

Concretely: a new skill starts with "describe what it should do" (B), the generated draft is reviewed through a short guided sequence ending in a check-your-answers screen (C), and thereafter it's maintained as a list of individually-editable rules (A). The current configuration form survives as the advanced view for technical admins, reachable but never the default.

That composite matches where the category has landed, and each part is defensible against a named standard rather than taste.

**Open question that changes the weighting:** who authors a skill at a customer org — a technical admin, or a ministry coordinator? If it's genuinely both, the "advanced view" isn't a fallback, it's a first-class second surface, and that changes the information architecture.

---

## Sources

**Standards**
- [Microsoft HAX — Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/) · [Amershi et al., CHI 2019](https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/)
- [Google PAIR — People + AI Guidebook](https://pair.withgoogle.com/guidebook-v2/chapters) · [Explainability + Trust](https://pair.withgoogle.com/guidebook-v2/chapter/explainability-trust/) · [Errors + Graceful Failure](https://pair.withgoogle.com/worksheet/errors-failure.pdf)
- [NN/g — CARE prompt structure](https://www.nngroup.com/videos/care-for-ai-prompts/) · [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) · [Wizards](https://www.nngroup.com/articles/wizards/)
- [IBM — Design Principles for Generative AI Applications (CHI 2024)](https://dl.acm.org/doi/fullHtml/10.1145/3613904.3642466)
- [EN ISO 9241-110:2020 — Interaction principles](https://standards.iteh.ai/catalog/standards/cen/7cfeb7e3-9a82-44af-871c-116631d1d051/en-iso-9241-110-2020)
- [ISO 24495-1:2023 — Plain language](https://plainlanguage.com/what-is-plain-language/iso-plain-language-standard/)
- [GOV.UK — One thing per page](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/) · [Check your answers](https://www.gov.uk/service-manual/design/check-your-answers-pages) · [Error summary](https://design-system.service.gov.uk/components/error-summary/)
- [W3C — Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/)

**Products**
- [Intercom Fin — Guidance](https://www.intercom.com/help/en/articles/10210126-provide-fin-ai-agent-with-specific-guidance) · [Tasks](https://www.intercom.com/help/en/articles/10257113-how-to-set-up-fin-tasks)
- [Zendesk — Generative procedures](https://support.zendesk.com/hc/en-us/articles/10040865503898-Managing-generative-procedures-for-AI-agents)
- [Salesforce — Writing effective natural language instructions](https://developer.salesforce.com/blogs/2025/01/how-to-write-effective-natural-language-instructions-for-agentforce)
- [Microsoft Copilot Studio — Create and edit topics](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-create-edit-topics)
- [HubSpot — Create a customer agent](https://knowledge.hubspot.com/customer-agent/create-a-customer-agent)
- [Decagon — From SOPs to AOPs](https://decagon.ai/blog/from-sops-to-agent-operating-procedures)
- [Gorgias — Guidance](https://docs.gorgias.com/en-US/create-guidance-to-give-ai-agent-custom-instructions-1362592) · [How AI Agent improves over time](https://docs.gorgias.com/en-US/how-ai-agent-improves-over-time-1993179)
- [Zapier — Build an agent](https://help.zapier.com/hc/en-us/articles/24393442652557-Build-an-agent-in-Zapier-Agents) · [Publish and manage versions](https://help.zapier.com/hc/en-us/articles/42070243063053)
- [OpenAI — Creating and editing GPTs](https://help.openai.com/en/articles/8770868-gpt-builder)
- [respond.io — How to test AI agents](https://respond.io/help/ai-agents/how-to-test-ai-agents) · [Using prompt templates](https://respond.io/help/ai-agents/using-prompt-templates)
- [Botpress — developer-oriented, cited as too technical for non-engineers](https://www.eesel.ai/blog/botpress)
