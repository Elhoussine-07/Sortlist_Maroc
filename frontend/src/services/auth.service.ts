import type { User, UserRole } from "@/lib/types";
import { camelizeKeys, frappeCall } from "@/services/http";
import { useAuthStore } from "@/store/auth.store";

export interface LoginPayload {
  email: string;
  password: string;
  role: UserRole;
  rememberMe: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;

  detectedRole: UserRole;

  roleKnown: boolean;

  requires2fa: boolean;
}

const ROLE_FIELD_CANDIDATES = [
  "role",
  "userType",
  "accountType",
  "type",
  "profileType",
  "userRole",
] as const;

function extractRawRole(data: Record<string, unknown>): string | undefined {
  for (const key of ROLE_FIELD_CANDIDATES) {
    const value = data[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function normalizeRole(rawRole: unknown): UserRole | null {
  if (rawRole === undefined || rawRole === null) return null;
  const value = String(rawRole).trim().toLowerCase();
  if (value.length === 0) return null;
  if (value.startsWith("agenc")) return "agency";
  if (value.startsWith("client") || value.startsWith("entreprise") || value.startsWith("company")) {
    return "client";
  }

  if (value.startsWith("moderat") || value.startsWith("admin")) return "admin";
  return null;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

function mapUser(raw: unknown, fallbackRole: UserRole): User {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const role = normalizeRole(extractRawRole(data)) ?? fallbackRole;

  const email = String(data["email"] ?? data["sub"] ?? "");
  const displayName =
    (data["displayName"] as string | undefined) ??
    (data["fullName"] as string | undefined) ??
    (data["agencyName"] as string | undefined) ??
    (data["companyName"] as string | undefined) ??
    (email || undefined) ??
    "Utilisateur";

  return {
    id: String(data["id"] ?? data["name"] ?? data["user"] ?? data["sub"] ?? ""),
    role,
    displayName,
    initials: initialsFromName(displayName),
    email,
  };
}

function mapLoginResponse(raw: unknown, requestedRole: UserRole): LoginResponse {
  const data = camelizeKeys(raw) as Record<string, unknown>;

  if (data["requires2fa"] === true) {
    return {
      token: "",
      user: {
        id: "",
        role: requestedRole,
        displayName: "",
        initials: "?",
        email: String(data["email"] ?? ""),
      },
      detectedRole: requestedRole,
      roleKnown: false,
      requires2fa: true,
    };
  }

  const token = String(data["token"] ?? data["accessToken"] ?? data["jwt"] ?? "");

  const userData = (data["user"] ?? data) as Record<string, unknown>;

  const rawRole = extractRawRole(userData) ?? extractRawRole(data);
  const normalized = normalizeRole(rawRole);
  const roleKnown = normalized !== null;
  const detectedRole = normalized ?? requestedRole;

  const user = mapUser(userData, detectedRole);

  return { token, user, detectedRole, roleKnown, requires2fa: false };
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const raw = await frappeCall<unknown>("auth.login", {
    email: payload.email,
    password: payload.password,
  });
  return mapLoginResponse(raw, payload.role);
}

export async function verifyLoginOtp(
  email: string,
  code: string,
  expectedRole: UserRole,
): Promise<LoginResponse> {
  const raw = await frappeCall<unknown>("auth.verify_login_otp", { email, code });
  return mapLoginResponse(raw, expectedRole);
}

export async function requestEmailCode(email: string): Promise<{
  sent: boolean;
  expiresInSeconds: number;
}> {
  const raw = await frappeCall<unknown>("auth.request_otp", { email });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    sent: Boolean(data["sent"] ?? true),
    expiresInSeconds: Number(data["expiresInSeconds"] ?? data["expiresIn"] ?? 300),
  };
}

export async function verifyEmailCode(
  email: string,
  code: string,
  expectedRole: UserRole = "client",
): Promise<LoginResponse> {
  const raw = await frappeCall<unknown>("auth.verify_otp", { email, code });
  return mapLoginResponse(raw, expectedRole);
}

export async function forgotPassword(email: string): Promise<{ sent: boolean }> {
  const raw = await frappeCall<unknown>("auth.request_password_reset", { email });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { sent: Boolean(data["sent"] ?? true) };
}

export async function confirmPasswordReset(payload: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<{ reset: boolean }> {
  const raw = await frappeCall<unknown>("auth.reset_password", {
    email: payload.email,
    code: payload.code,
    new_password: payload.newPassword,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { reset: Boolean(data["reset"] ?? true) };
}

export async function logout(): Promise<void> {
  useAuthStore.getState().reset();
}

export async function getCurrentUser(fallbackRole?: UserRole): Promise<User> {
  const raw = await frappeCall<unknown>("auth.me");
  const currentRole = fallbackRole ?? useAuthStore.getState().role ?? "client";
  return mapUser(raw, currentRole);
}

export async function registerClient(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
  companyName?: string;
  phone?: string;
  verificationCode: string;
}): Promise<LoginResponse> {
  const raw = await frappeCall<unknown>("auth.register_client", {
    email: payload.email,
    password: payload.password,
    first_name: payload.firstName,
    last_name: payload.lastName,
    country: payload.country,
    company_name: payload.companyName,
    phone: payload.phone,
    verification_code: payload.verificationCode,
  });
  return mapLoginResponse(raw, "client");
}

export async function registerAgency(payload: unknown): Promise<LoginResponse> {
  const raw = await frappeCall<unknown>("auth.register_agency", payload as Record<string, unknown>);
  return mapLoginResponse(raw, "agency");
}

export async function checkAgencyNameAvailability(name: string): Promise<{
  available: boolean;
  existingAgencyId: string | null;
}> {
  const raw = await frappeCall<unknown>("agency.check_name_availability", { name });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    available: Boolean(data["available"] ?? true),
    existingAgencyId: (data["existingAgencyId"] as string | undefined) ?? null,
  };
}

export async function sendPhoneOtp(phone: string): Promise<{ sent: boolean }> {
  const raw = await frappeCall<unknown>("client.request_phone_otp", { phone });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { sent: Boolean(data["sent"] ?? true) };
}

export async function verifyPhoneOtp(code: string): Promise<{ verified: boolean }> {
  const raw = await frappeCall<unknown>("client.verify_phone_otp", { code });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { verified: Boolean(data["verified"] ?? true) };
}

export async function switchAgency(agencyId: string): Promise<LoginResponse> {
  const raw = await frappeCall<unknown>("auth.switch_agency", { agency: agencyId });
  const response = mapLoginResponse(raw, "agency");
  if (response.token && response.user) {
    useAuthStore.getState().setSession({
      token: response.token,
      user: response.user,
      role: response.detectedRole,
    });
  }
  return response;
}

export async function changePassword(payload: {
  oldPassword: string;
  newPassword: string;
}): Promise<void> {
  await frappeCall<unknown>("settings.change_password", {
    old_password: payload.oldPassword,
    new_password: payload.newPassword,
  });
}
