let strikes = 0;
let lastStrikeTime = 0;

export function handleStrike(event, callbacks) {
  const { showWarning, autoSubmit } = callbacks;
  const now = Date.now();

  // ⏱️ cooldown (avoid spam)
  if (now - lastStrikeTime < 5000) return;
  lastStrikeTime = now;

  if (event.severity === "medium") {
    strikes += 1;
    showWarning({
      level: "warning",
      message: "⚠️ Suspicious activity detected. Please focus on exam.",
      duration: 4000
    });
  }

  if (event.severity === "high") {
    strikes += 2;
    showWarning({
      level: "danger",
      message: "🚫 Serious violation detected. Exam will auto-submit.",
      duration: 5000,
      countdown: true
    });

    setTimeout(() => autoSubmit(true), 5000);
  }

  // 🛑 HARD LIMIT
  if (strikes >= 3) {
    autoSubmit(true);
  }
}
