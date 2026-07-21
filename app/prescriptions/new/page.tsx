"use client";

import { useActionState } from "react";
import { AppShell } from "@/app/components/app-shell";
import { readPrescription } from "@/app/actions/prescriptions";
import type { ReadPrescriptionState } from "@/app/lib/prescriptions/types";

const initialState: ReadPrescriptionState = { status: "idle" };

export default function UploadPrescriptionPage() {
  const [state, formAction, pending] = useActionState(readPrescription, initialState);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="font-serif text-2xl font-semibold text-ink">Upload a prescription</h1>
        <p className="mt-1 text-muted">
          Add a photo or PDF of the prescription. We read the medications so you do not have
          to type them in.
        </p>

        <form
          action={formAction}
          className="mt-6 grid gap-4 rounded-xl border border-line bg-surface p-6"
        >
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,application/pdf"
            required
            className="text-sm text-ink file:mr-4 file:rounded-lg file:border-0 file:bg-teal-soft file:px-4 file:py-2 file:font-medium file:text-teal"
          />
          <button
            type="submit"
            disabled={pending}
            className="justify-self-start rounded-lg bg-teal px-5 py-2.5 font-bold text-white disabled:opacity-60"
          >
            {pending ? "Reading…" : "Read prescription"}
          </button>
        </form>

        {state.status === "error" && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {state.message}
          </p>
        )}

        {state.status === "success" && (
          <div className="mt-6 rounded-xl border border-line bg-surface p-6">
            <p className="text-sm text-muted">Patient</p>
            <p className="mb-4 text-lg font-semibold text-ink">{state.data.patientName}</p>

            <div className="grid gap-3">
              {state.data.medications.map((med, index) => (
                <div key={index} className="rounded-lg border border-line p-4">
                  <p className="font-semibold text-ink">{med.medicationName}</p>
                  <p className="text-sm text-muted">
                    {med.dosage} · {med.frequency}
                    {med.asNeeded
                      ? " · as needed"
                      : med.durationDays
                        ? ` · for ${med.durationDays} days`
                        : ""}
                  </p>
                </div>
              ))}
            </div>

            <pre className="mt-4 overflow-x-auto rounded-lg bg-black/5 p-3 text-xs text-ink">
              {JSON.stringify(state.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </AppShell>
  );
}
