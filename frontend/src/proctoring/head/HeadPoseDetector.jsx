import { useEffect } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";

export default function HeadPoseDetector({ videoRef, onPose }) {

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
  `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      if (!results.multiFaceLandmarks?.length) {
        onPose("no_face");
        return;
      }

      const lm = results.multiFaceLandmarks[0];
      const nose = lm[1];
      const leftEye = lm[33];
      const rightEye = lm[263];

      const eyeMidX = (leftEye.x + rightEye.x) / 2;
      const diffX = nose.x - eyeMidX;

      if (diffX > 0.03) onPose("right");
      else if (diffX < -0.03) onPose("left");
      else onPose("center");
    });

    const interval = setInterval(async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState >= 2
      ) {
        try {
          await faceMesh.send({ image: videoRef.current });
        } catch (e) {
          console.warn("FaceMesh skipped frame", e);
        }
      }
    }, 200); // 5 FPS

    return () => clearInterval(interval);
  }, []);

  return null;
}
