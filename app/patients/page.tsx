"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../components/app-shell";
import { Icon } from "../components/med-icon";
import { getPatientsList } from "../actions/family";
import { cn, patientTone, type PatientTone } from "../lib/cn";
import type { PatientSummary } from "../lib/family/from-prescriptions";

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const result = await getPatientsList();
    if (!result.ok) {
      setError(result.error);
      setPatients([]);
    } else {
      setError("");
      setPatients(result.patients);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AppShell>
      <div className="page-wrap">
        <div className="page-heading">
          <div>
            <p className="eyebrow">PATIENTS</p>
            <h1>Your family</h1>
            <p>Keep each child&apos;s prescriptions and reminders in one clear place.</p>
          </div>
          <Link className="primary-link" href="/prescriptions/new">
            <Icon name="plus" size={18} />
            Add prescription
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-[#e8c5bc] bg-[#f8ece8] px-3 py-2.5 text-sm text-coral" role="alert">
            {error}
          </div>
        )}

        <section className="patient-grid">
          {loading && (
            <p className="text-muted px-1 py-4 text-sm">Loading patients…</p>
          )}
          {!loading && patients.length === 0 && (
            <p className="text-muted px-1 py-4 text-sm">
              No patients yet. Upload a prescription to add someone to your family list.
            </p>
          )}
          {patients.map((person) => (
            <Link className="patient-card" href={`/patients/${person.id}`} key={person.id}>
              <span className={cn("patient-avatar", patientTone[person.tone as PatientTone])}>
                {person.initial}
              </span>
              <div>
                <h2>{person.name}</h2>
                <p>
                  {person.prescriptionCount} active medication
                  {person.prescriptionCount === 1 ? "" : "s"}
                </p>
              </div>
              <span className="card-chevron">
                <Icon name="arrow" size={18} />
              </span>
              <div className="patient-card-footer">
                <span>
                  {person.nextDoseTime ? (
                    <>
                      Next dose <b className="mono">{person.nextDoseTime}</b>
                    </>
                  ) : (
                    <>No doses left today</>
                  )}
                </span>
                <span>
                  <b>{person.adherence}</b> adherence today
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
