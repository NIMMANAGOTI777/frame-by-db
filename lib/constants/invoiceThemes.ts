export interface InvoiceTheme {
  id: string;
  name: string;
  primary: string;         // Main color: title, table header, headings
  secondary: string;       // Complementary darker shade
  accent: string;          // Vibrant highlight
  lightBackground: string; // Soft card background (for Billed By/To, Bank Details)
  border: string;          // Subtle card and table borders
  text: string;            // Standard body text
  badgeBg: string;         // Light badge fill
  badgeText: string;       // Badge text color
}

export const INVOICE_THEMES: Record<string, InvoiceTheme> = {
  purple: {
    id: 'purple',
    name: 'Purple',
    primary: '#673AB7',
    secondary: '#512DA8',
    accent: '#7E57C2',
    lightBackground: '#F5F2FC',
    border: '#E6DEFA',
    text: '#1F2937',
    badgeBg: '#EDE7F6',
    badgeText: '#512DA8',
  },
  blue: {
    id: 'blue',
    name: 'Blue',
    primary: '#2563EB',
    secondary: '#1D4ED8',
    accent: '#3B82F6',
    lightBackground: '#EFF6FF',
    border: '#DBEAFE',
    text: '#1F2937',
    badgeBg: '#DBEAFE',
    badgeText: '#1E40AF',
  },
  green: {
    id: 'green',
    name: 'Green',
    primary: '#16A34A',
    secondary: '#15803D',
    accent: '#22C55E',
    lightBackground: '#F0FDF4',
    border: '#DCFCE7',
    text: '#1F2937',
    badgeBg: '#DCFCE7',
    badgeText: '#166534',
  },
  orange: {
    id: 'orange',
    name: 'Orange',
    primary: '#EA580C',
    secondary: '#C2410C',
    accent: '#F97316',
    lightBackground: '#FFF7ED',
    border: '#FFEDD5',
    text: '#1F2937',
    badgeBg: '#FFEDD5',
    badgeText: '#9A3412',
  },
  red: {
    id: 'red',
    name: 'Red',
    primary: '#DC2626',
    secondary: '#B91C1C',
    accent: '#EF4444',
    lightBackground: '#FEF2F2',
    border: '#FEE2E2',
    text: '#1F2937',
    badgeBg: '#FEE2E2',
    badgeText: '#991B1B',
  },
  black: {
    id: 'black',
    name: 'Black',
    primary: '#18181B',
    secondary: '#09090B',
    accent: '#27272A',
    lightBackground: '#F4F4F5',
    border: '#E4E4E7',
    text: '#18181B',
    badgeBg: '#E4E4E7',
    badgeText: '#09090B',
  },
  teal: {
    id: 'teal',
    name: 'Teal',
    primary: '#0F766E',
    secondary: '#115E59',
    accent: '#14B8A6',
    lightBackground: '#F0FDFA',
    border: '#CCFBF1',
    text: '#1F2937',
    badgeBg: '#CCFBF1',
    badgeText: '#134E4A',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    primary: '#374151',
    secondary: '#1F2937',
    accent: '#4B5563',
    lightBackground: '#F9FAFB',
    border: '#E5E7EB',
    text: '#111827',
    badgeBg: '#E5E7EB',
    badgeText: '#374151',
  },
};

export const INVOICE_THEME_LIST: InvoiceTheme[] = [
  INVOICE_THEMES.purple,
  INVOICE_THEMES.blue,
  INVOICE_THEMES.green,
  INVOICE_THEMES.orange,
  INVOICE_THEMES.red,
  INVOICE_THEMES.black,
  INVOICE_THEMES.teal,
  INVOICE_THEMES.minimal,
];

export function getInvoiceTheme(themeId?: string): InvoiceTheme {
  if (!themeId) return INVOICE_THEMES.purple;
  const key = themeId.toLowerCase().trim();
  return INVOICE_THEMES[key] || INVOICE_THEMES.purple;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}
