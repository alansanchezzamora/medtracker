"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../components/app-shell";
import { Icon } from "../components/med-icon";
import { getPrescriptionCabinet } from "../actions/family";
import type { CabinetMedication } from "../lib/family/from-prescriptions";

export default function PrescriptionsPage() {
  const [medications, setMedications] = useState<CabinetMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const result = await getPrescriptionCabinet();
    if (!result.ok) {
      setError(result.error);
      setMedications([]);
    } else {
      setError("");
      setMedications(result.medications);
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
            <p className="eyebrow">PRESCRIPTIONS</p>
            <h1>Medication cabinet</h1>
            <p>Active medications and their schedules.</p>
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

        <section className="prescription-list">
          {loading && (
            <p className="text-muted px-1 py-4 text-sm">Loading prescriptions…</p>
          )}
          {!loading && medications.length === 0 && (
            <p className="text-muted px-1 py-4 text-sm">
              No prescriptions yet. Scan one to fill this cabinet.
            </p>
          )}
          {medications.map((item) => (
            <article className="prescription-card" key={item.id}>
              <span className={`prescription-tab ${item.tone}`} />
              <div className="prescription-main">
                <div className="medicine-symbol">
                  <Icon name="pill" />
                </div>
                <div>
                  <p className="eyebrow">FOR {item.patient.toUpperCase()}</p>
                  <h2>
                    {item.medicine} <span className="mono">{item.dosage}</span>
                  </h2>
                  <p>
                    {item.frequency} · scheduled at{" "}
                    <span className="mono">{item.schedule}</span>
                  </p>
                </div>
              </div>
              <div className="prescription-meta">
                <span>
                  <Icon name="calendar" size={16} />
                  {item.refills}
                </span>
                <Link href={`/patients/${item.patientId}`} className="secondary-link">
                  View patient
                </Link>
              </div>
            </article>
          ))}
        </section>
        <Link className="scan-cta" href="/prescriptions/new">
          <span className="upload-icon">
            <Icon name="upload" size={23} />
          </span>
          <span>
            <strong>Scan a prescription</strong>
            <small>Upload a PDF or photo to prefill the details.</small>
          </span>
          <Icon name="arrow" />
        </Link>
      </div>
    </AppShell>
  );
}
