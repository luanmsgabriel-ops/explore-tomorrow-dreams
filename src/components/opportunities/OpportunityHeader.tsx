import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";

import defaultLogo from "@/assets/logo.jpeg";
import { cn } from "@/lib/utils";
import { OpportunityButton } from "./OpportunityPrimitives";

export interface OpportunityNavItem {
  label: string;
  href: string;
}

export interface OpportunityHeaderProps {
  activeHref?: string;
  navItems: OpportunityNavItem[];
  logoSrc?: string;
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
}

const liveNavItem: OpportunityNavItem = {
  label: "Live",
  href: "/oportunidades/live",
};

const calendarNavItem: OpportunityNavItem = {
  label: "Calendário",
  href: "/oportunidades/calendario",
};

function withPlatformNavigation(navItems: OpportunityNavItem[]) {
  const next = [...navItems];

  if (!next.some((item) => item.href === liveNavItem.href)) {
    const catalogIndex = next.findIndex((item) => item.href === "/oportunidades/catalogo");
    next.splice(catalogIndex >= 0 ? catalogIndex + 1 : 0, 0, liveNavItem);
  }

  if (!next.some((item) => item.href === calendarNavItem.href)) {
    const liveIndex = next.findIndex((item) => item.href === liveNavItem.href);
    const compareIndex = next.findIndex((item) => item.href === "/oportunidades/comparar");
    const insertAt = liveIndex >= 0 ? liveIndex + 1 : compareIndex >= 0 ? compareIndex : next.length;
    next.splice(insertAt, 0, calendarNavItem);
  }

  return next;
}

export function OpportunityHeader({
  activeHref,
  navItems,
  logoSrc = defaultLogo,
  ctaHref,
  ctaLabel = "Conversar com o Téo",
  className,
}: OpportunityHeaderProps) {
  const [open, setOpen] = useState(false);
  const mobileMenuId = useId();
  const navigationItems = withPlatformNavigation(navItems);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header
      className={cn(
        "opportunity-surface sticky top-0 z-40 border-b border-tomorrow-line bg-tomorrow-background/90 backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto flex min-h-18 w-full max-w-[90rem] items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-8">
        <a href="/oportunidades" className="opportunity-focus flex items-center gap-3 rounded-xl" aria-label="Tomorrow Travel — Oportunidades">
          <img src={logoSrc} alt="" className="size-11 rounded-xl object-cover ring-1 ring-tomorrow-gold/45" />
          <span className="hidden sm:grid">
            <span className="font-serif text-lg font-semibold leading-none text-tomorrow-gold-soft">Tomorrow</span>
            <span className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-tomorrow-teal-soft">Oportunidades</span>
          </span>
        </a>

        <nav aria-label="Navegação de oportunidades" className="hidden items-center gap-1 lg:flex">
          {navigationItems.map((item) => {
            const active = item.href === activeHref;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "opportunity-focus rounded-xl px-4 py-2 text-sm font-semibold text-tomorrow-muted transition-colors hover:bg-tomorrow-text/5 hover:text-tomorrow-text",
                  active && "bg-tomorrow-gold/10 text-tomorrow-gold-soft",
                )}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {ctaHref ? (
            <OpportunityButton asChild size="sm" className="hidden sm:inline-flex">
              <a href={ctaHref}>{ctaLabel}</a>
            </OpportunityButton>
          ) : null}
          <OpportunityButton
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={open ? "Fechar navegação" : "Abrir navegação"}
            aria-expanded={open}
            aria-controls={mobileMenuId}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </OpportunityButton>
        </div>
      </div>

      {open ? (
        <nav id={mobileMenuId} aria-label="Navegação móvel de oportunidades" className="border-t border-tomorrow-line px-4 pb-5 pt-3 lg:hidden">
          <div className="mx-auto grid w-full max-w-[90rem] gap-2">
            {navigationItems.map((item) => {
              const active = item.href === activeHref;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "opportunity-focus rounded-xl px-4 py-3 text-base font-semibold text-tomorrow-muted",
                    active && "bg-tomorrow-gold/10 text-tomorrow-gold-soft",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              );
            })}
            {ctaHref ? (
              <OpportunityButton asChild fullWidth className="mt-2 sm:hidden">
                <a href={ctaHref}>{ctaLabel}</a>
              </OpportunityButton>
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
