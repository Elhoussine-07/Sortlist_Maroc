import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Ban,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  Handshake,
  LifeBuoy,
  Compass,
  Code2,
  Megaphone,
  MessageSquare,
  Palette,
  Play,
  Scale,
  Users2,
  Wallet,
  Rocket,
  Shield,
  Sparkles,
  Target,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { StackSkeleton } from "@/components/common/Skeletons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { flagEmoji } from "@/lib/countries";
import { getActiveCountries, type CountryOption } from "@/services/countries.service";
import { useTranslation } from "@/i18n/useTranslation";
import { translations } from "@/i18n/translations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: translations.fr.home.metaTitle },
      {
        name: "description",
        content: translations.fr.home.metaDescription,
      },
      {
        property: "og:title",
        content: translations.fr.home.metaTitle,
      },
      {
        property: "og:description",
        content: translations.fr.home.metaDescription,
      },
    ],
  }),
  component: HomePage,
});

const AUDIENCES_META = [
  { id: "companies", icon: UserRound },
  { id: "agencies", icon: Briefcase },
  { id: "security", icon: Shield },
] as const;

const TWO_ACTORS_META = [
  {
    id: "company",
    icon: Rocket,
    ctaTo: "/agences",
    color: "border-blue-200/50 hover:border-blue-400",
  },
  {
    id: "agency",
    icon: Users,
    ctaTo: "/projets",
    color: "border-emerald-200/50 hover:border-emerald-400",
  },
] as const;

type NonEmptyArray<T> = readonly [T, ...T[]];

type Advantage = {
  icon: LucideIcon;
  title: string;
  slug: string;
  mockType: "score" | "cards" | "chat" | "price";
  description: string;
  benefits: NonEmptyArray<{
    title: string;
    description: string;
  }>;
  mock: NonEmptyArray<{
    label: string;
    value: string;
  }>;
};

const ADVANTAGES_META = [
  { icon: Target, slug: "matching-intelligent", mockType: "score" as const, mockValues: ["98%", "95%", "93%"] },
  { icon: FileText, slug: "projets-cibles", mockType: "cards" as const, mockValues: ["96%", "94%", "91%"] },
  {
    icon: Users,
    slug: "collaboration-simplifiee",
    mockType: "chat" as const,
    mockValues: ["24", "12", "80%"],
  },
  { icon: Ban, slug: "zero-frais-de-depot", mockType: "price" as const, mockValues: null },
] as const;

const HOW_IT_WORKS_META = [
  { id: "create-profile", icon: ClipboardCheck, step: "01" },
  { id: "get-recommendations", icon: Sparkles, step: "02" },
  { id: "collaborate", icon: Handshake, step: "03" },
] as const;

const COMMITMENTS_META = [
  { id: "security", icon: Shield, color: "border-blue-200/50 hover:border-blue-400" },
  { id: "transparency", icon: Eye, color: "border-emerald-200/50 hover:border-emerald-400" },
  { id: "support", icon: LifeBuoy, color: "border-purple-200/50 hover:border-purple-400" },
] as const;

const SECTORS_META = [
  { id: "marketing", icon: Megaphone },
  { id: "web-dev", icon: Code2 },
  { id: "design", icon: Palette },
  { id: "communication", icon: MessageSquare },
  { id: "legal", icon: Scale },
  { id: "finance", icon: Wallet },
  { id: "hr", icon: Users2 },
  { id: "strategy", icon: Compass },
] as const;

const DEMO_NAV_META = ["dashboard", "projects", "agencies", "messages", "favorites", "settings"] as const;

function useHomeContent() {
  const { t, tList } = useTranslation();

  const audiences = useMemo(
    () =>
      AUDIENCES_META.map((item) => ({
        ...item,
        title: t(`home.audiences.${item.id}.title`),
        description: t(`home.audiences.${item.id}.description`),
      })),
    [t],
  );

  const twoActors = useMemo(
    () =>
      TWO_ACTORS_META.map((item) => ({
        ...item,
        title: t(`home.twoActors.${item.id}.title`),
        description: t(`home.twoActors.${item.id}.description`),
        ctaLabel: t(`home.twoActors.${item.id}.ctaLabel`),
        points: tList(`home.twoActors.${item.id}.points`),
      })),
    [t, tList],
  );

  const advantages = useMemo<Advantage[]>(
    () =>
      ADVANTAGES_META.map((item) => {
        const base = `home.advantages.${item.slug}`;
        const labels = tList(`${base}.mockLabels`);
        const values = item.mockValues ?? tList(`${base}.mockValues`);
        return {
          icon: item.icon,
          slug: item.slug,
          mockType: item.mockType,
          title: t(`${base}.title`),
          description: t(`${base}.description`),
          benefits: [0, 1, 2].map((i) => ({
            title: t(`${base}.benefits.${i}.title`),
            description: t(`${base}.benefits.${i}.description`),
          })) as unknown as NonEmptyArray<{ title: string; description: string }>,
          mock: labels.map((label, i) => ({ label, value: values[i] ?? "" })) as unknown as NonEmptyArray<{
            label: string;
            value: string;
          }>,
        };
      }),
    [t, tList],
  );

  const howItWorks = useMemo(
    () =>
      HOW_IT_WORKS_META.map((item) => ({
        ...item,
        title: t(`home.howItWorks.${item.id}.title`),
        description: t(`home.howItWorks.${item.id}.description`),
      })),
    [t],
  );

  const commitments = useMemo(
    () =>
      COMMITMENTS_META.map((item) => ({
        ...item,
        title: t(`home.commitments.${item.id}.title`),
        description: t(`home.commitments.${item.id}.description`),
      })),
    [t],
  );

  const sectors = useMemo(
    () =>
      SECTORS_META.map((item) => ({
        ...item,
        title: t(`home.sectors.${item.id}.title`),
        description: t(`home.sectors.${item.id}.description`),
      })),
    [t],
  );

  const demoNav = useMemo(
    () => DEMO_NAV_META.map((id) => t(`home.demoNav.${id}`)),
    [t],
  );

  return { t, audiences, twoActors, advantages, howItWorks, commitments, sectors, demoNav };
}

function HomePage() {
  const { t, audiences, twoActors, advantages, howItWorks, commitments, sectors, demoNav } =
    useHomeContent();
  const [openDemoSlug, setOpenDemoSlug] = useState<string | null>(null);
  const countriesScrollRef = useRef<HTMLDivElement>(null);
  const demoFeature = advantages.find((item) => item.slug === openDemoSlug) ?? null;

  const [activeCountries, setActiveCountries] = useState<CountryOption[]>([]);
  useEffect(() => {
    getActiveCountries().then(setActiveCountries);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader variant="landing" />

      <main className="mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-8">
        {/* ✅ HERO SECTION - CARTES SANS COULEURS */}
        <section className="relative pt-16 text-center sm:pt-20">
          <div className="absolute -top-20 left-1/2 -z-10 h-[400px] w-[800px] -translate-x-1/2 bg-gradient-radial from-primary/5 to-transparent opacity-30" />

          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent/50 px-4 py-1.5 text-[13px] font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("home.badge")}
          </div>

          <h1 className="mx-auto max-w-[640px] text-[38px] font-bold leading-[1.15] tracking-tight sm:text-[46px]">
            {t("home.heroTitle")}{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t("home.heroTitleHighlight")}
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-[520px] text-[15px] leading-6 text-foreground/70">
            {t("home.heroSubtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/inscription-client"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
            >
              {t("home.createAccount")}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              to="/connexion"
              className="inline-flex items-center rounded-lg border border-border bg-background px-6 py-3 text-[14px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
            >
              {t("home.login")}
            </Link>
          </div>

          {/* ✅ CARTES SANS COULEURS */}
          <div className="mx-auto mt-12 grid max-w-[880px] grid-cols-1 gap-6 text-left sm:grid-cols-3">
            {audiences.map((item) => (
              <div
                key={item.id}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                <item.icon className="h-6 w-6 text-primary" strokeWidth={1.6} />
                <h2 className="mt-4 text-[15px] font-bold">{item.title}</h2>
                <p className="mt-1 text-[13.5px] leading-[1.45] text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ✅ DEUX ACTEURS MODERNISÉS */}
        <section className="mt-16 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 py-16">
          <h2 className="text-center text-[18px] font-bold">{t("home.twoActorsTitle")}</h2>
          <div className="relative mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {twoActors.map((actor) => (
              <div
                key={actor.id}
                className={`group rounded-xl border ${actor.color} bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg sm:p-8`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <actor.icon className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 text-[17px] font-bold">{actor.title}</h3>
                <p className="mt-2 text-[13.5px] leading-[1.5] text-muted-foreground">
                  {actor.description}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {actor.points.map((point) => (
                    <li key={point} className="flex items-center gap-2.5 text-[13px]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  to={actor.ctaTo}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
                >
                  {actor.ctaLabel}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ✅ POURQUOI CHOISIR MODERNISÉ */}
        <section className="pt-20">
          <h2 className="text-center text-[18px] font-bold">{t("home.whyTitle")}</h2>
          <p className="mx-auto mt-3 max-w-[440px] text-center text-[14px] text-muted-foreground">
            {t("home.whySubtitle")}
          </p>

          <div className="relative mt-12 grid grid-cols-2 gap-y-10 sm:grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-[18px] hidden border-t-2 border-dashed border-border sm:block" />
            {advantages.map((item, index) => (
              <a
                key={item.slug}
                href={"#" + item.slug}
                className="group flex flex-col items-center text-center transition-transform hover:scale-105"
              >
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-background transition-colors group-hover:border-primary group-hover:bg-primary/10">
                  <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" strokeWidth={1.6} />
                </span>
                <span className="mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-[13.5px] font-bold group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
              </a>
            ))}
          </div>
        </section>

        {/* ✅ FEATURES DÉTAILLÉES */}
        {advantages.map((feature, index) => (
          <section key={feature.slug} id={feature.slug} className="scroll-mt-8 pt-20">
            <FeatureDetail
              feature={feature}
              index={index}
              onDemo={() => setOpenDemoSlug(feature.slug)}
            />
          </section>
        ))}

        {/* ✅ COMMENT ÇA MARCHE MODERNISÉ */}
        <section id="comment-ca-marche" className="scroll-mt-8 pt-20">
          <h2 className="text-center text-[18px] font-bold">{t("home.howItWorksTitle")}</h2>
          <p className="mx-auto mt-3 max-w-[440px] text-center text-[14px] text-muted-foreground">
            {t("home.howItWorksSubtitle")}
          </p>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {howItWorks.map((step) => (
              <div key={step.id} className="group text-center">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-background transition-colors group-hover:border-primary">
                  <step.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary" strokeWidth={1.6} />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {step.step}
                  </span>
                </div>
                <h3 className="mt-4 text-[16px] font-bold">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-[260px] text-[13.5px] leading-[1.5] text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ✅ NOS ENGAGEMENTS MODERNISÉS */}
        <section className="pt-20">
          <h2 className="text-center text-[18px] font-bold">{t("home.commitmentsTitle")}</h2>
          <p className="mx-auto mt-3 max-w-[440px] text-center text-[14px] text-muted-foreground">
            {t("home.commitmentsSubtitle")}
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {commitments.map((item) => (
              <div
                key={item.id}
                className={`group rounded-xl border ${item.color} bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <item.icon className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 text-[16px] font-bold">{item.title}</h3>
                <p className="mt-2 text-[13.5px] leading-[1.5] text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ✅ SECTEURS - SANS COULEURS */}
        <section className="overflow-hidden pt-20">
          <h2 className="text-center text-[18px] font-bold">{t("home.sectorsTitle")}</h2>
          <p className="mx-auto mt-3 max-w-[440px] text-center text-[14px] text-muted-foreground">
            {t("home.sectorsSubtitle")}
          </p>

          <div className="relative mt-10 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="animate-scroll-horizontal flex w-max gap-5">
              {[...sectors, ...sectors].map((sector, index) => (
                <div
                  key={sector.id + index}
                  className="group flex w-[220px] shrink-0 flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                >
                  <sector.icon className="h-6 w-6 text-primary" strokeWidth={1.6} />
                  <h3 className="mt-4 text-[14px] font-bold">{sector.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-[1.5] text-muted-foreground">
                    {sector.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ✅ PAYS MODERNISÉS */}
        {activeCountries.length > 0 ? (
          <section className="pt-16">
            <h2 className="text-center text-[18px] font-bold">{t("home.countriesTitle")}</h2>
            <p className="mx-auto mt-3 max-w-[440px] text-center text-[14px] text-muted-foreground">
              {t("home.countriesSubtitle")}
            </p>

            <div className="relative mt-8">
              <button
                type="button"
                onClick={() =>
                  countriesScrollRef.current?.scrollBy({ left: -220, behavior: "smooth" })
                }
                aria-label={t("home.scrollLeft")}
                className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-5 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-md sm:flex"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
              </button>

              <div
                ref={countriesScrollRef}
                className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {activeCountries.map((country) => (
                  <Link
                    key={country.name}
                    to="/agences"
                    search={{ country: country.name }}
                    className="group flex w-[160px] shrink-0 flex-col items-center rounded-xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-[28px]">
                      {country.code ? flagEmoji(country.code) : "🌍"}
                    </span>
                    <h3 className="mt-3 text-[14px] font-bold">{country.name}</h3>
                    <span className="mt-3 text-[12px] font-semibold text-muted-foreground/50 group-hover:text-primary/70 transition-colors">
                      {t("home.discover")}
                    </span>
                  </Link>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  countriesScrollRef.current?.scrollBy({ left: 220, behavior: "smooth" })
                }
                aria-label={t("home.scrollRight")}
                className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 translate-x-5 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-md sm:flex"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
          </section>
        ) : null}
      </main>

      {/* ✅ CTA FINAL MODERNISÉ */}
      <section className="mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-8 my-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-foreground to-foreground/90 p-10 text-background sm:p-16">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-background/20 bg-background/10">
                <Rocket className="h-6 w-6" strokeWidth={1.6} />
              </div>
              <h2 className="mt-6 text-[28px] font-bold leading-[1.25] tracking-tight sm:text-[34px]">
                {t("home.ctaTitle")}
              </h2>
              <p className="mt-4 max-w-[440px] text-[14px] leading-[1.6] text-background/70">
                {t("home.ctaSubtitle")}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/inscription-client"
                  className="inline-flex items-center gap-2 rounded-lg bg-background px-6 py-3 text-[14px] font-semibold text-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
                >
                  {t("home.createAccount")}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
                <Link
                  to="/connexion"
                  className="inline-flex items-center rounded-lg border border-background/30 px-6 py-3 text-[14px] font-semibold text-background transition-colors hover:bg-background/10"
                >
                  {t("home.login")}
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] font-medium text-background/70">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={1.8} />
                  {t("home.free")}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={1.8} />
                  {t("home.noCommitment")}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={1.8} />
                  {t("home.noHiddenFees")}
                </span>
              </div>
            </div>

            <div className="border-t border-background/15 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              {howItWorks.map((step, index) => (
                <div
                  key={step.id}
                  className={
                    index === 0 ? "flex gap-4 pb-6" : "flex gap-4 border-t border-background/15 py-6"
                  }
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-background/25 text-[12px] font-semibold">
                    {step.step}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold">{step.title}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-[1.5] text-background/60">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* ✅ MODAL DEMO MODERNISÉE */}
      <Dialog open={demoFeature !== null} onOpenChange={(open) => !open && setOpenDemoSlug(null)}>
        <DialogContent className="max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold">{demoFeature?.title}</DialogTitle>
          </DialogHeader>

          <div className="relative overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="border-b border-border bg-accent/30 p-4 md:border-b-0 md:border-r">
                <p className="text-[14px] font-bold tracking-tight">Sortlist</p>
                <nav className="mt-4 space-y-2.5">
                  {demoNav.map((item, index) => (
                    <p
                      key={item}
                      className={`flex items-center gap-2 text-[12.5px] font-medium ${index === 0 ? "text-primary" : "text-muted-foreground"}`}
                    >
                      <span className={`h-3 w-3 rounded-sm border ${index === 0 ? "border-primary bg-primary/10" : "border-border"}`} />
                      {item}
                    </p>
                  ))}
                </nav>
              </div>

              <div className="p-4">
                <p className="text-[13px] font-bold">{demoFeature?.title}</p>
                <p className="mt-3 text-[12px] text-muted-foreground">{t("home.noAgenciesFound")}</p>
                <div className="mt-4">
                  <StackSkeleton count={3} />
                </div>
              </div>
            </div>

            <Link
              to="/connexion"
              aria-label={t("home.loginForDemo")}
              className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl"
            >
              <Play className="h-6 w-6 fill-current" strokeWidth={0} />
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeatureDetail({
                         feature,
                         index,
                         onDemo,
                       }: {
  feature: Advantage;
  index: number;
  onDemo: () => void;
}) {
  const { t } = useTranslation();
  const number = String(index + 1).padStart(2, "0");

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md sm:p-10">
      <div
        className={
          "flex flex-col gap-8 lg:flex-row lg:gap-12" +
          (index % 2 === 1 ? " lg:flex-row-reverse" : "")
        }
      >
        <div className="lg:w-[45%]">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-muted-foreground/30">{number}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <feature.icon className="h-5 w-5" strokeWidth={1.6} />
            </div>
          </div>
          <h2 className="mt-5 text-[26px] font-bold tracking-tight">{feature.title}</h2>
          <p className="mt-4 text-[14px] leading-[1.65] text-foreground/80">{feature.description}</p>

          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {feature.title}
              </span>
            </div>
            <div className="p-4">
              <FeatureMock feature={feature} />
            </div>
          </div>

          <button
            type="button"
            onClick={onDemo}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
          >
            <Play className="h-4 w-4 fill-current" strokeWidth={0} />
            {t("home.watchDemo")}
          </button>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-6 border-t border-border pt-8 text-center lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
          {feature.benefits.map((benefit) => (
            <div key={benefit.title} className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <h3 className="mt-3 text-[14px] font-bold">{benefit.title}</h3>
              <p className="mt-1.5 text-[13px] leading-[1.5] text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureMock({ feature }: { feature: Advantage }) {
  const { t } = useTranslation();

  if (feature.mockType === "score") {
    return (
      <div className="space-y-3">
        {feature.mock.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-semibold">{row.value}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all"
                style={{ width: row.value }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (feature.mockType === "cards") {
    return (
      <div className="space-y-2.5">
        {feature.mock.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-accent/30"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
                {row.label.charAt(0)}
              </span>
              <span className="text-[13px] font-medium">{row.label}</span>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {row.value} {t("home.matchSuffix")}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (feature.mockType === "chat") {
    return (
      <div className="space-y-2.5">
        {feature.mock.map((row, index) => (
          <div
            key={row.label}
            className={
              "flex items-center gap-2.5 " + (index % 2 === 1 ? "flex-row-reverse text-right" : "")
            }
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${index % 2 === 1 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {index % 2 === 1 ? "V" : "A"}
            </span>
            <div className="rounded-lg border border-border px-3 py-2 text-[12.5px]">
              <span className="font-medium">{row.label}</span>
              <span className="ml-2 text-muted-foreground">{row.value}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {feature.mock[0].label}
      </p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-primary">{feature.mock[0].value}</p>
      <div className="mt-4 divide-y divide-border border-t border-border">
        {feature.mock.slice(1).map((row) => (
          <div key={row.label} className="flex items-center justify-between py-2.5">
            <span className="text-[13px] text-muted-foreground">{row.label}</span>
            <span className="text-[13px] font-semibold">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
