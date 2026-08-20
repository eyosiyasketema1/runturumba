import React, { useState, useMemo, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  Plus, Search, Trash2, Check, X, AlertTriangle,
  Wifi, WifiOff, Activity, ArrowLeft,
  Copy, RefreshCw, Signal, Edit2, Eye, EyeOff,
  TestTube, Send, Clock, BarChart3, ChevronLeft,
  Shield, Loader2, CircleCheck,
  CircleX, Info, Ellipsis, Bot,
  ExternalLink, BookOpen, ChevronDown, ChevronUp,
  Monitor, MousePointerClick,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn, type DeliveryChannel, type ChannelType, type ChannelStatus,
  type ChatEndpoint, type ConversationRule, type User, type TeamGroup,
  type Group, type Contact,
  CHANNEL_TYPES, formatTimeAgo
} from "./types";
import { ChatEndpointsView } from "./chat-endpoints-view";
import { Switch } from "./ui/switch";
import { contentIcons } from "../lib/figma-assets";
import { FigmaIcon } from "./ui/FigmaIcon";
import { ChannelCard, type FigmaChannel, type ChannelProvider } from "./channels/ChannelCard";
import { ChannelsToolbar } from "./channels/ChannelsToolbar";
import { StatTile } from "./channels/StatTile";

// ============================================================
// Constants
// ============================================================

const statusConfig: Record<ChannelStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  connected: { label: "Connected", color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200", icon: Wifi },
  disconnected: { label: "Disconnected", color: "text-muted-foreground", bgColor: "bg-muted border-border", icon: WifiOff },
  error: { label: "Error", color: "text-destructive", bgColor: "bg-destructive/5 border-destructive/20", icon: AlertTriangle },
  rate_limited: { label: "Rate Limited", color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200", icon: Activity },
};

const CHANNEL_CONFIG_FIELDS: Record<ChannelType, { key: string; label: string; placeholder: string; sensitive?: boolean; hint?: string }[]> = {
  whatsapp: [
    { key: "phoneNumber", label: "Business Phone Number", placeholder: "+1 555-0100", hint: "Include country code" },
    { key: "businessId", label: "WhatsApp Business Account ID", placeholder: "waba-123456" },
    { key: "apiKey", label: "API Key", placeholder: "whsk_live_...", sensitive: true },
  ],
  sms: [
    { key: "provider", label: "SMS Provider", placeholder: "e.g. Twilio, Vonage, Africa's Talking" },
    { key: "accountSid", label: "Account SID / API Key", placeholder: "AC..." },
    { key: "authToken", label: "Auth Token", placeholder: "Enter auth token", sensitive: true },
    { key: "fromNumber", label: "Sender Number", placeholder: "+15551234567" },
  ],
  email: [
    { key: "smtpHost", label: "SMTP Host", placeholder: "smtp.yourprovider.com" },
    { key: "smtpPort", label: "SMTP Port", placeholder: "587" },
    { key: "username", label: "Username", placeholder: "user@company.com" },
    { key: "password", label: "Password", placeholder: "Enter password", sensitive: true },
    { key: "fromAddress", label: "From Address", placeholder: "noreply@company.com" },
  ],
  telegram: [
    { key: "botToken", label: "Bot Token (from @BotFather)", placeholder: "123456789:AABBC...", sensitive: true },
    { key: "botUsername", label: "Bot Username", placeholder: "@YourBot" },
    { key: "webhookUrl", label: "Webhook URL (optional)", placeholder: "https://yourdomain.com/webhook" },
  ],
  messenger: [
    { key: "pageId", label: "Facebook Page ID", placeholder: "123456789" },
    { key: "appId", label: "App ID", placeholder: "987654321" },
    { key: "accessToken", label: "Page Access Token", placeholder: "EAABsbC...", sensitive: true },
    { key: "verifyToken", label: "Verify Token", placeholder: "your_verify_token", sensitive: true },
  ],
  smpp: [
    { key: "host", label: "SMSC Host", placeholder: "smsc.provider.com" },
    { key: "port", label: "SMSC Port", placeholder: "2775" },
    { key: "systemId", label: "System ID", placeholder: "your_system_id" },
    { key: "password", label: "Password", placeholder: "Enter password", sensitive: true },
    { key: "systemType", label: "System Type (optional)", placeholder: "transceiver" },
  ],
  twilio: [
    { key: "accountSid", label: "Account SID", placeholder: "AC..." },
    { key: "authToken", label: "Auth Token", placeholder: "Enter auth token", sensitive: true },
    { key: "fromNumber", label: "Twilio Phone Number", placeholder: "+15551234567" },
    { key: "messagingServiceSid", label: "Messaging Service SID (optional)", placeholder: "MG..." },
  ],
  instagram: [
    { key: "pageId", label: "Instagram Business Account ID", placeholder: "17841400..." },
    { key: "appId", label: "Facebook App ID", placeholder: "987654321" },
    { key: "accessToken", label: "Page Access Token", placeholder: "EAABsbC...", sensitive: true },
    { key: "webhookVerifyToken", label: "Webhook Verify Token", placeholder: "your_verify_token", sensitive: true },
  ],
  tiktok: [
    { key: "appId", label: "TikTok App ID", placeholder: "7123456789" },
    { key: "appSecret", label: "App Secret", placeholder: "Enter app secret", sensitive: true },
    { key: "accessToken", label: "Access Token", placeholder: "act.xxxx...", sensitive: true },
    { key: "businessId", label: "Business Account ID", placeholder: "7198765432" },
  ],
  webchat: [
    { key: "publicKey", label: "Public Key", placeholder: "SyX8AOmq1cw..." },
    { key: "widgetColor", label: "Widget Color", placeholder: "#3B82F6" },
    { key: "welcomeMessage", label: "Welcome Message", placeholder: "Hi! How can we help you?" },
  ],
};

const POPULAR_CHANNELS: ChannelType[] = ["whatsapp", "messenger", "instagram"];
const BETA_CHANNELS: ChannelType[] = ["tiktok"];

const CHANNEL_CATALOG_DESCRIPTIONS: Record<ChannelType, string> = {
  whatsapp: "Connect WhatsApp Business API via Facebook to enable seamless customer engagement and support.",
  sms: "Connect your SMS provider to send and receive text messages for customer outreach and support.",
  twilio: "Connect Twilio to power SMS, MMS, and voice messaging with reliable global delivery.",
  telegram: "Connect Telegram Bot to provide real-time support when customers reach out.",
  smpp: "Connect via SMPP protocol for direct, high-throughput messaging with your SMSC provider.",
  email: "Connect your email server to manage customer conversations through email channels.",
  messenger: "Connect Facebook Messenger to engage with your customers on the world's largest social media...",
  instagram: "Connect Instagram to reply to private messages and build strong brand connections.",
  tiktok: "Connect TikTok Business Messaging to engage with a whole new audience from TikTok.",
  webchat: "Embed a live chat widget on your website to capture and respond to visitor conversations in real time.",
};

// ============================================================
// Setup Guides — step-by-step tutorials per channel type
// ============================================================

interface SetupStep {
  title: string;
  description: string;
  platform: string;
  visualHint: string;
}

interface SetupGuide {
  prerequisites: string;
  estimatedTime: string;
  docsUrl: string;
  steps: SetupStep[];
}

type ConnectMethod = "new" | "existing";

interface ChannelConnectConfig {
  /** Title on the choice screen, e.g. "Connect Telegram Bot" */
  choiceTitle: string;
  /** Subtitle on the choice screen */
  choiceSubtitle: string;
  /** Label for "create new" button */
  newLabel: string;
  /** Label for "connect existing" link */
  existingLabel: string;
  /** Guide for creating from scratch */
  newGuide: SetupGuide;
  /** Guide for connecting with existing credentials */
  existingGuide: SetupGuide;
}

const CHANNEL_CONNECT_CONFIG: Record<ChannelType, ChannelConnectConfig> = {
  whatsapp: {
    choiceTitle: "Connect WhatsApp Business",
    choiceSubtitle: "Get started by setting up a new WhatsApp Business account or connecting an existing one.",
    newLabel: "Set up a new account",
    existingLabel: "Connect an existing account",
    newGuide: {
      prerequisites: "Meta (Facebook) account, a phone number not registered with WhatsApp",
      estimatedTime: "30–45 min",
      docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
      steps: [
        { title: "Create a Meta Developer Account", description: "Go to developers.facebook.com, click \"Get Started\", and log in with your Facebook account.", platform: "developers.facebook.com", visualHint: "Look for the blue \"Get Started\" button in the top-right navigation" },
        { title: "Create a New App", description: "Click \"My Apps\" → \"Create App\". Select \"Business\" as the type, enter your app name and email.", platform: "developers.facebook.com/apps", visualHint: "Look for the green \"Create App\" button on the dashboard" },
        { title: "Add WhatsApp Product", description: "In your app dashboard, scroll to \"Add Products\", find WhatsApp, and click \"Set Up\".", platform: "App Dashboard → Add Products", visualHint: "Find the WhatsApp icon with a green \"Set Up\" button" },
        { title: "Add a Phone Number", description: "Register a phone number for the API. It must not be currently registered with any WhatsApp app.", platform: "App Dashboard → WhatsApp → Getting Started", visualHint: "Look for \"Add phone number\" button and the \"From\" dropdown" },
        { title: "Generate an Access Token", description: "Click \"Generate\" for a temporary token, or create a System User at business.facebook.com for a permanent one.", platform: "App Dashboard or Business Settings → System Users", visualHint: "Look for \"Generate\" next to \"Temporary access token\"" },
        { title: "Copy Your Business Account ID", description: "Copy the WhatsApp Business Account ID and Phone Number ID shown on the Getting Started page.", platform: "App Dashboard → WhatsApp → Getting Started", visualHint: "Find the ID values next to your phone number listing" },
        { title: "Configure Webhooks", description: "Under WhatsApp → Configuration, enter your HTTPS callback URL and verify token. Subscribe to message events.", platform: "App Dashboard → WhatsApp → Configuration", visualHint: "Look for \"Callback URL\" and \"Verify Token\" fields" },
      ],
    },
    existingGuide: {
      prerequisites: "Existing WhatsApp Business API account with API access",
      estimatedTime: "5 min",
      docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
      steps: [
        { title: "Locate Your API Credentials", description: "Go to your Meta App Dashboard → WhatsApp → Getting Started. Find your API Key, Business Account ID, and Phone Number ID.", platform: "developers.facebook.com/apps", visualHint: "Look for \"API Setup\" section with your credentials" },
        { title: "Copy the Access Token", description: "Copy your permanent access token from Business Settings → System Users, or generate a temporary one from the dashboard.", platform: "App Dashboard → WhatsApp → Getting Started", visualHint: "Look for the access token field with a copy button" },
        { title: "Paste Credentials Below", description: "Enter your Business Phone Number, WhatsApp Business Account ID, and API Key in the form on this page.", platform: "Connection form", visualHint: "Fill in the credential fields on the left side" },
      ],
    },
  },
  telegram: {
    choiceTitle: "Connect Telegram Bot",
    choiceSubtitle: "Get started by creating a new bot or connecting to an existing bot.",
    newLabel: "Create a new bot",
    existingLabel: "Connect an existing bot",
    newGuide: {
      prerequisites: "A Telegram account with the app installed on phone or desktop",
      estimatedTime: "5–10 min",
      docsUrl: "https://core.telegram.org/bots#botfather",
      steps: [
        { title: "Open BotFather", description: "Open Telegram and search for \"BotFather\" in the search bar. Select the verified account with a blue checkmark.", platform: "Telegram App → Search", visualHint: "Look for \"BotFather\" with a blue verification badge" },
        { title: "Start a Chat", description: "Click \"Start\" or type /start to begin. BotFather will display a list of available commands.", platform: "Telegram → BotFather chat", visualHint: "Look for the \"Start\" button at the bottom of the chat" },
        { title: "Create a New Bot", description: "Type /newbot and send it. BotFather will ask you to choose a display name for your bot.", platform: "Telegram → BotFather chat", visualHint: "BotFather replies: \"How are we going to call it?\"" },
        { title: "Set the Bot Username", description: "Enter a unique username ending with \"bot\" (e.g. my_support_bot). If taken, try adding numbers.", platform: "Telegram → BotFather chat", visualHint: "BotFather asks: \"Now let's choose a username\"" },
        { title: "Copy Your API Token", description: "BotFather confirms creation and shows your HTTP API token (e.g. 123456789:AAHdq...). Copy and store it securely.", platform: "Telegram → BotFather chat", visualHint: "Look for \"Use this token to access the HTTP API:\"" },
      ],
    },
    existingGuide: {
      prerequisites: "An existing Telegram bot created via BotFather",
      estimatedTime: "2 min",
      docsUrl: "https://core.telegram.org/bots#botfather",
      steps: [
        { title: "Find Your Bot Token", description: "Open Telegram, go to BotFather, type /mybots, select your bot, then click \"API Token\" to reveal it.", platform: "Telegram → BotFather chat", visualHint: "Type /mybots, select the bot, then tap \"API Token\"" },
        { title: "Copy the Bot Username", description: "Your bot username is shown in BotFather's bot list (e.g. @YourBot). Copy it without the @ symbol.", platform: "Telegram → BotFather chat", visualHint: "Look for the @username in the bot details" },
        { title: "Paste Credentials Below", description: "Enter your Bot Token and Bot Username in the form on this page.", platform: "Connection form", visualHint: "Fill in the Bot Token and Bot Username fields on the left" },
      ],
    },
  },
  twilio: {
    choiceTitle: "Connect Twilio",
    choiceSubtitle: "Get started by creating a new Twilio account or connecting your existing one.",
    newLabel: "Create a new account",
    existingLabel: "Connect an existing account",
    newGuide: {
      prerequisites: "Email address, phone number for verification, credit card for account upgrade",
      estimatedTime: "15–20 min",
      docsUrl: "https://www.twilio.com/docs/messaging/quickstart",
      steps: [
        { title: "Create a Twilio Account", description: "Go to twilio.com, click \"Start for free\", fill in your details, and verify your email.", platform: "twilio.com", visualHint: "Look for \"Start for free\" in the top-right corner" },
        { title: "Verify Your Phone", description: "After email verification, Twilio asks you to verify a phone number via SMS or voice call.", platform: "Twilio Console → Onboarding", visualHint: "Phone verification form with country code selector" },
        { title: "Find Your Account Credentials", description: "On the Console dashboard, find Account SID and Auth Token under \"Account Info\". Click the eye icon to reveal the token.", platform: "console.twilio.com", visualHint: "Look for \"Account Info\" panel with SID and Auth Token" },
        { title: "Buy a Phone Number", description: "Go to Phone Numbers → Buy a Number. Select your country, choose SMS capability, search, and buy.", platform: "Console → Phone Numbers → Buy a Number", visualHint: "Look for \"Buy a Number\" in the sidebar, then \"Search\" button" },
        { title: "Create a Messaging Service", description: "Go to Messaging → Services, click \"Create Messaging Service\", name it, and add your number as a sender.", platform: "Console → Messaging → Services", visualHint: "Look for \"Create Messaging Service\" button" },
        { title: "Configure Webhook URL", description: "In your phone number settings, enter your server URL in \"A Message Comes In\" webhook field.", platform: "Console → Phone Numbers → Active Numbers", visualHint: "Find \"A MESSAGE COMES IN\" with URL input and HTTP method" },
      ],
    },
    existingGuide: {
      prerequisites: "An existing Twilio account with a phone number",
      estimatedTime: "3 min",
      docsUrl: "https://www.twilio.com/docs/messaging/quickstart",
      steps: [
        { title: "Find Your Account SID & Auth Token", description: "Log in to console.twilio.com. Your Account SID and Auth Token are on the main dashboard under \"Account Info\".", platform: "console.twilio.com", visualHint: "Look for the \"Account Info\" panel; click the eye icon to reveal the Auth Token" },
        { title: "Copy Your Phone Number", description: "Go to Phone Numbers → Manage → Active Numbers. Copy the phone number you want to use.", platform: "Console → Phone Numbers → Active Numbers", visualHint: "Click on the number to see its details and copy it" },
        { title: "Paste Credentials Below", description: "Enter your Account SID, Auth Token, and Twilio phone number in the form on this page.", platform: "Connection form", visualHint: "Fill in the credential fields on the left side" },
      ],
    },
  },
  sms: {
    choiceTitle: "Connect SMS Provider",
    choiceSubtitle: "Get started by setting up a new SMS provider account or connecting an existing one.",
    newLabel: "Set up a new provider",
    existingLabel: "Connect an existing provider",
    newGuide: {
      prerequisites: "An email address to sign up with an SMS gateway provider",
      estimatedTime: "10–15 min",
      docsUrl: "https://www.vonage.com/communications-apis/sms/",
      steps: [
        { title: "Choose an SMS Provider", description: "Select a gateway provider that supports your target countries and volume. Options include MessageBird, Vonage, Plivo.", platform: "Provider's website", visualHint: "Look for \"Sign Up\" or \"Get Started\" on the provider's page" },
        { title: "Create a Provider Account", description: "Register for an account, complete email and phone verification as required.", platform: "Provider's signup page", visualHint: "Look for the registration form and email confirmation" },
        { title: "Obtain API Credentials", description: "Navigate to your provider's API settings. Locate and copy your API Key (or SID) and API Secret (or Auth Token).", platform: "Provider Dashboard → API Settings", visualHint: "Look for \"API Keys\" or \"Credentials\" in the sidebar" },
        { title: "Get a Sender Number", description: "Purchase or register a phone number or alphanumeric Sender ID through your provider.", platform: "Provider → Numbers / Sender IDs", visualHint: "Look for \"Numbers\" or \"Buy a Number\" in the navigation" },
        { title: "Send a Test Message", description: "Use the provider's dashboard or API testing tool to send a test SMS to your phone and verify delivery.", platform: "Provider Dashboard", visualHint: "Look for \"Send Test Message\" or \"API Explorer\"" },
      ],
    },
    existingGuide: {
      prerequisites: "An existing SMS provider account with API credentials",
      estimatedTime: "3 min",
      docsUrl: "https://www.vonage.com/communications-apis/sms/",
      steps: [
        { title: "Locate Your API Credentials", description: "Log in to your SMS provider dashboard. Navigate to API settings or account settings to find your API Key and Secret.", platform: "Provider Dashboard → API Settings", visualHint: "Look for \"API Keys\", \"Credentials\", or \"Account Settings\"" },
        { title: "Copy Your Sender Number", description: "Find the phone number or Sender ID you want to use under your provider's Numbers section.", platform: "Provider → Numbers", visualHint: "Look for your active phone numbers or Sender IDs" },
        { title: "Paste Credentials Below", description: "Enter your provider name, Account SID/API Key, Auth Token, and sender number in the form.", platform: "Connection form", visualHint: "Fill in the credential fields on the left side" },
      ],
    },
  },
  messenger: {
    choiceTitle: "Connect Facebook Messenger",
    choiceSubtitle: "Get started by creating a new Facebook app or connecting an existing one.",
    newLabel: "Create a new app",
    existingLabel: "Connect an existing app",
    newGuide: {
      prerequisites: "Facebook account, a Facebook Page, Meta Developer account",
      estimatedTime: "20–30 min",
      docsUrl: "https://developers.facebook.com/docs/messenger-platform/getting-started",
      steps: [
        { title: "Create a Meta Developer Account", description: "Go to developers.facebook.com, click \"Get Started\" and complete the registration.", platform: "developers.facebook.com", visualHint: "Look for \"Get Started\" in the top navigation" },
        { title: "Create a New App", description: "Click \"My Apps\" → \"Create App\". Select \"Business\" type, then choose \"Business messaging\" use case.", platform: "developers.facebook.com/apps", visualHint: "Look for \"Create App\" button, then \"Business messaging\" card" },
        { title: "Add Messenger Product", description: "In the app dashboard, click \"Add Product\", find the Messenger tile, and click \"Set Up\".", platform: "App Dashboard → Add Product", visualHint: "Find the Messenger icon with \"Set Up\" button" },
        { title: "Connect Your Facebook Page", description: "Under Messenger Settings → Access Tokens, click \"Add or Remove Pages\" and select your Page.", platform: "App Dashboard → Messenger → Settings", visualHint: "Look for \"Add or Remove Pages\" and the page selector" },
        { title: "Generate a Page Access Token", description: "After connecting your page, click \"Generate Token\" next to the page name. Copy and store it securely.", platform: "App Dashboard → Messenger → Settings", visualHint: "Look for \"Generate Token\" next to your page name" },
        { title: "Configure Webhooks", description: "Scroll to \"Webhooks\", click \"Add Callback URL\". Enter your HTTPS URL and verify token, then save.", platform: "App Dashboard → Messenger → Webhooks", visualHint: "Look for \"Callback URL\" and \"Verify Token\" fields" },
        { title: "Subscribe to Events", description: "After verifying, click \"Add Subscriptions\" and check \"messages\" and \"messaging_postbacks\". Save.", platform: "App Dashboard → Messenger → Webhooks", visualHint: "Look for checklist of event types with checkboxes" },
      ],
    },
    existingGuide: {
      prerequisites: "An existing Meta app with Messenger product enabled",
      estimatedTime: "5 min",
      docsUrl: "https://developers.facebook.com/docs/messenger-platform/getting-started",
      steps: [
        { title: "Open Your App Dashboard", description: "Go to developers.facebook.com/apps and select your existing app that has Messenger configured.", platform: "developers.facebook.com/apps", visualHint: "Click on your app name from the My Apps list" },
        { title: "Copy Page Access Token", description: "Go to Messenger → Settings → Access Tokens. Click \"Generate Token\" for the page you want to connect.", platform: "App Dashboard → Messenger → Settings", visualHint: "Look for \"Generate Token\" next to your page name" },
        { title: "Copy App ID & Verify Token", description: "Find your App ID at the top of the dashboard. Copy the Verify Token from your webhook configuration.", platform: "App Dashboard → Settings → Basic", visualHint: "Look for \"App ID\" at the top and webhook settings" },
        { title: "Paste Credentials Below", description: "Enter the Page ID, App ID, Page Access Token, and Verify Token in the form on this page.", platform: "Connection form", visualHint: "Fill in the credential fields on the left side" },
      ],
    },
  },
  instagram: {
    choiceTitle: "Connect Instagram",
    choiceSubtitle: "Get started by setting up a new Instagram integration or connecting an existing one.",
    newLabel: "Set up new integration",
    existingLabel: "Connect existing integration",
    newGuide: {
      prerequisites: "Instagram Business/Creator Account, linked Facebook Page, Meta Developer account",
      estimatedTime: "25–35 min",
      docsUrl: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login",
      steps: [
        { title: "Switch to Business Account", description: "In Instagram app, go to Settings → Account → Switch to Professional Account. Choose Business and connect a Facebook Page.", platform: "Instagram App → Settings", visualHint: "Look for \"Switch to Professional Account\" under Account" },
        { title: "Link to a Facebook Page", description: "In Instagram Settings → Linked Accounts, connect your Facebook Page. This is required for API access.", platform: "Instagram App → Settings → Linked Accounts", visualHint: "Look for \"Facebook\" and the page selector" },
        { title: "Create a Meta App", description: "On developers.facebook.com, create an app with \"Business\" type. Add the \"Instagram\" product.", platform: "developers.facebook.com/apps", visualHint: "Find the Instagram tile under \"Add Products\"" },
        { title: "Configure Permissions", description: "In App Review → Permissions, request instagram_basic, instagram_manage_messages, pages_manage_metadata.", platform: "App Dashboard → App Review → Permissions", visualHint: "Look for permissions list with \"Request\" buttons" },
        { title: "Set Up Webhooks", description: "Under Webhooks, add an \"Instagram\" subscription. Enter your callback URL and verify token, subscribe to \"messages\".", platform: "App Dashboard → Webhooks", visualHint: "Select \"Instagram\" from the object dropdown" },
        { title: "Generate an Access Token", description: "In Messenger/Instagram Settings, generate a Page access token for the linked Facebook Page.", platform: "App Dashboard → Messenger → Settings", visualHint: "Look for \"Generate Token\" next to your linked page" },
      ],
    },
    existingGuide: {
      prerequisites: "An existing Meta app with Instagram messaging configured",
      estimatedTime: "5 min",
      docsUrl: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login",
      steps: [
        { title: "Open Your Meta App", description: "Go to developers.facebook.com/apps and select the app that has Instagram messaging enabled.", platform: "developers.facebook.com/apps", visualHint: "Click your app name from the My Apps list" },
        { title: "Copy Your Credentials", description: "Find your Instagram Business Account ID, Facebook App ID, and Page Access Token from the app settings.", platform: "App Dashboard → Settings", visualHint: "Look for the Account ID in Instagram settings and token in Messenger settings" },
        { title: "Paste Credentials Below", description: "Enter the Instagram Business Account ID, App ID, Access Token, and Webhook Verify Token in the form.", platform: "Connection form", visualHint: "Fill in the credential fields on the left side" },
      ],
    },
  },
  tiktok: {
    choiceTitle: "Connect TikTok Business",
    choiceSubtitle: "Get started by creating a new TikTok developer app or connecting an existing one.",
    newLabel: "Create a new app",
    existingLabel: "Connect an existing app",
    newGuide: {
      prerequisites: "TikTok for Business account, business entity registration",
      estimatedTime: "20–30 min",
      docsUrl: "https://business-api.tiktok.com/portal/docs",
      steps: [
        { title: "Create a Developer Account", description: "Go to the TikTok Developer Portal and register with your TikTok for Business credentials.", platform: "developers.tiktok.com", visualHint: "Look for \"Log In\" or \"Sign Up\" on the Developer Portal" },
        { title: "Create a New App", description: "In the dashboard, click \"Create App\". Enter your app name, description, and select your use case.", platform: "developers.tiktok.com → Manage Apps", visualHint: "Look for the \"Create App\" button" },
        { title: "Apply for Messaging API", description: "In app settings, navigate to permissions and apply for Business Messaging API access.", platform: "Developer Portal → App Settings", visualHint: "Look for \"Business Messaging\" under API products" },
        { title: "Configure Permissions", description: "Once approved, enable \"TikTok Accounts\" under Scope of permission. Add required redirect URLs.", platform: "Developer Portal → App Settings → Permissions", visualHint: "Look for the permission toggles" },
        { title: "Set Up Webhook", description: "Configure your callback URL to receive real-time message notifications via HTTPS POST.", platform: "Developer Portal → App Settings → Webhooks", visualHint: "Look for the \"Webhook\" or \"Callback URL\" field" },
        { title: "Copy Your Credentials", description: "Copy your Client Key (App ID) and Client Secret from the app settings page.", platform: "Developer Portal → App Settings", visualHint: "Look for \"Client Key\" and \"Client Secret\" with copy icons" },
      ],
    },
    existingGuide: {
      prerequisites: "An existing TikTok developer app with messaging API access",
      estimatedTime: "3 min",
      docsUrl: "https://business-api.tiktok.com/portal/docs",
      steps: [
        { title: "Open Your App Settings", description: "Log in to developers.tiktok.com, go to Manage Apps, and select your existing app.", platform: "developers.tiktok.com → Manage Apps", visualHint: "Click on your app name in the app list" },
        { title: "Copy Your Credentials", description: "Copy the App ID (Client Key), App Secret (Client Secret), and Access Token from the app settings.", platform: "Developer Portal → App Settings", visualHint: "Look for \"Client Key\" and \"Client Secret\" fields" },
        { title: "Paste Credentials Below", description: "Enter the App ID, App Secret, Access Token, and Business Account ID in the form on this page.", platform: "Connection form", visualHint: "Fill in the credential fields on the left side" },
      ],
    },
  },
  email: {
    choiceTitle: "Connect Email",
    choiceSubtitle: "Get started by setting up a new email service or connecting your existing SMTP server.",
    newLabel: "Set up a new email service",
    existingLabel: "Connect existing SMTP",
    newGuide: {
      prerequisites: "An email account or email service provider (Gmail, Outlook, SendGrid, etc.)",
      estimatedTime: "10–15 min",
      docsUrl: "https://support.google.com/mail/answer/7126229",
      steps: [
        { title: "Choose an Email Provider", description: "Select an email service: Gmail (smtp.gmail.com), Outlook (smtp.office365.com), or SendGrid (smtp.sendgrid.net).", platform: "Email provider's website", visualHint: "Sign up for an account if you don't have one" },
        { title: "Enable SMTP Access", description: "For Gmail: enable \"Less secure apps\" or generate an App Password. For Outlook: SMTP is enabled by default.", platform: "Email provider settings", visualHint: "Look for \"SMTP\", \"App Passwords\", or \"Mail forwarding\" in settings" },
        { title: "Generate an App Password", description: "If using 2FA: Google Account → Security → App Passwords → Generate. Copy the 16-character password.", platform: "myaccount.google.com/apppasswords (Gmail)", visualHint: "Look for \"App Passwords\" under Security, then \"Generate\"" },
        { title: "Note Your SMTP Settings", description: "SMTP Host, Port (587 for TLS), your email as username, and app password. These go in the form.", platform: "Email provider's documentation", visualHint: "Host, port, username, and password — all needed for the form" },
        { title: "Set the Sender Address", description: "Enter the \"From\" email address. It should match or be authorized by your SMTP account.", platform: "Connection form", visualHint: "Enter in the From Address field on the left" },
      ],
    },
    existingGuide: {
      prerequisites: "SMTP server credentials (host, port, username, password)",
      estimatedTime: "3 min",
      docsUrl: "https://support.google.com/mail/answer/7126229",
      steps: [
        { title: "Gather Your SMTP Details", description: "You need: SMTP host, port (587/465/25), username (usually email), and password (or app password).", platform: "Your email provider's settings", visualHint: "Check your email provider's documentation for SMTP settings" },
        { title: "Paste Credentials Below", description: "Enter the SMTP Host, Port, Username, Password, and From Address in the form on this page.", platform: "Connection form", visualHint: "Fill in the credential fields on the left side" },
      ],
    },
  },
  webchat: {
    choiceTitle: "Set Up Web Chat",
    choiceSubtitle: "Add a live chat widget to your website to capture visitor conversations.",
    newLabel: "Create a new widget",
    existingLabel: "Connect an existing widget",
    newGuide: {
      prerequisites: "A website where you can add a script tag",
      estimatedTime: "5 min",
      docsUrl: "https://docs.turumba.io/webchat",
      steps: [
        { title: "Name Your Widget", description: "Give your web chat widget a name that identifies the site or purpose, e.g. \"Main Site Chat\".", platform: "Connection form", visualHint: "Enter a name in the Widget Name field" },
        { title: "Customize Appearance", description: "Choose a primary color and set a welcome message that visitors see when the chat opens.", platform: "Connection form", visualHint: "Use the color picker and welcome message fields" },
        { title: "Copy the Embed Code", description: "After saving, copy the generated script tag and paste it into your website's HTML, just before </body>.", platform: "Your website's HTML", visualHint: "Paste the script tag at the bottom of your page" },
      ],
    },
    existingGuide: {
      prerequisites: "An existing web chat public key",
      estimatedTime: "2 min",
      docsUrl: "https://docs.turumba.io/webchat",
      steps: [
        { title: "Enter Your Public Key", description: "Paste your existing web chat public key into the form on this page.", platform: "Connection form", visualHint: "Enter the key in the Public Key field" },
        { title: "Verify Connection", description: "Click Test Connection to verify the widget is reachable.", platform: "Connection form", visualHint: "Click the Test button and look for a green check" },
      ],
    },
  },
  smpp: {
    choiceTitle: "Connect SMPP",
    choiceSubtitle: "Get started by setting up a new SMSC account or connecting with existing SMPP credentials.",
    newLabel: "Set up a new SMSC account",
    existingLabel: "Connect with existing credentials",
    newGuide: {
      prerequisites: "Business registration, a need for high-volume SMS",
      estimatedTime: "15–25 min",
      docsUrl: "https://smpp.org/SMPP_v3_4_Issue1_2.pdf",
      steps: [
        { title: "Choose an SMSC Provider", description: "Select an SMSC provider that supports your target regions. Common providers include Infobip, Clickatell, and route-specific aggregators.", platform: "Provider's website", visualHint: "Look for \"SMPP\" or \"Enterprise SMS\" plans on the provider's page" },
        { title: "Request SMPP Credentials", description: "Contact your provider or sign up via their portal. Request SMPP access with: host/IP, port, system_id, and password.", platform: "SMPP provider portal", visualHint: "Look for \"SMPP Credentials\" or \"ESME Configuration\"" },
        { title: "Whitelist Your IP", description: "Most SMSC providers require IP whitelisting. Provide your server's static IP address to the provider.", platform: "SMPP provider portal", visualHint: "Look for \"IP Whitelist\" or \"Allowed IPs\" in the settings" },
        { title: "Configure Connection", description: "Enter the SMSC host and port (2775 standard, 2776 TLS). Set bind type to Transceiver for two-way messaging.", platform: "Connection form", visualHint: "Enter Host, Port, and select bind type on the left" },
        { title: "Test the Connection", description: "Initiate a bind to verify connectivity. A successful bind returns ESME_ROK status (0x00000000).", platform: "Connection form → Test", visualHint: "Click \"Test Connection\" and look for success indicator" },
      ],
    },
    existingGuide: {
      prerequisites: "SMPP credentials from your SMSC provider (host, port, system_id, password)",
      estimatedTime: "3 min",
      docsUrl: "https://smpp.org/SMPP_v3_4_Issue1_2.pdf",
      steps: [
        { title: "Gather Your SMPP Credentials", description: "You need: SMSC host/IP, port, system_id (username), password, and optionally system_type.", platform: "Your SMSC provider portal", visualHint: "Check your provider dashboard or the welcome email for SMPP details" },
        { title: "Paste Credentials Below", description: "Enter the Host, Port, System ID, Password, and System Type in the form on this page.", platform: "Connection form", visualHint: "Fill in the credential fields on the left side" },
      ],
    },
  },
};

type TestPhase = "idle" | "dns" | "handshake" | "auth" | "send" | "done";
type TestResult = "pending" | "pass" | "fail";

const TEST_PHASES: { id: TestPhase; label: string; description: string }[] = [
  { id: "dns", label: "DNS Resolution", description: "Resolving endpoint hostname..." },
  { id: "handshake", label: "TLS Handshake", description: "Establishing secure connection..." },
  { id: "auth", label: "Authentication", description: "Verifying API credentials..." },
  { id: "send", label: "Test Message", description: "Sending a test ping..." },
];

// ============================================================
// Props
// ============================================================

interface ChannelsViewProps {
  // -- Delivery Channels --
  channels: DeliveryChannel[];
  onAddChannel: (channel: Omit<DeliveryChannel, "id" | "createdAt" | "stats">) => void;
  onUpdateChannel: (id: string, data: Partial<DeliveryChannel>) => void;
  onDeleteChannel: (id: string) => void;
  onToggleChannel: (id: string) => void;

  // -- Chat Endpoints (embedded panel) --
  chatEndpoints: ChatEndpoint[];
  conversationRules: ConversationRule[];
  users: User[];
  teamGroups: TeamGroup[];
  groups: Group[];
  contacts: Contact[];
  onAddEndpoint: (data: Partial<ChatEndpoint>) => void;
  onUpdateEndpoint: (id: string, data: Partial<ChatEndpoint>) => void;
  onDeleteEndpoint: (id: string) => void;
  onAddRule: (data: Partial<ConversationRule>) => void;
  onUpdateRule: (id: string, data: Partial<ConversationRule>) => void;
  onDeleteRule: (id: string) => void;
  onReorderRules: (rules: ConversationRule[]) => void;
}

// ============================================================
// Shared tiny components
// ============================================================

const ChannelIcon = ({ type, className }: { type: typeof CHANNEL_TYPES[number]; className?: string }) => {
  if (type.logoUrl) {
    return <img src={type.logoUrl} alt={type.label} className={cn("object-contain", className)} />;
  }
  const Icon = type.icon;
  return <Icon className={cn(className, type.color)} />;
};

const FilterButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-2.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0",
      active ? "bg-background text-foreground border border-border" : "text-muted-foreground hover:text-foreground"
    )}
  >
    {children}
  </button>
);

const SensitiveField = ({ value }: { value: string }) => {
  const [visible, setVisible] = useState(false);
  if (!value) return <span className="text-muted-foreground text-xs italic">Not set</span>;
  return (
    <span className="flex items-center gap-1.5 font-mono text-xs">
      {visible ? value : "•".repeat(Math.min(value.length, 16))}
      <button onClick={() => setVisible(!visible)} className="text-muted-foreground hover:text-foreground">
        {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </button>
    </span>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-sm py-0.5">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="font-medium text-foreground text-xs">{value}</span>
  </div>
);

// ============================================================
// Main View
// ============================================================

type Screen =
  | { kind: "list" }
  | { kind: "catalog" }
  | { kind: "connect"; channelType: ChannelType }
  | { kind: "detail"; channelId: string }
  | { kind: "edit"; channelId: string };

export const ChannelsView = ({
  channels,
  onAddChannel,
  onUpdateChannel,
  onDeleteChannel,
  onToggleChannel,
  chatEndpoints,
  conversationRules,
  users,
  teamGroups,
  groups,
  contacts,
  onAddEndpoint,
  onUpdateEndpoint,
  onDeleteEndpoint,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onReorderRules,
}: ChannelsViewProps) => {
  const [screen, setScreen] = useState<Screen>({ kind: "list" });
  const [isChatEndpointsOpen, setIsChatEndpointsOpen] = useState(false);

  const handleDuplicate = (ch: DeliveryChannel) => {
    onAddChannel({
      tenantId: ch.tenantId,
      name: `${ch.name} (Copy)`,
      type: ch.type,
      status: "disconnected",
      enabled: false,
      config: { ...ch.config },
      senderName: ch.senderName,
      defaultCountryCode: ch.defaultCountryCode,
      rateLimit: ch.rateLimit,
      priority: ch.priority,
    });
    toast.success(`Duplicated "${ch.name}"`);
  };

  return (
    <div className="relative animate-in fade-in duration-500">

      {/* Chat Endpoints Full-Page Overlay (portalled to body) */}
      {ReactDOM.createPortal(
        <AnimatePresence>
        {isChatEndpointsOpen && (
          <motion.div
            key="chat-endpoints-panel"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] bg-background flex flex-col"
          >
            <div className="shrink-0 border-b border-border bg-background px-5 py-3 flex items-center gap-3">
              <button
                onClick={() => setIsChatEndpointsOpen(false)}
                className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Channels
              </button>
              <span className="text-muted-foreground text-sm">/</span>
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Chat Endpoints</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {chatEndpoints.length} endpoint{chatEndpoints.length !== 1 ? "s" : ""} · {conversationRules.length} rule{conversationRules.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setIsChatEndpointsOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <ChatEndpointsView
                chatEndpoints={chatEndpoints}
                conversationRules={conversationRules}
                users={users}
                teamGroups={teamGroups}
                groups={groups}
                contacts={contacts}
                onAddEndpoint={onAddEndpoint}
                onUpdateEndpoint={onUpdateEndpoint}
                onDeleteEndpoint={onDeleteEndpoint}
                onAddRule={onAddRule}
                onUpdateRule={onUpdateRule}
                onDeleteRule={onDeleteRule}
                onReorderRules={onReorderRules}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}

      <AnimatePresence mode="wait">
        {screen.kind === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <ChannelListScreen
              channels={channels}
              onToggleChannel={onToggleChannel}
              onGoDetail={(id) => setScreen({ kind: "detail", channelId: id })}
              onGoAddChannel={() => setScreen({ kind: "catalog" })}
              onOpenChatEndpoints={() => setIsChatEndpointsOpen(true)}
              chatEndpointsCount={chatEndpoints.length}
            />
          </motion.div>
        )}

        {screen.kind === "catalog" && (
          <motion.div key="catalog" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            <CatalogScreen
              channels={channels}
              onGoConnect={(type) => setScreen({ kind: "connect", channelType: type })}
              onBack={() => setScreen({ kind: "list" })}
            />
          </motion.div>
        )}

        {screen.kind === "connect" && (
          <motion.div key="connect" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            <ConnectScreen
              channelType={screen.channelType}
              onBack={() => setScreen({ kind: "catalog" })}
              onAdd={(data) => {
                onAddChannel(data);
                setScreen({ kind: "list" });
              }}
            />
          </motion.div>
        )}

        {screen.kind === "detail" && (
          <motion.div key="detail" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            <DetailScreen
              channelId={screen.channelId}
              channels={channels}
              onBack={() => setScreen({ kind: "list" })}
              onEdit={() => setScreen({ kind: "edit", channelId: screen.channelId })}
              onToggle={() => onToggleChannel(screen.channelId)}
              onDelete={() => { onDeleteChannel(screen.channelId); setScreen({ kind: "list" }); }}
              onDuplicate={() => {
                const ch = channels.find(c => c.id === screen.channelId);
                if (ch) handleDuplicate(ch);
              }}
              onUpdateChannel={onUpdateChannel}
            />
          </motion.div>
        )}

        {screen.kind === "edit" && (
          <motion.div key="edit" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            <EditScreen
              channelId={screen.channelId}
              channels={channels}
              onBack={() => setScreen({ kind: "detail", channelId: screen.channelId })}
              onSave={(data) => {
                onUpdateChannel(screen.channelId, data);
                setScreen({ kind: "detail", channelId: screen.channelId });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ============================================================
// Screen 0: Channel List (Figma-faithful design)
// ============================================================

/** Map a DeliveryChannel type to a ChannelProvider key for Figma brand logos. */
const TYPE_TO_PROVIDER: Record<string, ChannelProvider> = {
  whatsapp: "whatsapp",
  telegram: "telegram",
  sms: "sms",
  smpp: "sms",
  twilio: "sms",
  webchat: "agelgil",
  email: "sms",
  messenger: "telegram",
  instagram: "telegram",
  tiktok: "telegram",
};

/** Convert internal DeliveryChannel to the Figma card format. */
function toFigmaChannel(ch: DeliveryChannel): FigmaChannel {
  const provider = TYPE_TO_PROVIDER[ch.type] ?? "sms";
  const statuses: FigmaChannel["statuses"] = [];
  if (ch.status === "connected") statuses.push("connected");
  else if (ch.status === "disconnected") statuses.push("disconnected");
  else if (ch.status === "error") statuses.push("error");
  else if (ch.status === "rate_limited") statuses.push("error");
  if (!ch.enabled) statuses.push("disabled");

  const typeInfo = CHANNEL_TYPES.find(ct => ct.id === ch.type);
  const dateStr = ch.createdAt ? new Date(ch.createdAt).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "";
  const deliveryRate = ch.stats.sent > 0 ? Math.round((ch.stats.delivered / ch.stats.sent) * 100) : 0;

  const base: FigmaChannel = {
    id: ch.id,
    name: ch.name,
    provider,
    enabled: ch.enabled,
    statuses,
  };

  // Webchat / agelgil cards show credentials variant
  if (ch.type === "webchat") {
    base.channelType = "Web Chat";
    base.publicKey = ch.config?.publicKey || "SyX8A0mq1cwJ0G3bQ0nTNvhk2MqX4Ulh1cW...";
  } else {
    base.meta = `${typeInfo?.label || ch.type} – ${dateStr}`;
    base.metrics = {
      sent: ch.stats.sent.toLocaleString(),
      delivery: `${deliveryRate}%`,
    };
  }

  return base;
}

const ChannelListScreen = ({
  channels,
  onToggleChannel,
  onGoDetail,
  onGoAddChannel,
  onOpenChatEndpoints,
  chatEndpointsCount,
}: {
  channels: DeliveryChannel[];
  onToggleChannel: (id: string) => void;
  onGoDetail: (id: string) => void;
  onGoAddChannel: () => void;
  onOpenChatEndpoints: () => void;
  chatEndpointsCount: number;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filteredChannels = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return channels;
    return channels.filter(ch => ch.name.toLowerCase().includes(needle));
  }, [channels, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const activeCount = channels.filter(ch => ch.status === "connected" && ch.enabled).length;
    const totalSent = channels.reduce((sum, ch) => sum + ch.stats.sent, 0);
    const totalDelivered = channels.reduce((sum, ch) => sum + ch.stats.delivered, 0);
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
    const errorCount = channels.filter(ch => ch.status === "error").length;
    return { activeCount, totalSent, totalDelivered, deliveryRate, errorCount };
  }, [channels]);

  const STATS = [
    { label: "Active", value: String(stats.activeCount), caption: `of ${channels.length} total` },
    { label: "Sent", value: stats.totalSent.toLocaleString(), caption: "All time" },
    { label: "Delivery rate", value: `${stats.deliveryRate}%`, caption: `${stats.totalDelivered.toLocaleString()} delivered` },
    { label: "Errors", value: String(stats.errorCount), caption: "Need attention" },
  ];

  return (
    <div className="flex w-full shrink-0 flex-col items-start gap-[16px] p-[24px]">
      <div className="flex w-full shrink-0 flex-col items-start gap-[16px]">
        <div className="flex w-full shrink-0 flex-col items-start gap-[20px]">
          {/* Header */}
          <div className="flex w-full shrink-0 flex-col items-start pt-[16px]">
            <div className="flex w-full items-center">
              <div className="flex min-w-0 flex-1 items-center justify-between">
                <div className="flex shrink-0 flex-col items-start justify-center gap-[4px] whitespace-nowrap">
                  <h1 className="text-[18px] leading-[28px] font-semibold text-foreground">Channels</h1>
                  <p className="text-[16px] leading-[24px] text-muted-foreground">
                    Manage your messaging connections — SMS, WhatsApp, Telegram, Email, and more.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-[16px]">
                  <button
                    type="button"
                    onClick={onGoAddChannel}
                    className="flex shrink-0 items-center gap-[8px] overflow-hidden rounded-sm bg-primary py-[10px] pr-[24px] pl-[20px] text-[14px] leading-[20px] font-medium whitespace-nowrap text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <FigmaIcon spec={contentIcons.plus} />
                    Add Channel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex w-full shrink-0 items-center py-[24px]">
          <div className="flex min-w-0 flex-1 items-center gap-[8px]">
            {STATS.map((stat) => (
              <StatTile key={stat.label} {...stat} />
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <ChannelsToolbar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
        />
      </div>

      {/* Channel cards */}
      {channels.length === 0 ? (
        <div className="border border-border rounded-xl p-16 text-center w-full">
          <Signal className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-sm font-bold text-foreground mb-1">No channels connected yet</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Connect your first messaging channel to start sending and receiving messages.
          </p>
          <button
            onClick={onGoAddChannel}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Channel
          </button>
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="border border-border rounded-xl p-12 text-center w-full">
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No channels match your filters.</p>
        </div>
      ) : (
        <div className="flex w-full shrink-0 flex-col items-start">
          <div className="flex w-full shrink-0 flex-wrap content-center items-center gap-[32px]">
            {filteredChannels.map(ch => {
              const figmaChannel = toFigmaChannel(ch);
              return (
                <ChannelCard
                  key={ch.id}
                  channel={figmaChannel}
                  onToggle={(id, enabled) => {
                    if (enabled !== ch.enabled) onToggleChannel(id);
                  }}
                  onClick={() => onGoDetail(ch.id)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


// ============================================================
// Screen 1: Catalog (reached via "Add Channel")
// ============================================================

const CatalogScreen = ({
  channels,
  onGoConnect,
  onBack,
}: {
  channels: DeliveryChannel[];
  onGoConnect: (type: ChannelType) => void;
  onBack: () => void;
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const CATEGORIES = [
    { id: "all", label: "All" },
    { id: "messaging", label: "Business Messaging" },
    { id: "sms", label: "SMS" },
    { id: "email", label: "Email" },
    { id: "social", label: "Social Media" },
  ];

  const CHANNEL_CATEGORY: Record<ChannelType, string> = {
    whatsapp: "messaging",
    messenger: "messaging",
    telegram: "messaging",
    sms: "sms",
    twilio: "sms",
    smpp: "sms",
    email: "email",
    instagram: "social",
    tiktok: "social",
    webchat: "messaging",
  };

  const filteredTypes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return CHANNEL_TYPES.filter(ct => {
      const matchesCategory = categoryFilter === "all" || CHANNEL_CATEGORY[ct.id] === categoryFilter;
      const matchesSearch = !q || ct.label.toLowerCase().includes(q) || ct.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, searchQuery]);

  return (
    <div className="space-y-6 p-6 lg:p-10">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Channels
      </button>

      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Channel Catalog</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your messaging channels and discover new ones to help you acquire more customers.
        </p>
      </header>

      {/* Category tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 p-1 bg-muted border border-border overflow-x-auto flex-1">
          {CATEGORIES.map(cat => (
            <FilterButton key={cat.id} active={categoryFilter === cat.id} onClick={() => setCategoryFilter(cat.id)}>
              {cat.label}
            </FilterButton>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search Channel Catalog"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Search channel catalog"
          />
        </div>
      </div>

      {/* Channel type cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTypes.map(ct => {
          const isPopular = POPULAR_CHANNELS.includes(ct.id);
          const isBeta = BETA_CHANNELS.includes(ct.id);
          const connectedCount = channels.filter(ch => ch.type === ct.id).length;
          const catalogDesc = CHANNEL_CATALOG_DESCRIPTIONS[ct.id] || ct.description;
          return (
            <div
              key={ct.id}
              className={cn(
                "relative border p-5 flex flex-col group hover:border-primary/30 transition-colors",
                ct.bgColor, ct.borderColor
              )}
            >
              {/* Badge */}
              {(isPopular || isBeta) && (
                <div className="flex gap-1.5 mb-3">
                  {isPopular && (
                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold", ct.color)}>
                      <Signal className="w-3 h-3" />
                      Popular
                    </span>
                  )}
                  {isBeta && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                      <Activity className="w-3 h-3" />
                      Beta
                    </span>
                  )}
                </div>
              )}

              {/* Title + large icon */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-base font-bold text-foreground leading-snug flex-1">{ct.label}</h3>
                <div className="w-12 h-12 flex items-center justify-center shrink-0">
                  <ChannelIcon type={ct} className="w-10 h-10" />
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">{catalogDesc}</p>

              {/* Separator + Connect button */}
              <div className="border-t border-border/60 mt-4 pt-3 flex items-center justify-end gap-2">
                {connectedCount > 0 && (
                  <span className="text-[10px] text-muted-foreground mr-auto">
                    {connectedCount} connected
                  </span>
                )}
                <button
                  onClick={() => onGoConnect(ct.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold border border-border bg-background/80 text-foreground hover:bg-background transition-colors"
                >
                  Connect
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {filteredTypes.length === 0 && (
        <div className="border border-border p-12 text-center">
          <Signal className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No channel types match your search</p>
        </div>
      )}
    </div>
  );
};


// ============================================================
// Connected Channel Row (used in catalog's "Your Channels")
// ============================================================

const ConnectedChannelRow = ({
  channel,
  onToggle,
  onClick,
}: {
  channel: DeliveryChannel;
  onToggle: () => void;
  onClick: () => void;
}) => {
  const typeInfo = CHANNEL_TYPES.find(ct => ct.id === channel.type);
  const statusInfo = statusConfig[channel.status];
  const StatusIcon = statusInfo.icon;
  const deliveryRate = channel.stats.sent > 0 ? Math.round((channel.stats.delivered / channel.stats.sent) * 100) : 0;
  const dateStr = channel.lastActiveAt
    ? new Date(channel.lastActiveAt).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
    : null;

  return (
    <div
      className="border border-border rounded-xl bg-card p-5 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all flex flex-col"
      onClick={onClick}
    >
      {/* Row 1: icon + name + toggle */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border", typeInfo?.bgColor, typeInfo?.borderColor)}>
            {typeInfo && <ChannelIcon type={typeInfo} className="w-5 h-5" />}
          </div>
          <p className="text-sm font-bold text-foreground truncate">{channel.name}</p>
        </div>
        <div onClick={e => e.stopPropagation()} className="shrink-0">
          <Switch checked={channel.enabled} onCheckedChange={onToggle} aria-label="Enable channel" />
        </div>
      </div>

      {/* Row 2: status badges */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border", statusInfo.bgColor, statusInfo.color)}>
          <StatusIcon className="w-3 h-3" />
          {statusInfo.label}
        </span>
        {!channel.enabled && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">Disabled</span>
        )}
      </div>

      {/* Row 3: type + date */}
      <p className="text-xs text-muted-foreground mb-4">
        {typeInfo?.label}
        {dateStr && <> – {dateStr}</>}
      </p>

      {/* Row 4: sent + delivery stats */}
      <div className="flex items-end gap-6 mt-auto">
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">Sent</p>
          <p className="text-lg font-bold text-foreground leading-none">{channel.stats.sent.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">Delivery</p>
          <p className="text-lg font-bold text-foreground leading-none">{deliveryRate}%</p>
        </div>
      </div>
    </div>
  );
};


// ============================================================
// Screen 2: Connect (choice → two-column form + guide)
// ============================================================

const ConnectScreen = ({
  channelType,
  onBack,
  onAdd,
}: {
  channelType: ChannelType;
  onBack: () => void;
  onAdd: (data: Omit<DeliveryChannel, "id" | "createdAt" | "stats">) => void;
}) => {
  const typeInfo = CHANNEL_TYPES.find(c => c.id === channelType)!;
  const connectConfig = CHANNEL_CONNECT_CONFIG[channelType];
  const [method, setMethod] = useState<ConnectMethod | null>(null);

  return (
    <div className="p-6 lg:p-10 space-y-6 animate-in fade-in duration-300">
      {/* Back */}
      <button
        onClick={method ? () => setMethod(null) : onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {method ? "Back" : "Back to Catalog"}
      </button>

      <AnimatePresence mode="wait">
        {!method ? (
          /* ─── Choice Screen ─── */
          <motion.div
            key="choice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="max-w-xl"
          >
            <h1 className="text-2xl font-bold text-foreground mb-1">{connectConfig.choiceTitle}</h1>
            <p className="text-sm text-muted-foreground mb-8">{connectConfig.choiceSubtitle}</p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setMethod("new")}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {connectConfig.newLabel}
              </button>
              <button
                onClick={() => setMethod("existing")}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {connectConfig.existingLabel}
              </button>
            </div>
          </motion.div>
        ) : (
          /* ─── Form + Guide (two-column) ─── */
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ConnectFormWithGuide
              channelType={channelType}
              typeInfo={typeInfo}
              method={method}
              guide={method === "new" ? connectConfig.newGuide : connectConfig.existingGuide}
              onBack={() => setMethod(null)}
              onAdd={onAdd}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ============================================================
// Connect Form + Guide (used after method is chosen)
// ============================================================

const ConnectFormWithGuide = ({
  channelType,
  typeInfo,
  method,
  guide,
  onBack,
  onAdd,
}: {
  channelType: ChannelType;
  typeInfo: typeof CHANNEL_TYPES[number];
  method: ConnectMethod;
  guide: SetupGuide;
  onBack: () => void;
  onAdd: (data: Omit<DeliveryChannel, "id" | "createdAt" | "stats">) => void;
}) => {
  const fields = CHANNEL_CONFIG_FIELDS[channelType];

  const [name, setName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [rateLimit, setRateLimit] = useState("");
  const [priority, setPriority] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      tenantId: "tenant-1",
      name: name.trim(),
      type: channelType,
      status: "disconnected" as ChannelStatus,
      enabled: false,
      config,
      senderName: senderName.trim() || undefined,
      rateLimit: rateLimit ? parseInt(rateLimit) : undefined,
      priority: priority ? parseInt(priority) : undefined,
      defaultCountryCode: countryCode.trim() || undefined,
    });
    toast.success(`"${name}" channel created`);
  };

  return (
    <div className="space-y-6">
      {/* Channel type banner */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 border border-border">
        <div className={cn("w-12 h-12 flex items-center justify-center border", typeInfo.bgColor, typeInfo.borderColor)}>
          <ChannelIcon type={typeInfo} className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Connect {typeInfo.label}</h1>
          <p className="text-sm text-muted-foreground">
            {method === "new" ? "Setting up from scratch" : "Connecting with existing credentials"}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {guide.estimatedTime}
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── LEFT: Connection Form ─── */}
        <div className="space-y-5">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Connection Details
          </h2>

          {/* Basics */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Channel Name <span className="text-destructive">*</span></label>
            <input
              placeholder="e.g. Main WhatsApp, Support SMS"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Channel name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Sender Name</label>
            <input
              placeholder="e.g. Acme Corp, support@acme.com"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Sender name"
            />
            <p className="text-xs text-muted-foreground">The name or number recipients will see.</p>
          </div>

          <div className="border-t border-border" />

          {/* Credentials */}
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Credentials & API Settings</h4>
          {fields.map(f => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">{f.label}</label>
              <input
                type={f.sensitive ? "password" : "text"}
                placeholder={f.placeholder}
                value={config[f.key] || ""}
                onChange={e => setConfig(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label={f.label}
              />
              {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
            </div>
          ))}

          {/* Advanced (collapsible) */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Advanced Options
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 overflow-hidden"
              >
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Rate Limit</label>
                    <input type="number" placeholder="msg/hr" value={rateLimit} onChange={e => setRateLimit(e.target.value)}
                      className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Rate limit" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Priority</label>
                    <input type="number" placeholder="1-10" value={priority} onChange={e => setPriority(e.target.value)}
                      className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Channel priority" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Country Code</label>
                    <input placeholder="+1" value={countryCode} onChange={e => setCountryCode(e.target.value)}
                      className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Country code" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Warning */}
          <div className="p-3 bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700">
              <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5" />
              The channel will be created in <strong>Disconnected</strong> state. Use "Test Connection" to verify credentials, then enable to go live.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button onClick={onBack} className="px-4 py-2 text-sm font-semibold border border-border bg-background text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              disabled={!name.trim()}
              onClick={handleSubmit}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors",
                name.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              Create Channel
            </button>
          </div>
        </div>

        {/* ─── RIGHT: Setup Guide ─── */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            How to Connect
          </h2>

          {/* Prerequisites */}
          <div className="p-3 bg-primary/5 border border-primary/15">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Prerequisites</p>
            <p className="text-xs text-foreground">{guide.prerequisites}</p>
          </div>

          {/* Steps */}
          <div className="space-y-0">
            {guide.steps.map((step, i) => (
              <SetupStepCard key={i} step={step} index={i} isLast={i === guide.steps.length - 1} />
            ))}
          </div>

          {/* Docs link */}
          <a
            href={guide.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Official Documentation</p>
              <p className="text-[10px] text-muted-foreground truncate">{guide.docsUrl}</p>
            </div>
            <ArrowLeft className="w-3 h-3 text-muted-foreground rotate-180 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};


// ============================================================
// Setup Step Card (used in connect screen guide)
// ============================================================

const SetupStepCard = ({ step, index, isLast }: { step: SetupStep; index: number; isLast: boolean }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex gap-3">
      {/* Timeline line + number */}
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 flex items-center justify-center border border-border bg-background text-xs font-bold text-foreground shrink-0">
          {index + 1}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border min-h-[16px]" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 pb-4 min-w-0", isLast && "pb-0")}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left group"
        >
          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
            {step.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              {/* Visual hint card — mini browser mockup */}
              <div className="mt-2 border border-border bg-muted/30 overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border-b border-border">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400/60" />
                    <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                  </div>
                  <div className="flex-1 px-2 py-0.5 bg-background border border-border mx-2">
                    <p className="text-[9px] text-muted-foreground truncate font-mono">{step.platform}</p>
                  </div>
                </div>

                {/* Visual hint content */}
                <div className="p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <MousePointerClick className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-foreground leading-relaxed">{step.visualHint}</p>
                  </div>

                  {/* Stylized UI mockup */}
                  <div className="p-2 bg-background border border-border space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 bg-muted-foreground/15 flex-1 max-w-[60%]" />
                      <div className="h-2 bg-muted-foreground/10 w-8" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 bg-muted-foreground/10 w-12" />
                      <div className="h-5 px-2 bg-primary/15 border border-primary/25 flex items-center">
                        <span className="text-[8px] font-bold text-primary tracking-wide">
                          {step.title.includes("Generate") ? "GENERATE" :
                           step.title.includes("Create") ? "CREATE" :
                           step.title.includes("Add") ? "ADD" :
                           step.title.includes("Configure") ? "SAVE" :
                           step.title.includes("Copy") ? "COPY" :
                           step.title.includes("Set") ? "SET UP" :
                           step.title.includes("Connect") ? "CONNECT" :
                           step.title.includes("Subscribe") ? "SUBSCRIBE" :
                           step.title.includes("Open") ? "OPEN" :
                           step.title.includes("Send") ? "SEND" :
                           step.title.includes("Test") ? "TEST" :
                           step.title.includes("Enter") ? "SUBMIT" :
                           step.title.includes("Identify") ? "FIND" :
                           step.title.includes("Determine") ? "SELECT" :
                           step.title.includes("Obtain") ? "GET" :
                           step.title.includes("Choose") ? "SELECT" :
                           step.title.includes("Switch") ? "SWITCH" :
                           step.title.includes("Link") ? "LINK" :
                           step.title.includes("Apply") ? "APPLY" :
                           "CLICK"}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted-foreground/10 w-3/4" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};


// ============================================================
// Screen 3: Detail (full-page channel detail with tabs)
// ============================================================

const DetailScreen = ({
  channelId,
  channels,
  onBack,
  onEdit,
  onToggle,
  onDelete,
  onDuplicate,
  onUpdateChannel,
}: {
  channelId: string;
  channels: DeliveryChannel[];
  onBack: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdateChannel: (id: string, data: Partial<DeliveryChannel>) => void;
}) => {
  const channel = channels.find(c => c.id === channelId);
  const [tab, setTab] = useState<"overview" | "config" | "activity">("overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showTest, setShowTest] = useState(false);

  if (!channel) {
    return (
      <div className="p-6 lg:p-10">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Channels
        </button>
        <div className="border border-border p-12 text-center">
          <Signal className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Channel not found</p>
        </div>
      </div>
    );
  }

  const typeInfo = CHANNEL_TYPES.find(ct => ct.id === channel.type);
  const statusInfo = statusConfig[channel.status];
  const StatusIcon = statusInfo.icon;
  const deliveryRate = channel.stats.sent > 0 ? Math.round((channel.stats.delivered / channel.stats.sent) * 100) : 0;
  const fields = CHANNEL_CONFIG_FIELDS[channel.type];

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Channels
      </button>

      {/* Channel header */}
      <div className="flex items-start gap-4">
        <div className={cn("w-14 h-14 flex items-center justify-center shrink-0 border relative", typeInfo?.bgColor, typeInfo?.borderColor)}>
          {typeInfo && <ChannelIcon type={typeInfo} className="w-7 h-7" />}
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-background rounded-full",
            channel.status === "connected" ? "bg-emerald-500" :
            channel.status === "error" ? "bg-destructive" :
            channel.status === "rate_limited" ? "bg-amber-500" : "bg-muted-foreground/40"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground">{channel.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold border", statusInfo.bgColor, statusInfo.color)}>
              <StatusIcon className="w-2.5 h-2.5" />
              {statusInfo.label}
            </span>
            <span className="text-xs text-muted-foreground">{typeInfo?.label}</span>
            {channel.senderName && <span className="text-xs text-muted-foreground">&middot; {channel.senderName}</span>}
            {channel.createdAt && <span className="text-xs text-muted-foreground">&middot; Created {formatTimeAgo(channel.createdAt)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Switch checked={channel.enabled} onCheckedChange={onToggle} aria-label="Enable channel" />
          <span className="text-xs text-muted-foreground font-medium w-14">{channel.enabled ? "Enabled" : "Disabled"}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => {
          onUpdateChannel(channelId, { status: "connected", lastActiveAt: new Date().toISOString() });
          toast.success(`${channel.name} reconnected`);
        }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border bg-background text-foreground hover:bg-muted transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Reconnect
        </button>
        <button onClick={() => setShowTest(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border bg-background text-foreground hover:bg-muted transition-colors">
          <TestTube className="w-3.5 h-3.5" />
          Test
        </button>
        <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border bg-background text-foreground hover:bg-muted transition-colors">
          <Edit2 className="w-3.5 h-3.5" />
          Edit
        </button>
        <button onClick={onDuplicate} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border bg-background text-foreground hover:bg-muted transition-colors">
          <Copy className="w-3.5 h-3.5" />
          Duplicate
        </button>
        <div className="flex-1" />
        <button onClick={() => setShowDeleteConfirm(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted border border-border">
        {([
          { id: "overview" as const, label: "Overview", icon: BarChart3 },
          { id: "config" as const, label: "Configuration", icon: Shield },
          { id: "activity" as const, label: "Activity Log", icon: Clock },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all flex-1 justify-center",
              tab === t.id ? "bg-background text-foreground border border-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Sent", value: channel.stats.sent.toLocaleString(), accent: "" },
                { label: "Delivered", value: channel.stats.delivered.toLocaleString(), accent: "" },
                { label: "Delivery Rate", value: `${deliveryRate}%`, accent: deliveryRate >= 90 ? "text-emerald-600" : deliveryRate >= 70 ? "text-amber-600" : "text-destructive" },
                { label: "Failed", value: channel.stats.failed.toString(), accent: channel.stats.failed > 0 ? "text-destructive" : "" },
              ].map(s => (
                <div key={s.label} className="p-3 bg-muted/30 border border-border text-center">
                  <p className={cn("text-xl font-bold", s.accent || "text-foreground")}>{s.value}</p>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 p-4 border border-border bg-muted/10">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Channel Info</h5>
                <InfoRow label="Type" value={typeInfo?.label || channel.type} />
                <InfoRow label="Sender" value={channel.senderName || "—"} />
                <InfoRow label="Country Code" value={channel.defaultCountryCode || "—"} />
                <InfoRow label="Rate Limit" value={channel.rateLimit ? `${channel.rateLimit.toLocaleString()} msg/hr` : "Unlimited"} />
                <InfoRow label="Priority" value={channel.priority ? `#${channel.priority}` : "—"} />
              </div>
              <div className="space-y-2 p-4 border border-border bg-muted/10">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Timeline</h5>
                <InfoRow label="Created" value={channel.createdAt ? new Date(channel.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"} />
                <InfoRow label="Last Active" value={channel.lastActiveAt ? formatTimeAgo(channel.lastActiveAt) : "Never"} />
                <InfoRow label="Status Since" value={channel.lastActiveAt ? formatTimeAgo(channel.lastActiveAt) : "—"} />
              </div>
            </div>

            {channel.status === "error" && (
              <div className="p-3 bg-destructive/5 border border-destructive/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-destructive">Connection Error</p>
                  <p className="text-xs text-muted-foreground mt-0.5">This channel has a connection error. Try reconnecting or verify your credentials in the Configuration tab.</p>
                </div>
              </div>
            )}
            {channel.status === "rate_limited" && (
              <div className="p-3 bg-amber-50 border border-amber-200 flex items-start gap-2">
                <Activity className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-700">Rate Limited</p>
                  <p className="text-xs text-amber-600/80 mt-0.5">This channel has hit its rate limit. Messages will queue until the limit resets.</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === "config" && (
          <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="space-y-2 p-4 border border-border bg-muted/10">
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">API Credentials</h5>
              {fields.map(f => (
                <div key={f.key} className="flex justify-between items-center text-sm py-1.5">
                  <span className="text-muted-foreground text-xs">{f.label}</span>
                  {f.sensitive
                    ? <SensitiveField value={channel.config[f.key] || ""} />
                    : <span className="font-mono text-xs text-foreground">{channel.config[f.key] || <span className="text-muted-foreground italic">Not set</span>}</span>}
                </div>
              ))}
            </div>
            <div className="space-y-2 p-4 border border-border bg-muted/10">
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Delivery Settings</h5>
              <InfoRow label="Sender Name" value={channel.senderName || "—"} />
              <InfoRow label="Default Country Code" value={channel.defaultCountryCode || "—"} />
              <InfoRow label="Rate Limit" value={channel.rateLimit ? `${channel.rateLimit.toLocaleString()} msg/hr` : "Unlimited"} />
              <InfoRow label="Priority" value={channel.priority ? `#${channel.priority}` : "Default"} />
            </div>
            <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border bg-background text-foreground hover:bg-muted transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
              Edit Configuration
            </button>
          </motion.div>
        )}

        {tab === "activity" && (
          <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ActivityLog channel={channel} typeLabel={typeInfo?.label || channel.type} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Test Connection panel */}
      <AnimatePresence>
        {showTest && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
            <TestConnectionPanel
              channel={channel}
              onClose={() => setShowTest(false)}
              onStatusChange={(status) => onUpdateChannel(channelId, { status, lastActiveAt: new Date().toISOString() })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
            <div className="border border-destructive/30 p-5 space-y-4">
              <div className="p-3 bg-destructive/5 border border-destructive/20">
                <p className="text-xs text-destructive font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                  This action cannot be undone.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                You are about to permanently delete <strong className="text-foreground">{channel.name}</strong>. All associated configuration and message history will be removed.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Type "delete" to confirm</label>
                <input
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="delete"
                  className="w-full max-w-xs h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-destructive"
                  aria-label="Confirmation text"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                  className="px-3 py-1.5 text-xs font-semibold border border-border bg-background text-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button
                  disabled={deleteConfirmText.toLowerCase() !== "delete"}
                  onClick={() => {
                    onDelete();
                    toast.success("Channel removed");
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors",
                    deleteConfirmText.toLowerCase() === "delete"
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Channel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ============================================================
// Activity Log (used in detail screen)
// ============================================================

const ActivityLog = ({ channel, typeLabel }: { channel: DeliveryChannel; typeLabel: string }) => {
  const activityLog = useMemo(() => {
    const base = new Date();
    return [
      { time: new Date(base.getTime() - 300000).toISOString(), event: "Message delivered", detail: `To +1555****23 via ${typeLabel}`, status: "success" as const },
      { time: new Date(base.getTime() - 900000).toISOString(), event: "Message sent", detail: "Broadcast: Q1 Promo", status: "success" as const },
      { time: new Date(base.getTime() - 1800000).toISOString(), event: "Rate limit warning", detail: `Approaching ${channel.rateLimit || 1000} msg/hr limit`, status: "warning" as const },
      { time: new Date(base.getTime() - 3600000).toISOString(), event: "Connection restored", detail: "Auto-reconnect successful", status: "success" as const },
      { time: new Date(base.getTime() - 7200000).toISOString(), event: "Connection lost", detail: "Timeout after 30s", status: "error" as const },
      { time: new Date(base.getTime() - 14400000).toISOString(), event: "Message failed", detail: "Invalid recipient number", status: "error" as const },
      { time: new Date(base.getTime() - 28800000).toISOString(), event: "Channel enabled", detail: "By admin", status: "info" as const },
      { time: new Date(base.getTime() - 43200000).toISOString(), event: "Config updated", detail: "Rate limit changed to 1000/hr", status: "info" as const },
    ];
  }, [channel, typeLabel]);

  return (
    <div className="border border-border">
      {activityLog.map((log, i) => (
        <div key={i} className={cn("flex items-start gap-3 px-4 py-3 text-xs", i > 0 && "border-t border-border")}>
          <div className={cn(
            "w-5 h-5 flex items-center justify-center shrink-0 mt-0.5",
            log.status === "success" ? "text-emerald-600" :
            log.status === "error" ? "text-destructive" :
            log.status === "warning" ? "text-amber-600" : "text-muted-foreground"
          )}>
            {log.status === "success" ? <CircleCheck className="w-4 h-4" /> :
             log.status === "error" ? <CircleX className="w-4 h-4" /> :
             log.status === "warning" ? <AlertTriangle className="w-4 h-4" /> :
             <Info className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{log.event}</p>
            <p className="text-muted-foreground mt-0.5">{log.detail}</p>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{formatTimeAgo(log.time)}</span>
        </div>
      ))}
    </div>
  );
};


// ============================================================
// Test Connection Panel (inline, not a modal)
// ============================================================

const TestConnectionPanel = ({
  channel,
  onClose,
  onStatusChange,
}: {
  channel: DeliveryChannel;
  onClose: () => void;
  onStatusChange: (status: ChannelStatus) => void;
}) => {
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [overallResult, setOverallResult] = useState<"idle" | "running" | "success" | "failed">("idle");
  const [testMessage, setTestMessage] = useState("");
  const typeInfo = CHANNEL_TYPES.find(c => c.id === channel.type);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timerRef.current.forEach(t => clearTimeout(t));
    timerRef.current = [];
  };

  const runTest = () => {
    clearTimers();
    setResults({});
    setOverallResult("running");

    const hasCredentials = Object.values(channel.config).some(v => v && v.trim() && !v.startsWith("***"));
    let delay = 0;

    TEST_PHASES.forEach((p, i) => {
      const t1 = setTimeout(() => setPhase(p.id), delay);
      timerRef.current.push(t1);
      delay += 800 + Math.random() * 600;

      const t2 = setTimeout(() => {
        const willFail = p.id === "auth" && !hasCredentials;
        setResults(prev => ({ ...prev, [p.id]: willFail ? "fail" : "pass" }));

        if (willFail) {
          setPhase("done");
          setOverallResult("failed");
          return;
        }

        if (i === TEST_PHASES.length - 1) {
          setPhase("done");
          setOverallResult("success");
          onStatusChange("connected");
        }
      }, delay);
      timerRef.current.push(t2);
      delay += 200;
    });
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  return (
    <div className="border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <TestTube className="w-4 h-4 text-primary" />
          Test Connection
        </h3>
        <button onClick={() => { clearTimers(); onClose(); }} className="p-1 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Channel info */}
      {typeInfo && (
        <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border">
          <div className={cn("w-8 h-8 flex items-center justify-center border", typeInfo.bgColor, typeInfo.borderColor)}>
            <ChannelIcon type={typeInfo} className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{channel.name}</p>
            <p className="text-xs text-muted-foreground">{typeInfo.label} &middot; {channel.senderName || "No sender"}</p>
          </div>
        </div>
      )}

      {/* Test phases */}
      <div className="border border-border">
        {TEST_PHASES.map((p, i) => {
          const result = results[p.id];
          const isActive = phase === p.id && !result;
          const isAborted = overallResult === "failed" && !result && phase === "done";

          return (
            <div key={p.id} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-border")}>
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {result === "pass" ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CircleCheck className="w-4 h-4 text-emerald-600" />
                  </motion.div>
                ) : result === "fail" ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CircleX className="w-4 h-4 text-destructive" />
                  </motion.div>
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : isAborted ? (
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <div className={cn("w-3 h-3 border", overallResult === "idle" ? "border-muted-foreground" : "border-muted-foreground/20")} />
                )}
              </div>
              <div className="flex-1">
                <p className={cn("text-xs font-semibold", isActive ? "text-foreground" : result ? "text-foreground" : "text-muted-foreground")}>
                  {p.label}
                </p>
                {(isActive || result) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {result === "fail" ? "Failed — check your credentials" : result === "pass" ? "Passed" : p.description}
                  </p>
                )}
              </div>
              {isActive && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">Testing</span>
              )}
              {result === "pass" && <span className="text-xs text-emerald-600 font-semibold">OK</span>}
              {result === "fail" && <span className="text-xs text-destructive font-semibold">FAIL</span>}
            </div>
          );
        })}
      </div>

      {/* Results */}
      <AnimatePresence>
        {overallResult === "success" && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2">
              <CircleCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">Connection Successful</p>
                <p className="text-xs text-emerald-600/80 mt-0.5">All checks passed. Channel is ready to send messages.</p>
              </div>
            </div>
          </motion.div>
        )}
        {overallResult === "failed" && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-2">
              <CircleX className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-destructive">Connection Failed</p>
                <p className="text-xs text-muted-foreground mt-0.5">Authentication failed. Please verify your API credentials in the channel configuration.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send test message */}
      {overallResult === "success" && (
        <div className="space-y-2 p-4 border border-border bg-muted/10">
          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Send a Test Message</h5>
          <div className="flex gap-2">
            <input
              placeholder="Enter test message..."
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              className="flex-1 h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Test message"
            />
            <button
              disabled={!testMessage.trim()}
              onClick={() => {
                toast.success(`Test message sent via ${channel.name}`);
                setTestMessage("");
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors",
                testMessage.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button onClick={() => { clearTimers(); onClose(); }} className="px-3 py-1.5 text-xs font-semibold border border-border bg-background text-foreground hover:bg-muted transition-colors">
          Close
        </button>
        {(overallResult === "idle" || overallResult === "failed") && (
          <button onClick={runTest} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <TestTube className="w-3.5 h-3.5" />
            {overallResult === "failed" ? "Retry Test" : "Run Test"}
          </button>
        )}
        {overallResult === "running" && (
          <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-muted text-muted-foreground cursor-not-allowed">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Testing...
          </button>
        )}
      </div>
    </div>
  );
};


// ============================================================
// Screen 4: Edit (full-page edit form)
// ============================================================

const EditScreen = ({
  channelId,
  channels,
  onBack,
  onSave,
}: {
  channelId: string;
  channels: DeliveryChannel[];
  onBack: () => void;
  onSave: (data: Partial<DeliveryChannel>) => void;
}) => {
  const channel = channels.find(c => c.id === channelId);

  if (!channel) {
    return (
      <div className="p-6 lg:p-10">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="border border-border p-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">Channel not found</p>
        </div>
      </div>
    );
  }

  return <EditScreenInner channel={channel} onBack={onBack} onSave={onSave} />;
};

const EditScreenInner = ({
  channel,
  onBack,
  onSave,
}: {
  channel: DeliveryChannel;
  onBack: () => void;
  onSave: (data: Partial<DeliveryChannel>) => void;
}) => {
  const typeInfo = CHANNEL_TYPES.find(c => c.id === channel.type);
  const fields = CHANNEL_CONFIG_FIELDS[channel.type];

  const [name, setName] = useState(channel.name);
  const [senderName, setSenderName] = useState(channel.senderName || "");
  const [rateLimit, setRateLimit] = useState(channel.rateLimit?.toString() || "");
  const [priority, setPriority] = useState(channel.priority?.toString() || "");
  const [countryCode, setCountryCode] = useState(channel.defaultCountryCode || "");
  const [config, setConfig] = useState<Record<string, string>>({ ...channel.config });

  const handleSave = () => {
    onSave({
      name: name.trim(),
      senderName: senderName.trim() || undefined,
      rateLimit: rateLimit ? parseInt(rateLimit) : undefined,
      priority: priority ? parseInt(priority) : undefined,
      defaultCountryCode: countryCode.trim() || undefined,
      config,
    });
    toast.success(`"${name}" updated`);
  };

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Detail
      </button>

      <h1 className="text-lg font-bold text-foreground">Edit Channel</h1>

      {/* Type header (read-only) */}
      {typeInfo && (
        <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border">
          <div className={cn("w-8 h-8 flex items-center justify-center border", typeInfo.bgColor, typeInfo.borderColor)}>
            <ChannelIcon type={typeInfo} className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{typeInfo.label}</p>
            <p className="text-xs text-muted-foreground">{typeInfo.description}</p>
          </div>
          <span className="px-2 py-1 text-[10px] font-bold bg-muted text-muted-foreground border border-border">Type cannot be changed</span>
        </div>
      )}

      {/* Form */}
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Channel Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Channel name"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Sender Name</label>
          <input
            value={senderName}
            onChange={e => setSenderName(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Sender name"
          />
        </div>

        <div className="border-t border-border" />

        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Credentials & API Settings</h4>
        {fields.map(f => (
          <div key={f.key} className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">{f.label}</label>
            <input
              type={f.sensitive ? "password" : "text"}
              placeholder={f.placeholder}
              value={config[f.key] || ""}
              onChange={e => setConfig(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label={f.label}
            />
          </div>
        ))}

        <div className="border-t border-border" />

        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Advanced</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Rate Limit</label>
            <input type="number" placeholder="msg/hr" value={rateLimit} onChange={e => setRateLimit(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Rate limit" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Priority</label>
            <input type="number" placeholder="1-10" value={priority} onChange={e => setPriority(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Channel priority" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Country Code</label>
            <input placeholder="+1" value={countryCode} onChange={e => setCountryCode(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Country code" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <button onClick={onBack} className="px-4 py-2 text-sm font-semibold border border-border bg-background text-foreground hover:bg-muted transition-colors">
          Cancel
        </button>
        <button
          disabled={!name.trim()}
          onClick={handleSave}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors",
            name.trim()
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Check className="w-3.5 h-3.5" />
          Save Changes
        </button>
      </div>
    </div>
  );
};
