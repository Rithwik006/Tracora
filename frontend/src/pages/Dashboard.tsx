import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, Settings, LogOut,
  Plus, TrendingUp, Clock, Trash2, Loader2, AlertCircle,
  Search, Edit3, Shield, User as UserIcon, CheckCircle2,
  X, RefreshCw
} from 'lucide-react';
import { getTasks, updateTask, deleteTask, clearCompletedTasks, type Task } from '../api/tasks';

import { getMe, changePassword } from '../api/auth';
import NewTaskModal from '../components/NewTaskModal';
import EditTaskModal from '../components/EditTaskModal';

type ActiveTab = 'dashboard' | 'tasks' | 'settings';
type StatusFilter = 'all' | 'active' | 'completed' | 'overdue';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
type SortOption = 'newest' | 'oldest' | 'dueDate' | 'priority';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: [0.25, 1, 0.5, 1] as const },
  }),
  exit: { opacity: 0, transition: { duration: 0.2 } },
};


function parseLocalDateTime(dueStr?: string): Date | null {
  if (!dueStr) return null;
  const match = dueStr.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const [, year, month, day, hours, minutes, seconds] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds || 0)
    );
  }
  const d = new Date(dueStr);
  return isNaN(d.getTime()) ? null : d;
}

function formatDueDate(due?: string): string {
  if (!due) return 'No due date';
  const d = parseLocalDateTime(due);
  if (!d) return 'No due date';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((taskDay.getTime() - today.getTime()) / 86400000);
  
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  
  if (diff === 0) return `Today, ${timeStr}`;
  if (diff === 1) return `Tomorrow, ${timeStr}`;
  if (diff === -1) return `Yesterday, ${timeStr}`;
  if (diff < 0) return `${Math.abs(diff)}d overdue (${timeStr})`;
  if (diff < 7) return `${d.toLocaleDateString([], { weekday: 'short' })}, ${timeStr}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
}


function isOverdue(task: Task): boolean {
  if (!task.due_date || task.is_completed) return false;
  const dueDateObj = parseLocalDateTime(task.due_date);
  if (!dueDateObj) return false;
  
  // A task scheduled for e.g. 7:37 PM is valid until the end of that minute (7:37:59.999).
  // It only becomes overdue starting at 7:38:00 (after the scheduled minute has fully passed).
  const dueTimeEnd = dueDateObj.getTime() + 59999;
  return Date.now() > dueTimeEnd;
}


export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // Data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Modals state
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // User state
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<number | null>(null);

  // Action pending states
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // My Tasks Filters state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Settings state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [clearingTasks, setClearingTasks] = useState(false);

  // Auto clear toast after 4s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  async function fetchData() {
    setError('');
    try {
      const [taskList, me] = await Promise.all([getTasks(), getMe()]);
      setTasks(taskList);
      setUserEmail(me.email);
      setUserId(me.id);
    } catch {
      setError('Failed to load user data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  async function handleToggleTask(task: Task) {
    setTogglingId(task.id);
    try {
      const updated = await updateTask(task.id, { is_completed: !task.is_completed });
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      setToastMessage({
        type: 'success',
        msg: updated.is_completed ? `Marked "${task.title}" as completed` : `Marked "${task.title}" as active`
      });
    } catch {
      setToastMessage({ type: 'error', msg: 'Could not update task status.' });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDeleteTask(id: number, title: string) {
    setDeletingId(id);
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      setToastMessage({ type: 'success', msg: `Deleted "${title}"` });
    } catch {
      setToastMessage({ type: 'error', msg: 'Could not delete task.' });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleClearCompleted() {
    if (!window.confirm('Are you sure you want to delete all completed tasks?')) return;
    setClearingTasks(true);
    try {
      const res = await clearCompletedTasks();
      await fetchData();
      setToastMessage({ type: 'success', msg: res.message });
    } catch {
      setToastMessage({ type: 'error', msg: 'Failed to clear completed tasks.' });
    } finally {
      setClearingTasks(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError('New password must be at least 4 characters long.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      setPasswordSuccess(res.message || 'Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setPasswordError(axiosErr?.response?.data?.detail || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  // Derived Statistics
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.is_completed).length;
  const activeCount = totalCount - completedCount;
  const overdueCount = tasks.filter(isOverdue).length;


  const highPriorityCount = tasks.filter(t => t.priority?.toLowerCase() === 'high' && !t.is_completed).length;
  const mediumPriorityCount = tasks.filter(t => t.priority?.toLowerCase() === 'medium' && !t.is_completed).length;
  const lowPriorityCount = tasks.filter(t => t.priority?.toLowerCase() === 'low' && !t.is_completed).length;

  const firstName = userEmail.split('@')[0] ?? 'User';

  // Filtered & Sorted tasks for "My Tasks" view
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        // Status filter
        if (statusFilter === 'active') return !t.is_completed;
        if (statusFilter === 'completed') return t.is_completed;
        if (statusFilter === 'overdue') return isOverdue(t);
        return true;
      })
      .filter(t => {
        // Priority filter
        if (priorityFilter !== 'all') {
          return t.priority?.toLowerCase() === priorityFilter;
        }
        return true;
      })
      .filter(t => {
        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.id - a.id;
        if (sortBy === 'oldest') return a.id - b.id;
        if (sortBy === 'dueDate') {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (sortBy === 'priority') {
          const map: Record<string, number> = { high: 3, medium: 2, low: 1 };
          return (map[b.priority?.toLowerCase() || 'medium'] || 0) - (map[a.priority?.toLowerCase() || 'medium'] || 0);
        }
        return 0;
      });
  }, [tasks, statusFilter, priorityFilter, searchQuery, sortBy]);

  return (
    <>
      {showNewModal && (
        <NewTaskModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => { fetchData(); setToastMessage({ type: 'success', msg: 'New task created successfully!' }); }}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdated={() => { fetchData(); setToastMessage({ type: 'success', msg: 'Task updated successfully!' }); }}
        />
      )}

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -24, x: '-50%', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: -24, x: '-50%', scale: 0.95 }}
            style={{
              position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 22px', borderRadius: '50px',
              background: '#0f172a',
              border: `1.5px solid ${toastMessage.type === 'success' ? '#06b6d4' : '#f87171'}`,
              color: '#ffffff',
              fontSize: '14px', fontWeight: 600,
              boxShadow: '0 12px 36px rgba(0,0,0,0.85), 0 0 20px rgba(6,182,212,0.2)',
              pointerEvents: 'auto',
            }}
          >
            {toastMessage.type === 'success'
              ? <CheckCircle2 size={18} style={{ color: '#38bdf8' }} />
              : <AlertCircle size={18} style={{ color: '#f87171' }} />}
            <span>{toastMessage.msg}</span>
            <button
              onClick={() => setToastMessage(null)}
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: 'rgba(255,255,255,0.8)', marginLeft: '8px', cursor: 'none', fontSize: '13px', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >×</button>
          </motion.div>
        )}
      </AnimatePresence>


      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.3 } }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        style={{ minHeight: '100vh', display: 'flex', padding: '24px', gap: '20px' }}
      >
        {/* ── Sidebar ── */}
        <motion.aside
          custom={0} variants={fadeUp} initial="hidden" animate="show"
          className="glass-panel"
          style={{ width: '230px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px', flexShrink: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '15px', color: 'white'
            }}>T</div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '19px', letterSpacing: '-0.02em' }}>Tracora</span>
          </div>


          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <NavItem
              icon={<LayoutDashboard size={17} />}
              label="Dashboard"
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            />
            <NavItem
              icon={<CheckSquare size={17} />}
              label="My Tasks"
              badge={activeCount > 0 ? String(activeCount) : undefined}
              active={activeTab === 'tasks'}
              onClick={() => setActiveTab('tasks')}
            />
            <NavItem
              icon={<Settings size={17} />}
              label="Settings"
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
          </nav>

          {userEmail && (
            <div style={{
              padding: '10px 12px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '2px', fontWeight: 500 }}>Logged in as</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{userEmail}</div>
            </div>
          )}

          <button
            id="logout-btn"
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              color: 'rgba(255,255,255,0.45)', padding: '10px 12px', borderRadius: '12px',
              background: 'none', border: 'none', fontSize: '14px', fontWeight: 500,
              transition: 'color 0.2s, background 0.2s', width: '100%', cursor: 'none',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
          >
            <LogOut size={17} />
            Logout
          </button>
        </motion.aside>

        {/* ── Main Content Area ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {/* Header */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}
          >
            <div>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '28px', fontWeight: 700, margin: 0, textTransform: 'capitalize' }}>
                {activeTab === 'dashboard' && `Good ${getGreeting()}, ${firstName}`}
                {activeTab === 'tasks' && 'Task Management'}
                {activeTab === 'settings' && 'Account Settings'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: '4px', fontSize: '14px' }}>
                {activeTab === 'dashboard' && (totalCount === 0 ? "You have no tasks yet. Create one to get started!" : `You have ${activeCount} task${activeCount !== 1 ? 's' : ''} active today.`)}
                {activeTab === 'tasks' && `Filter, search, and manage your ${totalCount} task${totalCount !== 1 ? 's' : ''}.`}
                {activeTab === 'settings' && 'Manage your account profile, security credentials, and preferences.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => fetchData()}
                title="Refresh tasks"
                style={{
                  padding: '10px', borderRadius: '50px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)', cursor: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
              >
                <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>

              <GlowButton id="new-task-btn" onClick={() => setShowNewModal(true)}>
                <Plus size={16} /> New Task
              </GlowButton>
            </div>
          </motion.div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', borderRadius: '12px',
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                color: '#f87171', fontSize: '13px',
              }}
            >
              <AlertCircle size={15} />
              {error}
              <button
                onClick={() => setError('')}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f87171', cursor: 'none', fontSize: '16px', lineHeight: 1 }}
              >×</button>
            </motion.div>
          )}

          {/* ════════════════ VIEW 1: DASHBOARD OVERVIEW ════════════════ */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stat Cards */}
              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}
              >
                <StatCard
                  title="Total Tasks" value={String(totalCount)} icon={<CheckSquare size={18} />} color="#3b82f6"
                  onClick={() => { setActiveTab('tasks'); setStatusFilter('all'); }}
                />
                <StatCard
                  title="Due Tasks" value={String(activeCount)} icon={<Clock size={18} />} color="#38bdf8"
                  onClick={() => { setActiveTab('tasks'); setStatusFilter('active'); }}
                />
                <StatCard
                  title="Overdue Tasks" value={String(overdueCount)} icon={<AlertCircle size={18} />} color="#a855f7"
                  onClick={() => { setActiveTab('tasks'); setStatusFilter('overdue'); }}
                />
                <StatCard
                  title="Completed" value={String(completedCount)} icon={<TrendingUp size={18} />} color="#06b6d4"
                  onClick={() => { setActiveTab('tasks'); setStatusFilter('completed'); }}
                />

              </motion.div>

              {/* Priority Overview Row */}
              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
                className="glass-panel" style={{ padding: '20px' }}
              >
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginBottom: '14px' }}>Active Tasks Priority Breakdown</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                  <PriorityPill label="High Priority" count={highPriorityCount} color="#f87171" bg="rgba(248,113,113,0.12)" />
                  <PriorityPill label="Medium Priority" count={mediumPriorityCount} color="#fbbf24" bg="rgba(251,191,36,0.12)" />
                  <PriorityPill label="Low Priority" count={lowPriorityCount} color="#34d399" bg="rgba(52,211,153,0.12)" />
                </div>
              </motion.div>


              {/* Tasks List Panel */}
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show"
                className="glass-panel" style={{ flex: 1, padding: '24px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 600, margin: 0 }}>
                    Recent & Priority Tasks
                  </h2>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '13px', fontWeight: 600, cursor: 'none' }}
                  >
                    View All ({totalCount}) →
                  </button>
                </div>

                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', gap: '12px' }}>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Fetching your tasks...</span>
                  </div>
                ) : tasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 0', color: 'rgba(255,255,255,0.25)' }}>
                    <CheckSquare size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <p style={{ fontSize: '15px', fontWeight: 500 }}>No tasks yet</p>
                    <p style={{ fontSize: '13px', marginTop: '6px' }}>Click "+ New Task" to add your first task!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tasks.slice(0, 5).map(task => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={() => handleToggleTask(task)}
                        onEdit={() => setEditingTask(task)}
                        onDelete={() => handleDeleteTask(task.id, task.title)}
                        toggling={togglingId === task.id}
                        deleting={deletingId === task.id}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </>
          )}

          {/* ════════════════ VIEW 2: MY TASKS (FULL MANAGEMENT) ════════════════ */}
          {activeTab === 'tasks' && (
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
              className="glass-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {/* Controls Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Search Bar & Primary Filters */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Search Input */}
                  <div style={{ flex: 1, minWidth: '220px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} style={{ position: 'absolute', left: '14px', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px',
                        padding: '10px 36px 10px 40px', color: 'white', fontSize: '13px',
                        outline: 'none', transition: 'border-color 0.2s',
                      }}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(59,130,246,0.6)'}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.12)'}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'none' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Priority Select */}
                  <select
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value as PriorityFilter)}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '12px', padding: '10px 14px', color: 'rgba(255,255,255,0.8)',
                      fontSize: '13px', outline: 'none', cursor: 'none', minWidth: '130px',
                    }}
                  >
                    <option value="all" style={{ background: '#0f0f0f' }}>All Priorities</option>
                    <option value="high" style={{ background: '#0f0f0f' }}>High Priority</option>
                    <option value="medium" style={{ background: '#0f0f0f' }}>Medium Priority</option>
                    <option value="low" style={{ background: '#0f0f0f' }}>Low Priority</option>
                  </select>

                  {/* Sort By Select */}
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '12px', padding: '10px 14px', color: 'rgba(255,255,255,0.8)',
                      fontSize: '13px', outline: 'none', cursor: 'none', minWidth: '140px',
                    }}
                  >
                    <option value="newest" style={{ background: '#0f0f0f' }}>Sort: Newest First</option>
                    <option value="oldest" style={{ background: '#0f0f0f' }}>Sort: Oldest First</option>
                    <option value="dueDate" style={{ background: '#0f0f0f' }}>Sort: Due Date</option>
                    <option value="priority" style={{ background: '#0f0f0f' }}>Sort: Priority</option>
                  </select>
                </div>

                {/* Status Filter Tabs */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                  <FilterTab label="All Tasks" count={totalCount} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
                  <FilterTab label="Due Tasks" count={activeCount} active={statusFilter === 'active'} onClick={() => setStatusFilter('active')} />
                  <FilterTab label="Overdue" count={overdueCount} active={statusFilter === 'overdue'} onClick={() => setStatusFilter('overdue')} />
                  <FilterTab label="Completed" count={completedCount} active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} />
                </div>

              </div>

              {/* Tasks List */}
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', gap: '12px' }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Loading tasks...</span>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
                  <CheckSquare size={38} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p style={{ fontSize: '15px', fontWeight: 500 }}>No tasks found</p>
                  <p style={{ fontSize: '13px', marginTop: '4px', color: 'rgba(255,255,255,0.25)' }}>
                    {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? 'Try updating your search query or filter options.'
                      : 'You have no tasks right now. Create one above!'}
                  </p>
                  {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all') && (
                    <button
                      onClick={() => { setSearchQuery(''); setStatusFilter('all'); setPriorityFilter('all'); }}
                      style={{ marginTop: '14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', padding: '8px 16px', borderRadius: '50px', fontSize: '12px', cursor: 'none' }}
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredTasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={() => handleToggleTask(task)}
                      onEdit={() => setEditingTask(task)}
                      onDelete={() => handleDeleteTask(task.id, task.title)}
                      toggling={togglingId === task.id}
                      deleting={deletingId === task.id}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ════════════════ VIEW 3: SETTINGS ════════════════ */}
          {activeTab === 'settings' && (
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {/* Account Profile Box */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserIcon size={18} style={{ color: '#38bdf8' }} /> Account Details
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <SettingDetail label="Email Address" value={userEmail || '—'} />
                  <SettingDetail label="Account ID" value={userId ? `#${userId}` : '—'} />
                  <SettingDetail label="Account Status" value="Active User" color="#34d399" />
                </div>
              </div>

              {/* Password Security Box */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={18} style={{ color: '#a855f7' }} /> Security & Password
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px' }}>
                  Update your account password. Make sure to choose a secure password.
                </p>

                <form onSubmit={handleChangePassword} style={{ maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>OLD PASSWORD</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      style={settingsInputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>NEW PASSWORD</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={settingsInputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>CONFIRM NEW PASSWORD</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={settingsInputStyle}
                    />
                  </div>

                  {passwordError && (
                    <div style={{ color: '#f87171', fontSize: '13px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '10px 14px' }}>
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div style={{ color: '#34d399', fontSize: '13px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '10px', padding: '10px 14px' }}>
                      {passwordSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    style={{
                      padding: '12px 20px', borderRadius: '12px',
                      background: passwordLoading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                      border: 'none', color: 'white', fontWeight: 600, fontSize: '14px',
                      cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      marginTop: '6px', alignSelf: 'flex-start'
                    }}
                  >
                    {passwordLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Update Password'}
                  </button>
                </form>
              </div>

              {/* Data Cleanup Box */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 600, marginBottom: '6px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trash2 size={18} /> Task Management Cleanup
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '16px' }}>
                  Permanently remove all completed tasks from your account database.
                </p>
                <button
                  onClick={handleClearCompleted}
                  disabled={clearingTasks || completedCount === 0}
                  style={{
                    padding: '10px 18px', borderRadius: '12px',
                    background: completedCount === 0 ? 'rgba(248,113,113,0.1)' : 'rgba(248,113,113,0.18)',
                    border: '1px solid rgba(248,113,113,0.3)',
                    color: completedCount === 0 ? 'rgba(248,113,113,0.4)' : '#f87171',
                    fontSize: '13px', fontWeight: 600, cursor: 'none',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  {clearingTasks ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={15} />}
                  Clear All Completed Tasks ({completedCount})
                </button>
              </div>
            </motion.div>
          )}
        </main>
      </motion.div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const settingsInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px',
  padding: '11px 14px',
  color: 'white',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
};

/* ── Sub-components ── */

function NavItem({
  icon, label, badge, active = false, onClick,
}: {
  icon: React.ReactNode; label: string; badge?: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', borderRadius: '12px',
        fontSize: '14px', fontWeight: 500, width: '100%',
        color: active ? 'white' : 'rgba(255,255,255,0.45)',
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: active ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
        cursor: 'none', transition: 'all 0.2s', textAlign: 'left',
      }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'white'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icon}
        {label}
      </div>
      {badge && (
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '50px',
          background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)'
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ title, value, icon, color, onClick }: { title: string; value: string; icon: React.ReactNode; color: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="glass-panel"
      style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden', cursor: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${color}22`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '120px', height: '120px',
        background: `radial-gradient(circle at top right, ${color}22, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ color, marginBottom: '10px', opacity: 0.85 }}>{icon}</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>{title}</div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function PriorityPill({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  return (
    <div style={{ flex: 1, padding: '12px', borderRadius: '12px', background: bg, border: `1px solid ${color}33`, textAlign: 'center' }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontWeight: 500 }}>{label}</div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 700, color }}>{count}</div>
    </div>
  );
}

function FilterTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px', borderRadius: '50px', fontSize: '13px', fontWeight: 500,
        background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
        color: active ? 'white' : 'rgba(255,255,255,0.45)',
        cursor: 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
      }}
    >
      {label}
      <span style={{ fontSize: '11px', opacity: 0.6 }}>({count})</span>
    </button>
  );
}

function SettingDetail({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: color || 'white' }}>{value}</div>
    </div>
  );
}

function GlowButton({
  children, onClick, id,
}: {
  children: React.ReactNode; onClick: () => void; id?: string;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 20px', borderRadius: '50px',
        background: 'white', color: '#050505',
        fontWeight: 600, fontSize: '14px', border: 'none',
        cursor: 'none', transition: 'transform 0.2s, box-shadow 0.2s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(59,130,246,0.4)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
    >
      {children}
    </button>
  );
}

const priorityStyles: Record<string, React.CSSProperties> = {
  high:   { color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' },
  medium: { color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' },
  low:    { color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' },
};

function TaskRow({
  task, onToggle, onEdit, onDelete, toggling, deleting,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  toggling: boolean;
  deleting: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: deleting ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', borderRadius: '14px',
        border: '1px solid transparent',
        transition: 'background 0.15s, border-color 0.15s',
        opacity: deleting ? 0.5 : 1,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, cursor: 'none' }} onClick={onToggle}>
        {/* Checkbox toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          disabled={toggling}
          title={task.is_completed ? "Mark as active" : "Mark as completed"}
          style={{
            width: '22px', height: '22px', borderRadius: '7px', flexShrink: 0,
            border: task.is_completed ? 'none' : '1.5px solid rgba(255,255,255,0.3)',
            background: task.is_completed
              ? 'linear-gradient(135deg, #10b981, #06b6d4)'
              : 'rgba(255,255,255,0.03)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'none', transition: 'all 0.2s',
          }}
        >
          {toggling
            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', color: 'white' }} />
            : task.is_completed
            ? <span style={{ color: 'white', fontSize: '12px', fontWeight: 800, lineHeight: 1 }}>✓</span>
            : null
          }
        </button>

        <div style={{ minWidth: 0 }}>
          <span style={{
            fontSize: '14px', fontWeight: 500,
            color: task.is_completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.9)',
            textDecoration: task.is_completed ? 'line-through' : 'none',
            display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}>{task.title}</span>
          {task.description && (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', display: 'block', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.description}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '12px' }}>
        {/* Prominent Mark Complete Button */}
        <button
          onClick={onToggle}
          disabled={toggling}
          title={task.is_completed ? "Click to mark active" : "Click to mark completed"}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '5px 12px', borderRadius: '50px',
            fontSize: '12px', fontWeight: 600, cursor: 'none',
            background: task.is_completed ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${task.is_completed ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)'}`,
            color: task.is_completed ? '#34d399' : 'rgba(255,255,255,0.75)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            if (!task.is_completed) {
              (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.2)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.45)';
              (e.currentTarget as HTMLElement).style.color = '#34d399';
            }
          }}
          onMouseLeave={e => {
            if (!task.is_completed) {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)';
            }
          }}
        >
          {toggling
            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            : task.is_completed
            ? <>✓ Completed</>
            : <>✓ Mark Done</>
          }
        </button>

        <span style={{
          fontSize: '12px',
          color: isOverdue(task) ? '#f87171' : 'rgba(255,255,255,0.4)',
          fontWeight: isOverdue(task) ? 600 : 400,
        }}>
          {formatDueDate(task.due_date)}
        </span>

        <span style={{
          fontSize: '11px', padding: '3px 10px', borderRadius: '50px', fontWeight: 500,
          ...priorityStyles[task.priority?.toLowerCase() ?? 'medium'],
        }}>
          {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'}
        </span>

        {/* Edit button */}
        <button
          onClick={onEdit}
          title="Edit task"
          style={{
            background: 'none', border: 'none', padding: '4px',
            color: 'rgba(255,255,255,0.3)', cursor: 'none',
            display: 'flex', alignItems: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#38bdf8'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'}
        >
          <Edit3 size={14} />
        </button>

        {/* Delete button */}
        <button
          onClick={onDelete}
          disabled={deleting}
          title="Delete task"
          style={{
            background: 'none', border: 'none', padding: '4px',
            color: 'rgba(255,255,255,0.3)', cursor: 'none',
            display: 'flex', alignItems: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'}
        >
          {deleting
            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <Trash2 size={14} />
          }
        </button>
      </div>
    </motion.div>
  );
}

