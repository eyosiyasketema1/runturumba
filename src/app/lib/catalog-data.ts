import { brandMarks, catalogGlow, type BrandMarkSpec } from './figma-assets';

export type CatalogCategory = 'Social Media' | 'SMS' | 'Email' | 'Web Chat';

export interface CatalogEntry {
  id: string;
  /** Optional: the Web Chat card in the design has a mark but no title. */
  title?: string;
  /** Some titles mix two type sizes; the tail renders one step smaller. */
  titleTail?: string;
  description: string;
  mark: BrandMarkSpec;
  glow: string;
  /** Card border is the provider's brand colour at 5%. */
  borderColor: string;
  connectedCount: number;
  category: CatalogCategory;
}

export const CATALOG: CatalogEntry[] = [
  {
    id: 'whatsapp',
    title: 'Whatsapp',
    description:
      'Connect WhatsApp Business API via Facebook to enable seamless customer engagement and support.',
    mark: brandMarks.whatsapp,
    glow: catalogGlow.whatsapp,
    borderColor: 'rgba(0, 143, 53, 0.05)',
    connectedCount: 1,
    category: 'Social Media',
  },
  {
    id: 'whatsapp-twilio',
    title: 'Whatsapp-',
    titleTail: 'Twilio(Self Sign-up)',
    description: 'Your own Twilo account with an apporved WhatsApp Sender',
    mark: brandMarks.whatsapp,
    glow: catalogGlow.whatsapp,
    borderColor: 'rgba(0, 143, 53, 0.05)',
    connectedCount: 1,
    category: 'Social Media',
  },
  {
    id: 'telegram',
    title: 'Telegram',
    description:
      'Connect WhatsApp Business API via Facebook to enable seamless customer engagement and support.',
    mark: brandMarks.telegram,
    glow: catalogGlow.telegram,
    borderColor: 'rgba(37, 162, 223, 0.05)',
    connectedCount: 1,
    category: 'Social Media',
  },
  {
    id: 'tiktok',
    title: 'Tiktok',
    description:
      'Connect your TikTok account to engage with your audience and enhance customer interactions.',
    mark: brandMarks.tiktok,
    glow: catalogGlow.tiktok,
    borderColor: 'rgba(37, 244, 238, 0.05)',
    connectedCount: 1,
    category: 'Social Media',
  },
  {
    id: 'messenger',
    title: 'Messenger',
    description:
      'Integrate Messenger API through Facebook for enhanced customer interactions and support.',
    mark: brandMarks.messenger,
    glow: catalogGlow.messenger,
    borderColor: 'rgba(38, 129, 255, 0.05)',
    connectedCount: 1,
    category: 'Social Media',
  },
  {
    id: 'viber',
    title: 'Viber',
    description: 'Connect Viber Bot to enable customer support and engagement on Viber.',
    mark: brandMarks.viber,
    glow: catalogGlow.viber,
    borderColor: 'rgba(115, 95, 242, 0.05)',
    connectedCount: 1,
    category: 'Social Media',
  },
  {
    id: 'instagram',
    title: 'Instagram',
    description: 'Connect Instagram for quick media sharing and enhanced messaging.',
    mark: brandMarks.instagram,
    glow: catalogGlow.instagram,
    borderColor: 'rgba(197, 6, 233, 0.05)',
    connectedCount: 1,
    category: 'Social Media',
  },
  {
    id: 'line',
    title: 'LINE',
    description:
      'Connect LINE Official Account to provide timely support to your customers on LINE.',
    mark: brandMarks.line,
    glow: catalogGlow.line,
    borderColor: 'rgba(76, 199, 100, 0.05)',
    connectedCount: 1,
    category: 'Social Media',
  },
  {
    id: 'slack',
    title: 'Slack',
    description:
      'Link your Slack workspace to boost collaboration and streamline support for your team and clients.',
    mark: brandMarks.slack,
    glow: catalogGlow.slack,
    borderColor: 'rgba(236, 178, 46, 0.05)',
    connectedCount: 1,
    category: 'Social Media',
  },
  {
    id: 'gmail',
    title: 'Gmail',
    description:
      'Connect your Gmail account to enhance customer communication and provide quick email support.',
    mark: brandMarks.gmail,
    glow: catalogGlow.gmail,
    borderColor: 'rgba(252, 65, 60, 0.05)',
    connectedCount: 1,
    category: 'Social Media',
  },
  {
    id: 'twilio',
    title: 'Twilio',
    description:
      'Connect Twilio to power SMS, MMS, and voice messaging with reliable global delivery.',
    mark: brandMarks.twilio,
    glow: catalogGlow.twilio,
    borderColor: 'rgba(242, 47, 70, 0.05)',
    connectedCount: 1,
    category: 'SMS',
  },
  {
    id: 'sms',
    title: 'SMS',
    description:
      'Connect your SMS provider to send and receive text messages for customer outreach and support.',
    mark: brandMarks.sms,
    glow: catalogGlow.blue,
    borderColor: 'rgba(33, 150, 243, 0.05)',
    connectedCount: 1,
    category: 'SMS',
  },
  {
    // Titled "SMS" in the design even though it sits under Email — kept verbatim.
    id: 'email-sms',
    title: 'SMS',
    description:
      'Connect your SMS provider to send and receive text messages for customer outreach and support.',
    mark: brandMarks.mail,
    glow: catalogGlow.blue,
    borderColor: 'rgba(33, 150, 243, 0.05)',
    connectedCount: 1,
    category: 'Email',
  },
  {
    id: 'smpp',
    title: 'SMPP',
    description:
      'Connect Twilio to power SMS, MMS, and voice messaging with reliable global delivery.',
    mark: brandMarks.smpp,
    glow: catalogGlow.smpp,
    borderColor: 'rgba(51, 182, 114, 0.05)',
    connectedCount: 1,
    category: 'Email',
  },
  {
    // No title in the frame — only the avatar.
    id: 'web-chat',
    description:
      'Connect your SMS provider to send and receive text messages for customer outreach and support.',
    mark: brandMarks.webChat,
    glow: catalogGlow.webChat,
    borderColor: 'rgba(33, 150, 243, 0.05)',
    connectedCount: 1,
    category: 'Web Chat',
  },
];

/** Section order on the page. */
export const CATALOG_SECTIONS: CatalogCategory[] = ['Social Media', 'SMS', 'Email', 'Web Chat'];
