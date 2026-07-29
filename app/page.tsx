"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "./components/app-shell";
import { Icon } from "./components/med-icon";
import { useCurrentUser } from "./lib/auth/use-current-user";
import { doses as scheduleDoses, patients } from "./lib/demo-data";
import { formatCountdown, greetingForHour, minutesUntilTime, resolveSchedule } from "./lib/time";
import { useNow } from "./lib/use-now";

export default function DashboardPage() {
  const { user } = useCurrentUser();
  const now = useNow();
  // Session-only confirms until dose logs are stored in the DB.
  const [takenIds, setTakenIds] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState("");

  // Recompute Taken / Next / Upcoming from the client clock + any manual confirms.
  const liveDoses = useMemo(() => (now ? resolveSchedule(scheduleDoses, now, takenIds) : scheduleDoses), [now, takenIds]);
  const nextDose = liveDoses.find((dose) => dose.state === "Next dose") ?? liveDoses.find((dose) => dose.state === "Upcoming");
  const allDone = liveDoses.every((dose) => dose.state === "Taken");
  const greetingName = user?.firstName ?? "there";
  // "Hello" until useNow hydrates — avoids flashing the wrong time-of-day greeting.
  const greeting = now ? greetingForHour(now.getHours()) : "Hello";
  const countdown =
    now && nextDose && nextDose.state !== "Taken" ? formatCountdown(minutesUntilTime(nextDose.time, now)) : "DONE";

  const confirmDose = (doseId: string, child: string) => {
    setTakenIds((current) => new Set(current).add(doseId));
    setNotice(`Dose marked as taken — ${child} is on schedule.`);
  };

  return (
    <AppShell>
      <div className="dashboard">
        <section className="welcome-row">
          <div>
            <p className="eyebrow">YOUR FAMILY&apos;S DAY</p>
            <h1>
              {greeting}, {greetingName}.
            </h1>
            <p className="subhead">Here&apos;s what&apos;s on the schedule.</p>
          </div>
        </section>

        <section className="today-card">
          {allDone || !nextDose ? (
            <>
              <div className="card-label">
                <span className="pulse" />
                TODAY&apos;S DOSES <span className="label-divider" /> COMPLETE
              </div>
              <div className="dose-hero">
                <div className="child-avatar peach">✓</div>
                <div className="dose-copy">
                  <div>
                    <h2>All caught up</h2>
                    <p>Every scheduled dose for today has been confirmed.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="card-label">
                <span className="pulse" />
                NEXT DOSE <span className="label-divider" /> {countdown}
              </div>
              <div className="dose-hero">
                <div className={`child-avatar ${nextDose.patientId === "mia" ? "peach" : "blue"}`}>{nextDose.child[0]}</div>
                <div className="dose-copy">
                  <span className="mono time">{nextDose.time}</span>
                  <div>
                    <h2>
                      {nextDose.medicine} <span className="mono">{nextDose.amount}</span>
                    </h2>
                    <p>
                      for {nextDose.child}
                      {nextDose.detail ? ` · ${nextDose.detail}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  className={`confirm-dose ${takenIds.has(nextDose.id) ? "confirmed" : ""}`}
                  onClick={() => confirmDose(nextDose.id, nextDose.child)}
                >
                  {takenIds.has(nextDose.id) ? (
                    <>
                      <Icon name="check" size={19} />
                      Dose taken
                    </>
                  ) : (
                    <>
                      <Icon name="check" size={19} />
                      Confirm dose
                    </>
                  )}
                </button>
              </div>
              <div className="dose-note">
                <Icon name="bell" size={16} />
                A WhatsApp reminder will be sent at <span className="mono">{nextDose.time}</span>.
              </div>
            </>
          )}
        </section>

        {notice && (
          <div className="toast" role="status">
            <Icon name="check" size={17} />
            {notice}
            <button onClick={() => setNotice("")} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}

        <div className="section-heading">
          <div>
            <h2>Today&apos;s schedule</h2>
            <p>
              {liveDoses.length} doses across {patients.length} patients
            </p>
          </div>
          <Link className="text-button" href="/history">
            View history <Icon name="arrow" size={16} />
          </Link>
        </div>

        <section className="schedule">
          {liveDoses.map((dose) => (
            <article className={`schedule-row ${dose.state === "Next dose" ? "is-next" : ""}`} key={dose.id}>
              <time className="mono">{dose.time}</time>
              <span className={`timeline-dot ${dose.state === "Taken" ? "done" : ""}`} />
              <div className={`row-avatar ${dose.patientId === "mia" ? "peach" : "blue"}`}>{dose.child[0]}</div>
              <div className="medicine">
                <h3>
                  {dose.medicine} <span className="mono">{dose.amount}</span>
                </h3>
                <p>
                  for {dose.child} · {dose.detail}
                </p>
              </div>
              <span className={`status ${dose.state.toLowerCase().replace(" ", "-")}`}>
                {dose.state === "Taken" && <Icon name="check" size={14} />}
                {dose.state}
              </span>
              {dose.state === "Next dose" && (
                <button
                  className="row-check"
                  onClick={() => confirmDose(dose.id, dose.child)}
                  aria-label={`Confirm ${dose.child}'s ${dose.time} dose`}
                >
                  <Icon name="check" size={19} />
                </button>
              )}
            </article>
          ))}
        </section>

        <section className="bottom-grid">
          <article className="family-card">
            <div className="card-title">
              <div>
                <h2>Your family</h2>
                <p>
                  {patients.length} active patients
                </p>
              </div>
              <Link className="round-add" href="/patients/new" aria-label="Add patient">
                <Icon name="plus" size={18} />
              </Link>
            </div>
            <div className="family-members">
              {patients.map((person) => {
                const nextForPatient = liveDoses.find(
                  (dose) => dose.patientId === person.id && (dose.state === "Next dose" || dose.state === "Upcoming"),
                );
                return (
                  <Link className="member-link" href={`/patients/${person.id}`} key={person.id}>
                    <span className={`child-avatar ${person.tone} small`}>{person.initial}</span>
                    <span>
                      <strong>{person.name}</strong>
                      <small>
                        {nextForPatient ? `Next dose ${nextForPatient.time}` : "All doses done today"}
                      </small>
                    </span>
                    <span className="adherence">
                      <b>{person.adherence}</b> this week
                    </span>
                  </Link>
                );
              })}
            </div>
          </article>
          <article className="upload-card">
            <div className="upload-icon">
              <Icon name="upload" size={23} />
            </div>
            <div>
              <p className="eyebrow">PRESCRIPTION SCAN</p>
              <h2>Add a prescription from a photo</h2>
              <p>Upload a PDF or image and we&apos;ll fill in the details.</p>
              <Link className="scan-button" href="/prescriptions/new">
                Upload &amp; scan <Icon name="arrow" size={16} />
              </Link>
            </div>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
