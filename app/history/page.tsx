"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AppShell } from "../components/app-shell";
import { Icon } from "../components/med-icon";
import { getAdherenceHistory, setDoseStatus } from "../actions/family";
import type { Dose, DoseState } from "../lib/schedule/types";
import { formatTodayLabel, resolveSchedule } from "../lib/time";
import { useNow } from "../lib/use-now";

export default function HistoryPage() {
  const now = useNow();
  const [filter, setFilter] = useState("All activity");
  const [initialDoses, setInitialDoses] = useState<Dose[]>([]);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [weekPercents, setWeekPercents] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const result = await getAdherenceHistory();
    if (!result.ok) {
      setError(result.error);
      setInitialDoses([]);
      setPatients([]);
    } else {
      setError("");
      setInitialDoses(result.doses);
      setPatients(result.patients);
      setWeekPercents(result.weekPercents);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const doses = useMemo(() => {
    return now ? resolveSchedule(initialDoses, now) : initialDoses;
  }, [now, initialDoses]);

  const shown =
    filter === "All activity"
      ? doses
      : doses.filter(
          (dose) =>
            patients.find((patient) => patient.id === dose.patientId)?.name === filter ||
            dose.child === filter,
        );

  const total = shown.length;
  const taken = shown.filter((dose) => dose.state === "Taken").length;
  const adherence = total ? Math.round((taken / total) * 100) : 0;

  const updateDose = (id: string, state: DoseState) => {
    const nextStatus = state === "Taken" ? "taken" : "missed";
    // Optimistic UI
    setInitialDoses((current) =>
      current.map((dose) =>
        dose.id === id
          ? {
              ...dose,
              state,
              reminderStatus: nextStatus,
              detail: state === "Taken" ? "Confirmed taken" : "Marked missed",
            }
          : dose,
      ),
    );
    startTransition(async () => {
      const result = await setDoseStatus(id, nextStatus);
      if (!result.ok) {
        setError(result.error);
        await refresh();
        return;
      }
      await refresh();
    });
  };

  const weekLabels = useMemo(() => {
    if (!now) return ["M", "T", "W", "T", "F", "S", "S"];
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
          <select
            className="filter-select"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option>All activity</option>
            {patients.map((patient) => (
              <option key={patient.id}>{patient.name}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-[#e8c5bc] bg-[#f8ece8] px-3 py-2.5 text-sm text-coral" role="alert">
            {error}
          </div>
        )}

        <section className="adherence-summary">
          <div>
            <p>Today</p>
            <strong>{loading ? "…" : `${adherence}%`}</strong>
            <span>of doses confirmed on time</span>
          </div>
          <div className="adherence-chart">
            {weekPercents.map((value, i) => (
              <span key={i}>
                <i style={{ height: `${Math.max(value, 4)}%` }} />
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
          {loading && (
            <p className="text-muted px-1 py-4 text-sm">Loading history…</p>
          )}
          {!loading && shown.length === 0 && (
            <p className="text-muted px-1 py-4 text-sm">
              No doses for today yet. Upload a prescription to start tracking.
            </p>
          )}
          {shown.map((dose: Dose) => (
            <article className="history-row" key={dose.id}>
              <span className="mono">{dose.time}</span>
              <button
                className={`history-state ${dose.state === "Missed" ? "missed" : ""}`}
                onClick={() =>
                  updateDose(dose.id, dose.state === "Taken" ? "Missed" : "Taken")
                }
                aria-label={`Change ${dose.medicine} dose status`}
                disabled={pending}
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
