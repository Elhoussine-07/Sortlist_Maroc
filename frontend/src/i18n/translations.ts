import type { Locale } from "@/store/locale.store";

type Dict = { [key: string]: string | string[] | Dict[] | Dict };

const fr = {
  common: {
    login: "Se connecter",
    dashboard: "Mon tableau de bord",
    account: "Mon compte",
    menu: "Menu",
  },
  header: {
    features: "Fonctionnalités",
    howItWorks: "Comment ça marche",
    about: "À propos",
    findAgency: "Trouvez l'agence idéale",
    findProject: "Trouvez le projet idéal",
    applyProject: "Postuler un projet",
  },
  footer: {
    tagline:
      "Une nouvelle manière de connecter les entreprises et de créer des opportunités B2B durables.",
    platform: "Plateforme",
    findAgency: "Trouver l'agence idéale",
    findProject: "Trouver le projet idéal",
    postProject: "Poster un projet",
    services: "Services couverts",
    howItWorks: "Comment ça marche",
    providers: "Pour les prestataires",
    howItWorksProvider: "Comment ça fonctionne",
    listAgency: "Lister mon agence",
    pricing: "Prix",
    resources: "Ressources et conseils",
    becomePartner: "Devenir partenaire",
    resourcesTitle: "Ressources",
    blog: "Blog",
    guides: "Guides et tutoriels",
    studies: "Études et rapports",
    faq: "FAQ",
    helpCenter: "Centre d'aide",
    company: "Entreprise",
    about: "À propos",
    vision: "Notre vision",
    careers: "Carrières",
    press: "Presse",
    contact: "Contact",
    stayInformed: "Restez informé",
    stayInformedDesc:
      "Pour toute actualité ou question, notre équipe reste joignable directement par e-mail.",
    needHelp: "Besoin d'aide ?",
    needHelpDesc: "Notre équipe est là pour vous aider.",
    contactUs: "Nous contacter →",
    rights: "Tous droits réservés.",
    legal: "Mentions légales",
    privacy: "Politique de confidentialité",
    terms: "Conditions d'utilisation",
  },
  home: {
    metaTitle: "Sortlist — La plateforme B2B projets & agences",
    metaDescription:
      "Trouvez, collaborez et réussissez avec les agences les plus adaptées à vos besoins. Sortlist simplifie chaque étape.",
    badge: "Nouvelle version disponible",
    heroTitle: "La plateforme B2B qui connecte vos projets aux",
    heroTitleHighlight: "meilleures agences",
    heroSubtitle:
      "Trouvez, collaborez et réussissez avec les agences les plus adaptées à vos besoins. Que vous soyez une entreprise ou une agence, Sortlist simplifie chaque étape.",
    createAccount: "Créer mon compte gratuitement",
    login: "Se connecter",
    audiences: {
      companies: { title: "Entreprises", description: "Trouvez l'agence parfaite pour vos projets." },
      agencies: {
        title: "Agences",
        description: "Trouvez les projets qui correspondent à votre expertise.",
      },
      security: {
        title: "Sécurité",
        description: "Une collaboration transparente et en toute confiance.",
      },
    },
    twoActorsTitle: "Une plateforme, deux acteurs.",
    twoActors: {
      company: {
        title: "Vous êtes une entreprise",
        description: "Décrivez votre projet et trouvez les agences idéales.",
        points: [
          "Briefing guidé en quelques étapes",
          "Agences pré-qualifiées",
          "Recevez et comparez les propositions",
          "Choisissez votre partenaire",
        ],
        ctaLabel: "Découvrir pour les entreprises",
      },
      agency: {
        title: "Vous êtes une agence",
        description: "Recevez des projets qualifiés et développez votre activité.",
        points: [
          "Opportunités ciblées",
          "Matching avec vos expertises",
          "Répondez aux projets",
          "Développez votre réseau",
        ],
        ctaLabel: "Découvrir pour les agences",
      },
    },
    whyTitle: "Pourquoi choisir Sortlist ?",
    whySubtitle: "Des fonctionnalités conçues pour simplifier vos collaborations.",
    advantages: {
      "matching-intelligent": {
        title: "Matching intelligent",
        description:
          "Notre IA analyse vos besoins et votre expertise pour vous proposer les meilleurs partenaires ou projets. Elle identifie les agences ou projets les plus pertinents en fonction de leur expertise, de leurs réalisations passées et de leur compatibilité avec vos critères.",
        benefits: [
          {
            title: "Des recommandations ultra-ciblées",
            description:
              "Recevez uniquement des suggestions pertinentes et alignées avec vos objectifs, sans avoir à trier des dizaines de profils non adaptés.",
          },
          {
            title: "Gain de temps considérable",
            description:
              "Fini les recherches interminables : notre IA fait le travail pour vous et vous présente directement les meilleurs candidats.",
          },
          {
            title: "Meilleure qualité de collaboration",
            description:
              "Connectez-vous avec les partenaires ou projets qui partagent vos valeurs, votre secteur et votre vision du travail.",
          },
        ],
        mockLabels: ["Agence A", "Agence B", "Agence C"],
      },
      "projets-cibles": {
        title: "Projets ciblés",
        description:
          "Accédez à des projets qualifiés et pertinents, adaptés à vos compétences et à vos objectifs. Fini les candidatures envoyées à l'aveugle.",
        benefits: [
          {
            title: "Des projets réellement adaptés",
            description:
              "Chaque opportunité affichée correspond à votre secteur, votre expertise et votre budget de prédilection.",
          },
          {
            title: "Moins de candidatures, plus de résultats",
            description:
              "Concentrez vos efforts sur les projets où vous avez de vraies chances d'être sélectionné.",
          },
          {
            title: "Visibilité sur les critères clés",
            description:
              "Budget, délais, secteur d'activité : toutes les informations essentielles sont visibles avant de postuler.",
          },
        ],
        mockLabels: ["Refonte site web", "Campagne marketing", "Identité de marque"],
      },
      "collaboration-simplifiee": {
        title: "Collaboration simplifiée",
        description:
          "Outils intégrés pour gérer vos échanges, vos fichiers, et vos suivis de projet efficacement, du premier contact jusqu'à la livraison finale.",
        benefits: [
          {
            title: "Une communication centralisée",
            description:
              "Messages, fichiers et validations restent regroupés au même endroit, sans dispersion entre emails et outils tiers.",
          },
          {
            title: "Un suivi de projet clair",
            description:
              "Visualisez l'avancement de chaque collaboration en un coup d'œil, avec des statuts toujours à jour.",
          },
          {
            title: "Moins de friction, plus d'efficacité",
            description:
              "Les échanges répétitifs sont simplifiés grâce à des outils pensés pour le quotidien des équipes.",
          },
        ],
        mockLabels: ["Messages échangés", "Fichiers partagés", "Avancement du projet"],
      },
      "zero-frais-de-depot": {
        title: "Zéro frais de dépôt",
        description:
          "Aucun frais d'inscription ni frais de dépôt. Vous payez uniquement pour la réussite, sans mauvaise surprise ni engagement caché.",
        benefits: [
          {
            title: "Aucun coût à l'entrée",
            description:
              "Créer un compte, publier un projet ou parcourir les agences ne vous coûte rien, dès le premier jour.",
          },
          {
            title: "Un modèle basé sur la réussite",
            description:
              "Vous n'êtes jamais facturé pour une mise en relation qui n'aboutit pas à une collaboration réelle.",
          },
          {
            title: "Une tarification transparente",
            description:
              "Les conditions sont claires dès le départ, sans frais cachés ni clause surprise en cours de route.",
          },
        ],
        mockLabels: ["Frais d'inscription", "Frais de dépôt", "Commission"],
        mockValues: ["0€", "0€", "sur réussite"],
      },
    },
    watchDemo: "Voir la démo",
    howItWorksTitle: "Comment ça marche ?",
    howItWorksSubtitle: "Trois étapes simples pour trouver votre partenaire idéal.",
    howItWorks: {
      "create-profile": {
        title: "Créez votre profil",
        description:
          "Renseignez vos informations, votre secteur et vos besoins en quelques minutes, sans engagement.",
      },
      "get-recommendations": {
        title: "Recevez des recommandations",
        description:
          "Notre algorithme identifie les agences ou projets les plus adaptés à votre profil et vos objectifs.",
      },
      collaborate: {
        title: "Collaborez en toute confiance",
        description:
          "Échangez, validez les étapes clés et suivez votre projet depuis un espace centralisé, jusqu'à la livraison.",
      },
    },
    commitmentsTitle: "Nos engagements",
    commitmentsSubtitle: "Des valeurs qui guident chacune de nos actions.",
    commitments: {
      security: {
        title: "Sécurité",
        description:
          "Vos échanges et vos informations restent confidentiels, protégés à chaque étape de la collaboration.",
      },
      transparency: {
        title: "Transparence",
        description:
          "Aucune clause cachée : les conditions, les critères de sélection et les frais sont clairs dès le départ.",
      },
      support: {
        title: "Accompagnement",
        description:
          "Une équipe disponible pour vous guider, que vous soyez une entreprise ou une agence, à chaque étape.",
      },
    },
    sectorsTitle: "Des secteurs variés",
    sectorsSubtitle:
      "Quel que soit votre domaine d'activité, trouvez une agence spécialisée qui comprend vos enjeux.",
    sectors: {
      marketing: {
        title: "Marketing digital",
        description: "SEO, publicité en ligne, réseaux sociaux et stratégie de contenu.",
      },
      "web-dev": {
        title: "Développement web",
        description: "Sites vitrines, applications sur mesure et plateformes e-commerce.",
      },
      design: {
        title: "Design & branding",
        description: "Identité visuelle, UX/UI et design de produits digitaux.",
      },
      communication: {
        title: "Communication",
        description: "Relations presse, événementiel et communication de marque.",
      },
      legal: {
        title: "Juridique",
        description: "Conseil juridique, contrats et conformité pour votre activité.",
      },
      finance: {
        title: "Finance & comptabilité",
        description: "Gestion comptable, fiscalité et pilotage financier.",
      },
      hr: { title: "Ressources humaines", description: "Recrutement, formation et gestion des talents." },
      strategy: {
        title: "Conseil en stratégie",
        description: "Accompagnement stratégique pour structurer votre croissance.",
      },
    },
    countriesTitle: "Présent partout où vous en avez besoin",
    countriesSubtitle: "Trouvez des agences et des projets déjà inscrits dans ces pays.",
    discover: "Découvrir →",
    ctaTitle: "Prêt à trouver l'agence ou le projet idéal ?",
    ctaSubtitle:
      "Créez votre compte gratuitement et découvrez des recommandations adaptées à vos besoins en quelques minutes.",
    free: "Gratuit",
    noCommitment: "Sans engagement",
    noHiddenFees: "Sans frais cachés",
    demoNav: {
      dashboard: "Dashboard",
      projects: "Projets",
      agencies: "Agences",
      messages: "Messages",
      favorites: "Favoris",
      settings: "Paramètres",
    },
    noAgenciesFound: "Nous avons trouvé 0 agences correspondant à vos critères",
    loginForDemo: "Se connecter pour lancer la démonstration",
    matchSuffix: "correspondance",
    scrollLeft: "Défiler vers la gauche",
    scrollRight: "Défiler vers la droite",
  },
} satisfies Dict;

const en: typeof fr = {
  common: {
    login: "Log in",
    dashboard: "My dashboard",
    account: "My account",
    menu: "Menu",
  },
  header: {
    features: "Features",
    howItWorks: "How it works",
    about: "About",
    findAgency: "Find the ideal agency",
    findProject: "Find the ideal project",
    applyProject: "Apply to a project",
  },
  footer: {
    tagline: "A new way to connect businesses and create lasting B2B opportunities.",
    platform: "Platform",
    findAgency: "Find the ideal agency",
    findProject: "Find the ideal project",
    postProject: "Post a project",
    services: "Services covered",
    howItWorks: "How it works",
    providers: "For providers",
    howItWorksProvider: "How it works",
    listAgency: "List my agency",
    pricing: "Pricing",
    resources: "Resources & tips",
    becomePartner: "Become a partner",
    resourcesTitle: "Resources",
    blog: "Blog",
    guides: "Guides & tutorials",
    studies: "Studies & reports",
    faq: "FAQ",
    helpCenter: "Help center",
    company: "Company",
    about: "About",
    vision: "Our vision",
    careers: "Careers",
    press: "Press",
    contact: "Contact",
    stayInformed: "Stay informed",
    stayInformedDesc: "For any news or questions, our team is reachable directly by email.",
    needHelp: "Need help?",
    needHelpDesc: "Our team is here to help you.",
    contactUs: "Contact us →",
    rights: "All rights reserved.",
    legal: "Legal notice",
    privacy: "Privacy policy",
    terms: "Terms of use",
  },
  home: {
    metaTitle: "Sortlist — The B2B platform for projects & agencies",
    metaDescription:
      "Find, collaborate and succeed with the agencies best suited to your needs. Sortlist simplifies every step.",
    badge: "New version available",
    heroTitle: "The B2B platform connecting your projects to the",
    heroTitleHighlight: "best agencies",
    heroSubtitle:
      "Find, collaborate and succeed with the agencies best suited to your needs. Whether you're a company or an agency, Sortlist simplifies every step.",
    createAccount: "Create my free account",
    login: "Log in",
    audiences: {
      companies: { title: "Companies", description: "Find the perfect agency for your projects." },
      agencies: { title: "Agencies", description: "Find projects that match your expertise." },
      security: { title: "Security", description: "Transparent collaboration you can trust." },
    },
    twoActorsTitle: "One platform, two players.",
    twoActors: {
      company: {
        title: "You're a company",
        description: "Describe your project and find the ideal agencies.",
        points: [
          "Guided briefing in a few steps",
          "Pre-qualified agencies",
          "Receive and compare proposals",
          "Choose your partner",
        ],
        ctaLabel: "Discover for companies",
      },
      agency: {
        title: "You're an agency",
        description: "Receive qualified projects and grow your business.",
        points: [
          "Targeted opportunities",
          "Matching with your expertise",
          "Respond to projects",
          "Grow your network",
        ],
        ctaLabel: "Discover for agencies",
      },
    },
    whyTitle: "Why choose Sortlist?",
    whySubtitle: "Features designed to simplify your collaborations.",
    advantages: {
      "matching-intelligent": {
        title: "Smart matching",
        description:
          "Our AI analyzes your needs and expertise to suggest the best partners or projects. It identifies the most relevant agencies or projects based on their expertise, past work and compatibility with your criteria.",
        benefits: [
          {
            title: "Ultra-targeted recommendations",
            description:
              "Receive only relevant suggestions aligned with your goals, with no need to sift through dozens of unsuitable profiles.",
          },
          {
            title: "Considerable time savings",
            description:
              "No more endless searching: our AI does the work for you and presents the best candidates directly.",
          },
          {
            title: "Better collaboration quality",
            description:
              "Connect with partners or projects that share your values, sector and vision of work.",
          },
        ],
        mockLabels: ["Agency A", "Agency B", "Agency C"],
      },
      "projets-cibles": {
        title: "Targeted projects",
        description:
          "Access qualified, relevant projects matched to your skills and goals. No more applying blind.",
        benefits: [
          {
            title: "Projects that truly fit",
            description:
              "Every opportunity shown matches your sector, expertise and preferred budget.",
          },
          {
            title: "Fewer applications, more results",
            description: "Focus your efforts on projects where you have a real chance of being selected.",
          },
          {
            title: "Visibility on key criteria",
            description: "Budget, timeline, sector: all essential information is visible before applying.",
          },
        ],
        mockLabels: ["Website redesign", "Marketing campaign", "Brand identity"],
      },
      "collaboration-simplifiee": {
        title: "Simplified collaboration",
        description:
          "Built-in tools to efficiently manage your exchanges, files and project tracking, from first contact to final delivery.",
        benefits: [
          {
            title: "Centralized communication",
            description:
              "Messages, files and approvals stay grouped in one place, with no scattering across emails and third-party tools.",
          },
          {
            title: "Clear project tracking",
            description: "See the progress of every collaboration at a glance, with always up-to-date statuses.",
          },
          {
            title: "Less friction, more efficiency",
            description: "Repetitive exchanges are simplified with tools designed for teams' daily work.",
          },
        ],
        mockLabels: ["Messages exchanged", "Files shared", "Project progress"],
      },
      "zero-frais-de-depot": {
        title: "Zero posting fees",
        description:
          "No sign-up fees, no posting fees. You only pay for success, with no bad surprises or hidden commitments.",
        benefits: [
          {
            title: "No cost to get started",
            description: "Creating an account, posting a project or browsing agencies costs you nothing, from day one.",
          },
          {
            title: "A success-based model",
            description: "You're never charged for a connection that doesn't lead to an actual collaboration.",
          },
          {
            title: "Transparent pricing",
            description: "Terms are clear from the start, with no hidden fees or surprise clauses along the way.",
          },
        ],
        mockLabels: ["Sign-up fees", "Posting fees", "Commission"],
        mockValues: ["$0", "$0", "on success"],
      },
    },
    watchDemo: "Watch the demo",
    howItWorksTitle: "How does it work?",
    howItWorksSubtitle: "Three simple steps to find your ideal partner.",
    howItWorks: {
      "create-profile": {
        title: "Create your profile",
        description: "Fill in your information, sector and needs in a few minutes, with no commitment.",
      },
      "get-recommendations": {
        title: "Receive recommendations",
        description: "Our algorithm identifies the agencies or projects best suited to your profile and goals.",
      },
      collaborate: {
        title: "Collaborate with confidence",
        description: "Exchange, validate key steps and track your project from a centralized space, through to delivery.",
      },
    },
    commitmentsTitle: "Our commitments",
    commitmentsSubtitle: "Values that guide everything we do.",
    commitments: {
      security: {
        title: "Security",
        description: "Your exchanges and information stay confidential, protected at every step of the collaboration.",
      },
      transparency: {
        title: "Transparency",
        description: "No hidden clauses: terms, selection criteria and fees are clear from the start.",
      },
      support: {
        title: "Support",
        description: "A team available to guide you, whether you're a company or an agency, at every step.",
      },
    },
    sectorsTitle: "Diverse sectors",
    sectorsSubtitle: "Whatever your field of activity, find a specialized agency that understands your challenges.",
    sectors: {
      marketing: { title: "Digital marketing", description: "SEO, online advertising, social media and content strategy." },
      "web-dev": { title: "Web development", description: "Showcase sites, custom applications and e-commerce platforms." },
      design: { title: "Design & branding", description: "Visual identity, UX/UI and digital product design." },
      communication: { title: "Communication", description: "Press relations, events and brand communication." },
      legal: { title: "Legal", description: "Legal advice, contracts and compliance for your business." },
      finance: { title: "Finance & accounting", description: "Accounting management, taxation and financial steering." },
      hr: { title: "Human resources", description: "Recruitment, training and talent management." },
      strategy: { title: "Strategy consulting", description: "Strategic support to structure your growth." },
    },
    countriesTitle: "Present wherever you need us",
    countriesSubtitle: "Find agencies and projects already registered in these countries.",
    discover: "Discover →",
    ctaTitle: "Ready to find the ideal agency or project?",
    ctaSubtitle: "Create your free account and discover recommendations suited to your needs in just a few minutes.",
    free: "Free",
    noCommitment: "No commitment",
    noHiddenFees: "No hidden fees",
    demoNav: {
      dashboard: "Dashboard",
      projects: "Projects",
      agencies: "Agencies",
      messages: "Messages",
      favorites: "Favorites",
      settings: "Settings",
    },
    noAgenciesFound: "We found 0 agencies matching your criteria",
    loginForDemo: "Log in to launch the demo",
    matchSuffix: "match",
    scrollLeft: "Scroll left",
    scrollRight: "Scroll right",
  },
};

const ar: typeof fr = {
  common: {
    login: "تسجيل الدخول",
    dashboard: "لوحة التحكم الخاصة بي",
    account: "حسابي",
    menu: "القائمة",
  },
  header: {
    features: "الميزات",
    howItWorks: "كيف يعمل",
    about: "من نحن",
    findAgency: "ابحث عن الوكالة المثالية",
    findProject: "ابحث عن المشروع المثالي",
    applyProject: "التقدم لمشروع",
  },
  footer: {
    tagline: "طريقة جديدة لربط الشركات وخلق فرص تجارية مستدامة بين الشركات.",
    platform: "المنصة",
    findAgency: "ابحث عن الوكالة المثالية",
    findProject: "ابحث عن المشروع المثالي",
    postProject: "انشر مشروعًا",
    services: "الخدمات المغطاة",
    howItWorks: "كيف يعمل",
    providers: "لمقدمي الخدمات",
    howItWorksProvider: "كيف يعمل",
    listAgency: "أضف وكالتي",
    pricing: "الأسعار",
    resources: "موارد ونصائح",
    becomePartner: "كن شريكًا",
    resourcesTitle: "الموارد",
    blog: "المدونة",
    guides: "أدلة ودروس",
    studies: "دراسات وتقارير",
    faq: "الأسئلة الشائعة",
    helpCenter: "مركز المساعدة",
    company: "الشركة",
    about: "من نحن",
    vision: "رؤيتنا",
    careers: "الوظائف",
    press: "الصحافة",
    contact: "اتصل بنا",
    stayInformed: "ابق على اطلاع",
    stayInformedDesc: "لأي أخبار أو أسئلة، يمكن التواصل مع فريقنا مباشرة عبر البريد الإلكتروني.",
    needHelp: "تحتاج مساعدة؟",
    needHelpDesc: "فريقنا هنا لمساعدتك.",
    contactUs: "تواصل معنا ←",
    rights: "جميع الحقوق محفوظة.",
    legal: "الإشعارات القانونية",
    privacy: "سياسة الخصوصية",
    terms: "شروط الاستخدام",
  },
  home: {
    metaTitle: "Sortlist — منصة B2B للمشاريع والوكالات",
    metaDescription: "ابحث وتعاون وانجح مع الوكالات الأنسب لاحتياجاتك. تبسّط Sortlist كل خطوة.",
    badge: "إصدار جديد متاح",
    heroTitle: "منصة B2B التي تربط مشاريعك بـ",
    heroTitleHighlight: "أفضل الوكالات",
    heroSubtitle:
      "ابحث وتعاون وانجح مع الوكالات الأنسب لاحتياجاتك. سواء كنت شركة أو وكالة، تبسّط Sortlist كل خطوة.",
    createAccount: "إنشاء حسابي مجانًا",
    login: "تسجيل الدخول",
    audiences: {
      companies: { title: "الشركات", description: "ابحث عن الوكالة المثالية لمشاريعك." },
      agencies: { title: "الوكالات", description: "ابحث عن المشاريع التي تناسب خبرتك." },
      security: { title: "الأمان", description: "تعاون شفاف وموثوق به بالكامل." },
    },
    twoActorsTitle: "منصة واحدة، طرفان.",
    twoActors: {
      company: {
        title: "أنت شركة",
        description: "صِف مشروعك وابحث عن الوكالات المثالية.",
        points: [
          "إحاطة موجهة خلال خطوات قليلة",
          "وكالات مؤهلة مسبقًا",
          "استلم وقارن العروض",
          "اختر شريكك",
        ],
        ctaLabel: "اكتشف للشركات",
      },
      agency: {
        title: "أنت وكالة",
        description: "استلم مشاريع مؤهلة وطوّر نشاطك.",
        points: [
          "فرص مستهدفة",
          "مطابقة مع خبراتك",
          "رد على المشاريع",
          "طوّر شبكتك",
        ],
        ctaLabel: "اكتشف للوكالات",
      },
    },
    whyTitle: "لماذا تختار Sortlist؟",
    whySubtitle: "ميزات مصممة لتبسيط تعاونك.",
    advantages: {
      "matching-intelligent": {
        title: "مطابقة ذكية",
        description:
          "يحلل الذكاء الاصطناعي لدينا احتياجاتك وخبرتك لاقتراح أفضل الشركاء أو المشاريع. يحدد الوكالات أو المشاريع الأكثر صلة بناءً على خبرتها وإنجازاتها السابقة وتوافقها مع معاييرك.",
        benefits: [
          {
            title: "توصيات شديدة الاستهداف",
            description: "احصل فقط على اقتراحات ذات صلة ومتوافقة مع أهدافك، دون الحاجة لفرز عشرات الملفات غير المناسبة.",
          },
          {
            title: "توفير كبير للوقت",
            description: "لا مزيد من البحث اللامتناهي: يقوم ذكاؤنا الاصطناعي بالعمل نيابة عنك ويقدم لك أفضل المرشحين مباشرة.",
          },
          {
            title: "جودة تعاون أفضل",
            description: "تواصل مع الشركاء أو المشاريع التي تشاركك قيمك وقطاعك ورؤيتك للعمل.",
          },
        ],
        mockLabels: ["الوكالة أ", "الوكالة ب", "الوكالة ج"],
      },
      "projets-cibles": {
        title: "مشاريع مستهدفة",
        description: "اطّلع على مشاريع مؤهلة وذات صلة، تناسب مهاراتك وأهدافك. لا مزيد من التقديم العشوائي.",
        benefits: [
          { title: "مشاريع مناسبة حقًا", description: "كل فرصة معروضة تتوافق مع قطاعك وخبرتك وميزانيتك المفضلة." },
          { title: "طلبات أقل، نتائج أكثر", description: "ركّز جهودك على المشاريع التي لديك فيها فرصة حقيقية للاختيار." },
          { title: "رؤية واضحة على المعايير الأساسية", description: "الميزانية، الآجال، القطاع: جميع المعلومات الأساسية مرئية قبل التقديم." },
        ],
        mockLabels: ["إعادة تصميم موقع", "حملة تسويقية", "هوية العلامة التجارية"],
      },
      "collaboration-simplifiee": {
        title: "تعاون مبسّط",
        description: "أدوات متكاملة لإدارة تبادلاتك وملفاتك ومتابعة مشروعك بفعالية، من أول تواصل حتى التسليم النهائي.",
        benefits: [
          { title: "تواصل مركزي", description: "تبقى الرسائل والملفات والموافقات مجمعة في مكان واحد، دون تشتت بين البريد الإلكتروني والأدوات الخارجية." },
          { title: "متابعة واضحة للمشروع", description: "تابع تقدم كل تعاون بنظرة واحدة، مع حالات محدثة دائمًا." },
          { title: "احتكاك أقل، فعالية أكبر", description: "يتم تبسيط التبادلات المتكررة بفضل أدوات مصممة لعمل الفرق اليومي." },
        ],
        mockLabels: ["الرسائل المتبادلة", "الملفات المشتركة", "تقدم المشروع"],
      },
      "zero-frais-de-depot": {
        title: "بدون رسوم نشر",
        description: "لا رسوم تسجيل ولا رسوم نشر. تدفع فقط عند النجاح، دون مفاجآت سيئة أو التزامات خفية.",
        benefits: [
          { title: "بدون أي تكلفة للبدء", description: "إنشاء حساب أو نشر مشروع أو تصفح الوكالات لا يكلفك شيئًا، منذ اليوم الأول." },
          { title: "نموذج قائم على النجاح", description: "لا تُفرض عليك رسوم أبدًا مقابل تواصل لا يؤدي إلى تعاون حقيقي." },
          { title: "تسعير شفاف", description: "الشروط واضحة منذ البداية، دون رسوم خفية أو بنود مفاجئة في الطريق." },
        ],
        mockLabels: ["رسوم التسجيل", "رسوم النشر", "العمولة"],
        mockValues: ["0 درهم", "0 درهم", "عند النجاح"],
      },
    },
    watchDemo: "شاهد العرض التوضيحي",
    howItWorksTitle: "كيف يعمل؟",
    howItWorksSubtitle: "ثلاث خطوات بسيطة للعثور على شريكك المثالي.",
    howItWorks: {
      "create-profile": { title: "أنشئ ملفك الشخصي", description: "أدخل معلوماتك وقطاعك واحتياجاتك في دقائق معدودة، دون أي التزام." },
      "get-recommendations": { title: "استلم التوصيات", description: "يحدد خوارزمنا الوكالات أو المشاريع الأنسب لملفك الشخصي وأهدافك." },
      collaborate: { title: "تعاون بكل ثقة", description: "تبادل، تحقق من الخطوات الأساسية وتابع مشروعك من مساحة مركزية، وصولًا إلى التسليم." },
    },
    commitmentsTitle: "التزاماتنا",
    commitmentsSubtitle: "قيم توجه كل أفعالنا.",
    commitments: {
      security: { title: "الأمان", description: "تبقى تبادلاتك ومعلوماتك سرية ومحمية في كل مرحلة من مراحل التعاون." },
      transparency: { title: "الشفافية", description: "لا بنود مخفية: الشروط ومعايير الاختيار والرسوم واضحة منذ البداية." },
      support: { title: "المرافقة", description: "فريق متاح لإرشادك، سواء كنت شركة أو وكالة، في كل خطوة." },
    },
    sectorsTitle: "قطاعات متنوعة",
    sectorsSubtitle: "مهما كان مجال نشاطك، ابحث عن وكالة متخصصة تفهم تحدياتك.",
    sectors: {
      marketing: { title: "التسويق الرقمي", description: "تحسين محركات البحث، الإعلانات عبر الإنترنت، الشبكات الاجتماعية واستراتيجية المحتوى." },
      "web-dev": { title: "تطوير الويب", description: "مواقع عرض، تطبيقات مخصصة ومنصات تجارة إلكترونية." },
      design: { title: "التصميم والهوية البصرية", description: "الهوية البصرية، تجربة المستخدم/واجهة المستخدم وتصميم المنتجات الرقمية." },
      communication: { title: "التواصل", description: "العلاقات الصحفية، الفعاليات والتواصل حول العلامة التجارية." },
      legal: { title: "القانون", description: "الاستشارة القانونية والعقود والامتثال لنشاطك." },
      finance: { title: "المالية والمحاسبة", description: "الإدارة المحاسبية والضرائب والتوجيه المالي." },
      hr: { title: "الموارد البشرية", description: "التوظيف والتكوين وإدارة المواهب." },
      strategy: { title: "استشارات استراتيجية", description: "مرافقة استراتيجية لهيكلة نموك." },
    },
    countriesTitle: "حاضرون أينما احتجتمونا",
    countriesSubtitle: "ابحث عن الوكالات والمشاريع المسجلة بالفعل في هذه الدول.",
    discover: "اكتشف ←",
    ctaTitle: "هل أنت مستعد للعثور على الوكالة أو المشروع المثالي؟",
    ctaSubtitle: "أنشئ حسابك مجانًا واكتشف توصيات تناسب احتياجاتك في بضع دقائق.",
    free: "مجاني",
    noCommitment: "بدون التزام",
    noHiddenFees: "بدون رسوم خفية",
    demoNav: {
      dashboard: "لوحة التحكم",
      projects: "المشاريع",
      agencies: "الوكالات",
      messages: "الرسائل",
      favorites: "المفضلة",
      settings: "الإعدادات",
    },
    noAgenciesFound: "وجدنا 0 وكالة تطابق معاييرك",
    loginForDemo: "سجّل الدخول لبدء العرض التوضيحي",
    matchSuffix: "تطابق",
    scrollLeft: "التمرير لليسار",
    scrollRight: "التمرير لليمين",
  },
};

const es: typeof fr = {
  common: {
    login: "Iniciar sesión",
    dashboard: "Mi panel",
    account: "Mi cuenta",
    menu: "Menú",
  },
  header: {
    features: "Funcionalidades",
    howItWorks: "Cómo funciona",
    about: "Acerca de",
    findAgency: "Encuentra la agencia ideal",
    findProject: "Encuentra el proyecto ideal",
    applyProject: "Postular a un proyecto",
  },
  footer: {
    tagline: "Una nueva forma de conectar empresas y crear oportunidades B2B duraderas.",
    platform: "Plataforma",
    findAgency: "Encontrar la agencia ideal",
    findProject: "Encontrar el proyecto ideal",
    postProject: "Publicar un proyecto",
    services: "Servicios cubiertos",
    howItWorks: "Cómo funciona",
    providers: "Para proveedores",
    howItWorksProvider: "Cómo funciona",
    listAgency: "Listar mi agencia",
    pricing: "Precios",
    resources: "Recursos y consejos",
    becomePartner: "Conviértete en socio",
    resourcesTitle: "Recursos",
    blog: "Blog",
    guides: "Guías y tutoriales",
    studies: "Estudios e informes",
    faq: "Preguntas frecuentes",
    helpCenter: "Centro de ayuda",
    company: "Empresa",
    about: "Acerca de",
    vision: "Nuestra visión",
    careers: "Empleo",
    press: "Prensa",
    contact: "Contacto",
    stayInformed: "Mantente informado",
    stayInformedDesc: "Para cualquier noticia o pregunta, nuestro equipo está disponible directamente por correo electrónico.",
    needHelp: "¿Necesitas ayuda?",
    needHelpDesc: "Nuestro equipo está aquí para ayudarte.",
    contactUs: "Contáctanos →",
    rights: "Todos los derechos reservados.",
    legal: "Aviso legal",
    privacy: "Política de privacidad",
    terms: "Condiciones de uso",
  },
  home: {
    metaTitle: "Sortlist — La plataforma B2B de proyectos y agencias",
    metaDescription:
      "Encuentra, colabora y triunfa con las agencias más adecuadas para tus necesidades. Sortlist simplifica cada paso.",
    badge: "Nueva versión disponible",
    heroTitle: "La plataforma B2B que conecta tus proyectos con las",
    heroTitleHighlight: "mejores agencias",
    heroSubtitle:
      "Encuentra, colabora y triunfa con las agencias más adecuadas para tus necesidades. Ya seas una empresa o una agencia, Sortlist simplifica cada paso.",
    createAccount: "Crear mi cuenta gratis",
    login: "Iniciar sesión",
    audiences: {
      companies: { title: "Empresas", description: "Encuentra la agencia perfecta para tus proyectos." },
      agencies: { title: "Agencias", description: "Encuentra proyectos que se ajusten a tu experiencia." },
      security: { title: "Seguridad", description: "Una colaboración transparente y de total confianza." },
    },
    twoActorsTitle: "Una plataforma, dos actores.",
    twoActors: {
      company: {
        title: "Eres una empresa",
        description: "Describe tu proyecto y encuentra las agencias ideales.",
        points: [
          "Briefing guiado en pocos pasos",
          "Agencias precalificadas",
          "Recibe y compara propuestas",
          "Elige a tu socio",
        ],
        ctaLabel: "Descubrir para empresas",
      },
      agency: {
        title: "Eres una agencia",
        description: "Recibe proyectos calificados y haz crecer tu actividad.",
        points: [
          "Oportunidades específicas",
          "Coincidencia con tu experiencia",
          "Responde a los proyectos",
          "Amplía tu red",
        ],
        ctaLabel: "Descubrir para agencias",
      },
    },
    whyTitle: "¿Por qué elegir Sortlist?",
    whySubtitle: "Funcionalidades diseñadas para simplificar tus colaboraciones.",
    advantages: {
      "matching-intelligent": {
        title: "Coincidencia inteligente",
        description:
          "Nuestra IA analiza tus necesidades y tu experiencia para proponerte los mejores socios o proyectos. Identifica las agencias o proyectos más relevantes según su experiencia, sus logros pasados y su compatibilidad con tus criterios.",
        benefits: [
          { title: "Recomendaciones ultra específicas", description: "Recibe únicamente sugerencias relevantes y alineadas con tus objetivos, sin tener que filtrar decenas de perfiles no adecuados." },
          { title: "Ahorro considerable de tiempo", description: "Se acabaron las búsquedas interminables: nuestra IA hace el trabajo por ti y te presenta directamente a los mejores candidatos." },
          { title: "Mejor calidad de colaboración", description: "Conéctate con socios o proyectos que comparten tus valores, tu sector y tu visión del trabajo." },
        ],
        mockLabels: ["Agencia A", "Agencia B", "Agencia C"],
      },
      "projets-cibles": {
        title: "Proyectos específicos",
        description: "Accede a proyectos calificados y relevantes, adaptados a tus habilidades y objetivos. Se acabaron las postulaciones a ciegas.",
        benefits: [
          { title: "Proyectos realmente adecuados", description: "Cada oportunidad mostrada corresponde a tu sector, tu experiencia y tu presupuesto preferido." },
          { title: "Menos postulaciones, más resultados", description: "Concentra tus esfuerzos en los proyectos donde tienes posibilidades reales de ser seleccionado." },
          { title: "Visibilidad sobre criterios clave", description: "Presupuesto, plazos, sector de actividad: toda la información esencial es visible antes de postular." },
        ],
        mockLabels: ["Rediseño de sitio web", "Campaña de marketing", "Identidad de marca"],
      },
      "collaboration-simplifiee": {
        title: "Colaboración simplificada",
        description: "Herramientas integradas para gestionar tus intercambios, archivos y seguimiento de proyectos de manera eficaz, desde el primer contacto hasta la entrega final.",
        benefits: [
          { title: "Comunicación centralizada", description: "Mensajes, archivos y validaciones permanecen agrupados en un solo lugar, sin dispersión entre correos y herramientas externas." },
          { title: "Un seguimiento de proyecto claro", description: "Visualiza el avance de cada colaboración de un vistazo, con estados siempre actualizados." },
          { title: "Menos fricción, más eficiencia", description: "Los intercambios repetitivos se simplifican gracias a herramientas pensadas para el día a día de los equipos." },
        ],
        mockLabels: ["Mensajes intercambiados", "Archivos compartidos", "Avance del proyecto"],
      },
      "zero-frais-de-depot": {
        title: "Cero comisiones de publicación",
        description: "Sin cuotas de inscripción ni comisiones de publicación. Solo pagas por el éxito, sin malas sorpresas ni compromisos ocultos.",
        benefits: [
          { title: "Ningún costo de entrada", description: "Crear una cuenta, publicar un proyecto o explorar agencias no te cuesta nada, desde el primer día." },
          { title: "Un modelo basado en el éxito", description: "Nunca se te cobra por una puesta en contacto que no resulte en una colaboración real." },
          { title: "Tarifas transparentes", description: "Las condiciones son claras desde el principio, sin comisiones ocultas ni cláusulas sorpresa en el camino." },
        ],
        mockLabels: ["Cuota de inscripción", "Comisión de publicación", "Comisión"],
        mockValues: ["0€", "0€", "por éxito"],
      },
    },
    watchDemo: "Ver la demo",
    howItWorksTitle: "¿Cómo funciona?",
    howItWorksSubtitle: "Tres simples pasos para encontrar a tu socio ideal.",
    howItWorks: {
      "create-profile": { title: "Crea tu perfil", description: "Introduce tu información, sector y necesidades en pocos minutos, sin compromiso." },
      "get-recommendations": { title: "Recibe recomendaciones", description: "Nuestro algoritmo identifica las agencias o proyectos más adecuados para tu perfil y tus objetivos." },
      collaborate: { title: "Colabora con confianza", description: "Intercambia, valida los pasos clave y sigue tu proyecto desde un espacio centralizado, hasta la entrega." },
    },
    commitmentsTitle: "Nuestros compromisos",
    commitmentsSubtitle: "Valores que guían cada una de nuestras acciones.",
    commitments: {
      security: { title: "Seguridad", description: "Tus intercambios e información se mantienen confidenciales, protegidos en cada etapa de la colaboración." },
      transparency: { title: "Transparencia", description: "Sin cláusulas ocultas: las condiciones, los criterios de selección y las comisiones son claras desde el principio." },
      support: { title: "Acompañamiento", description: "Un equipo disponible para guiarte, ya seas una empresa o una agencia, en cada etapa." },
    },
    sectorsTitle: "Sectores diversos",
    sectorsSubtitle: "Cualquiera que sea tu ámbito de actividad, encuentra una agencia especializada que entienda tus retos.",
    sectors: {
      marketing: { title: "Marketing digital", description: "SEO, publicidad en línea, redes sociales y estrategia de contenido." },
      "web-dev": { title: "Desarrollo web", description: "Sitios vitrina, aplicaciones a medida y plataformas de comercio electrónico." },
      design: { title: "Diseño y branding", description: "Identidad visual, UX/UI y diseño de productos digitales." },
      communication: { title: "Comunicación", description: "Relaciones con la prensa, eventos y comunicación de marca." },
      legal: { title: "Jurídico", description: "Asesoría jurídica, contratos y cumplimiento normativo para tu actividad." },
      finance: { title: "Finanzas y contabilidad", description: "Gestión contable, fiscalidad y pilotaje financiero." },
      hr: { title: "Recursos humanos", description: "Reclutamiento, formación y gestión del talento." },
      strategy: { title: "Consultoría estratégica", description: "Acompañamiento estratégico para estructurar tu crecimiento." },
    },
    countriesTitle: "Presentes donde nos necesites",
    countriesSubtitle: "Encuentra agencias y proyectos ya registrados en estos países.",
    discover: "Descubrir →",
    ctaTitle: "¿Listo para encontrar la agencia o el proyecto ideal?",
    ctaSubtitle: "Crea tu cuenta gratis y descubre recomendaciones adaptadas a tus necesidades en pocos minutos.",
    free: "Gratis",
    noCommitment: "Sin compromiso",
    noHiddenFees: "Sin comisiones ocultas",
    demoNav: {
      dashboard: "Panel",
      projects: "Proyectos",
      agencies: "Agencias",
      messages: "Mensajes",
      favorites: "Favoritos",
      settings: "Ajustes",
    },
    noAgenciesFound: "Encontramos 0 agencias que coinciden con tus criterios",
    loginForDemo: "Inicia sesión para lanzar la demo",
    matchSuffix: "coincidencia",
    scrollLeft: "Desplazar a la izquierda",
    scrollRight: "Desplazar a la derecha",
  },
};

export const translations: Record<Locale, typeof fr> = { fr, en, ar, es };
