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
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

export const Route = createFileRoute("/_authenticated/admin/tableau-de-bord")({
  head: () => ({
    meta: [{ title: "Tableau de bord — Administration" }],
  }),
  component: AdminDashboardPage,
});

const PAGE_TEXT = {
  "Tableau de bord — Administration": {
    en: "Dashboard — Administration",
    ar: "لوحة التحكم — الإدارة",
    es: "Panel — Administración",
  },
  "Vue d'ensemble des litiges et suspensions en attente, tous projets confondus.": {
    en: "Overview of pending disputes and suspensions, across all projects.",
    ar: "نظرة عامة على النزاعات والتعليقات المعلقة، عبر جميع المشاريع.",
    es: "Resumen de las disputas y suspensiones pendientes, en todos los proyectos.",
  },
  "Litiges en attente de verdict": {
    en: "Disputes awaiting a verdict",
    ar: "نزاعات في انتظار القرار",
    es: "Disputas pendientes de veredicto",
  },
  "Suspensions amiables en attente": {
    en: "Pending amicable suspensions",
    ar: "تعليقات ودية معلقة",
    es: "Suspensiones amistosas pendientes",
  },
  "Décidées en priorité par l'agence — modérateur en filet de sécurité": {
    en: "Decided primarily by the agency — moderator as a safety net",
    ar: "تُقرَّر أساسًا من قبل الوكالة — المشرف كشبكة أمان",
    es: "Decididas principalmente por la agencia — moderador como red de seguridad",
  },
  "Dossiers en attente au total": {
    en: "Total pending cases",
    ar: "إجمالي الملفات المعلقة",
    es: "Total de casos pendientes",
  },
  "Nécessitent une décision Fondé / Non fondé du modérateur.": {
    en: "Require a Founded / Unfounded decision from the moderator.",
    ar: "تتطلب قرارًا من المشرف بـ«مؤسَّس» أو «غير مؤسَّس».",
    es: "Requieren una decisión de Fundada / No fundada por parte del moderador.",
  },
  "Voir tous les dossiers": {
    en: "View all cases",
    ar: "عرض جميع الملفات",
    es: "Ver todos los casos",
  },
  "Aucun litige en attente pour le moment.": {
    en: "No disputes pending at the moment.",
    ar: "لا توجد نزاعات معلقة في الوقت الحالي.",
    es: "No hay disputas pendientes en este momento.",
  },
  "Agence inconnue": {
    en: "Unknown agency",
    ar: "وكالة غير معروفة",
    es: "Agencia desconocida",
  },
  "Litige — à trancher": {
    en: "Dispute — to be resolved",
    ar: "نزاع — بانتظار الحسم",
    es: "Disputa — pendiente de resolución",
  },
} satisfies PageTextDict;

function AdminDashboardPage() {
  const { tt } = usePageText(PAGE_TEXT);
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
        <h1 className="text-[24px] font-bold tracking-tight">
          {tt("Tableau de bord — Administration")}
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          {tt("Vue d'ensemble des litiges et suspensions en attente, tous projets confondus.")}
        </p>

        <div className="mt-7">
          {casesQuery.isPending ? (
            <StatSkeleton count={3} />
          ) : (
            <StatGrid>
              <StatCard
                icon={Gavel}
                label={tt("Litiges en attente de verdict")}
                value={String(stats.pendingDisputes)}
              />
              <StatCard
                icon={Handshake}
                label={tt("Suspensions amiables en attente")}
                value={String(stats.pendingAmicable)}
                footer={tt("Décidées en priorité par l'agence — modérateur en filet de sécurité")}
              />
              <StatCard
                icon={Gavel}
                label={tt("Dossiers en attente au total")}
                value={String(stats.total)}
              />
            </StatGrid>
          )}
        </div>

        <div className="mt-8">
          <SectionCard
            title={tt("Litiges en attente de verdict")}
            description={tt("Nécessitent une décision Fondé / Non fondé du modérateur.")}
            action={
              <Link
                to="/admin/litiges"
                className="flex items-center gap-1.5 text-[13.5px] font-semibold text-primary transition-opacity hover:opacity-80"
              >
                {tt("Voir tous les dossiers")}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
              </Link>
            }
          >
            {casesQuery.isPending ? (
              <StackSkeleton count={3} />
            ) : recentDisputes.length === 0 ? (
              <EmptyState message={tt("Aucun litige en attente pour le moment.")} />
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
                        {item.clientName} — {item.agencyName ?? tt("Agence inconnue")}
                      </p>
                    </div>
                    <StatusBadge label={tt("Litige — à trancher")} />
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
