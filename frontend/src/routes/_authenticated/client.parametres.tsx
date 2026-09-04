import { createFileRoute, Link } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Bell, Check, Lock, Monitor, Moon, Palette, ShieldCheck, Sun, User } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FormSkeleton, PreferenceRow, SectionCard, TextField } from "@/components/common/Blocks";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getClientProfile,
  getSettings,
  updateSettings,
  type Settings,
} from "@/services/profile.service";
import { changePassword } from "@/services/auth.service";
import { ApiError } from "@/services/http";
import { useThemeStore } from "@/store/theme.store";

const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "default", label: "Par défaut" },
  { value: "inter", label: "Inter" },
  { value: "system", label: "Système" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Monospace" },
];

const THEME_OPTIONS: { value: Settings["theme"]; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Suivre le système", icon: Monitor },
];

export const Route = createFileRoute("/_authenticated/client/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Sortlist" },
      {
        name: "description",
        content: "Gérez vos préférences d'affichage, vos notifications et votre mot de passe.",
      },
      { property: "og:title", content: "Paramètres — Sortlist" },
      {
        property: "og:description",
        content: "Préférences et sécurité de votre compte client.",
      },
    ],
  }),
  component: ClientSettingsPage,
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Champ requis").max(128),
    newPassword: z.string().min(8, "8 caractères minimum").max(128),
    confirmPassword: z.string().min(8, "8 caractères minimum").max(128),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seedGradient(seed: string): string {
  const hue = hashSeed(seed) % 360;
  return `linear-gradient(135deg, hsl(${hue} 72% 56%), hsl(${(hue + 42) % 360} 72% 44%))`;
}

function passwordStrength(value: string): {
  score: 0 | 1 | 2 | 3;
  label: string;
  className: string;
} {
  if (!value) return { score: 0, label: "", className: "bg-border" };
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12 && /[0-9]/.test(value) && /[a-zA-Z]/.test(value)) score += 1;
  if (/[^a-zA-Z0-9]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (score >= 3) return { score: 3, label: "Fort", className: "bg-emerald-500" };
  if (score === 2) return { score: 2, label: "Moyen", className: "bg-amber-500" };
  return { score: 1, label: "Faible", className: "bg-destructive" };
}

function ClientSettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["client", "settings"],
    queryFn: getSettings,
  });
  const settings = settingsQuery.data ?? null;
  const isLoading = settingsQuery.isPending;

  const profileQuery = useQuery({
    queryKey: ["client", "profile", "settings-summary"],
    queryFn: getClientProfile,
  });

  useEffect(() => {
    if (!settings) return;
    useThemeStore.getState().setTheme(settings.theme);
    useThemeStore.getState().setFont(settings.font);
    useThemeStore.getState().setTextSize(settings.textSize);
  }, [settings]);

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = form.watch("newPassword");
  const strength = useMemo(() => passwordStrength(newPasswordValue), [newPasswordValue]);

  const passwordMutation = useMutation({
    mutationFn: (values: PasswordForm) =>
      changePassword({ oldPassword: values.currentPassword, newPassword: values.newPassword }),
    onSuccess: () => {
      toast.success("Mot de passe mis à jour");
      form.reset();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Impossible de mettre à jour le mot de passe.",
      );
    },
  });

  const onSubmitPassword = form.handleSubmit((values) => {
    passwordMutation.mutate(values);
  });

  const settingsMutation = useMutation({
    mutationFn: (payload: Partial<Settings>) => updateSettings(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["client", "settings"], updated);
      toast.success("Préférences mises à jour");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Impossible d'enregistrer les préférences.",
      );
    },
  });

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (key === "theme") useThemeStore.getState().setTheme(value as Settings["theme"]);
    if (key === "font") useThemeStore.getState().setFont(value as string);
    if (key === "textSize") useThemeStore.getState().setTextSize(value as number);

    if (key === "emailNotifications" || key === "pushNotifications") {
      settingsMutation.mutate({
        emailNotifications:
          key === "emailNotifications"
            ? (value as boolean)
            : (settings?.emailNotifications ?? true),
        pushNotifications:
          key === "pushNotifications" ? (value as boolean) : (settings?.pushNotifications ?? true),
      });
      return;
    }

    settingsMutation.mutate({ [key]: value } as Partial<Settings>);
  };

  return (
    <DashboardShell role="client">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px] space-y-6">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight">Paramètres</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Gérez votre profil, vos préférences d'affichage, vos notifications et votre sécurité.
          </p>
        </div>

        <Tabs defaultValue="profil" className="w-full">
          <TabsList className="h-auto flex-wrap gap-1 rounded-lg border border-border bg-transparent p-1">
            <TabsTrigger value="profil" className="gap-1.5">
              <User className="h-3.5 w-3.5" strokeWidth={1.8} />
              Profil
            </TabsTrigger>
            <TabsTrigger value="apparence" className="gap-1.5">
              <Palette className="h-3.5 w-3.5" strokeWidth={1.8} />
              Apparence
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" strokeWidth={1.8} />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="securite" className="gap-1.5">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.8} />
              Sécurité
            </TabsTrigger>
          </TabsList>

          {}
          <TabsContent value="profil" className="mt-6">
            <SectionCard title="Profil" description="Vos informations de compte.">
              {profileQuery.isPending ? (
                <FormSkeleton fields={2} />
              ) : profileQuery.data ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      style={
                        profileQuery.data.logo
                          ? undefined
                          : {
                              backgroundImage: seedGradient(
                                `${profileQuery.data.contactFirstName} ${profileQuery.data.contactLastName}`,
                              ),
                            }
                      }
                      className="font-display flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-[17px] font-bold text-white shadow-sm"
                    >
                      {profileQuery.data.logo ? (
                        <img
                          src={profileQuery.data.logo}
                          alt="Logo de l'entreprise"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initialsOf(
                          `${profileQuery.data.contactFirstName} ${profileQuery.data.contactLastName}`,
                        )
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-[15px] font-bold">
                        {profileQuery.data.contactFirstName} {profileQuery.data.contactLastName}
                        {profileQuery.data.identityVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <ShieldCheck className="h-3 w-3" strokeWidth={2} />
                            Identité vérifiée
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        {profileQuery.data.companyName || "Entreprise non renseignée"}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/client/mon-profil"
                    className="rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent"
                  >
                    Modifier mon profil
                  </Link>
                </div>
              ) : null}
            </SectionCard>
          </TabsContent>

          <TabsContent value="apparence" className="mt-6 space-y-6">
            <SectionCard title="Thème" description="Choisissez le thème d'affichage.">
              {isLoading ? (
                <FormSkeleton fields={3} />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {THEME_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = settings?.theme === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateSetting("theme", option.value)}
                        className={
                          "relative flex flex-col items-center gap-2 rounded-lg border px-4 py-5 text-[13.5px] font-semibold transition-colors " +
                          (active
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-accent")
                        }
                      >
                        {active ? (
                          <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                          </span>
                        ) : null}
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Préférences d'affichage"
              description="Langue, police et taille du texte."
            >
              {isLoading ? (
                <FormSkeleton fields={3} />
              ) : (
                <div>
                  <PreferenceRow label="Langue" description="Langue de l'interface">
                    <select
                      value={settings?.language ?? ""}
                      onChange={(event) => updateSetting("language", event.target.value)}
                      className="rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none transition-colors focus:border-primary/50"
                    >
                      <option value="">—</option>
                      {settings?.language ? (
                        <option value={settings.language}>{settings.language}</option>
                      ) : null}
                    </select>
                  </PreferenceRow>
                  <PreferenceRow label="Police" description="Police d'affichage">
                    <select
                      value={settings?.font ?? ""}
                      onChange={(event) => updateSetting("font", event.target.value)}
                      className="rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none transition-colors focus:border-primary/50"
                    >
                      <option value="">—</option>
                      {FONT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </PreferenceRow>
                  <PreferenceRow
                    label="Taille du texte"
                    description="Ajustez la lisibilité de l'interface"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-muted-foreground">A</span>
                      <input
                        type="range"
                        min={80}
                        max={130}
                        value={settings?.textSize ?? 100}
                        onChange={(event) => updateSetting("textSize", Number(event.target.value))}
                        className="w-40 accent-primary"
                      />
                      <span className="text-[16px] text-muted-foreground">A</span>
                      <span className="w-11 shrink-0 text-[13px] font-semibold">
                        {settings?.textSize ?? 100}%
                      </span>
                    </div>
                  </PreferenceRow>
                </div>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <SectionCard
              title="Notifications"
              description="Choisissez comment vous souhaitez être informé."
            >
              {isLoading ? (
                <FormSkeleton fields={2} />
              ) : (
                <div>
                  <PreferenceRow
                    label="Notifications par e-mail"
                    description="Nouvelles propositions, litiges, factures"
                  >
                    <Switch
                      checked={settings?.emailNotifications ?? false}
                      onCheckedChange={(value) => updateSetting("emailNotifications", value)}
                    />
                  </PreferenceRow>
                  <PreferenceRow
                    label="Notifications push"
                    description="Alertes en temps réel dans le navigateur"
                  >
                    <Switch
                      checked={settings?.pushNotifications ?? false}
                      onCheckedChange={(value) => updateSetting("pushNotifications", value)}
                    />
                  </PreferenceRow>
                </div>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="securite" className="mt-6 space-y-6">
            <SectionCard
              title="Mot de passe"
              description="Modifiez régulièrement votre mot de passe."
            >
              <form onSubmit={onSubmitPassword} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <TextField
                    label="Mot de passe actuel"
                    type="password"
                    error={form.formState.errors.currentPassword?.message}
                    {...form.register("currentPassword")}
                  />
                  <div>
                    <TextField
                      label="Nouveau mot de passe"
                      type="password"
                      error={form.formState.errors.newPassword?.message}
                      {...form.register("newPassword")}
                    />
                    {newPasswordValue ? (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3].map((step) => (
                            <span
                              key={step}
                              className={
                                "h-1 flex-1 rounded-full transition-colors " +
                                (step <= strength.score ? strength.className : "bg-border")
                              }
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-[12px] text-muted-foreground">
                          Robustesse : {strength.label}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <TextField
                    label="Confirmer le mot de passe"
                    type="password"
                    error={form.formState.errors.confirmPassword?.message}
                    {...form.register("confirmPassword")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordMutation.isPending}
                  className="rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {passwordMutation.isPending ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                </button>
              </form>
            </SectionCard>

            <SectionCard
              title="Double authentification"
              description="Sécurisez votre compte avec un code de vérification envoyé par e-mail à chaque connexion."
            >
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.7} />
                  </div>
                  <div className="flex-1">
                    <PreferenceRow
                      label="Authentification à deux facteurs (2FA)"
                      description={settings?.twoFactorEnabled ? "2FA activée" : "2FA désactivée"}
                    >
                      <Switch
                        checked={settings?.twoFactorEnabled ?? false}
                        onCheckedChange={(value) => updateSetting("twoFactorEnabled", value)}
                      />
                    </PreferenceRow>
                  </div>
                </div>
              )}
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
