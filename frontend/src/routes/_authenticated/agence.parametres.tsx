import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Bell,
  Check,
  CreditCard,
  Lock,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react";
import { useThemeStore } from "@/store/theme.store";

const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "default", label: "Par défaut" },
  { value: "inter", label: "Inter" },
  { value: "system", label: "Système" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Monospace" },
];

const THEME_OPTIONS: { value: "light" | "dark" | "system"; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Suivre le système", icon: Monitor },
];

import { DashboardShell } from "@/components/layout/DashboardShell";
import { FormSkeleton, PreferenceRow, SectionCard, TextField } from "@/components/common/Blocks";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAgencyProfile,
  getSettings,
  updateAgencyProfile,
  updateSettings,
} from "@/services/profile.service";
import { changePassword } from "@/services/auth.service";
import { ApiError } from "@/services/http";

export const Route = createFileRoute("/_authenticated/agence/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres agence — Sortlist" },
      {
        name: "description",
        content:
          "Configurez votre compte agence : préférences d'affichage, notifications, sécurité et facturation.",
      },
      { property: "og:title", content: "Paramètres agence — Sortlist" },
      {
        property: "og:description",
        content: "Configuration du compte de votre agence.",
      },
    ],
  }),
  component: AgencySettingsPage,
});

interface AgencySettingsState {
  theme: string;
  language: string;
  font: string;
  textSize: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  opportunityAlerts: boolean;
  autoQuoteReminders: boolean;
  twoFactorEnabled: boolean;
}

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

const billingSchema = z.object({
  billingEmail: z.string().trim().email("E-mail invalide").max(255),
  vatNumber: z.string().trim().min(1, "Champ requis").max(40),
  billingAddress: z.string().trim().min(1, "Champ requis").max(255),
});

type BillingForm = z.infer<typeof billingSchema>;

const NOTIFICATION_PREFS_KEYS: (keyof AgencySettingsState)[] = [
  "emailNotifications",
  "pushNotifications",
  "opportunityAlerts",
  "autoQuoteReminders",
];

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

function AgencySettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["agency", "settings"],
    queryFn: getSettings,
  });
  const isLoading = settingsQuery.isLoading;

  const [notificationPrefs, setNotificationPrefs] = useState<
    Pick<
      AgencySettingsState,
      "emailNotifications" | "pushNotifications" | "opportunityAlerts" | "autoQuoteReminders"
    >
  >({
    emailNotifications: true,
    pushNotifications: true,
    opportunityAlerts: true,
    autoQuoteReminders: true,
  });

  const settings: AgencySettingsState | null = settingsQuery.data
    ? { ...settingsQuery.data, ...notificationPrefs }
    : null;

  useEffect(() => {
    if (!settingsQuery.data) return;
    useThemeStore.getState().setTheme(settingsQuery.data.theme);
    useThemeStore.getState().setFont(settingsQuery.data.font);
    useThemeStore.getState().setTextSize(settingsQuery.data.textSize);
  }, [settingsQuery.data]);

  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "settings"], updated);
      toast("Paramètres mis à jour");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Mise à jour impossible.");
    },
  });

  function applyDisplaySetting(patch: {
    theme?: "light" | "dark" | "system";
    font?: string;
    textSize?: number;
  }) {
    if (patch.theme) useThemeStore.getState().setTheme(patch.theme);
    if (patch.font) useThemeStore.getState().setFont(patch.font);
    if (patch.textSize !== undefined) useThemeStore.getState().setTextSize(patch.textSize);
    updateSettingsMutation.mutate(patch);
  }

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast("Mot de passe mis à jour");
      passwordForm.reset();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Mise à jour du mot de passe impossible.");
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = passwordForm.watch("newPassword");
  const strength = useMemo(() => passwordStrength(newPasswordValue), [newPasswordValue]);

  const billingForm = useForm<BillingForm>({
    resolver: zodResolver(billingSchema),
    defaultValues: { billingEmail: "", vatNumber: "", billingAddress: "" },
  });

  const onSubmitPassword = passwordForm.handleSubmit((values) => {
    changePasswordMutation.mutate({
      oldPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  });

  const agencyProfileQuery = useQuery({
    queryKey: ["agency", "profile", "billing"],
    queryFn: getAgencyProfile,
  });

  useEffect(() => {
    if (!agencyProfileQuery.data) return;
    billingForm.reset({
      billingEmail: agencyProfileQuery.data.billingEmail ?? "",
      vatNumber: agencyProfileQuery.data.vatNumber ?? "",
      billingAddress: agencyProfileQuery.data.billingAddress ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyProfileQuery.data]);

  const registerBillingMutation = useMutation({
    mutationFn: updateAgencyProfile,
    onSuccess: () => {
      toast("Informations de facturation enregistrées");
      void queryClient.invalidateQueries({ queryKey: ["agency", "profile"] });
    },
    onError: (error) => {
      toast(
        error instanceof ApiError
          ? error.message
          : "Enregistrement des informations de facturation impossible.",
      );
    },
  });

  const onSubmitBilling = billingForm.handleSubmit((values) => {
    registerBillingMutation.mutate({
      billingEmail: values.billingEmail,
      vatNumber: values.vatNumber,
      billingAddress: values.billingAddress,
    });
  });

  function updateSetting(key: keyof AgencySettingsState, value: boolean) {
    if (NOTIFICATION_PREFS_KEYS.includes(key)) {
      const next = { ...notificationPrefs, [key]: value };
      setNotificationPrefs(next);
      if (key === "emailNotifications" || key === "pushNotifications") {
        updateSettingsMutation.mutate({
          emailNotifications: next.emailNotifications,
          pushNotifications: next.pushNotifications,
        });
      }
      return;
    }
    if (key === "twoFactorEnabled") {
      updateSettingsMutation.mutate({ twoFactorEnabled: value });
    }
  }

  return (
    <DashboardShell role="agency">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px] space-y-6">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight">Paramètres</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Gérez les paramètres de votre compte et de votre agence.
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
            <TabsTrigger value="facturation" className="gap-1.5">
              <CreditCard className="h-3.5 w-3.5" strokeWidth={1.8} />
              Facturation
            </TabsTrigger>
            <TabsTrigger value="securite" className="gap-1.5">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.8} />
              Sécurité
            </TabsTrigger>
          </TabsList>

          {}
          <TabsContent value="profil" className="mt-6">
            <SectionCard title="Profil agence" description="Vos informations d'agence.">
              {agencyProfileQuery.isPending ? (
                <FormSkeleton fields={2} />
              ) : agencyProfileQuery.data ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      style={
                        agencyProfileQuery.data.logo
                          ? undefined
                          : { backgroundImage: seedGradient(agencyProfileQuery.data.name || "?") }
                      }
                      className="font-display flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-[17px] font-bold text-white shadow-sm"
                    >
                      {agencyProfileQuery.data.logo ? (
                        <img
                          src={agencyProfileQuery.data.logo}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (agencyProfileQuery.data.name || "?").slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold">{agencyProfileQuery.data.name}</p>
                      <p className="text-[13px] text-muted-foreground">
                        {agencyProfileQuery.data.email || "E-mail non renseigné"}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/agence/profil"
                    className="rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent"
                  >
                    Modifier le profil agence
                  </Link>
                </div>
              ) : null}
            </SectionCard>
          </TabsContent>

          {}
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
                        onClick={() => applyDisplaySetting({ theme: option.value })}
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
                    {}
                    <select
                      value={settings?.language ?? ""}
                      onChange={(event) =>
                        updateSettingsMutation.mutate({ language: event.target.value })
                      }
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
                      onChange={(event) => applyDisplaySetting({ font: event.target.value })}
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
                        onChange={(event) =>
                          applyDisplaySetting({ textSize: Number(event.target.value) })
                        }
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

          {}
          <TabsContent value="notifications" className="mt-6">
            <SectionCard
              title="Notifications"
              description="Alertes opportunités, rappels de devis et notifications générales."
            >
              <div>
                <PreferenceRow
                  label="Notifications par e-mail"
                  description="Opportunités, litiges, factures"
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
                <PreferenceRow
                  label="Alertes nouvelles opportunités"
                  description="Recevez un e-mail dès qu'un projet correspond à vos compétences"
                >
                  <Switch
                    checked={settings?.opportunityAlerts ?? false}
                    onCheckedChange={(value) => updateSetting("opportunityAlerts", value)}
                  />
                </PreferenceRow>
                <PreferenceRow
                  label="Rappels de devis"
                  description="Relance automatique avant expiration d'une opportunité"
                >
                  <Switch
                    checked={settings?.autoQuoteReminders ?? false}
                    onCheckedChange={(value) => updateSetting("autoQuoteReminders", value)}
                  />
                </PreferenceRow>
              </div>
            </SectionCard>
          </TabsContent>

          {}
          <TabsContent value="facturation" className="mt-6">
            <SectionCard
              title="Informations de facturation"
              description="Utilisées sur les factures émises par votre agence."
            >
              <form onSubmit={onSubmitBilling} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <TextField
                    label="E-mail de facturation"
                    error={billingForm.formState.errors.billingEmail?.message}
                    {...billingForm.register("billingEmail")}
                  />
                  <TextField
                    label="Numéro de TVA"
                    error={billingForm.formState.errors.vatNumber?.message}
                    {...billingForm.register("vatNumber")}
                  />
                  <TextField
                    label="Adresse de facturation"
                    error={billingForm.formState.errors.billingAddress?.message}
                    {...billingForm.register("billingAddress")}
                  />
                </div>
                <button
                  type="submit"
                  disabled={registerBillingMutation.isPending}
                  className="rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {registerBillingMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </button>
              </form>
            </SectionCard>
          </TabsContent>

          {}
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
                    error={passwordForm.formState.errors.currentPassword?.message}
                    {...passwordForm.register("currentPassword")}
                  />
                  <div>
                    <TextField
                      label="Nouveau mot de passe"
                      type="password"
                      error={passwordForm.formState.errors.newPassword?.message}
                      {...passwordForm.register("newPassword")}
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
                    error={passwordForm.formState.errors.confirmPassword?.message}
                    {...passwordForm.register("confirmPassword")}
                  />
                </div>
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {changePasswordMutation.isPending
                    ? "Mise à jour..."
                    : "Mettre à jour le mot de passe"}
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
