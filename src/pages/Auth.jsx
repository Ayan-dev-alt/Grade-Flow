import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Lock,
  UserRound,
  Chrome,
  Phone,
} from "lucide-react";
import Logo from "../components/Logo";
import {
  loginWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  getAccountSession,
  resetPassword,
} from "../firebase/firebase";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [show, setShow] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  });
  const navigate = useNavigate();

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      if (mode === "signup") {
        if (form.password !== form.confirm) {
          throw new Error("Passwords do not match.");
        }

        setLoading(true);
        const user = await signUpWithEmail({
          name: form.name,
          phone: form.phone,
          email: form.email,
          password: form.password,
        });
        var account = await getAccountSession(user);
      } else {
        setLoading(true);
        const user = await loginWithEmail({
          email: form.email,
          password: form.password,
        });
        var account = await getAccountSession(user);
      }

      const session = account;

      if (session?.role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      if (session?.status === "approved") {
        navigate("/teacher", { replace: true });
        return;
      }

      if (session?.status === "suspended") {
        navigate("/contact-admin", { replace: true });
        return;
      }

      navigate("/auth?status=pending", { replace: true });
    } catch (submitError) {
      setError(
        submitError.message || "Authentication failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = form.email.trim();
    if (!email) {
      setError("Please enter your email address first.");
      setResetMessage("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResetMessage("");
      await resetPassword(email);
      setResetMessage(
        "GradeFlow reset link has been sent to your email. Open the email and tap the link to set a new password.",
      );
    } catch (submitError) {
      setError(
        submitError?.message || "Unable to send reset email. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      if (mode === "signup" && !form.phone.trim()) {
        setError("Please enter your phone number to create a teacher account.");
        return;
      }
      setLoading(true);
      setError("");
      const user = await signInWithGoogle(mode === "signup" ? form.phone.trim() : "");
      const session = await getAccountSession(user);

      if (session?.role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      if (session?.status === "approved") {
        navigate("/teacher", { replace: true });
        return;
      }

      if (session?.status === "suspended") {
        navigate("/contact-admin", { replace: true });
        return;
      }

      navigate("/auth?status=pending", { replace: true });
    } catch (submitError) {
      const message =
        submitError?.code === "auth/popup-blocked"
          ? "Google popup was blocked. Please allow popups and try again."
          : submitError?.code === "auth/popup-closed-by-user"
            ? "Google sign-in was cancelled."
            : submitError?.message ||
              "Google sign-in failed. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isPendingApproval = searchParams.get("status") === "pending";
  const isSuspended = searchParams.get("status") === "suspended";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600/20 via-slate-950 to-fuchsia-600/10 p-10 lg:flex">
          <Link to="/">
            <Logo />
          </Link>
          <div>
            <span className="rounded-full bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300">
              🚀 Smart Academic Platform
            </span>
            <h1 className="mt-7 text-5xl font-black leading-tight">
              Welcome to
              <br />
              <span className="gradient-text">GradeFlow</span>
            </h1>
            <p className="mt-5 max-w-md leading-7 text-slate-400">
              Manage students, calculate results and organize your academic
              workflow from one dashboard.
            </p>
          </div>
          <p className="text-xs text-slate-600">Teacher Result Manager</p>
        </div>

        <div className="flex items-center p-5 md:p-10">
          <div className="mx-auto w-full max-w-md">
            <Link
              to="/"
              className="mb-10 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft size={16} /> Back to home
            </Link>

            <div className="mb-8 lg:hidden">
              <Logo />
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {mode === "login"
                  ? "Sign in to your teacher workspace."
                  : "Your new account will remain pending until admin approval."}
              </p>
            </div>

            <div className="mb-6 flex rounded-xl border border-white/10 bg-white/[.03] p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${
                  mode === "login"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-400"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${
                  mode === "signup"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-400"
                }`}
              >
                Create Account
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[.06] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Chrome size={18} />
              {loading ? "Please wait..." : "Continue with Google"}
            </button>

            <div className="mb-4 flex items-center gap-3 text-xs text-slate-500">
              <span className="h-px flex-1 bg-white/10" />
              or continue with email
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <Field
                  icon={UserRound}
                  placeholder="Full name"
                  value={form.name}
                  onChange={(value) => updateField("name", value)}
                />
              )}

              {mode === "signup" && (
                <Field
                  icon={Phone}
                  type="tel"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(value) => updateField("phone", value)}
                />
              )}

              <Field
                icon={Mail}
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(value) => updateField("email", value)}
              />

              <Field
                icon={Lock}
                type={show ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(value) => updateField("password", value)}
                right={
                  <button
                    type="button"
                    onClick={() => setShow((current) => !current)}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {mode === "signup" && (
                <Field
                  icon={Lock}
                  type="password"
                  placeholder="Confirm password"
                  value={form.confirm}
                  onChange={(value) => updateField("confirm", value)}
                />
              )}

              {error && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {error}
                </div>
              )}

              {resetMessage && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  {resetMessage}
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                />
                Remember me
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-500 py-3.5 font-semibold shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Login"
                    : "Create Account"}
              </button>
            </form>

            {isPendingApproval && (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                Your account is waiting for admin review. You will be able to
                access the teacher dashboard after approval.
              </div>
            )}

            {isSuspended && (
              <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                Your account has been temporarily suspended. Please contact the
                admin to reactivate it.
              </div>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={loading}
                className="mt-5 w-full text-center text-sm text-indigo-400 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Please wait..." : "Forgot password?"}
              </button>
            )}

            {mode === "signup" && (
              <p className="mt-5 text-center text-xs text-slate-500">
                By creating an account, you agree to the platform terms.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  right,
  type = "text",
  placeholder,
  value,
  onChange,
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 focus-within:border-indigo-500/50">
      <Icon size={18} className="text-slate-500" />
      <input
        required
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600"
      />
      {right}
    </div>
  );
}
