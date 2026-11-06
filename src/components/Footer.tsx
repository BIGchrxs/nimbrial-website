import Link from "next/link";
import { Emblem } from "./Logo";
import MagneticButton from "./MagneticButton";
import { SplitHeading, Reveal } from "./Reveal";
import FooterWordmark from "./FooterWordmark";
import { CONTACT_EMAIL } from "@/lib/contact";

export default function Footer({
  heading = "Tell us where the admin piles up.",
  sub = "A 30-minute call to see whether paid discovery makes sense for you. No pitch deck.",
  showCta = true,
}: {
  heading?: string;
  sub?: string;
  /** Hide the "Book a discovery call" button, e.g. on the contact page itself. */
  showCta?: boolean;
}) {
  return (
    <footer id="contact" data-nav="dark" className="grain relative overflow-hidden bg-navy-ink text-ivory">
      <div className="px-page-x pt-section-y">
        <p className="eyebrow mb-8 flex items-center gap-3 text-on-dark-muted">
          <span className="h-px w-10 bg-steel" />
          Start here
        </p>
        <SplitHeading className="display max-w-[1100px] text-[clamp(44px,7.5vw,120px)]">{heading}</SplitHeading>
        <Reveal className="mt-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <p className="max-w-[460px] text-lg leading-relaxed text-on-dark-muted">{sub}</p>
          <div className="flex flex-wrap gap-3">
            {showCta && (
              <MagneticButton href="/contact/" variant="onDark">
                Book a discovery call
              </MagneticButton>
            )}
            <MagneticButton href="/services/" variant="ghostDark">
              Browse services
            </MagneticButton>
          </div>
        </Reveal>

        <div className="mt-section-y grid gap-12 border-t border-on-dark-line pt-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Emblem className="h-10 w-10 text-ivory" />
            <p className="mt-6 max-w-[300px] text-[15px] leading-relaxed text-on-dark-muted">
              Business systems, AI automation and secure cloud — built in Cape Town, built to evolve.
            </p>
          </div>
          {[
            ["Services", [["Business systems", "/services/"], ["AI automation", "/services/"], ["Websites", "/services/"], ["Cloud + security", "/services/"]]],
            ["Company", [["About", "/about/"], ["How we work", "/about/"], ["Contact", "/contact/"]]],
            ["Contact", [[CONTACT_EMAIL, `mailto:${CONTACT_EMAIL}`], ["Book a discovery call", "/contact/"], ["LinkedIn", "#"]]],
          ].map(([title, items]) => (
            <div key={title as string}>
              <p className="text-sm font-semibold">{title as string}</p>
              <ul className="mt-5 space-y-3">
                {(items as string[][]).map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-[15px] text-on-dark-muted transition-colors hover:text-ivory">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 text-[13px] text-on-dark-muted md:flex-row md:justify-between">
          <span>© {new Date().getFullYear()} Nimbrial · Cape Town</span>
          <span>Company reg. no. — add once registered · Privacy notice · PAIA manual</span>
        </div>
      </div>

      <FooterWordmark />
    </footer>
  );
}
