import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-xl font-black text-white tracking-tighter uppercase tracking-widest text-xs opacity-50">{title}</h3>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
