import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Lock,
  MapPin,
  RefreshCcw,
  ShieldAlert,
  Star,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SectionCard, StatusBadge, TextAreaField, TextField } from "@/components/common/Blocks";
import { StackSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import { ActionModal } from "@/components/common/ActionModal";
import type { Agency } from "@/lib/types";
import { downloadProjectCdc, getProject, payAgencyForProject } from "@/services/projects.service";
import {
  getDispute,
  requestSuspension,
  relaunchAgencySearch,
  resumeProject,
  type SuspensionCategory,
} from "@/services/disputes.service";
import {
  contactAgencies,
  getProjectShortlist,
  listAgencyApplications,
  respondToAgencyApplication,
} from "@/services/agencies.service";
import {
  downloadDevisPdf,
  getPendingProposals,
  respondToQuote,
  type PendingProposal,
} from "@/services/proposals.service";
import { ApiError } from "@/services/http";

/** Rafraîchit `Date.now()` toutes les 60s — suffisant pour un compte à
 * rebours affiché en heures/minutes (délai de réponse à un devis, 48h+24h). */
function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function describeQuoteDeadline(
  proposal: PendingProposal,
  now: number,
): { label: string; expired: boolean } {
  const responseDeadline = proposal.responseDeadline
    ? new Date(proposal.responseDeadline).getTime()
    : null;
  const extendedDeadline = proposal.extendedDeadline
    ? new Date(proposal.extendedDeadline).getTime()
    : null;

  const activeDeadline =
    responseDeadline !== null && now < responseDeadline
      ? { time: responseDeadline, prefix: "" }
      : extendedDeadline !== null && now < extendedDeadline
        ? { time: extendedDeadline, prefix: "Délai de rappel — " }
        : null;

  if (!activeDeadline) {
    return { label: "Délai de réponse dépassé — en cours de vérification", expired: true };
  }

  const diffMinutes = Math.max(0, Math.round((activeDeadline.time - now) / 60_000));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return {
    label: `${activeDeadline.prefix}${hours}h${minutes.toString().padStart(2, "0")} restantes pour répondre`,
    expired: false,
  };
}

/**
 * Écran 15bis — DÉTAIL D'UN PROJET (CDC §1.5.8, MUST).
 * Route manquante identifiée dans la passe précédente : `client.tableau-de-bord.tsx`
 * et `client.mes-projets.tsx` laissaient "Voir le projet" en `uiAction` faute
 * de cible. Structure de fichier calquée sur `agences.$id.tsx`.
 */
export const Route = createFileRoute("/_authenticated/client/mes-projets_/$id")({
  head: () => ({
    meta: [
      { title: "Détail du projet — Sortlist Pro" },
      {
        name: "description",
        content:
          "Consultez le détail de votre projet : cahier des charges, shortlist d'agences recommandées et suivi des litiges.",
      },
      { property: "og:title", content: "Détail du projet — Sortlist Pro" },
      {
        property: "og:description",
        content: "Suivi complet d'un projet publié sur Sortlist Pro.",
      },
    ],
  }),
  component: ClientProjectDetailPage,
});

/* Avatar coloré déterministe, cohérent avec le reste du site. */
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

function formatBudget(min: number | null, max: number | null): string {
  if (min === null && max === null) return "Non renseigné";
  if (min !== null && max !== null) return `${min} € - ${max} €`;
  return `${min ?? max} €`;
}

function ClientProjectDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  // AJOUTÉ (demande explicite) : toute mutation de cette page qui change
  // l'état du projet (accepter/refuser un devis ou une candidature,
  // suspension, relance, reprise, paiement) doit aussi invalider la liste
  // "Mes projets" (`["client","projects"]`) — une clé de query DIFFÉRENTE de
  // celle de cette page détail (`["client","project",id]`, singulier).
  // React Query ne fait que du préfixe sur les clés ("project" != "projects"
  // au premier niveau déjà différent), donc invalider l'une n'invalide
  // jamais l'autre. BUG CORRIGÉ : sans ce second appel, retourner sur "Mes
  // projets" après une action ici affichait encore l'ancien statut en cache
  // (ex. "En attente" après acceptation d'un devis), donnant l'impression
  // que l'action n'avait aucun effet alors que le backend était à jour.
  function invalidateProjectQueries() {
    void queryClient.invalidateQueries({ queryKey: ["client", "project", id] });
    void queryClient.invalidateQueries({ queryKey: ["client", "projects"] });
  }

  const projectQuery = useQuery({
    queryKey: ["client", "project", id],
    queryFn: () => getProject(id),
    enabled: Boolean(id),
  });
  const project = projectQuery.data ?? null;
  const isLoading = projectQuery.isPending;

  const [isOpeningCdc, setIsOpeningCdc] = useState(false);

  async function handleOpenCdc() {
    if (!project?.cdcFile) return;
    setIsOpeningCdc(true);
    try {
      const blob = await downloadProjectCdc(id);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Impossible d'ouvrir le CDC.");
    } finally {
      setIsOpeningCdc(false);
    }
  }

  // Shortlist IA — visible une fois le projet publié ("Postulé"), affichée en
  // lecture seule (mêmes cartes agence que `SmartBriefing.tsx::ShortlistSection`).
  const shortlistQuery = useQuery({
    queryKey: ["client", "project", id, "shortlist"],
    queryFn: () => getProjectShortlist(id),
    enabled: project !== null && (project.status === "published" || project.status === "awaiting"),
  });
  const shortlist: Agency[] = shortlistQuery.data ?? [];

  const now = useNow();

  // Devis en attente de décision (CDC §1.3.3, étape 4) — visible dès que le
  // projet atteint "En attente" (une relation a atteint "Devis envoyé"), et
  // peut comporter plusieurs devis simultanés en Multicast.
  const pendingProposalsQuery = useQuery({
    queryKey: ["client", "project", id, "pending-proposals"],
    queryFn: () => getPendingProposals(id),
    enabled: project !== null && (project.status === "awaiting" || project.status === "published"),
  });
  const pendingProposals = pendingProposalsQuery.data ?? [];

  const [downloadingProposalId, setDownloadingProposalId] = useState<string | null>(null);
  async function handleDownloadDevis(proposal: PendingProposal) {
    if (!proposal.devisFile) return;
    setDownloadingProposalId(proposal.id);
    try {
      const blob = await downloadDevisPdf(proposal.id);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Impossible d'ouvrir le devis.");
    } finally {
      setDownloadingProposalId(null);
    }
  }

  const [respondingProposalId, setRespondingProposalId] = useState<string | null>(null);
  // AJOUTÉ (demande explicite, négociation) : un refus n'est plus définitif
  // — le client peut joindre un motif/contre-proposition, transmis à
  // l'agence, qui peut alors renvoyer un devis ajusté sans repartir de zéro
  // (cf. Proposal.refuse()/_handle_refusal()).
  const [refusingProposal, setRefusingProposal] = useState<PendingProposal | null>(null);
  const [refusalMessage, setRefusalMessage] = useState("");
  const respondMutation = useMutation({
    mutationFn: ({
      proposalId,
      decision,
      message,
    }: {
      proposalId: string;
      decision: "accept" | "refuse";
      message?: string;
    }) => respondToQuote(proposalId, decision, message),
    onMutate: ({ proposalId }) => setRespondingProposalId(proposalId),
    onSuccess: (_data, variables) => {
      toast(
        variables.decision === "accept"
          ? "Devis accepté — le projet passe En cours."
          : "Devis refusé — l'agence peut vous envoyer une offre ajustée.",
      );
      if (variables.decision === "refuse") {
        setRefusingProposal(null);
        setRefusalMessage("");
      }
      invalidateProjectQueries();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer votre décision.");
    },
    onSettled: () => setRespondingProposalId(null),
  });

  // Candidatures spontanées d'agences (bouton "Postuler" côté agence depuis
  // "Disponibles", cf. `opportunity.express_interest`) : le CLIENT doit les
  // accepter/refuser avant que l'agence ne puisse envoyer un devis — même
  // fenêtre de visibilité que la Shortlist/les devis (projet "Postulé"/"En
  // attente").
  const agencyApplicationsQuery = useQuery({
    queryKey: ["client", "project", id, "agency-applications"],
    queryFn: () => listAgencyApplications(id),
    enabled: project !== null && (project.status === "published" || project.status === "awaiting"),
  });
  const agencyApplications = agencyApplicationsQuery.data ?? [];

  const [respondingApplicationId, setRespondingApplicationId] = useState<string | null>(null);
  const respondToApplicationMutation = useMutation({
    mutationFn: ({
      opportunityId,
      decision,
    }: {
      opportunityId: string;
      decision: "accept" | "refuse";
    }) => respondToAgencyApplication(opportunityId, decision),
    onMutate: ({ opportunityId }) => setRespondingApplicationId(opportunityId),
    onSuccess: (_data, variables) => {
      toast(
        variables.decision === "accept"
          ? "Candidature acceptée — l'agence peut désormais envoyer un devis."
          : "Candidature refusée.",
      );
      invalidateProjectQueries();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer votre décision.");
    },
    onSettled: () => setRespondingApplicationId(null),
  });

  const [contactingAgencyId, setContactingAgencyId] = useState<string | null>(null);
  const [contactedAgencyIds, setContactedAgencyIds] = useState<string[]>([]);

  async function handleContactAgency(agencyId: string) {
    setContactingAgencyId(agencyId);
    try {
      await contactAgencies(id, [agencyId], undefined);
      setContactedAgencyIds((current) => [...current, agencyId]);
      toast("Demande envoyée à l'agence.");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Envoi impossible.");
    } finally {
      setContactingAgencyId(null);
    }
  }

  // Litige / suspension — un litige existant prime sur le bouton de demande.
  // `project.get_dispute` : pas de garantie qu'un 404/erreur signifie
  // "aucun litige" plutôt qu'un vrai problème réseau — on traite les deux de
  // la même façon (pas de section litige affichée) plutôt que de bloquer le
  // reste de la page sur une erreur non bloquante.
  const disputeQuery = useQuery({
    queryKey: ["client", "project", id, "dispute"],
    queryFn: () => getDispute(id),
    enabled: project !== null,
    retry: false,
  });
  const dispute =
    disputeQuery.data &&
    disputeQuery.data.status &&
    disputeQuery.data.status.toLowerCase() !== "none"
      ? disputeQuery.data
      : null;

  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionCategory, setSuspensionCategory] = useState<SuspensionCategory>("amicable");

  const suspensionMutation = useMutation({
    mutationFn: () =>
      requestSuspension({ projectId: id, reason: suspensionReason, category: suspensionCategory }),
    onSuccess: () => {
      toast("Demande de suspension envoyée.");
      setIsSuspensionModalOpen(false);
      setSuspensionReason("");
      invalidateProjectQueries();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Envoi impossible.");
    },
  });

  const relaunchMutation = useMutation({
    mutationFn: () => relaunchAgencySearch(id),
    onSuccess: () => {
      toast("Recherche d'agence relancée.");
      invalidateProjectQueries();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible de relancer la recherche.");
    },
  });

  // BUG CORRIGÉ (CDC §1.5.3) : `project.resume` n'était appelé nulle part
  // côté frontend — un projet Suspendu (Suspension amiable validée) restait
  // bloqué sans aucun moyen de le reprendre depuis l'UI.
  const resumeMutation = useMutation({
    mutationFn: () => resumeProject(id),
    onSuccess: () => {
      toast("Projet repris — la nouvelle date de fin prévue a été recalculée.");
      invalidateProjectQueries();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible de reprendre le projet.");
    },
  });

  // AJOUTÉ (demande explicite) : le client règle directement à l'agence les
  // frais du projet (montant de l'offre acceptée) — distinct de la
  // commission plateforme (5%), réglée séparément par l'agence.
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"Card" | "Bank Transfer" | "PayPal">("Card");
  const [providerToken, setProviderToken] = useState("");

  const payAgencyMutation = useMutation({
    mutationFn: () => payAgencyForProject({ projectId: id, paymentMethod, providerToken }),
    onSuccess: () => {
      toast("Paiement envoyé à l'agence.");
      setIsPaymentModalOpen(false);
      setProviderToken("");
      invalidateProjectQueries();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Paiement impossible.");
    },
  });

  return (
    <DashboardShell role="client">
      <div className="mx-auto max-w-[1080px]">
        <Link
          to="/client/mes-projets"
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Retour à mes projets
        </Link>

        {/* En-tête */}
        <section className="mt-5 rounded-lg border border-border p-6">
          {isLoading ? (
            <StackSkeleton count={2} />
          ) : project === null ? (
            <EmptyState message="Projet introuvable." />
          ) : (
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-[22px] w-[22px]" strokeWidth={1.7} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[24px] font-bold tracking-tight">{project.title}</h1>
                  <StatusBadge label={project.statusLabel} />
                </div>
                <p className="mt-1 text-[13.5px] text-muted-foreground">
                  {project.category}
                  {project.subCategory ? ` · ${project.subCategory}` : ""} — ID {project.reference}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-[13.5px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                    {formatBudget(project.budgetMin, project.budgetMax)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                    {project.location || "Non renseignée"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                    {project.deadline || "Délai non renseigné"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {project ? (
          <div className="mt-6 space-y-6">
            {/* BUG CORRIGÉ (CDC §1.5.8) : la page de détail n'affichait PAS
                l'agence liée au projet — pour un projet En cours/En pause, le
                client voyait le nom de l'agence nulle part et ne pouvait pas
                cliquer vers son profil depuis le détail. */}
            {project.agencyId ? (
              <SectionCard
                title="Agence"
                description="L'agence qui travaille actuellement sur ce projet."
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      style={{ backgroundImage: seedGradient(project.agencyId) }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white"
                    >
                      {initialsOf(project.partnerAgencyName ?? "Agence")}
                    </span>
                    <p className="min-w-0 truncate text-[15px] font-bold">
                      {project.partnerAgencyName ?? "Agence partenaire"}
                    </p>
                  </div>
                  <Link
                    to="/agences/$id"
                    params={{ id: project.agencyId }}
                    className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent"
                  >
                    Voir le profil
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </Link>
                </div>
              </SectionCard>
            ) : null}

            {/* AJOUTÉ (demande explicite) : paiement du client à l'agence
                (frais du projet, montant de l'offre acceptée) — distinct de
                la commission plateforme (5%), réglée séparément par
                l'agence via son propre circuit de facturation. */}
            {project.paymentStatus && project.paymentStatus !== "Non facturé" ? (
              <SectionCard
                title="Paiement à l'agence"
                description="Montant dû à l'agence pour la réalisation du projet — distinct de la commission versée par l'agence à la plateforme."
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] text-muted-foreground">Montant dû</p>
                    <p className="mt-1 text-[20px] font-bold">
                      {project.agencyProjectAmount !== null &&
                      project.agencyProjectAmount !== undefined
                        ? `${project.agencyProjectAmount.toLocaleString("fr-FR")} €`
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge label={project.paymentStatus} />
                    {project.paymentStatus === "À payer" ? (
                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        <CreditCard className="h-4 w-4" strokeWidth={1.8} />
                        Payer l'agence
                      </button>
                    ) : null}
                  </div>
                </div>
              </SectionCard>
            ) : null}

            {/* Cahier des charges */}
            <SectionCard
              title="Cahier des charges"
              description="Document généré à partir de votre brief."
            >
              <div className="flex flex-wrap items-center gap-3">
                {project.cdcFile ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-accent/40 px-3 py-2">
                    <FileText
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      strokeWidth={1.8}
                    />
                    <p className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
                      Cahier des charges — généré à partir de votre brief
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenCdc}
                      disabled={isOpeningCdc}
                      className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
                      {isOpeningCdc ? "..." : "Télécharger le PDF"}
                    </button>
                  </div>
                ) : (
                  <span className="text-[13px] text-muted-foreground">
                    Aucun CDC disponible pour ce projet.
                  </span>
                )}
                {project.locked ? (
                  <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                    Verrouillé
                  </span>
                ) : null}
              </div>
            </SectionCard>

            {/* Candidatures spontanées d'agences (onglet "Disponibles" côté agence) */}
            {agencyApplications.length > 0 ? (
              <SectionCard
                title="Candidatures d'agences"
                description="Ces agences ont postulé spontanément à votre projet — acceptez pour qu'elles puissent vous envoyer un devis."
              >
                <div className="space-y-4">
                  {agencyApplications.map((application) => {
                    const isResponding =
                      respondingApplicationId === application.id &&
                      respondToApplicationMutation.isPending;
                    return (
                      <article
                        key={application.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
                      >
                        <p className="text-[15px] font-bold">{application.agencyName}</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isResponding}
                            onClick={() =>
                              respondToApplicationMutation.mutate({
                                opportunityId: application.id,
                                decision: "accept",
                              })
                            }
                            className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                            {isResponding ? "..." : "Accepter"}
                          </button>
                          <button
                            type="button"
                            disabled={isResponding}
                            onClick={() =>
                              respondToApplicationMutation.mutate({
                                opportunityId: application.id,
                                decision: "refuse",
                              })
                            }
                            className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                            Refuser
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </SectionCard>
            ) : null}

            {/* Devis en attente de décision */}
            {pendingProposals.length > 0 ? (
              <SectionCard
                title="Devis reçus"
                description="Chaque devis dispose de son propre délai de réponse (48h, puis +24h de rappel)."
              >
                <div className="space-y-4">
                  {pendingProposals.map((proposal) => {
                    const deadline = describeQuoteDeadline(proposal, now);
                    const isResponding =
                      respondingProposalId === proposal.id && respondMutation.isPending;
                    return (
                      <article key={proposal.id} className="rounded-lg border border-border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[15px] font-bold">{proposal.agencyName}</p>
                            <p className="mt-1 text-[15px] font-semibold text-primary">
                              {proposal.amount.toLocaleString("fr-FR")} €
                            </p>
                          </div>
                          <span
                            className={
                              deadline.expired
                                ? "flex shrink-0 items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[12.5px] font-semibold text-destructive"
                                : "flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[12.5px] font-semibold"
                            }
                          >
                            <Clock className="h-3 w-3 shrink-0" strokeWidth={2} />
                            {deadline.label}
                          </span>
                        </div>
                        {proposal.description ? (
                          <p className="mt-2 text-[13px] text-muted-foreground">
                            {proposal.description}
                          </p>
                        ) : null}
                        {proposal.devisFile ? (
                          <div className="mt-3 flex items-center gap-2 rounded-md border border-border bg-accent/40 px-3 py-2">
                            <FileText
                              className="h-4 w-4 shrink-0 text-muted-foreground"
                              strokeWidth={1.8}
                            />
                            <p className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
                              Devis détaillé — informations de l'agence, prestations, tarifs
                            </p>
                            <button
                              type="button"
                              disabled={downloadingProposalId === proposal.id}
                              onClick={() => void handleDownloadDevis(proposal)}
                              className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
                              {downloadingProposalId === proposal.id ? "..." : "Télécharger le PDF"}
                            </button>
                          </div>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isResponding || deadline.expired}
                            onClick={() =>
                              respondMutation.mutate({
                                proposalId: proposal.id,
                                decision: "accept",
                              })
                            }
                            className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                            {isResponding ? "..." : "Accepter"}
                          </button>
                          <button
                            type="button"
                            disabled={isResponding || deadline.expired}
                            onClick={() => setRefusingProposal(proposal)}
                            className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                            Refuser
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </SectionCard>
            ) : null}

            {/* Shortlist IA */}
            {project.status === "published" || project.status === "awaiting" ? (
              <SectionCard
                title="Shortlist d'agences recommandées"
                description="Sélection générée par le matching IA pour ce projet."
              >
                {shortlistQuery.isPending ? (
                  <StackSkeleton count={3} />
                ) : shortlist.length === 0 ? (
                  <EmptyState message="Aucune agence recommandée pour le moment." />
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {shortlist.map((agency) => {
                      const isContacted = contactedAgencyIds.includes(agency.id);
                      return (
                        <article key={agency.id} className="rounded-lg border border-border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[15px] font-bold">{agency.name}</p>
                              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                                {agency.location}
                              </p>
                            </div>
                            {agency.matchingScore !== null ? (
                              <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[12.5px] font-semibold">
                                <Star className="h-3 w-3 fill-current" strokeWidth={0} />
                                {agency.matchingScore}%
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">
                            {agency.description}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleContactAgency(agency.id)}
                              disabled={isContacted || contactingAgencyId === agency.id}
                              className="rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {contactingAgencyId === agency.id
                                ? "Envoi..."
                                : isContacted
                                  ? "Envoyé"
                                  : "Envoyer"}
                            </button>
                            <Link
                              to="/agences/$id"
                              params={{ id: agency.id }}
                              className="rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent"
                            >
                              Voir profil
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            ) : null}

            {/* Suspension / Litige */}
            <SectionCard
              title="Suspension et litiges"
              description="Suivi des suspensions ou litiges éventuels sur ce projet."
            >
              {disputeQuery.isPending ? (
                <StackSkeleton count={2} />
              ) : dispute ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusBadge label={dispute.statusLabel} />
                    {dispute.status === "Validated" && dispute.category === "Suspension amiable" ? (
                      <button
                        type="button"
                        onClick={() => resumeMutation.mutate()}
                        disabled={resumeMutation.isPending}
                        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RefreshCcw className="h-4 w-4" strokeWidth={1.8} />
                        {resumeMutation.isPending ? "Reprise..." : "Reprendre"}
                      </button>
                    ) : null}
                  </div>
                  {dispute.history.length === 0 ? (
                    <p className="mt-4 text-[13.5px] text-muted-foreground">
                      Aucun historique disponible.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-4">
                      {dispute.history.map((entry) => (
                        <li key={entry.id} className="border-l border-border pl-4">
                          <p className="text-[13px] text-muted-foreground">{entry.date}</p>
                          <p className="mt-0.5 text-[13.5px] font-semibold">{entry.title}</p>
                          <p className="text-[13px] text-muted-foreground">{entry.description}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  {project.status === "in_progress" ? (
                    <button
                      type="button"
                      onClick={() => setIsSuspensionModalOpen(true)}
                      className="flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent"
                    >
                      <ShieldAlert className="h-4 w-4" strokeWidth={1.8} />
                      Demander une suspension
                    </button>
                  ) : null}
                  {project.status === "rejected" &&
                  project.rejectionSubstatus === "Agence défaillante" ? (
                    <button
                      type="button"
                      onClick={() => relaunchMutation.mutate()}
                      disabled={relaunchMutation.isPending}
                      className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCcw className="h-4 w-4" strokeWidth={1.8} />
                      {relaunchMutation.isPending ? "Relance..." : "Relancer la recherche"}
                    </button>
                  ) : null}
                  {project.status !== "in_progress" &&
                  !(
                    project.status === "rejected" &&
                    project.rejectionSubstatus === "Agence défaillante"
                  ) ? (
                    <p className="text-[13.5px] text-muted-foreground">
                      Aucun litige ni suspension en cours sur ce projet.
                    </p>
                  ) : null}
                </div>
              )}
            </SectionCard>
          </div>
        ) : null}
      </div>

      <ActionModal
        open={isSuspensionModalOpen}
        onOpenChange={setIsSuspensionModalOpen}
        title="Demander une suspension"
        description="Décrivez le motif de votre demande. Une suspension amiable est privilégiée avant l'ouverture d'un litige."
        confirmLabel={suspensionMutation.isPending ? "Envoi..." : "Envoyer la demande"}
        onConfirm={() => {
          if (!suspensionReason.trim()) {
            toast("Renseignez un motif avant d'envoyer.");
            return;
          }
          suspensionMutation.mutate();
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold" htmlFor="suspension-category">
              Type de demande
            </label>
            <select
              id="suspension-category"
              value={suspensionCategory}
              onChange={(event) => setSuspensionCategory(event.target.value as SuspensionCategory)}
              className="mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none"
            >
              <option value="amicable">Suspension amiable</option>
              <option value="dispute">Litige</option>
            </select>
          </div>
          <TextAreaField
            label="Motif"
            rows={4}
            value={suspensionReason}
            onChange={(event) => setSuspensionReason(event.target.value)}
            placeholder="Expliquez la raison de cette demande..."
          />
        </div>
      </ActionModal>

      <ActionModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        title="Payer l'agence"
        description="Réglez les frais du projet directement à l'agence en charge."
        confirmLabel={payAgencyMutation.isPending ? "Paiement..." : "Confirmer le paiement"}
        onConfirm={() => {
          if (!providerToken.trim()) {
            toast("Renseignez vos coordonnées de paiement avant de continuer.");
            return;
          }
          payAgencyMutation.mutate();
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold" htmlFor="payment-method">
              Moyen de paiement
            </label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as "Card" | "Bank Transfer" | "PayPal")
              }
              className="mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none"
            >
              <option value="Card">Carte bancaire</option>
              <option value="Bank Transfer">Virement bancaire</option>
              <option value="PayPal">PayPal</option>
            </select>
          </div>
          <TextField
            label="Numéro / IBAN / identifiant"
            placeholder="4242 4242 4242 4242"
            value={providerToken}
            onChange={(event) => setProviderToken(event.target.value)}
          />
        </div>
      </ActionModal>

      {/* AJOUTÉ (demande explicite, négociation) : refuser un devis n'est
          plus définitif — l'agence peut renvoyer une offre ajustée, ce
          message (optionnel) l'aide à comprendre ce qui ne convenait pas. */}
      <ActionModal
        open={refusingProposal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRefusingProposal(null);
            setRefusalMessage("");
          }
        }}
        title="Refuser ce devis"
        description="L'agence sera notifiée et pourra vous envoyer une nouvelle offre ajustée — indiquez ce qui ne convient pas (budget, délai...) pour l'aider à mieux répondre."
        confirmLabel={
          respondMutation.isPending && respondMutation.variables?.decision === "refuse"
            ? "Envoi..."
            : "Refuser le devis"
        }
        onConfirm={() => {
          if (!refusingProposal) return;
          const trimmedMessage = refusalMessage.trim();
          respondMutation.mutate({
            proposalId: refusingProposal.id,
            decision: "refuse",
            ...(trimmedMessage ? { message: trimmedMessage } : {}),
          });
        }}
      >
        <TextAreaField
          label="Motif ou contre-proposition (optionnel)"
          rows={4}
          value={refusalMessage}
          onChange={(event) => setRefusalMessage(event.target.value)}
          placeholder="Ex. Budget trop élevé, nous visions plutôt 3000€..."
        />
      </ActionModal>
    </DashboardShell>
  );
}
