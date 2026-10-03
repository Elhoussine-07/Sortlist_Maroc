import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, Eye, FileText, Info, Lock, Mail, UserRound } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserRole } from "@/lib/types";
import { ActionModal } from "@/components/common/ActionModal";
import { TextField } from "@/components/common/Blocks";
import {
  confirmPasswordReset,
  forgotPassword,
  login,
  requestEmailCode,
  verifyLoginOtp,
  type LoginResponse,
} from "@/services/auth.service";
import { ApiError } from "@/services/http";
import { useAuthStore } from "@/store/auth.store";
import { useBriefingStore } from "@/store/briefing.store";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion | Sortlist " },
      {
        name: "description",
        content:
          "Connectez-vous à votre espace Sortlist Pro : détection automatique du type de compte après connexion.",
      },
      { property: "og:title", content: "Connexion | Sortlist Pro" },
      {
        property: "og:description",
        content: "Connectez-vous pour accéder à votre espace Sortlist Pro.",
      },
    ],
  }),
  component: LoginPage,
});

const PAGE_TEXT = {
  'Le compte "{email}" est un compte {type}. Veuillez sélectionner le bon bouton en haut de l\'écran.':
    {
      en: 'The account "{email}" is a {type} account. Please select the correct button at the top of the screen.',
      ar: 'الحساب "{email}" هو حساب {type}. يرجى اختيار الزر الصحيح أعلى الشاشة.',
      es: 'La cuenta "{email}" es una cuenta de tipo {type}. Selecciona el botón correcto en la parte superior de la pantalla.',
    },
  Agence: {
    en: "Agency",
    ar: "وكالة",
    es: "Agencia",
  },
  Client: {
    en: "Client",
    ar: "عميل",
    es: "Cliente",
  },
  "Code de connexion envoyé par email.": {
    en: "Sign-in code sent by email.",
    ar: "تم إرسال رمز الدخول عبر البريد الإلكتروني.",
    es: "Código de acceso enviado por correo electrónico.",
  },
  "Vérifiez votre boîte de réception pour finaliser la connexion.": {
    en: "Check your inbox to complete the sign-in.",
    ar: "تحقق من بريدك الإلكتروني لإتمام تسجيل الدخول.",
    es: "Revisa tu bandeja de entrada para completar el inicio de sesión.",
  },
  "Email ou mot de passe incorrect.": {
    en: "Incorrect email or password.",
    ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    es: "Correo electrónico o contraseña incorrectos.",
  },
  "Connexion impossible.": {
    en: "Unable to sign in.",
    ar: "تعذر تسجيل الدخول.",
    es: "No se pudo iniciar sesión.",
  },
  "Renseignez le code reçu par email.": {
    en: "Enter the code you received by email.",
    ar: "أدخل الرمز الذي تلقيته عبر البريد الإلكتروني.",
    es: "Introduce el código recibido por correo electrónico.",
  },
  "Code invalide ou expiré.": {
    en: "Invalid or expired code.",
    ar: "الرمز غير صالح أو منتهي الصلاحية.",
    es: "Código inválido o caducado.",
  },
  "Renseignez votre email pour recevoir un code.": {
    en: "Enter your email to receive a code.",
    ar: "أدخل بريدك الإلكتروني لتلقي رمز.",
    es: "Introduce tu correo electrónico para recibir un código.",
  },
  "Code envoyé par email.": {
    en: "Code sent by email.",
    ar: "تم إرسال الرمز عبر البريد الإلكتروني.",
    es: "Código enviado por correo electrónico.",
  },
  "Vérifiez votre boîte de réception.": {
    en: "Check your inbox.",
    ar: "تحقق من بريدك الإلكتروني.",
    es: "Revisa tu bandeja de entrada.",
  },
  "Envoi du code impossible.": {
    en: "Unable to send the code.",
    ar: "تعذر إرسال الرمز.",
    es: "No se pudo enviar el código.",
  },
  "Renseignez votre email pour réinitialiser votre mot de passe.": {
    en: "Enter your email to reset your password.",
    ar: "أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور.",
    es: "Introduce tu correo electrónico para restablecer tu contraseña.",
  },
  "Renseignez le code reçu et votre nouveau mot de passe.": {
    en: "Enter the code you received and your new password.",
    ar: "أدخل الرمز الذي تلقيته وكلمة المرور الجديدة.",
    es: "Introduce el código recibido y tu nueva contraseña.",
  },
  "Envoi impossible.": {
    en: "Unable to send.",
    ar: "تعذر الإرسال.",
    es: "No se pudo enviar.",
  },
  "Réinitialisation impossible.": {
    en: "Unable to reset.",
    ar: "تعذر إعادة التعيين.",
    es: "No se pudo restablecer.",
  },
  "Mot de passe réinitialisé.": {
    en: "Password reset.",
    ar: "تمت إعادة تعيين كلمة المرور.",
    es: "Contraseña restablecida.",
  },
  "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.": {
    en: "You can now sign in with your new password.",
    ar: "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.",
    es: "Ahora puedes iniciar sesión con tu nueva contraseña.",
  },
  "Bienvenue !": {
    en: "Welcome!",
    ar: "مرحبًا بك!",
    es: "¡Bienvenido!",
  },
  "Connectez-vous pour accéder à votre espace": {
    en: "Sign in to access your account",
    ar: "سجّل الدخول للوصول إلى مساحتك",
    es: "Inicia sesión para acceder a tu espacio",
  },
  "Vous étiez en train de créer votre projet": {
    en: "You were creating your project",
    ar: "كنت بصدد إنشاء مشروعك",
    es: "Estabas creando tu proyecto",
  },
  "— connectez-vous pour continuer et le publier automatiquement.": {
    en: "— sign in to continue and publish it automatically.",
    ar: "— سجّل الدخول للمتابعة ونشره تلقائيًا.",
    es: "— inicia sesión para continuar y publicarlo automáticamente.",
  },
  "Client (Entreprise)": {
    en: "Client (Company)",
    ar: "عميل (شركة)",
    es: "Cliente (Empresa)",
  },
  Email: {
    en: "Email",
    ar: "البريد الإلكتروني",
    es: "Correo electrónico",
  },
  "votreemail@entreprise.com": {
    en: "youremail@company.com",
    ar: "بريدك@الشركة.com",
    es: "tuemail@empresa.com",
  },
  "Mot de passe": {
    en: "Password",
    ar: "كلمة المرور",
    es: "Contraseña",
  },
  "Masquer le mot de passe": {
    en: "Hide password",
    ar: "إخفاء كلمة المرور",
    es: "Ocultar contraseña",
  },
  "Afficher le mot de passe": {
    en: "Show password",
    ar: "إظهار كلمة المرور",
    es: "Mostrar contraseña",
  },
  "Se souvenir de moi": {
    en: "Remember me",
    ar: "تذكرني",
    es: "Recuérdame",
  },
  "Envoi...": {
    en: "Sending...",
    ar: "جارٍ الإرسال...",
    es: "Enviando...",
  },
  "Mot de passe oublié ?": {
    en: "Forgot password?",
    ar: "هل نسيت كلمة المرور؟",
    es: "¿Olvidaste tu contraseña?",
  },
  "Connexion...": {
    en: "Signing in...",
    ar: "جارٍ تسجيل الدخول...",
    es: "Iniciando sesión...",
  },
  "Se connecter": {
    en: "Sign in",
    ar: "تسجيل الدخول",
    es: "Iniciar sesión",
  },
  ou: {
    en: "or",
    ar: "أو",
    es: "o",
  },
  "Recevoir un code par email": {
    en: "Receive a code by email",
    ar: "تلقي رمز عبر البريد الإلكتروني",
    es: "Recibir un código por correo electrónico",
  },
  "Détection automatique du type de compte après connexion pour vous rediriger vers le bon tableau de bord.":
    {
      en: "Automatic account type detection after sign-in to redirect you to the right dashboard.",
      ar: "اكتشاف تلقائي لنوع الحساب بعد تسجيل الدخول لإعادة توجيهك إلى لوحة التحكم المناسبة.",
      es: "Detección automática del tipo de cuenta tras iniciar sesión para redirigirte al panel correcto.",
    },
  "Pas encore de compte ?": {
    en: "Don't have an account yet?",
    ar: "ليس لديك حساب بعد؟",
    es: "¿Aún no tienes cuenta?",
  },
  "Créer un compte client": {
    en: "Create a client account",
    ar: "إنشاء حساب عميل",
    es: "Crear una cuenta de cliente",
  },
  "Créer un compte agence": {
    en: "Create an agency account",
    ar: "إنشاء حساب وكالة",
    es: "Crear una cuenta de agencia",
  },
  "Réinitialiser votre mot de passe": {
    en: "Reset your password",
    ar: "إعادة تعيين كلمة المرور",
    es: "Restablecer tu contraseña",
  },
  "Saisissez le code reçu par email et votre nouveau mot de passe.": {
    en: "Enter the code you received by email and your new password.",
    ar: "أدخل الرمز الذي تلقيته عبر البريد الإلكتروني وكلمة المرور الجديدة.",
    es: "Introduce el código recibido por correo electrónico y tu nueva contraseña.",
  },
  "Confirmation...": {
    en: "Confirming...",
    ar: "جارٍ التأكيد...",
    es: "Confirmando...",
  },
  Confirmer: {
    en: "Confirm",
    ar: "تأكيد",
    es: "Confirmar",
  },
  "Code reçu par email": {
    en: "Code received by email",
    ar: "الرمز المستلم عبر البريد الإلكتروني",
    es: "Código recibido por correo electrónico",
  },
  "Code à 6 chiffres": {
    en: "6-digit code",
    ar: "رمز مكوّن من 6 أرقام",
    es: "Código de 6 dígitos",
  },
  "Nouveau mot de passe": {
    en: "New password",
    ar: "كلمة المرور الجديدة",
    es: "Nueva contraseña",
  },
  "Double authentification": {
    en: "Two-factor authentication",
    ar: "المصادقة الثنائية",
    es: "Autenticación de dos factores",
  },
  "Saisissez le code de connexion reçu par email pour finaliser la connexion.": {
    en: "Enter the sign-in code you received by email to complete the sign-in.",
    ar: "أدخل رمز تسجيل الدخول الذي تلقيته عبر البريد الإلكتروني لإتمام تسجيل الدخول.",
    es: "Introduce el código de acceso recibido por correo electrónico para completar el inicio de sesión.",
  },
  "Vérification...": {
    en: "Verifying...",
    ar: "جارٍ التحقق...",
    es: "Verificando...",
  },
  Valider: {
    en: "Validate",
    ar: "تأكيد",
    es: "Validar",
  },
} satisfies PageTextDict;

function LoginPage() {
  const { tt } = usePageText(PAGE_TEXT);
  const [role, setRole] = useState<UserRole>("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const isLoading = useAuthStore((state) => state.isLoading);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setError = useAuthStore((state) => state.setError);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  const [pendingDraft] = useState<{ id: string; title: string } | null>(null);

  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [isVerifying2fa, setIsVerifying2fa] = useState(false);
  const [pending2faEmail, setPending2faEmail] = useState("");

  function completeLogin({ token, user, detectedRole, roleKnown }: LoginResponse) {
    if (roleKnown && detectedRole !== "admin" && role !== detectedRole) {
      const accountTypeLabel = detectedRole === "agency" ? tt("Agence") : tt("Client");
      const errorMessage = tt(
        'Le compte "{email}" est un compte {type}. Veuillez sélectionner le bon bouton en haut de l\'écran.',
      )
        .replace("{email}", email)
        .replace("{type}", accountTypeLabel);
      setError(errorMessage);
      toast(errorMessage);
      return;
    }

    const finalRole = roleKnown ? detectedRole : role;
    setSession({ token, user, role: finalRole });

    const redirectTarget = new URLSearchParams(window.location.search).get("redirect");
    const briefingStore = useBriefingStore.getState();

    if (
      redirectTarget === "postuler-un-projet" &&
      finalRole === "client" &&
      briefingStore.hasDraft()
    ) {
      briefingStore.setAutoPublishRequested(true);
      navigate({ to: "/client/postuler-un-projet" });
      return;
    }

    if (finalRole === "admin") {
      navigate({ to: "/admin/tableau-de-bord" });
    } else if (finalRole === "agency") {
      navigate({ to: "/agence/tableau-de-bord" });
    } else {
      navigate({ to: "/client/tableau-de-bord" });
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await login({
        email,
        password,
        role, // On envoie quand même le choix de l'UI au backend
        rememberMe,
      });

      if (response.requires2fa) {
        setPending2faEmail(email);
        setTwoFaCode("");
        setIs2faModalOpen(true);
        toast(tt("Code de connexion envoyé par email."), {
          description: tt("Vérifiez votre boîte de réception pour finaliser la connexion."),
        });
        return;
      }

      completeLogin(response);
    } catch (error) {
      const message =
        error instanceof ApiError && error.statusCode === 401
          ? tt("Email ou mot de passe incorrect.")
          : error instanceof ApiError
            ? error.message
            : tt("Connexion impossible.");
      setError(message);
      toast(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm2fa() {
    if (!twoFaCode.trim()) {
      toast(tt("Renseignez le code reçu par email."));
      return;
    }
    setIsVerifying2fa(true);
    try {
      const response = await verifyLoginOtp(pending2faEmail, twoFaCode.trim(), role);
      setIs2faModalOpen(false);
      completeLogin(response);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : tt("Code invalide ou expiré.");
      toast(message);
    } finally {
      setIsVerifying2fa(false);
    }
  }

  async function handleRequestEmailCode() {
    if (!email) {
      toast(tt("Renseignez votre email pour recevoir un code."));
      return;
    }
    try {
      await requestEmailCode(email);
      toast(tt("Code envoyé par email."), {
        description: tt("Vérifiez votre boîte de réception."),
      });
    } catch (error) {
      toast(error instanceof ApiError ? error.message : tt("Envoi du code impossible."));
    }
  }

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSendingResetCode, setIsSendingResetCode] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");

  async function handleForgotPassword() {
    if (!email) {
      toast(tt("Renseignez votre email pour réinitialiser votre mot de passe."));
      return;
    }
    setIsSendingResetCode(true);
    try {
      await forgotPassword(email);
      toast(tt("Code envoyé par email."), {
        description: tt("Renseignez le code reçu et votre nouveau mot de passe."),
      });
      setResetCode("");
      setResetNewPassword("");
      setIsResetModalOpen(true);
    } catch (error) {
      toast(error instanceof ApiError ? error.message : tt("Envoi impossible."));
    } finally {
      setIsSendingResetCode(false);
    }
  }

  async function handleConfirmPasswordReset() {
    if (!resetCode || !resetNewPassword) {
      toast(tt("Renseignez le code reçu et votre nouveau mot de passe."));
      return;
    }
    setIsConfirmingReset(true);
    try {
      await confirmPasswordReset({ email, code: resetCode, newPassword: resetNewPassword });
      toast(tt("Mot de passe réinitialisé."), {
        description: tt("Vous pouvez maintenant vous connecter avec votre nouveau mot de passe."),
      });
      setIsResetModalOpen(false);
      setResetCode("");
      setResetNewPassword("");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : tt("Réinitialisation impossible."));
    } finally {
      setIsConfirmingReset(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 pt-8 sm:px-10">
        <Link to="/" className="text-[26px] font-bold tracking-tight">
          Sortlist
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[420px] px-6 pb-16 pt-14">
        <h1 className="text-center text-[32px] font-bold tracking-tight">{tt("Bienvenue !")}</h1>
        <p className="mt-2 text-center text-[14px] text-muted-foreground">
          {tt("Connectez-vous pour accéder à votre espace")}
        </p>

        {pendingDraft ? (
          <div className="mt-8 flex gap-4 rounded-lg border border-border p-4">
            <FileText className="h-7 w-7 shrink-0" strokeWidth={1.5} />
            <p className="min-w-0 text-[13.5px] leading-[1.5]">
              {tt("Vous étiez en train de créer votre projet")}{" "}
              <strong className="font-bold">"{pendingDraft.title}"</strong>{" "}
              {tt("— connectez-vous pour continuer et le publier automatiquement.")}
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("client")}
              aria-pressed={role === "client"}
              className={
                role === "client"
                  ? "flex items-center justify-center gap-2 rounded-lg border-2 border-primary px-4 py-4 text-[14px] font-bold"
                  : "flex items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-4 text-[14px] font-medium transition-colors hover:bg-accent"
              }
            >
              <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              {tt("Client (Entreprise)")}
            </button>
            <button
              type="button"
              onClick={() => setRole("agency")}
              aria-pressed={role === "agency"}
              className={
                role === "agency"
                  ? "flex items-center justify-center gap-2 rounded-lg border-2 border-primary px-4 py-4 text-[14px] font-bold"
                  : "flex items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-4 text-[14px] font-medium transition-colors hover:bg-accent"
              }
            >
              <UserRound className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              {tt("Agence")}
            </button>
          </div>

          <div className="mt-7">
            <label htmlFor="email" className="text-[13.5px] font-bold">
              {tt("Email")}
            </label>
            <div className="mt-2 flex items-center gap-3 border-b border-border pb-2 focus-within:border-primary">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={tt("votreemail@entreprise.com")}
                className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="password" className="text-[13.5px] font-bold">
              {tt("Mot de passe")}
            </label>
            <div className="mt-2 flex items-center gap-3 border-b border-border pb-2 focus-within:border-primary">
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? tt("Masquer le mot de passe") : tt("Afficher le mot de passe")}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Eye className="h-4 w-4" strokeWidth={1.7} />
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-[13.5px]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-3.5 w-3.5 shrink-0 rounded-[3px] border border-border accent-primary"
              />
              {tt("Se souvenir de moi")}
            </label>
            <button
              onClick={handleForgotPassword}
              type="button"
              disabled={isSendingResetCode}
              className="text-[13.5px] font-semibold underline underline-offset-4 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSendingResetCode ? tt("Envoi...") : tt("Mot de passe oublié ?")}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-7 w-full rounded-lg bg-primary py-4 text-[15px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? tt("Connexion...") : tt("Se connecter")}
          </button>

          <p className="mt-5 text-center text-[13px] text-muted-foreground">{tt("ou")}</p>

          <button
            onClick={handleRequestEmailCode}
            type="button"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-4 text-[14px] font-semibold transition-colors hover:bg-accent"
          >
            <Mail className="h-4 w-4" strokeWidth={1.7} />
            {tt("Recevoir un code par email")}
          </button>

          <div className="mt-7 flex gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
            <p className="min-w-0 text-[13px] leading-[1.5] text-muted-foreground">
              {tt(
                "Détection automatique du type de compte après connexion pour vous rediriger vers le bon tableau de bord.",
              )}
            </p>
          </div>
        </form>

        <p className="mt-12 text-center text-[14px] font-semibold">
          {tt("Pas encore de compte ?")}{" "}
          <Link
            to={role === "client" ? "/inscription-client" : "/inscription-agence"}
            className="underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            {role === "client" ? tt("Créer un compte client") : tt("Créer un compte agence")}
          </Link>
        </p>
      </main>
      <ActionModal
        open={isResetModalOpen}
        onOpenChange={setIsResetModalOpen}
        title={tt("Réinitialiser votre mot de passe")}
        description={tt("Saisissez le code reçu par email et votre nouveau mot de passe.")}
        confirmLabel={isConfirmingReset ? tt("Confirmation...") : tt("Confirmer")}
        onConfirm={handleConfirmPasswordReset}
      >
        <div className="space-y-4">
          <TextField
            label={tt("Code reçu par email")}
            type="text"
            value={resetCode}
            onChange={(event) => setResetCode(event.target.value)}
            placeholder={tt("Code à 6 chiffres")}
          />
          <TextField
            label={tt("Nouveau mot de passe")}
            type="password"
            value={resetNewPassword}
            onChange={(event) => setResetNewPassword(event.target.value)}
          />
        </div>
      </ActionModal>
      <ActionModal
        open={is2faModalOpen}
        onOpenChange={setIs2faModalOpen}
        title={tt("Double authentification")}
        description={tt("Saisissez le code de connexion reçu par email pour finaliser la connexion.")}
        confirmLabel={isVerifying2fa ? tt("Vérification...") : tt("Valider")}
        onConfirm={handleConfirm2fa}
      >
        <TextField
          label={tt("Code reçu par email")}
          type="text"
          value={twoFaCode}
          onChange={(event) => setTwoFaCode(event.target.value)}
          placeholder={tt("Code à 6 chiffres")}
        />
      </ActionModal>
    </div>
  );
}
