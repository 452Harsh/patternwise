"use client";

import Link from "next/link";
import { Timer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader, SectionTitle } from "@/components/kit";
import { CategoryHeader, SDCardGrid } from "@/components/sd/item-cards";
import { HLD_CATEGORY_LIST, SD_ITEMS, conceptsIn, sdKey } from "@/data/sd";

export default function HLDPage() {
  const patterns = SD_ITEMS.filter((x) => x.track === "hld" && x.kind === "pattern");
  const problems = SD_ITEMS.filter((x) => x.track === "hld" && x.kind === "problem");

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="System Design · HLD"
        title="High-Level Design"
        subtitle="Distributed-systems building blocks for large-scale design interviews: from scaling basics to messaging and observability."
        actions={
          <Link href="/system-design/interview?mode=hld" className={buttonVariants({ variant: "secondary" })}>
            <Timer data-icon="inline-start" /> Practise an HLD interview
          </Link>
        }
      />

      <nav aria-label="HLD topics" className="flex flex-wrap gap-1.5">
        {HLD_CATEGORY_LIST.map((c) => (
          <a key={c.id} href={`#${c.id}`} className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            {c.name}
          </a>
        ))}
        <a href="#hld-patterns" className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
          Patterns
        </a>
        <a href="#hld-problems" className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
          Problems
        </a>
      </nav>

      {HLD_CATEGORY_LIST.map((c) => {
        const items = conceptsIn(c.id).map((x) => SD_ITEMS.find((i) => i.key === sdKey("concept", x.id))!);
        return (
          <section key={c.id} aria-labelledby={`${c.id}-h`}>
            <CategoryHeader id={c.id} name={c.name} blurb={c.blurb} itemKeys={items.map((i) => i.key)} />
            <SDCardGrid items={items} />
          </section>
        );
      })}

      <section id="hld-patterns" className="scroll-mt-20">
        <SectionTitle hint="Reusable architecture solutions. Each has a diagram, trade-offs and practice problems.">Architecture patterns</SectionTitle>
        <SDCardGrid items={patterns} />
      </section>

      <section id="hld-problems" className="scroll-mt-20">
        <SectionTitle
          hint="Product-scale design exercises with a structured workspace."
          action={
            <Link href="/system-design/problems?track=hld" className="text-xs text-muted-foreground hover:text-foreground">
              All problems →
            </Link>
          }
        >
          Design problems
        </SectionTitle>
        <SDCardGrid items={problems} />
      </section>
    </div>
  );
}
