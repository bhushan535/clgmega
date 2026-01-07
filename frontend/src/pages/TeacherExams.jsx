import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function TeacherExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/teacher/exams");
        setExams(res.data.exams || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>Loading exams...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>My Exams</h2>

      {exams.length === 0 && <div>No exams created yet</div>}

      {exams.map((exam) => (
        <div
          key={exam._id}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginBottom: 10
          }}
        >
          <div>
            <strong>{exam.title}</strong>
          </div>
          <div>Status: {exam.status}</div>
          <div>Duration: {exam.duration} min</div>

          <button
            style={{ marginTop: 8 }}
            onClick={() => nav(`/teacher/exams/${exam._id}`)}
          >
            Manage Exam
          </button>
        </div>
      ))}
    </div>
  );
}
