import { useState, useEffect, useRef } from 'react';
import { Search, Server, User, Clock, Activity as ActivityIcon, ChevronRight, Filter, Database, Shield, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auditAPI, serversAPI, usersAPI } from '../api/endpoints';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Activity() {
  const { user: currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [servers, setServers] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dropdown States
  const [showServerDropdown, setShowServerDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  
  const filterSectionRef = useRef(null);
  const isOwner = currentUser?.role === 'owner';

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [sRes, aRes, uRes] = await Promise.all([
          serversAPI.list(),
          auditAPI.list(),
          isOwner ? usersAPI.list() : Promise.resolve({ data: [] })
        ]);
        setServers(sRes.data);
        setLogs(aRes.data);
        if (isOwner) setTeamUsers(uRes.data);
      } catch (err) {
        console.error('Activity load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [isOwner]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterSectionRef.current && !filterSectionRef.current.contains(event.target)) {
        setShowServerDropdown(false);
        setShowUserDropdown(false);
        setShowDateDropdown(false);
        setShowTimeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchFilteredLogs = async () => {
    setLoading(true);
    try {
      const res = await auditAPI.list(selectedServer);
      setLogs(res.data);
    } catch (err) {
      console.error('Filter failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) fetchFilteredLogs();
  }, [selectedServer]);

  // Derived Data for Filters
  const uniqueDates = [...new Set(logs.map(log => {
    const d = new Date(log.timestamp);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }))].sort((a, b) => new Date(b) - new Date(a));
  const timeSlots = [...Array(24).keys()].map(h => `${h.toString().padStart(2, '0')}:00`);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.server.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesUser = !selectedUser || log.user.id === selectedUser;
    const logDate = new Date(log.timestamp);
    const logDateStr = `${logDate.getFullYear()}-${(logDate.getMonth() + 1).toString().padStart(2, '0')}-${logDate.getDate().toString().padStart(2, '0')}`;
    const matchesDate = !selectedDate || logDateStr === selectedDate;
    const matchesTime = !selectedTime || logDate.getHours() === parseInt(selectedTime.split(':')[0]);
    
    return matchesSearch && matchesUser && matchesDate && matchesTime;
  });

  const selectedServerName = selectedServer 
    ? servers.find(s => s.id === selectedServer)?.name 
    : 'ALL NODES';

  const selectedUserName = selectedUser
    ? teamUsers.find(u => u.id === selectedUser)?.name
    : 'ALL OPERATORS';

  if (loading && logs.length === 0) return <LoadingSpinner size="lg" text="Syncing audit trails..." />;

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-10" ref={filterSectionRef}>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight font-display leading-none">Security Operations</h1>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] mt-4">Audit trails and infrastructure access logs</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-white transition-colors" />
                <input
                  type="text"
                  placeholder="SEARCH ACTIVITY..."
                  className="pl-12 pr-6 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white focus:border-[var(--accent-violet)] outline-none w-64 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             
             {/* Custom Server Dropdown */}
             <div className="relative">
                <button 
                  onClick={() => setShowServerDropdown(!showServerDropdown)}
                  className="flex items-center gap-3 pl-12 pr-12 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all min-w-[200px] relative text-left"
                >
                  <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="truncate">{selectedServerName}</span>
                  <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] transition-transform duration-300 ${showServerDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showServerDropdown && (
                  <div className="absolute right-0 mt-3 w-full min-w-[200px] glass-card border border-white/10 p-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                      <button
                        onClick={() => { setSelectedServer(''); setShowServerDropdown(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!selectedServer ? 'bg-white text-black' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                      >
                        <span>All Cluster Nodes</span>
                        {!selectedServer && <Check className="w-3.5 h-3.5" />}
                      </button>
                      {servers.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedServer(s.id); setShowServerDropdown(false); }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedServer === s.id ? 'bg-white text-black' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                        >
                          <span className="truncate">{s.name}</span>
                          {selectedServer === s.id && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Owner Specific Filters */}
        {isOwner && (
          <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--accent-violet)]/10 border border-[var(--accent-violet)]/20">
                <Filter className="w-4 h-4 text-[var(--accent-violet)]" />
                <span className="text-[10px] font-black text-[var(--accent-violet)] uppercase tracking-widest">Enhanced Filters</span>
             </div>

             {/* User Dropdown */}
             <div className="relative">
                <button 
                  onClick={() => { setShowUserDropdown(!showUserDropdown); setShowDateDropdown(false); setShowTimeDropdown(false); }}
                  className="flex items-center gap-3 pl-10 pr-10 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all min-w-[180px] relative text-left"
                >
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="truncate">{selectedUserName}</span>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
                </button>
                {showUserDropdown && (
                  <div className="absolute left-0 mt-3 w-full min-w-[200px] glass-card border border-white/10 p-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                      <button
                        onClick={() => { setSelectedUser(''); setShowUserDropdown(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!selectedUser ? 'bg-white text-black' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                      >
                        <span>All Operators</span>
                      </button>
                      {teamUsers.map(u => (
                        <button
                          key={u.id}
                          onClick={() => { setSelectedUser(u.id); setShowUserDropdown(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedUser === u.id ? 'bg-white text-black' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                        >
                          <span className="truncate">{u.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
             </div>

             {/* Date Dropdown */}
             <div className="relative">
                <button 
                  onClick={() => { setShowDateDropdown(!showDateDropdown); setShowUserDropdown(false); setShowTimeDropdown(false); }}
                  className="flex items-center gap-3 pl-10 pr-10 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all min-w-[160px] relative text-left"
                >
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="truncate">{selectedDate || 'ALL DATES'}</span>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
                </button>
                {showDateDropdown && (
                  <div className="absolute left-0 mt-3 w-full min-w-[180px] glass-card border border-white/10 p-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                      <button
                        onClick={() => { setSelectedDate(''); setShowDateDropdown(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!selectedDate ? 'bg-white text-black' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                      >
                        <span>All Dates</span>
                      </button>
                      {uniqueDates.map(d => (
                        <button
                          key={d}
                          onClick={() => { setSelectedDate(d); setShowDateDropdown(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedDate === d ? 'bg-white text-black' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                        >
                          <span className="truncate">{d}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
             </div>

             {/* Time Dropdown */}
             <div className="relative">
                <button 
                  onClick={() => { setShowTimeDropdown(!showTimeDropdown); setShowUserDropdown(false); setShowDateDropdown(false); }}
                  className="flex items-center gap-3 pl-10 pr-10 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all min-w-[140px] relative text-left"
                >
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="truncate">{selectedTime || 'ALL TIME'}</span>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
                </button>
                {showTimeDropdown && (
                  <div className="absolute left-0 mt-3 w-full min-w-[160px] glass-card border border-white/10 p-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                      <button
                        onClick={() => { setSelectedTime(''); setShowTimeDropdown(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!selectedTime ? 'bg-white text-black' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                      >
                        <span>All Time</span>
                      </button>
                      {timeSlots.map(t => (
                        <button
                          key={t}
                          onClick={() => { setSelectedTime(t); setShowTimeDropdown(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedTime === t ? 'bg-white text-black' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                        >
                          <span className="truncate">{t} - {(parseInt(t) + 1).toString().padStart(2, '0')}:00</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
             </div>

             <button 
                onClick={() => { setSelectedUser(''); setSelectedDate(''); setSelectedTime(''); setSearchQuery(''); }}
                className="ml-auto text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-white transition-colors"
             >
                Reset All
             </button>
          </div>
        )}
      </div>


      {/* Top / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="glass-card p-8 flex items-center gap-6">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[var(--accent-violet)]">
               <Shield className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Active Policies</p>
               <p className="text-2xl font-black text-white uppercase tracking-tight font-display">Compliant</p>
            </div>
         </div>
         <div className="glass-card p-8 flex items-center gap-6">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[var(--accent-mint)]">
               <ActivityIcon className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Transactions / 24h</p>
               <p className="text-2xl font-black text-white uppercase tracking-tight font-display">{logs.length}</p>
            </div>
         </div>
         <div className="glass-card p-8 flex items-center gap-6 border-emerald-500/10">
            <div className="w-14 h-14 bg-emerald-500/5 rounded-2xl flex items-center justify-center text-emerald-500">
               <Database className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Log Retention</p>
               <p className="text-2xl font-black text-white uppercase tracking-tight font-display">90 Days</p>
            </div>
         </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-white/5 bg-white/2">
           <div className="col-span-3 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Operator & Action</div>
           <div className="col-span-3 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Endpoint Node</div>
           <div className="col-span-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Transaction Details</div>
           <div className="col-span-2 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest text-right">Timestamp</div>
        </div>

        <div className="max-h-[650px] overflow-y-auto no-scrollbar">
          <div className="divide-y divide-white/5">
             {filteredLogs.length === 0 ? (
               <div className="py-32 flex flex-col items-center justify-center text-center">
                  <Database className="w-12 h-12 text-white/10 mb-6" />
                  <h3 className="text-xl font-black text-white uppercase tracking-tight font-display">No activity entries found</h3>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-2">Adjust filters or check back later for live audits</p>
               </div>
             ) : (
               filteredLogs.map((log) => (
                 <div key={log.id} className="grid grid-cols-12 gap-4 px-8 py-6 hover:bg-white/5 transition-all group items-center">
                    <div className="col-span-3 flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center font-black text-white text-[10px]">
                          {log.user.name.charAt(0)}
                       </div>
                       <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{log.user.name}</p>
                          <p className="text-[9px] font-bold text-[var(--accent-violet)] uppercase tracking-widest mt-0.5">{log.action}</p>
                       </div>
                    </div>

                    <div className="col-span-3 flex items-center gap-3">
                       <div className="p-2 rounded-lg bg-white/5 text-[var(--text-secondary)]">
                          <Server className="w-4 h-4" />
                       </div>
                       <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">{log.server.name}</span>
                    </div>

                    <div className="col-span-4">
                       <div className="bg-black/20 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                          <ActivityIcon className="w-3.5 h-3.5 text-[var(--accent-mint)]" />
                          <span className="text-[9px] font-mono text-gray-400 truncate tracking-tight">
                             {JSON.stringify(log.details) === '{}' ? 'Standard handshaked session' : JSON.stringify(log.details)}
                          </span>
                       </div>
                    </div>

                    <div className="col-span-2 text-right">
                       <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2 text-white">
                             <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                             <span className="text-[10px] font-black uppercase tracking-tight">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                          <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
                             {new Date(log.timestamp).toLocaleDateString()}
                          </p>
                       </div>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
