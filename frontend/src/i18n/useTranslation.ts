import { useLocaleStore } from "@/store/locale.store";
import { translations } from "@/i18n/translations";

function resolve(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);

  function t(key: string): string {
    const value = resolve(translations[locale], key) ?? resolve(translations.fr, key);
    return typeof value === "string" ? value : key;
  }

  function tList(key: string): string[] {
    const value = resolve(translations[locale], key) ?? resolve(translations.fr, key);
    return Array.isArray(value) ? (value as string[]) : [];
  }

  return { t, tList, locale };
}
