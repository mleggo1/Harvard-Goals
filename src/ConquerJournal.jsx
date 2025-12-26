import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const CONQUER_STORAGE_KEY = "conquer_journal_v1";
const CONQUER_WEEKLY_STORAGE_KEY = "conquer_weekly_reviews_v1";
const CONQUER_MONTHLY_STORAGE_KEY = "conquer_monthly_reviews_v1";

// Storage utilities
function getEntry(dateISO) {
  try {
    const raw = localStorage.getItem(CONQUER_STORAGE_KEY);
    if (!raw) return null;
    const entries = JSON.parse(raw);
    return entries[dateISO] || null;
  } catch {
    return null;
  }
}

function upsertEntry(entry) {
  try {
    const raw = localStorage.getItem(CONQUER_STORAGE_KEY);
    const entries = raw ? JSON.parse(raw) : {};
    entries[entry.id] = {
      ...entry,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(CONQUER_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

function listEntries() {
  try {
    const raw = localStorage.getItem(CONQUER_STORAGE_KEY);
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

function importData(data) {
  try {
    if (data.entries && Array.isArray(data.entries)) {
      const entriesObj = {};
      data.entries.forEach(entry => {
        entriesObj[entry.id] = entry;
      });
      localStorage.setItem(CONQUER_STORAGE_KEY, JSON.stringify(entriesObj));
    }
    if (data.weeklyReviews && Array.isArray(data.weeklyReviews)) {
      localStorage.setItem(CONQUER_WEEKLY_STORAGE_KEY, JSON.stringify(data.weeklyReviews));
    }
    if (data.monthlyReviews && Array.isArray(data.monthlyReviews)) {
      localStorage.setItem(CONQUER_MONTHLY_STORAGE_KEY, JSON.stringify(data.monthlyReviews));
    }
    return true;
  } catch {
    return false;
  }
}

function getWeeklyReviews() {
  try {
    const raw = localStorage.getItem(CONQUER_WEEKLY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function upsertWeeklyReview(review) {
  try {
    const reviews = getWeeklyReviews();
    const index = reviews.findIndex(r => r.weekStartISO === review.weekStartISO);
    if (index >= 0) {
      reviews[index] = { ...review, updatedAt: new Date().toISOString() };
    } else {
      reviews.push({ ...review, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(CONQUER_WEEKLY_STORAGE_KEY, JSON.stringify(reviews));
    return true;
  } catch {
    return false;
  }
}

function getMonthlyReviews() {
  try {
    const raw = localStorage.getItem(CONQUER_MONTHLY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function upsertMonthlyReview(review) {
  try {
    const reviews = getMonthlyReviews();
    const index = reviews.findIndex(r => r.monthISO === review.monthISO);
    if (index >= 0) {
      reviews[index] = { ...review, updatedAt: new Date().toISOString() };
    } else {
      reviews.push({ ...review, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(CONQUER_MONTHLY_STORAGE_KEY, JSON.stringify(reviews));
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

export default function ConquerJournal({ onBack, theme = 'night', goals = [] }) {
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

  // Autosave with debouncing
  useEffect(() => {
    if (!entry) return;
    
    setSaving(true);
    const timer = setTimeout(() => {
      if (upsertEntry(entry)) {
        setLastSaved(new Date());
        setSaving(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [entry]);

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
              <button className="btn btn-ghost" onClick={onBack} title="Back to Goals">
                ← Goals
              </button>
            </div>
            <div className="planner-owner-row" style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  className={`btn btn-ghost ${currentPage === 'today' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('today')}
                >
                  📅 Today
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
                  {saving && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Saving...</span>}
                  {lastSaved && !saving && (
                    <span style={{ fontSize: '11px', color: 'var(--accent)' }}>Saved ✓</span>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {progress.percentage}% complete
                  </span>
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
      </div>
    </div>
  );
}

function TodayPage({ entry, updateEntryField, updateGratitude, updateMovement, addListItem, updateListItem, removeListItem, duplicateFromYesterday, progress, isComplete, analytics, goals = [] }) {
  return (
    <div className="planner-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
      <section className="column">
        {/* Analytics Summary */}
        <article className="card highlight">
          <header className="card-header">
            <div className="card-title">
              <span className="icon">📊</span>
              <span>Your Momentum</span>
            </div>
          </header>
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
            <p>What are your top 3 goals right now?</p>
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
                      {goals.filter(g => !g.archived && g.status !== 'Completed').map(g => (
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
            <p>What must get done tomorrow? (max 3)</p>
          </header>
          <div className="field">
            {entry.actionsTomorrow.map((action, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={action}
                  onChange={(e) => updateListItem('actionsTomorrow', index, e.target.value)}
                  placeholder={`Non-negotiable ${index + 1}`}
                  style={{ flex: 1 }}
                />
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
            ))}
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
            <p>The one action that will move the needle today.</p>
          </header>
          <div className="field">
            <input
              type="text"
              value={entry.decisiveMove}
              onChange={(e) => updateEntryField('decisiveMove', e.target.value)}
              placeholder="What's the one decisive move?"
            />
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
              Weekly Focus
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
            <input
              type="text"
              value={entry.weeklyFocus?.oneThingToStop || ''}
              onChange={(e) => updateEntryField('weeklyFocus', {
                ...(entry.weeklyFocus || {}),
                oneThingToStop: e.target.value
              })}
              placeholder="What should you stop doing this week?"
            />
          </div>
          <div className="field" style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
              One Thing to Double Down On
            </label>
            <input
              type="text"
              value={entry.weeklyFocus?.oneThingToDoubleDown || ''}
              onChange={(e) => updateEntryField('weeklyFocus', {
                ...(entry.weeklyFocus || {}),
                oneThingToDoubleDown: e.target.value
              })}
              placeholder="What should you do more of this week?"
            />
          </div>
        </article>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button
            className="btn btn-ghost"
            onClick={duplicateFromYesterday}
          >
            📋 Copy Yesterday's Goals
          </button>
          {isComplete && (
            <button className="btn primary" style={{ flex: 1 }}>
              ✓ Day Complete
            </button>
          )}
        </div>
      </section>
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
    localStorage.setItem('conquer_last_backup', new Date().toISOString());
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

