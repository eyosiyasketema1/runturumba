Improve the existing **Turumba Conversation Inbox UI** to clearly show which messaging channel each conversation is happening on (WhatsApp, Telegram, SMS, Email, Webchat).

Do not redesign the layout. Enhance the current UI by adding **channel context indicators** so agents always know where their reply will be sent.

---

### 1. Conversation Header Channel Indicator

At the top of the conversation thread, next to the contact name, display the **active channel badge**.

Example:

John Smith
WhatsApp

The badge should include:

Channel icon
Channel name

Examples:

WhatsApp (green accent)
Telegram (blue accent)
SMS (neutral gray)
Email (purple accent)
Webchat (brand color)

This badge should clearly communicate **which platform the conversation belongs to**.

---

### 2. Channel Context Above Message Composer

Above the message input field, display a label showing where the message will be delivered.

Example:

Replying via WhatsApp

This label should include:

Channel icon
Channel name

Example layout:

WhatsApp
[ Message John… ]  Send

This prevents agents from accidentally thinking they are replying through a different channel.

---

### 3. Channel Indicator in Conversation List

Enhance the left conversation list items by showing the **channel badge under the contact name**.

Example:

John Smith
WhatsApp
“Great, thank you! You guys are always…”

The channel badge should be small and easily recognizable.

---

### 4. Channel Color Hints (Subtle)

Use subtle color cues for channels:

WhatsApp → green
Telegram → blue
SMS → gray
Email → purple
Webchat → brand color

The color should only appear in:

Channel badges
Small icons
Labels

Do not recolor the message bubbles to avoid visual clutter.

---

### 5. Message Composer Enhancements

Enhance the message composer area by adding:

Channel label
Attachment button
Emoji button
Send button

The input placeholder should adapt based on the contact.

Example:

Message John…

---

### 6. UX Goal

The agent should **always know which platform the conversation belongs to**.

The UI must communicate channel context clearly while maintaining a **clean SaaS dashboard appearance consistent with the Turumba design system**.

Channel indicators should be visible but subtle so they do not distract from the conversation flow.
