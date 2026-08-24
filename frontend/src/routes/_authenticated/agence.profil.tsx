import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Image, Pencil, Plus, Star, Trash2, Upload, User } from "lucide-react";
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
    .filter((item) => item.member.trim().length > 0)
    .map((item) => ({
      member: item.member,
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
}: {
  title: string;
  subtitle?: string | undefined;
  avatarUrl?: string | undefined;
  avatarFallback: ReactNode;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
      <div className="flex min-w-0 items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-muted-foreground">
            {avatarFallback}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold">{title || "Sans titre"}</p>
          {subtitle ? (
            <p className="truncate text-[12.5px] text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-accent"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
          Modifier
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12.5px] font-semibold text-destructive transition-colors hover:bg-accent"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
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
      toast("Profil mis à jour");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Mise à jour impossible.");
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

  async function handleUploadPortfolioImage(index: number, file: File) {
    setUploadingPortfolioIndex(index);
    try {
      const url = await uploadFile(file);
      setPortfolioItems((current) =>
        current.map((row, i) => (i === index ? { ...row, image: url } : row)),
      );
    } catch (error) {
      toast(error instanceof Error ? error.message : "Téléversement de l'image impossible.");
    } finally {
      setUploadingPortfolioIndex(null);
    }
  }

  async function handleUploadTeamPhoto(index: number, file: File) {
    setUploadingTeamIndex(index);
    try {
      const url = await uploadFile(file);
      setTeam((current) => current.map((row, i) => (i === index ? { ...row, photo: url } : row)));
    } catch (error) {
      toast(error instanceof Error ? error.message : "Téléversement de la photo impossible.");
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
      toast("Prestations mises à jour");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Mise à jour impossible.");
    },
  });

  const portfolioMutation = useMutation({
    mutationFn: () => updateAgencyProfile({ portfolio: portfolioToPayload(portfolioItems) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "profile"], updated);
      toast("Portfolio mis à jour");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Mise à jour impossible.");
    },
  });

  const teamMutation = useMutation({
    mutationFn: () => updateAgencyProfile({ team: teamToPayload(team) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "profile"], updated);
      toast("Équipe mise à jour");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Mise à jour impossible.");
    },
  });

  const certificationsMutation = useMutation({
    mutationFn: () =>
      updateAgencyProfile({ certifications: certificationsToPayload(certifications) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "profile"], updated);
      toast("Certificats mis à jour");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Mise à jour impossible.");
    },
  });

  return (
    <DashboardShell role="agency">
      <div className="mx-auto max-w-[1080px] space-y-6">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight">Profil agence</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Ces informations composent votre profil public.
          </p>
        </div>

        <SectionCard
          title="Présentation"
          description="Nom, description, année de création et taille de l'équipe."
          action={profile?.legalIdValid ? <StatusBadge label="Identifiant légal vérifié" /> : null}
        >
          {isLoading ? (
            <FormSkeleton fields={6} />
          ) : (
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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

              <h3 className="pt-2 text-[13.5px] font-bold tracking-wide">COORDONNÉES</h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {updateMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
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
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent"
            >
              <Plus className="h-3 w-3" strokeWidth={1.8} />
              Ajouter un service
            </button>
          }
        >
          {isLoading ? (
            <StackSkeleton count={2} />
          ) : (
            <div className="space-y-4">
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
                    className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
                  >
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
                    <div className="sm:col-span-2">
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
                    </div>
                    <div className="flex gap-2 sm:col-span-2">
                      <button
                        type="button"
                        onClick={() =>
                          setServicesEditing((current) =>
                            current.map((v, i) => (i === index ? false : v)),
                          )
                        }
                        className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        Terminé
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setServices((current) => current.filter((_, i) => i !== index));
                          setServicesEditing((current) => current.filter((_, i) => i !== index));
                        }}
                        className="flex w-fit items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold text-destructive transition-colors hover:bg-accent"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Retirer
                      </button>
                    </div>
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => servicesMutation.mutate()}
                disabled={servicesMutation.isPending}
                className="rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {servicesMutation.isPending ? "Enregistrement..." : "Enregistrer les services"}
              </button>
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
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent"
            >
              <Plus className="h-3 w-3" strokeWidth={1.8} />
              Ajouter un projet
            </button>
          }
        >
          {isPortfolioLoading ? (
            <StackSkeleton count={3} />
          ) : (
            <div className="space-y-4">
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
                    className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
                  >
                    <div className="flex items-center gap-3 sm:col-span-2">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
                          <Image className="h-5 w-5" strokeWidth={1.6} />
                        </div>
                      )}
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent">
                        <Upload className="h-3.5 w-3.5" strokeWidth={1.8} />
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
                            i === index ? { ...row, collaborationPeriod: event.target.value } : row,
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
                      label="Lien vers le résultat (site, étude de cas...)"
                      value={item.resultUrl}
                      onChange={(event) =>
                        setPortfolioItems((current) =>
                          current.map((row, i) =>
                            i === index ? { ...row, resultUrl: event.target.value } : row,
                          ),
                        )
                      }
                    />
                    <div className="flex gap-2 sm:col-span-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPortfolioEditing((current) =>
                            current.map((v, i) => (i === index ? false : v)),
                          )
                        }
                        className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        Terminé
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPortfolioItems((current) => current.filter((_, i) => i !== index));
                          setPortfolioEditing((current) => current.filter((_, i) => i !== index));
                        }}
                        className="flex w-fit items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold text-destructive transition-colors hover:bg-accent"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Retirer
                      </button>
                    </div>
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => portfolioMutation.mutate()}
                disabled={portfolioMutation.isPending}
                className="rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {portfolioMutation.isPending ? "Enregistrement..." : "Enregistrer le portfolio"}
              </button>
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
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent"
            >
              <Plus className="h-3 w-3" strokeWidth={1.8} />
              Ajouter un membre
            </button>
          }
        >
          <div className="space-y-4">
            {team.length === 0 ? <EmptyState message="Aucun membre renseigné." /> : null}
            {team.map((member, index) =>
              !teamEditing[index] ? (
                <CollapsedItemCard
                  key={index}
                  title={member.role || "Membre"}
                  subtitle={
                    (membersQuery.data ?? []).find((option) => option.id === member.member)?.user ??
                    undefined
                  }
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
                  className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
                >
                  <div className="flex items-center gap-3 sm:col-span-2">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                        <User className="h-5 w-5" strokeWidth={1.6} />
                      </div>
                    )}
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent">
                      <Upload className="h-3.5 w-3.5" strokeWidth={1.8} />
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
                      className="mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none"
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
                  <div className="sm:col-span-2">
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
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <button
                      type="button"
                      onClick={() =>
                        setTeamEditing((current) =>
                          current.map((v, i) => (i === index ? false : v)),
                        )
                      }
                      className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      Terminé
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTeam((current) => current.filter((_, i) => i !== index));
                        setTeamEditing((current) => current.filter((_, i) => i !== index));
                      }}
                      className="flex w-fit items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold text-destructive transition-colors hover:bg-accent"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Retirer
                    </button>
                  </div>
                </div>
              ),
            )}
            <button
              type="button"
              onClick={() => teamMutation.mutate()}
              disabled={teamMutation.isPending}
              className="rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {teamMutation.isPending ? "Enregistrement..." : "Enregistrer l'équipe"}
            </button>
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
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent"
            >
              <Plus className="h-3 w-3" strokeWidth={1.8} />
              Ajouter un certificat
            </button>
          }
        >
          <div className="space-y-4">
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
                  className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
                >
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
                  <div className="sm:col-span-2">
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
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCertificationsEditing((current) =>
                          current.map((v, i) => (i === index ? false : v)),
                        )
                      }
                      className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
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
                      className="flex w-fit items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold text-destructive transition-colors hover:bg-accent"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Retirer
                    </button>
                  </div>
                </div>
              ),
            )}
            <button
              type="button"
              onClick={() => certificationsMutation.mutate()}
              disabled={certificationsMutation.isPending}
              className="rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {certificationsMutation.isPending
                ? "Enregistrement..."
                : "Enregistrer les certificats"}
            </button>
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
              {(reviewsQuery.data ?? []).map((review) => (
                <li key={review.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-1.5 text-[13.5px] font-bold">
                      <Star className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                      {review.rating}/5 — {review.authorName}
                    </p>
                    <p className="text-[13px] text-muted-foreground">{review.publishedAt}</p>
                  </div>
                  {review.projectTitle ? (
                    <p className="mt-1 text-[12px] font-medium text-muted-foreground">
                      Projet : {review.projectTitle}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[13px] text-muted-foreground">{review.comment}</p>
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
            <div className="flex items-start gap-4">
              <Building2 className="h-[22px] w-[22px]" strokeWidth={1.6} />
              <div className="min-w-0">
                <p className="text-[15px] font-bold">{profile.name}</p>
                <p className="text-[13px] text-muted-foreground">{profile.location}</p>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
