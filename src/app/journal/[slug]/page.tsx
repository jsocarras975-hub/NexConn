import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { JOURNAL } from "@/data/studio";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = JOURNAL.find((p) => p.slug === slug);
  if (!post) return undefined;
  return pageMetadata(`/journal/${slug}`, post.title, post.dek);
}

export function generateStaticParams() {
  return JOURNAL.map((p) => ({ slug: p.slug }));
}

export default async function JournalArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = JOURNAL.find((p) => p.slug === slug);
  if (!post) notFound();
  const others = JOURNAL.filter((p) => p.slug !== slug).slice(0, 3);
  return <main className="container section">
    <Link href="/journal" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={15} /> All journal</Link>
    <article className="mx-auto mt-10 max-w-2xl">
      <p className="eyebrow">{post.category} · {post.date} · {post.readMin} min read</p>
      <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
      <p className="mt-4 text-base leading-7 text-slate-400">{post.dek}</p>
      <p className="mt-6 border-t border-white/10 pt-4 text-sm text-slate-500">Juan Socarras — Founder & Principal, N3xUs Konc3pt&apos;z</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.image} alt={post.title} className="mt-8 aspect-[16/9] w-full rounded-[20px] border border-white/10 object-cover" />
      <div className="mt-8 space-y-5">{post.body.map((para, i) => <p key={i} className="text-base leading-8 text-slate-200">{para}</p>)}</div>
    </article>
    <section className="mx-auto mt-16 max-w-2xl"><h2 className="mb-6 text-xl font-semibold">More from the desk</h2><div className="grid gap-4">{others.map((p) => <Link key={p.slug} href={`/journal/${p.slug}`} className="card group p-6 transition hover:-translate-y-1 hover:border-cyan-300/30"><p className="eyebrow">{p.category} · {p.date} · {p.readMin} min</p><h3 className="mt-2 font-semibold">{p.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{p.dek}</p></Link>)}</div></section>
  </main>;
}
