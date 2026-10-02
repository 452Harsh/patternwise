import { ProblemWorkspace } from "@/components/problem-workspace";
import { allProblems, problemIndex } from "@/data/curriculum";

export function generateStaticParams() {
  return allProblems.map((x) => ({ slug: x.problem.slug }));
}

// Custom problems live in the browser, so unknown slugs still render (client-side lookup).
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const meta = problemIndex.get((await params).slug);
  return { title: meta ? meta.problem.title : "Problem" };
}

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProblemWorkspace slug={slug} />;
}
