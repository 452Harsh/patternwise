import { notFound } from "next/navigation";
import { SDPatternDetail } from "@/components/sd/sd-pattern-detail";
import { HLD_PATTERNS, LLD_PATTERNS, findPattern } from "@/data/sd";

export function generateStaticParams() {
  return [...HLD_PATTERNS, ...LLD_PATTERNS].map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: findPattern((await params).id)?.pattern.name ?? "Pattern" };
}

export default async function SDPatternPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!findPattern(id)) notFound();
  return <SDPatternDetail id={id} />;
}
