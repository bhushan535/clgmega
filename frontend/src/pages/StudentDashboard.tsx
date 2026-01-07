

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function StudentDashboard() {
  const nav = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadExams();
  }, []);
  
  async function loadExams() {
    try {
      const res = await api.get("/student/exams");
      setExams(res.data.exams || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load exams");
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) return <div style={{ padding: 20 }}>Loading exams...</div>;
  
  return (
    <div style={{ padding: 20 }}>
      <h2>Student Dashboard</h2>

      <h3>Assigned Exams</h3>

      {exams.length === 0 && <div>No exams assigned yet</div>}

      <ul>
        {exams.map(exam => (
          <li key={exam._id} style={{ marginBottom: 8 }}>
            <b>{exam.title}</b> ({exam.duration} min)
            <button
              style={{ marginLeft: 10 }}
              onClick={() => nav(`/student/exam/${exam._id}`)}
              >
              Start Exam
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
// import React, { useEffect, useState } from "react";
// import api from "../services/api";
// import { useNavigate } from "react-router-dom";

// export default function StudentDashboard() {
//   const [exams, setExams] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const nav = useNavigate();

//   useEffect(() => {
//     async function load() {
//       try {
//         const res = await api.get("/student/exams");
//         setExams(res.data.exams || []);
//       } catch (err: any) {
//         console.error(err);
//         setError("Failed to load exams");
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, []);

//   if (loading) return <div>Loading exams...</div>;
//   if (error) return <div style={{ color: "red" }}>{error}</div>;

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Student Dashboard</h2>

//       {exams.length === 0 && <div>No exams assigned yet</div>}

//       {exams.map((exam) => (
//         <div
//           key={exam._id}
//           style={{
//             border: "1px solid #ccc",
//             padding: 12,
//             marginBottom: 12
//           }}
//         >
//           <div><strong>{exam.title}</strong></div>
//           <div>Duration: {exam.duration} min</div>

//           <button
//             style={{ marginTop: 8 }}
//             onClick={() => nav(`/student/exam?examId=${exam._id}`)}
//           >
//             Start Exam
//           </button>
//         </div>
//       ))}
//     </div>
//   );
// }

