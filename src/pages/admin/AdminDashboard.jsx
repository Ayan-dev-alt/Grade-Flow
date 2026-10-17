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
  return [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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
          Monitor active teachers, account access and subscription usage.
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
          label="Paid Plans"
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
                  No teacher requests found.
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
                    {teacher.status === "suspended" ? "Deactivated" : "Active"}
                  </span>
                </td>
                <td className="px-5 py-5 text-slate-500">
                  {new Date(teacher.date || Date.now()).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  )}
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
  }, (loadError) => setError(loadError.message || "Could not load support threads.")), []);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return undefined; }
    return subscribeSupportMessages(selectedId, setMessages, (loadError) => setError(loadError.message || "Could not load messages."));
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
      setError(sendError.message || "Could not send reply.");
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
  useEffect(() => subscribeNotifications(setRows, (error) => console.error("Could not load notifications", error)), []);
  const [teachers, setTeachers] = useState([]);
  useEffect(() => subscribeTeachers(setTeachers, (error) => console.error("Could not load teachers", error)), []);
  const recipients = ["All Teachers", ...teachers.map((teacher) => teacher.name)];
  const [form, setForm] = useState({
    recipient: "All Teachers",
    message: "",
  });

  const sendNotification = (target) => {
    if (!form.message.trim()) return;

    const nextEntry = {
      id: `${Date.now()}`,
      recipient: target === "all" ? "All Teachers" : form.recipient,
      targetType: target,
      message: form.message.trim(),
      createdAt: new Date().toISOString(),
    };

    createNotification(nextEntry).catch((error) => console.error("Could not send notification", error));
    setForm({ recipient: "All Teachers", message: "" });
  };

  return (
    <main className="mx-auto max-w-5xl p-5 md:p-8">
      <div className="mb-7">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="mt-1 text-sm text-slate-500">
          Send a message to all teachers or a specific teacher.
        </p>
      </div>

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
              <option key={recipient} value={recipient}>
                {recipient}
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
                    {new Date(notification.createdAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
        onConfirm={() => {
          deleteNotificationEverywhere(deleteTarget.id).catch((error) => console.error("Could not delete notification", error));
          setDeleteTarget(null);
        }}
      />
    </main>
  );
}

function Complaints() {
  const [rows, setRows] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  useEffect(() => subscribeComplaints(null, setRows, (error) => console.error("Could not load complaints", error)), []);

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-8">
      <div className="mb-7">
        <h2 className="text-2xl font-bold">Complaints</h2>
        <p className="mt-1 text-sm text-slate-500">
          Review all student and class complaints reported by teachers.
        </p>
      </div>

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
                  {new Date(complaint.createdAt || Date.now()).toLocaleString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
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
        onConfirm={() => {
          deleteComplaint(deleteTarget.id).catch((error) => console.error("Could not delete complaint", error));
          setDeleteTarget(null);
        }}
      />
    </main>
  );
}

function Payments() {
  const [plans] = useState([
    { name: "Starter", students: 100, days: 30, price: "Free" },
    { name: "Pro", students: 500, days: 90, price: "Custom" },
    { name: "Unlimited", students: "∞", days: 365, price: "Custom" },
  ]);

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-8">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plans & Payments</h2>
          <p className="mt-1 text-sm text-slate-500">
            Configure usage limits. Connect your own payment/database logic
            later.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold"
        >
          <Plus size={17} /> Add Plan
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <CreditCard className="text-indigo-400" size={20} />
            </div>
            <div className="mt-7 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Student limit</span>
                <b>{plan.students}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration</span>
                <b>{plan.days} days</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price</span>
                <b>{plan.price}</b>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-amber-500/10 bg-amber-500/5 p-5 text-sm text-amber-200/70">
        <ShieldCheck className="mb-2 text-amber-400" size={20} />
        Database/payment integration intentionally left as structure only, as
        requested.
      </div>
    </main>
  );
}
