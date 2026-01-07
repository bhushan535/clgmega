import React, { useState } from "react";
import api from "../services/api";

export default function EditQuestionForm({ question, onCancel, onSaved }) {
  const [stem, setStem] = useState(question.stem);
  const [options, setOptions] = useState(
    question.options.map(o => o.text)
  );
  const [correct, setCorrect] = useState(question.correct[0]);
  const [saving, setSaving] = useState(false);

  function updateOption(index, value) {
    const copy = [...options];
    copy[index] = value;
    setOptions(copy);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        stem,
        options: options.map((text, i) => ({
          id: String.fromCharCode(65 + i), // A,B,C,D
          text
        })),
        correct: [correct]
      };

      await api.put(`/questions/${question._id}`, payload);
      onSaved();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <textarea
        value={stem}
        onChange={e => setStem(e.target.value)}
        rows={3}
        style={{ width: "100%" }}
      />

      {options.map((opt, i) => (
        <div key={i}>
          <input
            value={opt}
            onChange={e => updateOption(i, e.target.value)}
            placeholder={`Option ${String.fromCharCode(65 + i)}`}
          />
        </div>
      ))}

      <div style={{ marginTop: 8 }}>
        Correct:
        <select value={correct} onChange={e => setCorrect(e.target.value)}>
          {options.map((_, i) => {
            const key = String.fromCharCode(65 + i);
            return (
              <option key={key} value={key}>
                {key}
              </option>
            );
          })}
        </select>
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={onCancel} style={{ marginLeft: 6 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
