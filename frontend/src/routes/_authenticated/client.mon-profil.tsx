import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  ShieldCheck,
  Loader2,
  User,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Phone,
  Star,
  MessageSquare,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FormSkeleton, StatusBadge, TextField } from "@/components/common/Blocks";
import { EmptyState } from "@/components/common/EmptyState";
import {
  getClientProfile,
  listClientReviews,
  requestPhoneOtp,
  updateClientProfile,
  verifyClientIdentity,
  verifyPhoneOtp,
} from "@/services/profile.service";
import { ApiError } from "@/services/http";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

const PAGE_TEXT = {
  "Prénom du contact": {
    en: "Contact first name",
    ar: "الاسم الأول لجهة الاتصال",
    es: "Nombre del contacto",
  },
  "Nom du contact": {
    en: "Contact last name",
    ar: "اسم عائلة جهة الاتصال",
    es: "Apellido del contacto",
  },
  "Raison sociale": {
    en: "Company name",
    ar: "الاسم التجاري",
    es: "Razón social",
  },
  "Téléphone": {
    en: "Phone",
    ar: "الهاتف",
    es: "Teléfono",
  },
  "Logo de l'entreprise": {
    en: "Company logo",
    ar: "شعار الشركة",
    es: "Logotipo de la empresa",
  },
  "Pays": {
    en: "Country",
    ar: "البلد",
    es: "País",
  },
  "Identifiant légal": {
    en: "Legal ID",
    ar: "المعرّف القانوني",
    es: "Identificador legal",
  },
  "Secteur d'activité": {
    en: "Industry",
    ar: "قطاع النشاط",
    es: "Sector de actividad",
  },
  "Profil mis à jour avec succès": {
    en: "Profile updated successfully",
    ar: "تم تحديث الملف الشخصي بنجاح",
    es: "Perfil actualizado correctamente",
  },
  "Impossible d'enregistrer le profil.": {
    en: "Unable to save the profile.",
    ar: "تعذّر حفظ الملف الشخصي.",
    es: "No se pudo guardar el perfil.",
  },
  "Identité vérifiée : votre score de confiance a été mis à jour.": {
    en: "Identity verified: your trust score has been updated.",
    ar: "تم التحقق من الهوية: تم تحديث درجة الثقة الخاصة بك.",
    es: "Identidad verificada: se actualizó tu puntuación de confianza.",
  },
  "Format d'identifiant invalide. Format attendu : ": {
    en: "Invalid ID format. Expected format: ",
    ar: "صيغة المعرّف غير صحيحة. الصيغة المتوقعة: ",
    es: "Formato de identificador no válido. Formato esperado: ",
  },
  "Format d'identifiant invalide pour le pays renseigné.": {
    en: "Invalid ID format for the selected country.",
    ar: "صيغة المعرّف غير صالحة بالنسبة للبلد المحدد.",
    es: "Formato de identificador no válido para el país indicado.",
  },
  "Vérification de l'identité impossible.": {
    en: "Unable to verify identity.",
    ar: "تعذّر التحقق من الهوية.",
    es: "No se pudo verificar la identidad.",
  },
  "Code envoyé par e-mail (valable 5 minutes).": {
    en: "Code sent by email (valid for 5 minutes).",
    ar: "تم إرسال الرمز عبر البريد الإلكتروني (صالح لمدة 5 دقائق).",
    es: "Código enviado por correo electrónico (válido 5 minutos).",
  },
  "Envoi du code impossible.": {
    en: "Unable to send the code.",
    ar: "تعذّر إرسال الرمز.",
    es: "No se pudo enviar el código.",
  },
  "Téléphone vérifié : votre score de confiance a été mis à jour.": {
    en: "Phone verified: your trust score has been updated.",
    ar: "تم التحقق من الهاتف: تم تحديث درجة الثقة الخاصة بك.",
    es: "Teléfono verificado: se actualizó tu puntuación de confianza.",
  },
  "Code invalide ou expiré.": {
    en: "Invalid or expired code.",
    ar: "الرمز غير صالح أو منتهي الصلاحية.",
    es: "Código no válido o caducado.",
  },
  "Le logo doit être une image (PNG, JPG, SVG...).": {
    en: "The logo must be an image (PNG, JPG, SVG...).",
    ar: "يجب أن يكون الشعار صورة (PNG أو JPG أو SVG...).",
    es: "El logotipo debe ser una imagen (PNG, JPG, SVG...).",
  },
  "Image trop lourde (4 Mo maximum).": {
    en: "Image too large (4 MB maximum).",
    ar: "حجم الصورة كبير جدًا (الحد الأقصى 4 ميغابايت).",
    es: "Imagen demasiado pesada (4 MB como máximo).",
  },
  "Mon profil": {
    en: "My profile",
    ar: "ملفي الشخصي",
    es: "Mi perfil",
  },
  "Gérez les informations de votre entreprise.": {
    en: "Manage your company information.",
    ar: "أدر معلومات شركتك.",
    es: "Gestiona la información de tu empresa.",
  },
  "Identité vérifiée": {
    en: "Identity verified",
    ar: "تم التحقق من الهوية",
    es: "Identidad verificada",
  },
  "Informations entreprise": {
    en: "Company information",
    ar: "معلومات الشركة",
    es: "Información de la empresa",
  },
  "Ces informations sont visibles par les agences que vous contactez.": {
    en: "This information is visible to the agencies you contact.",
    ar: "هذه المعلومات مرئية للوكالات التي تتواصل معها.",
    es: "Esta información es visible para las agencias que contactas.",
  },
  "Changer le logo": {
    en: "Change logo",
    ar: "تغيير الشعار",
    es: "Cambiar logotipo",
  },
  "PNG, JPG ou SVG, 4 Mo maximum. Affiché sur votre profil et vos échanges avec les agences.": {
    en: "PNG, JPG or SVG, 4 MB maximum. Shown on your profile and in your exchanges with agencies.",
    ar: "PNG أو JPG أو SVG، بحد أقصى 4 ميغابايت. يظهر في ملفك الشخصي وفي تبادلاتك مع الوكالات.",
    es: "PNG, JPG o SVG, 4 MB como máximo. Se muestra en tu perfil y en tus intercambios con las agencias.",
  },
  "Type d'identifiant légal": {
    en: "Legal ID type",
    ar: "نوع المعرّف القانوني",
    es: "Tipo de identificador legal",
  },
  "Vérifié": {
    en: "Verified",
    ar: "موثّق",
    es: "Verificado",
  },
  "Numéro de téléphone": {
    en: "Phone number",
    ar: "رقم الهاتف",
    es: "Número de teléfono",
  },
  "Ex. 06 12 34 56 78": {
    en: "E.g. 06 12 34 56 78",
    ar: "مثال: 06 12 34 56 78",
    es: "Ej. 06 12 34 56 78",
  },
  "Renvoyer le code": {
    en: "Resend code",
    ar: "إعادة إرسال الرمز",
    es: "Reenviar código",
  },
  "Vérifier mon numéro": {
    en: "Verify my number",
    ar: "تحقق من رقمي",
    es: "Verificar mi número",
  },
  "Code reçu par e-mail": {
    en: "Code received by email",
    ar: "الرمز المستلم عبر البريد الإلكتروني",
    es: "Código recibido por correo electrónico",
  },
  "Ex. 123456": {
    en: "E.g. 123456",
    ar: "مثال: 123456",
    es: "Ej. 123456",
  },
  "Valider le code": {
    en: "Confirm code",
    ar: "تأكيد الرمز",
    es: "Validar código",
  },
  "Enregistrement...": {
    en: "Saving...",
    ar: "جارٍ الحفظ...",
    es: "Guardando...",
  },
  "Enregistrer les modifications": {
    en: "Save changes",
    ar: "حفظ التعديلات",
    es: "Guardar los cambios",
  },
  "Vérification...": {
    en: "Verifying...",
    ar: "جارٍ التحقق...",
    es: "Verificando...",
  },
  "Revérifier mon identité": {
    en: "Re-verify my identity",
    ar: "إعادة التحقق من هويتي",
    es: "Volver a verificar mi identidad",
  },
  "Vérifier mon identité": {
    en: "Verify my identity",
    ar: "التحقق من هويتي",
    es: "Verificar mi identidad",
  },
  "Score de confiance": {
    en: "Trust score",
    ar: "درجة الثقة",
    es: "Puntuación de confianza",
  },
  "Calculé à partir de la complétion du profil et de votre activité.": {
    en: "Calculated from your profile completion and your activity.",
    ar: "يُحتسب بناءً على نسبة اكتمال ملفك الشخصي ونشاطك.",
    es: "Se calcula a partir de la finalización de tu perfil y tu actividad.",
  },
  "Aucune donnée disponible": {
    en: "No data available",
    ar: "لا توجد بيانات متاحة",
    es: "No hay datos disponibles",
  },
  "Complétion du profil": {
    en: "Profile completion",
    ar: "اكتمال الملف الشخصي",
    es: "Finalización del perfil",
  },
  "Renseignez les champs manquants pour améliorer votre visibilité.": {
    en: "Fill in the missing fields to improve your visibility.",
    ar: "أكمل الحقول الناقصة لتحسين ظهورك.",
    es: "Completa los campos que faltan para mejorar tu visibilidad.",
  },
  "Votre profil est complet !": {
    en: "Your profile is complete!",
    ar: "ملفك الشخصي مكتمل!",
    es: "¡Tu perfil está completo!",
  },
  "Avis reçus": {
    en: "Reviews received",
    ar: "التقييمات المستلمة",
    es: "Reseñas recibidas",
  },
  "Avis laissés par les agences avec lesquelles vous avez collaboré.": {
    en: "Reviews left by the agencies you have worked with.",
    ar: "تقييمات تركتها الوكالات التي تعاملت معها.",
    es: "Reseñas dejadas por las agencias con las que has colaborado.",
  },
  "Aucun avis reçu pour le moment": {
    en: "No reviews received yet",
    ar: "لا توجد تقييمات مستلمة حتى الآن",
    es: "Aún no se han recibido reseñas",
  },
  "Agence": {
    en: "Agency",
    ar: "وكالة",
    es: "Agencia",
  },
  "Projet : ": {
    en: "Project: ",
    ar: "المشروع: ",
    es: "Proyecto: ",
  },
} satisfies PageTextDict;

export const Route = createFileRoute("/_authenticated/client/mon-profil")({
  head: () => ({
    meta: [
      { title: "Mon profil | Sortlist" },
      {
        name: "description",
        content:
          "Complétez les informations de votre entreprise et suivez votre score de confiance.",
      },
      { property: "og:title", content: "Mon profil | Sortlist" },
      {
        property: "og:description",
        content: "Informations entreprise et score de confiance.",
      },
    ],
  }),
  component: ClientProfilePage,
});

const companySchema = z.object({
  contactLastName: z.string().trim().max(80).optional().or(z.literal("")),
  contactFirstName: z.string().trim().max(80).optional().or(z.literal("")),
  companyName: z.string().trim().min(1, "Champ requis").max(120),
  activitySector: z.string().trim().min(1, "Champ requis").max(120),
  country: z.string().trim().min(1, "Champ requis").max(80),
  legalIdType: z.string().trim().min(1, "Champ requis").max(80),
  legalIdValue: z.string().trim().min(1, "Champ requis").max(80),
});

type CompanyForm = z.infer<typeof companySchema>;

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

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const MAX_LOGO_SIZE_BYTES = 4 * 1024 * 1024;

function computeMissingFields(profile: {
  contactFirstName: string;
  contactLastName: string;
  companyName: string;
  activitySector: string;
  country: string;
  legalIdValue: string;
  logo?: string | null | undefined;
  phone?: string | undefined;
}): { id: string; label: string }[] {
  const checks: { id: string; label: string; value: unknown }[] = [
    { id: "contactFirstName", label: "Prénom du contact", value: profile.contactFirstName },
    { id: "contactLastName", label: "Nom du contact", value: profile.contactLastName },
    { id: "companyName", label: "Raison sociale", value: profile.companyName },
    { id: "phone", label: "Téléphone", value: profile.phone },
    { id: "logo", label: "Logo de l'entreprise", value: profile.logo },
    { id: "country", label: "Pays", value: profile.country },
    { id: "legalIdValue", label: "Identifiant légal", value: profile.legalIdValue },
    { id: "activitySector", label: "Secteur d'activité", value: profile.activitySector },
  ];
  return checks
    .filter((check) => !check.value || String(check.value).trim().length === 0)
    .map(({ id, label }) => ({ id, label }));
}

function ClientProfilePage() {
  const { tt } = usePageText(PAGE_TEXT);
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["client", "profile"],
    queryFn: getClientProfile,
  });
  const profile = profileQuery.data ?? null;
  const isLoading = profileQuery.isPending;

  const reviewsQuery = useQuery({
    queryKey: ["client", "reviews"],
    queryFn: () => listClientReviews(),
  });
  const reviews = reviewsQuery.data ?? [];

  const form = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      contactLastName: "",
      contactFirstName: "",
      companyName: "",
      activitySector: "",
      country: "",
      legalIdType: "",
      legalIdValue: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        contactLastName: profile.contactLastName,
        contactFirstName: profile.contactFirstName,
        companyName: profile.companyName,
        activitySector: profile.activitySector,
        country: profile.country,
        legalIdType: profile.legalIdType,
        legalIdValue: profile.legalIdValue,
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (values: Partial<typeof profile> & CompanyForm) => updateClientProfile(values),
    onSuccess: (updated) => {
      queryClient.setQueryData(["client", "profile"], updated);
      toast.success(tt("Profil mis à jour avec succès"));
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : tt("Impossible d'enregistrer le profil."),
      );
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    updateMutation.mutate({
      ...values,
      contactFirstName: values.contactFirstName ?? "",
      contactLastName: values.contactLastName ?? "",
      logo: logoPreviewUrl ?? profile?.logo ?? undefined,
    });
  });

  const verifyIdentityMutation = useMutation({
    mutationFn: verifyClientIdentity,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["client", "profile"] });
      void queryClient.invalidateQueries({ queryKey: ["client", "dashboard"] });
      if (result.verified) {
        toast.success("Identité vérifiée : votre score de confiance a été mis à jour.");
      } else {
        toast.error(
          result.expectedFormat
            ? `Format d'identifiant invalide. Format attendu : ${result.expectedFormat}`
            : "Format d'identifiant invalide pour le pays renseigné.",
        );
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Vérification de l'identité impossible.",
      );
    },
  });

  const [phoneInput, setPhoneInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (profile) {
      setPhoneInput(profile.phone ?? "");
    }
  }, [profile]);

  const requestPhoneOtpMutation = useMutation({
    mutationFn: () => requestPhoneOtp(phoneInput),
    onSuccess: () => {
      setOtpSent(true);
      toast.success("Code envoyé par e-mail (valable 5 minutes).");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Envoi du code impossible.");
    },
  });

  const verifyPhoneOtpMutation = useMutation({
    mutationFn: () => verifyPhoneOtp(otpCode),
    onSuccess: () => {
      setOtpSent(false);
      setOtpCode("");
      void queryClient.invalidateQueries({ queryKey: ["client", "profile"] });
      toast.success("Téléphone vérifié : votre score de confiance a été mis à jour.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Code invalide ou expiré.");
    },
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Le logo doit être une image (PNG, JPG, SVG...).");
      return;
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.error("Image trop lourde (4 Mo maximum).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Logo = reader.result as string;
      setLogoPreviewUrl(base64Logo);

      const values = form.getValues();
      updateMutation.mutate({
        ...values,
        contactFirstName: values.contactFirstName ?? "",
        contactLastName: values.contactLastName ?? "",
        logo: base64Logo,
      });
    };
    reader.readAsDataURL(file);
  }

  const companyName = form.watch("companyName") || profile?.companyName || "";
  const displayLogo = logoPreviewUrl ?? profile?.logo ?? null;
  const missingFields = profile ? computeMissingFields(profile) : [];
  const isProfileComplete = profile !== null && missingFields.length === 0;

  return (
    <DashboardShell role="client">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </div>
            <div>
              <h1 className="font-display text-[24px] font-bold tracking-tight">Mon profil</h1>
              <p className="mt-1 text-[14px] text-muted-foreground">
                Gérez les informations de votre entreprise.
              </p>
            </div>
          </div>
          {profile?.identityVerified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-[13px] font-semibold text-emerald-700 border border-emerald-200 shadow-sm">
              <ShieldCheck className="h-4 w-4" strokeWidth={2} />
              Identité vérifiée
            </span>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-[16px] font-bold">Informations entreprise</h2>
              <p className="text-[13px] text-muted-foreground">
                Ces informations sont visibles par les agences que vous contactez.
              </p>
            </div>
            {profile?.identityVerified && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[12px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Identité vérifiée
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="mt-5">
              <FormSkeleton fields={7} />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-5 space-y-6" noValidate>
              <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-accent/20 p-5">
                <div className="group relative shrink-0">
                  <div
                    style={
                      displayLogo
                        ? undefined
                        : { backgroundImage: seedGradient(companyName || "?") }
                    }
                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl text-[22px] font-bold text-white shadow-sm"
                  >
                    {updateMutation.isPending && logoPreviewUrl ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : displayLogo ? (
                      <img
                        src={displayLogo}
                        alt="Logo de l'entreprise"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-display">
                        {initialsOf(companyName || "Entreprise")}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    aria-label="Changer le logo"
                    className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-accent"
                  >
                    <Camera className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">Logo de l'entreprise</p>
                  <p className="mt-1 text-[13px] leading-[1.5] text-muted-foreground">
                    PNG, JPG ou SVG, 4 Mo maximum. Affiché sur votre profil et vos échanges avec les
                    agences.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Nom du contact"
                  error={form.formState.errors.contactLastName?.message}
                  {...form.register("contactLastName")}
                />
                <TextField
                  label="Prénom du contact"
                  error={form.formState.errors.contactFirstName?.message}
                  {...form.register("contactFirstName")}
                />
                <TextField
                  label="Raison sociale"
                  error={form.formState.errors.companyName?.message}
                  {...form.register("companyName")}
                />
                <TextField
                  label="Secteur d'activité"
                  error={form.formState.errors.activitySector?.message}
                  {...form.register("activitySector")}
                />
                <TextField
                  label="Pays"
                  error={form.formState.errors.country?.message}
                  {...form.register("country")}
                />
                <TextField
                  label="Type d'identifiant légal"
                  error={form.formState.errors.legalIdType?.message}
                  {...form.register("legalIdType")}
                />
                <TextField
                  label="Identifiant légal"
                  error={form.formState.errors.legalIdValue?.message}
                  {...form.register("legalIdValue")}
                />
              </div>

              {/* Vérification téléphone (cf. §1.1) : backend déjà exposé
                  (client.request_phone_otp/verify_phone_otp) mais jamais
                  appelé par le frontend jusqu'ici — pas de flux OTP téléphone
                  possible, donc les 15 points correspondants du score de
                  confiance étaient inatteignables. */}
              <div className="rounded-lg border border-border/60 bg-accent/20 p-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                  <p className="text-[14px] font-semibold">Téléphone</p>
                  {profile?.phoneVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Vérifié
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="min-w-[200px] flex-1">
                    <TextField
                      label="Numéro de téléphone"
                      value={phoneInput}
                      onChange={(event) => setPhoneInput(event.target.value)}
                      placeholder="Ex. 06 12 34 56 78"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => requestPhoneOtpMutation.mutate()}
                    disabled={!phoneInput.trim() || requestPhoneOtpMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2.5 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {requestPhoneOtpMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    {otpSent ? "Renvoyer le code" : "Vérifier mon numéro"}
                  </button>
                </div>
                {otpSent ? (
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <div className="min-w-[160px]">
                      <TextField
                        label="Code reçu par e-mail"
                        value={otpCode}
                        onChange={(event) => setOtpCode(event.target.value)}
                        placeholder="Ex. 123456"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => verifyPhoneOtpMutation.mutate()}
                      disabled={!otpCode.trim() || verifyPhoneOtpMutation.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {verifyPhoneOtpMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      Valider le code
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {updateMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
                <button
                  onClick={() => verifyIdentityMutation.mutate()}
                  type="button"
                  disabled={verifyIdentityMutation.isPending}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-[13.5px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {verifyIdentityMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {verifyIdentityMutation.isPending
                    ? "Vérification..."
                    : profile?.identityVerified
                      ? "Revérifier mon identité"
                      : "Vérifier mon identité"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-[16px] font-bold">Score de confiance</h2>
              <p className="text-[13px] text-muted-foreground">
                Calculé à partir de la complétion du profil et de votre activité.
              </p>
            </div>
          </div>

          <div className="mt-5">
            {isLoading ? (
              <FormSkeleton fields={2} />
            ) : profile === null ? (
              <EmptyState message="Aucune donnée disponible" />
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ShieldCheck className="h-7 w-7" strokeWidth={1.6} />
                  </div>
                  <div>
                    <p className="font-display text-3xl font-bold">
                      {profile.trustScore}
                      <span className="text-[14px] font-normal text-muted-foreground">/100</span>
                    </p>
                    <div className="mt-1">
                      <StatusBadge label={profile.trustScoreLabel} />
                    </div>
                  </div>
                </div>

                <ul className="space-y-4">
                  {profile.trustScoreFactors.map((factor) => (
                    <li key={factor.id}>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="truncate">{factor.label}</span>
                        <span className="font-semibold">
                          {factor.value}/{factor.max}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-accent">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-primary/60 to-primary transition-[width]"
                          style={{
                            width: `${(factor.value / factor.max) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-[16px] font-bold">Complétion du profil</h2>
              <p className="text-[13px] text-muted-foreground">
                Renseignez les champs manquants pour améliorer votre visibilité.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-display text-sm font-bold text-primary">
                  {profile?.completionPercent || 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            {profile === null ? (
              <EmptyState message="Aucune donnée disponible" />
            ) : (
              <div className="space-y-4">
                <div className="h-2 w-full rounded-full bg-accent">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-primary/60 to-primary transition-[width]"
                    style={{
                      width: `${profile.completionPercent}%`,
                    }}
                  />
                </div>
                {isProfileComplete ? (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <p className="text-[13px] font-semibold">Votre profil est complet !</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {missingFields.map((field) => (
                      <li
                        key={field.id}
                        className="flex items-center gap-2 rounded-lg border border-border p-3 text-[13px] text-muted-foreground"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                        <span>{field.label}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-[16px] font-bold">Avis reçus</h2>
              <p className="text-[13px] text-muted-foreground">
                Avis laissés par les agences avec lesquelles vous avez collaboré.
              </p>
            </div>
          </div>

          <div className="mt-5">
            {reviewsQuery.isPending ? (
              <FormSkeleton fields={2} />
            ) : reviews.length === 0 ? (
              <EmptyState message="Aucun avis reçu pour le moment" />
            ) : (
              <ul className="space-y-4">
                {reviews.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-lg border border-border/60 bg-accent/10 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          style={{ backgroundImage: seedGradient(review.agencyName || "?") }}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                        >
                          {review.agencyInitials || initialsOf(review.agencyName || "?")}
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold">
                            {review.agencyName || "Agence"}
                          </p>
                          <p className="text-[12px] text-muted-foreground">
                            {review.publishedAt
                              ? new Date(review.publishedAt).toLocaleDateString("fr-FR")
                              : ""}
                          </p>
                          {review.projectTitle ? (
                            <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">
                              Projet : {review.projectTitle}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            className={
                              index < Math.round(review.rating)
                                ? "h-4 w-4 fill-amber-400 text-amber-400"
                                : "h-4 w-4 text-muted-foreground/30"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment ? (
                      <p className="mt-3 flex items-start gap-2 text-[13px] leading-[1.5] text-muted-foreground">
                        <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{review.comment}</span>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
