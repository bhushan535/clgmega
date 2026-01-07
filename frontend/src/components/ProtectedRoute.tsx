import { Navigate } from "react-router-dom";
import { getUserFromToken } from "../utils/auth";

export default function ProtectedRoute({ allowedRole, children }: any) {
  const user = getUserFromToken();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === "teacher" ? "/teacher/dashboard" : "/student/exam"} replace />;
  }

  return children;
}
