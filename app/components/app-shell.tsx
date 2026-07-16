"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/cn";
import { Icon, type IconName } from "./med-icon";

const navigation: { label: string; href: string; icon: IconName }[] = [
  { label: "Overview", href: "/", icon: "grid" },
  { label: "Patients", href: "/patients", icon: "people" },
  { label: "Prescriptions", href: "/prescriptions", icon: "pill" },
  { label: "History", href: "/history", icon: "history" },
];

function navClass(active: boolean) {
  return cn(
    "flex items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left text-[#56625c] no-underline transition-colors",
    active ? "bg-teal-soft font-bold text-teal nav-item-active" : "hover:bg-teal-soft hover:text-teal",
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <main className="flex min-h-screen">
      <aside className="flex min-h-screen w-[245px] shrink-0 flex-col border-r border-line bg-surface px-4 pb-[18px] pt-7 max-[850px]:hidden">
        <Link
          className="flex items-center gap-2 px-3 pb-9 font-serif text-[22px] font-semibold tracking-tight text-ink no-underline"
          href="/"
          aria-label="MedTracker home"
        >
          <span className="brand-mark grid size-8 place-items-center -rotate-2 rounded-[9px_9px_9px_3px] bg-teal text-white">
            <Icon name="pill" size={22} />
          </span>
          <span>medtracker</span>
        </Link>
        <nav className="grid gap-1" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className={navClass(isActive(item.href))}>
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto grid gap-3.5">
          <Link href="/settings" className={navClass(pathname === "/settings")}>
            <Icon name="settings" />
            Settings
          </Link>
          <div className="flex items-center gap-2 border-t border-line px-2 pt-4">
            <span className="grid size-8 place-items-center rounded-full bg-[#e4c0a9] text-[11px] font-bold text-[#694630]">AJ</span>
            <span className="grid flex-1 gap-px">
              <strong className="text-[13px]">Alex Johnson</strong>
              <small className="text-muted">Caregiver</small>
            </span>
            <Icon name="more" size={18} />
          </div>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="flex h-[78px] items-center justify-between border-b border-line bg-paper/90 px-[clamp(22px,4vw,61px)] max-[850px]:h-[66px] max-[620px]:px-[18px]">
          <Link
            className="hidden items-center gap-2 font-serif text-xl font-semibold tracking-tight text-ink no-underline max-[850px]:flex"
            href="/"
          >
            <span className="brand-mark grid size-7 place-items-center -rotate-2 rounded-[9px_9px_9px_3px] bg-teal text-white">
              <Icon name="pill" size={19} />
            </span>
            <span>medtracker</span>
          </Link>
          <div className="flex items-center gap-2 text-sm max-[850px]:hidden">
            <span className="text-muted">Tuesday</span>
            <strong className="font-bold">July 14</strong>
            <Icon name="chevron" size={17} />
          </div>
          <div className="flex items-center gap-[18px] max-[620px]:gap-3">
            <button type="button" className="grid place-items-center border-0 bg-transparent text-[#53615a]" aria-label="Notifications">
              <Icon name="bell" />
            </button>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-[7px] border-0 bg-amber px-3.5 py-2.5 text-sm font-bold text-[#fffdf9] no-underline hover:bg-amber-dark max-[620px]:p-2.5 max-[620px]:text-[0px]"
              href="/patients/new"
            >
              <Icon name="plus" size={18} />
              Add patient
            </Link>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
