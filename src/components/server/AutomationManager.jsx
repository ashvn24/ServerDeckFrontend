import { useState, useEffect } from 'react';
import { Play, Code, Save, Trash2, Loader2, Command, Terminal, ChevronRight, BookOpen, AlertCircle } from 'lucide-react';
import { useMobile } from '../../hooks/useMobile';

const RECIPES = [
  { name: 'Update & Upgrade OS', script: 'sudo apt update && sudo apt upgrade -y', desc: 'Refresh package lists and upgrade all installed packages.' },
  { name: 'Clean Up Disk Space', script: 'sudo apt autoremove -y && sudo apt autoclean && sudo journalctl --vacuum-time=1d', desc: 'Remove unused packages and clear old system logs.' },
  { name: 'Check System Health', script: 'df -h && free -m && uptime', desc: 'Quick check of disk, memory, and system load.' },
  { name: 'Restart Nginx & PHP', script: 'sudo systemctl restart nginx php*-fpm', desc: 'Reload web server components.' },
  { name: 'List Large Files (>100MB)', script: 'sudo find / -type f -size +100M -exec ls -lh {} + 2>/dev/null | sort -rh | head -n 10', desc: 'Find the top 10 largest files on the server.' },
];

export default function AutomationManager({ serverId, sendCommand, isAdmin }) {
  const isMobile = useMobile();
  const [script, setScript] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem(`automation_history_${serverId}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(`automation_history_${serverId}`, JSON.stringify(history));
  }, [history, serverId]);

  const handleRun = async (scriptToRun = script) => {
    if (!scriptToRun) return;
    setLoading(true);
    setOutput('Running script...\n');
    try {
      const res = await sendCommand(serverId, 'automation.run', { script: scriptToRun });
      if (res.error) throw new Error(res.error);
      
      const newOutput = `[STDOUT]\n${res.stdout || '(no output)'}\n\n[STDERR]\n${res.stderr || '(no errors)'}\n\n[Exit Code: ${res.returncode}]`;
      setOutput(newOutput);
      
      setHistory(prev => [{
        id: Date.now(),
        script: scriptToRun,
        timestamp: new Date().toISOString(),
        success: res.returncode === 0
      }, ...prev].slice(0, 20));
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applyRecipe = (recipe) => {
    setScript(recipe.script);
  };

  /* ─── Mobile layout ─────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Header + Execute button */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[var(--accent-violet)] rounded-2xl shadow-lg shadow-violet-500/20 text-white">
                <Command className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight font-display">Automation</h3>
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-0.5">Root bash console</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleRun()}
                disabled={loading || !script}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-violet)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                Run
              </button>
            )}
          </div>

          {/* Script textarea */}
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder={"#!/bin/bash\n# Type your script here..."}
            className="w-full h-44 px-4 py-4 bg-black/40 text-gray-100 font-mono text-sm rounded-2xl border border-[var(--border-color)] focus:border-[var(--accent-violet)] outline-none transition-all placeholder:text-gray-700"
          />

          {/* Output */}
          {output && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Output</label>
                <button onClick={() => setOutput('')} className="text-[10px] font-black text-[var(--accent-violet)] uppercase tracking-widest">Clear</button>
              </div>
              <div className="w-full max-h-56 overflow-y-auto bg-black p-4 rounded-2xl border border-[var(--border-color)]">
                <pre className="font-mono text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{output}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Recipes - horizontal scroll on mobile */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-4 h-4 text-[var(--accent-violet)]" />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Quick Recipes</h3>
          </div>
          <div className="space-y-2">
            {RECIPES.map((recipe) => (
              <button
                key={recipe.name}
                onClick={() => applyRecipe(recipe)}
                className="w-full text-left p-4 bg-white/5 border border-white/5 rounded-2xl active:bg-white/10 transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-tight truncate">{recipe.name}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-0.5 truncate">{recipe.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
              </button>
            ))}
          </div>
          <div className="mt-4 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-500/80 leading-relaxed font-bold uppercase tracking-widest">Scripts run with root privileges. Be extremely careful.</p>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <Terminal className="w-4 h-4 text-[var(--text-secondary)]" />
              <h4 className="text-[10px] font-black uppercase tracking-widest">Recent History</h4>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <button key={item.id} onClick={() => setScript(item.script)} className="w-full text-left p-3 bg-white/5 border border-white/5 rounded-xl active:bg-white/10 transition-all flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${item.success ? 'accent-bg-green' : 'bg-red-500'}`} />
                  <code className="text-xs font-bold text-white truncate flex-1">{item.script}</code>
                  <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest shrink-0">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── Desktop layout (unchanged) ───────────────────────────────── */
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Script Editor & Output */}
      <div className="lg:col-span-2 space-y-8">
        <div className="glass-card p-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-[var(--accent-violet)] rounded-2xl shadow-lg shadow-violet-500/20 text-white">
                <Command className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight font-display">Automation Console</h3>
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Run root-level bash commands</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleRun()}
                disabled={loading || !script}
                className="flex items-center gap-2 px-8 py-3 bg-[var(--accent-violet)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                Execute
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder={"#!/bin/bash\n# Type your script here..."}
                className="w-full h-64 px-8 py-8 bg-black/40 text-gray-100 font-mono text-sm rounded-3xl border border-[var(--border-color)] focus:border-[var(--accent-violet)] outline-none transition-all placeholder:text-gray-700"
              />
            </div>

            {output && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Console Output</label>
                  <button onClick={() => setOutput('')} className="text-[10px] font-black text-[var(--accent-violet)] hover:text-white transition-colors uppercase tracking-widest">Clear</button>
                </div>
                <div className="w-full max-h-80 overflow-y-auto bg-black p-8 rounded-3xl border border-[var(--border-color)]">
                  <pre className="font-mono text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{output}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History */}
        <div className="glass-card p-10">
          <div className="flex items-center gap-4 mb-8">
            <Terminal className="w-5 h-5 text-[var(--text-secondary)]" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Recent Activity</h4>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] font-medium py-4">No recent script history</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => setScript(item.script)}>
                  <div className="flex items-center gap-4">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.success ? 'accent-bg-green' : 'bg-red-500'}`} />
                    <code className="text-xs font-bold text-white truncate max-w-[200px] md:max-w-md">{item.script}</code>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar: Recipes */}
      <div className="space-y-8">
        <div className="glass-card p-10">
          <div className="flex items-center gap-3 mb-10">
            <BookOpen className="w-5 h-5 text-[var(--accent-violet)]" />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Script Recipes</h3>
          </div>
          <div className="space-y-4">
            {RECIPES.map((recipe) => (
              <button
                key={recipe.name}
                onClick={() => applyRecipe(recipe)}
                className="w-full text-left p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-tight group-hover:text-[var(--accent-mint)] transition-colors">{recipe.name}</span>
                  <ChevronRight className="w-3 h-3 text-[var(--text-secondary)] group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest leading-relaxed">{recipe.desc}</p>
              </button>
            ))}
          </div>
          
          <div className="mt-10 p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-[10px] text-red-500/80 leading-relaxed font-bold uppercase tracking-widest">
              Scripts run with root privileges. Be extremely careful.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
