# Turumba — Mentor Mobile App Specification

> **Purpose of this document**: This is a comprehensive specification for Claude (or any AI/developer) to build the **Turumba mobile app** — the mentor-facing companion to the Turumba web platform. It covers every screen, feature, data model, interaction pattern, and branding detail needed to produce a faithful, production-ready mobile application.

---

## 1. Product Overview

### 1.1 What is Turumba?

Turumba is a discipleship and ministry SaaS platform that connects **mentors** with **seekers** (people exploring or growing in faith). The platform manages the entire discipleship lifecycle — from initial contact and mentor matching through faith journey tracking, milestone completion, and graduation.

### 1.2 What is the Mobile App?

The mobile app is the **mentor-facing** companion app. It gives mentors everything they need to disciple their assigned seekers on the go:

- Chat with assigned seekers in real time
- View and update seeker profiles, engagement scores, and maturity levels
- Track faith journeys and milestones
- Receive push notifications for new messages and assignments
- Access assigned content to share with seekers
- Participate in mentor group chats

### 1.3 Who Uses It?

The primary user is a **Mentor** — a person guiding one or more seekers in their faith journey. Mentors typically have 3–5 active seekers and check the app multiple times daily to respond to messages, update progress, and review engagement.

### 1.4 Core User Stories

1. **As a mentor**, I want to see all my assigned seekers and their current status so I can prioritize who needs attention.
2. **As a mentor**, I want to chat with my seekers in real time so I can guide them through questions and struggles.
3. **As a mentor**, I want to update a seeker's maturity level and milestones so their progress is tracked accurately.
4. **As a mentor**, I want to receive notifications when a seeker messages me so I can respond promptly.
5. **As a mentor**, I want to view my seeker's faith journey progress so I know where they are in their discipleship path.
6. **As a mentor**, I want to share devotionals and content with my seekers from the content library.
7. **As a mentor**, I want to participate in mentor group chats to collaborate with other mentors.
8. **As a mentor**, I want to see my own profile, capacity, and workload at a glance.

---

## 2. Branding & Design System

### 2.1 Typography

**Primary Font**: DM Sans (Google Fonts)
- Weights used: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)
- Fallback stack: `system-ui, -apple-system, sans-serif`
- Base font size: **14px**

**Heading Hierarchy**:
| Level | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| H1 | text-2xl | 700 | 1.25 | -0.02em |
| H2 | text-xl | 700 | 1.3 | -0.01em |
| H3 | text-lg | 600 | 1.4 | — |
| H4 | text-base | 600 | 1.5 | — |
| Label | text-sm | 500 | 1.5 | — |
| Button | text-sm | 500 | 1.5 | — |
| Input | text-sm | 400 | 1.5 | — |

**Section Labels Pattern** (used throughout for visual hierarchy):
`text-xs font-bold text-muted-foreground uppercase tracking-wider`

### 2.2 Color Palette

#### Light Mode (Default)

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#2563eb` | Primary buttons, active states, links, focus rings |
| `--primary-foreground` | `#ffffff` | Text on primary backgrounds |
| `--background` | `#ffffff` | Page/screen background |
| `--foreground` | `#0f172a` | Primary text color |
| `--card` | `#ffffff` | Card surfaces |
| `--card-foreground` | `#0f172a` | Text on cards |
| `--secondary` | `#f1f5f9` | Secondary buttons, subtle backgrounds |
| `--secondary-foreground` | `#1e293b` | Text on secondary backgrounds |
| `--muted` | `#f8fafc` | Muted backgrounds, disabled states |
| `--muted-foreground` | `#64748b` | Secondary/helper text |
| `--accent` | `#eff6ff` | Accent highlights, hover states |
| `--accent-foreground` | `#1e40af` | Text on accent backgrounds |
| `--destructive` | `#ef4444` | Delete, error, danger actions |
| `--destructive-foreground` | `#fafafa` | Text on destructive backgrounds |
| `--border` | `#e2e8f0` | Borders, dividers, separators |
| `--input` | `#e2e8f0` | Input field borders |
| `--ring` | `#2563eb` | Focus rings |

#### Dark Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#3b82f6` | Primary actions (slightly lighter blue) |
| `--background` | `#0f172a` | Page background |
| `--foreground` | `#f1f5f9` | Primary text |
| `--card` | `#1e293b` | Card surfaces |
| `--secondary` | `#1e293b` | Secondary surfaces |
| `--muted` | `#1e293b` | Muted backgrounds |
| `--muted-foreground` | `#94a3b8` | Secondary text |
| `--accent` | `#1e3a5f` | Accent backgrounds |
| `--accent-foreground` | `#93c5fd` | Accent text |
| `--border` | `#1e293b` | Borders |

#### Chart / Data Visualization Colors

| Token | Hex | Name |
|-------|-----|------|
| `--chart-1` | `#2563eb` | Blue (primary metric) |
| `--chart-2` | `#10b981` | Emerald (positive/growth) |
| `--chart-3` | `#f59e0b` | Amber (warning/attention) |
| `--chart-4` | `#8b5cf6` | Violet (accent metric) |
| `--chart-5` | `#ef4444` | Red (negative/decline) |

#### Semantic Colors Used in Components

| Purpose | Color | Hex |
|---------|-------|-----|
| Online status dot | Emerald 500 | `#10b981` |
| Offline status dot | Slate 300 | `#cbd5e1` |
| Admin badge | Primary/10 | `#2563eb1a` |
| Success toast | Emerald | `#10b981` |
| Warning | Amber 600 | `#d97706` |
| Mentor sender colors | Indigo, Emerald, Orange, Rose, Cyan, Violet, Amber, Teal, Pink, Blue | various |

### 2.3 Border Radius

The app uses a **sharp, editorial, modern aesthetic** with minimal rounding:

| Token | Value |
|-------|-------|
| `--radius` (base) | `0.125rem` (2px) |
| `--radius-sm` | `calc(var(--radius) - 4px)` |
| `--radius-md` | `calc(var(--radius) - 2px)` |
| `--radius-lg` | `var(--radius)` (2px) |
| `--radius-xl` | `calc(var(--radius) + 4px)` (6px) |

**Note for mobile**: While the web app uses very sharp corners (2px base), the mobile app may use slightly larger radii (8-12px) for touch targets like buttons and cards for better usability, while keeping the overall sharp aesthetic. Avatars remain fully rounded (full border-radius).

### 2.4 Spacing & Layout Patterns

- Cards use `p-3.5` to `p-6` padding
- List items use `px-3 py-2.5` for comfortable touch targets
- Section gaps: `space-y-4` to `space-y-5`
- Icon sizes: `w-3.5 h-3.5` (inline), `w-4 h-4` (standard), `w-5 h-5` (section headers)
- Avatar sizes: `w-8 h-8` (list items), `w-10 h-10` (headers), `w-16 h-16` (profile)

### 2.5 Icon Library

The app uses **Lucide React** icons exclusively (200+ icons). The mobile app should use the equivalent icon set for its framework (e.g., `lucide-react-native` for React Native, or the SVG set for Flutter).

---

## 3. App Architecture & Navigation

### 3.1 Navigation Structure

The mobile app uses a **bottom tab navigation** with 5 primary tabs:

```
┌─────────────────────────────────────┐
│           [Active Screen]           │
│                                     │
│                                     │
├─────┬─────┬─────┬─────┬─────┤
│ Home│Chats│Seekr│Jrny │ Me  │
└─────┴─────┴─────┴─────┴─────┘
```

| Tab | Icon | Label | Description |
|-----|------|-------|-------------|
| 1 | `LayoutDashboard` | Home | Dashboard with key metrics and activity feed |
| 2 | `MessageCircle` | Chats | All conversations (1:1 with seekers + group chats) |
| 3 | `Users` | Seekers | Assigned seekers list with status overview |
| 4 | `Route` | Journeys | Faith journeys and milestones for assigned seekers |
| 5 | `User` | Profile | Mentor profile, settings, capacity |

### 3.2 Screen Hierarchy

```
Home (Tab 1)
├── Dashboard metrics (active seekers, matches, engagement score, completion rate)
├── Activity feed (recent events)
└── Quick actions (new message, view notifications)

Chats (Tab 2)
├── Conversation list (1:1 seeker chats + mentor group chats)
│   ├── Unread badge counts
│   ├── Last message preview
│   ├── Online status indicator
│   └── Channel badge (in-app)
├── Chat Detail Screen
│   ├── Message thread (text, images, voice, polls, forwarded, replies)
│   ├── Compose bar (text input, attach, voice, emoji)
│   ├── Message actions (reply, forward, copy, delete, edit)
│   ├── Read receipts (sent, delivered, read)
│   └── Seeker info header (tap to view profile)
└── Group Chat Detail Screen
    ├── Group message thread
    ├── Polls (create, vote, view results)
    ├── Group info panel (members, admin actions)
    └── Message search

Seekers (Tab 3)
├── Seeker list (assigned seekers with maturity level, engagement score)
│   ├── Search and filter
│   ├── Status chips (Active, Pending, Inactive, Graduated, Archived)
│   └── Engagement score indicator
├── Seeker Detail Screen
│   ├── Profile header (name, avatar, maturity level, status)
│   ├── Contact info (phone, email, preferred language)
│   ├── Engagement score (0-100 with visual bar)
│   ├── Milestones section (Salvation, Baptism, Community, Growth)
│   ├── Faith journey progress
│   ├── Assigned content
│   ├── Notes (mentor notes with timestamps)
│   └── Quick actions (message, update status, assign content)
└── Edit Seeker Screen
    ├── Update maturity level
    ├── Update discipleship status
    ├── Update engagement score
    ├── Edit spiritual background
    └── Add/edit notes

Journeys (Tab 4)
├── Journey list (all assigned seekers' journeys)
│   ├── Filter by type (Salvation, Baptism, Community, Growth)
│   ├── Filter by stage (Touchpoint, Engaged, Active Journey, Decision)
│   └── Progress indicator (e.g., 3/7)
├── Journey Detail Screen
│   ├── Seeker info
│   ├── Journey type and source
│   ├── Current stage with visual progress
│   ├── Milestone checklist
│   └── Validation status
└── Milestone Detail Screen
    ├── 4 core milestones with states (Done, Progress, Pending)
    ├── Sub-milestones list
    ├── Completion dates
    └── Update milestone status

Profile (Tab 5)
├── Mentor profile card
│   ├── Avatar, name, specialty
│   ├── Languages
│   ├── Capacity meter (e.g., 4/5 seekers)
│   ├── Load percentage
│   ├── Experience level
│   └── Bio
├── Notifications settings
├── Content Library (browse/search available content)
│   ├── Devotionals, Bible Studies, Prayer Guides, Challenges
│   ├── Filter by category, difficulty, language
│   └── Share content with seeker
├── App settings (dark mode toggle, notification preferences)
└── Sign out
```

---

## 4. Data Models

### 4.1 Mentor (Current User)

```typescript
interface MentorProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  bio: string;
  specialty: string;           // e.g., "New Believers, Grief"
  languages: string;           // e.g., "EN, AM"
  capacity: string;            // e.g., "4/5"
  load: number;                // 0-100 workload percentage
  experience: "Beginner" | "Intermediate" | "Experienced" | "Senior";
  gender: "female" | "male";
  strengths: string[];         // Tagged expertise areas
  joined: string;              // ISO date string
}
```

### 4.2 Seeker (Contact)

```typescript
interface Seeker {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  avatar?: string;
  tags: string[];
  groupIds: string[];
  createdAt: string;
  customAttributes?: Record<string, string>;

  // Discipleship-specific fields
  maturity: "Interested" | "Pre-Seeker" | "Seeker" | "New Believer" | "Growing" | "Mature" | "Leader";
  engagement: number;          // 0-100
  discipleshipStatus: "Active" | "Pending" | "Inactive" | "Graduated" | "Archived";
  assignedMentorId: string;
  preferredLanguage?: string;
  spiritualBackground?: string;
}
```

### 4.3 Message

```typescript
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderColor?: string;        // For group chats, each sender has a unique color
  content: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read" | "failed";

  // Message type flags
  isAnnouncement?: boolean;
  isPinned?: boolean;
  isVoiceMessage?: boolean;
  isImage?: boolean;
  isPoll?: boolean;
  isForwarded?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;

  // Relationships
  replyTo?: string;            // Message ID being replied to
  forwardedFrom?: string;      // Source name if forwarded
  reactions?: Reaction[];
  readBy?: string[];           // User IDs who read the message
  poll?: Poll;                 // Poll data if isPoll
}

interface Reaction {
  emoji: string;
  count: number;
  reactedBy: string[];
}

interface Poll {
  id: string;
  question: string;
  options: Array<{
    text: string;
    votes: number;
    votedBy: string[];
  }>;
  totalVotes: number;
  isAnonymous?: boolean;
}
```

### 4.4 Conversation

```typescript
interface Conversation {
  id: string;
  seekerId: string;
  seekerName: string;
  seekerAvatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: "Open" | "Assigned" | "Pending" | "Resolved" | "Closed";
  priority: "Urgent" | "High" | "Normal" | "Low";
  isOnline: boolean;
  maturityLevel: string;       // Seeker's current maturity level
}
```

### 4.5 Group Chat

```typescript
interface GroupChat {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  members: GroupMember[];
  messages: Message[];
  pinnedMessageId?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
}

interface GroupMember {
  id: string;
  name: string;
  avatar: string | null;
  role: "admin" | "member";
  online: boolean;
  muted?: boolean;
}
```

### 4.6 Faith Journey

```typescript
interface FaithJourney {
  id: string;
  seekerId: string;
  type: "Salvation" | "Baptism" | "Community" | "Growth";
  stage: "Touchpoint" | "Engaged" | "Active Journey" | "Decision";
  source: "Telegram" | "WhatsApp" | "SMS" | "Self-guided" | "Messenger" | "Conversation";
  progress: number;            // Current step (e.g., 3)
  totalSteps: number;          // Total steps (e.g., 7)
  currentMilestone: string;    // Label of current milestone
  validation: "Pending" | "Confirmed" | "N/A";
  language: string;
  startedAt: string;
}
```

### 4.7 Milestones

```typescript
interface MilestoneEntry {
  key: "salvation" | "baptism" | "community" | "growth";
  label: string;
  date: string;
  state: "done" | "progress" | "pending";
  subItems: string[];          // Sub-milestone descriptions
}

interface SeekerMilestones {
  seekerId: string;
  milestones: MilestoneEntry[];
}
```

### 4.8 Content Item

```typescript
interface ContentItem {
  id: string;
  title: string;
  type: "Devotional" | "Study" | "Guide" | "Challenge" | "Bible Study";
  category: "Salvation" | "Prayer" | "Bible Basics" | "Community";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  language: string;
  status: "Draft" | "Published" | "Archived";
  summary: string;
  body: string;
  tags: string[];
  author: "curated" | "ai_generated";
  readTimeMin: number;
  stats: {
    views: number;
    engagement: number;
    completion: number;
  };
}
```

### 4.9 Notification

```typescript
interface Notification {
  id: string;
  type: "new_message" | "new_assignment" | "milestone_reached" | "journey_update" | "match_proposed" | "system";
  title: string;
  body: string;
  seekerId?: string;
  conversationId?: string;
  read: boolean;
  createdAt: string;
}
```

---

## 5. Screen-by-Screen Specifications

### 5.1 Home / Dashboard

**Purpose**: Give the mentor a quick overview of their workload and recent activity.

**Layout**:
- Greeting header: "Good morning, [Name]" with date
- 4 metric cards in a 2x2 grid:
  - **Active Seekers**: Count with trend arrow (e.g., "12 ↑2")
  - **Completion Rate**: Percentage (e.g., "67%")
  - **Engagement Score**: 0-100 (e.g., "78/100")
  - **Pending Actions**: Count of items needing attention
- **Activity Feed**: Scrollable list of recent events
  - "[Seeker] completed Salvation milestone" — timestamp
  - "New match proposed: [Seeker]" — timestamp
  - "[Seeker] sent you a message" — timestamp
  - "Content assigned: [Title]" — timestamp

**Interactions**:
- Tap metric card → navigate to relevant screen
- Tap activity item → navigate to relevant seeker/conversation
- Pull to refresh

---

### 5.2 Chats — Conversation List

**Purpose**: Show all active conversations (1:1 with seekers + mentor group chats).

**Layout**:
- Search bar at top (search by seeker name or message content)
- Segmented control: "Seekers" | "Groups"
- Conversation list items:
  - Avatar (with online dot: emerald for online, slate for offline)
  - Seeker name (bold if unread)
  - Last message preview (truncated, 1 line)
  - Timestamp (relative: "2m", "1h", "Yesterday")
  - Unread count badge (primary blue circle with white number)
  - Priority indicator (colored dot: red=urgent, orange=high)

**Sorting**: By last message time, descending. Unread conversations float to top.

**Interactions**:
- Tap conversation → open Chat Detail
- Long press → quick actions (pin, mute, mark read)
- Pull to refresh
- FAB button (+) → start new conversation (select from assigned seekers)

---

### 5.3 Chats — Chat Detail (1:1 with Seeker)

**Purpose**: Full messaging interface for mentor-seeker conversation.

**Header**:
- Back arrow
- Seeker avatar (with online status dot)
- Seeker name + maturity level badge (e.g., "New Believer")
- Tap header → opens Seeker Detail Screen

**Message Bubbles**:
- **Sent messages** (mentor): Right-aligned, primary blue background (`#2563eb`), white text
- **Received messages** (seeker): Left-aligned, muted background (`#f8fafc`), dark text
- Each bubble shows: content, timestamp, read receipt icon (✓ sent, ✓✓ delivered, ✓✓ blue = read)
- **Deleted messages**: Show tombstone "You deleted this message" or "[Name] deleted this message" in italic muted text
- **Edited messages**: Show "(edited)" label next to timestamp
- **Forwarded messages**: Show "Forwarded" label with source
- **Reply messages**: Show quoted reply preview above the message content
- **Image messages**: Thumbnail with tap to expand
- **Voice messages**: Waveform visualization with play/pause button and duration

**Reactions**:
- Long press message → reaction picker (emoji bar)
- Reactions display below message bubble as small emoji chips with count

**Message Actions** (long press or swipe):
- Reply
- Forward
- Copy
- Edit (own messages only)
- Delete (own messages only, shows tombstone)

**Compose Bar**:
- Text input field with placeholder "Type a message..."
- Attachment button (📎) → camera, gallery, file picker
- Voice record button (🎤) — hold to record, release to send
- Send button (→) — appears when text is entered, replaces voice button
- Reply/Edit banner: When replying or editing, show context banner above compose bar with X to cancel

**Features**:
- Scroll to load older messages
- "New messages" floating button when scrolled up
- Message search (tap search icon in header)

---

### 5.4 Chats — Group Chat Detail

**Purpose**: Mentor-to-mentor group conversations.

**Same as Chat Detail (5.3) with these additions**:

- **Sender names**: Display above each message in the sender's assigned color
- **Sender colors**: Each group member gets a unique color from the palette (indigo, emerald, orange, rose, cyan, violet, amber, teal, pink, blue)
- **Announcements**: Special bubble with megaphone icon, full-width, subtle accent background
- **Pinned messages**: Tap pinned bar at top to scroll to pinned message
- **Polls**:
  - Create: Tap poll icon in compose → enter question + options, toggle anonymous
  - Vote: Tap an option to vote, see real-time results
  - Results: Progress bars per option, winning option highlighted in emerald (`#10b981`)
  - Edit: Poll creator can edit question/options (resets votes with warning)
  - Style: Neutral gray background (`bg-muted/40 border border-border`), not primary blue
- **Group Info**: Tap group name in header → slide-in panel showing:
  - Group name, description, member count
  - Member list with role badges (Admin/Member), online status
  - Admin actions: Edit group, add/remove members, promote/demote admin, mute member
  - Leave group / Delete group (admin only)

---

### 5.5 Seekers — Seeker List

**Purpose**: View all assigned seekers with key status indicators.

**Layout**:
- Search bar
- Filter chips: All, Active, Pending, Inactive, Graduated
- Seeker list items:
  - Avatar with initials
  - Name (bold)
  - Maturity level chip (color-coded):
    - Interested → slate
    - Pre-Seeker → amber
    - Seeker → blue
    - New Believer → emerald
    - Growing → violet
    - Mature → indigo
    - Leader → primary
  - Engagement score bar (0-100, color: red <30, amber 30-60, emerald >60)
  - Status badge (Active=green, Pending=amber, Inactive=slate)
  - Last active timestamp

**Sorting**: By engagement score (ascending = needs attention first), or alphabetical.

**Interactions**:
- Tap seeker → Seeker Detail Screen
- Search filters list in real time

---

### 5.6 Seekers — Seeker Detail

**Purpose**: Complete view of a seeker's discipleship profile.

**Layout**:

**Profile Header Card**:
- Large avatar (w-16 h-16) with initials
- Name (H2, bold)
- Maturity level chip
- Discipleship status chip
- "Message" button (primary) + "Edit" button (outline)

**Contact Info Section**:
- Label: "CONTACT INFORMATION"
- Phone number (tap to call)
- Email (tap to compose)
- Preferred language
- Spiritual background

**Engagement Section**:
- Label: "ENGAGEMENT"
- Score: Large number (0-100) with circular progress indicator
- Color: Red (<30), Amber (30-60), Emerald (>60)
- Trend: ↑ or ↓ from last period

**Milestones Section**:
- Label: "MILESTONES"
- 4 milestone cards in a vertical list:
  - Salvation: icon + label + state chip (Done ✓ / In Progress ◐ / Pending ○) + date if done
  - Baptism: same pattern
  - Community: same pattern
  - Growth: same pattern
- Tap milestone → expand to show sub-milestones
- State colors: Done = emerald, Progress = amber, Pending = slate

**Faith Journey Section**:
- Label: "FAITH JOURNEY"
- Journey type + stage
- Visual progress bar (current/total steps)
- Source badge
- Validation status

**Notes Section**:
- Label: "MENTOR NOTES"
- List of timestamped notes by the mentor
- "Add Note" button at bottom
- Each note shows: content, date, mentor name

**Assigned Content Section**:
- Label: "ASSIGNED CONTENT"
- List of assigned devotionals/studies with completion status
- "Assign Content" button → opens content library picker

---

### 5.7 Seekers — Edit Seeker

**Purpose**: Update a seeker's discipleship details.

**Fields** (each with proper label styling):
- Maturity Level: Dropdown selector with 7 options
- Discipleship Status: Dropdown with 5 options
- Engagement Score: Number input (0-100) or slider
- Preferred Language: Text input
- Spiritual Background: Multi-line text input
- Tags: Tag chips with add/remove

**Actions**:
- Save Changes (primary button)
- Cancel (outline button)
- Confirmation toast on save

---

### 5.8 Journeys — Journey List

**Purpose**: Overview of all assigned seekers' faith journeys.

**Layout**:
- Filter bar: Journey type (Salvation, Baptism, Community, Growth) + Stage
- Journey cards:
  - Seeker name + avatar
  - Journey type badge (color-coded)
  - Stage label
  - Progress bar (e.g., 3/7 steps — visual fill)
  - Current milestone label
  - Validation status chip (Pending = amber, Confirmed = emerald, N/A = slate)
  - Source badge (where they came from)

**Interactions**:
- Tap card → Journey Detail Screen
- Filter updates list in real time

---

### 5.9 Journeys — Journey Detail

**Purpose**: Detailed view of a single seeker's faith journey.

**Layout**:
- Seeker header (avatar, name, tap to go to profile)
- Journey type + source
- Stage progression visualization (horizontal stepper or vertical timeline):
  - Touchpoint → Engaged → Active Journey → Decision
  - Current stage highlighted in primary blue
  - Completed stages in emerald
  - Future stages in muted slate
- Progress: "Step 3 of 7" with progress bar
- Current milestone label
- Validation status with action button ("Mark Confirmed")
- Milestone checklist (expandable):
  - Each milestone with done/progress/pending state
  - Tap to toggle state
  - Sub-milestones nested under each

---

### 5.10 Profile — Mentor Profile

**Purpose**: View and edit the mentor's own profile.

**Layout**:
- Profile card:
  - Avatar (large, with edit camera overlay)
  - Name (H2)
  - Specialty (muted text)
  - Experience level badge
- Stats row:
  - Capacity: visual meter "4/5" with progress bar
  - Load: percentage with color (green <60, amber 60-80, red >80)
  - Active since: join date
- Details section:
  - Languages
  - Gender
  - Strengths (tag chips)
  - Bio (multi-line)
- Edit Profile button → editable form

---

### 5.11 Profile — Content Library

**Purpose**: Browse and share content with seekers.

**Layout**:
- Search bar
- Filter tabs: All, Devotionals, Bible Studies, Prayer Guides, Challenges
- Filter chips: Difficulty (Beginner, Intermediate, Advanced), Language
- Content cards:
  - Title (bold)
  - Type badge + Difficulty badge
  - Category
  - Read time (e.g., "5 min read")
  - Author badge (Curated / AI Generated)
  - Summary preview (2 lines)
  - Stats: views, engagement %, completion %

**Interactions**:
- Tap card → Content Detail (full body, share button)
- Share button → select seeker to assign content to
- Search/filter updates list

---

### 5.12 Profile — Notifications

**Purpose**: View and manage notifications.

**Layout**:
- Notification list:
  - Icon based on type (message, assignment, milestone, system)
  - Title (bold if unread)
  - Body text (truncated)
  - Timestamp
  - Unread dot indicator (primary blue)

**Interactions**:
- Tap notification → navigate to relevant screen
- Swipe to dismiss/mark read
- "Mark all as read" action in header

---

### 5.13 Profile — Settings

**Purpose**: App preferences and configuration.

**Sections**:
- **Appearance**: Dark mode toggle
- **Notifications**: Push notification preferences (new messages, new assignments, milestones, system updates)
- **Account**: Email, password change
- **About**: App version, terms, privacy policy
- **Sign Out**: Confirmation dialog → sign out

---

## 6. Interaction Patterns

### 6.1 Pull to Refresh
All list screens support pull-to-refresh with a loading spinner.

### 6.2 Loading States
- Skeleton screens for initial loads (gray pulsing placeholders matching layout)
- Inline spinners for actions (button loading state)
- Toast notifications for success/error feedback (using sonner-style bottom toasts)

### 6.3 Empty States
Each list screen has an empty state:
- Illustration or icon (muted)
- Title: "No [items] yet"
- Description: helpful context
- Action button if applicable

### 6.4 Error States
- Network error: "Unable to connect. Check your internet connection." + Retry button
- Server error: "Something went wrong. Please try again." + Retry button
- Not found: "This [item] is no longer available."

### 6.5 Gestures
- Swipe right on conversation → pin/mark read
- Swipe left on conversation → mute/archive
- Long press on message → action menu (reply, forward, copy, delete, edit)
- Pull down on chat → load older messages

### 6.6 Transitions
- Screen transitions: slide left/right for push/pop navigation
- Modal presentations: slide up from bottom for create/edit screens
- Tab switches: crossfade (no sliding)
- Panel animations: slide in from right for info panels (matching web app's AnimatePresence pattern)

---

## 7. Push Notifications

### 7.1 Notification Types

| Type | Title | Body | Action |
|------|-------|------|--------|
| New message | "[Seeker Name]" | Message preview text | Open conversation |
| New assignment | "New Seeker Assigned" | "[Seeker] has been matched with you" | Open seeker profile |
| Milestone reached | "Milestone Achieved!" | "[Seeker] completed [Milestone]" | Open milestone detail |
| Journey update | "Journey Progress" | "[Seeker] moved to [Stage]" | Open journey detail |
| Match proposed | "New Match Proposed" | "Review match with [Seeker]" | Open match detail |
| Group message | "[Group Name]" | "[Sender]: Message preview" | Open group chat |

### 7.2 Badge Count
- App icon badge = total unread message count across all conversations
- Tab badges: Chats tab shows unread count, Seekers tab shows pending actions count

---

## 8. Offline Behavior

### 8.1 Offline Capabilities
- View cached conversations and messages
- Draft new messages (queued for send when online)
- View cached seeker profiles
- View cached content library items
- Browse cached journey/milestone data

### 8.2 Sync Strategy
- Messages sync in real time via WebSocket when online
- Full data sync on app foreground
- Background sync for notifications
- Conflict resolution: server wins for data updates, queue-merge for messages

### 8.3 Offline Indicators
- Banner at top: "You're offline. Messages will be sent when you reconnect."
- Unsent messages show clock icon instead of checkmark
- Stale data shows "Last updated [time]" label

---

## 9. Authentication

### 9.1 Login Screen
- App logo + name "Turumba"
- Email input field
- Password input field with show/hide toggle
- "Sign In" primary button
- "Forgot password?" link
- Biometric login option (Face ID / Fingerprint) after first login

### 9.2 Session Management
- JWT-based authentication
- Refresh token stored securely in device keychain
- Auto-logout after extended inactivity (configurable)
- Multi-device support (mentor can be logged in on web + mobile)

---

## 10. Accessibility

- Minimum touch target: 44x44pt
- All images have alt text
- Color is never the sole indicator (always paired with icon or text)
- Dynamic type support (respect system font size)
- VoiceOver/TalkBack labels on all interactive elements
- Sufficient color contrast ratios (WCAG AA minimum)
- Haptic feedback on key actions (send message, complete milestone)

---

## 11. Performance Requirements

- App launch to interactive: < 2 seconds
- Message send to delivered: < 500ms (online)
- Screen transitions: < 300ms
- List scroll: 60fps maintained
- Image loading: Progressive with blur placeholder
- Cache: Last 100 messages per conversation, all seeker profiles

---

## 12. Technical Recommendations

### 12.1 Recommended Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | React Native or Flutter | Cross-platform, shares mental model with React web app |
| Navigation | React Navigation (RN) / GoRouter (Flutter) | Native feel, deep linking support |
| State | Zustand or Redux Toolkit (RN) / Riverpod (Flutter) | Lightweight, performant |
| Real-time | WebSocket / Socket.IO | Live messaging |
| Storage | SQLite (via WatermelonDB or Drift) | Offline-first with sync |
| Push | Firebase Cloud Messaging | Cross-platform push notifications |
| Auth | JWT + Secure Storage | Keychain (iOS) / Keystore (Android) |
| Icons | Lucide (lucide-react-native) | Matches web app icon set |

### 12.2 API Requirements

The mobile app needs these API endpoints (REST or GraphQL):

- `POST /auth/login` — authenticate mentor
- `GET /mentors/me` — current mentor profile
- `PUT /mentors/me` — update profile
- `GET /seekers` — list assigned seekers
- `GET /seekers/:id` — seeker detail
- `PUT /seekers/:id` — update seeker
- `GET /conversations` — list conversations
- `GET /conversations/:id/messages` — paginated messages
- `POST /conversations/:id/messages` — send message
- `PUT /messages/:id` — edit message
- `DELETE /messages/:id` — delete message (soft delete)
- `GET /groups` — list group chats
- `GET /groups/:id/messages` — group messages
- `POST /groups/:id/messages` — send group message
- `GET /journeys` — list faith journeys for assigned seekers
- `GET /journeys/:id` — journey detail
- `PUT /journeys/:id` — update journey
- `GET /milestones/:seekerId` — seeker milestones
- `PUT /milestones/:seekerId` — update milestones
- `GET /content` — list content library
- `GET /content/:id` — content detail
- `POST /seekers/:id/content` — assign content to seeker
- `GET /notifications` — list notifications
- `PUT /notifications/:id/read` — mark notification read
- `WS /ws` — WebSocket for real-time messaging

---

## 13. Summary

The Turumba mentor mobile app is a focused, high-quality companion to the web platform. It prioritizes the daily mentor workflow: checking messages, responding to seekers, updating progress, and collaborating with fellow mentors. Every screen should feel fast, clean, and purpose-built — using the DM Sans typography, the sharp editorial design language, and the blue-emerald-amber color system that defines Turumba's visual identity.

Build it so a mentor can pick up their phone, see exactly who needs attention, respond with care, and put it down knowing their seekers are being shepherded well.
