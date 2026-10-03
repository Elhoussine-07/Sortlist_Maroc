import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileText } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { useLocaleStore } from "@/store/locale.store";
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
  "Conditions d'utilisation": {
    en: "Terms of use",
    ar: "شروط الاستخدام",
    es: "Condiciones de uso",
  },
  "Dernière mise à jour :": {
    en: "Last updated:",
    ar: "آخر تحديث:",
    es: "Última actualización:",
  },
  "1. Objet": {
    en: "1. Purpose",
    ar: "1. الموضوع",
    es: "1. Objeto",
  },
  "Les présentes conditions régissent l'accès et l'utilisation de la plateforme Sortlist, qui met en relation des entreprises ayant des projets digitaux à réaliser et des agences prestataires de services. L'utilisation de la plateforme implique l'acceptation pleine et entière de ces conditions.":
    {
      en: "These terms govern access to and use of the Sortlist platform, which connects companies with digital projects to carry out with agencies providing services. Using the platform implies full and unconditional acceptance of these terms.",
      ar: "تحكم هذه الشروط الوصول إلى منصة Sortlist واستخدامها، وهي منصة تربط بين الشركات التي لديها مشاريع رقمية تود تنفيذها والوكالات مقدمة الخدمات. يفترض استخدام المنصة القبول الكامل وغير المشروط لهذه الشروط.",
      es: "Las presentes condiciones rigen el acceso y el uso de la plataforma Sortlist, que pone en contacto a empresas con proyectos digitales por realizar con agencias prestadoras de servicios. El uso de la plataforma implica la aceptación plena e incondicional de estas condiciones.",
    },
  "2. Inscription et compte": {
    en: "2. Registration and account",
    ar: "2. التسجيل والحساب",
    es: "2. Registro y cuenta",
  },
  "L'accès aux fonctionnalités de la plateforme nécessite la création d'un compte, en tant que client ou en tant qu'agence. Vous vous engagez à fournir des informations exactes et à jour, et à préserver la confidentialité de vos identifiants de connexion.":
    {
      en: "Access to the platform's features requires creating an account, either as a client or as an agency. You agree to provide accurate and up-to-date information, and to keep your login credentials confidential.",
      ar: "يتطلب الوصول إلى ميزات المنصة إنشاء حساب، سواء كعميل أو كوكالة. تلتزمون بتقديم معلومات دقيقة ومحدّثة، وبالحفاظ على سرية بيانات الدخول الخاصة بكم.",
      es: "El acceso a las funcionalidades de la plataforma requiere la creación de una cuenta, como cliente o como agencia. Te comprometes a proporcionar información exacta y actualizada, y a mantener la confidencialidad de tus credenciales de acceso.",
    },
  "3. Fonctionnement de la mise en relation": {
    en: "3. How the matching process works",
    ar: "3. آلية الربط بين الأطراف",
    es: "3. Funcionamiento de la puesta en contacto",
  },
  "Les clients publient des projets décrivant leur besoin. Les agences peuvent consulter ces projets et soumettre des devis. Sortlist facilite cette mise en relation mais n'est pas partie au contrat éventuellement conclu entre un client et une agence.":
    {
      en: "Clients publish projects describing their needs. Agencies can view these projects and submit quotes. Sortlist facilitates this matching process but is not a party to any contract subsequently entered into between a client and an agency.",
      ar: "ينشر العملاء مشاريع تصف احتياجاتهم. يمكن للوكالات الاطلاع على هذه المشاريع وتقديم عروض مالية. تُسهّل Sortlist عملية الربط هذه، لكنها ليست طرفًا في أي عقد يُبرم لاحقًا بين عميل ووكالة.",
      es: "Los clientes publican proyectos que describen su necesidad. Las agencias pueden consultar estos proyectos y enviar presupuestos. Sortlist facilita esta puesta en contacto, pero no es parte del contrato que eventualmente se celebre entre un cliente y una agencia.",
    },
  "4. Facturation et commission": {
    en: "4. Billing and commission",
    ar: "4. الفوترة والعمولة",
    es: "4. Facturación y comisión",
  },
  "Lorsqu'un projet publié sur la plateforme est remporté par une agence, une commission peut être due à Sortlist, selon les modalités indiquées dans l'espace de facturation de l'agence. Le non-règlement d'une facture dans les délais impartis peut entraîner la suspension temporaire de la publication de nouvelles offres.":
    {
      en: "When a project published on the platform is won by an agency, a commission may be owed to Sortlist, under the terms set out in the agency's billing area. Failure to pay an invoice within the specified timeframe may result in the temporary suspension of the agency's ability to submit new quotes.",
      ar: "عندما تفوز وكالة بمشروع منشور على المنصة، قد تكون هناك عمولة مستحقة لـ Sortlist، وفقًا للشروط المحددة في مساحة الفوترة الخاصة بالوكالة. قد يؤدي عدم سداد فاتورة في الآجال المحددة إلى تعليق مؤقت لإمكانية تقديم عروض جديدة.",
      es: "Cuando una agencia gana un proyecto publicado en la plataforma, puede adeudarse una comisión a Sortlist, según las condiciones indicadas en el espacio de facturación de la agencia. El impago de una factura dentro de los plazos establecidos puede dar lugar a la suspensión temporal de la publicación de nuevas ofertas.",
    },
  "5. Comportement des utilisateurs": {
    en: "5. User conduct",
    ar: "5. سلوك المستخدمين",
    es: "5. Comportamiento de los usuarios",
  },
  "Vous vous engagez à utiliser la plateforme de bonne foi, à ne pas publier de contenu trompeur, offensant ou illégal, et à respecter les autres utilisateurs. Sortlist se réserve le droit de modérer, suspendre ou supprimer tout compte ou contenu ne respectant pas ces règles.":
    {
      en: "You agree to use the platform in good faith, not to publish misleading, offensive or unlawful content, and to respect other users. Sortlist reserves the right to moderate, suspend or delete any account or content that does not comply with these rules.",
      ar: "تلتزمون باستخدام المنصة بحسن نية، وبعدم نشر أي محتوى مضلل أو مسيء أو غير قانوني، وباحترام المستخدمين الآخرين. تحتفظ Sortlist بالحق في مراقبة أو تعليق أو حذف أي حساب أو محتوى لا يتوافق مع هذه القواعد.",
      es: "Te comprometes a utilizar la plataforma de buena fe, a no publicar contenido engañoso, ofensivo o ilegal, y a respetar a los demás usuarios. Sortlist se reserva el derecho de moderar, suspender o eliminar cualquier cuenta o contenido que no respete estas normas.",
    },
  "6. Résiliation": {
    en: "6. Termination",
    ar: "6. إنهاء الحساب",
    es: "6. Resolución",
  },
  "Vous pouvez demander la clôture de votre compte à tout moment en contactant notre équipe. Sortlist peut également suspendre ou résilier un compte en cas de manquement grave aux présentes conditions.":
    {
      en: "You may request the closure of your account at any time by contacting our team. Sortlist may also suspend or terminate an account in the event of a serious breach of these terms.",
      ar: "يمكنكم طلب إغلاق حسابكم في أي وقت بالتواصل مع فريقنا. يمكن لـ Sortlist أيضًا تعليق أو إنهاء حساب في حال وقوع إخلال جسيم بهذه الشروط.",
      es: "Puedes solicitar el cierre de tu cuenta en cualquier momento contactando con nuestro equipo. Sortlist también puede suspender o rescindir una cuenta en caso de incumplimiento grave de las presentes condiciones.",
    },
  "7. Modification des conditions": {
    en: "7. Changes to these terms",
    ar: "7. تعديل الشروط",
    es: "7. Modificación de las condiciones",
  },
  "Sortlist peut être amené à modifier les présentes conditions. Les utilisateurs seront informés de toute modification substantielle, et la poursuite de l'utilisation de la plateforme vaudra acceptation des nouvelles conditions.":
    {
      en: "Sortlist may need to modify these terms. Users will be informed of any substantial change, and continued use of the platform will constitute acceptance of the new terms.",
      ar: "قد تضطر Sortlist إلى تعديل هذه الشروط. سيتم إعلام المستخدمين بأي تعديل جوهري، ويُعتبر استمرار استخدام المنصة بمثابة قبول للشروط الجديدة.",
      es: "Sortlist puede verse obligado a modificar las presentes condiciones. Los usuarios serán informados de cualquier modificación sustancial, y la continuación del uso de la plataforma supondrá la aceptación de las nuevas condiciones.",
    },
  "8. Contact": {
    en: "8. Contact",
    ar: "8. التواصل",
    es: "8. Contacto",
  },
  "Pour toute question relative aux présentes conditions, contactez-nous à": {
    en: "For any question about these terms, contact us at",
    ar: "لأي سؤال يتعلق بهذه الشروط، تواصلوا معنا على",
    es: "Para cualquier pregunta relacionada con estas condiciones, contáctanos en",
  },
} satisfies PageTextDict;

const LOCALE_TAGS: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-MA",
  es: "es-ES",
};

export const Route = createFileRoute("/conditions-utilisation")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — Sortlist" },
      {
        name: "description",
        content: "Les conditions d'utilisation de la plateforme Sortlist.",
      },
    ],
  }),
  component: TermsOfUsePage,
});

function TermsOfUsePage() {
  const { tt } = usePageText(PAGE_TEXT);
  const locale = useLocaleStore((state) => state.locale);
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
          <span className="text-foreground">{tt("Conditions d'utilisation")}</span>
        </nav>

        <div className="mt-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border">
            <FileText className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <h1 className="mt-5 text-[28px] font-bold tracking-tight">
            {tt("Conditions d'utilisation")}
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {tt("Dernière mise à jour :")}{" "}
            {new Date().toLocaleDateString(LOCALE_TAGS[locale] ?? "fr-FR", {
              year: "numeric",
              month: "long",
            })}
          </p>
        </div>

        <div className="mt-10 space-y-8 text-[13.5px] leading-[1.7] text-muted-foreground">
          <section>
            <h2 className="text-[15px] font-bold text-foreground">{tt("1. Objet")}</h2>
            <p className="mt-2">
              {tt(
                "Les présentes conditions régissent l'accès et l'utilisation de la plateforme Sortlist, qui met en relation des entreprises ayant des projets digitaux à réaliser et des agences prestataires de services. L'utilisation de la plateforme implique l'acceptation pleine et entière de ces conditions.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">
              {tt("2. Inscription et compte")}
            </h2>
            <p className="mt-2">
              {tt(
                "L'accès aux fonctionnalités de la plateforme nécessite la création d'un compte, en tant que client ou en tant qu'agence. Vous vous engagez à fournir des informations exactes et à jour, et à préserver la confidentialité de vos identifiants de connexion.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">
              {tt("3. Fonctionnement de la mise en relation")}
            </h2>
            <p className="mt-2">
              {tt(
                "Les clients publient des projets décrivant leur besoin. Les agences peuvent consulter ces projets et soumettre des devis. Sortlist facilite cette mise en relation mais n'est pas partie au contrat éventuellement conclu entre un client et une agence.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">
              {tt("4. Facturation et commission")}
            </h2>
            <p className="mt-2">
              {tt(
                "Lorsqu'un projet publié sur la plateforme est remporté par une agence, une commission peut être due à Sortlist, selon les modalités indiquées dans l'espace de facturation de l'agence. Le non-règlement d'une facture dans les délais impartis peut entraîner la suspension temporaire de la publication de nouvelles offres.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">
              {tt("5. Comportement des utilisateurs")}
            </h2>
            <p className="mt-2">
              {tt(
                "Vous vous engagez à utiliser la plateforme de bonne foi, à ne pas publier de contenu trompeur, offensant ou illégal, et à respecter les autres utilisateurs. Sortlist se réserve le droit de modérer, suspendre ou supprimer tout compte ou contenu ne respectant pas ces règles.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">{tt("6. Résiliation")}</h2>
            <p className="mt-2">
              {tt(
                "Vous pouvez demander la clôture de votre compte à tout moment en contactant notre équipe. Sortlist peut également suspendre ou résilier un compte en cas de manquement grave aux présentes conditions.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">
              {tt("7. Modification des conditions")}
            </h2>
            <p className="mt-2">
              {tt(
                "Sortlist peut être amené à modifier les présentes conditions. Les utilisateurs seront informés de toute modification substantielle, et la poursuite de l'utilisation de la plateforme vaudra acceptation des nouvelles conditions.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">{tt("8. Contact")}</h2>
            <p className="mt-2">
              {tt("Pour toute question relative aux présentes conditions, contactez-nous à")}{" "}
              <a
                href="mailto:contact@sortlistpro.com"
                className="text-foreground underline underline-offset-2"
              >
                contact@sortlistpro.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
