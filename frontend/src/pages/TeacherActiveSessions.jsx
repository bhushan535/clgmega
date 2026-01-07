// TeacherActiveSessions.jsx
import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function TeacherActiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState({}); // map sessionId -> boolean
  const [frames, setFrames] = useState({}); // map sessionId -> array of frames
  const socketRef = useRef(null);

  useEffect(() => {
    // init socket with token
    const token = localStorage.getItem('clg_token');
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'], auth: { token } });

    socketRef.current.on('connect', () => console.log('teacher socket connected', socketRef.current.id));
    socketRef.current.on('student_frame', (frame) => {
      // frame: { frameId, framePath, studentId, timestamp, sessionId? }
      // we expect teacher server emits to watch_room only; but add sessionId if present
      const sid = frame.sessionId || (frame.frameId && frame.frameId.split('_')[0]) || null;
      const sessionId = frame.sessionId || frame.sessionId; // may not be present; we rely on room
      // We don't know sessionId from frame if not included; server sends the event to a specific room, so we rely on server to include sessionId if possible.
      // For safety, let server also send sessionId — but we'll handle without it by having separate sockets per room in future.
      // Here we will assume server includes sessionId (it will).
      const sId = frame.sessionId;
      if (!sId) return;
      setFrames(prev => {
        const arr = prev[sId] ? [...prev[sId]] : [];
        arr.unshift(frame);
        // keep last 20
        if (arr.length > 20) arr.splice(20);
        return { ...prev, [sId]: arr };
      });
    });

    socketRef.current.on('disconnect', () => console.log('socket disconnected'));
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    // load sessions
    async function load() {
      try {
        const res = await api.get('/teacher/sessions?limit=100');
        setSessions(res.data.sessions || []);
      } catch (err) {
        console.error('load sessions', err);
        setError('Failed to load sessions');
      }
    }
    load();
    // refresh every 15s
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  async function joinSession(sessionId) {
    try {
      socketRef.current.emit('watch_session', { sessionId });
      setJoined(prev => ({ ...prev, [sessionId]: true }));
      // ensure frames array exists
      setFrames(prev => ({ ...prev, [sessionId]: prev[sessionId] || [] }));
    } catch (err) {
      console.error('joinSession error', err);
    }
  }

  function leaveSession(sessionId) {
    try {
      socketRef.current.emit('leave_session', { sessionId }); // optional ; server may support or simply socket.leave?
      // we can also ask socket to leave room by calling socketRef.current.emit and server handles it. For now just local state:
      setJoined(prev => ({ ...prev, [sessionId]: false }));
      // instruct server to leave room (optionally)
      socketRef.current.emit('unwatch_session', { sessionId });
    } catch (err) {
      console.error('leaveSession', err);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Active Sessions</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        {sessions.map(s => (
          <div key={s.sessionId} style={{ border: '1px solid #ddd', padding: 8, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div><strong>Session:</strong> {s.sessionId}</div>
              <div><strong>Student:</strong> {s.studentId}</div>
              <div><strong>Exam:</strong> {s.examId}</div>
              <div><small>Ends: {new Date(s.endsAt).toLocaleString()}</small></div>
            </div>
            <div>
              {!joined[s.sessionId] ? (
                <button onClick={() => joinSession(s.sessionId)}>Join</button>
              ) : (
                <button onClick={() => leaveSession(s.sessionId)}>Leave</button>
              )}
            </div>
            {/* Live preview column */}
            <div style={{ width: 360 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Live frames:</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, overflowX: 'auto' }}>
                {(frames[s.sessionId] || []).map((f,i) => (
                  <img key={f.frameId || i} src={`${API_BASE}${f.framePath}`} alt="frame" style={{ width: 120, height: 80, objectFit: 'cover', border: '1px solid #ccc' }} />
                ))}
                {(frames[s.sessionId] || []).length === 0 && <div style={{ color: '#999' }}>No frames yet</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
