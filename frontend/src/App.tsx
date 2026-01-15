import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import StudentDashboard from "./pages/StudentDashboard";
import StudentExam from "./pages/StudentExam";

import TeacherCreateExam from "./pages/TeacherCreateExam";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherActiveSessions from "./pages/TeacherActiveSessions";
import TeacherResults from "./pages/TeacherResults";
import TeacherAnalytics from "./pages/TeacherAnalytics";
import TeacherClasses from "./pages/TeacherClasses";
import TeacherManageClass from "./pages/TeacherManageClass";
import TeacherExams from "./pages/TeacherExams";
import TeacherProctoring from "./pages/TeacherProctoring";
import ProtectedRoute from "./components/ProtectedRoute";
import { getUserFromToken } from "./utils/auth";
import NavBar from "./components/NavBar";
import TeacherManageExam from "./pages/TeacherManageExam";
import ProctorTest from "./proctoring/test/ProctorTest";

export default function App() {
  const user = getUserFromToken();

  return (
    <div style={{ padding: 12 }}>
      <NavBar />
      <Routes>
        <Route path="/proctor-test" element={<ProctorTest />} />

        {/* PUBLIC */}
        {/* <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> */}

        {/* STUDENT */}
        {/* <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/exam/:examId"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentExam />
            </ProtectedRoute>
          }
        /> */}

        {/* TEACHER */}
        {/* <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/proctoring"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherProctoring />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/create"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherCreateExam />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/exams"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherExams />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/exams/:examId"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherManageExam />
            </ProtectedRoute>
          }
        />



        <Route
          path="/teacher/classes"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherClasses />
            </ProtectedRoute>
          }
        />
           
           <Route path="/teacher/classes/:classId" element={<TeacherManageClass />} />

        <Route
          path="/teacher/active"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherActiveSessions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/results"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherResults />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/analytics"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherAnalytics />
            </ProtectedRoute>
          }
        /> */}

        {/* ROOT */}
        {/* <Route
          path="/"
          element={
            user ? (
              user.role === "teacher" ? (
                <Navigate to="/teacher/dashboard" replace />
              ) : (
                <Navigate to="/student/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        /> */}

        {/* FALLBACK */}
        {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
      </Routes>
    </div>
  );
}
