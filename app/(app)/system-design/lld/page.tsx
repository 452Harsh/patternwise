"use client";

import Link from "next/link";
import { Timer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader, SectionTitle } from "@/components/kit";
import { CategoryHeader, SDCardGrid } from "@/components/sd/item-cards";
import { LLD_CATEGORY_LIST, LLD_PATTERNS, SD_ITEMS, conceptsIn, sdKey } from "@/data/sd";

const FAMILIES = [
  { id: "creational", name: "Creational patterns", blurb: "How objects get created — decouple construction from use." },
  { id: "structural", name: "Structural patterns", blurb: "How classes and objects are composed into larger structures." },
  { id: "behavioral", name: "Behavioral patterns", blurb: "How objects communicate and divide responsibilities." },
] as const;

export default function LLDPage() {
  const problems = SD_ITEMS.filter((x) => x.track === "lld" && x.kind === "problem");

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="System Design · LLD"
        title="Low-Level Design"
        subtitle="Object-oriented design, SOLID principles, classic design patterns and machine-coding problems."
        actions={
          <Link href="/system-design/interview?mode=lld" className={buttonVariants({ variant: "secondary" })}>
            <Timer data-icon="inline-start" /> Practise an LLD interview
          </Link>
        }
      />

      <nav aria-label="LLD topics" className="flex flex-wrap gap-1.5">
        {[...LLD_CATEGORY_LIST.map((c) => ({ id: c.id, name: c.name })), ...FAMILIES, { id: "lld-problems", name: "Problems" }].map((c) => (
          <a key={c.id} href={`#${c.id}`} className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            {c.name}
          </a>
        ))}
      </nav>

      {LLD_CATEGORY_LIST.map((c) => {
        const items = conceptsIn(c.id).map((x) => SD_ITEMS.find((i) => i.key === sdKey("concept", x.id))!);
        return (
          <section key={c.id}>
            <CategoryHeader id={c.id} name={c.name} blurb={c.blurb} itemKeys={items.map((i) => i.key)} />
            <SDCardGrid items={items} />
          </section>
        );
      })}

      {FAMILIES.map((f) => {
        const ids = LLD_PATTERNS.filter((p) => p.category === f.id).map((p) => sdKey("pattern", p.id));
        const items = ids.map((k) => SD_ITEMS.find((i) => i.key === k)!);
        return (
          <section key={f.id}>
            <CategoryHeader id={f.id} name={f.name} blurb={f.blurb} itemKeys={ids} />
            <SDCardGrid items={items} />
          </section>
        );
      })}

      <section id="lld-problems" className="scroll-mt-20">
        <SectionTitle
          hint="Machine-coding style problems with requirements, classes, UML, code and a design review."
          action={
            <Link href="/system-design/problems?track=lld" className="text-xs text-muted-foreground hover:text-foreground">
              All problems →
            </Link>
          }
        >
          LLD problems
        </SectionTitle>
        <SDCardGrid items={problems} />
      </section>
    </div>
  );
}
