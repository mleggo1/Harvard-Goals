import React from "react";

export default function PrintView({ planner }) {
  // Add safety checks for planner
  if (!planner) {
    return null;
  }

  const {
    ownerName = "",
    vision10 = "",
    notes = "",
    focusWord = "",
    weeklyMantra = "",
    celebrationPlan = "",
    goals = []
  } = planner;

  const formatTimeframeLabel = (value) => {
    if (!value) return "No timeframe";
    if (typeof value === "string" && value.startsWith("custom:")) {
      const days = value.replace("custom:", "");
      return days ? `${days} day${days === "1" ? "" : "s"}` : "Custom days";
    }
    const timeframes = {
      "30-day": "30 days",
      "60-day": "60 days",
      "90-day": "90 days",
      "1-year": "12 months",
      "5-year": "5 years",
      "10-year": "10+ years"
    };
    return timeframes[value] || value;
  };

  const formatDeadline = (dateString) => {
    if (!dateString) return "No deadline yet";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "No deadline yet";
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="print-view">
      <div className="print-container">
        {/* Header */}
        <header className="print-header">
          <h1 className="print-title">
            {ownerName ? `${ownerName}'s Life Goals Blueprint` : "Your Life Goals Blueprint"}
            {goals && goals.length > 0 && ` (${goals.length} ${goals.length === 1 ? 'Goal' : 'Goals'})`}
          </h1>
        </header>

        {/* Foundation Section */}
        <section className="print-section">
          <h2 className="print-section-title">Foundation</h2>
          <div className="print-foundation">
            <div className="print-field">
              <label>Planner owner</label>
              <div className="print-value">{ownerName || "—"}</div>
            </div>
            <div className="print-field">
              <label>Focus word</label>
              <div className="print-value">{focusWord || "—"}</div>
            </div>
            <div className="print-field">
              <label>Weekly mantra</label>
              <div className="print-value">{weeklyMantra || "—"}</div>
            </div>
            <div className="print-field">
              <label>Celebration plan</label>
              <div className="print-value">{celebrationPlan || "—"}</div>
            </div>
          </div>
        </section>

        {/* 10+ Year Vision */}
        <section className="print-section">
          <h2 className="print-section-title">10+ YEAR VISION</h2>
          <div className="print-field">
            <label>Your vivid description</label>
            <div className="print-value print-long-text">{vision10 || "—"}</div>
          </div>
          {notes && (
            <div className="print-field">
              <label>Why it matters</label>
              <div className="print-value print-long-text">{notes}</div>
            </div>
          )}
        </section>

        {/* Goals */}
        {goals && goals.length > 0 && (
          <section className="print-section">
            <h2 className="print-section-title">GOALS BOARD</h2>
            {goals.map((goal, index) => {
              const goalNumber = index + 1;
              return (
                <div key={goal.id} className="print-goal">
                  <div className="print-goal-header">
                    <span className="print-goal-number">GOAL {goalNumber}</span>
                    <span className="print-goal-meta">
                      {goal.area || "—"} · {formatTimeframeLabel(goal.timeframe)} · Priority {goal.priority || "—"}
                    </span>
                  </div>
                  <h3 className="print-goal-title">{goal.text || "—"}</h3>
                  <div className="print-goal-details">
                    <div className="print-goal-detail-row">
                      <span className="print-goal-detail-label">Status:</span>
                      <span className="print-goal-detail-value">{goal.status || "—"}</span>
                    </div>
                    <div className="print-goal-detail-row">
                      <span className="print-goal-detail-label">Progress:</span>
                      <span className="print-goal-detail-value">{goal.progress || 0}%</span>
                    </div>
                    <div className="print-goal-detail-row">
                      <span className="print-goal-detail-label">Deadline:</span>
                      <span className="print-goal-detail-value">{formatDeadline(goal.deadline)}</span>
                    </div>
                  </div>
                  {goal.why && (
                    <div className="print-goal-field">
                      <label>Why it matters</label>
                      <div className="print-value print-long-text">{goal.why}</div>
                    </div>
                  )}
                  {goal.nextStep && (
                    <div className="print-goal-field">
                      <label>Next bold action</label>
                      <div className="print-value print-long-text">{goal.nextStep}</div>
                    </div>
                  )}
                  {goal.reward && (
                    <div className="print-goal-field">
                      <label>Reward / celebration</label>
                      <div className="print-value print-long-text">{goal.reward}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}

