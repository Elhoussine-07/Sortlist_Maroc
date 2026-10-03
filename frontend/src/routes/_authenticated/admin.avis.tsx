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
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

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

const PAGE_TEXT = {
  "Avis publié.": {
    en: "Review published.",
    ar: "تم نشر التقييم.",
    es: "Reseña publicada.",
  },
  "Avis rejeté.": {
    en: "Review rejected.",
    ar: "تم رفض التقييم.",
    es: "Reseña rechazada.",
  },
  "Impossible d'enregistrer la décision.": {
    en: "Unable to save the decision.",
    ar: "تعذّر حفظ القرار.",
    es: "No se pudo guardar la decisión.",
  },
  "Compte suspendu.": {
    en: "Account suspended.",
    ar: "تم تعليق الحساب.",
    es: "Cuenta suspendida.",
  },
  "Compte signalé.": {
    en: "Account flagged.",
    ar: "تم الإبلاغ عن الحساب.",
    es: "Cuenta reportada.",
  },
  "Impossible d'enregistrer l'action.": {
    en: "Unable to save the action.",
    ar: "تعذّر حفظ الإجراء.",
    es: "No se pudo guardar la acción.",
  },
  "Avis & comptes": {
    en: "Reviews & accounts",
    ar: "التقييمات والحسابات",
    es: "Reseñas y cuentas",
  },
  "Modération des avis et actions sur les comptes Client/Agence.": {
    en: "Review moderation and actions on Client/Agency accounts.",
    ar: "الإشراف على التقييمات واتخاذ الإجراءات على حسابات العملاء/الوكالات.",
    es: "Moderación de reseñas y acciones sobre las cuentas de Cliente/Agencia.",
  },
  "Avis Client → Agence en attente": {
    en: "Pending Client → Agency reviews",
    ar: "تقييمات العميل ← الوكالة قيد الانتظار",
    es: "Reseñas Cliente → Agencia pendientes",
  },
  "Doivent être approuvés avant publication.": {
    en: "Must be approved before publication.",
    ar: "يجب الموافقة عليها قبل النشر.",
    es: "Deben aprobarse antes de su publicación.",
  },
  "Aucun avis en attente.": {
    en: "No reviews pending.",
    ar: "لا توجد تقييمات قيد الانتظار.",
    es: "No hay reseñas pendientes.",
  },
  "Noté par {name}": {
    en: "Rated by {name}",
    ar: "قيّمه {name}",
    es: "Calificado por {name}",
  },
  "Approuver": {
    en: "Approve",
    ar: "الموافقة",
    es: "Aprobar",
  },
  "Rejeter": {
    en: "Reject",
    ar: "رفض",
    es: "Rechazar",
  },
  "Signaler l'agence": {
    en: "Flag the agency",
    ar: "الإبلاغ عن الوكالة",
    es: "Reportar la agencia",
  },
  "Suspendre l'agence": {
    en: "Suspend the agency",
    ar: "تعليق الوكالة",
    es: "Suspender la agencia",
  },
  "Avis Agence → Client (récents)": {
    en: "Agency → Client reviews (recent)",
    ar: "تقييمات الوكالة ← العميل (الأحدث)",
    es: "Reseñas Agencia → Cliente (recientes)",
  },
  "Publiés directement (pas de file de modération sur ce sens) — listés ici pour visibilité.": {
    en: "Published directly (no moderation queue in this direction) — listed here for visibility.",
    ar: "تُنشر مباشرة (لا توجد قائمة انتظار للإشراف في هذا الاتجاه) — مدرجة هنا للعرض فقط.",
    es: "Publicadas directamente (sin cola de moderación en este sentido) — aparecen aquí solo para visibilidad.",
  },
  "Aucun avis récent.": {
    en: "No recent reviews.",
    ar: "لا توجد تقييمات حديثة.",
    es: "No hay reseñas recientes.",
  },
  "Signaler le client": {
    en: "Flag the client",
    ar: "الإبلاغ عن العميل",
    es: "Reportar al cliente",
  },
  "Suspendre le client": {
    en: "Suspend the client",
    ar: "تعليق العميل",
    es: "Suspender al cliente",
  },
  "Confirmer la suspension": {
    en: "Confirm suspension",
    ar: "تأكيد التعليق",
    es: "Confirmar la suspensión",
  },
  "Confirmer le signalement": {
    en: "Confirm flagging",
    ar: "تأكيد الإبلاغ",
    es: "Confirmar el reporte",
  },
  "Compte : {label}": {
    en: "Account: {label}",
    ar: "الحساب: {label}",
    es: "Cuenta: {label}",
  },
  "Confirmer": {
    en: "Confirm",
    ar: "تأكيد",
    es: "Confirmar",
  },
  "Motif (obligatoire)": {
    en: "Reason (required)",
    ar: "السبب (إلزامي)",
    es: "Motivo (obligatorio)",
  },
  "Motif (optionnel)": {
    en: "Reason (optional)",
    ar: "السبب (اختياري)",
    es: "Motivo (opcional)",
  },
  "Ex. avis mentionnant un comportement frauduleux...": {
    en: "E.g. a review mentioning fraudulent behavior...",
    ar: "مثال: تقييم يذكر سلوكًا احتياليًا...",
    es: "Ej. una reseña que menciona un comportamiento fraudulento...",
  },
} satisfies PageTextDict;

function AdminReviewsPage() {
  const { tt } = usePageText(PAGE_TEXT);
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
      toast(variables.approve ? tt("Avis publié.") : tt("Avis rejeté."));
      void queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible d'enregistrer la décision."));
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
      toast(actionKind === "suspend" ? tt("Compte suspendu.") : tt("Compte signalé."));
      setActionTarget(null);
      setActionKind(null);
      setActionReason("");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible d'enregistrer l'action."));
    },
  });

  if (role !== "admin") return null;

  return (
    <DashboardShell role="admin">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="text-[24px] font-bold tracking-tight">{tt("Avis & comptes")}</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          {tt("Modération des avis et actions sur les comptes Client/Agence.")}
        </p>

        <div className="mt-7">
          <SectionCard
            title={tt("Avis Client → Agence en attente")}
            description={tt("Doivent être approuvés avant publication.")}
          >
            {agencyReviewsQuery.isPending ? (
              <StackSkeleton count={3} />
            ) : agencyReviews.length === 0 ? (
              <EmptyState message={tt("Aucun avis en attente.")} />
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
                          {tt("Noté par {name}").replace("{name}", review.clientName)}
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
                        {tt("Approuver")}
                      </button>
                      <button
                        type="button"
                        disabled={moderateMutation.isPending}
                        onClick={() => moderateMutation.mutate({ id: review.id, approve: false })}
                        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {tt("Rejeter")}
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
                        {tt("Signaler l'agence")}
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
                        {tt("Suspendre l'agence")}
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
            title={tt("Avis Agence → Client (récents)")}
            description={tt(
              "Publiés directement (pas de file de modération sur ce sens) — listés ici pour visibilité.",
            )}
          >
            {clientReviewsQuery.isPending ? (
              <StackSkeleton count={3} />
            ) : clientReviews.length === 0 ? (
              <EmptyState message={tt("Aucun avis récent.")} />
            ) : (
              <div className="space-y-4">
                {clientReviews.map((review) => (
                  <article key={review.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold">{review.clientName}</p>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                          {tt("Noté par {name}").replace(
                            "{name}",
                            review.agencyName ?? review.agency,
                          )}
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
                        {tt("Signaler le client")}
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
                        {tt("Suspendre le client")}
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
        title={actionKind === "suspend" ? tt("Confirmer la suspension") : tt("Confirmer le signalement")}
        description={actionTarget ? tt("Compte : {label}").replace("{label}", actionTarget.label) : ""}
        confirmLabel={accountActionMutation.isPending ? "..." : tt("Confirmer")}
        onConfirm={() => accountActionMutation.mutate()}
      >
        <TextAreaField
          label={actionKind === "flag" ? tt("Motif (obligatoire)") : tt("Motif (optionnel)")}
          rows={4}
          value={actionReason}
          onChange={(event) => setActionReason(event.target.value)}
          placeholder={tt("Ex. avis mentionnant un comportement frauduleux...")}
        />
      </ActionModal>
    </DashboardShell>
  );
}
