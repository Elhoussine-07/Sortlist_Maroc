import { Link } from "@tanstack/react-router";
import { Check, Globe, Headphones, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";

export function Footer() {
  return (
    <footer className="bg-muted text-foreground">
      <div className="mx-auto max-w-[1080px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[16px] font-bold tracking-tight">Sortlist</p>
            <p className="mt-3 text-[13px] leading-[1.5] text-foreground/60">
              Une nouvelle manière de connecter les entreprises et de créer des opportunités B2B
              durables.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span
                title="Page à venir"
                className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border border-foreground/30 text-foreground"
              >
                <Linkedin className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <span
                title="Page à venir"
                className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border border-foreground/30 text-foreground"
              >
                <Twitter className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <span
                title="Page à venir"
                className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border border-foreground/30 text-foreground"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <span
                title="Page à venir"
                className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border border-foreground/30 text-foreground"
              >
                <Youtube className="h-4 w-4" strokeWidth={1.6} />
              </span>
            </div>
          </div>

          <div>
            <p className="text-[13px] font-bold">Plateforme</p>
            <nav className="mt-4 space-y-2.5">
              <Link
                to="/agences"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Trouver l'agence idéale
              </Link>
              <Link
                to="/projets"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Trouver le projet idéal
              </Link>
              <Link
                to="/postuler-un-projet"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Poster un projet
              </Link>
              <Link
                to="/services"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Services couverts
              </Link>
              <Link
                to="/comment-ca-marche"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Comment ça marche
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-[13px] font-bold">Pour les prestataires</p>
            <nav className="mt-4 space-y-2.5">
              <Link
                to="/comment-ca-marche"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Comment ça fonctionne
              </Link>
              <Link
                to="/inscription-agence"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Lister mon agence
              </Link>
              <Link
                to="/tarifs"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Prix
              </Link>
              <Link
                to="/ressources"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Ressources et conseils
              </Link>
              <Link
                to="/devenir-partenaire"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Devenir partenaire
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-[13px] font-bold">Ressources</p>
            <nav className="mt-4 space-y-2.5">
              <Link
                to="/blog"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Blog
              </Link>
              <Link
                to="/guides"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Guides et tutoriels
              </Link>
              <Link
                to="/etudes"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Études et rapports
              </Link>
              <Link
                to="/faq"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                FAQ
              </Link>
              <Link
                to="/aide"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Centre d'aide
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-[13px] font-bold">Entreprise</p>
            <nav className="mt-4 space-y-2.5">
              <Link
                to="/a-propos"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                À propos
              </Link>
              <Link
                to="/a-propos"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Notre vision
              </Link>
              <Link
                to="/carrieres"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Carrières
              </Link>
              <Link
                to="/presse"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Presse
              </Link>

              <a
                href="mailto:contact@sortlistpro.com"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Contact
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 border-t border-foreground/20 pt-8 sm:grid-cols-2">
          <div>
            <p className="text-[13px] font-bold">Restez informé</p>
            <p className="mt-2 text-[12.5px] leading-[1.5] text-foreground/60">
              Recevez nos dernières actualités, ressources et conseils B2B.
            </p>
            <div className="mt-3 flex max-w-[360px] items-center gap-2">
              <input
                type="email"
                disabled
                placeholder="Votre adresse e-mail"
                title="Newsletter à venir"
                className="h-10 w-full cursor-not-allowed rounded-md border border-foreground/30 bg-foreground/10 px-3 text-[13px] text-foreground/60 placeholder:text-foreground/40"
              />
              <span
                title="Newsletter à venir"
                className="flex h-10 shrink-0 cursor-not-allowed items-center justify-center rounded-md bg-foreground/15 px-4 text-[12.5px] font-semibold text-foreground/70"
              >
                S'abonner
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:border-l sm:border-foreground/20 sm:pl-8">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/30">
              <Headphones className="h-4 w-4" strokeWidth={1.6} />
            </span>
            <div>
              <p className="text-[13px] font-bold">Besoin d'aide ?</p>
              <p className="mt-1 text-[12.5px] text-foreground/60">
                Notre équipe est là pour vous aider.
              </p>

              <a
                href="mailto:contact@sortlistpro.com"
                className="mt-1 inline-block text-[12.5px] font-semibold text-foreground transition-opacity hover:opacity-80"
              >
                Nous contacter →
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-foreground/20 pt-8 sm:flex-row">
          <p className="text-[12.5px] text-foreground/60">
            © {new Date().getFullYear()} Sortlist. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <Link
              to="/mentions-legales"
              className="text-[12.5px] text-foreground/70 transition-colors hover:text-foreground"
            >
              Mentions légales
            </Link>
            <Link
              to="/confidentialite"
              className="text-[12.5px] text-foreground/70 transition-colors hover:text-foreground"
            >
              Politique de confidentialité
            </Link>
            <Link
              to="/conditions-utilisation"
              className="text-[12.5px] text-foreground/70 transition-colors hover:text-foreground"
            >
              Conditions d'utilisation
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-md border border-foreground/30 px-2.5 py-1.5 text-[12.5px] text-foreground transition-colors hover:bg-foreground/10"
                >
                  <Globe className="h-3.5 w-3.5" strokeWidth={1.6} />
                  Français (FR)
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem className="flex items-center justify-between">
                  Français
                  <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </footer>
  );
}
