import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

// User-specific storage keys
function getUserId() {
  let userId = localStorage.getItem('conquer_user_id');
  if (!userId) {
    // Generate a unique user ID
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('conquer_user_id', userId);
  }
  return userId;
}

function getStorageKey(baseKey) {
  const userId = getUserId();
  return `${baseKey}_${userId}`;
}

const CONQUER_STORAGE_KEY_BASE = "conquer_journal_v1";
const CONQUER_WEEKLY_STORAGE_KEY_BASE = "conquer_weekly_reviews_v1";
const CONQUER_MONTHLY_STORAGE_KEY_BASE = "conquer_monthly_reviews_v1";

// Storage utilities with user-specific keys
function getEntry(dateISO) {
  try {
    const storageKey = getStorageKey(CONQUER_STORAGE_KEY_BASE);
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const entries = JSON.parse(raw);
    return entries[dateISO] || null;
  } catch {
    return null;
  }
}

function upsertEntry(entry) {
  try {
    const storageKey = getStorageKey(CONQUER_STORAGE_KEY_BASE);
    const raw = localStorage.getItem(storageKey);
    const entries = raw ? JSON.parse(raw) : {};
    entries[entry.id] = {
      ...entry,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

function listEntries() {
  try {
    const storageKey = getStorageKey(CONQUER_STORAGE_KEY_BASE);
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const entries = JSON.parse(raw);
    return Object.values(entries).sort((a, b) => 
      new Date(b.dateISO) - new Date(a.dateISO)
    );
  } catch {
    return [];
  }
}

function exportData() {
  const entries = listEntries();
  const weekly = getWeeklyReviews();
  const monthly = getMonthlyReviews();
  return {
    entries,
    weeklyReviews: weekly,
    monthlyReviews: monthly,
    exportedAt: new Date().toISOString()
  };
}

// Get all ConquerJournal data for unified storage
function getAllConquerJournalData() {
  try {
    const entries = listEntries();
    const weekly = getWeeklyReviews();
    const monthly = getMonthlyReviews();
    return {
      entries: entries.reduce((acc, entry) => {
        acc[entry.id] = entry;
        return acc;
      }, {}),
      weeklyReviews: weekly,
      monthlyReviews: monthly
    };
  } catch (error) {
    console.error('Error getting ConquerJournal data:', error);
    return {
      entries: {},
      weeklyReviews: [],
      monthlyReviews: []
    };
  }
}

// Load all ConquerJournal data from unified storage
function loadAllConquerJournalData(data) {
  try {
    if (data.entries && typeof data.entries === 'object') {
      const entriesObj = data.entries;
      const storageKey = getStorageKey(CONQUER_STORAGE_KEY_BASE);
      localStorage.setItem(storageKey, JSON.stringify(entriesObj));
    }
    if (data.weeklyReviews && Array.isArray(data.weeklyReviews)) {
      const storageKey = getStorageKey(CONQUER_WEEKLY_STORAGE_KEY_BASE);
      localStorage.setItem(storageKey, JSON.stringify(data.weeklyReviews));
    }
    if (data.monthlyReviews && Array.isArray(data.monthlyReviews)) {
      const storageKey = getStorageKey(CONQUER_MONTHLY_STORAGE_KEY_BASE);
      localStorage.setItem(storageKey, JSON.stringify(data.monthlyReviews));
    }
    return true;
  } catch (error) {
    console.error('Error loading ConquerJournal data:', error);
    return false;
  }
}

// Export functions for use in App.jsx
export { getAllConquerJournalData, loadAllConquerJournalData };

function importData(data) {
  try {
    if (data.entries && Array.isArray(data.entries)) {
      const entriesObj = {};
      data.entries.forEach(entry => {
        entriesObj[entry.id] = entry;
      });
      const storageKey = getStorageKey(CONQUER_STORAGE_KEY_BASE);
      localStorage.setItem(storageKey, JSON.stringify(entriesObj));
    }
    if (data.weeklyReviews && Array.isArray(data.weeklyReviews)) {
      const storageKey = getStorageKey(CONQUER_WEEKLY_STORAGE_KEY_BASE);
      localStorage.setItem(storageKey, JSON.stringify(data.weeklyReviews));
    }
    if (data.monthlyReviews && Array.isArray(data.monthlyReviews)) {
      const storageKey = getStorageKey(CONQUER_MONTHLY_STORAGE_KEY_BASE);
      localStorage.setItem(storageKey, JSON.stringify(data.monthlyReviews));
    }
    return true;
  } catch {
    return false;
  }
}

function getWeeklyReviews() {
  try {
    const storageKey = getStorageKey(CONQUER_WEEKLY_STORAGE_KEY_BASE);
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function upsertWeeklyReview(review) {
  try {
    const storageKey = getStorageKey(CONQUER_WEEKLY_STORAGE_KEY_BASE);
    const reviews = getWeeklyReviews();
    const index = reviews.findIndex(r => r.weekStartISO === review.weekStartISO);
    if (index >= 0) {
      reviews[index] = { ...review, updatedAt: new Date().toISOString() };
    } else {
      reviews.push({ ...review, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(storageKey, JSON.stringify(reviews));
    return true;
  } catch {
    return false;
  }
}

function getMonthlyReviews() {
  try {
    const storageKey = getStorageKey(CONQUER_MONTHLY_STORAGE_KEY_BASE);
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function upsertMonthlyReview(review) {
  try {
    const storageKey = getStorageKey(CONQUER_MONTHLY_STORAGE_KEY_BASE);
    const reviews = getMonthlyReviews();
    const index = reviews.findIndex(r => r.monthISO === review.monthISO);
    if (index >= 0) {
      reviews[index] = { ...review, updatedAt: new Date().toISOString() };
    } else {
      reviews.push({ ...review, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(storageKey, JSON.stringify(reviews));
    return true;
  } catch {
    return false;
  }
}

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatDateForDisplay(dateISO) {
  const date = new Date(dateISO);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

function getWeekStart(dateISO) {
  const date = new Date(dateISO);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getMonthISO(dateISO) {
  return dateISO.substring(0, 7); // YYYY-MM
}

// Smart action generation based on goals
function generateTomorrowActions(selectedGoals, goals) {
  const actions = [];
  selectedGoals.forEach(goalText => {
    if (!goalText || goalText.trim() === '') return;
    const goal = goals.find(g => g.text === goalText);
    if (!goal) return;
    
    // Convert nextStep to tomorrow-specific action
    if (goal.nextStep) {
      let action = goal.nextStep;
      // Make it more actionable for tomorrow
      if (action.includes('schedule') || action.includes('plan')) {
        action = `Tomorrow: ${action}`;
      } else if (action.includes('Block out')) {
        action = action.replace('Block out', 'Schedule');
      } else if (action.includes('Set up')) {
        action = action.replace('Set up', 'Set up tomorrow');
      } else if (action.includes('Create')) {
        action = action.replace('Create', 'Start creating');
      } else if (action.includes('Book')) {
        action = `Tomorrow: ${action}`;
      } else {
        action = `Tomorrow: ${action}`;
      }
      actions.push(action);
    } else {
      // Generate generic action based on goal area
      if (goal.area === 'Health & Energy') {
        actions.push(`Take one action toward: ${goalText.substring(0, 50)}...`);
      } else if (goal.area === 'Wealth & Investing') {
        actions.push(`Make progress on: ${goalText.substring(0, 50)}...`);
      } else {
        actions.push(`Move forward on: ${goalText.substring(0, 50)}...`);
      }
    }
  });
  return actions.slice(0, 3); // Max 3
}

function generateDecisiveMove(selectedGoals, goals) {
  if (!selectedGoals || selectedGoals.length === 0) return '';
  
  // Find highest priority goal
  const goalObjects = selectedGoals
    .map(text => goals.find(g => g.text === text))
    .filter(g => g)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  if (goalObjects.length === 0) return '';
  
  const topGoal = goalObjects[0];
  
  if (topGoal.nextStep) {
    // Convert nextStep to a decisive move
    let move = topGoal.nextStep;
    // Make it more decisive and immediate
    if (move.includes('Block out')) {
      move = move.replace('Block out', 'Block out and commit to');
    } else if (move.includes('Set')) {
      move = move.replace('Set', 'Set and execute');
    } else if (move.includes('Create')) {
      move = move.replace('Create', 'Create and implement');
    } else if (move.includes('Schedule')) {
      move = move.replace('Schedule', 'Schedule and lock in');
    }
    return move;
  }
  
  // Fallback based on area
  if (topGoal.area === 'Health & Energy') {
    return `Take the most important health action for: ${topGoal.text.substring(0, 60)}...`;
  } else if (topGoal.area === 'Wealth & Investing') {
    return `Make the key financial move for: ${topGoal.text.substring(0, 60)}...`;
  }
  
  return `Execute the critical next step for: ${topGoal.text.substring(0, 60)}...`;
}

// Common suggestions for Stop/Double Down
const STOP_SUGGESTIONS = [
  "Checking phone first thing in the morning",
  "Saying yes to things that don't align with my goals",
  "Procrastinating on important tasks",
  "Working late into the evening",
  "Skipping meals or eating poorly",
  "Scrolling social media mindlessly",
  "Multitasking during deep work",
  "Not getting enough sleep",
  "Avoiding difficult conversations",
  "Perfectionism that prevents action",
  "Comparing myself to others",
  "Not taking breaks during work",
  "Overcommitting to low-value activities",
  "Starting the day without a plan",
  "Reactive instead of proactive behavior"
];

const DOUBLE_DOWN_SUGGESTIONS = [
  "Morning routine and planning",
  "Deep work blocks without distractions",
  "Daily movement and exercise",
  "Quality sleep schedule",
  "Protein and whole foods",
  "Weekly review and planning",
  "Time blocking for priorities",
  "Saying no to non-essentials",
  "Daily gratitude practice",
  "Reading and learning",
  "Connecting with important people",
  "Taking strategic breaks",
  "Focusing on one task at a time",
  "Early morning productivity",
  "Consistent daily habits"
];

export default function ConquerJournal({ onBack, theme = 'night', goals = [], onSave = null, getSavePath = null }) {
  const [currentPage, setCurrentPage] = useState('today');
  const [todayISO, setTodayISO] = useState(getTodayISO());
  const [entry, setEntry] = useState(() => {
    const saved = getEntry(todayISO);
    if (saved) {
      // Ensure weeklyFocus exists for backward compatibility
      if (!saved.weeklyFocus) {
        saved.weeklyFocus = {
          thisWeekAbout: '',
          oneThingToStop: '',
          oneThingToDoubleDown: ''
        };
      }
      return saved;
    }
    return createEmptyEntry(todayISO);
  });

  // Reload entry when date changes
  useEffect(() => {
    const saved = getEntry(todayISO);
    if (saved) {
      // Ensure weeklyFocus exists for backward compatibility
      if (!saved.weeklyFocus) {
        saved.weeklyFocus = {
          thisWeekAbout: '',
          oneThingToStop: '',
          oneThingToDoubleDown: ''
        };
      }
      setEntry(saved);
    } else {
      setEntry(createEmptyEntry(todayISO));
    }
  }, [todayISO]);
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'

  function createEmptyEntry(dateISO) {
    return {
      id: dateISO,
      dateISO: dateISO,
      gratitudes: ['', '', ''],
      movement: {
        strength: false,
        cardio: false,
        mobility: false,
        surf: false,
        rest: false
      },
      energy: null,
      respectBody: null,
      currentGoals: [''],
      actionsToday: [''],
      actionsTomorrow: [''],
      decisiveMove: '',
      identityStatement: '',
      aligned: null,
      dayScore: null,
      dayWhy: '',
      weeklyFocus: {
        thisWeekAbout: '',
        oneThingToStop: '',
        oneThingToDoubleDown: ''
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Autosave with debouncing - save to local storage and trigger unified save
  useEffect(() => {
    if (!entry) return;
    
    setSaving(true);
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      if (upsertEntry(entry)) {
        setLastSaved(new Date());
        setSaving(false);
        setSaveStatus('saved');
        
        // Trigger unified save if callback provided
        if (onSave) {
          const conquerData = getAllConquerJournalData();
          onSave(conquerData);
        }
        
        // Clear saved status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaving(false);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [entry, onSave]);

  function updateEntryField(field, value) {
    setEntry(prev => ({ ...prev, [field]: value }));
  }

  function updateGratitude(index, value) {
    const newGratitudes = [...entry.gratitudes];
    newGratitudes[index] = value;
    updateEntryField('gratitudes', newGratitudes);
  }

  function updateMovement(type, value) {
    updateEntryField('movement', { ...entry.movement, [type]: value });
  }

  function addListItem(field, maxItems) {
    if (entry[field].length < maxItems) {
      updateEntryField(field, [...entry[field], '']);
    }
  }

  function updateListItem(field, index, value) {
    const newList = [...entry[field]];
    newList[index] = value;
    updateEntryField(field, newList);
  }

  function removeListItem(field, index) {
    const newList = entry[field].filter((_, i) => i !== index);
    if (newList.length === 0) newList.push('');
    updateEntryField(field, newList);
  }

  function duplicateFromYesterday() {
    const yesterday = new Date(todayISO);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];
    const yesterdayEntry = getEntry(yesterdayISO);
    
    if (yesterdayEntry) {
      setEntry(prev => ({
        ...prev,
        currentGoals: yesterdayEntry.currentGoals.length > 0 ? [...yesterdayEntry.currentGoals] : [''],
        actionsTomorrow: yesterdayEntry.actionsTomorrow.length > 0 ? [...yesterdayEntry.actionsTomorrow] : ['']
      }));
    }
  }

  function calculateProgress() {
    let completed = 0;
    let total = 8;
    
    if (entry.gratitudes.some(g => g.trim())) completed++;
    if (Object.values(entry.movement).some(v => v) || entry.movement.rest) completed++;
    if (entry.currentGoals.some(g => g.trim())) completed++;
    if (entry.actionsToday.some(a => a.trim())) completed++;
    if (entry.actionsTomorrow.some(a => a.trim())) completed++;
    if (entry.decisiveMove.trim()) completed++;
    if (entry.identityStatement.trim()) completed++;
    if (entry.dayScore !== null) completed++;
    
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  }

  const progress = calculateProgress();
  const isComplete = entry.gratitudes.some(g => g.trim()) &&
    (Object.values(entry.movement).some(v => v) || entry.movement.rest) &&
    entry.currentGoals.some(g => g.trim()) &&
    entry.actionsTomorrow.some(a => a.trim()) &&
    entry.dayScore !== null;

  // Get missing sections
  function getMissingSections() {
    const missing = [];
    const sections = [
      { key: 'gratitudes', label: 'Gratitudes', emoji: '🙏', check: () => entry.gratitudes.some(g => g.trim()) },
      { key: 'movement', label: 'Body Check', emoji: '💪', check: () => Object.values(entry.movement).some(v => v) || entry.movement.rest },
      { key: 'currentGoals', label: 'Current Goals', emoji: '🎯', check: () => entry.currentGoals.some(g => g.trim()) },
      { key: 'actionsToday', label: 'Actions Today', emoji: '✅', check: () => entry.actionsToday.some(a => a.trim()) },
      { key: 'actionsTomorrow', label: 'Actions Tomorrow', emoji: '📋', check: () => entry.actionsTomorrow.some(a => a.trim()) },
      { key: 'decisiveMove', label: 'Decisive Move', emoji: '⚡', check: () => entry.decisiveMove.trim() },
      { key: 'identityStatement', label: 'Identity Statement', emoji: '🦋', check: () => entry.identityStatement.trim() },
      { key: 'dayScore', label: 'Day Score', emoji: '⭐', check: () => entry.dayScore !== null }
    ];
    
    sections.forEach(section => {
      if (!section.check()) {
        missing.push(section);
      }
    });
    
    return missing;
  }

  const missingSections = getMissingSections();

  // Calculate analytics
  const analytics = useMemo(() => {
    const allEntries = listEntries();
    const today = new Date();
    const last7Days = [];
    const last30Days = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateISO = date.toISOString().split('T')[0];
      const entry = allEntries.find(e => e.dateISO === dateISO);
      if (entry) {
        if (i < 7) last7Days.push(entry);
        last30Days.push(entry);
      }
    }

    // Calculate streak
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateISO = date.toISOString().split('T')[0];
      const entry = allEntries.find(e => e.dateISO === dateISO);
      if (entry && entry.dayScore !== null) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Calculate averages
    const scores7 = last7Days.filter(e => e.dayScore !== null).map(e => e.dayScore);
    const scores30 = last30Days.filter(e => e.dayScore !== null).map(e => e.dayScore);
    const avg7 = scores7.length > 0 ? Math.round(scores7.reduce((a, b) => a + b, 0) / scores7.length * 10) / 10 : null;
    const avg30 = scores30.length > 0 ? Math.round(scores30.reduce((a, b) => a + b, 0) / scores30.length * 10) / 10 : null;

    // Movement counts
    const movement7 = last7Days.filter(e => Object.values(e.movement).some(v => v) || e.movement.rest).length;
    const movement30 = last30Days.filter(e => Object.values(e.movement).some(v => v) || e.movement.rest).length;

    // Alignment rate
    const aligned7 = last7Days.filter(e => e.aligned === true).length;
    const aligned30 = last30Days.filter(e => e.aligned === true).length;
    const alignmentRate7 = last7Days.length > 0 ? Math.round((aligned7 / last7Days.length) * 100) : 0;
    const alignmentRate30 = last30Days.length > 0 ? Math.round((aligned30 / last30Days.length) * 100) : 0;

    return {
      streak,
      avg7,
      avg30,
      movement7,
      movement30,
      alignmentRate7,
      alignmentRate30
    };
  }, []);

  return (
    <div className={`app-root ${theme}-skin`}>
      <div className="app-shell">
        <header className="app-hero">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <p className="eyebrow">CONQUER JOURNAL</p>
                <h1 className="hero-title">Discipline → Freedom</h1>
              </div>
              <button 
                className="btn btn-ghost" 
                onClick={onBack} 
                title="Back to Goals"
                style={{ 
                  fontSize: '12px', 
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '12px',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(56, 189, 248, 0.2)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(56, 189, 248, 0.2)';
                }}
              >
                🚀 Goals
              </button>
            </div>
            <div className="planner-owner-row" style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button 
                  className={`btn btn-ghost ${currentPage === 'today' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('today')}
                >
                  📅 Today
                </button>
                <button 
                  className={`btn btn-ghost ${currentPage === 'calendar' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('calendar')}
                >
                  📅 Calendar
                </button>
                <button 
                  className={`btn btn-ghost ${currentPage === 'history' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('history')}
                >
                  📆 History
                </button>
                <button 
                  className={`btn btn-ghost ${currentPage === 'weekly' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('weekly')}
                >
                  📊 Weekly
                </button>
                <button 
                  className={`btn btn-ghost ${currentPage === 'monthly' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('monthly')}
                >
                  🗓️ Monthly
                </button>
                <button 
                  className={`btn btn-ghost ${currentPage === 'settings' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('settings')}
                >
                  ⚙️ Settings
                </button>
              </div>
              {currentPage === 'today' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    value={todayISO}
                    onChange={(e) => setTodayISO(e.target.value)}
                    style={{ 
                      fontSize: '11px', 
                      padding: '6px 10px',
                      borderRadius: '999px',
                      border: '1px solid var(--border)',
                      background: 'rgba(148, 163, 184, 0.1)',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </header>

        <main style={{ marginTop: '24px' }}>
          {currentPage === 'today' && (
            <TodayPage
              entry={entry}
              updateEntryField={updateEntryField}
              updateGratitude={updateGratitude}
              updateMovement={updateMovement}
              addListItem={addListItem}
              updateListItem={updateListItem}
              removeListItem={removeListItem}
              duplicateFromYesterday={duplicateFromYesterday}
              progress={progress}
              isComplete={isComplete}
              analytics={analytics}
              goals={goals}
              missingSections={missingSections}
              theme={theme}
            />
          )}
          {currentPage === 'calendar' && (
            <CalendarPage 
              onSelectDate={(dateISO) => {
                const selectedEntry = getEntry(dateISO);
                if (selectedEntry) {
                  setEntry(selectedEntry);
                } else {
                  setEntry(createEmptyEntry(dateISO));
                }
                setTodayISO(dateISO);
                setCurrentPage('today');
              }}
            />
          )}
          {currentPage === 'history' && (
            <HistoryPage 
              onSelectDate={(dateISO) => {
                const selectedEntry = getEntry(dateISO);
                if (selectedEntry) {
                  setEntry(selectedEntry);
                  setTodayISO(dateISO);
                  setCurrentPage('today');
                }
              }}
            />
          )}
          {currentPage === 'weekly' && (
            <WeeklyReviewPage />
          )}
          {currentPage === 'monthly' && (
            <MonthlyReviewPage />
          )}
          {currentPage === 'settings' && (
            <SettingsPage />
          )}
        </main>
        
        <footer className="app-footer" style={{ marginTop: '48px', padding: '24px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <button 
              className="btn btn-ghost" 
              onClick={onBack} 
              title="Back to Goals"
              style={{ 
                fontSize: '12px', 
                padding: '8px 16px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '12px',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(56, 189, 248, 0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(56, 189, 248, 0.2)';
              }}
            >
              🚀 Goals
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function TodayPage({ entry, updateEntryField, updateGratitude, updateMovement, addListItem, updateListItem, removeListItem, duplicateFromYesterday, progress, isComplete, analytics, goals = [], missingSections = [], theme = 'night' }) {
  return (
    <div className="planner-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
      <section className="column">
        {/* Analytics Summary */}
        <article className="card highlight" style={{ 
          background: analytics.streak > 0 ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.1))' : undefined,
          border: analytics.streak > 0 ? '2px solid rgba(56, 189, 248, 0.4)' : undefined
        }}>
          <header className="card-header">
            <div className="card-title">
              <span className="icon">📊</span>
              <span>Your Momentum</span>
              {analytics.streak > 0 && (
                <span style={{ 
                  marginLeft: '12px',
                  fontSize: '12px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  color: 'var(--accent)'
                }}>
                  🔥 {analytics.streak} Day Streak!
                </span>
              )}
            </div>
          </header>
          <div style={{ marginBottom: '16px' }}>
            <button
              className="btn btn-ghost"
              onClick={duplicateFromYesterday}
              title="Copy yesterday's goals and actions to get started quickly"
              style={{ 
                fontSize: '12px', 
                padding: '8px 16px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '8px',
                fontWeight: 500
              }}
            >
              📋 Copy Yesterday's Goals
            </button>
          </div>
          <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
            <div>
              <p>Streak</p>
              <strong>{analytics.streak} {analytics.streak === 1 ? 'day' : 'days'}</strong>
            </div>
            {analytics.avg7 !== null && (
              <div>
                <p>7-Day Avg</p>
                <strong>{analytics.avg7}/10</strong>
              </div>
            )}
            {analytics.avg30 !== null && (
              <div>
                <p>30-Day Avg</p>
                <strong>{analytics.avg30}/10</strong>
              </div>
            )}
            <div>
              <p>Movement (7d)</p>
              <strong>{analytics.movement7}/7</strong>
            </div>
            <div>
              <p>Aligned (7d)</p>
              <strong>{analytics.alignmentRate7}%</strong>
            </div>
          </div>
        </article>
        <article className="card">
          <header className="card-header">
            <div className="card-title">
              <span className="icon">🙏</span>
              <span>Three Gratitudes</span>
            </div>
            <p>What are you grateful for today?</p>
          </header>
          <div className="field">
            {entry.gratitudes.map((gratitude, index) => (
              <input
                key={index}
                type="text"
                value={gratitude}
                onChange={(e) => updateGratitude(index, e.target.value)}
                placeholder={`Gratitude ${index + 1}`}
                style={{ marginBottom: '8px' }}
              />
            ))}
          </div>
        </article>

        <article className="card">
          <header className="card-header">
            <div className="card-title">
              <span className="icon">💪</span>
              <span>Body Check</span>
            </div>
            <p>How did you move your body today?</p>
          </header>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {['strength', 'cardio', 'mobility', 'surf', 'rest'].map(type => (
              <button
                key={type}
                className={`btn ${entry.movement[type] ? 'primary' : 'btn-ghost'}`}
                onClick={() => updateMovement(type, !entry.movement[type])}
                style={{ textTransform: 'capitalize' }}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="field-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="field">
              <label>Energy Level (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={entry.energy || ''}
                onChange={(e) => updateEntryField('energy', e.target.value ? Number(e.target.value) : null)}
                placeholder="1-10"
              />
            </div>
            <div className="field">
              <label>Respect Body?</label>
              <select
                value={entry.respectBody === null ? '' : entry.respectBody ? 'yes' : 'no'}
                onChange={(e) => updateEntryField('respectBody', e.target.value === '' ? null : e.target.value === 'yes')}
              >
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </article>

        <article className="card">
          <header className="card-header">
            <div className="card-title">
              <span className="icon">🎯</span>
              <span>Current Focus Goals</span>
            </div>
            <p>What are your top 3 goals right now? <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Select from your Goals page to auto-generate actions</span></p>
          </header>
          <div className="field">
            {entry.currentGoals.map((goal, index) => {
              const selectedGoal = goals.find(g => g.text === goal);
              return (
                <div key={index} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <select
                      value={goal}
                      onChange={(e) => {
                        const selectedGoalText = e.target.value;
                        updateListItem('currentGoals', index, selectedGoalText);
                        
                        // Get all selected goals
                        const updatedGoals = [...entry.currentGoals];
                        updatedGoals[index] = selectedGoalText;
                        const selectedGoals = updatedGoals.filter(g => g && g.trim() !== '');
                        
                        // Auto-populate action if goal has nextStep
                        if (selectedGoalText && selectedGoalText !== '') {
                          const matchingGoal = goals.find(g => g.text === selectedGoalText);
                          if (matchingGoal && matchingGoal.nextStep) {
                            // Add or update the first action in actionsToday
                            const currentActions = [...entry.actionsToday];
                            if (currentActions[0] && !currentActions[0].trim()) {
                              currentActions[0] = matchingGoal.nextStep;
                            } else if (!currentActions.some(a => a.includes(matchingGoal.nextStep.substring(0, 20)))) {
                              // Add as new action if not already there
                              const emptyIndex = currentActions.findIndex(a => !a.trim());
                              if (emptyIndex >= 0) {
                                currentActions[emptyIndex] = matchingGoal.nextStep;
                              } else if (currentActions.length < 4) {
                                currentActions.push(matchingGoal.nextStep);
                              }
                            }
                            updateEntryField('actionsToday', currentActions);
                          }
                        }
                        
                        // Generate smart tomorrow actions
                        if (selectedGoals.length > 0) {
                          const tomorrowActions = generateTomorrowActions(selectedGoals, goals);
                          if (tomorrowActions.length > 0) {
                            const currentTomorrow = [...entry.actionsTomorrow];
                            // Fill empty slots or replace if all filled
                            tomorrowActions.forEach((action, i) => {
                              if (i < 3) {
                                if (currentTomorrow[i] && !currentTomorrow[i].trim()) {
                                  currentTomorrow[i] = action;
                                } else if (currentTomorrow.length <= i) {
                                  currentTomorrow.push(action);
                                } else if (!currentTomorrow.some(a => a.includes(action.substring(0, 30)))) {
                                  // Only add if not already similar
                                  if (currentTomorrow.length < 3) {
                                    currentTomorrow.push(action);
                                  } else {
                                    currentTomorrow[i] = action;
                                  }
                                }
                              }
                            });
                            updateEntryField('actionsTomorrow', currentTomorrow.slice(0, 3));
                          }
                        }
                        
                        // Generate decisive move
                        if (selectedGoals.length > 0) {
                          const decisiveMove = generateDecisiveMove(selectedGoals, goals);
                          if (decisiveMove && !entry.decisiveMove.trim()) {
                            updateEntryField('decisiveMove', decisiveMove);
                          }
                        }
                      }}
                      style={{ 
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '999px',
                        border: '1px solid var(--border)',
                        background: 'rgba(148, 163, 184, 0.1)',
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Select a goal from your Goals page...</option>
                      {goals.filter(g => !g.archived && g.status !== 'Done').map(g => (
                        <option key={g.id} value={g.text}>
                          {g.text.length > 60 ? g.text.substring(0, 60) + '...' : g.text}
                        </option>
                      ))}
                    </select>
                    {entry.currentGoals.length > 1 && (
                      <button
                        className="btn btn-ghost"
                        onClick={() => removeListItem('currentGoals', index)}
                        style={{ padding: '8px 12px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {selectedGoal && selectedGoal.nextStep && (
                    <div style={{ 
                      padding: '8px 12px', 
                      background: 'rgba(56, 189, 248, 0.1)', 
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginTop: '4px'
                    }}>
                      <strong>Suggested action:</strong> {selectedGoal.nextStep}
                    </div>
                  )}
                </div>
              );
            })}
            {entry.currentGoals.length < 3 && (
              <button
                className="btn btn-ghost"
                onClick={() => addListItem('currentGoals', 3)}
                style={{ marginTop: '8px' }}
              >
                + Add Goal
              </button>
            )}
          </div>
        </article>

        <article className="card">
          <header className="card-header">
            <div className="card-title">
              <span className="icon">✅</span>
              <span>Actions Taken Today</span>
            </div>
            <p>What did you accomplish? (max 4)</p>
          </header>
          <div className="field">
            {entry.actionsToday.map((action, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={action}
                  onChange={(e) => updateListItem('actionsToday', index, e.target.value)}
                  placeholder={`Action ${index + 1}`}
                  style={{ flex: 1 }}
                />
                {entry.actionsToday.length > 1 && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => removeListItem('actionsToday', index)}
                    style={{ padding: '8px 12px' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {entry.actionsToday.length < 4 && (
              <button
                className="btn btn-ghost"
                onClick={() => addListItem('actionsToday', 4)}
                style={{ marginTop: '8px' }}
              >
                + Add Action
              </button>
            )}
          </div>
        </article>

        <article className="card">
          <header className="card-header">
            <div className="card-title">
              <span className="icon">🚀</span>
              <span>ACTIONS I WILL TAKE TOMORROW (NON-NEGOTIABLES)</span>
            </div>
            <p>What must get done tomorrow? (max 3) <span style={{ fontSize: '11px', color: 'var(--accent)', fontStyle: 'italic' }}>✨ Smart suggestions based on your goals</span></p>
          </header>
          <div className="field">
            {entry.actionsTomorrow.map((action, index) => {
              const selectedGoals = entry.currentGoals.filter(g => g && g.trim() !== '');
              const suggestedActions = selectedGoals.length > 0 ? generateTomorrowActions(selectedGoals, goals) : [];
              const hasSuggestion = suggestedActions[index];
              
              return (
                <div key={index} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                    <input
                      type="text"
                      value={action}
                      onChange={(e) => updateListItem('actionsTomorrow', index, e.target.value)}
                      placeholder={`Non-negotiable ${index + 1}`}
                      style={{ flex: 1 }}
                      list={`tomorrow-suggestions-${index}`}
                    />
                    {hasSuggestion && !action.trim() && (
                      <button
                        className="btn btn-ghost"
                        onClick={() => updateListItem('actionsTomorrow', index, suggestedActions[index])}
                        style={{ 
                          padding: '6px 10px',
                          fontSize: '10px',
                          whiteSpace: 'nowrap',
                          background: 'rgba(56, 189, 248, 0.15)',
                          borderColor: 'rgba(56, 189, 248, 0.4)'
                        }}
                        title="Use suggested action"
                      >
                        ✨ Use
                      </button>
                    )}
                    {entry.actionsTomorrow.length > 1 && (
                      <button
                        className="btn btn-ghost"
                        onClick={() => removeListItem('actionsTomorrow', index)}
                        style={{ padding: '8px 12px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {hasSuggestion && !action.trim() && (
                    <div style={{ 
                      padding: '6px 10px', 
                      background: 'rgba(56, 189, 248, 0.1)', 
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => updateListItem('actionsTomorrow', index, suggestedActions[index])}
                    >
                      💡 <strong>Suggested:</strong> {suggestedActions[index]}
                    </div>
                  )}
                </div>
              );
            })}
            {entry.actionsTomorrow.length < 3 && (
              <button
                className="btn btn-ghost"
                onClick={() => addListItem('actionsTomorrow', 3)}
                style={{ marginTop: '8px' }}
              >
                + Add
              </button>
            )}
          </div>
        </article>

        <article className="card">
          <header className="card-header">
            <div className="card-title">
              <span className="icon">⚡</span>
              <span>One Decisive Move</span>
            </div>
            <p>The one action that will move the needle today. <span style={{ fontSize: '11px', color: 'var(--accent)', fontStyle: 'italic' }}>✨ Auto-suggested from your goals</span></p>
          </header>
          <div className="field">
            {(() => {
              const selectedGoals = entry.currentGoals.filter(g => g && g.trim() !== '');
              const suggestedMove = selectedGoals.length > 0 ? generateDecisiveMove(selectedGoals, goals) : '';
              return (
                <>
                  <input
                    type="text"
                    value={entry.decisiveMove}
                    onChange={(e) => updateEntryField('decisiveMove', e.target.value)}
                    placeholder="What's the one decisive move?"
                    list="decisive-move-suggestions"
                  />
                  {suggestedMove && !entry.decisiveMove.trim() && (
                    <div style={{ 
                      padding: '8px 12px', 
                      background: 'rgba(56, 189, 248, 0.1)', 
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginTop: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onClick={() => updateEntryField('decisiveMove', suggestedMove)}
                    >
                      <span>💡 <strong>Suggested decisive move:</strong> {suggestedMove}</span>
                      <button
                        className="btn btn-ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateEntryField('decisiveMove', suggestedMove);
                        }}
                        style={{ 
                          padding: '4px 8px',
                          fontSize: '10px',
                          marginLeft: '8px'
                        }}
                      >
                        Use
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </article>

        <article className="card">
          <header className="card-header">
            <div className="card-title">
              <span className="icon">🎭</span>
              <span>Identity Statement</span>
            </div>
            <p>Who are you becoming?</p>
          </header>
          <div className="field">
            <textarea
              value={entry.identityStatement}
              onChange={(e) => updateEntryField('identityStatement', e.target.value)}
              placeholder="I am someone who..."
              rows={2}
            />
          </div>
        </article>

        <article className="card">
          <header className="card-header">
            <div className="card-title">
              <span className="icon">📊</span>
              <span>Day Scorecard</span>
            </div>
            <p>Rate your day and alignment.</p>
          </header>
          <div className="field-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="field">
              <label>Day Score (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={entry.dayScore || ''}
                onChange={(e) => updateEntryField('dayScore', e.target.value ? Number(e.target.value) : null)}
                placeholder="1-10"
              />
            </div>
            <div className="field">
              <label>Aligned?</label>
              <select
                value={entry.aligned === null ? '' : entry.aligned ? 'yes' : 'no'}
                onChange={(e) => updateEntryField('aligned', e.target.value === '' ? null : e.target.value === 'yes')}
              >
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
          <div className="field" style={{ marginTop: '16px' }}>
            <label>Why this score?</label>
            <textarea
              value={entry.dayWhy}
              onChange={(e) => updateEntryField('dayWhy', e.target.value)}
              placeholder="What made this day what it was?"
              rows={2}
            />
          </div>
        </article>

        {/* Optional Weekly Focus Section */}
        <article className="card" style={{ border: '2px solid rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.05)' }}>
          <header className="card-header">
            <div className="card-title">
              <span className="icon">📅</span>
              <span>OPTIONAL WEEKLY PAGE (HIGHLY RECOMMENDED)</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Weekly Focus • Fill this once per week to maintain clarity
            </p>
          </header>
          <div className="field">
            <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
              This week is about:
            </label>
            <textarea
              value={entry.weeklyFocus?.thisWeekAbout || ''}
              onChange={(e) => updateEntryField('weeklyFocus', {
                ...(entry.weeklyFocus || {}),
                thisWeekAbout: e.target.value
              })}
              placeholder="What is this week's main theme or focus?"
              rows={2}
            />
          </div>
          <div className="field" style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
              One Thing to Stop
            </label>
            <select
              value={entry.weeklyFocus?.oneThingToStop || ''}
              onChange={(e) => updateEntryField('weeklyFocus', {
                ...(entry.weeklyFocus || {}),
                oneThingToStop: e.target.value
              })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                background: 'rgba(148, 163, 184, 0.1)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '14px',
                marginBottom: '8px'
              }}
            >
              <option value="">Select or type your own...</option>
              {STOP_SUGGESTIONS.map((suggestion, idx) => (
                <option key={idx} value={suggestion}>{suggestion}</option>
              ))}
            </select>
            {entry.weeklyFocus?.oneThingToStop && !STOP_SUGGESTIONS.includes(entry.weeklyFocus.oneThingToStop) && (
              <input
                type="text"
                value={entry.weeklyFocus.oneThingToStop}
                onChange={(e) => updateEntryField('weeklyFocus', {
                  ...(entry.weeklyFocus || {}),
                  oneThingToStop: e.target.value
                })}
                placeholder="Or type your own..."
                style={{ marginTop: '8px', width: '100%' }}
              />
            )}
            {(!entry.weeklyFocus?.oneThingToStop || entry.weeklyFocus.oneThingToStop === '') && (
              <input
                type="text"
                value=""
                onChange={(e) => {
                  if (e.target.value && !STOP_SUGGESTIONS.includes(e.target.value)) {
                    updateEntryField('weeklyFocus', {
                      ...(entry.weeklyFocus || {}),
                      oneThingToStop: e.target.value
                    });
                  }
                }}
                placeholder="Or type your own..."
                style={{ marginTop: '8px', width: '100%' }}
                onFocus={(e) => {
                  // Clear select when typing
                  const select = e.target.previousElementSibling;
                  if (select && select.tagName === 'SELECT') {
                    select.value = '';
                  }
                }}
              />
            )}
          </div>
          <div className="field" style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
              One Thing to Double Down On
            </label>
            <select
              value={entry.weeklyFocus?.oneThingToDoubleDown || ''}
              onChange={(e) => updateEntryField('weeklyFocus', {
                ...(entry.weeklyFocus || {}),
                oneThingToDoubleDown: e.target.value
              })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                background: 'rgba(148, 163, 184, 0.1)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '14px',
                marginBottom: '8px'
              }}
            >
              <option value="">Select or type your own...</option>
              {DOUBLE_DOWN_SUGGESTIONS.map((suggestion, idx) => (
                <option key={idx} value={suggestion}>{suggestion}</option>
              ))}
            </select>
            {entry.weeklyFocus?.oneThingToDoubleDown && !DOUBLE_DOWN_SUGGESTIONS.includes(entry.weeklyFocus.oneThingToDoubleDown) && (
              <input
                type="text"
                value={entry.weeklyFocus.oneThingToDoubleDown}
                onChange={(e) => updateEntryField('weeklyFocus', {
                  ...(entry.weeklyFocus || {}),
                  oneThingToDoubleDown: e.target.value
                })}
                placeholder="Or type your own..."
                style={{ marginTop: '8px', width: '100%' }}
              />
            )}
            {(!entry.weeklyFocus?.oneThingToDoubleDown || entry.weeklyFocus.oneThingToDoubleDown === '') && (
              <input
                type="text"
                value=""
                onChange={(e) => {
                  if (e.target.value && !DOUBLE_DOWN_SUGGESTIONS.includes(e.target.value)) {
                    updateEntryField('weeklyFocus', {
                      ...(entry.weeklyFocus || {}),
                      oneThingToDoubleDown: e.target.value
                    });
                  }
                }}
                placeholder="Or type your own..."
                style={{ marginTop: '8px', width: '100%' }}
                onFocus={(e) => {
                  // Clear select when typing
                  const select = e.target.previousElementSibling;
                  if (select && select.tagName === 'SELECT') {
                    select.value = '';
                  }
                }}
              />
            )}
          </div>
        </article>

        {/* Progress Banner - Shows missing sections or celebration */}
        <div style={{ marginTop: '16px' }}>
          {isComplete ? (
            // Celebration Button - All sections complete!
            <button 
              className="btn primary" 
              style={{ 
                width: '100%',
                padding: '20px',
                background: 'linear-gradient(135deg, #10b981, #059669, #10b981)',
                backgroundSize: '200% 200%',
                animation: 'celebrationGradient 3s ease infinite, celebrationPulse 2s ease-in-out infinite',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '16px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 48px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3)';
              }}
              onClick={(e) => {
                // Enhanced celebration effect
                const btn = e.currentTarget;
                btn.style.transform = 'scale(1.05)';
                setTimeout(() => {
                  btn.style.transform = 'scale(1)';
                }, 300);
                
                // Create confetti effect
                for (let i = 0; i < 20; i++) {
                  setTimeout(() => {
                    const confetti = document.createElement('div');
                    confetti.style.position = 'absolute';
                    confetti.style.left = `${Math.random() * 100}%`;
                    confetti.style.top = '0';
                    confetti.style.width = '8px';
                    confetti.style.height = '8px';
                    confetti.style.background = ['#10b981', '#fbbf24', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 4)];
                    confetti.style.borderRadius = '50%';
                    confetti.style.pointerEvents = 'none';
                    confetti.style.zIndex = '1000';
                    confetti.style.animation = 'confettiFall 2s ease-out forwards';
                    btn.appendChild(confetti);
                    setTimeout(() => confetti.remove(), 2000);
                  }, i * 50);
                }
              }}
            >
              <span style={{ fontSize: '24px', marginRight: '12px' }}>🎉</span>
              <span>ALL SECTIONS COMPLETE!</span>
              <span style={{ fontSize: '24px', marginLeft: '12px' }}>🎉</span>
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                animation: 'celebrationShine 2s ease-in-out infinite',
                pointerEvents: 'none'
              }} />
            </button>
          ) : (
            // Progress Banner - Shows what's missing (matching image style)
            <div style={{ 
              width: '100%',
              padding: '14px 18px',
              background: theme === 'day' ? '#1e3a8a' : '#1e40af',
              borderRadius: '12px',
              border: `2px solid ${theme === 'day' ? '#3b82f6' : '#60a5fa'}`,
              boxShadow: '0 4px 16px rgba(30, 64, 175, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: theme === 'day' ? '#3b82f6' : '#60a5fa',
                opacity: 0.6
              }} />
              
              {/* Main Progress Text */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: missingSections.length > 0 ? '14px' : '0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ 
                    fontSize: '15px', 
                    fontWeight: 600,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>{progress.completed}/{progress.total} sections complete</span>
                    {progress.percentage >= 50 && (
                      <span style={{ 
                        fontSize: '13px',
                        color: '#ffffff',
                        opacity: 0.9,
                        fontStyle: 'italic'
                      }}>
                        • Keep going!
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: '18px' }}>💪</span>
                </div>
              </div>
              
              {/* Missing Sections List */}
              {missingSections.length > 0 && (
                <div style={{ 
                  paddingTop: '14px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                  <div style={{ 
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    What's Missing:
                  </div>
                  <div style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {missingSections.map((section, index) => (
                      <div
                        key={section.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 12px',
                          background: 'rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          fontSize: '12px',
                          color: '#ffffff',
                          fontWeight: 500,
                          animation: `fadeIn 0.3s ease ${index * 0.1}s both`,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>{section.emoji}</span>
                        <span>{section.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CalendarPage({ onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();
  const todayISO = getTodayISO();
  
  const entries = listEntries();
  const entriesByDate = useMemo(() => {
    const map = {};
    entries.forEach(entry => {
      map[entry.dateISO] = entry;
    });
    return map;
  }, [entries]);

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const getDateISO = (date) => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
  };

  const hasEntry = (date) => {
    const dateISO = getDateISO(date);
    return dateISO && entriesByDate[dateISO];
  };

  const getEntryScore = (date) => {
    const dateISO = getDateISO(date);
    const entry = entriesByDate[dateISO];
    return entry?.dayScore || null;
  };

  // Monthly stats
  const monthStats = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthEntries = entries.filter(e => {
      const entryDate = new Date(e.dateISO);
      return entryDate.getFullYear() === year && entryDate.getMonth() === month;
    });
    
    const scores = monthEntries.filter(e => e.dayScore !== null).map(e => e.dayScore);
    const actions = monthEntries.reduce((acc, e) => {
      return acc + e.actionsToday.filter(a => a.trim()).length;
    }, 0);
    const aligned = monthEntries.filter(e => e.aligned === true).length;
    
    return {
      totalDays: monthEntries.length,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null,
      totalActions: actions,
      alignedDays: aligned
    };
  }, [entries, currentMonth]);

  // Year-to-date stats
  const ytdStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearEntries = entries.filter(e => {
      const entryDate = new Date(e.dateISO);
      return entryDate.getFullYear() === currentYear;
    });
    
    const scores = yearEntries.filter(e => e.dayScore !== null).map(e => e.dayScore);
    const actions = yearEntries.reduce((acc, e) => {
      return acc + e.actionsToday.filter(a => a.trim()).length;
    }, 0);
    const aligned = yearEntries.filter(e => e.aligned === true).length;
    
    return {
      totalDays: yearEntries.length,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null,
      totalActions: actions,
      alignedDays: aligned
    };
  }, [entries]);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <article className="card">
        <header className="card-header">
          <div className="card-title">
            <span className="icon">📅</span>
            <span>Calendar View</span>
          </div>
        </header>
        
        {/* Stats Summary */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '12px',
          marginBottom: '24px',
          padding: '16px',
          background: 'rgba(56, 189, 248, 0.1)',
          borderRadius: '12px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>This Month</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
              {monthStats.totalDays} days
            </div>
            {monthStats.avgScore && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Avg: {monthStats.avgScore}/10
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Actions This Month</div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>
              {monthStats.totalActions}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Year to Date</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
              {ytdStats.totalDays} days
            </div>
            {ytdStats.avgScore && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Avg: {ytdStats.avgScore}/10
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>YTD Actions</div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>
              {ytdStats.totalActions}
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn btn-ghost"
              onClick={() => navigateMonth(-1)}
              style={{ padding: '8px 12px' }}
            >
              ←
            </button>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, minWidth: '200px', textAlign: 'center' }}>
              {monthName}
            </h3>
            <button
              className="btn btn-ghost"
              onClick={() => navigateMonth(1)}
              style={{ padding: '8px 12px' }}
            >
              →
            </button>
          </div>
          <button
            className="btn btn-ghost"
            onClick={goToToday}
            style={{ fontSize: '12px' }}
          >
            Today
          </button>
        </div>

        {/* Calendar Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '4px',
          marginBottom: '16px'
        }}
        className="calendar-grid"
        >
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
            <div 
              key={day}
              style={{ 
                textAlign: 'center', 
                fontSize: '12px', 
                fontWeight: 600,
                color: 'var(--text-muted)',
                padding: '8px 4px'
              }}
            >
              {day}
            </div>
          ))}
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} style={{ aspectRatio: '1' }} />;
            }
            
            const dateISO = getDateISO(date);
            const isToday = dateISO === todayISO;
            const hasEntryForDate = hasEntry(date);
            const score = getEntryScore(date);
            const isPast = date < today && !isToday;
            
            return (
              <button
                key={dateISO}
                onClick={() => onSelectDate(dateISO)}
                style={{
                  aspectRatio: '1',
                  border: isToday 
                    ? '2px solid var(--accent)' 
                    : hasEntryForDate 
                      ? '2px solid rgba(56, 189, 248, 0.4)' 
                      : '1px solid var(--border)',
                  borderRadius: '8px',
                  background: hasEntryForDate 
                    ? (score !== null && score >= 8 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : score !== null && score <= 5 
                          ? 'rgba(248, 113, 113, 0.15)'
                          : 'rgba(56, 189, 248, 0.15)')
                    : 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: isToday ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  position: 'relative',
                  opacity: isPast && !hasEntryForDate ? 0.4 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isToday) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title={hasEntryForDate ? `Score: ${score || 'N/A'}/10 - Click to view` : 'Click to create entry'}
              >
                <span>{date.getDate()}</span>
                {hasEntryForDate && (
                  <span style={{ 
                    fontSize: '10px',
                    color: score !== null && score >= 8 ? '#10b981' : score !== null && score <= 5 ? '#f87171' : 'var(--accent)'
                  }}>
                    {score !== null ? `★${score}` : '✓'}
                  </span>
                )}
                {isToday && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    fontSize: '8px',
                    color: 'var(--accent)'
                  }}>
                    ●
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          flexWrap: 'wrap',
          fontSize: '12px',
          color: 'var(--text-muted)',
          padding: '12px',
          background: 'rgba(148, 163, 184, 0.05)',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              border: '2px solid var(--accent)',
              borderRadius: '4px'
            }} />
            <span>Today</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '4px'
            }} />
            <span>Has Entry</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              background: 'rgba(16, 185, 129, 0.2)',
              borderRadius: '4px'
            }} />
            <span>High Score (8+)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              background: 'rgba(248, 113, 113, 0.15)',
              borderRadius: '4px'
            }} />
            <span>Low Score (≤5)</span>
          </div>
        </div>
      </article>
    </div>
  );
}

function HistoryPage({ onSelectDate }) {
  const [entries, setEntries] = useState(listEntries());
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredEntries = useMemo(() => {
    let filtered = entries;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => {
        return (
          entry.gratitudes.some(g => g.toLowerCase().includes(term)) ||
          entry.currentGoals.some(g => g.toLowerCase().includes(term)) ||
          entry.actionsToday.some(a => a.toLowerCase().includes(term)) ||
          entry.decisiveMove.toLowerCase().includes(term) ||
          entry.identityStatement.toLowerCase().includes(term)
        );
      });
    }

    if (filter === 'completed') {
      filtered = filtered.filter(e => e.dayScore !== null);
    } else if (filter === 'incomplete') {
      filtered = filtered.filter(e => e.dayScore === null);
    } else if (filter === 'high') {
      filtered = filtered.filter(e => e.dayScore >= 8);
    } else if (filter === 'low') {
      filtered = filtered.filter(e => e.dayScore <= 5 && e.dayScore !== null);
    }

    return filtered;
  }, [entries, searchTerm, filter]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <article className="card">
        <header className="card-header">
          <div className="card-title">
            <span className="icon">📆</span>
            <span>History</span>
          </div>
        </header>
        <div className="field" style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search entries..."
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-ghost ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`btn btn-ghost ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button
            className={`btn btn-ghost ${filter === 'incomplete' ? 'active' : ''}`}
            onClick={() => setFilter('incomplete')}
          >
            Incomplete
          </button>
          <button
            className={`btn btn-ghost ${filter === 'high' ? 'active' : ''}`}
            onClick={() => setFilter('high')}
          >
            High Score (8+)
          </button>
          <button
            className={`btn btn-ghost ${filter === 'low' ? 'active' : ''}`}
            onClick={() => setFilter('low')}
          >
            Low Score (≤5)
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredEntries.length === 0 ? (
            <div className="empty-state">No entries found.</div>
          ) : (
            filteredEntries.map(entry => (
              <div
                key={entry.id}
                className="card"
                style={{ padding: '16px', cursor: 'pointer' }}
                onClick={() => onSelectDate(entry.dateISO)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px' }}>{formatDateForDisplay(entry.dateISO)}</h4>
                    {entry.dayScore !== null && (
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>
                        Score: {entry.dayScore}/10
                      </span>
                    )}
                  </div>
                  {entry.aligned !== null && (
                    <span style={{ fontSize: '12px', color: entry.aligned ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {entry.aligned ? '✓ Aligned' : '✗ Not Aligned'}
                    </span>
                  )}
                </div>
                {entry.decisiveMove && (
                  <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                    {entry.decisiveMove}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </article>
    </div>
  );
}

function WeeklyReviewPage() {
  const [review, setReview] = useState(() => {
    const weekStart = getWeekStart(getTodayISO());
    const reviews = getWeeklyReviews();
    const existing = reviews.find(r => r.weekStartISO === weekStart);
    return existing || {
      weekStartISO: weekStart,
      theme: '',
      worked: [''],
      didnt: [''],
      stop: '',
      doubleDown: '',
      score: null
    };
  });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    setSaving(true);
    const timer = setTimeout(() => {
      if (upsertWeeklyReview(review)) {
        setLastSaved(new Date());
        setSaving(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [review]);

  const entries = useMemo(() => {
    const allEntries = listEntries();
    const weekStart = new Date(review.weekStartISO);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return allEntries.filter(e => {
      const entryDate = new Date(e.dateISO);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });
  }, [review.weekStartISO]);

  const stats = useMemo(() => {
    const scores = entries.filter(e => e.dayScore !== null).map(e => e.dayScore);
    const aligned = entries.filter(e => e.aligned === true).length;
    const movementDays = entries.filter(e => 
      Object.values(e.movement).some(v => v) || e.movement.rest
    ).length;
    
    return {
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null,
      alignedCount: aligned,
      movementDays: movementDays,
      totalDays: entries.length
    };
  }, [entries]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <article className="card">
        <header className="card-header">
          <div className="card-title">
            <span className="icon">📊</span>
            <span>Weekly Review</span>
          </div>
          <div>
            {saving && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Saving...</span>}
            {lastSaved && !saving && (
              <span style={{ fontSize: '11px', color: 'var(--accent)' }}>Saved ✓</span>
            )}
          </div>
        </header>
        <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', fontSize: '13px' }}>
            {stats.avgScore !== null && (
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Avg Score</div>
                <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{stats.avgScore}/10</div>
              </div>
            )}
            <div>
              <div style={{ color: 'var(--text-muted)' }}>Days Trained</div>
              <div style={{ fontWeight: 700 }}>{stats.movementDays}/{stats.totalDays}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>Aligned</div>
              <div style={{ fontWeight: 700 }}>{stats.alignedCount}/{stats.totalDays}</div>
            </div>
          </div>
        </div>
        <div className="field">
          <label>Weekly Theme</label>
          <input
            type="text"
            value={review.theme}
            onChange={(e) => setReview({ ...review, theme: e.target.value })}
            placeholder="What was this week about?"
          />
        </div>
        <div className="field">
          <label>What Worked</label>
          {review.worked.map((item, index) => (
            <input
              key={index}
              type="text"
              value={item}
              onChange={(e) => {
                const newWorked = [...review.worked];
                newWorked[index] = e.target.value;
                setReview({ ...review, worked: newWorked });
              }}
              placeholder={`What worked ${index + 1}`}
              style={{ marginBottom: '8px' }}
            />
          ))}
          <button
            className="btn btn-ghost"
            onClick={() => setReview({ ...review, worked: [...review.worked, ''] })}
            style={{ marginTop: '8px' }}
          >
            + Add
          </button>
        </div>
        <div className="field">
          <label>What Didn't</label>
          {review.didnt.map((item, index) => (
            <input
              key={index}
              type="text"
              value={item}
              onChange={(e) => {
                const newDidnt = [...review.didnt];
                newDidnt[index] = e.target.value;
                setReview({ ...review, didnt: newDidnt });
              }}
              placeholder={`What didn't ${index + 1}`}
              style={{ marginBottom: '8px' }}
            />
          ))}
          <button
            className="btn btn-ghost"
            onClick={() => setReview({ ...review, didnt: [...review.didnt, ''] })}
            style={{ marginTop: '8px' }}
          >
            + Add
          </button>
        </div>
        <div className="field">
          <label>One Thing to Stop</label>
          <input
            type="text"
            value={review.stop}
            onChange={(e) => setReview({ ...review, stop: e.target.value })}
            placeholder="What should you stop doing?"
          />
        </div>
        <div className="field">
          <label>One Thing to Double Down On</label>
          <input
            type="text"
            value={review.doubleDown}
            onChange={(e) => setReview({ ...review, doubleDown: e.target.value })}
            placeholder="What should you do more of?"
          />
        </div>
        <div className="field">
          <label>Week Score (1-10)</label>
          <input
            type="number"
            min="1"
            max="10"
            value={review.score || ''}
            onChange={(e) => setReview({ ...review, score: e.target.value ? Number(e.target.value) : null })}
            placeholder="1-10"
          />
        </div>
      </article>
    </div>
  );
}

function MonthlyReviewPage() {
  const [review, setReview] = useState(() => {
    const monthISO = getMonthISO(getTodayISO());
    const reviews = getMonthlyReviews();
    const existing = reviews.find(r => r.monthISO === monthISO);
    return existing || {
      monthISO: monthISO,
      wins: [''],
      lessons: [''],
      capitalAllocationOk: null,
      courseCorrection: '',
      score: null
    };
  });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    setSaving(true);
    const timer = setTimeout(() => {
      if (upsertMonthlyReview(review)) {
        setLastSaved(new Date());
        setSaving(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [review]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <article className="card">
        <header className="card-header">
          <div className="card-title">
            <span className="icon">🗓️</span>
            <span>Monthly Review</span>
          </div>
          <div>
            {saving && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Saving...</span>}
            {lastSaved && !saving && (
              <span style={{ fontSize: '11px', color: 'var(--accent)' }}>Saved ✓</span>
            )}
          </div>
        </header>
        <div className="field">
          <label>Wins</label>
          {review.wins.map((win, index) => (
            <input
              key={index}
              type="text"
              value={win}
              onChange={(e) => {
                const newWins = [...review.wins];
                newWins[index] = e.target.value;
                setReview({ ...review, wins: newWins });
              }}
              placeholder={`Win ${index + 1}`}
              style={{ marginBottom: '8px' }}
            />
          ))}
          <button
            className="btn btn-ghost"
            onClick={() => setReview({ ...review, wins: [...review.wins, ''] })}
            style={{ marginTop: '8px' }}
          >
            + Add Win
          </button>
        </div>
        <div className="field">
          <label>Lessons</label>
          {review.lessons.map((lesson, index) => (
            <input
              key={index}
              type="text"
              value={lesson}
              onChange={(e) => {
                const newLessons = [...review.lessons];
                newLessons[index] = e.target.value;
                setReview({ ...review, lessons: newLessons });
              }}
              placeholder={`Lesson ${index + 1}`}
              style={{ marginBottom: '8px' }}
            />
          ))}
          <button
            className="btn btn-ghost"
            onClick={() => setReview({ ...review, lessons: [...review.lessons, ''] })}
            style={{ marginTop: '8px' }}
          >
            + Add Lesson
          </button>
        </div>
        <div className="field">
          <label>Capital Allocation Check</label>
          <select
            value={review.capitalAllocationOk === null ? '' : review.capitalAllocationOk ? 'yes' : 'no'}
            onChange={(e) => setReview({ ...review, capitalAllocationOk: e.target.value === '' ? null : e.target.value === 'yes' })}
          >
            <option value="">—</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div className="field">
          <label>Course Correction</label>
          <textarea
            value={review.courseCorrection}
            onChange={(e) => setReview({ ...review, courseCorrection: e.target.value })}
            placeholder="What needs to change?"
            rows={3}
          />
        </div>
        <div className="field">
          <label>Month Score (optional)</label>
          <input
            type="number"
            min="1"
            max="10"
            value={review.score || ''}
            onChange={(e) => setReview({ ...review, score: e.target.value ? Number(e.target.value) : null })}
            placeholder="1-10"
          />
        </div>
      </article>
    </div>
  );
}

function SettingsPage() {
  const [lastBackup, setLastBackup] = useState(() => {
    const backup = localStorage.getItem('conquer_last_backup');
    return backup ? new Date(backup).toLocaleDateString() : 'Never';
  });

  function handleExport() {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `conquer-journal-export-${new Date().toISOString().split('T')[0]}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    const backupKey = `conquer_last_backup_${getUserId()}`;
    localStorage.setItem(backupKey, new Date().toISOString());
    setLastBackup(new Date().toLocaleDateString());
  }

  function handleExportCSV() {
    const entries = listEntries();
    const headers = ['Date', 'Gratitude 1', 'Gratitude 2', 'Gratitude 3', 'Energy', 'Day Score', 'Aligned', 'Decisive Move', 'Identity Statement'];
    const rows = entries.map(entry => [
      entry.dateISO,
      entry.gratitudes[0] || '',
      entry.gratitudes[1] || '',
      entry.gratitudes[2] || '',
      entry.energy || '',
      entry.dayScore || '',
      entry.aligned !== null ? (entry.aligned ? 'Yes' : 'No') : '',
      entry.decisiveMove || '',
      entry.identityStatement || ''
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `conquer-journal-export-${new Date().toISOString().split('T')[0]}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (importData(data)) {
          alert('Data imported successfully! Please refresh the page.');
          window.location.reload();
        } else {
          alert('Error importing data. Please check the file format.');
        }
      } catch (error) {
        alert('Error reading file. Please make sure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <article className="card">
        <header className="card-header">
          <div className="card-title">
            <span className="icon">⚙️</span>
            <span>Settings</span>
          </div>
        </header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>Export / Backup</h3>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Last backup: {lastBackup}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={handleExport}>
                📥 Export JSON
              </button>
              <button className="btn btn-ghost" onClick={handleExportCSV}>
                📊 Export CSV
              </button>
            </div>
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>Import</h3>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Restore from a previously exported JSON file.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              id="import-input"
              style={{ display: 'none' }}
            />
            <label htmlFor="import-input" className="btn btn-ghost">
              📤 Import JSON
            </label>
          </div>
        </div>
      </article>
    </div>
  );
}

