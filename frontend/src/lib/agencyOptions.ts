/**
 * Listes statiques utilisées par `TagSelect` dans l'inscription agence
 * (étape 2 — Compétences). Aucun endpoint backend dédié n'existe pour ces
 * trois listes (seul `utils.get_categories` existe, pour les catégories de
 * projet, pas les compétences d'agence) — listes maintenues ici en attendant
 * une éventuelle doctype dédiée côté Frappe.
 *
 * Le composant `TagSelect` permet d'ajouter une valeur hors liste, donc ces
 * listes n'ont pas besoin d'être exhaustives : elles couvrent les cas
 * courants pour accélérer la saisie, sans bloquer les cas de niche.
 */

export const SKILL_OPTIONS: string[] = [
  "SEO",
  "SEA / Google Ads",
  "Marketing digital",
  "Stratégie de contenu",
  "Réseaux sociaux",
  "Community management",
  "Growth hacking",
  "Branding",
  "Identité visuelle",
  "UX Design",
  "UI Design",
  "Copywriting",
  "Email marketing",
  "Marketing automation",
  "Web analytics",
  "Data & CRO",
  "Influence marketing",
  "Relations presse",
  "Motion design",
  "Photographie",
  "Production vidéo",
  "E-commerce",
  "ASO (App Store Optimization)",
  "Développement web",
  "Développement mobile",
  "Consulting stratégique",
];

export const TECH_STACK_OPTIONS: string[] = [
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "Node.js",
  "TypeScript",
  "PHP",
  "Laravel",
  "Python",
  "Django",
  "WordPress",
  "Shopify",
  "WooCommerce",
  "Webflow",
  "Figma",
  "Adobe Creative Suite",
  "HubSpot",
  "Salesforce",
  "Google Analytics",
  "Google Tag Manager",
  "Meta Ads Manager",
  "Mailchimp",
  "AWS",
  "Google Cloud",
  "Azure",
  "Docker",
  "Flutter",
  "Swift",
  "Kotlin",
  "Go",
];

export const LANGUAGE_OPTIONS: string[] = [
  "Français",
  "Anglais",
  "Arabe",
  "Espagnol",
  "Allemand",
  "Italien",
  "Portugais",
  "Néerlandais",
  "Chinois (Mandarin)",
  "Japonais",
  "Russe",
  "Turc",
];
