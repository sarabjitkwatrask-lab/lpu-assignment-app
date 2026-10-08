import type { GeneratedAssignment } from "@/lib/schema";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-raised p-5">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-soft">
        {title}
      </h3>
      <div className="text-sm leading-relaxed text-ink">{children}</div>
    </section>
  );
}

export default function AssignmentResult({ data }: { data: GeneratedAssignment }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Assignment Brief</h2>
        <p className="text-sm text-ink-soft">
          {data.identification.courseCode} â€” {data.identification.courseTitle}
        </p>
      </div>

      <Section title="1. Identification">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <dt className="text-ink-faint">Component</dt>
            <dd>{data.identification.component}</dd>
          </div>
          <div>
            <dt className="text-ink-faint">Marks</dt>
            <dd>{data.identification.totalMarks}</dd>
          </div>
        </dl>
      </Section>

      <Section title="2. What this task assesses">
        <p>
          <strong>Course Outcome:</strong> {data.whatThisAssesses.courseOutcome}
        </p>
        <p className="mt-1">
          <strong>Protected KSAs:</strong> {data.whatThisAssesses.protectedKSAs.join(", ")}
        </p>
        <p className="mt-1">
          <strong>Miller tier:</strong> {data.whatThisAssesses.millerTier}
        </p>
      </Section>

      <Section title="3. Design declaration">
        <p>
          <strong>Lane:</strong> {data.designDeclaration.lane}
        </p>
        <p className="mt-1">
          <strong>AI Role Level:</strong> {data.designDeclaration.aiRoleLevel}
        </p>
        <p className="mt-1">
          <strong>Oral verification:</strong> {data.designDeclaration.oralVerification}
        </p>
      </Section>

      <Section title="4. The task">
        <p className="whitespace-pre-line">{data.taskDescription}</p>
      </Section>

      <Section title="5. Your context anchor">
        <p className="whitespace-pre-line">{data.contextAnchor}</p>
      </Section>

      <Section title="6. Stages and checkpoints">
        <ol className="list-decimal space-y-2 pl-5">
          {data.stages.map((s, i) => (
            <li key={i}>
              <strong>{s.name}</strong> â€” due {s.dueOffset} â€” submit: {s.artifact} â€” marks: {s.marks}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="7. AI use in this task">
        <p className="font-medium text-good">Permitted</p>
        <ul className="list-disc pl-5">
          {data.aiUse.permitted.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
        <p className="mt-2 font-medium text-bad">Not permitted</p>
        <ul className="list-disc pl-5">
          {data.aiUse.notPermitted.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
        <p className="mt-2">
          <strong>Why:</strong> {data.aiUse.why}
        </p>
        <p className="mt-1">
          <strong>Disclosure statement required:</strong>{" "}
          {data.aiUse.disclosureRequired ? "Yes" : "No"}
        </p>
        <p className="mt-1">
          <strong>Approved tools:</strong> {data.aiUse.approvedTools.join(", ")}
        </p>
      </Section>

      <Section title="8. How you will be marked">
        <p className="whitespace-pre-line">{data.markingSummary}</p>
      </Section>

      <Section title="9. Submission">
        <p>
          <strong>Format:</strong> {data.submission.format}
        </p>
        <p className="mt-1">
          <strong>Late policy:</strong> {data.submission.latePolicy}
        </p>
        <p className="mt-1">
          <strong>Resubmission:</strong> {data.submission.resubmission}
        </p>
      </Section>

      <Section title="10. Support">
        <p>{data.support}</p>
      </Section>

      <div>
        <h2 className="text-xl font-bold text-ink">Grading Rubric</h2>
        <p className="text-sm text-ink-soft">
          Four quality levels throughout: Outstanding (86-100%) Â· Proficient (66-85%) Â·
          Developing (41-65%) Â· Not yet demonstrated (0-40%)
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-raised">
        <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
          <thead>
            <tr className="bg-paper text-left">
              <th className="w-1/5 p-3">Criterion</th>
              <th className="p-3">Outstanding</th>
              <th className="p-3">Proficient</th>
              <th className="p-3">Developing</th>
              <th className="p-3">Not yet demonstrated</th>
            </tr>
          </thead>
          <tbody>
            {data.rubric.map((c, i) => (
              <tr key={i} className="border-t border-line align-top">
                <td className="p-3">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-ink-soft">{c.family}</div>
                  <div className="text-xs text-ink-soft">{c.weightPercent}%</div>
                </td>
                <td className="p-3">{c.levels.outstanding}</td>
                <td className="p-3">{c.levels.proficient}</td>
                <td className="p-3">{c.levels.developing}</td>
                <td className="p-3">{c.levels.notYetDemonstrated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.designerNotes?.length > 0 && (
        <Section title="Designer notes">
          <ul className="list-disc space-y-1 pl-5">
            {data.designerNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
