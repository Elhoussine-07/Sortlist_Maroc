import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  Handshake,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Star,
  Users2,
  Wallet,
} from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

export const Route = createFileRoute("/comment-ca-marche")({
  head: () => ({
    meta: [
      { title: "Comment ça marche — Sortlist" },
      {
        name: "description",
        content:
          "Découvrez comment fonctionne Sortlist : décrivez votre projet ou votre profil agence, laissez notre IA vous mettre en relation, collaborez en toute confiance.",
      },
      { property: "og:title", content: "Comment ça marche — Sortlist" },
      {
        property: "og:description",
        content: "Découvrez comment fonctionne Sortlist en quelques étapes simples.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const PATHS = [
  {
    icon: Building2,
    title: "Vous êtes une entreprise",
    description: "Trouvez le partenaire idéal pour concrétiser votre projet.",
  },
  {
    icon: Users2,
    title: "Vous êtes une agence",
    description: "Recevez des projets qualifiés et développez votre activité.",
  },
];

const HERO_STEPS = [
  { icon: ClipboardList, label: "Vous décrivez votre besoin" },
  { icon: Sparkles, label: "Notre IA trouve les meilleures correspondances" },
  { icon: MessageSquare, label: "Vous échangez facilement" },
  { icon: Handshake, label: "Vous choisissez le bon partenaire" },
  { icon: Send, label: "Vous collaborez et avancez" },
];

const COMPANY_STEPS = [
  {
    icon: ClipboardList,
    title: "Décrivez votre projet",
    description:
      "Renseignez le détail de votre projet via un formulaire simple : catégorie, description, budget, localisation.",
    visual: "form",
  },
  {
    icon: Search,
    title: "Obtenez votre shortlist",
    description:
      "Notre algorithme analyse votre besoin et sélectionne les agences les plus adaptées à votre profil.",
    visual: "ratings",
  },
  {
    icon: Send,
    title: "Contactez les agences",
    description: "Envoyez votre projet à une ou plusieurs agences de votre shortlist en un clic.",
    visual: "compare",
  },
  {
    icon: Handshake,
    title: "Choisissez et collaborez",
    description:
      "Comparez les propositions reçues et démarrez la collaboration avec l'agence retenue.",
    visual: "chat",
  },
];

const AGENCY_STEPS = [
  {
    icon: BadgeCheck,
    title: "Créez votre profil agence",
    description: "Présentez votre expertise, vos réalisations et vos disponibilités.",
    visual: "form",
  },
  {
    icon: MessageSquare,
    title: "Recevez des opportunités",
    description: "Des projets ciblés correspondant à vos critères vous sont proposés.",
    visual: "opportunity",
  },
  {
    icon: Search,
    title: "Répondez aux projets",
    description: "Consultez le brief et soumettez votre proposition aux entreprises intéressées.",
    visual: "list",
  },
  {
    icon: Handshake,
    title: "Décrochez la mission",
    description: "Échangez avec le client, ajustez votre devis et démarrez la collaboration.",
    visual: "accepted",
  },
];

const MATCHING_ITEMS = [
  { icon: BadgeCheck, label: "Compétences" },
  { icon: Star, label: "Avis" },
  { icon: Wallet, label: "Budget" },
  { icon: MapPin, label: "Localisation" },
  { icon: Clock, label: "Disponibilité" },
  { icon: CalendarClock, label: "Délais" },
];

const AFTER_MATCH = [
  {
    title: "Le client compare",
    description:
      "Il consulte les propositions reçues (expertise, prix, délais, avis) sur son espace.",
  },
  {
    title: "Le client choisit",
    description: "Il sélectionne l'agence qui correspond le mieux à ses attentes et son budget.",
  },
  {
    title: "La collaboration commence",
    description:
      "Les deux parties échangent, valident les étapes clés et suivent le projet ensemble.",
  },
];

const WHY_IT_WORKS = [
  {
    icon: Sparkles,
    title: "IA intelligente",
    description: "Un algorithme de matching qui comprend réellement vos besoins.",
  },
  {
    icon: BadgeCheck,
    title: "Profils vérifiés",
    description: "Chaque profil est contrôlé avant validation sur la plateforme.",
  },
  {
    icon: Handshake,
    title: "Zéro frais de dépôt",
    description: "Publier un projet ou postuler à une mission ne coûte rien.",
  },
  {
    icon: MessageSquare,
    title: "Communication simplifiée",
    description: "Un espace centralisé pour échanger et suivre chaque projet.",
  },
  {
    icon: Eye,
    title: "Transparence totale",
    description: "Aucune donnée cachée, aucune commission surprise.",
  },
];

const PAGE_TEXT = {
  "Fil d'ariane": { en: "Breadcrumb", ar: "مسار التنقل", es: "Migas de pan" },
  Accueil: { en: "Home", ar: "الرئيسية", es: "Inicio" },
  "Comment ça marche": { en: "How it works", ar: "كيف يعمل", es: "Cómo funciona" },
  "Fonctionnement simple et efficace": {
    en: "Simple and effective process",
    ar: "طريقة عمل بسيطة وفعّالة",
    es: "Funcionamiento simple y eficaz",
  },
  "Comment ça marche ?": { en: "How does it work?", ar: "كيف يعمل؟", es: "¿Cómo funciona?" },
  "Sortlist facilite la mise en relation entre les entreprises et les agences grâce à un processus clair, intelligent et sécurisé.":
    {
      en: "Sortlist makes it easy to connect companies and agencies through a clear, intelligent, and secure process.",
      ar: "تُسهّل Sortlist التواصل بين الشركات والوكالات من خلال عملية واضحة وذكية وآمنة.",
      es: "Sortlist facilita la conexión entre empresas y agencias gracias a un proceso claro, inteligente y seguro.",
    },
  "Je suis une entreprise": { en: "I'm a company", ar: "أنا شركة", es: "Soy una empresa" },
  "Je suis une agence": { en: "I'm an agency", ar: "أنا وكالة", es: "Soy una agencia" },
  "Deux parcours, un même objectif : de belles collaborations": {
    en: "Two paths, one goal: great collaborations",
    ar: "مساران، هدف واحد: تعاون ناجح",
    es: "Dos caminos, un mismo objetivo: grandes colaboraciones",
  },
  "Le processus en 4 étapes clés": {
    en: "The process in 4 key steps",
    ar: "العملية في 4 خطوات رئيسية",
    es: "El proceso en 4 pasos clave",
  },
  "Côté entreprise": { en: "For companies", ar: "جانب الشركة", es: "Lado empresa" },
  "Côté agence": { en: "For agencies", ar: "جانب الوكالة", es: "Lado agencia" },
  "Pourquoi ça fonctionne si bien ?": {
    en: "Why it works so well",
    ar: "لماذا ينجح هذا النظام؟",
    es: "¿Por qué funciona tan bien?",
  },
  "Prêt à trouver le partenaire idéal ?": {
    en: "Ready to find the ideal partner?",
    ar: "جاهز لإيجاد الشريك المثالي؟",
    es: "¿Listo para encontrar al socio ideal?",
  },
  "Rejoignez les entreprises et agences qui rejoignent Sortlist pour collaborer plus simplement.":
    {
      en: "Join the companies and agencies choosing Sortlist to collaborate more easily.",
      ar: "انضم إلى الشركات والوكالات التي تنضم إلى Sortlist للتعاون بسهولة أكبر.",
      es: "Únete a las empresas y agencias que eligen Sortlist para colaborar de forma más sencilla.",
    },
  "Publier un projet": { en: "Post a project", ar: "انشر مشروعًا", es: "Publicar un proyecto" },
  "Découvrir les agences": {
    en: "Discover agencies",
    ar: "اكتشف الوكالات",
    es: "Descubrir agencias",
  },
  "Gratuit · Sans engagement · Sans frais cachés": {
    en: "Free · No commitment · No hidden fees",
    ar: "مجاني · بدون التزام · بدون رسوم خفية",
    es: "Gratis · Sin compromiso · Sin comisiones ocultas",
  },
  "MATCHING IA": { en: "AI MATCHING", ar: "مطابقة بالذكاء الاصطناعي", es: "EMPAREJAMIENTO IA" },
  // Paths
  "Vous êtes une entreprise": { en: "You're a company", ar: "أنت شركة", es: "Eres una empresa" },
  "Trouvez le partenaire idéal pour concrétiser votre projet.": {
    en: "Find the ideal partner to bring your project to life.",
    ar: "ابحث عن الشريك المثالي لتحقيق مشروعك.",
    es: "Encuentra al socio ideal para hacer realidad tu proyecto.",
  },
  "Vous êtes une agence": { en: "You're an agency", ar: "أنت وكالة", es: "Eres una agencia" },
  "Recevez des projets qualifiés et développez votre activité.": {
    en: "Receive qualified projects and grow your business.",
    ar: "استقبل مشاريع مؤهلة ونمِّ نشاطك.",
    es: "Recibe proyectos cualificados y haz crecer tu negocio.",
  },
  // Hero steps
  "Vous décrivez votre besoin": {
    en: "You describe your need",
    ar: "تصف احتياجك",
    es: "Describes tu necesidad",
  },
  "Notre IA trouve les meilleures correspondances": {
    en: "Our AI finds the best matches",
    ar: "يجد ذكاؤنا الاصطناعي أفضل التطابقات",
    es: "Nuestra IA encuentra las mejores coincidencias",
  },
  "Vous échangez facilement": {
    en: "You communicate easily",
    ar: "تتواصل بسهولة",
    es: "Te comunicas fácilmente",
  },
  "Vous choisissez le bon partenaire": {
    en: "You choose the right partner",
    ar: "تختار الشريك المناسب",
    es: "Eliges al socio adecuado",
  },
  "Vous collaborez et avancez": {
    en: "You collaborate and move forward",
    ar: "تتعاون وتمضي قدمًا",
    es: "Colaboras y avanzas",
  },
  // Company steps
  "Décrivez votre projet": {
    en: "Describe your project",
    ar: "صف مشروعك",
    es: "Describe tu proyecto",
  },
  "Renseignez le détail de votre projet via un formulaire simple : catégorie, description, budget, localisation.":
    {
      en: "Fill in your project details through a simple form: category, description, budget, location.",
      ar: "أدخل تفاصيل مشروعك عبر نموذج بسيط: الفئة، الوصف، الميزانية، الموقع.",
      es: "Indica los detalles de tu proyecto mediante un formulario sencillo: categoría, descripción, presupuesto, ubicación.",
    },
  "Obtenez votre shortlist": {
    en: "Get your shortlist",
    ar: "احصل على قائمتك المختصرة",
    es: "Obtén tu lista preseleccionada",
  },
  "Notre algorithme analyse votre besoin et sélectionne les agences les plus adaptées à votre profil.":
    {
      en: "Our algorithm analyzes your need and selects the agencies best suited to your profile.",
      ar: "تقوم خوارزميتنا بتحليل احتياجك واختيار الوكالات الأنسب لملفك.",
      es: "Nuestro algoritmo analiza tu necesidad y selecciona las agencias más adecuadas para tu perfil.",
    },
  "Contactez les agences": {
    en: "Contact the agencies",
    ar: "تواصل مع الوكالات",
    es: "Contacta a las agencias",
  },
  "Envoyez votre projet à une ou plusieurs agences de votre shortlist en un clic.": {
    en: "Send your project to one or more agencies on your shortlist in one click.",
    ar: "أرسل مشروعك إلى وكالة واحدة أو أكثر من قائمتك المختصرة بنقرة واحدة.",
    es: "Envía tu proyecto a una o varias agencias de tu lista preseleccionada con un solo clic.",
  },
  "Choisissez et collaborez": {
    en: "Choose and collaborate",
    ar: "اختر وتعاون",
    es: "Elige y colabora",
  },
  "Comparez les propositions reçues et démarrez la collaboration avec l'agence retenue.": {
    en: "Compare the proposals received and start collaborating with the chosen agency.",
    ar: "قارن العروض المستلمة وابدأ التعاون مع الوكالة المختارة.",
    es: "Compara las propuestas recibidas e inicia la colaboración con la agencia elegida.",
  },
  // Agency steps
  "Créez votre profil agence": {
    en: "Create your agency profile",
    ar: "أنشئ ملف وكالتك",
    es: "Crea el perfil de tu agencia",
  },
  "Présentez votre expertise, vos réalisations et vos disponibilités.": {
    en: "Showcase your expertise, portfolio, and availability.",
    ar: "اعرض خبرتك وإنجازاتك وتوفرك.",
    es: "Presenta tu experiencia, tus proyectos realizados y tu disponibilidad.",
  },
  "Recevez des opportunités": {
    en: "Receive opportunities",
    ar: "استقبل الفرص",
    es: "Recibe oportunidades",
  },
  "Des projets ciblés correspondant à vos critères vous sont proposés.": {
    en: "Targeted projects matching your criteria are sent your way.",
    ar: "تُعرض عليك مشاريع مستهدفة تتوافق مع معاييرك.",
    es: "Se te proponen proyectos específicos que coinciden con tus criterios.",
  },
  "Répondez aux projets": {
    en: "Respond to projects",
    ar: "استجب للمشاريع",
    es: "Responde a los proyectos",
  },
  "Consultez le brief et soumettez votre proposition aux entreprises intéressées.": {
    en: "Review the brief and submit your proposal to interested companies.",
    ar: "اطّلع على ملخص المشروع وقدّم عرضك للشركات المهتمة.",
    es: "Consulta el brief y envía tu propuesta a las empresas interesadas.",
  },
  "Décrochez la mission": {
    en: "Land the project",
    ar: "احصل على المهمة",
    es: "Consigue el proyecto",
  },
  "Échangez avec le client, ajustez votre devis et démarrez la collaboration.": {
    en: "Discuss with the client, adjust your quote, and start the collaboration.",
    ar: "تواصل مع العميل، واضبط عرض سعرك، وابدأ التعاون.",
    es: "Conversa con el cliente, ajusta tu presupuesto e inicia la colaboración.",
  },
  // Matching items
  Compétences: { en: "Skills", ar: "المهارات", es: "Habilidades" },
  Avis: { en: "Reviews", ar: "التقييمات", es: "Opiniones" },
  Budget: { en: "Budget", ar: "الميزانية", es: "Presupuesto" },
  Localisation: { en: "Location", ar: "الموقع", es: "Ubicación" },
  Disponibilité: { en: "Availability", ar: "التوفر", es: "Disponibilidad" },
  Délais: { en: "Timeline", ar: "المواعيد النهائية", es: "Plazos" },
  // After match
  "Le client compare": { en: "The client compares", ar: "يقارن العميل", es: "El cliente compara" },
  "Il consulte les propositions reçues (expertise, prix, délais, avis) sur son espace.": {
    en: "They review the proposals received (expertise, price, timeline, reviews) in their dashboard.",
    ar: "يطّلع على العروض المستلمة (الخبرة، السعر، المواعيد، التقييمات) في مساحته الخاصة.",
    es: "Consulta las propuestas recibidas (experiencia, precio, plazos, opiniones) en su espacio.",
  },
  "Le client choisit": { en: "The client chooses", ar: "يختار العميل", es: "El cliente elige" },
  "Il sélectionne l'agence qui correspond le mieux à ses attentes et son budget.": {
    en: "They select the agency that best matches their expectations and budget.",
    ar: "يختار الوكالة الأنسب لتوقعاته وميزانيته.",
    es: "Selecciona la agencia que mejor se ajusta a sus expectativas y presupuesto.",
  },
  "La collaboration commence": {
    en: "The collaboration begins",
    ar: "يبدأ التعاون",
    es: "La colaboración comienza",
  },
  "Les deux parties échangent, valident les étapes clés et suivent le projet ensemble.": {
    en: "Both parties communicate, validate key milestones, and track the project together.",
    ar: "يتواصل الطرفان، ويؤكدان المراحل الرئيسية، ويتابعان المشروع معًا.",
    es: "Ambas partes se comunican, validan las etapas clave y siguen el proyecto juntas.",
  },
  // Why it works
  "IA intelligente": { en: "Smart AI", ar: "ذكاء اصطناعي ذكي", es: "IA inteligente" },
  "Un algorithme de matching qui comprend réellement vos besoins.": {
    en: "A matching algorithm that truly understands your needs.",
    ar: "خوارزمية مطابقة تفهم احتياجاتك بشكل حقيقي.",
    es: "Un algoritmo de emparejamiento que realmente entiende tus necesidades.",
  },
  "Profils vérifiés": { en: "Verified profiles", ar: "ملفات موثّقة", es: "Perfiles verificados" },
  "Chaque profil est contrôlé avant validation sur la plateforme.": {
    en: "Every profile is reviewed before being approved on the platform.",
    ar: "يتم التحقق من كل ملف قبل اعتماده على المنصة.",
    es: "Cada perfil se revisa antes de ser validado en la plataforma.",
  },
  "Zéro frais de dépôt": { en: "Zero posting fees", ar: "بدون رسوم نشر", es: "Cero comisiones de publicación" },
  "Publier un projet ou postuler à une mission ne coûte rien.": {
    en: "Posting a project or applying for a mission costs nothing.",
    ar: "نشر مشروع أو التقدم لمهمة لا يكلفك شيئًا.",
    es: "Publicar un proyecto o postular a una misión no cuesta nada.",
  },
  "Communication simplifiée": {
    en: "Simplified communication",
    ar: "تواصل مبسّط",
    es: "Comunicación simplificada",
  },
  "Un espace centralisé pour échanger et suivre chaque projet.": {
    en: "A centralized space to communicate and track every project.",
    ar: "مساحة مركزية للتواصل ومتابعة كل مشروع.",
    es: "Un espacio centralizado para comunicarse y hacer seguimiento de cada proyecto.",
  },
  "Transparence totale": { en: "Full transparency", ar: "شفافية تامة", es: "Transparencia total" },
  "Aucune donnée cachée, aucune commission surprise.": {
    en: "No hidden data, no surprise commissions.",
    ar: "لا بيانات مخفية ولا عمولات مفاجئة.",
    es: "Sin datos ocultos, sin comisiones sorpresa.",
  },
  // Step mocks
  Soumettre: { en: "Submit", ar: "إرسال", es: "Enviar" },
  "Agence A": { en: "Agency A", ar: "الوكالة أ", es: "Agencia A" },
  "Agence B": { en: "Agency B", ar: "الوكالة ب", es: "Agencia B" },
  "Agence C": { en: "Agency C", ar: "الوكالة ج", es: "Agencia C" },
  "Proposition reçue": { en: "Proposal received", ar: "تم استلام العرض", es: "Propuesta recibida" },
  Acceptée: { en: "Accepted", ar: "مقبولة", es: "Aceptada" },
  "Nouveau projet reçu": {
    en: "New project received",
    ar: "تم استلام مشروع جديد",
    es: "Nuevo proyecto recibido",
  },
  "Projet accepté": { en: "Project accepted", ar: "تم قبول المشروع", es: "Proyecto aceptado" },
} satisfies PageTextDict;

function HowItWorksPage() {
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
          <span className="text-foreground">{tt("Comment ça marche")}</span>
        </nav>

        <section className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {tt("Fonctionnement simple et efficace")}
            </p>
            <h1 className="mt-3 text-[34px] font-bold leading-tight tracking-tight">
              {tt("Comment ça marche ?")}
            </h1>
            <p className="mt-4 max-w-[440px] text-[14px] leading-[1.65] text-muted-foreground">
              {tt(
                "Sortlist facilite la mise en relation entre les entreprises et les agences grâce à un processus clair, intelligent et sécurisé.",
              )}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/inscription-client"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Building2 className="h-4 w-4" strokeWidth={1.8} />
                {tt("Je suis une entreprise")}
              </Link>
              <Link
                to="/agences"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-[13.5px] font-semibold transition-colors hover:bg-muted/40"
              >
                <Users2 className="h-4 w-4" strokeWidth={1.8} />
                {tt("Je suis une agence")}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 border-t border-border pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            {HERO_STEPS.map((step) => (
              <div key={step.label} className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border">
                  <step.icon className="h-4 w-4" strokeWidth={1.6} />
                </div>
                <p className="text-[10.5px] leading-[1.4] text-muted-foreground">{tt(step.label)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {tt("Deux parcours, un même objectif : de belles collaborations")}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {PATHS.map((path) => (
              <div key={path.title} className="rounded-lg border border-border p-6 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-border">
                  <path.icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 text-[15px] font-bold">{tt(path.title)}</h3>
                <p className="mt-1.5 text-[13px] leading-[1.5] text-muted-foreground">
                  {tt(path.description)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {tt("Le processus en 4 étapes clés")}
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto_1fr]">
            <div>
              <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {tt("Côté entreprise")}
              </p>
              <div className="mt-4 space-y-4">
                {COMPANY_STEPS.map((step, index) => (
                  <div key={step.title} className="rounded-lg border border-border p-4">
                    <div className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-[12px] font-bold">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-[13.5px] font-bold">
                          <step.icon className="h-4 w-4" strokeWidth={1.6} />
                          {tt(step.title)}
                        </p>
                        <p className="mt-1 text-[12.5px] leading-[1.5] text-muted-foreground">
                          {tt(step.description)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
                      <StepMock visual={step.visual} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex h-full items-center justify-center">
              <MatchingDiagram />
            </div>

            <div>
              <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {tt("Côté agence")}
              </p>
              <div className="mt-4 space-y-4">
                {AGENCY_STEPS.map((step, index) => (
                  <div key={step.title} className="rounded-lg border border-border p-4">
                    <div className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-[12px] font-bold">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-[13.5px] font-bold">
                          <step.icon className="h-4 w-4" strokeWidth={1.6} />
                          {tt(step.title)}
                        </p>
                        <p className="mt-1 text-[12.5px] leading-[1.5] text-muted-foreground">
                          {tt(step.description)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
                      <StepMock visual={step.visual} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {AFTER_MATCH.map((item) => (
              <div key={item.title} className="rounded-lg border border-border p-6 text-center">
                <h3 className="text-[14px] font-bold">{tt(item.title)}</h3>
                <p className="mt-2 text-[13px] leading-[1.5] text-muted-foreground">
                  {tt(item.description)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 pb-20">
          <h2 className="text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {tt("Pourquoi ça fonctionne si bien ?")}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {WHY_IT_WORKS.map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border">
                  <item.icon className="h-4 w-4" strokeWidth={1.6} />
                </div>
                <h3 className="mt-3 text-[13px] font-bold">{tt(item.title)}</h3>
                <p className="mt-1.5 text-[12px] leading-[1.5] text-muted-foreground">
                  {tt(item.description)}
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
          <p className="mx-auto mt-3 max-w-[520px] text-[14px] leading-[1.6] text-background/70">
            {tt(
              "Rejoignez les entreprises et agences qui rejoignent Sortlist pour collaborer plus simplement.",
            )}
          </p>
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
          <p className="mt-6 text-[12px] text-background/60">
            {tt("Gratuit · Sans engagement · Sans frais cachés")}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function MatchingDiagram() {
  const { tt } = usePageText(PAGE_TEXT);
  const center = 190;
  const radius = 150;

  return (
    <div className="relative" style={{ width: 380, height: 380, maxWidth: "100%" }}>
      <svg viewBox="0 0 380 380" className="absolute inset-0 h-full w-full">
        {MATCHING_ITEMS.map((item, index) => {
          const angle = ((index * 60 - 90) * Math.PI) / 180;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={item.label}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeWidth={1}
              className="text-border"
            />
          );
        })}
      </svg>

      {MATCHING_ITEMS.map((item, index) => {
        const angle = ((index * 60 - 90) * Math.PI) / 180;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return (
          <div
            key={item.label}
            className="absolute flex w-[74px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-lg border border-border bg-background p-2 text-center"
            style={{ left: x, top: y }}
          >
            <item.icon className="h-4 w-4" strokeWidth={1.6} />
            <span className="text-[10px] font-medium leading-tight">{tt(item.label)}</span>
          </div>
        );
      })}

      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-foreground text-center text-background">
        <Sparkles className="h-5 w-5" strokeWidth={1.6} />
        <p className="mt-1 text-[11px] font-bold leading-tight">{tt("MATCHING IA")}</p>
      </div>
    </div>
  );
}

function StepMock({ visual }: { visual: string }) {
  const { tt } = usePageText(PAGE_TEXT);

  if (visual === "form") {
    return (
      <div className="space-y-2">
        <p className="h-2 w-3/4 rounded bg-muted" />
        <p className="h-2 w-1/2 rounded bg-muted" />
        <p className="h-2 w-2/3 rounded bg-muted" />
        <span className="mt-1 inline-block rounded border border-border px-2.5 py-1 text-[10px] font-semibold">
          {tt("Soumettre")}
        </span>
      </div>
    );
  }

  if (visual === "ratings") {
    return (
      <div className="space-y-1.5">
        {["Agence A", "Agence B", "Agence C"].map((name) => (
          <div key={name} className="flex items-center justify-between text-[11px]">
            <span className="font-medium">{tt(name)}</span>
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
              ))}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (visual === "compare") {
    return (
      <div className="space-y-2">
        {["Compétences", "Disponibilité", "Budget"].map((label) => (
          <div key={label}>
            <p className="text-[10.5px] text-muted-foreground">{tt(label)}</p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/3 rounded-full bg-foreground" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (visual === "chat") {
    return (
      <div className="space-y-1.5">
        <p className="w-3/5 rounded-md border border-border px-2.5 py-1.5 text-[10.5px]">
          {tt("Proposition reçue")}
        </p>
        <p className="ml-auto w-2/5 rounded-md border border-border px-2.5 py-1.5 text-right text-[10.5px]">
          {tt("Acceptée")}
        </p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-3/4 rounded-full bg-foreground" />
        </div>
      </div>
    );
  }

  if (visual === "opportunity") {
    return (
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold">{tt("Nouveau projet reçu")}</p>
        <p className="h-2 w-2/3 rounded bg-muted" />
        <p className="h-2 w-1/2 rounded bg-muted" />
      </div>
    );
  }

  if (visual === "list") {
    return (
      <div className="space-y-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
            <p className="h-2 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold">
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.6} />
        {tt("Projet accepté")}
      </span>
      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
        75%
      </span>
    </div>
  );
}
