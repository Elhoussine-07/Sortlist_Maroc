import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, DoorOpen, Link2, Sparkles, TrendingUp } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — Sortlist" },
      {
        name: "description",
        content:
          "Découvrez la mission de Sortlist, la plateforme B2B qui connecte entreprises et agences grâce à un matching intelligent.",
      },
      { property: "og:title", content: "À propos — Sortlist" },
      {
        property: "og:description",
        content: "La mission, la vision et l'approche de Sortlist.",
      },
    ],
  }),
  component: AboutPage,
});

const APPROACH = [
  {
    icon: Link2,
    title: "Connexion",
    description:
      "Nous rapprochons les entreprises pertinentes pour créer des relations à forte valeur ajoutée.",
  },
  {
    icon: Sparkles,
    title: "Simplicité",
    description:
      "Une expérience fluide et intuitive pour des échanges rapides, clairs et efficaces.",
  },
  {
    icon: TrendingUp,
    title: "Opportunités",
    description:
      "Nous ouvrons la porte à de nouvelles collaborations et à des opportunités de croissance durable.",
  },
];

const PAGE_TEXT = {
  "À propos": {
    en: "About",
    ar: "من نحن",
    es: "Acerca de",
  },
  "Nous créons de nouvelles façons de connecter les entreprises.": {
    en: "We're creating new ways to connect businesses.",
    ar: "نبتكر طرقًا جديدة لربط الشركات ببعضها.",
    es: "Creamos nuevas formas de conectar a las empresas.",
  },
  "Notre approche B2B repense la manière dont les entreprises se rencontrent, collaborent et se développent ensemble. Nous construisons un écosystème simple, utile et efficace pour générer des opportunités qui ont du sens.":
    {
      en: "Our B2B approach rethinks the way businesses meet, collaborate, and grow together. We're building a simple, useful, and effective ecosystem to generate opportunities that matter.",
      ar: "يعيد نهجنا في التعامل بين الشركات (B2B) تصور الطريقة التي تلتقي بها الشركات وتتعاون وتنمو معًا. نحن نبني نظامًا بيئيًا بسيطًا وفعالًا ومفيدًا لخلق فرص ذات قيمة حقيقية.",
      es: "Nuestro enfoque B2B replantea la forma en que las empresas se encuentran, colaboran y crecen juntas. Estamos construyendo un ecosistema simple, útil y eficaz para generar oportunidades con sentido.",
    },
  "Découvrir notre concept": {
    en: "Discover our concept",
    ar: "اكتشف مفهومنا",
    es: "Descubrir nuestro concepto",
  },
  "Architecture moderne, immeuble de bureaux": {
    en: "Modern architecture, office building",
    ar: "عمارة حديثة، مبنى مكاتب",
    es: "Arquitectura moderna, edificio de oficinas",
  },
  "Notre vision": {
    en: "Our vision",
    ar: "رؤيتنا",
    es: "Nuestra visión",
  },
  "Réinventer les connexions B2B pour un avenir plus collaboratif, agile et innovant.": {
    en: "Reinventing B2B connections for a more collaborative, agile, and innovative future.",
    ar: "إعادة ابتكار العلاقات بين الشركات من أجل مستقبل أكثر تعاونًا ومرونة وابتكارًا.",
    es: "Reinventar las conexiones B2B para un futuro más colaborativo, ágil e innovador.",
  },
  "Nous croyons que chaque entreprise a le potentiel de grandir grâce aux bonnes connexions.": {
    en: "We believe every business has the potential to grow through the right connections.",
    ar: "نؤمن بأن لكل شركة القدرة على النمو من خلال العلاقات المناسبة.",
    es: "Creemos que toda empresa tiene el potencial de crecer gracias a las conexiones adecuadas.",
  },
  "Notre mission est de créer un environnement de confiance où les échanges sont facilités et les opportunités dévoilées.":
    {
      en: "Our mission is to create a trusted environment where exchanges are made easier and opportunities are revealed.",
      ar: "مهمتنا هي خلق بيئة قائمة على الثقة تُسهّل التبادلات وتكشف عن الفرص.",
      es: "Nuestra misión es crear un entorno de confianza donde los intercambios se faciliten y las oportunidades salgan a la luz.",
    },
  "Notre approche": {
    en: "Our approach",
    ar: "نهجنا",
    es: "Nuestro enfoque",
  },
  "Connexion": {
    en: "Connection",
    ar: "التواصل",
    es: "Conexión",
  },
  "Nous rapprochons les entreprises pertinentes pour créer des relations à forte valeur ajoutée.": {
    en: "We bring relevant businesses together to create high-value relationships.",
    ar: "نقرّب بين الشركات المناسبة لبناء علاقات ذات قيمة مضافة عالية.",
    es: "Acercamos a las empresas relevantes para crear relaciones de alto valor añadido.",
  },
  "Simplicité": {
    en: "Simplicity",
    ar: "البساطة",
    es: "Simplicidad",
  },
  "Une expérience fluide et intuitive pour des échanges rapides, clairs et efficaces.": {
    en: "A smooth, intuitive experience for fast, clear, and effective exchanges.",
    ar: "تجربة سلسة وبديهية لتبادلات سريعة وواضحة وفعالة.",
    es: "Una experiencia fluida e intuitiva para intercambios rápidos, claros y eficaces.",
  },
  "Opportunités": {
    en: "Opportunities",
    ar: "الفرص",
    es: "Oportunidades",
  },
  "Nous ouvrons la porte à de nouvelles collaborations et à des opportunités de croissance durable.": {
    en: "We open the door to new collaborations and sustainable growth opportunities.",
    ar: "نفتح الباب أمام تعاونات جديدة وفرص نمو مستدام.",
    es: "Abrimos la puerta a nuevas colaboraciones y oportunidades de crecimiento sostenible.",
  },
  "Un concept nouveau": {
    en: "A new concept",
    ar: "مفهوم جديد",
    es: "Un concepto nuevo",
  },
  "Nous ne suivons pas le chemin existant. Nous en créons un nouveau.": {
    en: "We don't follow the existing path. We create a new one.",
    ar: "نحن لا نسلك الطريق القائم، بل نشق طريقًا جديدًا.",
    es: "No seguimos el camino existente. Creamos uno nuevo.",
  },
  "Notre concept est en cours de lancement. Nous construisons avec nos premiers partenaires un écosystème B2B différent.":
    {
      en: "Our concept is currently launching. We're building a different B2B ecosystem together with our first partners.",
      ar: "مفهومنا قيد الإطلاق حاليًا. نقوم ببناء نظام بيئي مختلف بين الشركات بالتعاون مع شركائنا الأوائل.",
      es: "Nuestro concepto está en fase de lanzamiento. Estamos construyendo un ecosistema B2B diferente junto con nuestros primeros socios.",
    },
  "Vous souhaitez découvrir notre concept ou en savoir plus sur notre approche ?": {
    en: "Want to discover our concept or learn more about our approach?",
    ar: "هل ترغب في اكتشاف مفهومنا أو معرفة المزيد عن نهجنا؟",
    es: "¿Quieres descubrir nuestro concepto o saber más sobre nuestro enfoque?",
  },
  "Nous contacter": {
    en: "Contact us",
    ar: "تواصل معنا",
    es: "Contáctanos",
  },
} satisfies PageTextDict;

function AboutPage() {
  const { tt } = usePageText(PAGE_TEXT);
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader variant="landing" />

      <section className="mx-auto grid max-w-[1080px] grid-cols-1 items-center gap-10 px-4 pt-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {tt("À propos")}
          </p>
          <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight sm:text-[38px]">
            {tt("Nous créons de nouvelles façons de connecter les entreprises.")}
          </h1>
          <p className="mt-5 max-w-[440px] text-[14px] leading-[1.65] text-muted-foreground">
            {tt(
              "Notre approche B2B repense la manière dont les entreprises se rencontrent, collaborent et se développent ensemble. Nous construisons un écosystème simple, utile et efficace pour générer des opportunités qui ont du sens.",
            )}
          </p>

          <a
            href="#notre-approche"
            className="mt-7 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {tt("Découvrir notre concept")}
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </a>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <img
            src="https://images.unsplash.com/photo-1551161440-88a5c5b09ba0?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt={tt("Architecture moderne, immeuble de bureaux")}
            className="h-[380px] w-full object-cover grayscale"
          />
        </div>
      </section>

      <section id="notre-vision" className="mt-20 border-t border-border">
        <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {tt("Notre vision")}
            </p>
            <h2 className="mt-3 text-[24px] font-bold leading-tight tracking-tight">
              {tt("Réinventer les connexions B2B pour un avenir plus collaboratif, agile et innovant.")}
            </h2>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <p className="text-[13.5px] leading-[1.65] text-muted-foreground">
              {tt(
                "Nous croyons que chaque entreprise a le potentiel de grandir grâce aux bonnes connexions.",
              )}
            </p>
            <p className="text-[13.5px] leading-[1.65] text-muted-foreground">
              {tt(
                "Notre mission est de créer un environnement de confiance où les échanges sont facilités et les opportunités dévoilées.",
              )}
            </p>
          </div>
        </div>
      </section>

      <section id="notre-approche" className="border-t border-border">
        <div className="mx-auto max-w-[1080px] px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-center text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {tt("Notre approche")}
          </p>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {APPROACH.map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-border">
                  <item.icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 text-[14px] font-bold uppercase tracking-wide">{tt(item.title)}</h3>
                <p className="mt-2 text-[13px] leading-[1.5] text-muted-foreground">
                  {tt(item.description)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-border lg:grid-cols-2">
          <div className="flex min-h-[260px] items-center justify-center bg-foreground">
            <DoorOpen className="h-16 w-16 text-background" strokeWidth={1.2} />
          </div>
          <div className="flex flex-col justify-center bg-foreground p-8 text-background sm:p-10">
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-background/60">
              {tt("Un concept nouveau")}
            </p>
            <h2 className="mt-3 text-[22px] font-bold leading-tight tracking-tight">
              {tt("Nous ne suivons pas le chemin existant. Nous en créons un nouveau.")}
            </h2>
            <p className="mt-4 text-[13.5px] leading-[1.6] text-background/70">
              {tt(
                "Notre concept est en cours de lancement. Nous construisons avec nos premiers partenaires un écosystème B2B différent.",
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 border-t border-border">
        <div className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-4 px-4 py-10 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p className="max-w-[520px] text-[14px] leading-[1.6] text-foreground">
            {tt("Vous souhaitez découvrir notre concept ou en savoir plus sur notre approche ?")}
          </p>

          <a
            href="mailto:contact@sortlistpro.com"
            className="shrink-0 rounded-md bg-primary px-6 py-3 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {tt("Nous contacter")}
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
