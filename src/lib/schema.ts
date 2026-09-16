import { z } from "zod";

export const RubricLevelsSchema = z.object({
  outstanding: z.string().describe("The 86-100% descriptor for this criterion."),
  proficient: z.string().describe("The 66-85% descriptor for this criterion."),
  developing: z.string().describe("The 41-65% descriptor for this criterion."),
  notYetDemonstrated: z.string().describe("The 0-40% descriptor for this criterion."),
});

export const RubricCriterionSchema = z.object({
  name: z.string(),
  family: z.enum([
    "Disciplinary substance",
    "Process and provenance",
    "Evaluative judgement",
    "Contextual grounding",
    "Communication and defence",
  ]),
  weightPercent: z.number(),
  levels: RubricLevelsSchema,
});

export const AssignmentStageSchema = z.object({
  name: z.string(),
  dueOffset: z.string().describe("e.g. 'Week 2', or a placeholder like '[10 days after issue]'"),
  artifact: z.string().describe("What the student submits at this stage."),
  marks: z.string().describe("e.g. '10', or 'ungraded checkpoint'"),
});

export const GeneratedAssignmentSchema = z.object({
  identification: z.object({
    courseCode: z.string(),
    courseTitle: z.string(),
    component: z.string(),
    totalMarks: z.string(),
  }),
  whatThisAssesses: z.object({
    courseOutcome: z.string(),
    protectedKSAs: z.array(z.string()),
    millerTier: z.string(),
  }),
  designDeclaration: z.object({
    lane: z.string(),
    aiRoleLevel: z.string(),
    oralVerification: z.string(),
  }),
  taskDescription: z
    .string()
    .describe("Plain imperative sentences: what the student must do, deliverable, audience, format, length/scope."),
  contextAnchor: z
    .string()
    .describe("The specific site/dataset/client/case/personal-experience anchor and how the student obtains it."),
  stages: z.array(AssignmentStageSchema),
  aiUse: z.object({
    permitted: z.array(z.string()),
    notPermitted: z.array(z.string()),
    why: z.string(),
    disclosureRequired: z.boolean(),
    approvedTools: z.array(z.string()),
  }),
  markingSummary: z
    .string()
    .describe("One line per rubric criterion stating its weight, for the brief's 'How you will be marked' field."),
  submission: z.object({
    format: z.string(),
    latePolicy: z.string(),
    resubmission: z.string(),
  }),
  support: z.string(),
  rubric: z.array(RubricCriterionSchema),
  designerNotes: z.array(z.string()),
});

export type GeneratedAssignment = z.infer<typeof GeneratedAssignmentSchema>;

export const GenerateInputSchema = z.object({
  courseCode: z.string().max(50).default(""),
  courseTitle: z.string().min(1).max(200),
  discipline: z.string().min(1).max(100),
  topic: z.string().min(1).max(500),
  courseOutcome: z.string().min(1).max(500),
  protectedKSAs: z.string().max(500).default(""),
  totalMarks: z.string().max(20).default(""),
  lane: z.enum(["A", "B"]),
  aiRoleLevel: z.enum(["L1", "L2", "L3", "L4", "L5"]),
  millerTier: z.string().min(1),
  contextAnchor: z.string().max(1000).default(""),
  oralVerification: z.string().min(1),
  dueDate: z.string().max(100).default(""),
});

export type GenerateInput = z.infer<typeof GenerateInputSchema>;
