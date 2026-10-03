import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs — Sortlist" },
      {
        name: "description",
        content: "Sortlist est gratuit : aucun frais de dépôt, aucune commission cachée.",
      },
    ],
  }),
  component: PricingPage,
});

const POINTS = [
  "Créer votre profil, gratuit",
  "Publier un projet, gratuit",
  "Postuler à une mission, gratuit",
  "Aucune commission cachée",
];

const PAGE_TEXT = {
  "Fil d'ariane": {
    en: "Breadcrumb",
    ar: "مسار التنقل",
    es: "Ruta de navegación",
  },
  "Accueil": {
    en: "Home",
    ar: "الرئيسية",
    es: "Inicio",
  },
  "Prix": {
    en: "Pricing",
    ar: "الأسعار",
    es: "Precios",
  },
  "Nos tarifs": {
    en: "Our pricing",
    ar: "أسعارنا",
    es: "Nuestras tarifas",
  },
  "Sortlist est entièrement gratuit, que vous soyez une entreprise ou une agence.": {
    en: "Sortlist is entirely free, whether you're a business or an agency.",
    ar: "Sortlist مجاني بالكامل، سواء كنت شركة أو وكالة.",
    es: "Sortlist es totalmente gratuito, ya seas una empresa o una agencia.",
  },
  "Utilisation de la plateforme": {
    en: "Platform usage",
    ar: "استخدام المنصة",
    es: "Uso de la plataforma",
  },
  "Sans engagement": {
    en: "No commitment",
    ar: "بدون التزام",
    es: "Sin compromiso",
  },
  "Créer votre profil, gratuit": {
    en: "Create your profile, free",
    ar: "إنشاء ملفك الشخصي، مجانًا",
    es: "Crea tu perfil, gratis",
  },
  "Publier un projet, gratuit": {
    en: "Post a project, free",
    ar: "نشر مشروع، مجانًا",
    es: "Publica un proyecto, gratis",
  },
  "Postuler à une mission, gratuit": {
    en: "Apply to a project, free",
    ar: "التقدم لمهمة، مجانًا",
    es: "Postúlate a un proyecto, gratis",
  },
  "Aucune commission cachée": {
    en: "No hidden commission",
    ar: "بدون عمولات خفية",
    es: "Sin comisiones ocultas",
  },
  "Créer mon compte gratuitement": {
    en: "Create my account for free",
    ar: "أنشئ حسابي مجانًا",
    es: "Crear mi cuenta gratis",
  },
} satisfies PageTextDict;

function PricingPage() {
  const { tt } = usePageText(PAGE_TEXT);
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader variant="landing" />

      <main className="mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-8">
        <nav
          aria-label={tt("Fil d'ariane")}
          className="flex items-center gap-2 pt-6 text-[13px] text-muted-foreground"
        >
          <Link to="/" className="transition-colors hover:text-foreground">
            {tt("Accueil")}
          </Link>
          <ChevronRight className="h-3 w-3" strokeWidth={1.8} />
          <span className="text-foreground">{tt("Prix")}</span>
        </nav>

        <section className="mt-8 max-w-[600px] mx-auto text-center">
          <h1 className="text-[30px] font-bold tracking-tight">{tt("Nos tarifs")}</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            {tt("Sortlist est entièrement gratuit, que vous soyez une entreprise ou une agence.")}
          </p>
        </section>

        <section className="mt-12 pb-20">
          <div className="mx-auto max-w-[420px] rounded-lg border border-border p-8 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              {tt("Utilisation de la plateforme")}
            </p>
            <p className="mt-3 text-[40px] font-bold tracking-tight">0 €</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{tt("Sans engagement")}</p>
            <ul className="mt-6 space-y-3 text-left">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
                  <span className="text-[13.5px]">{tt(point)}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/connexion"
              className="mt-7 flex w-full items-center justify-center rounded-md bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {tt("Créer mon compte gratuitement")}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
