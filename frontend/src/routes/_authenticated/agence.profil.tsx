import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Image,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
  User,
  CheckCircle,
  AlertCircle,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Award,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Shield,
  TrendingUp,
  Clock,
  Heart,
  Share2,
  MoreVertical,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  FormSkeleton,
  SectionCard,
  StatusBadge,
  TextAreaField,
  TextField,
} from "@/components/common/Blocks";
import { StackSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import type {
  AgencyCertificationItem,
  AgencyPortfolioItem,
  AgencyServiceItem,
  AgencyTeamItem,
} from "@/lib/types";
import { listAgencyMembers, listAgencyReviews } from "@/services/agencies.service";
import { getAgencyProfile, updateAgencyProfile, uploadFile } from "@/services/profile.service";
import { ApiError } from "@/services/http";

const EMPTY_SERVICE: AgencyServiceItem = {
  serviceName: "",
  description: "",
  priceRange: "",
  techStack: "",
  skills: "",
  projectsInProgress: 0,
};

const EMPTY_PORTFOLIO_ITEM: AgencyPortfolioItem = {
  title: "",
  status: "In Progress",
  image: "",
  videoUrl: "",
  resultUrl: "",
  budget: null,
  collaborationPeriod: "",
  agencyFeedback: "",
  problemSolution: "",
  clientConfirmed: false,
};

const EMPTY_TEAM_ITEM: AgencyTeamItem = {
  member: "",
  memberName: "",
  photo: "",
  role: "",
  description: "",
  history: "",
  linkedinUrl: "",
};

const EMPTY_CERTIFICATION: AgencyCertificationItem = {
  photo: "",
  title: "",
  description: "",
  issuingOrganization: "",
  level: "Foundation",
};

function servicesToPayload(items: AgencyServiceItem[]) {
  return items
    .filter((item) => item.serviceName.trim().length > 0)
    .map((item) => ({
      service_name: item.serviceName,
      description: item.description,
      price_range: item.priceRange,
      tech_stack: item.techStack,
      skills: item.skills,
      projects_in_progress: item.projectsInProgress,
    }));
}

function portfolioToPayload(items: AgencyPortfolioItem[]) {
  return items
    .filter((item) => item.title.trim().length > 0)
    .map((item) => ({
      title: item.title,
      status: item.status,
      image: item.image,
      video_url: item.videoUrl,
      result_url: item.resultUrl,
      budget: item.budget,
      collaboration_period: item.collaborationPeriod,
      agency_feedback: item.agencyFeedback,
      problem_solution: item.problemSolution,
      client_confirmed: item.clientConfirmed ? 1 : 0,
    }));
}

function teamToPayload(items: AgencyTeamItem[]) {
  return items
    .filter((item) => item.memberName.trim().length > 0)
    .map((item) => ({
      member: item.member,
      member_name: item.memberName,
      photo: item.photo,
      role: item.role,
      description: item.description,
      history: item.history,
      linkedin_url: item.linkedinUrl,
    }));
}

function certificationsToPayload(items: AgencyCertificationItem[]) {
  return items
    .filter((item) => item.title.trim().length > 0)
    .map((item) => ({
      photo: item.photo,
      title: item.title,
      description: item.description,
      issuing_organization: item.issuingOrganization,
      level: item.level,
    }));
}

function getRandomGradient(): string {
  const gradients = [
    "from-violet-500/20 to-purple-500/10",
    "from-blue-500/20 to-cyan-500/10",
    "from-emerald-500/20 to-teal-500/10",
    "from-rose-500/20 to-pink-500/10",
    "from-amber-500/20 to-orange-500/10",
    "from-indigo-500/20 to-blue-500/10",
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}

/**
 * AJOUTÉ (demande explicite) : une fois ajoutée, une ligne (service,
 * réalisation, membre, certificat) s'affiche en carte résumée non modifiable
 * — un clic sur « Modifier » ouvre le formulaire d'édition, plutôt que tous
 * les champs affichés directement en édition libre en permanence.
 */
function CollapsedItemCard({
  title,
  subtitle,
  avatarUrl,
  avatarFallback,
  onEdit,
  onRemove,
  badge,
}: {
  title: string;
  subtitle?: string | undefined;
  avatarUrl?: string | undefined;
  avatarFallback: ReactNode;
  onEdit: () => void;
  onRemove: () => void;
  badge?: string | undefined;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const gradientClass = getRandomGradient();

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border bg-background/50 p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient animation */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${gradientClass} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      />

      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-xl border-2 border-border object-cover transition-all duration-300 group-hover:scale-110 group-hover:border-primary/30 group-hover:shadow-md"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                {avatarFallback}
              </div>
            )}
            {badge && (
              <div className="absolute -top-1 -right-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-bold text-primary">
                {badge}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold group-hover:text-primary transition-colors duration-300">
              {title || "Sans titre"}
            </p>
            {subtitle ? (
              <p className="truncate text-[12.5px] text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/30" />
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 transition-all duration-300">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-1.5 text-[12.5px] font-semibold transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm hover:scale-105"
          >
            <Pencil
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12"
              strokeWidth={1.8}
            />
            Modifier
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-1.5 text-[12.5px] font-semibold text-destructive transition-all duration-300 hover:border-red-200 hover:bg-red-50 hover:shadow-sm hover:scale-105"
          >
            <Trash2
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110"
              strokeWidth={1.8}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Profil agence — présentation, compétences, portfolio, coordonnées. */
export const Route = createFileRoute("/_authenticated/agence/profil")({
  head: () => ({
    meta: [
      { title: "Profil agence — Sortlist Pro" },
      {
        name: "description",
        content:
          "Gérez la présentation de votre agence, vos compétences, votre portfolio et vos coordonnées.",
      },
      { property: "og:title", content: "Profil agence — Sortlist Pro" },
      {
        property: "og:description",
        content: "Profil public de votre agence sur Sortlist Pro.",
      },
    ],
  }),
  component: AgencyProfilePage,
});

const profileSchema = z.object({
  name: z.string().trim().min(1, "Champ requis").max(120),
  description: z.string().trim().min(1, "Champ requis").max(2000),
  foundedYear: z.string().trim().min(4, "Année invalide").max(4),
  teamSize: z.string().trim().min(1, "Champ requis").max(40),
  website: z.string().trim().url("URL invalide").max(255),
  location: z.string().trim().min(1, "Champ requis").max(120),
  legalIdValue: z.string().trim().min(1, "Champ requis").max(80),
  phoneCountryCode: z.string().trim().min(1, "Champ requis").max(6),
  phone: z.string().trim().min(1, "Champ requis").max(30),
  email: z.string().trim().email("E-mail invalide").max(255),
  address: z.string().trim().min(1, "Champ requis").max(255),
});

type ProfileForm = z.infer<typeof profileSchema>;

function AgencyProfilePage() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["agency", "profile"],
    queryFn: getAgencyProfile,
  });
  const profile = profileQuery.data ?? null;
  const isLoading = profileQuery.isLoading;

  const isPortfolioLoading = isLoading;

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      description: "",
      foundedYear: "",
      teamSize: "",
      website: "",
      location: "",
      legalIdValue: "",
      phoneCountryCode: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      name: profile.name,
      description: profile.description,
      foundedYear: profile.foundedYear,
      teamSize: profile.teamSize,
      website: profile.website,
      location: profile.location,
      legalIdValue: profile.legalIdValue,
      phoneCountryCode: profile.phoneCountryCode,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: updateAgencyProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "profile"], updated);
      toast.success("✨ Profil mis à jour avec succès");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Mise à jour impossible.");
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    updateMutation.mutate(values);
  });

  // Sections listes (Services, Portfolio, Staff, Certificats) : chaque
  // sauvegarde remplace la table entière côté backend (agency.update_profile
  // vide puis réinsère les lignes fournies), l'état local doit donc toujours
  // contenir la liste complète à jour.
  const [services, setServices] = useState<AgencyServiceItem[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<AgencyPortfolioItem[]>([]);
  const [team, setTeam] = useState<AgencyTeamItem[]>([]);
  const [certifications, setCertifications] = useState<AgencyCertificationItem[]>([]);

  // AJOUTÉ (demande explicite) : une ligne déjà enregistrée s'affiche en
  // carte résumée non modifiable tant qu'on n'a pas cliqué sur « Modifier »
  // — un tableau parallèle (même index) suit l'état ouvert/fermé de chaque
  // ligne pour chacune des 4 listes.
  const [servicesEditing, setServicesEditing] = useState<boolean[]>([]);
  const [portfolioEditing, setPortfolioEditing] = useState<boolean[]>([]);
  const [teamEditing, setTeamEditing] = useState<boolean[]>([]);
  const [certificationsEditing, setCertificationsEditing] = useState<boolean[]>([]);

  useEffect(() => {
    if (!profile) return;
    setServices(profile.services ?? []);
    setPortfolioItems(profile.portfolio ?? []);
    setTeam(profile.team ?? []);
    setCertifications(profile.certifications ?? []);
    // Lignes déjà enregistrées : affichées fermées (carte résumée) par défaut.
    setServicesEditing((profile.services ?? []).map(() => false));
    setPortfolioEditing((profile.portfolio ?? []).map(() => false));
    setTeamEditing((profile.team ?? []).map(() => false));
    setCertificationsEditing((profile.certifications ?? []).map(() => false));
  }, [profile]);

  const [uploadingPortfolioIndex, setUploadingPortfolioIndex] = useState<number | null>(null);
  const [uploadingTeamIndex, setUploadingTeamIndex] = useState<number | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  async function handleUploadLogo(file: File) {
    setIsUploadingLogo(true);
    try {
      const url = await uploadFile(file);
      updateMutation.mutate({ logo: url });
      toast.success("🖼️ Logo téléchargé avec succès");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Téléversement du logo impossible.");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleUploadCoverImage(file: File) {
    setIsUploadingCover(true);
    try {
      const url = await uploadFile(file);
      updateMutation.mutate({ coverImage: url });
      toast.success("🖼️ Photo de couverture téléchargée avec succès");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Téléversement de la couverture impossible.",
      );
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function handleUploadPortfolioImage(index: number, file: File) {
    setUploadingPortfolioIndex(index);
    try {
      const url = await uploadFile(file);
      setPortfolioItems((current) =>
        current.map((row, i) => (i === index ? { ...row, image: url } : row)),
      );
      toast.success("🖼️ Image du projet téléchargée avec succès");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Téléversement de l'image impossible.");
    } finally {
      setUploadingPortfolioIndex(null);
    }
  }

  async function handleUploadTeamPhoto(index: number, file: File) {
    setUploadingTeamIndex(index);
    try {
      const url = await uploadFile(file);
      setTeam((current) => current.map((row, i) => (i === index ? { ...row, photo: url } : row)));
      toast.success("🖼️ Photo du membre téléchargée avec succès");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Téléversement de la photo impossible.");
    } finally {
      setUploadingTeamIndex(null);
    }
  }

  const membersQuery = useQuery({
    queryKey: ["agency", "members"],
    queryFn: listAgencyMembers,
  });

  const reviewsQuery = useQuery({
    queryKey: ["agency", "profile", "reviews", profile?.id],
    queryFn: () => listAgencyReviews(profile!.id),
    enabled: Boolean(profile?.id),
  });

  const servicesMutation = useMutation({
    mutationFn: () => updateAgencyProfile({ services: servicesToPayload(services) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "profile"], updated);
      toast.success("✅ Services mis à jour avec succès");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Mise à jour impossible.");
    },
  });

  const portfolioMutation = useMutation({
    mutationFn: () => updateAgencyProfile({ portfolio: portfolioToPayload(portfolioItems) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "profile"], updated);
      toast.success("✅ Portfolio mis à jour avec succès");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Mise à jour impossible.");
    },
  });

  const teamMutation = useMutation({
    mutationFn: () => updateAgencyProfile({ team: teamToPayload(team) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "profile"], updated);
      toast.success("✅ Équipe mise à jour avec succès");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Mise à jour impossible.");
    },
  });

  const certificationsMutation = useMutation({
    mutationFn: () =>
      updateAgencyProfile({ certifications: certificationsToPayload(certifications) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "profile"], updated);
      toast.success("✅ Certificats mis à jour avec succès");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Mise à jour impossible.");
    },
  });

  return (
    <DashboardShell role="agency">
      <div className="mx-auto max-w-[1080px] space-y-8">
        {/* En-tête amélioré avec animation */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8 animate-in slide-in-from-top duration-500">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-pulse" />
          <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-primary/5 blur-3xl animate-pulse delay-1000" />

          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30 animate-in zoom-in duration-500">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-[26px] font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Profil agence
                </h1>
                <p className="mt-0.5 text-[14px] text-muted-foreground flex items-center gap-1.5">
                  Gérez la présentation publique de votre agence
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center animate-in fade-in slide-in-from-right duration-500">
              {profile?.legalIdValid && (
                <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-3.5 py-1.5 shadow-sm shadow-green-200/50">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-[13px] font-medium text-green-700">
                    Identifiant légal vérifié
                  </span>
                </div>
              )}
              <button className="rounded-lg border border-border p-2 text-muted-foreground transition-all hover:bg-accent hover:text-foreground">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <SectionCard
          title="Présentation"
          description="Nom, description, année de création et taille de l'équipe."
        >
          {isLoading ? (
            <FormSkeleton fields={6} />
          ) : (
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              <div className="space-y-4">
                <div className="relative h-44 w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5">
                  {profile?.coverImage ? (
                    <img
                      src={profile.coverImage}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/30">
                      <Image className="h-16 w-16" strokeWidth={0.8} />
                      <span className="mt-2 text-sm">Aucune photo de couverture</span>
                    </div>
                  )}
                  <label className="absolute bottom-3 right-3 flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background/90 px-3.5 py-2 text-[12.5px] font-semibold shadow-sm transition-all hover:bg-accent hover:shadow-md hover:scale-105">
                    <Upload className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {isUploadingCover ? "Envoi..." : "Photo de couverture"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingCover}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleUploadCoverImage(file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <div className="relative -mt-12 flex items-end gap-4 pl-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-gradient-to-br from-primary/10 to-primary/5 text-muted-foreground shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl">
                    {profile?.logo ? (
                      <img src={profile.logo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-8 w-8" strokeWidth={1.6} />
                    )}
                  </div>
                  <label className="mb-1 flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background/90 px-3.5 py-2 text-[12.5px] font-semibold shadow-sm transition-all hover:bg-accent hover:shadow-md hover:scale-105">
                    <Upload className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {isUploadingLogo ? "Envoi..." : "Logo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingLogo}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleUploadLogo(file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Nom de l'agence"
                  error={form.formState.errors.name?.message}
                  {...form.register("name")}
                />
                <TextField
                  label="Année de création"
                  error={form.formState.errors.foundedYear?.message}
                  {...form.register("foundedYear")}
                />
                <TextField
                  label="Taille de l'équipe"
                  error={form.formState.errors.teamSize?.message}
                  {...form.register("teamSize")}
                />
                <TextField
                  label="Site web"
                  error={form.formState.errors.website?.message}
                  {...form.register("website")}
                />
                <TextField
                  label="Localisation"
                  error={form.formState.errors.location?.message}
                  {...form.register("location")}
                />
                <TextField
                  label="Identifiant légal"
                  error={form.formState.errors.legalIdValue?.message}
                  {...form.register("legalIdValue")}
                />
              </div>

              <TextAreaField
                label="Description de l'agence"
                rows={5}
                error={form.formState.errors.description?.message}
                {...form.register("description")}
              />

              <div className="border-t border-border pt-4">
                <h3 className="mb-4 flex items-center gap-2 text-[13.5px] font-bold tracking-wide">
                  <Layers className="h-4 w-4 text-primary" />
                  COORDONNÉES
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label="Indicatif pays"
                    error={form.formState.errors.phoneCountryCode?.message}
                    {...form.register("phoneCountryCode")}
                  />
                  <TextField
                    label="Téléphone"
                    error={form.formState.errors.phone?.message}
                    {...form.register("phone")}
                  />
                  <TextField
                    label="E-mail"
                    error={form.formState.errors.email?.message}
                    {...form.register("email")}
                  />
                  <TextField
                    label="Adresse"
                    error={form.formState.errors.address?.message}
                    {...form.register("address")}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-3 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {updateMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      Enregistrer les modifications
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </SectionCard>

        {/* CDC §2.2.2 — Prestation (Services). */}
        <SectionCard
          title="Prestation (Services)"
          description="Services proposés, utilisés pour le matching avec les projets clients."
          action={
            <button
              type="button"
              onClick={() => {
                setServices((current) => [...current, { ...EMPTY_SERVICE }]);
                setServicesEditing((current) => [...current, true]);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm hover:scale-105"
            >
              <Plus className="h-4 w-4" strokeWidth={1.8} />
              Ajouter un service
            </button>
          }
        >
          {isLoading ? (
            <StackSkeleton count={2} />
          ) : (
            <div className="space-y-5">
              {services.length === 0 ? <EmptyState message="Aucun service renseigné." /> : null}
              {services.map((service, index) =>
                !servicesEditing[index] ? (
                  <CollapsedItemCard
                    key={index}
                    title={service.serviceName}
                    subtitle={service.priceRange || undefined}
                    avatarFallback={
                      service.serviceName ? service.serviceName[0]?.toUpperCase() : "?"
                    }
                    badge={
                      service.projectsInProgress > 0
                        ? `${service.projectsInProgress} projets`
                        : undefined
                    }
                    onEdit={() =>
                      setServicesEditing((current) =>
                        current.map((v, i) => (i === index ? true : v)),
                      )
                    }
                    onRemove={() => {
                      setServices((current) => current.filter((_, i) => i !== index));
                      setServicesEditing((current) => current.filter((_, i) => i !== index));
                    }}
                  />
                ) : (
                  <div
                    key={index}
                    className="rounded-xl border border-border bg-background/50 p-5 space-y-4 animate-in fade-in slide-in-from-left duration-300"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TextField
                        label="Nom du service"
                        value={service.serviceName}
                        onChange={(event) =>
                          setServices((current) =>
                            current.map((row, i) =>
                              i === index ? { ...row, serviceName: event.target.value } : row,
                            ),
                          )
                        }
                      />
                      <TextField
                        label="Fourchette de prix"
                        value={service.priceRange}
                        onChange={(event) =>
                          setServices((current) =>
                            current.map((row, i) =>
                              i === index ? { ...row, priceRange: event.target.value } : row,
                            ),
                          )
                        }
                      />
                      <TextField
                        label="Stack technique"
                        value={service.techStack}
                        onChange={(event) =>
                          setServices((current) =>
                            current.map((row, i) =>
                              i === index ? { ...row, techStack: event.target.value } : row,
                            ),
                          )
                        }
                      />
                      <TextField
                        label="Compétences"
                        value={service.skills}
                        onChange={(event) =>
                          setServices((current) =>
                            current.map((row, i) =>
                              i === index ? { ...row, skills: event.target.value } : row,
                            ),
                          )
                        }
                      />
                    </div>
                    <TextAreaField
                      label="Description"
                      rows={3}
                      value={service.description}
                      onChange={(event) =>
                        setServices((current) =>
                          current.map((row, i) =>
                            i === index ? { ...row, description: event.target.value } : row,
                          ),
                        )
                      }
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setServicesEditing((current) =>
                            current.map((v, i) => (i === index ? false : v)),
                          )
                        }
                        className="rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:scale-105"
                      >
                        <CheckCircle className="inline h-4 w-4 mr-1.5" />
                        Terminé
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setServices((current) => current.filter((_, i) => i !== index));
                          setServicesEditing((current) => current.filter((_, i) => i !== index));
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-[13px] font-semibold text-destructive transition-all hover:border-red-200 hover:bg-red-50 hover:shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                        Retirer
                      </button>
                    </div>
                  </div>
                ),
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => servicesMutation.mutate()}
                  disabled={servicesMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-3 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {servicesMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer les services"
                  )}
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* CDC §2.2.3 — Réalisation (Portfolio). */}
        <SectionCard
          title="Portfolio"
          description="Réalisations présentées aux clients."
          action={
            <button
              type="button"
              onClick={() => {
                setPortfolioItems((current) => [...current, { ...EMPTY_PORTFOLIO_ITEM }]);
                setPortfolioEditing((current) => [...current, true]);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm hover:scale-105"
            >
              <Plus className="h-4 w-4" strokeWidth={1.8} />
              Ajouter un projet
            </button>
          }
        >
          {isPortfolioLoading ? (
            <StackSkeleton count={3} />
          ) : (
            <div className="space-y-5">
              {portfolioItems.length === 0 ? (
                <EmptyState message="Aucune réalisation renseignée. Ajoutez un projet réalisé pour un client — y compris un projet externe à la plateforme." />
              ) : null}
              {portfolioItems.map((item, index) =>
                !portfolioEditing[index] ? (
                  <CollapsedItemCard
                    key={index}
                    title={item.title}
                    subtitle={item.collaborationPeriod || undefined}
                    avatarUrl={item.image || undefined}
                    avatarFallback={<Image className="h-4 w-4" strokeWidth={1.7} />}
                    onEdit={() =>
                      setPortfolioEditing((current) =>
                        current.map((v, i) => (i === index ? true : v)),
                      )
                    }
                    onRemove={() => {
                      setPortfolioItems((current) => current.filter((_, i) => i !== index));
                      setPortfolioEditing((current) => current.filter((_, i) => i !== index));
                    }}
                  />
                ) : (
                  <div
                    key={index}
                    className="rounded-xl border border-border bg-background/50 p-5 space-y-4 animate-in fade-in slide-in-from-left duration-300"
                  >
                    <div className="flex items-center gap-4">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="h-20 w-20 shrink-0 rounded-xl border border-border object-cover transition-transform duration-300 hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground">
                          <Image className="h-6 w-6" strokeWidth={1.6} />
                        </div>
                      )}
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm">
                        <Upload className="h-4 w-4" strokeWidth={1.8} />
                        {uploadingPortfolioIndex === index ? "Envoi..." : "Image du projet"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingPortfolioIndex === index}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void handleUploadPortfolioImage(index, file);
                            event.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TextField
                        label="Titre"
                        value={item.title}
                        onChange={(event) =>
                          setPortfolioItems((current) =>
                            current.map((row, i) =>
                              i === index ? { ...row, title: event.target.value } : row,
                            ),
                          )
                        }
                      />
                      <TextField
                        label="Période de collaboration"
                        value={item.collaborationPeriod}
                        onChange={(event) =>
                          setPortfolioItems((current) =>
                            current.map((row, i) =>
                              i === index
                                ? { ...row, collaborationPeriod: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                      <TextField
                        label="Budget (€)"
                        type="number"
                        value={item.budget ?? ""}
                        onChange={(event) =>
                          setPortfolioItems((current) =>
                            current.map((row, i) =>
                              i === index
                                ? {
                                    ...row,
                                    budget: event.target.value ? Number(event.target.value) : null,
                                  }
                                : row,
                            ),
                          )
                        }
                      />
                      <TextField
                        label="Lien vers le résultat"
                        placeholder="https://..."
                        value={item.resultUrl}
                        onChange={(event) =>
                          setPortfolioItems((current) =>
                            current.map((row, i) =>
                              i === index ? { ...row, resultUrl: event.target.value } : row,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setPortfolioEditing((current) =>
                            current.map((v, i) => (i === index ? false : v)),
                          )
                        }
                        className="rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:scale-105"
                      >
                        <CheckCircle className="inline h-4 w-4 mr-1.5" />
                        Terminé
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPortfolioItems((current) => current.filter((_, i) => i !== index));
                          setPortfolioEditing((current) => current.filter((_, i) => i !== index));
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-[13px] font-semibold text-destructive transition-all hover:border-red-200 hover:bg-red-50 hover:shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                        Retirer
                      </button>
                    </div>
                  </div>
                ),
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => portfolioMutation.mutate()}
                  disabled={portfolioMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-3 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {portfolioMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer le portfolio"
                  )}
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* CDC §2.2.4 — Staff (Équipe). */}
        <SectionCard
          title="Staff (Équipe)"
          description="Membres de l'agence affichés sur le profil public."
          action={
            <button
              type="button"
              onClick={() => {
                setTeam((current) => [...current, { ...EMPTY_TEAM_ITEM }]);
                setTeamEditing((current) => [...current, true]);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm hover:scale-105"
            >
              <Plus className="h-4 w-4" strokeWidth={1.8} />
              Ajouter un membre
            </button>
          }
        >
          <div className="space-y-5">
            {team.length === 0 ? <EmptyState message="Aucun membre renseigné." /> : null}
            {team.map((member, index) =>
              !teamEditing[index] ? (
                <CollapsedItemCard
                  key={index}
                  title={member.memberName || "Membre"}
                  subtitle={member.role || undefined}
                  avatarUrl={member.photo || undefined}
                  avatarFallback={<User className="h-4 w-4" strokeWidth={1.7} />}
                  onEdit={() =>
                    setTeamEditing((current) => current.map((v, i) => (i === index ? true : v)))
                  }
                  onRemove={() => {
                    setTeam((current) => current.filter((_, i) => i !== index));
                    setTeamEditing((current) => current.filter((_, i) => i !== index));
                  }}
                />
              ) : (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-background/50 p-5 space-y-4 animate-in fade-in slide-in-from-left duration-300"
                >
                  <div className="flex items-center gap-4">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt=""
                        className="h-20 w-20 shrink-0 rounded-full border-2 border-border object-cover transition-transform duration-300 hover:scale-110 hover:shadow-xl"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground">
                        <User className="h-6 w-6" strokeWidth={1.6} />
                      </div>
                    )}
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm">
                      <Upload className="h-4 w-4" strokeWidth={1.8} />
                      {uploadingTeamIndex === index ? "Envoi..." : "Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingTeamIndex === index}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void handleUploadTeamPhoto(index, file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[13px] font-semibold">Collaborateur</label>
                      <select
                        value={member.member}
                        onChange={(event) =>
                          setTeam((current) =>
                            current.map((row, i) =>
                              i === index ? { ...row, member: event.target.value } : row,
                            ),
                          )
                        }
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-[13.5px] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Sélectionner un membre</option>
                        {(membersQuery.data ?? []).map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.user} ({option.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <TextField
                      label="Nom affiché"
                      value={member.memberName}
                      onChange={(event) =>
                        setTeam((current) =>
                          current.map((row, i) =>
                            i === index ? { ...row, memberName: event.target.value } : row,
                          ),
                        )
                      }
                    />
                    <TextField
                      label="Rôle affiché"
                      value={member.role}
                      onChange={(event) =>
                        setTeam((current) =>
                          current.map((row, i) =>
                            i === index ? { ...row, role: event.target.value } : row,
                          ),
                        )
                      }
                    />
                  </div>
                  <TextAreaField
                    label="Description"
                    rows={2}
                    value={member.description}
                    onChange={(event) =>
                      setTeam((current) =>
                        current.map((row, i) =>
                          i === index ? { ...row, description: event.target.value } : row,
                        ),
                      )
                    }
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setTeamEditing((current) =>
                          current.map((v, i) => (i === index ? false : v)),
                        )
                      }
                      className="rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:scale-105"
                    >
                      <CheckCircle className="inline h-4 w-4 mr-1.5" />
                      Terminé
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTeam((current) => current.filter((_, i) => i !== index));
                        setTeamEditing((current) => current.filter((_, i) => i !== index));
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-[13px] font-semibold text-destructive transition-all hover:border-red-200 hover:bg-red-50 hover:shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      Retirer
                    </button>
                  </div>
                </div>
              ),
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => teamMutation.mutate()}
                disabled={teamMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-3 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                {teamMutation.isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer l'équipe"
                )}
              </button>
            </div>
          </div>
        </SectionCard>

        {/* CDC §2.2.5 — Certificats. */}
        <SectionCard
          title="Certificats"
          description="Certifications mises en avant sur le profil public."
          action={
            <button
              type="button"
              onClick={() => {
                setCertifications((current) => [...current, { ...EMPTY_CERTIFICATION }]);
                setCertificationsEditing((current) => [...current, true]);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm hover:scale-105"
            >
              <Plus className="h-4 w-4" strokeWidth={1.8} />
              Ajouter un certificat
            </button>
          }
        >
          <div className="space-y-5">
            {certifications.length === 0 ? (
              <EmptyState message="Aucun certificat renseigné." />
            ) : null}
            {certifications.map((cert, index) =>
              !certificationsEditing[index] ? (
                <CollapsedItemCard
                  key={index}
                  title={cert.title}
                  subtitle={cert.issuingOrganization || undefined}
                  avatarUrl={cert.photo || undefined}
                  avatarFallback={cert.title ? cert.title[0]?.toUpperCase() : "?"}
                  onEdit={() =>
                    setCertificationsEditing((current) =>
                      current.map((v, i) => (i === index ? true : v)),
                    )
                  }
                  onRemove={() => {
                    setCertifications((current) => current.filter((_, i) => i !== index));
                    setCertificationsEditing((current) => current.filter((_, i) => i !== index));
                  }}
                />
              ) : (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-background/50 p-5 space-y-4 animate-in fade-in slide-in-from-left duration-300"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                      label="Titre"
                      value={cert.title}
                      onChange={(event) =>
                        setCertifications((current) =>
                          current.map((row, i) =>
                            i === index ? { ...row, title: event.target.value } : row,
                          ),
                        )
                      }
                    />
                    <TextField
                      label="Organisme émetteur"
                      value={cert.issuingOrganization}
                      onChange={(event) =>
                        setCertifications((current) =>
                          current.map((row, i) =>
                            i === index ? { ...row, issuingOrganization: event.target.value } : row,
                          ),
                        )
                      }
                    />
                  </div>
                  <TextAreaField
                    label="Description"
                    rows={2}
                    value={cert.description}
                    onChange={(event) =>
                      setCertifications((current) =>
                        current.map((row, i) =>
                          i === index ? { ...row, description: event.target.value } : row,
                        ),
                      )
                    }
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setCertificationsEditing((current) =>
                          current.map((v, i) => (i === index ? false : v)),
                        )
                      }
                      className="rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:scale-105"
                    >
                      <CheckCircle className="inline h-4 w-4 mr-1.5" />
                      Terminé
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCertifications((current) => current.filter((_, i) => i !== index));
                        setCertificationsEditing((current) =>
                          current.filter((_, i) => i !== index),
                        );
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-[13px] font-semibold text-destructive transition-all hover:border-red-200 hover:bg-red-50 hover:shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      Retirer
                    </button>
                  </div>
                </div>
              ),
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => certificationsMutation.mutate()}
                disabled={certificationsMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-3 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                {certificationsMutation.isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les certificats"
                )}
              </button>
            </div>
          </div>
        </SectionCard>

        {/* CDC §2.2.6 — Avis (lecture seule : déposés uniquement par un client
            ayant terminé un projet avec l'agence, cf. review.py). */}
        <SectionCard
          title="Avis"
          description="Avis déposés par vos clients sur des projets terminés."
        >
          {reviewsQuery.isPending ? (
            <StackSkeleton count={2} />
          ) : (reviewsQuery.data ?? []).length === 0 ? (
            <EmptyState message="Aucun avis pour le moment." />
          ) : (
            <ul className="space-y-4">
              {(reviewsQuery.data ?? []).map((review, idx) => (
                <li
                  key={review.id}
                  className="group rounded-xl border border-border bg-background/50 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom duration-500"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 transition-all duration-300 ${
                              i < review.rating
                                ? "text-yellow-400 fill-yellow-400 scale-100"
                                : "text-muted-foreground/20 scale-95"
                            }`}
                            strokeWidth={0}
                          />
                        ))}
                      </div>
                      <p className="text-[13.5px] font-bold group-hover:text-primary transition-colors">
                        {review.authorName}
                      </p>
                    </div>
                    <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {review.publishedAt}
                    </p>
                  </div>
                  {review.projectTitle ? (
                    <p className="mt-2 text-[12px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-primary" />
                      Projet : {review.projectTitle}
                    </p>
                  ) : null}
                  <p className="mt-2.5 text-[13px] text-muted-foreground leading-relaxed">
                    "{review.comment}"
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Aperçu public"
          description="Ce que voient les clients sur votre fiche agence."
        >
          {profile === null ? (
            <EmptyState message="Aucune donnée disponible" />
          ) : (
            <div className="group relative overflow-hidden rounded-xl border border-border bg-background/50 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                  <Building2 className="h-6 w-6 text-primary" strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold group-hover:text-primary transition-colors duration-300">
                    {profile.name}
                  </p>
                  <p className="text-[13px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.location}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-medium transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm hover:scale-105"
                      >
                        <Globe className="h-3 w-3" />
                        Site web
                      </a>
                    )}
                    {profile.email && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {profile.email}
                      </span>
                    )}
                    {profile.phone && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {profile.phone}
                      </span>
                    )}
                    {profile.foundedYear && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Créée en {profile.foundedYear}
                      </span>
                    )}
                    {profile.teamSize && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {profile.teamSize} membres
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-muted-foreground/20 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2">
                  <ExternalLink className="h-5 w-5" />
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
