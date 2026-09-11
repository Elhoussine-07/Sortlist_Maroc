import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  Briefcase,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  ExternalLink,
  FileText,
  Folder,
  Gavel,
  LayoutGrid,
  LogOut,
  Plus,
  PlayCircle,
  Send,
  Settings,
  Building2,
  User,
  UserPlus,
  Users,
  ShieldAlert,
  Star,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { UserRole } from "@/lib/types";
import { useAuthStore } from "@/store/auth.store";
import { useAgencyStore } from "@/store/agency.store";
import { useNotificationsStore } from "@/store/notifications.store";
import { getMyAgencies, requestToJoinAgency, searchAgencies } from "@/services/agencies.service";
import { getUnreadCount } from "@/services/notifications.service";
import { switchAgency, logout } from "@/services/auth.service";
import { ApiError } from "@/services/http";
import { ActionModal } from "@/components/common/ActionModal";
import { TextField } from "@/components/common/Blocks";
import { Chatbot } from "@/components/common/Chatbot";
import { DemoGuide } from "@/components/common/DemoGuide";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const CLIENT_NAV: NavItem[] = [
  { label: "Tableau de bord", to: "/client/tableau-de-bord", icon: LayoutGrid },
  { label: "Mon profil", to: "/client/mon-profil", icon: User },
  { label: "Postuler un projet", to: "/client/postuler-un-projet", icon: Send },
  { label: "Mes projets", to: "/client/mes-projets", icon: Folder },
  { label: "Collaborations", to: "/client/collaborations", icon: Users },
  { label: "Agences favorites", to: "/client/agences-favorites", icon: Star },
  {
    label: "Historique des notifications",
    to: "/client/notifications",
    icon: Bell,
  },
  { label: "Paramètres", to: "/client/parametres", icon: Settings },
];

const AGENCY_NAV: NavItem[] = [
  { label: "Tableau de bord", to: "/agence/tableau-de-bord", icon: LayoutGrid },
  { label: "Opportunités", to: "/agence/opportunites", icon: Briefcase },
  { label: "Mes prospections", to: "/agence/mes-prospections", icon: Compass },
  { label: "Workflow", to: "/agence/workflow", icon: Workflow },
  { label: "Projets en cours", to: "/agence/projets-en-cours", icon: Folder },
  { label: "Suspension", to: "/agence/suspension", icon: ShieldAlert },
  { label: "Prospection", to: "/agence/prospection", icon: Users },
  { label: "Analytics", to: "/agence/analytics", icon: BarChart3 },
  { label: "Facturation", to: "/agence/facturation", icon: FileText },
  { label: "Profil agence", to: "/agence/profil", icon: Building2 },
  { label: "Invitations", to: "/agence/invitations", icon: UserPlus },
  {
    label: "Historique des notifications",
    to: "/agence/notifications",
    icon: Bell,
  },
  { label: "Paramètres", to: "/agence/parametres", icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Tableau de bord", to: "/admin/tableau-de-bord", icon: LayoutGrid },
  { label: "Litiges & suspensions", to: "/admin/litiges", icon: Gavel },
  { label: "Avis & comptes", to: "/admin/avis", icon: Star },
  {
    label: "Historique des notifications",
    to: "/admin/notifications",
    icon: Bell,
  },
];

const OWNER_ONLY_AGENCY_ROUTES = new Set([
  "/agence/parametres",
  "/agence/invitations",
  "/agence/profil",
]);

function navForRole(role: UserRole): NavItem[] {
  if (role === "client") return CLIENT_NAV;
  if (role === "agency") return AGENCY_NAV;
  return ADMIN_NAV;
}

const NAV_SECTION_BY_ROUTE: Record<string, string> = {
  "/client/tableau-de-bord": "Principal",
  "/agence/tableau-de-bord": "Principal",
  "/admin/tableau-de-bord": "Principal",

  "/client/postuler-un-projet": "Projets",
  "/client/mes-projets": "Projets",
  "/client/collaborations": "Projets",
  "/client/agences-favorites": "Projets",

  "/agence/opportunites": "Activité",
  "/agence/mes-prospections": "Activité",
  "/agence/workflow": "Activité",
  "/agence/projets-en-cours": "Activité",
  "/agence/suspension": "Activité",

  "/agence/prospection": "Performance",
  "/agence/analytics": "Performance",
  "/agence/facturation": "Performance",

  "/agence/profil": "Agence",
  "/agence/invitations": "Agence",

  "/admin/litiges": "Modération",
  "/admin/avis": "Modération",

  "/client/mon-profil": "Compte",
  "/client/notifications": "Compte",
  "/client/parametres": "Compte",
  "/agence/notifications": "Compte",
  "/agence/parametres": "Compte",
  "/admin/notifications": "Compte",
};

const NAV_SECTION_ORDER = [
  "Principal",
  "Projets",
  "Activité",
  "Performance",
  "Agence",
  "Modération",
  "Compte",
  "Autres",
];

function groupNavItems(items: NavItem[]): { section: string; items: NavItem[] }[] {
  const bySection = new Map<string, NavItem[]>();
  for (const item of items) {
    const section = NAV_SECTION_BY_ROUTE[item.to] ?? "Autres";
    const bucket = bySection.get(section) ?? [];
    bucket.push(item);
    bySection.set(section, bucket);
  }
  return NAV_SECTION_ORDER.map((section) => ({
    section,
    items: bySection.get(section) ?? [],
  })).filter((group) => group.items.length > 0);
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

export function DashboardShell({ role, children }: { role: UserRole; children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const user = useAuthStore((state) => state.user);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const setUnreadCount = useNotificationsStore((state) => state.setUnreadCount);

  const activeAgencyId = useAgencyStore((state) => state.activeAgencyId);
  const agencies = useAgencyStore((state) => state.agencies);
  const activeMembership = agencies.find((agency) => agency.id === activeAgencyId)?.membership;

  const items = navForRole(role).filter((item) => {
    if (role !== "agency" || activeMembership !== "member") return true;
    return !OWNER_ONLY_AGENCY_ROUTES.has(item.to);
  });
  const navGroups = groupNavItems(items);

  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
  });
  useEffect(() => {
    if (unreadCountQuery.data) {
      setUnreadCount(unreadCountQuery.data.count);
    }
  }, [unreadCountQuery.data, setUnreadCount]);

  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const roleLabel =
    role === "client" ? "Client (Entreprise)" : role === "agency" ? "Agence" : "Administration";

  return (
    <div className="min-h-screen bg-background">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <Link to="/" className="group flex min-w-0 shrink-0 items-center gap-2">
            <img src="/logo.ico" alt="Sortlist Pro" className="h-8 w-auto" />
            <span className="font-display truncate text-[20px] font-bold tracking-tight">
              Sortlist
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => setIsDemoOpen(true)}
              type="button"
              aria-label="Découvrir la plateforme"
              title="Découvrir la plateforme"
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
            >
              <PlayCircle className="h-[21px] w-[21px]" strokeWidth={1.6} />
            </button>

            <button
              onClick={() =>
                void navigate({
                  to:
                    role === "client"
                      ? "/client/notifications"
                      : role === "agency"
                        ? "/agence/notifications"
                        : "/admin/notifications",
                })
              }
              type="button"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
            >
              <Bell className="h-[21px] w-[21px]" strokeWidth={1.6} />
              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                  {unreadCount}
                </span>
              ) : null}
            </button>

            {role === "agency" ? (
              <>
                <span className="mx-1 h-6 w-px bg-border" aria-hidden />
                <AgencySwitcher />
              </>
            ) : null}

            <span className="mx-1 h-6 w-px bg-border" aria-hidden />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2 text-left transition-colors hover:bg-accent"
                >
                  <span
                    style={{
                      backgroundImage: seedGradient(user?.displayName ?? user?.initials ?? "?"),
                    }}
                    className="font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold text-white"
                  >
                    {user?.initials ?? ""}
                  </span>
                  <span className="hidden min-w-0 leading-tight sm:block">
                    <span className="block truncate text-[14.5px] font-semibold">
                      {user?.displayName ?? ""}
                    </span>
                    <span className="block truncate text-[12.5px] text-muted-foreground">
                      {roleLabel}
                    </span>
                  </span>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    strokeWidth={1.6}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user?.displayName ?? "Mon compte"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {role !== "admin" ? (
                  <DropdownMenuItem asChild className="gap-2">
                    <Link to={role === "client" ? "/client/parametres" : "/agence/parametres"}>
                      <Settings className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => {
                    void logout().finally(() => {
                      void navigate({ to: "/connexion" });
                    });
                  }}
                >
                  <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-[248px] shrink-0 flex-col justify-between overflow-y-auto border-r border-border px-3 py-6 lg:flex">
          <nav className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.section}>
                {navGroups.length > 1 ? (
                  <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {group.section}
                  </p>
                ) : null}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={
                          isActive
                            ? "flex items-center gap-3 rounded-md bg-primary/10 px-3 py-2.5 text-[14.5px] font-semibold text-primary"
                            : "flex items-center gap-3 rounded-md px-3 py-2.5 text-[14.5px] font-medium text-foreground/75 transition-colors hover:bg-accent hover:text-foreground"
                        }
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-6 rounded-lg border border-border p-3.5">
            <p className="flex items-center gap-2 text-[14px] font-semibold">
              <CircleHelp className="h-4 w-4 text-primary" strokeWidth={1.7} />
              Besoin d'aide ?
            </p>
            <a
              href="/centre-aide"
              className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Consulter notre centre d'aide
              <ExternalLink className="h-3 w-3" strokeWidth={1.7} />
            </a>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <Chatbot />
      <DemoGuide accountType={role} open={isDemoOpen} onOpenChange={setIsDemoOpen} />
    </div>
  );
}

function AgencySwitcher() {
  const queryClient = useQueryClient();
  const activeAgencyId = useAgencyStore((state) => state.activeAgencyId);
  const setActiveAgency = useAgencyStore((state) => state.setActiveAgency);
  const setAgencies = useAgencyStore((state) => state.setAgencies);

  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinQuery, setJoinQuery] = useState("");

  const { data: agencies } = useQuery({
    queryKey: ["agencies", "mine"],
    queryFn: getMyAgencies,
  });

  useEffect(() => {
    if (!agencies) return;
    setAgencies(agencies);
    if (activeAgencyId === null && agencies.length > 0) {
      setActiveAgency(agencies[0]?.id ?? null);
    }
  }, [agencies, activeAgencyId, setAgencies, setActiveAgency]);

  const switchMutation = useMutation({
    mutationFn: switchAgency,
    onSuccess: (_result, agencyId) => {
      setActiveAgency(agencyId);
      void queryClient.invalidateQueries();
      toast("Agence changée", {
        description: agencies?.find((agency) => agency.id === agencyId)?.name,
      });
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible de changer d'agence.");
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (query: string) => {
      const trimmed = query.trim();
      const results = await searchAgencies({ query: trimmed, pageSize: 5 });
      const targetId = results.items[0]?.id ?? trimmed;
      return requestToJoinAgency(targetId);
    },
    onSuccess: () => {
      toast("Demande envoyée", {
        description: "Le propriétaire de l'agence doit approuver votre demande.",
      });
      setIsJoinOpen(false);
      setJoinQuery("");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Envoi de la demande impossible.");
    },
  });

  const activeAgency = agencies?.find((agency) => agency.id === activeAgencyId) ?? agencies?.[0];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13.5px] font-semibold transition-colors hover:bg-accent"
          >
            {activeAgency ? (
              <span
                style={{ backgroundImage: seedGradient(activeAgency.id) }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
              >
                {activeAgency.initials}
              </span>
            ) : (
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
            )}
            <span className="hidden max-w-[140px] truncate sm:block">
              {activeAgency?.name ?? "Mes agences"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Vos agences</DropdownMenuLabel>
          {agencies === undefined || agencies.length === 0 ? (
            <p className="px-2 py-1.5 text-[13px] text-muted-foreground">Aucune agence trouvée.</p>
          ) : (
            agencies.map((agency) => (
              <DropdownMenuItem
                key={agency.id}
                onClick={() => {
                  if (agency.id !== activeAgencyId) {
                    switchMutation.mutate(agency.id);
                  }
                }}
                className="justify-between gap-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    style={{ backgroundImage: seedGradient(agency.id) }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  >
                    {agency.initials}
                  </span>
                  <span className="min-w-0 truncate">{agency.name}</span>
                  {/* AJOUT : badge "Moi" sur l'agence dont l'utilisateur
                      connecté est le owner (créée par lui), pour la
                      distinguer des agences rejointes comme membre. */}
                  {agency.membership === "owner" ? (
                    <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      Moi
                    </span>
                  ) : null}
                </span>
                {agency.id === activeAgencyId ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
                ) : null}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsJoinOpen(true)} className="gap-2">
            <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            Rejoindre une agence
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ActionModal
        open={isJoinOpen}
        onOpenChange={setIsJoinOpen}
        title="Rejoindre une agence"
        description="Envoyez une demande de rattachement au propriétaire de l'agence."
        confirmLabel={joinMutation.isPending ? "Envoi..." : "Envoyer la demande"}
        onConfirm={() => {
          if (joinQuery.trim()) {
            joinMutation.mutate(joinQuery);
          }
        }}
      >
        <TextField
          label="Nom ou identifiant de l'agence"
          value={joinQuery}
          onChange={(event) => setJoinQuery(event.target.value)}
        />
      </ActionModal>
    </>
  );
}
