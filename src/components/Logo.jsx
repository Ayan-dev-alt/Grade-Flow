import { GraduationCap } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2.5 font-bold text-white">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
        <GraduationCap size={21} />
      </div>
      <span className="text-xl">Grade<span className="text-indigo-400">Flow</span></span>
    </div>
  );
}