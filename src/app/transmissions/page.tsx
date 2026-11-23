import { SectionHeading } from "@/components/section-heading";
import { TESTIMONIALS, STUDIO } from "@/data/studio";

export default function Transmissions() {
  return <main className="container section"><SectionHeading eyebrow="Transmissions" title="Client reviews & transmissions." description={`${TESTIMONIALS.length} reviews, all 5/5. ${STUDIO.rating}.`} />
    <div className="grid gap-5 md:grid-cols-2">{TESTIMONIALS.map((t) => <blockquote key={t.name} className="card p-8"><p className="text-sm leading-7 text-slate-300">“{t.quote}”</p><footer className="mt-6"><p className="text-sm font-semibold">{t.name} — {t.role}</p><p className="mt-1 text-xs text-slate-500">{t.date} · ★★★★★</p></footer></blockquote>)}</div>
  </main>;
}
