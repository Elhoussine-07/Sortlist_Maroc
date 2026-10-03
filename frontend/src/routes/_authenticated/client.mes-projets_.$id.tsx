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
  respondToDispute,
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
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

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
  tt: (source: string) => string,
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
        ? { time: extendedDeadline, prefix: tt("Délai de rappel — ") }
        : null;

  if (!activeDeadline) {
    return { label: tt("Délai de réponse dépassé — en cours de vérification"), expired: true };
  }

  const diffMinutes = Math.max(0, Math.round((activeDeadline.time - now) / 60_000));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return {
    label: `${activeDeadline.prefix}${hours}h${minutes.toString().padStart(2, "0")} ${tt("restantes pour répondre")}`,
    expired: false,
  };
}

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

function formatBudget(
  min: number | null,
  max: number | null,
  tt: (source: string) => string,
): string {
  if (min === null && max === null) return tt("Non renseigné");
  if (min !== null && max !== null) return `${min} € - ${max} €`;
  return `${min ?? max} €`;
}

const PAGE_TEXT = {
  "Délai de rappel — ": { en: "Reminder deadline — ", ar: "مهلة التذكير — ", es: "Plazo de recordatorio — " },
  "Délai de réponse dépassé — en cours de vérification": {
    en: "Response deadline passed — under review",
    ar: "انتهت مهلة الرد — قيد المراجعة",
    es: "Plazo de respuesta superado — en verificación",
  },
  "restantes pour répondre": {
    en: "left to respond",
    ar: "متبقية للرد",
    es: "restantes para responder",
  },
  "Non renseigné": { en: "Not provided", ar: "غير محدد", es: "No indicado" },
  "Retour à mes projets": {
    en: "Back to my projects",
    ar: "العودة إلى مشاريعي",
    es: "Volver a mis proyectos",
  },
  "Projet introuvable.": { en: "Project not found.", ar: "المشروع غير موجود.", es: "Proyecto no encontrado." },
  "Non renseignée": { en: "Not provided", ar: "غير محددة", es: "No indicada" },
  "Délai non renseigné": { en: "No deadline provided", ar: "لا توجد مهلة محددة", es: "Plazo no indicado" },
  "Agence": { en: "Agency", ar: "الوكالة", es: "Agencia" },
  "L'agence qui travaille actuellement sur ce projet.": {
    en: "The agency currently working on this project.",
    ar: "الوكالة التي تعمل حاليًا على هذا المشروع.",
    es: "La agencia que trabaja actualmente en este proyecto.",
  },
  "Agence partenaire": { en: "Partner agency", ar: "الوكالة الشريكة", es: "Agencia asociada" },
  "Voir le profil": { en: "View profile", ar: "عرض الملف الشخصي", es: "Ver perfil" },
  "Paiement à l'agence": { en: "Payment to the agency", ar: "الدفع للوكالة", es: "Pago a la agencia" },
  "Montant dû à l'agence pour la réalisation du projet — distinct de la commission versée par l'agence à la plateforme.":
    {
      en: "Amount owed to the agency for completing the project — separate from the commission the agency pays the platform.",
      ar: "المبلغ المستحق للوكالة مقابل إنجاز المشروع — يختلف عن العمولة التي تدفعها الوكالة للمنصة.",
      es: "Importe debido a la agencia por la realización del proyecto, distinto de la comisión que la agencia paga a la plataforma.",
    },
  "Montant dû": { en: "Amount due", ar: "المبلغ المستحق", es: "Importe debido" },
  "Payer l'agence": { en: "Pay the agency", ar: "دفع الوكالة", es: "Pagar a la agencia" },
  "Cahier des charges": { en: "Project brief", ar: "كراسة الشروط", es: "Pliego de condiciones" },
  "Document généré à partir de votre brief.": {
    en: "Document generated from your brief.",
    ar: "مستند تم إنشاؤه بناءً على ملخصك.",
    es: "Documento generado a partir de tu brief.",
  },
  "Cahier des charges — généré à partir de votre brief": {
    en: "Project brief — generated from your brief",
    ar: "كراسة الشروط — تم إنشاؤها بناءً على ملخصك",
    es: "Pliego de condiciones — generado a partir de tu brief",
  },
  "Télécharger le PDF": { en: "Download the PDF", ar: "تنزيل ملف PDF", es: "Descargar el PDF" },
  "Aucun CDC disponible pour ce projet.": {
    en: "No brief available for this project.",
    ar: "لا توجد كراسة شروط متاحة لهذا المشروع.",
    es: "No hay pliego de condiciones disponible para este proyecto.",
  },
  "Verrouillé": { en: "Locked", ar: "مقفل", es: "Bloqueado" },
  "Candidatures d'agences": { en: "Agency applications", ar: "طلبات الوكالات", es: "Candidaturas de agencias" },
  "Ces agences ont postulé spontanément à votre projet — acceptez pour qu'elles puissent vous envoyer un devis.":
    {
      en: "These agencies applied to your project on their own — accept so they can send you a quote.",
      ar: "تقدمت هذه الوكالات تلقائيًا لمشروعك — اقبل حتى تتمكن من إرسال عرض سعر لك.",
      es: "Estas agencias se postularon espontáneamente a tu proyecto; acepta para que puedan enviarte un presupuesto.",
    },
  "Accepter": { en: "Accept", ar: "قبول", es: "Aceptar" },
  "Refuser": { en: "Decline", ar: "رفض", es: "Rechazar" },
  "Devis reçus": { en: "Quotes received", ar: "عروض الأسعار المستلمة", es: "Presupuestos recibidos" },
  "Chaque devis dispose de son propre délai de réponse (48h, puis +24h de rappel).": {
    en: "Each quote has its own response deadline (48h, then +24h reminder).",
    ar: "لكل عرض سعر مهلة رد خاصة به (48 ساعة، ثم 24 ساعة إضافية للتذكير).",
    es: "Cada presupuesto tiene su propio plazo de respuesta (48h, luego +24h de recordatorio).",
  },
  "Devis détaillé — informations de l'agence, prestations, tarifs": {
    en: "Detailed quote — agency information, services, rates",
    ar: "عرض سعر مفصل — معلومات الوكالة، الخدمات، الأسعار",
    es: "Presupuesto detallado — información de la agencia, servicios, tarifas",
  },
  "Shortlist d'agences recommandées": {
    en: "Shortlist of recommended agencies",
    ar: "القائمة المختصرة للوكالات الموصى بها",
    es: "Lista corta de agencias recomendadas",
  },
  "Sélection générée par le matching IA pour ce projet.": {
    en: "Selection generated by AI matching for this project.",
    ar: "اختيار تم إنشاؤه بواسطة المطابقة بالذكاء الاصطناعي لهذا المشروع.",
    es: "Selección generada por el emparejamiento de IA para este proyecto.",
  },
  "Aucune agence recommandée pour le moment.": {
    en: "No agency recommended at the moment.",
    ar: "لا توجد وكالة موصى بها في الوقت الحالي.",
    es: "No hay ninguna agencia recomendada por el momento.",
  },
  "Envoi...": { en: "Sending...", ar: "جارٍ الإرسال...", es: "Enviando..." },
  "Envoyé": { en: "Sent", ar: "تم الإرسال", es: "Enviado" },
  "Envoyer": { en: "Send", ar: "إرسال", es: "Enviar" },
  "Voir profil": { en: "View profile", ar: "عرض الملف الشخصي", es: "Ver perfil" },
  "Suspension et litiges": { en: "Suspension and disputes", ar: "الإيقاف والنزاعات", es: "Suspensión y disputas" },
  "Suivi des suspensions ou litiges éventuels sur ce projet.": {
    en: "Tracking of any suspensions or disputes on this project.",
    ar: "متابعة أي إيقاف أو نزاع محتمل على هذا المشروع.",
    es: "Seguimiento de las suspensiones o disputas eventuales en este proyecto.",
  },
  "Reprise...": { en: "Resuming...", ar: "جارٍ الاستئناف...", es: "Reanudando..." },
  "Reprendre": { en: "Resume", ar: "استئناف", es: "Reanudar" },
  "Aucun historique disponible.": {
    en: "No history available.",
    ar: "لا يوجد سجل متاح.",
    es: "No hay historial disponible.",
  },
  "L'agence signale ne pas parvenir à vous joindre sur ce projet": {
    en: "The agency reports being unable to reach you about this project",
    ar: "تُفيد الوكالة بتعذّر التواصل معك بشأن هذا المشروع",
    es: "La agencia informa que no logra contactarte sobre este proyecto",
  },
  "Répondez pour expliquer la situation — un modérateur examinera votre réponse avant de trancher.": {
    en: "Reply to explain the situation — a moderator will review your response before deciding.",
    ar: "رد لشرح الوضع — سيراجع المشرف ردك قبل اتخاذ القرار.",
    es: "Responde para explicar la situación — un moderador revisará tu respuesta antes de decidir.",
  },
  "Votre réponse": { en: "Your response", ar: "ردك", es: "Tu respuesta" },
  "Expliquez votre situation...": {
    en: "Explain your situation...",
    ar: "اشرح وضعك...",
    es: "Explica tu situación...",
  },
  "Écrivez une réponse avant d'envoyer.": {
    en: "Write a response before sending.",
    ar: "اكتب ردًا قبل الإرسال.",
    es: "Escribe una respuesta antes de enviar.",
  },
  "Envoyer ma réponse": { en: "Send my response", ar: "إرسال ردي", es: "Enviar mi respuesta" },
  "Votre réponse envoyée au modérateur": {
    en: "Your response sent to the moderator",
    ar: "تم إرسال ردك إلى المشرف",
    es: "Tu respuesta enviada al moderador",
  },
  "Demander une suspension": {
    en: "Request a suspension",
    ar: "طلب إيقاف",
    es: "Solicitar una suspensión",
  },
  "Relance...": { en: "Relaunching...", ar: "جارٍ إعادة الإطلاق...", es: "Relanzando..." },
  "Relancer la recherche": {
    en: "Relaunch the search",
    ar: "إعادة إطلاق البحث",
    es: "Relanzar la búsqueda",
  },
  "Aucun litige ni suspension en cours sur ce projet.": {
    en: "No dispute or suspension in progress on this project.",
    ar: "لا يوجد نزاع أو إيقاف قيد التنفيذ على هذا المشروع.",
    es: "No hay ninguna disputa ni suspensión en curso en este proyecto.",
  },
  "Décrivez le motif de votre demande. Une suspension amiable est privilégiée avant l'ouverture d'un litige.": {
    en: "Describe the reason for your request. An amicable suspension is preferred before opening a dispute.",
    ar: "صف سبب طلبك. يُفضَّل الإيقاف الودّي قبل فتح نزاع.",
    es: "Describe el motivo de tu solicitud. Se prefiere una suspensión amistosa antes de abrir una disputa.",
  },
  "Envoyer la demande": { en: "Send the request", ar: "إرسال الطلب", es: "Enviar la solicitud" },
  "Renseignez un motif avant d'envoyer.": {
    en: "Enter a reason before sending.",
    ar: "أدخل سببًا قبل الإرسال.",
    es: "Indica un motivo antes de enviar.",
  },
  "Type de demande": { en: "Request type", ar: "نوع الطلب", es: "Tipo de solicitud" },
  "Suspension amiable": { en: "Amicable suspension", ar: "إيقاف ودّي", es: "Suspensión amistosa" },
  "Litige": { en: "Dispute", ar: "نزاع", es: "Disputa" },
  "Motif": { en: "Reason", ar: "السبب", es: "Motivo" },
  "Expliquez la raison de cette demande...": {
    en: "Explain the reason for this request...",
    ar: "اشرح سبب هذا الطلب...",
    es: "Explica el motivo de esta solicitud...",
  },
  "Réglez les frais du projet directement à l'agence en charge.": {
    en: "Pay the project fees directly to the agency in charge.",
    ar: "ادفع رسوم المشروع مباشرة إلى الوكالة المسؤولة.",
    es: "Paga los gastos del proyecto directamente a la agencia responsable.",
  },
  "Paiement...": { en: "Paying...", ar: "جارٍ الدفع...", es: "Pagando..." },
  "Confirmer le paiement": { en: "Confirm payment", ar: "تأكيد الدفع", es: "Confirmar el pago" },
  "Renseignez vos coordonnées de paiement avant de continuer.": {
    en: "Enter your payment details before continuing.",
    ar: "أدخل بيانات الدفع الخاصة بك قبل المتابعة.",
    es: "Introduce tus datos de pago antes de continuar.",
  },
  "Moyen de paiement": { en: "Payment method", ar: "وسيلة الدفع", es: "Método de pago" },
  "Carte bancaire": { en: "Credit card", ar: "بطاقة بنكية", es: "Tarjeta bancaria" },
  "Virement bancaire": { en: "Bank transfer", ar: "تحويل بنكي", es: "Transferencia bancaria" },
  "Numéro / IBAN / identifiant": {
    en: "Number / IBAN / ID",
    ar: "الرقم / IBAN / المعرّف",
    es: "Número / IBAN / identificador",
  },
  "Refuser ce devis": { en: "Decline this quote", ar: "رفض عرض السعر هذا", es: "Rechazar este presupuesto" },
  "L'agence sera notifiée et pourra vous envoyer une nouvelle offre ajustée — indiquez ce qui ne convient pas (budget, délai...) pour l'aider à mieux répondre.":
    {
      en: "The agency will be notified and can send you a new adjusted offer — indicate what doesn't suit you (budget, timeline...) to help it respond better.",
      ar: "سيتم إخطار الوكالة وستتمكن من إرسال عرض جديد معدّل لك — وضّح ما لا يناسبك (الميزانية، المهلة...) لمساعدتها على الرد بشكل أفضل.",
      es: "Se notificará a la agencia y podrá enviarte una nueva oferta ajustada — indica lo que no te conviene (presupuesto, plazo...) para ayudarla a responder mejor.",
    },
  "Refuser le devis": { en: "Decline the quote", ar: "رفض عرض السعر", es: "Rechazar el presupuesto" },
  "Motif ou contre-proposition (optionnel)": {
    en: "Reason or counter-proposal (optional)",
    ar: "السبب أو العرض المضاد (اختياري)",
    es: "Motivo o contrapropuesta (opcional)",
  },
  "Ex. Budget trop élevé, nous visions plutôt 3000€...": {
    en: "E.g. Budget too high, we were aiming for around 3000€...",
    ar: "مثال: الميزانية مرتفعة جدًا، كنا نستهدف حوالي 3000 يورو...",
    es: "Ej. Presupuesto demasiado alto, buscábamos unos 3000€...",
  },
  "Impossible d'ouvrir le CDC.": {
    en: "Unable to open the brief.",
    ar: "تعذّر فتح كراسة الشروط.",
    es: "No se pudo abrir el pliego de condiciones.",
  },
  "Impossible d'ouvrir le devis.": {
    en: "Unable to open the quote.",
    ar: "تعذّر فتح عرض السعر.",
    es: "No se pudo abrir el presupuesto.",
  },
  "Devis accepté — le projet passe En cours.": {
    en: "Quote accepted — the project moves to In progress.",
    ar: "تم قبول عرض السعر — أصبح المشروع قيد التنفيذ.",
    es: "Presupuesto aceptado — el proyecto pasa a En curso.",
  },
  "Devis refusé — l'agence peut vous envoyer une offre ajustée.": {
    en: "Quote declined — the agency can send you an adjusted offer.",
    ar: "تم رفض عرض السعر — يمكن للوكالة إرسال عرض معدّل لك.",
    es: "Presupuesto rechazado — la agencia puede enviarte una oferta ajustada.",
  },
  "Impossible d'enregistrer votre décision.": {
    en: "Unable to save your decision.",
    ar: "تعذّر حفظ قرارك.",
    es: "No se pudo guardar tu decisión.",
  },
  "Candidature acceptée — l'agence peut désormais envoyer un devis.": {
    en: "Application accepted — the agency can now send a quote.",
    ar: "تم قبول الطلب — يمكن للوكالة الآن إرسال عرض سعر.",
    es: "Candidatura aceptada — la agencia ya puede enviar un presupuesto.",
  },
  "Candidature refusée.": { en: "Application declined.", ar: "تم رفض الطلب.", es: "Candidatura rechazada." },
  "Demande envoyée à l'agence.": {
    en: "Request sent to the agency.",
    ar: "تم إرسال الطلب إلى الوكالة.",
    es: "Solicitud enviada a la agencia.",
  },
  "Envoi impossible.": { en: "Unable to send.", ar: "تعذّر الإرسال.", es: "No se pudo enviar." },
  "Votre réponse a été envoyée au modérateur.": {
    en: "Your response has been sent to the moderator.",
    ar: "تم إرسال ردك إلى المشرف.",
    es: "Tu respuesta se ha enviado al moderador.",
  },
  "Impossible d'envoyer votre réponse.": {
    en: "Unable to send your response.",
    ar: "تعذّر إرسال ردك.",
    es: "No se pudo enviar tu respuesta.",
  },
  "Demande de suspension envoyée.": {
    en: "Suspension request sent.",
    ar: "تم إرسال طلب الإيقاف.",
    es: "Solicitud de suspensión enviada.",
  },
  "Recherche d'agence relancée.": {
    en: "Agency search relaunched.",
    ar: "تمت إعادة إطلاق البحث عن وكالة.",
    es: "Búsqueda de agencia relanzada.",
  },
  "Impossible de relancer la recherche.": {
    en: "Unable to relaunch the search.",
    ar: "تعذّر إعادة إطلاق البحث.",
    es: "No se pudo relanzar la búsqueda.",
  },
  "Projet repris — la nouvelle date de fin prévue a été recalculée.": {
    en: "Project resumed — the new expected end date has been recalculated.",
    ar: "تم استئناف المشروع — تم إعادة حساب تاريخ الانتهاء المتوقع الجديد.",
    es: "Proyecto reanudado — se ha recalculado la nueva fecha de finalización prevista.",
  },
  "Impossible de reprendre le projet.": {
    en: "Unable to resume the project.",
    ar: "تعذّر استئناف المشروع.",
    es: "No se pudo reanudar el proyecto.",
  },
  "Paiement envoyé à l'agence.": {
    en: "Payment sent to the agency.",
    ar: "تم إرسال الدفع إلى الوكالة.",
    es: "Pago enviado a la agencia.",
  },
  "Paiement impossible.": { en: "Payment failed.", ar: "تعذّر الدفع.", es: "No se pudo realizar el pago." },
} satisfies PageTextDict;

function ClientProjectDetailPage() {
  const { tt } = usePageText(PAGE_TEXT);
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

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
      toast(error instanceof ApiError ? error.message : tt("Impossible d'ouvrir le CDC."));
    } finally {
      setIsOpeningCdc(false);
    }
  }

  const shortlistQuery = useQuery({
    queryKey: ["client", "project", id, "shortlist"],
    queryFn: () => getProjectShortlist(id),
    enabled: project !== null && (project.status === "published" || project.status === "awaiting"),
  });
  const shortlist: Agency[] = shortlistQuery.data ?? [];

  const now = useNow();

  const pendingProposalsQuery = useQuery({
    queryKey: ["client", "project", id, "pending-proposals"],
    queryFn: () => getPendingProposals(id),
    enabled: project !== null && (project.status === "awaiting" || project.status === "published"),
  });
  const pendingProposals = pendingProposalsQuery.data ?? [];

  const [downloadingProposalId, setDownloadingProposalId] = useState<string | null>(null);
  async function handleDownloadDevis(proposal: PendingProposal) {
    setDownloadingProposalId(proposal.id);
    try {
      const blob = await downloadDevisPdf(proposal.id);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : tt("Impossible d'ouvrir le devis."));
    } finally {
      setDownloadingProposalId(null);
    }
  }

  const [respondingProposalId, setRespondingProposalId] = useState<string | null>(null);
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
          ? tt("Devis accepté — le projet passe En cours.")
          : tt("Devis refusé — l'agence peut vous envoyer une offre ajustée."),
      );
      if (variables.decision === "refuse") {
        setRefusingProposal(null);
        setRefusalMessage("");
      }
      invalidateProjectQueries();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible d'enregistrer votre décision."));
    },
    onSettled: () => setRespondingProposalId(null),
  });

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
          ? tt("Candidature acceptée — l'agence peut désormais envoyer un devis.")
          : tt("Candidature refusée."),
      );
      invalidateProjectQueries();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible d'enregistrer votre décision."));
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
      toast(tt("Demande envoyée à l'agence."));
    } catch (error) {
      toast(error instanceof ApiError ? error.message : tt("Envoi impossible."));
    } finally {
      setContactingAgencyId(null);
    }
  }

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

  const [disputeReplyMessage, setDisputeReplyMessage] = useState("");
  const disputeResponseMutation = useMutation({
    mutationFn: () => respondToDispute(id, disputeReplyMessage.trim()),
    onSuccess: () => {
      toast(tt("Votre réponse a été envoyée au modérateur."));
      setDisputeReplyMessage("");
      void disputeQuery.refetch();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible d'envoyer votre réponse."));
    },
  });

  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionCategory, setSuspensionCategory] = useState<SuspensionCategory>("amicable");

  const suspensionMutation = useMutation({
    mutationFn: () =>
      requestSuspension({ projectId: id, reason: suspensionReason, category: suspensionCategory }),
    onSuccess: () => {
      toast(tt("Demande de suspension envoyée."));
      setIsSuspensionModalOpen(false);
      setSuspensionReason("");
      invalidateProjectQueries();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Envoi impossible."));
    },
  });

  const relaunchMutation = useMutation({
    mutationFn: () => relaunchAgencySearch(id),
    onSuccess: () => {
      toast(tt("Recherche d'agence relancée."));
      invalidateProjectQueries();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible de relancer la recherche."));
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumeProject(id),
    onSuccess: () => {
      toast(tt("Projet repris — la nouvelle date de fin prévue a été recalculée."));
      invalidateProjectQueries();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible de reprendre le projet."));
    },
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"Card" | "Bank Transfer" | "PayPal">("Card");
  const [providerToken, setProviderToken] = useState("");

  const payAgencyMutation = useMutation({
    mutationFn: () => payAgencyForProject({ projectId: id, paymentMethod, providerToken }),
    onSuccess: () => {
      toast(tt("Paiement envoyé à l'agence."));
      setIsPaymentModalOpen(false);
      setProviderToken("");
      invalidateProjectQueries();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Paiement impossible."));
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
          {tt("Retour à mes projets")}
        </Link>

        {/* En-tête */}
        <section className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />

          {isLoading ? (
            <StackSkeleton count={2} />
          ) : project === null ? (
            <EmptyState message={tt("Projet introuvable.")} />
          ) : (
            <div className="relative flex flex-wrap items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-white shadow-lg shadow-primary/20">
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
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-[13px] font-medium shadow-sm">
                    <Wallet className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.8} />
                    {formatBudget(project.budgetMin, project.budgetMax, tt)}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-[13px] font-medium shadow-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.8} />
                    {project.location || tt("Non renseignée")}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-[13px] font-medium shadow-sm">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.8} />
                    {project.deadline || tt("Délai non renseigné")}
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
                title={tt("Agence")}
                description={tt("L'agence qui travaille actuellement sur ce projet.")}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      style={{ backgroundImage: seedGradient(project.agencyId) }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white"
                    >
                      {initialsOf(project.partnerAgencyName ?? tt("Agence"))}
                    </span>
                    <p className="min-w-0 truncate text-[15px] font-bold">
                      {project.partnerAgencyName ?? tt("Agence partenaire")}
                    </p>
                  </div>
                  <Link
                    to="/agences/$id"
                    params={{ id: project.agencyId }}
                    className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent"
                  >
                    {tt("Voir le profil")}
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
                title={tt("Paiement à l'agence")}
                description={tt(
                  "Montant dû à l'agence pour la réalisation du projet — distinct de la commission versée par l'agence à la plateforme.",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] text-muted-foreground">{tt("Montant dû")}</p>
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
                        {tt("Payer l'agence")}
                      </button>
                    ) : null}
                  </div>
                </div>
              </SectionCard>
            ) : null}

            {/* Cahier des charges */}
            <SectionCard
              title={tt("Cahier des charges")}
              description={tt("Document généré à partir de votre brief.")}
            >
              <div className="flex flex-wrap items-center gap-3">
                {project.cdcFile ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-accent/40 px-3 py-2">
                    <FileText
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      strokeWidth={1.8}
                    />
                    <p className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
                      {tt("Cahier des charges — généré à partir de votre brief")}
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenCdc}
                      disabled={isOpeningCdc}
                      className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
                      {isOpeningCdc ? "..." : tt("Télécharger le PDF")}
                    </button>
                  </div>
                ) : (
                  <span className="text-[13px] text-muted-foreground">
                    {tt("Aucun CDC disponible pour ce projet.")}
                  </span>
                )}
                {project.locked ? (
                  <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                    {tt("Verrouillé")}
                  </span>
                ) : null}
              </div>
            </SectionCard>

            {/* Candidatures spontanées d'agences (onglet "Disponibles" côté agence) */}
            {agencyApplications.length > 0 ? (
              <SectionCard
                title={tt("Candidatures d'agences")}
                description={tt(
                  "Ces agences ont postulé spontanément à votre projet — acceptez pour qu'elles puissent vous envoyer un devis.",
                )}
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
                            {isResponding ? "..." : tt("Accepter")}
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
                            {tt("Refuser")}
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
                title={tt("Devis reçus")}
                description={tt(
                  "Chaque devis dispose de son propre délai de réponse (48h, puis +24h de rappel).",
                )}
              >
                <div className="space-y-4">
                  {pendingProposals.map((proposal) => {
                    const deadline = describeQuoteDeadline(proposal, now, tt);
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
                        <div className="mt-3 flex items-center gap-2 rounded-md border border-border bg-accent/40 px-3 py-2">
                          <FileText
                            className="h-4 w-4 shrink-0 text-muted-foreground"
                            strokeWidth={1.8}
                          />
                          <p className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
                            {tt("Devis détaillé — informations de l'agence, prestations, tarifs")}
                          </p>
                          <button
                            type="button"
                            disabled={downloadingProposalId === proposal.id}
                            onClick={() => void handleDownloadDevis(proposal)}
                            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
                            {downloadingProposalId === proposal.id ? "..." : tt("Télécharger le PDF")}
                          </button>
                        </div>
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
                            {isResponding ? "..." : tt("Accepter")}
                          </button>
                          <button
                            type="button"
                            disabled={isResponding || deadline.expired}
                            onClick={() => setRefusingProposal(proposal)}
                            className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                            {tt("Refuser")}
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
                title={tt("Shortlist d'agences recommandées")}
                description={tt("Sélection générée par le matching IA pour ce projet.")}
              >
                {shortlistQuery.isPending ? (
                  <StackSkeleton count={3} />
                ) : shortlist.length === 0 ? (
                  <EmptyState message={tt("Aucune agence recommandée pour le moment.")} />
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {shortlist.map((agency) => {
                      const isContacted = contactedAgencyIds.includes(agency.id);
                      return (
                        <article
                          key={agency.id}
                          className="rounded-xl border border-border p-4 transition-all hover:border-primary/30 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              {agency.logo ? (
                                <img
                                  src={agency.logo}
                                  alt={agency.name}
                                  className="h-10 w-10 shrink-0 rounded-xl object-cover"
                                />
                              ) : (
                                <span
                                  style={{ backgroundImage: seedGradient(agency.id) }}
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold text-white"
                                >
                                  {initialsOf(agency.name)}
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-[15px] font-bold">{agency.name}</p>
                                {agency.location ? (
                                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                                    {agency.location}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            {agency.matchingScore !== null ? (
                              <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[12.5px] font-semibold text-primary">
                                <Star className="h-3 w-3 fill-current" strokeWidth={0} />
                                {agency.matchingScore}%
                              </span>
                            ) : null}
                          </div>
                          {agency.description ? (
                            <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">
                              {agency.description}
                            </p>
                          ) : null}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleContactAgency(agency.id)}
                              disabled={isContacted || contactingAgencyId === agency.id}
                              className="rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {contactingAgencyId === agency.id
                                ? tt("Envoi...")
                                : isContacted
                                  ? tt("Envoyé")
                                  : tt("Envoyer")}
                            </button>
                            <Link
                              to="/agences/$id"
                              params={{ id: agency.id }}
                              className="rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent"
                            >
                              {tt("Voir profil")}
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
              title={tt("Suspension et litiges")}
              description={tt("Suivi des suspensions ou litiges éventuels sur ce projet.")}
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
                        {resumeMutation.isPending ? tt("Reprise...") : tt("Reprendre")}
                      </button>
                    ) : null}
                  </div>
                  {dispute.history.length === 0 ? (
                    <p className="mt-4 text-[13.5px] text-muted-foreground">
                      {tt("Aucun historique disponible.")}
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
                  {dispute.awaitingClientResponse ? (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="text-[13.5px] font-semibold text-amber-900">
                        {tt("L'agence signale ne pas parvenir à vous joindre sur ce projet")}
                      </p>
                      <p className="mt-1 text-[13px] text-amber-800">
                        {tt(
                          "Répondez pour expliquer la situation — un modérateur examinera votre réponse avant de trancher.",
                        )}
                      </p>
                      <TextAreaField
                        label={tt("Votre réponse")}
                        rows={4}
                        value={disputeReplyMessage}
                        onChange={(event) => setDisputeReplyMessage(event.target.value)}
                        placeholder={tt("Expliquez votre situation...")}
                      />
                      <button
                        type="button"
                        disabled={disputeResponseMutation.isPending}
                        onClick={() => {
                          if (!disputeReplyMessage.trim()) {
                            toast(tt("Écrivez une réponse avant d'envoyer."));
                            return;
                          }
                          disputeResponseMutation.mutate();
                        }}
                        className="mt-3 flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {disputeResponseMutation.isPending ? tt("Envoi...") : tt("Envoyer ma réponse")}
                      </button>
                    </div>
                  ) : dispute.clientResponse ? (
                    <div className="mt-4 rounded-lg border border-border bg-accent/30 p-3">
                      <p className="text-[12px] font-semibold text-muted-foreground">
                        {tt("Votre réponse envoyée au modérateur")}
                      </p>
                      <p className="mt-1 text-[13px]">{dispute.clientResponse}</p>
                    </div>
                  ) : null}
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
                      {tt("Demander une suspension")}
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
                      {relaunchMutation.isPending ? tt("Relance...") : tt("Relancer la recherche")}
                    </button>
                  ) : null}
                  {project.status !== "in_progress" &&
                  !(
                    project.status === "rejected" &&
                    project.rejectionSubstatus === "Agence défaillante"
                  ) ? (
                    <p className="text-[13.5px] text-muted-foreground">
                      {tt("Aucun litige ni suspension en cours sur ce projet.")}
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
        title={tt("Demander une suspension")}
        description={tt(
          "Décrivez le motif de votre demande. Une suspension amiable est privilégiée avant l'ouverture d'un litige.",
        )}
        confirmLabel={suspensionMutation.isPending ? tt("Envoi...") : tt("Envoyer la demande")}
        onConfirm={() => {
          if (!suspensionReason.trim()) {
            toast(tt("Renseignez un motif avant d'envoyer."));
            return;
          }
          suspensionMutation.mutate();
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold" htmlFor="suspension-category">
              {tt("Type de demande")}
            </label>
            <select
              id="suspension-category"
              value={suspensionCategory}
              onChange={(event) => setSuspensionCategory(event.target.value as SuspensionCategory)}
              className="mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none"
            >
              <option value="amicable">{tt("Suspension amiable")}</option>
              <option value="dispute">{tt("Litige")}</option>
            </select>
          </div>
          <TextAreaField
            label={tt("Motif")}
            rows={4}
            value={suspensionReason}
            onChange={(event) => setSuspensionReason(event.target.value)}
            placeholder={tt("Expliquez la raison de cette demande...")}
          />
        </div>
      </ActionModal>

      <ActionModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        title={tt("Payer l'agence")}
        description={tt("Réglez les frais du projet directement à l'agence en charge.")}
        confirmLabel={payAgencyMutation.isPending ? tt("Paiement...") : tt("Confirmer le paiement")}
        onConfirm={() => {
          if (!providerToken.trim()) {
            toast(tt("Renseignez vos coordonnées de paiement avant de continuer."));
            return;
          }
          payAgencyMutation.mutate();
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold" htmlFor="payment-method">
              {tt("Moyen de paiement")}
            </label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as "Card" | "Bank Transfer" | "PayPal")
              }
              className="mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none"
            >
              <option value="Card">{tt("Carte bancaire")}</option>
              <option value="Bank Transfer">{tt("Virement bancaire")}</option>
              <option value="PayPal">PayPal</option>
            </select>
          </div>
          <TextField
            label={tt("Numéro / IBAN / identifiant")}
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
        title={tt("Refuser ce devis")}
        description={tt(
          "L'agence sera notifiée et pourra vous envoyer une nouvelle offre ajustée — indiquez ce qui ne convient pas (budget, délai...) pour l'aider à mieux répondre.",
        )}
        confirmLabel={
          respondMutation.isPending && respondMutation.variables?.decision === "refuse"
            ? tt("Envoi...")
            : tt("Refuser le devis")
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
          label={tt("Motif ou contre-proposition (optionnel)")}
          rows={4}
          value={refusalMessage}
          onChange={(event) => setRefusalMessage(event.target.value)}
          placeholder={tt("Ex. Budget trop élevé, nous visions plutôt 3000€...")}
        />
      </ActionModal>
    </DashboardShell>
  );
}
