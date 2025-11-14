import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import "./App.css";

const STORAGE_KEY = "harvard_goals_v2";

const AREAS = [
  "Health & Energy",
  "Wealth & Investing",
  "Career & Business",
  "Family & Relationships",
  "Lifestyle & Freedom",
  "Learning & Growth",
  "Contribution & Legacy",
  "Adventure & Travel"
];

const TIMEFRAMES = [
  { id: "30-day", label: "30 days" },
  { id: "60-day", label: "60 days" },
  { id: "90-day", label: "90 days" },
  { id: "1-year", label: "12 months" },
  { id: "5-year", label: "5 years" },
  { id: "10-year", label: "10+ years" }
];
const CUSTOM_TIMEFRAME_PREFIX = "custom:";
const DEFAULT_CUSTOM_TIMEFRAME_DAYS = "45";
const TIMEFRAME_DAY_MAP = {
  "30-day": 30,
  "60-day": 60,
  "90-day": 90,
  "1-year": 365,
  "5-year": 1825,
  "10-year": 3650
};
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const STATUS_OPTIONS = ["Not started", "In progress", "Paused", "Done"];

const RITUAL_TEMPLATES = [
  { id: "review", label: "Review my vision out loud", emoji: "🧠" },
  { id: "plan", label: "Schedule blocks for Big 3", emoji: "📅" },
  { id: "celebrate", label: "Celebrate a micro-win", emoji: "🎉" },
  { id: "energy", label: "Move my body for 20 min", emoji: "⚡" }
];

const DEFAULT_RITUAL_STATE = RITUAL_TEMPLATES.reduce((acc, ritual) => {
  acc[ritual.id] = false;
  return acc;
}, {});

const DEFAULT_STATE = {
  vision10: "",
  notes: "",
  focusWord: "",
  weeklyMantra: "",
  celebrationPlan: "",
  theme: "night",
  ritualChecks: DEFAULT_RITUAL_STATE,
  ownerName: "",
  goals: []
};

const GOAL_TEMPLATES = [
  {
    id: "health-85kg-strong",
    area: "Health & Energy",
    text: "Build and maintain an 85kg lean, muscular, strong, high-energy body.",
    timeframe: "1-year",
    priority: 5,
    why: "Peak strength and energy unlock every other area of life.",
    nextStep: "Book UBX sessions plus strength, sauna and ice bath blocks into the calendar.",
    reward: "Schedule a surf performance session once I hit 6 straight disciplined weeks."
  },
  {
    id: "health-surf-fit",
    area: "Health & Energy",
    text: "Stay surf-fit year-round — flexible, strong, and injury-free.",
    timeframe: "90-day",
    priority: 5,
    why: "Being surf-ready at any time keeps me playful, confident and pain-free.",
    nextStep: "Lock three mobility + conditioning circuits each week focused on shoulders and hips.",
    reward: "Book a new board or fin setup after 12 consistent weeks."
  },
  {
    id: "health-150-sessions",
    area: "Health & Energy",
    text: "Complete 150+ quality training sessions this year.",
    timeframe: "1-year",
    priority: 4,
    why: "Consistency compounds fitness, mood, recovery and resilience.",
    nextStep: "Create a simple tracker and schedule the first 10 weeks of UBX/strength blocks.",
    reward: "Plan a recovery weekend away once I cross session number 75."
  },
  {
    id: "finance-passive-250k",
    area: "Wealth & Investing",
    text: "Build $250,000+ per year in passive income.",
    timeframe: "5-year",
    priority: 5,
    why: "Passive income buys total freedom for travel, surf and family experiences.",
    nextStep: "Model the income stack (ETFs, villas, crypto) and set quarterly acquisition targets.",
    reward: "Celebrate each new $50k milestone with a special dinner with Cathryn."
  },
  {
    id: "finance-automate-investing",
    area: "Wealth & Investing",
    text: "Fully automate my investment strategy across ETFs, Bitcoin and property by year-end.",
    timeframe: "1-year",
    priority: 4,
    why: "Automation removes friction so compounding works without decision fatigue.",
    nextStep: "Document the playbook and set up recurring transfers plus portfolio reviews.",
    reward: "Take a long weekend in Bali when the automation stack runs for 90 days straight."
  },
  {
    id: "finance-bali-property",
    area: "Wealth & Investing",
    text: "Acquire another Bali property near Uluwatu with 15%+ projected ROI.",
    timeframe: "1-year",
    priority: 4,
    why: "Adding a high-performing villa accelerates passive income and lifestyle leverage.",
    nextStep: "Shortlist properties, run ROI models, and schedule site inspections.",
    reward: "Host a small launch party at the villa once the deal is closed."
  },
  {
    id: "family-father-trips",
    area: "Family & Relationships",
    text: "Take Harrison on four meaningful father–son trips per year.",
    timeframe: "1-year",
    priority: 5,
    why: "Adventure time together cements our bond and models the life I want for him.",
    nextStep: "List four trip ideas, book the first dates, and put them on the shared calendar.",
    reward: "Create a photo book after each trip to capture the stories."
  },
  {
    id: "family-date-night",
    area: "Family & Relationships",
    text: "Have a dedicated weekly date night with Cathryn.",
    timeframe: "90-day",
    priority: 4,
    why: "Protected connection time keeps our relationship playful, aligned and grateful.",
    nextStep: "Block Thursday nights as sacred, book babysitting, and plan the first month of ideas.",
    reward: "Book a surprise weekend away after eight straight weeks."
  },
  {
    id: "family-financial-education",
    area: "Family & Relationships",
    text: "Create a structured financial education plan for Harrison.",
    timeframe: "1-year",
    priority: 4,
    why: "Passing on money wisdom early sets him up for freedom and stewardship.",
    nextStep: "Outline the 12 lessons, gather resources, and schedule a monthly money lab.",
    reward: "Buy him a meaningful book or experience once the first module is complete."
  },
  {
    id: "lifestyle-five-iconic-waves",
    area: "Lifestyle & Freedom",
    text: "Surf five iconic waves this year: Uluwatu, Bingin, Padang Right, Impossibles, Nusa Dua.",
    timeframe: "1-year",
    priority: 4,
    why: "Chasing world-class waves keeps me inspired, humble and in flow.",
    nextStep: "Plan the travel windows, secure boards, and lock in surf coaching for each location.",
    reward: "Commission a custom board art piece after the fifth wave."
  },
  {
    id: "lifestyle-bali-work-surf",
    area: "Lifestyle & Freedom",
    text: "Take two 10-day Bali work-and-surf trips each year.",
    timeframe: "1-year",
    priority: 4,
    why: "These trips combine income, creativity and sunshine—exactly how I want life to feel.",
    nextStep: "Book January and July villa dates plus flights, and map the work sprints.",
    reward: "Treat myself to a spa + fine-dining night on each trip."
  },
  {
    id: "lifestyle-trip-systems",
    area: "Lifestyle & Freedom",
    text: "Plan and book major trips at least three months ahead to optimise price and availability.",
    timeframe: "90-day",
    priority: 3,
    why: "Planning early keeps cash flow clean and guarantees the best villas and waves.",
    nextStep: "Create a rolling planning board with deadlines for flights, villas and surf gear.",
    reward: "Upgrade one flight to business class once the system runs for two full cycles."
  }
];

const GOAL_TEMPLATE_GROUPS = GOAL_TEMPLATES.reduce((acc, template) => {
  acc[template.area] = acc[template.area] || [];
  acc[template.area].push(template);
  return acc;
}, {});

function createGoalId() {
  return `g_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
}

function hydrateGoal(goal) {
  return {
    ...goal,
    why: goal.why ?? "",
    nextStep: goal.nextStep ?? "",
    reward: goal.reward ?? "",
    deadline: goal.deadline ?? "",
    progress: typeof goal.progress === "number" ? goal.progress : 0
  };
}

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      ritualChecks: {
        ...DEFAULT_STATE.ritualChecks,
        ...(parsed.ritualChecks || {})
      },
      goals: Array.isArray(parsed.goals) ? parsed.goals.map(hydrateGoal) : []
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function addDays(baseDate, days) {
  const result = new Date(baseDate);
  result.setDate(result.getDate() + Number(days));
  return result;
}

function formatDateInput(date) {
  return date.toISOString().split("T")[0];
}

function getDayCountForTimeframe(value, customDaysOverride) {
  if (!value) return null;
  if (isCustomTimeframeValue(value)) {
    const raw =
      customDaysOverride ?? getCustomDayCount(value) ?? DEFAULT_CUSTOM_TIMEFRAME_DAYS;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }
  return TIMEFRAME_DAY_MAP[value] ?? null;
}

function isCustomTimeframeValue(value) {
  return typeof value === "string" && value.startsWith(CUSTOM_TIMEFRAME_PREFIX);
}

function getCustomDayCount(value) {
  if (!isCustomTimeframeValue(value)) return "";
  return value.replace(CUSTOM_TIMEFRAME_PREFIX, "");
}

function formatTimeframeLabel(value) {
  if (!value) return "No timeframe";
  if (isCustomTimeframeValue(value)) {
    const days = getCustomDayCount(value);
    return days ? `${days} day${days === "1" ? "" : "s"}` : "Custom days";
  }
  const preset = TIMEFRAMES.find((tf) => tf.id === value);
  return preset ? preset.label : value;
}

export default function App() {
  const [planner, setPlanner] = useState(() => loadInitialState());
  const [filterTimeframe, setFilterTimeframe] = useState("all");
  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalArea, setNewGoalArea] = useState(AREAS[1]);
  const [newGoalTime, setNewGoalTime] = useState("5-year");
  const [newGoalPriority, setNewGoalPriority] = useState(4);
  const [newGoalWhy, setNewGoalWhy] = useState("");
  const [newGoalNextStep, setNewGoalNextStep] = useState("");
  const [newGoalReward, setNewGoalReward] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isCustomTimeframe, setIsCustomTimeframe] = useState(false);
  const [customTimeframeDays, setCustomTimeframeDays] = useState("");

  const {
    vision10,
    notes,
    goals,
    focusWord,
    weeklyMantra,
    celebrationPlan,
    ritualChecks,
    theme,
    ownerName
  } = planner;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(planner));
  }, [planner]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === "day" ? "day" : "night";
  }, [theme]);

  const filteredGoals = useMemo(() => {
    if (filterTimeframe === "all") return goals;
    if (filterTimeframe === "custom") {
      return goals.filter((g) => isCustomTimeframeValue(g.timeframe));
    }
    return goals.filter((g) => g.timeframe === filterTimeframe);
  }, [goals, filterTimeframe]);

  const countsByTime = useMemo(() => {
    const base = TIMEFRAMES.reduce((acc, tf) => {
      acc[tf.id] = 0;
      return acc;
    }, {});
    let customCount = 0;
    goals.forEach((goal) => {
      if (isCustomTimeframeValue(goal.timeframe)) {
        customCount += 1;
        return;
      }
      if (Object.prototype.hasOwnProperty.call(base, goal.timeframe)) {
        base[goal.timeframe] += 1;
      } else {
        base[goal.timeframe] = (base[goal.timeframe] || 0) + 1;
      }
    });
    return { ...base, custom: customCount };
  }, [goals]);

  const areaSpread = useMemo(() => {
    return AREAS.map((area) => ({
      area,
      count: goals.filter((g) => g.area === area).length
    })).filter((item) => item.count > 0);
  }, [goals]);

  const totalGoals = goals.length;
  const doneGoals = goals.filter((g) => g.status === "Done").length;
  const inProgressGoals = goals.filter((g) => g.status === "In progress").length;

  const averageProgress = totalGoals
    ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / totalGoals)
    : 0;

  const completionRate = totalGoals ? Math.round((doneGoals / totalGoals) * 100) : 0;
  const ritualCompletion = (() => {
    const total = RITUAL_TEMPLATES.length;
    const done = Object.values(ritualChecks).filter(Boolean).length;
    return total ? Math.round((done / total) * 100) : 0;
  })();

  const momentumScore = Math.round((completionRate + averageProgress + ritualCompletion) / 3);

  const big3 = useMemo(() => {
    return [...goals]
      .filter((g) => g.priority >= 4)
      .sort((a, b) => {
        if (b.priority === a.priority) {
          return (b.progress || 0) - (a.progress || 0);
        }
        return b.priority - a.priority;
      })
      .slice(0, 3);
  }, [goals]);

  function updatePlannerField(field, value) {
    setPlanner((prev) => ({ ...prev, [field]: value }));
  }

  function updateGoal(id, patch) {
    setPlanner((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) => (goal.id === id ? { ...goal, ...patch } : goal))
    }));
  }

  function handleTemplateChange(event) {
    const value = event.target.value;
    setSelectedTemplateId(value);
    if (!value) return;
    const template = GOAL_TEMPLATES.find((tpl) => tpl.id === value);
    if (!template) return;
    setNewGoalText(template.text);
    setNewGoalArea(template.area);

  const templateDays = getCustomDayCount(template.timeframe);
  if (template.deadline) {
    setNewGoalDeadline(template.deadline);
    applyTimeframe(template.timeframe, {
      customDaysOverride: templateDays,
      syncDeadline: false
    });
  } else {
    applyTimeframe(template.timeframe, { customDaysOverride: templateDays });
  }

    setNewGoalPriority(template.priority ?? 4);
    setNewGoalWhy(template.why ?? "");
    setNewGoalNextStep(template.nextStep ?? "");
    setNewGoalReward(template.reward ?? "");
  }

  function handleTimeframeSelectChange(value) {
    if (value === "custom") {
    const days = customTimeframeDays || DEFAULT_CUSTOM_TIMEFRAME_DAYS;
    applyTimeframe(`${CUSTOM_TIMEFRAME_PREFIX}${days}`, {
      customDaysOverride: days
    });
      return;
    }
  applyTimeframe(value);
  }

  function handleCustomTimeframeInput(value) {
    const sanitized = value.replace(/\D/g, "");
  const days = sanitized || DEFAULT_CUSTOM_TIMEFRAME_DAYS;
  setCustomTimeframeDays(String(days));
  applyTimeframe(`${CUSTOM_TIMEFRAME_PREFIX}${days}`, {
    customDaysOverride: days
  });
  }

function handleDeadlineChange(value) {
  setNewGoalDeadline(value);
  if (!value) return;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return;
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.max(
    0,
    Math.round((target.getTime() - startOfToday().getTime()) / MS_PER_DAY)
  );
  const preset = Object.entries(TIMEFRAME_DAY_MAP).find(([, days]) => days === diffDays);
  if (preset) {
    applyTimeframe(preset[0], { syncDeadline: false });
  } else {
    const customValue = `${CUSTOM_TIMEFRAME_PREFIX}${diffDays}`;
    applyTimeframe(customValue, {
      syncDeadline: false,
      customDaysOverride: String(diffDays)
    });
  }
}

function syncDeadlineWithTimeframe(value, customDaysOverride) {
  const dayCount = getDayCountForTimeframe(value, customDaysOverride);
  if (!dayCount) return;
  const futureDate = addDays(startOfToday(), dayCount);
  setNewGoalDeadline(formatDateInput(futureDate));
}

function applyTimeframe(value, options = {}) {
  const { syncDeadline = true, customDaysOverride } = options;
  if (isCustomTimeframeValue(value)) {
    const rawDays =
      customDaysOverride ?? getCustomDayCount(value) ?? DEFAULT_CUSTOM_TIMEFRAME_DAYS;
    const normalizedDays = String(rawDays || DEFAULT_CUSTOM_TIMEFRAME_DAYS);
    const normalizedValue = `${CUSTOM_TIMEFRAME_PREFIX}${normalizedDays}`;
    setIsCustomTimeframe(true);
    setCustomTimeframeDays(normalizedDays);
    setNewGoalTime(normalizedValue);
    if (syncDeadline) {
      syncDeadlineWithTimeframe(normalizedValue, normalizedDays);
    }
    return;
  }
  setIsCustomTimeframe(false);
  setCustomTimeframeDays("");
  setNewGoalTime(value);
  if (syncDeadline) {
    syncDeadlineWithTimeframe(value);
  }
}

  function handleAddGoal() {
    const text = newGoalText.trim();
    if (!text) return;
    const timeframeToPersist = isCustomTimeframe
      ? `${CUSTOM_TIMEFRAME_PREFIX}${
          customTimeframeDays || getCustomDayCount(newGoalTime) || DEFAULT_CUSTOM_TIMEFRAME_DAYS
        }`
      : newGoalTime;
    const goal = hydrateGoal({
      id: createGoalId(),
      text,
      area: newGoalArea,
      timeframe: timeframeToPersist,
      priority: newGoalPriority,
      status: "Not started",
      createdAt: new Date().toISOString(),
      why: newGoalWhy.trim(),
      nextStep: newGoalNextStep.trim(),
      reward: newGoalReward.trim(),
      deadline: newGoalDeadline
    });
    setPlanner((prev) => ({
      ...prev,
      goals: [goal, ...prev.goals]
    }));
    setNewGoalText("");
    setSelectedTemplateId("");
    setNewGoalWhy("");
    setNewGoalNextStep("");
    setNewGoalReward("");
    setNewGoalDeadline("");
  }

  function deleteGoal(id) {
    setPlanner((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id)
    }));
  }

  function clearAll() {
    if (!window.confirm("Clear all goals, notes and rituals?")) return;
    setPlanner(DEFAULT_STATE);
    setFilterTimeframe("all");
    setNewGoalText("");
    setNewGoalWhy("");
    setNewGoalNextStep("");
    setNewGoalReward("");
    setNewGoalDeadline("");
    setSelectedTemplateId("");
    setIsCustomTimeframe(false);
    setCustomTimeframeDays("");
    setNewGoalArea(AREAS[1]);
    setNewGoalPriority(4);
    applyTimeframe("5-year", { syncDeadline: false });
  }

  function toggleRitual(id) {
    setPlanner((prev) => ({
      ...prev,
      ritualChecks: {
        ...prev.ritualChecks,
        [id]: !prev.ritualChecks[id]
      }
    }));
  }

  function printPage() {
    window.print();
  }

  function downloadPlanJson() {
    const blob = new Blob([JSON.stringify(planner, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "harvard-goals-planner.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportGoalsToPdf() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 48;
    let cursorY = 60;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Harvard Goals Planner", marginX, cursorY);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    cursorY += 24;
    const intro = [
      `Planner owner: ${ownerName || "—"}`,
      `Focus word: ${focusWord || "—"}`,
      `Weekly mantra: ${weeklyMantra || "—"}`,
      `Celebration plan: ${celebrationPlan || "—"}`
    ];
    intro.forEach((line) => {
      doc.text(line, marginX, cursorY);
      cursorY += 16;
    });

    cursorY += 8;
    doc.setFont("helvetica", "bold");
    doc.text("10+ Year Vision", marginX, cursorY);
    cursorY += 16;
    doc.setFont("helvetica", "normal");
    const visionLines = doc.splitTextToSize(vision10 || "—", 500);
    visionLines.forEach((line) => {
      if (cursorY > 760) {
        doc.addPage();
        cursorY = 60;
      }
      doc.text(line, marginX, cursorY);
      cursorY += 16;
    });

    cursorY += 16;
    doc.setFont("helvetica", "bold");
    doc.text("Goals", marginX, cursorY);
    cursorY += 24;

    goals.forEach((goal, index) => {
      const block = [
        `${index + 1}. ${goal.text}`,
        `Area: ${goal.area}  |  Timeframe: ${formatTimeframeLabel(goal.timeframe)}  |  Priority: ${
          goal.priority
        }`,
        `Status: ${goal.status}  |  Progress: ${goal.progress}%  |  Deadline: ${
          goal.deadline ? new Date(goal.deadline).toLocaleDateString() : "—"
        }`,
        `Why: ${goal.why || "—"}`,
        `Next step: ${goal.nextStep || "—"}`,
        `Reward: ${goal.reward || "—"}`
      ];

      block.forEach((line) => {
        const wrapped = doc.splitTextToSize(line, 500);
        wrapped.forEach((wrappedLine) => {
          if (cursorY > 760) {
            doc.addPage();
            cursorY = 60;
          }
          doc.setFont(
            wrappedLine === block[0] ? "helvetica" : "helvetica",
            wrappedLine === block[0] ? "bold" : "normal"
          );
          doc.text(wrappedLine, marginX, cursorY);
          cursorY += 16;
        });
      });

      cursorY += 10;
    });

    doc.save("harvard-goals-planner.pdf");
  }

  function formatDeadline(dateString) {
    if (!dateString) return "No deadline yet";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "No deadline yet";
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  const heroModeLabel = theme === "day" ? "Daylight" : "Night shift";
  const timeframeSelectValue = isCustomTimeframe ? "custom" : newGoalTime;
  const templateGroups = Object.entries(GOAL_TEMPLATE_GROUPS);
  const customTimeframePreview = formatTimeframeLabel(
    `${CUSTOM_TIMEFRAME_PREFIX}${customTimeframeDays || DEFAULT_CUSTOM_TIMEFRAME_DAYS}`
  );

  return (
    <div className={`app-root ${theme}-skin`}>
      <div className="app-shell">
        <header className="app-hero">
          <div>
            <p className="eyebrow">Harvard Goals Method</p>
            <h1>{ownerName ? `${ownerName}'s Goals Planner` : "Goals Planner"}</h1>
            <p className="hero-subhead">
              Design a life you can see, feel and print. Capture bold goals, lock a mantra,
              ritualise execution, then export or share with your accountability crew.
            </p>
            <div className="planner-owner">
              <label>Your name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => updatePlannerField("ownerName", e.target.value)}
                placeholder="Example: Michael"
              />
            </div>
          </div>
          <div className="hero-actions">
            <div className="theme-toggle">
              <span>{heroModeLabel}</span>
              <button
                className={theme === "day" ? "active" : ""}
                onClick={() => updatePlannerField("theme", "day")}
              >
                ☀ Light
              </button>
              <button
                className={theme === "night" ? "active" : ""}
                onClick={() => updatePlannerField("theme", "night")}
              >
                🌙 Night
              </button>
            </div>
            <div className="hero-buttons">
              <button className="btn btn-ghost" onClick={downloadPlanJson}>
                💾 Save file
              </button>
              <button className="btn btn-ghost" onClick={exportGoalsToPdf}>
                📄 Export PDF
              </button>
              <button className="btn btn-ghost" onClick={printPage}>
                🖨 Print
              </button>
              <button className="btn danger" onClick={clearAll}>
                ♻ Reset
              </button>
            </div>
          </div>
        </header>

        <section className="focus-grid">
          <article className="focus-card">
            <div className="card-title">
              <span className="icon">✨</span>
              <span>Focus word</span>
            </div>
            <p>Choose the single word that will govern your decisions this season.</p>
            <input
              type="text"
              value={focusWord}
              onChange={(e) => updatePlannerField("focusWord", e.target.value)}
              placeholder="Example: Relentless"
            />
          </article>
          <article className="focus-card">
            <div className="card-title">
              <span className="icon">🧭</span>
              <span>Weekly mantra</span>
            </div>
            <p>Write a short mantra you'll read each Monday and before big meetings.</p>
            <textarea
              value={weeklyMantra}
              onChange={(e) => updatePlannerField("weeklyMantra", e.target.value)}
              placeholder="I do the courageous thing first, before the world wakes up."
            />
          </article>
          <article className="focus-card">
            <div className="card-title">
              <span className="icon">🎉</span>
              <span>Celebration plan</span>
            </div>
            <p>Anchor in a reward so your brain knows progress is worth celebrating.</p>
            <textarea
              value={celebrationPlan}
              onChange={(e) => updatePlannerField("celebrationPlan", e.target.value)}
              placeholder="Weekend surf trip when I close the next consulting client."
            />
          </article>
        </section>

        <main className="planner-grid">
          <section className="column">
            <article className="card">
              <header className="card-header">
                <div className="card-title">
                  <span className="icon">🔭</span>
                  <span>10+ year vision</span>
                </div>
                <p>Describe the life you see when everything compounds in your favor.</p>
              </header>
              <div className="field">
                <label>Your vivid description</label>
                <textarea
                  value={vision10}
                  onChange={(e) => updatePlannerField("vision10", e.target.value)}
                  placeholder="It's 2035. I'm..."
                />
              </div>
              <div className="field">
                <label>Why it matters</label>
                <textarea
                  value={notes}
                  onChange={(e) => updatePlannerField("notes", e.target.value)}
                  placeholder="This future matters because..."
                />
              </div>
            </article>

            <article className="card">
              <header className="card-header">
                <div>
                  <div className="card-title">
                    <span className="icon">📝</span>
                    <span>Add a goal</span>
                  </div>
                  <p>Be concrete. What must be true for the vision above to be present tense?</p>
                </div>
                <button className="btn primary" onClick={handleAddGoal}>
                  ➕ Capture goal
                </button>
              </header>
              <div className="field">
                <label>Need inspiration?</label>
                <select value={selectedTemplateId} onChange={handleTemplateChange}>
                  <option value="">Select a pre-built goal (optional)</option>
                  {templateGroups.map(([area, templates]) => (
                    <optgroup key={area} label={area}>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.text}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Goal statement</label>
                <input
                  type="text"
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  placeholder="Example: Grow recurring revenue to $50k/month."
                />
              </div>
              <div className="field-grid">
                <div className="field">
                  <label>Area</label>
                  <select
                    value={newGoalArea}
                    onChange={(e) => setNewGoalArea(e.target.value)}
                  >
                    {AREAS.map((area) => (
                      <option key={area}>{area}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Timeframe</label>
                  <select
                    value={timeframeSelectValue}
                    onChange={(e) => handleTimeframeSelectChange(e.target.value)}
                  >
                    {TIMEFRAMES.map((tf) => (
                      <option key={tf.id} value={tf.id}>
                        {tf.label}
                      </option>
                    ))}
                    <option value="custom">Custom days…</option>
                  </select>
                </div>
                <div className="field">
                  <label>Priority (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newGoalPriority}
                    onChange={(e) =>
                      setNewGoalPriority(
                        Math.min(5, Math.max(1, Number(e.target.value) || 1))
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={newGoalDeadline}
                    onChange={(e) => handleDeadlineChange(e.target.value)}
                  />
                </div>
              </div>
              {isCustomTimeframe && (
                <div className="field">
                  <label>Custom timeframe (days)</label>
                  <input
                    type="number"
                    min={1}
                    value={customTimeframeDays}
                    onChange={(e) => handleCustomTimeframeInput(e.target.value)}
                    placeholder="e.g. 45"
                  />
                  <span className="card-subtitle" style={{ marginTop: 4 }}>
                    Will display as {customTimeframePreview}.
                  </span>
                </div>
              )}
              <div className="field-grid">
                <div className="field">
                  <label>Why does it matter?</label>
                  <textarea
                    value={newGoalWhy}
                    onChange={(e) => setNewGoalWhy(e.target.value)}
                    placeholder="This goal matters because..."
                  />
                </div>
                <div className="field">
                  <label>Next bold action</label>
                  <textarea
                    value={newGoalNextStep}
                    onChange={(e) => setNewGoalNextStep(e.target.value)}
                    placeholder="The very next action I can take is..."
                  />
                </div>
                <div className="field">
                  <label>Reward / celebration</label>
                  <textarea
                    value={newGoalReward}
                    onChange={(e) => setNewGoalReward(e.target.value)}
                    placeholder="When I finish I will..."
                  />
                </div>
              </div>
            </article>

            <article className="card">
              <header className="card-header">
                <div>
                  <div className="card-title">
                    <span className="icon">📚</span>
                    <span>Goal board</span>
                  </div>
                  <p>Sort by timeframe, update progress sliders and re-read your why weekly.</p>
                </div>
                <select
                  className="pill-select"
                  value={filterTimeframe}
                  onChange={(e) => setFilterTimeframe(e.target.value)}
                >
                  <option value="all">All time horizons</option>
                  {TIMEFRAMES.map((tf) => (
                    <option key={tf.id} value={tf.id}>
                      {tf.label}
                    </option>
                  ))}
                  <option value="custom">Custom days</option>
                </select>
              </header>

              {filteredGoals.length === 0 ? (
                <div className="empty-state">
                  Nothing to show yet. Capture a goal above or switch the filter.
                </div>
              ) : (
                <div className="goals-list">
                  {filteredGoals.map((goal) => (
                    <article key={goal.id} className="goal-card">
                      <div className="goal-card__header">
                        <div>
                          <p className="goal-chip">{formatTimeframeLabel(goal.timeframe)}</p>
                          <h3>{goal.text}</h3>
                        </div>
                        <div className="goal-meta">
                          <span className="goal-area">{goal.area}</span>
                          <span className="goal-priority">⭐ {goal.priority}</span>
                        </div>
                      </div>
                      <div className="goal-card__body">
                        <div className="goal-row">
                          <label>Status</label>
                          <select
                            value={goal.status}
                            onChange={(e) => updateGoal(goal.id, { status: e.target.value })}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                        <div className="goal-row progress-row">
                          <label>Momentum</label>
                          <div className="progress-wrap">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={goal.progress}
                              onChange={(e) =>
                                updateGoal(goal.id, { progress: Number(e.target.value) })
                              }
                            />
                            <span>{goal.progress}%</span>
                          </div>
                        </div>
                        <div className="goal-grid">
                          <div>
                            <label>Why</label>
                            <textarea
                              value={goal.why}
                              onChange={(e) => updateGoal(goal.id, { why: e.target.value })}
                              placeholder="Remind yourself why this matters."
                            />
                          </div>
                          <div>
                            <label>Next step</label>
                            <textarea
                              value={goal.nextStep}
                              onChange={(e) => updateGoal(goal.id, { nextStep: e.target.value })}
                              placeholder="Block a meeting? Call the mentor?"
                            />
                          </div>
                          <div>
                            <label>Reward</label>
                            <textarea
                              value={goal.reward}
                              onChange={(e) => updateGoal(goal.id, { reward: e.target.value })}
                              placeholder="What will you do when it's done?"
                            />
                          </div>
                        </div>
                        <div className="goal-footer">
                          <span>Deadline: {formatDeadline(goal.deadline)}</span>
                          <div className="goal-footer__actions">
                            <button className="btn outline" onClick={() => deleteGoal(goal.id)}>
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </section>

          <section className="column column-side">
            <article className="card highlight">
              <header className="card-header">
                <div className="card-title">
                  <span className="icon">📊</span>
                  <span>Momentum dashboard</span>
                </div>
                <div className="metric-pill">{momentumScore}%</div>
              </header>
              <div className="summary-grid">
                <div>
                  <p>Total goals</p>
                  <strong>{totalGoals}</strong>
                </div>
                <div>
                  <p>In progress</p>
                  <strong>{inProgressGoals}</strong>
                </div>
                <div>
                  <p>Done</p>
                  <strong>{doneGoals}</strong>
                </div>
                <div>
                  <p>Avg momentum</p>
                  <strong>{averageProgress}%</strong>
                </div>
              </div>
              <div className="timeline-row">
                {TIMEFRAMES.map((tf) => (
                  <div key={tf.id} className="timeline-chip">
                    <strong>{tf.label}</strong>
                    <span>{countsByTime[tf.id] || 0} goals</span>
                  </div>
                ))}
                {countsByTime.custom ? (
                  <div className="timeline-chip" key="custom">
                    <strong>Custom days</strong>
                    <span>{countsByTime.custom} goals</span>
                  </div>
                ) : null}
              </div>
              {areaSpread.length > 0 && (
                <div className="area-grid">
                  {areaSpread.map((entry) => (
                    <div key={entry.area} className="area-bar">
                      <span>{entry.area}</span>
                      <div>
                        <div
                          style={{
                            width: `${Math.min(entry.count * 20, 100)}%`
                          }}
                        />
                      </div>
                      <small>{entry.count}</small>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="card">
              <header className="card-header">
                <div className="card-title">
                  <span className="icon">🔥</span>
                  <span>Big 3 this year</span>
                </div>
                <p>These get protected time every week. Nothing jumps the queue.</p>
              </header>
              {big3.length === 0 ? (
                <div className="empty-state">
                  Add a few goals with priority 4 or 5 to see your Big 3.
                </div>
              ) : (
                <div className="big3-list">
                  {big3.map((goal, index) => (
                    <div key={goal.id} className="big3-card">
                      <div className="badge">#{index + 1}</div>
                      <div>
                        <h4>{goal.text}</h4>
                        <p>
                          {goal.area} · {formatTimeframeLabel(goal.timeframe)}
                        </p>
                      </div>
                      <div className="big3-progress">{goal.progress}%</div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="card">
              <header className="card-header">
                <div className="card-title">
                  <span className="icon">🌀</span>
                  <span>Momentum rituals</span>
                </div>
                <p>Check off rituals whenever you complete them today.</p>
              </header>
              <ul className="ritual-list">
                {RITUAL_TEMPLATES.map((ritual) => (
                  <li key={ritual.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={ritualChecks[ritual.id]}
                        onChange={() => toggleRitual(ritual.id)}
                      />
                      <span>
                        {ritual.emoji} {ritual.label}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="ritual-progress">
                <div style={{ width: `${ritualCompletion}%` }} />
              </div>
              <small>{ritualCompletion}% rituals complete today</small>
            </article>

            <article className="card">
              <header className="card-header">
                <div className="card-title">
                  <span className="icon">🧩</span>
                  <span>Weekly focus prompt</span>
                </div>
              </header>
              <ul className="prompt-list">
                <li>Which 5-year goal gets a decisive action this week?</li>
                <li>Does my calendar reflect my Big 3 priorities?</li>
                <li>What will I say no to so these commitments win?</li>
              </ul>
            </article>
          </section>
        </main>

        <footer className="app-footer">
          <div>
            Saved locally in your browser. Export or print anytime. Built for bold humans.
          </div>
          <div>Inspired by the Harvard Goals Study · Educational use only.</div>
        </footer>
      </div>
    </div>
  );
}
