import { Link } from "react-router-dom";
import { ArrowRight, Check, Calculator, Trophy, ShieldCheck, FileText, Users, Zap, ChevronDown } from "lucide-react";
import Logo from "../components/Logo";

const features = [
  [Calculator, "Automatic Calculation", "Percentages, grades and totals are calculated instantly."],
  [Trophy, "Auto Position", "Generate class rankings from your configured result rules."],
  [ShieldCheck, "Secure Dashboard", "Keep each teacher's workspace separated and protected."],
  [FileText, "Printable Results", "Prepare clean result previews ready for reporting."],
  [Users, "Student Management", "Manage students, classes and academic records easily."],
  [Zap, "Fast Workflow", "Move from student entry to final result with fewer steps."],
];

export default function Landing() {
  return <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Logo />
        <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          {["Features","How It Works","FAQ"].map(x=><a key={x} href={"#"+x.toLowerCase().replaceAll(" ","-")} className="hover:text-white">{x}</a>)}
        </div>
        <Link to="/auth" className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-400">Get Started</Link>
      </div>
    </nav>

    <section className="relative">
      <div className="absolute left-1/2 top-10 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-24 text-center md:pt-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300">🚀 Smart Academic Platform</span>
        <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-black tracking-tight md:text-7xl">Results made <span className="gradient-text">simple.</span></h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">GradeFlow helps teachers manage students, calculate results, generate rankings and organize academic reports from one clean workspace.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/auth" className="flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-semibold hover:bg-indigo-400">Start Free <ArrowRight size={18}/></Link>
          <a href="#features" className="rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-slate-200 hover:bg-white/10">Explore Features</a>
        </div>
        <div className="mx-auto mt-16 max-w-5xl rounded-3xl border border-white/10 bg-slate-900/80 p-3 shadow-2xl shadow-indigo-950/30">
          <div className="rounded-2xl border border-white/10 bg-slate-950 p-5 text-left">
            <div className="grid gap-4 md:grid-cols-3">
              {[[Users,"248","Students"],[FileText,"08","Subjects"],[Trophy,"96%","Results"]].map(([I,v,l])=><div key={l} className="rounded-2xl bg-white/[.04] p-5"><I className="text-indigo-400" size={20}/><div className="mt-5 text-3xl font-bold">{v}</div><div className="text-sm text-slate-500">{l}</div></div>)}
            </div>
            <div className="mt-4 h-44 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/5 p-5"><div className="flex h-full items-end gap-3">{[35,55,48,72,61,88,76,96,82,100].map((h,i)=><div key={i} className="flex-1 rounded-t-lg bg-indigo-500/50" style={{height:`${h}%`}}/>)}</div></div>
          </div>
        </div>
      </div>
    </section>

    <section id="features" className="mx-auto max-w-7xl px-5 py-24">
      <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-widest text-indigo-400">Everything you need</p><h2 className="mt-3 text-4xl font-bold">A smarter result workflow</h2><p className="mt-4 text-slate-400">Built around the everyday tasks teachers repeat again and again.</p></div>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{features.map(([I,t,d])=><div key={t} className="glass rounded-2xl p-6 transition hover:-translate-y-1 hover:border-indigo-500/30"><div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400"><I size={22}/></div><h3 className="mt-5 text-lg font-bold">{t}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{d}</p></div>)}</div>
    </section>

    <section id="how-it-works" className="border-y border-white/10 bg-white/[.02]"><div className="mx-auto max-w-7xl px-5 py-24"><div className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-indigo-400">How it works</p><h2 className="mt-3 text-4xl font-bold">Four simple steps</h2></div><div className="mt-12 grid gap-5 md:grid-cols-4">{["Add Students","Add Subjects & Marks","Automatic Calculation","Export Results"].map((x,i)=><div key={x} className="relative rounded-2xl border border-white/10 bg-slate-900 p-6"><span className="text-4xl font-black text-indigo-500/30">0{i+1}</span><h3 className="mt-5 font-bold">{x}</h3><p className="mt-2 text-sm text-slate-500">Complete this step in your teacher workspace.</p></div>)}</div></div></section>

    <section id="faq" className="mx-auto max-w-4xl px-5 py-24"><div className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-indigo-400">FAQ</p><h2 className="mt-3 text-4xl font-bold">Questions, answered</h2></div><div className="mt-10 space-y-3">{["Can I manage multiple classes?","How are grades calculated?","Can I configure passing rules?","Will my students be separated from other teachers?","Can I add my own subjects and exams?"].map(q=><details key={q} className="group rounded-2xl border border-white/10 bg-white/[.03] p-5"><summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{q}<ChevronDown className="transition group-open:rotate-180" size={18}/></summary><p className="mt-3 text-sm leading-6 text-slate-400">Yes. The React structure includes configurable classes, subjects, exams and result rules, ready for your database layer.</p></details>)}</div></section>

    <section className="px-5 pb-24"><div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/20 to-violet-600/10 p-10 text-center md:p-16"><h2 className="text-4xl font-black md:text-5xl">Ready to save time?</h2><p className="mx-auto mt-4 max-w-xl text-slate-400">Create your workspace and move your result workflow into one organized system.</p><Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-950">Get Started Free <ArrowRight size={18}/></Link></div></section>

    <footer className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between"><Logo/><span>© 2026 GradeFlow. Smart result management.</span></div></footer>
  </div>
}