import React, { useState } from 'react';
import api, { setAuthToken } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState('email'); // 'email' or 'enroll'
  const [form, setForm] = useState({ email: '', password: '', enrollment: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      let res;
      if (mode === 'email') {
        res = await api.post('/auth/login', { email: form.email, password: form.password });
      } else {
        // enrollment login
        res = await api.post('/auth/login-enroll', { enrollment: form.enrollment, password: form.password });
      }

      const token = res.data.token;
      setAuthToken(token);

      const role = res.data.user?.role || 'student';
      if (role === 'teacher') nav('/teacher/dashboard');
else nav('/student/dashboard');

    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ padding:20, maxWidth:600 }}>
      <h2>Login</h2>

      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setMode('email')} disabled={mode === 'email'}>Email Login</button>
        <button onClick={() => setMode('enroll')} disabled={mode === 'enroll'} style={{ marginLeft:8 }}>Enrollment Login</button>
      </div>

      <form onSubmit={submit}>
        {mode === 'email' ? (
          <>
            <div><input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required type="email" /></div>
          </>
        ) : (
          <>
            <div><input placeholder="Enrollment number" value={form.enrollment} onChange={e=>setForm({...form,enrollment:e.target.value})} required /></div>
          </>
        )}

        <div style={{ marginTop:8 }}>
          <input placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required type="password" />
        </div>

        <div style={{ marginTop:12 }}>
          <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          <button type="button" onClick={() => nav(-1)} style={{ marginLeft:8 }}>Back</button>
        </div>

        {error && <div style={{ color:'red', marginTop:8 }}>{error}</div>}
      </form>

      <div style={{ marginTop: 12 }}>
        <small>Students: use Enrollment Login if your teacher created your account.</small>
      </div>
    </div>
  );
}
