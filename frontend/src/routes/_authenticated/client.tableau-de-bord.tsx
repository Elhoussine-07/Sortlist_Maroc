import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  CircleHelp,
  ExternalLink,
  FileText,
  MessageCircle,
  MoreVertical,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trash2,
  Users,
  type LucideIcon,
  Clock,
  CircleCheck,
  CircleDot,
  Eye,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/common/EmptyState";
import { StatSkeleton, TableSkeleton } from "@/components/common/Skeletons";
import { ActionModal } from "@/components/common/ActionModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth.store";
import type { Project } from "@/lib/types";
import { ApiError } from "@/services/http";
import { getClientDashboard, type ClientDashboardRecommendation } from "@/services/profile.service";
import { deleteProject, getMyProjects, repostProject } from "@/services/projects.service";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

const PAGE_TEXT = {
  Bonjour: {
    en: "Hello",
    ar: "مرحبًا",
    es: "Hola",
  },
  "Voici un aperçu de votre activité sur Sortlist.": {
    en: "Here's an overview of your activity on Sortlist.",
    ar: "فيما يلي نظرة عامة على نشاطك في Sortlist.",
    es: "Aquí tienes un resumen de tu actividad en Sortlist.",
  },
  "Score de confiance": {
    en: "Trust score",
    ar: "درجة الثقة",
    es: "Puntuación de confianza",
  },
  "Projets publiés": {
    en: "Published projects",
    ar: "المشاريع المنشورة",
    es: "Proyectos publicados",
  },
  "Taux de réponse": {
    en: "Response rate",
    ar: "معدل الاستجابة",
    es: "Tasa de respuesta",
  },
  "Collaborations en cours": {
    en: "Active collaborations",
    ar: "التعاونات الجارية",
    es: "Colaboraciones en curso",
  },
  "Voir le détail": {
    en: "View details",
    ar: "عرض التفاصيل",
    es: "Ver detalles",
  },
  "Activité récente": {
    en: "Recent activity",
    ar: "النشاط الأخير",
    es: "Actividad reciente",
  },
  "Pas encore d'activité à afficher sur cette période.": {
    en: "No activity to show for this period yet.",
    ar: "لا يوجد نشاط لعرضه خلال هذه الفترة بعد.",
    es: "Aún no hay actividad que mostrar en este período.",
  },
  activité: {
    en: "activity",
    ar: "نشاط",
    es: "actividad",
  },
  activités: {
    en: "activities",
    ar: "أنشطة",
    es: "actividades",
  },
  "Recommandations pour améliorer votre score": {
    en: "Recommendations to improve your score",
    ar: "توصيات لتحسين درجتك",
    es: "Recomendaciones para mejorar tu puntuación",
  },
  "Tout est à jour, bravo !": {
    en: "Everything is up to date, well done!",
    ar: "كل شيء محدث، أحسنت!",
    es: "Todo está al día, ¡bien hecho!",
  },
  "MES PROJETS RÉCENTS": {
    en: "MY RECENT PROJECTS",
    ar: "مشاريعي الأخيرة",
    es: "MIS PROYECTOS RECIENTES",
  },
  "Voir tous mes projets": {
    en: "View all my projects",
    ar: "عرض جميع مشاريعي",
    es: "Ver todos mis proyectos",
  },
  Projet: {
    en: "Project",
    ar: "المشروع",
    es: "Proyecto",
  },
  Catégorie: {
    en: "Category",
    ar: "الفئة",
    es: "Categoría",
  },
  Statut: {
    en: "Status",
    ar: "الحالة",
    es: "Estado",
  },
  "Dernière activité": {
    en: "Last activity",
    ar: "آخر نشاط",
    es: "Última actividad",
  },
  Action: {
    en: "Action",
    ar: "الإجراء",
    es: "Acción",
  },
  "Aucun projet récent à afficher.": {
    en: "No recent projects to show.",
    ar: "لا توجد مشاريع حديثة لعرضها.",
    es: "No hay proyectos recientes que mostrar.",
  },
  "ACTIONS RAPIDES": {
    en: "QUICK ACTIONS",
    ar: "إجراءات سريعة",
    es: "ACCIONES RÁPIDAS",
  },
  "Postuler un projet": {
    en: "Submit a project",
    ar: "نشر مشروع",
    es: "Publicar un proyecto",
  },
  "Déposez un nouveau projet et trouvez les meilleures agences.": {
    en: "Post a new project and find the best agencies.",
    ar: "انشر مشروعًا جديدًا وابحث عن أفضل الوكالات.",
    es: "Publica un nuevo proyecto y encuentra las mejores agencias.",
  },
  "Générer un CDC avec IA": {
    en: "Generate a brief with AI",
    ar: "إنشاء دفتر شروط بالذكاء الاصطناعي",
    es: "Generar un brief con IA",
  },
  "Créez un cahier des charges complet et optimisé avec l'intelligence artificielle.": {
    en: "Create a complete, optimized project brief using artificial intelligence.",
    ar: "أنشئ دفتر شروط كاملاً ومحسّنًا باستخدام الذكاء الاصطناعي.",
    es: "Crea un pliego de condiciones completo y optimizado con inteligencia artificial.",
  },
  "Contacter une agence": {
    en: "Contact an agency",
    ar: "الاتصال بوكالة",
    es: "Contactar a una agencia",
  },
  "Recherchez et contactez l'agence idéale pour votre projet.": {
    en: "Search for and contact the ideal agency for your project.",
    ar: "ابحث عن الوكالة المثالية لمشروعك وتواصل معها.",
    es: "Busca y contacta a la agencia ideal para tu proyecto.",
  },
  "Voir mes collaborations": {
    en: "View my collaborations",
    ar: "عرض تعاوناتي",
    es: "Ver mis colaboraciones",
  },
  "Suivez l'avancement de vos collaborations en cours.": {
    en: "Track the progress of your ongoing collaborations.",
    ar: "تابع تقدم تعاوناتك الجارية.",
    es: "Haz seguimiento del progreso de tus colaboraciones en curso.",
  },
  "Besoin d'aide ?": {
    en: "Need help?",
    ar: "هل تحتاج إلى مساعدة؟",
    es: "¿Necesitas ayuda?",
  },
  "Consulter notre centre d'aide": {
    en: "Visit our help center",
    ar: "زيارة مركز المساعدة",
    es: "Consultar nuestro centro de ayuda",
  },
  Ouvrir: {
    en: "Open",
    ar: "فتح",
    es: "Abrir",
  },
  Brouillon: {
    en: "Draft",
    ar: "مسودة",
    es: "Borrador",
  },
  Publié: {
    en: "Published",
    ar: "منشور",
    es: "Publicado",
  },
  "En cours": {
    en: "In progress",
    ar: "قيد التنفيذ",
    es: "En curso",
  },
  Terminé: {
    en: "Completed",
    ar: "منتهٍ",
    es: "Finalizado",
  },
  Archivé: {
    en: "Archived",
    ar: "مؤرشف",
    es: "Archivado",
  },
  "En attente": {
    en: "Pending",
    ar: "قيد الانتظار",
    es: "Pendiente",
  },
  "Plus d'actions": {
    en: "More actions",
    ar: "مزيد من الإجراءات",
    es: "Más acciones",
  },
  "Republication...": {
    en: "Reposting...",
    ar: "جارٍ إعادة النشر...",
    es: "Republicando...",
  },
  Repostuler: {
    en: "Repost",
    ar: "إعادة النشر",
    es: "Volver a publicar",
  },
  Supprimer: {
    en: "Delete",
    ar: "حذف",
    es: "Eliminar",
  },
  "Supprimer ce projet ?": {
    en: "Delete this project?",
    ar: "هل تريد حذف هذا المشروع؟",
    es: "¿Eliminar este proyecto?",
  },
  "« {title} » sera définitivement supprimé. Cette action est irréversible.": {
    en: "“{title}” will be permanently deleted. This action cannot be undone.",
    ar: "سيتم حذف «{title}» نهائيًا. لا يمكن التراجع عن هذا الإجراء.",
    es: "«{title}» se eliminará definitivamente. Esta acción no se puede deshacer.",
  },
  "Suppression...": {
    en: "Deleting...",
    ar: "جارٍ الحذف...",
    es: "Eliminando...",
  },
  "Supprimer définitivement": {
    en: "Delete permanently",
    ar: "حذف نهائي",
    es: "Eliminar definitivamente",
  },
  "Réf.": {
    en: "Ref.",
    ar: "مرجع",
    es: "Ref.",
  },
  "Nouveau projet": {
    en: "New project",
    ar: "مشروع جديد",
    es: "Proyecto nuevo",
  },
  "Non catégorisé": {
    en: "Uncategorized",
    ar: "غير مصنف",
    es: "Sin categoría",
  },
  Reprendre: {
    en: "Resume",
    ar: "متابعة",
    es: "Continuar",
  },
  Voir: {
    en: "View",
    ar: "عرض",
    es: "Ver",
  },
  "Projet republié auprès des agences pertinentes.": {
    en: "Project reposted to relevant agencies.",
    ar: "تمت إعادة نشر المشروع للوكالات المعنية.",
    es: "Proyecto vuelto a publicar para las agencias pertinentes.",
  },
  "Impossible de republier ce projet.": {
    en: "Unable to repost this project.",
    ar: "تعذّرت إعادة نشر هذا المشروع.",
    es: "No se pudo volver a publicar este proyecto.",
  },
  "Projet supprimé.": {
    en: "Project deleted.",
    ar: "تم حذف المشروع.",
    es: "Proyecto eliminado.",
  },
  "Impossible de supprimer ce projet.": {
    en: "Unable to delete this project.",
    ar: "تعذّر حذف هذا المشروع.",
    es: "No se pudo eliminar este proyecto.",
  },
} satisfies PageTextDict;

export const Route = createFileRoute("/_authenticated/client/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord Client | Sortlist" },
      {
        name: "description",
        content:
          "Suivez votre score de confiance, vos projets publiés, votre taux de réponse et vos collaborations en cours.",
      },
      { property: "og:title", content: "Tableau de bord Client | Sortlist" },
      {
        property: "og:description",
        content: "Aperçu de votre activité sur Sortlist.",
      },
    ],
  }),
  component: ClientDashboardPage,
});

interface ClientDashboardStats {
  trustScore: number | null;
  trustScoreLabel: string | null;
  publishedProjects: number | null;
  publishedProjectsDelta: string | null;
  responseRate: number | null;
  responseRateDelta: string | null;
  activeCollaborations: number | null;
}

const EMPTY_STATS: ClientDashboardStats = {
  trustScore: null,
  trustScoreLabel: null,
  publishedProjects: null,
  publishedProjectsDelta: null,
  responseRate: null,
  responseRateDelta: null,
  activeCollaborations: null,
};

function ClientDashboardPage() {
  const { tt, locale } = usePageText(PAGE_TEXT);
  const user = useAuthStore((state) => state.user);
  const dateLocale =
    locale === "en" ? "en-US" : locale === "ar" ? "ar-MA" : locale === "es" ? "es-ES" : "fr-FR";

  const dashboardQuery = useQuery({
    queryKey: ["client", "dashboard"],
    queryFn: getClientDashboard,
  });
  const isStatsLoading = dashboardQuery.isPending;
  const stats: ClientDashboardStats = dashboardQuery.data
    ? {
        trustScore: dashboardQuery.data.trustScore.value,
        trustScoreLabel: dashboardQuery.data.trustScore.label,
        publishedProjects: dashboardQuery.data.publishedProjects.value,
        publishedProjectsDelta: dashboardQuery.data.publishedProjects.delta,
        responseRate: dashboardQuery.data.responseRate.value,
        responseRateDelta: dashboardQuery.data.responseRate.delta,
        activeCollaborations: dashboardQuery.data.activeCollaborations.value,
      }
    : EMPTY_STATS;
  const activityChart = dashboardQuery.data?.activityChart ?? [];
  const recommendations = dashboardQuery.data?.recommendations ?? [];

  const recentProjectsQuery = useQuery({
    queryKey: ["client", "projects", "recent"],
    queryFn: () => getMyProjects({ pageSize: 5, sort: "recent" }),
  });
  const recentProjects = recentProjectsQuery.data?.items ?? [];
  const isProjectsLoading = recentProjectsQuery.isPending;

  return (
    <DashboardShell role="client">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px]">
        <h1 className="font-display text-[30px] font-bold tracking-tight sm:text-[32px]">
          {tt("Bonjour")}
          {user ? `, ${user.displayName}` : ""}
        </h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          {tt("Voici un aperçu de votre activité sur Sortlist.")}
        </p>

        {/* Stats */}
        <section className="mt-7">
          {isStatsLoading ? (
            <StatSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 divide-y divide-border rounded-lg border border-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
              <CircularStat
                icon={ShieldCheck}
                label={tt("Score de confiance")}
                value={stats.trustScore}
                footer={
                  stats.trustScoreLabel ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[12px] font-semibold text-primary">
                      {stats.trustScoreLabel}
                    </span>
                  ) : null
                }
              />
              <StatCard
                icon={FileText}
                label={tt("Projets publiés")}
                value={stats.publishedProjects === null ? "?" : String(stats.publishedProjects)}
                footer={<DeltaLabel value={stats.publishedProjectsDelta} />}
              />
              <CircularStat
                icon={TrendingUp}
                label={tt("Taux de réponse")}
                value={stats.responseRate}
                isPercent
                footer={<DeltaLabel value={stats.responseRateDelta} />}
              />
              <StatCard
                icon={Users}
                label={tt("Collaborations en cours")}
                value={
                  stats.activeCollaborations === null ? "?" : String(stats.activeCollaborations)
                }
                footer={
                  <Link
                    to="/client/collaborations"
                    className="flex items-center gap-1.5 font-semibold text-primary transition-opacity hover:opacity-70"
                  >
                    {tt("Voir le détail")}
                    <ArrowRight className="h-3 w-3" strokeWidth={1.8} />
                  </Link>
                }
              />
            </div>
          )}
        </section>

        {/* Activité récente + Recommandations */}
        <section className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-[15px] font-bold">{tt("Activité récente")}</h2>
            {isStatsLoading ? (
              <div className="mt-4 h-[220px] animate-pulse rounded-lg bg-muted" />
            ) : activityChart.every((point) => point.count === 0) ? (
              <div className="mt-4">
                <EmptyState message={tt("Pas encore d'activité à afficher sur cette période.")} />
              </div>
            ) : (
              <div className="mt-4 h-[220px] text-primary">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activityChart}
                    margin={{ left: -20, right: 10, top: 10, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value: string) =>
                        new Date(value).toLocaleDateString(dateLocale, {
                          day: "numeric",
                          month: "short",
                        })
                      }
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={24}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--accent)" }}
                      formatter={(value: number) => [
                        `${value} ${value > 1 ? tt("activités") : tt("activité")}`,
                        "",
                      ]}
                      labelFormatter={(value) =>
                        new Date(value as string).toLocaleDateString(dateLocale, {
                          day: "numeric",
                          month: "long",
                        })
                      }
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: "var(--border)",
                        fontSize: 12.5,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="currentColor"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-[15px] font-bold">
              {tt("Recommandations pour améliorer votre score")}
            </h2>
            {isStatsLoading ? (
              <div className="mt-4 space-y-3">
                <div className="h-14 animate-pulse rounded-lg bg-muted" />
                <div className="h-14 animate-pulse rounded-lg bg-muted" />
              </div>
            ) : recommendations.length === 0 ? (
              <p className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
                <CircleCheck className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
                {tt("Tout est à jour, bravo !")}
              </p>
            ) : (
              <ul className="mt-3 space-y-1">
                {recommendations.map((recommendation) => (
                  <RecommendationRow key={recommendation.id} recommendation={recommendation} />
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Projets récents */}
        <section className="mt-9">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <h2 className="truncate text-[13.5px] font-bold tracking-wide text-muted-foreground">
              {tt("MES PROJETS RÉCENTS")}
            </h2>
            <Link
              to="/client/mes-projets"
              className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-primary transition-opacity hover:opacity-70"
            >
              {tt("Voir tous mes projets")}
              <ArrowRight className="h-3 w-3" strokeWidth={1.8} />
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_auto] gap-4 border-b border-border bg-accent/40 px-5 py-3 lg:grid">
              <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                {tt("Projet")}
              </p>
              <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                {tt("Catégorie")}
              </p>
              <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                {tt("Statut")}
              </p>
              <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                {tt("Dernière activité")}
              </p>
              <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                {tt("Action")}
              </p>
              <span className="w-4" />
            </div>

            {isProjectsLoading ? (
              <div className="px-5">
                <TableSkeleton rows={5} columns={5} />
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="p-5">
                <EmptyState message={tt("Aucun projet récent à afficher.")} />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentProjects.map((project) => (
                  <li key={project.id}>
                    <ProjectRow project={project} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Actions rapides */}
        <section className="mt-10">
          <h2 className="text-[13.5px] font-bold tracking-wide text-muted-foreground">
            {tt("ACTIONS RAPIDES")}
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              icon={Plus}
              title={tt("Postuler un projet")}
              description={tt("Déposez un nouveau projet et trouvez les meilleures agences.")}
              to="/client/postuler-un-projet"
            />
            <QuickAction
              icon={Sparkles}
              title={tt("Générer un CDC avec IA")}
              description={tt(
                "Créez un cahier des charges complet et optimisé avec l'intelligence artificielle.",
              )}
              to="/client/postuler-un-projet"
            />
            <QuickAction
              icon={MessageCircle}
              title={tt("Contacter une agence")}
              description={tt("Recherchez et contactez l'agence idéale pour votre projet.")}
              to="/agences"
            />
            <QuickAction
              icon={Users}
              title={tt("Voir mes collaborations")}
              description={tt("Suivez l'avancement de vos collaborations en cours.")}
              to="/client/collaborations"
            />
          </div>
        </section>

        <div className="mt-14 rounded-lg border border-border p-4">
          <p className="flex items-center gap-2 text-[13.5px] font-semibold">
            <CircleHelp className="h-4 w-4 text-primary" strokeWidth={1.8} />
            {tt("Besoin d'aide ?")}
          </p>
          <a
            href="/centre-aide"
            className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {tt("Consulter notre centre d'aide")}
            <ExternalLink className="h-3 w-3" strokeWidth={1.7} />
          </a>
        </div>
      </div>
    </DashboardShell>
  );
}

function DeltaLabel({ value }: { value: string | null }) {
  if (!value) return null;
  const isPositive = value.trim().startsWith("+");
  const isNegative = value.trim().startsWith("-");
  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : null;
  return (
    <span
      className={
        "flex items-center gap-1 font-medium " +
        (isPositive
          ? "text-emerald-600"
          : isNegative
            ? "text-destructive"
            : "text-muted-foreground")
      }
    >
      {Icon ? <Icon className="h-3 w-3" strokeWidth={2} /> : null}
      {value}
    </span>
  );
}

const RECOMMENDATION_STYLES: Record<string, { icon: LucideIcon; iconClass: string }> = {
  profile: { icon: Target, iconClass: "bg-amber-100 text-amber-600" },
  response_time: { icon: MessageCircle, iconClass: "bg-blue-100 text-blue-600" },
  project_detail: { icon: CircleCheck, iconClass: "bg-emerald-100 text-emerald-600" },
};

function RecommendationRow({ recommendation }: { recommendation: ClientDashboardRecommendation }) {
  const style = RECOMMENDATION_STYLES[recommendation.id] ?? {
    icon: Sparkles,
    iconClass: "bg-primary/10 text-primary",
  };
  const Icon = style.icon;
  const rowClass =
    "flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent";
  const content = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.iconClass}`}
      >
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold">{recommendation.title}</p>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">{recommendation.description}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
    </>
  );

  if (recommendation.id === "profile") {
    return (
      <li>
        <Link to="/client/mon-profil" className={rowClass}>
          {content}
        </Link>
      </li>
    );
  }
  if (recommendation.id === "response_time" || recommendation.id === "project_detail") {
    return (
      <li>
        <Link to="/client/mes-projets" className={rowClass}>
          {content}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <div className={rowClass}>{content}</div>
    </li>
  );
}

const RING_RADIUS = 30;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function gaugeTone(value: number): { ring: string; text: string } {
  if (value >= 70) return { ring: "text-primary", text: "text-primary" };
  if (value >= 40) return { ring: "text-amber-500", text: "text-amber-600" };
  return { ring: "text-destructive", text: "text-destructive" };
}

function CircularStat({
  icon: Icon,
  label,
  value,
  isPercent,
  footer,
}: {
  icon: LucideIcon;
  label: string;
  value: number | null;
  isPercent?: boolean;
  footer?: ReactNode;
}) {
  const clamped = value === null ? 0 : Math.max(0, Math.min(100, value));
  const offset = RING_CIRCUMFERENCE * (1 - clamped / 100);
  const tone =
    value === null ? { ring: "text-border", text: "text-muted-foreground" } : gaugeTone(value);

  return (
    <div className="flex items-center gap-4 p-5">
      <div className="relative h-16 w-16 shrink-0">
        <svg viewBox="0 0 72 72" className="h-16 w-16 -rotate-90">
          <circle
            cx="36"
            cy="36"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="7"
            stroke="currentColor"
            className="text-border"
          />
          <circle
            cx="36"
            cy="36"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            stroke="currentColor"
            className={tone.ring + " transition-[stroke-dashoffset] duration-700 ease-out"}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={"font-display text-[14px] font-bold " + tone.text}>
            {value === null ? "?" : `${value}${isPercent ? "%" : ""}`}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
          {label}
        </p>
        {footer ? <div className="mt-2 text-[13px] text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  footer,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  suffix?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        <p className="font-display mt-1 text-[28px] font-bold leading-none">
          {value}
          {suffix ? (
            <span className="text-[14px] font-normal text-muted-foreground">{suffix}</span>
          ) : null}
        </p>
        {footer ? <div className="mt-2.5 text-[13px] text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}

type StatusConfig = { label: string; bg: string; text: string; border: string; icon: LucideIcon };

const DEFAULT_STATUS_CONFIG: StatusConfig = {
  label: "Brouillon",
  bg: "bg-slate-100",
  text: "text-slate-700",
  border: "border-slate-200",
  icon: Clock,
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: DEFAULT_STATUS_CONFIG,
  published: {
    label: "Publié",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CircleCheck,
  },
  in_progress: {
    label: "En cours",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: CircleDot,
  },
  completed: {
    label: "Terminé",
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: CircleCheck,
  },
  archived: {
    label: "Archivé",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
    icon: Eye,
  },
  pending: {
    label: "En attente",
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
  },
};

function ProjectRow({ project }: { project: Project }) {
  const { tt } = usePageText(PAGE_TEXT);
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const repostMutation = useMutation({
    mutationFn: () => repostProject(project.id),
    onSuccess: () => {
      toast(tt("Projet republié auprès des agences pertinentes."));
      void queryClient.invalidateQueries({ queryKey: ["client", "dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["client", "projects"] });
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible de republier ce projet."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(project.id),
    onSuccess: () => {
      toast(tt("Projet supprimé."));
      setIsDeleteOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["client", "dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["client", "projects"] });
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible de supprimer ce projet."));
    },
  });

  const canRepost = project.status === "published";
  const canDelete = project.status === "draft" || project.status === "published";

  const statusConfig = STATUS_CONFIG[project.status] ?? DEFAULT_STATUS_CONFIG;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-accent/30 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_auto] lg:items-center lg:gap-4">
      {/* Projet - Titre mis en avant */}
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
          <FileText className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </div>
        <div className="min-w-0">
          <p className="font-display text-[15px] font-bold leading-tight tracking-tight text-foreground transition-colors hover:text-primary">
            {project.title}
          </p>
          {/* ID supprimé - remplacé par un indicateur de statut léger */}
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40" />
            {project.reference
              ? `${tt("Réf.")} ${project.reference.slice(0, 8)}`
              : tt("Nouveau projet")}
          </p>
        </div>
      </div>

      {/* Catégorie */}
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-foreground">
          {project.category || tt("Non catégorisé")}
        </p>
        {project.subCategory && (
          <p className="truncate text-[12.5px] text-muted-foreground">{project.subCategory}</p>
        )}
      </div>

      {/* Statut - Badge modernisé avec icône et couleurs personnalisées */}
      <div className="min-w-0">
        <span
          className={`
            inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold
            ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}
            shadow-sm transition-all hover:scale-105
          `}
        >
          <StatusIcon className="h-3 w-3" strokeWidth={2} />
          {tt(statusConfig.label)}
        </span>
      </div>

      {/* Dernière activité */}
      <p className="truncate text-[13px] text-muted-foreground">{project.lastActivity}</p>

      {/* Action */}
      <div className="min-w-0">
        <Link
          to="/client/mes-projets/$id"
          params={{ id: project.id }}
          className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-center text-[13px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm lg:w-auto"
        >
          {project.status === "draft" ? `📝 ${tt("Reprendre")}` : `👁️ ${tt("Voir")}`}
        </Link>
      </div>

      {/* Menu actions */}
      {canRepost || canDelete ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={tt("Plus d'actions")}
                className="justify-self-start rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:justify-self-center"
              >
                <MoreVertical className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-border shadow-lg">
              {canRepost ? (
                <DropdownMenuItem
                  disabled={repostMutation.isPending}
                  onClick={() => repostMutation.mutate()}
                  className="cursor-pointer gap-2 text-[13px]"
                >
                  <RefreshCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {repostMutation.isPending ? tt("Republication...") : tt("Repostuler")}
                </DropdownMenuItem>
              ) : null}
              {canDelete ? (
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-[13px] text-destructive focus:text-destructive"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {tt("Supprimer")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Modal de suppression */}
          <ActionModal
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            title={tt("Supprimer ce projet ?")}
            description={tt(
              "« {title} » sera définitivement supprimé. Cette action est irréversible.",
            ).replace("{title}", project.title)}
            confirmLabel={
              deleteMutation.isPending ? tt("Suppression...") : tt("Supprimer définitivement")
            }
            onConfirm={() => deleteMutation.mutate()}
          />
        </>
      ) : (
        <span className="justify-self-start lg:justify-self-center" />
      )}
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  to,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
}) {
  const { tt } = usePageText(PAGE_TEXT);
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md">
        <Icon className="h-[20px] w-[20px]" strokeWidth={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[14px] font-bold">{title}</p>
        <p className="mt-1 text-[13px] leading-[1.5] text-muted-foreground">{description}</p>
      </div>
      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
        {tt("Ouvrir")}
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          strokeWidth={1.8}
        />
      </span>
    </Link>
  );
}
