"use client";

import Link from "next/link";
import { AppShell } from "../components/app-shell";
import { Icon } from "../components/med-icon";
import { cn, patientTone, type PatientTone } from "../lib/cn";
import { patients } from "../lib/demo-data";

export default function PatientsPage() {
  return (
    <AppShell>
      <div className="page-wrap">
        <div className="page-heading">
          <div>
            <p className="eyebrow">PATIENTS</p>
            <h1>Your family</h1>
            <p>Keep each child&apos;s prescriptions and reminders in one clear place.</p>
          </div>
          <Link className="primary-link" href="/patients/new">
            <Icon name="plus" size={18} />
            Add patient
          </Link>
        </div>
        <section className="patient-grid">
          {patients.map((person) => (
            <Link className="patient-card" href={`/patients/${person.id}`} key={person.id}>
              <span className={cn("patient-avatar", patientTone[person.tone as PatientTone])}>{person.initial}</span>
              <div>
                <h2>{person.name}</h2>
                <p>
                  {person.age} · {person.prescriptions} active prescription{person.prescriptions === 1 ? "" : "s"}
                </p>
              </div>
              <span className="card-chevron">
                <Icon name="arrow" size={18} />
              </span>
              <div className="patient-card-footer">
                <span>
                  Next dose <b className="mono">{person.nextDose}</b>
                </span>
                <span>
                  <b>{person.adherence}</b> adherence this week
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
