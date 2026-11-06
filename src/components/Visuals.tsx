/*
  Code-drawn product "imagery" - labelled demo UIs, not client screenshots.
  Built in HTML so they stay crisp, theme with the palette and animate cheaply.
*/
import {
  Lightning,
  CheckCircle,
  FileText,
  Robot,
  CloudCheck,
  ShieldCheck,
  GitBranch,
  Database,
  CursorClick,
} from "@phosphor-icons/react/dist/ssr";

function Window({ children, title, dark = false }: { children: React.ReactNode; title: string; dark?: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl shadow-[0_40px_80px_-30px_rgba(6,18,36,0.55)] ring-1 ${
        dark ? "bg-navy-deep text-ivory ring-on-dark-line" : "bg-surface text-charcoal ring-line"
      }`}
    >
      <div
        className={`flex items-center gap-2 border-b px-4 py-3 ${dark ? "border-on-dark-line" : "border-line"}`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[#d9d4c7]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#d9d4c7]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#d9d4c7]" />
        <span className={`ml-3 text-xs font-medium ${dark ? "text-on-dark-muted" : "text-muted"}`}>{title}</span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
            dark ? "bg-on-dark-line text-on-dark-muted" : "bg-steel-tint text-steel"
          }`}
        >
          Demo
        </span>
      </div>
      {children}
    </div>
  );
}

export function CrmVisual() {
  const cols = [
    { name: "New", n: 4, cards: ["Guest house · 4 nights", "Dental practice · fit-out"] },
    { name: "Quoted", n: 3, cards: ["Tiling contractor", "Coffee roaster · B2B"] },
    { name: "Won", n: 2, cards: ["Facilities team · retainer"] },
  ];
  return (
    <Window title="Pipeline · Sales">
      <div className="grid grid-cols-3 gap-3 p-4">
        {cols.map((c, ci) => (
          <div key={c.name} className="rounded-xl bg-ivory p-2.5">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-muted">
              {c.name}
              <span className="rounded-full bg-surface px-1.5 text-[10px]">{c.n}</span>
            </div>
            <div className="space-y-2">
              {c.cards.map((card, i) => (
                <div
                  key={card}
                  className={`rounded-lg bg-surface p-2.5 ring-1 ring-line ${
                    ci === 1 && i === 0 ? "ring-2 ring-steel" : ""
                  }`}
                >
                  <div className="truncate text-[11px] font-semibold">{card}</div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="h-1.5 w-10 rounded-full bg-steel-tint" />
                    <span className="h-4 w-4 rounded-full bg-navy/80" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-navy px-3 py-2.5 text-[11px] text-ivory">
        <Lightning weight="fill" className="h-3.5 w-3.5 text-steel-bright" />
        Follow-up scheduled · tiling quote · Thu 09:00
      </div>
    </Window>
  );
}

export function WebVisual() {
  return (
    <Window title="Guest house website · concept">
      <div className="relative h-[260px] overflow-hidden bg-[linear-gradient(135deg,#0f2747,#5b7ca6)] p-6 text-ivory">
        <div className="flex items-center justify-between text-[10px] opacity-80">
          <span className="font-semibold">SEAVIEW</span>
          <span className="flex gap-3">
            <span>Rooms</span>
            <span>Stay</span>
            <span>Book</span>
          </span>
        </div>
        <div className="display mt-10 max-w-[220px] text-[28px] leading-[1]">Wake up to the Atlantic.</div>
        <div className="mt-5 inline-flex rounded-full bg-ivory px-3 py-1.5 text-[10px] font-semibold text-navy">
          Check availability
        </div>
        <div className="absolute -right-10 -bottom-16 h-56 w-56 rounded-full border-[18px] border-ivory/15" />
        <div className="absolute right-16 bottom-10 h-20 w-20 rounded-full bg-steel-bright/40 blur-xl" />
        <CursorClick weight="fill" className="absolute top-[150px] left-[150px] h-5 w-5 text-ivory drop-shadow" />
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-[11px]">
        <span className="text-muted">New enquiry → CRM</span>
        <span className="flex items-center gap-1 font-semibold text-steel">
          <CheckCircle weight="fill" className="h-3.5 w-3.5" /> Logged in 0.4s
        </span>
      </div>
    </Window>
  );
}

export function AiVisual() {
  const fields = [
    ["Supplier", "Sample Supplier (Pty) Ltd", 98],
    ["Invoice no.", "INV-20481", 99],
    ["Amount", "R 12 480.00", 96],
    ["Due date", "30 Nov 2026", 71],
  ] as const;
  return (
    <Window title="Document intake · Review queue">
      <div className="grid grid-cols-[0.8fr_1.2fr] gap-4 p-4">
        <div className="rounded-xl bg-ivory p-3">
          <FileText weight="duotone" className="h-6 w-6 text-steel" />
          <div className="mt-3 space-y-1.5">
            {[90, 70, 80, 55, 85, 40].map((w, i) => (
              <span key={i} className="block h-1.5 rounded-full bg-line" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="mt-4 h-10 rounded-lg bg-steel-tint" />
        </div>
        <div className="space-y-2">
          {fields.map(([k, v, c]) => (
            <div key={k} className="rounded-lg p-2 ring-1 ring-line">
              <div className="flex items-center justify-between text-[10px] text-muted">
                {k}
                <span className={c < 80 ? "font-semibold text-[#b4693a]" : "text-steel"}>{c}%</span>
              </div>
              <div className="truncate text-[12px] font-semibold">{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-steel-tint px-3 py-2.5 text-[11px] text-navy">
        <Robot weight="duotone" className="h-4 w-4" />
        Low confidence on due date - sent to a person to check
      </div>
    </Window>
  );
}

export function CloudVisual() {
  const bars = Array.from({ length: 30 }, (_, i) => (i === 17 ? 0.55 : 0.85 + ((i * 37) % 15) / 100));
  return (
    <Window title="Operations · Monthly health" dark>
      <div className="grid grid-cols-3 gap-3 p-4 text-ivory">
        {[
          [CloudCheck, "Deploys", "12"],
          [Database, "Backups", "Tested"],
          [ShieldCheck, "MFA", "100%"],
        ].map(([Icon, k, v]) => {
          const I = Icon as typeof CloudCheck;
          return (
            <div key={k as string} className="rounded-xl bg-navy p-3">
              <I weight="duotone" className="h-5 w-5 text-steel-bright" />
              <div className="mt-3 text-[10px] text-on-dark-muted">{k as string}</div>
              <div className="display text-xl">{v as string}</div>
            </div>
          );
        })}
      </div>
      <div className="px-4">
        <div className="mb-2 text-[10px] text-on-dark-muted">Availability checks · 30 days</div>
        <div className="flex h-12 items-end gap-[3px]">
          {bars.map((h, i) => (
            <span
              key={i}
              className={`flex-1 rounded-sm ${i === 17 ? "bg-[#b4693a]" : "bg-steel"}`}
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
      </div>
      <div className="m-4 space-y-1.5 rounded-xl bg-navy-ink p-3 font-mono text-[10px] text-on-dark-muted">
        <div className="flex items-center gap-2">
          <GitBranch className="h-3 w-3 text-steel-bright" /> main → production · approved
        </div>
        <div>✓ tests 214 passed · ✓ secrets scan clean</div>
        <div>✓ restore test 02:14 · rollback ready</div>
      </div>
    </Window>
  );
}
