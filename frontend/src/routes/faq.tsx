import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Sortlist" },
      {
        name: "description",
        content:
          "Les réponses aux questions les plus fréquentes sur la mise en relation entre clients et agences sur Sortlist.",
      },
    ],
  }),
  component: FaqPage,
});

const FAQ_SECTIONS: Array<{
  title: string;
  items: Array<{ question: string; answer: string }>;
}> = [
  {
    title: "Pour les entreprises",
    items: [
      {
        question: "Comment publier un projet ?",
        answer:
          "Depuis votre espace client, cliquez sur « Postuler un projet », décrivez votre besoin (objectif, budget, délais) et publiez-le. Les agences pertinentes peuvent alors vous envoyer un devis.",
      },
      {
        question: "Est-ce gratuit de publier un projet ?",
        answer:
          "Oui, la publication d'un projet et la réception de devis sont entièrement gratuites pour les entreprises.",
      },
      {
        question: "Comment choisir la bonne agence ?",
        answer:
          "Comparez les devis reçus, consultez les profils d'agences (avis, spécialités, portfolio) et échangez directement via la messagerie avant de faire votre choix.",
      },
      {
        question: "Que se passe-t-il si une agence ne répond pas à temps ?",
        answer:
          "Chaque devis a un délai de réponse. Passé ce délai, vous recevez un rappel, puis le projet peut être automatiquement suspendu ou rouvert à d'autres agences si aucune décision n'est prise.",
      },
    ],
  },
  {
    title: "Pour les agences",
    items: [
      {
        question: "Comment être visible auprès des clients ?",
        answer:
          "Complétez votre profil d'agence (spécialités, zone géographique, portfolio) : plus il est détaillé, plus notre moteur de correspondance pourra vous recommander sur les projets pertinents.",
      },
      {
        question: "Qu'est-ce que l'indice de qualité de profil (PQI) ?",
        answer:
          "Le PQI mesure la complétude et la fiabilité de votre profil (informations renseignées, réactivité, avis clients). Un PQI élevé améliore votre position dans les recommandations.",
      },
      {
        question: "Comment fonctionne la commission sur les projets gagnés ?",
        answer:
          "Une commission est facturée uniquement lorsqu'un projet est gagné et validé. Le détail (montant, échéance) est indiqué sur chaque facture dans votre espace de facturation.",
      },
      {
        question: "Que se passe-t-il en cas de facture impayée ?",
        answer:
          "Des rappels automatiques sont envoyés avant et après échéance. En cas de retard prolongé, la publication de nouvelles offres peut être temporairement suspendue jusqu'à régularisation.",
      },
    ],
  },
  {
    title: "Compte et sécurité",
    items: [
      {
        question: "Comment modifier mes informations de compte ?",
        answer:
          "Rendez-vous dans la section « Profil » de votre tableau de bord pour mettre à jour vos informations à tout moment.",
      },
      {
        question: "Mes échanges sont-ils confidentiels ?",
        answer:
          "Oui, les messages et documents échangés entre un client et une agence ne sont visibles que par les parties concernées et notre équipe de modération en cas de litige.",
      },
    ],
  },
];

const PAGE_TEXT = {
  "Pour les entreprises": {
    en: "For businesses",
    ar: "للشركات",
    es: "Para empresas",
  },
  "Comment publier un projet ?": {
    en: "How do I post a project?",
    ar: "كيف أنشر مشروعًا؟",
    es: "¿Cómo publico un proyecto?",
  },
  "Depuis votre espace client, cliquez sur « Postuler un projet », décrivez votre besoin (objectif, budget, délais) et publiez-le. Les agences pertinentes peuvent alors vous envoyer un devis.":
    {
      en: "From your client dashboard, click \"Submit a project\", describe your needs (goal, budget, timeline), and publish it. Relevant agencies can then send you a quote.",
      ar: "من مساحة العميل الخاصة بك، انقر على «تقديم مشروع»، صف احتياجك (الهدف، الميزانية، الآجال) ثم انشره. يمكن للوكالات المناسبة بعد ذلك إرسال عرض سعر لك.",
      es: "Desde tu panel de cliente, haz clic en «Enviar un proyecto», describe tu necesidad (objetivo, presupuesto, plazos) y publícalo. Las agencias relevantes podrán entonces enviarte un presupuesto.",
    },
  "Est-ce gratuit de publier un projet ?": {
    en: "Is it free to post a project?",
    ar: "هل نشر مشروع مجاني؟",
    es: "¿Es gratis publicar un proyecto?",
  },
  "Oui, la publication d'un projet et la réception de devis sont entièrement gratuites pour les entreprises.":
    {
      en: "Yes, posting a project and receiving quotes is entirely free for businesses.",
      ar: "نعم، نشر مشروع واستلام عروض الأسعار مجاني تمامًا للشركات.",
      es: "Sí, publicar un proyecto y recibir presupuestos es totalmente gratuito para las empresas.",
    },
  "Comment choisir la bonne agence ?": {
    en: "How do I choose the right agency?",
    ar: "كيف أختار الوكالة المناسبة؟",
    es: "¿Cómo elijo la agencia adecuada?",
  },
  "Comparez les devis reçus, consultez les profils d'agences (avis, spécialités, portfolio) et échangez directement via la messagerie avant de faire votre choix.":
    {
      en: "Compare the quotes you receive, review agency profiles (reviews, specialties, portfolio), and chat directly via messaging before making your decision.",
      ar: "قارن عروض الأسعار المستلمة، واطّلع على ملفات الوكالات (التقييمات، التخصصات، الأعمال السابقة)، وتواصل مباشرة عبر الرسائل قبل اتخاذ قرارك.",
      es: "Compara los presupuestos recibidos, consulta los perfiles de las agencias (reseñas, especialidades, portafolio) y conversa directamente por mensajería antes de tomar tu decisión.",
    },
  "Que se passe-t-il si une agence ne répond pas à temps ?": {
    en: "What happens if an agency doesn't respond in time?",
    ar: "ماذا يحدث إذا لم ترد الوكالة في الوقت المحدد؟",
    es: "¿Qué ocurre si una agencia no responde a tiempo?",
  },
  "Chaque devis a un délai de réponse. Passé ce délai, vous recevez un rappel, puis le projet peut être automatiquement suspendu ou rouvert à d'autres agences si aucune décision n'est prise.":
    {
      en: "Every quote has a response deadline. Once it passes, you'll receive a reminder, and the project may be automatically suspended or reopened to other agencies if no decision is made.",
      ar: "لكل عرض سعر مهلة للرد. بعد انتهاء هذه المهلة، ستتلقى تذكيرًا، وقد يتم تعليق المشروع تلقائيًا أو إعادة فتحه لوكالات أخرى في حال عدم اتخاذ قرار.",
      es: "Cada presupuesto tiene un plazo de respuesta. Una vez transcurrido, recibirás un recordatorio y el proyecto podrá suspenderse automáticamente o reabrirse a otras agencias si no se toma ninguna decisión.",
    },
  "Pour les agences": {
    en: "For agencies",
    ar: "للوكالات",
    es: "Para agencias",
  },
  "Comment être visible auprès des clients ?": {
    en: "How can I get visibility with clients?",
    ar: "كيف أكون مرئيًا لدى العملاء؟",
    es: "¿Cómo puedo ganar visibilidad ante los clientes?",
  },
  "Complétez votre profil d'agence (spécialités, zone géographique, portfolio) : plus il est détaillé, plus notre moteur de correspondance pourra vous recommander sur les projets pertinents.":
    {
      en: "Complete your agency profile (specialties, geographic area, portfolio): the more detailed it is, the more our matching engine can recommend you for relevant projects.",
      ar: "أكمل ملف وكالتك (التخصصات، المنطقة الجغرافية، الأعمال السابقة): كلما كان أكثر تفصيلاً، زادت قدرة محرك المطابقة لدينا على التوصية بك للمشاريع المناسبة.",
      es: "Completa el perfil de tu agencia (especialidades, zona geográfica, portafolio): cuanto más detallado esté, más podrá recomendarte nuestro motor de emparejamiento para proyectos relevantes.",
    },
  "Qu'est-ce que l'indice de qualité de profil (PQI) ?": {
    en: "What is the Profile Quality Index (PQI)?",
    ar: "ما هو مؤشر جودة الملف الشخصي (PQI)؟",
    es: "¿Qué es el Índice de Calidad de Perfil (PQI)?",
  },
  "Le PQI mesure la complétude et la fiabilité de votre profil (informations renseignées, réactivité, avis clients). Un PQI élevé améliore votre position dans les recommandations.":
    {
      en: "The PQI measures the completeness and reliability of your profile (information provided, responsiveness, client reviews). A high PQI improves your ranking in recommendations.",
      ar: "يقيس مؤشر جودة الملف الشخصي مدى اكتمال ملفك وموثوقيته (المعلومات المدخلة، سرعة الاستجابة، تقييمات العملاء). المؤشر المرتفع يحسّن ترتيبك في التوصيات.",
      es: "El PQI mide la integridad y la fiabilidad de tu perfil (información proporcionada, capacidad de respuesta, reseñas de clientes). Un PQI alto mejora tu posición en las recomendaciones.",
    },
  "Comment fonctionne la commission sur les projets gagnés ?": {
    en: "How does the commission on won projects work?",
    ar: "كيف تعمل العمولة على المشاريع الفائزة؟",
    es: "¿Cómo funciona la comisión sobre los proyectos ganados?",
  },
  "Une commission est facturée uniquement lorsqu'un projet est gagné et validé. Le détail (montant, échéance) est indiqué sur chaque facture dans votre espace de facturation.":
    {
      en: "A commission is only charged once a project is won and validated. The details (amount, due date) are shown on each invoice in your billing space.",
      ar: "يتم احتساب العمولة فقط عندما يتم الفوز بالمشروع واعتماده. تظهر التفاصيل (المبلغ، تاريخ الاستحقاق) في كل فاتورة ضمن مساحة الفوترة الخاصة بك.",
      es: "Solo se cobra una comisión cuando un proyecto se gana y se valida. Los detalles (importe, vencimiento) se indican en cada factura dentro de tu espacio de facturación.",
    },
  "Que se passe-t-il en cas de facture impayée ?": {
    en: "What happens if an invoice is unpaid?",
    ar: "ماذا يحدث في حالة عدم سداد فاتورة؟",
    es: "¿Qué ocurre si una factura queda impaga?",
  },
  "Des rappels automatiques sont envoyés avant et après échéance. En cas de retard prolongé, la publication de nouvelles offres peut être temporairement suspendue jusqu'à régularisation.":
    {
      en: "Automatic reminders are sent before and after the due date. In case of extended delay, posting new offers may be temporarily suspended until the account is settled.",
      ar: "يتم إرسال تذكيرات تلقائية قبل وبعد تاريخ الاستحقاق. في حالة التأخر لفترة طويلة، قد يتم تعليق نشر عروض جديدة مؤقتًا حتى تسوية الوضع.",
      es: "Se envían recordatorios automáticos antes y después del vencimiento. En caso de retraso prolongado, la publicación de nuevas ofertas puede suspenderse temporalmente hasta regularizar la situación.",
    },
  "Compte et sécurité": {
    en: "Account and security",
    ar: "الحساب والأمان",
    es: "Cuenta y seguridad",
  },
  "Comment modifier mes informations de compte ?": {
    en: "How do I update my account information?",
    ar: "كيف أعدّل معلومات حسابي؟",
    es: "¿Cómo modifico la información de mi cuenta?",
  },
  "Rendez-vous dans la section « Profil » de votre tableau de bord pour mettre à jour vos informations à tout moment.":
    {
      en: "Go to the \"Profile\" section of your dashboard to update your information at any time.",
      ar: "توجّه إلى قسم «الملف الشخصي» في لوحة التحكم الخاصة بك لتحديث معلوماتك في أي وقت.",
      es: "Ve a la sección «Perfil» de tu panel para actualizar tu información en cualquier momento.",
    },
  "Mes échanges sont-ils confidentiels ?": {
    en: "Are my exchanges confidential?",
    ar: "هل محادثاتي سرية؟",
    es: "¿Mis intercambios son confidenciales?",
  },
  "Oui, les messages et documents échangés entre un client et une agence ne sont visibles que par les parties concernées et notre équipe de modération en cas de litige.":
    {
      en: "Yes, messages and documents exchanged between a client and an agency are only visible to the parties involved and our moderation team in the event of a dispute.",
      ar: "نعم، الرسائل والمستندات المتبادلة بين العميل والوكالة لا يراها سوى الأطراف المعنية وفريق الإشراف لدينا في حال نشوء نزاع.",
      es: "Sí, los mensajes y documentos intercambiados entre un cliente y una agencia solo son visibles para las partes implicadas y nuestro equipo de moderación en caso de disputa.",
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
  "Questions fréquentes": {
    en: "Frequently asked questions",
    ar: "الأسئلة الشائعة",
    es: "Preguntas frecuentes",
  },
  "Vous ne trouvez pas de réponse à votre question ?": {
    en: "Can't find an answer to your question?",
    ar: "لم تجد إجابة لسؤالك؟",
    es: "¿No encuentras respuesta a tu pregunta?",
  },
  "Contactez notre équipe": {
    en: "Contact our team",
    ar: "تواصل مع فريقنا",
    es: "Contacta a nuestro equipo",
  },
} satisfies PageTextDict;

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const { tt } = usePageText(PAGE_TEXT);

  return (
    <div className="border-b border-border py-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="text-[14.5px] font-semibold">{tt(question)}</span>
        <ChevronRight
          className={
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform " +
            (open ? "rotate-90" : "")
          }
          strokeWidth={1.8}
        />
      </button>
      {open ? (
        <p className="mt-3 text-[13.5px] leading-[1.65] text-muted-foreground">{tt(answer)}</p>
      ) : null}
    </div>
  );
}

function FaqPage() {
  const { tt } = usePageText(PAGE_TEXT);
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader variant="landing" />

      <main className="mx-auto max-w-[760px] px-4 pb-20 sm:px-6 lg:px-8">
        <nav
          aria-label={tt("Fil d'ariane")}
          className="flex items-center gap-2 pt-6 text-[13px] text-muted-foreground"
        >
          <Link to="/" className="transition-colors hover:text-foreground">
            {tt("Accueil")}
          </Link>
          <ChevronRight className="h-3 w-3" strokeWidth={1.8} />
          <span className="text-foreground">FAQ</span>
        </nav>

        <div className="mt-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border">
            <HelpCircle className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <h1 className="mt-5 text-[30px] font-bold tracking-tight">{tt("Questions fréquentes")}</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            {tt("Vous ne trouvez pas de réponse à votre question ?")}{" "}
            <a
              href="mailto:contact@sortlistpro.com"
              className="font-semibold text-foreground underline underline-offset-2"
            >
              {tt("Contactez notre équipe")}
            </a>
            .
          </p>
        </div>

        <div className="mt-12 space-y-10">
          {FAQ_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {tt(section.title)}
              </h2>
              <div className="mt-2">
                {section.items.map((item) => (
                  <FaqItem key={item.question} question={item.question} answer={item.answer} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
