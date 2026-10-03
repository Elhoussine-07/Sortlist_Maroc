import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, Play, Target } from "lucide-react";
import { useState } from "react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { StackSkeleton } from "@/components/common/Skeletons";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

export const Route = createFileRoute("/fonctionnalites/$slug")({
  head: () => ({
    meta: [
      { title: "Fonctionnalités — Sortlist" },
      {
        name: "description",
        content:
          "Découvrez en détail les fonctionnalités de Sortlist : matching intelligent, projets ciblés, collaboration simplifiée.",
      },
      { property: "og:title", content: "Fonctionnalités — Sortlist" },
      {
        property: "og:description",
        content: "Découvrez en détail les fonctionnalités de Sortlist.",
      },
    ],
  }),
  component: FeatureDetailPage,
});

const BENEFITS = [
  {
    title: "Des recommandations ultra-ciblées",
    description: "Recevez uniquement des suggestions pertinentes et alignées avec vos objectifs.",
  },
  {
    title: "Gain de temps considérable",
    description: "Fini les recherches interminables : notre IA fait le travail pour vous.",
  },
  {
    title: "Meilleure qualité de collaboration",
    description:
      "Connectez-vous avec les partenaires ou projets qui partagent vos valeurs et votre vision.",
  },
];

const DEMO_NAV = ["Dashboard", "Projets", "Agences", "Messages", "Favoris", "Paramètres"];

const PAGE_TEXT = {
  "Des recommandations ultra-ciblées": {
    en: "Highly targeted recommendations",
    ar: "توصيات مستهدفة بدقة",
    es: "Recomendaciones ultra específicas",
  },
  "Recevez uniquement des suggestions pertinentes et alignées avec vos objectifs.": {
    en: "Receive only relevant suggestions aligned with your goals.",
    ar: "احصل فقط على اقتراحات ذات صلة ومتوافقة مع أهدافك.",
    es: "Recibe únicamente sugerencias relevantes y alineadas con tus objetivos.",
  },
  "Gain de temps considérable": {
    en: "Significant time savings",
    ar: "توفير كبير للوقت",
    es: "Ahorro de tiempo considerable",
  },
  "Fini les recherches interminables : notre IA fait le travail pour vous.": {
    en: "No more endless searching: our AI does the work for you.",
    ar: "لا مزيد من عمليات البحث التي لا تنتهي: الذكاء الاصطناعي لدينا يقوم بالعمل نيابة عنك.",
    es: "Se acabaron las búsquedas interminables: nuestra IA hace el trabajo por ti.",
  },
  "Meilleure qualité de collaboration": {
    en: "Better quality collaboration",
    ar: "جودة أفضل للتعاون",
    es: "Mejor calidad de colaboración",
  },
  "Connectez-vous avec les partenaires ou projets qui partagent vos valeurs et votre vision.": {
    en: "Connect with partners or projects that share your values and vision.",
    ar: "تواصل مع الشركاء أو المشاريع التي تشاركك قيمك ورؤيتك.",
    es: "Conéctate con socios o proyectos que compartan tus valores y tu visión.",
  },
  "Dashboard": {
    en: "Dashboard",
    ar: "لوحة التحكم",
    es: "Panel",
  },
  "Projets": {
    en: "Projects",
    ar: "المشاريع",
    es: "Proyectos",
  },
  "Agences": {
    en: "Agencies",
    ar: "الوكالات",
    es: "Agencias",
  },
  "Messages": {
    en: "Messages",
    ar: "الرسائل",
    es: "Mensajes",
  },
  "Favoris": {
    en: "Favorites",
    ar: "المفضلة",
    es: "Favoritos",
  },
  "Paramètres": {
    en: "Settings",
    ar: "الإعدادات",
    es: "Configuración",
  },
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
  "Fonctionnalités": {
    en: "Features",
    ar: "الميزات",
    es: "Funcionalidades",
  },
  "Matching intelligent": {
    en: "Smart matching",
    ar: "المطابقة الذكية",
    es: "Emparejamiento inteligente",
  },
  "Notre algorithme d'intelligence artificielle analyse des milliers de données pour comprendre vos besoins, vos objectifs et votre contexte. Il identifie ensuite les agences ou projets les plus pertinents en fonction de leur expertise, de leurs réalisations passées et de leur compatibilité avec vos critères. Vous gagnez du temps et vous maximisez vos chances de succès.":
    {
      en: "Our artificial intelligence algorithm analyzes thousands of data points to understand your needs, goals, and context. It then identifies the most relevant agencies or projects based on their expertise, track record, and compatibility with your criteria. You save time and maximize your chances of success.",
      ar: "تحلل خوارزمية الذكاء الاصطناعي لدينا آلاف البيانات لفهم احتياجاتك وأهدافك وسياقك. ثم تحدد الوكالات أو المشاريع الأكثر ملاءمة بناءً على خبرتها وإنجازاتها السابقة ومدى توافقها مع معاييرك. بذلك توفر الوقت وتضاعف فرص نجاحك.",
      es: "Nuestro algoritmo de inteligencia artificial analiza miles de datos para comprender tus necesidades, objetivos y contexto. Luego identifica las agencias o proyectos más relevantes según su experiencia, sus logros anteriores y su compatibilidad con tus criterios. Ahorras tiempo y maximizas tus posibilidades de éxito.",
    },
  "Démonstration": {
    en: "Demo",
    ar: "عرض توضيحي",
    es: "Demostración",
  },
  "Nous avons trouvé {count} agences correspondant à vos critères": {
    en: "We found {count} agencies matching your criteria",
    ar: "لقد وجدنا {count} وكالة مطابقة لمعاييرك",
    es: "Encontramos {count} agencias que coinciden con tus criterios",
  },
  "Filtres (0)": {
    en: "Filters (0)",
    ar: "عوامل التصفية (0)",
    es: "Filtros (0)",
  },
  "Trier par : Pertinence": {
    en: "Sort by: Relevance",
    ar: "ترتيب حسب: الأهمية",
    es: "Ordenar por: Relevancia",
  },
  "Se connecter pour lancer la démonstration": {
    en: "Log in to launch the demo",
    ar: "سجّل الدخول لبدء العرض التوضيحي",
    es: "Inicia sesión para lanzar la demostración",
  },
  "Prêt à essayer ? Créez votre compte gratuitement": {
    en: "Ready to try it out? Create your account for free",
    ar: "مستعد للتجربة؟ أنشئ حسابك مجانًا",
    es: "¿Listo para probarlo? Crea tu cuenta gratis",
  },
  "S'inscrire maintenant": {
    en: "Sign up now",
    ar: "سجّل الآن",
    es: "Regístrate ahora",
  },
} satisfies PageTextDict;

function FeatureDetailPage() {
  const { tt } = usePageText(PAGE_TEXT);
  const [feature] = useState<null>(null);

  const [demoAgencies] = useState<[]>([]);
  const [isDemoLoading] = useState(false);

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
          <span>{tt("Fonctionnalités")}</span>
          <ChevronRight className="h-3 w-3" strokeWidth={1.8} />
          <span className="text-foreground">{tt("Matching intelligent")}</span>
        </nav>

        <section className="mt-8 flex gap-5">
          <Target className="mt-1 h-6 w-6 shrink-0" strokeWidth={1.6} />
          <div className="min-w-0">
            <h1 className="text-[30px] font-bold tracking-tight">{tt("Matching intelligent")}</h1>
            <p className="mt-4 max-w-[720px] text-[14px] leading-[1.65] text-foreground">
              {tt(
                "Notre algorithme d'intelligence artificielle analyse des milliers de données pour comprendre vos besoins, vos objectifs et votre contexte. Il identifie ensuite les agences ou projets les plus pertinents en fonction de leur expertise, de leurs réalisations passées et de leur compatibilité avec vos critères. Vous gagnez du temps et vous maximisez vos chances de succès.",
              )}
            </p>

            <ul className="mt-8 space-y-5">
              {(feature ?? BENEFITS).map((benefit) => (
                <li key={benefit.title} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-[17px] w-[17px] shrink-0" strokeWidth={1.6} />
                  <div className="min-w-0">
                    <h2 className="text-[13.5px] font-bold">{tt(benefit.title)}</h2>
                    <p className="mt-1 text-[13px] leading-[1.5] text-muted-foreground">
                      {tt(benefit.description)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {tt("Démonstration")}
          </h2>

          <div className="relative mt-4 overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="border-b border-border p-5 md:border-b-0 md:border-r">
                <p className="text-[16px] font-bold tracking-tight">Sortlist</p>
                <nav className="mt-5 space-y-3">
                  {DEMO_NAV.map((item) => (
                    <p key={item} className="flex items-center gap-2 text-[13px] font-medium">
                      <span className="h-3.5 w-3.5 rounded-sm border border-border" />
                      {tt(item)}
                    </p>
                  ))}
                </nav>
              </div>

              <div className="p-5">
                <p className="text-[14px] font-bold">{tt("Matching intelligent")}</p>
                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                  <p className="truncate text-[13px] text-muted-foreground">
                    {tt("Nous avons trouvé {count} agences correspondant à vos critères").replace(
                      "{count}",
                      String(demoAgencies.length),
                    )}
                  </p>
                  <div className="flex shrink-0 items-center gap-4 text-[13px] text-muted-foreground">
                    <span>{tt("Filtres (0)")}</span>
                    <span>{tt("Trier par : Pertinence")}</span>
                  </div>
                </div>

                <div className="mt-5">
                  {isDemoLoading ? (
                    <StackSkeleton count={3} />
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      {demoAgencies.map(() => null)}
                      {demoAgencies.length === 0
                        ? Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="space-y-2">
                              <p className="h-3.5 rounded bg-muted" />
                              <p className="h-2.5 w-2/3 rounded bg-muted" />
                              <p className="h-2.5 rounded bg-muted" />
                              <p className="h-2.5 w-1/2 rounded bg-muted" />
                              <div className="flex items-center justify-between pt-4">
                                <p className="h-2.5 w-24 rounded bg-muted" />
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-[13px] font-semibold" />
                              </div>
                            </div>
                          ))
                        : null}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {}
            <Link
              to="/connexion"
              aria-label={tt("Se connecter pour lancer la démonstration")}
              className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Play className="h-5 w-5 fill-current" strokeWidth={0} />
            </Link>
          </div>
        </section>

        <section className="py-16 text-center">
          <p className="text-[13.5px] text-muted-foreground">
            {tt("Prêt à essayer ? Créez votre compte gratuitement")}
          </p>
          <Link
            to="/connexion"
            className="mt-4 flex w-full items-center justify-center rounded-md bg-primary px-6 py-3.5 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {tt("S'inscrire maintenant")}
          </Link>
        </section>
      </main>
    </div>
  );
}
