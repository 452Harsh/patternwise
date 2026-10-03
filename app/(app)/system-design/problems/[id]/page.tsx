import { SDProblemPage } from "@/components/sd/sd-problem-page";
import { HLD_PROBLEMS, LLD_PROBLEMS, findProblem } from "@/data/sd";

export function generateStaticParams() {
  return [...HLD_PROBLEMS, ...LLD_PROBLEMS].map((p) => ({ id: p.id }));
}

// Custom problems live in your database, so unknown ids still render (looked up client-side).
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: findProblem((await params).id)?.problem.title ?? "Design problem" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SDProblemPage id={id} />;
}
