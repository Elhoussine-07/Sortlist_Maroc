import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Compass,
  Sparkles,
  ThermometerSun,
  UserCheck,
  Search,
  TrendingUp,
  Mail,
  Building2,
  MapPin,
  Users,
  Star,
  Clock,
  Send,
  Eye,
  Filter,
  ChevronDown,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  SearchInput,
  SectionCard,
  StatCard,
  StatGrid,
  StatusBadge,
  StatusTabs,
} from "@/components/common/Blocks";
import { ListPagination } from "@/components/common/ListControls";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatSkeleton, StackSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import { ActionModal } from "@/components/common/ActionModal";
import { TextAreaField, TextField } from "@/components/common/Blocks";
import type { Lead } from "@/services/prospection.service";
import {
  generateProspectionEmail,
  getClientProfileForAgency,
  getLeads,
  getProspectionSettings,
  sendProspectionEmail,
} from "@/services/prospection.service";
import { ApiError } from "@/services/http";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

const PAGE_TEXT = {
  Chaud: {
    en: "Hot",
    ar: "ساخن",
    es: "Caliente",
  },
  Tiède: {
    en: "Warm",
    ar: "فاتر",
    es: "Tibio",
  },
  Froid: {
    en: "Cold",
    ar: "بارد",
    es: "Frío",
  },
  Prospect: {
    en: "Prospect",
    ar: "العميل المحتمل",
    es: "Prospecto",
  },
  visites: {
    en: "visits",
    ar: "زيارات",
    es: "visitas",
  },
  "Localisation non spécifiée": {
    en: "Location not specified",
    ar: "الموقع غير محدد",
    es: "Ubicación no especificada",
  },
  "Client identifié — voir le profil": {
    en: "Identified client — view profile",
    ar: "عميل معروف — عرض الملف الشخصي",
    es: "Cliente identificado — ver perfil",
  },
  "Non identifié (détection IP)": {
    en: "Not identified (IP detection)",
    ar: "غير معروف (كشف عبر IP)",
    es: "No identificado (detección por IP)",
  },
  "Signaux détectés": {
    en: "Detected signals",
    ar: "الإشارات المكتشفة",
    es: "Señales detectadas",
  },
  Réduire: {
    en: "Collapse",
    ar: "طي",
    es: "Contraer",
  },
  Température: {
    en: "Temperature",
    ar: "درجة الاهتمام",
    es: "Temperatura",
  },
  Score: {
    en: "Score",
    ar: "النقاط",
    es: "Puntuación",
  },
  Action: {
    en: "Action",
    ar: "الإجراء",
    es: "Acción",
  },
  "Génération...": {
    en: "Generating...",
    ar: "جارٍ الإنشاء...",
    es: "Generando...",
  },
  Générer: {
    en: "Generate",
    ar: "إنشاء",
    es: "Generar",
  },
  "Prospection IA": {
    en: "AI prospecting",
    ar: "التنقيب بالذكاء الاصطناعي",
    es: "Prospección con IA",
  },
  "Prospects suggérés par l'IA à partir des signaux d'intérêt.": {
    en: "Prospects suggested by AI based on interest signals.",
    ar: "عملاء محتملون يقترحهم الذكاء الاصطناعي بناءً على إشارات الاهتمام.",
    es: "Prospectos sugeridos por la IA a partir de señales de interés.",
  },
  prospect: {
    en: "prospect",
    ar: "عميل محتمل",
    es: "prospecto",
  },
  prospects: {
    en: "prospects",
    ar: "عملاء محتملون",
    es: "prospectos",
  },
  "Prospects chauds": {
    en: "Hot prospects",
    ar: "عملاء محتملون ساخنون",
    es: "Prospectos calientes",
  },
  "Fort intérêt détecté": {
    en: "Strong interest detected",
    ar: "تم رصد اهتمام قوي",
    es: "Interés elevado detectado",
  },
  "Prospects tièdes": {
    en: "Warm prospects",
    ar: "عملاء محتملون فاترون",
    es: "Prospectos tibios",
  },
  "Intérêt modéré": {
    en: "Moderate interest",
    ar: "اهتمام متوسط",
    es: "Interés moderado",
  },
  "Prospects froids": {
    en: "Cold prospects",
    ar: "عملاء محتملون باردون",
    es: "Prospectos fríos",
  },
  "Intérêt faible": {
    en: "Low interest",
    ar: "اهتمام ضعيف",
    es: "Interés bajo",
  },
  "Rechercher un prospect...": {
    en: "Search for a prospect...",
    ar: "البحث عن عميل محتمل...",
    es: "Buscar un prospecto...",
  },
  "Période de suivi": {
    en: "Tracking period",
    ar: "فترة المتابعة",
    es: "Período de seguimiento",
  },
  Du: {
    en: "From",
    ar: "من",
    es: "Desde",
  },
  Au: {
    en: "To",
    ar: "إلى",
    es: "Hasta",
  },
  Réinitialiser: {
    en: "Reset",
    ar: "إعادة تعيين",
    es: "Restablecer",
  },
  Tous: {
    en: "All",
    ar: "الكل",
    es: "Todos",
  },
  Chauds: {
    en: "Hot",
    ar: "ساخنون",
    es: "Calientes",
  },
  Tièdes: {
    en: "Warm",
    ar: "فاترون",
    es: "Tibios",
  },
  Froids: {
    en: "Cold",
    ar: "باردون",
    es: "Fríos",
  },
  "Trier par :": {
    en: "Sort by:",
    ar: "ترتيب حسب:",
    es: "Ordenar por:",
  },
  "Plus pertinents": {
    en: "Most relevant",
    ar: "الأكثر صلة",
    es: "Más relevantes",
  },
  "Moins pertinents": {
    en: "Least relevant",
    ar: "الأقل صلة",
    es: "Menos relevantes",
  },
  "Paramètres de scoring": {
    en: "Scoring settings",
    ar: "إعدادات التقييم",
    es: "Configuración de puntuación",
  },
  "Seuils utilisés par l'IA pour qualifier les prospects. Modifiable uniquement depuis l'espace Modération/Admin.":
    {
      en: "Thresholds used by the AI to qualify prospects. Only editable from the Moderation/Admin area.",
      ar: "الحدود التي يستخدمها الذكاء الاصطناعي لتصنيف العملاء المحتملين. قابلة للتعديل فقط من مساحة الإشراف/الإدارة.",
      es: "Umbrales utilizados por la IA para calificar a los prospectos. Solo se pueden modificar desde el espacio de Moderación/Administración.",
    },
  'Seuil "Chaud"': {
    en: '"Hot" threshold',
    ar: 'حد "ساخن"',
    es: 'Umbral "Caliente"',
  },
  'Seuil "Tiède"': {
    en: '"Warm" threshold',
    ar: 'حد "فاتر"',
    es: 'Umbral "Tibio"',
  },
  "E-mail de prospection": {
    en: "Prospecting email",
    ar: "بريد إلكتروني للتنقيب",
    es: "Correo de prospección",
  },
  "Généré par l'IA à partir des signaux du prospect.": {
    en: "Generated by AI based on the prospect's signals.",
    ar: "تم إنشاؤه بواسطة الذكاء الاصطناعي بناءً على إشارات العميل المحتمل.",
    es: "Generado por IA a partir de las señales del prospecto.",
  },
  "Envoi...": {
    en: "Sending...",
    ar: "جارٍ الإرسال...",
    es: "Enviando...",
  },
  Envoyer: {
    en: "Send",
    ar: "إرسال",
    es: "Enviar",
  },
  Destinataire: {
    en: "Recipient",
    ar: "المستلم",
    es: "Destinatario",
  },
  "Non identifié — entreprise détectée par IP, envoi informatif": {
    en: "Not identified — company detected by IP, informational send",
    ar: "غير معروف — تم اكتشاف الشركة عبر IP، إرسال إعلامي",
    es: "No identificado — empresa detectada por IP, envío informativo",
  },
  Objet: {
    en: "Subject",
    ar: "الموضوع",
    es: "Asunto",
  },
  "Objet de l'e-mail...": {
    en: "Email subject...",
    ar: "موضوع البريد الإلكتروني...",
    es: "Asunto del correo...",
  },
  Message: {
    en: "Message",
    ar: "الرسالة",
    es: "Mensaje",
  },
  "Votre message...": {
    en: "Your message...",
    ar: "رسالتك...",
    es: "Tu mensaje...",
  },
  "Génération de l'e-mail impossible.": {
    en: "Unable to generate the email.",
    ar: "تعذّر إنشاء البريد الإلكتروني.",
    es: "No se pudo generar el correo.",
  },
  "Aucun prospect sélectionné.": {
    en: "No prospect selected.",
    ar: "لم يتم اختيار أي عميل محتمل.",
    es: "Ningún prospecto seleccionado.",
  },
  "E-mail envoyé avec succès": {
    en: "Email sent successfully",
    ar: "تم إرسال البريد الإلكتروني بنجاح",
    es: "Correo enviado con éxito",
  },
  "E-mail non délivré": {
    en: "Email not delivered",
    ar: "لم يتم تسليم البريد الإلكتروني",
    es: "Correo no entregado",
  },
  "Le transport d'envoi n'est pas configuré — le brouillon reste disponible ci-dessus.": {
    en: "The sending service is not configured — the draft remains available above.",
    ar: "لم يتم إعداد خدمة الإرسال — تظل المسودة متاحة أعلاه.",
    es: "El servicio de envío no está configurado — el borrador sigue disponible arriba.",
  },
  "Envoi de l'e-mail impossible.": {
    en: "Unable to send the email.",
    ar: "تعذّر إرسال البريد الإلكتروني.",
    es: "No se pudo enviar el correo.",
  },
  "Profil du prospect": {
    en: "Prospect profile",
    ar: "ملف العميل المحتمل",
    es: "Perfil del prospecto",
  },
  Fermer: {
    en: "Close",
    ar: "إغلاق",
    es: "Cerrar",
  },
  "Profil introuvable.": {
    en: "Profile not found.",
    ar: "تعذّر العثور على الملف الشخصي.",
    es: "No se encontró el perfil.",
  },
  "Entreprise non renseignée": {
    en: "Company not provided",
    ar: "لم يتم تحديد الشركة",
    es: "Empresa no indicada",
  },
  Entreprise: {
    en: "Company",
    ar: "الشركة",
    es: "Empresa",
  },
  Contact: {
    en: "Contact",
    ar: "جهة الاتصال",
    es: "Contacto",
  },
  Secteur: {
    en: "Sector",
    ar: "القطاع",
    es: "Sector",
  },
  Pays: {
    en: "Country",
    ar: "البلد",
    es: "País",
  },
  "Score de confiance": {
    en: "Trust score",
    ar: "درجة الثقة",
    es: "Puntuación de confianza",
  },
  "Identifiant légal": {
    en: "Legal ID",
    ar: "المعرّف القانوني",
    es: "Identificación legal",
  },
  Vérifié: {
    en: "Verified",
    ar: "موثّق",
    es: "Verificado",
  },
  "Non vérifié": {
    en: "Not verified",
    ar: "غير موثّق",
    es: "No verificado",
  },
  "Avis d'autres agences ({count})": {
    en: "Reviews from other agencies ({count})",
    ar: "تقييمات وكالات أخرى ({count})",
    es: "Opiniones de otras agencias ({count})",
  },
  "Aucun avis publié sur ce client pour l'instant.": {
    en: "No reviews published for this client yet.",
    ar: "لا توجد تقييمات منشورة لهذا العميل حتى الآن.",
    es: "Aún no hay opiniones publicadas sobre este cliente.",
  },
} satisfies PageTextDict;

export const Route = createFileRoute("/_authenticated/agence/prospection")({
  head: () => ({
    meta: [
      { title: "Prospection IA | Sortlist" },
      {
        name: "description",
        content:
          "Découvrez les prospects suggérés par l'IA, leur score d'intérêt et générez vos e-mails de contact.",
      },
      { property: "og:title", content: "Prospection IA | Sortlist" },
      {
        property: "og:description",
        content: "Suggestions intelligentes de clients pour votre agence.",
      },
    ],
  }),
  component: AgencyProspectionPage,
});

type TemperatureType = "hot" | "warm" | "cold";

const TEMPERATURE_STYLES: Record<
  TemperatureType,
  {
    bg: string;
    text: string;
    border: string;
    icon: LucideIcon;
    label: string;
  }
> = {
  hot: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    icon: ThermometerSun,
    label: "Chaud",
  },
  warm: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: ThermometerSun,
    label: "Tiède",
  },
  cold: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: ThermometerSun,
    label: "Froid",
  },
};

function isValidTemperature(temp: string): temp is TemperatureType {
  return temp === "hot" || temp === "warm" || temp === "cold";
}

function getTemperatureConfig(temperature: string): typeof TEMPERATURE_STYLES.hot {
  if (isValidTemperature(temperature)) {
    return TEMPERATURE_STYLES[temperature];
  }
  return TEMPERATURE_STYLES.cold;
}

function buildColumns(
  onGenerateEmail: (lead: Lead) => void,
  generatingId: string | null,
  onViewClientProfile: (lead: Lead) => void,
  expandedActionIds: Set<string>,
  onToggleActions: (leadId: string) => void,
  tt: (source: string) => string,
): Column<Lead>[] {
  return [
    {
      key: "lead",
      header: tt("Prospect"),
      width: "minmax(0,2.2fr)",
      render: (lead) => (
        <div className="flex min-w-0 items-start gap-3">
          {lead.companyLogo ? (
            <img
              src={lead.companyLogo}
              alt={lead.companyName}
              className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
              {lead.initials ? (
                <span className="text-[14px] font-bold">{lead.initials}</span>
              ) : (
                <Building2 className="h-4 w-4" strokeWidth={1.8} />
              )}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-display truncate text-[14px] font-bold leading-tight tracking-tight text-foreground transition-colors hover:text-primary">
                {lead.companyName}
              </p>
              {/* BUG CORRIGÉ (demande explicite) : affichait `sessionCount`
                  (nombre de session_id distincts fusionnés), qui reste figé
                  tant que le visiteur revient avec le MÊME navigateur — un
                  même client revenant 5 fois via le même navigateur
                  affichait toujours "×1" ou "×2" au lieu du vrai nombre de
                  visites. `visitCount` (leads.visit_count, incrémenté à
                  chaque /track) reflète les vraies visites répétées. */}
              {lead.visitCount > 1 && (
                <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  ×{lead.visitCount} {tt("visites")}
                </span>
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.6} />
              <span className="truncate">{lead.location || tt("Localisation non spécifiée")}</span>
            </p>
            {lead.clientEmail ? (
              <button
                type="button"
                onClick={() => onViewClientProfile(lead)}
                className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
              >
                <BadgeCheck className="h-3 w-3" strokeWidth={2} />
                {tt("Client identifié — voir le profil")}
              </button>
            ) : (
              <p className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground/70">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                {tt("Non identifié (détection IP)")}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: tt("Signaux détectés"),
      width: "minmax(0,1.6fr)",
      render: (lead) => {
        const isExpanded = expandedActionIds.has(lead.id);
        const visibleActions = isExpanded ? lead.actions : lead.actions.slice(0, 3);
        const hiddenCount = lead.actions.length - 3;
        return (
          <div className="flex flex-wrap gap-1.5">
            {visibleActions.map((action, index) => (
              <span
                key={index}
                className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {action}
              </span>
            ))}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => onToggleActions(lead.id)}
                className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                {isExpanded ? tt("Réduire") : `+${hiddenCount}`}
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: "temperature",
      header: tt("Température"),
      render: (lead) => {
        const config = getTemperatureConfig(lead.temperature);
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
      key: "score",
      header: tt("Score"),
      render: (lead) => {
        const scoreColor =
          lead.score >= 70
            ? "text-emerald-600"
            : lead.score >= 40
              ? "text-amber-600"
              : "text-muted-foreground";
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 rounded-full bg-accent">
              <div
                className={`h-2 rounded-full ${lead.score >= 70 ? "bg-emerald-500" : lead.score >= 40 ? "bg-amber-500" : "bg-muted-foreground"}`}
                style={{ width: `${Math.min(lead.score, 100)}%` }}
              />
            </div>
            <span className={`text-[13px] font-semibold ${scoreColor}`}>{lead.score}/100</span>
          </div>
        );
      },
    },
    {
      key: "action",
      header: tt("Action"),
      render: (lead) => (
        <button
          type="button"
          onClick={() => onGenerateEmail(lead)}
          disabled={generatingId === lead.id}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
          {generatingId === lead.id ? tt("Génération...") : tt("Générer")}
        </button>
      ),
    },
  ];
}

function AgencyProspectionPage() {
  const [query, setQuery] = useState("");
  const [temperature, setTemperature] = useState("all");
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailTarget, setEmailTarget] = useState<Lead | null>(null);
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"recent" | "old">("recent");
  const [clientProfileTarget, setClientProfileTarget] = useState<Lead | null>(null);
  const [isClientProfileOpen, setIsClientProfileOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedActionIds, setExpandedActionIds] = useState<Set<string>>(new Set());

  function toggleActionsExpanded(leadId: string) {
    setExpandedActionIds((current) => {
      const next = new Set(current);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  }

  const clientProfileQuery = useQuery({
    queryKey: ["agency", "prospection", "client-profile", clientProfileTarget?.clientEmail],
    queryFn: () => getClientProfileForAgency(clientProfileTarget?.clientEmail ?? ""),
    enabled: isClientProfileOpen && Boolean(clientProfileTarget?.clientEmail),
  });

  const leadsQuery = useQuery({
    queryKey: ["agency", "prospection", "leads", temperature, fromDate, toDate],
    queryFn: () =>
      getLeads({
        page,
        pageSize: 50,
        ...(temperature !== "all" ? { temperature: temperature as "hot" | "warm" | "cold" } : {}),
        ...(fromDate ? { from: new Date(fromDate).toISOString() } : {}),
        ...(toDate ? { to: new Date(toDate).toISOString() } : {}),
      }),
  });
  const allLeads = leadsQuery.data?.items ?? [];
  const isLoading = leadsQuery.isLoading;
  const counters = leadsQuery.data?.counters ?? { hot: null, warm: null, cold: null };
  const isCountersLoading = leadsQuery.isLoading;
  const totalPages = null;

  const settingsQuery = useQuery({
    queryKey: ["agency", "prospection", "settings"],
    queryFn: getProspectionSettings,
  });

  let leads = query.trim()
    ? allLeads.filter((lead) => lead.companyName.toLowerCase().includes(query.trim().toLowerCase()))
    : allLeads;

  if (sortDirection === "old") {
    leads = [...leads].reverse();
  }

  const counts: Record<string, number> = {
    all: allLeads.length,
    hot: counters.hot ?? 0,
    warm: counters.warm ?? 0,
    cold: counters.cold ?? 0,
  };

  const hasActiveDateFilter = Boolean(fromDate || toDate);

  const generateEmailMutation = useMutation({
    mutationFn: generateProspectionEmail,
    onSuccess: (result) => {
      setEmailSubject(result.subject);
      setEmailBody(result.body);
      setIsEmailOpen(true);
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Génération de l'e-mail impossible.");
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => {
      if (!emailTarget) throw new Error("Aucun prospect sélectionné.");
      return sendProspectionEmail(emailTarget.id, { subject: emailSubject, body: emailBody });
    },
    onSuccess: (result) => {
      if (result.sent) {
        toast("E-mail envoyé avec succès", { description: emailTarget?.companyName });
        setIsEmailOpen(false);
        setEmailTarget(null);
      } else {
        toast.warning("E-mail non délivré", {
          description:
            result.note ||
            "Le transport d'envoi n'est pas configuré — le brouillon reste disponible ci-dessus.",
        });
      }
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Envoi de l'e-mail impossible.");
    },
  });

  return (
    <DashboardShell role="agency">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px]">
        {/* EN-TÊTE MODERNISÉ */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Compass className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </div>
            <div>
              <h1 className="font-display text-[24px] font-bold tracking-tight">Prospection IA</h1>
              <p className="mt-1 text-[14px] text-muted-foreground">
                Prospects suggérés par l'IA à partir des signaux d'intérêt.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary">
              <TrendingUp className="inline h-3.5 w-3.5 mr-1" />
              {counts["all"]} prospect{counts["all"] !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* STATS MODERNISÉES */}
        <section className="mt-7">
          {isCountersLoading ? (
            <StatSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-red-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-600 transition-colors group-hover:bg-red-500 group-hover:text-white">
                    <ThermometerSun className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <span className="text-2xl font-bold text-red-600">{counters.hot ?? 0}</span>
                </div>
                <p className="mt-2 text-[13px] font-medium text-muted-foreground">
                  Prospects chauds
                </p>
                <p className="text-[12px] text-muted-foreground">Fort intérêt détecté</p>
              </div>

              <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-amber-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                    <ThermometerSun className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <span className="text-2xl font-bold text-amber-600">{counters.warm ?? 0}</span>
                </div>
                <p className="mt-2 text-[13px] font-medium text-muted-foreground">
                  Prospects tièdes
                </p>
                <p className="text-[12px] text-muted-foreground">Intérêt modéré</p>
              </div>

              <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                    <ThermometerSun className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{counters.cold ?? 0}</span>
                </div>
                <p className="mt-2 text-[13px] font-medium text-muted-foreground">
                  Prospects froids
                </p>
                <p className="text-[12px] text-muted-foreground">Intérêt faible</p>
              </div>
            </div>
          )}
        </section>

        {/* RECHERCHE MODERNISÉE */}
        <div className="mt-7">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un prospect..."
              className="w-full rounded-xl border border-border bg-card px-10 py-3 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-md transition-all"
            />
          </div>
        </div>

        {/* AJOUTÉ : FILTRES DATE/HEURE — un même client re-testé plusieurs
            fois (cf. fusion par identité côté backend) reste plus lisible
            avec la possibilité de restreindre le suivi à une période
            précise plutôt que de voir tout l'historique mélangé. */}
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
            <CalendarClock className="h-4 w-4" strokeWidth={1.7} />
            Période de suivi
          </div>
          <div className="min-w-[190px] flex-1">
            <label className="text-[12px] text-muted-foreground" htmlFor="prospection-from">
              Du
            </label>
            <input
              id="prospection-from"
              type="datetime-local"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-primary/50"
            />
          </div>
          <div className="min-w-[190px] flex-1">
            <label className="text-[12px] text-muted-foreground" htmlFor="prospection-to">
              Au
            </label>
            <input
              id="prospection-to"
              type="datetime-local"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-primary/50"
            />
          </div>
          {hasActiveDateFilter && (
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* TABS MODERNISÉS */}
        <div className="mt-6">
          <StatusTabs
            tabs={[
              { value: "all", label: "Tous" },
              { value: "hot", label: "Chauds" },
              { value: "warm", label: "Tièdes" },
              { value: "cold", label: "Froids" },
            ]}
            value={temperature}
            onChange={setTemperature}
            counts={counts}
          />
        </div>

        {/* COMPTEUR + TRI */}
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">
            {leads.length} prospect{leads.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={() => setSortDirection((current) => (current === "recent" ? "old" : "recent"))}
            type="button"
            className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Trier par : {sortDirection === "recent" ? "Plus pertinents" : "Moins pertinents"}
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>

        {/* TABLEAU MODERNISÉ */}
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <DataTable
            columns={buildColumns(
              (lead) => {
                setEmailTarget(lead);
                generateEmailMutation.mutate(lead.id);
              },
              generateEmailMutation.isPending ? (generateEmailMutation.variables ?? null) : null,
              (lead) => {
                setClientProfileTarget(lead);
                setIsClientProfileOpen(true);
              },
              expandedActionIds,
              toggleActionsExpanded,
            )}
            rows={leads}
            isLoading={isLoading}
          />
        </div>

        <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {/* PARAMÈTRES MODERNISÉS */}
        <section className="mt-9">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-muted-foreground">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold">Paramètres de scoring</h2>
                <p className="text-[13px] text-muted-foreground">
                  Seuils utilisés par l'IA pour qualifier les prospects. Modifiable uniquement
                  depuis l'espace Modération/Admin.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <p className="text-[12px] uppercase tracking-wide text-muted-foreground">
                  Seuil "Chaud"
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {settingsQuery.data ? String(settingsQuery.data.scoring.hotMin) : "..."}
                  <span className="text-[14px] font-normal text-muted-foreground">/100</span>
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-accent">
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{ width: `${settingsQuery.data?.scoring.hotMin || 70}%` }}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-[12px] uppercase tracking-wide text-muted-foreground">
                  Seuil "Tiède"
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {settingsQuery.data ? String(settingsQuery.data.scoring.warmMin) : "..."}
                  <span className="text-[14px] font-normal text-muted-foreground">/100</span>
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-accent">
                  <div
                    className="h-2 rounded-full bg-amber-500"
                    style={{ width: `${settingsQuery.data?.scoring.warmMin || 40}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL EMAIL MODERNISÉE */}
      <ActionModal
        open={isEmailOpen}
        onOpenChange={(open) => {
          setIsEmailOpen(open);
          if (!open) setEmailTarget(null);
        }}
        title="E-mail de prospection"
        description="Généré par l'IA à partir des signaux du prospect."
        confirmLabel={sendEmailMutation.isPending ? "Envoi..." : "Envoyer"}
        onConfirm={() => sendEmailMutation.mutate()}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-accent/30 p-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-[12px] text-muted-foreground">Destinataire</p>
              <p className="font-semibold">
                {emailTarget?.clientEmail ??
                  "Non identifié — entreprise détectée par IP, envoi informatif"}
              </p>
            </div>
          </div>
          <TextField
            label="Objet"
            value={emailSubject}
            onChange={(event) => setEmailSubject(event.target.value)}
            placeholder="Objet de l'e-mail..."
          />
          <TextAreaField
            label="Message"
            rows={6}
            value={emailBody}
            onChange={(event) => setEmailBody(event.target.value)}
            placeholder="Votre message..."
          />
        </div>
      </ActionModal>

      {/* MODAL PROFIL MODERNISÉE */}
      <ActionModal
        open={isClientProfileOpen}
        onOpenChange={(open) => {
          setIsClientProfileOpen(open);
          if (!open) setClientProfileTarget(null);
        }}
        title="Profil du prospect"
        description={clientProfileTarget?.companyName ?? ""}
        confirmLabel="Fermer"
        singleAction
        onConfirm={() => setIsClientProfileOpen(false)}
      >
        {clientProfileQuery.isLoading ? (
          <StackSkeleton count={3} />
        ) : !clientProfileQuery.data ? (
          <EmptyState message="Profil introuvable." />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              {clientProfileQuery.data.companyLogo ? (
                <img
                  src={clientProfileQuery.data.companyLogo}
                  alt={clientProfileQuery.data.companyName}
                  className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
                  <Building2 className="h-5 w-5" strokeWidth={1.8} />
                </div>
              )}
              <p className="text-[16px] font-bold">
                {clientProfileQuery.data.companyName || "Entreprise non renseignée"}
              </p>
            </div>

            {/* Infos profil en cartes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Entreprise
                </p>
                <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {clientProfileQuery.data.companyName || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Contact</p>
                <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {[clientProfileQuery.data.firstName, clientProfileQuery.data.lastName]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Secteur</p>
                <p className="mt-1 text-[13px] font-semibold">
                  {clientProfileQuery.data.sector || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pays</p>
                <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {clientProfileQuery.data.country || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Score de confiance
                </p>
                <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold">
                  <Star className="h-3.5 w-3.5 text-muted-foreground" />
                  {clientProfileQuery.data.trustScore}/100
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Identifiant légal
                </p>
                <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold">
                  {clientProfileQuery.data.legalIdVerified ? (
                    <>
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
                      Vérifié
                    </>
                  ) : (
                    "Non vérifié"
                  )}
                </p>
              </div>
            </div>

            {/* Avis des agences */}
            <div>
              <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold">
                <Star className="h-4 w-4 text-muted-foreground" />
                Avis d'autres agences ({clientProfileQuery.data.reviews.length})
              </p>
              {clientProfileQuery.data.reviews.length === 0 ? (
                <div className="rounded-lg border border-border p-4 text-center text-muted-foreground">
                  Aucun avis publié sur ce client pour l'instant.
                </div>
              ) : (
                <ul className="max-h-[280px] space-y-3 overflow-y-auto">
                  {clientProfileQuery.data.reviews.map((review, index) => (
                    <li key={index} className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold">{review.agencyName}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-[13px] font-semibold">{review.rating}/5</span>
                        </div>
                      </div>
                      <p className="mt-1 text-[13px] text-muted-foreground">{review.comment}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        {review.publishedAt}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </ActionModal>
    </DashboardShell>
  );
}
