let noFaceStart = null;

export function evaluateFaceRules({ count, timestamp }) {
  const events = [];

  // ❌ NO FACE
  if (count === 0) {
    if (!noFaceStart) noFaceStart = timestamp;

    if (timestamp - noFaceStart > 5000) {
      events.push({
        type: "no_face",
        severity: "medium",
        duration: Math.floor((timestamp - noFaceStart) / 1000),
      });
    }
  } else {
    noFaceStart = null;
  }



  return events;
}
