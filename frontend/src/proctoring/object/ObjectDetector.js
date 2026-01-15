import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import { loadCocoModel } from "./cocoModel";

let model = null;
let lastRun = 0;

export async function detectObjects(videoEl) {
  if (!videoEl || videoEl.readyState < 2) return [];

  const now = Date.now();
  if (now - lastRun < 5000) return [];
  lastRun = now;

  if (!model) {
    model = await loadCocoModel();
    console.log("📦 COCO-SSD ready for object detection");
  }

  const predictions = await model.detect(videoEl);

  // 🔍 DEBUG: show ALL detections
  console.log("🧪 RAW OBJECTS:", predictions);

  const PHONE_LABELS = [
  "cell phone",
  "cellphone",
  "mobile phone",
  "phone",
  "remote" // 🔥 phone aksar remote detect hota hai
];

const BOOK_LABELS = [
  "book",
  "notebook",
  "magazine"
];

const filtered = predictions.filter(
  (p) =>
    (PHONE_LABELS.includes(p.class) ||
     BOOK_LABELS.includes(p.class)) &&
    p.score > 0.3
);


  predictions.forEach(p => {
  console.log(
    "🔎 OBJECT:",
    p.class,
    "score:",
    p.score.toFixed(2)
  );
});

  // ✅ CLEAR CONSOLE LOGS
 filtered.forEach(obj => {
  if (PHONE_LABELS.includes(obj.class)) {
    console.log(`📱 PHONE DETECTED (${(obj.score*100).toFixed(1)}%)`);
  }

  if (BOOK_LABELS.includes(obj.class)) {
    console.log(`📘 BOOK DETECTED (${(obj.score*100).toFixed(1)}%)`);
  }
});


  return filtered;
}