"use client";

import { useMemo, useState } from "react";
import { AppShell } from "../components/app-shell";
import { Icon } from "../components/med-icon";
import { doses as initialDoses, patients, type Dose, type DoseState } from "../lib/demo-data";
import { formatTodayLabel, resolveSchedule } from "../lib/time";
import { useNow } from "../lib/use-now";

export default function HistoryPage() {
  const now = useNow();
  const [filter, setFilter] = useState("All activity");
  // Manual Taken/Missed toggles for this session only.
  const [overrides, setOverrides] = useState<Record<string, DoseState>>({});

  const doses = useMemo(() => {
    const base = now ? resolveSchedule(initialDoses, now) : initialDoses;
    return base.map((dose) => (overrides[dose.id] ? { ...dose, state: overrides[dose.id] } : dose));
  }, [now, overrides]);

  const shown =
    filter === "All activity" ? doses : doses.filter((dose) => patients.find((patient) => patient.id === dose.patientId)?.name === filter);
  const total = shown.length;
  const taken = shown.filter((dose) => dose.state === "Taken").length;
  const adherence = total ? Math.round((taken / total) * 100) : 0;

  const updateDose = (id: string, state: DoseState) => {
    setOverrides((current) => ({ ...current, [id]: state }));
  };

  const weekLabels = useMemo(() => {
    if (!now) return ["M", "T", "W", "T", "F", "S", "S"];
    // Build Mon–Sun labels for the current week in the client's locale.
    const mondayOffset = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return new Intl.DateTimeFormat(undefined, { weekday: "narrow" }).format(day);
    });
  }, [now]);

  return (
    <AppShell>
      <div className="page-wrap">
        <div className="page-heading">
          <div>
            <p className="eyebrow">ADHERENCE HISTORY</p>
            <h1>Follow-through, at a glance.</h1>
            <p>Review every dose and catch patterns early.</p>
          </div>
          <select className="filter-select" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option>All activity</option>
            {patients.map((patient) => (
              <option key={patient.id}>{patient.name}</option>
            ))}
          </select>
        </div>
        <section className="adherence-summary">
          <div>
            <p>Today</p>
            <strong>{adherence}%</strong>
            <span>of doses confirmed on time</span>
          </div>
          <div className="adherence-chart">
            {[70, 100, 80, 100, 90, 75, 100].map((value, i) => (
              <span key={i}>
                <i style={{ height: `${value}%` }} />
                <small>{weekLabels[i]}</small>
              </span>
            ))}
          </div>
        </section>
        <section className="history-list">
          <div className="history-date">
            <span>{now ? formatTodayLabel(now) : "Today"}</span>
            <small>{shown.length} doses</small>
          </div>
          {shown.map((dose: Dose) => (
            <article className="history-row" key={dose.id}>
              <span className="mono">{dose.time}</span>
              <button
                className={`history-state ${dose.state === "Missed" ? "missed" : ""}`}
                onClick={() => updateDose(dose.id, dose.state === "Taken" ? "Missed" : "Taken")}
                aria-label={`Change ${dose.medicine} dose status`}
              >
                {dose.state === "Taken" ? <Icon name="check" size={14} /> : "!"}
              </button>
              <div>
                <h3>
                  {dose.medicine} <span className="mono">{dose.amount}</span>
                </h3>
                <p>for {dose.child}</p>
              </div>
              <b className={dose.state === "Missed" ? "coral-text" : ""}>{dose.state}</b>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
