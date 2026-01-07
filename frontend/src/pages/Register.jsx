import React, { useState } from 'react';
import api, { setAuthToken } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'teacher' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/register', form);
      const token = res.data.token;
      setAuthToken(token);
      // redirect based on role
      const role = res.data.user?.role;
      if (role === 'teacher') nav('/teacher/create');
      else nav('/student/exam');
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Register failed');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ padding:20, maxWidth:600 }}>
      <h2>Register</h2>
      <form onSubmit={submit}>
        <div><input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
        <div><input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required type="email"/></div>
        <div><input placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required type="password"/></div>

        <div style={{ marginTop:8 }}>
          <label>Role: </label>
          <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        <div style={{ marginTop:8 }}>
          <button type="submit" disabled={loading}>{loading? 'Registering...':'Register'}</button>
          <button type="button" onClick={()=> nav(-1)} style={{ marginLeft:8 }}>Back</button>
        </div>

        {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
      </form>
    </div>
  );
}
