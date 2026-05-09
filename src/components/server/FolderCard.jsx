import { Folder, ChevronRight, MoreVertical } from 'lucide-react';

export default function FolderCard({ folder, onClick, onMore }) {
  return (
    <div 
      onClick={onClick}
      className="glass-card group p-8 flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform duration-300"
    >
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-[var(--accent-mint)] transition-all">
          <Folder className="w-7 h-7 text-white group-hover:text-black transition-colors" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight font-display">{folder.name}</h3>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Group Container</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onMore(); }}
          className="p-2 text-[var(--text-secondary)] hover:text-white hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-white transition-colors" />
      </div>
    </div>
  );
}
