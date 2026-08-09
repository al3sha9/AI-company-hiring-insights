"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Popover,
  PopoverButton,
  PopoverBackdrop,
  PopoverPanel,
} from "@headlessui/react";
import clsx from "clsx";

import { Container } from "@/components/Container";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";

const navigation = [
  { label: "AI Insights", href: "https://ai-insights.100xbetter.ai/", external: false },
  { label: "AI Plan Finder", href: "https://aimodels.100xbetter.ai/", external: true },
  { label: "AI Model Finder", href: "https://aimodels.100xbetter.ai/ai-model-finder", external: true },
  { label: "Stock Valuation Tool", href: "https://stockvaluecalculator.100xbetter.ai/", external: true },
  { label: "About", href: "https://100xbetter.ai/about", external: true },
  { label: "Contact", href: "https://100xbetter.ai/contact", external: true },
  { label: "AI training", href: "https://100xbetter.ai/ai-training", external: true },
];

function MobileNavLink({
  href,
  children,
  target,
  rel,
}: {
  href: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}) {
  return (
    <PopoverButton
      as={Link}
      href={href}
      target={target}
      rel={rel}
      prefetch={false}
      className="block w-full p-2"
    >
      {children}
    </PopoverButton>
  );
}

function MobileNavIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 overflow-visible stroke-slate-700"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path
        d="M0 1H14M0 7H14M0 13H14"
        className={clsx(
          "origin-center transition",
          open && "scale-90 opacity-0",
        )}
      />
      <path
        d="M2 2L12 12M12 2L2 12"
        className={clsx(
          "origin-center transition",
          !open && "scale-90 opacity-0",
        )}
      />
    </svg>
  );
}

function MobileNavigation() {
  return (
    <Popover>
      <PopoverButton
        className="relative z-10 flex h-8 w-8 items-center justify-center focus:not-data-focus:outline-hidden"
        aria-label="Toggle Navigation"
      >
        {({ open }) => <MobileNavIcon open={open} />}
      </PopoverButton>
      <PopoverBackdrop
        transition
        className="fixed inset-0 bg-slate-300/50 duration-75 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in"
      />
      <PopoverPanel
        transition
        className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-2xl bg-white p-4 text-lg tracking-tight text-slate-900 ring-1 shadow-xl ring-slate-900/5 data-closed:scale-95 data-closed:opacity-0 data-enter:duration-75 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
      >
        {navigation.map((item) => (
          <MobileNavLink
            href={item.href}
            key={item.href}
            rel={item.external ? "noopener noreferrer" : undefined}
            target={item.external ? "_blank" : undefined}
          >
            {item.label}
          </MobileNavLink>
        ))}
      </PopoverPanel>
    </Popover>
  );
}

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname === "/embed") return null;

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 py-5 md:bg-transparent sm:bg-white",
        scrolled &&
          "md:shadow-md md:bg-white/70 bg-white md:backdrop-blur md:supports-[backdrop-filter]:bg-white/60 transition-shadow",
      )}
    >
      <Container>
        <nav className="relative z-50 flex justify-between">
          <div className="flex items-center md:gap-x-12">
            <Link href="https://100xbetter.ai/" className="100xbetter" aria-label="Home">
              <Logo className="h-16 w-auto" />
            </Link>
            <div className="hidden items-center gap-x-1 lg:flex xl:gap-x-2">
              {navigation.map((item) => (
                <NavLink
                  href={item.href}
                  key={item.href}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  target={item.external ? "_blank" : undefined}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-x-5 md:gap-x-8">
            <div className="-mr-1 lg:hidden">
              <MobileNavigation />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}
