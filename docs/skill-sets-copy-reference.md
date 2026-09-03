# Skill Sets — copy reference

Every user-facing string in the three non-engineer workflows, with the file and line to edit. Line numbers drift as the files change; the string itself is the reliable search key.

Shared strings live in two places:

- `src/app/lib/skills-data.ts` — rule group names, tool names
- `src/app/components/skills/useSkillStore.ts` — toasts fired by all workflows

---

## Shared — edit once, changes everywhere

### Rule group names · `src/app/lib/skills-data.ts` L44–60

| Group | Help text |
|---|---|
| How it speaks | Voice, warmth, formality, length of replies. |
| When to act | What has to be true before it does anything. |
| When to stop | Situations where it should do nothing at all. |
| When to get a person | What should be handed to a human straight away. |
| Anything else | Rules that don't fit the other groups. |

### Tool names · `src/app/lib/skills-data.ts` L116–145

These appear in **all three** workflows. **They are still jargon** — see the note at the bottom.

| Name | Description | Access |
|---|---|---|
| Fetch contact | Get a contact's public profile, dynamic properties, and current classifications. | Read |
| Classify contact | Apply an org-defined classification value to a contact. | Write |
| Suggest contact enrichment | Propose a value for a contact field (goes to agent approval queue). | Write |
| Fetch conversation history | Get the most recent messages on a conversation, oldest first. | Read |
| Fetch conversation messages | Fetch a contact's conversation transcript by channel, or by a message id. | Read |

### Toasts · `src/app/components/skills/useSkillStore.ts` L55–85

- `Draft saved`
- `Turned on — this version is now live`
- `Skill deleted`
- `Turned on` / `Paused`

---

## A — Guidance rules · `GuidanceWorkflow.tsx`

### List screen

| String | Line |
|---|---|
| **Skills** | L510 |
| Each skill is a short list of rules, written in plain English. No prompts, no code. | L511 |
| No skills yet. Start with one rule and add more as you go. | L521 |
| `New skill` (button) | L515, L524 |

### Editor — cards, top to bottom

| String | Line |
|---|---|
| **The basics** | L331 |
| What do you want to call it? | L332 |
| placeholder: `e.g. Refund requests` | L336 |
| What is it for? · hint: One sentence, for your teammates. | L341 |
| placeholder: `Spots refund requests and hands them to a person.` | L346 |
| **[Rule group name]** — five cards, one per group | data file |
| `Add a rule` (button per group) | L363 |
| No rules here yet. | L369 |
| **What it's allowed to do** | L391 |
| Nothing is switched on until you switch it on. | L392 |
| This one changes your data. *(shown only when a Write tool is ticked)* | L432 |
| **What the AI actually reads** | L452 |
| Written for you from the rules above. You never have to edit this. | L453 |

### Inside a single rule

| String | Line |
|---|---|
| placeholder: `Write one rule in plain English, e.g. "If someone mentions a refund, hand the conversation to a person."` | L167 |
| Turn this rule off / Turn this rule on | L185 |
| Examples (n) / Hide examples | L192 |
| **Use it when…** · placeholder `A customer asks to return an item` | L202–203 |
| **Don't use it when…** · placeholder `They are only asking about delivery time` | L209–210 |
| + Add an example | L133 |

### Header actions and the check panel

| String | Line |
|---|---|
| `Check my rules (n)` · `Save for later` · `Turn it on` | L288–293 |
| **A quick check** | L299 |
| Nothing here stops you — these are suggestions. | L300 |
| Nothing looks unclear. Good to go. | L313 |
| Give the skill a name first *(toast)* | L263 |
| Add at least one rule before turning this on *(toast)* | L268 |

### Check-panel messages (generated) · L41–73

- There are no rules yet, so this skill will not do anything.
- "…" uses a vague word. Say exactly what you mean.
- "…" is long enough to be two rules. Consider splitting it.
- "…" has no example of when it applies.
- "…" looks like a repeat of an earlier rule.

---

## B — Describe it, then refine · `DescribeWorkflow.tsx`

### List screen

| String | Line |
|---|---|
| **Skills** | L442 |
| Describe what you want in a sentence and we'll build it. You check it before anything goes live. | L443 |
| No skills yet. Tell us what you need in your own words. | L453 |
| `Describe a new skill` (button) | L447, L456 |

### Step 1 — the question

| String | Line |
|---|---|
| **What should this skill do?** | L151 |
| Describe it the way you would explain it to a new teammate. We'll turn it into a working skill you can check and change. | L152 |
| placeholder: `When someone asks about a refund, work out whether it's genuine and pass it to a person rather than answering it.` | L162 |
| Or start from one of these: | L167 |
| `Build it for me` (button) | L188 |
| tooltip when too short: `Write a sentence first` | L185 |

Example chips · L49–54

- Spot people asking about refunds and hand them to a person
- Work out what language someone writes in and save it on their contact
- Summarise a conversation once it closes so the next person can catch up
- Notice when someone sounds upset and flag them for follow-up

### Step 2 — review

| String | Line |
|---|---|
| **Here's what we built** | L224 |
| Everything below is a starting point. Change anything that looks wrong. | L137 |
| **The basics** — Name · What it's for · When it runs | L244–262 |
| **The rules we wrote** | L273 |
| Edit any of these. Delete the ones you don't want. | L274 |
| **What it's allowed to do** | L316 |
| We suggested these. Untick anything you're not comfortable with. | L317 |
| This one changes your data. | L361 |
| `Try again` · `Save for later` · `Turn it on` | L230–235 |
| Draft ready — check it over *(toast)* | L417 |
| Rebuilt from your description *(toast)* | L431 |
| Saved — not running yet *(toast)* | L405 |

### Generated rule text · L61–139

Written by `generateDraft()`. Grouped by the keywords in the description — refund/return/upset, language, summary, classification, and a fallback. Each branch writes its own rules; edit them there.

---

## C — Guided setup · `GuidedWorkflow.tsx`

### List screen

| String | Line |
|---|---|
| **Skills** | L530 |
| We'll ask you a few questions, one at a time, then show you everything before anything goes live. | L531 |
| No skills yet. It takes about two minutes to set one up. | L541 |
| `Set up a skill` (button) | L535, L544 |

### The seven questions · L63–107

| # | Question | Help text | Error when skipped |
|---|---|---|---|
| 1 | What do you want to call it? | Something your teammates will recognise in a list. | Enter a name |
| 2 | What should it do? | One or two sentences in your own words. This is what the AI follows. | Describe what it should do, in a sentence |
| 3 | When should it run? | You can change this later. | — |
| 4 | What should it be able to look at? | It can only read what you pick here. Reading never changes anything. | Pick at least one thing it can look at |
| 5 | What should it be allowed to change? | Leave everything unticked and it will only ever suggest, never act. | — |
| 6 | When should a person take over? | Describe the situations you never want handled automatically. | — |
| 7 | How much can it spend a day? | It stops when it reaches this. You can raise it later. | Enter an amount above zero |

Placeholders: `e.g. Refund requests` (L173) · `Read the recent messages, work out whether the customer is asking for a refund, and pass it to a person instead of answering.` (L186) · `Anyone who sounds distressed, mentions a complaint, or asks for a manager.` (L270)

### "When should it run?" options · L49–53, L200–206

| Option | Sub-line |
|---|---|
| Every time a customer sends a message | Most skills use this. |
| When a conversation is closed | Good for summaries and wrap-up notes. |
| Only when someone runs it by hand | Nothing happens automatically. |

### Permission warnings

| String | Line |
|---|---|
| Once this is on, the skill can change your data without asking. | L244 |
| Nothing selected — this skill will only ever read and report. | L262 |

### Review screen · L321–327

Row labels: **Name · What it does · When it runs · Can look at · Can change · Hands over when · Daily limit**

Empty handover reads `Not set`. Consequence banner (L367), shown only when something writable is ticked:

> Once you turn this on, it can change [tools] on its own, up to $[n] of work a day. You can pause it at any time.

Actions: `Save without turning on` · `Turn it on` (L378–381) · `Step n of 7` (L344) · `Continue` (L480)

---

## Known jargon still in the UI

**The tool names are the weak spot, and they show in all three workflows.** "Fetch contact", "Suggest contact enrichment", "Fetch conversation history" are developer names. Nobody in a ministry office says *fetch* or *enrichment*. Suggested rewrites:

| Current | Suggested |
|---|---|
| Fetch contact | See who the person is |
| Fetch conversation history | Read the recent messages |
| Fetch conversation messages | Read the whole conversation |
| Classify contact | Add a label to the person |
| Suggest contact enrichment | Suggest a detail for someone to approve |

Because they live in `TOOL_CATALOG`, changing them once fixes every workflow. The trade-off: the mono function name (`contacts.fetch`) still shows in the configuration form, so a technical admin keeps the precise reference while everyone else reads the plain name.

Also still present: the word **"Skill"** itself, kept because Gorgias and Sierra both use it, so there is precedent. And Guidance's blurb says *"No prompts, no code"* — it names the jargon in order to deny it, which may be worth cutting.
