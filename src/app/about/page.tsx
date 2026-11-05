import type { Metadata } from "next";
import {
  LinkedinLogo,
  Target,
  MagnifyingGlass,
  Signature,
  Code,
  CheckSquareOffset,
  SignOut,
} from "@phosphor-icons/react/dist/ssr";
import Footer from "@/components/Footer";
import { Reveal, SplitHeading } from "@/components/Reveal";
import { HorizontalScroll, ScrollFillText, SpotlightCard, TiltCard } from "@/components/Interactive";

export const metadata: Metadata = {
  title: "About",
  description: "A small Cape Town studio that builds the systems behind growing businesses.",
};

const team = [
  { name: "James Maherry", initials: "JM", role: "Co-founder · role TBC" },
  { name: "Chris Graham", initials: "CG", role: "Co-founder · role TBC" },
  { name: "Zayne Rodel", initials: "ZR", role: "Graphic designer & UI developer" },
];

const principles = [
  ["Outcomes over buzzwords", "We sell fewer missed leads and less admin — not the word “AI”. Every proposal names what will measurably improve."],
  ["Your data stays yours", "Client data, exports and access are documented from day one. We never claim your business data as ours."],
  ["Honest claims only", "No borrowed logos, invented references or certifications we do not hold. Demos are labelled as demos."],
  ["Built to hand over", "Runbooks, source handover and a clear exit path — so you are never locked in to us."],
];

const gates = [
  { I: Target, t: "Qualify", d: "Who you are, what success looks like and how sensitive the data is." },
  { I: MagnifyingGlass, t: "Discover", d: "Current systems, risks, architecture options and a usage estimate." },
  { I: Signature, t: "Contract", d: "Signed scope, acceptance criteria, data terms and billing ownership." },
  { I: Code, t: "Build", d: "Private repo, tested code, change requests and weekly updates." },
  { I: CheckSquareOffset, t: "Accept", d: "Go-live window, restore and rollback proof, signed acceptance." },
  { I: SignOut, t: "Offboard", d: "Code and licence transfer, runbooks and access revoked." },
];

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section data-nav="light" className="bg-ivory px-page-x pt-40 pb-20">
        <p className="eyebrow mb-6 text-steel">About Nimbrial</p>
        <SplitHeading as="h1" onLoad className="display max-w-[1200px] text-[clamp(48px,7.4vw,112px)]">
          A small studio that builds the systems behind growing businesses.
        </SplitHeading>
      </section>

      {/* Manifesto — words light up on scroll */}
      <section data-nav="light" className="bg-ivory px-page-x pb-section-y">
        <ScrollFillText
          className="display max-w-[1150px] text-[clamp(28px,3.6vw,54px)] leading-[1.15] text-navy"
          text="We are developers and a designer in Cape Town who would rather understand how your business actually works than sell you another disconnected tool. We scope honestly, build carefully and stay to keep it improving."
        />
      </section>

      {/* Team */}
      <section data-nav="light" className="bg-surface px-page-x py-section-y">
        <p className="eyebrow mb-5 text-steel">01 / Team</p>
        <SplitHeading className="display mb-stack-xl text-[clamp(38px,5vw,72px)]">The people you’ll actually work with.</SplitHeading>
        <Reveal stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {team.map((f) => (
            <TiltCard key={f.name} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-card bg-ivory ring-1 ring-line">
                {/* Photo placeholder — replace with a real portrait */}
                <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[linear-gradient(140deg,#0f2747_0%,#5b7ca6_100%)]">
                  <span className="display text-[120px] text-ivory/20">{f.initials}</span>
                  <span className="absolute bottom-4 left-4 rounded-full bg-ivory/15 px-3 py-1 text-xs text-ivory backdrop-blur">
                    Photo placeholder
                  </span>
                </div>
                <div className="flex flex-1 items-end justify-between gap-6 p-card-pad">
                  <div>
                    <p className="eyebrow text-steel lg:min-h-[3em]">{f.role}</p>
                    <h3 className="display mt-2 text-3xl">{f.name}</h3>
                    <p className="mt-3 max-w-[420px] leading-relaxed text-muted">
                      Two-line bio: real experience, completed work and what you lead day to day. Keep claims tied to
                      work you can show.
                    </p>
                  </div>
                  <a
                    href="#"
                    aria-label={`${f.name} on LinkedIn`}
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full ring-1 ring-line transition-colors hover:bg-navy hover:text-ivory"
                  >
                    <LinkedinLogo weight="fill" className="h-5 w-5" />
                  </a>
                </div>
              </article>
            </TiltCard>
          ))}
        </Reveal>
      </section>

      {/* Principles */}
      <section data-nav="dark" className="grain relative bg-navy px-page-x py-section-y text-ivory">
        <p className="eyebrow mb-5 text-on-dark-muted">02 / What we believe</p>
        <SplitHeading className="display mb-stack-xl text-[clamp(38px,5vw,72px)]">Principles we put in writing.</SplitHeading>
        <Reveal stagger className="grid gap-4 md:grid-cols-2">
          {principles.map(([t, d], i) => (
            <SpotlightCard key={t} dark className="h-full bg-navy-deep p-card-pad ring-1 ring-on-dark-line">
              <span className="display text-5xl text-on-dark-line">0{i + 1}</span>
              <h3 className="display mt-10 text-3xl">{t}</h3>
              <p className="mt-3 max-w-[460px] leading-relaxed text-on-dark-muted">{d}</p>
            </SpotlightCard>
          ))}
        </Reveal>
      </section>

      {/* Six gates — horizontal scroll */}
      <section data-nav="light" className="bg-ivory pt-section-y">
        <div className="px-page-x">
          <p className="eyebrow mb-5 text-steel">03 / How an engagement runs</p>
          <SplitHeading className="display max-w-[900px] text-[clamp(38px,5vw,72px)]">Six gates, one clean evidence trail.</SplitHeading>
        </div>
        <HorizontalScroll className="mt-10 md:mt-0">
          {gates.map(({ I, t, d }, i) => (
            <article
              key={t}
              className="flex h-[min(460px,62svh)] w-[78vw] shrink-0 flex-col justify-between rounded-card bg-surface p-card-pad ring-1 ring-line sm:w-[420px]"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-navy text-ivory">
                  <I weight="duotone" className="h-7 w-7" />
                </span>
                <span className="display text-[80px] leading-none text-line">0{i + 1}</span>
              </div>
              <div>
                <h3 className="display text-4xl">{t}</h3>
                <p className="mt-3 leading-relaxed text-muted">{d}</p>
              </div>
            </article>
          ))}
          <div className="flex w-[60vw] shrink-0 items-center sm:w-[420px]">
            <p className="display text-[clamp(32px,3vw,44px)] text-navy">
              Same gates, every project. <span className="text-steel">That’s the point.</span>
            </p>
          </div>
        </HorizontalScroll>
        <div className="h-section-y" />
      </section>

      <Footer heading="Let’s see if we’re a fit." sub="A short call, no pitch deck. If we are not the right team, we will say so." />
    </main>
  );
}
