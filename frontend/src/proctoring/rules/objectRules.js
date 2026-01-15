let objectStartTime = {};

export function evaluateObjectRules(objects) {
  const now = Date.now();
  const violations = [];

  objects.forEach((obj) => {
    const key = obj.class;

    if (!objectStartTime[key]) {
      objectStartTime[key] = now;
      return;
    }

    const duration = (now - objectStartTime[key]) / 1000;

    if (duration >= 5) {
      violations.push({
        type: "object_detected",
        object: key,
        severity: PHONE_LABELS.includes(key) ? "high" : "medium",
        duration
      });
    }
  });

  // reset when nothing detected
  if (objects.length === 0) {
    objectStartTime = {};
  }

  return violations;
}
