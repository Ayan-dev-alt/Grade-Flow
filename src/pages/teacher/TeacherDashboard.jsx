import { useEffect, useMemo, useState, useRef } from "react";
import { Routes, Route, Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Plus,
  Bell,
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Trash2,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import StatCard from "../../components/StatCard";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useAuthSession, subscribeTeacherData, saveTeacherData, subscribeComplaints, submitComplaint, subscribeTeacherNotifications, deleteTeacherNotification, markTeacherNotificationRead, startTeacherPresence, getFriendlyErrorMessage } from "../../firebase/firebase";

const defaultData = { className: "", subjects: [], students: [] };

function makeEmptyMarks(subjects) {
  return Object.fromEntries(subjects.map((subject) => [subject.id, ""]));
}

function gradeFromPercentage(value) {
  if (value >= 90) return "A+";
  if (value >= 80) return "A";
  if (value >= 70) return "B";
  if (value >= 60) return "C";
  if (value >= 50) return "D";
  return "F";
}

function getStudentSummary(student, subjects) {
  const entries = subjects.map((subject) => {
    const obtained = Number(student.marks?.[subject.id] ?? 0);
    return {
      ...subject,
      obtained,
      isPass: obtained >= subject.passingMarks,
      totalMarks: subject.totalMarks,
      percentage: subject.totalMarks
        ? (obtained / subject.totalMarks) * 100
        : 0,
    };
  });

  const totalObtained = entries.reduce((sum, item) => sum + item.obtained, 0);
  const totalPossible = entries.reduce((sum, item) => sum + item.totalMarks, 0);
  const percentage = totalPossible ? (totalObtained / totalPossible) * 100 : 0;
  const isPass = entries.every((item) => item.isPass);
  const grade = gradeFromPercentage(percentage);

  return {
    entries,
    totalObtained,
    totalPossible,
    percentage,
    isPass,
    grade,
  };
}

export default function TeacherDashboard() {
  const { user, profile } = useAuthSession();
  const uid = user?.uid;
  const [teacherData, setTeacherData] = useState(defaultData);
  const [complaints, setComplaints] = useState([]);
  const [dataError, setDataError] = useState("");
  const ready = useRef(false);
  const lastSaved = useRef("");

  useEffect(() => {
    if (!uid) return;
    const stopPresence = startTeacherPresence(uid);
    const stopData = subscribeTeacherData(uid, (data) => {
      const normalized = { ...defaultData, ...data, subjects: data.subjects || [], students: data.students || [] };
      lastSaved.current = JSON.stringify(normalized);
      ready.current = true;
      setTeacherData(normalized);
    }, (error) => setDataError(getFriendlyErrorMessage(error, "We couldn't load your class records. Refresh the page and try again.")));
    const stopComplaints = subscribeComplaints(uid, setComplaints, (error) => setDataError(getFriendlyErrorMessage(error, "We couldn't load your complaints. Refresh the page and try again.")));
    return () => { stopData(); stopComplaints(); stopPresence(); };
  }, [uid]);

  useEffect(() => {
    if (!uid || !ready.current) return;
    const serialized = JSON.stringify(teacherData);
    if (serialized === lastSaved.current) return;
    const timer = setTimeout(() => {
      saveTeacherData(uid, teacherData).then(() => { lastSaved.current = serialized; })
        .then(() => setDataError(""))
        .catch((error) => setDataError(getFriendlyErrorMessage(error, "Your changes couldn't be saved. Check your connection and try again.")));
    }, 350);
    return () => clearTimeout(timer);
  }, [uid, teacherData]);

  const addStudent = (student) => {
    const nextStudent = {
      id: student.rollNo || `${Date.now()}`,
      rollNo: student.rollNo,
      name: student.name,
      className: student.className,
      section: student.section,
      gender: student.gender,
      marks: makeEmptyMarks(teacherData.subjects),
    };

    setTeacherData((previous) => ({
      ...previous,
      students: [...previous.students, nextStudent],
    }));
  };

  const addSubject = (subject) => {
    const normalized = {
      id: (subject.name || "subject").toLowerCase().replace(/\s+/g, "-"),
      name: subject.name,
      totalMarks: Number(subject.totalMarks) || 100,
      passingMarks: Number(subject.passingMarks) || 40,
    };

    setTeacherData((previous) => ({
      ...previous,
      subjects: [...previous.subjects, normalized],
      students: previous.students.map((student) => ({
        ...student,
        marks: {
          ...student.marks,
          [normalized.id]: student.marks?.[normalized.id] ?? "",
        },
      })),
    }));
  };

  const updateStudentMarks = (studentId, subjectId, value) => {
    setTeacherData((previous) => ({
      ...previous,
      students: previous.students.map((student) =>
        student.id === studentId
          ? {
              ...student,
              marks: {
                ...student.marks,
                [subjectId]: value,
              },
            }
          : student,
      ),
    }));
  };

  const deleteStudent = (studentId) => {
    setTeacherData((previous) => ({
      ...previous,
      students: previous.students.filter((student) => student.id !== studentId),
    }));
  };

  const deleteSubject = (subjectId) => {
    setTeacherData((previous) => ({
      ...previous,
      subjects: previous.subjects.filter((subject) => subject.id !== subjectId),
      students: previous.students.map((student) => {
        const nextMarks = { ...student.marks };
        delete nextMarks[subjectId];
        return { ...student, marks: nextMarks };
      }),
    }));
  };

  const addComplaint = async (complaint) => {
    try {
      await submitComplaint(uid, { ...complaint, reporterName: user?.displayName || "Teacher" });
      setDataError("");
      return true;
    } catch (error) {
      setDataError(getFriendlyErrorMessage(error, "Your complaint couldn't be sent. Check your connection and try again."));
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        {dataError && <div role="alert" className="mx-5 mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm leading-6 text-rose-200">{dataError}</div>}
        <Routes>
          <Route index element={<Overview teacherData={teacherData} />} />
          <Route
            path="students"
            element={
              <Students
                students={teacherData.students}
                className={teacherData.className}
                onAddStudent={addStudent}
                onDeleteStudent={deleteStudent}
              />
            }
          />
          <Route
            path="subjects"
            element={
              <Subjects
                subjects={teacherData.subjects}
                onAddSubject={addSubject}
                onDeleteSubject={deleteSubject}
              />
            }
          />
          <Route
            path="results"
            element={
              <Results
                students={teacherData.students}
                subjects={teacherData.subjects}
                onUpdateMarks={updateStudentMarks}
              />
            }
          />
          <Route
            path="reports"
            element={
              <Reports
                students={teacherData.students}
                subjects={teacherData.subjects}
              />
            }
          />
          <Route
            path="complaints"
            element={
              <Complaints
                students={teacherData.students}
                complaints={complaints}
                onAddComplaint={addComplaint}
              />
            }
          />
          <Route
            path="settings"
            element={
              <Settings
                teacherData={teacherData}
                setTeacherData={setTeacherData}
              />
            }
          />
        </Routes>
      </div>
    </div>
  );
}

function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notificationError, setNotificationError] = useState("");
  const { user: currentUser } = useAuthSession();
  const currentName = currentUser?.displayName || "Teacher";

  const [allNotifications, setAllNotifications] = useState([]);
  useEffect(() => {
    if (!currentUser?.uid) {
      setAllNotifications([]);
      return undefined;
    }
    return subscribeTeacherNotifications(currentUser.uid, setAllNotifications, (error) => setNotificationError(getFriendlyErrorMessage(error, "We couldn't load your notifications. Refresh the page and try again.")));
  }, [currentUser?.uid]);
  const notifications = useMemo(() => allNotifications.filter((item) => item.targetType === "all" || item.recipient?.toLowerCase() === currentName.toLowerCase()), [allNotifications, currentName]);
  const unreadNotifications = useMemo(() => notifications.filter((item) => !item.readAt), [notifications]);

  useEffect(() => {
    if (!showNotifications || !currentUser?.uid) return;
    unreadNotifications.forEach((notification) => {
      markTeacherNotificationRead(currentUser.uid, notification.id)
        .catch((error) => setNotificationError(getFriendlyErrorMessage(error, "We couldn't update this notification. Please try again.")));
    });
  }, [showNotifications, currentUser?.uid, unreadNotifications]);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 px-5 py-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Teacher Workspace</p>
          <h1 className="text-lg font-bold">GradeFlow Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((current) => !current)}
              className="relative rounded-xl border border-white/10 p-2.5 text-slate-400"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadNotifications.length > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 z-30 w-80 rounded-2xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl shadow-black/30">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">
                    Notifications
                  </p>
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">
                    {unreadNotifications.length} unread
                  </span>
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {notifications.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/[.02] p-3 text-sm text-slate-400">
                      No notifications yet.
                    </div>
                  )}

                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-sm text-slate-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-white">
                          {notification.targetType === "all"
                            ? "All teachers"
                            : notification.recipient}
                        </p>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(notification)}
                          className="rounded-md p-1 text-rose-400 hover:bg-rose-500/10"
                          title="Delete notification"
                          aria-label="Delete notification"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <p className="mt-1 leading-6 text-slate-300">
                        {notification.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="hidden h-9 w-9 place-items-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300 sm:grid">
            {currentName.slice(0, 2).toUpperCase() || "TA"}
          </div>
        </div>
      </div>
      {notificationError && <p role="alert" className="mx-auto mt-3 max-w-7xl text-sm text-rose-300">{notificationError}</p>}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this notification?"
        message="This notification will be permanently removed from your inbox. Other teachers will still have their own copy. Are you sure?"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteTeacherNotification(currentUser?.uid, deleteTarget.id).catch((error) => setNotificationError(getFriendlyErrorMessage(error, "We couldn't delete this notification. Please try again.")));
          setDeleteTarget(null);
        }}
      />
    </header>
  );
}

function Overview({ teacherData }) {
  const totalStudents = teacherData.students.length;
  const totalSubjects = teacherData.subjects.length;
  const passedStudents = teacherData.students.filter(
    (student) => getStudentSummary(student, teacherData.subjects).isPass,
  ).length;
  const passRate = totalStudents
    ? ((passedStudents / totalStudents) * 100).toFixed(1)
    : 0;

  return (
    <main className="mx-auto max-w-7xl space-y-7 p-5 md:p-8">
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/20 via-slate-900 to-violet-600/10 p-7 md:p-9">
        <div className="relative">
          <p className="text-sm text-indigo-300">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          <h2 className="mt-2 text-3xl font-black md:text-4xl">
            Welcome back, Teacher 👋
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Manage classes, configure subjects, track student results and rank
            performance from one dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="students"
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold hover:bg-indigo-400"
            >
              <Plus size={17} /> Add Student
            </Link>
            <Link
              to="results"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10"
            >
              <ClipboardList size={17} /> Create Result
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={String(totalStudents)}
          note={teacherData.className}
        />
        <StatCard
          icon={BookOpen}
          label="Total Subjects"
          value={String(totalSubjects)}
          note="Configured"
        />
        <StatCard
          icon={CheckCircle2}
          label="Pass Rate"
          value={`${passRate}%`}
          note="This class"
        />
        <StatCard
          icon={GraduationCap}
          label="Classes"
          value={teacherData.className}
          note="Active"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Performance Overview</h3>
              <p className="mt-1 text-xs text-slate-500">
                Current class result trend
              </p>
            </div>
            <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
              +{passRate}%
            </span>
          </div>
          <div className="mt-8 flex h-48 items-end gap-2">
            {[32, 45, 38, 61, 54, 73, 68, 84, 76, 92, 87, 98].map(
              (height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-lg bg-indigo-500/40 transition hover:bg-indigo-400/70"
                  style={{ height: `${height}%` }}
                />
              ),
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-bold">Quick Actions</h3>
          <div className="mt-5 space-y-2">
            {[
              ["Add Student", Users, "students"],
              ["Add Subject", BookOpen, "subjects"],
              ["Generate Result", ClipboardList, "results"],
              ["View Reports", TrendingUp, "reports"],
              ["Submit Complaint", AlertCircle, "complaints"],
            ].map(([label, Icon, path]) => (
              <Link
                key={label}
                to={path}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[.03] p-3 text-sm text-slate-300 hover:bg-white/[.06]"
              >
                <Icon size={17} className="text-indigo-400" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function Students({ students, className, onAddStudent, onDeleteStudent }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    rollNo: "",
    name: "",
    className,
    section: "A",
    gender: "Male",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.rollNo || !form.name) return;
    onAddStudent(form);
    setForm({
      rollNo: "",
      name: "",
      className,
      section: form.section,
      gender: form.gender,
    });
  };

  return (
    <>
    <main className="mx-auto max-w-7xl p-5 md:p-8">
      <div className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Users />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Students</h2>
            <p className="text-sm text-slate-500">
              Manage class roster and roll numbers.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-7 rounded-2xl border border-white/10 bg-white/[.03] p-5">
        <h3 className="mb-4 text-lg font-semibold">Add new student</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5">
          <input
            value={form.rollNo}
            onChange={(event) =>
              setForm({ ...form, rollNo: event.target.value })
            }
            placeholder="Roll No"
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50"
          />
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Student name"
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50 md:col-span-2"
          />
          <input
            value={form.className}
            onChange={(event) =>
              setForm({ ...form, className: event.target.value })
            }
            placeholder="Class"
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50"
          />
          <input
            value={form.section}
            onChange={(event) =>
              setForm({ ...form, section: event.target.value })
            }
            placeholder="Section"
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50"
          />
          <select
            value={form.gender}
            onChange={(event) =>
              setForm({ ...form, gender: event.target.value })
            }
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50 md:col-span-1"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold hover:bg-indigo-400 md:col-span-5"
          >
            <Plus size={17} /> Add Student
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[.03]">
            <tr>
              {["Roll No", "Name", "Class", "Section", "Gender", "Action"].map(
                (header) => (
                  <th
                    key={header}
                    className="px-5 py-4 font-semibold text-slate-400"
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-8 text-center text-slate-500"
                >
                  No students added yet. Add a student to start the class
                  roster.
                </td>
              </tr>
            )}

            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b border-white/5 last:border-0 hover:bg-white/[.02]"
              >
                <td className="px-5 py-4 text-slate-300">{student.rollNo}</td>
                <td className="px-5 py-4 text-slate-300">{student.name}</td>
                <td className="px-5 py-4 text-slate-300">
                  {student.className}
                </td>
                <td className="px-5 py-4 text-slate-300">{student.section}</td>
                <td className="px-5 py-4 text-slate-300">{student.gender}</td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(student)}
                    className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20"
                    title="Delete student"
                    aria-label={`Delete ${student.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
    <ConfirmDialog
      open={Boolean(deleteTarget)}
      title={`Delete ${deleteTarget?.name || "this student"}?`}
      message="This student and their saved marks will be permanently deleted. This action cannot be undone. Are you sure?"
      onCancel={() => setDeleteTarget(null)}
      onConfirm={() => { onDeleteStudent(deleteTarget.id); setDeleteTarget(null); }}
    />
    </>
  );
}

function Subjects({ subjects, onAddSubject, onDeleteSubject }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    name: "",
    totalMarks: "100",
    passingMarks: "40",
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name) return;
    onAddSubject(form);
    setForm({ name: "", totalMarks: "100", passingMarks: "40" });
  };

  return (
    <>
    <main className="mx-auto max-w-7xl p-5 md:p-8">
      <div className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <BookOpen />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Subjects</h2>
            <p className="text-sm text-slate-500">
              Configure subject marks and pass criteria.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-7 rounded-2xl border border-white/10 bg-white/[.03] p-5">
        <h3 className="mb-4 text-lg font-semibold">Add new subject</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Subject name"
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50 md:col-span-2"
          />
          <input
            type="number"
            value={form.totalMarks}
            onChange={(event) =>
              setForm({ ...form, totalMarks: event.target.value })
            }
            placeholder="Total marks"
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50"
          />
          <input
            type="number"
            value={form.passingMarks}
            onChange={(event) =>
              setForm({ ...form, passingMarks: event.target.value })
            }
            placeholder="Passing marks"
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold hover:bg-indigo-400 md:col-span-4"
          >
            <Plus size={17} /> Add Subject
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[.03]">
            <tr>
              {["#", "Subject", "Total Marks", "Passing Marks", "Action"].map(
                (header) => (
                  <th
                    key={header}
                    className="px-5 py-4 font-semibold text-slate-400"
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {subjects.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-slate-500"
                >
                  No subjects added yet. Add a subject to begin result
                  calculations.
                </td>
              </tr>
            )}

            {subjects.map((subject, index) => (
              <tr
                key={subject.id}
                className="border-b border-white/5 last:border-0 hover:bg-white/[.02]"
              >
                <td className="px-5 py-4 text-slate-300">
                  {String(index + 1).padStart(2, "0")}
                </td>
                <td className="px-5 py-4 text-slate-300">{subject.name}</td>
                <td className="px-5 py-4 text-slate-300">
                  {subject.totalMarks}
                </td>
                <td className="px-5 py-4 text-slate-300">
                  {subject.passingMarks}
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(subject)}
                    className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20"
                    title="Delete subject"
                    aria-label={`Delete ${subject.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
    <ConfirmDialog
      open={Boolean(deleteTarget)}
      title={`Delete ${deleteTarget?.name || "this subject"}?`}
      message="This subject and its marks will be permanently deleted from the teacher data. This action cannot be undone. Are you sure?"
      onCancel={() => setDeleteTarget(null)}
      onConfirm={() => { onDeleteSubject(deleteTarget.id); setDeleteTarget(null); }}
    />
    </>
  );
}

function Results({ students, subjects, onUpdateMarks }) {
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[0]?.id || "",
  );

  const selectedStudent =
    students.find((student) => student.id === selectedStudentId) || students[0];

  const marksState = useMemo(() => {
    const current = selectedStudent?.marks || {};
    return Object.fromEntries(
      subjects.map((subject) => [subject.id, current[subject.id] ?? ""]),
    );
  }, [selectedStudent, subjects]);

  const [draftMarks, setDraftMarks] = useState(marksState);

  useEffect(() => {
    setDraftMarks(marksState);
  }, [marksState]);

  const summary = useMemo(() => {
    if (!selectedStudent) return null;
    return getStudentSummary(selectedStudent, subjects);
  }, [selectedStudent, subjects]);

  const leaderboard = useMemo(() => {
    return [...students]
      .map((student) => ({
        ...student,
        summary: getStudentSummary(student, subjects),
      }))
      .sort((left, right) => {
        if (right.summary.percentage !== left.summary.percentage) {
          return right.summary.percentage - left.summary.percentage;
        }
        return right.summary.totalObtained - left.summary.totalObtained;
      })
      .map((student, index) => ({ ...student, position: index + 1 }));
  }, [students, subjects]);

  const selectedPosition =
    leaderboard.find((student) => student.id === selectedStudent?.id)
      ?.position || "-";

  const handleCalculate = () => {
    if (!selectedStudent) return;
    Object.entries(draftMarks).forEach(([subjectId, value]) => {
      onUpdateMarks(selectedStudent.id, subjectId, value);
    });
  };

  if (!selectedStudent) {
    return (
      <main className="mx-auto max-w-5xl p-5 md:p-8">
        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-8 text-center text-slate-500">
          Add a student before generating results.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-5 md:p-8">
      <h2 className="text-2xl font-bold">Result Generator</h2>
      <p className="mt-1 text-sm text-slate-500">
        Set marks, calculate result, check pass/fail and compare rankings.
      </p>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <label className="text-xs text-slate-500">Student</label>
          <select
            value={selectedStudentId}
            onChange={(event) => setSelectedStudentId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} — {student.rollNo}
              </option>
            ))}
          </select>

          <div className="mt-6 space-y-3">
            {subjects.map((subject) => (
              <div key={subject.id}>
                <label className="text-xs text-slate-500">
                  {subject.name} / {subject.totalMarks}
                </label>
                <input
                  type="number"
                  min="0"
                  max={subject.totalMarks}
                  value={draftMarks[subject.id] ?? ""}
                  onChange={(event) =>
                    setDraftMarks({
                      ...draftMarks,
                      [subject.id]: event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500/50"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCalculate}
            className="mt-5 w-full rounded-xl bg-indigo-500 py-3 font-semibold hover:bg-indigo-400"
          >
            Calculate Result
          </button>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/5 p-6">
          <p className="text-xs uppercase tracking-widest text-indigo-300">
            Result Preview
          </p>
          <h3 className="mt-4 text-2xl font-bold">{selectedStudent.name}</h3>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-xs text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-bold">
                {summary?.totalObtained ?? 0}/{summary?.totalPossible ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-xs text-slate-500">Percentage</p>
              <p className="mt-1 text-2xl font-bold">
                {summary ? `${summary.percentage.toFixed(1)}%` : "0.0%"}
              </p>
            </div>
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-xs text-slate-500">Grade</p>
              <p className="mt-1 text-2xl font-bold">{summary?.grade ?? "-"}</p>
            </div>
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-xs text-slate-500">Position</p>
              <p className="mt-1 text-2xl font-bold">#{selectedPosition}</p>
            </div>
          </div>

          <div
            className={`mt-4 rounded-xl p-4 text-sm ${summary?.isPass ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}
          >
            {summary?.isPass
              ? "Pass — promoted to next stage"
              : "Fail — needs improvement and re-assessment"}
          </div>

          <div className="mt-5 space-y-2">
            {summary?.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.02] px-3 py-2 text-sm"
              >
                <span className="text-slate-300">{entry.name}</span>
                <span
                  className={
                    entry.isPass ? "text-emerald-300" : "text-rose-300"
                  }
                >
                  {entry.obtained}/{entry.totalMarks}{" "}
                  {entry.isPass ? "Pass" : "Fail"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.03] p-5">
        <div className="mb-4 flex items-center gap-3">
          <Trophy className="text-amber-400" size={18} />
          <h3 className="text-lg font-bold">Class Position Board</h3>
        </div>
        <div className="space-y-2">
          {leaderboard.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm"
            >
              <div>
                <span className="font-semibold">#{person.position}</span>{" "}
                {person.name}
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <span className="text-slate-300">
                  {person.summary.totalObtained}/{person.summary.totalPossible} marks
                </span>
                <span>{person.summary.percentage.toFixed(1)}%</span>
                <span className="font-semibold text-indigo-300">Grade {person.summary.grade}</span>
                <span
                  className={
                    person.summary.isPass ? "text-emerald-300" : "text-rose-300"
                  }
                >
                  {person.summary.isPass ? "Pass" : "Fail"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function Reports({ students, subjects }) {
  const leaderboard = [...students]
    .map((student) => ({
      ...student,
      summary: getStudentSummary(student, subjects),
    }))
    .sort((left, right) => right.summary.percentage - left.summary.percentage);

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-8">
      <div className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <TrendingUp />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Reports</h2>
            <p className="text-sm text-slate-500">
              Results and performance ranking.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[.03]">
            <tr>
              {[
                "Position",
                "Student",
                "Class",
                "Total Marks",
                "Percentage",
                "Grade",
                "Status",
              ].map((header) => (
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
            {leaderboard.map((student, index) => (
              <tr
                key={student.id}
                className="border-b border-white/5 last:border-0 hover:bg-white/[.02]"
              >
                <td className="px-5 py-4 text-slate-300">#{index + 1}</td>
                <td className="px-5 py-4 text-slate-300">{student.name}</td>
                <td className="px-5 py-4 text-slate-300">
                  {student.className}
                </td>
                <td className="px-5 py-4 font-medium text-slate-200">
                  {student.summary.totalObtained}/{student.summary.totalPossible}
                </td>
                <td className="px-5 py-4 text-slate-300">
                  {student.summary.percentage.toFixed(1)}%
                </td>
                <td className="px-5 py-4 text-slate-300">
                  {student.summary.grade}
                </td>
                <td
                  className={`px-5 py-4 ${student.summary.isPass ? "text-emerald-300" : "text-rose-300"}`}
                >
                  {student.summary.isPass ? "Pass" : "Fail"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Complaints({ students, complaints, onAddComplaint }) {
  const { user, profile } = useAuthSession();
  const session = { ...profile, uid: user?.uid, displayName: user?.displayName || profile?.displayName, email: user?.email };
  const reporterName = session?.displayName || "Teacher";
  const [form, setForm] = useState({
    studentId: students[0]?.id || "",
    title: "",
    details: "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.studentId || !form.title || !form.details) return;

    const student = students.find((item) => item.id === form.studentId);

    const saved = await onAddComplaint({
      reporterName,
      studentId: form.studentId,
      studentName: student?.name || "Unknown student",
      title: form.title,
      details: form.details,
    });

    if (saved) {
      setForm({
        studentId: students[0]?.id || "",
        title: "",
        details: "",
      });
    }
  };

  const myComplaints = complaints.filter(
    (complaint) => complaint.reporterName === reporterName,
  );

  return (
    <main className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Complaints</h2>
          <p className="mt-1 text-sm text-slate-500">
            Report student issue or concern to the admin team.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/[.03] p-5"
        >
          <h3 className="mb-4 text-lg font-semibold">Submit complaint</h3>
          <div className="space-y-4">
            <select
              value={form.studentId}
              onChange={(event) =>
                setForm({ ...form, studentId: event.target.value })
              }
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50"
            >
              {students.length === 0 && (
                <option value="">No students available</option>
              )}
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} — Roll {student.rollNo}
                </option>
              ))}
            </select>

            <input
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="Complaint title"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50"
            />

            <textarea
              value={form.details}
              onChange={(event) =>
                setForm({ ...form, details: event.target.value })
              }
              placeholder="Describe the complaint..."
              rows={6}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50"
            />

            <button
              type="submit"
              disabled={!students.length || !form.title || !form.details}
              className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send complaint to admin
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
          <h3 className="mb-4 text-lg font-semibold">Recent complaints</h3>
          <div className="space-y-3">
            {myComplaints.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-400">
                No complaints submitted yet.
              </div>
            )}

            {myComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className="rounded-xl border border-white/10 bg-slate-900/40 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{complaint.title}</p>
                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] uppercase tracking-wide text-amber-300">
                    Open
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {complaint.studentName}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {complaint.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function Settings({ teacherData, setTeacherData }) {
  return (
    <main className="mx-auto max-w-5xl p-5 md:p-8">
      <div className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <CalendarDays />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Settings</h2>
            <p className="text-sm text-slate-500">
              Manage active class and academic setup.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[.03] p-6">
        <label className="text-xs text-slate-500">Current Class</label>
        <input
          value={teacherData.className}
          onChange={(event) =>
            setTeacherData((previous) => ({
              ...previous,
              className: event.target.value,
            }))
          }
          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500/50"
        />
        <div className="mt-5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm text-indigo-200">
          Subject pass rules and grading are applied from the subject list and
          result calculator.
        </div>
      </div>
    </main>
  );
}
