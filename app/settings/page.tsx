"use client";

import { useState } from "react";
import { AppShell } from "../components/app-shell";
import { Icon } from "../components/med-icon";
import { defaultPreferences } from "../lib/demo-data";

const displayName = "Alex Johnson";
const displayEmail = "alex.johnson@example.com";
const initials = "AJ";

export default function SettingsPage() {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [notice, setNotice] = useState("");
  const toggle = (key: "whatsapp" | "email") => setPreferences({ ...preferences, [key]: !preferences[key] });

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
          <div className="toast">
            <Icon name="check" size={17} />
            {notice}
            <button onClick={() => setNotice("")} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}
        <section className="settings-card">
          <h2>Account</h2>
          <div className="setting-row">
            <span className="avatar caregiver-avatar">{initials}</span>
            <div>
              <strong>{displayName}</strong>
              <small>{displayEmail}</small>
            </div>
            <button className="secondary-link" onClick={() => setNotice("Account details are up to date.")}>Edit</button>
          </div>
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
            <button className="secondary-link" onClick={() => setNotice("Caregiver invites will be available in a future update.")}>Manage</button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
