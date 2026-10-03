import { notFound } from "next/navigation";
import { ConceptDetail } from "@/components/sd/concept-detail";
import { ALL_CONCEPTS, conceptById } from "@/data/sd";

export function generateStaticParams() {
  return ALL_CONCEPTS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: conceptById.get((await params).id)?.name ?? "Concept" };
}

export default async function ConceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!conceptById.has(id)) notFound();
  return <ConceptDetail id={id} />;
}
