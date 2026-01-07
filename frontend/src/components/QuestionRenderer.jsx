import React, { useState } from 'react';
import api from '../services/api';

export default function QuestionRenderer({ sessionId, question, onAnswered }) {
  const [selected, setSelected] = useState([]);
  const isMulti = question.type === 'mcq_multi';

  function toggleOption(optId) {
    if (isMulti) {
      if (selected.includes(optId)) setSelected(selected.filter(s => s !== optId));
      else setSelected([...selected, optId]);
    } else {
      setSelected([optId]);
    }
  }

  async function save() {
    try {
      await api.post(`/sessions/${sessionId}/answer`, { questionId: question._id, selected });
      onAnswered();
    } catch (err) {
      console.error('Save answer error', err);
      alert('Save failed');
    }
  }

  return (
    <div style={{ border:'1px solid #ddd', padding:12 }}>
      <h3>{question.stem}</h3>
      {question.imageUrl && <img src={api.defaults.baseURL + question.imageUrl} alt="qimg" style={{ maxWidth:400 }} />}
      <div style={{ marginTop:8 }}>
        {question.options.map(opt => (
          <div key={opt.id} style={{ marginBottom:6 }}>
            <label>
              <input
                type={isMulti ? 'checkbox' : 'radio'}
                name={'q_' + question._id}
                checked={selected.includes(opt.id)}
                onChange={() => toggleOption(opt.id)}
              />{' '}
              <strong>{opt.id}</strong>. {opt.text}
            </label>
          </div>
        ))}
      </div>
      <div style={{ marginTop:8 }}>
        <button onClick={save}>Save Answer</button>
      </div>
    </div>
  );
}
