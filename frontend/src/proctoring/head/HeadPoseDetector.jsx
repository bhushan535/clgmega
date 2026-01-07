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
// import { useEffect } from "react";
// import { FaceMesh } from "@mediapipe/face_mesh";

// export default function HeadPoseDetector({ videoRef, onPose }) {

//   useEffect(() => {
//     const faceMesh = new FaceMesh({
//       locateFile: (file) =>
//         `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
//     });

//     faceMesh.setOptions({
//       maxNumFaces: 1,
//       refineLandmarks: true,
//       minDetectionConfidence: 0.5,
//       minTrackingConfidence: 0.5,
//     });

//     faceMesh.onResults((results) => {
//       if (!results.multiFaceLandmarks?.length) {
//         onPose("no_face");
//         return;
//       }

//       const lm = results.multiFaceLandmarks[0];
//       const nose = lm[1];
//       const leftEye = lm[33];
//       const rightEye = lm[263];

//       const eyeMidX = (leftEye.x + rightEye.x) / 2;
//       const diffX = nose.x - eyeMidX;

//       if (diffX > 0.03) onPose("right");
//       else if (diffX < -0.03) onPose("left");
//       else onPose("center");
//     });

//     // 🔥 RUN FaceMesh manually from existing video
//     const interval = setInterval(async () => {
//       if (
//         videoRef.current &&
//         videoRef.current.readyState >= 2
//       ) {
//         await faceMesh.send({ image: videoRef.current });
//       }
//     }, 200); // 5 FPS (perfect)

//     return () => clearInterval(interval);
//   }, []);

//   return null;
// }

// // import { useEffect, useRef } from "react";
// // import * as faceMesh from "@mediapipe/face_mesh";
// // import { Camera } from "@mediapipe/camera_utils";

// // export default function HeadPoseDetector({ videoRef, onHeadPose }) {
// //   const cameraRef = useRef(null);

// //   useEffect(() => {
// //     const mesh = new faceMesh.FaceMesh({
// //       locateFile: (file) =>
// //         `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
// //     });

// //     mesh.setOptions({
// //       maxNumFaces: 1,
// //       refineLandmarks: true,
// //       minDetectionConfidence: 0.6,
// //       minTrackingConfidence: 0.6,
// //     });

// //     mesh.onResults((results) => {
// //       if (!results.multiFaceLandmarks?.length) return;

// //       const lm = results.multiFaceLandmarks[0];

// //       // eyes + nose landmarks
// //       const leftEye = lm[33];
// //       const rightEye = lm[263];
// //       const nose = lm[1];

// //       const eyeMidX = (leftEye.x + rightEye.x) / 2;
// //       const dx = nose.x - eyeMidX;

// //       // simple yaw estimation
// //       if (dx > 0.03) onHeadPose("right");
// //       else if (dx < -0.03) onHeadPose("left");
// //       else onHeadPose("center");
// //     });

// //     cameraRef.current = new Camera(videoRef.current, {
// //       onFrame: async () => {
// //         await mesh.send({ image: videoRef.current });
// //       },
// //       width: 640,
// //       height: 480,
// //     });

// //     cameraRef.current.start();

// //     return () => cameraRef.current?.stop();
// //   }, []);

// //   return null; // no UI
// // }
// import { useEffect, useRef } from "react";
// import { FaceMesh } from "@mediapipe/face_mesh";

// export default function HeadPoseDetector({ videoRef, onPose }) {
//   const cameraRef = useRef(null);

//   useEffect(() => {
//     const faceMesh = new FaceMesh({
//       locateFile: (file) =>
//         `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
//     });

//     faceMesh.setOptions({
//       maxNumFaces: 1,
//       refineLandmarks: true,
//       minDetectionConfidence: 0.5,
//       minTrackingConfidence: 0.5,
//     });

//     faceMesh.onResults((results) => {
//       if (!results.multiFaceLandmarks?.length) {
//         onPose("no_face");
//         return;
//       }

//       const lm = results.multiFaceLandmarks[0];

//       // 👀 eyes + nose landmarks
//       const nose = lm[1];
//       const leftEye = lm[33];
//       const rightEye = lm[263];

//       const eyeMidX = (leftEye.x + rightEye.x) / 2;
//       const diffX = nose.x - eyeMidX;

//       // 👇 SIMPLE & RELIABLE LOGIC
//       if (diffX > 0.03) onPose("right");
//       else if (diffX < -0.03) onPose("left");
//       else onPose("center");
//     });

//     // cameraRef.current = new Camera(videoRef.current, {
//     //   onFrame: async () => {
//     //     await faceMesh.send({ image: videoRef.current });
//     //   },
//     //   width: 640,
//     //   height: 480,
//     // });

//     // cameraRef.current.start();

//     return () => cameraRef.current?.stop();
//   }, []);

//   return null; // 👈 no UI
// }
