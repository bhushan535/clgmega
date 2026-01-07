import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function TeacherAnalytics(){
  const [examId, setExamId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!examId) return alert('Enter examId');
    setLoading(true);
    try {
      const res = await api.get(`/teacher/exams/${examId}/analytics`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Failed to load analytics');
    } finally { setLoading(false); }
  }

  if (!data) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Exam Analytics</h2>
        <div>
          <input placeholder="Exam ID" value={examId} onChange={e=>setExamId(e.target.value)} />
          <button onClick={load} style={{ marginLeft: 8 }}>{loading ? 'Loading...':'Load'}</button>
        </div>
      </div>
    );
  }

  const { summary, scoreBuckets, flagsOverTime, topFlaggedStudents, exam } = data;
  const lineData = {
    labels: flagsOverTime.map(f => f.date),
    datasets: [{ label: 'Flags', data: flagsOverTime.map(f=>f.count), fill:false }]
  };
  const barData = {
    labels: scoreBuckets.map(b=>b.range),
    datasets: [{ label: 'Students', data: scoreBuckets.map(b=>b.count) }]
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Analytics — {exam?.title}</h2>
      <div style={{ display:'flex', gap: 16, marginBottom: 12 }}>
        <div style={{ padding:12, border:'1px solid #ddd' }}>
          <div>Students</div>
          <div style={{ fontSize:20 }}>{summary.totalStudents}</div>
        </div>
        <div style={{ padding:12, border:'1px solid #ddd' }}>
          <div>Average</div>
          <div style={{ fontSize:20 }}>{summary.avgScore.toFixed(2)}</div>
        </div>
        <div style={{ padding:12, border:'1px solid #ddd' }}>
          <div>Median</div>
          <div style={{ fontSize:20 }}>{summary.median}</div>
        </div>
        <div style={{ padding:12, border:'1px solid #ddd' }}>
          <div>Max</div>
          <div style={{ fontSize:20 }}>{summary.maxScore}</div>
        </div>
      </div>

      <div style={{ display:'flex', gap: 20 }}>
        <div style={{ flex:1 }}>
          <h4>Flags last 14 days</h4>
          <Line data={lineData} />
        </div>
        <div style={{ width:480 }}>
          <h4>Score distribution</h4>
          <Bar data={barData} />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h4>Top flagged students</h4>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr><th>Name</th><th>Email</th><th>Flags</th></tr></thead>
          <tbody>
            {topFlaggedStudents.map(s => (
              <tr key={s.studentId}>
                <td style={{ border:'1px solid #ddd', padding:6 }}>{s.name}</td>
                <td style={{ border:'1px solid #ddd', padding:6 }}>{s.email}</td>
                <td style={{ border:'1px solid #ddd', padding:6 }}>{s.flags}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
