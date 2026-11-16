import type { ConversationTheme } from '../types/messages';

export interface ThemePalette {
  id: ConversationTheme;
  label: string;
  swatch: string;
  outgoingRcsBg: string;
  outgoingRcsText: string;
  outgoingSmsBg: string;
  outgoingSmsText: string;
  accentText: string;
  accentBgSoft: string;
  fabBg: string;
  fabText: string;
  unreadBadge: string;
}

export const CONVERSATION_THEMES: Record<ConversationTheme, ThemePalette> = {
  blue: {
    id: 'blue',
    label: 'Google Blue',
    swatch: '#0B57D0',
    outgoingRcsBg: 'bg-[#0B57D0] dark:bg-[#A8C7FA]',
    outgoingRcsText: 'text-white dark:text-[#062E6F]',
    outgoingSmsBg: 'bg-[#C2E7FF] dark:bg-[#004A77]',
    outgoingSmsText: 'text-[#001D35] dark:text-[#C2E7FF]',
    accentText: 'text-[#0B57D0] dark:text-[#A8C7FA]',
    accentBgSoft: 'bg-[#D3E3FD] text-[#041E49] dark:bg-[#0842A0]/40 dark:text-[#D3E3FD]',
    fabBg: 'bg-[#C2E7FF] hover:bg-[#A8D8FA] dark:bg-[#004A77] dark:hover:bg-[#005B94]',
    fabText: 'text-[#001D35] dark:text-[#C2E7FF]',
    unreadBadge: 'bg-[#0B57D0] text-white dark:bg-[#A8C7FA] dark:text-[#062E6F]',
  },
  emerald: {
    id: 'emerald',
    label: 'Sage Green',
    swatch: '#146C2E',
    outgoingRcsBg: 'bg-[#146C2E] dark:bg-[#82E09A]',
    outgoingRcsText: 'text-white dark:text-[#003915]',
    outgoingSmsBg: 'bg-[#C4EED0] dark:bg-[#0F5223]',
    outgoingSmsText: 'text-[#072711] dark:text-[#C4EED0]',
    accentText: 'text-[#146C2E] dark:text-[#82E09A]',
    accentBgSoft: 'bg-[#C4EED0] text-[#072711] dark:bg-[#0F5223]/50 dark:text-[#C4EED0]',
    fabBg: 'bg-[#C4EED0] hover:bg-[#ADE6BE] dark:bg-[#0F5223] dark:hover:bg-[#146C2E]',
    fabText: 'text-[#072711] dark:text-[#C4EED0]',
    unreadBadge: 'bg-[#146C2E] text-white dark:bg-[#82E09A] dark:text-[#003915]',
  },
  plum: {
    id: 'plum',
    label: 'Iris Plum',
    swatch: '#6750A4',
    outgoingRcsBg: 'bg-[#6750A4] dark:bg-[#D0BCFF]',
    outgoingRcsText: 'text-white dark:text-[#381E72]',
    outgoingSmsBg: 'bg-[#EADDFF] dark:bg-[#4F378B]',
    outgoingSmsText: 'text-[#21005D] dark:text-[#EADDFF]',
    accentText: 'text-[#6750A4] dark:text-[#D0BCFF]',
    accentBgSoft: 'bg-[#EADDFF] text-[#21005D] dark:bg-[#4F378B]/50 dark:text-[#EADDFF]',
    fabBg: 'bg-[#EADDFF] hover:bg-[#DEC8FF] dark:bg-[#4F378B] dark:hover:bg-[#6750A4]',
    fabText: 'text-[#21005D] dark:text-[#EADDFF]',
    unreadBadge: 'bg-[#6750A4] text-white dark:bg-[#D0BCFF] dark:text-[#381E72]',
  },
  teal: {
    id: 'teal',
    label: 'Ocean Teal',
    swatch: '#006A6A',
    outgoingRcsBg: 'bg-[#006A6A] dark:bg-[#70D9D9]',
    outgoingRcsText: 'text-white dark:text-[#003737]',
    outgoingSmsBg: 'bg-[#BCEBEB] dark:bg-[#004F4F]',
    outgoingSmsText: 'text-[#002020] dark:text-[#BCEBEB]',
    accentText: 'text-[#006A6A] dark:text-[#70D9D9]',
    accentBgSoft: 'bg-[#BCEBEB] text-[#002020] dark:bg-[#004F4F]/50 dark:text-[#BCEBEB]',
    fabBg: 'bg-[#BCEBEB] hover:bg-[#A2E2E2] dark:bg-[#004F4F] dark:hover:bg-[#006A6A]',
    fabText: 'text-[#002020] dark:text-[#BCEBEB]',
    unreadBadge: 'bg-[#006A6A] text-white dark:bg-[#70D9D9] dark:text-[#003737]',
  },
  coral: {
    id: 'coral',
    label: 'Terracotta',
    swatch: '#B3261E',
    outgoingRcsBg: 'bg-[#B3261E] dark:bg-[#F2B8B5]',
    outgoingRcsText: 'text-white dark:text-[#601410]',
    outgoingSmsBg: 'bg-[#F9DEDC] dark:bg-[#8C1D18]',
    outgoingSmsText: 'text-[#410E0B] dark:text-[#F9DEDC]',
    accentText: 'text-[#B3261E] dark:text-[#F2B8B5]',
    accentBgSoft: 'bg-[#F9DEDC] text-[#410E0B] dark:bg-[#8C1D18]/50 dark:text-[#F9DEDC]',
    fabBg: 'bg-[#F9DEDC] hover:bg-[#F4CBC8] dark:bg-[#8C1D18] dark:hover:bg-[#B3261E]',
    fabText: 'text-[#410E0B] dark:text-[#F9DEDC]',
    unreadBadge: 'bg-[#B3261E] text-white dark:bg-[#F2B8B5] dark:text-[#601410]',
  },
};
