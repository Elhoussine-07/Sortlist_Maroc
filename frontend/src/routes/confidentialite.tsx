import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, ShieldCheck } from "lucide-react";
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
  "Politique de confidentialité": {
    en: "Privacy policy",
    ar: "سياسة الخصوصية",
    es: "Política de privacidad",
  },
  "Dernière mise à jour :": {
    en: "Last updated:",
    ar: "آخر تحديث:",
    es: "Última actualización:",
  },
  "Données collectées": {
    en: "Data we collect",
    ar: "البيانات التي يتم جمعها",
    es: "Datos recopilados",
  },
  "Lors de la création de votre compte et de l'utilisation de la plateforme, nous collectons les données que vous nous transmettez directement (identité, coordonnées, informations de profil, contenu des projets et des devis) ainsi que certaines données techniques nécessaires au fonctionnement du service (adresse IP, journaux de connexion, préférences).":
    {
      en: "When you create your account and use the platform, we collect the data you provide us directly (identity, contact details, profile information, project and quote content) as well as certain technical data necessary for the service to run (IP address, connection logs, preferences).",
      ar: "عند إنشاء حسابك واستخدام المنصة، نقوم بجمع البيانات التي تقدمونها لنا مباشرة (الهوية، معلومات الاتصال، معلومات الملف الشخصي، محتوى المشاريع والعروض المالية) بالإضافة إلى بعض البيانات التقنية اللازمة لتشغيل الخدمة (عنوان IP، سجلات الاتصال، التفضيلات).",
      es: "Al crear tu cuenta y utilizar la plataforma, recopilamos los datos que nos facilitas directamente (identidad, datos de contacto, información del perfil, contenido de proyectos y presupuestos), así como ciertos datos técnicos necesarios para el funcionamiento del servicio (dirección IP, registros de conexión, preferencias).",
    },
  "Utilisation des données": {
    en: "How we use your data",
    ar: "استخدام البيانات",
    es: "Uso de los datos",
  },
  "Vos données sont utilisées pour :": {
    en: "Your data is used to:",
    ar: "تُستخدم بياناتكم من أجل:",
    es: "Tus datos se utilizan para:",
  },
  "Mettre en relation les clients et les agences sur la plateforme ;": {
    en: "Connect clients and agencies on the platform;",
    ar: "الربط بين العملاء والوكالات على المنصة؛",
    es: "Poner en contacto a clientes y agencias en la plataforma;",
  },
  "Améliorer la pertinence des recommandations et du moteur de correspondance ;": {
    en: "Improve the relevance of recommendations and the matching engine;",
    ar: "تحسين دقة التوصيات ومحرك المطابقة؛",
    es: "Mejorar la relevancia de las recomendaciones y del motor de compatibilidad;",
  },
  "Vous envoyer les notifications liées à vos projets, devis et factures ;": {
    en: "Send you notifications related to your projects, quotes and invoices;",
    ar: "إرسال الإشعارات المتعلقة بمشاريعكم وعروضكم وفواتيركم؛",
    es: "Enviarte notificaciones relacionadas con tus proyectos, presupuestos y facturas;",
  },
  "Assurer la sécurité du service et prévenir les usages frauduleux.": {
    en: "Ensure the security of the service and prevent fraudulent use.",
    ar: "ضمان أمان الخدمة ومنع الاستخدامات الاحتيالية.",
    es: "Garantizar la seguridad del servicio y prevenir usos fraudulentos.",
  },
  "Partage des données": {
    en: "Data sharing",
    ar: "مشاركة البيانات",
    es: "Compartición de datos",
  },
  "Vos données ne sont partagées qu'avec les autres utilisateurs strictement nécessaires à l'exécution du service (par exemple, un client et l'agence avec laquelle il échange sur un projet donné). Elles ne sont jamais vendues à des tiers.":
    {
      en: "Your data is only shared with the other users strictly necessary to carry out the service (for example, a client and the agency they are discussing a given project with). It is never sold to third parties.",
      ar: "لا تتم مشاركة بياناتكم إلا مع المستخدمين الآخرين الضروريين فعليًا لتنفيذ الخدمة (على سبيل المثال، عميل والوكالة التي يتبادل معها حول مشروع معين). لا يتم بيعها أبدًا لأطراف ثالثة.",
      es: "Tus datos solo se comparten con los demás usuarios estrictamente necesarios para la ejecución del servicio (por ejemplo, un cliente y la agencia con la que intercambia información sobre un proyecto concreto). Nunca se venden a terceros.",
    },
  "Conservation des données": {
    en: "Data retention",
    ar: "الاحتفاظ بالبيانات",
    es: "Conservación de los datos",
  },
  "Vos données sont conservées pendant la durée de vie de votre compte, puis archivées ou supprimées conformément aux obligations légales applicables (notamment comptables et fiscales pour les données de facturation).":
    {
      en: "Your data is kept for as long as your account is active, then archived or deleted in accordance with applicable legal obligations (notably accounting and tax obligations for billing data).",
      ar: "يتم الاحتفاظ ببياناتكم طوال مدة نشاط حسابكم، ثم يتم أرشفتها أو حذفها وفقًا للالتزامات القانونية المعمول بها (ولا سيما المحاسبية والضريبية بالنسبة لبيانات الفوترة).",
      es: "Tus datos se conservan mientras tu cuenta esté activa, y después se archivan o eliminan conforme a las obligaciones legales aplicables (en particular las contables y fiscales relativas a los datos de facturación).",
    },
  "Vos droits": {
    en: "Your rights",
    ar: "حقوقكم",
    es: "Tus derechos",
  },
  "Conformément à la réglementation applicable en matière de protection des données, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Vous pouvez exercer ces droits en nous contactant à":
    {
      en: "In accordance with applicable data protection regulations, you have the right to access, rectify, delete and port your data. You can exercise these rights by contacting us at",
      ar: "وفقًا للتنظيمات المعمول بها في مجال حماية البيانات، يحق لكم الوصول إلى بياناتكم وتصحيحها وحذفها ونقلها. يمكنكم ممارسة هذه الحقوق بالتواصل معنا على",
      es: "De conformidad con la normativa aplicable en materia de protección de datos, dispones de un derecho de acceso, rectificación, supresión y portabilidad de tus datos. Puedes ejercer estos derechos contactándonos en",
    },
  "Sécurité": {
    en: "Security",
    ar: "الأمان",
    es: "Seguridad",
  },
  "Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables (chiffrement des échanges, contrôle d'accès) pour protéger vos données contre l'accès, la modification ou la divulgation non autorisés.":
    {
      en: "We implement reasonable technical and organizational measures (encryption of exchanges, access control) to protect your data against unauthorized access, modification or disclosure.",
      ar: "نطبق تدابير تقنية وتنظيمية معقولة (تشفير الاتصالات، التحكم في الوصول) لحماية بياناتكم من الوصول أو التعديل أو الإفصاح غير المصرح به.",
      es: "Aplicamos medidas técnicas y organizativas razonables (cifrado de las comunicaciones, control de acceso) para proteger tus datos frente al acceso, la modificación o la divulgación no autorizados.",
    },
} satisfies PageTextDict;

const LOCALE_TAGS: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-MA",
  es: "es-ES",
};

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Sortlist" },
      {
        name: "description",
        content: "Comment Sortlist collecte, utilise et protège vos données personnelles.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader variant="landing" />

      <main className="mx-auto max-w-[760px] px-4 pb-20 sm:px-6 lg:px-8">
        <nav
          aria-label="Fil d'ariane"
          className="flex items-center gap-2 pt-6 text-[13px] text-muted-foreground"
        >
          <Link to="/" className="transition-colors hover:text-foreground">
            Accueil
          </Link>
          <ChevronRight className="h-3 w-3" strokeWidth={1.8} />
          <span className="text-foreground">Politique de confidentialité</span>
        </nav>

        <div className="mt-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <h1 className="mt-5 text-[28px] font-bold tracking-tight">
            Politique de confidentialité
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Dernière mise à jour :{" "}
            {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
          </p>
        </div>

        <div className="mt-10 space-y-8 text-[13.5px] leading-[1.7] text-muted-foreground">
          <section>
            <h2 className="text-[15px] font-bold text-foreground">Données collectées</h2>
            <p className="mt-2">
              Lors de la création de votre compte et de l'utilisation de la plateforme, nous
              collectons les données que vous nous transmettez directement (identité, coordonnées,
              informations de profil, contenu des projets et des devis) ainsi que certaines données
              techniques nécessaires au fonctionnement du service (adresse IP, journaux de
              connexion, préférences).
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">Utilisation des données</h2>
            <p className="mt-2">Vos données sont utilisées pour :</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Mettre en relation les clients et les agences sur la plateforme ;</li>
              <li>Améliorer la pertinence des recommandations et du moteur de correspondance ;</li>
              <li>Vous envoyer les notifications liées à vos projets, devis et factures ;</li>
              <li>Assurer la sécurité du service et prévenir les usages frauduleux.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">Partage des données</h2>
            <p className="mt-2">
              Vos données ne sont partagées qu'avec les autres utilisateurs strictement nécessaires
              à l'exécution du service (par exemple, un client et l'agence avec laquelle il échange
              sur un projet donné). Elles ne sont jamais vendues à des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">Conservation des données</h2>
            <p className="mt-2">
              Vos données sont conservées pendant la durée de vie de votre compte, puis archivées ou
              supprimées conformément aux obligations légales applicables (notamment comptables et
              fiscales pour les données de facturation).
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">Vos droits</h2>
            <p className="mt-2">
              Conformément à la réglementation applicable en matière de protection des données, vous
              disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos
              données. Vous pouvez exercer ces droits en nous contactant à{" "}
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
            <h2 className="text-[15px] font-bold text-foreground">Sécurité</h2>
            <p className="mt-2">
              Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables
              (chiffrement des échanges, contrôle d'accès) pour protéger vos données contre l'accès,
              la modification ou la divulgation non autorisés.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
