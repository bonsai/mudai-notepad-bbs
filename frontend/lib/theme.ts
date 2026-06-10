export type ThemeName = "dark" | "white" | "psychedelic" | "rainbow";

export const THEMES: { name: ThemeName; label: string }[] = [
  { name: "dark",        label: "Dark" },
  { name: "white",       label: "White" },
  { name: "psychedelic", label: "Psychedelic" },
  { name: "rainbow",     label: "Rainbow" },
];

const KEY = "mudai_theme";

export function getSavedTheme(): ThemeName {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(KEY) as ThemeName) ?? "dark";
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(KEY, theme);
}

export function rainbowColor(index: number): string {
  return `hsl(${(index * 47) % 360}, 75%, 68%)`;
}
