export function handleViolationAction(event, context) {
  const { submitExam, warnStudent } = context;

  if (event.severity === "medium") {
    warnStudent(
      "⚠️ Warning: Suspicious activity detected. Please stay focused."
    );
  }

  if (event.severity === "high") {
    warnStudent(
      "🚫 Serious violation detected. Exam will be submitted."
    );

    setTimeout(() => {
      submitExam(true); // force submit
    }, 3000);
  }
}
