/**
 * "Python for C++ developers" track at /python. Static content; the only user
 * state is question completion, stored in `State.checklist` under `py:<lesson>:<n>`.
 * Prose fields support `inline code` with backticks.
 */

export type PyLevel = "Beginner" | "Intermediate" | "Interview";

export interface PyCompare {
  label: string;
  cpp: string;
  py: string;
}

export interface PyExample {
  title: string;
  code: string;
}

export interface PyOp {
  op: string;
  code: string;
  time: string;
  note?: string;
}

export interface PyQuestion {
  level: PyLevel;
  title: string;
  /** LeetCode slug, when the question is a LeetCode problem. */
  leetcode?: string;
  prompt: string;
  /** Sample input/output, shown as a code block. */
  sample?: string;
  starter: string;
  hints: string[];
  solution: string;
  complexity: string;
  /** What a reviewer checks; the learner ticks these against their own code. */
  review: string[];
}

export interface PyLesson {
  id: string;
  title: string;
  /** C++ STL equivalent, e.g. "std::vector". */
  cpp: string;
  /** Python implementation, e.g. "list". */
  py: string;
  /** What it behaves like in C++ terms. */
  behavesLike: string;
  summary: string;
  concept: string[];
  compare: PyCompare[];
  differences: string[];
  examples: PyExample[];
  complexity: PyOp[];
  /** When to choose it over the alternatives. */
  choose: string[];
  useCases: string[];
  leetcode: { title: string; slug: string }[];
  mistakes: string[];
  practice: PyQuestion[];
}

export const pyKey = (lesson: string, i: number) => `py:${lesson}:${i}`;
