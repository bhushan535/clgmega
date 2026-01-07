export function initTabDetector(onViolation) {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      onViolation({
        type: "tab_switch",
        severity: "high",
        timestamp: Date.now(),
      });
    }
  });

  window.addEventListener("blur", () => {
    onViolation({
      type: "window_blur",
      severity: "medium",
      timestamp: Date.now(),
    });
  });
}
