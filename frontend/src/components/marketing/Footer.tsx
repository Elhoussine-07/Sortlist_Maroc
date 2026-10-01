import { Link } from "@tanstack/react-router";
import { Headphones } from "lucide-react";

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
              Pour toute actualité ou question, notre équipe reste joignable directement par e-mail.
            </p>
            <a
              href="mailto:contact@sortlistpro.com"
              className="mt-3 inline-block text-[12.5px] font-semibold text-foreground underline underline-offset-2 hover:opacity-80"
            >
              contact@sortlistpro.com
            </a>
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
          </div>
        </div>
      </div>
    </footer>
  );
}
