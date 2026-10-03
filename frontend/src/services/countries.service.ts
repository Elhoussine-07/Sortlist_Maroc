import { camelizeKeys, frappeCall } from "@/services/http";

export interface CountryOption {
  name: string;
  code: string;
}

function mapCountryList(raw: unknown): CountryOption[] {
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return list.map((item) => {
    const data = camelizeKeys(item) as Record<string, unknown>;
    return {
      name: String(data["name"] ?? ""),
      code: String(data["code"] ?? ""),
    };
  });
}

export async function getCountries(): Promise<CountryOption[]> {
  try {
    const raw = await frappeCall<unknown>("utils.get_countries", {});
    return mapCountryList(raw);
  } catch (error) {
    console.warn("Impossible de récupérer la liste des pays depuis l'API Frappe:", error);
    return [];
  }
}

export async function getActiveCountries(): Promise<CountryOption[]> {
  try {
    const raw = await frappeCall<unknown>("utils.get_active_countries", {});
    return mapCountryList(raw);
  } catch (error) {
    console.warn("Impossible de récupérer les pays actifs depuis l'API Frappe:", error);
    return [];
  }
}
