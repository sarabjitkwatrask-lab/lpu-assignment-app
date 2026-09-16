// Rules distilled from "Designing Assignments and Assessment Rubrics in the AI Era"
// (LPU Volume II, companion to the Five-Phase Curriculum Redesign Protocol).
// Kept as data (not prose in a prompt file) so the form, the AI prompt, and any
// future validation logic all read from one place.

import type { GeneratedAssignment, QualityLevel } from "./schema";

export const LANES = {
  A: {
    label: "Lane A — Assured (supervised)",
    description:
      "Completed under supervision: in class, in a lab, invigilated, or face-to-face oral. Devices and conditions are controlled.",
  },
  B: {
    label: "Lane B — AI-integrated (open)",
    description:
      "Completed unsupervised: at home, in the hostel, in the library, or in the field. AI restrictions cannot be enforced here.",
  },
} as const;

export type LaneKey = keyof typeof LANES;

export const AI_ROLE_LEVELS = {
  L1: {
    label: "Level 1 — No AI",
    lane: "A" as LaneKey,
    plain:
      "Completed in conditions designed to exclude AI entirely (e.g. an in-class test, closed-lab practical, or viva).",
  },
  L2: {
    label: "Level 2 — AI for planning",
    lane: "B" as LaneKey,
    plain:
      "AI may help with topic exploration, scoping, outlining, or initial search. The plan itself is marked.",
  },
  L3: {
    label: "Level 3 — AI collaboration",
    lane: "B" as LaneKey,
    plain:
      "AI may assist with drafting, feedback, or code generation, but the task is built so unedited AI output falls short of the standard.",
  },
  L4: {
    label: "Level 4 — Full AI / directed",
    lane: "B" as LaneKey,
    plain:
      "AI involvement is expected and necessary — the goal is out of reach for AI alone or for a student alone in the time given.",
  },
  L5: {
    label: "Level 5 — AI exploration",
    lane: "B" as LaneKey,
    plain:
      "Creative, novel application of AI within the discipline, typically co-designed between student and faculty member.",
  },
} as const;

export type AiLevelKey = keyof typeof AI_ROLE_LEVELS;

export const MILLER_TIERS = {
  Knows: "Knows — recall and comprehension of core content.",
  "Knows how": "Knows how — applying a method or framework to a new problem.",
  "Shows how": "Shows how — performing a technique or procedure under observation.",
  Does: "Does — real professional conduct with real stakeholders.",
} as const;

export const DISCIPLINES = [
  "Computer Science / IT / Data Science",
  "Mechanical / Civil / Electrical / Electronics",
  "Management / Commerce / Economics",
  "Law",
  "Applied Medical Sciences / Pharmacy / Nursing / Physiotherapy",
  "Agriculture / Biotechnology / Life Sciences",
  "Design / Architecture / Fashion / Fine Arts",
  "Journalism / English / Humanities / Social Sciences",
  "Education / Teacher Training",
  "Other",
] as const;

export const ORAL_VERIFICATION_OPTIONS = [
  "None",
  "All students (universal micro-viva)",
  "Random selection of ~15-25% of students",
  "On request",
] as const;

// C.3 — LPU Standard Rubric Architecture weight bands, keyed by AI Role Level.
// Used to ground the model's rubric weights instead of leaving them to guesswork.
export const WEIGHT_BANDS: Record<AiLevelKey, string> = {
  L1: "Disciplinary substance 70-80%; Evaluative judgement/reasoning shown in the script 10-20%; Communication 10%. (No process/provenance or contextual-grounding criterion at L1.)",
  L2: "Disciplinary substance 50-60%; Process & provenance (quality and development of the plan) 15-20%; Evaluative judgement 10%; Contextual grounding 10%; Communication 5-10%.",
  L3: "Disciplinary substance 35-45%; Process & provenance 15%; Evaluative judgement 20-25%; Contextual grounding 10%; Communication 10%. (This is the flagship staged Lane B pattern — usually 6 criteria including a Defence criterion worth 5-15%.)",
  L4: "Disciplinary substance 25-35%; Process & provenance 10%; Evaluative judgement (includes direction/orchestration) 25-30%; Contextual grounding 10-15%; Communication 10-15%.",
  L5: "Not banded — criteria and weights are meant to be negotiated with the student. As a starting proposal, keep Disciplinary substance + Evaluative judgement together above 60% of the total.",
};

export const FIVE_MUST_RULES = [
  "The brief MUST state its Lane (A or B), its AI Role Level (1-5), and the Course Outcome(s) it assesses.",
  "AI MUST NOT be prohibited in any task whose conditions cannot be supervised — prohibition is only credible in Lane A.",
  "The rubric MUST contain at least one criterion assessing student judgement or reasoning, not only the finished product.",
  "Any Lane B task above Level 1 MUST require a short AI Use Disclosure Statement.",
  "State clearly whether this task is (or is part of) the course's supervised/oral verification point for its most important protected KSA.",
];

export const DESCRIPTOR_RULES = [
  "Name an observable act, not a quality. Use verbs like justifies, rejects, verifies, reconciles, adapts, contradicts, prioritises, defends — never understands, appreciates, or demonstrates.",
  "Tie at least one criterion's descriptor to the specific context anchor (the named site, dataset, client, or case) rather than writing generically.",
  "Distinguish quality levels by the quality of reasoning, not by quantity (not '3 sources vs 5 sources').",
  "Write the Proficient level first, then stretch upward to Outstanding and downward to Developing / Not yet demonstrated.",
  "Apply the substitution test to every descriptor: could a strong AI model's output earn full marks on this line without the student having done anything? If yes, the descriptor is wrong — rewrite it around a decision, verification, or judgement only the student could supply.",
];

const criterionFamilies = [
  "Disciplinary substance",
  "Process and provenance",
  "Evaluative judgement",
  "Contextual grounding",
  "Communication and defence",
];

export function buildSystemPrompt(): string {
  return `You are an expert assessment designer applying Lovely Professional University's official institutional guideline, "Designing Assignments and Assessment Rubrics in the AI Era" (Volume II, companion to the LPU Five-Phase Curriculum Redesign Protocol). You must follow this guideline strictly and produce output that would pass an LPU Board of Studies review.

CORE FRAMEWORK YOU MUST APPLY
- Two-lane model: Lane A (Assured/supervised) vs Lane B (AI-integrated/open). ${LANES.A.description} ${LANES.B.description}
- AI Role Levels 1-5 (not a hierarchy of quality — each is a different kind of task): L1 No AI (Lane A only), L2 AI for planning, L3 AI collaboration, L4 Full AI/directed, L5 AI exploration.
- Miller tiers: Knows / Knows how / Shows how / Does.
- Criterion families for every rubric: ${criterionFamilies.join(", ")}.
- Four quality levels for every rubric, in this exact order and naming: Outstanding (86-100%), Proficient (66-85%), Developing (41-65%), Not yet demonstrated (0-40%).

THE FIVE MUST RULES (never violate these)
${FIVE_MUST_RULES.map((r, i) => `${i + 1}. ${r}`).join("\n")}

DESCRIPTOR-WRITING RULES (apply to every rubric cell you write)
${DESCRIPTOR_RULES.map((r, i) => `${i + 1}. ${r}`).join("\n")}

PRINCIPLE: MIRROR THE BRIEF IN THE RUBRIC
Whatever the brief permits for AI use, the rubric must contain a criterion that assesses it. Do not include a rubric criterion for something the brief never asked for.

AUTHENTICITY REQUIREMENT
Every brief needs a context anchor: something specific to this cohort, campus, dataset, local business, or current period that a model cannot answer from training data and that a previous year's student could not reuse unchanged. If the user does not supply one, invent a plausible, concrete one appropriate to the discipline and note it clearly (e.g. a named type of local Jalandhar/Phagwara small business, a dataset released this semester, a campus service) rather than leaving it generic.

WEIGHT BANDS TO USE FOR THE RUBRIC (from the guideline's Standard Rubric Architecture, C.3)
You will be told which AI Role Level applies. Use its band as your target distribution across 4-6 criteria (adjust by at most 10 points per criterion if the discipline genuinely requires it):
${(Object.keys(WEIGHT_BANDS) as AiLevelKey[]).map((k) => `- ${AI_ROLE_LEVELS[k].label}: ${WEIGHT_BANDS[k]}`).join("\n")}

OUTPUT REQUIREMENTS
- Produce a complete LPU Assignment Brief (all fields) and a complete analytic rubric (4-6 criteria) that mirrors it, in the structured schema you are given.
- Every AI Role Level above 1 in Lane B must set disclosureRequired to true and include a short "why" grounded in which capability is being protected.
- designerNotes should contain 2-4 short, concrete reminders for the faculty member (e.g. to run the mandatory AI Stress Test before releasing the task, to add a second Lane A component elsewhere in the course if this one is entirely Lane B, or to calibrate markers before grading).
- Write in plain, student-facing language for the brief fields (the brief is read by students, not auditors) but keep rubric descriptors precise and evaluable.
- Do not use vague, substitutable descriptor language like "comprehensive understanding" or "well-structured" — follow the descriptor-writing rules above.`;
}

export function buildUserPrompt(input: {
  courseCode: string;
  courseTitle: string;
  topic: string;
  discipline: string;
  courseOutcome: string;
  protectedKSAs: string;
  totalMarks: string;
  lane: LaneKey;
  aiRoleLevel: AiLevelKey;
  millerTier: string;
  contextAnchor: string;
  oralVerification: string;
  dueDate: string;
}): string {
  return `Design one LPU assignment brief and its matching rubric for the following course.

Course code: ${input.courseCode || "(not given)"}
Course title: ${input.courseTitle}
Discipline / School: ${input.discipline}
Topic / theme for this assignment: ${input.topic}
Course Outcome this task assesses: ${input.courseOutcome}
Protected KSAs (skills that must be evidenced, comma-separated — leave the AI to infer 2-3 if blank): ${input.protectedKSAs || "(infer 2-3 appropriate ones)"}
Total marks for this component: ${input.totalMarks || "(propose a reasonable value)"}
Lane: ${LANES[input.lane].label}
AI Role Level: ${AI_ROLE_LEVELS[input.aiRoleLevel].label} — ${AI_ROLE_LEVELS[input.aiRoleLevel].plain}
Miller tier: ${input.millerTier}
Context anchor supplied by faculty (use this if given, else invent one appropriate to the discipline and say so): ${input.contextAnchor || "(none supplied — invent one)"}
Oral verification plan: ${input.oralVerification}
Due date (optional, may be left as a placeholder): ${input.dueDate || "(leave as a placeholder like '[3 weeks from issue]')"}

Apply the AI Role Level's weight band from the system instructions to build the rubric. Ensure Lane and AI Role Level are internally consistent (Level 1 only pairs with Lane A).`;
}

// ---------------------------------------------------------------------------
// D.1 — The AI Stress Test (mandatory before release)
//
// "1. Paste your assignment brief, exactly as students will receive it, into
//  a capable AI model. 2. Ask it to produce the best submission it can, with
//  no further guidance. 3. Mark that output honestly against your own
//  rubric, criterion by criterion. 4. Record the score... 5. Identify which
//  criteria the model satisfied — those are your substitutable criteria."
// ---------------------------------------------------------------------------

export function buildStressTestAttemptSystemPrompt(): string {
  return `You are a highly capable AI assistant. You have been handed a university assignment brief exactly as a student would receive it. Your job is to produce the single best submission you can, using no further guidance beyond what is written in the brief — do not ask clarifying questions, do not hold back, and do not mention that you are an AI or that this is a test. Write the actual deliverable (the report, code, analysis, proposal, etc.) as completely as you can within a reasonable length for the marks available.

You cannot fabricate things the brief requires be genuinely yours: if it calls for personally collected field data, a real interview, a real staged decision log kept over time, or an in-person oral defence, do not invent fake specifics as if they were real (that would be dishonest); instead produce the strongest version of the submission that is honestly possible for an AI working alone in one sitting, and where a required element is simply impossible for you to supply (e.g. attending a viva), state briefly, in one line at the very end under a heading "Limitations of this AI attempt", what you could not genuinely provide. This is essential — it is exactly what the stress test needs to see.`;
}

export function buildStressTestAttemptUserPrompt(data: GeneratedAssignment): string {
  return `ASSIGNMENT BRIEF

Course: ${data.identification.courseCode} — ${data.identification.courseTitle}
Component: ${data.identification.component} (${data.identification.totalMarks} marks)

Course Outcome: ${data.whatThisAssesses.courseOutcome}
Miller tier: ${data.whatThisAssesses.millerTier}

The task:
${data.taskDescription}

Your context anchor:
${data.contextAnchor}

Stages and checkpoints:
${data.stages.map((s) => `- ${s.name} (due ${s.dueOffset}): submit ${s.artifact}`).join("\n")}

AI use permitted: ${data.aiUse.permitted.join("; ")}
AI use not permitted: ${data.aiUse.notPermitted.join("; ")}

How you will be marked:
${data.markingSummary}

Produce your best complete submission now.`;
}

export function buildStressTestMarkingSystemPrompt(): string {
  return `You are an honest, strict external examiner applying LPU's rubric exactly as written. You will be given a rubric (criteria, weights, and four quality-level descriptors each: Outstanding/Proficient/Developing/Not yet demonstrated) and a submission that was produced entirely by an AI model with no genuine process evidence, no real staged decision log, and no ability to attend an oral defence.

Mark strictly against the literal wording of each descriptor — do not be lenient just because the writing is fluent. For any criterion whose descriptors require something an AI working alone cannot genuinely supply (a real decision log, real staged progression, real defence, real verified primary-source checking, real personal/field experience), score that criterion honestly low (Developing or Not yet demonstrated) unless the submission's own "Limitations" section and content clearly earn a higher level on the actual wording of the descriptor. Use exactly the criterion names you were given, one score per criterion, no more and no fewer.`;
}

export function buildStressTestMarkingUserPrompt(
  data: GeneratedAssignment,
  submission: string,
): string {
  const rubricText = data.rubric
    .map(
      (c) => `Criterion: ${c.name} (${c.family}, weight ${c.weightPercent}%)
  Outstanding: ${c.levels.outstanding}
  Proficient: ${c.levels.proficient}
  Developing: ${c.levels.developing}
  Not yet demonstrated: ${c.levels.notYetDemonstrated}`,
    )
    .join("\n\n");

  return `RUBRIC

${rubricText}

SUBMISSION TO MARK (produced by an AI model, no further guidance)

${submission}

Score every criterion listed above by name, then give 2-4 concrete recommendations for the faculty member per D.1 step 6: strengthen the context anchor, the staged evidence, the decision log, or the defence — whichever would most reduce the criteria this AI attempt satisfied.`;
}

// D.1 "Interpreting the result" — fixed wording from the guideline, keyed by
// overall band, so the app never has to trust a model to phrase this itself.
export const STRESS_TEST_INTERPRETATION: Record<QualityLevel, string> = {
  Outstanding:
    "The model scored at Outstanding: this task, as written, measures nothing about the student. Redesign it — do not merely add a warning.",
  Proficient:
    "The model scored at Proficient: this is typical for an unmodified traditional task. Strengthen the context anchor and the staged evidence; a well-anchored revision should push the score down to Developing.",
  Developing:
    "The model scored at Developing: this is acceptable for most Level 2-3 tasks. The remaining marks depend on the student.",
  "Not yet demonstrated":
    "The model scored at Not yet demonstrated: the task is well anchored against AI substitution — but double-check that it is still achievable by a student in the time allowed. A task no model can attempt is sometimes a task no student can either.",
};

// C.3's four quality bands, using each band's midpoint as its representative score.
const LEVEL_MIDPOINT: Record<QualityLevel, number> = {
  Outstanding: 93,
  Proficient: 75.5,
  Developing: 53,
  "Not yet demonstrated": 20,
};

export function scoreToLevel(percent: number): QualityLevel {
  if (percent >= 86) return "Outstanding";
  if (percent >= 66) return "Proficient";
  if (percent >= 41) return "Developing";
  return "Not yet demonstrated";
}

// Deterministically rolls up per-criterion levels into one overall band,
// weighted by each criterion's own weightPercent from the generated rubric —
// rather than asking the model to self-report an overall score.
export function computeOverallStressTestScore(
  rubric: GeneratedAssignment["rubric"],
  criterionScores: { criterionName: string; level: QualityLevel }[],
): { overallScorePercent: number; overallLevel: QualityLevel } {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const rubricCriterion of rubric) {
    const scored = criterionScores.find(
      (s) => s.criterionName.trim().toLowerCase() === rubricCriterion.name.trim().toLowerCase(),
    );
    // A criterion the marking model failed to score is treated conservatively
    // (Not yet demonstrated) rather than silently dropped from the average.
    const level = scored?.level ?? "Not yet demonstrated";
    weightedSum += LEVEL_MIDPOINT[level] * rubricCriterion.weightPercent;
    totalWeight += rubricCriterion.weightPercent;
  }
  const overallScorePercent = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  return { overallScorePercent, overallLevel: scoreToLevel(overallScorePercent) };
}
