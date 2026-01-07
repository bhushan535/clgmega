import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "../services/api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function TeacherProctoring() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/teacher/events?limit=50");
        setEvents(res.data.events || []);
      } catch (err) {
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    }
    load();

    const token = localStorage.getItem("clg_token");
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("violation_event", (ev) => {
      setEvents((prev) => [ev, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Live Proctoring Flags</h2>

      {events.length === 0 && <div>No flags yet</div>}

      {events.map((e, i) => (
        <div key={i} style={{ border: "1px solid #ccc", marginBottom: 8 }}>
          <div>{e.type}</div>
          <div>Student: {e.studentId}</div>
          {e.framePath && (
            <img src={`${API_BASE}${e.framePath}`} width={300} />
          )}
        </div>
      ))}
    </div>
  );
}
