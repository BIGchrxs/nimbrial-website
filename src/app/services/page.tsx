import type { Metadata } from "next";
import {
  Kanban,
  SquaresFour,
  ChartLineUp,
  FlowArrow,
  WhatsappLogo,
  FileMagnifyingGlass,
  Browser,
  PaintBrushBroad,
  Sparkle,
  Globe,
  CloudArrowUp,
  ShieldCheck,
  Check,
  LockKey,
  Fingerprint,
  Bug,
  Key,
} from "@phosphor-icons/react/dist/ssr";
import Footer from "@/components/Footer";
import MagneticButton from "@/components/MagneticButton";
import HoverRevealList from "@/components/HoverRevealList";
import { Reveal, SplitHeading } from "@/components/Reveal";
import { IconRipple, SpotlightCard } from "@/components/Interactive";
import { AiVisual, CloudVisual, CrmVisual, WebVisual } from "@/components/Visuals";

export const metadata: Metadata = {
  title: "Services",
  description: "Business systems, AI automation, premium websites and secure cloud — scoped and priced honestly.",
};

const systems = [
  { I: Kanban, t: "CRM implementation", d: "Configure a Zoho/Odoo-style CRM, migrate leads and set up pipelines and quotes." },
  { I: SquaresFour, t: "Bespoke business OS", d: "Custom CRM, quoting, jobs, approvals and admin workflows built around how you work." },
  { I: ChartLineUp, t: "Reporting + dashboards", d: "Connect reliable data sources into useful operations and cash-flow KPIs." },
  { I: FlowArrow, t: "Workflow automation", d: "Lead routing, reminders, approvals, invoice follow-ups and system sync." },
  { I: WhatsappLogo, t: "WhatsApp enquiry routing", d: "Approved messaging API, CRM logging, triage and a clean human handoff." },
  { I: FileMagnifyingGlass, t: "AI document intake", d: "Classify and extract files into a review queue — traceable and human-checked." },
];

const web = [
  { I: Browser, t: "Business website", d: "A polished 5–10 page responsive site with CMS, lead capture and SEO basics." },
  { I: PaintBrushBroad, t: "Premium custom website", d: "Original UX, conversion journeys, accessibility and richer interaction." },
  { I: Sparkle, t: "Motion add-on", d: "Animated heroes, micro-interactions and scroll stories — with reduced-motion fallbacks." },
  { I: Globe, t: "Hosting, DNS + deploy", d: "Domain, DNS, TLS, email records, backups and a clean launch." },
  { I: CloudArrowUp, t: "Managed cloud + DevOps", d: "Infrastructure as code, pipelines, environments, cost alerts and runbooks." },
  { I: ShieldCheck, t: "Security foundations", d: "Identity review, hardening, dependency hygiene, backups and risk reporting." },
];

const security = [
  { I: LockKey, t: "Access locked down", d: "Least-privilege roles and multi-factor sign-in, so each person sees only what their job needs." },
  { I: Fingerprint, t: "Data protected", d: "Encrypted in transit and at rest, and handled in line with POPIA: only what the workflow needs." },
  { I: Bug, t: "Tested before release", d: "Automated code scanning, dependency audits and security tests run on every change." },
  { I: Key, t: "Recoverable and yours", d: "Tested backups, with your code, data and accounts in your name. No lock-in." },
];

function ServiceGrid({ items, offset }: { items: typeof systems; offset: number }) {
  return (
    <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ I, t, d }, i) => (
        <SpotlightCard key={t} className="h-full bg-surface p-card-pad ring-1 ring-line">
          <div className="flex items-start justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-steel-tint text-navy">
              <I weight="duotone" className="h-6 w-6" />
            </span>
            <span className="text-sm font-semibold text-line">{String(offset + i + 1).padStart(2, "0")}</span>
          </div>
          <h3 className="display mt-12 text-2xl">{t}</h3>
          <p className="mt-3 leading-relaxed text-muted">{d}</p>
        </SpotlightCard>
      ))}
    </Reveal>
  );
}

export default function ServicesPage() {
  const rippleIcons = [...systems, ...web].map(({ I, t }) => (
    <I key={t} weight="duotone" className="h-7 w-7" aria-label={t} />
  ));

  return (
    <main>
      {/* Hero */}
      <section data-nav="light" className="bg-ivory px-page-x pt-40 pb-section-y">
        <div className="grid gap-16 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow mb-6 text-steel">Services</p>
            <SplitHeading as="h1" onLoad className="display text-[clamp(44px,6vw,92px)]">
              Systems, websites and cloud - scoped and priced honestly.
            </SplitHeading>
            <Reveal delay={500} className="mt-8 max-w-[560px]">
              <p className="text-lg leading-relaxed text-muted">
                Every engagement starts with paid discovery and a written statement of work. Many continue as a
                bounded monthly plan so the system keeps improving after launch.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <MagneticButton href="/contact/">Book a discovery call</MagneticButton>
                <MagneticButton href="#plans" variant="secondary">
                  Monthly plans
                </MagneticButton>
              </div>
            </Reveal>
          </div>
          <div className="mx-auto w-full max-w-[460px]">
            <IconRipple cols={4} icons={rippleIcons} />
            <p className="mt-3 text-center text-xs text-muted">Hover the grid</p>
          </div>
        </div>
      </section>

      {/* A — Systems  */}
      <section data-nav="light" className="bg-surface px-page-x py-section-y">
        <div className="mb-stack-xl grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow mb-5 text-steel">A / Systems + AI</p>
            <SplitHeading className="display text-[clamp(38px,5vw,72px)]">The workflow behind the business.</SplitHeading>
            <Reveal>
              <p className="mt-6 max-w-[480px] text-lg leading-relaxed text-muted">
                Configure a proven platform where it fits; build bespoke only when your workflow is the advantage.
              </p>
            </Reveal>
          </div>
          <Reveal className="lg:pl-10">
            <AiVisual />
          </Reveal>
        </div>
        <ServiceGrid items={systems} offset={0} />
      </section>

      {/* B — Web + cloud */}
      <section data-nav="light" className="bg-ivory px-page-x py-section-y">
        <div className="mb-stack-xl grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal className="order-2 lg:order-1 lg:pr-10">
            <CloudVisual />
          </Reveal>
          <div className="order-1 lg:order-2">
            <p className="eyebrow mb-5 text-steel">B / Web + cloud</p>
            <SplitHeading className="display text-[clamp(38px,5vw,72px)]">Sites that convert. Infrastructure that holds.</SplitHeading>
            <Reveal>
              <p className="mt-6 max-w-[480px] text-lg leading-relaxed text-muted">
                Design and motion are engineering, not decoration. Hosting and security are a responsibility we own and
                document.
              </p>
            </Reveal>
          </div>
        </div>
        <ServiceGrid items={web} offset={6} />
      </section>

      {/* C — Security */}
      <section data-nav="light" className="bg-surface px-page-x py-section-y">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:items-start">
          <div className="lg:sticky lg:top-32">
            <p className="eyebrow mb-5 text-steel">C / Security</p>
            <SplitHeading className="display text-[clamp(38px,5vw,72px)]">Security built in, not bolted on.</SplitHeading>
            <Reveal>
              <p className="mt-6 max-w-[480px] text-lg leading-relaxed text-muted">
                Your systems hold your clients’ information and your reputation. We protect them as part of every
                build, and put what we do in writing.
              </p>
              <p className="mt-8 flex max-w-[480px] items-start gap-3 border-t border-line pt-6 text-sm leading-relaxed text-muted">
                <ShieldCheck weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-steel" />
                <span>
                  <span className="font-semibold text-charcoal">Proof, not promises.</span> This website runs a strict
                  content security policy, hardened security headers and automated security tests on every change.
                </span>
              </p>
            </Reveal>
          </div>
          <Reveal stagger className="grid gap-4 sm:grid-cols-2">
            {security.map(({ I, t, d }) => (
              <SpotlightCard key={t} className="h-full bg-ivory p-card-pad ring-1 ring-line">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy text-ivory">
                  <I weight="duotone" className="h-6 w-6" />
                </span>
                <h3 className="display mt-6 text-2xl sm:mt-10">{t}</h3>
                <p className="mt-3 leading-relaxed text-muted">{d}</p>
              </SpotlightCard>
            ))}
          </Reveal>
        </div>
      </section>

      {/* D — Monthly plans */}
      <section id="plans" data-nav="dark" className="grain relative bg-navy px-page-x py-section-y text-ivory">
        <p className="eyebrow mb-5 text-on-dark-muted">D / After launch</p>
        <SplitHeading className="display max-w-[900px] text-[clamp(38px,5vw,72px)]">Monthly plans that earn their place.</SplitHeading>
        <Reveal>
          <p className="mt-6 max-w-[560px] text-lg leading-relaxed text-on-dark-muted">
            Each plan buys specified work and accountability. Hosting, licences, cloud and AI usage are billed
            separately and shown clearly.
          </p>
        </Reveal>

        <Reveal stagger className="mt-stack-xl grid gap-4 lg:grid-cols-3">
          {[
            { n: "Care", h: "1", fit: "Small sites and low-risk services", inc: ["Backups and patch checks", "Basic availability check", "Small fixes via email"] },
            { n: "Operate", h: "3", fit: "Active CRM, portals and integrations", inc: ["Scheduled change windows", "Monthly health summary", "Ongoing refinements"], hl: true },
            { n: "Evolve", h: "8", fit: "Business-critical workflow, AI or cloud", inc: ["Improvement backlog", "Quality reviews and reporting", "Scheduled releases"] },
          ].map((p) => (
            <SpotlightCard
              key={p.n}
              dark
              className={`h-full p-card-pad ring-1 transition-transform duration-500 hover:-translate-y-2 ${
                p.hl ? "bg-ivory text-charcoal ring-ivory" : "bg-navy-deep ring-on-dark-line"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`eyebrow ${p.hl ? "text-steel" : "text-on-dark-muted"}`}>{p.n}</span>
                {p.hl && <span className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-ivory">Most common</span>}
              </div>
              <p className="display mt-10 text-[88px] leading-none">
                {p.h}
                <span className={`ml-2 text-2xl ${p.hl ? "text-muted" : "text-on-dark-muted"}`}>  month</span>
              </p>
              <p className={`mt-4 ${p.hl ? "text-muted" : "text-on-dark-muted"}`}>{p.fit}</p>
              <ul className={`mt-8 space-y-3 border-t pt-8 ${p.hl ? "border-line" : "border-on-dark-line"}`}>
                {p.inc.map((x) => (
                  <li key={x} className="flex items-center gap-3">
                    <Check weight="bold" className={`h-4 w-4 ${p.hl ? "text-steel" : "text-steel-bright"}`} />
                    {x}
                  </li>
                ))}
              </ul>
              <p className={`mt-8 text-sm font-semibold ${p.hl ? "text-steel" : "text-steel-bright"}`}>Priced after discovery</p>
            </SpotlightCard>
          ))}
        </Reveal>
        <p className="mt-8 text-sm text-on-dark-muted">
          Business-hours response. No 24/7 on-call, unlimited edits or rollover hours unless agreed in writing.
        </p>
      </section>

      {/* E — Blueprints */}
      <section data-nav="light" className="bg-ivory px-page-x py-section-y">
        <p className="eyebrow mb-5 text-steel">E / Starting points</p>
        <SplitHeading className="display mb-stack-xl max-w-[900px] text-[clamp(38px,5vw,72px)]">
          Blueprints for common businesses.
        </SplitHeading>
        <HoverRevealList
          items={[
            { title: "Trade + property operations", who: "Trades, facilities, property managers", body: "Job requests, quotes, assignment, mobile evidence and client updates.", preview: <CrmVisual /> },
            { title: "Professional practice hub", who: "Accountants, consultants, agencies", body: "CRM, onboarding, documents, fee proposals, reminders and a dashboard.", preview: <AiVisual /> },
            { title: "Hospitality enquiry engine", who: "Guest houses, operators, tour businesses", body: "Premium website, enquiry routing, bookings handoff and response dashboard.", preview: <WebVisual /> },
            { title: "Wholesale quote desk", who: "B2B distributors and suppliers", body: "Catalogue, RFQ, approvals, customer login, order status and system sync.", preview: <CloudVisual /> },
          ]}
        />
        <p className="mt-6 text-sm text-muted">Joined-up packages to start a conversation from — always adjusted after discovery.</p>
      </section>

      <Footer heading="Not sure which service fits?" sub="That is exactly what paid discovery is for." />
    </main>
  );
}
