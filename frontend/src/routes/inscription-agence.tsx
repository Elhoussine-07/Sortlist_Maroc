import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
  Sparkles,
  Users,
  Globe,
  Mail,
  Lock,
  Phone,
  MapPin,
  Briefcase,
  Code2,
  Languages,
  Award,
  ShieldCheck,
  Loader2,
  Clock,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { TextAreaField, TextField } from "@/components/common/Blocks";
import { CountrySelect, type SelectedCountry } from "@/components/common/CountrySelect";
import { TagSelect } from "@/components/common/TagSelect";
import { LocationPicker } from "@/components/common/LocationPicker";
import { SKILL_OPTIONS, TECH_STACK_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/agencyOptions";
import {
  registerAgency,
  verifyEmailCode,
  requestEmailCode,
  checkAgencyNameAvailability,
} from "@/services/auth.service";
import { updateAgencyProfile } from "@/services/profile.service";
import { ApiError } from "@/services/http";
import { useAuthStore } from "@/store/auth.store";

export const Route = createFileRoute("/inscription-agence")({
  head: () => ({
    meta: [
      { title: "Inscription agence | Sortlist" },
      {
        name: "description",
        content:
          "Créez le compte de votre agence : présentation, compétences, coordonnées et vérification.",
      },
      { property: "og:title", content: "Inscription agence | Sortlist" },
      {
        property: "og:description",
        content: "Rejoignez Sortlist et recevez des opportunités qualifiées.",
      },
    ],
  }),
  component: AgencyRegistrationPage,
});

const STEPS = [
  { id: 1, label: "Présentation", icon: Building2 },
  { id: 2, label: "Compétences", icon: Code2 },
  { id: 3, label: "Coordonnées", icon: MapPin },
  { id: 4, label: "Vérification", icon: ShieldCheck },
];

// Validation du nom avec minimum 2 caractères
const registrationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Le nom doit faire au moins 2 caractères")
      .max(120, "Le nom est trop long"),
    description: z.string().trim().min(1, "Champ requis").max(2000),
    foundedYear: z.string().trim().min(4, "Année invalide").max(4),
    teamSize: z.string().trim().min(1, "Champ requis").max(40),
    // BUG CORRIGÉ : `.url()` exigeait un préfixe http(s):// et `.optional()`
    // n'acceptait pas la chaîne vide "" envoyée par défaut par le formulaire
    // -> impossible de laisser le champ vide ou de saisir juste "sortlist.com".
    website: z
      .string()
      .trim()
      .max(255)
      .optional()
      .or(z.literal(""))
      .refine(
        (value) => !value || /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i.test(value),
        "Format de site web invalide (ex. sortlist.com)",
      ),
    skills: z.string().trim().min(1, "Champ requis").max(500),
    techStack: z.string().trim().min(1, "Champ requis").max(500),
    languages: z.string().trim().min(1, "Champ requis").max(200),
    location: z.string().trim().min(1, "Champ requis").max(255),
    country: z.string().trim().min(1, "Champ requis").max(120),
    address: z.string().trim().min(1, "Champ requis").max(255),
    phoneCountryCode: z.string().trim().min(1, "Sélectionnez d'abord un pays").max(6),
    phone: z.string().trim().min(1, "Champ requis").max(30),
    email: z.string().trim().email("E-mail invalide").max(255),
    legalIdValue: z.string().trim().min(1, "Champ requis").max(80),
    password: z.string().min(8, "8 caractères minimum").max(128),
    confirmPassword: z.string().min(1, "Champ requis"),
    verificationCode: z.string().trim().min(4, "Code invalide").max(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegistrationForm = z.infer<typeof registrationSchema>;

const STEP_FIELDS: Record<number, (keyof RegistrationForm)[]> = {
  1: ["name", "description", "foundedYear", "teamSize", "website"],
  2: ["skills", "techStack", "languages"],
  3: [
    "location",
    "country",
    "address",
    "phoneCountryCode",
    "phone",
    "email",
    "legalIdValue",
    "password",
    "confirmPassword",
  ],
  4: ["verificationCode"],
};

const FIELDS_BEFORE_ACCOUNT_CREATION: (keyof RegistrationForm)[] = [
  ...STEP_FIELDS[1]!,
  ...STEP_FIELDS[2]!,
  ...STEP_FIELDS[3]!,
];

// Délai avant de vérifier la disponibilité du nom d'agence pendant la saisie,
// pour ne pas envoyer une requête à chaque caractère tapé.
const NAME_CHECK_DEBOUNCE_MS = 500;

function AgencyRegistrationPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AJOUT : détection en direct d'un nom d'agence déjà pris (étape 1), pour
  // avertir tôt plutôt qu'à la toute fin des 4 étapes. Purement informatif :
  // n'envoie aucune demande de rattachement automatiquement (ça reste une
  // action volontaire, à faire depuis le compte une fois connecté).
  const [nameCheckStatus, setNameCheckStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const nameCheckIdRef = useRef(0);

  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const setStoreRole = useAuthStore((state) => state.setRole);

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      description: "",
      foundedYear: "",
      teamSize: "",
      website: "",
      skills: "",
      techStack: "",
      languages: "",
      location: "",
      country: "",
      address: "",
      phoneCountryCode: "",
      phone: "",
      email: "",
      legalIdValue: "",
      password: "",
      confirmPassword: "",
      verificationCode: "",
    },
  });

  const email = form.watch("email");
  const nameValue = form.watch("name");

  // AJOUT : vérifie la disponibilité du nom d'agence pendant la saisie
  // (debounce + protection contre les réponses obsolètes si l'utilisateur
  // continue de taper pendant qu'une requête précédente est encore en vol).
  useEffect(() => {
    const trimmed = (nameValue ?? "").trim();
    if (trimmed.length < 2) {
      setNameCheckStatus("idle");
      return;
    }
    const requestId = (nameCheckIdRef.current += 1);
    setNameCheckStatus("checking");
    const timeoutId = setTimeout(() => {
      checkAgencyNameAvailability(trimmed)
        .then((result) => {
          if (nameCheckIdRef.current === requestId) {
            setNameCheckStatus(result.available ? "available" : "taken");
          }
        })
        .catch(() => {
          if (nameCheckIdRef.current === requestId) {
            setNameCheckStatus("idle");
          }
        });
    }, NAME_CHECK_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [nameValue]);

  // AJOUT : nettoie l'erreur "nom déjà pris" posée par goToNextStep /
  // handleCreateAccount dès que l'utilisateur corrige le nom vers une valeur
  // disponible (sinon le message resterait affiché jusqu'au prochain clic).
  useEffect(() => {
    if (nameCheckStatus === "available") {
      form.clearErrors("name");
    }
  }, [nameCheckStatus, form]);

  async function goToNextStep() {
    const fieldsToValidate = STEP_FIELDS[step];
    const isStepValid = fieldsToValidate ? await form.trigger(fieldsToValidate) : true;
    if (!isStepValid) return;

    // AJOUT : bloque le passage à l'étape suivante tant que le nom d'agence
    // saisi correspond à une agence existante (ou que la vérification est
    // encore en cours, pour éviter une course où on avancerait juste avant
    // que la réponse "taken" n'arrive).
    if (step === 1 && (nameCheckStatus === "taken" || nameCheckStatus === "checking")) {
      form.setError("name", {
        message:
          nameCheckStatus === "taken"
            ? "Ce nom d'agence est déjà utilisé"
            : "Vérification du nom en cours...",
      });
      toast.error(
        nameCheckStatus === "taken"
          ? "Veuillez choisir un autre nom d'agence pour continuer."
          : "Veuillez patienter, vérification du nom en cours.",
      );
      return;
    }

    setStep((current) => Math.min(4, current + 1));
  }

  function jumpToFirstErrorStep(errors: typeof form.formState.errors) {
    const erroredFields = Object.keys(errors) as (keyof RegistrationForm)[];
    const firstErrorStep = Object.entries(STEP_FIELDS).find(([, fields]) =>
      fields.some((field) => erroredFields.includes(field)),
    )?.[0];
    if (firstErrorStep) {
      setStep(Number(firstErrorStep));
    }
    toast("Certains champs sont invalides ou manquants.", {
      description: "Vérifiez les informations saisies dans les étapes précédentes.",
    });
  }

  async function handleCreateAccount() {
    // Vérification explicite du nom avant la soumission
    const values = form.getValues();

    if (!values.name || values.name.trim().length < 2) {
      form.setError("name", { message: "Le nom de l'agence est requis (minimum 2 caractères)" });
      setStep(1);
      toast.error("Veuillez saisir le nom de l'agence");
      return;
    }

    // AJOUT : même garde-fou qu'à l'étape 1, au cas où l'utilisateur serait
    // revenu en arrière et aurait remodifié le nom sans repasser par
    // goToNextStep (ex. retour à l'étape 1 depuis l'étape 4 puis clic direct
    // sur "Créer mon compte agence" sans revalider chaque étape).
    if (nameCheckStatus === "taken" || nameCheckStatus === "checking") {
      form.setError("name", {
        message:
          nameCheckStatus === "taken"
            ? "Ce nom d'agence est déjà utilisé"
            : "Vérification du nom en cours...",
      });
      setStep(1);
      toast.error(
        nameCheckStatus === "taken"
          ? "Veuillez choisir un autre nom d'agence pour continuer."
          : "Veuillez patienter, vérification du nom en cours.",
      );
      return;
    }

    const isValid = await form.trigger(FIELDS_BEFORE_ACCOUNT_CREATION);
    if (!isValid) {
      jumpToFirstErrorStep(form.formState.errors);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await registerAgency({
        email: values.email,
        password: values.password,
        agency_name: values.name.trim(),
        country: values.country,
        description: values.description,
        phone: `${values.phoneCountryCode} ${values.phone}`.trim(),
        website: values.website || "",
      });

      // Vérifier si l'agence existe déjà
      if (
        result &&
        typeof result === "object" &&
        "duplicateAgency" in result &&
        result.duplicateAgency
      ) {
        setPendingApproval(true);
        return;
      }

      setAccountCreated(true);
      toast.success("Compte créé.", {
        description: "Un code de vérification vient d'être envoyé à votre adresse e-mail.",
      });
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
  }

  async function handleVerifyCode() {
    const isValid = await form.trigger("verificationCode");
    if (!isValid) return;

    const values = form.getValues();
    setIsSubmitting(true);
    try {
      const { token, user, detectedRole } = await verifyEmailCode(
        values.email,
        values.verificationCode,
        "agency",
      );
      setToken(token);
      setUser(user);
      setStoreRole(detectedRole);

      try {
        await updateAgencyProfile({
          foundedYear: values.foundedYear,
          teamSize: values.teamSize,
          languages: values.languages
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          // BUG CORRIGÉ : `skills`/`techStack` sont saisis à l'étape 2
          // (TagSelect) mais n'étaient jamais envoyés au backend — le
          // profil public affichait donc toujours "Non renseigné" pour
          // "Compétences"/"Technologies", même après une inscription
          // complète.
          skills: values.skills
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          techStack: values.techStack
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          location: values.location,
          legalIdValue: values.legalIdValue,
        });
      } catch {
        toast.warning(
          "Compte créé, mais certaines informations de profil n'ont pas pu être enregistrées.",
        );
      }

      toast.success("Compte agence créé avec succès !");
      navigate({ to: "/agence/tableau-de-bord" });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Code invalide ou expiré.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    try {
      await requestEmailCode(email);
      toast.success("Code renvoyé.", { description: "Vérifiez votre boîte de réception." });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Envoi du code impossible.");
    }
  }

  if (pendingApproval) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingHeader />
        <main className="mx-auto flex max-w-[560px] flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <Clock className="h-10 w-10" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 text-[28px] font-bold tracking-tight">Demande en cours</h1>
          <p className="mt-3 text-[14px] leading-[1.6] text-muted-foreground">
            Une agence portant un nom proche existe déjà sur Sortlist. Votre demande de rattachement
            a été transmise au propriétaire de cette agence — vous recevrez un e-mail dès qu'elle
            sera validée.
          </p>
          <Link
            to="/connexion"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
          >
            Retour à la connexion
          </Link>
        </main>
      </div>
    );
  }

  const currentStepIcon = STEPS.find((s) => s.id === step)?.icon || Building2;
  const StepIcon = currentStepIcon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <MarketingHeader />

      <main className="mx-auto max-w-[720px] px-4 py-8 sm:px-6 lg:px-8">
        {/* En-tête modernisé */}
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
            <Building2 className="h-7 w-7" strokeWidth={1.6} />
          </div>
          <div>
            <h1 className="font-display text-[30px] font-bold tracking-tight sm:text-[34px]">
              Inscription agence
            </h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Rejoignez Sortlist et recevez des opportunités qualifiées.
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

        {/* Steps avancés modernisés */}
        <div className="mt-8">
          <div className="flex items-center gap-2">
            {STEPS.map((item, index) => (
              <div key={item.id} className="flex flex-1 items-center gap-2">
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

        {/* Étape actuelle avec icône */}
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <StepIcon className="h-4 w-4" strokeWidth={1.7} />
          </div>
          <div>
            <p className="text-[12px] font-medium text-muted-foreground">Étape {step} sur 4</p>
            <p className="text-[14px] font-semibold">{STEPS.find((s) => s.id === step)?.label}</p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="mt-6 space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <TextField
                    label="Nom de l'agence"
                    placeholder="Ex. Agence Digitale"
                    error={form.formState.errors.name?.message}
                    {...form.register("name", {
                      required: "Le nom de l'agence est requis",
                      minLength: { value: 2, message: "Minimum 2 caractères" },
                    })}
                  />
                  {/* AJOUT : message "agence déjà existante" — gros titre +
                      petit texte explicatif, purement informatif (aucune
                      demande envoyée depuis cet écran). */}
                  {nameCheckStatus === "taken" ? (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                      <p className="flex items-center gap-1.5 text-[14px] font-bold text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
                        Cette agence existe déjà
                      </p>
                      <p className="mt-1 text-[11.5px] leading-[1.5] text-amber-700/80 dark:text-amber-400/80">
                        Si vous faites partie de cette agence, vous pourrez envoyer une demande de
                        rattachement depuis votre compte (menu « Rejoindre une agence ») une fois
                        connecté, plutôt que de créer un nouveau profil.
                      </p>
                    </div>
                  ) : nameCheckStatus === "checking" ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">Vérification...</p>
                  ) : (
                    nameValue &&
                    nameValue.length > 0 && (
                      <p className="mt-1 text-[11px] text-emerald-600">
                        ✓ {nameValue.length} caractères
                      </p>
                    )
                  )}
                </div>
                <TextField
                  label="Année de création"
                  placeholder="Ex. 2020"
                  error={form.formState.errors.foundedYear?.message}
                  {...form.register("foundedYear")}
                />
                <TextField
                  label="Taille de l'équipe"
                  placeholder="Ex. 12"
                  error={form.formState.errors.teamSize?.message}
                  {...form.register("teamSize")}
                />
                <TextField
                  label="Site web (optionnel)"
                  placeholder="Ex. sortlist.com"
                  error={form.formState.errors.website?.message}
                  {...form.register("website")}
                />
              </div>
              <TextAreaField
                label="Description de l'agence"
                rows={5}
                placeholder="Présentez votre agence, vos valeurs et votre expertise..."
                error={form.formState.errors.description?.message}
                {...form.register("description")}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-accent/20 p-4">
                <p className="text-[13px] text-muted-foreground">
                  Renseignez vos compétences et technologies pour être mieux matché avec les
                  projets.
                </p>
              </div>
              {/* AJOUT : remplace les 3 zones de texte libre par des
                  TagSelect (recherche + sélection multiple + ajout libre si
                  la valeur n'est pas dans la liste). Le format de données
                  reste une chaîne "a, b, c", donc le schéma Zod et le code
                  de soumission (ex. languages.split(",") dans
                  handleVerifyCode) n'ont pas besoin de changer. */}
              <TagSelect
                label="Compétences"
                value={form.watch("skills")}
                onChange={(next) => form.setValue("skills", next, { shouldValidate: true })}
                options={SKILL_OPTIONS}
                placeholder="Rechercher ou ajouter une compétence..."
                error={form.formState.errors.skills?.message}
              />
              <TagSelect
                label="Technologies"
                value={form.watch("techStack")}
                onChange={(next) => form.setValue("techStack", next, { shouldValidate: true })}
                options={TECH_STACK_OPTIONS}
                placeholder="Rechercher ou ajouter une technologie..."
                error={form.formState.errors.techStack?.message}
              />
              <TagSelect
                label="Langues de travail"
                value={form.watch("languages")}
                onChange={(next) => form.setValue("languages", next, { shouldValidate: true })}
                options={LANGUAGE_OPTIONS}
                placeholder="Rechercher une langue..."
                error={form.formState.errors.languages?.message}
                allowCustom={false}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-accent/20 p-4">
                <p className="text-[13px] text-muted-foreground">
                  Ces informations permettront aux clients de vous contacter facilement.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <LocationPicker
                  label="Localisation"
                  value={form.watch("location")}
                  onChange={(next) => form.setValue("location", next, { shouldValidate: true })}
                  error={form.formState.errors.location?.message}
                  placeholder="Ex. Paris"
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
                <TextField
                  label="Adresse"
                  placeholder="Ex. 123 Rue de la Paix"
                  error={form.formState.errors.address?.message}
                  {...form.register("address")}
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
                    placeholder="Ex. 06 12 34 56 78"
                    error={form.formState.errors.phone?.message}
                    {...form.register("phone")}
                  />
                </div>
                <TextField
                  label="E-mail professionnel"
                  placeholder="contact@agence.com"
                  type="email"
                  error={form.formState.errors.email?.message}
                  {...form.register("email")}
                />
                <TextField
                  label="Identifiant légal"
                  placeholder="Ex. SIRET 123456789"
                  error={form.formState.errors.legalIdValue?.message}
                  {...form.register("legalIdValue")}
                />
                <TextField
                  label="Mot de passe"
                  type="password"
                  placeholder="Min. 8 caractères"
                  error={form.formState.errors.password?.message}
                  {...form.register("password")}
                />
                <TextField
                  label="Confirmer le mot de passe"
                  type="password"
                  placeholder="Répétez le mot de passe"
                  error={form.formState.errors.confirmPassword?.message}
                  {...form.register("confirmPassword")}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-accent/20 p-4">
                <p className="text-[13px] text-muted-foreground">
                  {accountCreated
                    ? "Un code de vérification a été envoyé à votre adresse e-mail. Saisissez-le ci-dessous pour finaliser votre inscription."
                    : "Vérifiez les informations saisies puis cliquez sur 'Créer mon compte agence' pour recevoir un code de vérification par e-mail."}
                </p>
              </div>
              {accountCreated ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} />
                    <div>
                      <p className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">
                        Code envoyé à {email}
                      </p>
                      <p className="text-[12px] text-emerald-600/70 dark:text-emerald-400/70">
                        Vérifiez vos spams si vous ne l'avez pas reçu.
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
                    onClick={handleResendCode}
                    type="button"
                    className="text-[13.5px] font-semibold text-primary underline-offset-2 hover:underline transition-colors"
                  >
                    Renvoyer le code
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold">Vérification par e-mail</p>
                    <p className="text-[12px] text-muted-foreground">
                      Un code vous sera envoyé après la création du compte.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              disabled={step === 1 || (step === 4 && accountCreated)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2.5 text-[13.5px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
              Précédent
            </button>

            <div className="flex items-center gap-2">
              {step < 4 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={
                    step === 1 && (nameCheckStatus === "taken" || nameCheckStatus === "checking")
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40 disabled:hover:shadow-sm"
                >
                  Suivant
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={accountCreated ? handleVerifyCode : handleCreateAccount}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-[13.5px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Veuillez patienter...
                    </>
                  ) : accountCreated ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Valider et terminer
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Créer mon compte agence
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

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
