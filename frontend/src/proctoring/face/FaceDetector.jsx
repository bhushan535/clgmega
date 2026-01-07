import { useEffect, useRef } from "react";
import * as faceDetection from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";

export default function FaceDetector({ onFaceStatus, videoRef }) {
  const cameraRef = useRef(null); // ✅ only this is local

  useEffect(() => {
    let detector;

    async function init() {
      detector = new faceDetection.FaceDetection({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });

      detector.setOptions({
        model: "short",
        minDetectionConfidence: 0.6,
      });

      detector.onResults((results) => {
        const count = results.detections?.length || 0;

        onFaceStatus({
          count,
          timestamp: Date.now(),
        });
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      // ✅ USE PROP videoRef
      videoRef.current.srcObject = stream;

      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          await detector.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });

      cameraRef.current.start();
    }

    init();

    return () => {
      cameraRef.current?.stop();
      videoRef.current?.srcObject
        ?.getTracks()
        .forEach((t) => t.stop());
    };
  }, []);

  return (
    <video
      ref={videoRef}     // ✅ SAME REF
      autoPlay
      muted
      playsInline
      style={{
        position: "fixed",
        top: "-9999px",
        left: "-9999px",
        width: "640px",
        height: "480px"

      }}
    />
  );
}
