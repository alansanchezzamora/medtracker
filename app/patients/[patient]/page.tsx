"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { Icon } from "../../components/med-icon";
import { useCurrentUser } from "../../lib/auth/use-current-user";
import { doses, patients, prescriptions } from "../../lib/demo-data";

export default function PatientDetail() {
  const { patient: id } = useParams<{ patient: string }>();
  const { user } = useCurrentUser();
  const person = patients.find((item) => item.id === id) ?? patients[0];
  const medicines = prescriptions.filter((item) => item.patientId === person.id);
  const completed = doses.filter((dose) => dose.patientId === person.id && dose.state === "Taken").length;
  const caregiver = user?.displayName ?? "Primary caregiver";

  return (
    <AppShell>
      <div className="page-wrap">
        <Link className="back-link" href="/patients">
          ← All patients
        </Link>
        <section className="patient-profile">
          <span className={`patient-avatar large ${person.tone}`}>{person.initial}</span>
          <div>
            <p className="eyebrow">PATIENT PROFILE</p>
            <h1>{person.name}</h1>
            <p>{person.age} · {caregiver} is the primary caregiver</p>
          </div>
          <Link className="secondary-link" href="/patients/new">
            <Icon name="edit" size={16} />
            Add another
          </Link>
        </section>
        <div className="detail-grid">
          <section className="detail-card">
            <div className="card-title">
              <div>
                <h2>Active prescriptions</h2>
                <p>
                  {medicines.length} medication{medicines.length === 1 ? "" : "s"} in progress
                </p>
              </div>
              <Link className="round-add" href={`/prescriptions/new?patient=${person.id}`}>
                <Icon name="plus" size={18} />
              </Link>
            </div>
            {medicines.length ? (
              medicines.map((med) => (
                <div className="prescription-line" key={med.id}>
                  <span className="medicine-symbol">
                    <Icon name="pill" />
                  </span>
                  <div>
                    <h3>
                      {med.medicine} <span className="mono">{med.dosage}</span>
                    </h3>
                    <p>
                      {med.frequency} · <span className="mono">{med.schedule}</span>
                    </p>
                  </div>
                  <Link href="/prescriptions" className="text-button">
                    View
                  </Link>
                </div>
              ))
            ) : (
              <p className="empty-copy">No active prescriptions yet.</p>
            )}
          </section>
          <section className="detail-card adherence-panel">
            <p className="eyebrow">DOSE ACTIVITY</p>
            <strong>{person.adherence}</strong>
            <span>adherence this week</span>
            <div className="week-dots">
              {Array.from({ length: 7 }, (_, i) => (
                <i className={i < Math.min(completed, 7) ? "complete" : ""} key={i}>
                  {i < Math.min(completed, 7) ? "✓" : "—"}
                </i>
              ))}
            </div>
            <Link className="text-button" href="/history">
              See dose history <Icon name="arrow" size={15} />
            </Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
