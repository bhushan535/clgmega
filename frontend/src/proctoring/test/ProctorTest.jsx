import ProctoringEngine from "../ProctoringEngine";

export default function ProctorTest() {
  return (
    <div style={{ padding: 20 }}>
      <h2>AI Proctoring – Test Page</h2>
      <p>Open console and test face detection</p>
      <ProctoringEngine  forceSubmitExam={() => alert("AUTO SUBMIT")}
        showWarningPopup={(msg) => alert(msg)}/>
    </div>
  );
}
