import React, { useEffect, useState } from "react";
import api from "../services/api";
import QuestionForm from "../components/QuestionForm";

export default function TeacherCreateExam() {
  // STEP-7.3 — STATES
  const [exam, setExam] = useState(null);            // created exam (draft / assigned)
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [duration, setDuration] = useState(30);

  const [classes, setClasses] = useState([]);        // teacher classes
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [creating, setCreating] = useState(false);

  // STEP-7.4 — LOAD TEACHER CLASSES
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await api.get("/teacher/classes");
        setClasses(res.data.classes || []);
      } catch (err) {
        console.error("load classes", err);
      }
    }
    loadClasses();
  }, []);

  // STEP-7.5 — CREATE EXAM (DRAFT ONLY)
  async function createExam(e) {
    e.preventDefault();
    if (!title) return alert("Title required");

    try {
      setCreating(true);
      const res = await api.post("/exams", {
        title,
        course,
        duration,
      });
      setExam(res.data.exam); // exam created (draft)
    } catch (err) {
      console.error("createExam", err);
      alert(err?.response?.data?.error || "Create failed");
    } finally {
      setCreating(false);
    }
  }

  // STEP-7.7 — ASSIGN EXAM TO CLASSES
  async function assignExam() {
    try {
      setAssigning(true);
      const res = await api.post(`/exams/${exam._id}/assign`, {
        classIds: selectedClasses,
      });
      setExam(res.data.exam);
      alert("Exam assigned successfully");
    } catch (err) {
      console.error("assignExam", err);
      alert("Assign failed");
    } finally {
      setAssigning(false);
    }
  }

  function resetAll() {
    setExam(null);
    setTitle("");
    setCourse("");
    setDuration(30);
    setSelectedClasses([]);
  }

  return (
    <div style={{ padding: 20 }}>
      {/* CREATE EXAM FORM */}
      {!exam && (
        <form onSubmit={createExam}>
          <h2>Create Exam</h2>

          <div>
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <input
              placeholder="Course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
          </div>

          <div>
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value || 0))}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Exam"}
            </button>
          </div>
        </form>
      )}

      {/* EXAM CREATED */}
      {exam && (
        <div>
          <h3>Exam Created</h3>
          <p><b>Title:</b> {exam.title}</p>
          <p><b>Exam ID:</b> {exam._id}</p>
          <p><b>Status:</b> {exam.status || "draft"}</p>
          <p>
            <b>Assigned classes:</b>{" "}
            {(exam.assignedClasses || []).length}
          </p>

          {/* STEP-7.6 — ASSIGN UI
          <div style={{ marginTop: 20 }}>
            <h3>Assign to Classes</h3>

            {classes.length === 0 ? (
              <div>No classes found. Create class first.</div>
            ) : (
              classes.map((c) => (
                <div key={c._id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(c._id)}
                      onChange={() =>
                        setSelectedClasses((prev) =>
                          prev.includes(c._id)
                            ? prev.filter((id) => id !== c._id)
                            : [...prev, c._id]
                        )
                      }
                    />
                    {c.name} ({c.code})
                  </label>
                </div>
              ))
            )}

            <button
              style={{ marginTop: 12 }}
              disabled={assigning || selectedClasses.length === 0}
              onClick={assignExam}
            >
              {assigning ? "Assigning..." : "Assign Exam"}
            </button>
          </div> */}

          {/* ADD QUESTIONS
          <div style={{ marginTop: 20 }}>
            <h3>Add Questions</h3>
            <QuestionForm examId={exam._id} />
          </div> */}

          <div style={{ marginTop: 16 }}>
            <button onClick={resetAll}>Create Another Exam</button>
          </div>
        </div>
      )}
    </div>
  );
}
