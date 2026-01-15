import { handleStrike } from "../rules/StrikeManager";

export function handleViolationAction(event, context) {
  handleStrike(event, {
    showWarning: context.warnStudent,
    autoSubmit: context.submitExam
  });
}
