"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "./components/app-shell";
import { Icon } from "./components/med-icon";
import { doses as scheduleDoses, patients } from "./lib/demo-data";

export default function DashboardPage() {
  const [taken, setTaken] = useState(false);
  const [notice, setNotice] = useState("");
  const confirmDose = () => {
    setTaken(true);
    setNotice("Dose marked as taken — Mia is on schedule.");
  };

  return (
    <AppShell>
      <div className="dashboard">
        <section className="welcome-row">
          <div>
            <p className="eyebrow">YOUR FAMILY&apos;S DAY</p>
            <h1>Good morning, Alex.</h1>
            <p className="subhead">Here&apos;s what&apos;s on the schedule.</p>
          </div>
       
        </section>

        <section className="today-card">
          <div className="card-label">
            <span className="pulse" />
            NEXT DOSE <span className="label-divider" /> IN 42 MIN
          </div>
          <div className="dose-hero">
            <div className="child-avatar peach">M</div>
            <div className="dose-copy">
              <span className="mono time">14:00</span>
              <div>
                <h2>
                  Amoxicillin <span className="mono">5 mL</span>
                </h2>
                <p>for Mia · with food if possible</p>
              </div>
            </div>
            <button className={`confirm-dose ${taken ? "confirmed" : ""}`} onClick={confirmDose}>
              {taken ? (
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
            A WhatsApp reminder will be sent at <span className="mono">14:00</span>.
          </div>
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
            <p>4 doses across 2 patients</p>
          </div>
          <Link className="text-button" href="/history">
            View history <Icon name="arrow" size={16} />
          </Link>
        </div>

        <section className="schedule">
          {scheduleDoses.map((dose, index) => (
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
              {index === 1 && (
                <button className="row-check" onClick={confirmDose} aria-label="Confirm Mia's 14:00 dose">
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
                <p>2 active patients</p>
              </div>
              <Link className="round-add" href="/patients/new" aria-label="Add patient">
                <Icon name="plus" size={18} />
              </Link>
            </div>
            <div className="family-members">
              {patients.map((person) => (
                <Link className="member-link" href={`/patients/${person.id}`} key={person.id}>
                  <span className={`child-avatar ${person.tone} small`}>{person.initial}</span>
                  <span>
                    <strong>{person.name}</strong>
                    <small>{person.prescriptions} active prescription</small>
                  </span>
                  <span className="adherence">
                    <b>{person.adherence}</b> this week
                  </span>
                </Link>
              ))}
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
