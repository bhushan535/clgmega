let lookAwayStart = null;

export function evaluateHeadPose(direction) {
  const now = Date.now();

  if (direction === "center") {
    lookAwayStart = null;
    return null;
  }

  if (!lookAwayStart) lookAwayStart = now;

  const duration = (now - lookAwayStart) / 1000;

  if (duration >= 30) {
    return {
      type: "looking_away",
      severity: "high",
      duration
    };
  }

  if (duration >= 10) {
    return {
      type: "looking_away",
      severity: "medium",
      duration
    };
  }

  return null;
}
