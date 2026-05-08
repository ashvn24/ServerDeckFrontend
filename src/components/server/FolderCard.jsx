import { Folder, MoreVertical, ChevronRight } from 'lucide-react';

export default function FolderCard({ folder, onClick, onMore }) {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-5 shadow-glass hover:shadow-glass-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Decorative Gradient Overlay */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-amber-50 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="p-3.5 rounded-2xl bg-amber-50 ring-1 ring-inset ring-amber-100 shadow-sm transition-transform group-hover:scale-110">
          <Folder className="w-6 h-6 text-amber-500 fill-amber-500/10" />
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onMore(); }}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-1 group-hover:text-amber-600 transition-colors">{folder.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Resources</span>
          <ChevronRight className="w-3 h-3 text-gray-300" />
        </div>
      </div>
    </div>
  );
}
