import { Link } from "@tanstack/react-router";
import { CircleUserRound, Menu } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useTranslation } from "@/i18n/useTranslation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Variant = "landing" | "search";

interface MarketingHeaderProps {
  variant?: Variant;

  active?: "agencies" | "projects" | null;

  applyDisabled?: boolean;
}

function Logo() {
  return (
    <Link to="/" className="group flex shrink-0 items-center gap-2">
      <img
        src="/favicon.ico"
        alt="Sortlist"
        className="h-8 w-8 rounded-md object-contain transition-transform group-hover:scale-105"
      />
      <span className="font-display text-[20px] font-bold tracking-tight">Sortlist</span>
    </Link>
  );
}

export function MarketingHeader({
  variant = "landing",
  active = null,
  applyDisabled = false,
}: MarketingHeaderProps) {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const dashboardPath = role === "agency" ? "/agence/tableau-de-bord" : "/client/tableau-de-bord";
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        {variant === "landing" ? (
          <>
            <nav className="ml-8 hidden items-center gap-6 lg:flex">
              <Link
                to="/fonctionnalites/$slug"
                params={{ slug: "matching-intelligent" }}
                className="text-[14.5px] font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                {t("header.features")}
              </Link>
              <Link
                to="/comment-ca-marche"
                className="text-[14.5px] font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                {t("header.howItWorks")}
              </Link>
              <Link
                to="/a-propos"
                className="text-[14.5px] font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                {t("header.about")}
              </Link>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <Link
                to="/agences"
                className="hidden rounded-md px-3 py-2 text-[14px] font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
              >
                {t("header.findAgency")}
              </Link>
              <Link
                to="/projets"
                className="hidden rounded-md px-3 py-2 text-[14px] font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
              >
                {t("header.findProject")}
              </Link>
              <Link
                to="/postuler-un-projet"
                className="rounded-md bg-primary px-3.5 py-2 text-[14px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow"
              >
                {t("header.applyProject")}
              </Link>
              <Link
                to={token ? dashboardPath : "/connexion"}
                aria-label={t("common.account")}
                className="ml-1 flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              >
                <CircleUserRound className="h-[22px] w-[22px]" strokeWidth={1.5} />
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("common.menu")}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-foreground lg:hidden"
                  >
                    <Menu className="h-[22px] w-[22px]" strokeWidth={1.5} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/fonctionnalites/$slug" params={{ slug: "matching-intelligent" }}>
                      {t("header.features")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/comment-ca-marche">{t("header.howItWorks")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/a-propos">{t("header.about")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/agences">{t("header.findAgency")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/projets">{t("header.findProject")}</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
          <>
            <nav className="ml-6 hidden items-center gap-1 rounded-lg border border-border p-1 md:flex">
              <Link
                to="/agences"
                className={
                  active === "agencies"
                    ? "rounded-md bg-primary px-4 py-1.5 text-[14px] font-semibold text-primary-foreground"
                    : "rounded-md px-4 py-1.5 text-[14px] font-semibold text-foreground/75 transition-colors hover:bg-accent hover:text-foreground"
                }
              >
                {t("header.findAgency")}
              </Link>
              <Link
                to="/projets"
                className={
                  active === "projects"
                    ? "rounded-md bg-primary px-4 py-1.5 text-[14px] font-semibold text-primary-foreground"
                    : "rounded-md px-4 py-1.5 text-[14px] font-semibold text-foreground/75 transition-colors hover:bg-accent hover:text-foreground"
                }
              >
                {t("header.findProject")}
              </Link>
            </nav>

            <div className="ml-auto flex items-center gap-3">
              {applyDisabled ? (
                <span className="hidden cursor-not-allowed items-center rounded-md px-4 py-2 text-[14px] font-semibold text-muted-foreground/50 sm:inline-flex">
                  {t("header.applyProject")}
                </span>
              ) : (
                <Link
                  to="/postuler-un-projet"
                  className="hidden rounded-md bg-primary px-4 py-2 text-[14px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow sm:inline-flex"
                >
                  {t("header.applyProject")}
                </Link>
              )}
              <Link
                to={token ? dashboardPath : "/connexion"}
                aria-label={t("common.account")}
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              >
                <CircleUserRound className="h-[22px] w-[22px]" strokeWidth={1.5} />
              </Link>
              {}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("common.menu")}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-foreground md:hidden"
                  >
                    <Menu className="h-[22px] w-[22px]" strokeWidth={1.5} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/agences">{t("header.findAgency")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/projets">{t("header.findProject")}</Link>
                  </DropdownMenuItem>
                  {!applyDisabled ? (
                    <DropdownMenuItem asChild>
                      <Link to="/postuler-un-projet">{t("header.applyProject")}</Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem asChild>
                    <Link to={token ? dashboardPath : "/connexion"}>
                      {token ? t("common.dashboard") : t("common.login")}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
