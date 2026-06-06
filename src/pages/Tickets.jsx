import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LifeBuoy, Plus, Search, Send, Clock, User, CheckCircle,
  MessageSquare, AlertTriangle, Lock, UserCheck, X, AlertCircle,
  ArrowUpRight, Tag, ChevronDown, RefreshCw, Filter, ArrowLeft, Info
} from 'lucide-react';
import { ticketsAPI, usersAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { timeAgo } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';

/* ─── helpers ───────────────────────────────────────────────────── */
const STATUSES   = ['Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

function priorityMeta(p) {
  switch (p) {
    case 'Urgent': return { cls: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',   dot: 'bg-rose-400' };
    case 'High':   return { cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', dot: 'bg-amber-400' };
    case 'Medium': return { cls: 'bg-primary-500/10 text-primary-400 border border-primary-500/20', dot: 'bg-primary-400' };
    default:       return { cls: 'bg-slate-500/10 text-slate-400 border border-slate-600/20',  dot: 'bg-slate-500' };
  }
}

function statusMeta(s) {
  switch (s) {
    case 'Open':                return { cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 status-open', bar: 'bg-emerald-400' };
    case 'In Progress':         return { cls: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',                         bar: 'bg-sky-400' };
    case 'Waiting on Customer': return { cls: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',                bar: 'bg-orange-400' };
    case 'Resolved':            return { cls: 'bg-teal-500/10 text-teal-300 border border-teal-500/20',                      bar: 'bg-teal-400' };
    case 'Closed':              return { cls: 'bg-gray-600/20 text-gray-500 border border-gray-600/20',                      bar: 'bg-gray-500' };
    default:                    return { cls: 'bg-gray-700/20 text-gray-500 border border-transparent',                      bar: 'bg-gray-600' };
  }
}

function RoleBadge({ role }) {
  const map = {
    owner:   'bg-amber-500/15 text-amber-400',
    admin:   'bg-violet-500/15 text-violet-400',
    support: 'bg-sky-500/15 text-sky-400',
    member:  'bg-gray-600/30 text-gray-400',
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${map[role] ?? map.member}`}>
      {role}
    </span>
  );
}

function Avatar({ name, role, size = 8 }) {
  const colorMap = {
    owner:   'bg-amber-500/20 text-amber-300',
    admin:   'bg-violet-500/20 text-violet-300',
    support: 'bg-sky-500/20 text-sky-300',
    member:  'bg-gray-600/30 text-gray-300',
  };
  const s = { 8: 'w-8 h-8 text-sm', 6: 'w-6 h-6 text-xs' }[size] ?? 'w-8 h-8 text-sm';
  return (
    <div className={`${s} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${colorMap[role] ?? colorMap.member}`}>
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

/* ─── main component ────────────────────────────────────────────── */
export default function Tickets() {
  const { user } = useAuth();
  const ws        = useWebSocket();

  const [tickets,        setTickets]        = useState([]);
  const [teamUsers,      setTeamUsers]      = useState([]);
  const [selectedId,     setSelectedId]     = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [listLoading,    setListLoading]    = useState(true);
  const [detailLoading,  setDetailLoading]  = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [statusFilter,   setStatusFilter]   = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [msgBody,        setMsgBody]        = useState('');
  const [isInternal,     setIsInternal]     = useState(false);
  const [showCreate,     setShowCreate]     = useState(false);
  const [creating,       setCreating]       = useState(false);
  const [form,           setForm]           = useState({ title: '', description: '', priority: 'Medium' });
  const [sendingMsg,     setSendingMsg]     = useState(false);
  const [showProps,      setShowProps]      = useState(false);  // mobile properties drawer

  const chatEndRef       = useRef(null);
  const selectedIdRef    = useRef(null);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const isSupportStaff = ['owner', 'admin', 'support'].includes(user?.role);
  const isTicketClosed = selectedTicket?.status === 'Closed';

  const scrollBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, []);

  /* ── fetch list ── */
  const fetchTickets = useCallback(async () => {
    try {
      setListLoading(true);
      const res = await ticketsAPI.list(statusFilter || undefined, priorityFilter || undefined);
      setTickets(res.data);
    } catch (e) { console.error(e); }
    finally { setListLoading(false); }
  }, [statusFilter, priorityFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  /* ── fetch team users (for assignment) ── */
  useEffect(() => {
    if (!isSupportStaff) return;
    usersAPI.list().then(r => setTeamUsers(r.data)).catch(console.error);
  }, [isSupportStaff]);

  /* ── websocket events ── */
  useEffect(() => {
    if (!ws?.on) return;
    const offMsg = ws.on('ticket_message', ({ message: m }) => {
      if (selectedIdRef.current === m.ticket_id) {
        setSelectedTicket(prev => {
          if (!prev || prev.messages.some(x => x.id === m.id)) return prev;
          return { ...prev, messages: [...prev.messages, m] };
        });
        scrollBottom();
      }
      setTickets(prev =>
        prev.map(t => t.id === m.ticket_id ? { ...t, updated_at: m.created_at } : t)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      );
    });
    const offUpd = ws.on('ticket_update', ({ ticket: upd }) => {
      if (selectedIdRef.current === upd.id)
        setSelectedTicket(prev => prev ? { ...prev, ...upd } : prev);
      setTickets(prev => prev.map(t => t.id === upd.id ? { ...t, ...upd } : t));
    });
    return () => { offMsg(); offUpd(); };
  }, [ws, scrollBottom]);

  /* ── ws ticket subscription ── */
  useEffect(() => {
    if (!selectedId || !ws?.subscribeTicket) return;
    ws.subscribeTicket(selectedId);
    return () => ws.unsubscribeTicket(selectedId);
  }, [selectedId, ws]);

  /* ── load detail ── */
  useEffect(() => {
    if (!selectedId) { setSelectedTicket(null); return; }
    setDetailLoading(true);
    ticketsAPI.get(selectedId)
      .then(r => { setSelectedTicket(r.data); scrollBottom(); })
      .catch(console.error)
      .finally(() => setDetailLoading(false));
  }, [selectedId, scrollBottom]);

  /* ── handlers ── */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!msgBody.trim() || !selectedId || sendingMsg) return;
    setSendingMsg(true);
    try {
      await ticketsAPI.addMessage(selectedId, {
        body: msgBody,
        is_internal: isSupportStaff ? isInternal : false,
      });
      setMsgBody('');
      setIsInternal(false);
      scrollBottom();
    } catch (e) { console.error(e); }
    finally { setSendingMsg(false); }
  };

  const handleProp = async (field, value) => {
    if (!selectedId) return;
    try {
      await ticketsAPI.update(selectedId, { [field]: value === 'unassigned' ? null : value });
    } catch (e) { console.error(e); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setCreating(true);
    try {
      const res = await ticketsAPI.create(form);
      setTickets(prev => [res.data, ...prev]);
      setSelectedId(res.data.id);
      setShowCreate(false);
      setForm({ title: '', description: '', priority: 'Medium' });
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  /* ── filtered list ── */
  const filtered = tickets.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="fixed left-0 right-0 z-40 flex gap-0 overflow-hidden border-t border-white/5" style={{ top: 'var(--total-header)', bottom: 'var(--bottom-nav)', background: 'var(--bg-main)' }}>

      {/* ══ LEFT: Ticket List ══════════════════════════════════════ */}
      <aside className={`${selectedId ? 'hidden lg:flex' : 'flex'} w-full lg:w-72 flex-shrink-0 flex-col border-r border-white/5`} style={{ background: 'var(--bg-card)' }}>

        {/* header */}
        <div className="px-4 pt-5 pb-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-primary-400" />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Service Desk</h2>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="w-7 h-7 rounded-lg bg-primary-500 hover:bg-primary-600 flex items-center justify-center text-white transition-colors shadow-lg shadow-primary-500/20"
              title="New ticket"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search tickets…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-white/8 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/40 transition-colors"
              style={{ background: 'var(--bg-card-hover)' }}
            />
          </div>

          {/* filters */}
          <div className="flex gap-1.5">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="flex-1 appearance-none border border-white/8 rounded-lg px-2 py-1.5 text-[11px] text-gray-300 focus:outline-none focus:border-primary-500/50 transition-colors"
              style={{ background: 'var(--bg-card-hover)' }}
            >
              <option value="" style={{ background: 'var(--bg-card-hover)' }}>All Status</option>
              {STATUSES.map(s => <option key={s} value={s} style={{ background: 'var(--bg-card-hover)' }}>{s}</option>)}
            </select>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="flex-1 appearance-none border border-white/8 rounded-lg px-2 py-1.5 text-[11px] text-gray-300 focus:outline-none focus:border-primary-500/50 transition-colors"
              style={{ background: 'var(--bg-card-hover)' }}
            >
              <option value="" style={{ background: 'var(--bg-card-hover)' }}>All Priority</option>
              {PRIORITIES.map(p => <option key={p} value={p} style={{ background: 'var(--bg-card-hover)' }}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* ticket items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          {listLoading ? (
            <div className="flex justify-center pt-10"><LoadingSpinner size="md" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-14 gap-3 text-center px-4">
              <AlertCircle className="w-7 h-7 text-gray-600" />
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">No tickets</p>
            </div>
          ) : filtered.map(t => {
            const pm = priorityMeta(t.priority);
            const sm = statusMeta(t.status);
            const active = selectedId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left px-3 py-3 border-l-2 transition-all relative group
                  ${active
                    ? 'border-l-primary-500 bg-primary-500/5'
                    : 'border-l-transparent hover:border-l-white/10 hover:bg-white/3'}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-gray-500">#{t.id.slice(0, 8)}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${sm.cls}`}>
                    {t.status}
                  </span>
                </div>
                <h4 className={`text-xs font-bold truncate mb-2 ${active ? 'text-white' : 'text-gray-300 group-hover:text-white'} transition-colors`}>
                  {t.title}
                </h4>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-1 text-[10px] ${pm.cls} px-1.5 py-0.5 rounded font-bold`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${pm.dot}`} />
                    {t.priority}
                  </div>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{timeAgo(t.updated_at)}
                  </span>
                </div>
                {t.assigned_to && (
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-primary-400 font-medium">
                    <UserCheck className="w-3 h-3" />{t.assigned_to.name}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* footer stats */}
        <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
          <span>{tickets.filter(t => t.status === 'Open').length} open</span>
          <button onClick={fetchTickets} className="hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* ══ MIDDLE: Conversation ══════════════════════════════════ */}
      <main className={`${selectedId ? 'flex' : 'hidden lg:flex'} flex-1 flex-col min-w-0 border-r border-white/5`}>
        {!selectedId ? (
          /* empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center">
              <LifeBuoy className="w-7 h-7 text-gray-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Select a Ticket</h3>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                Choose a ticket from the left panel to view the conversation, or create a new one.
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-primary-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> New Ticket
            </button>
          </div>
        ) : detailLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Loading conversation…" />
          </div>
        ) : selectedTicket ? (
          <>
            {/* chat header */}
            <div className="px-4 sm:px-5 py-4 border-b border-white/5 flex items-start gap-3 flex-shrink-0">
              <button
                onClick={() => { setSelectedId(null); setShowProps(false); }}
                className="lg:hidden -ml-1 mt-0.5 w-8 h-8 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white flex items-center justify-center flex-shrink-0 transition-colors"
                title="Back to list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${statusMeta(selectedTicket.status).cls}`}>
                    {selectedTicket.status}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${priorityMeta(selectedTicket.priority).cls}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">#{selectedTicket.id.slice(0, 8)}</span>
                </div>
                <h3 className="text-base font-bold text-white truncate">{selectedTicket.title}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Opened by <span className="text-gray-300 font-semibold">{selectedTicket.created_by?.name}</span>
                  {' '}· {timeAgo(selectedTicket.created_at)}
                </p>
              </div>
              <button
                onClick={() => setShowProps(true)}
                className="lg:hidden mt-0.5 w-8 h-8 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white flex items-center justify-center flex-shrink-0 transition-colors"
                title="Ticket properties"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            {/* message stream */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-5 space-y-4">

              {/* original description */}
              <div className="rounded-2xl border border-primary-500/10 p-4" style={{ background: 'rgba(59,130,246,0.04)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={selectedTicket.created_by?.name} role={selectedTicket.created_by?.role} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{selectedTicket.created_by?.name}</span>
                      <RoleBadge role={selectedTicket.created_by?.role} />
                    </div>
                    <span className="text-[10px] text-gray-500">{timeAgo(selectedTicket.created_at)}</span>
                  </div>
                  <span className="ml-auto text-[10px] text-gray-600 uppercase tracking-widest font-bold">Original Issue</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* replies */}
              {selectedTicket.messages?.map(msg => {
                const isMe = msg.sender_id === user?.id;

                if (msg.is_internal) return (
                  <div key={msg.id} className="msg-bubble-internal p-3 my-1">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      <Lock className="w-3 h-3" />
                      <span>Internal Note</span>
                      <span className="ml-auto flex items-center gap-1.5 normal-case font-semibold tracking-normal">
                        {msg.sender?.name} · {timeAgo(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.body}</p>
                  </div>
                );

                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <Avatar name={msg.sender?.name} role={msg.sender?.role} />
                    <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs font-semibold text-gray-300">{msg.sender?.name}</span>
                        <RoleBadge role={msg.sender?.role} />
                        <span className="text-[10px] text-gray-500">{timeAgo(msg.created_at)}</span>
                      </div>
                      <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${isMe ? 'msg-bubble-user' : 'msg-bubble-other'}`}>
                        {msg.body}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* composer */}
            {isTicketClosed ? (
              <div className="px-5 py-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-widest">
                <Lock className="w-4 h-4" /> Ticket Closed
                {isSupportStaff && (
                  <button
                    onClick={() => handleProp('status', 'Open')}
                    className="ml-4 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors text-[10px]"
                  >
                    Re-open
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSend} className="px-4 pb-4 pt-3 border-t border-white/5 flex-shrink-0">
                {isSupportStaff && (
                  <label className="flex items-center gap-2 mb-2 cursor-pointer w-fit select-none">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={e => setIsInternal(e.target.checked)}
                      className="rounded border-white/10 bg-transparent text-amber-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className={`text-[11px] font-bold flex items-center gap-1 ${isInternal ? 'text-amber-400' : 'text-gray-500'}`}>
                      {isInternal ? <Lock className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                      {isInternal ? 'Internal note (staff only)' : 'Public reply'}
                    </span>
                  </label>
                )}
                <div
                  className={`flex items-end gap-2 rounded-xl border px-3 py-2 transition-colors ${isInternal ? 'border-amber-500/20' : 'border-white/8 focus-within:border-primary-500/40'}`}
                  style={{ background: isInternal ? 'rgba(245,158,11,0.04)' : '#1c1c1c' }}
                >
                  <textarea
                    placeholder={isInternal ? 'Write an internal note…' : 'Type a reply… (Shift+Enter for newline)'}
                    value={msgBody}
                    onChange={e => setMsgBody(e.target.value)}
                    rows={2}
                    className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder-gray-500 resize-none py-1 focus:ring-0"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!msgBody.trim() || sendingMsg}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all
                      ${isInternal
                        ? 'bg-amber-500 hover:bg-amber-600 disabled:opacity-30'
                        : 'bg-primary-500 hover:bg-primary-600 disabled:opacity-30'}`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </>
        ) : null}
      </main>

      {/* ══ RIGHT: Properties Panel ════════════════════════════════ */}
      {/* mobile backdrop */}
      {showProps && (
        <div className="lg:hidden fixed inset-x-0 z-40 bg-black/60" style={{ top: 'var(--total-header)', bottom: 'var(--bottom-nav)' }} onClick={() => setShowProps(false)} />
      )}
      <aside className={`${showProps ? 'flex' : 'hidden'} lg:flex w-full sm:w-80 lg:w-60 flex-shrink-0 flex-col border-l border-white/5 absolute lg:static inset-y-0 right-0 z-50 shadow-2xl lg:shadow-none`} style={{ background: 'var(--bg-card)' }}>
        {/* mobile close */}
        <button
          onClick={() => setShowProps(false)}
          className="lg:hidden absolute top-3 right-3 z-10 w-7 h-7 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
        {selectedTicket ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 pb-3 border-b border-white/5">Ticket Properties</h4>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-emerald-400" /> Status
              </label>
              <select
                value={selectedTicket.status}
                onChange={e => handleProp('status', e.target.value)}
                className="w-full appearance-none border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-primary-500/60 transition-colors"
                style={{ background: 'var(--bg-card-hover)' }}
              >
                {STATUSES.map(s => <option key={s} value={s} style={{ background: 'var(--bg-card-hover)' }}>{s}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-400" /> Priority
              </label>
              <select
                value={selectedTicket.priority}
                onChange={e => handleProp('priority', e.target.value)}
                disabled={!isSupportStaff}
                className="w-full appearance-none border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-primary-500/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--bg-card-hover)' }}
              >
                {PRIORITIES.map(p => <option key={p} value={p} style={{ background: 'var(--bg-card-hover)' }}>{p}</option>)}
              </select>
            </div>

            {/* Assign to */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3 h-3 text-sky-400" /> Assigned to
              </label>
              {isSupportStaff ? (
                <select
                  value={selectedTicket.assigned_to_id ?? 'unassigned'}
                  onChange={e => handleProp('assigned_to_id', e.target.value)}
                  className="w-full appearance-none border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-primary-500/60 transition-colors"
                  style={{ background: 'var(--bg-card-hover)' }}
                >
                  <option value="unassigned" style={{ background: 'var(--bg-card-hover)' }}>Unassigned</option>
                  {teamUsers
                    .filter(u => ['owner','admin','support'].includes(u.role))
                    .map(u => (
                      <option key={u.id} value={u.id} style={{ background: 'var(--bg-card-hover)' }}>
                        {u.name} ({u.role})
                      </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 border border-white/8 rounded-lg" style={{ background: 'var(--bg-card-hover)' }}>
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-300 font-medium">
                    {selectedTicket.assigned_to?.name ?? 'Unassigned'}
                  </span>
                </div>
              )}
            </div>

            {/* Escalate (support staff only) */}
            {isSupportStaff && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="w-3 h-3 text-rose-400" /> Escalate to
                </label>
                <select
                  value=""
                  onChange={e => {
                    if (e.target.value) {
                      handleProp('assigned_to_id', e.target.value);
                      handleProp('priority', selectedTicket.priority === 'Urgent' ? 'Urgent' : 'High');
                    }
                  }}
                  className="w-full appearance-none border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-rose-500/40 transition-colors"
                  style={{ background: 'var(--bg-card-hover)' }}
                >
                  <option value="" style={{ background: 'var(--bg-card-hover)' }}>Choose agent…</option>
                  {teamUsers
                    .filter(u => ['owner','admin'].includes(u.role) && u.id !== selectedTicket.assigned_to_id)
                    .map(u => (
                      <option key={u.id} value={u.id} style={{ background: 'var(--bg-card-hover)' }}>
                        ↑ {u.name} ({u.role})
                      </option>
                  ))}
                </select>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-white/5 pt-4 space-y-4">
              {/* Reporter */}
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Reporter</p>
                <div className="flex items-center gap-2">
                  <Avatar name={selectedTicket.created_by?.name} role={selectedTicket.created_by?.role} size={6} />
                  <div>
                    <p className="text-xs font-semibold text-gray-200">{selectedTicket.created_by?.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{selectedTicket.created_by?.email}</p>
                  </div>
                </div>
              </div>

              {/* Created */}
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Created</p>
                <p className="text-xs text-gray-300">
                  {new Date(selectedTicket.created_at).toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' })}
                </p>
                <p className="text-[10px] text-gray-500">
                  {new Date(selectedTicket.created_at).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
                </p>
              </div>

              {/* Last Activity */}
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Last Activity</p>
                <p className="text-xs text-gray-300">{timeAgo(selectedTicket.updated_at)}</p>
              </div>

              {/* Message count */}
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Replies</p>
                <p className="text-xs text-gray-300">{selectedTicket.messages?.length ?? 0} messages</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold text-center leading-relaxed">
              Select a ticket<br/>to view properties
            </p>
          </div>
        )}
      </aside>

      {/* ══ Create Ticket Modal ════════════════════════════════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-primary-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Raise New Issue</h3>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* modal form */}
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Title *</label>
                <input
                  required
                  type="text"
                  placeholder="Brief summary of the issue…"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors"
                  style={{ background: 'var(--bg-card-hover)' }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the issue in detail, including steps to reproduce, error messages, and expected vs actual behavior…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors resize-none"
                  style={{ background: 'var(--bg-card-hover)' }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full appearance-none border border-white/10 rounded-xl py-2.5 px-3 text-sm text-gray-100 focus:outline-none focus:border-primary-500/50 transition-colors"
                  style={{ background: 'var(--bg-card-hover)' }}
                >
                  {PRIORITIES.map(p => <option key={p} value={p} style={{ background: 'var(--bg-card-hover)' }}>{p}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/8 text-xs font-bold text-gray-400 hover:text-white hover:border-white/15 transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!form.title.trim() || !form.description.trim() || creating}
                  className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-white transition-colors uppercase tracking-widest shadow-lg shadow-primary-500/15"
                >
                  {creating ? 'Submitting…' : 'Submit Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
