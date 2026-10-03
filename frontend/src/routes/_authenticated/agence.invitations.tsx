import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  TrendingUp,
  Mail,
  User,
  CalendarDays,
  MessageSquare,
  Filter,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SectionCard, StatusBadge, SearchInput } from "@/components/common/Blocks";
import { DataTable, type Column } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { ActionModal } from "@/components/common/ActionModal";
import { TextAreaField } from "@/components/common/Blocks";
import {
  approveJoinRequest,
  listJoinRequests,
  myJoinRequests,
  rejectJoinRequest,
  type JoinRequestReceived,
  type JoinRequestSent,
} from "@/services/agencies.service";
import { ApiError } from "@/services/http";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

export const Route = createFileRoute("/_authenticated/agence/invitations")({
  head: () => ({
    meta: [
      { title: "Invitations | Sortlist" },
      {
        name: "description",
        content: "Gérez les demandes de rattachement reçues et suivez vos demandes envoyées.",
      },
    ],
  }),
  component: AgencyInvitationsPage,
});

type StatusKey = "Pending" | "Approved" | "Rejected";

const STATUS_STYLES: Record<
  StatusKey,
  {
    bg: string;
    text: string;
    border: string;
    icon: typeof Clock;
    label: string;
  }
> = {
  Pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
    label: "En attente",
  },
  Approved: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
    label: "Acceptée",
  },
  Rejected: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: XCircle,
    label: "Refusée",
  },
};

function getStatusConfig(status: string): typeof STATUS_STYLES.Pending {
  if (status === "Pending" || status === "Approved" || status === "Rejected") {
    return STATUS_STYLES[status];
  }
  return STATUS_STYLES.Pending;
}

const SENT_STATUS_LABEL: Record<JoinRequestSent["status"], string> = {
  Pending: "En attente",
  Approved: "Acceptée",
  Rejected: "Refusée",
};

function receivedColumns(
  onAccept: (item: JoinRequestReceived) => void,
  onReject: (item: JoinRequestReceived) => void,
  pendingId: string | null,
  tt: (source: string) => string,
): Column<JoinRequestReceived>[] {
  return [
    {
      key: "user",
      header: tt("Utilisateur"),
      render: (item) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
            <User className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <p className="font-display truncate text-[14px] font-bold leading-tight tracking-tight text-foreground transition-colors hover:text-primary">
              {item.user}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40" />
              {tt("Demande de rattachement")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "context",
      header: tt("Contexte"),
      render: (item) => (
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.6} />
          <span className="truncate">{item.context || "—"}</span>
        </p>
      ),
    },
    {
      key: "requestedAt",
      header: tt("Demandé le"),
      render: (item) => (
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.6} />
          <span className="truncate">{item.requestedAt}</span>
        </p>
      ),
    },
    {
      key: "action",
      header: tt("Action"),
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pendingId === item.id}
            onClick={() => onAccept(item)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            {tt("Accepter")}
          </button>
          <button
            type="button"
            disabled={pendingId === item.id}
            onClick={() => onReject(item)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
            {tt("Refuser")}
          </button>
        </div>
      ),
    },
  ];
}

function sentColumns(tt: (source: string) => string): Column<JoinRequestSent>[] {
  return [
    {
      key: "agencyName",
      header: tt("Agence"),
      render: (item) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
            <Users className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <p className="font-display truncate text-[14px] font-bold leading-tight tracking-tight text-foreground transition-colors hover:text-primary">
              {item.agencyName}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40" />
              {tt("Demande envoyée")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: tt("Statut"),
      render: (item) => {
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
            {tt(config.label)}
          </span>
        );
      },
    },
    {
      key: "requestedAt",
      header: tt("Demandé le"),
      render: (item) => (
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.6} />
          <span className="truncate">{item.requestedAt}</span>
        </p>
      ),
    },
    {
      key: "note",
      header: tt("Réponse"),
      render: (item) => {
        if (item.status === "Rejected" && item.rejectionReason) {
          return (
            <p className="flex items-center gap-1.5 text-[13px] text-rose-600">
              <XCircle className="h-3.5 w-3.5" strokeWidth={1.6} />
              <span className="truncate">{item.rejectionReason}</span>
            </p>
          );
        }
        if (item.status === "Approved") {
          return (
            <p className="flex items-center gap-1.5 text-[13px] text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.6} />
              <span className="truncate">{tt("Acceptée — vous avez accès à l'agence")}</span>
            </p>
          );
        }
        return (
          <p className="truncate text-[13px] text-muted-foreground">
            {tt("En attente de réponse")}
          </p>
        );
      },
    },
  ];
}

const PAGE_TEXT = {
  "Utilisateur": {
    en: "User",
    ar: "المستخدم",
    es: "Usuario",
  },
  "Demande de rattachement": {
    en: "Affiliation request",
    ar: "طلب الانضمام",
    es: "Solicitud de afiliación",
  },
  "Contexte": {
    en: "Context",
    ar: "السياق",
    es: "Contexto",
  },
  "Demandé le": {
    en: "Requested on",
    ar: "تاريخ الطلب",
    es: "Solicitado el",
  },
  "Action": {
    en: "Action",
    ar: "الإجراء",
    es: "Acción",
  },
  "Accepter": {
    en: "Accept",
    ar: "قبول",
    es: "Aceptar",
  },
  "Refuser": {
    en: "Decline",
    ar: "رفض",
    es: "Rechazar",
  },
  "Agence": {
    en: "Agency",
    ar: "الوكالة",
    es: "Agencia",
  },
  "Demande envoyée": {
    en: "Request sent",
    ar: "طلب مُرسَل",
    es: "Solicitud enviada",
  },
  "Statut": {
    en: "Status",
    ar: "الحالة",
    es: "Estado",
  },
  "Réponse": {
    en: "Response",
    ar: "الرد",
    es: "Respuesta",
  },
  "Acceptée — vous avez accès à l'agence": {
    en: "Accepted — you now have access to the agency",
    ar: "مقبول — أصبح لديك الآن إمكانية الوصول إلى الوكالة",
    es: "Aceptada — ahora tienes acceso a la agencia",
  },
  "En attente de réponse": {
    en: "Awaiting response",
    ar: "بانتظار الرد",
    es: "Esperando respuesta",
  },
  "En attente": {
    en: "Pending",
    ar: "قيد الانتظار",
    es: "Pendiente",
  },
  "Acceptée": {
    en: "Accepted",
    ar: "مقبولة",
    es: "Aceptada",
  },
  "Refusée": {
    en: "Rejected",
    ar: "مرفوضة",
    es: "Rechazada",
  },
  "Demande acceptée avec succès": {
    en: "Request accepted successfully",
    ar: "تم قبول الطلب بنجاح",
    es: "Solicitud aceptada con éxito",
  },
  "Impossible d'accepter cette demande.": {
    en: "Unable to accept this request.",
    ar: "تعذّر قبول هذا الطلب.",
    es: "No se pudo aceptar esta solicitud.",
  },
  "Demande refusée": {
    en: "Request declined",
    ar: "تم رفض الطلب",
    es: "Solicitud rechazada",
  },
  "Impossible de refuser cette demande.": {
    en: "Unable to decline this request.",
    ar: "تعذّر رفض هذا الطلب.",
    es: "No se pudo rechazar esta solicitud.",
  },
  "Invitations": {
    en: "Invitations",
    ar: "الدعوات",
    es: "Invitaciones",
  },
  "Gérez les demandes de rattachement à votre agence.": {
    en: "Manage affiliation requests to your agency.",
    ar: "إدارة طلبات الانضمام إلى وكالتك.",
    es: "Gestiona las solicitudes de afiliación a tu agencia.",
  },
  "demande": {
    en: "request",
    ar: "طلب",
    es: "solicitud",
  },
  "demandes": {
    en: "requests",
    ar: "طلبات",
    es: "solicitudes",
  },
  "envoyée": {
    en: "sent",
    ar: "مُرسَل",
    es: "enviada",
  },
  "envoyées": {
    en: "sent",
    ar: "مُرسَلة",
    es: "enviadas",
  },
  "Demandes reçues": {
    en: "Received requests",
    ar: "الطلبات الواردة",
    es: "Solicitudes recibidas",
  },
  "Un utilisateur souhaite rejoindre votre agence — acceptez ou refusez sa demande.": {
    en: "A user wants to join your agency — accept or decline their request.",
    ar: "يرغب أحد المستخدمين في الانضمام إلى وكالتك — اقبل طلبه أو ارفضه.",
    es: "Un usuario desea unirse a tu agencia — acepta o rechaza su solicitud.",
  },
  "Rechercher un utilisateur...": {
    en: "Search for a user...",
    ar: "ابحث عن مستخدم...",
    es: "Buscar un usuario...",
  },
  "Trier par :": {
    en: "Sort by:",
    ar: "ترتيب حسب:",
    es: "Ordenar por:",
  },
  "Plus récentes": {
    en: "Most recent",
    ar: "الأحدث",
    es: "Más recientes",
  },
  "Plus anciennes": {
    en: "Oldest",
    ar: "الأقدم",
    es: "Más antiguas",
  },
  "Aucune demande en attente.": {
    en: "No pending requests.",
    ar: "لا توجد طلبات معلقة.",
    es: "No hay solicitudes pendientes.",
  },
  "Mes demandes envoyées": {
    en: "My sent requests",
    ar: "طلباتي المُرسَلة",
    es: "Mis solicitudes enviadas",
  },
  "Suivi des demandes de rattachement que vous avez envoyées à d'autres agences.": {
    en: "Track the affiliation requests you have sent to other agencies.",
    ar: "تتبّع طلبات الانضمام التي أرسلتها إلى وكالات أخرى.",
    es: "Seguimiento de las solicitudes de afiliación que has enviado a otras agencias.",
  },
  "Vous n'avez envoyé aucune demande.": {
    en: "You haven't sent any requests.",
    ar: "لم ترسل أي طلب.",
    es: "No has enviado ninguna solicitud.",
  },
  "Refuser la demande": {
    en: "Decline the request",
    ar: "رفض الطلب",
    es: "Rechazar la solicitud",
  },
  "Refuser la demande de rattachement de": {
    en: "Decline the affiliation request from",
    ar: "رفض طلب الانضمام المُقدَّم من",
    es: "Rechazar la solicitud de afiliación de",
  },
  "Un message est optionnel.": {
    en: "A message is optional.",
    ar: "الرسالة اختيارية.",
    es: "El mensaje es opcional.",
  },
  "Envoi...": {
    en: "Sending...",
    ar: "جارٍ الإرسال...",
    es: "Enviando...",
  },
  "Message (optionnel)": {
    en: "Message (optional)",
    ar: "رسالة (اختياري)",
    es: "Mensaje (opcional)",
  },
  "Expliquez brièvement pourquoi vous refusez cette demande...": {
    en: "Briefly explain why you are declining this request...",
    ar: "اشرح بإيجاز سبب رفضك لهذا الطلب...",
    es: "Explica brevemente por qué rechazas esta solicitud...",
  },
} satisfies PageTextDict;

function AgencyInvitationsPage() {
  const { tt } = usePageText(PAGE_TEXT);
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<JoinRequestReceived | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [query, setQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<"recent" | "old">("recent");

  const receivedQuery = useQuery({
    queryKey: ["agency", "join-requests", "received"],
    queryFn: listJoinRequests,
  });
  const received = receivedQuery.data ?? [];

  const sentQuery = useQuery({
    queryKey: ["agency", "join-requests", "sent"],
    queryFn: myJoinRequests,
  });
  const sent = sentQuery.data ?? [];

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["agency", "join-requests"] });
  };

  const approveMutation = useMutation({
    mutationFn: (item: JoinRequestReceived) => approveJoinRequest(item.id),
    onSuccess: () => {
      toast(tt("Demande acceptée avec succès"));
      invalidateAll();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible d'accepter cette demande."));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { item: JoinRequestReceived; reason: string }) =>
      rejectJoinRequest(payload.item.id, payload.reason || undefined),
    onSuccess: () => {
      toast(tt("Demande refusée"));
      invalidateAll();
      setRejectTarget(null);
      setRejectReason("");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible de refuser cette demande."));
    },
  });

  const pendingActionId =
    approveMutation.isPending && approveMutation.variables
      ? approveMutation.variables.id
      : rejectMutation.isPending && rejectMutation.variables
        ? rejectMutation.variables.item.id
        : null;

  const filteredReceived = query.trim()
    ? received.filter((item) => item.user.toLowerCase().includes(query.trim().toLowerCase()))
    : received;

  const sortedReceived = [...filteredReceived].sort((a, b) =>
    sortDirection === "recent"
      ? b.requestedAt.localeCompare(a.requestedAt)
      : a.requestedAt.localeCompare(b.requestedAt),
  );

  return (
    <DashboardShell role="agency">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px]">
        {/* ✅ EN-TÊTE MODERNISÉ */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </div>
            <div>
              <h1 className="font-display text-[24px] font-bold tracking-tight">
                {tt("Invitations")}
              </h1>
              <p className="mt-1 text-[14px] text-muted-foreground">
                {tt("Gérez les demandes de rattachement à votre agence.")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary">
              <TrendingUp className="inline h-3.5 w-3.5 mr-1" />
              {received.length} {tt(received.length !== 1 ? "demandes" : "demande")}
            </span>
          </div>
        </div>

        {/* ✅ SECTION DEMANDES REÇUES MODERNISÉE */}
        <section className="mt-7">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-[16px] font-bold">{tt("Demandes reçues")}</h2>
                <p className="text-[13px] text-muted-foreground">
                  {tt("Un utilisateur souhaite rejoindre votre agence — acceptez ou refusez sa demande.")}
                </p>
              </div>
            </div>

            {/* ✅ RECHERCHE */}
            <div className="mt-5">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={tt("Rechercher un utilisateur...")}
                  className="w-full rounded-lg border border-border bg-background px-10 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-sm transition-all"
                />
              </div>
            </div>

            {/* ✅ TRI */}
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <p className="truncate text-[14px] font-semibold">
                {sortedReceived.length} {tt(sortedReceived.length !== 1 ? "demandes" : "demande")}
              </p>
              <button
                onClick={() =>
                  setSortDirection((current) => (current === "recent" ? "old" : "recent"))
                }
                type="button"
                className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {tt("Trier par :")}{" "}
                {sortDirection === "recent" ? tt("Plus récentes") : tt("Plus anciennes")}
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            </div>

            <div className="mt-4">
              {receivedQuery.isLoading ? null : sortedReceived.length === 0 ? (
                <EmptyState message={tt("Aucune demande en attente.")} />
              ) : (
                <DataTable
                  columns={receivedColumns(
                    (item) => approveMutation.mutate(item),
                    (item) => {
                      setRejectTarget(item);
                      setRejectReason("");
                    },
                    pendingActionId,
                    tt,
                  )}
                  rows={sortedReceived}
                  isLoading={receivedQuery.isLoading}
                />
              )}
            </div>
          </div>
        </section>

        {/* ✅ SECTION MES DEMANDES ENVOYÉES MODERNISÉE */}
        <section className="mt-9">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-[16px] font-bold">{tt("Mes demandes envoyées")}</h2>
                <p className="text-[13px] text-muted-foreground">
                  {tt("Suivi des demandes de rattachement que vous avez envoyées à d'autres agences.")}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary">
                {sent.length} {tt(sent.length !== 1 ? "envoyées" : "envoyée")}
              </span>
            </div>

            <div className="mt-5">
              {sentQuery.isLoading ? null : sent.length === 0 ? (
                <EmptyState message={tt("Vous n'avez envoyé aucune demande.")} />
              ) : (
                <DataTable columns={sentColumns(tt)} rows={sent} isLoading={sentQuery.isLoading} />
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ✅ MODAL DE REFUS MODERNISÉE */}
      <ActionModal
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
        title={tt("Refuser la demande")}
        description={
          rejectTarget
            ? `${tt("Refuser la demande de rattachement de")} ${rejectTarget.user}. ${tt("Un message est optionnel.")}`
            : tt("Un message est optionnel.")
        }
        confirmLabel={rejectMutation.isPending ? tt("Envoi...") : tt("Refuser")}
        onConfirm={() => {
          if (!rejectTarget) return;
          rejectMutation.mutate({ item: rejectTarget, reason: rejectReason.trim() });
        }}
      >
        <div className="space-y-4">
          {rejectTarget && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-accent/30 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] font-semibold">{rejectTarget.user}</p>
                <p className="text-[12px] text-muted-foreground">
                  {rejectTarget.context || tt("Demande de rattachement")}
                </p>
              </div>
            </div>
          )}
          <TextAreaField
            label={tt("Message (optionnel)")}
            rows={4}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder={tt("Expliquez brièvement pourquoi vous refusez cette demande...")}
          />
        </div>
      </ActionModal>
    </DashboardShell>
  );
}
