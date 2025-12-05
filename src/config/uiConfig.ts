export const sections = [
  { id: 'top-stories', label: 'Top Stories', icon: 'Newspaper' },
  { id: 'politics', label: 'Politics', icon: 'Landmark' },
  { id: 'elections', label: 'Elections', icon: 'Vote' },
  { id: 'analysis', label: 'Analysis', icon: 'LineChart' },
  { id: 'social-laws', label: 'Social Laws', icon: 'Scale' },
  { id: 'create', label: 'Create Article', icon: 'PenSquare' }
] as const;

export type SectionId = typeof sections[number]['id'];

export const themeColors = {
  light: {
    primary: '217 91% 35%', // Deep Electoral Blue
    secondary: '0 84% 50%', // Vivid Civic Red
    accent: '217 91% 45%',
    background: '0 0% 100%',
    foreground: '222 47% 11%',
    card: '0 0% 100%',
    cardForeground: '222 47% 11%',
    muted: '210 40% 96%',
    mutedForeground: '215 16% 47%',
    border: '214 32% 91%',
  },
  dark: {
    primary: '217 91% 60%', // Lighter blue for dark mode
    secondary: '0 84% 60%', // Lighter red for dark mode
    accent: '217 91% 55%',
    background: '222 47% 11%',
    foreground: '210 40% 98%',
    card: '222 47% 15%',
    cardForeground: '210 40% 98%',
    muted: '217 33% 17%',
    mutedForeground: '215 20% 65%',
    border: '217 33% 20%',
  }
};