import PublicDocPage, { Section, P, UL } from '../components/layout/PublicDocPage';

export default function Terms() {
  return (
    <PublicDocPage
      eyebrow="Terms"
      title="Terms of Service"
      subtitle="These terms govern your access to and use of ServerDeck. By using the service, you agree to them."
      updated="June 6, 2026"
    >
      <Section title="1. Acceptance of terms">
        <P>
          By creating an account or otherwise using ServerDeck (the "Service"), you agree to be bound
          by these Terms of Service. If you are using the Service on behalf of an organization, you
          represent that you are authorized to bind that organization to these terms.
        </P>
      </Section>

      <Section title="2. Accounts">
        <UL items={[
          'You are responsible for the activity that occurs under your account and for keeping your credentials secure.',
          'You must provide accurate information and promptly update it if it changes.',
          'Owners and admins are responsible for the team members they invite and the roles they grant.',
        ]} />
      </Section>

      <Section title="3. Acceptable use">
        <P>You agree not to use the Service to:</P>
        <UL items={[
          'Violate any law or the rights of others, or host unlawful or malicious content.',
          'Attempt to gain unauthorized access to the Service, other workspaces, or any system you do not own.',
          'Disrupt or degrade the Service, including through excessive automated requests.',
          'Reverse engineer or resell the Service except as expressly permitted.',
        ]} />
      </Section>

      <Section title="4. Your content and infrastructure">
        <P>
          You retain ownership of the servers, sites and data you manage through ServerDeck. You grant
          us the limited rights necessary to operate the Service on your behalf. You are responsible
          for the configuration, content and lawful operation of the infrastructure you connect.
        </P>
      </Section>

      <Section title="5. Availability">
        <P>
          We work to keep the Service reliable but do not guarantee uninterrupted availability.
          Features may change, and we may perform maintenance that temporarily affects access. The
          Service is provided on an "as is" and "as available" basis.
        </P>
      </Section>

      <Section title="6. Limitation of liability">
        <P>
          To the maximum extent permitted by law, ServerDeck shall not be liable for any indirect,
          incidental, special, consequential or punitive damages, or any loss of data, profits or
          revenue, arising from your use of the Service.
        </P>
      </Section>

      <Section title="7. Termination">
        <P>
          You may stop using the Service at any time. We may suspend or terminate access if these
          terms are violated or to protect the Service and its users. Upon termination, your right to
          use the Service ceases, subject to provisions that by their nature should survive.
        </P>
      </Section>

      <Section title="8. Changes to these terms">
        <P>
          We may update these terms from time to time. Material changes are reflected by the "Last
          updated" date above. Continued use of the Service after changes take effect constitutes
          acceptance of the revised terms.
        </P>
      </Section>

      <Section title="9. Contact">
        <P>
          Questions about these terms? Email{' '}
          <a href="mailto:legal@serverdeck.dynamiqqr.com" className="text-primary-400 font-semibold hover:underline">
            legal@serverdeck.dynamiqqr.com
          </a>.
        </P>
      </Section>
    </PublicDocPage>
  );
}
