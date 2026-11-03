import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Clock, Check, Plus } from 'lucide-react';
import { createTask, type TaskCreate } from '../api/tasks';

interface NewTaskModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const priorityOptions = ['low', 'medium', 'high'] as const;

function getInitialState() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateVal = `${year}-${month}-${day}`;
  let h = now.getHours();
  const ampmVal: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hourVal = String(h);
  const minuteVal = String(now.getMinutes()).padStart(2, '0');

  return { dateVal, hourVal, minuteVal, ampmVal };
}

export default function NewTaskModal({ onClose, onCreated }: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const init = getInitialState();
  const [dateVal, setDateVal] = useState(init.dateVal);
  const [hourVal, setHourVal] = useState(init.hourVal);
  const [minuteVal, setMinuteVal] = useState(init.minuteVal);
  const [ampmVal, setAmpmVal] = useState<'AM' | 'PM'>(init.ampmVal);

  const computeIsoString = (dStr: string, hStr: string, mStr: string, period: 'AM' | 'PM') => {
    let h = Number(hStr);
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const hh = String(h).padStart(2, '0');
    const mm = String(mStr).padStart(2, '0');
    return `${dStr}T${hh}:${mm}`;
  };

  const [dueDate, setDueDate] = useState(() => computeIsoString(init.dateVal, init.hourVal, init.minuteVal, init.ampmVal));
  const [isTimeSet, setIsTimeSet] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleSetTime() {
    const iso = computeIsoString(dateVal, hourVal, minuteVal, ampmVal);
    setDueDate(iso);
    setIsTimeSet(true);
  }

  function applyPreset(preset: 'now' | 'today5pm' | 'tomorrow9am') {
    const now = new Date();
    if (preset === 'now') {
      const dStr = now.toISOString().slice(0, 10);
      let h = now.getHours();
      const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
      h = h % 12; if (h === 0) h = 12;
      const mStr = String(now.getMinutes()).padStart(2, '0');
      setDateVal(dStr); setHourVal(String(h)); setMinuteVal(mStr); setAmpmVal(period);
      setDueDate(computeIsoString(dStr, String(h), mStr, period));
    } else if (preset === 'today5pm') {
      const dStr = now.toISOString().slice(0, 10);
      setDateVal(dStr); setHourVal('5'); setMinuteVal('00'); setAmpmVal('PM');
      setDueDate(`${dStr}T17:00`);
    } else if (preset === 'tomorrow9am') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dStr = tomorrow.toISOString().slice(0, 10);
      setDateVal(dStr); setHourVal('9'); setMinuteVal('00'); setAmpmVal('AM');
      setDueDate(`${dStr}T09:00`);
    }
    setIsTimeSet(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError('');
    try {
      const localDueDate = dueDate ? (dueDate.length === 16 ? `${dueDate}:00` : dueDate) : undefined;
      const data: TaskCreate = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: localDueDate,
      };
      await createTask(data);
      onCreated();
      onClose();
    } catch {
      setError('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    padding: '10px 12px',
    color: 'white',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const presetStyle: React.CSSProperties = {
    padding: '3px 8px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '11px',
    cursor: 'none',
    transition: 'all 0.15s',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel"
          style={{
            width: '100%', maxWidth: '480px',
            maxHeight: '88vh',
            overflowY: 'auto',
            padding: '24px', position: 'relative',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', color: 'rgba(255,255,255,0.6)',
              width: '30px', height: '30px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'none',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <X size={16} />
          </button>

          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
            New Task
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '16px' }}>
            Fill in the details to add a new task.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', display: 'block', fontWeight: 500 }}>
                TITLE *
              </label>
              <input
                style={inputStyle}
                placeholder="What needs to be done?"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(59,130,246,0.6)'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', display: 'block', fontWeight: 500 }}>
                DESCRIPTION
              </label>
              <textarea
                style={{ ...inputStyle, minHeight: '55px', resize: 'vertical' }}
                placeholder="Add more context (optional)..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(59,130,246,0.6)'}
                onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', display: 'block', fontWeight: 500 }}>
                PRIORITY
              </label>
              <select
                style={{ ...inputStyle, cursor: 'none' }}
                value={priority}
                onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                onFocus={e => (e.target as HTMLSelectElement).style.borderColor = 'rgba(59,130,246,0.6)'}
                onBlur={e => (e.target as HTMLSelectElement).style.borderColor = 'rgba(255,255,255,0.12)'}
              >
                {priorityOptions.map(p => (
                  <option key={p} value={p} style={{ background: '#0f0f0f' }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date & Time Picker Section with AM / PM Toggle */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} style={{ color: '#38bdf8' }} /> DUE DATE & TIME (WITH AM / PM)
              </label>

              {/* Date Input */}
              <div>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '3px', fontWeight: 500 }}>DATE</label>
                <input
                  type="date"
                  style={{ ...inputStyle, colorScheme: 'dark', padding: '8px 10px' }}
                  value={dateVal}
                  onChange={e => { setDateVal(e.target.value); setIsTimeSet(false); }}
                />
              </div>

              {/* 12-Hour Time & AM/PM Selector */}
              <div>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '3px', fontWeight: 500 }}>TIME & AM / PM</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '6px', alignItems: 'center' }}>
                  {/* Hour */}
                  <select
                    value={hourVal}
                    onChange={e => { setHourVal(e.target.value); setIsTimeSet(false); }}
                    style={{ ...inputStyle, padding: '8px 10px', cursor: 'none' }}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                      <option key={h} value={String(h)} style={{ background: '#0f0f0f' }}>
                        Hour: {String(h).padStart(2, '0')}
                      </option>
                    ))}
                  </select>

                  {/* Minute */}
                  <select
                    value={minuteVal}
                    onChange={e => { setMinuteVal(e.target.value); setIsTimeSet(false); }}
                    style={{ ...inputStyle, padding: '8px 10px', cursor: 'none' }}
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map(m => (
                      <option key={m} value={String(m).padStart(2, '0')} style={{ background: '#0f0f0f' }}>
                        Min: {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>

                  {/* AM / PM Toggle Buttons */}
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <button
                      type="button"
                      onClick={() => { setAmpmVal('AM'); setIsTimeSet(false); }}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', border: 'none',
                        fontSize: '12px', fontWeight: 700, cursor: 'none',
                        background: ampmVal === 'AM' ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'transparent',
                        color: ampmVal === 'AM' ? 'white' : 'rgba(255,255,255,0.5)',
                        transition: 'all 0.2s',
                        boxShadow: ampmVal === 'AM' ? '0 2px 8px rgba(59,130,246,0.4)' : 'none',
                      }}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAmpmVal('PM'); setIsTimeSet(false); }}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', border: 'none',
                        fontSize: '12px', fontWeight: 700, cursor: 'none',
                        background: ampmVal === 'PM' ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'transparent',
                        color: ampmVal === 'PM' ? 'white' : 'rgba(255,255,255,0.5)',
                        transition: 'all 0.2s',
                        boxShadow: ampmVal === 'PM' ? '0 2px 8px rgba(59,130,246,0.4)' : 'none',
                      }}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>

              {/* Explicit Set Time Button */}
              <button
                type="button"
                onClick={handleSetTime}
                style={{
                  width: '100%', padding: '9px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                  border: 'none', color: 'white', fontSize: '12px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  cursor: 'none', transition: 'all 0.2s', marginTop: '2px',
                  boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                }}
              >
                <Check size={14} /> Confirm Date & Time ({hourVal}:{minuteVal} {ampmVal})
              </button>

              {/* Status Confirmation Pill */}
              {dueDate && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 10px', borderRadius: '8px',
                  background: isTimeSet ? 'rgba(6,182,212,0.14)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isTimeSet ? 'rgba(6,182,212,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  color: isTimeSet ? '#38bdf8' : 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 500,
                }}>
                  <span>✓ Set to: {new Date(dueDate).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                  <button
                    type="button"
                    onClick={() => { setDueDate(''); setIsTimeSet(false); }}
                    style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '10px', cursor: 'none', padding: '2px 4px', fontWeight: 600 }}
                  >Clear</button>
                </div>
              )}

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>Quick:</span>
                <button type="button" onClick={() => applyPreset('now')} style={{ ...presetStyle, color: '#38bdf8', borderColor: 'rgba(6,182,212,0.3)' }}>⚡ Right Now</button>
                <button type="button" onClick={() => applyPreset('today5pm')} style={presetStyle}>Today 5:00 PM</button>
                <button type="button" onClick={() => applyPreset('tomorrow9am')} style={presetStyle}>Tomorrow 9:00 AM</button>
              </div>
            </div>

            {error && (
              <p style={{ color: '#f87171', fontSize: '12px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', padding: '8px 12px', margin: 0 }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 500,
                  cursor: 'none', transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2, padding: '10px', borderRadius: '10px',
                  background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  border: 'none', color: 'white', fontSize: '13px', fontWeight: 600,
                  cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'opacity 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
              >
                {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : <><Plus size={14} /> Create Task</>}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
