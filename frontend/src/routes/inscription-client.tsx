import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Building2,
  ShieldCheck,
  Loader2,
  Sparkles,
  Send,
  Users,
  Globe,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { TextField } from "@/components/common/Blocks";
import { CountrySelect, type SelectedCountry } from "@/components/common/CountrySelect";
import { registerClient, requestEmailCode } from "@/services/auth.service";
import { ApiError } from "@/services/http";
import { useAuthStore } from "@/store/auth.store";

export const Route = createFileRoute("/inscription-client")({
  head: () => ({
    meta: [
      { title: "Inscription client | Sortlist" },
      {
        name: "description",
        content: "Créez votre compte client pour déposer vos projets sur Sortlist.",
      },
    ],
  }),
  component: ClientRegistrationPage,
});

const STEPS = [
  { id: 1, label: "Informations", icon: User },
  { id: 2, label: "Vérification", icon: ShieldCheck },
];

const registrationSchema = z.object({
  firstName: z.string().trim().min(1, "Champ requis").max(80),
  lastName: z.string().trim().min(1, "Champ requis").max(80),
  companyName: z.string().trim().max(120).optional(),
  country: z.string().trim().min(1, "Champ requis").max(80),
  phoneCountryCode: z.string().trim().min(1, "Sélectionnez d'abord un pays").max(6),
  phone: z.string().trim().min(1, "Champ requis").max(30),
  email: z.string().trim().email("E-mail invalide").max(255),
  password: z.string().trim().min(8, "Minimum 8 caractères").max(255),
  verificationCode: z.string().trim().min(4, "Code invalide").max(8),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

function ClientRegistrationPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const setStoreRole = useAuthStore((state) => state.setRole);

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      country: "",
      phoneCountryCode: "",
      phone: "",
      email: "",
      password: "",
      verificationCode: "",
    },
  });

  const email = form.watch("email");

  const handleSendCode = async () => {
    const emailValue = form.getValues("email");
    if (!emailValue) {
      toast.error("Renseignez votre email d'abord.");
      return;
    }
    try {
      await requestEmailCode(emailValue);
      setCodeSent(true);
      toast.success("Code envoyé par email.", {
        description: "Vérifiez votre boîte de réception.",
      });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Envoi du code impossible.");
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { token, user, detectedRole } = await registerClient({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        country: values.country,
        companyName: values.companyName || "",
        phone: `${values.phoneCountryCode} ${values.phone}`.trim(),
        verificationCode: values.verificationCode,
      });

      setToken(token);
      setUser(user);
      setStoreRole(detectedRole);

      toast.success("Compte client créé avec succès !");
      navigate({ to: "/client/tableau-de-bord" });
    } catch (error) {
      const errorMsg =
        error instanceof ApiError
          ? error.message
          : "Inscription impossible. Vérifiez vos informations.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  });

  const currentStepIcon = STEPS.find((s) => s.id === step)?.icon || User;
  const StepIcon = currentStepIcon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <MarketingHeader />

      <main className="mx-auto max-w-[720px] px-4 py-8 sm:px-6 lg:px-8">
        {/* En-tête modernisé */}
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
            <User className="h-7 w-7" strokeWidth={1.6} />
          </div>
          <div>
            <h1 className="font-display text-[30px] font-bold tracking-tight sm:text-[34px]">
              Inscription client
            </h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Créez votre compte pour déposer vos projets en quelques clics.
            </p>
          </div>
        </div>

        {/* Message d'erreur */}
        {errorMessage && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" strokeWidth={1.8} />
            <div>
              <p className="text-[13px] font-semibold text-red-700 dark:text-red-300">
                Erreur d'inscription
              </p>
              <p className="text-[13px] text-red-600/80 dark:text-red-400/80">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Steps modernisés */}
        <div className="mt-8">
          <div className="flex items-center gap-4">
            {STEPS.map((item, index) => (
              <div key={item.id} className="flex flex-1 items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-all ${
                      item.id <= step
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-accent text-muted-foreground"
                    }`}
                  >
                    {item.id < step ? (
                      <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                    ) : (
                      item.id
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p
                      className={`text-[12px] font-medium ${item.id <= step ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {item.label}
                    </p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 rounded-full transition-all ${
                      item.id < step ? "bg-primary" : "bg-accent"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Étape actuelle */}
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <StepIcon className="h-4 w-4" strokeWidth={1.7} />
          </div>
          <div>
            <p className="text-[12px] font-medium text-muted-foreground">Étape {step} sur 2</p>
            <p className="text-[14px] font-semibold">{STEPS.find((s) => s.id === step)?.label}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-6" noValidate>
          {/* Étape 1 - Informations */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-accent/20 p-4">
                <p className="text-[13px] text-muted-foreground">
                  Renseignez vos informations personnelles pour créer votre compte client.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Prénom"
                  placeholder="Jean"
                  error={form.formState.errors.firstName?.message}
                  {...form.register("firstName")}
                />
                <TextField
                  label="Nom"
                  placeholder="Dupont"
                  error={form.formState.errors.lastName?.message}
                  {...form.register("lastName")}
                />
                <TextField
                  label="Raison sociale (optionnel)"
                  placeholder="Ma Société SAS"
                  error={form.formState.errors.companyName?.message}
                  {...form.register("companyName")}
                />
                <CountrySelect
                  label="Pays"
                  value={form.watch("country")}
                  error={form.formState.errors.country?.message}
                  onSelect={(country: SelectedCountry) => {
                    form.setValue("country", country.name, { shouldValidate: true });
                    form.setValue("phoneCountryCode", country.dialCode, { shouldValidate: true });
                  }}
                />
                <div className="grid grid-cols-[88px_1fr] gap-2">
                  <TextField
                    label="Indicatif"
                    readOnly
                    error={form.formState.errors.phoneCountryCode?.message}
                    {...form.register("phoneCountryCode")}
                  />
                  <TextField
                    label="Téléphone"
                    placeholder="06 12 34 56 78"
                    error={form.formState.errors.phone?.message}
                    {...form.register("phone")}
                  />
                </div>
                <TextField
                  label="E-mail"
                  placeholder="contact@email.com"
                  type="email"
                  error={form.formState.errors.email?.message}
                  {...form.register("email")}
                />
              </div>
              <TextField
                label="Mot de passe"
                type="password"
                placeholder="Minimum 8 caractères"
                error={form.formState.errors.password?.message}
                {...form.register("password")}
              />
            </div>
          )}

          {/* Étape 2 - Vérification */}
          {step === 2 && (
            <div className="space-y-5">
              <div
                className={`flex items-center gap-3 rounded-lg border p-4 ${
                  codeSent
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                    : "border-primary/20 bg-primary/5"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    codeSent ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                  }`}
                >
                  {codeSent ? (
                    <Send className="h-5 w-5" strokeWidth={1.7} />
                  ) : (
                    <Mail className="h-5 w-5" strokeWidth={1.7} />
                  )}
                </div>
                <div>
                  <p
                    className={`text-[13px] font-semibold ${
                      codeSent ? "text-emerald-700 dark:text-emerald-300" : ""
                    }`}
                  >
                    {codeSent ? `Code envoyé à ${email}` : "Vérification par e-mail"}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {codeSent
                      ? "Vérifiez vos spams si vous ne l'avez pas reçu."
                      : "Un code de vérification vous sera envoyé par email."}
                  </p>
                </div>
              </div>

              <TextField
                label="Code de vérification"
                placeholder="Ex. 123456"
                error={form.formState.errors.verificationCode?.message}
                {...form.register("verificationCode")}
              />

              <button
                onClick={handleSendCode}
                type="button"
                className="text-[13.5px] font-semibold text-primary underline-offset-2 hover:underline transition-colors"
              >
                Renvoyer le code
              </button>
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              disabled={step === 1}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2.5 text-[13.5px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
              Précédent
            </button>

            {step === 1 ? (
              <button
                type="button"
                onClick={() => {
                  const fields = [
                    "firstName",
                    "lastName",
                    "country",
                    "phoneCountryCode",
                    "phone",
                    "email",
                    "password",
                  ];
                  const hasErrors = fields.some(
                    (field) => form.formState.errors[field as keyof RegistrationForm],
                  );

                  if (hasErrors) {
                    form.trigger(fields as never);
                    toast.error("Veuillez remplir tous les champs correctement.");
                    return;
                  }

                  const emailValue = form.getValues("email");
                  if (!emailValue) {
                    toast.error("Veuillez renseigner votre email.");
                    return;
                  }

                  handleSendCode();
                  setStep(2);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
              >
                Suivant
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-[13.5px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Créer mon compte client
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Lien connexion */}
        <p className="mt-8 text-center text-[13.5px] text-muted-foreground">
          Vous avez déjà un compte ?{" "}
          <Link
            to="/connexion"
            className="font-semibold text-primary underline-offset-2 hover:underline transition-colors"
          >
            Se connecter
          </Link>
        </p>
      </main>
    </div>
  );
}