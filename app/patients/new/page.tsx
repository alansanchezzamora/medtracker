"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "../../components/app-shell";

export default function NewPatientPage() {
  const [savedName, setSavedName] = useState("");

  return (
    <AppShell>
      <div className="form-wrap">
        <Link className="back-link" href="/patients">
          ← All patients
        </Link>
        <p className="eyebrow">NEW PATIENT</p>
        <h1>Add a family member</h1>
        <p className="form-intro">A few details help keep their prescriptions and reminders organized.</p>
        {savedName ? (
          <div className="success-panel">
            <h2>{savedName} was added</h2>
            <p>Demo mode — changes are not saved yet. They&apos;re ready for their first prescription.</p>
            <Link className="primary-link" href="/prescriptions/new">
              Add prescription
            </Link>
          </div>
        ) : (
          <form
            className="form-card"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              setSavedName(String(form.get("name")));
            }}
          >
            <label>
              Child&apos;s name
              <input required name="name" placeholder="e.g. Sam Johnson" />
            </label>
            <label>
              Date of birth
              <input required name="birthDate" type="date" />
            </label>
            <label>
              Notes <span>(optional)</span>
              <textarea name="notes" placeholder="Allergies, preferences, or care notes" rows={3} />
            </label>
            <button className="primary-link" type="submit">
              Save patient
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
