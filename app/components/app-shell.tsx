"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useCurrentUser } from "../lib/auth/use-current-user";
import { formatMonthDay, formatWeekday } from "../lib/time";
import { useNow } from "../lib/use-now";
import { Icon, type IconName } from "./med-icon";
import { ReminderTicker } from "./reminder-ticker";

// Shared primary routes. Desktop sidebar, mobile drawer, and bottom dock all read this list.
const navigation: { label: string; href: string; icon: IconName }[] = [
  { label: "Overview", href: "/", icon: "grid" },
  { label: "Patients", href: "/patients", icon: "people" },
  { label: "Prescriptions", href: "/prescriptions", icon: "pill" },
  { label: "History", href: "/history", icon: "history" },
];

function navClass(active: boolean) {
  return [
    "flex items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left text-[#56625c] no-underline transition-colors",
    active ? "bg-teal-soft font-bold text-teal nav-item-active" : "hover:bg-teal-soft hover:text-teal",
  ].join(" ");
}

function bottomNavClass(active: boolean) {
  return [
    "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold tracking-wide no-underline transition-colors",
    active ? "bg-teal-soft text-teal nav-item-active" : "text-[#66736c] active:bg-teal-soft/60",
  ].join(" ");
}

/**
 * App chrome for signed-in screens.
 * Mobile-first: bottom dock + slide-out drawer. From lg up: fixed sidebar.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();
  const now = useNow();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerTitleId = useId();

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  const closeMenu = () => setMenuOpen(false);

  // Changing pages should close the drawer; otherwise it sticks open under the new route.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    // Stop background scroll while the sheet is open (phones especially).
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const brand = (
    <Link
      className="flex items-center gap-2 font-serif text-[22px] font-semibold tracking-tight text-ink no-underline"
      href="/"
      aria-label="MedTracker home"
      onClick={closeMenu}
    >
      <span className="brand-mark grid size-8 place-items-center -rotate-2 rounded-[9px_9px_9px_3px] bg-teal text-white">
        <Icon name="pill" size={22} />
      </span>
      <span>medtracker</span>
    </Link>
  );

  const primaryNav = (
    <nav className="grid gap-1" aria-label="Primary navigation">
      {navigation.map((item) => (
        <Link key={item.href} href={item.href} className={navClass(isActive(item.href))} onClick={closeMenu}>
          <Icon name={item.icon} />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const accountBlock = (
    <div className="mt-auto grid gap-3.5">
      <Link href="/settings" className={navClass(pathname === "/settings")} onClick={closeMenu}>
        <Icon name="settings" />
        Settings
      </Link>
      <Link
        href="/settings"
        onClick={closeMenu}
        className="flex items-center gap-2 border-t border-line px-2 pt-4 text-inherit no-underline"
        aria-label="Open account settings"
      >
        <span className="grid size-8 place-items-center rounded-full bg-[#e4c0a9] text-[11px] font-bold text-[#694630]">
          {loading ? "…" : user?.initials ?? "—"}
        </span>
        <span className="grid min-w-0 flex-1 gap-px">
          <strong className="truncate text-[13px]">{loading ? "Loading…" : user?.displayName ?? "Signed out"}</strong>
          <small className="truncate text-muted">{user?.email ?? "Caregiver"}</small>
        </span>
        <Icon name="more" size={18} />
      </Link>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-paper">
      <ReminderTicker enabled={!loading && Boolean(user)} />
      {/* lg+: always-visible sidebar */}
      <aside className="hidden min-h-dvh w-[245px] shrink-0 flex-col border-r border-line bg-surface px-4 pb-[18px] pt-7 lg:flex">
        <div className="px-3 pb-9">{brand}</div>
        {primaryNav}
        {accountBlock}
      </aside>

      {/* <lg: off-canvas menu (hamburger). Kept mounted so the slide animation works. */}
      <div
        className={[
          "fixed inset-0 z-50 lg:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className={[
            "absolute inset-0 border-0 bg-ink/35 transition-opacity duration-300",
            menuOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-label="Close menu"
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
        />
        <aside
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby={drawerTitleId}
          className={[
            "absolute inset-y-0 left-0 flex w-[min(86vw,300px)] flex-col border-r border-line bg-surface px-4 pb-[calc(18px+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] shadow-[12px_0_40px_rgba(33,48,42,0.12)] transition-transform duration-300 ease-out",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="mb-8 flex items-center justify-between gap-3 px-1">
            <div id={drawerTitleId}>{brand}</div>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-lg border border-line bg-paper text-ink"
              aria-label="Close navigation"
              onClick={closeMenu}
            >
              <Icon name="close" size={22} />
            </button>
          </div>
          {primaryNav}
          {accountBlock}
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur-sm sm:h-16 sm:px-5 lg:h-[78px] lg:px-[clamp(22px,4vw,61px)]">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink lg:hidden"
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-drawer"
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="menu" size={22} />
            </button>

            <Link
              className="flex min-w-0 items-center gap-2 font-serif text-lg font-semibold tracking-tight text-ink no-underline sm:text-xl lg:hidden"
              href="/"
            >
              <span className="brand-mark grid size-7 place-items-center -rotate-2 rounded-[9px_9px_9px_3px] bg-teal text-white">
                <Icon name="pill" size={19} />
              </span>
              <span className="truncate">medtracker</span>
            </Link>

            <div className="hidden items-center gap-2 text-sm lg:flex" aria-live="polite">
              <span className="text-muted">{now ? formatWeekday(now) : "\u00a0"}</span>
              <strong className="font-bold">{now ? formatMonthDay(now) : "\u00a0"}</strong>
              <Icon name="chevron" size={17} />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <p className="hidden text-right text-xs text-muted sm:block lg:hidden" aria-live="polite">
              {now ? (
                <>
                  <span className="block font-bold text-ink">{formatWeekday(now)}</span>
                  {formatMonthDay(now)}
                </>
              ) : null}
            </p>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-lg border-0 bg-transparent text-[#53615a]"
              aria-label="Notifications"
            >
              <Icon name="bell" />
            </button>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-[7px] border-0 bg-amber px-3 py-2.5 text-sm font-bold text-[#fffdf9] no-underline hover:bg-amber-dark sm:px-3.5"
              href="/patients/new"
            >
              <Icon name="plus" size={18} />
              <span className="hidden sm:inline">Add patient</span>
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>

        {/* Thumb-zone tabs for phone / small tablet. Hidden once the sidebar appears. */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 shadow-[0_-8px_24px_rgba(33,48,42,0.06)] backdrop-blur-md lg:hidden"
          aria-label="Primary mobile navigation"
        >
          <div className="mx-auto flex max-w-lg items-stretch gap-1">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className={bottomNavClass(isActive(item.href))}>
                <Icon name={item.icon} size={22} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
