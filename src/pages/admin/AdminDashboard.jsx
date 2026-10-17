import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  Clock3,
  CreditCard,
  ShieldCheck,
  Search,
  Phone,
  Bell,
  Trash2,
  Power,
  Send,
  LifeBuoy,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import StatCard from "../../components/StatCard";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  subscribeTeachers, subscribeNotifications, subscribeComplaints, createNotification, setTeacherStatus, removeTeacher, deleteNotificationEverywhere, deleteComplaint, subscribeSupportThreads, subscribeSupportMessages, sendAdminSupportMessage, subscribePlans, savePlan, deletePlan, getFriendlyErrorMessage,
} from "../../firebase/firebase";

function sortTeachers(list) {
  return [...list].sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isTeacherOnline(teacher) {
  const lastSeen = teacher.lastSeen?.toDate?.() || (teacher.lastSeen ? new Date(teacher.lastSeen) : null);
  return teacher.online === true && lastSeen && Date.now() - lastSeen.getTime() < 60000;
}

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Sidebar admin />
      <div className="lg:pl-64">
        <header className="border-b border-white/10 bg-slate-950/80 px-5 py-5 backdrop-blur-xl">
          <p className="text-xs text-slate-500">Administration</p>
          <h1 className="text-xl font-bold">GradeFlow Admin Panel</h1>
        </header>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="support" element={<SupportInbox />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="payments" element={<Payments />} />
          <Route path="settings" element={<AdminSettings />} />
        </Routes>
      </div>
    </div>
  );
}

function Overview() {
  const [rows, setRows] = useState([]);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => subscribeTeachers(setRows, (error) => setError(getFriendlyErrorMessage(error, "We couldn't load teacher accounts. Refresh the page and try again."))), []);
  useEffect(() => subscribePlans(setPlans, (error) => setError(getFriendlyErrorMessage(error, "We couldn't load plans. Refresh the page and try again."))), []);
  const totalTeachers = rows.length;
  const inactive = rows.filter((teacher) => teacher.status === "suspended").length;
  const active = rows.filter(
    (teacher) => teacher.status === "approved",
  ).length;

  return (
    <main className="mx-auto max-w-7xl space-y-7 p-5 md:p-8">
      <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/20 to-violet-600/10 p-7">
        <p className="text-sm text-indigo-300">Control Center</p>
        <h2 className="mt-2 text-3xl font-black">Platform overview</h2>
        <p className="mt-2 text-sm text-slate-400">
          Monitor teacher accounts, live sign-in status and configured plans.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Teachers"
          value={String(totalTeachers)}
          note="Registered"
        />
        <StatCard
          icon={Clock3}
          label="Deactivated"
          value={String(inactive)}
          note="Access disabled"
        />
        <StatCard
          icon={UserCheck}
          label="Active Teachers"
          value={String(active)}
          note="Can use dashboard"
        />
        <StatCard
          icon={CreditCard}
          label="Configured Plans"
          value={String(plans.length)}
          note="Configured"
        />
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold">Admin workflow</h3>
            <p className="mt-1 text-xs text-slate-500">
              Manage teacher access and configured plans.
            </p>
          </div>
          <Link
            to="teachers"
            className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold"
          >
            Manage Teachers
          </Link>
        </div>
      </div>
    </main>
  );
}

function Teachers() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => subscribeTeachers((items) => setRows(sortTeachers(items)), (error) => setError(getFriendlyErrorMessage(error, "We couldn't load teacher accounts. Refresh the page and try again."))), []);

  const filteredRows = rows.filter((teacher) => {
    const value = query.toLowerCase();
    const name = (teacher.name || "").toLowerCase();
    const email = (teacher.email || "").toLowerCase();
    const phone = (teacher.phone || "").toLowerCase();

    return (
      name.includes(value) || email.includes(value) || phone.includes(value)
    );
  });

  const update = async (email, status) => {
    const nextRows = sortTeachers(
      rows.map((teacher) =>
        (teacher.email || "").toLowerCase() === email.toLowerCase()
          ? {
              ...teacher,
              status,
              approvedAt:
                status === "approved"
                  ? new Date().toISOString()
                  : teacher.approvedAt,
            }
          : teacher,
      ),
    );

    const teacher = rows.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (!teacher?.uid) return;
    try {
      await setTeacherStatus(teacher.uid, status);
      setRows(nextRows);
      setError("");
    } catch (error) {
      setError(getFriendlyErrorMessage(error, "We couldn't update this teacher's access. Please try again."));
    }
  };

  const remove = async (email) => {
    const nextRows = sortTeachers(
      rows.filter(
        (teacher) =>
          (teacher.email || "").toLowerCase() !== email.toLowerCase(),
      ),
    );

    const teacher = rows.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (!teacher?.uid) return;
    try {
      await removeTeacher(teacher.uid);
      setRows(nextRows);
      setDeleteTarget(null);
      setError("");
    } catch (error) {
      setError(getFriendlyErrorMessage(error, "We couldn't delete this teacher. Please try again."));
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-8">
      <div className="mb-7">
        <h2 className="text-2xl font-bold">Teachers</h2>
        <p className="mt-1 text-sm text-slate-500">
          Teachers can sign in directly. Deactivate an account to pause access.
        </p>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] px-4 py-3">
        <Search size={18} className="text-slate-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search teacher by name, email or phone..."
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[.03]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-white/10">
            <tr>
              {[
                "Teacher",
                "Email",
                "Phone",
                "Live",
                "Status",
                "Applied",
                "Actions",
              ].map((header) => (
                <th key={header} className="px-5 py-4 text-slate-400">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-8 text-center text-slate-500"
                >
                  No teacher accounts found.
                </td>
              </tr>
            )}

            {filteredRows.map((teacher) => (
              <tr
                key={teacher.email}
                className="border-b border-white/5 last:border-0"
              >
                <td className="px-5 py-5">
                  <p className="font-semibold">{teacher.name}</p>
                </td>
                <td className="px-5 py-5 text-slate-300">{teacher.email}</td>
                <td className="px-5 py-5 text-slate-300">
                  <span className="inline-flex items-center gap-2">
                    <Phone size={14} className="text-slate-500" />
                    {teacher.phone || "Not added"}
                  </span>
                </td>
                <td className="px-5 py-5">
                  <span className={`inline-flex items-center gap-2 ${isTeacherOnline(teacher) ? "text-emerald-400" : "text-rose-400"}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${isTeacherOnline(teacher) ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]" : "bg-rose-400"}`} />
                    {isTeacherOnline(teacher) ? "Online" : "Offline"}
                  </span>
                </td>
                <td className="px-5 py-5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      teacher.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : teacher.status === "suspended"
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {teacher.status === "suspended" ? "Deactivated" : teacher.status === "approved" ? "Active" : "Pending"}
                  </span>
                </td>
                <td className="px-5 py-5 text-slate-500">
                  {toDate(teacher.createdAt || teacher.date)?.toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  ) || "—"}
                </td>
                <td className="px-5 py-5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => update(teacher.email, teacher.status === "suspended" ? "approved" : "suspended")}
                      className={`rounded-lg p-2 ${teacher.status === "suspended" ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"}`}
                      title={teacher.status === "suspended" ? "Reactivate teacher" : "Deactivate teacher"}
                      aria-label={teacher.status === "suspended" ? "Reactivate teacher" : "Deactivate teacher"}
                    >
                      <Power size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(teacher)}
                      className="rounded-lg bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20"
                      title="Delete teacher"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name || "this teacher"}?`}
        message="This teacher profile will be permanently deleted from the database. This action cannot be undone. Are you sure?"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => remove(deleteTarget.email)}
      />
    </main>
  );
}

function SupportInbox() {
  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => subscribeSupportThreads((items) => {
    setThreads(items);
    setSelectedId((current) => current || items[0]?.id || "");
  }, (loadError) => setError(getFriendlyErrorMessage(loadError, "We couldn't load support requests. Refresh the page and try again."))), []);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return undefined; }
    return subscribeSupportMessages(selectedId, setMessages, (loadError) => setError(getFriendlyErrorMessage(loadError, "We couldn't load this conversation. Refresh the page and try again.")));
  }, [selectedId]);

  const selectedThread = threads.find((thread) => thread.id === selectedId);

  const sendReply = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !selectedId || sending) return;
    setSending(true);
    setError("");
    try {
      await sendAdminSupportMessage(selectedId, draft);
      setDraft("");
    } catch (sendError) {
      setError(getFriendlyErrorMessage(sendError, "We couldn't send your reply. Please try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Teacher Support</h2>
        <p className="mt-1 text-sm text-slate-500">Review deactivated teacher messages and reply in their contact thread.</p>
      </div>
      {error && <p className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      <div className="grid min-h-[560px] overflow-hidden rounded-2xl border border-white/10 bg-white/[.03] md:grid-cols-[300px,1fr]">
        <aside className="border-b border-white/10 md:border-b-0 md:border-r">
          <div className="border-b border-white/10 p-4 font-semibold">Support requests ({threads.length})</div>
          <div className="max-h-[560px] overflow-y-auto">
            {threads.length === 0 && <p className="p-5 text-sm text-slate-500">No teacher messages yet.</p>}
            {threads.map((thread) => (
              <button key={thread.id} type="button" onClick={() => setSelectedId(thread.id)} className={`w-full border-b border-white/5 p-4 text-left hover:bg-white/[.04] ${selectedId === thread.id ? "bg-indigo-500/10" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-white">{thread.teacherName || "Teacher"}</span>
                  {thread.lastSender === "teacher" && <span className="h-2 w-2 rounded-full bg-indigo-400" title="New teacher message" />}
                </div>
                <p className="mt-1 truncate text-xs text-slate-400">{thread.lastMessage || "No messages"}</p>
              </button>
            ))}
          </div>
        </aside>
        <section className="flex min-h-[560px] flex-col">
          {selectedThread ? <>
            <header className="border-b border-white/10 p-4">
              <h3 className="font-bold">{selectedThread.teacherName || "Teacher"}</h3>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>{selectedThread.email || "No email"}</span>
                <span>{selectedThread.phone || "No phone number"}</span>
              </div>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((item) => <div key={item.id} className={`max-w-[85%] rounded-2xl px-4 py-3 ${item.sender === "admin" ? "ml-auto bg-indigo-500/20" : "bg-white/[.07]"}`}>
                <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">{item.sender === "admin" ? "Admin" : "Teacher"}</p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-100">{item.message}</p>
                {item.createdAt && <p className="mt-2 text-right text-[10px] text-slate-500">{(item.createdAt.toDate?.() || new Date(item.createdAt)).toLocaleString()}</p>}
              </div>)}
              {messages.length === 0 && <p className="py-10 text-center text-sm text-slate-500"><LifeBuoy className="mx-auto mb-2" />No messages in this thread yet.</p>}
            </div>
            <form onSubmit={sendReply} className="flex gap-3 border-t border-white/10 p-4">
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Write a reply to the teacher..." className="flex-1 resize-y rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-indigo-500/50" />
              <button disabled={sending || !draft.trim()} className="inline-flex items-center gap-2 self-end rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold disabled:opacity-50"><Send size={16} /> Reply</button>
            </form>
          </> : <div className="grid flex-1 place-items-center p-6 text-sm text-slate-500">Select a support request to view the conversation.</div>}
        </section>
      </div>
    </main>
  );
}

function Notifications() {
  const [rows, setRows] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => subscribeNotifications(setRows, (error) => setError(getFriendlyErrorMessage(error, "We couldn't load notifications. Refresh the page and try again."))), []);
  const [teachers, setTeachers] = useState([]);
  useEffect(() => subscribeTeachers(setTeachers, (error) => setError(getFriendlyErrorMessage(error, "We couldn't load teacher accounts. Refresh the page and try again."))), []);
  const recipients = [{ value: "All Teachers", label: "All Teachers" }, ...teachers.filter((teacher) => teacher.status === "approved").map((teacher) => ({ value: teacher.uid || teacher.id, label: `${teacher.name || teacher.displayName || "Teacher"} (${teacher.email || "No email"})` }))];
  const [form, setForm] = useState({
    recipient: "All Teachers",
    message: "",
  });

  const sendNotification = async (target) => {
    if (!form.message.trim()) {
      setError("Write a message before sending the notification.");
      return;
    }
    if (target === "specific" && form.recipient === "All Teachers") {
      setError("Choose a teacher before sending a specific notification.");
      return;
    }
    if (target === "specific" && !teachers.some((teacher) => (teacher.uid || teacher.id) === form.recipient && teacher.status === "approved")) {
      setError("That teacher account is no longer active. Choose an active teacher and try again.");
      return;
    }

    const nextEntry = {
      id: `${Date.now()}`,
      recipient: target === "all" ? "All Teachers" : teachers.find((teacher) => (teacher.uid || teacher.id) === form.recipient)?.name || "Teacher",
      ...(target === "specific" ? { recipientId: form.recipient } : {}),
      targetType: target,
      message: form.message.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      await createNotification(nextEntry);
      setForm({ recipient: "All Teachers", message: "" });
      setError("");
    } catch (error) {
      setError(getFriendlyErrorMessage(error, "We couldn't send this notification. Please try again."));
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-5 md:p-8">
      <div className="mb-7">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="mt-1 text-sm text-slate-500">
          Send a message to all teachers or a specific teacher.
        </p>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
          <label className="mb-2 block text-sm text-slate-300">Recipient</label>
          <select
            value={form.recipient}
            onChange={(event) =>
              setForm({ ...form, recipient: event.target.value })
            }
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50"
          >
            {recipients.map((recipient) => (
              <option key={recipient.value} value={recipient.value}>
                {recipient.label}
              </option>
            ))}
          </select>

          <label className="mb-2 mt-5 block text-sm text-slate-300">
            Notification message
          </label>
          <textarea
            value={form.message}
            onChange={(event) =>
              setForm({ ...form, message: event.target.value })
            }
            rows={6}
            placeholder="Write your message here..."
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50"
          />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => sendNotification("all")}
              className="flex-1 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold hover:bg-indigo-400"
            >
              Send to all
            </button>
            <button
              type="button"
              onClick={() => sendNotification("specific")}
              className="flex-1 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/20"
            >
              Send to selected teacher
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
          <h3 className="mb-4 text-lg font-semibold">Recent notifications</h3>
          <div className="space-y-3">
            {rows.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-400">
                No notification sent yet.
              </div>
            )}

            {rows.map((notification) => (
              <div
                key={notification.id}
                className="rounded-xl border border-white/10 bg-slate-900/40 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
                    {notification.targetType === "all"
                      ? "All teachers"
                      : notification.recipient}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {toDate(notification.createdAt)?.toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) || "—"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(notification)}
                    className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10"
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm leading-6 text-slate-200">
                  {notification.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this notification?"
        message="This notification will be permanently removed from the admin list and teacher inboxes. This action cannot be undone. Are you sure?"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try {
            await deleteNotificationEverywhere(deleteTarget.id);
            setDeleteTarget(null);
            setError("");
          } catch (error) {
            setError(getFriendlyErrorMessage(error, "We couldn't delete this notification. Please try again."));
          }
        }}
      />
    </main>
  );
}

function Complaints() {
  const [rows, setRows] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => subscribeComplaints(null, setRows, (error) => setError(getFriendlyErrorMessage(error, "We couldn't load complaints. Refresh the page and try again."))), []);

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-8">
      <div className="mb-7">
        <h2 className="text-2xl font-bold">Complaints</h2>
        <p className="mt-1 text-sm text-slate-500">
          Review all student and class complaints reported by teachers.
        </p>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[.03]">
            <tr>
              {["Reporter", "Student", "Complaint", "Date", "Actions"].map((header) => (
                <th
                  key={header}
                  className="px-5 py-4 font-semibold text-slate-400"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-slate-500"
                >
                  No complaints reported yet.
                </td>
              </tr>
            )}

            {rows.map((complaint) => (
              <tr
                key={complaint.id}
                className="border-b border-white/5 last:border-0 hover:bg-white/[.02]"
              >
                <td className="px-5 py-4 text-slate-300">
                  {complaint.reporterName || "Teacher"}
                </td>
                <td className="px-5 py-4 text-slate-300">
                  {complaint.studentName || "Unknown student"}
                </td>
                <td className="px-5 py-4 text-slate-300">
                  <div className="font-medium text-white">
                    {complaint.title || "Complaint"}
                  </div>
                  <div className="mt-1 text-slate-400">
                    {complaint.details || "No details provided."}
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-500">
                  {toDate(complaint.createdAt)?.toLocaleString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  ) || "—"}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(complaint)}
                    className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10"
                    title="Delete complaint"
                    aria-label="Delete complaint"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this complaint?"
        message="This complaint will be permanently removed from the database. This action cannot be undone. Are you sure?"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try {
            await deleteComplaint(deleteTarget.id);
            setDeleteTarget(null);
            setError("");
          } catch (error) {
            setError(getFriendlyErrorMessage(error, "We couldn't delete this complaint. Please try again."));
          }
        }}
      />
    </main>
  );
}

function Payments() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", studentLimit: "", durationDays: "", price: "" });
  useEffect(() => subscribePlans(setPlans, (error) => setError(getFriendlyErrorMessage(error, "We couldn't load plans. Refresh the page and try again."))), []);

  const addPlan = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.studentLimit || !form.durationDays || !form.price.trim()) {
      setError("Enter a plan name, student limit, duration and price before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await savePlan({
        name: form.name.trim(),
        studentLimit: Number(form.studentLimit),
        durationDays: Number(form.durationDays),
        price: form.price.trim(),
        active: true,
      });
      setForm({ name: "", studentLimit: "", durationDays: "", price: "" });
    } catch (error) {
      setError(getFriendlyErrorMessage(error, "We couldn't save this plan. Please check your connection and try again."));
    } finally {
      setSaving(false);
    }
  };

  const togglePlan = async (plan) => {
    try {
      await savePlan({ ...plan, active: plan.active === false });
      setError("");
    } catch (error) {
      setError(getFriendlyErrorMessage(error, "We couldn't update this plan. Please try again."));
    }
  };

  const removePlan = async (plan) => {
    try {
      await deletePlan(plan.id);
      setDeleteTarget(null);
      setError("");
    } catch (error) {
      setError(getFriendlyErrorMessage(error, "We couldn't delete this plan. Please try again."));
    }
  };

  return <main className="mx-auto max-w-7xl p-5 md:p-8">
    <div className="mb-7"><h2 className="text-2xl font-bold">Teacher Plans</h2><p className="mt-1 text-sm text-slate-500">Plans are saved in Firestore and update here in real time.</p></div>
    {error && <p role="alert" className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
    <form onSubmit={addPlan} className="mb-7 grid gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-5 sm:grid-cols-2 lg:grid-cols-5">
      <input aria-label="Plan name" placeholder="Plan name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50" />
      <input aria-label="Student limit" type="number" min="1" placeholder="Student limit" value={form.studentLimit} onChange={(event) => setForm({ ...form, studentLimit: event.target.value })} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50" />
      <input aria-label="Duration in days" type="number" min="1" placeholder="Duration in days" value={form.durationDays} onChange={(event) => setForm({ ...form, durationDays: event.target.value })} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50" />
      <input aria-label="Price" placeholder="Price (for example, Free)" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50" />
      <button disabled={saving} className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold hover:bg-indigo-400 disabled:opacity-60">{saving ? "Saving…" : "Add plan"}</button>
    </form>
    {plans.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[.03] p-6 text-sm text-slate-400">No plans are configured yet. Add a plan above to save it to the database.</div> : <div className="grid gap-4 md:grid-cols-3">{plans.map((plan) => <article key={plan.id} className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{plan.name}</h3><span className={`rounded-full px-2.5 py-1 text-xs ${plan.active === false ? "bg-slate-500/10 text-slate-400" : "bg-emerald-500/10 text-emerald-300"}`}>{plan.active === false ? "Inactive" : "Active"}</span></div>
      <div className="mt-6 space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Student limit</span><b>{plan.studentLimit}</b></div><div className="flex justify-between"><span className="text-slate-500">Duration</span><b>{plan.durationDays} days</b></div><div className="flex justify-between"><span className="text-slate-500">Price</span><b>{plan.price}</b></div></div>
      <div className="mt-6 flex gap-2"><button type="button" onClick={() => togglePlan(plan)} className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">{plan.active === false ? "Activate" : "Deactivate"}</button><button type="button" onClick={() => setDeleteTarget(plan)} className="rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10">Delete</button></div>
    </article>)}</div>}
    <p className="mt-5 rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-sm leading-6 text-amber-200/80">Plans are stored for administration. Payments and automatic student-limit enforcement are not enabled.</p>
    <ConfirmDialog open={Boolean(deleteTarget)} title={`Delete ${deleteTarget?.name || "this plan"}?`} message="This plan will be permanently removed from Firestore. This action cannot be undone. Are you sure?" onCancel={() => setDeleteTarget(null)} onConfirm={() => removePlan(deleteTarget)} />
  </main>;
}

function AdminSettings() {
  return <main className="mx-auto max-w-4xl p-5 md:p-8"><h2 className="text-2xl font-bold">Admin Settings</h2><p className="mt-2 text-sm leading-6 text-slate-400">Administrator access is checked against the configured Firebase account and Firestore security rules. Teacher records, support messages and plans are stored in Cloud Firestore.</p><div className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-5"><h3 className="font-semibold">Sign-in providers</h3><p className="mt-2 text-sm leading-6 text-slate-400">Email and Google sign-in must be enabled in Firebase Authentication. To allow this deployed website to sign in, add its domain to Firebase Authentication's authorized domains.</p></div></main>;
}
