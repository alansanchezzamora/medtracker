import Link from "next/link";
import { Icon } from "./med-icon";

/**
 * Shared layout for /login and /signup.
 * Keeps brand + form framing in one place so the two pages only differ by copy and fields.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      {/* Decorative only — see .auth-atmosphere in globals.css */}
      <div className="auth-atmosphere" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-[440px]">
        <Link
          href="/"
          className="mb-10 flex items-center justify-center gap-2.5 font-serif text-[26px] font-semibold tracking-tight text-ink no-underline"
          aria-label="MedTracker home"
        >
          <span className="brand-mark grid size-9 place-items-center -rotate-2 rounded-[9px_9px_9px_3px] bg-teal text-white shadow-[0_6px_16px_rgba(31,110,99,0.25)]">
            <Icon name="pill" size={22} />
          </span>
          <span>medtracker</span>
        </Link>

        <section className="auth-panel rounded-[14px] border border-line bg-surface px-7 py-8 shadow-[0_18px_40px_rgba(33,48,42,0.07)] sm:px-9 sm:py-9">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mb-2 font-serif text-[32px] leading-tight tracking-tight text-ink sm:text-[36px]">{title}</h1>
          <p className="mb-7 text-[15px] leading-snug text-muted">{subtitle}</p>
          {children}
        </section>

        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
      </div>
    </main>
  );
}
