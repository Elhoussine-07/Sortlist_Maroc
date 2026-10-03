import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "fr" | "en" | "ar" | "es";

export const LOCALES: readonly Locale[] = ["fr", "en", "ar", "es"];

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "fr",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "locale-preferences" },
  ),
);

export function applyDomLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.lang = locale;
  root.dir = locale === "ar" ? "rtl" : "ltr";
}
