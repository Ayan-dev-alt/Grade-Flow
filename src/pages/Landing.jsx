import { Link } from "react-router-dom";
import { ArrowRight, Calculator, Trophy, ShieldCheck, FileText, Users, Zap, ChevronDown } from "lucide-react";
import Logo from "../components/Logo";

const features = [
  [Calculator, "Automatic calculations", "Calculate marks, percentages, grades and class positions from the records you enter."],
  [Trophy, "Class rankings", "Compare student results using their total marks and configured passing marks."],
  [ShieldCheck, "Private teacher accounts", "Your teacher account has its own protected workspace and records."],
  [FileText, "Clear result reports", "Review student marks, grades and pass status in one place."],
  [Users, "Student records", "Add and manage your students, classes and sections."],
  [Zap, "One connected workspace", "Your teacher records and messages are saved to your GradeFlow account."],
];

const faqs = [
  ["Can I manage more than one class?", "You can set a class name in Settings. Student records can also include their class and section."],
  ["How are grades calculated?", "GradeFlow calculates a percentage from the marks entered for each subject and assigns a grade based on the result bands shown in the Results section."],
  ["How is a student marked as passing?", "A student must meet or exceed the passing marks set for every subject to pass."],
  ["Can other teachers see my student records?", "Teacher records are stored under the signed-in teacher's account and access is controlled by Firebase security rules."],
  ["Can I add my own subjects and exams?", "You can add subjects, set total and passing marks, and enter each student's marks in the teacher dashboard."],
];

export default function Landing() {
  return <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Logo />
        <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          {["Features", "How It Works", "FAQ"].map((item) => <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} className="hover:text-white">{item}</a>)}
        </div>
        <Link to="/auth" className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-400">Get Started</Link>
      </div>
    </nav>

    <section className="relative">
      <div className="absolute left-1/2 top-10 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-24 text-center md:pt-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300">Smart academic workspace</span>
        <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-black tracking-tight md:text-7xl">Results made <span className="gradient-text">simple.</span></h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">GradeFlow helps teachers manage students, calculate results, generate rankings and organize academic reports in one workspace.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/auth" className="flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-semibold hover:bg-indigo-400">Open your workspace <ArrowRight size={18} /></Link>
          <a href="#features" className="rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-slate-200 hover:bg-white/10">Explore features</a>
        </div>
        <div className="mx-auto mt-16 max-w-5xl rounded-3xl border border-white/10 bg-slate-900/80 p-3 shadow-2xl shadow-indigo-950/30">
          <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-left sm:p-9">
            <div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-300"><Users size={22} /></div><div><p className="text-lg font-bold">Your class, at a glance</p><p className="mt-1 text-sm leading-6 text-slate-400">Add students and subjects to see your own saved records and calculated results here.</p></div></div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">{[[Users, "Students"], [FileText, "Subjects"], [Trophy, "Class results"]].map(([Icon, label]) => <div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-4"><Icon size={18} className="text-indigo-300" /><span className="text-sm font-medium text-slate-300">{label}</span></div>)}</div>
          </div>
        </div>
      </div>
    </section>

    <section id="features" className="mx-auto max-w-7xl px-5 py-24">
      <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-widest text-indigo-400">Features</p><h2 className="mt-3 text-4xl font-bold">A clearer result workflow</h2><p className="mt-4 text-slate-400">Tools for the everyday work of managing a class and its results.</p></div>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{features.map(([Icon, title, description]) => <div key={title} className="glass rounded-2xl p-6 transition hover:-translate-y-1 hover:border-indigo-500/30"><div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400"><Icon size={22} /></div><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></div>)}</div>
    </section>

    <section id="how-it-works" className="border-y border-white/10 bg-white/[.02]"><div className="mx-auto max-w-7xl px-5 py-24"><div className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-indigo-400">How it works</p><h2 className="mt-3 text-4xl font-bold">From class setup to results</h2></div><div className="mt-12 grid gap-5 md:grid-cols-4">{["Add students", "Set up subjects and marks", "Enter student results", "Review grades and positions"].map((step, index) => <div key={step} className="rounded-2xl border border-white/10 bg-slate-900 p-6"><span className="text-4xl font-black text-indigo-500/50">0{index + 1}</span><h3 className="mt-5 font-bold">{step}</h3><p className="mt-2 text-sm text-slate-500">Complete this step in your teacher workspace.</p></div>)}</div></div></section>

    <section id="faq" className="mx-auto max-w-4xl px-5 py-24"><div className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-indigo-400">FAQ</p><h2 className="mt-3 text-4xl font-bold">Questions, answered</h2></div><div className="mt-10 space-y-3">{faqs.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-white/10 bg-white/[.03] p-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{question}<ChevronDown className="shrink-0 transition group-open:rotate-180" size={18} /></summary><p className="mt-3 text-sm leading-6 text-slate-400">{answer}</p></details>)}</div></section>

    <section className="px-5 pb-24"><div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/20 to-violet-600/10 p-10 text-center md:p-16"><h2 className="text-4xl font-black md:text-5xl">Ready to organize your results?</h2><p className="mx-auto mt-4 max-w-xl text-slate-400">Sign in to manage your students, subjects and academic records.</p><Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-950">Get started <ArrowRight size={18} /></Link></div></section>

    <footer className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between"><Logo /><span>© 2026 GradeFlow. Academic result management.</span></div></footer>
  </div>;
}
