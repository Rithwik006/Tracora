import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { login, register } from '../api/auth';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
        setSuccess('Account created! Signing you in...');
        // Auto-login after register
        const tokens = await login(email, password);
        localStorage.setItem('token', tokens.access_token);
        setTimeout(() => navigate('/dashboard'), 600);
      } else {
        const tokens = await login(email, password);
        localStorage.setItem('token', tokens.access_token);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const detail = axiosErr?.response?.data?.detail;
      if (detail === 'Email already registered') {
        setError('That email is already registered. Try logging in.');
      } else if (detail === 'Incorrect email or password') {
        setError('Wrong email or password. Please try again.');
      } else {
        setError('Something went wrong. Is the backend running?');
      }
    } finally {
      setLoading(false);
    }
  }

  const inputWrap: React.CSSProperties = {
    position: 'relative', display: 'flex', alignItems: 'center',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px',
    padding: '13px 14px 13px 44px', color: 'white', fontSize: '14px',
    fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, background 0.2s',
  };
  const iconStyle: React.CSSProperties = {
    position: 'absolute', left: '14px', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '24px', position: 'relative', zIndex: 1,
      }}
    >
      {/* Glow accents */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '500px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '420px', padding: '40px 36px' }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '16px',
          }}>T</div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px' }}>Tracora</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={isRegister ? 'register' : 'login'}
            initial={{ opacity: 0, x: isRegister ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRegister ? -20 : 20 }}
            transition={{ duration: 0.2 }}
          >
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>
              {isRegister ? 'Create account' : 'Welcome back'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '28px' }}>
              {isRegister ? 'Start managing your tasks today.' : 'Sign in to continue to Tracora.'}
            </p>
          </motion.div>
        </AnimatePresence>


        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>EMAIL</label>
            <div style={inputWrap}>
              <Mail size={15} style={iconStyle} />
              <input
                id="email"
                type="email"
                style={inputStyle}
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(59,130,246,0.6)'; (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.07)'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.05)'; }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>PASSWORD</label>
            <div style={inputWrap}>
              <Lock size={15} style={iconStyle} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                style={{ ...inputStyle, paddingRight: '44px' }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(59,130,246,0.6)'; (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.07)'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.05)'; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: '14px', background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.3)', cursor: 'none', padding: 0,
                  display: 'flex', alignItems: 'center', transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ color: '#f87171', fontSize: '13px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '10px 14px', margin: 0 }}
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                style={{ color: '#34d399', fontSize: '13px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '10px', padding: '10px 14px', margin: 0 }}
              >
                {success}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            id="submit-btn"
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px', padding: '14px', borderRadius: '14px',
              background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              border: 'none', color: 'white', fontFamily: 'Outfit, sans-serif',
              fontSize: '15px', fontWeight: 700, cursor: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'opacity 0.2s, transform 0.15s',
              boxShadow: '0 4px 20px rgba(59,130,246,0.25)',
            }}
            onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.opacity = '0.88'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            {loading
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {isRegister ? 'Creating...' : 'Signing in...'}</>
              : isRegister ? 'Create Account' : 'Sign In'
            }
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          </span>
          <button
            onClick={() => { setIsRegister(v => !v); setError(''); setSuccess(''); }}
            style={{
              background: 'none', border: 'none', color: '#60a5fa',
              fontSize: '13px', fontWeight: 600, cursor: 'none',
              transition: 'color 0.2s', padding: 0,
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#93c5fd'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#60a5fa'}
          >
            {isRegister ? 'Sign in' : 'Register'}
          </button>
        </div>
      </motion.div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
