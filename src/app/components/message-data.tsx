// Message-related types and initial data extracted to reduce main App.tsx size

export type MessagePort = "whatsapp" | "sms" | "email" | "telegram";
export type ScheduleFrequency = "once" | "daily" | "weekly" | "biweekly" | "monthly";
export type MessageStatus = "sent" | "delivered" | "read" | "failed" | "scheduled" | "received";

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export const TEMPLATE_PLACEHOLDERS = [
  { key: "{FIRST_NAME}", label: "First Name", sample: "John" },
  { key: "{LAST_NAME}", label: "Last Name", sample: "Smith" },
  { key: "{FULL_NAME}", label: "Full Name", sample: "John Smith" },
  { key: "{PHONE}", label: "Phone", sample: "+1 555-0101" },
  { key: "{EMAIL}", label: "Email", sample: "john@example.com" },
  { key: "{COMPANY}", label: "Company", sample: "Acme Corp" },
  { key: "{VERIFICATION_CODE}", label: "Verification Code", sample: "482916" },
  { key: "{ORDER_NUMBER}", label: "Order Number", sample: "ORD-4521" },
  { key: "{DATE}", label: "Date", sample: "February 15, 2026" },
  { key: "{AMOUNT}", label: "Amount", sample: "$49.99" },
];

export const TEMPLATE_CATEGORIES = ["Onboarding", "Security", "Transactional", "Marketing", "Reminders", "Engagement", "Support", "Sales"];

export const INITIAL_TEMPLATES: MessageTemplate[] = [
  { id: "tmpl-1", name: "Welcome Message", content: "Hi {FIRST_NAME}, welcome to {COMPANY}! We're excited to have you on board. Check out our getting started guide to begin your journey.", category: "Onboarding", tenantId: "tenant-1", createdAt: "2025-02-01T10:00:00Z", updatedAt: "2025-02-01T10:00:00Z" },
  { id: "tmpl-2", name: "Verification Code", content: "Hi {FIRST_NAME}, your verification code is: {VERIFICATION_CODE}. This code expires in 10 minutes. Do not share this with anyone.", category: "Security", tenantId: "tenant-1", createdAt: "2025-02-02T10:00:00Z", updatedAt: "2025-02-02T10:00:00Z" },
  { id: "tmpl-3", name: "Order Confirmation", content: "Hi {FIRST_NAME}, your order #{ORDER_NUMBER} for {AMOUNT} has been confirmed! We'll send tracking details once it ships to your address.", category: "Transactional", tenantId: "tenant-1", createdAt: "2025-02-03T10:00:00Z", updatedAt: "2025-02-03T10:00:00Z" },
  { id: "tmpl-4", name: "Monthly Newsletter", content: "Hi {FIRST_NAME}, here's your monthly update from {COMPANY}! We've got exciting news, product updates, and exclusive offers just for you.", category: "Marketing", tenantId: "tenant-1", createdAt: "2025-02-04T10:00:00Z", updatedAt: "2025-02-04T10:00:00Z" },
  { id: "tmpl-5", name: "Appointment Reminder", content: "Hi {FIRST_NAME}, this is a friendly reminder about your upcoming appointment on {DATE}. Please reply CONFIRM to confirm or CANCEL to reschedule.", category: "Reminders", tenantId: "tenant-1", createdAt: "2025-02-05T10:00:00Z", updatedAt: "2025-02-05T10:00:00Z" },
  { id: "tmpl-6", name: "Feedback Request", content: "Hi {FIRST_NAME}, we'd love to hear your thoughts! How would you rate your recent experience with {COMPANY}? Reply with a number from 1-10.", category: "Engagement", tenantId: "tenant-1", createdAt: "2025-02-06T10:00:00Z", updatedAt: "2025-02-06T10:00:00Z" },
  { id: "tmpl-7", name: "Payment Receipt", content: "Hi {FIRST_NAME}, we've received your payment of {AMOUNT} for order #{ORDER_NUMBER}. Your receipt has been sent to {EMAIL}. Thank you!", category: "Transactional", tenantId: "tenant-1", createdAt: "2025-02-07T10:00:00Z", updatedAt: "2025-02-07T10:00:00Z" },
  { id: "tmpl-8", name: "Win-Back Offer", content: "Hi {FIRST_NAME}, we miss you at {COMPANY}! Come back and enjoy 20% off your next purchase. Use code COMEBACK20 before {DATE}.", category: "Sales", tenantId: "tenant-1", createdAt: "2025-02-08T10:00:00Z", updatedAt: "2025-02-08T10:00:00Z" },
];
