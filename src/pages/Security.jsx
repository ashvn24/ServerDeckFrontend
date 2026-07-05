import PublicDocPage, { Section, P, UL } from '../components/layout/PublicDocPage';
import useSEO from '../hooks/useSEO';

export default function Security() {
  useSEO({
    title: 'Security Practices',
    description: 'Security architecture of ServerDeck. Read about end-to-end encrypted WebSocket comms, token-based authentication, auditability, and role-based access control.',
    keywords: ['serverdeck security', 'agent security', 'encrypted ssh', 'audit logs', 'rbac']
  });

  return (
    <PublicDocPage
      eyebrow="Security"
      title="Security at ServerDeck"
      subtitle="Security is foundational to a platform that manages your infrastructure. Here is how we protect your data and your fleet."
      updated="June 6, 2026"
    >
      <Section title="Authentication & sessions">
        <P>
          Access is authenticated with signed JSON Web Tokens (JWT). Every API request and the
          real-time WebSocket connection are validated against your token. Expired or invalid tokens
          are rejected immediately and the session is ended — you are returned to the sign-in screen.
        </P>
      </Section>

      <Section title="Access control">
        <UL items={[
          'Role-based access control (RBAC) governs what each operator can see and do — owner, admin, support and member roles each have a defined scope.',
          'Support agents are restricted to the Support Desk and cannot reach servers or infrastructure.',
          'Each organization is a fully isolated tenant; data is never shared across workspaces.',
        ]} />
      </Section>

      <Section title="Encryption in transit">
        <P>
          All traffic between your browser and ServerDeck is served over HTTPS, and the real-time
          channel uses secure WebSockets (WSS). Credentials and tokens are never transmitted in clear
          text.
        </P>
      </Section>

      <Section title="Server enrolment">
        <P>
          Hosts are enrolled with one-time install tokens scoped to your workspace. Tokens are
          single-use; if one is ever exposed, re-creating the server rotates it. Agents communicate
          outbound over encrypted channels only.
        </P>
      </Section>

      <Section title="Auditability">
        <P>
          Significant actions — creating or deleting servers, changing sites, and team changes — are
          written to an immutable audit log that records who did what and when, giving you an
          accountable trail for compliance and incident response.
        </P>
      </Section>

      <Section title="Responsible disclosure">
        <P>
          We welcome reports from the security community. If you believe you have found a
          vulnerability, please email{' '}
          <a href="mailto:security@serverdeck.dynamiqqr.com" className="text-primary-400 font-semibold hover:underline">
            security@serverdeck.dynamiqqr.com
          </a>{' '}
          with details and steps to reproduce. Please give us a reasonable window to investigate and
          remediate before any public disclosure. We do not pursue legal action against researchers
          acting in good faith.
        </P>
      </Section>
    </PublicDocPage>
  );
}
