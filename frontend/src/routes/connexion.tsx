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
} from "@/services/auth.service";
import { ApiError } from "@/services/http";
import { useAuthStore } from "@/store/auth.store";
import { useBriefingStore } from "@/store/briefing.store";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion | Sortlist Pro" },
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

function LoginPage() {
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

  // Brouillon en cours repris depuis le backend (bandeau haut de page)
  const [pendingDraft] = useState<{ id: string; title: string } | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token, user, detectedRole, roleKnown } = await login({
        email,
        password,
        role, // On envoie quand même le choix de l'UI au backend
        rememberMe,
      });

      // ------------------------------------------------------------------
      // Vérification du rôle sélectionné vs rôle réel détecté.
      //
      // IMPORTANT : on ne bloque QUE si le backend a explicitement renvoyé
      // un champ de rôle reconnu (`roleKnown`). Auparavant, quand la réponse
      // ne contenait aucun champ de rôle reconnaissable, `detectedRole`
      // retombait silencieusement sur "client" — ce qui bloquait à tort la
      // connexion des comptes agence de façon intermittente (selon la forme
      // exacte de la réponse renvoyée par l'endpoint appelé). On fait donc
      // confiance au choix de l'utilisateur quand le backend ne tranche pas.
      //
      // Et surtout : on n'écrit RIEN dans le store tant que cette
      // vérification n'est pas passée, pour éviter de persister en
      // localStorage un token/rôle correspondant à une connexion refusée
      // (c'était la cause des soucis de navigation après un échec).
      // ------------------------------------------------------------------
      // Un compte Moderator/Administrator (détecté via auth.py::_user_type,
      // normalisé en "admin" par normalizeRole) n'a pas de bouton dédié sur
      // cet écran (seuls Client/Agence sont des parcours d'inscription grand
      // public) — on fait donc confiance au backend sans jamais bloquer sur
      // l'incohérence bouton cliqué / rôle détecté dans ce cas précis.
      if (roleKnown && detectedRole !== "admin" && role !== detectedRole) {
        const errorMessage = `Le compte "${email}" est un compte ${
          detectedRole === "agency" ? "Agence" : "Client"
        }. Veuillez sélectionner le bon bouton en haut de l'écran.`;
        setError(errorMessage);
        toast(errorMessage);
        setLoading(false);
        return; // Rien n'a été écrit dans le store : aucun état résiduel.
      }

      const finalRole = roleKnown ? detectedRole : role;
      setSession({ token, user, role: finalRole });

      // ------------------------------------------------------------------
      // Redirection
      // ------------------------------------------------------------------
      const redirectTarget = new URLSearchParams(window.location.search).get("redirect");
      const briefingStore = useBriefingStore.getState();

      // Si c'est un client qui a un brouillon et demande à postuler
      if (
        redirectTarget === "postuler-un-projet" &&
        finalRole === "client" &&
        briefingStore.hasDraft()
      ) {
        briefingStore.setAutoPublishRequested(true);
        navigate({ to: "/client/postuler-un-projet" });
        return;
      }

      // Redirection vers le bon tableau de bord
      if (finalRole === "admin") {
        navigate({ to: "/admin/tableau-de-bord" });
      } else if (finalRole === "agency") {
        navigate({ to: "/agence/tableau-de-bord" });
      } else {
        navigate({ to: "/client/tableau-de-bord" });
      }
    } catch (error) {
      // AJOUTÉ : le message affiché est désormais contrôlé par le frontend
      // pour le cas identifiants invalides (401), plutôt que de transmettre
      // tel quel le message brut renvoyé par le backend (`auth.login` répond
      // "Identifiants invalides" — trop technique/laconique pour l'utilisateur
      // final, et couplerait l'affichage au libellé exact choisi côté API).
      const message =
        error instanceof ApiError && error.statusCode === 401
          ? "Email ou mot de passe incorrect."
          : error instanceof ApiError
            ? error.message
            : "Connexion impossible.";
      setError(message);
      toast(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestEmailCode() {
    if (!email) {
      toast("Renseignez votre email pour recevoir un code.");
      return;
    }
    try {
      await requestEmailCode(email);
      toast("Code envoyé par email.", {
        description: "Vérifiez votre boîte de réception.",
      });
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Envoi du code impossible.");
    }
  }

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSendingResetCode, setIsSendingResetCode] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");

  async function handleForgotPassword() {
    if (!email) {
      toast("Renseignez votre email pour réinitialiser votre mot de passe.");
      return;
    }
    setIsSendingResetCode(true);
    try {
      await forgotPassword(email);
      toast("Code envoyé par email.", {
        description: "Renseignez le code reçu et votre nouveau mot de passe.",
      });
      setResetCode("");
      setResetNewPassword("");
      setIsResetModalOpen(true);
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Envoi impossible.");
    } finally {
      setIsSendingResetCode(false);
    }
  }

  async function handleConfirmPasswordReset() {
    if (!resetCode || !resetNewPassword) {
      toast("Renseignez le code reçu et votre nouveau mot de passe.");
      return;
    }
    setIsConfirmingReset(true);
    try {
      await confirmPasswordReset({ email, code: resetCode, newPassword: resetNewPassword });
      toast("Mot de passe réinitialisé.", {
        description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
      });
      setIsResetModalOpen(false);
      setResetCode("");
      setResetNewPassword("");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Réinitialisation impossible.");
    } finally {
      setIsConfirmingReset(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 pt-8 sm:px-10">
        <Link to="/" className="text-[26px] font-bold tracking-tight">
          Sortlist Pro
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[420px] px-6 pb-16 pt-14">
        <h1 className="text-center text-[32px] font-bold tracking-tight">Bienvenue !</h1>
        <p className="mt-2 text-center text-[14px] text-muted-foreground">
          Connectez-vous pour accéder à votre espace
        </p>

        {pendingDraft ? (
          <div className="mt-8 flex gap-4 rounded-lg border border-border p-4">
            <FileText className="h-7 w-7 shrink-0" strokeWidth={1.5} />
            <p className="min-w-0 text-[13.5px] leading-[1.5]">
              Vous étiez en train de créer votre projet{" "}
              <strong className="font-bold">"{pendingDraft.title}"</strong> — connectez-vous pour
              continuer et le publier automatiquement.
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
              Client (Entreprise)
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
              Agence
            </button>
          </div>

          <div className="mt-7">
            <label htmlFor="email" className="text-[13.5px] font-bold">
              Email
            </label>
            <div className="mt-2 flex items-center gap-3 border-b border-border pb-2 focus-within:border-primary">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="votreemail@entreprise.com"
                className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="password" className="text-[13.5px] font-bold">
              Mot de passe
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
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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
              Se souvenir de moi
            </label>
            <button
              onClick={handleForgotPassword}
              type="button"
              disabled={isSendingResetCode}
              className="text-[13.5px] font-semibold underline underline-offset-4 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSendingResetCode ? "Envoi..." : "Mot de passe oublié ?"}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-7 w-full rounded-lg bg-primary py-4 text-[15px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>

          <p className="mt-5 text-center text-[13px] text-muted-foreground">ou</p>

          <button
            onClick={handleRequestEmailCode}
            type="button"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-4 text-[14px] font-semibold transition-colors hover:bg-accent"
          >
            <Mail className="h-4 w-4" strokeWidth={1.7} />
            Recevoir un code par email
          </button>

          <div className="mt-7 flex gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
            <p className="min-w-0 text-[13px] leading-[1.5] text-muted-foreground">
              Détection automatique du type de compte après connexion pour vous rediriger vers le
              bon tableau de bord.
            </p>
          </div>
        </form>

        <p className="mt-12 text-center text-[14px] font-semibold">
          Pas encore de compte ?{" "}
          <Link
            to={role === "client" ? "/inscription-client" : "/inscription-agence"}
            className="underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            Créer un compte {role === "client" ? "client" : "agence"}
          </Link>
        </p>
      </main>
      <ActionModal
        open={isResetModalOpen}
        onOpenChange={setIsResetModalOpen}
        title="Réinitialiser votre mot de passe"
        description="Saisissez le code reçu par email et votre nouveau mot de passe."
        confirmLabel={isConfirmingReset ? "Confirmation..." : "Confirmer"}
        onConfirm={handleConfirmPasswordReset}
      >
        <div className="space-y-4">
          <TextField
            label="Code reçu par email"
            type="text"
            value={resetCode}
            onChange={(event) => setResetCode(event.target.value)}
            placeholder="Code à 6 chiffres"
          />
          <TextField
            label="Nouveau mot de passe"
            type="password"
            value={resetNewPassword}
            onChange={(event) => setResetNewPassword(event.target.value)}
          />
        </div>
      </ActionModal>
    </div>
  );
}
