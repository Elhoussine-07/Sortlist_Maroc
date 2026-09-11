const DIAL_CODES: Record<string, string> = {
  MA: "+212",
  FR: "+33",
  DZ: "+213",
  TN: "+216",
  BE: "+32",
  CH: "+41",
  CA: "+1",
  US: "+1",
  GB: "+44",
  DE: "+49",
  ES: "+34",
  IT: "+39",
  PT: "+351",
  NL: "+31",
  LU: "+352",
  SN: "+221",
  CI: "+225",
  CM: "+237",
  EG: "+20",
  MR: "+222",
  LY: "+218",
  SA: "+966",
  AE: "+971",
  QA: "+974",
  TR: "+90",
  IE: "+353",
  SE: "+46",
  NO: "+47",
  DK: "+45",
  PL: "+48",
  GR: "+30",
  RO: "+40",
  BR: "+55",
  MX: "+52",
  CN: "+86",
  JP: "+81",
  IN: "+91",
  AU: "+61",
};

export function dialCodeFor(isoCode: string): string {
  return DIAL_CODES[isoCode.toUpperCase()] ?? "";
}

export function flagEmoji(isoCode: string): string {
  return isoCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}
