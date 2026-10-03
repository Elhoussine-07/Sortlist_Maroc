import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Handshake } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

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
  "Devenir partenaire": {
    en: "Become a partner",
    ar: "كن شريكًا",
    es: "Conviértete en socio",
  },
  "Vous êtes une agence et souhaitez rejoindre Sortlist pour recevoir des projets qualifiés ? Créez votre profil gratuitement pour commencer.":
    {
      en: "Are you an agency looking to join Sortlist and receive qualified projects? Create your profile for free to get started.",
      ar: "هل أنت وكالة وترغب في الانضمام إلى Sortlist لتلقي مشاريع مؤهلة؟ أنشئ ملفك التعريفي مجانًا للبدء.",
      es: "¿Eres una agencia y quieres unirte a Sortlist para recibir proyectos cualificados? Crea tu perfil gratis para empezar.",
    },
  "Créer mon profil agence": {
    en: "Create my agency profile",
    ar: "إنشاء ملف الوكالة",
    es: "Crear mi perfil de agencia",
  },
} satisfies PageTextDict;

export const Route = createFileRoute("/devenir-partenaire")({
  head: () => ({
    meta: [
      { title: "Devenir partenaire — Sortlist" },
      {
        name: "description",
        content:
          "Devenez partenaire de Sortlist et développez votre activité avec de nouveaux projets.",
      },
    ],
  }),
  component: BecomePartnerPage,
});

function BecomePartnerPage() {
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
          <span className="text-foreground">{tt("Devenir partenaire")}</span>
        </nav>

        <section className="mt-8 max-w-[600px] mx-auto text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border">
            <Handshake className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <h1 className="mt-5 text-[30px] font-bold tracking-tight">
            {tt("Devenir partenaire")}
          </h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            {tt(
              "Vous êtes une agence et souhaitez rejoindre Sortlist pour recevoir des projets qualifiés ? Créez votre profil gratuitement pour commencer.",
            )}
          </p>
          <Link
            to="/inscription-agence"
            className="mt-7 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {tt("Créer mon profil agence")}
          </Link>
        </section>

        <section className="pb-20" />
      </main>

      <Footer />
    </div>
  );
}
