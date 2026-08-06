import { signIn } from "@/app/actions/auth";
import Link from "next/link";
import { AuthShell } from "../components/auth-shell";
import { Icon } from "../components/med-icon";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { error, message, next } = await searchParams;
  // Same open-redirect guard as signIn — only accept relative paths.
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="Sign in to your family care."
      subtitle="Pick up today’s schedule, confirm doses, and keep everyone on track."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-bold text-teal no-underline hover:underline">
            Create one
          </Link>
        </>
      }
    >
      {message && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-[#c5ddd6] bg-[#e3efeb] px-3 py-2.5 text-sm text-[#16584e]" role="status">
          <Icon name="check" size={17} />
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg border border-[#e8c5bc] bg-[#f8ece8] px-3 py-2.5 text-sm text-coral" role="alert">
          {error}
        </div>
      )}

      <form action={signIn} className="auth-form grid gap-4">
        <input type="hidden" name="next" value={nextPath} />
        <label className="grid gap-1.5 text-sm font-bold text-ink">
          Email
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="rounded-[7px] border border-[#cfd4ce] bg-surface px-3 py-2.5 font-normal text-ink outline-none transition-[border,box-shadow] placeholder:text-[#9aa39e] focus:border-teal focus:outline focus:outline-[3px] focus:outline-[#c4dfd8]"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-ink">
          Password
          <input
            name="password"
            type="password"
            placeholder="Your password"
            required
            autoComplete="current-password"
            className="rounded-[7px] border border-[#cfd4ce] bg-surface px-3 py-2.5 font-normal text-ink outline-none transition-[border,box-shadow] placeholder:text-[#9aa39e] focus:border-teal focus:outline focus:outline-[3px] focus:outline-[#c4dfd8]"
          />
        </label>
        <button type="submit" className="primary-link mt-1 w-full py-3 text-[15px]">
          Sign in
          <Icon name="arrow" size={17} />
        </button>
      </form>
    </AuthShell>
  );
}
