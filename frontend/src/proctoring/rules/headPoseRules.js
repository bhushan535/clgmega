let lookAwayStart = null;

export function evaluateHeadPose(direction) {
  const now = Date.now();

  if (direction === "center") {
    lookAwayStart = null;
    return null;
  }

  if (!lookAwayStart) lookAwayStart = now;

  const duration = (now - lookAwayStart) / 1000;

  // 👀 SIDE LOOK
  if (direction === "left" || direction === "right") {
    if (duration >= 10) {
      return {
        type: "looking_away",
        severity: duration >= 30 ? "high" : "medium",
        duration
      };
    }
  }

  // 📱 LOOK DOWN (PHONE)
  if (direction === "down" && duration >= 5) {
    return {
      type: "possible_phone_usage",
      severity: "high",
      duration
    };
  }

  return null;
}
