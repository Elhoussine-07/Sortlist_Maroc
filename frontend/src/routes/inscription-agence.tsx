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
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

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

const NAME_CHECK_DEBOUNCE_MS = 500;

const PAGE_TEXT = {
  "Présentation": { en: "Overview", ar: "نظرة عامة", es: "Presentación" },
  "Compétences": { en: "Skills", ar: "المهارات", es: "Habilidades" },
  "Coordonnées": { en: "Contact details", ar: "بيانات الاتصال", es: "Datos de contacto" },
  "Vérification": { en: "Verification", ar: "التحقق", es: "Verificación" },
  "Ce nom d'agence est déjà utilisé": {
    en: "This agency name is already in use",
    ar: "اسم الوكالة هذا مستخدم بالفعل",
    es: "Este nombre de agencia ya está en uso",
  },
  "Vérification du nom en cours...": {
    en: "Checking name availability...",
    ar: "جارٍ التحقق من الاسم...",
    es: "Comprobando el nombre...",
  },
  "Veuillez choisir un autre nom d'agence pour continuer.": {
    en: "Please choose a different agency name to continue.",
    ar: "يرجى اختيار اسم وكالة آخر للمتابعة.",
    es: "Por favor, elige otro nombre de agencia para continuar.",
  },
  "Veuillez patienter, vérification du nom en cours.": {
    en: "Please wait, we're checking the name.",
    ar: "يرجى الانتظار، جارٍ التحقق من الاسم.",
    es: "Por favor, espera, estamos comprobando el nombre.",
  },
  "Certains champs sont invalides ou manquants.": {
    en: "Some fields are invalid or missing.",
    ar: "بعض الحقول غير صالحة أو ناقصة.",
    es: "Algunos campos no son válidos o faltan.",
  },
  "Vérifiez les informations saisies dans les étapes précédentes.": {
    en: "Check the information entered in the previous steps.",
    ar: "تحقق من المعلومات المدخلة في الخطوات السابقة.",
    es: "Revisa la información introducida en los pasos anteriores.",
  },
  "Le nom de l'agence est requis (minimum 2 caractères)": {
    en: "Agency name is required (minimum 2 characters)",
    ar: "اسم الوكالة مطلوب (حرفان على الأقل)",
    es: "El nombre de la agencia es obligatorio (mínimo 2 caracteres)",
  },
  "Veuillez saisir le nom de l'agence": {
    en: "Please enter the agency name",
    ar: "يرجى إدخال اسم الوكالة",
    es: "Introduce el nombre de la agencia",
  },
  "Compte créé.": { en: "Account created.", ar: "تم إنشاء الحساب.", es: "Cuenta creada." },
  "Un code de vérification vient d'être envoyé à votre adresse e-mail.": {
    en: "A verification code has just been sent to your email address.",
    ar: "تم للتو إرسال رمز تحقق إلى عنوان بريدك الإلكتروني.",
    es: "Se acaba de enviar un código de verificación a tu dirección de correo electrónico.",
  },
  "Inscription impossible. Vérifiez vos informations.": {
    en: "Registration failed. Please check your information.",
    ar: "تعذّر التسجيل. يرجى التحقق من معلوماتك.",
    es: "No se pudo completar el registro. Comprueba tu información.",
  },
  "Compte créé, mais certaines informations de profil n'ont pas pu être enregistrées.": {
    en: "Account created, but some profile information could not be saved.",
    ar: "تم إنشاء الحساب، لكن تعذّر حفظ بعض معلومات الملف الشخصي.",
    es: "Cuenta creada, pero no se pudo guardar parte de la información del perfil.",
  },
  "Compte agence créé avec succès !": {
    en: "Agency account created successfully!",
    ar: "تم إنشاء حساب الوكالة بنجاح!",
    es: "¡Cuenta de agencia creada con éxito!",
  },
  "Code invalide ou expiré.": {
    en: "Invalid or expired code.",
    ar: "الرمز غير صالح أو منتهي الصلاحية.",
    es: "Código no válido o caducado.",
  },
  "Code renvoyé.": { en: "Code resent.", ar: "تم إعادة إرسال الرمز.", es: "Código reenviado." },
  "Vérifiez votre boîte de réception.": {
    en: "Check your inbox.",
    ar: "تحقق من صندوق الوارد الخاص بك.",
    es: "Revisa tu bandeja de entrada.",
  },
  "Envoi du code impossible.": {
    en: "Could not send the code.",
    ar: "تعذّر إرسال الرمز.",
    es: "No se pudo enviar el código.",
  },
  "Demande en cours": {
    en: "Request in progress",
    ar: "الطلب قيد المعالجة",
    es: "Solicitud en curso",
  },
  "Une agence portant un nom proche existe déjà sur Sortlist. Votre demande de rattachement a été transmise au propriétaire de cette agence — vous recevrez un e-mail dès qu'elle sera validée.":
    {
      en: "An agency with a similar name already exists on Sortlist. Your request to join has been sent to that agency's owner — you'll receive an email as soon as it's approved.",
      ar: "توجد بالفعل وكالة باسم مشابه على Sortlist. تم إرسال طلب الانضمام إلى مالك تلك الوكالة — ستتلقى بريدًا إلكترونيًا بمجرد الموافقة عليه.",
      es: "Ya existe una agencia con un nombre similar en Sortlist. Tu solicitud de vinculación se ha enviado al propietario de esa agencia; recibirás un correo en cuanto sea aprobada.",
    },
  "Retour à la connexion": {
    en: "Back to login",
    ar: "العودة إلى تسجيل الدخول",
    es: "Volver al inicio de sesión",
  },
  "Inscription agence": {
    en: "Agency registration",
    ar: "تسجيل الوكالة",
    es: "Registro de agencia",
  },
  "Rejoignez Sortlist et recevez des opportunités qualifiées.": {
    en: "Join Sortlist and start receiving qualified opportunities.",
    ar: "انضم إلى Sortlist واحصل على فرص مؤهلة.",
    es: "Únete a Sortlist y recibe oportunidades cualificadas.",
  },
  "Erreur d'inscription": { en: "Registration error", ar: "خطأ في التسجيل", es: "Error de registro" },
  "Étape": { en: "Step", ar: "الخطوة", es: "Paso" },
  "sur 4": { en: "of 4", ar: "من 4", es: "de 4" },
  "Nom de l'agence": { en: "Agency name", ar: "اسم الوكالة", es: "Nombre de la agencia" },
  "Le nom de l'agence est requis": {
    en: "Agency name is required",
    ar: "اسم الوكالة مطلوب",
    es: "El nombre de la agencia es obligatorio",
  },
  "Minimum 2 caractères": {
    en: "Minimum 2 characters",
    ar: "حرفان على الأقل",
    es: "Mínimo 2 caracteres",
  },
  "Ex. Agence Digitale": {
    en: "e.g. Digital Agency",
    ar: "مثال: وكالة رقمية",
    es: "Ej. Agencia Digital",
  },
  "Cette agence existe déjà": {
    en: "This agency already exists",
    ar: "هذه الوكالة موجودة بالفعل",
    es: "Esta agencia ya existe",
  },
  "Si vous faites partie de cette agence, vous pourrez envoyer une demande de rattachement depuis votre compte (menu « Rejoindre une agence ») une fois connecté, plutôt que de créer un nouveau profil.":
    {
      en: 'If you\'re part of this agency, you\'ll be able to send a request to join it from your account (the "Join an agency" menu) once logged in, instead of creating a new profile.',
      ar: "إذا كنت جزءًا من هذه الوكالة، يمكنك إرسال طلب انضمام إليها من حسابك (قائمة «الانضمام إلى وكالة») بعد تسجيل الدخول، بدلاً من إنشاء ملف شخصي جديد.",
      es: "Si formas parte de esta agencia, podrás enviar una solicitud de vinculación desde tu cuenta (menú «Unirse a una agencia») una vez que inicies sesión, en lugar de crear un nuevo perfil.",
    },
  "Vérification...": { en: "Checking...", ar: "جارٍ التحقق...", es: "Comprobando..." },
  "caractères": { en: "characters", ar: "حرفًا", es: "caracteres" },
  "Année de création": { en: "Year founded", ar: "سنة التأسيس", es: "Año de fundación" },
  "Ex. 2020": { en: "e.g. 2020", ar: "مثال: 2020", es: "Ej. 2020" },
  "Taille de l'équipe": { en: "Team size", ar: "حجم الفريق", es: "Tamaño del equipo" },
  "Ex. 12": { en: "e.g. 12", ar: "مثال: 12", es: "Ej. 12" },
  "Site web (optionnel)": {
    en: "Website (optional)",
    ar: "الموقع الإلكتروني (اختياري)",
    es: "Sitio web (opcional)",
  },
  "Ex. sortlist.com": {
    en: "e.g. sortlist.com",
    ar: "مثال: sortlist.com",
    es: "Ej. sortlist.com",
  },
  "Description de l'agence": {
    en: "Agency description",
    ar: "وصف الوكالة",
    es: "Descripción de la agencia",
  },
  "Présentez votre agence, vos valeurs et votre expertise...": {
    en: "Introduce your agency, your values and your expertise...",
    ar: "قدّم وكالتك وقيمها وخبراتها...",
    es: "Presenta tu agencia, tus valores y tu experiencia...",
  },
  "Renseignez vos compétences et technologies pour être mieux matché avec les projets.": {
    en: "Add your skills and technologies to get better matched with projects.",
    ar: "أدخل مهاراتك وتقنياتك لتحصل على مطابقة أفضل مع المشاريع.",
    es: "Indica tus habilidades y tecnologías para encontrar mejores coincidencias con proyectos.",
  },
  "Rechercher ou ajouter une compétence...": {
    en: "Search or add a skill...",
    ar: "ابحث عن مهارة أو أضفها...",
    es: "Buscar o añadir una habilidad...",
  },
  "Technologies": { en: "Technologies", ar: "التقنيات", es: "Tecnologías" },
  "Rechercher ou ajouter une technologie...": {
    en: "Search or add a technology...",
    ar: "ابحث عن تقنية أو أضفها...",
    es: "Buscar o añadir una tecnología...",
  },
  "Langues de travail": { en: "Working languages", ar: "لغات العمل", es: "Idiomas de trabajo" },
  "Rechercher une langue...": {
    en: "Search for a language...",
    ar: "ابحث عن لغة...",
    es: "Buscar un idioma...",
  },
  "Ces informations permettront aux clients de vous contacter facilement.": {
    en: "This information will make it easy for clients to reach you.",
    ar: "ستتيح هذه المعلومات للعملاء التواصل معك بسهولة.",
    es: "Esta información permitirá a los clientes contactarte fácilmente.",
  },
  "Localisation": { en: "Location", ar: "الموقع", es: "Ubicación" },
  "Ex. Paris": { en: "e.g. Paris", ar: "مثال: باريس", es: "Ej. París" },
  "Pays": { en: "Country", ar: "البلد", es: "País" },
  "Adresse": { en: "Address", ar: "العنوان", es: "Dirección" },
  "Ex. 123 Rue de la Paix": {
    en: "e.g. 123 Peace Street",
    ar: "مثال: 123 شارع السلام",
    es: "Ej. Calle de la Paz 123",
  },
  "Indicatif": { en: "Dial code", ar: "رمز الاتصال", es: "Prefijo" },
  "Téléphone": { en: "Phone", ar: "الهاتف", es: "Teléfono" },
  "Ex. 06 12 34 56 78": {
    en: "e.g. 06 12 34 56 78",
    ar: "مثال: 06 12 34 56 78",
    es: "Ej. 06 12 34 56 78",
  },
  "E-mail professionnel": {
    en: "Business email",
    ar: "البريد الإلكتروني المهني",
    es: "Correo profesional",
  },
  "Identifiant légal": { en: "Legal ID", ar: "المعرّف القانوني", es: "Identificador legal" },
  "Ex. SIRET 123456789": {
    en: "e.g. Company ID 123456789",
    ar: "مثال: رقم السجل 123456789",
    es: "Ej. NIF 123456789",
  },
  "Mot de passe": { en: "Password", ar: "كلمة المرور", es: "Contraseña" },
  "Min. 8 caractères": { en: "Min. 8 characters", ar: "8 أحرف على الأقل", es: "Mín. 8 caracteres" },
  "Confirmer le mot de passe": {
    en: "Confirm password",
    ar: "تأكيد كلمة المرور",
    es: "Confirmar contraseña",
  },
  "Répétez le mot de passe": {
    en: "Repeat the password",
    ar: "أعد إدخال كلمة المرور",
    es: "Repite la contraseña",
  },
  "Un code de vérification a été envoyé à votre adresse e-mail. Saisissez-le ci-dessous pour finaliser votre inscription.":
    {
      en: "A verification code has been sent to your email address. Enter it below to complete your registration.",
      ar: "تم إرسال رمز تحقق إلى عنوان بريدك الإلكتروني. أدخله أدناه لإتمام تسجيلك.",
      es: "Se ha enviado un código de verificación a tu dirección de correo electrónico. Introdúcelo a continuación para completar tu registro.",
    },
  "Vérifiez les informations saisies puis cliquez sur 'Créer mon compte agence' pour recevoir un code de vérification par e-mail.":
    {
      en: 'Review the information you entered, then click "Create my agency account" to receive a verification code by email.',
      ar: "تحقق من المعلومات المدخلة ثم انقر على «إنشاء حساب وكالتي» لتلقي رمز تحقق عبر البريد الإلكتروني.",
      es: "Revisa la información introducida y haz clic en «Crear mi cuenta de agencia» para recibir un código de verificación por correo electrónico.",
    },
  "Code envoyé à": { en: "Code sent to", ar: "تم إرسال الرمز إلى", es: "Código enviado a" },
  "Vérifiez vos spams si vous ne l'avez pas reçu.": {
    en: "Check your spam folder if you haven't received it.",
    ar: "تحقق من مجلد الرسائل غير المرغوب فيها إذا لم تستلمه.",
    es: "Revisa tu carpeta de spam si no lo has recibido.",
  },
  "Code de vérification": { en: "Verification code", ar: "رمز التحقق", es: "Código de verificación" },
  "Ex. 123456": { en: "e.g. 123456", ar: "مثال: 123456", es: "Ej. 123456" },
  "Renvoyer le code": { en: "Resend code", ar: "إعادة إرسال الرمز", es: "Reenviar código" },
  "Vérification par e-mail": {
    en: "Email verification",
    ar: "التحقق عبر البريد الإلكتروني",
    es: "Verificación por correo electrónico",
  },
  "Un code vous sera envoyé après la création du compte.": {
    en: "A code will be sent to you after the account is created.",
    ar: "سيُرسل إليك رمز بعد إنشاء الحساب.",
    es: "Se te enviará un código después de crear la cuenta.",
  },
  "Précédent": { en: "Previous", ar: "السابق", es: "Anterior" },
  "Suivant": { en: "Next", ar: "التالي", es: "Siguiente" },
  "Veuillez patienter...": { en: "Please wait...", ar: "يرجى الانتظار...", es: "Espera, por favor..." },
  "Valider et terminer": { en: "Confirm and finish", ar: "تأكيد وإنهاء", es: "Confirmar y finalizar" },
  "Créer mon compte agence": {
    en: "Create my agency account",
    ar: "إنشاء حساب وكالتي",
    es: "Crear mi cuenta de agencia",
  },
  "Vous avez déjà un compte ?": {
    en: "Already have an account?",
    ar: "هل لديك حساب بالفعل؟",
    es: "¿Ya tienes una cuenta?",
  },
  "Se connecter": { en: "Log in", ar: "تسجيل الدخول", es: "Iniciar sesión" },
} satisfies PageTextDict;

function AgencyRegistrationPage() {
  const { tt } = usePageText(PAGE_TEXT);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (nameCheckStatus === "available") {
      form.clearErrors("name");
    }
  }, [nameCheckStatus, form]);

  async function goToNextStep() {
    const fieldsToValidate = STEP_FIELDS[step];
    const isStepValid = fieldsToValidate ? await form.trigger(fieldsToValidate) : true;
    if (!isStepValid) return;

    if (step === 1 && (nameCheckStatus === "taken" || nameCheckStatus === "checking")) {
      form.setError("name", {
        message:
          nameCheckStatus === "taken"
            ? tt("Ce nom d'agence est déjà utilisé")
            : tt("Vérification du nom en cours..."),
      });
      toast.error(
        nameCheckStatus === "taken"
          ? tt("Veuillez choisir un autre nom d'agence pour continuer.")
          : tt("Veuillez patienter, vérification du nom en cours."),
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
    toast(tt("Certains champs sont invalides ou manquants."), {
      description: tt("Vérifiez les informations saisies dans les étapes précédentes."),
    });
  }

  async function handleCreateAccount() {
    const values = form.getValues();

    if (!values.name || values.name.trim().length < 2) {
      form.setError("name", {
        message: tt("Le nom de l'agence est requis (minimum 2 caractères)"),
      });
      setStep(1);
      toast.error(tt("Veuillez saisir le nom de l'agence"));
      return;
    }

    if (nameCheckStatus === "taken" || nameCheckStatus === "checking") {
      form.setError("name", {
        message:
          nameCheckStatus === "taken"
            ? tt("Ce nom d'agence est déjà utilisé")
            : tt("Vérification du nom en cours..."),
      });
      setStep(1);
      toast.error(
        nameCheckStatus === "taken"
          ? tt("Veuillez choisir un autre nom d'agence pour continuer.")
          : tt("Veuillez patienter, vérification du nom en cours."),
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
      toast.success(tt("Compte créé."), {
        description: tt("Un code de vérification vient d'être envoyé à votre adresse e-mail."),
      });
    } catch (error) {
      const errorMsg =
        error instanceof ApiError
          ? error.message
          : tt("Inscription impossible. Vérifiez vos informations.");
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
          tt("Compte créé, mais certaines informations de profil n'ont pas pu être enregistrées."),
        );
      }

      toast.success(tt("Compte agence créé avec succès !"));
      navigate({ to: "/agence/tableau-de-bord" });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : tt("Code invalide ou expiré."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    try {
      await requestEmailCode(email);
      toast.success(tt("Code renvoyé."), { description: tt("Vérifiez votre boîte de réception.") });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : tt("Envoi du code impossible."));
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
          <h1 className="mt-6 text-[28px] font-bold tracking-tight">{tt("Demande en cours")}</h1>
          <p className="mt-3 text-[14px] leading-[1.6] text-muted-foreground">
            {tt(
              "Une agence portant un nom proche existe déjà sur Sortlist. Votre demande de rattachement a été transmise au propriétaire de cette agence — vous recevrez un e-mail dès qu'elle sera validée.",
            )}
          </p>
          <Link
            to="/connexion"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
          >
            {tt("Retour à la connexion")}
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
              {tt("Inscription agence")}
            </h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {tt("Rejoignez Sortlist et recevez des opportunités qualifiées.")}
            </p>
          </div>
        </div>

        {/* Message d'erreur */}
        {errorMessage && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" strokeWidth={1.8} />
            <div>
              <p className="text-[13px] font-semibold text-red-700 dark:text-red-300">
                {tt("Erreur d'inscription")}
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
                      {tt(item.label)}
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
            <p className="text-[12px] font-medium text-muted-foreground">
              {tt("Étape")} {step} {tt("sur 4")}
            </p>
            <p className="text-[14px] font-semibold">
              {tt(STEPS.find((s) => s.id === step)?.label ?? "")}
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="mt-6 space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <TextField
                    label={tt("Nom de l'agence")}
                    placeholder={tt("Ex. Agence Digitale")}
                    error={form.formState.errors.name?.message}
                    {...form.register("name", {
                      required: tt("Le nom de l'agence est requis"),
                      minLength: { value: 2, message: tt("Minimum 2 caractères") },
                    })}
                  />
                  {/* AJOUT : message "agence déjà existante" — gros titre +
                      petit texte explicatif, purement informatif (aucune
                      demande envoyée depuis cet écran). */}
                  {nameCheckStatus === "taken" ? (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                      <p className="flex items-center gap-1.5 text-[14px] font-bold text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
                        {tt("Cette agence existe déjà")}
                      </p>
                      <p className="mt-1 text-[11.5px] leading-[1.5] text-amber-700/80 dark:text-amber-400/80">
                        {tt(
                          "Si vous faites partie de cette agence, vous pourrez envoyer une demande de rattachement depuis votre compte (menu « Rejoindre une agence ») une fois connecté, plutôt que de créer un nouveau profil.",
                        )}
                      </p>
                    </div>
                  ) : nameCheckStatus === "checking" ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">{tt("Vérification...")}</p>
                  ) : (
                    nameValue &&
                    nameValue.length > 0 && (
                      <p className="mt-1 text-[11px] text-emerald-600">
                        ✓ {nameValue.length} {tt("caractères")}
                      </p>
                    )
                  )}
                </div>
                <TextField
                  label={tt("Année de création")}
                  placeholder={tt("Ex. 2020")}
                  error={form.formState.errors.foundedYear?.message}
                  {...form.register("foundedYear")}
                />
                <TextField
                  label={tt("Taille de l'équipe")}
                  placeholder={tt("Ex. 12")}
                  error={form.formState.errors.teamSize?.message}
                  {...form.register("teamSize")}
                />
                <TextField
                  label={tt("Site web (optionnel)")}
                  placeholder={tt("Ex. sortlist.com")}
                  error={form.formState.errors.website?.message}
                  {...form.register("website")}
                />
              </div>
              <TextAreaField
                label={tt("Description de l'agence")}
                rows={5}
                placeholder={tt("Présentez votre agence, vos valeurs et votre expertise...")}
                error={form.formState.errors.description?.message}
                {...form.register("description")}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-accent/20 p-4">
                <p className="text-[13px] text-muted-foreground">
                  {tt(
                    "Renseignez vos compétences et technologies pour être mieux matché avec les projets.",
                  )}
                </p>
              </div>
              {/* AJOUT : remplace les 3 zones de texte libre par des
                  TagSelect (recherche + sélection multiple + ajout libre si
                  la valeur n'est pas dans la liste). Le format de données
                  reste une chaîne "a, b, c", donc le schéma Zod et le code
                  de soumission (ex. languages.split(",") dans
                  handleVerifyCode) n'ont pas besoin de changer. */}
              <TagSelect
                label={tt("Compétences")}
                value={form.watch("skills")}
                onChange={(next) => form.setValue("skills", next, { shouldValidate: true })}
                options={SKILL_OPTIONS}
                placeholder={tt("Rechercher ou ajouter une compétence...")}
                error={form.formState.errors.skills?.message}
              />
              <TagSelect
                label={tt("Technologies")}
                value={form.watch("techStack")}
                onChange={(next) => form.setValue("techStack", next, { shouldValidate: true })}
                options={TECH_STACK_OPTIONS}
                placeholder={tt("Rechercher ou ajouter une technologie...")}
                error={form.formState.errors.techStack?.message}
              />
              <TagSelect
                label={tt("Langues de travail")}
                value={form.watch("languages")}
                onChange={(next) => form.setValue("languages", next, { shouldValidate: true })}
                options={LANGUAGE_OPTIONS}
                placeholder={tt("Rechercher une langue...")}
                error={form.formState.errors.languages?.message}
                allowCustom={false}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-accent/20 p-4">
                <p className="text-[13px] text-muted-foreground">
                  {tt("Ces informations permettront aux clients de vous contacter facilement.")}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <LocationPicker
                  label={tt("Localisation")}
                  value={form.watch("location")}
                  onChange={(next) => form.setValue("location", next, { shouldValidate: true })}
                  error={form.formState.errors.location?.message}
                  placeholder={tt("Ex. Paris")}
                />
                <CountrySelect
                  label={tt("Pays")}
                  value={form.watch("country")}
                  error={form.formState.errors.country?.message}
                  onSelect={(country: SelectedCountry) => {
                    form.setValue("country", country.name, { shouldValidate: true });
                    form.setValue("phoneCountryCode", country.dialCode, { shouldValidate: true });
                  }}
                />
                <TextField
                  label={tt("Adresse")}
                  placeholder={tt("Ex. 123 Rue de la Paix")}
                  error={form.formState.errors.address?.message}
                  {...form.register("address")}
                />
                <div className="grid grid-cols-[88px_1fr] gap-2">
                  <TextField
                    label={tt("Indicatif")}
                    readOnly
                    error={form.formState.errors.phoneCountryCode?.message}
                    {...form.register("phoneCountryCode")}
                  />
                  <TextField
                    label={tt("Téléphone")}
                    placeholder={tt("Ex. 06 12 34 56 78")}
                    error={form.formState.errors.phone?.message}
                    {...form.register("phone")}
                  />
                </div>
                <TextField
                  label={tt("E-mail professionnel")}
                  placeholder="contact@agence.com"
                  type="email"
                  error={form.formState.errors.email?.message}
                  {...form.register("email")}
                />
                <TextField
                  label={tt("Identifiant légal")}
                  placeholder={tt("Ex. SIRET 123456789")}
                  error={form.formState.errors.legalIdValue?.message}
                  {...form.register("legalIdValue")}
                />
                <TextField
                  label={tt("Mot de passe")}
                  type="password"
                  placeholder={tt("Min. 8 caractères")}
                  error={form.formState.errors.password?.message}
                  {...form.register("password")}
                />
                <TextField
                  label={tt("Confirmer le mot de passe")}
                  type="password"
                  placeholder={tt("Répétez le mot de passe")}
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
                    ? tt(
                        "Un code de vérification a été envoyé à votre adresse e-mail. Saisissez-le ci-dessous pour finaliser votre inscription.",
                      )
                    : tt(
                        "Vérifiez les informations saisies puis cliquez sur 'Créer mon compte agence' pour recevoir un code de vérification par e-mail.",
                      )}
                </p>
              </div>
              {accountCreated ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} />
                    <div>
                      <p className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">
                        {tt("Code envoyé à")} {email}
                      </p>
                      <p className="text-[12px] text-emerald-600/70 dark:text-emerald-400/70">
                        {tt("Vérifiez vos spams si vous ne l'avez pas reçu.")}
                      </p>
                    </div>
                  </div>
                  <TextField
                    label={tt("Code de vérification")}
                    placeholder={tt("Ex. 123456")}
                    error={form.formState.errors.verificationCode?.message}
                    {...form.register("verificationCode")}
                  />
                  <button
                    onClick={handleResendCode}
                    type="button"
                    className="text-[13.5px] font-semibold text-primary underline-offset-2 hover:underline transition-colors"
                  >
                    {tt("Renvoyer le code")}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold">{tt("Vérification par e-mail")}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {tt("Un code vous sera envoyé après la création du compte.")}
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
              {tt("Précédent")}
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
                  {tt("Suivant")}
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
                      {tt("Veuillez patienter...")}
                    </>
                  ) : accountCreated ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {tt("Valider et terminer")}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      {tt("Créer mon compte agence")}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lien connexion */}
        <p className="mt-8 text-center text-[13.5px] text-muted-foreground">
          {tt("Vous avez déjà un compte ?")}{" "}
          <Link
            to="/connexion"
            className="font-semibold text-primary underline-offset-2 hover:underline transition-colors"
          >
            {tt("Se connecter")}
          </Link>
        </p>
      </main>
    </div>
  );
}
