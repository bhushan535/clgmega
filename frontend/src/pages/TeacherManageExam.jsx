import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import QuestionForm from "../components/QuestionForm";
import EditQuestionForm from "../components/EditQuestionFrom";
export default function TeacherManageExam() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [editingQ, setEditingQ] = useState(null);

  useEffect(() => {
    api.get("/teacher/classes")
      .then(res => setClasses(res.data.classes || []))
      .catch(console.error);
  }, []);
  async function assignExam() {
    try {
      setAssigning(true);
      const res = await api.post(`/exams/${examId}/assign`, {
        classIds: selectedClasses
      });
      setExam(res.data.exam);
      alert("Exam assigned");
    } catch (err) {
      console.error(err);
      alert("Assign failed");
    } finally {
      setAssigning(false);
    }
  }

  useEffect(() => {
    async function loadExam() {
      try {
        const res = await api.get(`/exams/${examId}?include=questions`);
        setExam(res.data.exam);
      } catch (err) {
        console.error(err);
        setError("Failed to load exam");
      } finally {
        setLoading(false);
      }
    }
    loadExam();
  }, [examId]);

  if (loading) return <div>Loading exam...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!exam) return <div>Exam not found</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Manage Exam</h2>

      <div style={{ marginBottom: 12 }}>
        <strong>{exam.title}</strong> <br />
        Status: {exam.status} <br />
        Duration: {exam.duration} min
      </div>

      <hr />

      <h3>Questions</h3>

      {exam.questions?.length === 0 && <div>No questions yet</div>}

      {
      exam.questions.map((q, idx) => (
        <div
          key={q._id}
          style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}
        >
          {editingQ === q._id ? (
            <EditQuestionForm
              question={q}
              onCancel={() => setEditingQ(null)}
              onSaved={async () => {
                const res = await api.get(`/exams/${examId}?include=questions`);
                setExam(res.data.exam);
                setEditingQ(null);
              }}
            />
          ) : (
            <>
              <div><b>Q{idx + 1}:</b> {q.stem}</div>
              
              <ul>
                {Array.isArray(q.options) &&
                  q.options.map(opt => (
                    <li key={opt.id}>
                      {opt.text}   {/* ✅ ONLY STRING */}
                    </li>
                  ))}
              </ul>

              <div>Correct: {q.correct.join(", ")}</div>

              <button onClick={() => setEditingQ(q._id)}>Edit</button>
              <button
                style={{ marginLeft: 8 }}
                onClick={async () => {
                  if (!confirm("Delete question?")) return;
                  await api.delete(`/questions/${q._id}`);
                  const res = await api.get(`/exams/${examId}?include=questions`);
                  setExam(res.data.exam);
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      ))}

      <hr />

      <h3>Assign Exam to Classes</h3>

      {classes.length === 0 && <div>No classes found</div>}

      {classes.map(c => (
        <div key={c._id}>
          <label>
            <input
              type="checkbox"
              checked={selectedClasses.includes(c._id)}
              onChange={() =>
                setSelectedClasses(prev =>
                  prev.includes(c._id)
                    ? prev.filter(id => id !== c._id)
                    : [...prev, c._id]
                )
              }
            />
            {c.name} ({c.code})
          </label>
        </div>
      ))}

      <button
        disabled={assigning || selectedClasses.length === 0}
        onClick={assignExam}
        style={{ marginTop: 10 }}
      >
        {assigning ? "Assigning..." : "Assign Exam"}
      </button>


      <hr />

      <h3>Add Question</h3>

      {/* IMPORTANT: pass examId */}
      <QuestionForm examId={examId} onAdded={() => {
        // reload exam after adding question
        setLoading(true);
        api.get(`/exams/${examId}?include=questions`)
          .then(res => setExam(res.data.exam))
          .finally(() => setLoading(false));
      }} />
      <hr />

      <button
        style={{ marginTop: 12, background: "red", color: "white" }}
        onClick={async () => {
          if (!window.confirm("Delete this exam permanently?")) return;
          await api.delete(`/exams/${examId}`);
          alert("Exam deleted");
          window.location.href = "/teacher/exams";
        }}
      >
        Delete Exam
      </button>

    </div>

  );
}
