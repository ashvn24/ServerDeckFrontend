import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LifeBuoy, Search, Send, Clock, User, CheckCircle,
  MessageSquare, AlertTriangle, Lock, UserCheck, X, AlertCircle,
  Filter, ArrowLeft, Info, Copy, Check
} from 'lucide-react';
import { adminAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { timeAgo } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import { useMobile } from '../../hooks/useMobile';
import { useIsPWA } from '../../hooks/useIsPWA';

const STATUSES   = ['Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

function priorityMeta(p) {
  switch (p) {
    case 'Urgent': return { cls: 'bg-red-500/10 text-red-500 border border-red-500/20',   dot: 'bg-red-500' };
    case 'High':   return { cls: 'bg-amber-500/10 text-amber-500 border border-amber-500/20', dot: 'bg-amber-500' };
    case 'Medium': return { cls: 'bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] border border-[var(--accent-mint)]/20', dot: 'bg-[var(--accent-mint)]' };
    default:       return { cls: 'bg-white/5 text-[var(--text-secondary)] border border-white/5',  dot: 'bg-gray-500' };
  }
}

function statusMeta(s) {
  switch (s) {
    case 'Open':                return { cls: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 status-open' };
    case 'In Progress':         return { cls: 'bg-sky-500/10 text-sky-500 border border-sky-500/20' };
    case 'Waiting on Customer': return { cls: 'bg-orange-500/10 text-orange-500 border border-orange-500/20' };
    case 'Resolved':            return { cls: 'bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] border border-[var(--accent-mint)]/20' };
    case 'Closed':              return { cls: 'bg-white/5 text-[var(--text-secondary)] border border-white/5' };
    default:                    return { cls: 'bg-white/5 text-[var(--text-secondary)] border border-white/5' };
  }
}

function RoleBadge({ role, isSupport }) {
  if (isSupport) {
    return <span className="text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">SUPPORT</span>;
  }
  const map = {
    owner:   'bg-amber-500/10 text-amber-500 border border-amber-500/10',
    admin:   'bg-violet-500/10 text-violet-500 border border-violet-500/10',
    support: 'bg-sky-500/10 text-sky-500 border border-sky-500/10',
    member:  'bg-white/5 text-[var(--text-secondary)] border border-white/5',
  };
  return (
    <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest ${map[role] ?? map.member}`}>
      {role}
    </span>
  );
}

function Avatar({ name, isSupport }) {
  if (isSupport) {
    return (
      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
        <LifeBuoy className="w-5 h-5 text-emerald-500" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/5 flex items-center justify-center font-black text-[var(--text-primary)] uppercase tracking-widest text-sm shrink-0">
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

export default function AdminTickets() {
  const { user } = useAuth();
  const ws        = useWebSocket();

  const [tickets,        setTickets]        = useState([]);
  const [selectedId,     setSelectedId]     = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [listLoading,    setListLoading]    = useState(true);
  const [detailLoading,  setDetailLoading]  = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [statusFilter,   setStatusFilter]   = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters,    setShowFilters]    = useState(false);
  const [msgBody,        setMsgBody]        = useState('');
  const [sendingMsg,     setSendingMsg]     = useState(false);
  const [showProps,      setShowProps]      = useState(false);
  const [closingProps,   setClosingProps]   = useState(false);
  
  const [longPressMsg,   setLongPressMsg]   = useState(null);
  const [copied,         setCopied]         = useState(false);
  const longPressTimer                      = useRef(null);

  const handleCloseProps = useCallback(() => {
    setClosingProps(true);
    setTimeout(() => {
      setShowProps(false);
      setClosingProps(false);
    }, 400);
  }, []);

  const chatEndRef       = useRef(null);
  const selectedIdRef    = useRef(null);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const isTicketClosed = selectedTicket?.status === 'Closed';

  const scrollBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setListLoading(true);
      const res = await adminAPI.listTickets();
      // Client-side filter
      let filtered = res.data;
      if (statusFilter) filtered = filtered.filter(t => t.status === statusFilter);
      if (priorityFilter) filtered = filtered.filter(t => t.priority === priorityFilter);
      setTickets(filtered);
    } catch (e) {
      console.error(e);
    }
    finally { setListLoading(false); }
  }, [statusFilter, priorityFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

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

  useEffect(() => {
    if (!selectedId || !ws?.subscribeTicket) return;
    ws.subscribeTicket(selectedId);
    return () => ws.unsubscribeTicket(selectedId);
  }, [selectedId, ws]);

  useEffect(() => {
    if (!selectedId) { setSelectedTicket(null); return; }
    setDetailLoading(true);
    adminAPI.getTicket(selectedId)
      .then(r => { setSelectedTicket(r.data); scrollBottom(); })
      .catch(console.error)
      .finally(() => setDetailLoading(false));
  }, [selectedId, scrollBottom]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msgBody.trim() || !selectedId || sendingMsg) return;
    setSendingMsg(true);
    try {
      await adminAPI.addTicketMessage(selectedId, {
        body: msgBody,
        is_internal: false, // Platform owner doesn't need internal notes for self
      });
      setMsgBody('');
      scrollBottom();
    } catch (e) { console.error(e); }
    finally { setSendingMsg(false); }
  };

  const handleProp = async (field, value) => {
    if (!selectedId) return;
    try {
      await adminAPI.updateTicket(selectedId, { [field]: value });
    } catch (e) { console.error(e); }
  };

  const filtered = tickets.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex gap-0 overflow-hidden border border-[var(--border-color)] bg-[var(--bg-main)] rounded-2xl h-[calc(100vh-16rem)] min-h-[500px]">
      {/* LEFT: Ticket List */}
      <aside className={`${selectedId ? 'hidden lg:flex' : 'flex'} w-full lg:w-[350px] flex-shrink-0 flex-col border-r border-[var(--border-color)] bg-[var(--bg-card)]`}>
        <div className="p-4 md:p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="SEARCH..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-10 bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl pl-8 pr-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent-mint)] outline-none transition-all"
              />
            </div>

            {/* Filter Icon */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center transition-all ${
                showFilters || statusFilter || priorityFilter
                  ? 'bg-[var(--accent-mint)]/10 border-[var(--accent-mint)]/20 text-[var(--accent-mint)]'
                  : 'bg-[var(--bg-card-hover)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {showFilters && (
            <div className="flex gap-2 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="flex-1 bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] focus:border-[var(--accent-mint)] outline-none transition-all appearance-none"
                >
                  <option value="">ALL STATUS</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="flex-1 bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] focus:border-[var(--accent-mint)] outline-none transition-all appearance-none"
                >
                  <option value="">ALL PRIORITY</option>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {listLoading ? (
            <div className="flex justify-center pt-10"><LoadingSpinner size="md" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-14 gap-4 text-center px-4">
              <div className="p-4 bg-white/5 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-[var(--text-secondary)]" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">No tickets found</p>
            </div>
          ) : filtered.map(t => {
            const pm = priorityMeta(t.priority);
            const sm = statusMeta(t.status);
            const active = selectedId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all relative group
                  ${active
                    ? 'border-[var(--accent-mint)] bg-[var(--accent-mint)]/10'
                    : 'border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-card-hover)]'}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">#{t.id.slice(0, 8)}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest ${sm.cls}`}>
                    {t.status}
                  </span>
                </div>
                <h4 className={`text-sm font-black uppercase tracking-tight truncate mb-3 ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'} transition-colors`}>
                  {t.title}
                </h4>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-widest ${pm.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${pm.dot}`} />
                    {t.priority}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />{timeAgo(t.updated_at)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* MIDDLE: Conversation */}
      <main className={`${selectedId ? 'flex' : 'hidden lg:flex'} flex-1 flex-col min-w-0 border-r border-[var(--border-color)] relative`}>
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-8">
            <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-[var(--border-color)] flex items-center justify-center shadow-inner">
              <MessageSquare className="w-8 h-8 text-[var(--text-secondary)]" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight font-display text-[var(--text-primary)] mb-2">Select a Ticket</h3>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest max-w-xs leading-relaxed">
                Choose an issue from the panel to view the conversation and reply to the user.
              </p>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="lg" text="SYNCING THREAD..." />
          </div>
        ) : selectedTicket ? (
          <>
            {/* Chat Header */}
            <div className="px-4 md:px-6 py-3 border-b border-[var(--border-color)] flex items-center gap-3 md:gap-4 bg-[var(--bg-card-hover)]">
              <button
                onClick={() => { setSelectedId(null); handleCloseProps(); }}
                className="lg:hidden p-1.5 -ml-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <h3 className="text-sm md:text-base font-black text-[var(--text-primary)] uppercase tracking-tight truncate leading-tight">{selectedTicket.title}</h3>
              </div>
              <button
                onClick={() => setShowProps(true)}
                className="lg:hidden p-1.5 -mr-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[var(--border-color)]">
                  <Avatar name={selectedTicket.created_by?.name} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black uppercase tracking-tight text-[var(--text-primary)]">{selectedTicket.created_by?.name}</span>
                      <RoleBadge role={selectedTicket.created_by?.role} />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">{timeAgo(selectedTicket.created_at)}</span>
                  </div>
                  <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-[var(--accent-mint)] px-2 py-1 rounded-lg bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20">Original Issue</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap font-medium">{selectedTicket.description}</p>
              </div>

              {selectedTicket.messages?.map(msg => {
                // If sender_id is null, it's a message from Platform Support (which is us)
                const isSupportMessage = !msg.sender_id;
                const isMe = isSupportMessage;

                const startLongPress = (e) => {
                  const el = e.currentTarget.querySelector('[data-bubble]');
                  longPressTimer.current = setTimeout(() => {
                    const rect = el ? el.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
                    setLongPressMsg({ id: msg.id, body: msg.body, rect, isMe });
                    setCopied(false);
                  }, 500);
                };
                const cancelLongPress = () => clearTimeout(longPressTimer.current);

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}
                    onTouchStart={startLongPress}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                  >
                    <Avatar name={msg.sender?.name} isSupport={isSupportMessage} />
                    <div className={`max-w-[85%] md:max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs font-black uppercase tracking-tight text-[var(--text-secondary)]">
                          {isSupportMessage ? 'ServerDeck Support' : msg.sender?.name}
                        </span>
                        <RoleBadge role={msg.sender?.role} isSupport={isSupportMessage} />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">{timeAgo(msg.created_at)}</span>
                      </div>
                      <div
                        data-bubble
                        className={`px-5 py-3.5 text-sm font-medium leading-relaxed whitespace-pre-wrap shadow-lg ${
                          isMe
                            ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-400 rounded-[22px] rounded-tr-[4px] border border-emerald-500/20 shadow-emerald-500/10'
                            : 'bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-card-hover)] text-[var(--text-primary)] rounded-[22px] rounded-tl-[4px] border border-[var(--border-color)] shadow-black/5'
                        }`}
                        style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                      >
                        {msg.body}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} className="h-6 shrink-0" />

              {/* Long-press copy menu */}
              {longPressMsg && (
                <>
                  <div className="fixed inset-0 z-[300]" onTouchStart={() => setLongPressMsg(null)} onClick={() => setLongPressMsg(null)} />
                  <div
                    className="fixed z-[310] flex items-center gap-1 px-1 py-1 rounded-2xl bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60"
                    style={{ left: longPressMsg.rect.left + longPressMsg.rect.width / 2, top: longPressMsg.rect.top - 8, transform: 'translate(-50%, -100%)' }}
                  >
                    <button
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                      style={{ color: copied ? 'var(--accent-mint)' : '#fff' }}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(longPressMsg.body);
                        } catch {
                          const ta = document.createElement('textarea');
                          ta.value = longPressMsg.body;
                          ta.style.position = 'fixed';
                          ta.style.opacity = '0';
                          document.body.appendChild(ta);
                          ta.focus();
                          ta.select();
                          document.execCommand('copy');
                          document.body.removeChild(ta);
                        }
                        setCopied(true);
                        setTimeout(() => setLongPressMsg(null), 900);
                      }}
                    >
                      {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                  </div>
                  <div
                    className="fixed z-[310] w-3 h-3 rotate-45 bg-[#1c1c1e]/95 border-b border-r border-white/10"
                    style={{ left: longPressMsg.rect.left + longPressMsg.rect.width / 2, top: longPressMsg.rect.top - 9, transform: 'translate(-50%, -100%) rotate(45deg)', marginTop: '-1px' }}
                  />
                </>
              )}
            </div>

            {/* Composer */}
            {isTicketClosed ? (
              <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-card-hover)] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                  <Lock className="w-4 h-4" /> Ticket Closed
                </div>
                <button
                  onClick={() => handleProp('status', 'Open')}
                  className="px-6 py-3 accent-bg-green rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-emerald-500/20 text-[#2c2c2e]"
                >
                  Re-open Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="p-2 md:p-4 bg-[var(--bg-main)] border-t border-[var(--border-color)]">
                <div className="flex items-end gap-2 w-full max-w-4xl mx-auto">
                  <div className="flex-1 flex items-end gap-1 rounded-3xl bg-[var(--bg-card)] transition-all pr-1.5 ring-1 ring-[var(--border-color)] focus-within:ring-[var(--accent-mint)]">
                    <textarea
                      placeholder="Reply as Support..."
                      value={msgBody}
                      onChange={e => {
                        setMsgBody(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      rows={1}
                      style={{ minHeight: '40px', maxHeight: '120px' }}
                      className="flex-1 bg-transparent border-0 outline-none text-sm font-medium resize-none py-3 pl-4 pr-1 focus:ring-0 custom-scrollbar text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { 
                          e.preventDefault(); 
                          handleSend(e);
                          e.target.style.height = 'auto';
                        }
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!msgBody.trim() || sendingMsg}
                    className="shrink-0 mb-1 w-10 h-10 rounded-full flex items-center justify-center transition-all accent-bg-green hover:brightness-110 disabled:opacity-30 disabled:hover:scale-100 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 text-[#2c2c2e]"
                  >
                    <Send className="w-4 h-4 ml-0.5 text-[#2c2c2e]" />
                  </button>
                </div>
              </form>
            )}
          </>
        ) : null}
      </main>

      {/* RIGHT: Properties Panel */}
      {(showProps || closingProps) && (
        <div className={`lg:hidden absolute inset-0 z-[200] bg-black/80 backdrop-blur-sm ${closingProps ? 'animate-out fade-out' : 'animate-in fade-in'}`} onClick={handleCloseProps} />
      )}
      <aside className={`${(showProps || closingProps) ? `absolute inset-y-0 right-0 z-[210] w-80 shadow-2xl border-l border-[var(--border-color)] bg-[var(--bg-main)] ${closingProps ? 'animate-out slide-out-to-right-full' : 'animate-in slide-in-from-right-full'}` : 'hidden'} lg:flex lg:static lg:w-72 lg:shadow-none lg:border-l lg:border-[var(--border-color)] lg:bg-[var(--bg-card)] flex-shrink-0 flex-col`}>
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Ticket Details</h4>
          <button
            onClick={handleCloseProps}
            className="lg:hidden p-2 rounded-xl bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {selectedTicket ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" /> Status
              </label>
              <select
                value={selectedTicket.status}
                onChange={e => handleProp('status', e.target.value)}
                className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] focus:border-[var(--accent-mint)] outline-none transition-all appearance-none"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Priority
              </label>
              <select
                value={selectedTicket.priority}
                onChange={e => handleProp('priority', e.target.value)}
                className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] focus:border-[var(--accent-mint)] outline-none transition-all appearance-none"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="pt-8 border-t border-[var(--border-color)] space-y-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3">Reporter Info</p>
                <div className="flex items-center gap-3">
                  <Avatar name={selectedTicket.created_by?.name} />
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-tight text-[var(--text-primary)] truncate">{selectedTicket.created_by?.name}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] truncate mt-0.5">{selectedTicket.created_by?.email}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1.5">Created</p>
                  <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    {new Date(selectedTicket.created_at).toLocaleDateString('en-US', { day:'numeric', month:'short' })}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1.5">Last Reply</p>
                  <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">{timeAgo(selectedTicket.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] leading-relaxed">
              Select a ticket<br/>to view details
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
