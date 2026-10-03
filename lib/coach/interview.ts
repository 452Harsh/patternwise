/** Interview stages shared by the interview UI and the interviewer prompt. */

export interface InterviewStage {
  id: string;
  label: string;
  /** What the interviewer does in this stage. */
  goal: string;
}

export type InterviewKind = "dsa" | "hld" | "lld";

export const DSA_STAGES: InterviewStage[] = [
  { id: "problem", label: "Problem", goal: "Introduce the problem briefly and ask the candidate to restate it in their own words. Do not hint at the pattern." },
  { id: "clarify", label: "Clarifying questions", goal: "Answer the candidate's clarifying questions (input size, edge cases, constraints). If they ask none, prompt them once to ask." },
  { id: "approach", label: "Approach", goal: "Ask the candidate to explain their approach before coding. Probe why it works. Do not give the approach away." },
  { id: "followup", label: "Follow-up", goal: "Challenge the approach with one or two follow-ups: an edge case, a worse input, or a constraint change." },
  { id: "solution", label: "Solution", goal: "Ask the candidate to write or walk through the solution. Point out bugs as questions, not fixes." },
  { id: "evaluate", label: "Evaluation", goal: "Ask them to dry-run a small example and test edge cases." },
  { id: "complexity", label: "Complexity", goal: "Ask for time and space complexity and whether it can be improved." },
  { id: "feedback", label: "Feedback", goal: "Give the final feedback." },
];

export const SD_STAGES: InterviewStage[] = [
  { id: "requirements", label: "Requirements", goal: "Present the problem and ask the candidate to list functional and non-functional requirements." },
  { id: "clarify", label: "Clarifying questions", goal: "Answer clarifying questions; push them to define scope and what is out of scope." },
  { id: "scale", label: "Scale estimation", goal: "Ask for back-of-the-envelope estimates: users, QPS, storage, bandwidth. Check the arithmetic." },
  { id: "api", label: "API / interface", goal: "Ask for the main APIs (HLD) or the core classes and interfaces (LLD)." },
  { id: "architecture", label: "High-level design", goal: "Ask for the high-level architecture (HLD) or class relationships (LLD). Ask why each component exists." },
  { id: "database", label: "Data model", goal: "Ask for the data model and database choice, and why." },
  { id: "scaling", label: "Scaling", goal: "Push on bottlenecks: what breaks at 10× traffic, and how they scale it." },
  { id: "failures", label: "Failure scenarios", goal: "Ask what happens when a component fails, and how they detect and recover." },
  { id: "tradeoffs", label: "Trade-offs", goal: "Ask them to name the main trade-offs and alternatives they rejected." },
  { id: "followups", label: "Follow-ups", goal: "Ask one or two harder follow-ups an interviewer would add (an extension or a new requirement)." },
  { id: "feedback", label: "Feedback", goal: "Give the final feedback." },
];

export const stagesFor = (kind: InterviewKind) => (kind === "dsa" ? DSA_STAGES : SD_STAGES);
