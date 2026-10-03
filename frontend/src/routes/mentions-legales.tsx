import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Scale } from "lucide-react";
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
  "Mentions légales": {
    en: "Legal notice",
    ar: "الإشعار القانوني",
    es: "Aviso legal",
  },
  "Dernière mise à jour :": {
    en: "Last updated:",
    ar: "آخر تحديث:",
    es: "Última actualización:",
  },
  "Éditeur du site": {
    en: "Site publisher",
    ar: "ناشر الموقع",
    es: "Editor del sitio",
  },
  "Le site Sortlist est édité par Sortlist Pro. Pour toute question relative à l'édition du site, vous pouvez contacter notre équipe à l'adresse":
    {
      en: "The Sortlist site is published by Sortlist Pro. For any question about the site's publication, you can contact our team at",
      ar: "موقع Sortlist منشور من قِبل Sortlist Pro. لأي سؤال يتعلق بنشر الموقع، يمكنكم التواصل مع فريقنا على العنوان",
      es: "El sitio Sortlist está publicado por Sortlist Pro. Para cualquier pregunta relacionada con la publicación del sitio, puedes contactar con nuestro equipo en",
    },
  "Hébergement": {
    en: "Hosting",
    ar: "الاستضافة",
    es: "Alojamiento",
  },
  "L'application et les données associées sont hébergées sur une infrastructure serveur dédiée, exploitée conformément aux standards usuels de sécurité et de disponibilité.":
    {
      en: "The application and its associated data are hosted on dedicated server infrastructure, operated in line with standard security and availability practices.",
      ar: "يتم استضافة التطبيق والبيانات المرتبطة به على بنية تحتية مخصصة للخوادم، يتم تشغيلها وفقًا للمعايير المعتادة للأمان والتوافر.",
      es: "La aplicación y los datos asociados se alojan en una infraestructura de servidores dedicada, operada conforme a los estándares habituales de seguridad y disponibilidad.",
    },
  "Propriété intellectuelle": {
    en: "Intellectual property",
    ar: "الملكية الفكرية",
    es: "Propiedad intelectual",
  },
  "L'ensemble des éléments présents sur le site (textes, graphismes, logos, interface) sont la propriété de Sortlist Pro ou de ses partenaires, sauf mention contraire, et sont protégés par le droit de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.":
    {
      en: "All elements on the site (text, graphics, logos, interface) are the property of Sortlist Pro or its partners, unless otherwise stated, and are protected by intellectual property law. Any reproduction without authorization is prohibited.",
      ar: "جميع العناصر الموجودة على الموقع (النصوص والرسومات والشعارات والواجهة) هي ملك لشركة Sortlist Pro أو شركائها، ما لم يُذكر خلاف ذلك، وهي محمية بموجب قانون الملكية الفكرية. يُمنع أي استنساخ دون إذن مسبق.",
      es: "Todos los elementos presentes en el sitio (textos, gráficos, logotipos, interfaz) son propiedad de Sortlist Pro o de sus socios, salvo indicación contraria, y están protegidos por el derecho de propiedad intelectual. Queda prohibida cualquier reproducción sin autorización.",
    },
  "Responsabilité": {
    en: "Liability",
    ar: "المسؤولية",
    es: "Responsabilidad",
  },
  "Sortlist agit en tant qu'intermédiaire de mise en relation entre entreprises et agences. Les contenus publiés par les utilisateurs (descriptions de projets, profils d'agence, avis) relèvent de leur seule responsabilité. Sortlist met en œuvre une modération raisonnable mais ne saurait être tenu responsable des contrats conclus entre un client et une agence.":
    {
      en: "Sortlist acts as an intermediary connecting companies and agencies. Content published by users (project descriptions, agency profiles, reviews) is their sole responsibility. Sortlist carries out reasonable moderation but cannot be held liable for contracts entered into between a client and an agency.",
      ar: "تعمل Sortlist كوسيط للربط بين الشركات والوكالات. تقع المحتويات التي ينشرها المستخدمون (أوصاف المشاريع، ملفات الوكالات، التقييمات) تحت مسؤوليتهم وحدهم. تطبّق Sortlist إشرافًا معقولًا لكنها لا تتحمل أي مسؤولية عن العقود المبرمة بين عميل ووكالة.",
      es: "Sortlist actúa como intermediario para poner en contacto a empresas y agencias. Los contenidos publicados por los usuarios (descripciones de proyectos, perfiles de agencia, reseñas) son de su exclusiva responsabilidad. Sortlist aplica una moderación razonable, pero no puede ser considerado responsable de los contratos celebrados entre un cliente y una agencia.",
    },
  "Contact": {
    en: "Contact",
    ar: "التواصل",
    es: "Contacto",
  },
  "Pour toute question relative aux présentes mentions légales, vous pouvez nous écrire à": {
    en: "For any question about this legal notice, you can write to us at",
    ar: "لأي سؤال يتعلق بهذا الإشعار القانوني، يمكنكم مراسلتنا على",
    es: "Para cualquier pregunta relacionada con este aviso legal, puedes escribirnos a",
  },
} satisfies PageTextDict;

const LOCALE_TAGS: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-MA",
  es: "es-ES",
};

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — Sortlist" },
      {
        name: "description",
        content: "Mentions légales de la plateforme Sortlist.",
      },
    ],
  }),
  component: LegalNoticePage,
});

function LegalNoticePage() {
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
          <span className="text-foreground">{tt("Mentions légales")}</span>
        </nav>

        <div className="mt-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border">
            <Scale className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <h1 className="mt-5 text-[28px] font-bold tracking-tight">{tt("Mentions légales")}</h1>
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
            <h2 className="text-[15px] font-bold text-foreground">{tt("Éditeur du site")}</h2>
            <p className="mt-2">
              {tt(
                "Le site Sortlist est édité par Sortlist Pro. Pour toute question relative à l'édition du site, vous pouvez contacter notre équipe à l'adresse",
              )}{" "}
              <a
                href="mailto:contact@sortlistpro.com"
                className="text-foreground underline underline-offset-2"
              >
                contact@sortlistpro.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">{tt("Hébergement")}</h2>
            <p className="mt-2">
              {tt(
                "L'application et les données associées sont hébergées sur une infrastructure serveur dédiée, exploitée conformément aux standards usuels de sécurité et de disponibilité.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">
              {tt("Propriété intellectuelle")}
            </h2>
            <p className="mt-2">
              {tt(
                "L'ensemble des éléments présents sur le site (textes, graphismes, logos, interface) sont la propriété de Sortlist Pro ou de ses partenaires, sauf mention contraire, et sont protégés par le droit de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">{tt("Responsabilité")}</h2>
            <p className="mt-2">
              {tt(
                "Sortlist agit en tant qu'intermédiaire de mise en relation entre entreprises et agences. Les contenus publiés par les utilisateurs (descriptions de projets, profils d'agence, avis) relèvent de leur seule responsabilité. Sortlist met en œuvre une modération raisonnable mais ne saurait être tenu responsable des contrats conclus entre un client et une agence.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">{tt("Contact")}</h2>
            <p className="mt-2">
              {tt(
                "Pour toute question relative aux présentes mentions légales, vous pouvez nous écrire à",
              )}{" "}
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
