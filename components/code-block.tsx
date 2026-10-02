"use client";

import { Highlight, themes } from "prism-react-renderer";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const PRISM_LANG: Record<string, string> = {
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  java: "java",
  cpp: "cpp",
  go: "go",
  pseudocode: "python",
};

export const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
];

export function CodeBlock({ code, language = "python", className }: { code: string; language?: string; className?: string }) {
  const { resolvedTheme } = useTheme();
  return (
    <Highlight
      code={code.replace(/\n$/, "")}
      language={PRISM_LANG[language] ?? "python"}
      theme={resolvedTheme === "light" ? themes.github : themes.oneDark}
    >
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre
          className={cn(
            "overflow-x-auto rounded-lg border bg-surface p-4 font-mono text-[12.5px] leading-relaxed",
            className,
          )}
        >
          {tokens.map((line, i) => {
            const lineProps = getLineProps({ line });
            return (
              <div key={i} {...lineProps} style={undefined} className="table-row">
                <span className="table-cell select-none pr-4 text-right text-muted-foreground/50">{i + 1}</span>
                <span className="table-cell">
                  {line.map((token, j) => {
                    return <span key={j} {...getTokenProps({ token })} />;
                  })}
                </span>
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
