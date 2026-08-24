import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Gavel, Handshake } from "lucide-react";
import { useEffect, useMemo } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, StatGrid, StatusBadge, SectionCard } from "@/components/common/Blocks";
import { StatSkeleton, StackSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import { useAuthStore } from "@/store/auth.store";
import { listPendingSuspensions } from "@/services/moderation.service";

export const Route = createFileRoute("/_authenticated/admin/tableau-de-bord")({
  head: () => ({
    meta: [{ title: "Tableau de bord — Administration" }],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const role = useAuthStore((state) => state.role);
  const navigate = useNavigate();

  useEffect(() => {
    if (role && role !== "admin") {
      void navigate({
        to: role === "agency" ? "/agence/tableau-de-bord" : "/client/tableau-de-bord",
      });
    }
  }, [role, navigate]);

  const casesQuery = useQuery({
    queryKey: ["admin", "moderation", "pending"],
    queryFn: () => listPendingSuspensions(),
    enabled: role === "admin",
  });
  const cases = casesQuery.data ?? [];

  const stats = useMemo(() => {
    const pendingDisputes = cases.filter((item) => item.category === "dispute").length;
    const pendingAmicable = cases.filter((item) => item.category === "amicable").length;
    return { pendingDisputes, pendingAmicable, total: cases.length };
  }, [cases]);

  const recentDisputes = useMemo(
    () => cases.filter((item) => item.category === "dispute").slice(0, 5),
    [cases],
  );

  if (role !== "admin") return null;

  return (
    <DashboardShell role="admin">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="text-[24px] font-bold tracking-tight">Tableau de bord — Administration</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Vue d'ensemble des litiges et suspensions en attente, tous projets confondus.
        </p>

        <div className="mt-7">
          {casesQuery.isPending ? (
            <StatSkeleton count={3} />
          ) : (
            <StatGrid>
              <StatCard
                icon={Gavel}
                label="Litiges en attente de verdict"
                value={String(stats.pendingDisputes)}
              />
              <StatCard
                icon={Handshake}
                label="Suspensions amiables en attente"
                value={String(stats.pendingAmicable)}
                footer="Décidées en priorité par l'agence — modérateur en filet de sécurité"
              />
              <StatCard
                icon={Gavel}
                label="Dossiers en attente au total"
                value={String(stats.total)}
              />
            </StatGrid>
          )}
        </div>

        <div className="mt-8">
          <SectionCard
            title="Litiges en attente de verdict"
            description="Nécessitent une décision Fondé / Non fondé du modérateur."
            action={
              <Link
                to="/admin/litiges"
                className="flex items-center gap-1.5 text-[13.5px] font-semibold text-primary transition-opacity hover:opacity-80"
              >
                Voir tous les dossiers
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
              </Link>
            }
          >
            {casesQuery.isPending ? (
              <StackSkeleton count={3} />
            ) : recentDisputes.length === 0 ? (
              <EmptyState message="Aucun litige en attente pour le moment." />
            ) : (
              <div className="space-y-3">
                {recentDisputes.map((item) => (
                  <Link
                    key={item.id}
                    to="/admin/litiges"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold">{item.projectTitle}</p>
                      <p className="mt-1 truncate text-[13px] text-muted-foreground">
                        {item.clientName} — {item.agencyName ?? "Agence inconnue"}
                      </p>
                    </div>
                    <StatusBadge label="Litige — à trancher" />
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </DashboardShell>
  );
}
