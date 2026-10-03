"use client";

import { Highlight, Prism, themes } from "prism-react-renderer";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// prism-react-renderer ships without Java; register a compact grammar on top of the C-like base.
if (!Prism.languages.java) {
  Prism.languages.java = Prism.languages.extend("clike", {
    "class-name": /\b[A-Z][A-Za-z0-9_]*\b/,
    keyword:
      /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|if|implements|import|instanceof|int|interface|long|native|new|null|package|permits|private|protected|public|record|return|sealed|short|static|super|switch|synchronized|this|throw|throws|transient|try|var|void|volatile|while|yield|true|false)\b/,
    number: /\b0x[\da-f_]+L?\b|(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
    operator: /->|::|\+\+|--|&&|\|\||[?:~]|[-+*/%&|^!=<>]=?/,
  });
  Prism.languages.insertBefore("java", "class-name", {
    annotation: { pattern: /@\w+/, alias: "punctuation" },
  });
}

const PRISM_LANG: Record<string, string> = {
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  java: "java",
  cpp: "cpp",
  go: "go",
  pseudocode: "python",
  "c++": "cpp",
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
