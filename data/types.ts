export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Problem {
  /** LeetCode slug; also the unique id used for progress tracking. */
  slug: string;
  title: string;
  difficulty: Difficulty;
  /** The one thing this problem teaches within its pattern. */
  takeaway: string;
}

export interface Pattern {
  id: string;
  name: string;
  /** Optional grouping inside a topic (e.g. "Grid & Strings" within DP). */
  subtopic?: string;
  /** Phrases / constraints in a problem statement that hint at this pattern. */
  signals: string[];
  /** The core technique, in a few sentences. */
  approach: string;
  /** Skeleton pseudocode. */
  template?: string;
  variations: string[];
  pitfalls: string[];
  /** Other kinds of problems where the same pattern applies. */
  transfer?: string[];
  problems: Problem[];
}

export interface Topic {
  id: string;
  name: string;
  blurb: string;
  patterns: Pattern[];
}

export const lcUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;

export const P = (
  slug: string,
  title: string,
  difficulty: Difficulty,
  takeaway: string,
): Problem => ({ slug, title, difficulty, takeaway });
