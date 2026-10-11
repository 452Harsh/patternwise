/**
 * "Python for C++ developers" track at /python. Static content, no user state.
 * Prose fields support `inline code` with backticks.
 */

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
}
