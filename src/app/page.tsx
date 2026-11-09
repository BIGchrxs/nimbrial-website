import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import GapStory from "@/components/GapStory";
import ServiceStack from "@/components/ServiceStack";
import Footer from "@/components/Footer";
import MagneticButton from "@/components/MagneticButton";
import { Reveal, SplitHeading } from "@/components/Reveal";
import { ProcessLine, SpotlightCard, TiltCard } from "@/components/Interactive";
import { CrmVisual, WebVisual } from "@/components/Visuals";
import { ShieldCheck, Handshake, Eye, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";

export default function Home() {
  return (
    <main>
      <Hero />

      {/* Capability strip */}
      <section data-nav="light" className="border-b border-line bg-ivory py-10 md:py-14">
        <Marquee
          className="display text-[clamp(40px,7vw,104px)] text-navy"
          items={["CRM + quoting", "AI document intake", "Secure infrastructure", "Premium websites", "Cloud + DevOps", "Security foundations"]}
        />
      </section>

      <GapStory />

      {/* Services */}
      <section data-nav="light" className="bg-ivory px-page-x pt-section-y pb-section-y">
        <div className="mb-stack-xl flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-[720px]">
            <p className="eyebrow mb-5 text-steel">02 / What we do</p>
            <SplitHeading className="display text-[clamp(40px,6vw,88px)]">Four things, done properly.</SplitHeading>
          </div>
          <Reveal className="max-w-[360px]">
            <p className="text-lg leading-relaxed text-muted">
              Start with one focused offer. Add more once it is earning its keep.
            </p>
            <div className="mt-6">
              <MagneticButton href="/services/" variant="secondary">
                View all services
              </MagneticButton>
            </div>
          </Reveal>
        </div>
        <ServiceStack />
      </section>

      {/* How we work */}
      <section data-nav="light" className="bg-ivory px-page-x pb-section-y">
        <p className="eyebrow mb-5 text-steel">03 / How we work</p>
        <SplitHeading className="display mb-stack-xl max-w-[900px] text-[clamp(40px,6vw,88px)]">
          Clear scope before code.
        </SplitHeading>
        <ProcessLine
          steps={[
            {
              title: "Paid discovery",
              body: "A fixed-scope look at your current systems, risks and the outcome worth paying for - ending in a written quote.",
            },
            {
              title: "Right-sized build",
              body: "Milestone-based delivery with change control, testing, a clean cutover and a proper handover.",
            },
            {
              title: "Managed improvement",
              body: "A bounded monthly plan for monitoring, safe releases and small improvements. No vague “support”.",
            },
          ]}
        />
      </section>

      {/* Proof */}
      <section data-nav="dark" className="grain relative bg-navy px-page-x py-section-y text-ivory">
        <div className="mb-stack-xl grid gap-8 md:grid-cols-2 md:items-end">
          <div>
            <p className="eyebrow mb-5 text-on-dark-muted">04 / Proof</p>
            <SplitHeading className="display text-[clamp(40px,6vw,88px)]">Labelled demos, not borrowed logos.</SplitHeading>
          </div>
          <Reveal>
            <p className="max-w-[440px] text-lg leading-relaxed text-on-dark-muted md:ml-auto">
              Walk through working examples of what we build. Real client work appears here only once it is signed off.
            </p>
          </Reveal>
        </div>

        <Reveal stagger className="grid gap-6 md:grid-cols-2">
          {[
            { t: "CRM quote desk", d: "Enquiry → pipeline → approved quote → follow-up", V: CrmVisual },
            { t: "Motion website", d: "Premium front end wired straight into a CRM", V: WebVisual },
          ].map(({ t, d, V }) => (
            <TiltCard key={t}>
              <div className="rounded-card bg-navy-deep p-5 ring-1 ring-on-dark-line md:p-8">
                <V />
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="display text-2xl">{t}</h3>
                    <p className="mt-1 text-sm text-on-dark-muted">{d}</p>
                  </div>
                  <span className="shrink-0 rounded-full px-3 py-1 text-xs text-on-dark-muted ring-1 ring-on-dark-line">
                    Demo · not a client project
                  </span>
                </div>
              </div>
            </TiltCard>
          ))}
        </Reveal>

        <Reveal stagger className="mt-section-y grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { I: Eye, t: "Outcomes over buzzwords", d: "Every proposal names what will measurably improve." },
            { I: Handshake, t: "Your data stays yours", d: "Exports, access and exit path documented from day one." },
            { I: ShieldCheck, t: "Honest claims only", d: "No certifications or references we can’t evidence." },
            { I: ArrowsClockwise, t: "Built to hand over", d: "Runbooks and source handover - never locked in." },
          ].map(({ I, t, d }) => (
            <SpotlightCard key={t} dark className="bg-navy-deep p-7 ring-1 ring-on-dark-line">
              <I weight="duotone" className="h-8 w-8 text-steel-bright" />
              <h3 className="display mt-10 text-xl">{t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-on-dark-muted">{d}</p>
            </SpotlightCard>
          ))}
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
