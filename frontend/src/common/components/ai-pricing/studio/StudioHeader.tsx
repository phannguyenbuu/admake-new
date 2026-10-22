import React from "react";
import { X } from "lucide-react";

interface StudioHeaderProps {
  onClose?: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({ onClose }) => {
  return (
    <div className="flex items-center justify-between w-full pb-2 border-b border-slate-200 px-1 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-xs font-black text-xs">
          AD
        </div>
        <div className="flex items-center gap-2">
          <h3 className="font-extrabold text-slate-800 text-sm md:text-base m-0 tracking-tight">
            ADMAKE AI 3D STUDIO
          </h3>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 font-extrabold text-[10px]">
            3D & GenAI Studio
          </span>
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 cursor-pointer shrink-0 shadow-2xs"
          title="Đóng AI Studio"
        >
          <X className="w-4 h-4 font-bold" />
        </button>
      )}
    </div>
  );
};
