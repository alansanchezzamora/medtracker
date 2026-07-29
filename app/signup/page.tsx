import { signUp } from "@/app/actions/auth";
import Link from "next/link";
import { AuthShell } from "../components/auth-shell";
import { Icon } from "../components/med-icon";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell
      eyebrow="GET STARTED"
      title="Create your caregiver account."
      subtitle="Set up MedTracker for your family — schedules, reminders, and dose history in one calm place."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-teal no-underline hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-5 rounded-lg border border-[#e8c5bc] bg-[#f8ece8] px-3 py-2.5 text-sm text-coral" role="alert">
          {error}
        </div>
      )}

      <form action={signUp} className="auth-form grid gap-4">
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
            placeholder="At least 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
            className="rounded-[7px] border border-[#cfd4ce] bg-surface px-3 py-2.5 font-normal text-ink outline-none transition-[border,box-shadow] placeholder:text-[#9aa39e] focus:border-teal focus:outline focus:outline-[3px] focus:outline-[#c4dfd8]"
          />
        </label>
        <p className="text-xs leading-snug text-muted">
          Use a password you can share carefully with other caregivers in your household.
        </p>
        <button type="submit" className="primary-link mt-1 w-full py-3 text-[15px]">
          Create account
          <Icon name="arrow" size={17} />
        </button>
      </form>
    </AuthShell>
  );
}
