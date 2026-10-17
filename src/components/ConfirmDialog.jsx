import { AlertTriangle, Trash2 } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "This action is permanent and cannot be undone.",
  onCancel,
  onConfirm,
  confirmLabel = "Delete permanently",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="presentation">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/50"
      >
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-rose-500/10 text-rose-400">
          <AlertTriangle size={22} />
        </div>
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-white">{title}</h2>
        <p id="confirm-dialog-message" className="mt-2 text-sm leading-6 text-slate-400">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-400">
            <Trash2 size={16} /> {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
