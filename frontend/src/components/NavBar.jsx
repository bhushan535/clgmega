import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserFromToken } from "../utils/auth";

export default function NavBar() {
  const user = getUserFromToken();
  const nav = useNavigate();

  // function logout() {
  //   localStorage.removeItem("clg_token");
  //   nav("/login");
  // }

  // no navbar if not logged in
  // if (!user) return null;

  return (
    <nav
      style={{
        display: "flex",
        gap: 12,
        padding: 12,
        marginBottom: 16,
        borderBottom: "1px solid #ddd",
        alignItems: "center"
      }}
    >
      <strong>CLGMEGA</strong>
      <Link to="/proctor-test">Proctor Test</Link>
      {/* {user.role === "teacher" && (
        <>
          <Link to="/teacher/dashboard">Dashboard</Link>
          <Link to="/teacher/create">Create Exam</Link>
          <Link to="/teacher/exams">My Exams</Link>
          <Link to="/teacher/classes">Classes</Link>
          <Link to="/teacher/active">Active</Link>
          <Link to="/teacher/results">Results</Link>
          <Link to="/teacher/analytics">Analytics</Link>
        </>
      )} */}
{/* 
      {user.role === "student" && (
        <>
          <Link to="/student/exam">Exam</Link>
        </>
      )}

      <div style={{ marginLeft: "auto" }}>
        <button onClick={logout}>Logout</button>
        
      </div> */}
    </nav>
  );
}
