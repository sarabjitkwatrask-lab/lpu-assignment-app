import type { ReactNode } from "react";

export function operatorName() {
  return process.env.NEXT_PUBLIC_OPERATOR_NAME || "the LPU Assignment & Rubric Designer pilot team";
}

export function ContactLine() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return email ? (
    <a href={`mailto:${email}`} className="font-semibold text-accent underline-offset-2 hover:underline">
      {email}
    </a>
  ) : (
    <span>the person who invited you to this pilot</span>
  );
}

export function LegalPage({
  title,
  version,
  children,
}: {
  title: string;
  version: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-14">
      <p className="rounded-lg bg-ok-soft px-4 py-2.5 text-sm text-ok">
        Pilot version: this text is under review and will be updated before any paid launch.
      </p>
      <h1 className="mt-6 text-4xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-ink-faint">{version}</p>
      <div className="mt-8 space-y-8 text-[15px] leading-relaxed">{children}</div>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold text-ink">{title}</h2>
      <div className="space-y-3 text-ink-soft">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}
