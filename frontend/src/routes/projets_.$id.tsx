import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  Building2,
  Clock,
  Download,
  MapPin,
  Send,
  Tag,
  Star,
  Briefcase,
  ChevronRight,
  CircleCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import {
  downloadPublicProjectCdc,
  getPublicProject,
  type PublicProjectDetail,
} from "@/services/projects.service";
import { toggleProjectFavorite, listFavoriteProjects } from "@/services/agencies.service";
import { expressInterest } from "@/services/opportunities.service";
import { ApiError } from "@/services/http";
import { EmptyState } from "@/components/common/EmptyState";
import { useAuthStore } from "@/store/auth.store";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

export const Route = createFileRoute("/projets_/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Détail du projet — Sortlist Pro" },
      {
        name: "description",
        content: "Découvrez les détails de ce projet et l'entreprise qui le publie.",
      },
    ],
  }),
  component: ProjectDetailPage,
});

const PAGE_TEXT = {
  "Candidature envoyée": {
    en: "Application sent",
    ar: "تم إرسال الطلب",
    es: "Candidatura enviada",
  },
  "Ce projet apparaît désormais dans vos offres — envoyez votre devis.": {
    en: "This project now appears in your opportunities — send your quote.",
    ar: "يظهر هذا المشروع الآن في فرصك — أرسل عرض سعرك.",
    es: "Este proyecto ahora aparece en tus oportunidades — envía tu presupuesto.",
  },
  "Impossible de postuler à ce projet.": {
    en: "Unable to apply to this project.",
    ar: "تعذر التقدم لهذا المشروع.",
    es: "No se pudo postular a este proyecto.",
  },
  "Connectez-vous avec un compte agence pour postuler à ce projet.": {
    en: "Sign in with an agency account to apply to this project.",
    ar: "سجّل الدخول بحساب وكالة للتقدم لهذا المشروع.",
    es: "Inicia sesión con una cuenta de agencia para postular a este proyecto.",
  },
  "Connectez-vous avec un compte agence pour télécharger le cahier des charges.": {
    en: "Sign in with an agency account to download the project brief.",
    ar: "سجّل الدخول بحساب وكالة لتحميل كراسة الشروط.",
    es: "Inicia sesión con una cuenta de agencia para descargar el pliego de condiciones.",
  },
  "Impossible de télécharger le CDC.": {
    en: "Unable to download the project brief.",
    ar: "تعذر تحميل كراسة الشروط.",
    es: "No se pudo descargar el pliego de condiciones.",
  },
  "Impossible de charger le projet.": {
    en: "Unable to load the project.",
    ar: "تعذر تحميل المشروع.",
    es: "No se pudo cargar el proyecto.",
  },
  "Connectez-vous avec un compte agence pour enregistrer ce projet.": {
    en: "Sign in with an agency account to save this project.",
    ar: "سجّل الدخول بحساب وكالة لحفظ هذا المشروع.",
    es: "Inicia sesión con una cuenta de agencia para guardar este proyecto.",
  },
  "Projet enregistré": {
    en: "Project saved",
    ar: "تم حفظ المشروع",
    es: "Proyecto guardado",
  },
  "Projet retiré des favoris": {
    en: "Project removed from favorites",
    ar: "تمت إزالة المشروع من المفضلة",
    es: "Proyecto eliminado de favoritos",
  },
  "Impossible d'enregistrer ce projet.": {
    en: "Unable to save this project.",
    ar: "تعذر حفظ هذا المشروع.",
    es: "No se pudo guardar este proyecto.",
  },
  "Retour aux projets": {
    en: "Back to projects",
    ar: "العودة إلى المشاريع",
    es: "Volver a los proyectos",
  },
  "Projet introuvable": {
    en: "Project not found",
    ar: "المشروع غير موجود",
    es: "Proyecto no encontrado",
  },
  "Budget à définir": {
    en: "Budget to be defined",
    ar: "الميزانية سيتم تحديدها",
    es: "Presupuesto por definir",
  },
  "Retirer des favoris": {
    en: "Remove from favorites",
    ar: "إزالة من المفضلة",
    es: "Quitar de favoritos",
  },
  Enregistrer: {
    en: "Save",
    ar: "حفظ",
    es: "Guardar",
  },
  Publié: {
    en: "Published",
    ar: "منشور",
    es: "Publicado",
  },
  le: {
    en: "on",
    ar: "في",
    es: "el",
  },
  "Budget estimé": {
    en: "Estimated budget",
    ar: "الميزانية التقديرية",
    es: "Presupuesto estimado",
  },
  "Livraison en {days} jours": {
    en: "Delivery in {days} days",
    ar: "التسليم خلال {days} يومًا",
    es: "Entrega en {days} días",
  },
  "Description du projet": {
    en: "Project description",
    ar: "وصف المشروع",
    es: "Descripción del proyecto",
  },
  "Aucune description disponible.": {
    en: "No description available.",
    ar: "لا يوجد وصف متاح.",
    es: "No hay descripción disponible.",
  },
  "Détails du projet": {
    en: "Project details",
    ar: "تفاصيل المشروع",
    es: "Detalles del proyecto",
  },
  "Type de projet": {
    en: "Project type",
    ar: "نوع المشروع",
    es: "Tipo de proyecto",
  },
  Canal: {
    en: "Channel",
    ar: "القناة",
    es: "Canal",
  },
  "Date de fin prévue": {
    en: "Expected end date",
    ar: "تاريخ الانتهاء المتوقع",
    es: "Fecha de finalización prevista",
  },
  Entreprise: {
    en: "Company",
    ar: "الشركة",
    es: "Empresa",
  },
  "Score de confiance : {score}/5": {
    en: "Trust score: {score}/5",
    ar: "درجة الثقة: {score}/5",
    es: "Puntuación de confianza: {score}/5",
  },
  Actions: {
    en: "Actions",
    ar: "الإجراءات",
    es: "Acciones",
  },
  "Envoi en cours...": {
    en: "Sending...",
    ar: "جارٍ الإرسال...",
    es: "Enviando...",
  },
  "Postuler au projet": {
    en: "Apply to project",
    ar: "التقدم للمشروع",
    es: "Postular al proyecto",
  },
  "Ajouter aux favoris": {
    en: "Add to favorites",
    ar: "إضافة إلى المفضلة",
    es: "Añadir a favoritos",
  },
  "Téléchargement...": {
    en: "Downloading...",
    ar: "جارٍ التحميل...",
    es: "Descargando...",
  },
  "Télécharger le CDC": {
    en: "Download the project brief",
    ar: "تحميل كراسة الشروط",
    es: "Descargar el pliego de condiciones",
  },
} satisfies PageTextDict;

function ProjectDetailPage() {
  const { tt, locale } = usePageText(PAGE_TEXT);
  const { id } = useParams({ from: "/projets_/$id" });
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const [project, setProject] = useState<PublicProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPendingFavorite, setIsPendingFavorite] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isDownloadingCdc, setIsDownloadingCdc] = useState(false);

  const applyMutation = useMutation({
    mutationFn: expressInterest,
    onSuccess: () => {
      setHasApplied(true);
      toast(tt("Candidature envoyée"), {
        description: tt("Ce projet apparaît désormais dans vos offres — envoyez votre devis."),
      });
    },
    onError: (error: unknown) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible de postuler à ce projet."));
    },
  });

  function handleApply() {
    if (!token || role !== "agency") {
      toast(tt("Connectez-vous avec un compte agence pour postuler à ce projet."));
      navigate({ to: "/connexion" });
      return;
    }
    applyMutation.mutate(id);
  }

  async function handleDownloadCdc() {
    if (!token || role !== "agency") {
      toast(tt("Connectez-vous avec un compte agence pour télécharger le cahier des charges."));
      navigate({ to: "/connexion" });
      return;
    }
    setIsDownloadingCdc(true);
    try {
      const blob = await downloadPublicProjectCdc(id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `CDC-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast(error instanceof ApiError ? error.message : tt("Impossible de télécharger le CDC."));
    } finally {
      setIsDownloadingCdc(false);
    }
  }

  useEffect(() => {
    setIsLoading(true);
    Promise.all([getPublicProject(id), listFavoriteProjects().catch(() => [])])
      .then(([projectData, favorites]) => {
        setProject(projectData);
        setIsFavorite(favorites.some((fav) => fav.id === id));
      })
      .catch((error) => {
        toast.error(error instanceof ApiError ? error.message : tt("Impossible de charger le projet."));
        setProject(null);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleFavorite = () => {
    if (!token || role !== "agency") {
      toast(tt("Connectez-vous avec un compte agence pour enregistrer ce projet."));
      navigate({ to: "/connexion" });
      return;
    }
    setIsPendingFavorite(true);
    toggleProjectFavorite(id)
      .then(({ favorited }) => {
        setIsFavorite(favorited);
        toast(favorited ? tt("Projet enregistré") : tt("Projet retiré des favoris"));
      })
      .catch((error: unknown) => {
        toast(error instanceof ApiError ? error.message : tt("Impossible d'enregistrer ce projet."));
      })
      .finally(() => setIsPendingFavorite(false));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingHeader variant="search" active="projects" applyDisabled />
        <main className="mx-auto max-w-[1080px] px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mt-8 animate-pulse">
            <div className="h-8 w-48 rounded-lg bg-muted" />
            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 rounded-2xl bg-muted" />
                <div className="h-32 rounded-2xl bg-muted" />
                <div className="h-40 rounded-2xl bg-muted" />
              </div>
              <div className="space-y-6">
                <div className="h-48 rounded-2xl bg-muted" />
                <div className="h-32 rounded-2xl bg-muted" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingHeader variant="search" active="projects" applyDisabled />
        <main className="mx-auto max-w-[1080px] px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mt-8">
            <Link
              to="/projets"
              className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {tt("Retour aux projets")}
            </Link>
          </div>
          <div className="mt-12">
            <EmptyState message={tt("Projet introuvable")} />
          </div>
        </main>
      </div>
    );
  }

  const publishedDate = new Date(project.publishedAt);
  const localeTag =
    locale === "en" ? "en-US" : locale === "ar" ? "ar" : locale === "es" ? "es-ES" : "fr-FR";
  const budgetDisplay =
    project.budgetMin || project.budgetMax
      ? `${project.budgetMin} € - ${project.budgetMax} €`
      : tt("Budget à définir");

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader variant="search" active="projects" applyDisabled />

      <main className="mx-auto max-w-[1080px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mt-8 flex items-center justify-between">
          <Link
            to="/projets"
            className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {tt("Retour aux projets")}
          </Link>
          <button
            onClick={handleToggleFavorite}
            disabled={isPendingFavorite}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 disabled:opacity-60"
          >
            <Bookmark
              className="h-4 w-4"
              strokeWidth={1.8}
              fill={isFavorite ? "currentColor" : "none"}
            />
            {isFavorite ? tt("Retirer des favoris") : tt("Enregistrer")}
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {tt("Publié")}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  {tt("le")}{" "}
                  {publishedDate.toLocaleDateString(localeTag, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h1 className="mt-3 text-[28px] font-bold tracking-tight leading-tight">
                {project.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" strokeWidth={1.8} />
                  {project.location}
                </span>
                {project.category && (
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" strokeWidth={1.8} />
                    {project.category}
                  </span>
                )}
                {project.subCategory && (
                  <span className="flex items-center gap-1.5">
                    <ChevronRight className="h-3 w-3" />
                    {project.subCategory}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] text-muted-foreground">{tt("Budget estimé")}</p>
              <p className="text-[20px] font-bold">{budgetDisplay}</p>
              {project.deliveryDelayDays && (
                <p className="text-[12px] text-muted-foreground">
                  <Clock className="inline h-3.5 w-3.5 mr-1" />
                  {tt("Livraison en {days} jours").replace(
                    "{days}",
                    String(project.deliveryDelayDays),
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border p-6">
              <h2 className="text-[16px] font-bold flex items-center gap-2">
                {tt("Description du projet")}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {project.description || tt("Aucune description disponible.")}
              </p>
            </div>

            <div className="rounded-2xl border border-border p-6">
              <h2 className="text-[16px] font-bold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                {tt("Détails du projet")}
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {project.needType && (
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {tt("Type de projet")}
                    </p>
                    <p className="mt-1 text-[14px] font-semibold">{project.needType}</p>
                  </div>
                )}
                {project.channel && (
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {tt("Canal")}
                    </p>
                    <p className="mt-1 text-[14px] font-semibold">{project.channel}</p>
                  </div>
                )}
                {project.expectedEndDate && (
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {tt("Date de fin prévue")}
                    </p>
                    <p className="mt-1 text-[14px] font-semibold">
                      {new Date(project.expectedEndDate).toLocaleDateString(localeTag, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border p-6">
              <h2 className="text-[16px] font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {tt("Entreprise")}
              </h2>
              <div className="mt-4">
                <div className="flex items-start gap-3">
                  {project.clientLogo ? (
                    <img
                      src={project.clientLogo}
                      alt={project.clientCompanyName}
                      className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                      <Building2 className="h-6 w-6 text-muted-foreground" strokeWidth={1.6} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold">{project.clientCompanyName}</p>
                    {project.clientCountry && (
                      <p className="text-[13px] text-muted-foreground">{project.clientCountry}</p>
                    )}
                    {project.clientSector && (
                      <p className="text-[12px] text-muted-foreground">{project.clientSector}</p>
                    )}
                  </div>
                </div>
                {project.clientTrustScore !== null && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-[13px] font-semibold">
                      {tt("Score de confiance : {score}/5").replace(
                        "{score}",
                        String(project.clientTrustScore),
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border p-6">
              <h2 className="text-[16px] font-bold flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                {tt("Actions")}
              </h2>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applyMutation.isPending || hasApplied}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 py-3 text-[14px] font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                >
                  {hasApplied ? (
                    <>
                      <CircleCheck className="h-4 w-4" strokeWidth={1.8} />
                      {tt("Candidature envoyée")}
                    </>
                  ) : applyMutation.isPending ? (
                    tt("Envoi en cours...")
                  ) : (
                    tt("Postuler au projet")
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  disabled={isPendingFavorite}
                  className="w-full rounded-xl border border-border px-4 py-3 text-[14px] font-semibold transition-all hover:bg-accent disabled:opacity-60"
                >
                  <Bookmark
                    className="inline h-4 w-4 mr-2"
                    strokeWidth={1.8}
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                  {isFavorite ? tt("Retirer des favoris") : tt("Ajouter aux favoris")}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCdc}
                  disabled={isDownloadingCdc}
                  className="w-full rounded-xl border border-border px-4 py-3 text-[14px] font-semibold transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="inline h-4 w-4 mr-2" strokeWidth={1.8} />
                  {isDownloadingCdc ? tt("Téléchargement...") : tt("Télécharger le CDC")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
