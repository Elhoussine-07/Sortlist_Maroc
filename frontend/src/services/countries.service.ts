import { camelizeKeys, frappeCall } from "@/services/http";

export interface CountryOption {
  /** Nom du pays tel que stocké dans Frappe (anglais, ex. "Morocco") — c'est
   * cette valeur exacte qu'attend `CountryLegalIDRule.country` (Link vers
   * `Country`), donc c'est elle qu'il faut envoyer au backend à
   * l'inscription, pas une traduction française. */
  name: string;
  /** Code ISO 3166-1 alpha-2 en majuscules, ex. "MA". */
  code: string;
}

/**
 * // API CALL : frappeCall("utils.get_countries") — allow_guest
 * Liste des pays (doctype natif Frappe `Country`), pour `CountrySelect`.
 */
export async function getCountries(): Promise<CountryOption[]> {
  try {
    const raw = await frappeCall<unknown>("utils.get_countries", {});
    const list = (Array.isArray(raw) ? raw : []) as unknown[];
    return list.map((item) => {
      const data = camelizeKeys(item) as Record<string, unknown>;
      return {
        name: String(data["name"] ?? ""),
        code: String(data["code"] ?? ""),
      };
    });
  } catch (error) {
    // BUG CORRIGÉ : En cas d'échec d'appel API / Gateway non authentifiée,
    // retourner un tableau vide au lieu de lever une exception non interceptée.
    console.warn("Impossible de récupérer la liste des pays depuis l'API Frappe:", error);
    return [];
  }
}
