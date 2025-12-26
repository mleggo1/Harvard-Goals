import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import "./App.css";
import ConquerJournal from "./ConquerJournal.jsx";
import { 
  autoSave, 
  initialize, 
  getCurrentSavePath, 
  changeSaveLocation,
  loadFromFile,
  loadFromFileInput,
  saveToFile,
  isFileSystemAvailable,
  saveToIDB,
  saveFileHandle,
  setFilePath,
  autoOpenStoredFile,
  supportsFileSystemAccess
} from "./fileStorage.js";

const STORAGE_KEY = "harvard_goals_v2";
const OWNER_DEVICE_KEY = "harvard_goals_owner_device";

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
    id: "health-strength-training",
    area: "Health & Energy",
    text: "I strength train 3–4 times per week to build and maintain muscle, strength, and long-term independence.",
    timeframe: "1-year",
    priority: 5,
    why: "Strength is one of the strongest predictors of longevity. It protects against injury, metabolic decline, and loss of independence as I age. Maintaining muscle improves insulin sensitivity, bone density, hormone health, and overall resilience for life, sport, and work.",
    nextStep: "Block out 3-4 training sessions per week in my calendar and commit to showing up.",
    reward: "Upgrade my training equipment or book a session with a coach after 12 weeks of consistency."
  },
  {
    id: "health-sleep",
    area: "Health & Energy",
    text: "I average 7.5–8.5 hours of high-quality sleep per night with a consistent bedtime and wake time.",
    timeframe: "90-day",
    priority: 5,
    why: "Sleep governs hormones, fat loss, muscle growth, mood, cognitive performance, and long-term health. Poor sleep undermines every other goal, while consistent, high-quality sleep accelerates recovery, decision-making, and energy.",
    nextStep: "Set a consistent bedtime and wake time, create a pre-sleep routine, and track sleep quality.",
    reward: "Invest in quality sleep accessories (blackout curtains, better mattress, etc.) after 30 days of consistency."
  },
  {
    id: "health-sauna-hot-tub",
    area: "Health & Energy",
    text: "I use sauna or hot tub 3–5 times per week for 15–30 minutes to support cardiovascular health, recovery, and stress reduction.",
    timeframe: "90-day",
    priority: 4,
    why: "Regular heat exposure improves cardiovascular function, reduces stress, enhances recovery, and is strongly associated with increased longevity. It delivers high health returns with low risk when used consistently.",
    nextStep: "Identify local sauna/hot tub access and schedule 3-5 sessions per week.",
    reward: "Book a spa day or upgrade my home recovery setup after 8 weeks of consistency."
  },
  {
    id: "health-walking",
    area: "Health & Energy",
    text: "I walk daily, averaging 8,000–10,000 steps to support cardiovascular health, glucose control, and mental clarity.",
    timeframe: "90-day",
    priority: 4,
    why: "Walking improves insulin sensitivity, reduces stress, supports heart health, and enhances recovery without adding fatigue. It compounds daily and supports long-term health more reliably than most high-intensity interventions.",
    nextStep: "Set up step tracking, plan daily walking routes, and commit to hitting 8,000-10,000 steps daily.",
    reward: "Buy quality walking shoes or plan a scenic walking adventure after 30 days of consistency."
  },
  {
    id: "health-nutrition",
    area: "Health & Energy",
    text: "I prioritise whole foods and consistently meet my daily protein intake to support muscle, recovery, energy, and metabolic health.",
    timeframe: "90-day",
    priority: 5,
    why: "Nutrition provides the raw materials my body needs to build muscle, regulate hormones, stabilise blood sugar, and sustain energy. Adequate protein preserves lean mass as I age, supports recovery from training, and protects metabolic health. Whole foods outperform extreme diets by supporting long-term consistency, gut health, and overall resilience.",
    nextStep: "Calculate my daily protein target, plan weekly meals, and prep whole food options.",
    reward: "Book a cooking class or upgrade my kitchen equipment after 6 weeks of consistency."
  },
  {
    id: "health-social-connection",
    area: "Health & Energy",
    text: "I regularly invest time in meaningful relationships and shared experiences that create connection and belonging.",
    timeframe: "1-year",
    priority: 4,
    why: "Strong social connection is one of the most powerful predictors of lifespan and long-term wellbeing. Humans are wired for connection, and meaningful relationships reduce stress, improve mental health, and reinforce healthy habits.",
    nextStep: "Schedule regular catch-ups with key relationships and plan shared experiences.",
    reward: "Plan a special trip or experience with loved ones after consistent connection for 3 months."
  },
  {
    id: "health-mission",
    area: "Health & Energy",
    text: "I live with a clear mission that guides my health, wealth, and lifestyle decisions — building strength, freedom, and legacy.",
    timeframe: "1-year",
    priority: 5,
    why: "Mission provides direction and consistency when motivation fades. A clear sense of purpose aligns daily habits with long-term outcomes and turns discipline into a sustainable way of life rather than a short-term push.",
    nextStep: "Define my mission statement and review it daily to guide decisions.",
    reward: "Create a visual reminder of my mission (vision board, framed statement, etc.) after defining it clearly."
  },
  {
    id: "finance-passive-income",
    area: "Wealth & Investing",
    text: "Build $XX per year in passive income.",
    timeframe: "5-year",
    priority: 5,
    why: "Passive income creates total freedom for travel, experiences and family time.",
    nextStep: "Model my income strategy and set quarterly acquisition targets.",
    reward: "Celebrate each major milestone with a special experience or dinner."
  },
  {
    id: "finance-automate-investing",
    area: "Wealth & Investing",
    text: "Fully automate my investment strategy across multiple asset classes by year-end.",
    timeframe: "1-year",
    priority: 4,
    why: "Automation removes friction so compounding works without decision fatigue.",
    nextStep: "Document my playbook and set up recurring transfers plus portfolio reviews.",
    reward: "Take a long weekend getaway when the automation stack runs for 90 days straight."
  },
  {
    id: "finance-investment-property",
    area: "Wealth & Investing",
    text: "Acquire an investment property with XX%+ projected ROI.",
    timeframe: "1-year",
    priority: 4,
    why: "Adding a high-performing asset accelerates passive income and builds wealth.",
    nextStep: "Shortlist properties, run ROI models, and schedule site inspections.",
    reward: "Host a small celebration once the deal is closed."
  },
  {
    id: "family-quality-time",
    area: "Family & Relationships",
    text: "Plan four meaningful family trips or adventures per year.",
    timeframe: "1-year",
    priority: 5,
    why: "Adventure time together strengthens bonds and creates lasting memories.",
    nextStep: "List trip ideas, book the first dates, and add them to the shared calendar.",
    reward: "Create a photo book or memory collection after each trip."
  },
  {
    id: "family-date-night",
    area: "Family & Relationships",
    text: "Have a dedicated weekly date night with my partner.",
    timeframe: "90-day",
    priority: 4,
    why: "Protected connection time keeps our relationship playful, aligned and grateful.",
    nextStep: "Block one night per week as sacred, arrange childcare if needed, and plan the first month.",
    reward: "Book a surprise weekend away after eight straight weeks."
  },
  {
    id: "family-financial-education",
    area: "Family & Relationships",
    text: "Create a structured financial education plan for my children.",
    timeframe: "1-year",
    priority: 4,
    why: "Passing on money wisdom early sets them up for freedom and financial stewardship.",
    nextStep: "Outline the lessons, gather resources, and schedule regular money conversations.",
    reward: "Buy them a meaningful book or experience once the first module is complete."
  },
  {
    id: "lifestyle-adventure-goals",
    area: "Lifestyle & Freedom",
    text: "Complete XX bucket-list adventures or experiences this year.",
    timeframe: "1-year",
    priority: 4,
    why: "Chasing meaningful experiences keeps me inspired, humble and in flow.",
    nextStep: "List the adventures, plan travel windows, and book the first one.",
    reward: "Commission a custom memento or art piece after completing the goal."
  },
  {
    id: "lifestyle-work-travel",
    area: "Lifestyle & Freedom",
    text: "Take XX work-and-travel trips each year that combine productivity with adventure.",
    timeframe: "1-year",
    priority: 4,
    why: "These trips combine income, creativity and new experiences—exactly how I want life to feel.",
    nextStep: "Book dates, secure accommodation, and map out work sprints.",
    reward: "Treat myself to a special experience on each trip."
  },
  {
    id: "lifestyle-trip-systems",
    area: "Lifestyle & Freedom",
    text: "Plan and book major trips at least three months ahead to optimise price and availability.",
    timeframe: "90-day",
    priority: 3,
    why: "Planning early keeps cash flow clean and guarantees the best options.",
    nextStep: "Create a rolling planning system with deadlines for flights and accommodation.",
    reward: "Upgrade one experience to premium once the system runs for two full cycles."
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
    progress: typeof goal.progress === "number" ? goal.progress : 0,
    completedAt: goal.completedAt ?? "",
    archived: goal.archived ?? false
  };
}

function isOwnerDevice() {
  return localStorage.getItem(OWNER_DEVICE_KEY) === "true";
}

function setOwnerDevice(value) {
  if (value) {
    localStorage.setItem(OWNER_DEVICE_KEY, "true");
  } else {
    localStorage.removeItem(OWNER_DEVICE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }
}

function loadInitialStateSync() {
  // Fallback to localStorage for backward compatibility
  if (isOwnerDevice()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
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
      }
    } catch {
      // Ignore errors
    }
  }
  
  return DEFAULT_STATE;
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

function calculateDaysRemaining(deadline) {
  if (!deadline) return null;
  const target = new Date(deadline);
  if (Number.isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);
  const today = startOfToday();
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / MS_PER_DAY);
  return diffDays;
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
  const [currentView, setCurrentView] = useState('goals'); // 'goals' or 'conquer'
  const [planner, setPlanner] = useState(() => loadInitialStateSync());
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
  const [isAddGoalCollapsed, setIsAddGoalCollapsed] = useState(false);
  const [isVisionCollapsed, setIsVisionCollapsed] = useState(false);
  const [dueDateRange, setDueDateRange] = useState(30);
  
  // File storage state
  const [savePath, setSavePath] = useState(() => getCurrentSavePath());
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  // Initialize on mount
  useEffect(() => {
    async function init() {
      try {
        const initResult = await initialize();
        
        // Load data from file storage if available
        if (initResult && initResult.data) {
          const parsed = initResult.data;
          setPlanner({
            ...DEFAULT_STATE,
            ...parsed,
            ritualChecks: {
              ...DEFAULT_STATE.ritualChecks,
              ...(parsed.ritualChecks || {})
            },
            goals: Array.isArray(parsed.goals) ? parsed.goals.map(hydrateGoal) : []
          });
        } else if (initResult && initResult.needsOpen && !supportsFileSystemAccess()) {
          // Mobile: we have a stored file path but no data - try to auto-open
          // On mobile, we can't auto-open directly, but we can prompt the user
          // For now, just load from IndexedDB if available
          const idbData = await loadFromIDB();
          if (idbData) {
            const parsed = idbData;
            setPlanner({
              ...DEFAULT_STATE,
              ...parsed,
              ritualChecks: {
                ...DEFAULT_STATE.ritualChecks,
                ...(parsed.ritualChecks || {})
              },
              goals: Array.isArray(parsed.goals) ? parsed.goals.map(hydrateGoal) : []
            });
          }
        }
        
        // Check if we need to prompt for save location
        const currentPath = getCurrentSavePath();
        if (currentPath === 'Browser Storage (Not set)' && isFileSystemAvailable()) {
          setShowSavePrompt(true);
        }
        
        setSavePath(getCurrentSavePath());
        setIsInitialized(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setSavePath(getCurrentSavePath());
        setIsInitialized(true);
      }
    }
    init();
  }, []);

  // Auto-save when planner changes
  useEffect(() => {
    if (!isInitialized) return;
    
    setSaveStatus('saving');
    autoSave(planner, (result) => {
      if (result.success) {
        setSaveStatus('saved');
        setSavePath(result.path || getCurrentSavePath());
        // Clear saved status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else if (result.cancelled) {
        setSaveStatus('idle');
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    });
  }, [planner, isInitialized]);

  // Auto-resize all textareas to show ALL content - print will capture what's visible on screen
  useEffect(() => {
    const expandAllTextareas = () => {
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach((textarea) => {
        // Reset height to auto to get accurate scrollHeight
        textarea.style.height = "auto";
        // Set height to scrollHeight to show ALL content - no cutoff
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.minHeight = `${scrollHeight}px`;
        textarea.style.maxHeight = "none";
        // Ensure overflow is visible so nothing is hidden
        textarea.style.overflow = "visible";
        textarea.style.overflowY = "visible";
      });
    };

    // Expand on mount and whenever content changes
    expandAllTextareas();
    
    // Also expand before print to ensure everything is visible
    const handleBeforePrint = () => {
      expandAllTextareas();
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    
    // Resize after a short delay to ensure content is rendered
    const timeout = setTimeout(expandAllTextareas, 100);
    const timeout2 = setTimeout(expandAllTextareas, 500);
    
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, [planner.vision10, planner.notes, planner.focusWord, planner.weeklyMantra, planner.celebrationPlan, planner.goals]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === "day" ? "day" : "night";
  }, [theme]);

  // Auto-resize goal title textareas when goals change or view changes
  useEffect(() => {
    if (currentView !== 'goals') return; // Only resize when on Goals view
    
    const resizeGoalTextareas = () => {
      // Resize goal title inputs
      const titleInputs = document.querySelectorAll('.goal-title-input');
      titleInputs.forEach((textarea) => {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.minHeight = `${scrollHeight}px`;
        textarea.style.maxHeight = 'none';
        textarea.style.overflow = 'visible';
        textarea.style.overflowY = 'visible';
      });
      
      // Resize goal grid textareas (Why, Next Step, Reward)
      const goalGridTextareas = document.querySelectorAll('.goal-grid textarea');
      goalGridTextareas.forEach((textarea) => {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.minHeight = `${scrollHeight}px`;
        textarea.style.maxHeight = 'none';
        textarea.style.overflow = 'visible';
        textarea.style.overflowY = 'visible';
      });
    };
    
    // Resize immediately and after delays to ensure DOM is ready
    resizeGoalTextareas();
    const timeout = setTimeout(resizeGoalTextareas, 50);
    const timeout2 = setTimeout(resizeGoalTextareas, 200);
    const timeout3 = setTimeout(resizeGoalTextareas, 500);
    
    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [goals, currentView]);

  // Auto-resize focus card textareas to match content
  useEffect(() => {
    const resizeTextareas = () => {
      const focusCards = document.querySelectorAll(".focus-card");
      focusCards.forEach((card) => {
        const textarea = card.querySelector("textarea");
        if (textarea) {
          textarea.style.height = "auto";
          textarea.style.height = `${textarea.scrollHeight}px`;
        }
      });
    };

    resizeTextareas();
    // Also resize when values change
    const timer = setTimeout(resizeTextareas, 100);
    return () => clearTimeout(timer);
  }, [weeklyMantra, celebrationPlan]);

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

  const big5 = useMemo(() => {
    return [...goals]
      .filter((g) => g.priority >= 4 && g.status !== "Done")
      .sort((a, b) => {
        if (b.priority === a.priority) {
          return (b.progress || 0) - (a.progress || 0);
        }
        return b.priority - a.priority;
      })
      .slice(0, 5);
  }, [goals]);

  const completedGoals = useMemo(() => {
    return [...goals]
      .filter((g) => g.status === "Done" && !g.archived)
      .sort((a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : (a.deadline ? new Date(a.deadline).getTime() : 0);
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : (b.deadline ? new Date(b.deadline).getTime() : 0);
        return dateB - dateA; // Most recently completed first
      });
  }, [goals]);

  const archivedGoals = useMemo(() => {
    return [...goals]
      .filter((g) => g.status === "Done" && g.archived)
      .sort((a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : (a.deadline ? new Date(a.deadline).getTime() : 0);
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : (b.deadline ? new Date(b.deadline).getTime() : 0);
        return dateB - dateA;
      });
  }, [goals]);

  const goalsDueSoon = useMemo(() => {
    const today = startOfToday();
    const targetDate = addDays(today, dueDateRange);
    
    return [...goals]
      .filter((g) => {
        if (g.status === "Done" || !g.deadline) return false;
        const deadline = new Date(g.deadline);
        if (Number.isNaN(deadline.getTime())) return false;
        deadline.setHours(0, 0, 0, 0);
        return deadline.getTime() <= targetDate.getTime() && deadline.getTime() >= today.getTime();
      })
      .sort((a, b) => {
        const daysA = calculateDaysRemaining(a.deadline) ?? Infinity;
        const daysB = calculateDaysRemaining(b.deadline) ?? Infinity;
        return daysA - daysB; // Soonest first
      });
  }, [goals, dueDateRange]);

  function updatePlannerField(field, value) {
    setPlanner((prev) => ({ ...prev, [field]: value }));
  }

  function updateGoal(id, patch) {
    setPlanner((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) => (goal.id === id ? { ...goal, ...patch } : goal))
    }));
  }

  function getStatusFromProgress(progress) {
    if (progress === 0) return "Not started";
    if (progress === 100) return "Done";
    return "In progress";
  }

  function getProgressFromStatus(status, currentProgress) {
    if (status === "Not started") return 0;
    if (status === "Done") return 100;
    if (status === "In progress") {
      // If currently 0 or 100, set to 50, otherwise keep current
      return currentProgress === 0 || currentProgress === 100 ? 50 : currentProgress;
    }
    // For "Paused", keep current progress
    return currentProgress;
  }

  function archiveGoal(id) {
    updateGoal(id, { archived: true });
  }

  function unarchiveGoal(id) {
    updateGoal(id, { archived: false });
  }

  function scrollToBig5() {
    const big5Section = document.getElementById('big5-goals-section');
    if (big5Section) {
      big5Section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Add a highlight effect
      big5Section.style.animation = 'highlightSection 2s ease-in-out';
      setTimeout(() => {
        big5Section.style.animation = '';
      }, 2000);
    } else {
      // Fallback: scroll to the sidebar section
      const sidebarSection = document.querySelector('.column-side');
      if (sidebarSection) {
        sidebarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  function scrollToGoal(goalId) {
    const goalElement = document.querySelector(`[data-goal-id="${goalId}"]`);
    if (goalElement) {
      goalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      goalElement.style.animation = 'highlightGoal 2s ease-in-out';
      setTimeout(() => {
        goalElement.style.animation = '';
      }, 2000);
    }
  }

  function handleGoalDeadlineChange(goalId, deadlineValue) {
    if (!deadlineValue) {
      updateGoal(goalId, { deadline: "" });
      return;
    }
    const target = new Date(deadlineValue);
    if (Number.isNaN(target.getTime())) return;
    target.setHours(0, 0, 0, 0);
    const today = startOfToday();
    const diffDays = Math.max(
      0,
      Math.round((target.getTime() - today.getTime()) / MS_PER_DAY)
    );
    const preset = Object.entries(TIMEFRAME_DAY_MAP).find(([, days]) => days === diffDays);
    let newTimeframe;
    if (preset) {
      newTimeframe = preset[0];
    } else {
      newTimeframe = `${CUSTOM_TIMEFRAME_PREFIX}${diffDays}`;
    }
    updateGoal(goalId, { deadline: deadlineValue, timeframe: newTimeframe });
  }

  function handleGoalTimeframeChange(goalId, timeframeValue) {
    if (!timeframeValue) return;
    if (timeframeValue === "custom") {
      const currentGoal = goals.find((g) => g.id === goalId);
      if (currentGoal && currentGoal.deadline) {
        const target = new Date(currentGoal.deadline);
        if (!Number.isNaN(target.getTime())) {
          target.setHours(0, 0, 0, 0);
          const today = startOfToday();
          const diffDays = Math.max(
            0,
            Math.round((target.getTime() - today.getTime()) / MS_PER_DAY)
          );
          const customValue = `${CUSTOM_TIMEFRAME_PREFIX}${diffDays}`;
          updateGoal(goalId, { timeframe: customValue });
          return;
        }
      }
      const defaultCustom = `${CUSTOM_TIMEFRAME_PREFIX}${DEFAULT_CUSTOM_TIMEFRAME_DAYS}`;
      const dayCount = Number(DEFAULT_CUSTOM_TIMEFRAME_DAYS);
      const futureDate = addDays(startOfToday(), dayCount);
      const formattedDeadline = formatDateInput(futureDate);
      updateGoal(goalId, { timeframe: defaultCustom, deadline: formattedDeadline });
      return;
    }
    const dayCount = getDayCountForTimeframe(timeframeValue);
    if (!dayCount) {
      updateGoal(goalId, { timeframe: timeframeValue });
      return;
    }
    const futureDate = addDays(startOfToday(), dayCount);
    const formattedDeadline = formatDateInput(futureDate);
    updateGoal(goalId, { timeframe: timeframeValue, deadline: formattedDeadline });
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

  async function handleChangeSaveLocation() {
    setSaveStatus('saving');
    const result = await changeSaveLocation(planner);
    if (result.success) {
      setSavePath(result.path || getCurrentSavePath());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else if (result.cancelled) {
      setSaveStatus('idle');
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }

  async function handleInitialSaveLocation() {
    setSaveStatus('saving');
    try {
      if (!isFileSystemAvailable()) {
        // Use IndexedDB
        await saveToIDB(planner);
        setSavePath('Browser Storage');
        setSaveStatus('saved');
        setShowSavePrompt(false);
        setTimeout(() => setSaveStatus('idle'), 2000);
        return;
      }

      // Prompt for file location
      const handle = await window.showSaveFilePicker({
        suggestedName: 'goals-blueprint.json',
        types: [{
          description: 'Goals Blueprint',
          accept: { 'application/json': ['.json'] }
        }]
      });

      // Write to file
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(planner, null, 2));
      await writable.close();

      // Also save to IndexedDB
      await saveToIDB(planner);

      // Update stored handle
      saveFileHandle(handle);
      setSavePath(handle.name);
      setSaveStatus('saved');
      setShowSavePrompt(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      if (error.name === 'AbortError') {
        setSaveStatus('idle');
      } else {
        // Fallback to IndexedDB
        await saveToIDB(planner);
        setSavePath('Browser Storage');
        setSaveStatus('saved');
        setShowSavePrompt(false);
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
  }

  async function handleOpenFile() {
    try {
      const loaded = await loadFromFile();
      if (loaded) {
        setPlanner({
          ...DEFAULT_STATE,
          ...loaded,
          ritualChecks: {
            ...DEFAULT_STATE.ritualChecks,
            ...(loaded.ritualChecks || {})
          },
          goals: Array.isArray(loaded.goals) ? loaded.goals.map(hydrateGoal) : []
        });
        // Update save path - will show the file name/path
        setSavePath(getCurrentSavePath());
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        alert("Error loading file. Please make sure it's a valid Goals Blueprint file.");
      }
    }
  }

  function downloadPlanJson() {
    // Download with the stored filename if available, otherwise use default
    const storedPath = getCurrentSavePath();
    let filename = "goals-blueprint.json";
    
    // If we have a stored path, use that filename
    if (storedPath && storedPath !== 'Browser Storage (Not set)' && storedPath !== 'Browser Storage') {
      // Extract just the filename from the path
      const pathParts = storedPath.split(/[/\\]/);
      filename = pathParts[pathParts.length - 1] || "goals-blueprint.json";
      // Ensure it has .json extension
      if (!filename.endsWith('.json')) {
        filename = filename.replace(/\.[^/.]+$/, '') + '.json';
      }
    }
    
    const blob = new Blob([JSON.stringify(planner, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function loadPlanJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Use loadFromFileInput which handles storing the file path
      const loaded = await loadFromFileInput(file);
      
      setPlanner({
        ...DEFAULT_STATE,
        ...loaded,
        ritualChecks: {
          ...DEFAULT_STATE.ritualChecks,
          ...(loaded.ritualChecks || {})
        },
        goals: Array.isArray(loaded.goals) ? loaded.goals.map(hydrateGoal) : []
      });
      
      // Update save path to show the imported file path
      setSavePath(getCurrentSavePath());
      
      // Reset file input
      event.target.value = "";
    } catch (error) {
      alert("Error loading file. Please make sure it's a valid Goals Blueprint file.");
      event.target.value = "";
    }
  }

  // Close export menu when clicking outside
  useEffect(() => {
    if (showExportMenu) {
      const handleClickOutside = (event) => {
        if (!event.target.closest('[data-export-menu]')) {
          setShowExportMenu(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  function exportGoalsToPdf() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 48;
    const pageHeight = 792; // A4 height in points
    const bottomMargin = 60;
    const maxY = pageHeight - bottomMargin;
    let cursorY = 60;

    function checkPageBreak(requiredHeight) {
      if (cursorY + requiredHeight > maxY) {
        doc.addPage();
        cursorY = 60;
      }
    }

    // Title page
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(ownerName ? `${ownerName}'s Life Goals Blueprint` : "Your Life Goals Blueprint", marginX, cursorY);
    cursorY += 40;

    // Foundation section
    checkPageBreak(100);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Foundation", marginX, cursorY);
    cursorY += 20;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const foundation = [
      `Planner owner: ${ownerName || "—"}`,
      `Focus word: ${focusWord || "—"}`,
      `Daily mantra: ${weeklyMantra || "—"}`,
      `Celebration plan: ${celebrationPlan || "—"}`
    ];
    foundation.forEach((line) => {
      checkPageBreak(16);
      const wrapped = doc.splitTextToSize(line, 500);
      wrapped.forEach((wrappedLine) => {
        checkPageBreak(16);
        doc.text(wrappedLine, marginX, cursorY);
        cursorY += 16;
      });
    });

    // 10+ Year Vision - new page
    checkPageBreak(200);
    if (cursorY > 100) {
      doc.addPage();
      cursorY = 60;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("10+ YEAR VISION", marginX, cursorY);
    cursorY += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const visionLines = doc.splitTextToSize(vision10 || "—", 500);
    visionLines.forEach((line) => {
      checkPageBreak(16);
      doc.text(line, marginX, cursorY);
      cursorY += 16;
    });
    if (notes) {
      cursorY += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Why it matters:", marginX, cursorY);
      cursorY += 16;
      doc.setFont("helvetica", "normal");
      const notesLines = doc.splitTextToSize(notes, 500);
      notesLines.forEach((line) => {
        checkPageBreak(16);
        doc.text(line, marginX, cursorY);
        cursorY += 16;
      });
    }

    // Goals - each goal on new page if needed
    goals.forEach((goal, index) => {
      checkPageBreak(150);
      if (cursorY > 100) {
        doc.addPage();
        cursorY = 60;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Goal ${index + 1}`, marginX, cursorY);
      cursorY += 20;
      
      const goalText = doc.splitTextToSize(goal.text, 500);
      goalText.forEach((line) => {
        checkPageBreak(16);
        doc.text(line, marginX, cursorY);
        cursorY += 16;
      });
      
      cursorY += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const meta = [
        `Area: ${goal.area}`,
        `Timeframe: ${formatTimeframeLabel(goal.timeframe)}`,
        `Priority: ${goal.priority} (5 = highest)`,
        `Status: ${goal.status} | Progress: ${goal.progress}%`,
        `Deadline: ${goal.deadline ? new Date(goal.deadline).toLocaleDateString() : "—"}`
      ];
      meta.forEach((line) => {
        checkPageBreak(14);
        doc.text(line, marginX, cursorY);
        cursorY += 14;
      });
      
      if (goal.why) {
        cursorY += 8;
        checkPageBreak(30);
        doc.setFont("helvetica", "bold");
        doc.text("Why it matters:", marginX, cursorY);
        cursorY += 14;
        doc.setFont("helvetica", "normal");
        const whyLines = doc.splitTextToSize(goal.why, 500);
        whyLines.forEach((line) => {
          checkPageBreak(14);
          doc.text(line, marginX, cursorY);
          cursorY += 14;
        });
      }
      
      if (goal.nextStep) {
        cursorY += 8;
        checkPageBreak(30);
        doc.setFont("helvetica", "bold");
        doc.text("Next bold action:", marginX, cursorY);
        cursorY += 14;
        doc.setFont("helvetica", "normal");
        const nextLines = doc.splitTextToSize(goal.nextStep, 500);
        nextLines.forEach((line) => {
          checkPageBreak(14);
          doc.text(line, marginX, cursorY);
          cursorY += 14;
        });
      }
      
      if (goal.reward) {
        cursorY += 8;
        checkPageBreak(30);
        doc.setFont("helvetica", "bold");
        doc.text("Reward / celebration:", marginX, cursorY);
        cursorY += 14;
        doc.setFont("helvetica", "normal");
        const rewardLines = doc.splitTextToSize(goal.reward, 500);
        rewardLines.forEach((line) => {
          checkPageBreak(14);
          doc.text(line, marginX, cursorY);
          cursorY += 14;
        });
      }
      
      cursorY += 20;
    });

    doc.save("goals-blueprint.pdf");
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

  const timeframeSelectValue = isCustomTimeframe ? "custom" : newGoalTime;
  const templateGroups = Object.entries(GOAL_TEMPLATE_GROUPS);
  const customTimeframePreview = formatTimeframeLabel(
    `${CUSTOM_TIMEFRAME_PREFIX}${customTimeframeDays || DEFAULT_CUSTOM_TIMEFRAME_DAYS}`
  );

  // Show Conquer Journal if that view is selected
  if (currentView === 'conquer') {
    return <ConquerJournal onBack={() => setCurrentView('goals')} theme={theme} goals={planner.goals} />;
  }

  return (
    <div className={`app-root ${theme}-skin`}>
      {/* Initial save location prompt */}
      {showSavePrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            border: '2px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 700 }}>
              Choose Save Location
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: 'var(--text-muted)' }}>
              Select where you'd like to save your Goals Blueprint. Your work will auto-save to this location.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowSavePrompt(false);
                  // Use IndexedDB as fallback
                }}
              >
                Use Browser Storage
              </button>
              <button
                className="btn primary"
                onClick={handleInitialSaveLocation}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Choose Location'}
              </button>
            </div>
          </div>
        </div>
      )}
        <div className="app-shell">
        <header className="app-hero">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p className="eyebrow" style={{ margin: 0 }}>Harvard Goals Method</p>
              <button 
                className="btn btn-ghost"
                onClick={() => setCurrentView('conquer')}
                title="Open Conquer Journal"
                style={{ fontSize: '11px', padding: '6px 12px' }}
              >
                📔 Conquer Journal
              </button>
            </div>
            <h1 className="hero-title">{ownerName ? `🚀 ${ownerName}'s Life Goals Blueprint${totalGoals > 0 ? ` (${totalGoals} ${totalGoals === 1 ? 'Goal' : 'Goals'})` : ''}` : `🚀 Your Life Goals Blueprint${totalGoals > 0 ? ` (${totalGoals} ${totalGoals === 1 ? 'Goal' : 'Goals'})` : ''}`}</h1>
            <p className="hero-subhead">
              Turn your biggest dreams into a clear plan. Write down your goals, set your focus, take action every day, and share your progress with people who support you.
            </p>
            <div className="planner-owner-row">
              <div className="planner-owner">
                <label>Your name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => updatePlannerField("ownerName", e.target.value)}
                  placeholder="Example: Michael"
                />
              </div>
              <div className="hero-top-actions">
                <button 
                  className="btn btn-ghost" 
                  onClick={handleOpenFile}
                  title="Open a Goals Blueprint file"
                >
                  📂 Open
                </button>
                <input
                  type="file"
                  accept=".json"
                  onChange={loadPlanJson}
                  id="file-input"
                  style={{ display: "none" }}
                />
                <label htmlFor="file-input" className="btn btn-ghost" title="Import from file (fallback)">
                  📥 Import
                </label>
                <button 
                  className="btn btn-ghost" 
                  onClick={handleChangeSaveLocation}
                  title="Change where your file is saved"
                >
                  📁 Change Location
                </button>
                {supportsFileSystemAccess() ? (
                  // Desktop: Group export buttons in dropdown
                  <div style={{ position: 'relative', display: 'inline-block' }} data-export-menu>
                    <button 
                      className="btn btn-ghost" 
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      title="Export options"
                    >
                      📤 Export ▼
                    </button>
                    {showExportMenu && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        zIndex: 1000,
                        minWidth: '150px',
                        padding: '4px'
                      }}>
                        <button 
                          className="btn btn-ghost" 
                          onClick={() => {
                            downloadPlanJson();
                            setShowExportMenu(false);
                          }}
                          title="Download backup copy"
                          style={{ 
                            width: '100%', 
                            justifyContent: 'flex-start',
                            padding: '8px 12px',
                            borderRadius: '4px'
                          }}
                        >
                          💾 Download
                        </button>
                        <button 
                          className="btn btn-ghost" 
                          onClick={() => {
                            exportGoalsToPdf();
                            setShowExportMenu(false);
                          }}
                          title="Export to PDF"
                          style={{ 
                            width: '100%', 
                            justifyContent: 'flex-start',
                            padding: '8px 12px',
                            borderRadius: '4px'
                          }}
                        >
                          📄 PDF
                        </button>
                        <button 
                          className="btn btn-ghost" 
                          onClick={() => {
                            printPage();
                            setShowExportMenu(false);
                          }}
                          title="Print"
                          style={{ 
                            width: '100%', 
                            justifyContent: 'flex-start',
                            padding: '8px 12px',
                            borderRadius: '4px'
                          }}
                        >
                          🖨 Print
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Mobile: Show buttons separately
                  <>
                    <button className="btn btn-ghost" onClick={downloadPlanJson} title="Download backup copy">
                      💾 Download
                    </button>
                    <button className="btn btn-ghost" onClick={exportGoalsToPdf} title="Export to PDF">
                      📄 PDF
                    </button>
                    <button className="btn btn-ghost" onClick={printPage} title="Print">
                      🖨 Print
                    </button>
                  </>
                )}
                <button
                  className="btn btn-ghost big5-shortcut-btn"
                  onClick={scrollToBig5}
                  title={big5.length > 0 ? `Jump to Big 5 Goals (${big5.length} goals)` : "Jump to Big 5 Goals section"}
                  disabled={big5.length === 0}
                >
                  🔥 Big 5 {big5.length > 0 && `(${big5.length})`}
                </button>
                <button
                  className="btn btn-ghost theme-toggle-btn"
                  onClick={() => updatePlannerField("theme", theme === "day" ? "night" : "day")}
                  title={`Switch to ${theme === "day" ? "night" : "day"} mode`}
                >
                  {theme === "day" ? "☀ Day" : "🌙 Night"}
                </button>
              </div>
            </div>
            {/* Save status and path display */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '12px',
              padding: '8px 12px',
              background: 'rgba(148, 163, 184, 0.1)',
              borderRadius: '8px',
              fontSize: '12px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-muted)' }}>Saved to:</span>
                <span style={{ 
                  color: 'var(--text-primary)', 
                  fontWeight: 500,
                  wordBreak: 'break-word',
                  maxWidth: '600px',
                  fontFamily: 'monospace',
                  fontSize: '11px'
                }} title={savePath}>
                  {savePath}
                </span>
                {saveStatus === 'saving' && (
                  <span style={{ color: 'var(--accent)', fontSize: '11px' }}>💾 Saving...</span>
                )}
                {saveStatus === 'saved' && (
                  <span style={{ color: '#10b981', fontSize: '11px' }}>✓ Saved</span>
                )}
                {saveStatus === 'error' && (
                  <span style={{ color: '#f87171', fontSize: '11px' }}>⚠ Error saving</span>
                )}
              </div>
            </div>
          </div>
        </header>

        <section className="focus-section">
          <div className="focus-section-header">
            <h2 className="focus-section-title">⚡ Set Your Foundation</h2>
            <p className="focus-section-subtitle">Define what drives you. These three anchors will guide every decision and keep you aligned with your vision.</p>
          </div>
          <div className="focus-grid">
            <article className="focus-card">
              <div className="card-title">
                <span className="icon">✨</span>
                <span>FOCUS WORD</span>
              </div>
              <p>Choose the single word that will govern your decisions this season.</p>
              <textarea
                value={focusWord}
                onChange={(e) => {
                  updatePlannerField("focusWord", e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="Example: Momentum, Clarity, Action, Growth"
                rows={1}
              />
            </article>
            <article className="focus-card">
              <div className="card-title">
                <span className="icon">🧭</span>
                <span>DAILY MANTRA</span>
              </div>
              <p>Write a short mantra you'll read each day.</p>
              <textarea
                value={weeklyMantra}
                onChange={(e) => {
                  updatePlannerField("weeklyMantra", e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="Example: I do the hard thing first, before distractions set in. Progress over perfection, action over planning."
              />
            </article>
            <article className="focus-card">
              <div className="card-title">
                <span className="icon">🎉</span>
                <span>CELEBRATION PLAN</span>
              </div>
              <p>Anchor in a reward so your brain knows progress is worth celebrating.</p>
              <textarea
                value={celebrationPlan}
                onChange={(e) => {
                  updatePlannerField("celebrationPlan", e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="Example: Weekend getaway when I hit my next milestone. Or a special dinner with loved ones when I complete my quarterly goal."
                rows={1}
              />
            </article>
          </div>
        </section>

        <main className="planner-grid">
          <section className="column">
            <article className={`card card-vision ${isVisionCollapsed ? 'collapsed' : ''}`}>
              <header className="card-header">
                <div>
                  <div className="card-title">
                    <span className="icon">🔭</span>
                    <span>10+ YEAR VISION</span>
                  </div>
                  <p>Describe the life you see when everything compounds in your favor.</p>
                </div>
                <button
                  className="btn btn-ghost collapse-toggle"
                  onClick={() => setIsVisionCollapsed(!isVisionCollapsed)}
                  title={isVisionCollapsed ? "Show vision section" : "Hide vision section"}
                >
                  {isVisionCollapsed ? "Show" : "Hide"}
                </button>
              </header>
              {!isVisionCollapsed && (
                <div>
                  <div className="field">
                    <label>Your vivid description</label>
                    <textarea
                      value={vision10}
                      onChange={(e) => {
                        updatePlannerField("vision10", e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="It's 2035. I'm..."
                      rows={1}
                    />
                  </div>
                  <div className="field">
                    <label>Why it matters</label>
                    <textarea
                      value={notes}
                      onChange={(e) => {
                        updatePlannerField("notes", e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="This future matters because..."
                      rows={1}
                    />
                  </div>
                </div>
              )}
            </article>

            <article className={`card card-add-goal ${isAddGoalCollapsed ? 'collapsed' : ''}`}>
              <header className="card-header">
                <div>
                  <div className="card-title">
                    <span className="icon">📝</span>
                    <span>ADD A GOAL</span>
                  </div>
                  <p className="card-subtitle-inspire">What specific outcome will make your vision a reality?</p>
                </div>
                <button
                  className="btn btn-ghost collapse-toggle"
                  onClick={() => setIsAddGoalCollapsed(!isAddGoalCollapsed)}
                  title={isAddGoalCollapsed ? "Show to add a goal" : "Hide to focus on goals board"}
                >
                  {isAddGoalCollapsed ? "Show" : "Hide"}
                </button>
              </header>
              {!isAddGoalCollapsed && (
                <div className="card-add-goal-content">
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
                  <label>Priority (1-5, 5 = highest)</label>
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
                <div className="card-footer">
                  <button className="btn primary btn-save-goal" onClick={handleAddGoal}>
                    ➕ Save Goal
                  </button>
                </div>
                </div>
              )}
            </article>

            <article className="card card-goal-board">
              <header className="card-header">
                <div>
                  <div className="card-title">
                    <span className="icon">📚</span>
                    <span>GOALS BOARD</span>
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
                  {filteredGoals.map((goal, index) => {
                    // Calculate goal number based on all goals, not just filtered
                    const goalNumber = goals.findIndex(g => g.id === goal.id) + 1;
                    return (
                    <article key={goal.id} className="goal-card" data-goal-id={goal.id}>
                      <div className="goal-card__header">
                        <div className="goal-header-main">
                          <div className="goal-header-top">
                            <div className="goal-number">
                              GOAL {goalNumber}
                            </div>
                            {isCustomTimeframeValue(goal.timeframe) ? (
                              <div className="custom-days-display">
                                <label className="custom-days-label">GOAL</label>
                                <div className="custom-days-content">
                                  <input
                                    type="number"
                                    className="custom-days-input"
                                    min={1}
                                    value={getCustomDayCount(goal.timeframe)}
                                    onChange={(e) => {
                                      const days = e.target.value;
                                      if (days && Number(days) > 0) {
                                        const customValue = `${CUSTOM_TIMEFRAME_PREFIX}${days}`;
                                        const dayCount = Number(days);
                                        const futureDate = addDays(startOfToday(), dayCount);
                                        const formattedDeadline = formatDateInput(futureDate);
                                        updateGoal(goal.id, { timeframe: customValue, deadline: formattedDeadline });
                                      }
                                    }}
                                    placeholder="Days"
                                  />
                                  <span className="custom-days-unit">days</span>
                                </div>
                              </div>
                            ) : (
                              <div className="goal-timeframe-display">
                                <label className="goal-timeframe-label">GOAL</label>
                                <select
                                  className="goal-chip-select"
                                  value={goal.timeframe}
                                  onChange={(e) => handleGoalTimeframeChange(goal.id, e.target.value)}
                                >
                                  {TIMEFRAMES.map((tf) => (
                                    <option key={tf.id} value={tf.id}>
                                      {tf.label}
                                    </option>
                                  ))}
                                  <option value="custom">Custom days</option>
                                </select>
                              </div>
                            )}
                            <div className="deadline-display">
                              <label className="deadline-label">Deadline</label>
                              <div className="deadline-content">
                                <span className="deadline-icon">📅</span>
                                <input
                                  type="date"
                                  className="deadline-input-visible"
                                  value={goal.deadline || ""}
                                  onChange={(e) => handleGoalDeadlineChange(goal.id, e.target.value)}
                                />
                              </div>
                            </div>
                            {(() => {
                              const daysRemaining = calculateDaysRemaining(goal.deadline);
                              if (daysRemaining === null) return null;
                              const isOverdue = daysRemaining < 0;
                              return (
                                <div className={`days-remaining-display ${isOverdue ? 'overdue' : ''}`}>
                                  <label className="days-remaining-label">Days Remaining</label>
                                  <div className="days-remaining-content">
                                    <span className={`days-remaining-number ${isOverdue ? 'overdue' : ''}`}>
                                      {isOverdue ? Math.abs(daysRemaining) : daysRemaining}
                                    </span>
                                    <span className="days-remaining-unit">
                                      {isOverdue ? 'overdue' : daysRemaining === 1 ? 'day' : 'days'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          <textarea
                            className="goal-title-input"
                            value={goal.text}
                            onChange={(e) => {
                              updateGoal(goal.id, { text: e.target.value });
                              // Auto-resize on change
                              const target = e.target;
                              target.style.height = 'auto';
                              const scrollHeight = target.scrollHeight;
                              target.style.height = `${scrollHeight}px`;
                              target.style.minHeight = `${scrollHeight}px`;
                              target.style.maxHeight = 'none';
                              target.style.overflow = 'visible';
                              target.style.overflowY = 'visible';
                            }}
                            onInput={(e) => {
                              // Auto-resize on input
                              const target = e.target;
                              target.style.height = 'auto';
                              const scrollHeight = target.scrollHeight;
                              target.style.height = `${scrollHeight}px`;
                              target.style.minHeight = `${scrollHeight}px`;
                              target.style.maxHeight = 'none';
                              target.style.overflow = 'visible';
                              target.style.overflowY = 'visible';
                            }}
                            placeholder="Enter your goal..."
                            rows={1}
                          />
                          <div className="goal-meta-inline">
                            <span className="goal-area">{goal.area}</span>
                          </div>
                        </div>
                      </div>
                      <div className="goal-card__body">
                        <div className="goal-row">
                          <label>Status</label>
                          <select
                            value={goal.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              const newProgress = getProgressFromStatus(newStatus, goal.progress);
                              const updates = { status: newStatus, progress: newProgress };
                              // Add completedAt timestamp when marked as Done
                              if (newStatus === "Done" && goal.status !== "Done") {
                                updates.completedAt = new Date().toISOString();
                              }
                              updateGoal(goal.id, updates);
                            }}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                        <div className="goal-row">
                          <label>Priority (1-5, 5 = highest)</label>
                          <select
                            value={goal.priority}
                            onChange={(e) => updateGoal(goal.id, { priority: Number(e.target.value) })}
                          >
                            <option value={1}>1 - Lowest</option>
                            <option value={2}>2 - Low</option>
                            <option value={3}>3 - Medium</option>
                            <option value={4}>4 - High</option>
                            <option value={5}>5 - Highest</option>
                          </select>
                        </div>
                        <div className="goal-row progress-row">
                          <label>% Complete</label>
                          <div className="progress-wrap">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={goal.progress}
                              onChange={(e) => {
                                const newProgress = Number(e.target.value);
                                const newStatus = getStatusFromProgress(newProgress);
                                updateGoal(goal.id, { progress: newProgress, status: newStatus });
                              }}
                            />
                            <span>{goal.progress}%</span>
                          </div>
                        </div>
                        <div className="goal-grid">
                          <div>
                            <label>Why</label>
                            <textarea
                              value={goal.why}
                              onChange={(e) => {
                                updateGoal(goal.id, { why: e.target.value });
                                const target = e.target;
                                target.style.height = "auto";
                                const scrollHeight = target.scrollHeight;
                                target.style.height = `${scrollHeight}px`;
                                target.style.minHeight = `${scrollHeight}px`;
                                target.style.maxHeight = 'none';
                                target.style.overflow = 'visible';
                                target.style.overflowY = 'visible';
                              }}
                              onInput={(e) => {
                                const target = e.target;
                                target.style.height = "auto";
                                const scrollHeight = target.scrollHeight;
                                target.style.height = `${scrollHeight}px`;
                                target.style.minHeight = `${scrollHeight}px`;
                                target.style.maxHeight = 'none';
                              }}
                              placeholder="Remind yourself why this matters."
                              rows={1}
                            />
                          </div>
                          <div>
                            <label>Next step</label>
                            <textarea
                              value={goal.nextStep}
                              onChange={(e) => {
                                updateGoal(goal.id, { nextStep: e.target.value });
                                const target = e.target;
                                target.style.height = "auto";
                                const scrollHeight = target.scrollHeight;
                                target.style.height = `${scrollHeight}px`;
                                target.style.minHeight = `${scrollHeight}px`;
                                target.style.maxHeight = 'none';
                                target.style.overflow = 'visible';
                                target.style.overflowY = 'visible';
                              }}
                              onInput={(e) => {
                                const target = e.target;
                                target.style.height = "auto";
                                const scrollHeight = target.scrollHeight;
                                target.style.height = `${scrollHeight}px`;
                                target.style.minHeight = `${scrollHeight}px`;
                                target.style.maxHeight = 'none';
                              }}
                              placeholder="Block a meeting? Call the mentor?"
                              rows={1}
                            />
                          </div>
                          <div>
                            <label>Reward</label>
                            <textarea
                              value={goal.reward}
                              onChange={(e) => {
                                updateGoal(goal.id, { reward: e.target.value });
                                const target = e.target;
                                target.style.height = "auto";
                                const scrollHeight = target.scrollHeight;
                                target.style.height = `${scrollHeight}px`;
                                target.style.minHeight = `${scrollHeight}px`;
                                target.style.maxHeight = 'none';
                                target.style.overflow = 'visible';
                                target.style.overflowY = 'visible';
                              }}
                              onInput={(e) => {
                                const target = e.target;
                                target.style.height = "auto";
                                const scrollHeight = target.scrollHeight;
                                target.style.height = `${scrollHeight}px`;
                                target.style.minHeight = `${scrollHeight}px`;
                                target.style.maxHeight = 'none';
                              }}
                              placeholder="What will you do when it's done?"
                              rows={1}
                            />
                          </div>
                        </div>
                        <div className="goal-footer">
                          <div className="goal-footer__actions">
                            <button className="btn outline" onClick={() => deleteGoal(goal.id)}>
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                    );
                  })}
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
                  <p>Avg % Complete</p>
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

            <article id="big5-goals-section" className="card">
              <header className="card-header">
                <div className="card-title">
                  <span className="icon">🔥</span>
                  <span>Big 5 Goals This Year</span>
                </div>
                <p>These get protected time every week. Nothing jumps the queue.</p>
              </header>
              {big5.length === 0 ? (
                <div className="empty-state">
                  Add a few goals with priority 4 or 5 to see your Big 5.
                </div>
              ) : (
                <div className="big3-list">
                  {big5.map((goal, index) => (
                    <div 
                      key={goal.id} 
                      className="big3-card big3-card-clickable"
                      onClick={() => scrollToGoal(goal.id)}
                      title="Click to view this goal in detail"
                    >
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

            <article className="card card-due-soon">
              <header className="card-header">
                <div className="card-title">
                  <span className="icon">⏰</span>
                  <span>Goals Due Soon</span>
                </div>
                <p>Track goals with upcoming deadlines. Adjust the timeframe to see what's coming up.</p>
              </header>
              <div className="due-date-controls">
                <div className="slider-container">
                  <label className="slider-label">
                    <span>Show goals due in the next:</span>
                    <span className="slider-value">{dueDateRange} {dueDateRange === 1 ? 'day' : 'days'}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={dueDateRange}
                    onChange={(e) => setDueDateRange(Number(e.target.value))}
                    className="due-date-slider"
                  />
                  <div className="slider-labels">
                    <span>0</span>
                    <span>30</span>
                    <span>60</span>
                    <span>90</span>
                  </div>
                </div>
              </div>
              {goalsDueSoon.length === 0 ? (
                <div className="empty-state">
                  {dueDateRange === 0 
                    ? "No goals due today. Great work staying ahead!"
                    : `No goals due in the next ${dueDateRange} days. You're on track!`}
                </div>
              ) : (
                <div className="due-soon-goals-list">
                  <div className="due-soon-header">
                    <span className="due-count-badge">{goalsDueSoon.length} {goalsDueSoon.length === 1 ? 'goal' : 'goals'} due</span>
                  </div>
                  {goalsDueSoon.map((goal) => {
                    const daysRemaining = calculateDaysRemaining(goal.deadline);
                    const isOverdue = daysRemaining !== null && daysRemaining < 0;
                    const isUrgent = daysRemaining !== null && daysRemaining <= 7;
                    return (
                      <div 
                        key={goal.id} 
                        className={`due-soon-goal-card ${isOverdue ? 'overdue' : ''} ${isUrgent ? 'urgent' : ''}`}
                        onClick={() => {
                          // Scroll to the goal in the goals board
                          const goalElement = document.querySelector(`[data-goal-id="${goal.id}"]`);
                          if (goalElement) {
                            goalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            goalElement.style.animation = 'highlightGoal 2s ease-in-out';
                            setTimeout(() => {
                              goalElement.style.animation = '';
                            }, 2000);
                          }
                        }}
                      >
                        <div className="due-soon-goal-header">
                          <div className="due-soon-badge">
                            {isOverdue ? '⚠️' : isUrgent ? '🔥' : '📅'}
                          </div>
                          <div className="due-soon-goal-content">
                            <h4>{goal.text}</h4>
                            <p>
                              {goal.area} · {formatTimeframeLabel(goal.timeframe)}
                            </p>
                          </div>
                          <div className="due-soon-days">
                            {isOverdue ? (
                              <span className="days-overdue">
                                {Math.abs(daysRemaining)} days overdue
                              </span>
                            ) : daysRemaining === 0 ? (
                              <span className="days-today">Due today!</span>
                            ) : daysRemaining === 1 ? (
                              <span className="days-urgent">Due tomorrow</span>
                            ) : (
                              <span className={isUrgent ? 'days-urgent' : 'days-normal'}>
                                {daysRemaining} days left
                              </span>
                            )}
                            <div className="due-date-display">
                              {goal.deadline && new Date(goal.deadline).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="due-soon-goal-footer">
                          <div className="due-soon-progress">
                            <span>Progress: {goal.progress}%</span>
                            <div className="due-progress-bar">
                              <div 
                                className="due-progress-fill"
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                          </div>
                          {goal.priority >= 4 && (
                            <span className="due-priority-badge">Priority {goal.priority}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

            {completedGoals.length > 0 && (
              <article className="card card-completed">
                <header className="card-header">
                  <div className="card-title">
                    <span className="icon">🎉</span>
                    <span>Completed Goals</span>
                  </div>
                  <p>Celebrate your wins! Time to reward yourself for these achievements.</p>
                </header>
                <div className="completed-goals-list">
                  {completedGoals.map((goal) => (
                    <div key={goal.id} className="completed-goal-card">
                      <div className="completed-goal-header">
                        <div className="completed-badge">✓</div>
                        <div className="completed-goal-content">
                          <h4>{goal.text}</h4>
                          <p>
                            {goal.area} · {formatTimeframeLabel(goal.timeframe)}
                          </p>
                        </div>
                        <div className="completed-actions">
                          <div className="completed-date">
                            {goal.completedAt 
                              ? new Date(goal.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : goal.deadline 
                                ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'Completed'}
                          </div>
                          <button 
                            className="btn btn-ghost btn-archive"
                            onClick={() => archiveGoal(goal.id)}
                            title="Archive this goal"
                          >
                            📦 Archive
                          </button>
                        </div>
                      </div>
                      {goal.reward && goal.reward.trim() && (
                        <div className="completed-reward">
                          <div className="reward-header">
                            <span className="reward-icon">🎁</span>
                            <span className="reward-label">Your Reward:</span>
                          </div>
                          <div className="reward-text">{goal.reward}</div>
                          <div className="reward-cta">Time to celebrate! 🎊</div>
                        </div>
                      )}
                      {(!goal.reward || !goal.reward.trim()) && (
                        <div className="completed-reward-empty">
                          <span className="reward-icon">💭</span>
                          <span>No reward planned yet. What will you do to celebrate this achievement?</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            )}

            {archivedGoals.length > 0 && (
              <article className="card card-archived">
                <header className="card-header">
                  <div className="card-title">
                    <span className="icon">📦</span>
                    <span>Archived Goals</span>
                  </div>
                  <p>Your completed goals history. Keep these for inspiration and reflection.</p>
                </header>
                <div className="archived-goals-list">
                  {archivedGoals.map((goal) => (
                    <div key={goal.id} className="archived-goal-card">
                      <div className="archived-goal-header">
                        <div className="archived-badge">📦</div>
                        <div className="archived-goal-content">
                          <h4>{goal.text}</h4>
                          <p>
                            {goal.area} · {formatTimeframeLabel(goal.timeframe)}
                            {goal.completedAt && (
                              <span className="archived-date">
                                {' · Completed '}
                                {new Date(goal.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                          </p>
                        </div>
                        <button 
                          className="btn btn-ghost btn-unarchive"
                          onClick={() => unarchiveGoal(goal.id)}
                          title="Restore this goal"
                        >
                          ↺ Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            )}

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
                <li>What's the one goal I'll take action on this week?</li>
                <li>Am I protecting enough time for my top 5 goals?</li>
                <li>What do I need to say no to so my goals can win?</li>
              </ul>
            </article>
          </section>
        </main>

        <footer className="app-footer">
          <div>
            Saved locally in your browser. Export or print anytime. Built for bold humans.
          </div>
          <div className="footer-actions">
            <div>Inspired by the Harvard Goals Study · Educational use only.</div>
            <button className="btn btn-ghost btn-footer-reset" onClick={clearAll} title="Reset all data">
              ♻ Reset All
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
