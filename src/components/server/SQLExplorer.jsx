import { useState, useEffect, useRef, useCallback } from 'react';
import { Database, ChevronRight, ChevronDown, Play, Send, Table2, RefreshCw, Lock, X, Copy, Check, AlertCircle, Loader2, Layers, HardDrive, Server, Maximize2, Minimize2, Trash2, ArrowLeft } from 'lucide-react';
import { sqlAPI } from '../../api/endpoints';
import { useIsPWA } from '../../hooks/useIsPWA';
import { useMobile } from '../../hooks/useMobile';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function engineIcon(engine) {
  if (engine === 'postgres') return '🐘';
  if (engine === 'mysql') return '🐬';
  return '🗄️';
}

function engineLabel(engine) {
  if (engine === 'postgres') return 'PostgreSQL';
  if (engine === 'mysql') return 'MySQL / MariaDB';
  return 'SQLite';
}

function syntaxHighlightSQL(sql) {
  if (!sql) return '';
  const keywords = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|INDEX|AS|AND|OR|NOT|IN|IS|NULL|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END|WITH|UNION|ALL|EXISTS|BETWEEN|LIKE|SET|VALUES|INTO|RETURNING)\b/gi;
  const strings = /('[^']*'|"[^"]*")/g;
  const numbers = /\b(\d+)\b/g;

  return sql
    .replace(strings, '<span style="color:#a3e635">$1</span>')
    .replace(keywords, '<span style="color:#60a5fa;font-weight:600">$1</span>')
    .replace(numbers, '<span style="color:#f59e0b">$1</span>');
}

/* ------------------------------------------------------------------ */
/* Credential Modal                                                     */
/* ------------------------------------------------------------------ */
function CredentialModal({ engine, onConfirm, onCancel }) {
  const [creds, setCreds] = useState({ user: engine === 'postgres' ? 'postgres' : 'root', password: '', host: '', port: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-2xl p-7 w-full max-w-sm shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Lock className="w-5 h-5" style={{ color: '#818cf8' }} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Connect to {engineLabel(engine)}</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Optional — leave blank to use local socket auth</p>
          </div>
        </div>
        <div className="space-y-3">
          {['user', 'password', 'host', 'port'].map(field => (
            <div key={field}>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-secondary)' }}>{field}</label>
              <input
                type={field === 'password' ? 'password' : 'text'}
                placeholder={field === 'host' ? 'localhost' : field === 'port' ? (engine === 'postgres' ? '5432' : '3306') : ''}
                value={creds[field]}
                onChange={e => setCreds(p => ({ ...p, [field]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={() => onConfirm(creds)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>Connect</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Schema Tree                                                          */
/* ------------------------------------------------------------------ */
function SchemaTree({ schema }) {
  const [openTables, setOpenTables] = useState({});
  const toggle = t => setOpenTables(p => ({ ...p, [t]: !p[t] }));

  if (!schema || Object.keys(schema).length === 0) {
    return <p className="text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>No tables found</p>;
  }

  return (
    <div className="space-y-0.5">
      {Object.entries(schema).map(([table, cols]) => (
        <div key={table}>
          <button
            onClick={() => toggle(table)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-xs font-semibold transition-all"
            style={{ background: openTables[table] ? 'rgba(99,102,241,0.12)' : 'transparent', color: 'var(--text-primary)' }}
          >
            {openTables[table] ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
            <Table2 className="w-3 h-3 shrink-0" style={{ color: '#818cf8' }} />
            <span className="truncate">{table}</span>
            <span className="ml-auto font-normal text-[10px]" style={{ color: 'var(--text-secondary)' }}>{cols.length}</span>
          </button>
          {openTables[table] && (
            <div className="ml-7 mb-1">
              {cols.map(col => (
                <div key={col.name} className="flex items-center gap-2 px-2 py-1 text-[11px]">
                  <span className="truncate" style={{ color: 'var(--text-primary)' }}>{col.name}</span>
                  <span className="ml-auto shrink-0 font-mono text-[10px]" style={{ color: '#a3e635' }}>{col.type}</span>
                  {col.nullable && <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>?</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Result Table                                                         */
/* ------------------------------------------------------------------ */
function ResultTable({ columns, rows }) {
  const PAGE = 50;
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const sorted = sortCol !== null ? [...rows].sort((a, b) => {
    const av = a[sortCol] ?? '';
    const bv = b[sortCol] ?? '';
    return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  }) : rows;

  const paged = sorted.slice(page * PAGE, (page + 1) * PAGE);
  const totalPages = Math.ceil(sorted.length / PAGE);

  const handleSort = idx => {
    if (sortCol === idx) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(idx); setSortDir('asc'); }
    setPage(0);
  };

  if (!columns.length && !rows.length) return null;

  return (
    <div>
      <div className="overflow-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.07)', maxHeight: 340 }}>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
              {columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(i)}
                  className="px-3 py-2 text-left font-semibold cursor-pointer select-none whitespace-nowrap"
                  style={{ color: '#818cf8', borderBottom: '1px solid rgba(255,255,255,0.07)', userSelect: 'none' }}
                >
                  {col} {sortCol === i ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {cell === null || cell === undefined ? <span style={{ color: 'var(--text-secondary)' }}>NULL</span> : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-2">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded text-xs disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.05)' }}>←</button>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Page {page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded text-xs disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.05)' }}>→</button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chat Message                                                         */
/* ------------------------------------------------------------------ */
function ChatMessage({ msg }) {
  const [copied, setCopied] = useState(false);

  const copySQL = () => {
    navigator.clipboard.writeText(msg.sql || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.type === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.type === 'loading') {
    return (
      <div className="flex gap-3 mb-4">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.15)' }}>
          <Database className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#818cf8' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Generating SQL...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(99,102,241,0.15)' }}>
        <Database className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
      </div>
      <div className="flex-1 min-w-0">
        {msg.error ? (
          <div className="flex items-start gap-2 px-4 py-3 rounded-2xl rounded-tl-sm text-sm mb-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
            <div>
              <p className="font-semibold text-xs mb-0.5" style={{ color: '#f87171' }}>Error</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{msg.error}</p>
            </div>
          </div>
        ) : null}

        {msg.sql && (
          <div className="rounded-xl mb-2 overflow-hidden" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs font-semibold" style={{ color: '#818cf8' }}>Generated SQL</span>
              <div className="flex items-center gap-2">
                {msg.rowCount !== undefined && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(163,230,53,0.15)', color: '#a3e635' }}>
                    {msg.rowCount} rows
                  </span>
                )}
                <button onClick={copySQL} className="p-1 rounded transition-all" style={{ color: copied ? '#a3e635' : 'var(--text-secondary)' }}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <pre className="px-4 py-3 text-xs overflow-x-auto font-mono leading-relaxed"
              style={{ color: '#e2e8f0' }}
              dangerouslySetInnerHTML={{ __html: syntaxHighlightSQL(msg.sql) }}
            />
          </div>
        )}

        {msg.columns && msg.columns.length > 0 && (
          <ResultTable columns={msg.columns} rows={msg.rows || []} />
        )}

        {!msg.error && !msg.sql && (
          <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
            Query executed. No results returned.
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Component                                                       */
/* ------------------------------------------------------------------ */
export default function SQLExplorer({ serverId }) {
  const isPWA = useIsPWA();
  const isMobile = useMobile();
  const mobileLayout = isPWA || isMobile;
  const [mobileView, setMobileView] = useState('databases'); // 'databases' | 'query'

  // Discovery
  const [engines, setEngines] = useState([]);
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState('');

  // Connection state
  const [selectedEngine, setSelectedEngine] = useState(null);  // { engine, path?, host?, port? }
  const [credentials, setCredentials] = useState(null);         // { user, password, host, port }
  const [showCredModal, setShowCredModal] = useState(false);
  const [pendingEngine, setPendingEngine] = useState(null);

  // Databases
  const [databases, setDatabases] = useState([]);
  const [loadingDbs, setLoadingDbs] = useState(false);
  const [selectedDb, setSelectedDb] = useState(null);

  // Schema
  const [schema, setSchema] = useState({});
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [schemaExpanded, setSchemaExpanded] = useState(true);

  // Chat
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [querying, setQuerying] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sidebar collapse on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Full screen mode
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Exit full screen on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ---------- Discover engines on mount ---------- */
  const discover = useCallback(async () => {
    setDiscovering(true);
    setDiscoverError('');
    try {
      const res = await sqlAPI.discover(serverId);
      setEngines(res.data.engines || []);
      if (!res.data.engines?.length) setDiscoverError('No database engines detected on this server.');
    } catch (e) {
      setDiscoverError(e.response?.data?.detail || 'Failed to discover databases.');
    } finally {
      setDiscovering(false);
    }
  }, [serverId]);

  useEffect(() => { discover(); }, [discover]);

  /* ---------- Connect to an engine ---------- */
  const connectEngine = async (engineEntry, creds) => {
    setSelectedEngine(engineEntry);
    setCredentials(creds);
    setDatabases([]);
    setSelectedDb(null);
    setSchema({});
    setMessages([]);
    setLoadingDbs(true);

    try {
      const conn = buildConn(engineEntry, creds);
      const res = await sqlAPI.listDatabases(serverId, conn);
      setDatabases(res.data.databases || []);
    } catch (e) {
      setDatabases([]);
    } finally {
      setLoadingDbs(false);
    }
  };

  const handleEngineClick = (entry) => {
    if (entry.engine === 'sqlite') {
      // SQLite needs no credentials, connect directly
      connectEngine(entry, {});
      return;
    }
    setPendingEngine(entry);
    setShowCredModal(true);
  };

  const handleCredConfirm = (creds) => {
    setShowCredModal(false);
    connectEngine(pendingEngine, creds);
    setPendingEngine(null);
  };

  /* ---------- Select database & load schema ---------- */
  const selectDatabase = async (db) => {
    setSelectedDb(db);
    setSchema({});
    setMessages([]);
    setLoadingSchema(true);
    if (mobileLayout) {
      setMobileView('query');
    }
    try {
      const conn = buildConn(selectedEngine, credentials, db);
      const res = await sqlAPI.getSchema(serverId, conn);
      setSchema(res.data.schema || {});
    } catch (e) {
      setSchema({});
    } finally {
      setLoadingSchema(false);
    }
  };

  /* ---------- Build connection payload ---------- */
  const buildConn = (engineEntry, creds, db) => {
    const conn = { engine: engineEntry?.engine || 'postgres' };
    if (engineEntry?.path) conn.path = engineEntry.path;
    if (db) conn.database = db;
    if (creds?.user) conn.user = creds.user;
    if (creds?.password) conn.password = creds.password;
    if (creds?.host) conn.host = creds.host;
    if (creds?.port) conn.port = Number(creds.port);
    return conn;
  };

  /* ---------- Send NL query ---------- */
  const sendQuery = async () => {
    const q = input.trim();
    if (!q || querying || !selectedDb) return;

    setInput('');
    setMessages(prev => [...prev, { type: 'user', text: q }, { type: 'loading' }]);
    setQuerying(true);

    try {
      const conn = buildConn(selectedEngine, credentials, selectedDb);
      const res = await sqlAPI.query(serverId, { ...conn, question: q, schema });

      setMessages(prev => {
        const next = prev.filter(m => m.type !== 'loading');
        return [...next, {
          type: 'bot',
          sql: res.data.sql,
          columns: res.data.columns,
          rows: res.data.rows,
          rowCount: res.data.row_count,
          error: res.data.error,
        }];
      });
    } catch (e) {
      setMessages(prev => {
        const next = prev.filter(m => m.type !== 'loading');
        return [...next, { type: 'bot', error: e.response?.data?.detail || 'Request failed' }];
      });
    } finally {
      setQuerying(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuery(); }
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div
      className={isFullScreen ? "fixed inset-0 z-50 flex gap-4 overflow-hidden p-6 animate-in zoom-in-95 duration-200 bg-[var(--bg-main)]" : mobileLayout ? "flex flex-col h-[580px] gap-4 overflow-hidden" : "flex h-[calc(100vh-220px)] min-h-[520px] gap-4 overflow-hidden"}
    >

      {/* ---- Credential Modal ---- */}
      {showCredModal && pendingEngine && (
        <CredentialModal
          engine={pendingEngine.engine}
          onConfirm={handleCredConfirm}
          onCancel={() => { setShowCredModal(false); setPendingEngine(null); }}
        />
      )}

      {/* ============================== SIDEBAR ============================== */}
      {(!mobileLayout || mobileView === 'databases') && (
        <div
          className="flex flex-col rounded-2xl overflow-hidden shrink-0 animate-in fade-in duration-200"
          style={{
            width: mobileLayout ? '100%' : (sidebarOpen ? 240 : 48),
            transition: 'width 0.25s ease',
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Sidebar header */}
          <div className="flex items-center gap-2 px-3 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {!mobileLayout && (
              <button
                onClick={() => setSidebarOpen(v => !v)}
                className="p-1.5 rounded-lg transition-all hover:bg-white/5"
                style={{ color: '#818cf8' }}
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                <Layers className="w-4 h-4" />
              </button>
            )}
            {mobileLayout && (
              <div className="p-1 rounded-lg" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Layers className="w-4 h-4 text-[#818cf8]" />
              </div>
            )}
            {(sidebarOpen || mobileLayout) && <span className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>Databases</span>}
            {(sidebarOpen || mobileLayout) && (
              <button onClick={discover} disabled={discovering} className="ml-auto p-1 rounded transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }} title="Refresh">
                <RefreshCw className={`w-3.5 h-3.5 ${discovering ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {(sidebarOpen || mobileLayout) && (
          <div className="flex-1 overflow-y-auto py-2">
            {discovering && (
              <div className="flex items-center gap-2 px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...
              </div>
            )}

            {discoverError && !discovering && (
              <div className="px-3 py-3">
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{discoverError}</span>
                </div>
              </div>
            )}

            {/* Engine groups */}
            {['postgres', 'mysql', 'sqlite'].map(eng => {
              const items = engines.filter(e => e.engine === eng);
              if (!items.length) return null;
              return (
                <div key={eng} className="mb-1">
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <span className="text-base">{engineIcon(eng)}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{engineLabel(eng)}</span>
                  </div>
                  {items.map((entry, i) => (
                    <button
                      key={i}
                      onClick={() => handleEngineClick(entry)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-all"
                      style={{
                        background: selectedEngine === entry ? 'rgba(99,102,241,0.15)' : 'transparent',
                        color: selectedEngine === entry ? '#a5b4fc' : 'var(--text-primary)',
                        borderLeft: selectedEngine === entry ? '2px solid #818cf8' : '2px solid transparent',
                      }}
                    >
                      <Server className="w-3 h-3 shrink-0" />
                      <span className="truncate">{entry.path ? entry.path.split('/').pop() : `${entry.host || 'localhost'}:${entry.port}`}</span>
                    </button>
                  ))}
                </div>
              );
            })}

            {/* Database list for selected engine */}
            {selectedEngine && databases.length > 0 && (
              <div className="mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Databases</span>
                </div>
                {loadingDbs ? (
                  <div className="px-4 py-2 text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                  </div>
                ) : (
                  databases.map(db => (
                    <button
                      key={db}
                      onClick={() => selectDatabase(db)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-all"
                      style={{
                        background: selectedDb === db ? 'rgba(99,102,241,0.12)' : 'transparent',
                        color: selectedDb === db ? '#a5b4fc' : 'var(--text-primary)',
                        borderLeft: selectedDb === db ? '2px solid #818cf8' : '2px solid transparent',
                      }}
                    >
                      <HardDrive className="w-3 h-3 shrink-0" />
                      <span className="truncate">{db}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* ============================== MAIN AREA ============================== */}
      {(!mobileLayout || mobileView === 'query') && (
        <div className="flex flex-col flex-1 gap-4 min-w-0 overflow-hidden animate-in fade-in duration-200">

        {/* Schema panel (collapsible) */}
        {selectedDb && (
          <div className="rounded-2xl shrink-0" style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
              onClick={() => setSchemaExpanded(v => !v)}
              style={{ borderBottom: schemaExpanded ? '1px solid rgba(255,255,255,0.07)' : 'none' }}
            >
              {schemaExpanded ? <ChevronDown className="w-4 h-4" style={{ color: '#818cf8' }} /> : <ChevronRight className="w-4 h-4" style={{ color: '#818cf8' }} />}
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Schema — {selectedDb}</span>
              {loadingSchema && <Loader2 className="w-3.5 h-3.5 animate-spin ml-2" style={{ color: '#818cf8' }} />}
              <span className="ml-auto text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                {Object.keys(schema).length} tables
              </span>
            </button>
            {schemaExpanded && (
              <div className="px-2 py-2 max-h-48 overflow-y-auto">
                <SchemaTree schema={schema} />
              </div>
            )}
          </div>
        )}

        {/* Chat / Query panel */}
        <div className="flex flex-col flex-1 rounded-2xl overflow-hidden min-h-0" style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Panel header */}
          <div className="flex items-center gap-3 px-5 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {mobileLayout && (
              <button
                onClick={() => setMobileView('databases')}
                className="p-1 rounded-lg transition-all hover:bg-white/5 text-[var(--accent-mint)] -ml-2 mr-1 flex items-center justify-center"
                title="Back to databases"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Database className="w-4 h-4" style={{ color: '#818cf8' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>SQL Query Assistant</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {selectedDb
                  ? `Connected to ${engineIcon(selectedEngine?.engine || '')} ${selectedDb} — ask anything in plain English`
                  : 'Select a database to start querying'}
              </p>
            </div>
            {/* Actions group */}
            <div className="ml-auto flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="p-1.5 rounded-lg transition-all hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-400"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsFullScreen(p => !p)}
                className="p-1.5 rounded-lg transition-all hover:bg-white/5 text-[var(--text-secondary)] hover:text-white"
                title={isFullScreen ? 'Exit full screen (Esc)' : 'Make full screen'}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {!selectedDb && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Database className="w-8 h-8" style={{ color: '#818cf8' }} />
                </div>
                <div>
                  <p className="font-bold text-sm mb-1">No database selected</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Click a database engine in the sidebar to connect and explore</p>
                </div>
              </div>
            )}

            {selectedDb && messages.length === 0 && !querying && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.15)' }}>
                  <span className="text-3xl">💬</span>
                </div>
                <div>
                  <p className="font-bold text-sm mb-2">Ready to query <span style={{ color: '#818cf8' }}>{selectedDb}</span></p>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Type a question below and I'll convert it to SQL and run it</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Show all tables', 'How many rows in each table?', 'Show the last 10 records'].map(ex => (
                      <button
                        key={ex}
                        onClick={() => setInput(ex)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
                        style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
            <div ref={chatEndRef} />
          </div>

          {/* Input bar */}
          <div className="shrink-0 px-4 pb-4 pt-2">
            <div className="flex items-end gap-3 p-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={!selectedDb || querying}
                placeholder={selectedDb ? 'Ask in plain English… (Enter to send)' : 'Select a database first'}
                className="flex-1 bg-transparent text-sm resize-none outline-none"
                style={{
                  color: 'var(--text-primary)',
                  minHeight: 36,
                  maxHeight: 120,
                  lineHeight: '1.5',
                  paddingTop: 8,
                  paddingLeft: 8,
                }}
              />
              <button
                onClick={sendQuery}
                disabled={!selectedDb || !input.trim() || querying}
                className="shrink-0 p-2.5 rounded-xl transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                {querying ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
