import type { Metadata } from "next";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { Reveal, SplitHeading } from "@/components/Reveal";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Book a discovery call",
  description:
    "Tell us how your business runs and where the admin piles up. We'll reply by email to set up a 30-minute discovery call.",
};

const steps = [
  { n: "01", t: "Tell us what's slowing you down", d: "A few lines are enough. No preparation needed." },
  { n: "02", t: "We reply by email", d: "To agree a time that suits you." },
  { n: "03", t: "A 30-minute call", d: "We listen, ask questions and tell you honestly whether paid discovery makes sense." },
];

export default function ContactPage() {
  return (
    <main>
      <section data-nav="light" className="bg-ivory px-page-x pt-40 pb-section-y">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr] lg:items-start">
          <div>
            <p className="eyebrow mb-6 text-steel">Contact</p>
            <SplitHeading as="h1" onLoad className="display text-[clamp(44px,6vw,92px)]">
              Book a discovery call.
            </SplitHeading>
            <Reveal delay={400}>
              <p className="mt-8 max-w-[480px] text-lg leading-relaxed text-muted">
                A short call to understand how your business runs and where we could help. No pitch deck.
              </p>
              <ol className="mt-10 max-w-[480px] space-y-6 border-t border-line pt-8">
                {steps.map((s) => (
                  <li key={s.n} className="flex gap-5">
                    <span className="w-6 shrink-0 pt-0.5 text-sm font-semibold text-steel">{s.n}</span>
                    <div>
                      <p className="font-semibold text-charcoal">{s.t}</p>
                      <p className="mt-1 leading-relaxed text-muted">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-10 text-sm text-muted">
                Prefer email?{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-navy underline-offset-4 hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </Reveal>
          </div>

          <Reveal delay={600}>
            <div className="rounded-card bg-surface p-card-pad ring-1 ring-line">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>

      <Footer heading="Not ready to talk yet?" sub="Browse what we build and how we work first." showCta={false} />
    </main>
  );
}
