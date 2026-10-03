import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Code2,
  Compass,
  MessageSquare,
  Megaphone,
  Palette,
  Scale,
  Users2,
  Wallet,
} from "lucide-react";
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
  "Services couverts": {
    en: "Services covered",
    ar: "الخدمات المتاحة",
    es: "Servicios cubiertos",
  },
  "Sortlist couvre un large éventail de secteurs, avec des agences spécialisées prêtes à accompagner votre projet.":
    {
      en: "Sortlist covers a wide range of sectors, with specialized agencies ready to support your project.",
      ar: "تغطي Sortlist مجموعة واسعة من القطاعات، مع وكالات متخصصة جاهزة لمرافقة مشروعكم.",
      es: "Sortlist cubre una amplia gama de sectores, con agencias especializadas listas para acompañar tu proyecto.",
    },
  "Marketing digital": {
    en: "Digital marketing",
    ar: "التسويق الرقمي",
    es: "Marketing digital",
  },
  "SEO, publicité en ligne, réseaux sociaux et stratégie de contenu.": {
    en: "SEO, online advertising, social media and content strategy.",
    ar: "تحسين محركات البحث، الإعلانات عبر الإنترنت، وسائل التواصل الاجتماعي واستراتيجية المحتوى.",
    es: "SEO, publicidad online, redes sociales y estrategia de contenidos.",
  },
  "Développement web": {
    en: "Web development",
    ar: "تطوير الويب",
    es: "Desarrollo web",
  },
  "Sites vitrines, applications sur mesure et plateformes e-commerce.": {
    en: "Showcase websites, custom applications and e-commerce platforms.",
    ar: "مواقع تعريفية، تطبيقات مخصصة، ومنصات التجارة الإلكترونية.",
    es: "Sitios web corporativos, aplicaciones a medida y plataformas de comercio electrónico.",
  },
  "Design & branding": {
    en: "Design & branding",
    ar: "التصميم والهوية البصرية",
    es: "Diseño y branding",
  },
  "Identité visuelle, UX/UI et design de produits digitaux.": {
    en: "Visual identity, UX/UI and digital product design.",
    ar: "الهوية البصرية، تجربة وواجهة المستخدم، وتصميم المنتجات الرقمية.",
    es: "Identidad visual, UX/UI y diseño de productos digitales.",
  },
  "Communication": {
    en: "Communications",
    ar: "التواصل",
    es: "Comunicación",
  },
  "Relations presse, événementiel et communication de marque.": {
    en: "Press relations, events and brand communication.",
    ar: "العلاقات الصحفية، تنظيم الفعاليات، والتواصل الخاص بالعلامة التجارية.",
    es: "Relaciones con la prensa, eventos y comunicación de marca.",
  },
  "Juridique": {
    en: "Legal",
    ar: "القانون",
    es: "Jurídico",
  },
  "Conseil juridique, contrats et conformité pour votre activité.": {
    en: "Legal advice, contracts and compliance for your business.",
    ar: "الاستشارات القانونية، العقود، والامتثال التنظيمي لنشاطكم.",
    es: "Asesoramiento jurídico, contratos y cumplimiento normativo para tu actividad.",
  },
  "Finance & comptabilité": {
    en: "Finance & accounting",
    ar: "المالية والمحاسبة",
    es: "Finanzas y contabilidad",
  },
  "Gestion comptable, fiscalité et pilotage financier.": {
    en: "Accounting management, taxation and financial oversight.",
    ar: "الإدارة المحاسبية، الضرائب، والتسيير المالي.",
    es: "Gestión contable, fiscalidad y control financiero.",
  },
  "Ressources humaines": {
    en: "Human resources",
    ar: "الموارد البشرية",
    es: "Recursos humanos",
  },
  "Recrutement, formation et gestion des talents.": {
    en: "Recruitment, training and talent management.",
    ar: "التوظيف، التكوين، وإدارة المواهب.",
    es: "Contratación, formación y gestión del talento.",
  },
  "Conseil en stratégie": {
    en: "Strategy consulting",
    ar: "الاستشارات الاستراتيجية",
    es: "Consultoría estratégica",
  },
  "Accompagnement stratégique pour structurer votre croissance.": {
    en: "Strategic support to structure your growth.",
    ar: "مرافقة استراتيجية لهيكلة نموكم.",
    es: "Acompañamiento estratégico para estructurar tu crecimiento.",
  },
  "Prêt à trouver le partenaire idéal ?": {
    en: "Ready to find the ideal partner?",
    ar: "هل أنتم مستعدون لإيجاد الشريك المثالي؟",
    es: "¿Listo para encontrar al socio ideal?",
  },
  "Publier un projet": {
    en: "Post a project",
    ar: "نشر مشروع",
    es: "Publicar un proyecto",
  },
  "Découvrir les agences": {
    en: "Discover agencies",
    ar: "اكتشاف الوكالات",
    es: "Descubrir las agencias",
  },
} satisfies PageTextDict;

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services couverts — Sortlist" },
      {
        name: "description",
        content:
          "Découvrez les secteurs et services couverts par les agences présentes sur Sortlist.",
      },
    ],
  }),
  component: ServicesPage,
});

const SECTORS = [
  {
    icon: Megaphone,
    title: "Marketing digital",
    description: "SEO, publicité en ligne, réseaux sociaux et stratégie de contenu.",
  },
  {
    icon: Code2,
    title: "Développement web",
    description: "Sites vitrines, applications sur mesure et plateformes e-commerce.",
  },
  {
    icon: Palette,
    title: "Design & branding",
    description: "Identité visuelle, UX/UI et design de produits digitaux.",
  },
  {
    icon: MessageSquare,
    title: "Communication",
    description: "Relations presse, événementiel et communication de marque.",
  },
  {
    icon: Scale,
    title: "Juridique",
    description: "Conseil juridique, contrats et conformité pour votre activité.",
  },
  {
    icon: Wallet,
    title: "Finance & comptabilité",
    description: "Gestion comptable, fiscalité et pilotage financier.",
  },
  {
    icon: Users2,
    title: "Ressources humaines",
    description: "Recrutement, formation et gestion des talents.",
  },
  {
    icon: Compass,
    title: "Conseil en stratégie",
    description: "Accompagnement stratégique pour structurer votre croissance.",
  },
];

function ServicesPage() {
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
          <span className="text-foreground">{tt("Services couverts")}</span>
        </nav>

        <section className="mt-8 max-w-[720px]">
          <h1 className="text-[30px] font-bold tracking-tight">{tt("Services couverts")}</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            {tt(
              "Sortlist couvre un large éventail de secteurs, avec des agences spécialisées prêtes à accompagner votre projet.",
            )}
          </p>
        </section>

        <section className="mt-12 pb-20">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SECTORS.map((sector) => (
              <div key={sector.title} className="rounded-lg border border-border p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
                  <sector.icon className="h-4.5 w-4.5" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 text-[14px] font-bold">{tt(sector.title)}</h3>
                <p className="mt-1.5 text-[12.5px] leading-[1.5] text-muted-foreground">
                  {tt(sector.description)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-[1080px] px-4 py-14 text-center sm:px-6 lg:px-8">
          <h2 className="text-[24px] font-bold tracking-tight">
            {tt("Prêt à trouver le partenaire idéal ?")}
          </h2>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/postuler-un-projet"
              className="rounded-md bg-background px-6 py-3 text-[14px] font-semibold text-foreground transition-opacity hover:opacity-90"
            >
              {tt("Publier un projet")}
            </Link>
            <Link
              to="/agences"
              className="rounded-md border border-background/30 px-6 py-3 text-[14px] font-semibold text-background transition-opacity hover:opacity-90"
            >
              {tt("Découvrir les agences")}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
