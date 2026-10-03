import { useLocaleStore, type Locale } from "@/store/locale.store";
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

/**
 * Self-contained page/component-local translation dictionary: no shared keys to
 * coordinate across files. Each page defines its own PAGE_TEXT map of
 * { "French source string": { en, ar, es } } and calls usePageText(PAGE_TEXT).
 * tt("French source string") returns it unchanged in fr, or the mapped string
 * in the other locales (falling back to the French source if a key/locale is
 * missing, so partial coverage never breaks rendering).
 */
export type PageTextDict = Record<string, Partial<Record<Exclude<Locale, "fr">, string>>>;

export function usePageText(dict: PageTextDict) {
  const locale = useLocaleStore((state) => state.locale);

  function tt(source: string): string {
    if (locale === "fr") return source;
    return dict[source]?.[locale] ?? source;
  }

  return { tt, locale };
}
