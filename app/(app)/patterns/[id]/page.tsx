import { notFound } from "next/navigation";
import { PatternDetail } from "@/components/pattern-detail";
import { allPatterns, patternIndex } from "@/data/curriculum";

export function generateStaticParams() {
  return allPatterns.map((x) => ({ id: x.pattern.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const meta = patternIndex.get((await params).id);
  return { title: meta?.pattern.name ?? "Pattern" };
}

export default async function PatternPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!patternIndex.has(id)) notFound();
  return <PatternDetail id={id} />;
}
