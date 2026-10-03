import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Briefcase,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  CirclePause,
  FileText,
  MapPin,
  Send,
  XCircle,
  type LucideIcon,
  Clock,
  Sparkles,
  Filter,
  Search,
  Building2,
  Wallet,
  CalendarDays,
  Eye,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SearchInput, StatusTabs, StatusBadge } from "@/components/common/Blocks";
import { ListPagination } from "@/components/common/ListControls";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ActionModal } from "@/components/common/ActionModal";
import { TextField } from "@/components/common/Blocks";
import type { Opportunity, Project } from "@/lib/types";
import {
  acceptOpportunity,
  expressInterest,
  getOpportunities,
  downloadOpportunityCdc,
  getOpportunityCdc,
  refuseOpportunity,
  sendQuote,
  type OpportunityTab,
} from "@/services/opportunities.service";
import { getProject } from "@/services/projects.service";
import { getCategories } from "@/services/agencies.service";
import { signalReady } from "@/services/disputes.service";
import { ApiError, fetchBlob, GATEWAY_URL } from "@/services/http";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

export const Route = createFileRoute("/_authenticated/agence/opportunites")({
  head: () => ({
    meta: [
      { title: "Opportunités | Sortlist" },
      {
        name: "description",
        content:
          "Offres disponibles, projets gagnés, en pause, terminés et archivés pour votre agence.",
      },
      { property: "og:title", content: "Opportunités | Sortlist" },
      {
        property: "og:description",
        content: "Parcourez et filtrez les opportunités adressées à votre agence.",
      },
    ],
  }),
  component: AgencyOpportunitiesPage,
});

const TABS = [
  { value: "all", label: "Offres" },
  { value: "available", label: "Disponibles" },
  { value: "applied", label: "Postulé" },
  { value: "won", label: "Gagnées" },
  { value: "paused", label: "En pause" },
  { value: "finished", label: "Terminées" },
  { value: "archived", label: "Archivées" },
];

const BUDGET_OPTIONS: { value: string; label: string }[] = [
  { value: "0-1000", label: "Moins de 1 000 €" },
  { value: "1000-5000", label: "1 000 € - 5 000 €" },
  { value: "5000-20000", label: "5 000 € - 20 000 €" },
  { value: "20000-100000", label: "20 000 € - 100 000 €" },
  { value: "100000-", label: "Plus de 100 000 €" },
];

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string; icon: LucideIcon; label: string }
> = {
  Reçue: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: Briefcase,
    label: "Reçue",
  },
  Acceptée: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    border: "border-indigo-200",
    icon: CheckCircle2,
    label: "Acceptée",
  },
  "Devis envoyé": {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: Send,
    label: "Devis envoyé",
  },
  Gagnée: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
    label: "Gagnée",
  },
  "En pause": {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: CirclePause,
    label: "En pause",
  },
  Terminée: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: CheckCheck,
    label: "Terminée",
  },
  Archivée: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    icon: Archive,
    label: "Archivée",
  },
  Refusée: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    icon: XCircle,
    label: "Refusée",
  },
};

function getStatusConfig(status: string): (typeof STATUS_STYLES)[keyof typeof STATUS_STYLES] {
  const config = STATUS_STYLES[status] ?? STATUS_STYLES["Reçue"];
  return config as (typeof STATUS_STYLES)[keyof typeof STATUS_STYLES];
}

function tabToOpportunityTab(uiTab: string): OpportunityTab {
  if (uiTab === "all") return "offers";
  return uiTab as OpportunityTab;
}

type OpportunityStatusVisual = {
  icon: LucideIcon;
  className: string;
};

function getOpportunityStatusVisual(
  opportunity: Opportunity,
  activeTab: string,
): OpportunityStatusVisual {
  const rawStatus = (opportunity.rawStatus ?? "").trim();
  const config = getStatusConfig(rawStatus);

  return {
    icon: config.icon,
    className: `${config.bg} ${config.text}`,
  };
}

function isAcceptedAwaitingQuote(opportunity: Opportunity): boolean {
  return opportunity.rawStatus === "Acceptée";
}

function isPendingAgencyDecision(opportunity: Opportunity): boolean {
  return opportunity.rawStatus === "Reçue";
}

function truncateTitle(title: string, maxLength: number = 25): string {
  if (!title) return "";
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + "...";
}

const PAGE_TEXT = {
  "Offres": { en: "Offers", ar: "العروض", es: "Ofertas" },
  "Disponibles": { en: "Available", ar: "متاحة", es: "Disponibles" },
  "Postulé": { en: "Applied", ar: "تم التقديم", es: "Postulado" },
  "Gagnées": { en: "Won", ar: "تم الفوز بها", es: "Ganadas" },
  "En pause": { en: "On hold", ar: "متوقفة مؤقتًا", es: "En pausa" },
  "Terminées": { en: "Completed", ar: "منتهية", es: "Finalizadas" },
  "Archivées": { en: "Archived", ar: "مؤرشفة", es: "Archivadas" },
  "Moins de 1 000 €": { en: "Under €1,000", ar: "أقل من 1,000 €", es: "Menos de 1.000 €" },
  "1 000 € - 5 000 €": { en: "€1,000 - €5,000", ar: "1,000 - 5,000 €", es: "1.000 € - 5.000 €" },
  "5 000 € - 20 000 €": { en: "€5,000 - €20,000", ar: "5,000 - 20,000 €", es: "5.000 € - 20.000 €" },
  "20 000 € - 100 000 €": {
    en: "€20,000 - €100,000",
    ar: "20,000 - 100,000 €",
    es: "20.000 € - 100.000 €",
  },
  "Plus de 100 000 €": { en: "Over €100,000", ar: "أكثر من 100,000 €", es: "Más de 100.000 €" },
  "Reçue": { en: "Received", ar: "مستلمة", es: "Recibida" },
  "Acceptée": { en: "Accepted", ar: "مقبولة", es: "Aceptada" },
  "Devis envoyé": { en: "Quote sent", ar: "تم إرسال العرض", es: "Presupuesto enviado" },
  "Gagnée": { en: "Won", ar: "تم الفوز بها", es: "Ganada" },
  "Terminée": { en: "Completed", ar: "منتهية", es: "Finalizada" },
  "Archivée": { en: "Archived", ar: "مؤرشفة", es: "Archivada" },
  "Refusée": { en: "Declined", ar: "مرفوضة", es: "Rechazada" },
  "Chargement...": { en: "Loading...", ar: "جارٍ التحميل...", es: "Cargando..." },
  "Client": { en: "Client", ar: "عميل", es: "Cliente" },
  "Non catégorisé": { en: "Uncategorized", ar: "غير مصنّف", es: "Sin categorizar" },
  "Non défini": { en: "Not defined", ar: "غير محدد", es: "No definido" },
  "Non spécifiée": { en: "Not specified", ar: "غير محددة", es: "No especificada" },
  "Projet": { en: "Project", ar: "مشروع", es: "Proyecto" },
  "Opportunité": { en: "Opportunity", ar: "فرصة", es: "Oportunidad" },
  "Catégorie": { en: "Category", ar: "الفئة", es: "Categoría" },
  "Budget": { en: "Budget", ar: "الميزانية", es: "Presupuesto" },
  "Localisation": { en: "Location", ar: "الموقع", es: "Ubicación" },
  "Statut": { en: "Status", ar: "الحالة", es: "Estado" },
  "Action": { en: "Action", ar: "الإجراء", es: "Acción" },
  "Postuler": { en: "Apply", ar: "تقديم طلب", es: "Postular" },
  "Accepter": { en: "Accept", ar: "قبول", es: "Aceptar" },
  "Refuser": { en: "Decline", ar: "رفض", es: "Rechazar" },
  "Envoyer un devis": { en: "Send a quote", ar: "إرسال عرض سعر", es: "Enviar presupuesto" },
  "Envoyer le devis": { en: "Send the quote", ar: "إرسال عرض السعر", es: "Enviar el presupuesto" },
  "Prêt à reprendre": { en: "Ready to resume", ar: "جاهز لاستئناف العمل", es: "Listo para reanudar" },
  "Opportunités": { en: "Opportunities", ar: "الفرص", es: "Oportunidades" },
  "Répondez aux projets qui correspondent à vos compétences.": {
    en: "Respond to projects that match your skills.",
    ar: "استجب للمشاريع التي تتوافق مع مهاراتك.",
    es: "Responde a los proyectos que coinciden con tus habilidades.",
  },
  "opportunités": { en: "opportunities", ar: "فرصة", es: "oportunidades" },
  "opportunité": { en: "opportunity", ar: "فرصة", es: "oportunidad" },
  "Rechercher une opportunité...": {
    en: "Search for an opportunity...",
    ar: "ابحث عن فرصة...",
    es: "Buscar una oportunidad...",
  },
  "Toutes les catégories": { en: "All categories", ar: "جميع الفئات", es: "Todas las categorías" },
  "Tous les budgets": { en: "All budgets", ar: "جميع الميزانيات", es: "Todos los presupuestos" },
  "Toutes les villes": { en: "All cities", ar: "جميع المدن", es: "Todas las ciudades" },
  "Trier par :": { en: "Sort by:", ar: "الترتيب حسب:", es: "Ordenar por:" },
  "Plus récentes": { en: "Most recent", ar: "الأحدث", es: "Más recientes" },
  "Plus anciennes": { en: "Oldest", ar: "الأقدم", es: "Más antiguas" },
  "Envoi...": { en: "Sending...", ar: "جارٍ الإرسال...", es: "Enviando..." },
  "Proposez un montant pour": {
    en: "Propose an amount for",
    ar: "اقترح مبلغًا مقابل",
    es: "Propón un importe para",
  },
  "Renseignez un montant valide.": {
    en: "Enter a valid amount.",
    ar: "أدخل مبلغًا صالحًا.",
    es: "Introduce un importe válido.",
  },
  "Montant proposé": { en: "Proposed amount", ar: "المبلغ المقترح", es: "Importe propuesto" },
  "Projet :": { en: "Project:", ar: "المشروع:", es: "Proyecto:" },
  "Client :": { en: "Client:", ar: "العميل:", es: "Cliente:" },
  "Détails du projet": { en: "Project details", ar: "تفاصيل المشروع", es: "Detalles del proyecto" },
  "Fermer": { en: "Close", ar: "إغلاق", es: "Cerrar" },
  "Sous-catégorie": { en: "Subcategory", ar: "الفئة الفرعية", es: "Subcategoría" },
  "Délai souhaité": { en: "Desired timeline", ar: "المهلة المطلوبة", es: "Plazo deseado" },
  "jours": { en: "days", ar: "أيام", es: "días" },
  "Description": { en: "Description", ar: "الوصف", es: "Descripción" },
  "Opportunité acceptée": { en: "Opportunity accepted", ar: "تم قبول الفرصة", es: "Oportunidad aceptada" },
  "Envoyez votre devis pour passer à l'étape suivante.": {
    en: "Send your quote to move to the next step.",
    ar: "أرسل عرض سعرك للانتقال إلى الخطوة التالية.",
    es: "Envía tu presupuesto para pasar a la siguiente etapa.",
  },
  "Impossible d'accepter l'opportunité.": {
    en: "Unable to accept the opportunity.",
    ar: "تعذّر قبول الفرصة.",
    es: "No se pudo aceptar la oportunidad.",
  },
  "Intérêt manifesté": { en: "Interest expressed", ar: "تم إبداء الاهتمام", es: "Interés manifestado" },
  "Ce projet apparaît désormais dans vos offres ? envoyez votre devis.": {
    en: "This project now appears in your offers — send your quote.",
    ar: "يظهر هذا المشروع الآن في عروضك — أرسل عرض سعرك.",
    es: "Este proyecto ya aparece en tus ofertas: envía tu presupuesto.",
  },
  "Impossible de manifester votre intérêt.": {
    en: "Unable to express your interest.",
    ar: "تعذّر إبداء اهتمامك.",
    es: "No se pudo manifestar tu interés.",
  },
  "Opportunité refusée": { en: "Opportunity declined", ar: "تم رفض الفرصة", es: "Oportunidad rechazada" },
  "Impossible de refuser l'opportunité.": {
    en: "Unable to decline the opportunity.",
    ar: "تعذّر رفض الفرصة.",
    es: "No se pudo rechazar la oportunidad.",
  },
  "Le client a été notifié de votre proposition.": {
    en: "The client has been notified of your proposal.",
    ar: "تم إخطار العميل بعرضك.",
    es: "Se ha notificado al cliente de tu propuesta.",
  },
  "Envoi du devis impossible.": {
    en: "Unable to send the quote.",
    ar: "تعذّر إرسال العرض.",
    es: "No se pudo enviar el presupuesto.",
  },
  "Signalement envoyé": { en: "Report sent", ar: "تم إرسال الإشعار", es: "Notificación enviada" },
  "Le client a été notifié.": {
    en: "The client has been notified.",
    ar: "تم إخطار العميل.",
    es: "Se ha notificado al cliente.",
  },
  "Endpoint indisponible pour le moment.": {
    en: "This feature is temporarily unavailable.",
    ar: "هذه الميزة غير متاحة حاليًا.",
    es: "Esta función no está disponible por el momento.",
  },
  "Impossible de charger les détails du projet.": {
    en: "Unable to load the project details.",
    ar: "تعذّر تحميل تفاصيل المشروع.",
    es: "No se pudieron cargar los detalles del proyecto.",
  },
  "Impossible d'ouvrir le CDC.": {
    en: "Unable to open the brief.",
    ar: "تعذّر فتح كراسة الشروط.",
    es: "No se pudo abrir el pliego de condiciones.",
  },
} satisfies PageTextDict;

function AgencyOpportunitiesPage() {
  const { tt } = usePageText(PAGE_TEXT);
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"recent" | "old">("recent");
  const [openingCdcId, setOpeningCdcId] = useState<string | null>(null);

  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const subCategoryOptions = (categoriesQuery.data ?? []).flatMap((category) =>
    category.subCategories.map((sub) => ({ id: sub.id, name: sub.name })),
  );

  const [quoteTarget, setQuoteTarget] = useState<Opportunity | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");

  const [detailsProject, setDetailsProject] = useState<Project | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);

  async function handleViewProjectDetails(projectId: string) {
    setLoadingDetailsId(projectId);
    try {
      const project = await getProject(projectId);
      setDetailsProject(project);
    } catch (error) {
      toast(
        error instanceof ApiError
          ? error.message
          : tt("Impossible de charger les détails du projet."),
      );
    } finally {
      setLoadingDetailsId(null);
    }
  }

  async function handleOpenCdc(opportunityId: string) {
    setOpeningCdcId(opportunityId);
    try {
      const blob = await downloadOpportunityCdc(opportunityId);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : tt("Impossible d'ouvrir le CDC."));
    } finally {
      setOpeningCdcId(null);
    }
  }

  const opportunityTab = tabToOpportunityTab(activeTab);

  const opportunitiesQuery = useQuery({
    queryKey: [
      "agency",
      "opportunities",
      opportunityTab,
      page,
      subCategoryFilter,
      budgetFilter,
      locationFilter,
    ],
    queryFn: () =>
      getOpportunities({
        tab: opportunityTab,
        page,
        pageSize: 20,
        ...(subCategoryFilter ? { subCategory: subCategoryFilter } : {}),
        ...(budgetFilter ? { budget: budgetFilter } : {}),
        ...(locationFilter ? { location: locationFilter } : {}),
      }),
  });

  const opportunities = opportunitiesQuery.data?.items ?? [];
  const isLoading = opportunitiesQuery.isLoading;
  const counts = opportunitiesQuery.data?.counts ?? {};
  const total = opportunitiesQuery.data?.total ?? null;
  const totalPages = opportunitiesQuery.data?.totalPages ?? null;

  const searchFilteredOpportunities = query.trim()
    ? opportunities.filter((opportunity) =>
        `${opportunity.projectTitle} ${opportunity.companyName}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : opportunities;

  const filteredOpportunities =
    sortDirection === "old"
      ? [...searchFilteredOpportunities].reverse()
      : searchFilteredOpportunities;

  function invalidateOpportunities() {
    void queryClient.invalidateQueries({ queryKey: ["agency", "opportunities"] });
  }

  const acceptMutation = useMutation({
    mutationFn: acceptOpportunity,
    onSuccess: () => {
      toast(tt("Opportunité acceptée"), {
        description: tt("Envoyez votre devis pour passer à l'étape suivante."),
      });
      invalidateOpportunities();
    },
    onError: (error) => {
      toast(
        error instanceof ApiError ? error.message : tt("Impossible d'accepter l'opportunité."),
      );
    },
  });

  const expressInterestMutation = useMutation({
    mutationFn: expressInterest,
    onSuccess: () => {
      toast(tt("Intérêt manifesté"), {
        description: tt("Ce projet apparaît désormais dans vos offres ? envoyez votre devis."),
      });
      invalidateOpportunities();
    },
    onError: (error) => {
      toast(
        error instanceof ApiError ? error.message : tt("Impossible de manifester votre intérêt."),
      );
    },
  });

  const refuseMutation = useMutation({
    mutationFn: refuseOpportunity,
    onSuccess: () => {
      toast(tt("Opportunité refusée"));
      invalidateOpportunities();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible de refuser l'opportunité."));
    },
  });

  const sendQuoteMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => sendQuote(id, amount),
    onSuccess: () => {
      toast(tt("Devis envoyé"), {
        description: tt("Le client a été notifié de votre proposition."),
      });
      invalidateOpportunities();
      setQuoteTarget(null);
      setQuoteAmount("");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Envoi du devis impossible."));
    },
  });

  const signalReadyMutation = useMutation({
    mutationFn: signalReady,
    onSuccess: () => {
      toast(tt("Signalement envoyé"), { description: tt("Le client a été notifié.") });
      invalidateOpportunities();
    },
    onError: (error) => {
      toast(
        error instanceof ApiError ? error.message : tt("Endpoint indisponible pour le moment."),
      );
    },
  });

  const columns: Column<Opportunity>[] = [
    {
      key: "opportunity",
      header: tt("Opportunité"),
      width: "minmax(0,2.2fr)",
      render: (opportunity) => {
        const statusVisual = getOpportunityStatusVisual(opportunity, activeTab);
        const StatusIcon = statusVisual.icon;
        const truncatedTitle = truncateTitle(opportunity.projectTitle, 30);

        return (
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${statusVisual.className}`}
              title={opportunity.stepLabel || opportunity.rawStatus || tt("Projet")}
            >
              <StatusIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </span>

            <div className="min-w-0">
              {activeTab === "available" ? (
                <button
                  type="button"
                  onClick={() =>
                    void handleViewProjectDetails(opportunity.project ?? opportunity.id)
                  }
                  disabled={loadingDetailsId === (opportunity.project ?? opportunity.id)}
                  className="font-display truncate text-left text-[14px] font-bold leading-tight tracking-tight text-foreground underline-offset-2 hover:text-primary hover:underline disabled:opacity-60"
                  title={opportunity.projectTitle}
                >
                  {loadingDetailsId === (opportunity.project ?? opportunity.id)
                    ? tt("Chargement...")
                    : truncatedTitle}
                </button>
              ) : (
                <p
                  className="font-display truncate text-[14px] font-bold leading-tight tracking-tight"
                  title={opportunity.projectTitle}
                >
                  {truncatedTitle}
                </p>
              )}
              <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground/70">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40" />
                {opportunity.companyName || tt("Client")}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "category",
      header: tt("Catégorie"),
      render: (opportunity) => (
        <p className="truncate text-[13px] font-medium text-foreground">
          {opportunity.category || tt("Non catégorisé")}
        </p>
      ),
    },
    {
      key: "budget",
      header: tt("Budget"),
      render: (opportunity) => (
        <p className="truncate text-[13px] font-medium">
          {opportunity.budgetMin === null || opportunity.budgetMax === null
            ? tt("Non défini")
            : `${opportunity.budgetMin.toLocaleString()} € - ${opportunity.budgetMax.toLocaleString()} €`}
        </p>
      ),
    },
    {
      key: "location",
      header: tt("Localisation"),
      render: (opportunity) => (
        <p className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
          <span className="truncate">{opportunity.location || tt("Non spécifiée")}</span>
        </p>
      ),
    },
    {
      key: "step",
      header: tt("Statut"),
      render: (opportunity) => {
        const config = getStatusConfig(opportunity.rawStatus || "");
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
      key: "action",
      header: tt("Action"),
      render: (opportunity) => (
        <div className="flex flex-wrap gap-2">
          {activeTab === "available" && (
            <button
              type="button"
              onClick={() => expressInterestMutation.mutate(opportunity.id)}
              disabled={expressInterestMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.8} />
              {tt("Postuler")}
            </button>
          )}

          {activeTab === "all" && isPendingAgencyDecision(opportunity) && (
            <>
              <button
                type="button"
                onClick={() => acceptMutation.mutate(opportunity.id)}
                disabled={acceptMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md disabled:opacity-60"
              >
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                {tt("Accepter")}
              </button>
              <button
                type="button"
                onClick={() => refuseMutation.mutate(opportunity.id)}
                disabled={refuseMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all hover:bg-accent hover:shadow-sm disabled:opacity-60"
              >
                <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                {tt("Refuser")}
              </button>
            </>
          )}

          {(activeTab === "all" || activeTab === "applied") &&
            isAcceptedAwaitingQuote(opportunity) && (
              <button
                type="button"
                onClick={() => {
                  setQuoteTarget(opportunity);
                  setQuoteAmount("");
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={1.8} />
                {tt("Envoyer un devis")}
              </button>
            )}

          {activeTab === "paused" && (
            <button
              type="button"
              onClick={() => signalReadyMutation.mutate(opportunity.project ?? opportunity.id)}
              disabled={signalReadyMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60"
            >
              <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
              {tt("Prêt à reprendre")}
            </button>
          )}

          {activeTab !== "available" && (
            <button
              onClick={() => void handleOpenCdc(opportunity.id)}
              type="button"
              disabled={openingCdcId === opportunity.id}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all hover:bg-accent hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileText className="h-3.5 w-3.5" strokeWidth={1.8} />
              {openingCdcId === opportunity.id ? "..." : "CDC"}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardShell role="agency">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px]">
        {/* EN-TÊTE MODERNISÉ */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[24px] font-bold tracking-tight">
                {tt("Opportunités")}
              </h1>
              <p className="mt-1 text-[14px] text-muted-foreground">
                {tt("Répondez aux projets qui correspondent à vos compétences.")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary">
              <TrendingUp className="inline h-3.5 w-3.5 mr-1" />
              {total ?? 0} {tt("opportunités")}
            </span>
          </div>
        </div>

        {/* RECHERCHE MODERNISÉE */}
        <div className="mt-7">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tt("Rechercher une opportunité...")}
              className="w-full rounded-xl border border-border bg-card px-10 py-3 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-md transition-all"
            />
          </div>
        </div>

        {/* TABS MODERNISÉS */}
        <div className="mt-6">
          <StatusTabs
            tabs={TABS.map((tabItem) => ({ ...tabItem, label: tt(tabItem.label) }))}
            value={activeTab}
            onChange={setActiveTab}
            counts={counts}
          />
        </div>

        {/* FILTRES MODERNISÉS */}
        <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              {tt("Catégorie")}
            </label>
            <select
              value={subCategoryFilter}
              onChange={(event) => {
                setSubCategoryFilter(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all"
            >
              <option value="">{tt("Toutes les catégories")}</option>
              {subCategoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              {tt("Budget")}
            </label>
            <select
              value={budgetFilter}
              onChange={(event) => {
                setBudgetFilter(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all"
            >
              <option value="">{tt("Tous les budgets")}</option>
              {BUDGET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {tt(option.label)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              {tt("Localisation")}
            </label>
            <input
              type="text"
              value={locationFilter}
              onChange={(event) => {
                setLocationFilter(event.target.value);
                setPage(1);
              }}
              placeholder={tt("Toutes les villes")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-sm transition-all"
            />
          </div>
        </div>

        {/* COMPTEUR + TRI */}
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">
            {total ?? 0} {tt(total !== 1 ? "opportunités" : "opportunité")}
          </p>
          <button
            onClick={() => setSortDirection((current) => (current === "recent" ? "old" : "recent"))}
            type="button"
            className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {tt("Trier par :")} {tt(sortDirection === "recent" ? "Plus récentes" : "Plus anciennes")}
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>

        {/* TABLEAU MODERNISÉ */}
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <DataTable columns={columns} rows={filteredOpportunities} isLoading={isLoading} />
        </div>

        <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* MODAL DE DEVIS MODERNISÉE */}
      <ActionModal
        open={quoteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setQuoteTarget(null);
            setQuoteAmount("");
          }
        }}
        title={tt("Envoyer un devis")}
        {...(quoteTarget
          ? {
              description: `${tt("Proposez un montant pour")} "${truncateTitle(quoteTarget.projectTitle, 40)}" - ${quoteTarget.companyName}.`,
            }
          : {})}
        confirmLabel={sendQuoteMutation.isPending ? tt("Envoi...") : tt("Envoyer le devis")}
        onConfirm={() => {
          const amount = Number(quoteAmount);
          if (!quoteTarget || !quoteAmount.trim() || Number.isNaN(amount) || amount <= 0) {
            toast(tt("Renseignez un montant valide."));
            return;
          }
          sendQuoteMutation.mutate({ id: quoteTarget.id, amount });
        }}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-accent/30 p-4 text-center">
            <p className="text-[13px] text-muted-foreground">{tt("Montant proposé")}</p>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                €
              </span>
              <input
                type="number"
                min={0}
                step={100}
                value={quoteAmount}
                onChange={(event) => setQuoteAmount(event.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-background py-3 pl-8 pr-4 text-center text-2xl font-bold outline-none focus:border-primary/50 focus:shadow-sm transition-all"
              />
            </div>
          </div>
          {quoteTarget && (
            <div className="grid grid-cols-2 gap-2 text-[13px] text-muted-foreground">
              <span>
                {tt("Projet :")} {truncateTitle(quoteTarget.projectTitle, 25)}
              </span>
              <span className="text-right">
                {tt("Client :")} {quoteTarget.companyName}
              </span>
            </div>
          )}
        </div>
      </ActionModal>

      {/* MODAL DE DÉTAILS MODERNISÉE */}
      <ActionModal
        open={detailsProject !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsProject(null);
        }}
        title={
          detailsProject?.title
            ? truncateTitle(detailsProject.title, 35)
            : tt("Détails du projet")
        }
        confirmLabel={expressInterestMutation.isPending ? tt("Envoi...") : tt("Postuler")}
        cancelLabel={tt("Fermer")}
        onConfirm={() => {
          if (!detailsProject) return;
          expressInterestMutation.mutate(detailsProject.id);
          setDetailsProject(null);
        }}
      >
        {detailsProject ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {tt("Catégorie")}
                </p>
                <p className="mt-1 text-[13px] font-semibold">
                  {detailsProject.category || tt("Non catégorisé")}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {tt("Sous-catégorie")}
                </p>
                <p className="mt-1 text-[13px] font-semibold">
                  {detailsProject.subCategory || "?"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {tt("Budget")}
                </p>
                <p className="mt-1 text-[13px] font-semibold">
                  {detailsProject.budgetMin !== null && detailsProject.budgetMax !== null
                    ? `${detailsProject.budgetMin.toLocaleString()} € - ${detailsProject.budgetMax.toLocaleString()} €`
                    : tt("Non défini")}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {tt("Localisation")}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {detailsProject.location || tt("Non spécifiée")}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {tt("Délai souhaité")}
                </p>
                <p className="mt-1 text-[13px] font-semibold">
                  {detailsProject.deliveryDelayDays
                    ? `${detailsProject.deliveryDelayDays} ${tt("jours")}`
                    : tt("Non défini")}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {tt("Statut")}
                </p>
                <p className="mt-1 text-[13px] font-semibold">
                  {detailsProject.statusLabel || "?"}
                </p>
              </div>
            </div>
            {detailsProject.description && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {tt("Description")}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-[1.6]">
                  {detailsProject.description}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </ActionModal>
    </DashboardShell>
  );
}
