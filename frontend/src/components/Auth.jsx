import { useState } from 'react';

// NOTE: This is demo-grade local auth only. Accounts are stored in the browser's
// localStorage on this device — there is no server, and passwords are NOT securely
// hashed. It exists so each person can keep their own saved medication list on
// their own device. It is not real security and must not be used to protect
// anything sensitive. A production version would use a real auth backend.

const USERS_KEY = 'medstack_users';
const SESSION_KEY = 'medstack_session';

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
}
function saveUsers(users) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch {}
}

export function loadSession() {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return loadUsers().find((u) => u.id === id) || null;
  } catch { return null; }
}
export function saveSession(userId) {
  try {
    if (userId) localStorage.setItem(SESSION_KEY, userId);
    else localStorage.removeItem(SESSION_KEY);
  } catch {}
}

function newId() {
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    setError('');
    const em = email.trim().toLowerCase();
    if (!em || !password) { setError('Enter your email and password.'); return; }
    const users = loadUsers();

    if (mode === 'signup') {
      if (!name.trim()) { setError('Enter your name.'); return; }
      if (users.some((u) => u.email === em)) { setError('An account with that email already exists.'); return; }
      const user = { id: newId(), name: name.trim(), email: em, password };
      saveUsers([...users, user]);
      saveSession(user.id);
      onAuthed(user);
    } else {
      const user = users.find((u) => u.email === em);
      if (!user || user.password !== password) { setError('Email or password is incorrect.'); return; }
      saveSession(user.id);
      onAuthed(user);
    }
  }

  return (
    <div className="app">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span className="brand__mark" style={{ fontSize: 34 }}>Med<em>Stack</em></span>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 8 }}>
            See how your medications interact.
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inp} />
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" style={inp} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} style={inp} />

          {error && <p style={{ color: 'var(--red-ink)', fontSize: 13, textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="btn-primary" style={{ marginTop: 4 }}>
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
          style={{ marginTop: 18, color: 'var(--teal)', fontSize: 13.5, fontWeight: 500, background: 'none' }}>
          {mode === 'signin' ? "New here? Create an account" : 'Already have an account? Sign in'}
        </button>

        <p style={{ color: 'var(--ink-faint)', fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 1.5 }}>
          Accounts are stored on this device only. MedStack is a prototype, not medical advice.
        </p>
      </div>
    </div>
  );
}

const inp = {
  width: '100%', padding: '13px 15px', fontSize: 15,
  border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)', color: 'var(--ink)', outline: 'none',
};
