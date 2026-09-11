import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Eye,
  Lightbulb,
  Star,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Target,
  Clock,
  Zap,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { SectionCard, StatCard, StatusBadge } from "@/components/common/Blocks";
import { StackSkeleton, StatSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterSelect } from "@/components/common/ListControls";

import {
  getAnalyticsMetrics,
  getPqi,
  getProactiveAlerts,
  getRecommendations,
} from "@/services/analytics.service";

export const Route = createFileRoute("/_authenticated/agence/analytics")({
  head: () => ({
    meta: [
      {
        title: "Analytics PQI | Sortlist",
      },
      {
        name: "description",
        content:
          "Analysez votre score PQI, vos vues de profil, votre position moyenne et vos notes clients.",
      },
      {
        property: "og:title",
        content: "Analytics PQI | Sortlist",
      },
      {
        property: "og:description",
        content: "Indicateurs de performance de votre agence.",
      },
    ],
  }),

  component: AgencyAnalyticsPage,
});

const RING_RADIUS = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function gaugeTone(value: number): { ring: string; text: string; bg: string } {
  if (value >= 80)
    return { ring: "text-emerald-500", text: "text-emerald-700", bg: "bg-emerald-500/10" };
  if (value >= 60) return { ring: "text-blue-500", text: "text-blue-700", bg: "bg-blue-500/10" };
  if (value >= 40) return { ring: "text-amber-500", text: "text-amber-700", bg: "bg-amber-500/10" };
  return { ring: "text-rose-500", text: "text-rose-700", bg: "bg-rose-500/10" };
}

function PqiRing({ value, label }: { value: number | null; label?: string | null }) {
  const clamped = value === null ? 0 : Math.max(0, Math.min(100, value));
  const offset = RING_CIRCUMFERENCE * (1 - clamped / 100);
  const tone =
    value === null
      ? { ring: "text-border", text: "text-muted-foreground", bg: "bg-accent" }
      : gaugeTone(value);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 84 84" className="h-28 w-28 -rotate-90">
          <circle
            cx="42"
            cy="42"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="8"
            stroke="currentColor"
            className="text-border"
          />
          <circle
            cx="42"
            cy="42"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            stroke="currentColor"
            className={`${tone.ring} transition-[stroke-dashoffset] duration-700 ease-out`}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display text-3xl font-bold leading-none ${tone.text}`}>
            {value === null ? "?" : value}
          </span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      {label && (
        <span
          className={`mt-2 rounded-full ${tone.bg} px-3 py-1 text-[12px] font-semibold ${tone.text}`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function DeltaLabel({ value }: { value: string | number | null }) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const text = String(value);
  const isPositive = text.trim().startsWith("+");
  const isNegative = text.trim().startsWith("-");
  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : null;

  return (
    <span
      className={
        "flex items-center gap-1 font-medium " +
        (isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : "text-muted-foreground")
      }
    >
      {Icon ? <Icon className="h-3 w-3" strokeWidth={2} /> : null}
      {text}
    </span>
  );
}

type TrendPoint = {
  date: string;
  value: number;
};

function TrendChart({ series, label }: { series: TrendPoint[]; label: string }) {
  if (series.length === 0) {
    return null;
  }

  const width = 600;
  const height = 160;
  const padding = 10;

  const values = series.map((point) => point.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = series.map((point, index) => {
    const x = padding + (index / Math.max(series.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return [x, y] as const;
  });

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  if (!firstPoint || !lastPoint) {
    return null;
  }

  const linePath = points
    .map(([x, y], index) => (index === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(" ");

  const areaPath =
    `${linePath} ` +
    `L${lastPoint[0]},${height - padding} ` +
    `L${firstPoint[0]},${height - padding} Z`;

  const midIndex = Math.floor((series.length - 1) / 2);
  const middlePoint = series[midIndex];

  return (
    <div>
      <div className="flex items-center justify-between text-[12px] text-muted-foreground mb-1">
        <span className="font-medium">{label}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-40 w-full text-primary"
      >
        <path d={areaPath} fill="currentColor" fillOpacity="0.08" stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastPoint[0]} cy={lastPoint[1]} r="4" fill="currentColor" />
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{series[0]?.date ?? ""}</span>
        {middlePoint ? <span>{middlePoint.date}</span> : null}
        <span>{series[series.length - 1]?.date ?? ""}</span>
      </div>
    </div>
  );
}

type Recommendation = {
  id: string;
  title: string;
  description: string;
  priority?: "high" | "medium" | "low";
};

function AgencyAnalyticsPage() {
  const pqiQuery = useQuery({
    queryKey: ["agency", "analytics", "pqi"],
    queryFn: getPqi,
  });

  const pqiScore = pqiQuery.data?.score ?? null;
  const pqiLabel = pqiQuery.data?.label ?? null;
  const pqiFactors = pqiQuery.data?.factors ?? [];
  const penaltyNote = pqiQuery.data?.penaltyNote ?? null;
  const isPqiLoading = pqiQuery.isLoading;

  const metricsQuery = useQuery({
    queryKey: ["agency", "analytics", "metrics"],
    queryFn: () => getAnalyticsMetrics("30d"),
  });

  const emptyMetric = {
    value: 0,
    variation: "0%",
    series: [] as TrendPoint[],
  };

  const profileViews = metricsQuery.data?.profileViews ?? emptyMetric;
  const averagePosition = metricsQuery.data?.averagePosition ?? emptyMetric;
  const averageRating = metricsQuery.data?.averageRating ?? emptyMetric;
  const externalVisits = metricsQuery.data?.externalVisits ?? emptyMetric;
  const isMetricsLoading = metricsQuery.isLoading;

  const alertsQuery = useQuery({
    queryKey: ["agency", "analytics", "alerts"],
    queryFn: getProactiveAlerts,
  });

  const alerts = alertsQuery.data ?? [];
  const isAlertsLoading = alertsQuery.isLoading;

  const recommendationsQuery = useQuery({
    queryKey: ["agency", "analytics", "recommendations"],
    queryFn: getRecommendations,
  });

  const recommendations = (recommendationsQuery.data ?? []) as Recommendation[];
  const isRecommendationsLoading = recommendationsQuery.isLoading;

  return (
    <DashboardShell role="agency">
      <style>
        {`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}
      </style>

      <div className="mx-auto max-w-[1080px]">
        {/* ✅ EN-TÊTE MODERNISÉ */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </div>
            <div>
              <h1 className="font-display text-[24px] font-bold tracking-tight">Analytics PQI</h1>
              <p className="mt-1 text-[14px] text-muted-foreground">
                Suivez vos performances et améliorez votre visibilité.
              </p>
            </div>
          </div>
          <div className="w-full sm:w-[180px]">
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all">
              <option value="30d">30 derniers jours</option>
              <option value="7d">7 derniers jours</option>
              <option value="90d">90 derniers jours</option>
              <option value="365d">12 mois</option>
            </select>
          </div>
        </div>

        {/* ✅ SCORE PQI MODERNISÉ */}
        <section className="mt-7">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
              <div className="text-center md:text-left">
                <h2 className="text-[16px] font-bold">Score PQI</h2>
                <p className="text-[13px] text-muted-foreground">
                  Indice de performance et de qualité de votre agence.
                </p>
              </div>
              {pqiLabel && (
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary">
                  {pqiLabel}
                </span>
              )}
            </div>

            {isPqiLoading ? (
              <StackSkeleton count={4} />
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[auto_1fr]">
                <div className="flex justify-center">
                  <PqiRing value={pqiScore} label={pqiLabel} />
                </div>

                <div>
                  {pqiFactors.length === 0 ? (
                    <EmptyState message="Aucune donnée disponible" />
                  ) : (
                    <ul className="space-y-4">
                      {pqiFactors.map((factor) => (
                        <li key={factor.id}>
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="truncate">{factor.label}</span>
                            <span className="font-semibold">
                              {factor.value}/{factor.max}
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 w-full rounded-full bg-accent">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-primary/60 to-primary transition-[width]"
                              style={{
                                width: `${(factor.value / factor.max) * 100}%`,
                              }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {penaltyNote ? (
                    <p className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      {penaltyNote}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ✅ STATS MODERNISÉES */}
        <section className="mt-7">
          {isMetricsLoading ? (
            <StatSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 transition-colors group-hover:bg-sky-500 group-hover:text-white">
                    <Eye className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <DeltaLabel value={profileViews.variation} />
                </div>
                <p className="mt-3 text-[13px] font-medium text-muted-foreground">Vues du profil</p>
                <p className="font-display text-2xl font-bold">
                  {profileViews.value === null ? "?" : profileViews.value}
                </p>
              </div>

              <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                    <TrendingUp className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <DeltaLabel value={averagePosition.variation} />
                </div>
                <p className="mt-3 text-[13px] font-medium text-muted-foreground">
                  Position moyenne
                </p>
                <p className="font-display text-2xl font-bold">
                  {averagePosition.value === null ? "?" : averagePosition.value}
                </p>
              </div>

              <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                    <Star className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <DeltaLabel value={averageRating.variation} />
                </div>
                <p className="mt-3 text-[13px] font-medium text-muted-foreground">Note moyenne</p>
                <p className="font-display text-2xl font-bold">
                  {averageRating.value === null ? "?" : averageRating.value.toFixed(1)}
                  <span className="text-[14px] font-normal text-muted-foreground">/5</span>
                </p>
              </div>

              <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 transition-colors group-hover:bg-purple-500 group-hover:text-white">
                    <BarChart3 className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <DeltaLabel value={externalVisits.variation} />
                </div>
                <p className="mt-3 text-[13px] font-medium text-muted-foreground">
                  Visites externes
                </p>
                <p className="font-display text-2xl font-bold">
                  {externalVisits.value === null ? "?" : externalVisits.value}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ✅ ÉVOLUTION MODERNISÉE */}
        <section className="mt-7">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-[16px] font-bold">Évolution</h2>
                <p className="text-[13px] text-muted-foreground">
                  Courbe des vues de profil sur la période sélectionnée.
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary">
                {profileViews.series.length} points
              </span>
            </div>
            <div className="mt-5">
              {isMetricsLoading ? (
                <StackSkeleton count={2} />
              ) : profileViews.series.length === 0 ? (
                <EmptyState message="Aucune donnée disponible" />
              ) : (
                <TrendChart series={profileViews.series} label="Vues du profil" />
              )}
            </div>
          </div>
        </section>

        {/* ✅ ALERTES ET RECOMMANDATIONS MODERNISÉES */}
        <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Alertes proactives */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold">Alertes proactives</h2>
                <p className="text-[13px] text-muted-foreground">
                  Variations détectées sur vos indicateurs.
                </p>
              </div>
            </div>

            <div className="mt-5">
              {isAlertsLoading ? (
                <StackSkeleton count={3} />
              ) : alerts.length === 0 ? (
                <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">
                  Aucune alerte à afficher.
                </div>
              ) : (
                <ul className="space-y-4">
                  {alerts.map((alert) => {
                    const isPositive = alert.variationPercent >= 0;
                    return (
                      <li
                        key={alert.title}
                        className="flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
                      >
                        <span
                          className={
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full " +
                            (isPositive
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-rose-500/10 text-rose-600")
                          }
                        >
                          {isPositive ? (
                            <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" strokeWidth={2.2} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[13.5px] font-semibold">{alert.title}</p>
                            <span
                              className={
                                "text-[13px] font-bold " +
                                (isPositive ? "text-emerald-600" : "text-rose-600")
                              }
                            >
                              {isPositive ? "+" : ""}
                              {alert.variationPercent}%
                            </span>
                          </div>
                          <p className="text-[13px] text-muted-foreground">{alert.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* ✅ RECOMMANDATIONS CORRIGÉES */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold">Recommandations</h2>
                <p className="text-[13px] text-muted-foreground">
                  Actions suggérées pour améliorer votre score.
                </p>
              </div>
            </div>

            <div className="mt-5">
              {isRecommendationsLoading ? (
                <StackSkeleton count={3} />
              ) : recommendations.length === 0 ? (
                <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">
                  Aucune recommandation pour le moment.
                </div>
              ) : (
                <ul className="space-y-4">
                  {recommendations.map((recommendation) => {
                    const priority = recommendation.priority || "low";
                    const priorityLabel =
                      priority === "high"
                        ? "Priorité élevée"
                        : priority === "medium"
                          ? "Priorité moyenne"
                          : "Priorité faible";
                    const priorityClass =
                      priority === "high"
                        ? "bg-rose-100 text-rose-700"
                        : priority === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700";

                    return (
                      <li
                        key={recommendation.id}
                        className="flex items-start gap-3 rounded-lg border border-border p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Lightbulb className="h-4 w-4" strokeWidth={1.8} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-semibold">{recommendation.title}</p>
                          <p className="text-[13px] text-muted-foreground">
                            {recommendation.description}
                          </p>
                          <span
                            className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityClass}`}
                          >
                            {priorityLabel}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
