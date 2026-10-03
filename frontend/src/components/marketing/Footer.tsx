import { Link } from "@tanstack/react-router";
import { Headphones } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-muted text-foreground">
      <div className="mx-auto max-w-[1080px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[16px] font-bold tracking-tight">Sortlist</p>
            <p className="mt-3 text-[13px] leading-[1.5] text-foreground/60">{t("footer.tagline")}</p>
          </div>

          <div>
            <p className="text-[13px] font-bold">{t("footer.platform")}</p>
            <nav className="mt-4 space-y-2.5">
              <Link
                to="/agences"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.findAgency")}
              </Link>
              <Link
                to="/projets"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.findProject")}
              </Link>
              <Link
                to="/postuler-un-projet"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.postProject")}
              </Link>
              <Link
                to="/services"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.services")}
              </Link>
              <Link
                to="/comment-ca-marche"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.howItWorks")}
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-[13px] font-bold">{t("footer.providers")}</p>
            <nav className="mt-4 space-y-2.5">
              <Link
                to="/comment-ca-marche"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.howItWorksProvider")}
              </Link>
              <Link
                to="/inscription-agence"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.listAgency")}
              </Link>
              <Link
                to="/tarifs"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.pricing")}
              </Link>
              <Link
                to="/ressources"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.resources")}
              </Link>
              <Link
                to="/devenir-partenaire"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.becomePartner")}
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-[13px] font-bold">{t("footer.resourcesTitle")}</p>
            <nav className="mt-4 space-y-2.5">
              <Link
                to="/blog"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.blog")}
              </Link>
              <Link
                to="/guides"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.guides")}
              </Link>
              <Link
                to="/etudes"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.studies")}
              </Link>
              <Link
                to="/faq"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.faq")}
              </Link>
              <Link
                to="/aide"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.helpCenter")}
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-[13px] font-bold">{t("footer.company")}</p>
            <nav className="mt-4 space-y-2.5">
              <Link
                to="/a-propos"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.about")}
              </Link>
              <Link
                to="/a-propos"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.vision")}
              </Link>
              <Link
                to="/carrieres"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.careers")}
              </Link>
              <Link
                to="/presse"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.press")}
              </Link>

              <a
                href="mailto:contact@sortlistpro.com"
                className="block text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              >
                {t("footer.contact")}
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 border-t border-foreground/20 pt-8 sm:grid-cols-2">
          <div>
            <p className="text-[13px] font-bold">{t("footer.stayInformed")}</p>
            <p className="mt-2 text-[12.5px] leading-[1.5] text-foreground/60">
              {t("footer.stayInformedDesc")}
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
              <p className="text-[13px] font-bold">{t("footer.needHelp")}</p>
              <p className="mt-1 text-[12.5px] text-foreground/60">{t("footer.needHelpDesc")}</p>

              <a
                href="mailto:contact@sortlistpro.com"
                className="mt-1 inline-block text-[12.5px] font-semibold text-foreground transition-opacity hover:opacity-80"
              >
                {t("footer.contactUs")}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-foreground/20 pt-8 sm:flex-row">
          <p className="text-[12.5px] text-foreground/60">
            © {new Date().getFullYear()} Sortlist. {t("footer.rights")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <Link
              to="/mentions-legales"
              className="text-[12.5px] text-foreground/70 transition-colors hover:text-foreground"
            >
              {t("footer.legal")}
            </Link>
            <Link
              to="/confidentialite"
              className="text-[12.5px] text-foreground/70 transition-colors hover:text-foreground"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              to="/conditions-utilisation"
              className="text-[12.5px] text-foreground/70 transition-colors hover:text-foreground"
            >
              {t("footer.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
