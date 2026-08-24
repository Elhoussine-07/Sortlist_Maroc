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

/**
 * BUG CORRIGÉ : `client.get_profile` ne renvoie jamais de `missing_fields`
 * (absent de `clientprofile.py`/`client.py`, qui ne calculent qu'un
 * pourcentage `profile_completion`) — `profile.missingFields` retombait
 * donc toujours sur `[]` côté frontend, faisant afficher "Votre profil est
 * complet !" quel que soit le vrai taux de complétion. On recalcule la
 * liste ici à partir des mêmes champs que `_calculate_profile_completion`
 * (clientprofile.py), plutôt que de se fier à ce champ jamais peuplé.
 */
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
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["client", "profile"],
    queryFn: getClientProfile,
  });
  const profile = profileQuery.data ?? null;
  const isLoading = profileQuery.isPending;

  /**
   * AJOUTÉ : côté client, rien n'affichait les avis laissés par les agences
   * (`ClientReview`, cf. `opportunity.py::review_client`) — le formulaire
   * agence existait mais aucune vue ne consommait `review.list_client_reviews`
   * (nouvel endpoint, symétrique de `list_agency_reviews`).
   */
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
      toast.success("Profil mis à jour avec succès");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Impossible d'enregistrer le profil.",
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
