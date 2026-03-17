Improve the existing **Turumba Conversation Inbox UI** without changing the current layout structure.

The current interface already has:

* Conversation list on the left
* Chat thread on the right
* Message input at the bottom
* Channel indicator (WhatsApp, Email, SMS)

Keep this structure but **add missing realtime messaging and conversation management features**.

---

### 1. Conversation Header Improvements

At the top of the conversation thread add a **Conversation Control Bar**.

Display:

Contact name
Phone/email
Channel badge (WhatsApp, Telegram, etc.)

Add action controls:

Assign conversation (agent dropdown with presence indicator)

Conversation Status dropdown
Open
Assigned
Pending
Resolved
Closed

Priority selector
Low
Normal
High
Urgent

Labels / tags

More actions menu

---

### 2. Right Side Conversation Context Panel

Add a collapsible **contact info panel** on the right side.

Include:

Contact details
Phone
Email

Conversation metadata
Assigned agent
Team
Priority
Status

Labels

Recent activity

---

### 3. Message Types

Improve message styling to support different types.

Customer message
Left aligned
Light bubble

Agent reply
Right aligned
Primary brand bubble

Internal note
Different color (amber or yellow)
Lock icon
Visible only to agents

System events
Centered text

Examples:

Assigned to Billing Team
Status changed to Pending

---

### 4. Reply / Note Toggle

Above the message input add a toggle:

Reply
Note

Reply sends message to customer.

Note creates an **internal note** only visible to agents.

---

### 5. Realtime Interaction Indicators

Add real-time indicators.

Typing indicator
Example:
Visitor is typing...

Agent typing indicator visible to other agents.

Message sending states:

Sending
Sent
Failed with retry

---

### 6. Inbox Enhancements (Left Panel)

Improve conversation list items.

Each item should show:

Contact avatar

Contact name

Channel badge (WhatsApp / SMS / Email / Webchat)

Last message preview

Timestamp

Unread badge

Priority indicator

Assignee avatar

New messages should move the conversation to the **top of the list automatically**.

---

### 7. Filters and Controls

At the top of the inbox add filters:

All
Open
Assigned
Pending
Resolved

Add filters for:

Assignee
Channel
Priority

---

### 8. Realtime Behavior

The interface must support realtime updates:

New conversations appear instantly

New messages appear without refresh

Conversations reorder when new messages arrive

Typing indicators update live

Assignment updates reflect immediately

---

### 9. Compose Area

Keep the existing compose bar but enhance it.

Show channel indicator:

Replying via WhatsApp

Add:

Attachment button

Emoji button

Send button

---

### 10. Performance Considerations

Conversation list should support **large volumes of conversations**.

Use virtual scrolling.

Load full message history only when a conversation is opened.

Avoid layout shifting during realtime updates.

---

Maintain the current **clean SaaS dashboard style**, spacing, and typography used in the Turumba admin interface.
