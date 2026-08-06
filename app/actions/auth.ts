"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";

// Only allow same-origin relative paths. Blocks open redirects like //evil.com.
function safeNextPath(raw: FormDataEntryValue | null) {
  const value = typeof raw === "string" ? raw : "";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const next = safeNextPath(formData.get("next"));

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    const params = new URLSearchParams({ error: error.message });
    if (next !== "/") params.set("next", next);
    redirect(`/login?${params.toString()}`);
  }

  redirect(next);
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Supabase usually wants email confirm before the session is usable.
  redirect("/login?message=Check your email to confirm your account");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type UpdateProfileResult =
  | { ok: true; emailChangePending?: boolean }
  | { ok: false; error: string };

// Returns a result instead of redirecting so the settings UI can show inline errors.
export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to update your profile." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!fullName) {
    return { ok: false, error: "Name is required." };
  }

  if (!email) {
    return { ok: false, error: "Email is required." };
  }

  const emailChanged = email !== (user.email ?? "").toLowerCase();

  // Name lives in user_metadata. Email changes often need a confirm link.
  const { error } = await supabase.auth.updateUser({
    ...(emailChanged ? { email } : {}),
    data: {
      full_name: fullName,
      name: fullName,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, emailChangePending: emailChanged };
}
