import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SuspendedContact from "./pages/SuspendedContact";
import { useAuthSession } from "./firebase/firebase";

function ProtectedRoute({
  children,
  requireAdmin = false,
  requireApproved = false,
}) {
  const session = useAuthSession();
  const location = useLocation();
  if (session.loading) return <div className="min-h-screen bg-slate-950" />;

  if (!session.user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (requireAdmin && session.role !== "admin") {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (requireApproved && session.role !== "admin" && session.status === "suspended") {
    return <SuspendedContact />;
  }

  if (
    requireApproved &&
    session.role !== "admin" &&
    session.status !== "approved"
  ) {
    return (
      <Navigate
        to={
          "/auth?status=pending"
        }
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const session = useAuthSession();
  if (session.loading) return <div className="min-h-screen bg-slate-950" />;

  if (session?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (session?.status === "approved") {
    return <Navigate to="/teacher" replace />;
  }

  return children;
}

function ContactAdminRoute() {
  const session = useAuthSession();
  if (session.loading) return <div className="min-h-screen bg-slate-950" />;
  if (!session.user) return <Navigate to="/auth" replace />;
  if (session.status === "suspended") return <SuspendedContact />;
  if (session.role === "admin") return <Navigate to="/admin" replace />;
  if (session.status === "approved") return <Navigate to="/teacher" replace />;
  return <Navigate to="/auth?status=pending" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/auth"
        element={
          <PublicOnlyRoute>
            <Auth />
          </PublicOnlyRoute>
        }
      />
      <Route path="/contact-admin" element={<ContactAdminRoute />} />
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute requireApproved>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
