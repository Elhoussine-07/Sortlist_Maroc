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
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

const PAGE_TEXT = {
  "Suspension & litiges": {
    en: "Suspensions & disputes",
    ar: "التعليق والنزاعات",
    es: "Suspensiones y disputas",
  },
  "Gérez les litiges et suivez leur résolution.": {
    en: "Manage disputes and track their resolution.",
    ar: "أدر النزاعات وتابع حلها.",
    es: "Gestiona las disputas y haz seguimiento de su resolución.",
  },
  dossier: {
    en: "case",
    ar: "ملف",
    es: "expediente",
  },
  dossiers: {
    en: "cases",
    ar: "ملفات",
    es: "expedientes",
  },
  "Rechercher un dossier...": {
    en: "Search for a case...",
    ar: "البحث عن ملف...",
    es: "Buscar un expediente...",
  },
  Statut: {
    en: "Status",
    ar: "الحالة",
    es: "Estado",
  },
  "Tous les statuts": {
    en: "All statuses",
    ar: "جميع الحالات",
    es: "Todos los estados",
  },
  "En attente": {
    en: "Pending",
    ar: "قيد الانتظار",
    es: "Pendiente",
  },
  Validé: {
    en: "Validated",
    ar: "تمت الموافقة",
    es: "Validado",
  },
  Refusé: {
    en: "Refused",
    ar: "مرفوض",
    es: "Rechazado",
  },
  Clôturé: {
    en: "Closed",
    ar: "مغلق",
    es: "Cerrado",
  },
  Période: {
    en: "Period",
    ar: "الفترة",
    es: "Período",
  },
  "Toutes les périodes": {
    en: "All periods",
    ar: "جميع الفترات",
    es: "Todos los períodos",
  },
  "7 derniers jours": {
    en: "Last 7 days",
    ar: "آخر 7 أيام",
    es: "Últimos 7 días",
  },
  "30 derniers jours": {
    en: "Last 30 days",
    ar: "آخر 30 يومًا",
    es: "Últimos 30 días",
  },
  "90 derniers jours": {
    en: "Last 90 days",
    ar: "آخر 90 يومًا",
    es: "Últimos 90 días",
  },
  Motif: {
    en: "Reason",
    ar: "السبب",
    es: "Motivo",
  },
  "Tous les motifs": {
    en: "All reasons",
    ar: "جميع الأسباب",
    es: "Todos los motivos",
  },
  Retard: {
    en: "Delay",
    ar: "تأخير",
    es: "Retraso",
  },
  Qualité: {
    en: "Quality",
    ar: "الجودة",
    es: "Calidad",
  },
  Communication: {
    en: "Communication",
    ar: "التواصل",
    es: "Comunicación",
  },
  Autre: {
    en: "Other",
    ar: "أخرى",
    es: "Otro",
  },
  "Trier par :": {
    en: "Sort by:",
    ar: "ترتيب حسب:",
    es: "Ordenar por:",
  },
  "Plus récents": {
    en: "Most recent",
    ar: "الأحدث",
    es: "Más recientes",
  },
  "Plus anciens": {
    en: "Oldest",
    ar: "الأقدم",
    es: "Más antiguos",
  },
  Dossier: {
    en: "Case",
    ar: "الملف",
    es: "Expediente",
  },
  "Détail du dossier": {
    en: "Case details",
    ar: "تفاصيل الملف",
    es: "Detalle del expediente",
  },
  Litige: {
    en: "Dispute",
    ar: "نزاع",
    es: "Disputa",
  },
  "Suspension amiable": {
    en: "Amicable suspension",
    ar: "تعليق ودي",
    es: "Suspensión amistosa",
  },
  "Cliquez sur": {
    en: "Click on",
    ar: "انقر على",
    es: "Haz clic en",
  },
  Détails: {
    en: "Details",
    ar: "التفاصيل",
    es: "Detalles",
  },
  "sur une ligne pour afficher le dossier.": {
    en: "on a row to view the case.",
    ar: "في أحد الصفوف لعرض الملف.",
    es: "en una fila para ver el expediente.",
  },
  "Non spécifié": {
    en: "Not specified",
    ar: "غير محدد",
    es: "No especificado",
  },
  "Ouvert le": {
    en: "Opened on",
    ar: "تاريخ الفتح",
    es: "Abierto el",
  },
  "Demandé par": {
    en: "Requested by",
    ar: "طلب من طرف",
    es: "Solicitado por",
  },
  "Le client": {
    en: "The client",
    ar: "العميل",
    es: "El cliente",
  },
  "Votre agence": {
    en: "Your agency",
    ar: "وكالتك",
    es: "Tu agencia",
  },
  Système: {
    en: "System",
    ar: "النظام",
    es: "Sistema",
  },
  Modérateur: {
    en: "Moderator",
    ar: "المشرف",
    es: "Moderador",
  },
  "Non assigné": {
    en: "Unassigned",
    ar: "غير مُعيَّن",
    es: "Sin asignar",
  },
  Chronologie: {
    en: "Timeline",
    ar: "السجل الزمني",
    es: "Cronología",
  },
  "Aucune activité pour ce dossier.": {
    en: "No activity for this case.",
    ar: "لا يوجد نشاط لهذا الملف.",
    es: "No hay actividad para este expediente.",
  },
  "Répondre au signalement": {
    en: "Respond to the report",
    ar: "الرد على البلاغ",
    es: "Responder al informe",
  },
  'Dossier "{title}"': {
    en: 'Case "{title}"',
    ar: 'الملف "{title}"',
    es: 'Expediente "{title}"',
  },
  "votre réponse est transmise au client et au modérateur.": {
    en: "your response is sent to the client and the moderator.",
    ar: "سيتم إرسال ردك إلى العميل والمشرف.",
    es: "tu respuesta se enviará al cliente y al moderador.",
  },
  "Votre réponse est transmise au client et au modérateur.": {
    en: "Your response is sent to the client and the moderator.",
    ar: "سيتم إرسال ردك إلى العميل والمشرف.",
    es: "Tu respuesta se enviará al cliente y al moderador.",
  },
  "Envoi...": {
    en: "Sending...",
    ar: "جارٍ الإرسال...",
    es: "Enviando...",
  },
  "Envoyer la réponse": {
    en: "Send response",
    ar: "إرسال الرد",
    es: "Enviar respuesta",
  },
  "Renseignez une réponse avant d'envoyer.": {
    en: "Enter a response before sending.",
    ar: "يرجى كتابة رد قبل الإرسال.",
    es: "Introduce una respuesta antes de enviar.",
  },
  "Votre réponse": {
    en: "Your response",
    ar: "ردك",
    es: "Tu respuesta",
  },
  "Expliquez votre position...": {
    en: "Explain your position...",
    ar: "اشرح موقفك...",
    es: "Explica tu posición...",
  },
  "Accepter la suspension": {
    en: "Accept the suspension",
    ar: "قبول التعليق",
    es: "Aceptar la suspensión",
  },
  "Refuser la suspension": {
    en: "Refuse the suspension",
    ar: "رفض التعليق",
    es: "Rechazar la suspensión",
  },
  "le projet passera Suspendu dès confirmation.": {
    en: "the project will move to Suspended upon confirmation.",
    ar: "سينتقل المشروع إلى حالة معلّق بمجرد التأكيد.",
    es: "el proyecto pasará a Suspendido tras la confirmación.",
  },
  "le projet reste En cours, le client est notifié du refus.": {
    en: "the project stays In progress, and the client is notified of the refusal.",
    ar: "سيبقى المشروع قيد التنفيذ، وسيتم إخطار العميل بالرفض.",
    es: "el proyecto permanece En curso y se notifica al cliente del rechazo.",
  },
  Accepter: {
    en: "Accept",
    ar: "قبول",
    es: "Aceptar",
  },
  Refuser: {
    en: "Refuse",
    ar: "رفض",
    es: "Rechazar",
  },
  Décision: {
    en: "Decision",
    ar: "القرار",
    es: "Decisión",
  },
  "Message de réponse (optionnel)": {
    en: "Response message (optional)",
    ar: "رسالة الرد (اختياري)",
    es: "Mensaje de respuesta (opcional)",
  },
  "Expliquez votre décision au client...": {
    en: "Explain your decision to the client...",
    ar: "اشرح قرارك للعميل...",
    es: "Explica tu decisión al cliente...",
  },
  "Répondre au litige": {
    en: "Respond to the dispute",
    ar: "الرد على النزاع",
    es: "Responder a la disputa",
  },
  "le modérateur a jugé le litige du client fondé. Votre justification sera examinée avant toute décision finale.":
    {
      en: "the moderator has ruled the client's dispute as founded. Your justification will be reviewed before any final decision.",
      ar: "قرر المشرف أن نزاع العميل مبرر. سيتم مراجعة تبريرك قبل اتخاذ أي قرار نهائي.",
      es: "el moderador ha determinado que la disputa del cliente está fundamentada. Tu justificación será revisada antes de cualquier decisión final.",
    },
  "Envoyer ma justification": {
    en: "Send my justification",
    ar: "إرسال تبريري",
    es: "Enviar mi justificación",
  },
  "Renseignez votre justification avant d'envoyer.": {
    en: "Enter your justification before sending.",
    ar: "يرجى كتابة تبريرك قبل الإرسال.",
    es: "Introduce tu justificación antes de enviar.",
  },
  "Litige fondé — préavis en cours": {
    en: "Dispute founded — notice period in progress",
    ar: "نزاع مبرر — فترة الإشعار جارية",
    es: "Disputa fundamentada — plazo de preaviso en curso",
  },
  "Votre justification": {
    en: "Your justification",
    ar: "تبريرك",
    es: "Tu justificación",
  },
  "Expliquez pourquoi le projet devrait reprendre...": {
    en: "Explain why the project should resume...",
    ar: "اشرح لماذا يجب أن يستأنف المشروع...",
    es: "Explica por qué debería reanudarse el proyecto...",
  },
  "Sélectionnez d'abord un dossier dans la liste.": {
    en: "First select a case from the list.",
    ar: "يرجى اختيار ملف من القائمة أولاً.",
    es: "Selecciona primero un expediente de la lista.",
  },
  "Aucun dossier sélectionné.": {
    en: "No case selected.",
    ar: "لم يتم اختيار أي ملف.",
    es: "Ningún expediente seleccionado.",
  },
  "Aucune demande sélectionnée.": {
    en: "No request selected.",
    ar: "لم يتم اختيار أي طلب.",
    es: "Ninguna solicitud seleccionada.",
  },
  "Endpoint indisponible pour le moment.": {
    en: "Service temporarily unavailable.",
    ar: "الخدمة غير متاحة حاليًا.",
    es: "Servicio no disponible por el momento.",
  },
  "Réponse envoyée avec succès": {
    en: "Response sent successfully",
    ar: "تم إرسال الرد بنجاح",
    es: "Respuesta enviada con éxito",
  },
  "Justification envoyée au modérateur.": {
    en: "Justification sent to the moderator.",
    ar: "تم إرسال التبرير إلى المشرف.",
    es: "Justificación enviada al moderador.",
  },
  "Impossible d'envoyer votre justification.": {
    en: "Unable to send your justification.",
    ar: "تعذّر إرسال تبريرك.",
    es: "No se pudo enviar tu justificación.",
  },
  "Suspension acceptée — le projet passe Suspendu.": {
    en: "Suspension accepted — the project is now Suspended.",
    ar: "تم قبول التعليق — أصبح المشروع معلّقًا.",
    es: "Suspensión aceptada — el proyecto pasa a Suspendido.",
  },
  "Demande refusée.": {
    en: "Request refused.",
    ar: "تم رفض الطلب.",
    es: "Solicitud rechazada.",
  },
  "Impossible d'enregistrer votre décision.": {
    en: "Unable to save your decision.",
    ar: "تعذّر حفظ قرارك.",
    es: "No se pudo guardar tu decisión.",
  },
  "Demande en attente": {
    en: "Pending request",
    ar: "طلب قيد الانتظار",
    es: "Solicitud pendiente",
  },
  Validée: {
    en: "Validated",
    ar: "تمت الموافقة",
    es: "Validada",
  },
  Refusée: {
    en: "Refused",
    ar: "مرفوضة",
    es: "Rechazada",
  },
  Reprise: {
    en: "Resumed",
    ar: "مستأنف",
    es: "Reanudado",
  },
  "Litige fondé": {
    en: "Dispute founded",
    ar: "نزاع مبرر",
    es: "Disputa fundamentada",
  },
  "Litige non fondé": {
    en: "Dispute unfounded",
    ar: "نزاع غير مبرر",
    es: "Disputa infundada",
  },
  "Préavis en cours": {
    en: "Notice in progress",
    ar: "الإشعار جارٍ",
    es: "Preaviso en curso",
  },
  Tous: {
    en: "All",
    ar: "الكل",
    es: "Todos",
  },
  "Résolution amiable": {
    en: "Amicable resolution",
    ar: "حل ودي",
    es: "Resolución amistosa",
  },
  Clôturés: {
    en: "Closed",
    ar: "مغلقة",
    es: "Cerrados",
  },
  Action: {
    en: "Action",
    ar: "الإجراء",
    es: "Acción",
  },
  "Litige fondé — préavis": {
    en: "Dispute founded — notice",
    ar: "نزاع مبرر — إشعار",
    es: "Disputa fundamentada — preaviso",
  },
  Justifier: {
    en: "Justify",
    ar: "تبرير",
    es: "Justificar",
  },
  Répondre: {
    en: "Respond",
    ar: "الرد",
    es: "Responder",
  },
  "Délai dépassé — en cours de traitement": {
    en: "Deadline passed — under review",
    ar: "انتهت المهلة — قيد المعالجة",
    es: "Plazo vencido — en proceso",
  },
  "restantes pour répondre": {
    en: "left to respond",
    ar: "متبقية للرد",
    es: "restantes para responder",
  },
} satisfies PageTextDict;

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

function describeNoticeDeadline(deadline: string | null, tt: (source: string) => string): string {
  if (!deadline) return "";
  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs <= 0) return tt("Délai dépassé — en cours de traitement");
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  return `${hours}h${minutes.toString().padStart(2, "0")} ${tt("restantes pour répondre")}`;
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
  tt: (source: string) => string,
): Column<SuspensionCase>[] {
  return [
    {
      key: "case",
      header: tt("Dossier"),
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
      header: tt("Motif"),
      render: (item) => (
        <p className="truncate text-[13px] text-muted-foreground">
          {item.reason || tt("Non spécifié")}
        </p>
      ),
    },
    {
      key: "status",
      header: tt("Statut"),
      render: (item) => {
        if (isPendingLitigeNotice(item)) {
          return (
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-[12px] font-semibold text-rose-700 border border-rose-200">
                <AlertCircle className="h-3 w-3" />
                {tt("Litige fondé — préavis")}
              </span>
              <p className="text-[11px] text-muted-foreground">
                {describeNoticeDeadline(item.agencyNoticeDeadline, tt)}
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
            {tt(config.label)}
          </span>
        );
      },
    },
    {
      key: "openedAt",
      header: tt("Ouvert le"),
      render: (item) => (
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.6} />
          <span className="truncate">{item.openedAt}</span>
        </p>
      ),
    },
    {
      key: "moderator",
      header: tt("Modérateur"),
      render: (item) => (
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <User className="h-3.5 w-3.5" strokeWidth={1.6} />
          <span className="truncate">{item.moderator ?? tt("Non assigné")}</span>
        </p>
      ),
    },
    {
      key: "action",
      header: tt("Action"),
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          {isPendingLitigeNotice(item) ? (
            <button
              type="button"
              onClick={() => onRespondToLitigeNotice(item)}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-rose-700 hover:shadow-md"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {tt("Justifier")}
            </button>
          ) : isPendingAmicableFromClient(item) ? (
            <>
              <button
                type="button"
                onClick={() => onDecide(item, "accept")}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {tt("Accepter")}
              </button>
              <button
                type="button"
                onClick={() => onDecide(item, "refuse")}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all hover:bg-accent hover:shadow-sm"
              >
                <XCircle className="h-3.5 w-3.5" />
                {tt("Refuser")}
              </button>
            </>
          ) : item.status === "Requested" ? (
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all hover:bg-accent hover:shadow-sm"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {tt("Répondre")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onViewDetails(item)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all hover:bg-accent hover:shadow-sm"
          >
            <Eye className="h-3.5 w-3.5" />
            {tt("Détails")}
          </button>
        </div>
      ),
    },
  ];
}

function AgencySuspensionPage() {
  const { tt } = usePageText(PAGE_TEXT);
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
      if (!selectedCase) throw new Error(tt("Sélectionnez d'abord un dossier dans la liste."));
      return respondToSuspension(selectedCase.id, payload);
    },
    onSuccess: () => {
      toast(tt("Réponse envoyée avec succès"));
      void queryClient.invalidateQueries({ queryKey: ["agency", "suspensions"] });
      setIsRespondOpen(false);
      setResponse("");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Endpoint indisponible pour le moment."));
    },
  });

  const [litigeNoticeTarget, setLitigeNoticeTarget] = useState<SuspensionCase | null>(null);
  const [litigeNoticeMessage, setLitigeNoticeMessage] = useState("");

  const litigeNoticeMutation = useMutation({
    mutationFn: () => {
      if (!litigeNoticeTarget) throw new Error(tt("Aucun dossier sélectionné."));
      return respondToLitigeNotice(litigeNoticeTarget.id, litigeNoticeMessage.trim());
    },
    onSuccess: () => {
      toast(tt("Justification envoyée au modérateur."));
      void queryClient.invalidateQueries({ queryKey: ["agency", "suspensions"] });
      setLitigeNoticeTarget(null);
      setLitigeNoticeMessage("");
    },
    onError: (error) => {
      toast(
        error instanceof ApiError ? error.message : tt("Impossible d'envoyer votre justification."),
      );
    },
  });

  const [decisionTarget, setDecisionTarget] = useState<SuspensionCase | null>(null);
  const [decisionType, setDecisionType] = useState<"accept" | "refuse" | null>(null);
  const [decisionMessage, setDecisionMessage] = useState("");

  const decisionMutation = useMutation({
    mutationFn: () => {
      if (!decisionTarget || !decisionType) {
        throw new Error(tt("Aucune demande sélectionnée."));
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
          ? tt("Suspension acceptée — le projet passe Suspendu.")
          : tt("Demande refusée."),
      );
      void queryClient.invalidateQueries({ queryKey: ["agency", "suspensions"] });
      setDecisionTarget(null);
      setDecisionType(null);
      setDecisionMessage("");
    },
    onError: (error) => {
      toast(
        error instanceof ApiError ? error.message : tt("Impossible d'enregistrer votre décision."),
      );
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
                {tt("Suspension & litiges")}
              </h1>
              <p className="mt-1 text-[14px] text-muted-foreground">
                {tt("Gérez les litiges et suivez leur résolution.")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary">
              <TrendingUp className="inline h-3.5 w-3.5 mr-1" />
              {total ?? 0} {total !== 1 ? tt("dossiers") : tt("dossier")}
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
              placeholder={tt("Rechercher un dossier...")}
              className="w-full rounded-xl border border-border bg-card px-10 py-3 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-md transition-all"
            />
          </div>
        </div>

        {/* ✅ TABS MODERNISÉS */}
        <div className="mt-6">
          <StatusTabs
            tabs={TABS.map((tab) => ({ ...tab, label: tt(tab.label) }))}
            value={activeTab}
            onChange={setActiveTab}
            counts={counts}
          />
        </div>

        {/* ✅ FILTRES MODERNISÉS */}
        <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              {tt("Statut")}
            </label>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all">
              <option value="">{tt("Tous les statuts")}</option>
              <option value="pending">{tt("En attente")}</option>
              <option value="validated">{tt("Validé")}</option>
              <option value="refused">{tt("Refusé")}</option>
              <option value="closed">{tt("Clôturé")}</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              {tt("Période")}
            </label>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all">
              <option value="">{tt("Toutes les périodes")}</option>
              <option value="7d">{tt("7 derniers jours")}</option>
              <option value="30d">{tt("30 derniers jours")}</option>
              <option value="90d">{tt("90 derniers jours")}</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              {tt("Motif")}
            </label>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all">
              <option value="">{tt("Tous les motifs")}</option>
              <option value="retard">{tt("Retard")}</option>
              <option value="qualite">{tt("Qualité")}</option>
              <option value="communication">{tt("Communication")}</option>
              <option value="autre">{tt("Autre")}</option>
            </select>
          </div>
        </div>

        {/* ✅ COMPTEUR + TRI */}
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">
            {total ?? 0} {total !== 1 ? tt("dossiers") : tt("dossier")}
          </p>
          <button
            onClick={() => setSortDirection((current) => (current === "recent" ? "old" : "recent"))}
            type="button"
            className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {tt("Trier par :")}{" "}
            {sortDirection === "recent" ? tt("Plus récents") : tt("Plus anciens")}
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
              tt,
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
                  {selectedCase
                    ? `${tt("Dossier")} — ${selectedCase.projectTitle}`
                    : tt("Détail du dossier")}
                </h2>
                {selectedCase && (
                  <p className="mt-1 text-[14px] text-muted-foreground">
                    {selectedCase.clientName} •{" "}
                    {selectedCase.category === "dispute"
                      ? tt("Litige")
                      : tt("Suspension amiable")}{" "}
                    • {selectedCase.statusLabel}
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
                  {tt("Cliquez sur")}{" "}
                  <span className="font-semibold text-foreground">"{tt("Détails")}"</span>{" "}
                  {tt("sur une ligne pour afficher le dossier.")}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {tt("Motif")}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold">
                      {selectedCase.reason || tt("Non spécifié")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {tt("Ouvert le")}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedCase.openedAt || "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {tt("Demandé par")}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedCase.requestedBy === "client"
                        ? tt("Le client")
                        : selectedCase.requestedBy === "agency"
                          ? tt("Votre agence")
                          : selectedCase.requestedBy === "system"
                            ? tt("Système")
                            : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {tt("Modérateur")}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedCase.moderator ?? tt("Non assigné")}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 flex items-center gap-2 text-[13.5px] font-bold">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {tt("Chronologie")}
                  </p>
                  {isHistoryLoading ? (
                    <StackSkeleton count={3} />
                  ) : history.length === 0 ? (
                    <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">
                      {tt("Aucune activité pour ce dossier.")}
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
        title={tt("Répondre au signalement")}
        description={
          selectedCase
            ? `${tt('Dossier "{title}"').replace("{title}", selectedCase.projectTitle)} — ${tt("votre réponse est transmise au client et au modérateur.")}`
            : tt("Votre réponse est transmise au client et au modérateur.")
        }
        confirmLabel={respondMutation.isPending ? tt("Envoi...") : tt("Envoyer la réponse")}
        onConfirm={() => {
          if (!response.trim()) {
            toast(tt("Renseignez une réponse avant d'envoyer."));
            return;
          }
          respondMutation.mutate({ message: response.trim() });
        }}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-accent/30 p-3 text-center">
            <p className="text-[12px] text-muted-foreground">{tt("Dossier")}</p>
            <p className="font-semibold">{selectedCase?.projectTitle || "—"}</p>
          </div>
          <TextAreaField
            label={tt("Votre réponse")}
            rows={5}
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            placeholder={tt("Expliquez votre position...")}
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
        title={decisionType === "accept" ? tt("Accepter la suspension") : tt("Refuser la suspension")}
        description={
          decisionTarget
            ? `${tt('Dossier "{title}"').replace("{title}", decisionTarget.projectTitle)} — ${
                decisionType === "accept"
                  ? tt("le projet passera Suspendu dès confirmation.")
                  : tt("le projet reste En cours, le client est notifié du refus.")
              }`
            : ""
        }
        confirmLabel={
          decisionMutation.isPending
            ? tt("Envoi...")
            : decisionType === "accept"
              ? tt("Accepter")
              : tt("Refuser")
        }
        onConfirm={() => decisionMutation.mutate()}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-accent/30 p-3 text-center">
            <p className="text-[12px] text-muted-foreground">{tt("Décision")}</p>
            <p
              className={`font-semibold ${decisionType === "accept" ? "text-emerald-600" : "text-red-600"}`}
            >
              {decisionType === "accept"
                ? `✅ ${tt("Accepter la suspension")}`
                : `❌ ${tt("Refuser la suspension")}`}
            </p>
          </div>
          <TextAreaField
            label={tt("Message de réponse (optionnel)")}
            rows={4}
            value={decisionMessage}
            onChange={(event) => setDecisionMessage(event.target.value)}
            placeholder={tt("Expliquez votre décision au client...")}
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
        title={tt("Répondre au litige")}
        description={
          litigeNoticeTarget
            ? `${tt('Dossier "{title}"').replace("{title}", litigeNoticeTarget.projectTitle)} — ${tt(
                "le modérateur a jugé le litige du client fondé. Votre justification sera examinée avant toute décision finale.",
              )} ${describeNoticeDeadline(litigeNoticeTarget.agencyNoticeDeadline, tt)}`
            : ""
        }
        confirmLabel={
          litigeNoticeMutation.isPending ? tt("Envoi...") : tt("Envoyer ma justification")
        }
        onConfirm={() => {
          if (!litigeNoticeMessage.trim()) {
            toast(tt("Renseignez votre justification avant d'envoyer."));
            return;
          }
          litigeNoticeMutation.mutate();
        }}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-center dark:border-rose-800 dark:bg-rose-950/30">
            <AlertCircle className="mx-auto h-6 w-6 text-rose-600" />
            <p className="mt-1 text-[13px] font-semibold text-rose-600">
              {tt("Litige fondé — préavis en cours")}
            </p>
            <p className="text-[12px] text-muted-foreground">
              {litigeNoticeTarget &&
                describeNoticeDeadline(litigeNoticeTarget.agencyNoticeDeadline, tt)}
            </p>
          </div>
          <TextAreaField
            label={tt("Votre justification")}
            rows={5}
            value={litigeNoticeMessage}
            onChange={(event) => setLitigeNoticeMessage(event.target.value)}
            placeholder={tt("Expliquez pourquoi le projet devrait reprendre...")}
          />
        </div>
      </ActionModal>
    </DashboardShell>
  );
}
