export function SectionHeading({ eyebrow, title, description, center = false }: { eyebrow: string; title: string; description?: string; center?: boolean }) {
 return <div className={center ? "mx-auto mb-12 max-w-2xl text-center" : "mb-12 max-w-2xl"}>
  <p className="eyebrow">{eyebrow}</p><h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
  {description && <p className="mt-4 text-base leading-7 text-slate-400">{description}</p>}
 </div>;
}
