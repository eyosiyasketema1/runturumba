# Turumba Campaigns Architecture

## Overview

Turumba Campaigns enables organizations to acquire and understand new seekers through public-facing campaigns (surveys and quizzes) distributed via web links, social media, and QR codes. After a participant completes a campaign, the system automatically classifies them, assigns the right mentor, recommends personalized content, and enrolls them in follow-up messaging automations.

This creates a complete funnel: **anonymous visitor → survey participant → classified seeker → matched with mentor → enrolled in drip automation**.

### Campaign Types

1. **Survey/Quiz** -- A series of questions (multiple choice, text, scale) to understand the participant
2. **Video + Quiz** -- A video at the top with questions below, followed by a tailored experience based on responses

### Distribution

Campaigns are accessed via public URLs and can be shared through:
- Direct web links (e.g., `https://campaigns.turumba.net/your-church-welcome`)
- Social media posts
- QR codes (printed materials, posters, events)

### Participants

Anonymous-first approach -- no login required. Optional contact information (name, phone, email) is collected within the survey itself.

---

## Architecture Decision

**Campaigns live inside the Messaging API.** The Messaging API already owns Seekers, Mentors, Matches, Automations, Content, and the full event-driven worker pipeline. A campaign is a public-facing entry point into this existing flow -- it collects data, creates a Seeker, and the rest of the pipeline handles classification, matching, and enrollment automatically.

---

## Data Models

All tables live in the Messaging API PostgreSQL database, extending `PostgresBaseModel` (inherits `id` UUID, `created_at`, `updated_at`).

### `campaigns`

| Column | Type | Description |
|--------|------|-------------|
| `account_id` | UUID NOT NULL | Tenant scoping (indexed) |
| `name` | VARCHAR(255) NOT NULL | Admin-facing campaign name |
| `description` | TEXT NULL | Internal description |
| `type` | VARCHAR(30) NOT NULL | `survey` or `video_quiz` |
| `status` | VARCHAR(20) DEFAULT `draft` | `draft` → `active` → `paused` → `archived` |
| `slug` | VARCHAR(100) UNIQUE NOT NULL | URL-friendly identifier for public access |
| `settings` | JSONB DEFAULT `{}` | Campaign configuration (see below) |
| `outcome_config` | JSONB DEFAULT `{}` | What happens after completion (see below) |
| `analytics` | JSONB DEFAULT `{}` | Atomic counters: views, starts, completions, conversions |
| `published_at` | TIMESTAMP WITH TZ NULL | Set when first published |
| `metadata_` | JSONB NULL | Extensible metadata |

**`settings` JSONB structure:**
```json
{
  "video_url": "https://...",
  "video_thumbnail_url": "https://...",
  "welcome_message": "Welcome to our community!",
  "completion_message": "Thank you for completing this survey!",
  "collect_contact": true,
  "contact_fields": ["name", "phone", "email"],
  "branding": {
    "logo_url": "https://...",
    "primary_color": "#4F46E5",
    "background_color": "#FFFFFF"
  },
  "language": "en"
}
```

**`outcome_config` JSONB structure:**
```json
{
  "automation_id": "uuid-of-follow-up-automation",
  "auto_classify": true,
  "auto_match": true,
  "content_recommendation_enabled": true
}
```

### `campaign_questions`

| Column | Type | Description |
|--------|------|-------------|
| `campaign_id` | UUID FK → campaigns.id | Parent campaign (indexed) |
| `order_index` | INTEGER NOT NULL | Display order |
| `type` | VARCHAR(30) NOT NULL | `multiple_choice`, `text`, `scale`, `contact_info` |
| `question_text` | TEXT NOT NULL | The question displayed to participants |
| `description` | TEXT NULL | Helper/explanatory text |
| `required` | BOOLEAN DEFAULT true | Whether answer is required |
| `config` | JSONB DEFAULT `{}` | Type-specific configuration (see below) |
| `scoring_weight` | FLOAT NULL | Weight for AI classification scoring |
| `metadata_` | JSONB NULL | Extensible metadata |

**Constraint:** `UNIQUE(campaign_id, order_index)`

**`config` JSONB by question type:**

- **multiple_choice**: `{"options": [{"value": "a", "label": "Option A", "score": 1}, ...]}`
- **scale**: `{"min": 1, "max": 10, "min_label": "Not at all", "max_label": "Very much"}`
- **text**: `{"placeholder": "Tell us about yourself...", "max_length": 500}`
- **contact_info**: `{"fields": [{"field": "name", "label": "Your Name", "required": true}, {"field": "phone", "label": "Phone Number", "required": false}, {"field": "email", "label": "Email", "required": false}]}`

### `campaign_submissions`

| Column | Type | Description |
|--------|------|-------------|
| `campaign_id` | UUID FK → campaigns.id | (indexed) |
| `account_id` | UUID NOT NULL | Denormalized from campaign for tenant queries |
| `session_id` | VARCHAR(100) NOT NULL | Anonymous browser identifier |
| `status` | VARCHAR(20) DEFAULT `in_progress` | `in_progress`, `completed`, `abandoned` |
| `answers` | JSONB DEFAULT `{}` | `{question_id: {value: ..., answered_at: "..."}}` |
| `contact_info` | JSONB NULL | `{name: "...", phone: "...", email: "..."}` |
| `seeker_id` | UUID FK → seekers.id NULL | Populated after outcome processing |
| `outcome_status` | VARCHAR(30) NULL | `pending`, `processed`, `failed` |
| `outcome_result` | JSONB NULL | Processing result details |
| `started_at` | TIMESTAMP WITH TZ NOT NULL | When participant started |
| `completed_at` | TIMESTAMP WITH TZ NULL | When participant submitted |
| `ip_address` | VARCHAR(45) NULL | For rate limiting/fraud detection |
| `user_agent` | TEXT NULL | Browser info |
| `metadata_` | JSONB NULL | |

**Index:** `(campaign_id, session_id)`

### `campaign_events` (Analytics)

| Column | Type | Description |
|--------|------|-------------|
| `campaign_id` | UUID FK → campaigns.id | (indexed) |
| `submission_id` | UUID FK → campaign_submissions.id NULL | |
| `event_type` | VARCHAR(50) NOT NULL | `view`, `start`, `question_answered`, `completed`, `contact_collected` |
| `event_data` | JSONB NULL | Event-specific payload |
| `session_id` | VARCHAR(100) NULL | |
| `ip_address` | VARCHAR(45) NULL | |
| `user_agent` | TEXT NULL | |

---

## API Endpoints

### Admin API (Authenticated)

All endpoints require JWT authentication and respect multi-tenant scoping via `x-account-ids` header from gateway.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/campaigns/` | Create campaign |
| `GET` | `/v1/campaigns/` | List campaigns (filter/sort) |
| `GET` | `/v1/campaigns/{id}` | Get campaign with questions |
| `PATCH` | `/v1/campaigns/{id}` | Update campaign |
| `DELETE` | `/v1/campaigns/{id}` | Delete campaign (204) |
| `POST` | `/v1/campaigns/{id}/publish` | Activate campaign (set status=active, published_at) |
| `POST` | `/v1/campaigns/{id}/pause` | Pause campaign |
| `POST` | `/v1/campaigns/{id}/questions` | Add question to campaign |
| `PATCH` | `/v1/campaigns/{id}/questions/{qid}` | Update question |
| `DELETE` | `/v1/campaigns/{id}/questions/{qid}` | Delete question |
| `PUT` | `/v1/campaigns/{id}/questions/reorder` | Reorder questions (accepts ordered list of IDs) |
| `GET` | `/v1/campaigns/{id}/submissions` | List submissions (filter/sort) |
| `GET` | `/v1/campaigns/{id}/submissions/{sid}` | Get submission detail |
| `GET` | `/v1/campaigns/{id}/analytics` | Aggregated campaign analytics |

### Public API (No Authentication)

These endpoints are rate-limited (60 requests/min per IP) and do not require authentication. Campaigns are resolved by slug and must have `status=active`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/public/campaigns/{slug}` | Get campaign metadata + questions |
| `POST` | `/v1/public/campaigns/{slug}/start` | Create submission, returns `session_id` + `submission_id` |
| `PATCH` | `/v1/public/campaigns/{slug}/submissions/{id}` | Save answers incrementally |
| `POST` | `/v1/public/campaigns/{slug}/submissions/{id}/complete` | Mark completed, trigger outcome processing |
| `POST` | `/v1/public/campaigns/{slug}/events` | Track analytics events (view, start, etc.) |

**Anonymous Identity:** Participants are identified by an `X-Session-Id` header generated client-side and stored in localStorage.

---

## Event-Driven Pipeline

### New Domain Events

Added to `src/events/event_type.py`:

```
CAMPAIGN_CREATED = "campaign.created"
CAMPAIGN_PUBLISHED = "campaign.published"
CAMPAIGN_SUBMISSION_STARTED = "campaign_submission.started"
CAMPAIGN_SUBMISSION_COMPLETED = "campaign_submission.completed"
CAMPAIGN_SUBMISSION_PROCESSED = "campaign_submission.processed"
```

### Campaign Outcome Worker

New worker: `src/workers/campaign_outcome_worker.py`

- **Consumes:** `campaign_submission.completed` from RabbitMQ
- **Queue:** `campaign_outcome_processing` bound to routing key `campaign_submission.completed`
- **Dead letter:** Uses existing `messaging.dlx` → `messaging.dlq`

**Processing flow for each completed submission:**

```
campaign_submission.completed event received
│
├── 1. Load submission + campaign + answers from DB
│
├── 2. Build Seeker intake_data from answers + contact_info
│      Map question answers to intake_responses format
│
├── 3. Create Seeker via SeekerCreationService.create()
│      This emits seeker.created, which triggers:
│      │
│      ├── ai_classification_worker (existing)
│      │   Classifies maturity level from intake data
│      │   Emits seeker.classified
│      │   │
│      │   └── match_proposal_worker (existing)
│      │       Proposes mentor match (rules + AI scoring)
│      │       Creates Match record
│      │
│      └── [downstream pipeline continues automatically]
│
├── 4. If outcome_config.automation_id is set:
│      Create AutomationEnrollment for the new seeker
│      → drip_engine_worker (existing) begins follow-up sequence
│
├── 5. If content_recommendation_enabled:
│      Call recommendations service for personalized content
│
├── 6. Update submission:
│      - seeker_id = new seeker's ID
│      - outcome_status = "processed"
│      - outcome_result = {seeker_id, match_id?, recommendations?}
│
└── 7. Emit campaign_submission.processed event
```

**Key insight:** The campaign_outcome_worker only needs to create a Seeker with the right intake data. The entire downstream pipeline (classify → match → enroll) is already built and triggers automatically from the `seeker.created` event.

### Analytics Counters

Campaign analytics counters (views, starts, completions, conversions) are updated via atomic PostgreSQL JSONB operations:

```sql
UPDATE campaigns
SET analytics = jsonb_set(
  analytics,
  '{completions}',
  (COALESCE(analytics->>'completions', '0')::int + 1)::text::jsonb
)
WHERE id = :campaign_id
```

A periodic batch reconciliation recalculates from `campaign_events` as a safety net.

---

## Frontend Architecture

### Admin App (existing `apps/turumba`)

New feature module following existing patterns:

```
features/campaigns/
├── components/
│   ├── campaign-list.tsx            # DataTable with status badges, type icons, analytics summary
│   ├── campaign-form.tsx            # Create/edit form (name, type, description, video URL, branding)
│   ├── campaign-detail.tsx          # Detail view with tabs: Builder | Submissions | Analytics | Settings
│   ├── question-builder.tsx         # Drag-drop question list with add/edit/reorder/delete
│   ├── question-form.tsx            # Modal/drawer for editing a single question (type-specific fields)
│   ├── question-preview.tsx         # Live preview of how question renders to participants
│   ├── campaign-preview.tsx         # Full preview of complete campaign experience
│   ├── outcome-config-form.tsx      # Configure: select automation, toggle classify/match/content
│   ├── submissions-table.tsx        # Browse submissions with answer summaries
│   ├── submission-detail.tsx        # Full submission view with all answers + outcome status
│   ├── campaign-analytics.tsx       # Funnel chart (views → starts → completions → conversions)
│   └── share-dialog.tsx             # Generate public URL, QR code, copy link, social share buttons
├── services/
│   └── index.ts                     # campaignService: CRUD + publish/pause + questions + submissions + analytics
├── types/
│   └── index.ts                     # Campaign, CampaignQuestion, CampaignSubmission, CampaignEvent types
└── index.ts                         # Barrel exports
```

**Dashboard routes:**
```
app/(dashboard)/campaigns/page.tsx           # Campaign list
app/(dashboard)/campaigns/new/page.tsx       # Create new campaign
app/(dashboard)/campaigns/[id]/page.tsx      # Campaign detail/builder
```

**Navigation:** Add "Campaigns" to the sidebar navigation in the dashboard layout.

### Public App (new `apps/campaigns`)

New lightweight Next.js app in the Turborepo monorepo. No authentication, mobile-optimized, minimal dependencies.

```
apps/campaigns/
├── app/
│   ├── layout.tsx                   # Minimal layout, loads campaign branding
│   ├── page.tsx                     # Root landing or redirect
│   ├── [slug]/
│   │   ├── page.tsx                # Campaign landing page
│   │   │                            # - Video player (if video_quiz type)
│   │   │                            # - Welcome message
│   │   │                            # - Start button
│   │   ├── questions/
│   │   │   └── page.tsx            # Question-by-question flow with progress bar
│   │   ├── complete/
│   │   │   └── page.tsx            # Completion screen
│   │   │                            # - Thank you message
│   │   │                            # - Personalized content recommendations
│   │   │                            # - Next steps / CTA
│   │   └── not-found.tsx           # Campaign not found or inactive
├── components/
│   ├── question-renderer.tsx        # Renders question by type (MC, text, scale, contact)
│   ├── video-player.tsx             # Embedded video player
│   ├── progress-bar.tsx             # Survey progress indicator
│   ├── contact-form.tsx             # Contact info collection form
│   └── recommendation-card.tsx      # Content recommendation display
├── lib/
│   ├── api.ts                       # Axios client for public API endpoints
│   └── session.ts                   # Session ID generation and localStorage management
├── package.json
├── next.config.ts
└── tailwind.config.ts
```

**Port:** New app runs on its own port (e.g., 3700) in the Turborepo dev setup.

---

## Gateway Configuration

New endpoint partial: `config/partials/endpoints/campaigns.json`

- **Admin routes** (`/v1/campaigns/**`): Standard auth + context-enricher plugin, routed to Messaging API
- **Public routes** (`/v1/public/campaigns/**`): No auth, no context-enricher, rate-limited (60 req/min per IP), routed to Messaging API

The public routes must be explicitly excluded from the context-enricher plugin's pattern matching in `config/partials/configs/plugin.json`.

---

## Implementation Phases

### Phase 1: Backend Core -- Models + Admin CRUD

Create the campaign domain entities following existing patterns:

1. Create `src/models/postgres/campaign.py` -- Campaign, CampaignQuestion, CampaignSubmission, CampaignEvent models
2. Re-export in `src/models/postgres/__init__.py` (required for Alembic)
3. Generate Alembic migration: `alembic revision --autogenerate -m "add campaign tables"`
4. Create `src/schemas/campaign.py` -- Create/Update/Response schemas
5. Create `src/services/campaigns/` -- CreationService, RetrievalService, UpdateService
6. Create `src/controllers/campaign.py` -- CampaignController extending CRUDController
7. Create `src/routers/campaign.py` -- Admin router with CRUD + publish/pause + questions management
8. Register router in `src/main.py`
9. Write tests

### Phase 2: Public API + Submission Flow

1. Create `src/controllers/campaign_public.py` -- No auth, slug-based resolution
2. Create `src/services/campaigns/submission.py` -- SubmissionService (start, save answers, complete)
3. Create `src/services/campaigns/analytics.py` -- AnalyticsService (event tracking, counter increments)
4. Create `src/routers/campaign_public.py` -- Public router with rate limiting
5. Add gateway endpoint configuration
6. Write tests

### Phase 3: Campaign Outcome Worker

1. Add new event types to `src/events/event_type.py`
2. Create `src/workers/campaign_outcome_worker.py`
3. Wire Seeker creation from submission data (reuse SeekerCreationService)
4. Wire AutomationEnrollment creation
5. Wire content recommendations
6. Integration tests verifying full pipeline: submission → seeker → classification → match

### Phase 4: Admin Frontend

1. Create `features/campaigns/` module with types and services
2. Campaign list page with DataTable
3. Campaign create/edit form
4. Question builder (drag-drop, type-specific editors)
5. Outcome configuration form
6. Submissions viewer
7. Share dialog with URL + QR code generation
8. Campaign analytics dashboard

### Phase 5: Public Frontend App

1. Create `apps/campaigns/` in Turborepo
2. Campaign landing page (fetch by slug, show video/welcome)
3. Step-by-step question flow with progress bar
4. Question renderer for each type (multiple choice, text, scale, contact info)
5. Session management (anonymous ID generation + localStorage)
6. Completion screen with personalized recommendations

### Phase 6: Analytics + Polish

1. Campaign analytics funnel visualization (views → starts → completions → conversions)
2. QR code generation (in share dialog)
3. Batch counter reconciliation worker/task
4. Campaign duplication (clone campaign with questions)
5. Campaign templates (pre-built survey templates)

---

## Verification

1. **Backend unit tests**: Run `pytest` after each phase
2. **Integration test**: Create campaign → add questions → start submission → complete → verify seeker created with correct intake data
3. **Worker test**: Verify `campaign_submission.completed` event triggers seeker creation and downstream events fire (classification, match proposal)
4. **Admin frontend**: Start dev server, create a campaign, add questions of each type, publish, verify share URL generated
5. **Public frontend**: Open campaign by slug on mobile, complete survey step-by-step, verify submission recorded
6. **Full E2E pipeline**: Complete campaign → verify seeker classified → mentor proposed → automation enrolled
