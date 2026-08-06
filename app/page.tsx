"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AppShell } from "./components/app-shell";
import { Icon } from "./components/med-icon";
import { confirmDoseTaken, getTodaySchedule } from "./actions/schedule";
import { useCurrentUser } from "./lib/auth/use-current-user";
import type { Dose, SchedulePatient } from "./lib/schedule/types";
import { formatCountdown, greetingForHour, minutesUntilTime, resolveSchedule } from "./lib/time";
import { useNow } from "./lib/use-now";

export default function DashboardPage() {
  const { user } = useCurrentUser();
  const now = useNow();
  const [doses, setDoses] = useState<Dose[]>([]);
  const [patients, setPatients] = useState<SchedulePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [takenIds, setTakenIds] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const result = await getTodaySchedule();
    if (!result.ok) {
      setLoadError(result.error);
      setDoses([]);
      setPatients([]);
      setLoading(false);
      return;
    }
    setLoadError("");
    setDoses(result.doses);
    setPatients(result.patients);
    setTakenIds(
      new Set(
        result.doses
          .filter((d) => d.state === "Taken" || d.reminderStatus === "taken")
          .map((d) => d.id),
      ),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const liveDoses = useMemo(
    () => (now ? resolveSchedule(doses, now, takenIds) : doses),
    [now, doses, takenIds],
  );
  const nextDose =
    liveDoses.find((dose) => dose.state === "Next dose") ??
    liveDoses.find((dose) => dose.state === "Upcoming");
  const allDone =
    liveDoses.length > 0 && liveDoses.every((dose) => dose.state === "Taken");
  const greetingName = user?.firstName ?? "there";
  const greeting = now ? greetingForHour(now.getHours()) : "Hello";
  const countdown =
    now && nextDose && nextDose.state !== "Taken"
      ? formatCountdown(minutesUntilTime(nextDose.time, now))
      : "DONE";

  const confirmDose = (doseId: string, child: string) => {
    setTakenIds((current) => new Set(current).add(doseId));
    setNotice(`Dose marked as taken — ${child} is on schedule.`);
    startTransition(async () => {
      const result = await confirmDoseTaken(doseId);
      if (!result.ok) {
        setTakenIds((current) => {
          const next = new Set(current);
          next.delete(doseId);
          return next;
        });
        setNotice("");
        setLoadError(result.error);
        return;
      }
      await refresh();
    });
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

        {loadError && (
          <div className="mb-4 rounded-lg border border-[#e8c5bc] bg-[#f8ece8] px-3 py-2.5 text-sm text-coral" role="alert">
            {loadError}
          </div>
        )}

        <section className="today-card">
          {loading ? (
            <>
              <div className="card-label">
                <span className="pulse" />
                TODAY&apos;S DOSES <span className="label-divider" /> LOADING
              </div>
              <div className="dose-hero">
                <div className="dose-copy">
                  <div>
                    <h2>Loading schedule…</h2>
                    <p>Pulling today&apos;s reminders from your account.</p>
                  </div>
                </div>
              </div>
            </>
          ) : liveDoses.length === 0 ? (
            <>
              <div className="card-label">
                <span className="pulse" />
                TODAY&apos;S DOSES <span className="label-divider" /> NONE YET
              </div>
              <div className="dose-hero">
                <div className="child-avatar peach">+</div>
                <div className="dose-copy">
                  <div>
                    <h2>No doses scheduled today</h2>
                    <p>Upload a prescription to create reminders for your family.</p>
                  </div>
                </div>
                <Link className="confirm-dose" href="/prescriptions/new">
                  Add prescription
                </Link>
              </div>
            </>
          ) : allDone || !nextDose ? (
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
                <div className={`child-avatar ${nextDose.patientId.includes("leo") || patients.find((p) => p.id === nextDose.patientId)?.tone === "blue" ? "blue" : "peach"}`}>
                  {nextDose.child[0]}
                </div>
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
                  disabled={pending}
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
                A WhatsApp reminder will be sent at <span className="mono">{nextDose.time}</span>
                {nextDose.reminderStatus === "sent" ? " (already sent)." : "."}
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
              {liveDoses.length} dose{liveDoses.length === 1 ? "" : "s"}
              {patients.length ? ` across ${patients.length} patient${patients.length === 1 ? "" : "s"}` : ""}
            </p>
          </div>
          <Link className="text-button" href="/history">
            View history <Icon name="arrow" size={16} />
          </Link>
        </div>

        <section className="schedule">
          {!loading && liveDoses.length === 0 && (
            <p className="text-muted px-1 py-4 text-sm">
              No reminders for today.{" "}
              <Link className="text-button" href="/prescriptions/new">
                Scan a prescription
              </Link>{" "}
              to generate a schedule.
            </p>
          )}
          {liveDoses.map((dose) => {
            const tone = patients.find((p) => p.id === dose.patientId)?.tone ?? "peach";
            return (
              <article className={`schedule-row ${dose.state === "Next dose" ? "is-next" : ""}`} key={dose.id}>
                <time className="mono">{dose.time}</time>
                <span className={`timeline-dot ${dose.state === "Taken" ? "done" : ""}`} />
                <div className={`row-avatar ${tone}`}>{dose.child[0]}</div>
                <div className="medicine">
                  <h3>
                    {dose.medicine} <span className="mono">{dose.amount}</span>
                  </h3>
                  <p>
                    for {dose.child}
                    {dose.detail ? ` · ${dose.detail}` : ""}
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
                    disabled={pending}
                  >
                    <Icon name="check" size={19} />
                  </button>
                )}
              </article>
            );
          })}
        </section>

        <section className="bottom-grid">
          <article className="family-card">
            <div className="card-title">
              <div>
                <h2>Your family</h2>
                <p>
                  {patients.length} active patient{patients.length === 1 ? "" : "s"}
                </p>
              </div>
              <Link className="round-add" href="/prescriptions/new" aria-label="Add prescription">
                <Icon name="plus" size={18} />
              </Link>
            </div>
            <div className="family-members">
              {patients.length === 0 && (
                <p className="text-muted px-1 py-2 text-sm">
                  Patients appear here after you save a prescription.
                </p>
              )}
              {patients.map((person) => {
                const nextForPatient = liveDoses.find(
                  (dose) =>
                    dose.patientId === person.id &&
                    (dose.state === "Next dose" || dose.state === "Upcoming"),
                );
                return (
                  <Link className="member-link" href="/prescriptions" key={person.id}>
                    <span className={`child-avatar ${person.tone} small`}>{person.initial}</span>
                    <span>
                      <strong>{person.name}</strong>
                      <small>
                        {nextForPatient
                          ? `Next dose ${nextForPatient.time}`
                          : liveDoses.some((d) => d.patientId === person.id)
                            ? "All doses done today"
                            : "No doses today"}
                      </small>
                    </span>
                    <span className="adherence">
                      <b>{person.adherence}</b> today
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
