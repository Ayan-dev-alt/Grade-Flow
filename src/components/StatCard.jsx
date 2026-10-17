export default function StatCard({ icon: Icon, label, value, note }) {
  return (
    <div className="glass rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-indigo-500/20">
      <div className="mb-5 flex items-start justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400"><Icon size={21}/></div>
        <span className="text-xs text-emerald-400">{note}</span>
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-1 text-3xl font-bold text-white">{value}</h3>
    </div>
  );
}