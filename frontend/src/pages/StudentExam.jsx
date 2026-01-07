import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import ProctorCapture from "../components/ProctorCapture";
// import FaceDetector from "../components/FaceDetector";
export default function StudentExam() {
  const { examId } = useParams();
  const nav = useNavigate();

  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  // ⏱ timer
  const [remainingTime, setRemainingTime] = useState(null);
  const timerRef = useRef(null);

  // 🎥 proctoring
  const [proctoring, setProctoring] = useState(false);
const timerInitializedRef = useRef(false);

  // const startedRef = useRef(false);
  const [questions, setQuestions] = useState([]);

  // ▶ START EXAM (SESSION CREATE)
//  useEffect(() => {
//   if (startedRef.current) return;
//   startedRef.current = true;
//   startExam();
// }, []);

useEffect(() => {
  if (!exam || !exam.duration) return;
  if (timerInitializedRef.current) return;

  timerInitializedRef.current = true;
  setRemainingTime(exam.duration * 60);
}, [exam]);

  async function startExam() {
    setLoading(true);
    try {
      const res = await api.post(`/student/exams/${examId}/start`);

      setSession(res.data.session);
      setExam(res.data.exam);

      setProctoring(true); // 🔥 camera ON
      console.log("UPLOAD TOKEN:", res.data.session.uploadToken);

      const qRes = await api.get(
      `/sessions/${res.data.session._id}/questions`
    );
    setQuestions(qRes.data.questions);

    } catch (err) {
  console.error(err);

  const msg = err?.response?.data?.error;

  if (msg === "Exam already attempted") {
    alert("❌ You have already attempted this exam");
    nav("/student/dashboard");
    return;
  }

  alert(msg || "Failed to start exam");
}
 finally {
      setLoading(false);
    }
  }

  // ⏱ init timer
  useEffect(() => {
    if (!exam || !exam.duration) return;
    setRemainingTime(exam.duration * 60);
  }, [exam]);

  // ⏳ countdown
  useEffect(() => {
    if (remainingTime === null) return;

    if (remainingTime === 0) {
      clearInterval(timerRef.current);
      autoSubmitExam();
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingTime(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [remainingTime]);

  function selectOption(qid, optionId) {
    setAnswers(prev => ({ ...prev, [qid]: optionId }));
  }

  async function submitExam(force = false) {
    if (!force && !window.confirm("Submit exam?")) return;

    try {
      await api.post(`/sessions/${session._id}/submit`, { answers });
      setProctoring(false); // 🔴 camera OFF
      alert("Exam submitted");
      nav("/student/dashboard");
    } catch (err) {
      console.error(err);
      alert("Submit failed");
    }
  }
  
//   function handleFaceStatus(data) {
//   console.log("FACE STATUS:", data);

//   if (data.count === 0) {
//     console.warn("❌ No face detected");
//   }

//   if (data.count > 1) {
//     console.warn("❌ Multiple faces detected");
//   }
// }

  async function autoSubmitExam() {
    alert("⏰ Time up! Exam auto-submitted.");
    await submitExam(true);
  }

  if (loading) return <div style={{ padding: 20 }}>Loading exam...</div>;

  return (
  <div style={{ padding: 20 }}>

    {/* START EXAM SCREEN */}
    {!session && !loading && (
      <>
        <h2>Ready to start exam</h2>
        <button onClick={startExam}>Start Exam</button>
      </>
    )}

    {/* LOADING */}
    {loading && <div>Loading exam...</div>}

    {/* EXAM UI */}
    {session && exam && (
      <>
        {/* TIMER */}
        {remainingTime !== null && (
          <div style={{
            position: "fixed",
            top: 10,
            right: 20,
            background: "#222",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 6,
            zIndex: 9999
          }}>
            ⏱ {Math.floor(remainingTime / 60)}:
            {(remainingTime % 60).toString().padStart(2, "0")}
          </div>
        )}

        <h2>{exam.title}</h2>
        <p>Duration: {exam.duration} minutes</p>

        <hr />

        {questions.map((q, idx) => (
          <div key={q._id} style={{ marginBottom: 20 }}>
            <b>Q{idx + 1}.</b> {q.stem}

            {q.options.map(opt => (
              <label key={opt.id} style={{ display: "block" }}>
                <input
                  type="radio"
                  name={q._id}
                  checked={answers[q._id] === opt.id}
                  onChange={() => selectOption(q._id, opt.id)}
                />
                {opt.text}
              </label>
            ))}
          </div>
        ))}

        <hr />
        <button onClick={() => submitExam(false)}>Submit Exam</button>

        <ProctorCapture
          sessionId={session._id}
          studentId={session.studentId}
          uploadToken={session.uploadToken}
          active={proctoring}
        />
        {/* <FaceDetector onFaceStatus={handleFaceStatus} /> */}
        
      </>
    )}
  </div>
);

}
