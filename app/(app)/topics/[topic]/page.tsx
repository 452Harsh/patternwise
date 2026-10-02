import { notFound } from "next/navigation";
import { TopicDetail } from "@/components/topic-detail";
import { getTopic, topics } from "@/data/curriculum";

export function generateStaticParams() {
  return topics.map((t) => ({ topic: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const topic = getTopic((await params).topic);
  return { title: topic?.name ?? "Topic" };
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  if (!getTopic(topic)) notFound();
  return <TopicDetail id={topic} />;
}
