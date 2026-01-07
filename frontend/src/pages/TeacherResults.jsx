import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function TeacherResults() {
  const [examId, setExamId] = useState('');
  const [results, setResults] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadResults() {
    if (!examId) return alert('Enter examId');
    setLoading(true);
    try {
      const res = await api.get(`/teacher/exams/${examId}/results`);
      setExam(res.data.exam);
      setResults(res.data.results || []);
    } catch (err) {
      console.error('loadResults', err);
      alert(err?.response?.data?.error || 'Failed to load results');
    } finally { setLoading(false); }
  }

  function downloadCsv() {
    if (!examId) return alert('Enter examId');
    // open export endpoint in new window (with auth header sent by browser automatically if same origin)
    window.open(`${import.meta.env.VITE_API_URL}/teacher/exams/${examId}/results/export`, '_blank');
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Exam Results & Reports</h2>
      <div style={{ marginBottom: 12 }}>
        <input placeholder="Exam ID" value={examId} onChange={e=>setExamId(e.target.value)} />
        <button onClick={loadResults} style={{ marginLeft: 8 }}>{loading ? 'Loading...' : 'Load'}</button>
        <button onClick={downloadCsv} style={{ marginLeft: 8 }}>Download CSV</button>
      </div>

      {exam && <div style={{ marginBottom: 12 }}><strong>Exam:</strong> {exam.title} (ID: {exam.id})</div>}

      <div>
        {results.length === 0 ? <div>No results</div> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding:6 }}>Student</th>
                <th style={{ border: '1px solid #ddd', padding:6 }}>Email</th>
                <th style={{ border: '1px solid #ddd', padding:6 }}>Score</th>
                <th style={{ border: '1px solid #ddd', padding:6 }}>Flags</th>
                <th style={{ border: '1px solid #ddd', padding:6 }}>Last Flag</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.sessionId}>
                  <td style={{ border: '1px solid #ddd', padding:6 }}>{r.name} ({r.studentId})</td>
                  <td style={{ border: '1px solid #ddd', padding:6 }}>{r.email || '-'}</td>
                  <td style={{ border: '1px solid #ddd', padding:6 }}>{r.score}</td>
                  <td style={{ border: '1px solid #ddd', padding:6 }}>{r.flagsCount}</td>
                  <td style={{ border: '1px solid #ddd', padding:6 }}>{r.lastFlagTime ? new Date(r.lastFlagTime).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
