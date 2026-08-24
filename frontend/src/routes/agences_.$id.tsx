import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  ArrowLeft,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Building2,
  CalendarDays,
  Globe,
  Image as ImageIcon,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Star,
  TrendingUp,
  Users,
  Wallet,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Clock,
  FileText,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { SectionCard, StatusBadge } from "@/components/common/Blocks";
import { StackSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import { ActionModal } from "@/components/common/ActionModal";
import type { Agency, AgencyProfile } from "@/lib/types";
import {
  contactAgencyUnicast,
  getAgencyProfile,
  getCategories,
  listAgencyReviews,
  listFavoriteAgencies,
  searchAgencies,
  toggleFavoriteAgency,
  type AgencyReview,
  type CategoryOption,
} from "@/services/agencies.service";
import {
  trackProspectionSignal,
  type ProspectionTrackAction,
} from "@/services/prospection.service";
import { ApiError } from "@/services/http";
import { useAuthStore } from "@/store/auth.store";

export const Route = createFileRoute("/agences_/$id")({
  head: () => ({
    meta: [
      { title: "Profil de l'agence | Sortlist Pro" },
      {
        name: "description",
        content:
          "Consultez la présentation, les compétences, le portfolio et les avis d'une agence avant de la contacter.",
      },
      { property: "og:title", content: "Profil de l'agence | Sortlist Pro" },
      {
        property: "og:description",
        content: "Présentation, compétences, réalisations et avis clients de l'agence.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicAgencyProfilePage,
});

interface PortfolioItem {
  id: string;
  title: string;
  status: string;
  image?: string;
}

type TabKey =
  "apercu" | "portfolio" | "prestations" | "certificats" | "equipe" | "avis" | "contact";

const TAB_ACTIONS: Record<TabKey, ProspectionTrackAction> = {
  apercu: "profile",
  portfolio: "portfolio",
  prestations: "services",
  certificats: "certifications",
  equipe: "team",
  avis: "reviews",
  contact: "profile",
};

const TAB_ORDER: { key: TabKey; label: string; icon: typeof Sparkles }[] = [
  { key: "apercu", label: "Aperçu", icon: Sparkles },
  { key: "portfolio", label: "Portfolio", icon: ImageIcon },
  { key: "prestations", label: "Prestations", icon: Briefcase },
  { key: "certificats", label: "Certificats", icon: Award },
  { key: "equipe", label: "Équipe", icon: Users },
  { key: "avis", label: "Avis", icon: Star },
  { key: "contact", label: "Contact", icon: Phone },
];

/**
 * Suivi de prospection par onglet (§2.6, MUST) : la page est découpée en
 * onglets — un seul contenu visible à la fois — donc la durée RÉELLE passée
 * sur l'onglet précédent est envoyée au moment où l'utilisateur en change
 * (ou quitte la page). `latestRef` évite les fermetures obsolètes dans le
 * flush appelé au démontage (le composant peut se démonter longtemps après
 * le premier rendu, une fois les données — compteurs, identité client —
 * chargées).
 */
function useTabbedProspectionTracking(
  agencyId: string,
  ready: boolean,
  countFor: (tab: TabKey) => number | undefined,
  clientEmail: string | undefined,
  clientName: string | undefined,
) {
  const [activeTab, setActiveTab] = useState<TabKey>("apercu");
  const activeTabRef = useRef<TabKey>("apercu");
  const enteredAtRef = useRef<number>(Date.now());
  const initializedRef = useRef(false);
  const latestRef = useRef({ countFor, clientEmail, clientName });
  latestRef.current = { countFor, clientEmail, clientName };

  function flush(tab: TabKey) {
    const elapsed = Math.round((Date.now() - enteredAtRef.current) / 1000);
    if (elapsed >= 1) {
      trackProspectionSignal(agencyId, TAB_ACTIONS[tab], {
        durationSeconds: elapsed,
        count: latestRef.current.countFor(tab),
        clientEmail: latestRef.current.clientEmail,
        clientName: latestRef.current.clientName,
      }).catch(() => {});
    }
  }

  // BUG CORRIGÉ : chaque changement d'onglet envoyait DEUX signaux pour le
  // même onglet — `trackClick` au clic (immédiat, sans durée) ET `flush` en
  // le quittant (avec la vraie durée) — `/track` insérant une ligne et
  // additionnant les points à CHAQUE appel, les points de base de chaque
  // section étaient donc comptés deux fois par simple visite. Un onglet
  // n'est désormais compté qu'une seule fois, à la sortie (`flush`), muni de
  // sa durée réelle — `flush` ignore déjà les visites de moins d'1 seconde
  // (clic accidentel), ce qui est le comportement voulu.
  useEffect(() => {
    if (!ready || !agencyId || initializedRef.current) return;
    initializedRef.current = true;
    enteredAtRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, agencyId]);

  useEffect(() => {
    return () => {
      if (initializedRef.current) flush(activeTabRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectTab(tab: TabKey) {
    if (tab === activeTabRef.current) return;
    flush(activeTabRef.current);
    activeTabRef.current = tab;
    enteredAtRef.current = Date.now();
    setActiveTab(tab);
  }

  return { activeTab, selectTab };
}

function buildRatingBreakdown(reviews: AgencyReview[]) {
  const counts = [0, 0, 0, 0, 0];
  for (const review of reviews) {
    const rounded = Math.max(1, Math.min(5, Math.round(review.rating)));
    counts[5 - rounded] = (counts[5 - rounded] ?? 0) + 1;
  }
  const max = Math.max(1, ...counts);
  return counts.map((count, index) => ({
    stars: 5 - index,
    count,
    percent: Math.round((count / max) * 100),
  }));
}

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

function PublicAgencyProfilePage() {
  const { id } = Route.useParams();
  const token = useAuthStore((state) => state.token);
  const authUser = useAuthStore((state) => state.user);
  const authRole = useAuthStore((state) => state.role);
  const tabContentRef = useRef<HTMLDivElement | null>(null);
  const similarScrollRef = useRef<HTMLDivElement | null>(null);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const clientEmail = authRole === "client" ? authUser?.email : undefined;
  const clientName = authRole === "client" ? authUser?.displayName : undefined;

  const [agency, setAgency] = useState<(Agency & Partial<AgencyProfile>) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [reviews, setReviews] = useState<AgencyReview[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);

  const [similarAgencies, setSimilarAgencies] = useState<Agency[]>([]);

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    needType: "Projet" as "Projet" | "Stage" | "Job",
    title: "",
    description: "",
    category: "",
    subCategory: "",
    budgetMin: "",
    budgetMax: "",
    location: "",
    deliveryDelayDays: "",
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const selectedCategorySubOptions =
    categories.find((cat) => cat.id === contactForm.category)?.subCategories ?? [];

  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getAgencyProfile(id)
      .then(setAgency)
      .catch((error: unknown) => {
        toast(error instanceof ApiError ? error.message : "Impossible de charger cette agence.");
        setAgency(null);
      })
      .finally(() => setIsLoading(false));

    setIsReviewsLoading(true);
    listAgencyReviews(id)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setIsReviewsLoading(false));
  }, [id]);

  useEffect(() => {
    searchAgencies({ page: 1, pageSize: 4 })
      .then((result) => setSimilarAgencies(result.items.filter((item) => item.id !== id)))
      .catch(() => setSimilarAgencies([]));
  }, [id]);

  useEffect(() => {
    if (!token || authRole !== "client") return;
    listFavoriteAgencies()
      .then((favorites) => setIsFavorite(favorites.some((fav) => fav.agency === id)))
      .catch(() => {});
  }, [id, token, authRole]);

  async function handleToggleFavorite() {
    if (!token) {
      window.location.href = "/connexion";
      return;
    }
    setIsTogglingFavorite(true);
    try {
      const result = await toggleFavoriteAgency(id);
      setIsFavorite(result.favorited);
      toast(result.favorited ? "Agence ajoutée à vos favoris" : "Agence retirée de vos favoris");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Action impossible.");
    } finally {
      setIsTogglingFavorite(false);
    }
  }

  const portfolio: PortfolioItem[] = (agency?.portfolio ?? []).map((item, index) => ({
    id: item.id ?? String(index),
    title: item.title,
    status: item.status,
    image: item.image,
  }));

  const team = agency?.team ?? [];
  const services = agency?.services ?? [];
  const certifications = agency?.certifications ?? [];
  const ratingBreakdown = buildRatingBreakdown(reviews);

  function countFor(tab: TabKey): number | undefined {
    switch (tab) {
      case "portfolio":
        return portfolio.length;
      case "prestations":
        return services.length;
      case "certificats":
        return certifications.length;
      case "equipe":
        return team.length;
      case "avis":
        return reviews.length;
      default:
        return undefined;
    }
  }

  const { activeTab, selectTab } = useTabbedProspectionTracking(
    id,
    !isLoading && agency !== null,
    countFor,
    clientEmail,
    clientName,
  );

  const strongIntentSentRef = useRef(false);
  function trackStrongIntentClick() {
    if (strongIntentSentRef.current) return;
    strongIntentSentRef.current = true;
    trackProspectionSignal(id, "favorite", { clientEmail, clientName }).catch(() => {});
  }

  function openContactModal() {
    trackStrongIntentClick();
    if (!token) {
      window.location.href = "/connexion";
      return;
    }
    setIsContactOpen(true);
  }

  async function handleSubmitContact() {
    if (!contactForm.description.trim()) {
      toast("Décrivez votre besoin avant d'envoyer.");
      return;
    }
    setIsSubmittingContact(true);
    try {
      await contactAgencyUnicast(id, {
        needType: contactForm.needType,
        description: contactForm.description,
        ...(contactForm.title ? { title: contactForm.title } : {}),
        ...(contactForm.category ? { category: contactForm.category } : {}),
        ...(contactForm.subCategory ? { subCategory: contactForm.subCategory } : {}),
        ...(contactForm.budgetMin ? { budgetMin: Number(contactForm.budgetMin) } : {}),
        ...(contactForm.budgetMax ? { budgetMax: Number(contactForm.budgetMax) } : {}),
        ...(contactForm.location ? { location: contactForm.location } : {}),
        ...(contactForm.deliveryDelayDays
          ? { deliveryDelayDays: Number(contactForm.deliveryDelayDays) }
          : {}),
      });
      toast(
        contactForm.needType === "Projet"
          ? "Votre demande a été envoyée à l'agence, avec le cahier des charges généré à partir de vos informations."
          : "Votre demande a été envoyée à l'agence.",
      );
      setIsContactOpen(false);
      setContactForm({
        needType: "Projet",
        title: "",
        description: "",
        category: "",
        subCategory: "",
        budgetMin: "",
        budgetMax: "",
        location: "",
        deliveryDelayDays: "",
      });
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Envoi impossible.");
    } finally {
      setIsSubmittingContact(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader variant="search" active="agencies" />

      <main className="mx-auto max-w-[1080px] px-4 pb-20 sm:px-6 lg:px-8">
        {/* RETOUR */}
        <Link
          to="/agences"
          className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Retour aux agences
        </Link>

        {/* EN-TÊTE MODERNISÉ */}
        <section className="mt-5 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {isLoading ? (
            <div className="p-6">
              <StackSkeleton count={3} />
            </div>
          ) : agency === null ? (
            <div className="p-6">
              <EmptyState message="Aucune donnée disponible pour cette agence." />
            </div>
          ) : (
            <div className="relative">
              {/* BANNIÈRE */}
              {agency.coverImage ? (
                <div className="h-32 w-full overflow-hidden bg-gradient-to-r from-primary/20 to-primary/5">
                  <img src={agency.coverImage} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-32 w-full bg-gradient-to-r from-primary/20 to-primary/5" />
              )}

              <div className="p-6 pt-0">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start">
                  {/* LOGO */}
                  <div className="relative -mt-10 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-background bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-lg">
                    {agency.logo ? (
                      <img
                        src={agency.logo}
                        alt={agency.name}
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                    ) : (
                      <span
                        style={{ backgroundImage: seedGradient(agency.id) }}
                        className="flex h-20 w-20 items-center justify-center rounded-xl text-[24px] font-bold text-white"
                      >
                        {initialsOf(agency.name)}
                      </span>
                    )}
                  </div>

                  {/* INFOS PRINCIPALES */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight">
                        {agency.name}
                      </h1>
                      {agency.legalIdValid && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                          Vérifié
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                        {agency.location || "Non spécifiée"}
                      </span>
                      {agency.foundedYear && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                          Depuis {agency.foundedYear}
                        </span>
                      )}
                      {agency.teamSize && (
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                          {agency.teamSize} employés
                        </span>
                      )}
                    </div>

                    {/* NOTE ET AVIS */}
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= Math.round(agency.rating || 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30"
                              }`}
                              strokeWidth={star <= Math.round(agency.rating || 0) ? 0 : 1.5}
                            />
                          ))}
                        </div>
                        <span className="text-[14px] font-semibold">{agency.rating || "—"}</span>
                        <span className="text-[13px] text-muted-foreground">
                          ({agency.reviewsCount || 0} avis)
                        </span>
                      </div>
                    </div>

                    <p className="mt-4 max-w-[62ch] text-[15px] leading-[1.6] text-muted-foreground">
                      {agency.description || "Aucune description disponible."}
                    </p>

                    {/* CONTACTS RAPIDES */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-[13.5px]">
                      {agency.email && (
                        <a
                          href={"mailto:" + agency.email}
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
                          {agency.email}
                        </a>
                      )}
                      {agency.phone && (
                        <a
                          href={"tel:" + agency.phone}
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
                          {agency.phoneCountryCode} {agency.phone}
                        </a>
                      )}
                      {agency.website && (
                        <a
                          href={agency.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Globe className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
                          {agency.website}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex flex-col gap-2 sm:w-[190px]">
                    <button
                      type="button"
                      onClick={openContactModal}
                      className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
                    >
                      <Send className="h-4 w-4" strokeWidth={1.8} />
                      Contacter
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      disabled={isTogglingFavorite}
                      className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-[14px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Star
                        className="h-4 w-4"
                        strokeWidth={1.8}
                        fill={isFavorite ? "currentColor" : "none"}
                      />
                      {isFavorite ? "Favori" : "Ajouter aux favoris"}
                    </button>
                    <Link
                      to="/postuler-un-projet"
                      onClick={trackStrongIntentClick}
                      className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-[14px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
                    >
                      <FileText className="h-4 w-4" strokeWidth={1.8} />
                      Publier un projet
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* STATS RAPIDES */}
        {agency && !isLoading && (
          <div className="mt-4 grid grid-cols-2 divide-x divide-border rounded-lg border border-border bg-card sm:grid-cols-4">
            <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
              <ImageIcon className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.6} />
              <p className="text-[18px] font-bold leading-none">{portfolio.length}</p>
              <p className="text-[12px] text-muted-foreground">Réalisations</p>
            </div>
            <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
              <Briefcase className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.6} />
              <p className="text-[18px] font-bold leading-none">{services.length}</p>
              <p className="text-[12px] text-muted-foreground">Services</p>
            </div>
            <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
              <Star className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.6} />
              <p className="text-[18px] font-bold leading-none">{agency.rating ?? "—"}</p>
              <p className="text-[12px] text-muted-foreground">Note moyenne</p>
            </div>
            <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
              <MessageSquare
                className="h-[18px] w-[18px] text-muted-foreground"
                strokeWidth={1.6}
              />
              <p className="text-[18px] font-bold leading-none">{agency.reviewsCount ?? 0}</p>
              <p className="text-[12px] text-muted-foreground">Avis clients</p>
            </div>
          </div>
        )}

        {/* TABS MODERNISÉS */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-card p-2 shadow-sm">
            {TAB_ORDER.map((tab) => {
              const Icon = tab.icon;
              const count = countFor(tab.key);
              return (
                <button
                  key={tab.key}
                  onClick={() => selectTab(tab.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-all ${
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                  {tab.label}
                  {count !== undefined && count > 0 && (
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        activeTab === tab.key
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-accent text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* CONTENU DES TABS */}
          <div ref={tabContentRef} className="mt-6 scroll-mt-20">
            {/* APERÇU */}
            <div id="section-apercu" className="scroll-mt-24" />
            {activeTab === "apercu" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-[16px] font-bold">À propos et compétences</h2>
                  <p className="text-[13px] text-muted-foreground">
                    Présentation, expertise et technologies de l'agence.
                  </p>
                  {isLoading ? (
                    <div className="mt-5">
                      <StackSkeleton count={2} />
                    </div>
                  ) : agency === null ? (
                    <div className="mt-5">
                      <EmptyState message="Aucune donnée disponible" />
                    </div>
                  ) : (
                    <div className="mt-5 space-y-6">
                      <p className="text-[14.5px] leading-[1.7] text-muted-foreground">
                        {agency.description || "Aucune présentation renseignée pour le moment."}
                      </p>
                      <div className="grid grid-cols-1 gap-5 border-t border-border pt-5 sm:grid-cols-3">
                        <div>
                          <p className="text-[13px] font-semibold text-muted-foreground">
                            Compétences
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(agency.skills ?? []).length === 0 ? (
                              <p className="text-[13px] text-muted-foreground">Non renseigné.</p>
                            ) : (
                              (agency.skills ?? []).map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-medium text-primary"
                                >
                                  {skill}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-muted-foreground">
                            Technologies
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(agency.techStack ?? []).length === 0 ? (
                              <p className="text-[13px] text-muted-foreground">Non renseigné.</p>
                            ) : (
                              (agency.techStack ?? []).map((tech) => (
                                <span
                                  key={tech}
                                  className="rounded-full bg-accent px-3 py-1 text-[12px] font-medium text-muted-foreground"
                                >
                                  {tech}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-muted-foreground">Langues</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(agency.languages ?? []).length === 0 ? (
                              <p className="text-[13px] text-muted-foreground">Non renseigné.</p>
                            ) : (
                              (agency.languages ?? []).map((language) => (
                                <span
                                  key={language}
                                  className="rounded-full border border-border px-3 py-1 text-[12px] font-medium text-muted-foreground"
                                >
                                  {language}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {services.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-[16px] font-bold">Services proposés</h2>
                        <p className="text-[13px] text-muted-foreground">
                          Aperçu rapide des prestations de l'agence.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectTab("prestations")}
                        className="text-[13px] font-semibold text-primary hover:underline"
                      >
                        Voir tous →
                      </button>
                    </div>
                    <ul className="mt-5 divide-y divide-border">
                      {services.slice(0, 4).map((service, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-accent/30">
                            <Briefcase className="h-[15px] w-[15px]" strokeWidth={1.7} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold">{service.serviceName}</p>
                            {service.priceRange && (
                              <p className="text-[12.5px] text-muted-foreground">
                                {service.priceRange}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {portfolio.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-[16px] font-bold">Réalisations</h2>
                        <p className="text-[13px] text-muted-foreground">
                          Aperçu des projets réalisés.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectTab("portfolio")}
                        className="text-[13px] font-semibold text-primary hover:underline"
                      >
                        Voir toutes →
                      </button>
                    </div>
                    <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {portfolio.slice(0, 4).map((item) => (
                        <li
                          key={item.id}
                          onClick={() => setSelectedPortfolioItem(item)}
                          className="cursor-pointer overflow-hidden rounded-lg border border-border transition-colors hover:bg-accent/30"
                        >
                          <div className="flex aspect-[4/3] items-center justify-center bg-muted">
                            <ImageIcon
                              className="h-6 w-6 text-muted-foreground"
                              strokeWidth={1.5}
                            />
                          </div>
                          <div className="p-2.5">
                            <p className="truncate text-[12.5px] font-semibold">{item.title}</p>
                            <p className="truncate text-[11.5px] text-muted-foreground">
                              {item.status}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* PORTFOLIO */}
            <div id="section-portfolio" className="scroll-mt-24" />
            {activeTab === "portfolio" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-[16px] font-bold">Portfolio</h2>
                <p className="text-[13px] text-muted-foreground">
                  Réalisations publiées par l'agence.
                </p>
                <div className="mt-5">
                  {isLoading ? (
                    <StackSkeleton count={3} />
                  ) : portfolio.length === 0 ? (
                    <EmptyState message="Aucune réalisation à afficher." />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {portfolio.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedPortfolioItem(item)}
                          className="group cursor-pointer overflow-hidden rounded-lg border border-border transition-all hover:border-primary/30 hover:shadow-md"
                        >
                          {item.image ? (
                            <div className="h-40 w-full overflow-hidden bg-muted">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            </div>
                          ) : (
                            <div className="flex h-40 w-full items-center justify-center bg-muted">
                              <ImageIcon
                                className="h-12 w-12 text-muted-foreground/30"
                                strokeWidth={1.5}
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <p className="text-[14px] font-bold">{item.title}</p>
                            <p className="mt-1 text-[13px] text-muted-foreground">
                              {item.status || "En cours"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PRESTATIONS */}
            <div id="section-prestations" className="scroll-mt-24" />
            {activeTab === "prestations" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-[16px] font-bold">Prestations</h2>
                <p className="text-[13px] text-muted-foreground">Services proposés par l'agence.</p>
                <div className="mt-5">
                  {isLoading ? (
                    <StackSkeleton count={2} />
                  ) : services.length === 0 ? (
                    <EmptyState message="Aucune prestation renseignée." />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {services.map((service, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-border p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Briefcase className="h-[15px] w-[15px]" strokeWidth={1.7} />
                            </span>
                            <p className="text-[14px] font-bold">{service.serviceName}</p>
                          </div>
                          {service.priceRange && (
                            <p className="mt-2 text-[13px] font-semibold text-primary">
                              {service.priceRange}
                            </p>
                          )}
                          {service.description && (
                            <p className="mt-2 text-[13px] leading-[1.5] text-muted-foreground">
                              {service.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CERTIFICATS */}
            <div id="section-certificats" className="scroll-mt-24" />
            {activeTab === "certificats" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-[16px] font-bold">Certificats</h2>
                <p className="text-[13px] text-muted-foreground">
                  Certifications mises en avant par l'agence.
                </p>
                <div className="mt-5">
                  {isLoading ? (
                    <StackSkeleton count={2} />
                  ) : certifications.length === 0 ? (
                    <EmptyState message="Aucun certificat renseigné." />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {certifications.map((cert, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 rounded-lg border border-border p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Award className="h-5 w-5" strokeWidth={1.7} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold">{cert.title}</p>
                            {cert.issuingOrganization && (
                              <p className="text-[13px] text-muted-foreground">
                                {cert.issuingOrganization}
                                {cert.level && ` — ${cert.level}`}
                              </p>
                            )}
                            {cert.description && (
                              <p className="mt-2 text-[13px] leading-[1.5] text-muted-foreground">
                                {cert.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ÉQUIPE */}
            <div id="section-equipe" className="scroll-mt-24" />
            {activeTab === "equipe" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-[16px] font-bold">Équipe</h2>
                <p className="text-[13px] text-muted-foreground">
                  Membres de l'agence mis en avant publiquement.
                </p>
                <div className="mt-5">
                  {isLoading ? (
                    <StackSkeleton count={2} />
                  ) : team.length === 0 ? (
                    <EmptyState message="Aucun membre d'équipe renseigné." />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {team.map((member, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 rounded-lg border border-border p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                        >
                          <div
                            style={{ backgroundImage: seedGradient(member.member || "?") }}
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white shadow-sm"
                          >
                            {initialsOf(member.member || "?")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold">{member.member || "Membre"}</p>
                            {member.role && (
                              <p className="text-[13px] text-muted-foreground">{member.role}</p>
                            )}
                            {member.description && (
                              <p className="mt-1 text-[12px] text-muted-foreground/70 line-clamp-2">
                                {member.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AVIS */}
            <div id="section-avis" className="scroll-mt-24" />
            {activeTab === "avis" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h2 className="text-[16px] font-bold">Avis clients</h2>
                    <p className="text-[13px] text-muted-foreground">
                      Retours des clients ayant collaboré avec l'agence.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(agency?.rating || 0)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                          strokeWidth={star <= Math.round(agency?.rating || 0) ? 0 : 1.5}
                        />
                      ))}
                    </div>
                    <span className="text-[13px] font-semibold">
                      {agency?.rating || "—"} ({reviews.length})
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  {isReviewsLoading ? (
                    <StackSkeleton count={3} />
                  ) : reviews.length === 0 ? (
                    <EmptyState message="Aucun avis à afficher." />
                  ) : (
                    <>
                      {/* RÉPARTITION DES NOTES */}
                      <div className="mb-6 flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-center">
                        <div className="flex shrink-0 flex-col items-center gap-1">
                          <p className="text-[36px] font-bold leading-none">
                            {agency?.rating ?? "—"}
                          </p>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3.5 w-3.5 ${
                                  agency?.rating && star <= Math.round(agency.rating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground/30"
                                }`}
                                strokeWidth={
                                  agency?.rating && star <= Math.round(agency.rating) ? 0 : 1.5
                                }
                              />
                            ))}
                          </div>
                          <p className="text-[12px] text-muted-foreground">{reviews.length} avis</p>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {ratingBreakdown.map((row) => (
                            <div key={row.stars} className="flex items-center gap-2">
                              <span className="w-8 shrink-0 text-[12px] text-muted-foreground">
                                {row.stars} ★
                              </span>
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-amber-400"
                                  style={{ width: `${row.percent}%` }}
                                />
                              </div>
                              <span className="w-6 shrink-0 text-right text-[12px] text-muted-foreground">
                                {row.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* LISTE DES AVIS */}
                      <ul className="divide-y divide-border">
                        {reviews.map((review) => (
                          <li key={review.id} className="py-4 first:pt-0 last:pb-0">
                            <div className="flex items-start gap-3">
                              <div
                                style={{ backgroundImage: seedGradient(review.authorName) }}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white shadow-sm"
                              >
                                {initialsOf(review.authorName)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-[14px] font-bold">{review.authorName}</p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-0.5">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-3.5 w-3.5 ${
                                            star <= review.rating
                                              ? "fill-amber-400 text-amber-400"
                                              : "text-muted-foreground/30"
                                          }`}
                                          strokeWidth={star <= review.rating ? 0 : 1.5}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-[12px] text-muted-foreground">
                                      {review.publishedAt}
                                    </span>
                                  </div>
                                </div>
                                <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
                                  {review.comment}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* CONTACT */}
            <div id="section-contact" className="scroll-mt-24" />
            {activeTab === "contact" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-[16px] font-bold">Contact</h2>
                <p className="text-[13px] text-muted-foreground">
                  {agency ? `Coordonnées de ${agency.name}` : "Coordonnées de l'agence."}
                </p>
                <div className="mt-5">
                  {isLoading ? (
                    <StackSkeleton count={2} />
                  ) : agency === null ? (
                    <EmptyState message="Aucune donnée disponible" />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="overflow-hidden rounded-lg border border-border">
                        <iframe
                          title={"Carte de " + agency.location}
                          src={
                            "https://www.google.com/maps?q=" +
                            encodeURIComponent(agency.location) +
                            "&output=embed"
                          }
                          className="aspect-[4/3] w-full sm:aspect-auto sm:h-[240px]"
                          style={{ border: 0 }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                        <a
                          href={
                            "https://www.google.com/maps/search/?api=1&query=" +
                            encodeURIComponent(agency.location)
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 border-t border-border py-2 text-[12.5px] font-semibold text-primary hover:bg-accent"
                        >
                          <MapPin className="h-3.5 w-3.5" strokeWidth={1.7} />
                          Ouvrir dans Google Maps
                        </a>
                      </div>

                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={openContactModal}
                          className="w-full rounded-lg bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
                        >
                          Contacter {agency.name}
                        </button>
                        {agency.website && (
                          <a
                            href={agency.website}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-[13px] transition-colors hover:bg-accent/30"
                          >
                            <Globe className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                            <span className="min-w-0 truncate">{agency.website}</span>
                          </a>
                        )}
                        <div className="rounded-lg border border-border p-2.5 text-[13px]">
                          <p className="font-semibold">Siège social</p>
                          <p className="mt-1 text-muted-foreground">{agency.address}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AGENCES SIMILAIRES */}
            {similarAgencies.length > 0 && (
              <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-bold">Agences similaires</h2>
                  <Link
                    to="/agences"
                    className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
                  >
                    Découvrir plus d'agences
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </Link>
                </div>

                <div className="relative mt-5">
                  <button
                    type="button"
                    onClick={() =>
                      similarScrollRef.current?.scrollBy({ left: -280, behavior: "smooth" })
                    }
                    aria-label="Défiler vers la gauche"
                    className="absolute left-0 top-1/2 z-10 hidden h-8 w-8 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-accent sm:flex"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
                  </button>

                  <div
                    ref={similarScrollRef}
                    className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {similarAgencies.slice(0, 6).map((other) => (
                      <Link
                        key={other.id}
                        to="/agences/$id"
                        params={{ id: other.id }}
                        className="group flex w-[230px] shrink-0 flex-col gap-2 rounded-lg border border-border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            style={{ backgroundImage: seedGradient(other.name) }}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-[13px] font-bold text-white"
                          >
                            {initialsOf(other.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-bold group-hover:text-primary transition-colors">
                              {other.name}
                            </p>
                            <p className="flex items-center gap-1 text-[12px] text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.7} />
                              {other.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[12.5px] font-semibold">
                          <Star
                            className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                            strokeWidth={0}
                          />
                          {other.rating}
                          <span className="font-normal text-muted-foreground">
                            ({other.reviewsCount} avis)
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      similarScrollRef.current?.scrollBy({ left: 280, behavior: "smooth" })
                    }
                    aria-label="Défiler vers la droite"
                    className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 translate-x-3 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-accent sm:flex"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL PORTFOLIO */}
      {selectedPortfolioItem && (
        <div
          onClick={() => setSelectedPortfolioItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[720px] overflow-hidden rounded-xl bg-background shadow-2xl"
          >
            <div className="relative flex aspect-[16/10] items-center justify-center bg-muted">
              {selectedPortfolioItem.image ? (
                <img
                  src={selectedPortfolioItem.image}
                  alt={selectedPortfolioItem.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground" strokeWidth={1.4} />
              )}
              <button
                type="button"
                onClick={() => setSelectedPortfolioItem(null)}
                aria-label="Fermer"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-accent"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="p-6">
              <h2 className="text-[20px] font-bold">{selectedPortfolioItem.title}</h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                {selectedPortfolioItem.status}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTACT MODERNISÉE */}
      <ActionModal
        open={isContactOpen}
        onOpenChange={setIsContactOpen}
        title="Contacter l'agence"
        description={
          contactForm.needType === "Projet"
            ? "Renseignez votre besoin, le cahier des charges (CDC) est généré automatiquement et envoyé uniquement à cette agence."
            : "Votre demande sera envoyée uniquement à cette agence."
        }
        confirmLabel={isSubmittingContact ? "Envoi..." : "Envoyer"}
        onConfirm={handleSubmitContact}
      >
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div>
            <label className="text-[13px] font-semibold" htmlFor="contact-need-type">
              Type de besoin
            </label>
            <select
              id="contact-need-type"
              value={contactForm.needType}
              onChange={(event) =>
                setContactForm((prev) => ({
                  ...prev,
                  needType: event.target.value as "Projet" | "Stage" | "Job",
                }))
              }
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all"
            >
              <option value="Projet">Projet</option>
              <option value="Stage">Stage</option>
              <option value="Job">Job</option>
            </select>
          </div>

          {contactForm.needType === "Projet" && (
            <div>
              <label className="text-[13px] font-semibold" htmlFor="contact-title">
                Titre du projet
              </label>
              <input
                id="contact-title"
                type="text"
                value={contactForm.title}
                onChange={(event) =>
                  setContactForm((prev) => ({ ...prev, title: event.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-sm transition-all"
                placeholder="Ex. Refonte de notre site vitrine"
              />
            </div>
          )}

          <div>
            <label className="text-[13px] font-semibold" htmlFor="contact-description">
              Décrivez votre besoin
            </label>
            <textarea
              id="contact-description"
              value={contactForm.description}
              onChange={(event) =>
                setContactForm((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={4}
              className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-sm transition-all"
              placeholder="Contexte, objectifs, contraintes..."
            />
          </div>

          {contactForm.needType === "Projet" && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[13px] font-semibold" htmlFor="contact-category">
                    Catégorie
                  </label>
                  <select
                    id="contact-category"
                    value={contactForm.category}
                    onChange={(event) =>
                      setContactForm((prev) => ({
                        ...prev,
                        category: event.target.value,
                        subCategory: "",
                      }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all"
                  >
                    <option value="">Sélectionner...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-semibold" htmlFor="contact-sub-category">
                    Sous-catégorie
                  </label>
                  <select
                    id="contact-sub-category"
                    value={contactForm.subCategory}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, subCategory: event.target.value }))
                    }
                    disabled={selectedCategorySubOptions.length === 0}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Sélectionner...</option>
                    {selectedCategorySubOptions.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[13px] font-semibold" htmlFor="contact-budget-min">
                    Budget min (€)
                  </label>
                  <input
                    id="contact-budget-min"
                    type="number"
                    min="0"
                    value={contactForm.budgetMin}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, budgetMin: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-sm transition-all"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold" htmlFor="contact-budget-max">
                    Budget max (€)
                  </label>
                  <input
                    id="contact-budget-max"
                    type="number"
                    min="0"
                    value={contactForm.budgetMax}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, budgetMax: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-sm transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[13px] font-semibold" htmlFor="contact-location">
                    Localisation
                  </label>
                  <input
                    id="contact-location"
                    type="text"
                    value={contactForm.location}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, location: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-sm transition-all"
                    placeholder="Ex. Casablanca, à distance..."
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold" htmlFor="contact-delay">
                    Délai souhaité (jours)
                  </label>
                  <input
                    id="contact-delay"
                    type="number"
                    min="0"
                    value={contactForm.deliveryDelayDays}
                    onChange={(event) =>
                      setContactForm((prev) => ({
                        ...prev,
                        deliveryDelayDays: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-sm transition-all"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </ActionModal>
    </div>
  );
}
