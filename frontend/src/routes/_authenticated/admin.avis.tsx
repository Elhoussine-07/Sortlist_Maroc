import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ShieldAlert, Star, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SectionCard, TextAreaField } from "@/components/common/Blocks";
import { StackSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import { ActionModal } from "@/components/common/ActionModal";
import { useAuthStore } from "@/store/auth.store";
import { ApiError } from "@/services/http";
import {
  flagAccount,
  listPendingAgencyReviews,
  listRecentClientReviews,
  moderateAgencyReview,
  suspendAccount,
  type AccountType,
} from "@/services/moderation.service";

export const Route = createFileRoute("/_authenticated/admin/avis")({
  head: () => ({
    meta: [{ title: "Avis & comptes — Administration" }],
  }),
  component: AdminReviewsPage,
});

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className="h-3.5 w-3.5"
          strokeWidth={1.8}
          fill={value <= rating ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

interface AccountActionTarget {
  accountType: AccountType;
  target: string;
  label: string;
}

function AdminReviewsPage() {
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

  const agencyReviewsQuery = useQuery({
    queryKey: ["admin", "reviews", "agency-pending"],
    queryFn: () => listPendingAgencyReviews(),
    enabled: role === "admin",
  });
  const agencyReviews = agencyReviewsQuery.data ?? [];

  const clientReviewsQuery = useQuery({
    queryKey: ["admin", "reviews", "client-recent"],
    queryFn: () => listRecentClientReviews(),
    enabled: role === "admin",
  });
  const clientReviews = clientReviewsQuery.data ?? [];

  const moderateMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      moderateAgencyReview(id, approve),
    onSuccess: (_data, variables) => {
      toast(variables.approve ? "Avis publié." : "Avis rejeté.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer la décision.");
    },
  });

  const [actionTarget, setActionTarget] = useState<AccountActionTarget | null>(null);
  const [actionKind, setActionKind] = useState<"suspend" | "flag" | null>(null);
  const [actionReason, setActionReason] = useState("");

  const accountActionMutation = useMutation({
    mutationFn: () => {
      if (!actionTarget || !actionKind) throw new Error("Aucun compte sélectionné.");
      return actionKind === "suspend"
        ? suspendAccount(
            actionTarget.accountType,
            actionTarget.target,
            actionReason.trim() || undefined,
          )
        : flagAccount(actionTarget.accountType, actionTarget.target, actionReason.trim());
    },
    onSuccess: () => {
      toast(actionKind === "suspend" ? "Compte suspendu." : "Compte signalé.");
      setActionTarget(null);
      setActionKind(null);
      setActionReason("");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer l'action.");
    },
  });

  if (role !== "admin") return null;

  return (
    <DashboardShell role="admin">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="text-[24px] font-bold tracking-tight">Avis & comptes</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Modération des avis et actions sur les comptes Client/Agence.
        </p>

        <div className="mt-7">
          <SectionCard
            title="Avis Client → Agence en attente"
            description="Doivent être approuvés avant publication."
          >
            {agencyReviewsQuery.isPending ? (
              <StackSkeleton count={3} />
            ) : agencyReviews.length === 0 ? (
              <EmptyState message="Aucun avis en attente." />
            ) : (
              <div className="space-y-4">
                {agencyReviews.map((review) => (
                  <article key={review.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold">
                          {review.agencyName ?? review.agency}
                        </p>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                          Noté par {review.clientName}
                        </p>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    {review.comment ? (
                      <p className="mt-3 text-[13px] text-muted-foreground">{review.comment}</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={moderateMutation.isPending}
                        onClick={() => moderateMutation.mutate({ id: review.id, approve: true })}
                        className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Approuver
                      </button>
                      <button
                        type="button"
                        disabled={moderateMutation.isPending}
                        onClick={() => moderateMutation.mutate({ id: review.id, approve: false })}
                        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Rejeter
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionTarget({
                            accountType: "agency",
                            target: review.agency,
                            label: review.agencyName ?? review.agency,
                          });
                          setActionKind("flag");
                        }}
                        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Signaler l'agence
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionTarget({
                            accountType: "agency",
                            target: review.agency,
                            label: review.agencyName ?? review.agency,
                          });
                          setActionKind("suspend");
                        }}
                        className="flex items-center gap-1.5 rounded-md border border-destructive px-3 py-2 text-[13px] font-semibold text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Suspendre l'agence
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="mt-7">
          <SectionCard
            title="Avis Agence → Client (récents)"
            description="Publiés directement (pas de file de modération sur ce sens) — listés ici pour visibilité."
          >
            {clientReviewsQuery.isPending ? (
              <StackSkeleton count={3} />
            ) : clientReviews.length === 0 ? (
              <EmptyState message="Aucun avis récent." />
            ) : (
              <div className="space-y-4">
                {clientReviews.map((review) => (
                  <article key={review.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold">{review.clientName}</p>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                          Noté par {review.agencyName ?? review.agency}
                        </p>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    {review.comment ? (
                      <p className="mt-3 text-[13px] text-muted-foreground">{review.comment}</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActionTarget({
                            accountType: "client",
                            target: review.client,
                            label: review.clientName,
                          });
                          setActionKind("flag");
                        }}
                        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Signaler le client
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionTarget({
                            accountType: "client",
                            target: review.client,
                            label: review.clientName,
                          });
                          setActionKind("suspend");
                        }}
                        className="flex items-center gap-1.5 rounded-md border border-destructive px-3 py-2 text-[13px] font-semibold text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Suspendre le client
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <ActionModal
        open={actionKind !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActionKind(null);
            setActionReason("");
          }
        }}
        title={actionKind === "suspend" ? "Confirmer la suspension" : "Confirmer le signalement"}
        description={actionTarget ? `Compte : ${actionTarget.label}` : ""}
        confirmLabel={accountActionMutation.isPending ? "..." : "Confirmer"}
        onConfirm={() => accountActionMutation.mutate()}
      >
        <TextAreaField
          label={actionKind === "flag" ? "Motif (obligatoire)" : "Motif (optionnel)"}
          rows={4}
          value={actionReason}
          onChange={(event) => setActionReason(event.target.value)}
          placeholder="Ex. avis mentionnant un comportement frauduleux..."
        />
      </ActionModal>
    </DashboardShell>
  );
}
