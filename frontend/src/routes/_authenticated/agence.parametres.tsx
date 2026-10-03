import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useLocaleStore, type Locale } from "@/store/locale.store";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

const PAGE_TEXT = {
  "Par défaut": { en: "Default", ar: "افتراضي", es: "Predeterminado" },
  Système: { en: "System", ar: "النظام", es: "Sistema" },
  Clair: { en: "Light", ar: "فاتح", es: "Claro" },
  Sombre: { en: "Dark", ar: "داكن", es: "Oscuro" },
  "Suivre le système": { en: "Follow system", ar: "اتباع النظام", es: "Seguir el sistema" },
  Paramètres: { en: "Settings", ar: "الإعدادات", es: "Configuración" },
  "Gérez les paramètres de votre compte et de votre agence.": {
    en: "Manage your account and agency settings.",
    ar: "أدر إعدادات حسابك ووكالتك.",
    es: "Gestiona la configuración de tu cuenta y de tu agencia.",
  },
  Profil: { en: "Profile", ar: "الملف الشخصي", es: "Perfil" },
  Apparence: { en: "Appearance", ar: "المظهر", es: "Apariencia" },
  Notifications: { en: "Notifications", ar: "الإشعارات", es: "Notificaciones" },
  Facturation: { en: "Billing", ar: "الفوترة", es: "Facturación" },
  Sécurité: { en: "Security", ar: "الأمان", es: "Seguridad" },
  "Profil agence": { en: "Agency profile", ar: "ملف الوكالة", es: "Perfil de la agencia" },
  "Vos informations d'agence.": {
    en: "Your agency information.",
    ar: "معلومات وكالتك.",
    es: "La información de tu agencia.",
  },
  "E-mail non renseigné": {
    en: "Email not provided",
    ar: "لم يتم تحديد البريد الإلكتروني",
    es: "Correo electrónico no indicado",
  },
  "Modifier le profil agence": {
    en: "Edit agency profile",
    ar: "تعديل ملف الوكالة",
    es: "Editar el perfil de la agencia",
  },
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
  "Alertes opportunités, rappels de devis et notifications générales.": {
    en: "Opportunity alerts, quote reminders and general notifications.",
    ar: "تنبيهات الفرص، تذكيرات العروض، والإشعارات العامة.",
    es: "Alertas de oportunidades, recordatorios de presupuestos y notificaciones generales.",
  },
  "Notifications par e-mail": {
    en: "Email notifications",
    ar: "إشعارات البريد الإلكتروني",
    es: "Notificaciones por correo electrónico",
  },
  "Opportunités, litiges, factures": {
    en: "Opportunities, disputes, invoices",
    ar: "فرص، نزاعات، فواتير",
    es: "Oportunidades, disputas, facturas",
  },
  "Notifications push": { en: "Push notifications", ar: "الإشعارات الفورية", es: "Notificaciones push" },
  "Alertes en temps réel dans le navigateur": {
    en: "Real-time alerts in the browser",
    ar: "تنبيهات فورية في المتصفح",
    es: "Alertas en tiempo real en el navegador",
  },
  "Alertes nouvelles opportunités": {
    en: "New opportunity alerts",
    ar: "تنبيهات الفرص الجديدة",
    es: "Alertas de nuevas oportunidades",
  },
  "Recevez un e-mail dès qu'un projet correspond à vos compétences": {
    en: "Receive an email as soon as a project matches your skills",
    ar: "تلقَّ بريدًا إلكترونيًا فور توافق مشروع مع مهاراتك",
    es: "Recibe un correo electrónico en cuanto un proyecto coincida con tus competencias",
  },
  "Rappels de devis": { en: "Quote reminders", ar: "تذكيرات العروض", es: "Recordatorios de presupuestos" },
  "Relance automatique avant expiration d'une opportunité": {
    en: "Automatic reminder before an opportunity expires",
    ar: "تذكير تلقائي قبل انتهاء صلاحية الفرصة",
    es: "Recordatorio automático antes de que expire una oportunidad",
  },
  "Informations de facturation": {
    en: "Billing information",
    ar: "معلومات الفوترة",
    es: "Información de facturación",
  },
  "Utilisées sur les factures émises par votre agence.": {
    en: "Used on the invoices issued by your agency.",
    ar: "تُستخدم في الفواتير الصادرة عن وكالتك.",
    es: "Se utilizan en las facturas emitidas por tu agencia.",
  },
  "E-mail de facturation": {
    en: "Billing email",
    ar: "البريد الإلكتروني للفوترة",
    es: "Correo electrónico de facturación",
  },
  "Numéro de TVA": { en: "VAT number", ar: "رقم التعريف الضريبي", es: "Número de IVA" },
  "Adresse de facturation": { en: "Billing address", ar: "عنوان الفوترة", es: "Dirección de facturación" },
  "Enregistrement...": { en: "Saving...", ar: "جارٍ الحفظ...", es: "Guardando..." },
  Enregistrer: { en: "Save", ar: "حفظ", es: "Guardar" },
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
  "Paramètres mis à jour": {
    en: "Settings updated",
    ar: "تم تحديث الإعدادات",
    es: "Configuración actualizada",
  },
  "Mise à jour impossible.": {
    en: "Unable to update.",
    ar: "تعذّر التحديث.",
    es: "No se pudo actualizar.",
  },
  "Mot de passe mis à jour": {
    en: "Password updated",
    ar: "تم تحديث كلمة المرور",
    es: "Contraseña actualizada",
  },
  "Mise à jour du mot de passe impossible.": {
    en: "Unable to update the password.",
    ar: "تعذّر تحديث كلمة المرور.",
    es: "No se pudo actualizar la contraseña.",
  },
  "Informations de facturation enregistrées": {
    en: "Billing information saved",
    ar: "تم حفظ معلومات الفوترة",
    es: "Información de facturación guardada",
  },
  "Enregistrement des informations de facturation impossible.": {
    en: "Unable to save the billing information.",
    ar: "تعذّر حفظ معلومات الفوترة.",
    es: "No se pudo guardar la información de facturación.",
  },
} satisfies PageTextDict;

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

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
  { value: "es", label: "Español" },
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
  const { tt } = usePageText(PAGE_TEXT);
  const queryClient = useQueryClient();
  const currentTheme = useThemeStore((state) => state.theme);
  const currentFont = useThemeStore((state) => state.font);
  const currentTextSize = useThemeStore((state) => state.textSize);
  const currentLocale = useLocaleStore((state) => state.locale);
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
    const language = settingsQuery.data.language;
    if (language && ["fr", "en", "ar", "es"].includes(language)) {
      useLocaleStore.getState().setLocale(language as Locale);
    }
  }, [settingsQuery.data]);

  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "settings"], updated);
      toast(tt("Paramètres mis à jour"));
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Mise à jour impossible."));
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
      updateSettingsMutation.mutate({ textSize: value });
    }, 500);
  }

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast(tt("Mot de passe mis à jour"));
      passwordForm.reset();
    },
    onError: (error) => {
      toast(
        error instanceof ApiError ? error.message : tt("Mise à jour du mot de passe impossible."),
      );
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
      toast(tt("Informations de facturation enregistrées"));
      void queryClient.invalidateQueries({ queryKey: ["agency", "profile"] });
    },
    onError: (error) => {
      toast(
        error instanceof ApiError
          ? error.message
          : tt("Enregistrement des informations de facturation impossible."),
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
          <h1 className="font-display text-[26px] font-bold tracking-tight">{tt("Paramètres")}</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {tt("Gérez les paramètres de votre compte et de votre agence.")}
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
            <TabsTrigger value="facturation" className="gap-1.5">
              <CreditCard className="h-3.5 w-3.5" strokeWidth={1.8} />
              {tt("Facturation")}
            </TabsTrigger>
            <TabsTrigger value="securite" className="gap-1.5">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.8} />
              {tt("Sécurité")}
            </TabsTrigger>
          </TabsList>

          {}
          <TabsContent value="profil" className="mt-6">
            <SectionCard title={tt("Profil agence")} description={tt("Vos informations d'agence.")}>
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
                        {agencyProfileQuery.data.email || tt("E-mail non renseigné")}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/agence/profil"
                    className="rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent"
                  >
                    {tt("Modifier le profil agence")}
                  </Link>
                </div>
              ) : null}
            </SectionCard>
          </TabsContent>

          {}
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
                      onChange={(event) => {
                        useLocaleStore.getState().setLocale(event.target.value as Locale);
                        updateSettingsMutation.mutate({ language: event.target.value });
                      }}
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
                      onChange={(event) => applyDisplaySetting({ font: event.target.value })}
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

          {}
          <TabsContent value="notifications" className="mt-6">
            <SectionCard
              title={tt("Notifications")}
              description={tt("Alertes opportunités, rappels de devis et notifications générales.")}
            >
              <div>
                <PreferenceRow
                  label={tt("Notifications par e-mail")}
                  description={tt("Opportunités, litiges, factures")}
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
                <PreferenceRow
                  label={tt("Alertes nouvelles opportunités")}
                  description={tt("Recevez un e-mail dès qu'un projet correspond à vos compétences")}
                >
                  <Switch
                    checked={settings?.opportunityAlerts ?? false}
                    onCheckedChange={(value) => updateSetting("opportunityAlerts", value)}
                  />
                </PreferenceRow>
                <PreferenceRow
                  label={tt("Rappels de devis")}
                  description={tt("Relance automatique avant expiration d'une opportunité")}
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
              title={tt("Informations de facturation")}
              description={tt("Utilisées sur les factures émises par votre agence.")}
            >
              <form onSubmit={onSubmitBilling} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <TextField
                    label={tt("E-mail de facturation")}
                    error={billingForm.formState.errors.billingEmail?.message}
                    {...billingForm.register("billingEmail")}
                  />
                  <TextField
                    label={tt("Numéro de TVA")}
                    error={billingForm.formState.errors.vatNumber?.message}
                    {...billingForm.register("vatNumber")}
                  />
                  <TextField
                    label={tt("Adresse de facturation")}
                    error={billingForm.formState.errors.billingAddress?.message}
                    {...billingForm.register("billingAddress")}
                  />
                </div>
                <button
                  type="submit"
                  disabled={registerBillingMutation.isPending}
                  className="rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {registerBillingMutation.isPending ? tt("Enregistrement...") : tt("Enregistrer")}
                </button>
              </form>
            </SectionCard>
          </TabsContent>

          {}
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
                    error={passwordForm.formState.errors.currentPassword?.message}
                    {...passwordForm.register("currentPassword")}
                  />
                  <div>
                    <TextField
                      label={tt("Nouveau mot de passe")}
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
                          {tt("Robustesse :")} {tt(strength.label)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <TextField
                    label={tt("Confirmer le mot de passe")}
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
