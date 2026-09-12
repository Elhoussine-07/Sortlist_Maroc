import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  Search,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  User,
  CalendarDays,
  FileText,
  Eye,
  ChevronDown,
  Filter,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SearchInput, SectionCard, StatusBadge, StatusTabs } from "@/components/common/Blocks";
import { FilterSelect, ListPagination } from "@/components/common/ListControls";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StackSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import { ActionModal } from "@/components/common/ActionModal";
import { TextAreaField } from "@/components/common/Blocks";
import {
  getSuspensionCases,
  getSuspensionHistory,
  respondToAmicableSuspension,
  respondToLitigeNotice,
  respondToSuspension,
  type SuspensionCase,
} from "@/services/agency-projects.service";
import { ApiError } from "@/services/http";

export const Route = createFileRoute("/_authenticated/agence/suspension")({
  head: () => ({
    meta: [
      { title: "Suspensions et litiges | Sortlist" },
      {
        name: "description",
        content:
          "Gérez les suspensions de projet, répondez aux signalements et consultez l'historique des litiges.",
      },
      { property: "og:title", content: "Suspensions et litiges | Sortlist" },
      {
        property: "og:description",
        content: "Suivi des litiges et signalements côté agence.",
      },
    ],
  }),
  component: AgencySuspensionPage,
});

type StatusConfig = {
  bg: string;
  text: string;
  border: string;
  icon: LucideIcon;
  label: string;
};

const STATUS_STYLES: Record<string, StatusConfig> = {
  Requested: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
    label: "Demande en attente",
  },
  Validated: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
    label: "Validée",
  },
  Refused: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    icon: XCircle,
    label: "Refusée",
  },
  Resumed: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: CheckCircle2,
    label: "Reprise",
  },
  Founded: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: AlertCircle,
    label: "Litige fondé",
  },
  "Not Founded": {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
    label: "Litige non fondé",
  },
  Closed: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    icon: CheckCircle2,
    label: "Clôturé",
  },
  Pending: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-200",
    icon: AlertCircle,
    label: "Préavis en cours",
  },
};

function getStatusConfig(status: string): StatusConfig {
  const config = STATUS_STYLES[status] ?? STATUS_STYLES["Requested"];
  return config as StatusConfig;
}

const TABS = [
  { value: "all", label: "Tous" },
  { value: "amicable", label: "Résolution amiable" },
  { value: "dispute", label: "Litige" },
  { value: "closed", label: "Clôturés" },
];

function isPendingLitigeNotice(item: SuspensionCase): boolean {
  return item.litigeNoticeStatus === "Pending";
}

function describeNoticeDeadline(deadline: string | null): string {
  if (!deadline) return "";
  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs <= 0) return "Délai dépassé — en cours de traitement";
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  return `${hours}h${minutes.toString().padStart(2, "0")} restantes pour répondre`;
}

function isPendingAmicableFromClient(item: SuspensionCase): boolean {
  return (
    item.category === "amicable" && item.requestedBy === "client" && item.status === "Requested"
  );
}

function buildColumns(
  onSelect: (item: SuspensionCase) => void,
  onDecide: (item: SuspensionCase, decision: "accept" | "refuse") => void,
  onRespondToLitigeNotice: (item: SuspensionCase) => void,
  onViewDetails: (item: SuspensionCase) => void,
): Column<SuspensionCase>[] {
  return [
    {
      key: "case",
      header: "Dossier",
      width: "minmax(0,2.2fr)",
      render: (item) => (
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shadow-sm">
            <ShieldAlert className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <p className="font-display truncate text-[14px] font-bold leading-tight tracking-tight text-foreground transition-colors hover:text-primary">
              {item.projectTitle}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40" />
              {item.clientName}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Motif",
      render: (item) => (
        <p className="truncate text-[13px] text-muted-foreground">
          {item.reason || "Non spécifié"}
        </p>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (item) => {
        if (isPendingLitigeNotice(item)) {
          return (
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-[12px] font-semibold text-rose-700 border border-rose-200">
                <AlertCircle className="h-3 w-3" />
                Litige fondé — préavis
              </span>
              <p className="text-[11px] text-muted-foreground">
                {describeNoticeDeadline(item.agencyNoticeDeadline)}
              </p>
            </div>
          );
        }
        const config = getStatusConfig(item.status);
        const Icon = config.icon;
        return (
          <span
            className={`
              inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold
              ${config.bg} ${config.text} border ${config.border}
              shadow-sm transition-all hover:scale-105
            `}
          >
            <Icon className="h-3 w-3" strokeWidth={2} />
            {config.label}
          </span>
        );
      },
    },
    {
      key: "openedAt",
      header: "Ouvert le",
      render: (item) => (
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.6} />
          <span className="truncate">{item.openedAt}</span>
        </p>
      ),
    },
    {
      key: "moderator",
      header: "Modérateur",
      render: (item) => (
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <User className="h-3.5 w-3.5" strokeWidth={1.6} />
          <span className="truncate">{item.moderator ?? "Non assigné"}</span>
        </p>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          {isPendingLitigeNotice(item) ? (
            <button
              type="button"
              onClick={() => onRespondToLitigeNotice(item)}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-rose-700 hover:shadow-md"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Justifier
            </button>
          ) : isPendingAmicableFromClient(item) ? (
            <>
              <button
                type="button"
                onClick={() => onDecide(item, "accept")}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Accepter
              </button>
              <button
                type="button"
                onClick={() => onDecide(item, "refuse")}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all hover:bg-accent hover:shadow-sm"
              >
                <XCircle className="h-3.5 w-3.5" />
                Refuser
              </button>
            </>
          ) : item.status === "Requested" ? (
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all hover:bg-accent hover:shadow-sm"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Répondre
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onViewDetails(item)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all hover:bg-accent hover:shadow-sm"
          >
            <Eye className="h-3.5 w-3.5" />
            Détails
          </button>
        </div>
      ),
    },
  ];
}

function AgencySuspensionPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isRespondOpen, setIsRespondOpen] = useState(false);
  const [response, setResponse] = useState("");
  const [selectedCase, setSelectedCase] = useState<SuspensionCase | null>(null);
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"recent" | "old">("recent");

  const casesQuery = useQuery({
    queryKey: ["agency", "suspensions", activeTab, query, page],
    queryFn: () =>
      getSuspensionCases({
        ...(query.trim() ? { query: query.trim() } : {}),
        ...(activeTab !== "all" ? { status: activeTab } : {}),
        page,
        pageSize: 20,
      }),
  });
  const cases = casesQuery.data?.items ?? [];
  const isLoading = casesQuery.isLoading;
  const counts = casesQuery.data?.counts ?? {};
  const total = casesQuery.data?.total ?? null;
  const totalPages = casesQuery.data?.totalPages ?? null;

  const historyQuery = useQuery({
    queryKey: ["agency", "suspensions", "history", selectedCase?.id],
    queryFn: () => getSuspensionHistory(selectedCase?.id ?? ""),
    enabled: selectedCase !== null,
  });
  const history = historyQuery.data ?? [];
  const isHistoryLoading = historyQuery.isLoading;

  const respondMutation = useMutation({
    mutationFn: (payload: { message: string }) => {
      if (!selectedCase) throw new Error("Sélectionnez d'abord un dossier dans la liste.");
      return respondToSuspension(selectedCase.id, payload);
    },
    onSuccess: () => {
      toast("Réponse envoyée avec succès");
      void queryClient.invalidateQueries({ queryKey: ["agency", "suspensions"] });
      setIsRespondOpen(false);
      setResponse("");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Endpoint indisponible pour le moment.");
    },
  });

  const [litigeNoticeTarget, setLitigeNoticeTarget] = useState<SuspensionCase | null>(null);
  const [litigeNoticeMessage, setLitigeNoticeMessage] = useState("");

  const litigeNoticeMutation = useMutation({
    mutationFn: () => {
      if (!litigeNoticeTarget) throw new Error("Aucun dossier sélectionné.");
      return respondToLitigeNotice(litigeNoticeTarget.id, litigeNoticeMessage.trim());
    },
    onSuccess: () => {
      toast("Justification envoyée au modérateur.");
      void queryClient.invalidateQueries({ queryKey: ["agency", "suspensions"] });
      setLitigeNoticeTarget(null);
      setLitigeNoticeMessage("");
    },
    onError: (error) => {
      toast(
        error instanceof ApiError ? error.message : "Impossible d'envoyer votre justification.",
      );
    },
  });

  const [decisionTarget, setDecisionTarget] = useState<SuspensionCase | null>(null);
  const [decisionType, setDecisionType] = useState<"accept" | "refuse" | null>(null);
  const [decisionMessage, setDecisionMessage] = useState("");

  const decisionMutation = useMutation({
    mutationFn: () => {
      if (!decisionTarget || !decisionType) {
        throw new Error("Aucune demande sélectionnée.");
      }
      return respondToAmicableSuspension(
        decisionTarget.id,
        decisionType,
        decisionMessage.trim() || undefined,
      );
    },
    onSuccess: () => {
      toast(
        decisionType === "accept"
          ? "Suspension acceptée — le projet passe Suspendu."
          : "Demande refusée.",
      );
      void queryClient.invalidateQueries({ queryKey: ["agency", "suspensions"] });
      setDecisionTarget(null);
      setDecisionType(null);
      setDecisionMessage("");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer votre décision.");
    },
  });

  const sortedCases = [...cases];
  if (sortDirection === "old") {
    sortedCases.reverse();
  }

  return (
    <DashboardShell role="agency">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px]">
        {/* ✅ EN-TÊTE MODERNISÉ */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <ShieldAlert className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </div>
            <div>
              <h1 className="font-display text-[24px] font-bold tracking-tight">
                Suspension & litiges
              </h1>
              <p className="mt-1 text-[14px] text-muted-foreground">
                Gérez les litiges et suivez leur résolution.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary">
              <TrendingUp className="inline h-3.5 w-3.5 mr-1" />
              {total ?? 0} dossier{total !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ✅ RECHERCHE MODERNISÉE */}
        <div className="mt-7">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un dossier..."
              className="w-full rounded-xl border border-border bg-card px-10 py-3 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-md transition-all"
            />
          </div>
        </div>

        {/* ✅ TABS MODERNISÉS */}
        <div className="mt-6">
          <StatusTabs tabs={TABS} value={activeTab} onChange={setActiveTab} counts={counts} />
        </div>

        {/* ✅ FILTRES MODERNISÉS */}
        <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Statut
            </label>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all">
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="validated">Validé</option>
              <option value="refused">Refusé</option>
              <option value="closed">Clôturé</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Période
            </label>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all">
              <option value="">Toutes les périodes</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">90 derniers jours</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Motif
            </label>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all">
              <option value="">Tous les motifs</option>
              <option value="retard">Retard</option>
              <option value="qualite">Qualité</option>
              <option value="communication">Communication</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        </div>

        {/* ✅ COMPTEUR + TRI */}
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">
            {total ?? 0} dossier{total !== 1 ? "s" : ""}
          </p>
          <button
            onClick={() => setSortDirection((current) => (current === "recent" ? "old" : "recent"))}
            type="button"
            className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Trier par : {sortDirection === "recent" ? "Plus récents" : "Plus anciens"}
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>

        {/* ✅ TABLEAU MODERNISÉ */}
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <DataTable
            columns={buildColumns(
              (item) => {
                setSelectedCase(item);
                setIsRespondOpen(true);
              },
              (item, decision) => {
                setDecisionTarget(item);
                setDecisionType(decision);
                setDecisionMessage("");
              },
              (item) => {
                setLitigeNoticeTarget(item);
                setLitigeNoticeMessage("");
              },
              (item) => {
                setSelectedCase(item);
                document
                  .getElementById("dossier-detail")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              },
            )}
            rows={sortedCases}
            isLoading={isLoading}
          />
        </div>

        <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {/* ✅ SECTION DÉTAIL DU DOSSIER MODERNISÉE */}
        <section id="dossier-detail" className="mt-9 scroll-mt-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-[18px] font-bold">
                  {selectedCase ? `Dossier — ${selectedCase.projectTitle}` : "Détail du dossier"}
                </h2>
                {selectedCase && (
                  <p className="mt-1 text-[14px] text-muted-foreground">
                    {selectedCase.clientName} •{" "}
                    {selectedCase.category === "dispute" ? "Litige" : "Suspension amiable"} •{" "}
                    {selectedCase.statusLabel}
                  </p>
                )}
              </div>
              {selectedCase && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary">
                  #{selectedCase.id?.slice(0, 8) || "N/A"}
                </span>
              )}
            </div>

            {selectedCase === null ? (
              <div className="py-12 text-center">
                <ShieldAlert
                  className="mx-auto h-12 w-12 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <p className="mt-4 text-[15px] text-muted-foreground">
                  Cliquez sur <span className="font-semibold text-foreground">"Détails"</span> sur
                  une ligne pour afficher le dossier.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Motif
                    </p>
                    <p className="mt-1 text-[13px] font-semibold">
                      {selectedCase.reason || "Non spécifié"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Ouvert le
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedCase.openedAt || "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Demandé par
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedCase.requestedBy === "client"
                        ? "Le client"
                        : selectedCase.requestedBy === "agency"
                          ? "Votre agence"
                          : selectedCase.requestedBy === "system"
                            ? "Système"
                            : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Modérateur
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedCase.moderator ?? "Non assigné"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 flex items-center gap-2 text-[13.5px] font-bold">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Chronologie
                  </p>
                  {isHistoryLoading ? (
                    <StackSkeleton count={3} />
                  ) : history.length === 0 ? (
                    <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">
                      Aucune activité pour ce dossier.
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {history.map((entry) => (
                        <li key={entry.id} className="relative border-l-2 border-border pl-5">
                          <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-background bg-primary" />
                          <p className="text-[12px] text-muted-foreground">{entry.date}</p>
                          <p className="mt-0.5 text-[13.5px] font-semibold">{entry.title}</p>
                          <p className="text-[13px] text-muted-foreground">{entry.description}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ✅ MODAL RÉPONSE MODERNISÉE */}
      <ActionModal
        open={isRespondOpen}
        onOpenChange={(open) => {
          setIsRespondOpen(open);
          if (!open) setSelectedCase(null);
        }}
        title="Répondre au signalement"
        description={
          selectedCase
            ? `Dossier "${selectedCase.projectTitle}" — votre réponse est transmise au client et au modérateur.`
            : "Votre réponse est transmise au client et au modérateur."
        }
        confirmLabel={respondMutation.isPending ? "Envoi..." : "Envoyer la réponse"}
        onConfirm={() => {
          if (!response.trim()) {
            toast("Renseignez une réponse avant d'envoyer.");
            return;
          }
          respondMutation.mutate({ message: response.trim() });
        }}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-accent/30 p-3 text-center">
            <p className="text-[12px] text-muted-foreground">Dossier</p>
            <p className="font-semibold">{selectedCase?.projectTitle || "—"}</p>
          </div>
          <TextAreaField
            label="Votre réponse"
            rows={5}
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            placeholder="Expliquez votre position..."
          />
        </div>
      </ActionModal>

      {/* ✅ MODAL DÉCISION MODERNISÉE */}
      <ActionModal
        open={decisionTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDecisionTarget(null);
            setDecisionType(null);
            setDecisionMessage("");
          }
        }}
        title={decisionType === "accept" ? "Accepter la suspension" : "Refuser la suspension"}
        description={
          decisionTarget
            ? `Dossier "${decisionTarget.projectTitle}" — ${
                decisionType === "accept"
                  ? "le projet passera Suspendu dès confirmation."
                  : "le projet reste En cours, le client est notifié du refus."
              }`
            : ""
        }
        confirmLabel={
          decisionMutation.isPending
            ? "Envoi..."
            : decisionType === "accept"
              ? "Accepter"
              : "Refuser"
        }
        onConfirm={() => decisionMutation.mutate()}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-accent/30 p-3 text-center">
            <p className="text-[12px] text-muted-foreground">Décision</p>
            <p
              className={`font-semibold ${decisionType === "accept" ? "text-emerald-600" : "text-red-600"}`}
            >
              {decisionType === "accept" ? "✅ Accepter la suspension" : "❌ Refuser la suspension"}
            </p>
          </div>
          <TextAreaField
            label="Message de réponse (optionnel)"
            rows={4}
            value={decisionMessage}
            onChange={(event) => setDecisionMessage(event.target.value)}
            placeholder="Expliquez votre décision au client..."
          />
        </div>
      </ActionModal>

      {/* ✅ MODAL LITIGE MODERNISÉE */}
      <ActionModal
        open={litigeNoticeTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLitigeNoticeTarget(null);
            setLitigeNoticeMessage("");
          }
        }}
        title="Répondre au litige"
        description={
          litigeNoticeTarget
            ? `Dossier "${litigeNoticeTarget.projectTitle}" — le modérateur a jugé le litige du client fondé. Votre justification sera examinée avant toute décision finale. ${describeNoticeDeadline(litigeNoticeTarget.agencyNoticeDeadline)}`
            : ""
        }
        confirmLabel={litigeNoticeMutation.isPending ? "Envoi..." : "Envoyer ma justification"}
        onConfirm={() => {
          if (!litigeNoticeMessage.trim()) {
            toast("Renseignez votre justification avant d'envoyer.");
            return;
          }
          litigeNoticeMutation.mutate();
        }}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-center dark:border-rose-800 dark:bg-rose-950/30">
            <AlertCircle className="mx-auto h-6 w-6 text-rose-600" />
            <p className="mt-1 text-[13px] font-semibold text-rose-600">
              Litige fondé — préavis en cours
            </p>
            <p className="text-[12px] text-muted-foreground">
              {litigeNoticeTarget &&
                describeNoticeDeadline(litigeNoticeTarget.agencyNoticeDeadline)}
            </p>
          </div>
          <TextAreaField
            label="Votre justification"
            rows={5}
            value={litigeNoticeMessage}
            onChange={(event) => setLitigeNoticeMessage(event.target.value)}
            placeholder="Expliquez pourquoi le projet devrait reprendre..."
          />
        </div>
      </ActionModal>
    </DashboardShell>
  );
}
