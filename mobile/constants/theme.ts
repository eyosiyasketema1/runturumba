/**
 * Turumba Design Tokens
 * Matches the web app's theme.css exactly
 */

export const Colors = {
  light: {
    // Core
    primary: '#2563eb',
    primaryForeground: '#ffffff',
    background: '#ffffff',
    foreground: '#0f172a',
    card: '#ffffff',
    cardForeground: '#0f172a',

    // Secondary
    secondary: '#f1f5f9',
    secondaryForeground: '#1e293b',
    muted: '#f8fafc',
    mutedForeground: '#64748b',
    accent: '#eff6ff',
    accentForeground: '#1e40af',

    // Destructive
    destructive: '#ef4444',
    destructiveForeground: '#fafafa',

    // Borders & inputs
    border: '#e2e8f0',
    input: '#e2e8f0',
    ring: '#2563eb',

    // Tab bar
    tint: '#2563eb',
    tabIconDefault: '#64748b',
    tabIconSelected: '#2563eb',
    tabBar: '#ffffff',
    tabBarBorder: '#e2e8f0',

    // Charts
    chart1: '#2563eb',
    chart2: '#10b981',
    chart3: '#f59e0b',
    chart4: '#8b5cf6',
    chart5: '#ef4444',

    // Semantic
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    online: '#10b981',
    offline: '#cbd5e1',

    // Text shortcuts
    text: '#0f172a',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',

    // Icon
    icon: '#64748b',
  },
  dark: {
    // Core
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
    background: '#0f172a',
    foreground: '#f1f5f9',
    card: '#1e293b',
    cardForeground: '#f1f5f9',

    // Secondary
    secondary: '#1e293b',
    secondaryForeground: '#f1f5f9',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    accent: '#1e3a5f',
    accentForeground: '#93c5fd',

    // Destructive
    destructive: '#7f1d1d',
    destructiveForeground: '#fca5a5',

    // Borders & inputs
    border: '#1e293b',
    input: '#1e293b',
    ring: '#3b82f6',

    // Tab bar
    tint: '#3b82f6',
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#3b82f6',
    tabBar: '#0f172a',
    tabBarBorder: '#1e293b',

    // Charts
    chart1: '#3b82f6',
    chart2: '#10b981',
    chart3: '#f59e0b',
    chart4: '#8b5cf6',
    chart5: '#ef4444',

    // Semantic
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    online: '#10b981',
    offline: '#475569',

    // Text shortcuts
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',

    // Icon
    icon: '#94a3b8',
  },
};

// Maturity level colors
export const MaturityColors: Record<string, string> = {
  Interested: '#94a3b8',    // slate
  'Pre-Seeker': '#f59e0b',  // amber
  Seeker: '#3b82f6',        // blue
  'New Believer': '#10b981', // emerald
  Growing: '#8b5cf6',       // violet
  Mature: '#4f46e5',        // indigo
  Leader: '#2563eb',        // primary
};

// Discipleship status colors
export const StatusColors: Record<string, string> = {
  Active: '#10b981',
  Pending: '#f59e0b',
  Inactive: '#94a3b8',
  Graduated: '#8b5cf6',
  Archived: '#64748b',
};

// Engagement score colors
export const engagementColor = (score: number): string => {
  if (score < 30) return '#ef4444';  // red
  if (score < 60) return '#f59e0b';  // amber
  return '#10b981';                   // emerald
};

// Milestone state colors
export const MilestoneStateColors: Record<string, string> = {
  done: '#10b981',
  progress: '#f59e0b',
  pending: '#94a3b8',
};

// Sender colors for group chats
export const SenderColors = [
  '#4f46e5', // indigo
  '#10b981', // emerald
  '#ea580c', // orange
  '#e11d48', // rose
  '#06b6d4', // cyan
  '#7c3aed', // violet
  '#d97706', // amber
  '#0d9488', // teal
  '#db2777', // pink
  '#2563eb', // blue
];

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

// Border radius (mobile-adapted — slightly larger than web's 2px for touch)
export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 9999,
};

// Font sizes
export const FontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 26,
  '4xl': 30,
};

// Font weights (numeric for React Native)
export const FontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
};
