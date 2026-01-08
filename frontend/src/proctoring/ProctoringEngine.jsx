import { useEffect, useRef } from "react";
import FaceDetector from "./face/FaceDetector";
import { evaluateFaceRules } from "./rules/faceRules";
import { initTabDetector } from "./tab/TabDetector";
import { processEvent } from "./rules/ViolationEngine";
import { handleViolationAction } from "./actions/AutoActionEngine";
import { detectPersons } from "./person/PersonDetector";
import HeadPoseDetector from "./head/HeadPoseDetector";
import { evaluateHeadPose } from "./rules/headPoseRules";
import { captureFrame } from "../utils/captureFrame";
export default function ProctoringEngine({
  forceSubmitExam,
  showWarningPopup
}) {
  const videoRef = useRef(null);

  // 🔥 FINAL EXIT POINT
  async function handleFinalViolation(event) {
    console.warn("🚨 FINAL VIOLATION:", event);

    let snapshot = null;

  if (videoRef.current) {
    snapshot = await captureFrame(videoRef.current);
  }

    handleViolationAction({event,snapshot}, {
      submitExam: forceSubmitExam,
      warnStudent: showWarningPopup
    });
  }

  // 🎥 FACE PRESENCE
  function handleFaceStatus(data) {
    const violations = evaluateFaceRules(data);

    violations.forEach((v) => {
      processEvent(v, handleFinalViolation);
    });
  }

    // 🤯 HEAD POSE
   function handleHeadPose(dir) {
  console.log("🧠 HEAD POSE:", dir);

  const violation = evaluateHeadPose(dir);
  if (violation) {
    processEvent(violation, handleFinalViolation);
  }
}




  // 🧭 TAB SWITCH
  useEffect(() => {
    initTabDetector((event) => {
      processEvent(event, handleFinalViolation);
    });
  }, []);

  // 👥 MULTI PERSON (COCO-SSD)
  useEffect(() => {
  const interval = setInterval(async () => {
    const video = videoRef.current;

    if (
      !video ||
      video.readyState < 2 || // ❗ important
      video.videoWidth === 0
    ) {
      return;
    }

    const count = await detectPersons(video);

    console.log("👥 PERSON COUNT:", count); // DEBUG

    if (count > 1) {
      processEvent(
        {
          type: "multi_face",
          severity: "high",
          count
        },
        handleFinalViolation
      );
    }
  }, 5000);

  return () => clearInterval(interval);
}, []);

  return (<>
    <FaceDetector
      onFaceStatus={handleFaceStatus}
      videoRef={videoRef}
    />
    <HeadPoseDetector
        videoRef={videoRef}
        onPose={handleHeadPose}
      />
    </>
  );
}
