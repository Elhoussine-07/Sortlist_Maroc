import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  SearchInput,
  SectionCard,
  StatusTabs,
  StatusBadge,
  TextAreaField,
} from "@/components/common/Blocks";
import { StackSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import { ActionModal } from "@/components/common/ActionModal";
import { useAuthStore } from "@/store/auth.store";
import { ApiError } from "@/services/http";
import {
  approveSuspensionAsModerator,
  listPendingLitigeNotices,
  listPendingSuspensions,
  refuseSuspensionAsModerator,
  resolveDispute,
  resolveLitigeNotice,
  type LitigeNoticeCase,
  type ModerationCase,
} from "@/services/moderation.service";

export const Route = createFileRoute("/_authenticated/admin/litiges")({
  head: () => ({
    meta: [{ title: "Litiges & suspensions — Administration" }],
  }),
  component: AdminLitigesPage,
});

const TABS = [
  { value: "all", label: "Tous" },
  { value: "dispute", label: "Litiges" },
  { value: "amicable", label: "Suspensions amiables" },
];

function describeNoticeDeadline(deadline: string | null): string {
  if (!deadline) return "";
  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs <= 0) return "Délai dépassé";
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  return `${hours}h${minutes.toString().padStart(2, "0")} restantes pour l'agence`;
}

function AdminLitigesPage() {
  const role = useAuthStore((state) => state.role);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (role && role !== "admin") {
      void navigate({
        to: role === "agency" ? "/agence/tableau-de-bord" : "/client/tableau-de-bord",
      });
    }
  }, [role, navigate]);

  const casesQuery = useQuery({
    queryKey: ["admin", "moderation", "pending"],
    queryFn: () => listPendingSuspensions(),
    enabled: role === "admin",
  });
  const allCases = useMemo(() => casesQuery.data ?? [], [casesQuery.data]);

  const noticesQuery = useQuery({
    queryKey: ["admin", "moderation", "litige-notices"],
    queryFn: () => listPendingLitigeNotices(),
    enabled: role === "admin",
  });
  const litigeNotices = useMemo(() => noticesQuery.data ?? [], [noticesQuery.data]);

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dispute");

  const counts = useMemo(
    () => ({
      all: allCases.length,
      dispute: allCases.filter((item) => item.category === "dispute").length,
      amicable: allCases.filter((item) => item.category === "amicable").length,
    }),
    [allCases],
  );

  const filteredCases = useMemo(() => {
    let items = allCases;
    if (activeTab !== "all") {
      items = items.filter((item) => item.category === activeTab);
    }
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery) {
      items = items.filter((item) =>
        `${item.projectTitle} ${item.clientName} ${item.agencyName ?? ""} ${item.justification}`
          .toLowerCase()
          .includes(normalizedQuery),
      );
    }
    return [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [allCases, activeTab, query]);

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin", "moderation"] });

  const [verdictTarget, setVerdictTarget] = useState<ModerationCase | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [pendingFounded, setPendingFounded] = useState<boolean | null>(null);

  const resolveMutation = useMutation({
    mutationFn: ({ id, founded }: { id: string; founded: boolean }) =>
      resolveDispute(id, founded, decisionNote.trim() || undefined),
    onSuccess: (_data, variables) => {
      toast(
        variables.founded
          ? "Litige tranché : fondé — pour un litige déposé par l'agence, le projet est rejeté immédiatement ; pour un litige déposé par le client, l'agence dispose désormais d'un délai de réponse avant décision finale (cf. section « Litiges en préavis »)."
          : "Litige tranché : non fondé — le projet reprend son cours normal.",
      );
      invalidate();
      setVerdictTarget(null);
      setDecisionNote("");
      setPendingFounded(null);
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer le verdict.");
    },
  });

  const overrideMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approve" | "refuse" }) =>
      decision === "approve" ? approveSuspensionAsModerator(id) : refuseSuspensionAsModerator(id),
    onSuccess: (_data, variables) => {
      toast(
        variables.decision === "approve"
          ? "Suspension amiable validée par le modérateur."
          : "Suspension amiable refusée par le modérateur.",
      );
      invalidate();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer la décision.");
    },
  });

  const [noticeTarget, setNoticeTarget] = useState<LitigeNoticeCase | null>(null);
  const [noticeDecisionNote, setNoticeDecisionNote] = useState("");
  const [noticeAccept, setNoticeAccept] = useState<boolean | null>(null);

  const noticeMutation = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      resolveLitigeNotice(id, accept, noticeDecisionNote.trim() || undefined),
    onSuccess: (_data, variables) => {
      toast(
        variables.accept
          ? "Justification de l'agence acceptée — le projet reprend son cours normal."
          : "Justification jugée insuffisante — le projet est rejeté (conséquences CDC §2.5.3 appliquées).",
      );
      invalidate();
      setNoticeTarget(null);
      setNoticeDecisionNote("");
      setNoticeAccept(null);
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer la décision.");
    },
  });

  if (role !== "admin") return null;

  return (
    <DashboardShell role="admin">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="text-[24px] font-bold tracking-tight">Litiges & suspensions</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          File d'attente des dossiers en attente, tous projets/agences/clients confondus.
        </p>

        {litigeNotices.length > 0 ? (
          <div className="mt-7">
            <SectionCard
              title="Litiges en préavis — décision finale"
              description="Litiges client déjà jugés fondés : l'agence a été invitée à répondre avant conséquences finales (rejet du projet)."
            >
              <div className="space-y-4">
                {litigeNotices.map((item) => (
                  <article key={item.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold">{item.projectTitle}</p>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                          {item.clientName} — {item.agencyName ?? "Agence inconnue"}
                        </p>
                      </div>
                      <StatusBadge
                        label={
                          item.litigeNoticeStatus === "Responded"
                            ? "Agence a répondu"
                            : `En attente — ${describeNoticeDeadline(item.agencyNoticeDeadline)}`
                        }
                      />
                    </div>

                    <p className="mt-3 text-[13px] text-muted-foreground">
                      <span className="font-semibold">Justification client : </span>
                      {item.justification}
                    </p>

                    {item.agencyResponse ? (
                      <p className="mt-2 rounded-md bg-accent/40 p-2.5 text-[13px]">
                        <span className="font-semibold">Réponse de l'agence : </span>
                        {item.agencyResponse}
                      </p>
                    ) : (
                      <p className="mt-2 text-[13px] text-muted-foreground">
                        L'agence n'a pas encore répondu.
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNoticeTarget(item);
                          setNoticeAccept(true);
                        }}
                        className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Accepter — reprendre le projet
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNoticeTarget(item);
                          setNoticeAccept(false);
                        }}
                        className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent"
                      >
                        <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Rejeter le projet
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </SectionCard>
          </div>
        ) : null}

        <div className="mt-8">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher par projet, client, agence..."
          />
        </div>

        <div className="mt-6">
          <StatusTabs tabs={TABS} value={activeTab} onChange={setActiveTab} counts={counts} />
        </div>

        <div className="mt-6">
          {casesQuery.isPending ? (
            <StackSkeleton count={4} />
          ) : filteredCases.length === 0 ? (
            <EmptyState message="Aucun dossier en attente dans cette vue." />
          ) : (
            <div className="space-y-4">
              {filteredCases.map((item) => (
                <article key={item.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold">{item.projectTitle}</p>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {item.clientName} — {item.agencyName ?? "Agence inconnue"}
                      </p>
                    </div>
                    <StatusBadge
                      label={item.category === "dispute" ? "Litige" : "Suspension amiable"}
                    />
                  </div>

                  {item.justification ? (
                    <p className="mt-3 text-[13px] text-muted-foreground">{item.justification}</p>
                  ) : null}

                  {item.category === "dispute" ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setVerdictTarget(item);
                          setPendingFounded(true);
                        }}
                        className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Litige fondé
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVerdictTarget(item);
                          setPendingFounded(false);
                        }}
                        className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent"
                      >
                        <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Litige non fondé
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-[13px] text-muted-foreground">
                        En attente de la décision directe de l'agence. Le bouton ci-dessous est un
                        filet de sécurité (agence injoignable/inactive) — pas le flux nominal.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={overrideMutation.isPending}
                          onClick={() =>
                            overrideMutation.mutate({ id: item.id, decision: "approve" })
                          }
                          className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                          Forcer la validation
                        </button>
                        <button
                          type="button"
                          disabled={overrideMutation.isPending}
                          onClick={() =>
                            overrideMutation.mutate({ id: item.id, decision: "refuse" })
                          }
                          className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                          Forcer le refus
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <ActionModal
        open={verdictTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setVerdictTarget(null);
            setDecisionNote("");
            setPendingFounded(null);
          }
        }}
        title={pendingFounded ? "Confirmer : litige fondé" : "Confirmer : litige non fondé"}
        description={
          pendingFounded
            ? "Litige déposé par l'agence (client inactif) : le projet est rejeté immédiatement et la commission créditée à l'agence. Litige déposé par le client (agence défaillante) : le projet reste Suspendu, l'agence reçoit un délai de réponse avant décision finale (section « Litiges en préavis »)."
            : "Le projet reprend son cours normal, comme un simple « Reprendre »."
        }
        confirmLabel={resolveMutation.isPending ? "..." : "Confirmer le verdict"}
        onConfirm={() => {
          if (!verdictTarget || pendingFounded === null) return;
          resolveMutation.mutate({ id: verdictTarget.id, founded: pendingFounded });
        }}
      >
        <TextAreaField
          label="Note de décision (optionnel)"
          rows={4}
          value={decisionNote}
          onChange={(event) => setDecisionNote(event.target.value)}
          placeholder="Motivation du verdict, visible dans l'historique du dossier..."
        />
      </ActionModal>

      <ActionModal
        open={noticeTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setNoticeTarget(null);
            setNoticeDecisionNote("");
            setNoticeAccept(null);
          }
        }}
        title={noticeAccept ? "Confirmer : reprendre le projet" : "Confirmer : rejeter le projet"}
        description={
          noticeAccept
            ? "Le projet repasse En cours, l'opportunité de l'agence repasse Gagnée."
            : "Le projet passe Rejeté (sous-statut Agence défaillante), l'agence reçoit une pénalité PQI."
        }
        confirmLabel={noticeMutation.isPending ? "..." : "Confirmer"}
        onConfirm={() => {
          if (!noticeTarget || noticeAccept === null) return;
          noticeMutation.mutate({ id: noticeTarget.id, accept: noticeAccept });
        }}
      >
        <TextAreaField
          label="Note de décision (optionnel)"
          rows={4}
          value={noticeDecisionNote}
          onChange={(event) => setNoticeDecisionNote(event.target.value)}
          placeholder="Motivation de la décision finale..."
        />
      </ActionModal>
    </DashboardShell>
  );
}
