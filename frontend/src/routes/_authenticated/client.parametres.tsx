import { createFileRoute, Link } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
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
import { useLocaleStore, type Locale } from "@/store/locale.store";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

const PAGE_TEXT = {
  "Par défaut": { en: "Default", ar: "افتراضي", es: "Predeterminado" },
  Système: { en: "System", ar: "النظام", es: "Sistema" },
  Clair: { en: "Light", ar: "فاتح", es: "Claro" },
  Sombre: { en: "Dark", ar: "داكن", es: "Oscuro" },
  "Suivre le système": { en: "Follow system", ar: "اتباع النظام", es: "Seguir el sistema" },
  Paramètres: { en: "Settings", ar: "الإعدادات", es: "Configuración" },
  "Gérez votre profil, vos préférences d'affichage, vos notifications et votre sécurité.": {
    en: "Manage your profile, display preferences, notifications and security.",
    ar: "أدر ملفك الشخصي وتفضيلات العرض والإشعارات والأمان.",
    es: "Gestiona tu perfil, tus preferencias de visualización, tus notificaciones y tu seguridad.",
  },
  Profil: { en: "Profile", ar: "الملف الشخصي", es: "Perfil" },
  Apparence: { en: "Appearance", ar: "المظهر", es: "Apariencia" },
  Notifications: { en: "Notifications", ar: "الإشعارات", es: "Notificaciones" },
  Sécurité: { en: "Security", ar: "الأمان", es: "Seguridad" },
  "Vos informations de compte.": {
    en: "Your account information.",
    ar: "معلومات حسابك.",
    es: "La información de tu cuenta.",
  },
  "Logo de l'entreprise": {
    en: "Company logo",
    ar: "شعار الشركة",
    es: "Logo de la empresa",
  },
  "Identité vérifiée": { en: "Identity verified", ar: "تم التحقق من الهوية", es: "Identidad verificada" },
  "Entreprise non renseignée": {
    en: "Company not provided",
    ar: "لم يتم تحديد الشركة",
    es: "Empresa no indicada",
  },
  "Modifier mon profil": { en: "Edit my profile", ar: "تعديل ملفي الشخصي", es: "Editar mi perfil" },
  Thème: { en: "Theme", ar: "السمة", es: "Tema" },
  "Choisissez le thème d'affichage.": {
    en: "Choose the display theme.",
    ar: "اختر سمة العرض.",
    es: "Elige el tema de visualización.",
  },
  "Préférences d'affichage": {
    en: "Display preferences",
    ar: "تفضيلات العرض",
    es: "Preferencias de visualización",
  },
  "Langue, police et taille du texte.": {
    en: "Language, font and text size.",
    ar: "اللغة والخط وحجم النص.",
    es: "Idioma, fuente y tamaño del texto.",
  },
  Langue: { en: "Language", ar: "اللغة", es: "Idioma" },
  "Langue de l'interface": {
    en: "Interface language",
    ar: "لغة الواجهة",
    es: "Idioma de la interfaz",
  },
  Police: { en: "Font", ar: "الخط", es: "Fuente" },
  "Police d'affichage": { en: "Display font", ar: "خط العرض", es: "Fuente de visualización" },
  "Taille du texte": { en: "Text size", ar: "حجم النص", es: "Tamaño del texto" },
  "Ajustez la lisibilité de l'interface": {
    en: "Adjust the readability of the interface",
    ar: "اضبط وضوح قراءة الواجهة",
    es: "Ajusta la legibilidad de la interfaz",
  },
  "Choisissez comment vous souhaitez être informé.": {
    en: "Choose how you want to be notified.",
    ar: "اختر كيفية تلقي الإشعارات.",
    es: "Elige cómo deseas recibir notificaciones.",
  },
  "Notifications par e-mail": {
    en: "Email notifications",
    ar: "إشعارات البريد الإلكتروني",
    es: "Notificaciones por correo electrónico",
  },
  "Nouvelles propositions, litiges, factures": {
    en: "New proposals, disputes, invoices",
    ar: "عروض جديدة، نزاعات، فواتير",
    es: "Nuevas propuestas, disputas, facturas",
  },
  "Notifications push": { en: "Push notifications", ar: "الإشعارات الفورية", es: "Notificaciones push" },
  "Alertes en temps réel dans le navigateur": {
    en: "Real-time alerts in the browser",
    ar: "تنبيهات فورية في المتصفح",
    es: "Alertas en tiempo real en el navegador",
  },
  "Mot de passe": { en: "Password", ar: "كلمة المرور", es: "Contraseña" },
  "Modifiez régulièrement votre mot de passe.": {
    en: "Change your password regularly.",
    ar: "قم بتغيير كلمة مرورك بانتظام.",
    es: "Cambia tu contraseña regularmente.",
  },
  "Mot de passe actuel": { en: "Current password", ar: "كلمة المرور الحالية", es: "Contraseña actual" },
  "Nouveau mot de passe": { en: "New password", ar: "كلمة المرور الجديدة", es: "Nueva contraseña" },
  "Confirmer le mot de passe": {
    en: "Confirm password",
    ar: "تأكيد كلمة المرور",
    es: "Confirmar contraseña",
  },
  "Robustesse :": { en: "Strength:", ar: "القوة:", es: "Seguridad:" },
  Fort: { en: "Strong", ar: "قوية", es: "Fuerte" },
  Moyen: { en: "Medium", ar: "متوسطة", es: "Media" },
  Faible: { en: "Weak", ar: "ضعيفة", es: "Débil" },
  "Mise à jour...": { en: "Updating...", ar: "جارٍ التحديث...", es: "Actualizando..." },
  "Mettre à jour le mot de passe": {
    en: "Update password",
    ar: "تحديث كلمة المرور",
    es: "Actualizar contraseña",
  },
  "Double authentification": {
    en: "Two-factor authentication",
    ar: "المصادقة الثنائية",
    es: "Autenticación de dos factores",
  },
  "Sécurisez votre compte avec un code de vérification envoyé par e-mail à chaque connexion.": {
    en: "Secure your account with a verification code sent by email on every sign-in.",
    ar: "أمّن حسابك برمز تحقق يُرسل عبر البريد الإلكتروني في كل تسجيل دخول.",
    es: "Protege tu cuenta con un código de verificación enviado por correo electrónico en cada inicio de sesión.",
  },
  "Authentification à deux facteurs (2FA)": {
    en: "Two-factor authentication (2FA)",
    ar: "المصادقة الثنائية (2FA)",
    es: "Autenticación de dos factores (2FA)",
  },
  "2FA activée": { en: "2FA enabled", ar: "تم تفعيل المصادقة الثنائية", es: "2FA activada" },
  "2FA désactivée": { en: "2FA disabled", ar: "المصادقة الثنائية معطّلة", es: "2FA desactivada" },
  "Mot de passe mis à jour": {
    en: "Password updated",
    ar: "تم تحديث كلمة المرور",
    es: "Contraseña actualizada",
  },
  "Impossible de mettre à jour le mot de passe.": {
    en: "Unable to update the password.",
    ar: "تعذّر تحديث كلمة المرور.",
    es: "No se pudo actualizar la contraseña.",
  },
  "Préférences mises à jour": {
    en: "Preferences updated",
    ar: "تم تحديث التفضيلات",
    es: "Preferencias actualizadas",
  },
  "Impossible d'enregistrer les préférences.": {
    en: "Unable to save the preferences.",
    ar: "تعذّر حفظ التفضيلات.",
    es: "No se pudieron guardar las preferencias.",
  },
} satisfies PageTextDict;

const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "default", label: "Par défaut" },
  { value: "inter", label: "Inter" },
  { value: "system", label: "Système" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Monospace" },
];

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
  { value: "es", label: "Español" },
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
  const { tt } = usePageText(PAGE_TEXT);
  const queryClient = useQueryClient();
  const currentTheme = useThemeStore((state) => state.theme);
  const currentFont = useThemeStore((state) => state.font);
  const currentTextSize = useThemeStore((state) => state.textSize);
  const currentLocale = useLocaleStore((state) => state.locale);
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
    if (settings.language && ["fr", "en", "ar", "es"].includes(settings.language)) {
      useLocaleStore.getState().setLocale(settings.language as Locale);
    }
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
      toast.success(tt("Mot de passe mis à jour"));
      form.reset();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : tt("Impossible de mettre à jour le mot de passe."),
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
      toast.success(tt("Préférences mises à jour"));
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : tt("Impossible d'enregistrer les préférences."),
      );
    },
  });

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (key === "theme") useThemeStore.getState().setTheme(value as Settings["theme"]);
    if (key === "font") useThemeStore.getState().setFont(value as string);
    if (key === "textSize") useThemeStore.getState().setTextSize(value as number);
    if (key === "language") useLocaleStore.getState().setLocale(value as Locale);

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

  const textSizeSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (textSizeSaveTimeout.current) clearTimeout(textSizeSaveTimeout.current);
    };
  }, []);

  function handleTextSizeChange(value: number) {
    useThemeStore.getState().setTextSize(value);
    if (textSizeSaveTimeout.current) clearTimeout(textSizeSaveTimeout.current);
    textSizeSaveTimeout.current = setTimeout(() => {
      settingsMutation.mutate({ textSize: value });
    }, 500);
  }

  return (
    <DashboardShell role="client">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px] space-y-6">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight">{tt("Paramètres")}</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {tt("Gérez votre profil, vos préférences d'affichage, vos notifications et votre sécurité.")}
          </p>
        </div>

        <Tabs defaultValue="profil" className="w-full">
          <TabsList className="h-auto flex-wrap gap-1 rounded-lg border border-border bg-transparent p-1">
            <TabsTrigger value="profil" className="gap-1.5">
              <User className="h-3.5 w-3.5" strokeWidth={1.8} />
              {tt("Profil")}
            </TabsTrigger>
            <TabsTrigger value="apparence" className="gap-1.5">
              <Palette className="h-3.5 w-3.5" strokeWidth={1.8} />
              {tt("Apparence")}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" strokeWidth={1.8} />
              {tt("Notifications")}
            </TabsTrigger>
            <TabsTrigger value="securite" className="gap-1.5">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.8} />
              {tt("Sécurité")}
            </TabsTrigger>
          </TabsList>

          {}
          <TabsContent value="profil" className="mt-6">
            <SectionCard title={tt("Profil")} description={tt("Vos informations de compte.")}>
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
                          alt={tt("Logo de l'entreprise")}
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
                            {tt("Identité vérifiée")}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        {profileQuery.data.companyName || tt("Entreprise non renseignée")}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/client/mon-profil"
                    className="rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent"
                  >
                    {tt("Modifier mon profil")}
                  </Link>
                </div>
              ) : null}
            </SectionCard>
          </TabsContent>

          <TabsContent value="apparence" className="mt-6 space-y-6">
            <SectionCard title={tt("Thème")} description={tt("Choisissez le thème d'affichage.")}>
              {isLoading ? (
                <FormSkeleton fields={3} />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {THEME_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = currentTheme === option.value;
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
                        {tt(option.label)}
                      </button>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title={tt("Préférences d'affichage")}
              description={tt("Langue, police et taille du texte.")}
            >
              {isLoading ? (
                <FormSkeleton fields={3} />
              ) : (
                <div>
                  <PreferenceRow label={tt("Langue")} description={tt("Langue de l'interface")}>
                    <select
                      value={currentLocale}
                      onChange={(event) =>
                        updateSetting("language", event.target.value as Settings["language"])
                      }
                      className="rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none transition-colors focus:border-primary/50"
                    >
                      {LANGUAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </PreferenceRow>
                  <PreferenceRow label={tt("Police")} description={tt("Police d'affichage")}>
                    <select
                      value={currentFont}
                      onChange={(event) => updateSetting("font", event.target.value)}
                      className="rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none transition-colors focus:border-primary/50"
                    >
                      {FONT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {tt(option.label)}
                        </option>
                      ))}
                    </select>
                  </PreferenceRow>
                  <PreferenceRow
                    label={tt("Taille du texte")}
                    description={tt("Ajustez la lisibilité de l'interface")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-muted-foreground">A</span>
                      <input
                        type="range"
                        min={80}
                        max={130}
                        value={currentTextSize}
                        onChange={(event) => handleTextSizeChange(Number(event.target.value))}
                        className="w-40 accent-primary"
                      />
                      <span className="text-[16px] text-muted-foreground">A</span>
                      <span className="w-11 shrink-0 text-[13px] font-semibold">
                        {currentTextSize}%
                      </span>
                    </div>
                  </PreferenceRow>
                </div>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <SectionCard
              title={tt("Notifications")}
              description={tt("Choisissez comment vous souhaitez être informé.")}
            >
              {isLoading ? (
                <FormSkeleton fields={2} />
              ) : (
                <div>
                  <PreferenceRow
                    label={tt("Notifications par e-mail")}
                    description={tt("Nouvelles propositions, litiges, factures")}
                  >
                    <Switch
                      checked={settings?.emailNotifications ?? false}
                      onCheckedChange={(value) => updateSetting("emailNotifications", value)}
                    />
                  </PreferenceRow>
                  <PreferenceRow
                    label={tt("Notifications push")}
                    description={tt("Alertes en temps réel dans le navigateur")}
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
              title={tt("Mot de passe")}
              description={tt("Modifiez régulièrement votre mot de passe.")}
            >
              <form onSubmit={onSubmitPassword} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <TextField
                    label={tt("Mot de passe actuel")}
                    type="password"
                    error={form.formState.errors.currentPassword?.message}
                    {...form.register("currentPassword")}
                  />
                  <div>
                    <TextField
                      label={tt("Nouveau mot de passe")}
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
                          {tt("Robustesse :")} {tt(strength.label)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <TextField
                    label={tt("Confirmer le mot de passe")}
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
                  {passwordMutation.isPending
                    ? tt("Mise à jour...")
                    : tt("Mettre à jour le mot de passe")}
                </button>
              </form>
            </SectionCard>

            <SectionCard
              title={tt("Double authentification")}
              description={tt(
                "Sécurisez votre compte avec un code de vérification envoyé par e-mail à chaque connexion.",
              )}
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
                      label={tt("Authentification à deux facteurs (2FA)")}
                      description={tt(settings?.twoFactorEnabled ? "2FA activée" : "2FA désactivée")}
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
