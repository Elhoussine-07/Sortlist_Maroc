import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";
interface ThemeState {
  theme: ThemePreference;
  font: string;
  textSize: number;
  setTheme: (theme: ThemePreference) => void;
  setFont: (font: string) => void;
  setTextSize: (textSize: number) => void;
}
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      font: "default",
      textSize: 100,
      setTheme: (theme) => set({ theme }),
      setFont: (font) => set({ font }),
      setTextSize: (textSize) => set({ textSize }),
    }),
    { name: "theme-preferences" },
  ),
);

const FONT_STACKS: Record<string, string> = {
  default: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  inter: "'Inter', sans-serif",
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
};
function resolveIsDark(theme: ThemePreference): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyDomPreferences(state: Pick<ThemeState, "theme" | "font" | "textSize">) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolveIsDark(state.theme));
  root.dataset["theme"] = state.theme;
  const stack = FONT_STACKS[state.font] ?? FONT_STACKS["default"]!;
  root.style.setProperty("--font-sans", stack);
  const clampedSize = Math.min(130, Math.max(80, state.textSize || 100));
  root.style.fontSize = `${clampedSize}%`;
}
