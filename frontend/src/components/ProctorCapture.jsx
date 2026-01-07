import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export default function ProctorCapture({
  sessionId,
  studentId,
  uploadToken,
  active
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!active ) return;

    const token = localStorage.getItem("clg_token");

    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token }
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join_session", { sessionId });
    });

    startCamera();

    return stopAll;
  }, [active]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      intervalRef.current = setInterval(captureFrame, 3000);
    } catch (err) {
      alert("Camera permission required");
    }
  }

  function stopAll() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach(t => t.stop());
    socketRef.current?.disconnect();
  }

  function captureFrame() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = 320;
    canvas.height = 240;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 320, 240);

    canvas.toBlob(blob => {
      if (!blob) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        if (!socketRef.current?.connected) return;
if (!uploadToken) {
  console.warn("Upload token missing, frame skipped");
  return;
}

socketRef.current.emit("frame", {
  sessionId,
  studentId,
  uploadToken,
  timestamp: new Date().toISOString(),
  imageBase64: reader.result
});

      };
      reader.readAsDataURL(blob);
    }, "image/jpeg", 0.6);
  }

  return (
    <>
      {/* 🔒 Hidden camera */}
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </>
  );
}

// --------------------------------------------------------------------------

// import { useEffect, useRef } from "react";
// import api from "../services/api";

// export default function ProctorCapture({ sessionId, active }) {
//   const videoRef = useRef(null);
//   const streamRef = useRef(null);
//   const intervalRef = useRef(null);

//   useEffect(() => {
//     if (!active) return;

//     async function startCamera() {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: true,
//           audio: false,
//         });

//         streamRef.current = stream;
//         videoRef.current.srcObject = stream;
//         await videoRef.current.play();

//         // capture frame every 3 seconds
//         intervalRef.current = setInterval(captureFrame, 3000);
//       } catch (err) {
//         console.error("Camera permission denied", err);
//         alert("Camera access required for exam");
//       }
//     }

//     startCamera();

//     return stopCamera;
//   }, [active]);

//   function stopCamera() {
//     if (intervalRef.current) clearInterval(intervalRef.current);
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(t => t.stop());
//     }
//   }

//   async function captureFrame() {
//     if (!videoRef.current) return;

//     const canvas = document.createElement("canvas");
//     canvas.width = 320;
//     canvas.height = 240;

//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

//     const blob = await new Promise(res =>
//       canvas.toBlob(res, "image/jpeg", 0.6)
//     );

//     if (!blob) return;

//     const form = new FormData();
//     form.append("frame", blob);
//     form.append("sessionId", sessionId);

//     try {
//       await api.post("/internal/frame", form);
//     } catch (err) {
//       console.error("Frame send failed");
//     }
//   }

//   return (
//     <>
//       {/* 🔒 Hidden video — student never sees camera */}
//       <video ref={videoRef} style={{ display: "none" }} />
//     </>
//   );
// }
// --------------------------------------------------------------------------

// // frontend/src/components/ProctorCapture.jsx
// import React, { useRef, useEffect, useState } from "react";
// import { io } from "socket.io-client";

// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

// export default function ProctorCapture({
//   sessionId = null,
//   studentId = "student-1",
//   uploadToken = null,      // <- new prop
//   captureMs = 1500
// }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const socketRef = useRef(null);

//   const [running, setRunning] = useState(false);
//   const [status, setStatus] = useState("disconnected");
//   const runningRef = useRef(false);

//   // create socket once
//   useEffect(() => {
//     const token = localStorage.getItem("clg_token"); // ensure login stores token
//     socketRef.current = io(SOCKET_URL, {
//       transports: ["websocket"],
//       auth: { token }
//     });

//     const s = socketRef.current;

//     s.on("connect", () => {
//       setStatus("connected");
//       // join session room if available immediately
//       if (sessionId) {
//         s.emit("join_session", { sessionId });
//         console.log("ProctorCapture: join_session emitted for", sessionId);
//       }
//     });

//     s.on("disconnect", () => {
//       setStatus("disconnected");
//     });

//     s.on("connect_error", (err) => {
//       console.warn("Socket connect_error", err);
//     });

//     s.on("frame_ack", (payload) => {
//       // optional: handle ack responses from server for debug
//       // console.log("frame_ack", payload);
//     });

//     return () => {
//       try {
//         s.disconnect();
//       } catch (e) {}
//       socketRef.current = null;
//     };
//     // create socket once on mount, session join handled in separate effect
//   }, []);

//   // If sessionId becomes available later, emit join_session
//   useEffect(() => {
//     if (!sessionId) return;
//     const s = socketRef.current;
//     if (!s) return;
//     if (s.connected) {
//       s.emit("join_session", { sessionId });
//       console.log("ProctorCapture: join_session emitted (effect) for", sessionId);
//     } else {
//       const onConnect = () => {
//         s.emit("join_session", { sessionId });
//         s.off("connect", onConnect);
//       };
//       s.on("connect", onConnect);
//       return () => s.off("connect", onConnect);
//     }
//   }, [sessionId]);

//   // If uploadToken changes, optionally log it (not required)
//   useEffect(() => {
//     if (uploadToken) {
//       console.log("ProctorCapture received uploadToken:", uploadToken);
//     }
//   }, [uploadToken]);

//   const startCamera = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480 },
//         audio: false
//       });

//       videoRef.current.srcObject = stream;
//       await videoRef.current.play();

//       runningRef.current = true;
//       setRunning(true);
//       captureLoop();
//     } catch (err) {
//       console.error("Camera start error", err);
//       alert("Camera permission needed!");
//     }
//   };

//   const stopCamera = () => {
//     const stream = videoRef.current?.srcObject;
//     if (stream) stream.getTracks().forEach((t) => t.stop());

//     runningRef.current = false;
//     setRunning(false);
//   };

//   const captureLoop = () => {
//     if (!runningRef.current) return;

//     const canvas = canvasRef.current;
//     const video = videoRef.current;
//     if (!canvas || !video) {
//       setTimeout(captureLoop, captureMs);
//       return;
//     }
//     const ctx = canvas.getContext("2d");

//     const W = 320,
//       H = 240;
//     canvas.width = W;
//     canvas.height = H;

//     try {
//       ctx.drawImage(video, 0, 0, W, H);
//     } catch (err) {
//       console.warn("drawImage failed", err);
//       setTimeout(captureLoop, captureMs);
//       return;
//     }

//     canvas.toBlob((blob) => {
//       if (!blob) {
//         setTimeout(captureLoop, captureMs);
//         return;
//       }

//       const reader = new FileReader();
//       reader.onloadend = () => {
//         const base64data = reader.result;

//         // Only send frames if socket connected
//         const s = socketRef.current;
//         if (s && s.connected) {
//           s.emit("frame", {
//             sessionId,
//             studentId,
//             timestamp: new Date().toISOString(),
//             imageBase64: base64data,
//             uploadToken // <-- included here
//           });
//         } else {
//           // optionally store or drop frames when disconnected
//         }
//       };

//       reader.readAsDataURL(blob);
//     }, "image/jpeg", 0.7);

//     setTimeout(captureLoop, captureMs);
//   };

//   return (
//     <div>
//       <h3>Student Camera</h3>
//       <p>Status: <b>{status}</b></p>

//       <video ref={videoRef} style={{ width: 320, height: 240, background: "#000" }} muted />
//       <canvas ref={canvasRef} style={{ display: "none" }} />

//       {!running ? (
//         <button onClick={startCamera}>Start Camera</button>
//       ) : (
//         <button onClick={stopCamera}>Stop Camera</button>
//       )}
//     </div>
//   );
// }
