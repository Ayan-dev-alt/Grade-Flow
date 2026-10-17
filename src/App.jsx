import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SuspendedContact from "./pages/SuspendedContact";
import { getFriendlyErrorMessage, useAuthSession } from "./firebase/firebase";

function SessionProblem({ error }) {
  return <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white"><section className="max-w-lg rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6"><h1 className="text-xl font-bold">We couldn't load your account</h1><p role="alert" className="mt-3 text-sm leading-6 text-slate-300">{getFriendlyErrorMessage(error, "Check your connection and Firebase setup, then try again.")}</p><button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-400">Try again</button></section></main>;
}

function ProtectedRoute({
  children,
  requireAdmin = false,
  requireApproved = false,
}) {
  const session = useAuthSession();
  const location = useLocation();
  if (session.loading) return <div className="min-h-screen bg-slate-950" />;
  if (session.error) return <SessionProblem error={session.error} />;

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
  if (session.error) return <SessionProblem error={session.error} />;

  if (session?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (session?.status === "suspended") {
    return <Navigate to="/contact-admin" replace />;
  }

  if (session?.status === "approved") {
    return <Navigate to="/teacher" replace />;
  }

  return children;
}

function ContactAdminRoute() {
  const session = useAuthSession();
  if (session.loading) return <div className="min-h-screen bg-slate-950" />;
  if (session.error) return <SessionProblem error={session.error} />;
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
