import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Server, ArrowLeft, Sun, Moon, Terminal, Lock, Globe,
  Folder, LayoutDashboard, FileText, Users, ScrollText,
  LifeBuoy, Building2, Radio, Copy, Check, KeyRound, Zap, Box
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL, WS_URL } from '../utils/constants';

/* ─────────────────────────────────────────────────────────────────
   API REFERENCE
   A data-driven, in-depth reference for every endpoint the
   ServerDeck client talks to (see src/api/endpoints.js) plus the
   realtime WebSocket channel (see src/hooks/useWebSocket.js).
   ───────────────────────────────────────────────────────────────── */

const METHOD_STYLES = {
  GET:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  POST:   'text-sky-400 bg-sky-500/10 border-sky-500/25',
  PATCH:  'text-amber-400 bg-amber-500/10 border-amber-500/25',
  PUT:    'text-amber-400 bg-amber-500/10 border-amber-500/25',
  DELETE: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
  WS:     'text-violet-400 bg-violet-500/10 border-violet-500/25',
};

/* ── Reusable bits ───────────────────────────────────────────────── */
function MethodBadge({ method }) {
  return (
    <span className={`inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${METHOD_STYLES[method] ?? METHOD_STYLES.GET}`}>
      {method}
    </span>
  );
}

function CodeBlock({ code, label }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: 'var(--bg-card-hover)' }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-[var(--text-primary)] transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto custom-scrollbar text-[12px] leading-relaxed font-mono text-gray-300 whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

function ParamTable({ title, rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{title}</p>
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/8" style={{ background: 'var(--bg-card-hover)' }}>
              <th className="px-3 py-2 font-bold text-gray-400 uppercase tracking-wider text-[10px]">Field</th>
              <th className="px-3 py-2 font-bold text-gray-400 uppercase tracking-wider text-[10px]">Type</th>
              <th className="px-3 py-2 font-bold text-gray-400 uppercase tracking-wider text-[10px]">Req.</th>
              <th className="px-3 py-2 font-bold text-gray-400 uppercase tracking-wider text-[10px]">Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-white/5 last:border-0">
                <td className="px-3 py-2 font-mono text-[11px] text-[var(--text-primary)] font-semibold whitespace-nowrap">{r.name}</td>
                <td className="px-3 py-2 font-mono text-[11px] text-violet-400 whitespace-nowrap">{r.type}</td>
                <td className="px-3 py-2">
                  {r.required
                    ? <span className="text-[10px] font-bold text-rose-400 uppercase">Yes</span>
                    : <span className="text-[10px] font-bold text-gray-500 uppercase">No</span>}
                </td>
                <td className="px-3 py-2 text-gray-400 leading-relaxed">{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Endpoint({ ep }) {
  return (
    <div className="rounded-2xl border border-white/8 p-5 space-y-4" style={{ background: 'var(--bg-card)' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <MethodBadge method={ep.method} />
          <code className="text-sm font-mono font-semibold text-[var(--text-primary)] break-all">{ep.path}</code>
        </div>
        {ep.auth === false
          ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400"><Globe className="w-3 h-3" /> Public</span>
          : <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400"><Lock className="w-3 h-3" /> Bearer token</span>}
      </div>

      <p className="text-sm text-gray-400 leading-relaxed">{ep.description}</p>
      {ep.role && (
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-md px-2 py-1">
          <KeyRound className="w-3 h-3" /> Requires role: {ep.role}
        </div>
      )}

      <ParamTable title="Path parameters" rows={ep.pathParams} />
      <ParamTable title="Query parameters" rows={ep.queryParams} />
      <ParamTable title="Request body" rows={ep.body} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {ep.request && <CodeBlock label="Example request" code={ep.request} />}
        {ep.response && <CodeBlock label="Example response" code={ep.response} />}
      </div>
    </div>
  );
}

/* ── The reference data ──────────────────────────────────────────── */
const SECTIONS = [
  {
    id: 'authentication',
    title: 'Authentication',
    icon: KeyRound,
    intro: `All authenticated endpoints expect a JSON Web Token (JWT) in the Authorization header as a Bearer token. Obtain a token by registering or logging in — both return an "access_token" that is valid for the session. The client stores it in localStorage under "serverdeck_token" and attaches it automatically to every request. A 401 response clears the stored session and redirects to the login screen.`,
    endpoints: [
      {
        method: 'POST', path: '/auth/register', auth: false,
        description: 'Create a new operator account and start a session. Returns a JWT plus the authenticated user profile.',
        body: [
          { name: 'name', type: 'string', required: true, desc: 'Full name of the operator.' },
          { name: 'email', type: 'string', required: true, desc: 'Unique login email.' },
          { name: 'password', type: 'string', required: true, desc: 'Account password.' },
        ],
        request: `curl -X POST ${API_BASE_URL}/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "password": "s3cret"
  }'`,
        response: `{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "usr_8f3a...",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "role": "owner"
  },
  "is_platform_owner": false
}`,
      },
      {
        method: 'POST', path: '/auth/login', auth: false,
        description: 'Authenticate with email and password. Returns a JWT, the user profile, and whether the account is a platform owner.',
        body: [
          { name: 'email', type: 'string', required: true, desc: 'Account email.' },
          { name: 'password', type: 'string', required: true, desc: 'Account password.' },
        ],
        request: `curl -X POST ${API_BASE_URL}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{ "email": "ada@example.com", "password": "s3cret" }'`,
        response: `{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "usr_8f3a...", "name": "Ada Lovelace", "role": "owner" },
  "is_platform_owner": false
}`,
      },
    ],
  },
  {
    id: 'servers',
    title: 'Servers',
    icon: Server,
    intro: 'Manage the Linux hosts in your fleet. Servers can be organised into folders and are provisioned by running a one-time install command on the target machine.',
    endpoints: [
      {
        method: 'GET', path: '/servers/',
        description: 'List every server the current tenant owns, including online status and folder placement.',
        request: `curl ${API_BASE_URL}/servers/ \\
  -H "Authorization: Bearer <token>"`,
        response: `[
  {
    "id": "srv_1a2b...",
    "name": "edge-web-01",
    "folder_id": "fld_55...",
    "is_online": true,
    "created_at": "2026-05-01T10:00:00Z"
  }
]`,
      },
      {
        method: 'POST', path: '/servers/',
        description: 'Register a new server record. The response includes the new server id, which is then used to fetch the install command.',
        body: [
          { name: 'name', type: 'string', required: true, desc: 'Display name for the server.' },
          { name: 'folder_id', type: 'string | null', required: false, desc: 'Folder to place the server in. Null for the root level.' },
        ],
        request: `curl -X POST ${API_BASE_URL}/servers/ \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "edge-web-01", "folder_id": null }'`,
        response: `{ "id": "srv_1a2b...", "name": "edge-web-01", "is_online": false }`,
      },
      {
        method: 'GET', path: '/servers/{id}',
        description: 'Retrieve a single server with its full detail.',
        pathParams: [{ name: 'id', type: 'string', required: true, desc: 'Server id.' }],
        request: `curl ${API_BASE_URL}/servers/srv_1a2b \\
  -H "Authorization: Bearer <token>"`,
        response: `{
  "id": "srv_1a2b...",
  "name": "edge-web-01",
  "is_online": true,
  "ip_address": "203.0.113.7",
  "os": "Ubuntu 22.04"
}`,
      },
      {
        method: 'DELETE', path: '/servers/{id}',
        description: 'Permanently remove a server from the fleet.',
        pathParams: [{ name: 'id', type: 'string', required: true, desc: 'Server id.' }],
        request: `curl -X DELETE ${API_BASE_URL}/servers/srv_1a2b \\
  -H "Authorization: Bearer <token>"`,
        response: `{ "status": "deleted" }`,
      },
      {
        method: 'PATCH', path: '/servers/{id}/move',
        description: 'Move a server into a different folder (or to the root by omitting the folder).',
        pathParams: [{ name: 'id', type: 'string', required: true, desc: 'Server id.' }],
        queryParams: [{ name: 'folder_id', type: 'string', required: false, desc: 'Destination folder id. Empty moves the server to the root.' }],
        request: `curl -X PATCH "${API_BASE_URL}/servers/srv_1a2b/move?folder_id=fld_99" \\
  -H "Authorization: Bearer <token>"`,
        response: `{ "id": "srv_1a2b...", "folder_id": "fld_99" }`,
      },
      {
        method: 'GET', path: '/servers/{id}/install-command',
        description: 'Return the one-line shell command to run on the target host to enrol it as this server.',
        pathParams: [{ name: 'id', type: 'string', required: true, desc: 'Server id.' }],
        request: `curl ${API_BASE_URL}/servers/srv_1a2b/install-command \\
  -H "Authorization: Bearer <token>"`,
        response: `{ "install_command": "curl -sSL https://serverdeck.dynamiqqr.com/install.sh | bash -s <enrol-token>" }`,
      },
    ],
  },
  {
    id: 'folders',
    title: 'Folders',
    icon: Folder,
    intro: 'Folders give the server tree its hierarchy. They can be nested via the parent_id field.',
    endpoints: [
      {
        method: 'GET', path: '/folders/',
        description: 'List all folders for the tenant.',
        request: `curl ${API_BASE_URL}/folders/ -H "Authorization: Bearer <token>"`,
        response: `[ { "id": "fld_55...", "name": "Production", "parent_id": null } ]`,
      },
      {
        method: 'POST', path: '/folders/',
        description: 'Create a new folder, optionally nested under a parent.',
        body: [
          { name: 'name', type: 'string', required: true, desc: 'Folder name.' },
          { name: 'parent_id', type: 'string | null', required: false, desc: 'Parent folder id, or null for a top-level folder.' },
        ],
        request: `curl -X POST ${API_BASE_URL}/folders/ \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "Production", "parent_id": null }'`,
        response: `{ "id": "fld_55...", "name": "Production", "parent_id": null }`,
      },
      {
        method: 'DELETE', path: '/folders/{id}',
        description: 'Delete a folder.',
        pathParams: [{ name: 'id', type: 'string', required: true, desc: 'Folder id.' }],
        request: `curl -X DELETE ${API_BASE_URL}/folders/fld_55 -H "Authorization: Bearer <token>"`,
        response: `{ "status": "deleted" }`,
      },
      {
        method: 'PATCH', path: '/folders/{id}/move',
        description: 'Re-parent a folder. Omit parent_id to move it to the root.',
        pathParams: [{ name: 'id', type: 'string', required: true, desc: 'Folder id.' }],
        queryParams: [{ name: 'parent_id', type: 'string', required: false, desc: 'New parent folder id. Empty moves to root.' }],
        request: `curl -X PATCH "${API_BASE_URL}/folders/fld_55/move?parent_id=fld_10" \\
  -H "Authorization: Bearer <token>"`,
        response: `{ "id": "fld_55...", "parent_id": "fld_10" }`,
      },
    ],
  },
  {
    id: 'sites',
    title: 'Sites',
    icon: Globe,
    intro: 'Sites are the web applications hosted on a server — either static "frontend" sites or reverse-proxied "backend" services. List and delete operations go through REST; provisioning a new site is performed over the realtime command channel (see Realtime).',
    endpoints: [
      {
        method: 'GET', path: '/sites/',
        description: 'List the sites hosted on a given server.',
        queryParams: [{ name: 'server_id', type: 'string', required: true, desc: 'The server whose sites to list.' }],
        request: `curl "${API_BASE_URL}/sites/?server_id=srv_1a2b" \\
  -H "Authorization: Bearer <token>"`,
        response: `[
  {
    "id": "site_77...",
    "domain": "app.example.com",
    "site_type": "backend",
    "upstream_port": 3000,
    "ssl": true
  }
]`,
      },
      {
        method: 'POST', path: '/sites/',
        description: 'Create a site record. Fields vary by site_type: backend sites carry an upstream_port and working_directory; frontend sites carry a root/build directory.',
        body: [
          { name: 'server_id', type: 'string', required: true, desc: 'Server that will host the site.' },
          { name: 'domain', type: 'string', required: true, desc: 'Fully-qualified domain for the site.' },
          { name: 'site_type', type: '"frontend" | "backend"', required: true, desc: 'Kind of site to provision.' },
          { name: 'upstream_port', type: 'number', required: false, desc: 'Backend only — the local port the app listens on.' },
          { name: 'working_directory', type: 'string', required: false, desc: 'Backend only — the app working directory.' },
        ],
        request: `curl -X POST ${API_BASE_URL}/sites/ \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "server_id": "srv_1a2b",
    "domain": "app.example.com",
    "site_type": "backend",
    "upstream_port": 3000,
    "working_directory": "/var/www/api"
  }'`,
        response: `{ "id": "site_77...", "domain": "app.example.com", "site_type": "backend" }`,
      },
      {
        method: 'DELETE', path: '/sites/{id}',
        description: 'Remove a site.',
        pathParams: [{ name: 'id', type: 'string', required: true, desc: 'Site id.' }],
        request: `curl -X DELETE ${API_BASE_URL}/sites/site_77 -H "Authorization: Bearer <token>"`,
        response: `{ "status": "deleted" }`,
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    intro: 'Aggregated fleet statistics for the main console.',
    endpoints: [
      {
        method: 'GET', path: '/dashboard/',
        description: 'Return summary metrics across the tenant: server counts, online/offline totals, recent activity and more.',
        request: `curl ${API_BASE_URL}/dashboard/ -H "Authorization: Bearer <token>"`,
        response: `{
  "total_servers": 12,
  "online_servers": 10,
  "total_sites": 34,
  "open_tickets": 3
}`,
      },
    ],
  },
  {
    id: 'logs',
    title: 'Logs',
    icon: FileText,
    intro: 'Tail log files from a server. Specify the log source, the log name and how many trailing lines to return.',
    endpoints: [
      {
        method: 'GET', path: '/logs/{serverId}',
        description: 'Fetch the most recent lines of a named log from a server.',
        pathParams: [{ name: 'serverId', type: 'string', required: true, desc: 'Server id.' }],
        queryParams: [
          { name: 'source', type: 'string', required: true, desc: 'Log source (e.g. "nginx", "system", "app").' },
          { name: 'name', type: 'string', required: true, desc: 'Specific log file/identifier to read.' },
          { name: 'lines', type: 'number', required: false, desc: 'Number of trailing lines to return. Default 100.' },
        ],
        request: `curl "${API_BASE_URL}/logs/srv_1a2b?source=nginx&name=access&lines=200" \\
  -H "Authorization: Bearer <token>"`,
        response: `{
  "lines": [
    "203.0.113.9 - - [06/Jun/2026:10:01:22] \\"GET / HTTP/1.1\\" 200",
    "..."
  ]
}`,
      },
    ],
  },
  {
    id: 'users',
    title: 'Users & Invitations',
    icon: Users,
    intro: 'Manage the operators within a workspace. Owners and admins can invite teammates by email, create accounts directly, and revoke access. Invite acceptance is a public flow keyed by a token.',
    endpoints: [
      {
        method: 'GET', path: '/users/',
        description: 'List all operators in the current workspace.',
        role: 'owner / admin',
        request: `curl ${API_BASE_URL}/users/ -H "Authorization: Bearer <token>"`,
        response: `[ { "id": "usr_8f3a...", "name": "Ada", "email": "ada@example.com", "role": "owner" } ]`,
      },
      {
        method: 'POST', path: '/users/invite',
        description: 'Send an email invitation for a teammate to join with a given role.',
        role: 'owner / admin',
        body: [
          { name: 'email', type: 'string', required: true, desc: 'Invitee email address.' },
          { name: 'role', type: '"admin" | "support" | "member"', required: true, desc: 'Role to grant on acceptance.' },
        ],
        request: `curl -X POST ${API_BASE_URL}/users/invite \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{ "email": "grace@example.com", "role": "support" }'`,
        response: `{ "status": "invited", "email": "grace@example.com" }`,
      },
      {
        method: 'POST', path: '/users/direct',
        description: 'Create a teammate account directly with a name and password, bypassing the email invite flow.',
        role: 'owner',
        body: [
          { name: 'email', type: 'string', required: true, desc: 'New account email.' },
          { name: 'name', type: 'string', required: true, desc: 'New account display name.' },
          { name: 'password', type: 'string', required: true, desc: 'Initial password.' },
          { name: 'role', type: '"admin" | "support" | "member"', required: true, desc: 'Role to grant.' },
        ],
        request: `curl -X POST ${API_BASE_URL}/users/direct \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "grace@example.com",
    "name": "Grace Hopper",
    "password": "temp-pass",
    "role": "admin"
  }'`,
        response: `{ "id": "usr_aa12...", "email": "grace@example.com", "role": "admin" }`,
      },
      {
        method: 'GET', path: '/users/invite-details/{token}', auth: false,
        description: 'Resolve an invitation token into the workspace and email it was issued for. Used to pre-fill the public accept screen.',
        pathParams: [{ name: 'token', type: 'string', required: true, desc: 'Invitation token from the email link.' }],
        request: `curl ${API_BASE_URL}/users/invite-details/inv_abc123`,
        response: `{ "email": "grace@example.com", "organization": "Acme", "role": "support" }`,
      },
      {
        method: 'POST', path: '/users/accept-invite', auth: false,
        description: 'Accept an invitation by supplying the token plus the new account credentials.',
        body: [
          { name: 'token', type: 'string', required: true, desc: 'Invitation token.' },
          { name: 'name', type: 'string', required: true, desc: 'Display name for the new account.' },
          { name: 'password', type: 'string', required: true, desc: 'Chosen password.' },
        ],
        request: `curl -X POST ${API_BASE_URL}/users/accept-invite \\
  -H "Content-Type: application/json" \\
  -d '{ "token": "inv_abc123", "name": "Grace Hopper", "password": "s3cret" }'`,
        response: `{ "access_token": "eyJ...", "user": { "id": "usr_aa12...", "role": "support" } }`,
      },
      {
        method: 'DELETE', path: '/users/{id}',
        description: 'Remove an operator from the workspace, revoking their access immediately.',
        role: 'owner / admin',
        pathParams: [{ name: 'id', type: 'string', required: true, desc: 'User id to remove.' }],
        request: `curl -X DELETE ${API_BASE_URL}/users/usr_aa12 -H "Authorization: Bearer <token>"`,
        response: `{ "status": "deleted" }`,
      },
    ],
  },
  {
    id: 'audit',
    title: 'Audit Log',
    icon: ScrollText,
    intro: 'A chronological record of actions taken across the workspace, optionally scoped to a single server.',
    endpoints: [
      {
        method: 'GET', path: '/audit/',
        description: 'List recent audit events, newest first.',
        queryParams: [
          { name: 'server_id', type: 'string', required: false, desc: 'Scope events to a single server. Empty returns workspace-wide events.' },
          { name: 'limit', type: 'number', required: false, desc: 'Maximum number of events to return. Default 50.' },
        ],
        request: `curl "${API_BASE_URL}/audit/?server_id=srv_1a2b&limit=50" \\
  -H "Authorization: Bearer <token>"`,
        response: `[
  {
    "id": "evt_01...",
    "action": "server.deleted",
    "actor": "ada@example.com",
    "server_id": "srv_1a2b",
    "created_at": "2026-06-06T09:12:00Z"
  }
]`,
      },
    ],
  },
  {
    id: 'tickets',
    title: 'Tickets',
    icon: LifeBuoy,
    intro: 'The support service desk. Customers raise tickets; support staff triage, assign, prioritise, and reply. Public and internal (staff-only) messages are supported. New messages and status changes are broadcast over the realtime channel (see Realtime).',
    endpoints: [
      {
        method: 'GET', path: '/tickets/',
        description: 'List tickets visible to the caller, optionally filtered by status and priority.',
        queryParams: [
          { name: 'status_filter', type: 'string', required: false, desc: 'One of: Open, In Progress, Waiting on Customer, Resolved, Closed.' },
          { name: 'priority_filter', type: 'string', required: false, desc: 'One of: Low, Medium, High, Urgent.' },
        ],
        request: `curl "${API_BASE_URL}/tickets/?status_filter=Open&priority_filter=High" \\
  -H "Authorization: Bearer <token>"`,
        response: `[
  {
    "id": "tkt_9f...",
    "title": "Cannot deploy site",
    "status": "Open",
    "priority": "High",
    "assigned_to": null,
    "updated_at": "2026-06-06T08:00:00Z"
  }
]`,
      },
      {
        method: 'POST', path: '/tickets/',
        description: 'Open a new ticket.',
        body: [
          { name: 'title', type: 'string', required: true, desc: 'Short summary of the issue.' },
          { name: 'description', type: 'string', required: true, desc: 'Full description of the problem.' },
          { name: 'priority', type: '"Low" | "Medium" | "High" | "Urgent"', required: false, desc: 'Initial priority. Defaults to Medium.' },
        ],
        request: `curl -X POST ${API_BASE_URL}/tickets/ \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Cannot deploy site",
    "description": "Deploy fails at the build step with exit code 1.",
    "priority": "High"
  }'`,
        response: `{ "id": "tkt_9f...", "status": "Open", "priority": "High" }`,
      },
      {
        method: 'GET', path: '/tickets/{id}',
        description: 'Fetch a single ticket with its full message thread.',
        pathParams: [{ name: 'id', type: 'string', required: true, desc: 'Ticket id.' }],
        request: `curl ${API_BASE_URL}/tickets/tkt_9f -H "Authorization: Bearer <token>"`,
        response: `{
  "id": "tkt_9f...",
  "title": "Cannot deploy site",
  "status": "Open",
  "priority": "High",
  "created_by": { "name": "Ada", "role": "member" },
  "messages": [
    { "id": "msg_1", "body": "Any logs?", "is_internal": false, "sender": { "name": "Grace" } }
  ]
}`,
      },
      {
        method: 'PATCH', path: '/tickets/{id}',
        description: 'Update ticket properties such as status, priority, or assignee. Send only the fields you want to change.',
        role: 'staff for priority/assignment',
        pathParams: [{ name: 'id', type: 'string', required: true, desc: 'Ticket id.' }],
        body: [
          { name: 'status', type: 'string', required: false, desc: 'New status value.' },
          { name: 'priority', type: 'string', required: false, desc: 'New priority value.' },
          { name: 'assigned_to_id', type: 'string | null', required: false, desc: 'Assign to a staff member, or null to unassign.' },
        ],
        request: `curl -X PATCH ${API_BASE_URL}/tickets/tkt_9f \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "In Progress", "assigned_to_id": "usr_aa12" }'`,
        response: `{ "id": "tkt_9f...", "status": "In Progress", "assigned_to_id": "usr_aa12" }`,
      },
      {
        method: 'POST', path: '/tickets/{id}/messages',
        description: 'Add a reply to a ticket. Staff can flag a message as internal so it is hidden from the customer.',
        pathParams: [{ name: 'id', type: 'string', required: true, desc: 'Ticket id.' }],
        body: [
          { name: 'body', type: 'string', required: true, desc: 'Message text.' },
          { name: 'is_internal', type: 'boolean', required: false, desc: 'Staff-only note when true. Defaults to false.' },
        ],
        request: `curl -X POST ${API_BASE_URL}/tickets/tkt_9f/messages \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{ "body": "Looking into it now.", "is_internal": false }'`,
        response: `{
  "id": "msg_2",
  "ticket_id": "tkt_9f...",
  "body": "Looking into it now.",
  "is_internal": false,
  "created_at": "2026-06-06T08:05:00Z"
}`,
      },
    ],
  },
  {
    id: 'admin',
    title: 'Admin (Platform Owner)',
    icon: Building2,
    intro: 'Platform-level endpoints for the ServerDeck operator. These manage the tenant organizations on the platform and are restricted to platform owners.',
    endpoints: [
      {
        method: 'POST', path: '/admin/setup',
        description: 'One-time bootstrap of the platform. Parameters are sent as query parameters rather than a JSON body.',
        role: 'platform owner',
        queryParams: [{ name: '*', type: 'object', required: true, desc: 'Setup parameters passed as query params.' }],
        request: `curl -X POST "${API_BASE_URL}/admin/setup?key=value" \\
  -H "Authorization: Bearer <token>"`,
        response: `{ "status": "ok" }`,
      },
      {
        method: 'GET', path: '/admin/organizations',
        description: 'List every organization (tenant) on the platform.',
        role: 'platform owner',
        request: `curl ${API_BASE_URL}/admin/organizations -H "Authorization: Bearer <token>"`,
        response: `[ { "id": "org_1...", "name": "Acme", "org_key": "acme", "domain": "acme.com" } ]`,
      },
      {
        method: 'POST', path: '/admin/organizations',
        description: 'Provision a new organization together with its first owner account.',
        role: 'platform owner',
        body: [
          { name: 'name', type: 'string', required: true, desc: 'Organization display name.' },
          { name: 'org_key', type: 'string', required: true, desc: 'Unique short key/slug for the org.' },
          { name: 'domain', type: 'string', required: true, desc: 'Primary domain.' },
          { name: 'admin_name', type: 'string', required: true, desc: 'Name of the initial owner.' },
          { name: 'admin_email', type: 'string', required: true, desc: 'Email of the initial owner.' },
          { name: 'admin_password', type: 'string', required: true, desc: 'Password for the initial owner.' },
        ],
        request: `curl -X POST ${API_BASE_URL}/admin/organizations \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Acme",
    "org_key": "acme",
    "domain": "acme.com",
    "admin_name": "Ada Lovelace",
    "admin_email": "ada@acme.com",
    "admin_password": "s3cret"
  }'`,
        response: `{ "id": "org_1...", "name": "Acme", "org_key": "acme" }`,
      },
      {
        method: 'DELETE', path: '/admin/organizations/{id}',
        description: 'Delete an organization and all of its data.',
        role: 'platform owner',
        pathParams: [{ name: 'id', type: 'string', required: true, desc: 'Organization id.' }],
        request: `curl -X DELETE ${API_BASE_URL}/admin/organizations/org_1 \\
  -H "Authorization: Bearer <token>"`,
        response: `{ "status": "deleted" }`,
      },
    ],
  },
  {
    id: 'realtime',
    title: 'Realtime (WebSocket)',
    icon: Radio,
    intro: `Live updates and server provisioning run over a single WebSocket connection. Connect to the URL below with your JWT supplied as a "token" query parameter. The client auto-reconnects after 3 seconds and queues outbound messages until the socket is open. Messages are JSON. Server-pushed events carry a "type" field; command responses are correlated to requests by a shared "id".`,
    endpoints: [
      {
        method: 'WS', path: `${WS_URL}?token=<jwt>`, auth: false,
        description: 'Open the realtime connection. The token is validated on connect; an invalid token closes the socket.',
        request: `const ws = new WebSocket("${WS_URL}?token=" + token);`,
        response: `// onopen → connection established`,
      },
      {
        method: 'WS', path: 'watch / unwatch',
        description: 'Subscribe (or unsubscribe) to live metrics and status for a specific server.',
        request: `ws.send(JSON.stringify({ type: "watch",   server_id: "srv_1a2b" }));
ws.send(JSON.stringify({ type: "unwatch", server_id: "srv_1a2b" }));`,
        response: `// inbound events arrive as { "type": "...", ... }`,
      },
      {
        method: 'WS', path: 'subscribe_ticket / unsubscribe_ticket',
        description: 'Subscribe to a ticket thread to receive its new messages and updates in real time.',
        request: `ws.send(JSON.stringify({ type: "subscribe_ticket",   ticket_id: "tkt_9f" }));
ws.send(JSON.stringify({ type: "unsubscribe_ticket", ticket_id: "tkt_9f" }));`,
        response: `// { "type": "ticket_message", "message": { ... } }
// { "type": "ticket_update",  "ticket":  { ... } }`,
      },
      {
        method: 'WS', path: 'command',
        description: 'Run an action on a server (used for site provisioning and other operations). Each command carries a unique id; the matching response echoes that id. Commands time out after 30 seconds.',
        body: [
          { name: 'type', type: '"command"', required: true, desc: 'Message type.' },
          { name: 'id', type: 'string (uuid)', required: true, desc: 'Correlation id generated by the client.' },
          { name: 'server_id', type: 'string', required: true, desc: 'Target server.' },
          { name: 'action', type: 'string', required: true, desc: 'The action to perform.' },
          { name: 'params', type: 'object', required: false, desc: 'Action-specific parameters.' },
        ],
        request: `ws.send(JSON.stringify({
  type: "command",
  id: crypto.randomUUID(),
  server_id: "srv_1a2b",
  action: "provision_site",
  params: { domain: "app.example.com", site_type: "backend", upstream_port: 3000 }
}));`,
        response: `// success → { "id": "<same-id>", "status": "ok", ... }
// failure → { "id": "<same-id>", "status": "error", "error": "..." }`,
      },
    ],
  },
];

/* ── Page ────────────────────────────────────────────────────────── */
export default function ApiReference() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div
      data-theme={theme === 'light' ? 'light' : undefined}
      className="min-h-screen"
      style={{ background: 'var(--bg-main)', color: 'var(--text-primary)' }}
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-50 border-b border-white/8 backdrop-blur-xl"
        style={{ background: 'color-mix(in srgb, var(--bg-main) 80%, transparent)' }}
      >
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:text-[var(--text-primary)] transition-colors" />
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Box className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-tight">ServerDeck</span>
            <span className="text-sm font-bold text-gray-500 hidden sm:inline">/ API Reference</span>
          </Link>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/8 bg-white/5 text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 flex gap-10">
        {/* TOC */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <nav className="sticky top-24 py-10 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 px-3">On this page</p>
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {s.title}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 py-10 space-y-16">
          {/* Intro */}
          <section className="space-y-5">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-400 bg-primary-500/10 border border-primary-500/20 rounded-full px-3 py-1">
              <Zap className="w-3 h-3" /> REST + WebSocket
            </div>
            <h1 className="text-4xl font-black tracking-tight">API Reference</h1>
            <p className="text-base text-gray-400 leading-relaxed max-w-2xl">
              The ServerDeck API lets you manage your fleet of servers, the sites they host,
              your team, and the support service desk. Every endpoint below is consumed by the
              ServerDeck web client. Requests and responses are JSON.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl pt-2">
              <div className="rounded-2xl border border-white/8 p-4 space-y-2" style={{ background: 'var(--bg-card)' }}>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <Globe className="w-3.5 h-3.5" /> REST base URL
                </div>
                <code className="text-xs font-mono text-primary-400 break-all">{API_BASE_URL}</code>
              </div>
              <div className="rounded-2xl border border-white/8 p-4 space-y-2" style={{ background: 'var(--bg-card)' }}>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <Radio className="w-3.5 h-3.5" /> WebSocket URL
                </div>
                <code className="text-xs font-mono text-violet-400 break-all">{WS_URL}</code>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 max-w-2xl">
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-400 leading-relaxed">
                <span className="font-bold text-amber-400">Authentication.</span> Send your JWT
                as <code className="font-mono text-xs text-[var(--text-primary)]">Authorization: Bearer &lt;token&gt;</code> on
                every request except the public auth and invite endpoints. Get a token from
                <code className="font-mono text-xs text-[var(--text-primary)]"> /auth/login</code>.
              </p>
            </div>

            {/* Status codes */}
            <div className="max-w-2xl pt-2">
              <ParamTable
                title="Common status codes"
                rows={[
                  { name: '200 / 201', type: 'success', required: false, desc: 'Request succeeded; body contains the result.' },
                  { name: '400', type: 'client', required: false, desc: 'Validation failed or malformed request.' },
                  { name: '401', type: 'auth', required: false, desc: 'Missing or expired token — the client logs you out.' },
                  { name: '403', type: 'auth', required: false, desc: 'Authenticated but not permitted for your role.' },
                  { name: '404', type: 'client', required: false, desc: 'Resource not found.' },
                  { name: '500', type: 'server', required: false, desc: 'Unexpected server error.' },
                ]}
              />
            </div>
          </section>

          {/* Sections */}
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <section key={s.id} id={s.id} className="space-y-5 scroll-mt-24">
                <div className="space-y-3 border-b border-white/8 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary-400" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">{s.title}</h2>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">{s.intro}</p>
                </div>
                <div className="space-y-4">
                  {s.endpoints.map((ep) => <Endpoint key={ep.method + ep.path} ep={ep} />)}
                </div>
              </section>
            );
          })}

          <footer className="border-t border-white/8 pt-8 pb-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <span>© 2026 ServerDeck</span>
            <Link to="/" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5">
              <Terminal className="w-3 h-3" /> Back to site
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
