// import React, { useEffect, useState, useRef } from "react";
// import api, { initAuth } from "../services/api";
// import { io } from "socket.io-client";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;

// export default function TeacherDashboard() {
//   initAuth(); // ensure token set on api

//   const [title, setTitle] = useState("");
//   const [course, setCourse] = useState("");
//   const [duration, setDuration] = useState(30);
//   const [creating, setCreating] = useState(false);
//   const [createdExam, setCreatedExam] = useState(null);
//   const [events, setEvents] = useState([]);
//   const [loadingEvents, setLoadingEvents] = useState(false);
//   const socketRef = useRef(null);

//   // fetch recent events (initial + refresh)
//   async function fetchEvents() {
//     try {
//       setLoadingEvents(true);
//       const res = await fetch(`${API_URL}/api/events/recent`);
//       const data = await res.json();
//       setEvents(data);
//     } catch (err) {
//       console.error("Error fetching events", err);
//     } finally {
//       setLoadingEvents(false);
//     }
//   }

//   useEffect(() => {
//     fetchEvents();
//     const id = setInterval(fetchEvents, 5000);
//     return () => clearInterval(id);
//   }, []);

//   // socket connect for live events (teacher)
//   useEffect(() => {
//     const token = localStorage.getItem("clg_token");
//     socketRef.current = io(SOCKET_URL, {
//       transports: ["websocket"],
//       auth: { token }
//     });

//     const s = socketRef.current;

//     s.on("connect", () => {
//       console.log("teacher socket connected", s.id);
//     });

//     s.on("violation_event", (ev) => {
//       // prepend new event to list
//       setEvents((prev) => {
//         // avoid duplicates by _id or frameId
//         const exists = prev.find((p) => String(p._id || p.frameId) === String(ev._id || ev.frameId));
//         if (exists) return prev;
//         return [ev, ...prev].slice(0, 200);
//       });
//     });

//     s.on("disconnect", () => {
//       console.log("teacher socket disconnected");
//     });

//     s.on("connect_error", (err) => {
//       console.warn("socket connect_error:", err);
//     });

//     return () => {
//       try { s.disconnect(); } catch (e) {}
//       socketRef.current = null;
//     };
//   }, []);

//   // Create exam handler
//   async function handleCreateExam(e) {
//     e.preventDefault();
//     if (!title) return alert("Enter title");
//     setCreating(true);
//     try {
//       const res = await api.post("/exams", { title, course, duration });
//       setCreatedExam(res.data.exam);
//       setTitle("");
//       setCourse("");
//       setDuration(30);
//       alert("Exam created");
//     } catch (err) {
//       console.error("Create exam failed", err);
//       alert(err?.response?.data?.error || "Create failed");
//     } finally {
//       setCreating(false);
//     }
//   }

//   // Review event quick action (calls /events/:id/review)
//   async function reviewEvent(ev, decision) {
//     try {
//       const payload = { reviewed: true, reviewDecision: decision, notes: `Marked ${decision}` };
//       const id = ev._id || ev.eventId || ev._id;
//       if (!id) return alert("No event id");
//       const res = await api.post(`/events/${id}/review`, payload);
//       // update local list
//       setEvents((prev) => prev.map((p) => (String(p._id) === String(id) ? res.data : p)));
//     } catch (err) {
//       console.error("Review failed", err);
//       alert("Review failed");
//     }
//   }

//   return (
//     <div style={{ padding: 16 }}>
//       <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
//         <div style={{ fontWeight: 700 }}>CLGMEGA — Teacher Dashboard</div>
//         <nav>
//           <a href="/" style={{ marginRight: 12 }}>Home</a>
//           <a href="/login" style={{ marginRight: 12 }}>Login</a>
//           <a href="/register" style={{ marginRight: 12 }}>Register(teacher)</a>
//           <a href="/student/exam">Student</a>
//         </nav>
//       </header>

//       <div style={{ display: "flex", gap: 20 }}>
//         {/* Left: Create Exam */}
//         <div style={{ flex: 1, border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
//           <h3>Create Exam</h3>
//           <form onSubmit={handleCreateExam}>
//             <div style={{ marginBottom: 8 }}>
//               <label>Title</label><br />
//               <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%" }} />
//             </div>
//             <div style={{ marginBottom: 8 }}>
//               <label>Course</label><br />
//               <input value={course} onChange={(e) => setCourse(e.target.value)} style={{ width: "100%" }} />
//             </div>
//             <div style={{ marginBottom: 8 }}>
//               <label>Duration (minutes)</label><br />
//               <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value || 0))} style={{ width: 120 }} />
//             </div>

//             <div style={{ marginTop: 8 }}>
//               <button type="submit" disabled={creating}>{creating ? "Creating..." : "Create Exam"}</button>
//             </div>
//           </form>

//           {createdExam && (
//             <div style={{ marginTop: 12, padding: 8, background: "#f6f6f6", borderRadius: 6 }}>
//               <div><b>Created:</b> {createdExam.title}</div>
//               <div>ID: {createdExam._id}</div>
//               <div style={{ marginTop: 8 }}>
//                 <small>Now add questions using Teacher - Create Exam UI or API</small>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Right: Live events */}
//         <div style={{ width: 420, border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <h3 style={{ margin: 0 }}>Live Events</h3>
//             <button onClick={fetchEvents}>Refresh</button>
//           </div>

//           {loadingEvents && <div style={{ fontSize: 12 }}>Loading...</div>}

//           {events.length === 0 ? (
//             <div style={{ marginTop: 12 }}>No events yet.</div>
//           ) : (
//             <div style={{ marginTop: 8, maxHeight: 520, overflowY: "auto" }}>
//               {events.map((ev) => {
//                 const id = ev._id || ev.eventId || ev._id;
//                 const frameUrl = ev.framePath ? `${API_URL}${ev.framePath}` : null;
//                 return (
//                   <div key={id || Math.random()} style={{ border: "1px solid #eee", padding: 8, marginBottom: 8, borderRadius: 6 }}>
//                     <div style={{ display: "flex", justifyContent: "space-between" }}>
//                       <div>
//                         <b>{ev.type}</b> <small>({ev.severity})</small>
//                       </div>
//                       <div style={{ fontSize: 12 }}>{ev.timestampStart ? new Date(ev.timestampStart).toLocaleTimeString() : ""}</div>
//                     </div>
//                     <div style={{ fontSize: 13, marginTop: 6 }}>
//                       Student: <b>{ev.studentId}</b><br />
//                       Session: {ev.sessionId}
//                     </div>

//                     {ev.notes && <div style={{ marginTop: 6, fontSize: 13 }}>Notes: {ev.notes}</div>}

//                     {frameUrl && (
//                       <div style={{ marginTop: 8 }}>
//                         <img src={frameUrl} alt="frame" style={{ maxWidth: "100%", borderRadius: 6 }} />
//                       </div>
//                     )}

//                     <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
//                       <button onClick={() => reviewEvent(ev, "accepted")}>Accept</button>
//                       <button onClick={() => reviewEvent(ev, "rejected")}>Reject</button>
//                       <button onClick={() => reviewEvent(ev, "needs_review")}>Mark needs review</button>
//                     </div>

//                     <div style={{ marginTop: 6, fontSize: 12, color: ev.reviewed ? "green" : "#666" }}>
//                       Reviewed: {ev.reviewed ? "yes" : "no"} {ev.reviewDecision ? `| decision: ${ev.reviewDecision}` : ""}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


// import React, { useEffect, useState } from "react";
// import { io } from "socket.io-client";
// import api from "../services/api";

// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";
// const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

// export default function TeacherDashboard() {
//   const [events, setEvents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     // load initial events
//     async function load() {
//       try {
//         const res = await api.get('/teacher/events?limit=50');
//         setEvents(res.data.events || []);
//       } catch (err) {
//         console.error('load events', err);
//         setError('Failed to load events');
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();

//     // socket for realtime
// // import or get token from localStorage
// const token = localStorage.getItem('clg_token');
// const socket = io(SOCKET_URL, { transports: ['websocket'], auth: { token } });
//     socket.on('connect', () => console.log('teacher socket connected'));
//     socket.on('violation_event', (ev) => {
//       // prepend new event
//       setEvents(prev => [ev, ...prev]);
//     });
//     socket.on('event_reviewed', (ev) => {
//       // update the event in list if exists
//       setEvents(prev => prev.map(e => (e._id === ev.eventId || e.eventId === ev.eventId ? { ...e, reviewDecision: ev.decision, reviewed: true } : e)));
//     });

//     return () => socket.disconnect();
//   }, []);

//   async function review(eventId, decision) {
//     try {
//       await api.post(`/events/${eventId}/review`, { decision });
//       // optimistic update
//       setEvents(prev => prev.map(e => e._id === eventId ? { ...e, reviewed: true, reviewDecision: decision } : e));
//     } catch (err) {
//       console.error('review error', err);
//       alert('Review failed');
//     }
//   }

//   if (loading) return <div style={{ padding: 16 }}>Loading events...</div>;
//   if (error) return <div style={{ padding: 16, color: 'red' }}>{error}</div>;

//   return (
//     <div style={{ padding: 16 }}>
//       <h2>Teacher Dashboard — Flags</h2>
//       {events.length === 0 ? <div>No flags yet</div> : null}
//       <div style={{ marginTop: 12 }}>
//         {events.map((e, idx) => (
//           <div key={e._id || idx} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
//             <div style={{ display:'flex', justifyContent:'space-between' }}>
//               <div>
//                 <div><strong>{e.type}</strong> — <small>{e.severity}</small></div>
//                 <div>Student: {e.studentId} | Session: {e.sessionId}</div>
//                 <div>Time: {new Date(e.timestampStart || e.createdAt || Date.now()).toLocaleString()}</div>
//               </div>
//               <div>
//                 {e.reviewed ? <div style={{ color: e.reviewDecision === 'accepted' ? 'green' : 'orange' }}>{e.reviewDecision}</div> : (
//                   <>
//                     <button onClick={() => review(e._id, 'accepted')} style={{ marginRight: 6 }}>Accept</button>
//                     <button onClick={() => review(e._id, 'rejected')}>Reject</button>
//                   </>
//                 )}
//               </div>
//             </div>

//             {e.framePath ? (
//               <div style={{ marginTop: 8 }}>
//                 <img src={`${API_BASE}${e.framePath}`} alt="flag" style={{ maxWidth: 360 }} />
//               </div>
//             ) : null}

//             {e.notes ? <div style={{ marginTop:8 }}>{e.notes}</div> : null}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
import React from "react";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const nav = useNavigate();

  const Card = ({ title, desc, path }) => (
    <div
      onClick={() => nav(path)}
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        cursor: "pointer",
        background: "#fafafa"
      }}
    >
      <h3>{title}</h3>
      <p style={{ fontSize: 14, color: "#555" }}>{desc}</p>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <h2>Teacher Dashboard</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
          marginTop: 20
        }}
      >
        <Card
          title="Classes"
          desc="Create and manage student classes"
          path="/teacher/classes"
        />

        <Card
          title="Create Exam"
          desc="Create a new exam (draft)"
          path="/teacher/create"
        />

        <Card
          title="My Exams"
          desc="Manage, assign or delete exams"
          path="/teacher/exams"
        />

        <Card
          title="Proctoring"
          desc="View live & recorded proctoring events"
          path="/teacher/proctoring"
        />
      </div>
    </div>
  );
}
