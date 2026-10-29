import { useEffect, useState, useCallback } from 'react';
import { Code2, ExternalLink, RefreshCw, Edit3, Check, X, Award, Zap, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

function Ring({ value, max, color, label, count }) {
  const size = 76;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const safeCount = Number(count) || 0;
  const safeMax = Number(max) || 1;
  const pct = safeMax > 0 ? Math.min(safeCount / safeMax, 1) : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <p className="-mt-11 font-display text-sm font-semibold text-slate-100">{safeCount}</p>
      <p className="mt-8 text-[11px] text-slate-400 font-mono">{label}</p>
    </div>
  );
}

export default function LeetCodeTracker({ username: initialUsername, student, editable, onUpdated }) {
  const [username, setUsername] = useState(initialUsername || '');
  const [state, setState] = useState('idle'); // idle | loading | success | not_found | error | missing
  const [stats, setStats] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [inputHandle, setInputHandle] = useState(initialUsername || '');
  const [saveStatus, setSaveStatus] = useState('idle');

  // Syncing state
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | loading | success | error
  const [syncMessage, setSyncMessage] = useState('');

  const loadStats = useCallback(async (forceRefresh = false) => {
    const handle = (username || initialUsername || '').trim();
    if (!handle) {
      setState('missing');
      setStats(null);
      return;
    }

    setState('loading');
    setErrorMessage('');

    try {
      const url = `/api/leetcode/${encodeURIComponent(handle)}${forceRefresh ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 404) {
          setState('not_found');
          setErrorMessage(`LeetCode profile for "${handle}" was not found.`);
        } else {
          setState('error');
          setErrorMessage(data?.message || 'LeetCode API is temporarily unavailable.');
        }
        return;
      }

      if (data?.status === 'success' || data?.totalSolved !== undefined) {
        setStats(data);
        setState('success');
      } else {
        setState('not_found');
        setErrorMessage(data?.message || `No profile data for "${handle}"`);
      }
    } catch (err) {
      setState('error');
      setErrorMessage(err.message || 'Network error fetching LeetCode stats.');
    }
  }, [username, initialUsername]);

  useEffect(() => {
    setUsername(initialUsername || '');
    setInputHandle(initialUsername || '');
  }, [initialUsername]);

  useEffect(() => {
    loadStats(false);
  }, [loadStats]);

  async function handleSaveHandle(e) {
    e?.preventDefault();
    const cleanHandle = inputHandle.trim();
    if (!cleanHandle) return;

    setSaveStatus('loading');
    try {
      const studentId = student?.id;
      if (studentId) {
        const { error } = await supabase
          .from('students')
          .update({ leetcode_handle: cleanHandle })
          .eq('id', studentId);

        if (error) throw error;
      }

      setUsername(cleanHandle);
      setIsEditing(false);
      setSaveStatus('idle');
      if (onUpdated) onUpdated({ leetcode_handle: cleanHandle });
    } catch (err) {
      console.error('Error updating handle:', err);
      setSaveStatus('error');
    }
  }

  async function handleSyncProgress() {
    if (!student?.id || !username) return;
    setSyncStatus('loading');
    setSyncMessage('');

    try {
      const res = await fetch(`/api/students/${student.id}/sync-leetcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edufolio_token') || ''}`
        },
        body: JSON.stringify({ handle: username })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync');

      setStats(data.stats);
      setState('success');
      setSyncStatus('success');
      setSyncMessage(
        data.addedMilestones > 0
          ? `Verified! Added ${data.addedMilestones} new milestone achievement(s) and updated total points.`
          : 'Score updated! All real LeetCode milestones are in sync with Edufolio.'
      );

      if (onUpdated) onUpdated(data.student);
      setTimeout(() => setSyncStatus('idle'), 5000);
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncStatus('error');
      setSyncMessage(err.message || 'Could not sync real score.');
      setTimeout(() => setSyncStatus('idle'), 4000);
    }
  }

  return (
    <div className="matte-card border-l-[3.5px] border-l-sky-500 relative overflow-hidden rounded-2xl border border-slate-800/80 bg-[#121622] p-6 shadow-sm">
      <div className="relative mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Code2 size={16} />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-slate-100 tracking-wide flex items-center gap-1.5">
              <span>LeetCode Progress</span>
              <span className="text-[10px] text-sky-300 font-mono font-medium px-2 py-0.2 rounded bg-sky-500/10 border border-sky-500/20">
                LIVE
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {username && (
            <button
              type="button"
              onClick={() => loadStats(true)}
              disabled={state === 'loading'}
              title="Refresh real-time stats"
              className="flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/50 p-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 transition disabled:opacity-40"
            >
              <RefreshCw size={13} className={state === 'loading' ? 'animate-spin text-sky-400' : ''} />
            </button>
          )}

          {editable && !isEditing && (
            <button
              type="button"
              data-cursor-hover
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
              title="Edit or link your real LeetCode username"
            >
              <Edit3 size={11} className="text-sky-400" />
              <span>{username ? 'Change Handle' : 'Connect Account'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Editing LeetCode Handle */}
      {isEditing && (
        <form onSubmit={handleSaveHandle} className="mb-4 rounded-xl border border-slate-800 bg-[#161B26] p-3">
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Enter Real LeetCode Username
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputHandle}
              onChange={(e) => setInputHandle(e.target.value)}
              placeholder="e.g. striver_79, mehul9, JATIN__1"
              className="flex-1 rounded-lg border border-slate-700 bg-[#0B0F17] px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
            <button
              type="submit"
              disabled={saveStatus === 'loading'}
              className="flex items-center gap-1 rounded-lg bg-indigo-600/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30 transition"
            >
              <Check size={14} />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <X size={14} />
            </button>
          </div>
        </form>
      )}

      {/* Profile & Live Handle Link */}
      {username && !isEditing && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-800 bg-[#0B0F17] px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Handle:</span>
            <span className="font-mono font-semibold text-slate-100">@{username}</span>
          </div>
          <a
            href={`https://leetcode.com/${encodeURIComponent(username)}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:underline"
          >
            <span>View Profile</span>
            <ExternalLink size={11} />
          </a>
        </div>
      )}

      {state === 'missing' && !isEditing && (
        <div className="py-4 text-center">
          <p className="text-sm text-slate-400">No LeetCode handle linked to this profile yet.</p>
          {editable && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
            >
              <Zap size={14} /> Connect Real LeetCode Handle
            </button>
          )}
        </div>
      )}

      {state === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
          <RefreshCw size={16} className="animate-spin text-sky-400" />
          <span>Fetching real-time stats from LeetCode…</span>
        </div>
      )}

      {state === 'not_found' && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-400">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} />
            <span className="font-semibold">Profile Not Found</span>
          </div>
          <p>{errorMessage || `Couldn't find an active LeetCode profile for "${username}". Please verify the handle.`}</p>
        </div>
      )}

      {state === 'error' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300">
          <div className="flex items-center justify-between mb-2">
            <span>{errorMessage || 'LeetCode stats are temporarily unavailable.'}</span>
            <button
              type="button"
              onClick={() => loadStats(true)}
              className="rounded bg-amber-500/20 px-2 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/30 transition flex items-center gap-1"
            >
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        </div>
      )}

      {state === 'success' && stats && (
        <div className="relative">
          <div className="mb-5 grid grid-cols-3 gap-3">
            <Ring value={stats.easySolved} max={stats.totalEasy || 969} color="#10B981" label="Easy" count={stats.easySolved} />
            <Ring value={stats.mediumSolved} max={stats.totalMedium || 2124} color="#F59E0B" label="Medium" count={stats.mediumSolved} />
            <Ring value={stats.hardSolved} max={stats.totalHard || 980} color="#EF4444" label="Hard" count={stats.hardSolved} />
          </div>

          {/* Overall solved bar */}
          <div className="mb-4 rounded-xl bg-slate-900/60 p-3 border border-slate-800">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Overall Progress</span>
              <span className="font-mono font-medium text-slate-200">
                {stats.totalSolved} / {stats.totalQuestions || 4073} problems ({((stats.totalSolved / (stats.totalQuestions || 4073)) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-indigo-500 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(2, ((stats.totalSolved / (stats.totalQuestions || 4073)) * 100)))}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center border-t border-slate-800 pt-4">
            <div>
              <p className="font-display text-lg font-semibold text-slate-100">{stats.totalSolved}</p>
              <p className="text-[11px] text-slate-400 font-mono">Total Solved</p>
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-slate-100">
                {stats.ranking ? `#${stats.ranking.toLocaleString()}` : '—'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">Global Rank</p>
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-slate-100">
                {stats.reputation ? stats.reputation : (stats.acceptanceRate ? `${stats.acceptanceRate.toFixed(1)}%` : 'Active')}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">Reputation</p>
            </div>
          </div>

          {/* Sync Real Achievements Action */}
          {editable && (
            <div className="mt-5 border-t border-slate-800 pt-4">
              <button
                type="button"
                data-cursor-hover
                onClick={handleSyncProgress}
                disabled={syncStatus === 'loading'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800/90 border border-slate-700 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition disabled:opacity-50 shadow-sm"
              >
                <RefreshCw size={13} className={syncStatus === 'loading' ? 'animate-spin text-indigo-400' : 'text-slate-400'} />
                <span>{syncStatus === 'loading' ? 'Syncing Real Milestones…' : 'Sync Real Score & Achievements'}</span>
              </button>

              {syncMessage && (
                <p
                  className={`mt-2 text-center text-xs font-medium ${
                    syncStatus === 'error' ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {syncMessage}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
