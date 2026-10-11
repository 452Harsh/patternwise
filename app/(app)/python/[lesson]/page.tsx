import { notFound } from "next/navigation";
import { PyLessonView } from "@/components/python-track";
import { getPyLesson, pyLessons } from "@/data/python";

export function generateStaticParams() {
  return pyLessons.map((l) => ({ lesson: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }) {
  const lesson = getPyLesson((await params).lesson);
  return { title: lesson ? `${lesson.title} · Python for DSA` : "Python for DSA" };
}

export default async function PythonLessonPage({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  if (!getPyLesson(lesson)) notFound();
  return <PyLessonView id={lesson} />;
}
