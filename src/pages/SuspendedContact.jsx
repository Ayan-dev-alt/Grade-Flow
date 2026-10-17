import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LifeBuoy, Send, ShieldAlert, LogOut } from "lucide-react";
import Logo from "../components/Logo";
import {
  useAuthSession,
  subscribeSupportMessages,
  sendTeacherSupportMessage,
  logout,
} from "../firebase/firebase";

export default function SuspendedContact() {
  const { user, profile } = useAuthSession();
  const session = { ...profile, uid: user?.uid, displayName: user?.displayName || profile?.displayName, email: user?.email };
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!session?.uid) return undefined;
    return subscribeSupportMessages(session.uid, setMessages, () => setError("Could not load your support messages. Please try again."));
  }, [session?.uid]);

  const send = async (event) => {
    event.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      await sendTeacherSupportMessage(session.uid, session, message);
      setMessage("");
    } catch (sendError) {
      setError(sendError.message || "Your message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const signOut = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5">
            <LogOut size={16} /> Sign out
          </button>
        </div>

        <section className="overflow-hidden rounded-3xl border border-amber-400/20 bg-slate-900/70 shadow-2xl shadow-black/20">
          <div className="border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-rose-500/10 p-6 sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200">
              <ShieldAlert size={14} /> Teacher access deactivated
            </span>
            <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Contact the admin</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Your teacher dashboard access is paused. Contact the admin here to ask a question or request reactivation. Admin replies will appear in this conversation.
            </p>
          </div>

          <div className="p-4 sm:p-6">
            <div className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account email</p>
                <p className="mt-1 break-all text-sm text-slate-200">{session.email || "Email unavailable"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone number</p>
                <p className="mt-1 text-sm text-slate-200">{session.phone || "No phone number on file"}</p>
              </div>
            </div>
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <LifeBuoy size={17} className="text-indigo-300" /> Support conversation
            </div>
            <div className="mb-4 flex max-h-[46vh] min-h-48 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              {messages.length === 0 && (
                <div className="m-auto max-w-sm py-8 text-center">
                  <p className="text-sm text-slate-300">No messages yet</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Tell the admin what happened, and they can reply in this thread.</p>
                </div>
              )}
              {messages.map((item) => (
                <div key={item.id} className={`max-w-[88%] rounded-2xl px-4 py-3 ${item.sender === "teacher" ? "ml-auto bg-indigo-500/20 text-indigo-50" : "mr-auto bg-white/[.07] text-slate-100"}`}>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.sender === "teacher" ? "You" : "Admin"}</p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">{item.message}</p>
                  {item.createdAt && <p className="mt-2 text-right text-[10px] text-slate-500">{(item.createdAt.toDate?.() || new Date(item.createdAt)).toLocaleString()}</p>}
                </div>
              ))}
            </div>
            {error && <p className="mb-3 text-sm text-rose-300">{error}</p>}
            <form onSubmit={send} className="flex items-end gap-3">
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} maxLength={2000} placeholder="Write a message to the admin..." className="min-h-12 flex-1 resize-y rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-indigo-400/50" />
              <button disabled={sending || !message.trim()} className="inline-flex h-12 items-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-semibold hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50">
                <Send size={16} /> <span className="hidden sm:inline">{sending ? "Sending" : "Send"}</span>
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
