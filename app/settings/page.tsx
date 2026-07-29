"use client";

import { useEffect, useState, useTransition } from "react";
import { updateProfile, signOut } from "../actions/auth";
import { AppShell } from "../components/app-shell";
import { Icon } from "../components/med-icon";
import { useCurrentUser } from "../lib/auth/use-current-user";
import { defaultPreferences } from "../lib/demo-data";

export default function SettingsPage() {
  const { user, loading, refresh } = useCurrentUser();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  // Keep the edit form in sync when the session user loads / refreshes.
  useEffect(() => {
    if (!user) return;
    setFullName(user.displayName);
    setEmail(user.email);
  }, [user]);

  const toggle = (key: "whatsapp" | "email") => setPreferences({ ...preferences, [key]: !preferences[key] });

  const displayName = user?.displayName ?? (loading ? "Loading…" : "Caregiver");
  const displayEmail = user?.email ?? "";
  const initials = user?.initials ?? "—";

  const cancelEdit = () => {
    setEditing(false);
    setError("");
    if (user) {
      setFullName(user.displayName);
      setEmail(user.email);
    }
  };

  const saveProfile = (formData: FormData) => {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Pull the new name/email into the sidebar without a hard refresh.
      await refresh();
      setEditing(false);

      if (result.emailChangePending) {
        setNotice("Profile saved. Check your inbox to confirm the new email address.");
      } else {
        setNotice("Your profile was updated.");
      }
    });
  };

  return (
    <AppShell>
      <div className="page-wrap settings-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">SETTINGS</p>
            <h1>Your care preferences</h1>
            <p>Choose how MedTracker keeps your family on schedule.</p>
          </div>
        </div>

        {notice && (
          <div className="toast" role="status">
            <Icon name="check" size={17} />
            {notice}
            <button onClick={() => setNotice("")} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-[#e8c5bc] bg-[#f8ece8] px-3 py-2.5 text-sm text-coral" role="alert">
            {error}
          </div>
        )}

        <section className="settings-card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="!mb-0">Account</h2>
            {!editing && (
              <button type="button" className="secondary-link" onClick={() => setEditing(true)} disabled={loading || !user}>
                <Icon name="edit" size={16} />
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <form action={saveProfile} className="grid gap-4">
              <div className="flex items-center gap-3">
                <span className="avatar caregiver-avatar">{initials}</span>
                <div className="min-w-0">
                  <strong className="block truncate">{fullName || displayName}</strong>
                  <small className="text-muted">Update how you appear across MedTracker</small>
                </div>
              </div>

              <label className="grid gap-1.5 text-sm font-bold text-ink">
                Full name
                <input
                  name="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  autoComplete="name"
                  placeholder="e.g. Alex Johnson"
                  className="rounded-[7px] border border-[#cfd4ce] bg-surface px-3 py-2.5 font-normal text-ink outline-none transition-[border,box-shadow] placeholder:text-[#9aa39e] focus:border-teal focus:outline focus:outline-[3px] focus:outline-[#c4dfd8]"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-bold text-ink">
                Email
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="rounded-[7px] border border-[#cfd4ce] bg-surface px-3 py-2.5 font-normal text-ink outline-none transition-[border,box-shadow] placeholder:text-[#9aa39e] focus:border-teal focus:outline focus:outline-[3px] focus:outline-[#c4dfd8]"
                />
              </label>
              <p className="text-xs leading-snug text-muted">Changing email may require confirmation from both addresses.</p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button type="submit" className="primary-link" disabled={pending}>
                  {pending ? "Saving…" : "Save changes"}
                </button>
                <button type="button" className="secondary-link" onClick={cancelEdit} disabled={pending}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="setting-row !border-0 !pt-0">
              <span className="avatar caregiver-avatar">{initials}</span>
              <div>
                <strong>{displayName}</strong>
                <small>{displayEmail || "Signed in caregiver"}</small>
              </div>
              <form action={signOut}>
                <button className="secondary-link" type="submit">
                  Sign out
                </button>
              </form>
            </div>
          )}
        </section>

        <section className="settings-card">
          <h2>Reminder delivery</h2>
          <div className="setting-row">
            <span className="setting-icon"><Icon name="phone" /></span>
            <div>
              <strong>WhatsApp reminders</strong>
              <small>Send a message when a dose is due.</small>
            </div>
            <button className={`toggle ${preferences.whatsapp ? "on" : ""}`} aria-label="Toggle WhatsApp reminders" onClick={() => toggle("whatsapp")}>
              <i />
            </button>
          </div>
          <div className="setting-row">
            <span className="setting-icon"><Icon name="bell" /></span>
            <div>
              <strong>Email fallback</strong>
              <small>Use email when a WhatsApp message fails.</small>
            </div>
            <button className={`toggle ${preferences.email ? "on" : ""}`} aria-label="Toggle email fallback" onClick={() => toggle("email")}>
              <i />
            </button>
          </div>
        </section>

        <section className="settings-card">
          <h2>Caregivers</h2>
          <div className="setting-row">
            <span className="avatar caregiver-avatar">{initials}</span>
            <div>
              <strong>{displayName}</strong>
              <small>Owner · Full access</small>
            </div>
            <button className="secondary-link" onClick={() => setNotice("Caregiver invites will be available in a future update.")}>
              Manage
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
