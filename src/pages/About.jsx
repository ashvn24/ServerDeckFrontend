import PublicDocPage, { Section, P, UL } from '../components/layout/PublicDocPage';
import useSEO from '../hooks/useSEO';

export default function About() {
  useSEO({
    title: 'About Us',
    description: 'Learn about the mission behind ServerDeck and how we build developer-first tools for managing Linux server infrastructure.',
    keywords: ['about serverdeck', 'serverdeck team', 'infrastructure control panel']
  });

  return (
    <PublicDocPage
      eyebrow="About"
      title="About ServerDeck"
      subtitle="The modern control panel for Linux infrastructure — built for engineers who ship."
    >
      <Section title="Our mission">
        <P>
          Managing servers should feel effortless. ServerDeck brings your entire fleet — hosts,
          websites, certificates, logs and support — into one elegant interface, so teams spend less
          time wrestling with infrastructure and more time building.
        </P>
        <P>
          We believe powerful tooling does not have to be complicated. ServerDeck pairs a clean,
          fast experience with the depth that operators need: live metrics, real-time provisioning,
          role-based access, and a complete audit trail.
        </P>
      </Section>

      <Section title="What we do">
        <UL items={[
          'Register and monitor Linux servers from a single console, with live online status.',
          'Deploy static frontends and reverse-proxied backend services in minutes.',
          'Issue and manage SSL certificates so every site is secured by default.',
          'Tail logs and watch real-time metrics without leaving the dashboard.',
          'Run a built-in support desk to handle customer and internal issues.',
          'Manage teams with granular roles, from owners to support agents.',
        ]} />
      </Section>

      <Section title="Built for teams">
        <P>
          ServerDeck is multi-tenant from the ground up. Each organization is an isolated workspace
          with its own servers, sites, team and tickets — whether you run infrastructure for one
          company or many.
        </P>
      </Section>

      <Section title="Get in touch">
        <P>
          Have a question, an idea, or want to partner with us? Reach the team at{' '}
          <a href="mailto:hello@serverdeck.dynamiqqr.com" className="text-primary-400 font-semibold hover:underline">
            hello@serverdeck.dynamiqqr.com
          </a>.
        </P>
      </Section>
    </PublicDocPage>
  );
}
