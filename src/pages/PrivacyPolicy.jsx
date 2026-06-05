import PublicDocPage, { Section, P, UL } from '../components/layout/PublicDocPage';

export default function PrivacyPolicy() {
  return (
    <PublicDocPage
      eyebrow="Privacy"
      title="Privacy Policy"
      subtitle="This policy explains what information ServerDeck collects, how we use it, and the choices you have."
      updated="June 6, 2026"
    >
      <Section title="1. Information we collect">
        <UL items={[
          'Account information — your name, email address and role, provided when you register or are invited.',
          'Workspace data — the servers, folders, sites, certificates, tickets and team members you create within ServerDeck.',
          'Usage and diagnostics — log and audit records of actions taken in the platform, used for security and troubleshooting.',
          'Technical data — your IP address and basic device/browser information collected when you connect.',
        ]} />
      </Section>

      <Section title="2. How we use information">
        <UL items={[
          'To provide and operate the service — authenticating you, managing your fleet, and delivering real-time updates.',
          'To secure the platform — detecting abuse, maintaining the audit trail, and investigating incidents.',
          'To support you — responding to tickets and account requests.',
          'To improve the product — understanding how features are used in aggregate.',
        ]} />
      </Section>

      <Section title="3. Cookies & local storage">
        <P>
          ServerDeck stores your session token and basic preferences (such as your dark/light theme
          choice) in your browser's local storage so you stay signed in and the interface remembers
          your settings. We do not use third-party advertising or tracking cookies.
        </P>
      </Section>

      <Section title="4. How we share information">
        <P>
          We do not sell your personal information. We share data only with service providers that
          help us run the platform (for example, hosting and infrastructure), under contractual
          obligations to protect it, or where required by law.
        </P>
      </Section>

      <Section title="5. Data retention">
        <P>
          We retain your information for as long as your account is active and as needed to provide
          the service. When you delete data or close your workspace, we remove the associated records,
          subject to limited retention required for legal, security or audit purposes.
        </P>
      </Section>

      <Section title="6. Your rights">
        <P>
          Depending on your location, you may have the right to access, correct, export or delete your
          personal information. To exercise these rights, contact us using the details below.
        </P>
      </Section>

      <Section title="7. Security">
        <P>
          We protect your data with encryption in transit, role-based access controls and audit
          logging. Learn more on our{' '}
          <a href="/security" className="text-primary-400 font-semibold hover:underline">Security</a> page.
        </P>
      </Section>

      <Section title="8. Changes to this policy">
        <P>
          We may update this policy from time to time. Material changes will be reflected by the
          "Last updated" date above, and where appropriate we will notify you within the application.
        </P>
      </Section>

      <Section title="9. Contact">
        <P>
          Questions about your privacy? Email{' '}
          <a href="mailto:privacy@serverdeck.dynamiqqr.com" className="text-primary-400 font-semibold hover:underline">
            privacy@serverdeck.dynamiqqr.com
          </a>.
        </P>
      </Section>
    </PublicDocPage>
  );
}
