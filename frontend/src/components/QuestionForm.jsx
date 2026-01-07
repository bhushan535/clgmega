import React, { useState } from 'react';
import api from '../services/api';

export default function QuestionForm({ examId, onAdded }) {
  const [stem, setStem] = useState('');
  const [opts, setOpts] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState('A');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null); // optional image
  const [marks, setMarks] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0);

  function setOpt(i, v) {
    const copy = [...opts];
    copy[i] = v;
    setOpts(copy);
  }

  async function submit(e) {
    e.preventDefault();
    if (!examId) return alert('Exam ID missing');
    if (!stem.trim()) return alert('Question text required');

    setLoading(true);
    setMessage('');

    try {
      const options = [
        { id: 'A', text: opts[0] },
        { id: 'B', text: opts[1] },
        { id: 'C', text: opts[2] },
        { id: 'D', text: opts[3] }
      ];

      // build multipart payload (so we can support optional image)
      const payload = new FormData();
      payload.append('type', 'mcq_single');
      payload.append('stem', stem);
      payload.append('options', JSON.stringify(options));
      payload.append('correct', JSON.stringify([correct])); // server expects array
      payload.append('marks', String(marks));
      payload.append('negativeMarks', String(negativeMarks));


      if (imageFile) {
        payload.append('image', imageFile, imageFile.name);
      }

      // axios will set proper Content-Type boundary when sending FormData; no need to force header
      const res = await api.post(`/exams/${examId}/questions`, payload);

      setMessage('Question added');
      setStem('');
      setOpts(['', '', '', '']);
      setCorrect('A');
      setImageFile(null);

      if (onAdded && typeof onAdded === 'function') onAdded(res.data.question);
    } catch (err) {
      console.error('addQuestion error', err);
      setMessage(err?.response?.data?.error || 'Add failed');
    } finally {
      setLoading(false);
    }

  }


  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
      <h4 style={{ marginTop: 0 }}>Add MCQ (4 options)</h4>
      <form onSubmit={submit}>
        <div>
          <textarea
            rows={3}
            placeholder="Question text"
            value={stem}
            onChange={e => setStem(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          <input placeholder="Option A" value={opts[0]} onChange={e => setOpt(0, e.target.value)} required />
          <input placeholder="Option B" value={opts[1]} onChange={e => setOpt(1, e.target.value)} required />
          <input placeholder="Option C" value={opts[2]} onChange={e => setOpt(2, e.target.value)} required />
          <input placeholder="Option D" value={opts[3]} onChange={e => setOpt(3, e.target.value)} required />
        </div>

        <div style={{ marginTop: 8 }}>
          <label>Correct: </label>
          <select value={correct} onChange={e => setCorrect(e.target.value)}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>

        <div style={{ marginTop: 8 }}>
          <label>Marks:</label>
          <input
            type="number"
            value={marks}
            onChange={e => setMarks(Number(e.target.value))}
            min={0}
          />
        </div>

        <div style={{ marginTop: 8 }}>
          <label>Negative Marks:</label>
          <input
            type="number"
            value={negativeMarks}
            onChange={e => setNegativeMarks(Number(e.target.value))}
            min={0}
          />
        </div>


        <div style={{ marginTop: 8 }}>
          <label>Optional image: </label>
          <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Question'}
          </button>
        </div>

        {message && <div style={{ marginTop: 8 }}>{message}</div>}
      </form>
    </div>
  );
}
