import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import { getAssignment } from "@/lib/db";

export const maxDuration = 30;

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });
}

function body(text: string) {
  return new Paragraph({ children: [new TextRun(text)], spacing: { after: 120 } });
}

function bulletList(items: string[]) {
  return items.map(
    (i) =>
      new Paragraph({
        text: i,
        bullet: { level: 0 },
        spacing: { after: 60 },
      }),
  );
}

function cell(text: string, opts?: { header?: boolean }) {
  return new TableCell({
    width: { size: 20, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: opts?.header })],
      }),
    ],
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const row = await getAssignment(supabase, id);
  if (!row) {
    return new Response("Not found", { status: 404 });
  }

  const data = row.data;

  const rubricRows = [
    new TableRow({
      children: [
        cell("Criterion", { header: true }),
        cell("Outstanding", { header: true }),
        cell("Proficient", { header: true }),
        cell("Developing", { header: true }),
        cell("Not yet demonstrated", { header: true }),
      ],
      tableHeader: true,
    }),
    ...data.rubric.map(
      (c) =>
        new TableRow({
          children: [
            cell(`${c.name} (${c.weightPercent}%)\n${c.family}`),
            cell(c.levels.outstanding),
            cell(c.levels.proficient),
            cell(c.levels.developing),
            cell(c.levels.notYetDemonstrated),
          ],
        }),
    ),
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "LPU Assignment Brief",
            heading: HeadingLevel.TITLE,
          }),
          body(`${data.identification.courseCode} — ${data.identification.courseTitle}`),

          heading("1. Identification", HeadingLevel.HEADING_2),
          body(
            `Component: ${data.identification.component}    Marks: ${data.identification.totalMarks}`,
          ),

          heading("2. What This Task Assesses", HeadingLevel.HEADING_2),
          body(`Course Outcome: ${data.whatThisAssesses.courseOutcome}`),
          body(`Protected KSAs: ${data.whatThisAssesses.protectedKSAs.join(", ")}`),
          body(`Miller tier: ${data.whatThisAssesses.millerTier}`),

          heading("3. Design Declaration", HeadingLevel.HEADING_2),
          body(`Lane: ${data.designDeclaration.lane}`),
          body(`AI Role Level: ${data.designDeclaration.aiRoleLevel}`),
          body(`Oral verification: ${data.designDeclaration.oralVerification}`),

          heading("4. The Task", HeadingLevel.HEADING_2),
          body(data.taskDescription),

          heading("5. Your Context Anchor", HeadingLevel.HEADING_2),
          body(data.contextAnchor),

          heading("6. Stages and Checkpoints", HeadingLevel.HEADING_2),
          ...bulletList(
            data.stages.map(
              (s) => `${s.name} — due ${s.dueOffset} — submit: ${s.artifact} — marks: ${s.marks}`,
            ),
          ),

          heading("7. AI Use in This Task", HeadingLevel.HEADING_2),
          body("Permitted:"),
          ...bulletList(data.aiUse.permitted),
          body("Not permitted:"),
          ...bulletList(data.aiUse.notPermitted),
          body(`Why: ${data.aiUse.why}`),
          body(
            `Disclosure statement required: ${data.aiUse.disclosureRequired ? "Yes" : "No"}`,
          ),
          body(`Approved tools: ${data.aiUse.approvedTools.join(", ")}`),

          heading("8. How You Will Be Marked", HeadingLevel.HEADING_2),
          body(data.markingSummary),

          heading("9. Submission", HeadingLevel.HEADING_2),
          body(`Format: ${data.submission.format}`),
          body(`Late policy: ${data.submission.latePolicy}`),
          body(`Resubmission: ${data.submission.resubmission}`),

          heading("10. Support", HeadingLevel.HEADING_2),
          body(data.support),

          new Paragraph({
            text: "Grading Rubric",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 480, after: 120 },
          }),
          body(
            "Outstanding (86-100%) · Proficient (66-85%) · Developing (41-65%) · Not yet demonstrated (0-40%)",
          ),
          new Table({
            rows: rubricRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            },
          }),

          ...(data.designerNotes?.length
            ? [
                heading("Designer Notes", HeadingLevel.HEADING_2),
                ...bulletList(data.designerNotes),
              ]
            : []),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `${data.identification.courseCode || "assignment"}-brief-rubric.docx`.replace(
    /[^a-zA-Z0-9.\-]/g,
    "_",
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
