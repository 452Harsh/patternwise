import { createHash } from "node:crypto";
import { allPatterns, topics } from "@/data/curriculum";
import { COMPLEXITY } from "@/data/pattern-meta";
import { ALL_CONCEPTS, HLD_PATTERNS, HLD_PROBLEMS, LLD_PATTERNS, LLD_PROBLEMS, SD_CATEGORIES } from "@/data/sd";

/**
 * Global knowledge for retrieval, built only from the platform's curriculum in data/.
 * Private user data (progress, notes, sessions, conversations) is never added here.
 */

export type KnowledgeModule = "dsa" | "system-design";

export interface KnowledgeDoc {
  documentId: string;
  module: KnowledgeModule;
  contentType: "topic" | "pattern" | "problem" | "concept" | "design-pattern" | "design-problem";
  /** System Design: "hld" | "lld". */
  category?: "hld" | "lld";
  topic: string;
  pattern?: string;
  difficulty?: string;
  tags: string[];
  title: string;
  href: string;
  content: string;
  hash: string;
}

const list = (label: string, xs: string[] | undefined) => (xs?.length ? `${label}:\n${xs.map((x) => `- ${x}`).join("\n")}` : "");
const join = (...parts: (string | undefined)[]) => parts.filter(Boolean).join("\n\n");
const hash = (s: string) => createHash("sha1").update(s).digest("hex");

function doc(d: Omit<KnowledgeDoc, "hash">): KnowledgeDoc {
  return { ...d, hash: hash(`${d.title}\n${d.content}`) };
}

export function buildKnowledgeDocs(): KnowledgeDoc[] {
  const out: KnowledgeDoc[] = [];

  for (const t of topics) {
    out.push(
      doc({
        documentId: `dsa:topic:${t.id}`,
        module: "dsa",
        contentType: "topic",
        topic: t.id,
        tags: [t.name],
        title: `Topic: ${t.name}`,
        href: `/topics/${t.id}`,
        content: join(t.blurb, list("Patterns", t.patterns.map((p) => `${p.name}: ${p.approach.split(". ")[0]}.`))),
      }),
    );
  }

  for (const { pattern: p, topic: t } of allPatterns) {
    const cx = COMPLEXITY[p.id];
    out.push(
      doc({
        documentId: `dsa:pattern:${p.id}`,
        module: "dsa",
        contentType: "pattern",
        topic: t.id,
        pattern: p.id,
        tags: [t.name, p.name, ...(p.subtopic ? [p.subtopic] : [])],
        title: `Pattern: ${p.name} (${t.name})`,
        href: `/patterns/${p.id}`,
        content: join(
          list("Recognition signals", p.signals),
          `Core idea: ${p.approach}`,
          p.template ? `Template:\n${p.template}` : undefined,
          list("Variations", p.variations),
          list("Common mistakes", p.pitfalls),
          list("Also applies to", p.transfer),
          cx ? `Typical complexity: time ${cx.time}, space ${cx.space}` : undefined,
          list("Curated problems (each teaches one variation)", p.problems.map((x) => `${x.title} (${x.difficulty}): ${x.takeaway}`)),
        ),
      }),
    );
    for (const x of p.problems) {
      out.push(
        doc({
          documentId: `dsa:problem:${x.slug}`,
          module: "dsa",
          contentType: "problem",
          topic: t.id,
          pattern: p.id,
          difficulty: x.difficulty,
          tags: [t.name, p.name, x.difficulty],
          title: `Problem: ${x.title}`,
          href: `/problems/${x.slug}`,
          content: join(
            `${x.title} (${x.difficulty}) uses the ${p.name} pattern from ${t.name}.`,
            `What it teaches: ${x.takeaway}`,
            list(`How to recognise ${p.name}`, p.signals.slice(0, 4)),
          ),
        }),
      );
    }
  }

  const categoryName = new Map(SD_CATEGORIES.map((c) => [c.id, c.name]));
  for (const c of ALL_CONCEPTS) {
    out.push(
      doc({
        documentId: `sd:concept:${c.id}`,
        module: "system-design",
        contentType: "concept",
        category: c.track,
        topic: c.category,
        tags: [c.track.toUpperCase(), categoryName.get(c.category) ?? c.category],
        title: `${c.track.toUpperCase()} concept: ${c.name}`,
        href: `/system-design/concepts/${c.id}`,
        content: join(
          c.summary,
          `Why: ${c.why}`,
          list("When to use", c.whenToUse),
          list("How it works", c.howItWorks),
          list("Pros", c.pros),
          list("Cons / trade-offs", c.cons),
          list("Interview questions", c.interviewQuestions),
        ),
      }),
    );
  }

  for (const p of HLD_PATTERNS) {
    out.push(
      doc({
        documentId: `sd:pattern:${p.id}`,
        module: "system-design",
        contentType: "design-pattern",
        category: "hld",
        topic: "architecture-patterns",
        tags: ["HLD", "Architecture pattern"],
        title: `HLD architecture pattern: ${p.name}`,
        href: `/system-design/patterns/${p.id}`,
        content: join(
          p.summary,
          `Problem it solves: ${p.problem}`,
          list("When to use", p.whenToUse),
          list("When not to use", p.whenNotToUse),
          list("Advantages", p.advantages),
          list("Disadvantages", p.disadvantages),
          list("Trade-offs", p.tradeoffs),
        ),
      }),
    );
  }
  for (const p of LLD_PATTERNS) {
    out.push(
      doc({
        documentId: `sd:pattern:${p.id}`,
        module: "system-design",
        contentType: "design-pattern",
        category: "lld",
        topic: p.category,
        tags: ["LLD", "GoF", p.category],
        title: `LLD design pattern: ${p.name} (${p.category})`,
        href: `/system-design/patterns/${p.id}`,
        content: join(
          `Intent: ${p.intent}`,
          `Problem it solves: ${p.problem}`,
          list("When to use", p.whenToUse),
          list("When not to use", p.whenNotToUse),
          `Example: ${p.example}`,
          `Participants: ${p.uml.classes.map((c) => c.name).join(", ")}`,
          list("Advantages", p.advantages),
          list("Disadvantages", p.disadvantages),
        ),
      }),
    );
  }
  for (const p of HLD_PROBLEMS) {
    out.push(
      doc({
        documentId: `sd:problem:${p.id}`,
        module: "system-design",
        contentType: "design-problem",
        category: "hld",
        topic: "hld-problems",
        difficulty: p.difficulty,
        tags: ["HLD", p.difficulty],
        title: `HLD problem: ${p.title}`,
        href: `/system-design/problems/${p.id}`,
        content: join(
          p.statement,
          list("Functional requirements", p.functional),
          list("Non-functional requirements", p.nonFunctional),
          list("Key building blocks", p.components),
          list("Common deep dives", p.deepDives),
        ),
      }),
    );
  }
  for (const p of LLD_PROBLEMS) {
    out.push(
      doc({
        documentId: `sd:problem:${p.id}`,
        module: "system-design",
        contentType: "design-problem",
        category: "lld",
        topic: "lld-problems",
        difficulty: p.difficulty,
        tags: ["LLD", p.difficulty],
        title: `LLD problem: ${p.title}`,
        href: `/system-design/problems/${p.id}`,
        content: join(
          p.statement,
          list("Functional requirements", p.functional),
          list("Actors", p.actors),
          list("Candidate entities", p.entities),
          list("Follow-ups an interviewer may add", p.extensions),
        ),
      }),
    );
  }
  return out;
}

let cached: KnowledgeDoc[] | null = null;
export const knowledgeDocs = () => (cached ??= buildKnowledgeDocs());
