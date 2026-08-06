"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { Icon } from "../../components/med-icon";
import { getPatientDetail } from "../../actions/family";
import { useCurrentUser } from "../../lib/auth/use-current-user";
import type { CabinetMedication, PatientSummary } from "../../lib/family/from-prescriptions";
import type { Dose } from "../../lib/schedule/types";

export default function PatientDetail() {
  const { patient: id } = useParams<{ patient: string }>();
  const { user } = useCurrentUser();
  const caregiver = user?.displayName ?? "Primary caregiver";

  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [medicines, setMedicines] = useState<CabinetMedication[]>([]);
  const [todayDoses, setTodayDoses] = useState<Dose[]>([]);
  const [weekTakenDays, setWeekTakenDays] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!id) return;
    const result = await getPatientDetail(id);
    if (!result.ok) {
      setError(result.error);
      setPatient(null);
      setMedicines([]);
      setTodayDoses([]);
      setWeekTakenDays([]);
    } else {
      setError("");
      setPatient(result.patient);
      setMedicines(result.medications);
      setTodayDoses(result.todayDoses);
      setWeekTakenDays(result.weekTakenDays);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return (
      <AppShell>
        <div className="page-wrap">
          <p className="text-muted">Loading patient…</p>
        </div>
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell>
        <div className="page-wrap">
          <Link className="back-link" href="/patients">
            ← All patients
          </Link>
          <p className="text-coral mt-4">{error || "Patient not found."}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-wrap">
        <Link className="back-link" href="/patients">
          ← All patients
        </Link>
        <section className="patient-profile">
          <span className={`patient-avatar large ${patient.tone}`}>{patient.initial}</span>
          <div>
            <p className="eyebrow">PATIENT PROFILE</p>
            <h1>{patient.name}</h1>
            <p>
              {patient.prescriptionCount} medication
              {patient.prescriptionCount === 1 ? "" : "s"} · {caregiver} is the primary caregiver
            </p>
          </div>
          <Link className="secondary-link" href="/prescriptions/new">
            <Icon name="edit" size={16} />
            Add prescription
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
              <Link className="round-add" href="/prescriptions/new">
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
            <strong>{patient.adherence}</strong>
            <span>adherence today</span>
            <div className="week-dots">
              {weekTakenDays.map((complete, i) => (
                <i className={complete ? "complete" : ""} key={i}>
                  {complete ? "✓" : "—"}
                </i>
              ))}
            </div>
            <p className="text-muted mt-2 text-xs">
              {todayDoses.length
                ? `${todayDoses.filter((d) => d.state === "Taken").length} of ${todayDoses.length} doses confirmed today`
                : "No doses scheduled today"}
            </p>
            <Link className="text-button" href="/history">
              See dose history <Icon name="arrow" size={15} />
            </Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
